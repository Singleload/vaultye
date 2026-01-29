import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Server, Plus, MoreVertical, ShieldCheck, Calendar, Trash2, Archive, X, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// --- API ---
const fetchSystems = async (showArchived) => {
  const res = await axios.get(`http://localhost:3000/api/systems?showArchived=${showArchived}`);
  return res.data;
};

const createSystem = async (newSystem) => {
  const res = await axios.post('http://localhost:3000/api/systems', newSystem);
  return res.data;
};

const archiveSystemApi = async ({ id, isArchived }) => {
  await axios.patch(`http://localhost:3000/api/systems/${id}/archive`, { isArchived });
};

const deleteSystemApi = async (id) => {
  await axios.delete(`http://localhost:3000/api/systems/${id}`);
};

// --- COMPONENTS ---

// Dropdown Menu Component
const SystemMenu = ({ system, onArchive, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Stäng menyn om man klickar utanför
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative z-20" ref={menuRef}>
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition-colors"
      >
        <MoreVertical size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 0 }} 
            animate={{ opacity: 1, scale: 1, y: 5 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute right-0 top-full w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => { onArchive(); setIsOpen(false); }}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-600"
            >
              {system.isArchived ? <Eye size={16}/> : <EyeOff size={16}/>}
              {system.isArchived ? 'Återställ' : 'Dölj / Arkivera'}
            </button>
            <button 
              onClick={() => { onDelete(); setIsOpen(false); }}
              className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center gap-2 text-sm text-red-600 border-t border-slate-50"
            >
              <Trash2 size={16}/> Radera permanent
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmModal = ({ system, isOpen, onClose, onConfirm }) => {
  const [inputName, setInputName] = useState('');
  
  if (!isOpen) return null;

  const isMatch = inputName === system.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <div className="bg-red-100 p-2 rounded-full"><AlertTriangle size={24}/></div>
          <h2 className="text-xl font-bold">Radera System?</h2>
        </div>
        
        <p className="text-slate-600 mb-4 text-sm leading-relaxed">
          Detta kommer att radera <strong>{system.name}</strong> och <span className="font-bold text-red-600">all tillhörande data</span> (möten, punkter, uppgraderingar, historik). 
          <br/><br/>
          Detta går inte att ångra.
        </p>

        <label className="block text-sm font-bold text-slate-700 mb-2">
          Skriv systemets namn för att bekräfta:
        </label>
        <input 
          autoFocus
          className="w-full p-3 border border-slate-300 rounded-lg mb-6 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 placeholder:text-slate-300"
          placeholder={system.name}
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
        />

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Avbryt</button>
          <button 
            disabled={!isMatch}
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Jag förstår, radera allt
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function Systems() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // State för radering
  const [systemToDelete, setSystemToDelete] = useState(null);
  
  // State för filter
  const [showArchived, setShowArchived] = useState(false);

  const { data: systems, isLoading } = useQuery({
    queryKey: ['systems', showArchived],
    queryFn: () => fetchSystems(showArchived)
  });

  const createMutation = useMutation({
    mutationFn: createSystem,
    onSuccess: () => {
      queryClient.invalidateQueries(['systems']);
      setIsCreateModalOpen(false);
    }
  });

  const archiveMutation = useMutation({
    mutationFn: archiveSystemApi,
    onSuccess: () => queryClient.invalidateQueries(['systems'])
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSystemApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['systems']);
      setSystemToDelete(null);
    }
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    createMutation.mutate({
      name: formData.get('name'),
      description: formData.get('description'),
      ownerName: formData.get('ownerName'),
      ownerEmail: formData.get('ownerEmail'),
      resourceGroup: formData.get('resourceGroup'),
    });
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mina System</h1>
          <p className="text-slate-500 mt-1">Hantera dina förvaltningsobjekt och deras livscykel.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${showArchived ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}
          >
            {showArchived ? <EyeOff size={16} /> : <Eye size={16} />}
            {showArchived ? 'Dölj arkiverade' : 'Visa dolda'}
          </button>

          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-200 active:scale-95"
          >
            <Plus size={20} />
            <span>Registrera System</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {systems?.map((system, index) => (
          <motion.div
            key={system.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white rounded-2xl p-6 shadow-sm border cursor-pointer group hover:shadow-md transition-all relative overflow-visible
              ${system.isArchived ? 'border-slate-200 opacity-60 bg-slate-50' : 'border-slate-100 hover:border-indigo-100'}`}
            onClick={() => navigate(`/systems/${system.id}`)}
          >
            {/* Header with Icon and Menu */}
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={`p-3 rounded-xl ${system.isArchived ? 'bg-slate-200 text-slate-500' : 'bg-indigo-50 text-indigo-600'}`}>
                {system.isArchived ? <Archive size={24}/> : <Server size={24} />}
              </div>
              
              {/* Menu Component */}
              <SystemMenu 
                system={system} 
                onArchive={() => archiveMutation.mutate({ id: system.id, isArchived: !system.isArchived })}
                onDelete={() => setSystemToDelete(system)}
              />
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-2">{system.name}</h3>
            <p className="text-slate-500 text-sm mb-6 line-clamp-2 min-h-[40px]">{system.description || "Ingen beskrivning"}</p>

            <div className="space-y-3 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <ShieldCheck size={16} className="text-slate-400" />
                <span>{system.ownerName}</span>
              </div>
            </div>
            
            {system.isArchived && (
              <div className="mt-4 text-center">
                <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded">ARKIVERAD</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}>
             <motion.div 
               initial={{ scale: 0.95 }} animate={{ scale: 1 }} 
               className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6"
               onClick={e => e.stopPropagation()}
             >
               <h2 className="text-xl font-bold text-slate-800 mb-4">Nytt System</h2>
               <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Systemnamn</label>
                    <input required name="name" className="w-full p-2 border rounded-lg" />
                  </div>
                  {/* ... Resten av fälten som tidigare ... */}
                   <div>
                    <label className="block text-sm font-medium mb-1">Beskrivning</label>
                    <textarea name="description" rows="2" className="w-full p-2 border rounded-lg" />
                  </div>
                   <div className="grid grid-cols-2 gap-4">
                     <input required name="ownerName" placeholder="Systemägarens namn" className="w-full p-2 border rounded-lg" />
                     <input required name="ownerEmail" placeholder="Systemägarens e-post" className="w-full p-2 border rounded-lg" />
                   </div>
                   <input name="resourceGroup" placeholder="Resursgrupp" className="w-full p-2 border rounded-lg" />
                  
                  <div className="flex justify-end gap-3 mt-4">
                    <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-slate-600">Avbryt</button>
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg">Skapa</button>
                  </div>
               </form>
             </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmModal 
        system={systemToDelete} 
        isOpen={!!systemToDelete} 
        onClose={() => setSystemToDelete(null)} 
        onConfirm={() => deleteMutation.mutate(systemToDelete.id)} 
      />

    </div>
  );
}