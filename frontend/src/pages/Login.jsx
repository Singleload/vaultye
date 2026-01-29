import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const success = await login(email, password);
    if (success) {
      navigate('/');
    } else {
      setError('Felaktigt e-post eller lösenord');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dekorativ bakgrund */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-50/50 to-slate-100 -z-10" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50" />
      <div className="absolute top-40 -left-20 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-50" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-[2rem] shadow-2xl w-full max-w-md border border-white/50"
      >
        <div className="text-center mb-8">
           <motion.div 
             initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
             className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white font-bold text-2xl mb-6 shadow-lg shadow-indigo-200"
           >
             W
           </motion.div>
           <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Välkommen</h1>
           <p className="text-slate-500 mt-2 font-medium">Logga in till Waulty Core</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 text-center border border-red-100 font-medium flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"/> {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">E-post</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input 
                type="email" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-slate-900 font-medium"
                placeholder="namn@foretag.se"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Lösenord</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input 
                type="password" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-slate-900 font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all active:scale-[0.98] flex justify-center items-center gap-2 mt-4"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <>Logga in <ArrowRight size={20} /></>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}