import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Send, CheckSquare, Loader2, ArrowUpRight } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import FeedbackModal from './FeedbackModal';
import axios from 'axios';

const updateActionApi = async ({ id, data }) => {
  const res = await axios.patch(`http://localhost:3000/api/actions/${id}`, data);
  return res.data;
};

export default function ActionDrawer({ action, systemName, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({});

  const [feedback, setFeedback] = useState({
    isOpen: false,
    type: 'success', // 'success' | 'error'
    title: '',
    message: '',
    details: ''
  });

  useEffect(() => {
    if (action) {
      setFormData({
        description: action.description || '',
        notes: action.notes || '',
        status: action.status
      });
    }
  }, [action]);

  const mutation = useMutation({
    mutationFn: updateActionApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['system']);
      onClose();
    }
  });

  const handleSave = () => {
    mutation.mutate({ id: action.id, data: formData });
  };

  const easitMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await axios.post('http://localhost:3000/api/easit/export', payload);
      return res.data;
    },
    onSuccess: (data) => {
      setFeedback({
        isOpen: true,
        type: 'success',
        title: 'Export Lyckades!',
        message: 'Ärendet har skickats till Easit och en CSV-fil har genererats på servern.',
        details: `Fil: ${data.path}`
      });
    },
    onError: (error) => {
      console.error(error);
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Export Misslyckades',
        message: 'Något gick fel vid exporten till Easit. Kontrollera serverloggarna eller försök igen.',
        details: error.response?.data?.error || error.message
      });
    }
  });

  const handleSendToEasit = () => {
    // 1. Skapa payloaden
    const payload = {
      externalId: action.id,
      system: systemName,
      requester: action.assignedTo,
      dueDate: action.dueDate,
      title: action.title,
      description: formData.description, // Den utförliga beskrivningen från formuläret
      originalPointId: action.point?.id
    };

    // 2. Logga frontend (enligt krav)
    console.group("🚀 Skickar till Backend (för CSV-konvertering)");
    console.log(JSON.stringify(payload, null, 2));
    console.groupEnd();

    // 3. Skicka till backend
    easitMutation.mutate(payload);
  };

  return (
    <AnimatePresence>
      {isOpen && action && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Åtgärd • {action.assignedTo}
                </span>
                <h2 className="text-2xl font-bold text-slate-800 mt-1">{action.title}</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">

              {/* Original Point Info */}
              {action.point && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <h4 className="text-sm font-bold text-blue-800 mb-1 flex items-center gap-2">
                    <ArrowUpRight size={16} /> Baserat på behov
                  </h4>
                  <p className="text-blue-900 font-medium">{action.point.title}</p>
                  <p className="text-blue-700 text-sm mt-1">{action.point.description}</p>
                </div>
              )}

              {/* Easit Description */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Utförlig beskrivning (för Easit)</label>
                <p className="text-xs text-slate-500 mb-2">Beskriv tekniska detaljer och vad som exakt ska göras.</p>
                <textarea
                  rows="6"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Skriv teknisk specifikation här..."
                />
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Interna noteringar</label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-400 outline-none"
                  placeholder="Egna minnesanteckningar..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center">
              <button
                onClick={handleSendToEasit}
                disabled={easitMutation.isPending}
                className="flex items-center gap-2 text-indigo-600 font-bold hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {easitMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                Skicka till Easit
              </button>

              <div className="flex gap-3">
                {/* Markera som klar knapp */}
                {formData.status !== 'DONE' ? (
                  <button
                    onClick={() => {
                      mutation.mutate({ id: action.id, data: { status: 'DONE' } });
                    }}
                    className="px-4 py-2 bg-emerald-100 text-emerald-800 font-bold rounded-xl hover:bg-emerald-200 flex items-center gap-2"
                  >
                    <CheckSquare size={18} /> Markera som klar
                  </button>
                ) : (
                  <span className="flex items-center gap-2 text-emerald-600 font-bold px-4">
                    <CheckSquare size={18} /> Åtgärd är klar
                  </span>
                )}

                <button
                  onClick={handleSave}
                  disabled={mutation.isPending}
                  className="px-6 py-2 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 shadow-lg transition-all flex items-center gap-2"
                >
                  {mutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Spara
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback({ ...feedback, isOpen: false })}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
        details={feedback.details}
      />
    </AnimatePresence>
  );
}