// frontend/src/pages/SystemDetail.jsx
import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Settings, FileText, CheckCircle2, 
  AlertCircle, Plus, X, Loader2, User, Calendar, Play, ChevronRight 
} from 'lucide-react';
import clsx from 'clsx';

// Importera din Drawer-komponent
import PointDrawer from '../components/PointDrawer';

// --- API Helpers ---
const fetchSystemDetails = async (id) => {
  const res = await axios.get(`http://localhost:3000/api/systems/${id}`);
  return res.data;
};

const createPoint = async (data) => {
  const res = await axios.post('http://localhost:3000/api/points', data);
  return res.data;
};

const createMeetingApi = async (data) => {
  const res = await axios.post('http://localhost:3000/api/meetings', data);
  return res.data;
};

// --- Sub-komponenter ---
const TabButton = ({ active, onClick, children, icon: Icon }) => (
  <button
    onClick={onClick}
    className={clsx(
      "flex items-center gap-2 px-6 py-3 font-medium text-sm transition-all border-b-2",
      active 
        ? "border-indigo-600 text-indigo-700 bg-indigo-50/50" 
        : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
    )}
  >
    <Icon size={18} />
    {children}
  </button>
);

const PriorityBadge = ({ level }) => {
  const colors = {
    LOW: "bg-slate-100 text-slate-600 border-slate-200",
    MEDIUM: "bg-blue-50 text-blue-700 border-blue-200",
    HIGH: "bg-orange-50 text-orange-700 border-orange-200",
    CRITICAL: "bg-red-50 text-red-700 border-red-200"
  };
  return <span className={`px-2 py-0.5 rounded border text-xs font-bold ${colors[level]}`}>{level}</span>;
}

const StatusDot = ({ status }) => {
  const colors = {
    NEW: "bg-blue-500",
    ASSESSED: "bg-purple-500",
    RECOMMENDED: "bg-amber-500",
    APPROVED: "bg-emerald-500",
    REJECTED: "bg-red-500"
  };
  return <div className={`w-2.5 h-2.5 rounded-full ${colors[status] || "bg-slate-300"}`} />;
}

export default function SystemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State
  const [activeTab, setActiveTab] = useState('needs');
  const [isPointModalOpen, setIsPointModalOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null); // För Drawer

  // 1. Hämta System (inkl punkter och möten)
  const { data: system, isLoading, isError } = useQuery({
    queryKey: ['system', id],
    queryFn: () => fetchSystemDetails(id)
  });

  // 2. Mutation för att skapa Punkt (Manuellt)
  const pointMutation = useMutation({
    mutationFn: createPoint,
    onSuccess: () => {
      queryClient.invalidateQueries(['system', id]);
      setIsPointModalOpen(false);
    }
  });

  // 3. Mutation för att skapa Möte
  const meetingMutation = useMutation({
    mutationFn: createMeetingApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['system', id]);
      // Navigera direkt till det nya mötesrummet
      navigate(`/systems/${id}/meeting/${data.id}`);
    }
  });

  const handleCreatePoint = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    pointMutation.mutate({
      systemId: id,
      title: formData.get('title'),
      description: formData.get('description'),
      origin: formData.get('origin'),
      priority: formData.get('priority'),
    });
  };

  const handleStartMeeting = () => {
    meetingMutation.mutate({
      title: 'Förvaltningsmöte', // Detta kan göras dynamiskt senare
      date: new Date(),
      systemId: id
    });
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
  if (isError) return <div className="p-10 text-red-500">Kunde inte hitta systemet. Är backend igång?</div>;

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/systems" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{system.name}</h1>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <User size={14} />
            <span>Ägare: {system.ownerName}</span>
          </div>
        </div>
        <div className="ml-auto">
          <button className="flex items-center gap-2 text-slate-600 hover:text-slate-900 px-4 py-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 hover:shadow-sm">
            <Settings size={18} />
            <span>Inställningar</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px] flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-white">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={FileText}>
            Översikt
          </TabButton>
          <TabButton active={activeTab === 'meetings'} onClick={() => setActiveTab('meetings')} icon={Calendar}>
            Möten
          </TabButton>
          <TabButton active={activeTab === 'needs'} onClick={() => setActiveTab('needs')} icon={AlertCircle}>
            Behov & Förslag 
            <span className="ml-2 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">
              {system.points?.length || 0}
            </span>
          </TabButton>
          <TabButton active={activeTab === 'actions'} onClick={() => setActiveTab('actions')} icon={CheckCircle2}>
            Åtgärder
          </TabButton>
        </div>

        <div className="p-6 flex-1 bg-slate-50/30">
          
          {/* --- TAB: OVERVIEW --- */}
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4">Systeminformation</h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                  {system.description || "Ingen beskrivning angiven."}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase font-bold">Resursgrupp</p>
                    <p className="text-slate-800 font-medium mt-1">{system.resourceGroup || "Ej angivet"}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase font-bold">Status</p>
                    <p className="text-slate-800 font-medium mt-1">{system.status}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* --- TAB: MEETINGS --- */}
          {activeTab === 'meetings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Möteshistorik</h3>
                  <p className="text-sm text-slate-500">Hantera resursgruppsmöten och protokoll.</p>
                </div>
                <button 
                  onClick={handleStartMeeting}
                  disabled={meetingMutation.isPending}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm transition-all active:scale-95 disabled:opacity-70"
                >
                  {meetingMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
                  Starta nytt möte nu
                </button>
              </div>

              <div className="space-y-3">
                {(!system.meetings || system.meetings.length === 0) ? (
                  <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-200">
                    <Calendar className="mx-auto text-slate-300 mb-2" size={32} />
                    <p className="text-slate-500 italic">Inga möten registrerade än.</p>
                  </div>
                ) : (
                  system.meetings.map((meeting) => (
                    <div 
                      key={meeting.id} 
                      onClick={() => navigate(`/systems/${id}/meeting/${meeting.id}`)}
                      className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex justify-between items-center group"
                    >
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                           {new Date(meeting.date).getDate()}
                         </div>
                         <div>
                           <h4 className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">{meeting.title}</h4>
                           <p className="text-sm text-slate-500">
                             {new Date(meeting.date).toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}
                           </p>
                         </div>
                      </div>
                      <div className="text-slate-400 group-hover:text-indigo-400 transition-colors">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* --- TAB: NEEDS (POINTS) --- */}
          {activeTab === 'needs' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Backlogg</h3>
                  <p className="text-sm text-slate-500">Inkomna behov, förslag och problemrapporter.</p>
                </div>
                <button 
                  onClick={() => setIsPointModalOpen(true)}
                  className="flex items-center gap-2 text-sm bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm"
                >
                  <Plus size={16} />
                  Registrera manuellt
                </button>
              </div>

              {system.points?.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                    <AlertCircle size={24} />
                  </div>
                  <h4 className="text-slate-900 font-medium">Inga punkter än</h4>
                  <p className="text-slate-500 text-sm mt-1">Allt verkar lugnt! Skapa ett möte eller registrera manuellt.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {system.points?.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => setSelectedPoint(item)}
                      className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <StatusDot status={item.status} />
                          <div>
                            <h4 className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">{item.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                              <span>Från: {item.origin}</span>
                              <span>•</span>
                              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <PriorityBadge level={item.priority} />
                          <div className={clsx(
                            "text-xs font-medium px-3 py-1 rounded uppercase tracking-wide",
                            item.status === 'RECOMMENDED' ? "bg-amber-100 text-amber-800" :
                            item.status === 'APPROVED' ? "bg-emerald-100 text-emerald-800" :
                            "bg-slate-100 text-slate-600"
                          )}>
                            {item.status === 'NEW' ? 'Ny' : 
                             item.status === 'RECOMMENDED' ? 'Rekommenderad' : item.status}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* --- TAB: ACTIONS --- */}
          {activeTab === 'actions' && (
             <div className="p-10 text-center text-slate-400">
               <p>Här kommer godkända åtgärder visas.</p>
             </div>
          )}

        </div>
      </div>

      {/* --- MODAL: CREATE POINT --- */}
      <AnimatePresence>
        {isPointModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsPointModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-800">Registrera Behov/Förslag</h2>
                <button onClick={() => setIsPointModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleCreatePoint} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vad gäller saken?</label>
                  <input required name="title" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="T.ex. Rapporten laddar långsamt" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Beskrivning</label>
                  <textarea required name="description" rows="4" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Beskriv behovet eller problemet mer i detalj..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ursprung</label>
                    <input required name="origin" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Vem rapporterade?" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Prioritet</label>
                    <select name="priority" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                      <option value="LOW">Låg</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">Hög</option>
                      <option value="CRITICAL">Kritisk</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsPointModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Avbryt</button>
                  <button 
                    type="submit" 
                    disabled={pointMutation.isPending}
                    className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-70 flex items-center gap-2"
                  >
                    {pointMutation.isPending && <Loader2 className="animate-spin" size={16} />}
                    Spara punkt
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- DRAWER: POINT ANALYSIS --- */}
      <PointDrawer 
        point={selectedPoint} 
        isOpen={!!selectedPoint} 
        onClose={() => setSelectedPoint(null)} 
      />
    </div>
  );
}