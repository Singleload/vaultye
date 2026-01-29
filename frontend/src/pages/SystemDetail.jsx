import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { 
  ArrowLeft, Settings, FileText, CheckCircle2, 
  AlertCircle, Plus, X, Loader2, User, Calendar, 
  ArrowUpCircle, Trash2, Save, Send, Eye, EyeOff, 
  UploadCloud, Server, Clock, ChevronRight
} from 'lucide-react';

// Komponenter
import FeedbackModal from '../components/FeedbackModal';
import PointDrawer from '../components/PointDrawer';
import ActionDrawer from '../components/ActionDrawer';

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

const updateSystemApi = async ({ id, data }) => {
  const res = await axios.patch(`http://localhost:3000/api/systems/${id}`, data);
  return res.data;
};

const createUpgradeApi = async (data) => {
  const res = await axios.post('http://localhost:3000/api/upgrades', data);
  return res.data;
};

const deleteUpgradeApi = async (id) => {
  await axios.delete(`http://localhost:3000/api/upgrades/${id}`);
};

const updateUpgradeApi = async ({ id, status }) => {
  await axios.patch(`http://localhost:3000/api/upgrades/${id}`, { status });
};

// --- FIX: Returnera data här ---
const requestUpgradeDecisionApi = async (id) => {
  const res = await axios.post('http://localhost:3000/api/decisions/request', { id, type: 'UPGRADE' });
  return res.data; 
};

const exportToEasitApi = async (payload) => {
  const res = await axios.post('http://localhost:3000/api/easit/export', payload);
  return res.data;
};

const quickUpdateActionApi = async ({ id, status }) => {
  await axios.patch(`http://localhost:3000/api/actions/${id}`, { status });
};

// --- UI Helpers (Badges) ---

const StatusBadge = ({ status }) => {
  const styles = {
    'NEW': 'bg-blue-50 text-blue-700 border border-blue-100',
    'ASSESSED': 'bg-purple-50 text-purple-700 border border-purple-100',
    'RECOMMENDED': 'bg-amber-50 text-amber-700 border border-amber-100',
    'APPROVED': 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    'IN_PROGRESS': 'bg-indigo-50 text-indigo-700 border border-indigo-100',
    'DONE': 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    'REJECTED': 'bg-slate-50 text-slate-500 border border-slate-200 line-through',
    'PENDING_APPROVAL': 'bg-orange-50 text-orange-800 border border-orange-100',
    'PENDING': 'bg-slate-50 text-slate-600 border border-slate-200',
    'PLANNED': 'bg-blue-50 text-blue-700 border border-blue-100'
  };
  
  const labels = {
    'NEW': 'Ny', 'ASSESSED': 'Bedömd', 'RECOMMENDED': 'Rekommenderad', 
    'APPROVED': 'Godkänd', 'REJECTED': 'Avfärdad', 'PENDING_APPROVAL': 'Väntar beslut', 
    'IN_PROGRESS': 'Pågående', 'DONE': 'Klar', 'PENDING': 'Väntande', 'PLANNED': 'Planerad'
  };

  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${styles[status] || 'bg-gray-100'}`}>
      {labels[status] || status}
    </span>
  );
};

const PriorityBadge = ({ level }) => {
  const styles = {
    'LOW': 'bg-slate-100 text-slate-600',
    'MEDIUM': 'bg-blue-50 text-blue-700',
    'HIGH': 'bg-orange-50 text-orange-700',
    'CRITICAL': 'bg-red-50 text-red-700 border border-red-100'
  };
  const labels = { 'LOW': 'Låg', 'MEDIUM': 'Medium', 'HIGH': 'Hög', 'CRITICAL': 'Kritisk' };
  
  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${styles[level]}`}>
      {labels[level]}
    </span>
  );
};

// --- Huvudkomponent ---

export default function SystemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // -- State --
  const [activeTab, setActiveTab] = useState('needs');
  
  // Modal States
  const [isPointModalOpen, setIsPointModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  
  // Selection States
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  
  // Feedback State
  const [feedback, setFeedback] = useState({ 
    isOpen: false, 
    type: 'success', 
    title: '', 
    message: '', 
    details: '' 
  });
  
  // Filter States
  const [showRejected, setShowRejected] = useState(false);
  const [showAssessed, setShowAssessed] = useState(false);

  // -- Queries --
  const { data: system, isLoading } = useQuery({
    queryKey: ['system', id],
    queryFn: () => fetchSystemDetails(id)
  });

  // -- Mutations --

  const pointMutation = useMutation({
    mutationFn: createPoint,
    onSuccess: () => {
      queryClient.invalidateQueries(['system', id]);
      setIsPointModalOpen(false);
    }
  });

  const meetingMutation = useMutation({
    mutationFn: createMeetingApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['system', id]);
      setIsMeetingModalOpen(false);
      navigate(`/systems/${id}/meeting/${data.id}`);
    }
  });

  const updateSystemMutation = useMutation({
    mutationFn: updateSystemApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['system', id]);
      setIsSettingsOpen(false);
    }
  });

  const createUpgradeMutation = useMutation({
    mutationFn: createUpgradeApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['system', id]);
      setIsUpgradeModalOpen(false);
    }
  });

  const deleteUpgradeMutation = useMutation({
    mutationFn: deleteUpgradeApi,
    onSuccess: () => queryClient.invalidateQueries(['system', id])
  });

  const updateUpgradeMutation = useMutation({
    mutationFn: updateUpgradeApi,
    onSuccess: () => queryClient.invalidateQueries(['system', id])
  });

  // --- FIX: Ta emot data och visa länk ---
  const upgradeDecisionMutation = useMutation({
    mutationFn: requestUpgradeDecisionApi,
    onSuccess: (data) => {
       queryClient.invalidateQueries(['system', id]);
       setFeedback({
         isOpen: true,
         type: 'success',
         title: 'Förfrågan skickad',
         message: 'Beslutsunderlag har skapats. Kopiera länken nedan:',
         details: data?.decisionLink || 'Ingen länk genererades'
       });
    },
    onError: () => {
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Misslyckades',
        message: 'Kunde inte skapa beslutsunderlag.'
      });
    }
  });

  const quickUpdateActionMutation = useMutation({
    mutationFn: quickUpdateActionApi,
    onSuccess: () => queryClient.invalidateQueries(['system', id])
  });

  const easitUpgradeMutation = useMutation({
    mutationFn: exportToEasitApi,
    onSuccess: (data) => {
      setFeedback({
        isOpen: true,
        type: 'success',
        title: 'Uppgradering exporterad!',
        message: 'Uppgifterna har skickats till Easit och en CSV-fil har skapats.',
        details: `Fil sparad: ${data.path}`
      });
    },
    onError: (error) => {
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Export misslyckades',
        message: 'Kunde inte spara CSV-filen.',
        details: error.message
      });
    }
  });

  // -- Handlers --

  const handleSendUpgradeToEasit = (upg) => {
    const payload = {
      externalId: upg.id,
      system: system.name,
      requester: system.managerUsername || "Okänd Förvaltare",
      dueDate: upg.plannedDate,
      title: `Uppgradering v${upg.version}: ${upg.title}`,
      description: `Beskrivning: ${upg.description}\n\nNertid: ${upg.downtime ? 'Ja' : 'Nej'}`,
      originalPointId: '' 
    };
    easitUpgradeMutation.mutate(payload);
  };

  const handleCreateSystemSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    updateSystemMutation.mutate({ 
      id, 
      data: { 
        name: fd.get('name'), 
        description: fd.get('description'), 
        ownerName: fd.get('ownerName'), 
        ownerEmail: fd.get('ownerEmail'), 
        ownerUsername: fd.get('ownerUsername'), 
        managerName: fd.get('managerName'), 
        managerUsername: fd.get('managerUsername'), 
        resourceGroup: fd.get('resourceGroup'), 
        status: fd.get('status') 
      } 
    });
  };

  const handleCreateUpgradeSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    createUpgradeMutation.mutate({ 
      systemId: id, 
      version: fd.get('version'), 
      title: fd.get('title'), 
      description: fd.get('description'), 
      plannedDate: fd.get('plannedDate'), 
      downtime: fd.get('downtime') === 'on' 
    });
  };

  const handleCreateMeetingSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    meetingMutation.mutate({ 
      systemId: id, 
      title: fd.get('title'), 
      date: fd.get('date') 
    });
  };

  const handleCreatePointSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    pointMutation.mutate({ 
      systemId: id, 
      title: fd.get('title'), 
      description: fd.get('description'), 
      origin: fd.get('origin'), 
      priority: fd.get('priority') 
    });
  };


  if (isLoading) return <div className="flex h-screen justify-center items-center"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* HEADER CARD */}
      <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
         {/* Background Decoration */}
         <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
           <Server size={300} />
         </div>

         <div className="flex items-center gap-4 mb-6 relative z-10">
           <Link to="/systems" className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors text-slate-600">
             <ArrowLeft size={20} />
           </Link>
           <div className="flex-1">
             <div className="flex items-center gap-3">
               <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{system.name}</h1>
               <div className={`px-3 py-1 rounded-full text-xs font-bold ${system.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                 {system.status === 'ACTIVE' ? 'Aktiv Förvaltning' : 'Avvecklad'}
               </div>
             </div>
             <p className="text-slate-500 mt-2 max-w-2xl text-lg font-medium">{system.description || "Ingen beskrivning angiven."}</p>
           </div>
           
           <button 
             onClick={() => setIsSettingsOpen(true)} 
             className="p-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl shadow-sm text-slate-600 transition-all active:scale-95"
           >
             <Settings size={20} />
           </button>
         </div>
         
         {/* Metadata Footer */}
         <div className="flex flex-wrap gap-8 border-t border-slate-100 pt-6 relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Ägare</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600 border border-indigo-100">
                  {system.ownerName[0]}
                </div>
                <div>
                   <p className="font-bold text-slate-700 text-sm">{system.ownerName}</p>
                   {system.ownerUsername && <p className="text-xs text-slate-400">{system.ownerUsername}</p>}
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Förvaltare</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-xs font-bold text-purple-600 border border-purple-100">
                  {system.managerName?.[0] || 'U'}
                </div>
                <div>
                   <p className="font-bold text-slate-700 text-sm">{system.managerName || 'Ej satt'}</p>
                   {system.managerUsername && <p className="text-xs text-slate-400">{system.managerUsername}</p>}
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Resursgrupp</p>
              <span className="font-bold text-slate-700 text-sm bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 block">
                {system.resourceGroup || '-'}
              </span>
            </div>
         </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex space-x-1 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 w-fit">
        {[
          { id: 'needs', label: 'Behov & Förslag', icon: FileText },
          { id: 'actions', label: 'Åtgärder', icon: CheckCircle2 },
          { id: 'meetings', label: 'Möten', icon: Calendar },
          { id: 'upgrades', label: 'Uppgraderingar', icon: ArrowUpCircle }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all relative z-10",
              activeTab === tab.id ? "text-indigo-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTabBackground"
                className="absolute inset-0 bg-indigo-50 rounded-xl border border-indigo-100 -z-10"
              />
            )}
            <tab.icon size={18} className={activeTab === tab.id ? "text-indigo-600" : "text-slate-400"} /> 
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- TAB CONTENT: NEEDS --- */}
      {activeTab === 'needs' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button 
                onClick={() => setShowRejected(!showRejected)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${showRejected ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                {showRejected ? <EyeOff size={14}/> : <Eye size={14}/>} Avfärdade
              </button>
              <button 
                onClick={() => setShowAssessed(!showAssessed)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${showAssessed ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                {showAssessed ? <EyeOff size={14}/> : <Eye size={14}/>} Bedömda
              </button>
            </div>
            <button 
              onClick={() => setIsPointModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus size={18} /> Registrera behov
            </button>
          </div>

          <div className="space-y-3">
            {system.points?.filter(p => (showRejected || p.status !== 'REJECTED') && (showAssessed || p.status !== 'ASSESSED')).map(item => (
              <motion.div 
                whileHover={{ scale: 1.005, y: -2 }}
                key={item.id}
                onClick={() => setSelectedPoint(item)}
                className={`bg-white p-5 rounded-2xl border cursor-pointer flex justify-between items-center shadow-sm hover:shadow-md transition-all 
                  ${item.status === 'REJECTED' ? 'opacity-60 bg-slate-50 border-slate-200' : 'border-slate-100 hover:border-indigo-100'}`}
              >
                <div className="flex items-center gap-5">
                  <StatusBadge status={item.status} />
                  <div>
                    <h4 className={`font-bold text-base ${item.status === 'REJECTED' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                      {item.title}
                    </h4>
                    <div className="flex gap-3 text-xs text-slate-400 mt-1 font-medium">
                      <span>{item.origin}</span>
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <PriorityBadge level={item.priority} />
              </motion.div>
            ))}
            {system.points?.length === 0 && (
              <div className="text-center py-16 text-slate-400 bg-white rounded-[2rem] border border-slate-100 border-dashed">
                Inga behov registrerade än.
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* --- TAB CONTENT: ACTIONS --- */}
      {activeTab === 'actions' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="space-y-4">
            {system.points?.filter(p => p.action).map(({ action, ...point }) => (
              <motion.div 
                whileHover={{ y: -2 }}
                key={action.id}
                onClick={() => setSelectedAction({ ...action, point })}
                className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md cursor-pointer flex justify-between items-center group transition-all"
              >
                 <div className="flex items-center gap-5">
                   <button 
                     onClick={(e) => { 
                       e.stopPropagation(); 
                       quickUpdateActionMutation.mutate({ id: action.id, status: action.status === 'DONE' ? 'IN_PROGRESS' : 'DONE' }); 
                     }}
                     className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${
                       action.status === 'DONE' 
                         ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-200 shadow-md' 
                         : 'border-slate-200 text-transparent hover:border-indigo-400 bg-slate-50'
                     }`}
                   >
                     <CheckCircle2 size={20} className={action.status === 'DONE' ? 'scale-100' : 'scale-0'}/>
                   </button>
                   <div>
                     <h4 className={`font-bold text-lg ${action.status === 'DONE' ? 'text-slate-400 line-through' : 'text-slate-800 group-hover:text-indigo-700 transition-colors'}`}>
                       {action.title}
                     </h4>
                     <div className="flex gap-4 text-sm text-slate-500 mt-1 font-medium">
                       <span className="flex items-center gap-1.5"><User size={14} className="text-indigo-400"/> {action.assignedTo}</span>
                       <span className="flex items-center gap-1.5"><Calendar size={14} className="text-indigo-400"/> {new Date(action.dueDate).toLocaleDateString()}</span>
                     </div>
                   </div>
                 </div>
                 <StatusBadge status={action.status} />
              </motion.div>
            ))}
            {system.points?.filter(p => p.action).length === 0 && (
              <div className="text-center py-16 text-slate-400 bg-white rounded-[2rem] border border-slate-100 border-dashed">
                Inga åtgärder planerade.
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* --- TAB CONTENT: MEETINGS --- */}
      {activeTab === 'meetings' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
           <div className="flex justify-between items-center">
             <h3 className="font-bold text-slate-800 text-lg">Möteshistorik</h3>
             <button 
               onClick={() => setIsMeetingModalOpen(true)}
               className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95"
             >
               <Calendar size={18} /> Boka möte
             </button>
           </div>

           <div className="grid gap-4">
             {system.meetings?.map(m => (
               <Link 
                 key={m.id} 
                 to={`/systems/${id}/meeting/${m.id}`}
                 className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex justify-between items-center group hover:border-indigo-100"
               >
                 <div className="flex items-center gap-5">
                   <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex flex-col items-center justify-center text-indigo-700 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                     <span className="text-[10px] font-bold uppercase tracking-wider">{new Date(m.date).toLocaleString('default', { month: 'short' })}</span>
                     <span className="text-2xl font-bold leading-none">{new Date(m.date).getDate()}</span>
                   </div>
                   <div>
                     <h4 className="font-bold text-lg text-slate-800 group-hover:text-indigo-700 transition-colors">{m.title}</h4>
                     <p className="text-sm text-slate-500 font-medium mt-0.5 flex items-center gap-2">
                        <Clock size={12}/> {new Date(m.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </p>
                   </div>
                 </div>
                 <ChevronRight className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
               </Link>
             ))}
             {system.meetings?.length === 0 && (
                <div className="text-center py-16 text-slate-400 bg-white rounded-[2rem] border border-slate-100 border-dashed">
                  Inga möten bokade.
                </div>
             )}
           </div>
        </motion.div>
      )}

      {/* --- TAB CONTENT: UPGRADES --- */}
      {activeTab === 'upgrades' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
           <div className="flex justify-between items-center">
             <h3 className="font-bold text-slate-800 text-lg">Versioner & Uppgraderingar</h3>
             <button 
               onClick={() => setIsUpgradeModalOpen(true)}
               className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95"
             >
               <Plus size={18} /> Registrera Uppgradering
             </button>
           </div>

           <div className="space-y-4">
             {system.upgrades?.map(upg => (
               <div key={upg.id} className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow">
                 <div className="flex justify-between items-start">
                   <div className="flex gap-4">
                     <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex flex-col items-center justify-center text-indigo-700 font-bold border border-indigo-100 shadow-sm">
                       <span className="text-[10px] uppercase tracking-wider">Ver</span>
                       <span className="text-xl leading-none">{upg.version}</span>
                     </div>
                     <div>
                       <h4 className="font-bold text-lg text-slate-800">{upg.title}</h4>
                       <p className="text-slate-600 mt-1 text-sm font-medium leading-relaxed">{upg.description}</p>
                     </div>
                   </div>
                   <div className="flex gap-2">
                     {upg.status === 'PLANNED' && (
                       <button 
                         onClick={() => { if(confirm('Radera?')) deleteUpgradeMutation.mutate(upg.id) }}
                         className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                       >
                         <Trash2 size={18}/>
                       </button>
                     )}
                   </div>
                 </div>

                 <div className="flex flex-wrap items-center gap-4 text-xs font-bold border-t border-slate-50 pt-4 mt-2">
                   <span className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                     <Calendar size={14} className="text-indigo-400"/> 
                     {upg.plannedDate ? new Date(upg.plannedDate).toLocaleDateString() : '-'}
                   </span>
                   {upg.downtime && (
                     <span className="text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 flex items-center gap-1.5">
                       <AlertCircle size={14}/> Kräver nertid
                     </span>
                   )}
                   <StatusBadge status={upg.status} />
                   
                   <div className="flex-1"></div>
                   
                   {/* ACTIONS FOOTER */}
                   <div className="flex gap-2">
                     {upg.status === 'PLANNED' && (
                       <button onClick={() => { if(confirm('Begär beslut?')) upgradeDecisionMutation.mutate(upg.id) }} className="text-amber-700 bg-amber-50 px-4 py-2 rounded-lg hover:bg-amber-100 flex items-center gap-2 border border-amber-100 transition-colors">
                         <Send size={14}/> Begär Godkännande
                       </button>
                     )}
                     {upg.status === 'APPROVED' && (
                       <button onClick={() => { if(confirm('Klar?')) updateUpgradeMutation.mutate({ id: upg.id, status: 'DONE' }) }} className="text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100 flex items-center gap-2 border border-emerald-100 transition-colors">
                         <CheckCircle2 size={14}/> Markera Genomförd
                       </button>
                     )}
                     {upg.status === 'DONE' && (
                       <button 
                         onClick={() => handleSendUpgradeToEasit(upg)}
                         disabled={easitUpgradeMutation.isPending}
                         className="text-indigo-700 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 flex items-center gap-2 border border-indigo-100 transition-colors disabled:opacity-50"
                       >
                         {easitUpgradeMutation.isPending ? <Loader2 className="animate-spin" size={14}/> : <UploadCloud size={14}/>} 
                         Skicka till Easit
                       </button>
                     )}
                   </div>
                 </div>
               </div>
             ))}
             {system.upgrades?.length === 0 && (
                <div className="text-center py-16 text-slate-400 bg-white rounded-[2rem] border border-slate-100 border-dashed">
                  Inga uppgraderingar registrerade.
                </div>
             )}
           </div>
        </motion.div>
      )}

      {/* --- MODALS --- */}
      
      {/* Create Point Modal */}
      <AnimatePresence>
        {isPointModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md" onClick={() => setIsPointModalOpen(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
              <h2 className="text-2xl font-bold mb-6 text-slate-800">Nytt Behov</h2>
              
              <form onSubmit={handleCreatePointSubmit} className="space-y-4">
                <div>
                  <label className="font-bold text-sm text-slate-700 mb-1 block">Titel</label>
                  <input required name="title" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="Vad behövs?"/>
                </div>
                <div>
                  <label className="font-bold text-sm text-slate-700 mb-1 block">Beskrivning</label>
                  <textarea required name="description" rows="3" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-sm text-slate-700 mb-1 block">Källa</label>
                    <select name="origin" className="w-full p-3 border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium">
                      <option value="Verksamhet">Verksamhet</option>
                      <option value="IT">IT</option>
                      <option value="Leverantör">Leverantör</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-sm text-slate-700 mb-1 block">Prioritet</label>
                    <select name="priority" className="w-full p-3 border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium">
                      <option value="LOW">Låg</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">Hög</option>
                      <option value="CRITICAL">Kritisk</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsPointModalOpen(false)} className="px-5 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Avbryt</button>
                  <button type="submit" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">Skapa</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md" onClick={() => setIsSettingsOpen(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h2 className="text-2xl font-bold mb-6 text-slate-800">Inställningar</h2>
              
              <form onSubmit={handleCreateSystemSubmit} className="space-y-4">
                <div>
                  <label className="font-bold text-sm text-slate-700 mb-1 block">Namn</label>
                  <input name="name" defaultValue={system.name} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"/>
                </div>
                <div>
                  <label className="font-bold text-sm text-slate-700 mb-1 block">Beskrivning</label>
                  <textarea name="description" defaultValue={system.description} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"/>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold uppercase text-slate-500">Ägare</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <input name="ownerName" defaultValue={system.ownerName} className="w-full p-3 border border-slate-200 rounded-xl text-sm" placeholder="Namn"/>
                    <input name="ownerUsername" defaultValue={system.ownerUsername} className="w-full p-3 border border-slate-200 rounded-xl text-sm" placeholder="AD (t.ex ann01)"/>
                    <input name="ownerEmail" defaultValue={system.ownerEmail} className="col-span-2 w-full p-3 border border-slate-200 rounded-xl text-sm" placeholder="Email"/>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold uppercase text-slate-500">Förvaltare</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <input name="managerName" defaultValue={system.managerName} className="w-full p-3 border border-slate-200 rounded-xl text-sm" placeholder="Namn"/>
                    <input name="managerUsername" defaultValue={system.managerUsername} className="w-full p-3 border border-slate-200 rounded-xl text-sm" placeholder="AD (t.ex den01)"/>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-sm text-slate-700 mb-1 block">Resursgrupp</label>
                    <input name="resourceGroup" defaultValue={system.resourceGroup} className="w-full p-3 border border-slate-200 rounded-xl text-sm"/>
                  </div>
                  <div>
                    <label className="font-bold text-sm text-slate-700 mb-1 block">Status</label>
                    <select name="status" defaultValue={system.status} className="w-full p-3 border border-slate-200 rounded-xl bg-white outline-none text-sm">
                      <option value="ACTIVE">Aktiv</option>
                      <option value="MAINTENANCE">Underhåll</option>
                      <option value="RETIRED">Avvecklad</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-50 mt-4">
                  <button type="button" onClick={() => setIsSettingsOpen(false)} className="px-5 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Avbryt</button>
                  <button type="submit" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">Spara</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Meeting Modal */}
      <AnimatePresence>
        {isMeetingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md" onClick={() => setIsMeetingModalOpen(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <h2 className="text-2xl font-bold mb-6 text-slate-800">Boka Möte</h2>
              <form onSubmit={handleCreateMeetingSubmit} className="space-y-4">
                <div>
                  <label className="font-bold text-sm text-slate-700 mb-1 block">Titel</label>
                  <input required name="title" defaultValue="Förvaltningsmöte" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"/>
                </div>
                <div>
                  <label className="font-bold text-sm text-slate-700 mb-1 block">Tid</label>
                  <input required type="datetime-local" name="date" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"/>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsMeetingModalOpen(false)} className="px-5 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Avbryt</button>
                  <button type="submit" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">Boka</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {isUpgradeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md" onClick={() => setIsUpgradeModalOpen(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
              <h2 className="text-2xl font-bold mb-6 text-slate-800">Ny Uppgradering</h2>
              <form onSubmit={handleCreateUpgradeSubmit} className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-1/3">
                    <label className="font-bold text-sm text-slate-700 mb-1 block">Version</label>
                    <input required name="version" placeholder="v2.0" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"/>
                  </div>
                  <div className="flex-1">
                    <label className="font-bold text-sm text-slate-700 mb-1 block">Titel</label>
                    <input required name="title" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"/>
                  </div>
                </div>
                <div>
                  <label className="font-bold text-sm text-slate-700 mb-1 block">Beskrivning</label>
                  <textarea required name="description" rows="3" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"/>
                </div>
                <div>
                  <label className="font-bold text-sm text-slate-700 mb-1 block">Planerat datum</label>
                  <input type="date" name="plannedDate" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"/>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" name="downtime" className="w-5 h-5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"/>
                  <label className="font-bold text-slate-700">Kräver nertid</label>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsUpgradeModalOpen(false)} className="px-5 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Avbryt</button>
                  <button type="submit" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">Skapa</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DRAWERS & EXTERNAL MODALS */}
      <PointDrawer 
        point={selectedPoint} 
        isOpen={!!selectedPoint} 
        onClose={() => setSelectedPoint(null)} 
      />
      
      <ActionDrawer 
        action={selectedAction} 
        systemName={system.name} 
        managerUsername={system.managerUsername} 
        isOpen={!!selectedAction} 
        onClose={() => setSelectedAction(null)} 
      />
      
      <FeedbackModal 
        isOpen={feedback.isOpen} 
        onClose={() => setFeedback({ ...feedback, isOpen: false })} 
        type={feedback.type} 
        title={feedback.title} 
        message={feedback.message} 
        details={feedback.details} 
      />
    </div>
  );
}