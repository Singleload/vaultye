// frontend/src/pages/SystemDetail.jsx
import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Settings, FileText, CheckCircle2,
  AlertCircle, Plus, X, Loader2, User, Calendar, Play, ChevronRight,
  ArrowUpCircle, Trash2, Save, Send, Eye, EyeOff
} from 'lucide-react';
import clsx from 'clsx';

// Importera din Drawer-komponent
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

const createUpgradeApi = async (data) => {
  await axios.post('http://localhost:3000/api/upgrades', data);
};
const deleteUpgradeApi = async (id) => {
  await axios.delete(`http://localhost:3000/api/upgrades/${id}`);
};

const updateSystemApi = async ({ id, data }) => {
  await axios.patch(`http://localhost:3000/api/systems/${id}`, data);
};

const sendUpgradeDecisionApi = async (id) => {
  const res = await axios.post('http://localhost:3000/api/decisions/request', { id, type: 'UPGRADE' });
  return res.data;
};

const updateUpgradeApi = async ({ id, status }) => {
  await axios.patch(`http://localhost:3000/api/upgrades/${id}`, { status });
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
  const styles = {
    'LOW': 'bg-slate-50 text-slate-600 border-slate-200',
    'MEDIUM': 'bg-blue-50 text-blue-700 border-blue-200',
    'HIGH': 'bg-orange-50 text-orange-700 border-orange-200',
    'CRITICAL': 'bg-red-50 text-red-700 border-red-200'
  };
  return (
    <span className={`px-2 py-0.5 rounded border text-xs font-bold ${styles[level]}`}>
      {translatePriorityText(level)}
    </span>
  );
};

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

const translateStatusText = (status) => {
  const map = {
    'NEW': 'Ny',
    'ASSESSED': 'Bedömd',
    'RECOMMENDED': 'Rekommenderad',
    'APPROVED': 'Godkänd',
    'REJECTED': 'Avfärdad',
    'PENDING_APPROVAL': 'Väntar beslut',
    'IN_PROGRESS': 'Pågående',
    'DONE': 'Klar',
    'PENDING': 'Väntande' // För Actions
  };
  return map[status] || status;
};

const translatePriorityText = (prio) => {
  const map = { 'LOW': 'Låg', 'MEDIUM': 'Medium', 'HIGH': 'Hög', 'CRITICAL': 'Kritisk' };
  return map[prio] || prio;
};
const StatusBadge = ({ status }) => {
  const styles = {
    'NEW': 'bg-blue-100 text-blue-700 border-blue-200',
    'ASSESSED': 'bg-purple-100 text-purple-700 border-purple-200',
    'RECOMMENDED': 'bg-amber-100 text-amber-700 border-amber-200',
    'APPROVED': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'IN_PROGRESS': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'DONE': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'REJECTED': 'bg-slate-100 text-slate-500 border-slate-200 line-through',
    'PENDING_APPROVAL': 'bg-orange-100 text-orange-800 border-orange-200',
    'PENDING': 'bg-slate-100 text-slate-600 border-slate-200' // Action default
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {translateStatusText(status)}
    </span>
  );
};

const translateStatus = (status) => {
  const map = {
    'NEW': 'Ny',
    'ASSESSED': 'Bedömd',
    'RECOMMENDED': 'Rekommenderad',
    'APPROVED': 'Godkänd',
    'REJECTED': 'Nekad',
    'PENDING_APPROVAL': 'Väntar beslut',
    'IN_PROGRESS': 'Pågående',
    'DONE': 'Klar'
  };
  return map[status] || status;
};

const translatePriority = (prio) => {
  const map = {
    'LOW': 'Låg',
    'MEDIUM': 'Medium',
    'HIGH': 'Hög',
    'CRITICAL': 'Kritisk'
  };
  return map[prio] || prio;
};

export default function SystemDetail() {
  const quickUpdateActionMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      await axios.patch(`http://localhost:3000/api/actions/${id}`, { status });
    },
    onSuccess: () => queryClient.invalidateQueries(['system', id])
  });
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State
  const [activeTab, setActiveTab] = useState('needs');
  const [isPointModalOpen, setIsPointModalOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null); // För Drawer
  const [selectedAction, setSelectedAction] = useState(null); // För ActionDrawer
  const [showRejected, setShowRejected] = useState(false); // För filtrering
  const [showAssessed, setShowAssessed] = useState(false); // För filtrering
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);

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
      setIsMeetingModalOpen(false);
      // Navigera till mötet
      navigate(`/systems/${id}/meeting/${data.id}`);
    }
  });

  const handleCreateMeetingSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    meetingMutation.mutate({
      systemId: id,
      title: fd.get('title'),
      date: fd.get('date') // Backend hanterar datumsträngen
    });
  };

  const updateUpgradeMutation = useMutation({
    mutationFn: updateUpgradeApi,
    onSuccess: () => queryClient.invalidateQueries(['system', id])
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

  const upgradeDecisionMutation = useMutation({
    mutationFn: sendUpgradeDecisionApi,
    onSuccess: (data) => {
      alert(`📧 Länk till systemägare: ${data.link}`);
      queryClient.invalidateQueries(['system', id]);
    }
  });

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const upgradeMutation = useMutation({
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

  const handleCreateUpgrade = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    upgradeMutation.mutate({
      systemId: id,
      version: fd.get('version'),
      title: fd.get('title'),
      description: fd.get('description'),
      plannedDate: fd.get('plannedDate'),
      downtime: fd.get('downtime') === 'on'
    });
  };

  // Lägg detta bredvid de andra statesen
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const updateSystemMutation = useMutation({
    mutationFn: updateSystemApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['system', id]);
      setIsSettingsOpen(false);
    }
  });

  const handleUpdateSystem = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    updateSystemMutation.mutate({
      id,
      data: {
        name: fd.get('name'),
        description: fd.get('description'),
        ownerName: fd.get('ownerName'),
        ownerEmail: fd.get('ownerEmail'),
        resourceGroup: fd.get('resourceGroup'),
        status: fd.get('status')
      }
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
          <button onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 px-4 py-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 hover:shadow-sm">
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
          <TabButton active={activeTab === 'upgrades'} onClick={() => setActiveTab('upgrades')} icon={ArrowUpCircle}>
            Uppgraderingar
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
                  onClick={() => setIsMeetingModalOpen(true)} // <--- ÄNDRAT
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm"
                >
                  <Calendar size={16} /> {/* Bytte ikon till Calendar för att det passar "Boka" bättre */}
                  Boka / Starta möte
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
          {activeTab === 'upgrades' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 text-lg">Systemuppgraderingar</h3>
                <button
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm"
                >
                  <Plus size={16} /> Registrera Uppgradering
                </button>
              </div>

              <div className="space-y-4">
                {system.upgrades?.map((upg) => (
                  <div key={upg.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 relative group">
                    {/* Version Badge */}
                    <div className="shrink-0">
                      <div className="w-16 h-16 bg-indigo-50 rounded-xl flex flex-col items-center justify-center text-indigo-700 border border-indigo-100">
                        <span className="text-xs font-bold uppercase">Ver</span>
                        <span className="text-xl font-bold">{upg.version}</span>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-800 text-lg">{upg.title}</h4>
                      </div>
                      <p className="text-slate-600 text-sm mt-1">{upg.description}</p>

                      <div className="flex items-center gap-4 mt-4 text-xs font-medium">
                        <span className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-1 rounded">
                          <Calendar size={12} /> {upg.plannedDate ? new Date(upg.plannedDate).toLocaleDateString() : 'Datum ej satt'}
                        </span>
                        {upg.downtime && (
                          <span className="text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                            Kräver nertid
                          </span>
                        )}
                      </div>

                      {/* ACTIONS FOOTER */}
                      <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">

                        {/* Status Badge med Svensk Text & Rätt Färg */}
                        <span className={`px-2 py-1 rounded text-xs font-bold border 
                ${upg.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                            upg.status === 'PENDING_APPROVAL' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                              upg.status === 'DONE' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                'bg-blue-50 text-blue-700 border-blue-100'}`}>
                          {translateStatus(upg.status)}
                        </span>

                        <div className="flex gap-2">
                          {/* 1. BEGÄR GODKÄNNANDE (Endast om Planerad) */}
                          {upg.status === 'PLANNED' && (
                            <button
                              onClick={() => {
                                if (confirm('Skicka beslutsunderlag till systemägaren?')) {
                                  upgradeDecisionMutation.mutate(upg.id);
                                }
                              }}
                              className="text-xs bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg hover:bg-amber-200 font-medium flex items-center gap-1"
                            >
                              <Send size={12} /> Begär godkännande
                            </button>
                          )}

                          {/* 2. MARKERA SOM GENOMFÖRD (Endast om Godkänd) */}
                          {upg.status === 'APPROVED' && (
                            <button
                              onClick={() => {
                                if (confirm('Är uppgraderingen genomförd och klar?')) {
                                  updateUpgradeMutation.mutate({ id: upg.id, status: 'DONE' });
                                }
                              }}
                              className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg hover:bg-emerald-200 font-medium flex items-center gap-1"
                            >
                              <CheckCircle2 size={12} /> Markera som genomförd
                            </button>
                          )}

                          {/* 3. RADERA (Endast om Planerad - Skydda historiken) */}
                          {upg.status === 'PLANNED' && (
                            <button
                              onClick={() => { if (confirm('Radera uppgradering?')) deleteUpgradeMutation.mutate(upg.id) }}
                              className="text-slate-300 hover:text-red-500 transition-colors p-1"
                              title="Radera"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {system.upgrades?.length === 0 && <p className="text-slate-500 italic">Inga uppgraderingar registrerade.</p>}
              </div>
            </motion.div>
          )}

          {/* --- TAB: NEEDS (POINTS) --- */}
          {activeTab === 'needs' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Backlogg</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-sm text-slate-500">Inkomna behov och förslag.</p>

                    {/* FILTER KNAPPAR */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowRejected(!showRejected)}
                        className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded transition-colors ${showRejected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500 hover:text-indigo-600'}`}
                      >
                        {showRejected ? <EyeOff size={14} /> : <Eye size={14} />}
                        {showRejected ? 'Dölj avfärdade' : 'Visa avfärdade'}
                      </button>

                      <button
                        onClick={() => setShowAssessed(!showAssessed)}
                        className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded transition-colors ${showAssessed ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500 hover:text-indigo-600'}`}
                      >
                        {showAssessed ? <EyeOff size={14} /> : <Eye size={14} />}
                        {showAssessed ? 'Dölj bedömda' : 'Visa bedömda'}
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsPointModalOpen(true)}
                  className="flex items-center gap-2 text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm transition-all"
                >
                  <Plus size={16} /> Registrera behov
                </button>
              </div>

              <div className="space-y-3">
                {system.points
                  ?.filter(item => {
                    // EXPLICIT FILTRERINGSLOGIK
                    // 1. Dölj alltid avfärdade om showRejected är false
                    if (item.status === 'REJECTED' && !showRejected) return false;
                    // 2. Dölj alltid bedömda om showAssessed är false
                    if (item.status === 'ASSESSED' && !showAssessed) return false;

                    return true;
                  })
                  .map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedPoint(item)}
                      className={`bg-white p-4 rounded-xl border transition-all cursor-pointer group flex justify-between items-center 
              ${item.status === 'REJECTED' ? 'border-slate-100 opacity-60 bg-slate-50' : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'}`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Status Badge till vänster för tydlighet */}
                        <StatusBadge status={item.status} />

                        <div>
                          <h4 className={`font-semibold transition-colors ${item.status === 'REJECTED' ? 'text-slate-500 line-through' : 'text-slate-800 group-hover:text-indigo-700'}`}>
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span>Från: {item.origin}</span>
                            <span>•</span>
                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <PriorityBadge level={item.priority} />
                      </div>
                    </div>
                  ))}

                {/* Visa meddelande om allt är dolt */}
                {system.points?.length > 0 &&
                  system.points?.filter(item => (showRejected || item.status !== 'REJECTED') && (showAssessed || item.status !== 'ASSESSED')).length === 0 && (
                    <p className="text-center text-slate-400 text-sm py-8 italic">
                      Alla punkter är dolda av filter (Bedömda/Avfärdade).
                    </p>
                  )}
              </div>
            </motion.div>
          )}

          {/* --- TAB: ACTIONS --- */}
          {activeTab === 'actions' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h3 className="font-bold text-slate-800 text-lg mb-6">Åtgärdsplan</h3>

              <div className="space-y-3">
                {system.points?.filter(p => p.action).length === 0 ? (
                  <p className="text-slate-500 italic">Inga aktiva åtgärder just nu.</p>
                ) : (
                  system.points?.filter(p => p.action).map(point => {
                    const action = point.action;
                    const isOverdue = new Date(action.dueDate) < new Date() && action.status !== 'DONE';

                    return (
                      <div
                        key={action.id}
                        onClick={() => setSelectedAction({ ...action, point })} // Öppna ActionDrawer och skicka med Point-info
                        className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          {/* Markera som klar - Checkbox knapp */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Hindra att drawern öppnas
                              const newStatus = action.status === 'DONE' ? 'IN_PROGRESS' : 'DONE';
                              quickUpdateActionMutation.mutate({ id: action.id, status: newStatus });
                            }}
                            className={`w-6 h-6 rounded border flex items-center justify-center transition-colors 
                     ${action.status === 'DONE' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-indigo-500 text-transparent hover:text-indigo-200'}`}
                          >
                            <CheckCircle2 size={16} />
                          </button>

                          <div>
                            <h4 className={`font-bold transition-colors ${action.status === 'DONE' ? 'text-slate-500 line-through' : 'text-slate-800 group-hover:text-indigo-700'}`}>
                              {action.title}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                              <span className="flex items-center gap-1"><User size={14} /> {action.assignedTo}</span>
                              <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-bold' : ''}`}>
                                <Calendar size={14} /> {new Date(action.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${action.status === 'DONE' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                            action.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                              'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                            {translateStatus(action.status)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

        </div>
      </div>

      {/* --- MODAL: CREATE POINT --- */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsSettingsOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 p-6"
            >
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-800">Systeminställningar</h2>
                <button onClick={() => setIsSettingsOpen(false)}><X size={24} className="text-slate-400" /></button>
              </div>

              <form onSubmit={handleUpdateSystem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Systemnamn</label>
                  <input name="name" defaultValue={system.name} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Beskrivning</label>
                  <textarea name="description" rows="3" defaultValue={system.description} className="w-full p-2 border rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Systemägare</label>
                    <input name="ownerName" defaultValue={system.ownerName} className="w-full p-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input name="ownerEmail" defaultValue={system.ownerEmail} className="w-full p-2 border rounded-lg" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Resursgrupp</label>
                  <input name="resourceGroup" defaultValue={system.resourceGroup} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select name="status" defaultValue={system.status} className="w-full p-2 border rounded-lg bg-white">
                    <option value="ACTIVE">Aktiv Förvaltning</option>
                    <option value="MAINTENANCE">Underhållsläge</option>
                    <option value="RETIRED">Avvecklad</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsSettingsOpen(false)} className="px-4 py-2 text-slate-600 font-medium">Avbryt</button>
                  <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg flex items-center gap-2">
                    <Save size={18} /> Spara ändringar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {isMeetingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsMeetingModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 p-6"
            >
              <h2 className="text-xl font-bold text-slate-800 mb-4">Boka Förvaltningsmöte</h2>
              <form onSubmit={handleCreateMeetingSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Mötesnamn</label>
                  <input
                    name="title"
                    required
                    defaultValue="Förvaltningsmöte"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Datum & Tid</label>
                  <input
                    name="date"
                    type="datetime-local"
                    required
                    defaultValue={new Date().toISOString().slice(0, 16)} // Default till "nu"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button type="button" onClick={() => setIsMeetingModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Avbryt</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg">
                    Boka Möte
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {isUpgradeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsUpgradeModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 p-6"
            >
              <h2 className="text-xl font-bold text-slate-800 mb-4">Planera Uppgradering</h2>
              <form onSubmit={handleCreateUpgrade} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Version</label>
                    <input name="version" required placeholder="t.ex. 2.0" className="w-full p-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Planerat Datum</label>
                    <input name="plannedDate" type="date" className="w-full p-2 border rounded-lg" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Titel</label>
                  <input name="title" required placeholder="Vad ska göras?" className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Beskrivning</label>
                  <textarea name="description" rows="3" className="w-full p-2 border rounded-lg" placeholder="Detaljer..." />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="downtime" id="dt" className="w-4 h-4" />
                  <label htmlFor="dt" className="text-sm text-slate-700">Kräver nertid</label>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button type="button" onClick={() => setIsUpgradeModalOpen(false)} className="px-4 py-2 text-slate-600">Avbryt</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Spara</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
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
      <ActionDrawer
        action={selectedAction}
        systemName={system.name}
        isOpen={!!selectedAction}
        onClose={() => setSelectedAction(null)}
      />
    </div>
  );
}