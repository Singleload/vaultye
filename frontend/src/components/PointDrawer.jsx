import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertTriangle, CheckCircle, TrendingUp, DollarSign, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import clsx from 'clsx';

// Update API call
const updatePointApi = async ({ id, data }) => {
  const res = await axios.patch(`http://localhost:3000/api/points/${id}`, data);
  return res.data;
};

export default function PointDrawer({ point, isOpen, onClose }) {
  const queryClient = useQueryClient();
  
  // Lokalt state för formuläret
  const [formData, setFormData] = useState({});

  // Fyll formuläret när en ny point öppnas
  useEffect(() => {
    if (point) {
      setFormData({
        status: point.status || 'NEW',
        relevance: point.relevance || 0,
        feasibility: point.feasibility || 'MEDIUM',
        benefit: point.benefit || '',
        risk: point.risk || '',
        costEstimate: point.costEstimate || '',
        managerComment: point.managerComment || ''
      });
    }
  }, [point]);

  const mutation = useMutation({
    mutationFn: updatePointApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['system']); // Uppdatera listan i bakgrunden
      onClose();
    }
  });

  const handleSave = () => {
    mutation.mutate({ id: point.id, data: formData });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AnimatePresence>
      {isOpen && point && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {point.origin} • {new Date(point.createdAt).toLocaleDateString()}
                </span>
                <h2 className="text-2xl font-bold text-slate-800 mt-1">{point.title}</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Original Description */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="text-sm font-bold text-slate-700 mb-2">Ursprunglig beskrivning</h4>
                <p className="text-slate-600 leading-relaxed text-sm">
                  {point.description}
                </p>
              </div>

              {/* Assessment Section */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="text-indigo-600" size={20} />
                  Förvaltarens Analys
                </h3>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Relevans (1-5)</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          onClick={() => handleChange('relevance', score)}
                          className={clsx(
                            "w-10 h-10 rounded-lg font-bold transition-all",
                            formData.relevance === score 
                              ? "bg-indigo-600 text-white shadow-md scale-105" 
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          )}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Genomförbarhet</label>
                    <select 
                      value={formData.feasibility}
                      onChange={(e) => handleChange('feasibility', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                      <option value="EASY">Enkel (Låg insats)</option>
                      <option value="MEDIUM">Medium (Kräver utredning)</option>
                      <option value="HARD">Svår (Projektform)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Förväntad Nytta</label>
                    <textarea 
                      rows="2"
                      value={formData.benefit}
                      onChange={(e) => handleChange('benefit', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      placeholder="Vad tjänar verksamheten på detta?"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Risker</label>
                      <div className="relative">
                        <AlertTriangle size={16} className="absolute left-3 top-3 text-amber-500" />
                        <input 
                          value={formData.risk}
                          onChange={(e) => handleChange('risk', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                          placeholder="Finns det risker?"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Kostnadsuppskattning</label>
                      <div className="relative">
                        <DollarSign size={16} className="absolute left-3 top-3 text-slate-400" />
                        <input 
                          value={formData.costEstimate}
                          onChange={(e) => handleChange('costEstimate', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="t.ex. 20 timmar"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Section */}
              <div className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Rekommendation</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Sätt status</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['NEW', 'ASSESSED', 'RECOMMENDED', 'REJECTED'].map((status) => (
                        <button
                          key={status}
                          onClick={() => handleChange('status', status)}
                          className={clsx(
                            "py-2 px-3 rounded-lg text-sm font-medium border transition-all",
                            formData.status === status
                              ? "bg-white border-indigo-500 text-indigo-700 shadow-sm ring-1 ring-indigo-500"
                              : "bg-white/50 border-transparent text-slate-600 hover:bg-white"
                          )}
                        >
                          {status === 'NEW' ? 'Ny' : 
                           status === 'ASSESSED' ? 'Bedömd' : 
                           status === 'RECOMMENDED' ? 'Rekommendera' : 'Avfärda'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Dina kommentarer (Interna)</label>
                    <textarea 
                      rows="2"
                      value={formData.managerComment}
                      onChange={(e) => handleChange('managerComment', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Noteringar till dig själv eller systemägaren..."
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center">
              <span className="text-sm text-slate-500">
                {formData.status !== point.status ? "Osparade ändringar" : "Allt sparat"}
              </span>
              <div className="flex gap-3">
                <button onClick={onClose} className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors">
                  Avbryt
                </button>
                <button 
                  onClick={handleSave}
                  disabled={mutation.isPending}
                  className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-70"
                >
                  {mutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Spara Analys
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}