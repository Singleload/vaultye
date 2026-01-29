import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
  ArrowLeft, Save, Plus, Users, FileText, 
  Calendar, Loader2, CheckCircle2, ListTodo, 
  Trash2, X, UserPlus, History 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Komponenter
import ActionDrawer from '../components/ActionDrawer';

// --- API ---
const fetchMeeting = async (id) => {
  const res = await axios.get(`http://localhost:3000/api/meetings/${id}`);
  return res.data;
};

const updateMeetingApi = async ({ id, data }) => {
  await axios.patch(`http://localhost:3000/api/meetings/${id}`, data);
};

const deleteMeetingApi = async (id) => {
  await axios.delete(`http://localhost:3000/api/meetings/${id}`);
};

const createPointApi = async (data) => {
  await axios.post('http://localhost:3000/api/points', data);
};

const fetchSystemActions = async (systemId) => {
  const res = await axios.get(`http://localhost:3000/api/actions/system/${systemId}`);
  return res.data;
};

// --- Helpers för LocalStorage (Spara deltagare) ---
const getRecentAttendees = () => {
  const stored = localStorage.getItem('waulty_recent_attendees');
  return stored ? JSON.parse(stored) : [];
};

const saveRecentAttendee = (name) => {
  let recent = getRecentAttendees();
  if (!recent.includes(name)) {
    recent = [name, ...recent].slice(0, 10); // Spara max 10 senaste
    localStorage.setItem('waulty_recent_attendees', JSON.stringify(recent));
  }
};

export default function MeetingRoom() {
  const { id, meetingId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State
  const [sidebarTab, setSidebarTab] = useState('new'); // 'new' | 'followup'
  const [newPointTitle, setNewPointTitle] = useState('');
  const [selectedAction, setSelectedAction] = useState(null); // För ActionDrawer

  // Form State (för att hantera editering live)
  const [agenda, setAgenda] = useState('');
  const [summary, setSummary] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [newAttendeeInput, setNewAttendeeInput] = useState('');
  const [recentAttendees, setRecentAttendees] = useState([]);

  // Queries
  const { data: meeting, isLoading } = useQuery({
    queryKey: ['meeting', meetingId],
    queryFn: () => fetchMeeting(meetingId)
  });

  const { data: actions } = useQuery({
    queryKey: ['actions', meeting?.systemId],
    queryFn: () => fetchSystemActions(meeting.systemId),
    enabled: !!meeting?.systemId
  });

  // Synka local state när data laddas
  useEffect(() => {
    if (meeting) {
      setAgenda(meeting.agenda || '');
      setSummary(meeting.summary || '');
      setAttendees(meeting.attendees || []);
    }
    setRecentAttendees(getRecentAttendees());
  }, [meeting]);

  // Mutations
  const updateMeetingMutation = useMutation({
    mutationFn: updateMeetingApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['meeting', meetingId]);
    }
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: deleteMeetingApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['system', id]);
      navigate(`/systems/${id}`);
    }
  });

  const createPointMutation = useMutation({
    mutationFn: createPointApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['meeting', meetingId]);
      setNewPointTitle('');
    }
  });

  // --- Handlers ---

  const handleSaveNotes = async () => {
    // Spara Agenda, Summary och Attendees
    await updateMeetingMutation.mutateAsync({
      id: meetingId,
      data: { agenda, summary, attendees }
    });
  };

  const handleAddPointAndSave = async (e) => {
    e.preventDefault();
    if (!newPointTitle.trim()) return;

    // 1. Spara först mötet så vi inte tappar texten
    await handleSaveNotes();

    // 2. Skapa punkten
    createPointMutation.mutate({ 
      title: newPointTitle, 
      description: 'Skapad under möte', 
      systemId: meeting.systemId, 
      origin: 'Möte', 
      priority: 'MEDIUM', 
      meetingId: meeting.id 
    });
  };

  const handleAddAttendee = (name) => {
    if (name && !attendees.includes(name)) {
      setAttendees([...attendees, name]);
      saveRecentAttendee(name);
      setRecentAttendees(getRecentAttendees()); // Uppdatera listan
    }
    setNewAttendeeInput('');
  };

  const handleRemoveAttendee = (name) => {
    setAttendees(attendees.filter(a => a !== name));
  };

  const handleDeleteMeeting = () => {
    if (confirm('Är du säker på att du vill radera detta möte permanent?')) {
      deleteMeetingMutation.mutate(meetingId);
    }
  };

  if (isLoading) return <div className="flex h-screen justify-center items-center"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      
      {/* --- HEADER --- */}
      <div className="bg-white border-b border-slate-100 p-6 flex justify-between items-center shrink-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/systems/${id}`)}
            className="p-3 hover:bg-slate-50 rounded-2xl text-slate-500 transition-colors border border-transparent hover:border-slate-200"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              {meeting.title}
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-0.5">
              {new Date(meeting.date).toLocaleDateString()} • {meeting.system.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleDeleteMeeting}
            className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
            title="Radera möte"
          >
            <Trash2 size={20} />
          </button>
          
          <button 
            onClick={handleSaveNotes}
            disabled={updateMeetingMutation.isPending}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
          >
             {updateMeetingMutation.isPending ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} 
             Spara Anteckningar
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT SPLIT --- */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT COLUMN: NOTES (Scrollable) */}
        <div className="flex-1 p-8 overflow-y-auto bg-white custom-scrollbar">
          <div className="space-y-8 max-w-4xl mx-auto">
            
            {/* Attendees Section */}
            <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 transition-shadow focus-within:shadow-md focus-within:border-indigo-100 focus-within:bg-white">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">
                <Users size={18} className="text-indigo-500"/> Deltagare
              </label>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {attendees.map(a => (
                  <span key={a} className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
                    {a}
                    <button onClick={() => handleRemoveAttendee(a)} className="text-slate-400 hover:text-red-500"><X size={14}/></button>
                  </span>
                ))}
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleAddAttendee(newAttendeeInput); }} 
                  className="flex items-center"
                >
                  <input 
                    value={newAttendeeInput}
                    onChange={(e) => setNewAttendeeInput(e.target.value)}
                    placeholder="+ Lägg till"
                    className="bg-transparent border-none outline-none text-sm font-medium text-slate-600 placeholder:text-slate-400 w-32 focus:w-48 transition-all"
                  />
                </form>
              </div>

              {/* Quick Select / Recent */}
              {recentAttendees.length > 0 && (
                <div className="pt-3 border-t border-slate-200/50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <History size={10} /> Snabba val
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recentAttendees.filter(name => !attendees.includes(name)).map(name => (
                      <button 
                        key={name}
                        onClick={() => handleAddAttendee(name)}
                        className="text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors border border-transparent hover:border-indigo-100"
                      >
                        + {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Agenda Section */}
            <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 transition-shadow focus-within:shadow-md focus-within:border-indigo-100 focus-within:bg-white">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">
                <FileText size={18} className="text-indigo-500"/> Dagordning
              </label>
              <textarea 
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                className="w-full bg-transparent p-4 rounded-xl border border-slate-200 min-h-[150px] shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed text-slate-700 font-medium placeholder:text-slate-400 resize-y"
                placeholder="Skriv punkter att ta upp här..." 
              />
            </div>

            {/* Summary/Minutes Section */}
            <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 transition-shadow focus-within:shadow-md focus-within:border-indigo-100 focus-within:bg-white">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">
                <FileText size={18} className="text-indigo-500"/> Mötesprotokoll / Beslut
              </label>
              <textarea 
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full bg-transparent p-4 rounded-xl border border-slate-200 min-h-[400px] shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed text-slate-700 font-medium placeholder:text-slate-400 resize-y"
                placeholder="Vad diskuterades? Vad bestämdes?" 
              />
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: SIDEBAR (Tools) */}
        <div className="w-[400px] flex flex-col border-l border-slate-100 bg-slate-50/50">
          
          {/* Sidebar Tabs */}
          <div className="flex border-b border-slate-200 bg-white sticky top-0 z-10">
            <button 
              onClick={() => setSidebarTab('new')}
              className={`flex-1 py-4 text-sm font-bold transition-all border-b-2 ${
                sidebarTab === 'new' 
                  ? 'text-indigo-600 border-indigo-600 bg-indigo-50/10' 
                  : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Plus size={16}/> Ny Punkt
              </div>
            </button>
            <button 
              onClick={() => setSidebarTab('followup')}
              className={`flex-1 py-4 text-sm font-bold transition-all border-b-2 ${
                sidebarTab === 'followup' 
                  ? 'text-indigo-600 border-indigo-600 bg-indigo-50/10' 
                  : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <ListTodo size={16}/> Uppföljning 
                {actions?.filter(a => a.status !== 'DONE').length > 0 && (
                  <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md text-[10px]">
                    {actions.filter(a => a.status !== 'DONE').length}
                  </span>
                )}
              </div>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            
            {/* TAB: NEW POINT */}
            {sidebarTab === 'new' && (
              <>
                 <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                   <h3 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">
                     <Plus size={16} className="text-slate-400"/> Snabbregistrera behov
                   </h3>
                   <form onSubmit={handleAddPointAndSave}>
                     <input 
                       autoFocus 
                       value={newPointTitle} 
                       onChange={(e) => setNewPointTitle(e.target.value)} 
                       placeholder="Vad gäller saken?" 
                       className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none mb-3 font-medium placeholder:text-slate-400" 
                     />
                     <button 
                       type="submit" 
                       disabled={!newPointTitle.trim() || createPointMutation.isPending || updateMeetingMutation.isPending}
                       className="w-full bg-slate-900 text-white py-3 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-lg active:scale-95 disabled:opacity-50"
                     >
                       {(createPointMutation.isPending || updateMeetingMutation.isPending) ? 'Sparar...' : 'Spara & Lägg till punkt'}
                     </button>
                   </form>
                 </div>

                 <div className="space-y-3">
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Registrerat detta möte</h4>
                   {meeting.points?.map(p => (
                     <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={p.id} 
                        className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex justify-between items-center"
                     >
                       <p className="font-bold text-slate-800 text-sm truncate">{p.title}</p>
                       <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-lg uppercase tracking-wider">
                         {p.priority}
                       </span>
                     </motion.div>
                   ))}
                   {meeting.points?.length === 0 && (
                      <p className="text-center text-slate-400 text-sm italic mt-4 py-8 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">
                        Inga nya punkter än.
                      </p>
                   )}
                 </div>
              </>
            )}

            {/* TAB: FOLLOW UP (ACTIONS) */}
            {sidebarTab === 'followup' && (
              <div className="space-y-3">
                {actions?.length === 0 ? (
                  <p className="text-slate-500 italic text-sm text-center mt-10">Allt klart! Inga öppna åtgärder.</p> 
                ) : (
                  actions?.map(action => (
                    <motion.div 
                      layout
                      key={action.id} 
                      onClick={() => setSelectedAction(action)} // Öppna drawer
                      className={`p-4 rounded-2xl border shadow-sm transition-all cursor-pointer hover:border-indigo-200 group ${
                        action.status === 'DONE' 
                          ? 'bg-slate-50 border-slate-100 opacity-60' 
                          : 'bg-white border-slate-100'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <h4 className={`font-bold text-sm leading-tight group-hover:text-indigo-700 transition-colors ${action.status === 'DONE' ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                          {action.title}
                        </h4>
                        
                        {action.status !== 'DONE' && new Date(action.dueDate) < new Date() && (
                          <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                            FÖRSENAD
                          </span>
                        )}
                      </div>
                      
                      <div className="text-xs text-slate-500 space-y-1 font-medium">
                        <p>Ansvarig: <span className="text-slate-700">{action.assignedTo}</span></p>
                        <p>Deadline: {new Date(action.dueDate).toLocaleDateString()}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Action Drawer */}
      <ActionDrawer 
        action={selectedAction} 
        systemName={meeting.system.name} 
        managerUsername={meeting.system.managerUsername} 
        isOpen={!!selectedAction} 
        onClose={() => setSelectedAction(null)} 
      />

    </div>
  );
}