import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Save, AlertTriangle, CheckCircle, TrendingUp, 
  DollarSign, Loader2, Trash2, Send, PlayCircle, Lock, 
  CheckCircle2 
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import clsx from 'clsx';
import FeedbackModal from './FeedbackModal';

// --- API ---

// --- FIX: Returnera data ---
const sendDecisionRequestApi = async (id) => {
  const res = await axios.post(
    'http://localhost:3000/api/decisions/request',
    { id, type: 'POINT' }
  );
  return res.data; 
};

const deletePointApi = async (id) => {
  await axios.delete(`http://localhost:3000/api/points/${id}`);
};

const updatePointApi = async ({ id, data }) => {
  const res = await axios.patch(`http://localhost:3000/api/points/${id}`, data);
  return res.data;
};

const createActionApi = async (data) => {
  await axios.post('http://localhost:3000/api/actions', data);
};

export default function PointDrawer({ point, isOpen, onClose }) {
  const queryClient = useQueryClient();

  // Lokalt state för formuläret
  const [formData, setFormData] = useState({});
  const [isConfirmingSend, setIsConfirmingSend] = useState(false);

  // Feedback state lokalt i drawern
  const [feedback, setFeedback] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    details: ''
  });

  // Synka state när punkten öppnas
  useEffect(() => {
    if (point) {
      setFormData({
        title: point.title,
        description: point.description,
        benefit: point.benefit,
        risk: point.risk,
        costEstimate: point.costEstimate,
        relevance: point.relevance || 3,
        feasibility: point.feasibility,
        status: point.status,
        origin: point.origin,
        priority: point.priority
      });
      setIsConfirmingSend(false);
    }
  }, [point]);

  // --- Mutations ---

  const mutation = useMutation({
    mutationFn: updatePointApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['system']);
      onClose();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deletePointApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['system']);
      onClose();
    }
  });

  // --- FIX: Ta emot data och visa länk ---
  const requestDecisionMutation = useMutation({
    mutationFn: sendDecisionRequestApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['system']);
      
      setFeedback({
        isOpen: true,
        type: 'success',
        title: 'Förfrågan skapad',
        message: 'Beslutsunderlag har skapats. Kopiera länken nedan:',
        details: data.link|| 'Länk saknas'
      });
      setIsConfirmingSend(false);
    },
    onError: () => {
        setFeedback({
            isOpen: true,
            type: 'error',
            title: 'Något gick fel',
            message: 'Kunde inte skapa beslutsunderlag.'
        });
        setIsConfirmingSend(false);
    }
  });

  const createActionMutation = useMutation({
    mutationFn: createActionApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['system']);
      onClose();
    }
  });

  // --- Handlers ---

  const handleSave = () => {
    mutation.mutate({ id: point.id, data: formData });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // --- Logic for ReadOnly ---
  // Dessa statusar låser formuläret för redigering
  const readOnlyStatuses = ['ASSESSED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'DONE', 'IN_PROGRESS'];
  const isReadOnly = point && readOnlyStatuses.includes(point.status);

  return (
    <>
    <AnimatePresence>
      {isOpen && point && (
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
                <div className="flex items-center gap-3 mb-3">
                  {/* Origin Select */}
                  <select 
                    disabled={isReadOnly}
                    value={formData.origin || 'Verksamhet'}
                    onChange={(e) => handleChange('origin', e.target.value)}
                    className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-md border border-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="Verksamhet">Verksamhet</option>
                    <option value="IT">IT</option>
                    <option value="Leverantör">Leverantör</option>
                    <option value="Möte">Möte</option>
                  </select>

                  {/* Priority Select */}
                  <select 
                     disabled={isReadOnly}
                     value={formData.priority || 'MEDIUM'}
                     onChange={(e) => handleChange('priority', e.target.value)}
                     className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider outline-none border focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        formData.priority === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-100' : 
                        formData.priority === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                        'bg-slate-50 text-slate-600 border-slate-100'
                     }`}
                  >
                    <option value="LOW">Låg Prio</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">Hög Prio</option>
                    <option value="CRITICAL">Kritisk</option>
                  </select>
                </div>
                
                {/* Title Input */}
                <input 
                  disabled={isReadOnly} 
                  value={formData.title || ''} 
                  onChange={(e) => handleChange('title', e.target.value)} 
                  className="text-3xl font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0 w-full placeholder:text-slate-300 leading-tight disabled:text-slate-600" 
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
               
               {/* ACTION CREATION BLOCK (Endast om Approved - notera att Approved är ReadOnly för själva punkten, men man måste kunna skapa Action) */}
               {point.status === 'APPROVED' && !point.action && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-50/80 p-6 rounded-[1.5rem] border border-emerald-100 shadow-sm"
                  >
                    <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                      <CheckCircle className="text-emerald-600" /> Beslut Godkänt! Planera Åtgärd
                    </h3>
                    <form 
                      onSubmit={(e) => { 
                        e.preventDefault(); 
                        const fd = new FormData(e.target); 
                        createActionMutation.mutate({ 
                          pointId: point.id, 
                          title: point.title, 
                          assignedTo: fd.get('assignedTo'), 
                          startDate: fd.get('startDate'), 
                          dueDate: fd.get('dueDate') 
                        }); 
                      }} 
                      className="space-y-4"
                    >
                      <div>
                        <label className="text-xs font-bold text-emerald-800 uppercase tracking-wider ml-1">Ansvarig</label>
                        <input name="assignedTo" required className="w-full p-3 rounded-xl border border-emerald-200 focus:ring-2 focus:ring-emerald-500 outline-none mt-1 bg-white font-medium" placeholder="Namn på ansvarig"/>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-emerald-800 uppercase tracking-wider ml-1">Startdatum</label>
                          <input name="startDate" type="date" className="w-full p-3 rounded-xl border border-emerald-200 mt-1 bg-white font-medium"/>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-emerald-800 uppercase tracking-wider ml-1">Slutdatum</label>
                          <input name="dueDate" type="date" className="w-full p-3 rounded-xl border border-emerald-200 mt-1 bg-white font-medium"/>
                        </div>
                      </div>
                      <button 
                        type="submit" 
                        disabled={createActionMutation.isPending} 
                        className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 flex justify-center gap-2 transition-all active:scale-95"
                      >
                        {createActionMutation.isPending ? <Loader2 className="animate-spin"/> : <PlayCircle size={20}/>} 
                        Skapa Åtgärd
                      </button>
                    </form>
                  </motion.div>
               )}

               {/* MAIN DESCRIPTION */}
               <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-6">
                 <div>
                   <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                     <TrendingUp size={16} className="text-indigo-500"/> Beskrivning
                   </label>
                   <textarea 
                     disabled={isReadOnly} 
                     rows="4" 
                     value={formData.description || ''} 
                     onChange={(e) => handleChange('description', e.target.value)} 
                     className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-60 disabled:bg-slate-50 font-medium text-slate-700 leading-relaxed resize-none" 
                     placeholder="Beskriv behovet utförligt..."
                   />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-6">
                   <div>
                     <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                       <CheckCircle size={16} className="text-emerald-500"/> Nytta / Effekt
                     </label>
                     <textarea 
                       disabled={isReadOnly} 
                       rows="3" 
                       value={formData.benefit || ''} 
                       onChange={(e) => handleChange('benefit', e.target.value)} 
                       className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-60 disabled:bg-slate-50 font-medium resize-none"
                       placeholder="Vad vinner vi?"
                     />
                   </div>
                   <div>
                     <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                       <AlertTriangle size={16} className="text-amber-500"/> Risker
                     </label>
                     <textarea 
                       disabled={isReadOnly} 
                       rows="3" 
                       value={formData.risk || ''} 
                       onChange={(e) => handleChange('risk', e.target.value)} 
                       className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-60 disabled:bg-slate-50 font-medium resize-none"
                       placeholder="Vad kan gå fel?"
                     />
                   </div>
                 </div>
               </div>

               {/* ANALYSIS BOX */}
               <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-6">
                 <h3 className="font-bold text-slate-900 text-lg">Analys & Bedömning</h3>
                 
                 <div className="grid grid-cols-2 gap-8">
                   <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Relevans (1-5)</label>
                     <div className="flex gap-2">
                       {[1, 2, 3, 4, 5].map((score) => (
                         <button 
                           key={score} 
                           disabled={isReadOnly} 
                           onClick={() => handleChange('relevance', score)} 
                           className={clsx(
                             "h-10 w-10 rounded-xl font-bold transition-all flex items-center justify-center", 
                             formData.relevance === score 
                               ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110" 
                               : "bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-200",
                             isReadOnly && "cursor-not-allowed opacity-50 bg-slate-50"
                           )}
                         >
                           {score}
                         </button>
                       ))}
                     </div>
                   </div>
                   
                   <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Genomförbarhet</label>
                     <select 
                       disabled={isReadOnly} 
                       value={formData.feasibility || ''} 
                       onChange={(e) => handleChange('feasibility', e.target.value)} 
                       className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700 disabled:opacity-60 h-10"
                     >
                       <option value="">Välj...</option>
                       <option value="EASY">Enkel</option>
                       <option value="MEDIUM">Medium</option>
                       <option value="HARD">Komplex</option>
                     </select>
                   </div>
                 </div>
                 
                 <div>
                   <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                     <DollarSign size={16} className="text-slate-400"/> Kostnadsuppskattning
                   </label>
                   <input 
                     disabled={isReadOnly} 
                     value={formData.costEstimate || ''} 
                     onChange={(e) => handleChange('costEstimate', e.target.value)} 
                     className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium disabled:opacity-60 disabled:bg-slate-50" 
                     placeholder="t.ex. 50 000 kr"
                   />
                 </div>

                 {/* Status (Manual Override) */}
                 <div>
                   <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                     <TrendingUp size={16} className="text-slate-400"/> Status (Manuell ändring)
                   </label>
                   <select 
                     disabled={isReadOnly}
                     value={formData.status || 'NEW'}
                     onChange={(e) => handleChange('status', e.target.value)}
                     className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium disabled:opacity-60 disabled:bg-slate-50"
                   >
                     <option value="NEW">Ny</option>
                     <option value="ASSESSED">Bedömd</option>
                     <option value="RECOMMENDED">Rekommenderad</option>
                     <option value="REJECTED">Avfärdad</option>
                   </select>
                 </div>
               </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-100 bg-white z-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
               {isReadOnly ? (
                 <div className="flex items-center justify-between text-slate-500 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                   <div className="flex items-center gap-2">
                     <Lock size={16} /> 
                     <span>Låst av status: <strong className="text-slate-700">{point.status}</strong></span>
                   </div>
                   <button onClick={onClose} className="font-bold text-slate-600 hover:text-slate-900">Stäng</button>
                 </div>
               ) : (
                 <div className="flex justify-between items-center gap-4">
                   
                    {/* Delete Button */}
                    <button 
                      onClick={() => { if(confirm('Är du säker på att du vill radera denna punkt permanent?')) deleteMutation.mutate(point.id) }} 
                      className="p-3.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
                      title="Radera punkt"
                    >
                      <Trash2 size={20} />
                    </button>

                    <div className="flex gap-3">
                      
                      {/* Workflow Buttons: Endast om status inte är NEW/RECOMMENDED */}
                      <button 
                        onClick={() => setIsConfirmingSend(true)} 
                        className="px-5 py-3 bg-amber-50 text-amber-700 font-bold rounded-xl hover:bg-amber-100 transition-colors flex items-center gap-2 border border-amber-100"
                      >
                        <Send size={18} /> 
                        <span className="hidden sm:inline">Begär beslut</span>
                      </button>
                      
                      <button 
                        onClick={() => {
                          if(confirm('Godkänn direkt utan systemägare?')) mutation.mutate({ id: point.id, data: { ...formData, status: 'APPROVED' } });
                        }} 
                        className="px-5 py-3 bg-emerald-50 text-emerald-700 font-bold rounded-xl hover:bg-emerald-100 transition-colors flex items-center gap-2 border border-emerald-100"
                      >
                        <CheckCircle2 size={18} /> 
                        <span className="hidden sm:inline">Godkänn direkt</span>
                      </button>
                      
                      {/* Save Button */}
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
               )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    
    {/* Feedback Modal (for decision link) */}
    <FeedbackModal 
        isOpen={feedback.isOpen} 
        onClose={() => setFeedback({ ...feedback, isOpen: false })} 
        type={feedback.type} 
        title={feedback.title} 
        message={feedback.message} 
        details={feedback.details} 
    />

    {/* Confirm Modal for Sending Request */}
    <AnimatePresence>
    {isConfirmingSend && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => setIsConfirmingSend(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-slate-800 mb-2">Begär beslut?</h3>
            <p className="text-slate-600 mb-6">Detta kommer att skapa en unik länk som du kan skicka till systemägaren.</p>
            <div className="flex justify-end gap-3">
                <button onClick={() => setIsConfirmingSend(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-lg">Avbryt</button>
                <button onClick={() => requestDecisionMutation.mutate(point.id)} className="px-4 py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 shadow-lg shadow-amber-200">Ja, skapa länk</button>
            </div>
            </motion.div>
        </div>
    )}
    </AnimatePresence>
    </>
  );
}