import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Activity, AlertCircle, CheckCircle2, Clock, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const fetchStats = async () => {
  const res = await axios.get('http://localhost:3000/api/dashboard');
  return res.data;
};

// Översättnings-helpers
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

const StatCard = ({ title, value, subtext, icon: Icon, colorClass, iconBg }) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between h-full relative overflow-hidden group cursor-default transition-shadow hover:shadow-md"
  >
    {/* Dekorativ bakgrundsikon */}
    <div className={`absolute -right-4 -top-4 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity ${colorClass} scale-150`}>
       <Icon size={120} />
    </div>

    <div className="flex justify-between items-start mb-6 relative z-10">
      <div className={`p-3.5 rounded-2xl ${iconBg} ${colorClass}`}>
        <Icon size={26} />
      </div>
      {/* Här kan man lägga till en trend-indikator om man vill i framtiden */}
    </div>
    
    <div className="relative z-10">
      <h3 className="text-4xl font-bold text-slate-800 mb-1 tracking-tight">{value}</h3>
      <p className="text-sm font-bold text-slate-700">{title}</p>
      <p className="text-xs text-slate-400 mt-1 font-medium">{subtext}</p>
    </div>
  </motion.div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchStats
  });

  if (isLoading) return <div className="flex h-96 justify-center items-center"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;
  if (isError) return <div className="p-10 text-red-500 text-center font-medium bg-red-50 rounded-2xl m-8">Kunde inte ladda statistik. Försök igen senare.</div>;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Översikt</h1>
          <p className="text-slate-500 mt-2 text-lg">Här är pulsen på dina förvaltningsobjekt idag.</p>
        </div>
        <button 
          onClick={() => navigate('/systems')}
          className="bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50 px-6 py-3 rounded-2xl font-bold transition-all shadow-sm flex items-center gap-2 active:scale-95"
        >
          Mina System <ArrowRight size={18}/>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Förvaltade System" 
          value={data.systemCount} 
          subtext="Aktiva objekt"
          icon={Activity} 
          colorClass="text-blue-600" 
          iconBg="bg-blue-50" 
        />
        <StatCard 
          title="Väntar på beslut" 
          value={data.pendingDecisions} 
          subtext="Punkter & Uppgraderingar"
          icon={Clock} 
          colorClass="text-amber-600" 
          iconBg="bg-amber-50" 
        />
        <StatCard 
          title="Pågående åtgärder" 
          value={data.activePoints} 
          subtext="Arbete i process"
          icon={AlertCircle} 
          colorClass="text-indigo-600" 
          iconBg="bg-indigo-50" 
        />
        <StatCard 
          title="Avslutade i år" 
          value={data.completedPoints} 
          subtext="Genomförda förbättringar"
          icon={CheckCircle2} 
          colorClass="text-emerald-600" 
          iconBg="bg-emerald-50" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Vänster: Senaste Händelser */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <Activity size={18} />
            </div>
            Senaste Händelser
          </h2>
          
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            {data.recentActivity.length === 0 ? (
              <div className="p-10 text-center text-slate-400 italic">Ingen aktivitet registrerad än.</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {data.recentActivity.map((point) => (
                  <motion.div 
                    key={point.id}
                    whileHover={{ backgroundColor: '#f8fafc' }}
                    onClick={() => navigate(`/systems/${point.systemId}`)}
                    className="p-5 flex items-center justify-between cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      {/* Status Icon */}
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${
                         point.status === 'DONE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                         point.priority === 'CRITICAL' ? 'bg-red-50 text-red-600 border-red-100' : 
                         'bg-slate-50 text-slate-500 border-slate-100'
                      }`}>
                        {point.status === 'DONE' ? <CheckCircle2 size={20}/> : <AlertCircle size={20}/>}
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors text-base">
                          {point.title}
                        </h4>
                        <p className="text-sm text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                          {point.system.name} 
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span className="text-slate-400 font-normal">{new Date(point.createdAt).toLocaleDateString('sv-SE')}</span>
                        </p>
                      </div>
                    </div>
                    
                    <span className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${
                      point.status === 'DONE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                      point.status === 'REJECTED' ? 'bg-slate-50 text-slate-500 line-through border-slate-200' :
                      'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      {translateStatus(point.status)}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Höger: Kommande Möten */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <Calendar size={18} />
            </div>
            Kommande Möten
          </h2>
          
          <div className="space-y-4">
            {data.upcomingMeetings.length === 0 ? (
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 text-center flex flex-col items-center justify-center h-48">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-3">
                    <Calendar size={32} />
                 </div>
                 <p className="text-slate-400 font-medium">Inga inbokade möten.</p>
              </div>
            ) : (
              data.upcomingMeetings.map((meeting) => (
                <motion.div 
                  key={meeting.id}
                  whileHover={{ y: -4, shadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)" }}
                  onClick={() => navigate(`/systems/${meeting.systemId}/meeting/${meeting.id}`)}
                  className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 relative overflow-hidden cursor-pointer group transition-all"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50 rounded-bl-[3rem] -mr-6 -mt-6 group-hover:bg-indigo-100 transition-colors" />
                  
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(meeting.date).toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'long' })}
                  </p>
                  
                  <h4 className="font-bold text-slate-800 text-lg group-hover:text-indigo-700 transition-colors mb-1">
                    {meeting.title}
                  </h4>
                  <p className="text-sm text-slate-500 font-medium">
                    {meeting.system.name}
                  </p>
                </motion.div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}