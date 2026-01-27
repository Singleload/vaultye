import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

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

    const { data: point, isLoading, isError, error } = useQuery({
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

    const handleDecision = (decision) => {
        mutation.mutate({ token, decision, comment });
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-100"><Loader2 className="animate-spin text-slate-400" size={32} /></div>;

    if (isError) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle size={32} />
                </div>
                <h1 className="text-xl font-bold text-slate-800">Länken är ogiltig</h1>
                <p className="text-slate-500 mt-2">{error.response?.data?.error || "Kunde inte hämta beslutsunderlaget. Länken kan ha gått ut eller redan använts."}</p>
            </div>
        </div>
    );

    if (submitted) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${decisionType === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}
                >
                    {decisionType === 'APPROVED' ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
                </motion.div>
                <h1 className="text-2xl font-bold text-slate-900">
                    {decisionType === 'APPROVED' ? 'Beslut registrerat: Godkänt' : 'Beslut registrerat: Avslag'}
                </h1>
                <p className="text-slate-500 mt-2">Tack! Systemförvaltaren har meddelats om ditt beslut.</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-100 py-12 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto space-y-6">

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-indigo-600 text-white font-bold text-xl mb-4">W</div>
                    <h2 className="text-3xl font-bold text-slate-900">Beslutsunderlag</h2>
                    <p className="text-slate-500 mt-2">Waulty Systemförvaltning begär ditt beslut.</p>
                </div>

                {/* Card */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-2xl shadow-xl overflow-hidden"
                >
                    <div className="p-8 border-b border-slate-100">
                        <div className="flex items-center gap-2 text-sm text-indigo-600 font-bold uppercase tracking-wider mb-2">
                            {point.dataType === 'UPGRADE' ? 'Systemuppgradering' : 'Förbättringsförslag'} • {point.system.name}
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-4">{point.title}</h1>

                        {/* SPECIFIKT FÖR UPGRADE */}
                        {point.dataType === 'UPGRADE' && (
                            <div className="mb-4 flex gap-4">
                                <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg font-mono font-bold">v{point.version}</span>
                                {point.downtime && <span className="bg-red-50 text-red-600 px-3 py-1 rounded-lg font-bold border border-red-100">Kräver Nertid</span>}
                            </div>
                        )}

                        <p className="text-slate-600 leading-relaxed text-lg">{point.description}</p>
                    </div>

                    {/* VISA OLIKA DATA BEROENDE PÅ TYP */}
                    {point.dataType === 'UPGRADE' ? (
                        <div className="p-8 bg-slate-50/50">
                            <h4 className="font-bold text-slate-800 mb-2">Planering</h4>
                            <p className="text-slate-600">
                                Planerat datum: {point.plannedDate ? new Date(point.plannedDate).toLocaleDateString() : 'Ej satt'}
                            </p>
                            <p className="text-slate-500 text-sm mt-4">
                                Godkännande av denna uppgradering innebär att teamet får mandat att påbörja arbetet enligt plan.
                            </p>
                        </div>
                    ) : (
                        // DETTA ÄR FÖR PUNKTER (Som vi hade innan)
                        <div className="p-8 bg-slate-50/50 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-bold text-slate-800 mb-2">Förväntad Nytta</h4>
                                <p className="text-slate-600">{point.benefit || "-"}</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 mb-2">Risker & Kostnad</h4>
                                <p className="text-slate-600">Risk: {point.risk || "-"}</p>
                                <p className="text-slate-600">Kostnad: {point.costEstimate || "-"}</p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="p-8 bg-white border-t border-slate-100">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Lämna en kommentar (valfritt)</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg mb-6 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Motivering till beslutet..."
                            rows="2"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleDecision('REJECTED')}
                                disabled={mutation.isPending}
                                className="py-4 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all"
                            >
                                Avslå
                            </button>
                            <button
                                onClick={() => handleDecision('APPROVED')}
                                disabled={mutation.isPending}
                                className="py-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                            >
                                {mutation.isPending ? <Loader2 className="animate-spin" /> : 'Godkänn Förslaget'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}