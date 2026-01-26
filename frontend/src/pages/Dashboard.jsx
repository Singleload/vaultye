// src/pages/Dashboard.jsx
import { motion } from 'framer-motion';
import { Activity, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

// En enkel komponent för statistikkort
const StatCard = ({ title, value, subtext, icon: Icon, color }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between"
  >
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="text-3xl font-bold text-slate-800 mt-2">{value}</h3>
      <p className="text-xs text-slate-400 mt-1">{subtext}</p>
    </div>
    <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
      <Icon size={24} className={color.replace('bg-', 'text-')} />
    </div>
  </motion.div>
);

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Översikt</h1>
          <p className="text-slate-500 mt-2">Välkommen tillbaka! Här är status för dina förvaltningsobjekt.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-200 active:scale-95">
          + Nytt Ärende
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="Förvaltade System" 
          value="4" 
          subtext="Alla system är aktiva"
          icon={Activity} 
          color="bg-blue-500 text-blue-600" 
        />
        <StatCard 
          title="Väntar på beslut" 
          value="2" 
          subtext="Kräver åtgärd av ägare"
          icon={Clock} 
          color="bg-amber-500 text-amber-600" 
        />
        <StatCard 
          title="Pågående åtgärder" 
          value="12" 
          subtext="3 försenade"
          icon={AlertCircle} 
          color="bg-indigo-500 text-indigo-600" 
        />
        <StatCard 
          title="Genomförda i år" 
          value="45" 
          subtext="+12% från förra året"
          icon={CheckCircle2} 
          color="bg-emerald-500 text-emerald-600" 
        />
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Actions List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-slate-800">Prioriterade Åtgärder</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {[1, 2, 3].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-12 rounded-full ${i === 0 ? 'bg-red-500' : 'bg-indigo-500'}`}></div>
                  <div>
                    <h4 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">Uppgradera API-koppling till ekonomisystemet</h4>
                    <p className="text-sm text-slate-500">System: Waulty Core • Ansvarig: Team Backend</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <span className="px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
                     Pågående
                   </span>
                </div>
              </motion.div>
            ))}
            <div className="p-4 text-center">
              <button className="text-sm text-indigo-600 font-medium hover:underline">Visa alla åtgärder</button>
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Meetings */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-800">Kommande Möten</h2>
          <div className="space-y-4">
            {[1, 2].map((item, i) => (
               <motion.div 
                 key={i}
                 whileHover={{ y: -2 }}
                 className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden"
               >
                 <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-bl-full -mr-4 -mt-4"></div>
                 <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">IMORGON 10:00</p>
                 <h4 className="font-bold text-slate-800 text-lg">Förvaltningsmöte Q1</h4>
                 <p className="text-sm text-slate-500 mt-1">Ekonomisystemet</p>
                 
                 <div className="mt-4 flex -space-x-2">
                   {[1,2,3].map(av => (
                     <div key={av} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-600">
                       D
                     </div>
                   ))}
                 </div>
               </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}