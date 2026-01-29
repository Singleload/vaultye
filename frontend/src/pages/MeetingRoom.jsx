import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
  ArrowLeft, Save, Plus, Users, FileText, 
  Calendar, Loader2, CheckCircle2, ListTodo, CheckSquare 
} from 'lucide-react';
import { motion } from 'framer-motion';

// --- API ---
const fetchMeeting = async (id) => {
  const res = await axios.get(`http://localhost:3000/api/meetings/${id}`);
  return res.data;
};

const updateMeetingApi = async ({ id, data }) => {
  await axios.patch(`http://localhost:3000/api/meetings/${id}`, data);
};

const createPointApi = async (data) => {
  await axios.post('http://localhost:3000/api/points', data);
};

const fetchSystemActions = async (systemId) => {
  const res = await axios.get(`http://localhost:3000/api/actions/system/${systemId}`);
  return res.data;
};

const updateActionApi = async ({ id, status }) => {
  await axios.patch(`http://localhost:3000/api/actions/${id}`, { status });
};

export default function MeetingRoom() {
  const { id, meetingId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State
  const [sidebarTab, setSidebarTab] = useState('new'); // 'new' | 'followup'
  const [newPointTitle, setNewPointTitle] = useState('');

  // Queries
  const { data: meeting, isLoading } = useQuery({
    queryKey: ['meeting', meetingId],
    queryFn: () => fetchMeeting(meetingId)
  });

  // Hämta actions för systemet (för uppföljning)
  const { data: actions, refetch: refetchActions } = useQuery({
    queryKey: ['actions', meeting?.systemId],
    queryFn: () => fetchSystemActions(meeting.systemId),
    enabled: !!meeting?.systemId
  });

  // Mutations
  const updateMeetingMutation = useMutation({
    mutationFn: updateMeetingApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['meeting', meetingId]);
      // Man kan lägga till en toast här om man vill
    }
  });

  const createPointMutation = useMutation({
    mutationFn: createPointApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['meeting', meetingId]);
      setNewPointTitle('');
    }
  });

  const updateActionMutation = useMutation({
    mutationFn: updateActionApi,
    onSuccess: () => {
      refetchActions();
    }
  });

  const handleSaveNotes = (e) => {
    e.preventDefault();
    // Hämta värden direkt från formuläret via ID eller ref är inte idealiskt i React, 
    // men för att spara "allt" utan state på varje tangenttryckning (prestanda) kör vi FormData här.
    const form = document.getElementById('notes-form');
    const fd = new FormData(form);
    
    updateMeetingMutation.mutate({
      id: meetingId,
      data: {
        agenda: fd.get('agenda'),
        summary: fd.get('summary')
      }
    });
  };

  if (isLoading) return <div className="flex h-screen justify-center items-center"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  return (
    // Container som fyller höjden minus layoutens padding/header ungefär
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

        <div className="flex items-center gap-2">
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
        <div className="flex-1 p-8 overflow-y-auto bg-white">
          <form id="notes-form" className="space-y-8 max-w-4xl mx-auto">
            
            {/* Agenda Section */}
            <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 transition-shadow focus-within:shadow-md focus-within:border-indigo-100 focus-within:bg-white">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">
                <FileText size={18} className="text-indigo-500"/> Dagordning
              </label>
              <textarea 
                name="agenda" 
                defaultValue={meeting.agenda}
                className="w-full bg-transparent p-4 rounded-xl border border-slate-200 min-h-[150px] shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed text-slate-700 font-medium placeholder:text-slate-400 resize-y"
                placeholder="Skriv punkter att ta upp här..." 
              />
            </div>

            {/* Summary/Minutes Section */}
            <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 transition-shadow focus-within:shadow-md focus-within:border-indigo-100 focus-within:bg-white">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">
                <Users size={18} className="text-indigo-500"/> Mötesprotokoll / Beslut
              </label>
              <textarea 
                name="summary" 
                defaultValue={meeting.summary}
                className="w-full bg-transparent p-4 rounded-xl border border-slate-200 min-h-[400px] shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed text-slate-700 font-medium placeholder:text-slate-400 resize-y"
                placeholder="Vad diskuterades? Vad bestämdes?" 
              />
            </div>

          </form>
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
                   <form onSubmit={(e) => { 
                      e.preventDefault(); 
                      if(newPointTitle.trim()) {
                        createPointMutation.mutate({ 
                          title: newPointTitle, 
                          description: 'Skapad under möte', 
                          systemId: meeting.systemId, 
                          origin: 'Möte', 
                          priority: 'MEDIUM', 
                          meetingId: meeting.id 
                        });
                      }
                   }}>
                     <input 
                       autoFocus 
                       value={newPointTitle} 
                       onChange={(e) => setNewPointTitle(e.target.value)} 
                       placeholder="Vad gäller saken?" 
                       className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none mb-3 font-medium placeholder:text-slate-400" 
                     />
                     <button 
                       type="submit" 
                       disabled={!newPointTitle.trim() || createPointMutation.isPending}
                       className="w-full bg-slate-900 text-white py-3 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-lg active:scale-95 disabled:opacity-50"
                     >
                       {createPointMutation.isPending ? 'Sparar...' : 'Lägg till punkt'}
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
                      className={`p-4 rounded-2xl border shadow-sm transition-all ${
                        action.status === 'DONE' 
                          ? 'bg-slate-50 border-slate-100 opacity-60' 
                          : 'bg-white border-slate-100'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <h4 className={`font-bold text-sm leading-tight ${action.status === 'DONE' ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                          {action.title}
                        </h4>
                        
                        {action.status !== 'DONE' && new Date(action.dueDate) < new Date() && (
                          <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                            FÖRSENAD
                          </span>
                        )}
                      </div>
                      
                      <div className="text-xs text-slate-500 mb-3 space-y-1 font-medium">
                        <p>Ansvarig: <span className="text-slate-700">{action.assignedTo}</span></p>
                        <p>Deadline: {new Date(action.dueDate).toLocaleDateString()}</p>
                      </div>

                      {action.status !== 'DONE' ? (
                        <button 
                          onClick={() => updateActionMutation.mutate({ id: action.id, status: 'DONE' })} 
                          className="w-full bg-emerald-50 text-emerald-700 border border-emerald-100 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <CheckSquare size={14} /> Markera klar
                        </button>
                      ) : (
                        <div className="flex items-center justify-center gap-1 text-xs font-bold text-emerald-600 py-2 bg-emerald-50/50 rounded-xl">
                          <CheckCircle2 size={14} /> Klar
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}