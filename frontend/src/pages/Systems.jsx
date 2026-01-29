import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Server, Plus, MoreVertical, ShieldCheck, Trash2, Archive, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const fetchSystems = async (showArchived) => (await axios.get(`http://localhost:3000/api/systems?showArchived=${showArchived}`)).data;
const createSystem = async (newSystem) => (await axios.post('http://localhost:3000/api/systems', newSystem)).data;
const archiveSystemApi = async ({ id, isArchived }) => { await axios.patch(`http://localhost:3000/api/systems/${id}/archive`, { isArchived }); };
const deleteSystemApi = async (id) => { await axios.delete(`http://localhost:3000/api/systems/${id}`); };

// --- Components ---
const SystemMenu = ({ system, onArchive, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => { if (menuRef.current && !menuRef.current.contains(event.target)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative z-20" ref={menuRef}>
      <button onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
        <MoreVertical size={20} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => { onArchive(); setIsOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-600 font-medium">
              {system.isArchived ? <Eye size={16}/> : <EyeOff size={16}/>} {system.isArchived ? 'Återställ' : 'Arkivera'}
            </button>
            <button onClick={() => { onDelete(); setIsOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center gap-2 text-sm text-red-600 border-t border-slate-50 font-medium">
              <Trash2 size={16}/> Radera permanent
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DeleteConfirmModal = ({ system, isOpen, onClose, onConfirm }) => {
  const [inputName, setInputName] = useState('');
  if (!isOpen) return null;
  const isMatch = inputName === system.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-4 text-red-600 mb-6 bg-red-50 p-4 rounded-2xl">
          <AlertTriangle size={32}/>
          <h2 className="text-xl font-bold">Radera System?</h2>
        </div>
        <p className="text-slate-600 mb-6 leading-relaxed">
          Detta raderar <strong>{system.name}</strong> och <span className="font-bold text-red-600">all data</span> (möten, punkter, historik). Detta går inte att ångra.
        </p>
        <label className="block text-sm font-bold text-slate-700 mb-2">Skriv systemets namn:</label>
        <input autoFocus className="w-full p-3 border border-slate-200 rounded-xl mb-6 outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-medium" placeholder={system.name} value={inputName} onChange={(e) => setInputName(e.target.value)} />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl">Avbryt</button>
          <button disabled={!isMatch} onClick={onConfirm} className="px-5 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-200">Radera allt</button>
        </div>
      </motion.div>
    </div>
  );
};

export default function Systems() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [systemToDelete, setSystemToDelete] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  const { data: systems } = useQuery({ queryKey: ['systems', showArchived], queryFn: () => fetchSystems(showArchived) });
  const createMutation = useMutation({ mutationFn: createSystem, onSuccess: () => { queryClient.invalidateQueries(['systems']); setIsCreateModalOpen(false); } });
  const archiveMutation = useMutation({ mutationFn: archiveSystemApi, onSuccess: () => queryClient.invalidateQueries(['systems']) });
  const deleteMutation = useMutation({ mutationFn: deleteSystemApi, onSuccess: () => { queryClient.invalidateQueries(['systems']); setSystemToDelete(null); } });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    createMutation.mutate({
      name: fd.get('name'), description: fd.get('description'),
      ownerName: fd.get('ownerName'), ownerEmail: fd.get('ownerEmail'), ownerUsername: fd.get('ownerUsername'),
      managerName: fd.get('managerName'), managerUsername: fd.get('managerUsername'),
      resourceGroup: fd.get('resourceGroup'),
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mina System</h1>
          <p className="text-slate-500 mt-2 text-lg">Hantera dina förvaltningsobjekt.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowArchived(!showArchived)} className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-colors ${showArchived ? 'bg-indigo-50 text-indigo-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {showArchived ? <EyeOff size={18} /> : <Eye size={18} />} {showArchived ? 'Dölj arkiverade' : 'Visa arkiverade'}
          </button>
          <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-200 active:scale-95">
            <Plus size={20} /> <span>Registrera System</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {systems?.map((system, index) => (
          <motion.div
            key={system.id}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
            whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
            className={`bg-white rounded-3xl p-6 shadow-sm border cursor-pointer relative group flex flex-col justify-between h-64
              ${system.isArchived ? 'border-slate-200 opacity-60 bg-slate-50' : 'border-slate-100'}`}
            onClick={() => navigate(`/systems/${system.id}`)}
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3.5 rounded-2xl ${system.isArchived ? 'bg-slate-200 text-slate-500' : 'bg-indigo-50 text-indigo-600'}`}>
                  {system.isArchived ? <Archive size={24}/> : <Server size={24} />}
                </div>
                <SystemMenu system={system} onArchive={() => archiveMutation.mutate({ id: system.id, isArchived: !system.isArchived })} onDelete={() => setSystemToDelete(system)} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2 truncate">{system.name}</h3>
              <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">{system.description || "Ingen beskrivning"}</p>
            </div>
            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600 font-medium bg-slate-50 px-3 py-1.5 rounded-lg">
                <ShieldCheck size={16} className="text-indigo-400" />
                <span className="truncate max-w-[120px]">{system.ownerName}</span>
              </div>
              {system.isArchived && <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded uppercase">Arkiverad</span>}
            </div>
          </motion.div>
        ))}
      </div>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md" onClick={() => setIsCreateModalOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Nytt System</h2>
              <form onSubmit={handleCreateSubmit} className="space-y-5">
                <div><label className="block text-sm font-bold text-slate-700 mb-1.5">Systemnamn</label><input required name="name" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="t.ex. HR-Portalen" /></div>
                <div><label className="block text-sm font-bold text-slate-700 mb-1.5">Beskrivning</label><textarea name="description" rows="2" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Vad gör systemet?" /></div>
                
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase">Systemägare</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <input required name="ownerName" className="w-full p-3 border border-slate-200 rounded-xl text-sm" placeholder="Namn" />
                    <input name="ownerUsername" className="w-full p-3 border border-slate-200 rounded-xl text-sm" placeholder="AD-namn" />
                    <input required name="ownerEmail" className="col-span-2 w-full p-3 border border-slate-200 rounded-xl text-sm" placeholder="Email" />
                  </div>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase">Systemförvaltare (Du)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <input required name="managerName" className="w-full p-3 border border-slate-200 rounded-xl text-sm" placeholder="Namn" />
                    <input required name="managerUsername" className="w-full p-3 border border-slate-200 rounded-xl text-sm" placeholder="AD-namn" />
                  </div>
                </div>
                <div><label className="block text-sm font-bold text-slate-700 mb-1.5">Resursgrupp</label><input name="resourceGroup" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="t.ex. Styrgruppen" /></div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl">Avbryt</button>
                  <button type="submit" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200">Skapa System</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DeleteConfirmModal system={systemToDelete} isOpen={!!systemToDelete} onClose={() => setSystemToDelete(null)} onConfirm={() => deleteMutation.mutate(systemToDelete.id)} />
    </div>
  );
}