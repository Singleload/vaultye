import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, X, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function FeedbackModal({ isOpen, onClose, type = 'success', title, message, details }) {
  const [copied, setCopied] = useState(false);

  // Hantera kopiering av sökväg/detaljer
  const copyToClipboard = () => {
    if (details) {
      navigator.clipboard.writeText(details);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isSuccess = type === 'success';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden"
          >
            {/* Header / Icon Area */}
            <div className={`p-6 flex flex-col items-center justify-center text-center ${isSuccess ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                {isSuccess ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
              </div>
              <h2 className={`text-xl font-bold ${isSuccess ? 'text-emerald-900' : 'text-red-900'}`}>
                {title}
              </h2>
            </div>

            {/* Content Area */}
            <div className="p-6">
              <p className="text-slate-600 text-center mb-6 leading-relaxed">
                {message}
              </p>

              {/* Technical Details / File Path */}
              {details && (
                <div className="bg-slate-100 rounded-lg p-3 text-xs text-slate-600 font-mono break-all relative group border border-slate-200">
                  {details}
                  <button 
                    onClick={copyToClipboard}
                    className="absolute right-2 top-2 p-1.5 bg-white rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:text-indigo-600"
                    title="Kopiera"
                  >
                    {copied ? <Check size={14} className="text-emerald-600"/> : <Copy size={14} />}
                  </button>
                </div>
              )}

              {/* Action Button */}
              <button 
                onClick={onClose}
                className={`w-full mt-6 py-3 rounded-xl font-bold text-white transition-all shadow-lg active:scale-95 
                  ${isSuccess 
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' 
                    : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}
              >
                {isSuccess ? 'Utmärkt, stäng' : 'Stäng'}
              </button>
            </div>
            
            {/* Close X top right */}
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}