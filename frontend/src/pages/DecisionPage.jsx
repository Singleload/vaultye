import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

// --- API ---
const fetchDecisionData = async (token) => {
    const res = await axios.get(`http://localhost:3000/api/decisions/${token}`);
    return res.data;
};

const submitDecisionApi = async ({ token, decision, comment }) => {
    await axios.post(`http://localhost:3000/api/decisions/${token}`, { decision, comment });
};

export default function DecisionPage() {
    const { token } = useParams();
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [decisionType, setDecisionType] = useState(null); // 'APPROVED' | 'REJECTED'

    const { data: point, isLoading, isError } = useQuery({
        queryKey: ['decision', token],
        queryFn: () => fetchDecisionData(token),
        retry: false
    });

    const mutation = useMutation({
        mutationFn: submitDecisionApi,
        onSuccess: (data, variables) => {
            setSubmitted(true);
            setDecisionType(variables.decision);
        }
    });

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;
    
    if (isError) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
                <AlertCircle className="text-red-500 w-16 h-16 mx-auto mb-4" />
                <h1 className="text-xl font-bold text-slate-900">Ogiltig länk</h1>
                <p className="text-slate-500 mt-2">Denna länk är antingen ogiltig eller så har beslutet redan registrerats.</p>
            </div>
        </div>
    );

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-white -z-10" />
                
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    className="bg-white p-10 rounded-[2rem] shadow-2xl max-w-md w-full text-center border border-white/50"
                >
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border-4 border-slate-50 ${decisionType === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        {decisionType === 'APPROVED' ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
                        {decisionType === 'APPROVED' ? 'Beslut Godkänt' : 'Beslut Avslaget'}
                    </h1>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        Tack för ditt svar. Systemförvaltaren har meddelats om ditt beslut.
                    </p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-white -z-10" />
            
            <div className="max-w-2xl w-full">
                {/* Header Logo Area */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-xl mb-4 shadow-lg shadow-indigo-200">W</div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Beslutsunderlag</h1>
                    <p className="text-slate-500 font-medium">Från Waulty Core Platform</p>
                </div>

                <motion.div 
                    initial={{ y: 20, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }} 
                    className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100"
                >
                    {/* Card Header */}
                    <div className="bg-slate-50/50 p-8 border-b border-slate-100 text-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-4 inline-block border border-indigo-100">
                            Förfrågan
                        </span>
                        <h2 className="text-3xl font-bold text-slate-900 leading-tight mb-2">
                            {point.title}
                        </h2>
                        <p className="text-slate-500 font-medium text-lg flex items-center justify-center gap-2">
                            Gäller system: <span className="text-slate-800 font-bold">{point.system.name}</span>
                        </p>
                    </div>

                    <div className="p-8 space-y-8">
                        
                        {/* Description */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Beskrivning</h3>
                            <p className="text-slate-700 text-lg leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                {point.description}
                            </p>
                        </div>

                        {/* Analysis Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                               <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Förväntad Nytta</h3>
                               <p className="text-emerald-900 font-medium text-lg leading-snug">
                                   {point.benefit || 'Ej specificerad'}
                               </p>
                           </div>
                           <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                               <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">Kostnadsuppskattning</h3>
                               <p className="text-amber-900 font-bold text-2xl">
                                   {point.costEstimate || '-'}
                               </p>
                           </div>
                        </div>

                        {/* Comment Input */}
                        <div className="pt-6 border-t border-slate-100">
                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                                Kommentar (Valfritt)
                            </label>
                            <textarea 
                                value={comment} 
                                onChange={(e) => setComment(e.target.value)} 
                                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-white focus:bg-slate-50 transition-all font-medium text-slate-700 placeholder:text-slate-400" 
                                placeholder="Skriv en motivering till beslutet..." 
                                rows="3"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <button 
                                onClick={() => mutation.mutate({ token, decision: 'REJECTED', comment })} 
                                disabled={mutation.isPending} 
                                className="py-4 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 disabled:opacity-50"
                            >
                                Avslå
                            </button>
                            
                            <button 
                                onClick={() => mutation.mutate({ token, decision: 'APPROVED', comment })} 
                                disabled={mutation.isPending} 
                                className="py-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                {mutation.isPending ? <Loader2 className="animate-spin" /> : 'Godkänn Förslaget'}
                            </button>
                        </div>
                    </div>
                </motion.div>
                
                <p className="text-center text-slate-400 text-xs mt-8 font-medium">
                    © 2026 Waulty Core Platform
                </p>
            </div>
        </div>
    );
}