import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Activity, AlertCircle, CheckCircle2, Clock, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const fetchStats = async () => {
  const res = await axios.get('http://localhost:3000/api/dashboard');
  return res.data;
};

// Översättnings-helpers (Samma som i SystemDetail)
const translateStatus = (status) => {
  const map = {
    'NEW': 'Ny',
    'ASSESSED': 'Bedömd',
    'RECOMMENDED': 'Rekommenderad',
    'APPROVED': 'Godkänd',
    'REJECTED': 'Avfärdad',
    'PENDING_APPROVAL': 'Väntar beslut',
    'IN_PROGRESS': 'Pågående',
    'DONE': 'Klar',
    'PENDING': 'Väntande'
  };
  return map[status] || status;
};

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
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchStats
  });

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
  if (isError) return <div className="p-10 text-red-500">Kunde inte ladda statistik.</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Översikt</h1>
          <p className="text-slate-500 mt-2">Välkommen tillbaka! Här är pulsen på dina förvaltningsobjekt.</p>
        </div>
        <button 
          onClick={() => navigate('/systems')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-200 active:scale-95"
        >
          Gå till System
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="Förvaltade System" 
          value={data.systemCount} 
          subtext="Aktiva objekt"
          icon={Activity} 
          color="bg-blue-500 text-blue-600" 
        />
        <StatCard 
          title="Väntar på beslut" 
          value={data.pendingDecisions} 
          subtext="Rekommenderade punkter"
          icon={Clock} 
          color="bg-amber-500 text-amber-600" 
        />
        <StatCard 
          title="Pågående åtgärder" 
          value={data.activePoints} 
          subtext="Godkända behov"
          icon={AlertCircle} 
          color="bg-indigo-500 text-indigo-600" 
        />
        <StatCard 
          title="Avslutade i år" 
          value={data.completedPoints} 
          subtext="Genomförda förbättringar"
          icon={CheckCircle2} 
          color="bg-emerald-500 text-emerald-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Vänster: Senaste Händelser */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-slate-800">Senaste Händelser</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {data.recentActivity.length === 0 ? (
              <div className="p-8 text-center text-slate-400">Ingen aktivitet än.</div>
            ) : (
              data.recentActivity.map((point, i) => (
                <motion.div 
                  key={point.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => navigate(`/systems/${point.systemId}`)} // Gå till systemet vid klick
                  className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    {/* Färgindikator för status/prio */}
                    <div className={`w-2 h-12 rounded-full ${
                      point.status === 'DONE' ? 'bg-emerald-500' :
                      point.priority === 'CRITICAL' ? 'bg-red-500' : 
                      point.priority === 'HIGH' ? 'bg-orange-500' :
                      'bg-indigo-500'
                    }`}></div>
                    
                    <div>
                      <h4 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{point.title}</h4>
                      <p className="text-sm text-slate-500">
                        {point.system.name} • {new Date(point.createdAt).toLocaleDateString('sv-SE')}
                      </p>
                    </div>
                  </div>
                  
                  {/* Svensk Status Badge */}
                  <span className={`px-3 py-1 text-xs font-bold rounded-full 
                    ${point.status === 'DONE' ? 'bg-emerald-100 text-emerald-700' : 
                      point.status === 'REJECTED' ? 'bg-slate-100 text-slate-500 line-through' :
                      'bg-slate-100 text-slate-600'}`}>
                    {translateStatus(point.status)}
                  </span>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Höger: Kommande Möten */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-800">Kommande Möten</h2>
          <div className="space-y-4">
            {data.upcomingMeetings.length === 0 ? (
              <p className="text-slate-500 italic">Inga inbokade möten.</p>
            ) : (
              data.upcomingMeetings.map((meeting, i) => (
                <motion.div 
                  key={meeting.id}
                  whileHover={{ y: -2 }}
                  onClick={() => navigate(`/systems/${meeting.systemId}/meeting/${meeting.id}`)}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden cursor-pointer group hover:border-indigo-300 transition-all"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 group-hover:bg-indigo-100 transition-colors"></div>
                  
                  {/* Datum i svenskt format */}
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
                    {new Date(meeting.date).toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                  
                  <h4 className="font-bold text-slate-800 text-lg group-hover:text-indigo-700">{meeting.title}</h4>
                  <p className="text-sm text-slate-500 mt-1">{meeting.system.name}</p>
                </motion.div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}