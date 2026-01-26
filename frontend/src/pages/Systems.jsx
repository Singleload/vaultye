// src/pages/Systems.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Server, Users, Calendar, Plus, MoreVertical, ShieldCheck, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// API-anropen (kan flyttas till egen fil senare)
const fetchSystems = async () => {
  const res = await axios.get('http://localhost:3000/api/systems');
  return res.data;
};

const createSystem = async (newSystem) => {
  const res = await axios.post('http://localhost:3000/api/systems', newSystem);
  return res.data;
};

const StatusBadge = ({ status }) => {
  const styles = {
    ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
    MAINTENANCE: "bg-amber-100 text-amber-700 border-amber-200",
    RETIRED: "bg-slate-100 text-slate-600 border-slate-200"
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.ACTIVE}`}>
      {status === 'ACTIVE' ? 'Aktiv' : status}
    </span>
  );
};

export default function Systems() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Hämta data med React Query
  const { data: systems, isLoading, isError } = useQuery({
    queryKey: ['systems'],
    queryFn: fetchSystems
  });

  // 2. Mutation för att skapa nytt system
  const createMutation = useMutation({
    mutationFn: createSystem,
    onSuccess: () => {
      queryClient.invalidateQueries(['systems']); // Ladda om listan automatiskt
      setIsModalOpen(false); // Stäng modalen
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

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (isError) return <div className="p-10 text-red-500">Kunde inte nå servern. Är backend igång?</div>;

  return (
    <div className="space-y-8 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mina System</h1>
          <p className="text-slate-500 mt-1">Hantera dina förvaltningsobjekt och deras livscykel.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-200 active:scale-95"
        >
          <Plus size={20} />
          <span>Registrera System</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {systems.length === 0 && (
          <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <Server className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500">Inga system registrerade än. Klicka på knappen för att lägga till ditt första!</p>
          </div>
        )}

        {systems.map((system, index) => (
          <motion.div
            key={system.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4 }}
            onClick={() => navigate(`/systems/${system.id}`)}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 cursor-pointer group hover:border-indigo-100 hover:shadow-md transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50 to-white rounded-bl-full -mr-6 -mt-6 opacity-50 group-hover:scale-110 transition-transform"></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Server size={24} />
              </div>
              <button className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-2">{system.name}</h3>
            <p className="text-slate-500 text-sm mb-6 line-clamp-2 h-10">{system.description || "Ingen beskrivning"}</p>

            <div className="space-y-3 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <ShieldCheck size={16} className="text-slate-400" />
                <span>Ägare: <span className="font-medium text-slate-800">{system.ownerName}</span></span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                 {/* Exempeldata tills vi har riktiga möten */}
                <Calendar size={16} className="text-slate-400" />
                <span>Uppdaterad: {new Date(system.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <StatusBadge status={system.status} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* CREATE SYSTEM MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-800">Nytt System</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Systemnamn</label>
                  <input required name="name" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="t.ex. HR-Portalen" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Beskrivning</label>
                  <textarea name="description" rows="3" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Vad gör systemet?" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Systemägare (Namn)</label>
                    <input required name="ownerName" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Anna Andersson" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ägarens Email</label>
                    <input required name="ownerEmail" type="email" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="anna@företag.se" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Resursgrupp</label>
                  <input name="resourceGroup" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="t.ex. Team Ekonomi" />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Avbryt</button>
                  <button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-70 flex items-center gap-2"
                  >
                    {createMutation.isPending && <Loader2 className="animate-spin" size={16} />}
                    Skapa System
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}