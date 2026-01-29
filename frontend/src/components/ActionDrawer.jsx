import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Save, CheckSquare, Loader2, UploadCloud, Calendar, 
  User, AlignLeft, FileText, CheckCircle2, Link2, 
  ChevronDown, ChevronUp, AlertTriangle, TrendingUp, DollarSign 
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import clsx from 'clsx';
import FeedbackModal from './FeedbackModal';

// --- API ---

const updateActionApi = async ({ id, data }) => {
  const res = await axios.patch(`http://localhost:3000/api/actions/${id}`, data);
  return res.data;
};

const exportActionToEasitApi = async (payload) => {
  const res = await axios.post('http://localhost:3000/api/easit/export', payload);
  return res.data;
};

export default function ActionDrawer({ action, systemName, managerUsername, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({});
  const [isPointDetailsOpen, setIsPointDetailsOpen] = useState(false);
  
  // Feedback state för Easit-exporten
  const [feedback, setFeedback] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    details: ''
  });

  // Synka state vid öppning
  useEffect(() => {
    if (action) {
      setFormData({
        title: action.title,
        description: action.description || '',
        notes: action.notes || '',
        status: action.status,
        assignedTo: action.assignedTo || '',
        dueDate: action.dueDate ? action.dueDate.split('T')[0] : '', // Format YYYY-MM-DD
        startDate: action.startDate ? action.startDate.split('T')[0] : ''
      });
      setIsPointDetailsOpen(false); // Stäng detaljerna varje gång en ny öppnas
    }
  }, [action]);

  // --- Mutations ---

  const mutation = useMutation({
    mutationFn: updateActionApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['system']);
      // Vi stänger inte automatiskt här, användaren kanske vill jobba vidare
    }
  });

  const easitMutation = useMutation({
    mutationFn: exportActionToEasitApi,
    onSuccess: (data) => {
      setFeedback({
        isOpen: true,
        type: 'success',
        title: 'Export lyckades',
        message: 'Åtgärden har skickats till Easit.',
        details: `Fil sparad: ${data.path}`
      });
    },
    onError: (error) => {
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Export misslyckades',
        message: 'Kunde inte skapa CSV-filen.',
        details: error.message
      });
    }
  });

  // --- Handlers ---

  const handleSave = () => {
    mutation.mutate({ id: action.id, data: formData });
    onClose(); 
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSendToEasit = () => {
    const payload = {
      externalId: action.id, 
      system: systemName, 
      requester: managerUsername || "Okänd Förvaltare", 
      dueDate: formData.dueDate,
      title: formData.title,
      description: `Beskrivning: ${formData.description}\n\nAnteckningar: ${formData.notes}`,
      originalPointId: action.pointId
    };
    easitMutation.mutate(payload);
  };

  const isDone = formData.status === 'DONE';

  return (
    <>
      <AnimatePresence>
        {isOpen && action && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={onClose} 
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" 
            />
            
            {/* Drawer Panel */}
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
              className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col border-l border-white/50"
            >
              
              {/* Header */}
              <div className="p-8 pb-4 border-b border-slate-100 flex justify-between items-start bg-white z-10">
                <div className="flex-1 mr-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-md border border-slate-100 flex items-center gap-1">
                      <CheckSquare size={12}/> Åtgärd
                    </span>
                    {isDone && (
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 flex items-center gap-1">
                        <CheckCircle2 size={12}/> Klar
                      </span>
                    )}
                  </div>
                  
                  {/* Editable Title */}
                  <input 
                    value={formData.title || ''} 
                    onChange={(e) => handleChange('title', e.target.value)} 
                    className="text-3xl font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0 w-full placeholder:text-slate-300 leading-tight" 
                    placeholder="Rubrik..." 
                  />
                </div>
                <button 
                  onClick={onClose} 
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50">
                
                {/* --- ORIGIN POINT LINK (EXPANDABLE) --- */}
                {action.point && (
                  <div className="bg-blue-50/50 rounded-2xl border border-blue-100 overflow-hidden transition-all">
                    <button 
                      onClick={() => setIsPointDetailsOpen(!isPointDetailsOpen)}
                      className="w-full p-4 flex items-start gap-3 text-left hover:bg-blue-50 transition-colors outline-none"
                    >
                      <div className="mt-0.5 p-1.5 bg-blue-100 text-blue-600 rounded-lg shadow-sm">
                        <Link2 size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-0.5">
                          Baserad på behov
                        </p>
                        <p className="text-slate-700 font-medium text-sm leading-snug">
                          {action.point.title}
                        </p>
                      </div>
                      <div className="text-blue-400 mt-1">
                        {isPointDetailsOpen ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isPointDetailsOpen && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }} 
                          exit={{ height: 0, opacity: 0 }}
                          className="px-4 pb-4 text-sm text-slate-600 space-y-4 border-t border-blue-100/50 pt-4"
                        >
                           <div>
                             <span className="font-bold text-xs uppercase text-blue-800 block mb-1 flex items-center gap-1">
                               <TrendingUp size={12}/> Beskrivning
                             </span>
                             <p className="leading-relaxed bg-white/50 p-3 rounded-xl border border-blue-100/50">
                               {action.point.description || "Ingen beskrivning."}
                             </p>
                           </div>
                           
                           <div className="grid grid-cols-2 gap-4">
                             <div>
                               <span className="font-bold text-xs uppercase text-emerald-700 block mb-1 flex items-center gap-1">
                                 <CheckCircle2 size={12}/> Nytta
                               </span>
                               <p className="bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50 text-emerald-900 text-xs">
                                 {action.point.benefit || "-"}
                               </p>
                             </div>
                             <div>
                               <span className="font-bold text-xs uppercase text-amber-700 block mb-1 flex items-center gap-1">
                                 <AlertTriangle size={12}/> Risk
                               </span>
                               <p className="bg-amber-50/50 p-2 rounded-lg border border-amber-100/50 text-amber-900 text-xs">
                                 {action.point.risk || "-"}
                               </p>
                             </div>
                           </div>

                           <div>
                             <span className="font-bold text-xs uppercase text-slate-500 block mb-1 flex items-center gap-1">
                               <DollarSign size={12}/> Kostnad
                             </span>
                             <p className="font-bold text-slate-800">
                               {action.point.costEstimate || "Ej angivet"}
                             </p>
                           </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Status Card */}
                <div className={clsx(
                  "p-6 rounded-[1.5rem] border shadow-sm flex items-center justify-between transition-all",
                  isDone ? "bg-emerald-50/50 border-emerald-100" : "bg-white border-slate-100"
                )}>
                  <div>
                    <h3 className={clsx("font-bold text-lg", isDone ? "text-emerald-900" : "text-slate-800")}>Status</h3>
                    <p className={clsx("text-sm", isDone ? "text-emerald-700" : "text-slate-500")}>
                      {isDone ? "Åtgärden är markerad som genomförd." : "Arbete pågår eller väntar på start."}
                    </p>
                  </div>
                  <button
                    onClick={() => handleChange('status', isDone ? 'PENDING' : 'DONE')}
                    className={clsx(
                      "px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 active:scale-95",
                      isDone 
                        ? "bg-white text-emerald-600 border border-emerald-200 hover:border-emerald-300 shadow-sm" 
                        : "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200"
                    )}
                  >
                    {isDone ? 'Öppna igen' : 'Markera som klar'}
                  </button>
                </div>

                {/* Details Form */}
                <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-6">
                  
                  {/* People & Dates */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-2">
                        <User size={14}/> Ansvarig
                      </label>
                      <input 
                        value={formData.assignedTo || ''} 
                        onChange={(e) => handleChange('assignedTo', e.target.value)} 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700" 
                        placeholder="Vem gör jobbet?"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-2">
                        <Calendar size={14}/> Startdatum
                      </label>
                      <input 
                        type="date"
                        value={formData.startDate || ''} 
                        onChange={(e) => handleChange('startDate', e.target.value)} 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700" 
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-2">
                        <Calendar size={14}/> Deadline
                      </label>
                      <input 
                        type="date"
                        value={formData.dueDate || ''} 
                        onChange={(e) => handleChange('dueDate', e.target.value)} 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700" 
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-2">
                      <AlignLeft size={14}/> Beskrivning
                    </label>
                    <textarea 
                      rows="4" 
                      value={formData.description || ''} 
                      onChange={(e) => handleChange('description', e.target.value)} 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700 leading-relaxed resize-none" 
                      placeholder="Vad ska göras?"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-2">
                      <FileText size={14}/> Egna Anteckningar
                    </label>
                    <textarea 
                      rows="3" 
                      value={formData.notes || ''} 
                      onChange={(e) => handleChange('notes', e.target.value)} 
                      className="w-full p-4 bg-amber-50/50 border border-amber-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-200 outline-none transition-all font-medium text-slate-700 leading-relaxed resize-none" 
                      placeholder="Interna noteringar..."
                    />
                  </div>

                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-slate-100 bg-white z-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] flex justify-between items-center gap-4">
                 
                 <button 
                   onClick={onClose} 
                   className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                 >
                   Avbryt
                 </button>

                 <div className="flex gap-3">
                   {/* Easit Button - Endast om Klar */}
                   {isDone && (
                     <button 
                       onClick={handleSendToEasit} 
                       disabled={easitMutation.isPending}
                       className="px-5 py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-2 border border-indigo-100 disabled:opacity-50"
                     >
                       {easitMutation.isPending ? <Loader2 className="animate-spin" size={18}/> : <UploadCloud size={18}/>}
                       <span className="hidden sm:inline">Skicka till Easit</span>
                     </button>
                   )}

                   <button 
                     onClick={handleSave} 
                     disabled={mutation.isPending} 
                     className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-70"
                   >
                     {mutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} 
                     Spara
                   </button>
                 </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      <FeedbackModal 
        isOpen={feedback.isOpen} 
        onClose={() => setFeedback({ ...feedback, isOpen: false })} 
        type={feedback.type} 
        title={feedback.title} 
        message={feedback.message} 
        details={feedback.details} 
      />
    </>
  );
}