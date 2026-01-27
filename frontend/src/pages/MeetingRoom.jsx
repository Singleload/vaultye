import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  ArrowLeft, Save, Plus, Users, FileText,
  Calendar, Loader2, CheckCircle2, Trash2,
  ListTodo, CheckSquare
} from 'lucide-react';
import Layout from '../components/Layout'; // <--- Vi använder nu Layouten

// API Calls
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

const deleteMeetingApi = async (id) => {
  await axios.delete(`http://localhost:3000/api/meetings/${id}`);
};

const fetchSystemActions = async (systemId) => {
  const res = await axios.get(`http://localhost:3000/api/actions/system/${systemId}`);
  return res.data;
};
const updateActionApi = async ({ id, status }) => {
  await axios.patch(`http://localhost:3000/api/actions/${id}`, { status });
};

export default function MeetingRoom() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [summary, setSummary] = useState('');
  const [attendees, setAttendees] = useState('');
  const [newPointTitle, setNewPointTitle] = useState('');

  const { data: meeting, isLoading } = useQuery({
    queryKey: ['meeting', meetingId],
    queryFn: () => fetchMeeting(meetingId),
  });

  useEffect(() => {
    if (meeting) {
      setSummary(meeting.summary || '');
      setAttendees(meeting.attendees?.join(', ') || '');
    }
  }, [meeting]);

  const saveMutation = useMutation({
    mutationFn: updateMeetingApi,
    onSuccess: () => queryClient.invalidateQueries(['meeting', meetingId])
  });

  const pointMutation = useMutation({
    mutationFn: createPointApi,
    onSuccess: () => {
      setNewPointTitle('');
      queryClient.invalidateQueries(['meeting', meetingId]);
    }
  });

  const handleSave = () => {
    saveMutation.mutate({
      id: meetingId,
      data: {
        summary,
        attendees: attendees.split(',').map(s => s.trim()).filter(Boolean)
      }
    });
  };

  const handleQuickAddPoint = (e) => {
    e.preventDefault();
    if (!newPointTitle.trim()) return;

    pointMutation.mutate({
      title: newPointTitle,
      description: 'Skapad under möte via snabbregistrering.',
      origin: 'Resursgruppsmöte',
      priority: 'MEDIUM',
      systemId: meeting.systemId,
      meetingId: meeting.id
    });
  };

  const [sidebarTab, setSidebarTab] = useState('new'); // 'new' | 'followup'

  // Hämta actions
  const { data: actions, refetch: refetchActions } = useQuery({
    queryKey: ['actions', meeting?.systemId],
    queryFn: () => fetchSystemActions(meeting.systemId),
    enabled: !!meeting?.systemId // Kör bara när vi vet systemId
  });

  const updateActionMutation = useMutation({
    mutationFn: updateActionApi,
    onSuccess: () => refetchActions()
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMeetingApi,
    onSuccess: () => {
      // Gå tillbaka till systemvyn efter radering
      navigate(`/systems/${meeting.systemId}`);
    }
  });

  const handleDeleteMeeting = () => {
    if (window.confirm('Är du säker på att du vill radera mötet? Punkter kopplade till mötet kommer finnas kvar men inte längre tillhöra detta möte.')) {
      deleteMutation.mutate(meetingId);
    }
  };

  if (isLoading) return (
    <div className="flex justify-center items-center h-screen bg-slate-50">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
    </div>
  );

  return (
    // Vi omsluter inte med <Layout> här i filen om den redan ligger i App.jsx? 
    // Nej, i App.jsx ligger <Layout> runt <Routes>, så MeetingRoom renderas INUTI Layout. 
    // Vi behöver bara styla innehållet snyggt.

    <div className="space-y-6 h-[calc(100vh-4rem)] flex flex-col">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white bg-slate-100 rounded-full text-slate-500 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <span className="font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs">
                {meeting.system.name}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(meeting.date).toLocaleDateString()}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{meeting.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {saveMutation.isSuccess && <span className="text-emerald-600 text-sm font-medium flex items-center gap-1"><CheckCircle2 size={16} /> Sparat</span>}
          <button
            onClick={handleDeleteMeeting}
            className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            title="Radera möte"
          >
            <Trash2 size={20} />
          </button>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-70"
          >
            {saveMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Spara Möte
          </button>
        </div>
      </div>

      {/* Main Workspace - Split View */}
      <div className="flex gap-6 flex-1 min-h-0">

        {/* Left Column: Agenda & Protocol */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">

          {/* Attendees Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm shrink-0">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Users size={14} /> Närvarande Deltagare
            </h3>
            <input
              type="text"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              placeholder="Skriv deltagarnas namn..."
              className="w-full text-slate-800 placeholder:text-slate-400 focus:outline-none border-b border-slate-100 focus:border-indigo-500 py-1 transition-colors"
            />
          </div>

          {/* Protocol Card (Fills remaining height) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-0">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText size={14} /> Protokoll & Agenda
            </h3>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Skriv mötesanteckningar här..."
              className="flex-1 w-full bg-transparent resize-none outline-none text-slate-700 leading-relaxed font-sans placeholder:text-slate-300"
            />
          </div>
        </div>

        {/* Right Column: Quick Actions & Points */}
        <div className="w-96 flex flex-col min-h-0 border-l border-slate-200 bg-white">

          {/* Sidebar Tabs */}
          <div className="flex border-b border-slate-200 shrink-0">
            <button
              onClick={() => setSidebarTab('new')}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${sidebarTab === 'new'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Plus size={16} /> Nytt
              </div>
            </button>

            <button
              onClick={() => setSidebarTab('followup')}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${sidebarTab === 'followup'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <div className="flex items-center justify-center gap-2">
                <ListTodo size={16} />
                Uppföljning
                {actions?.length > 0 && (
                  <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full text-[10px]">
                    {actions.length}
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* TAB: NEW (DITT GAMLA INNEHÅLL) */}
          {sidebarTab === 'new' && (
            <div className="flex flex-col flex-1 gap-6 p-6 min-h-0 bg-slate-50">

              {/* Quick Add Card */}
              <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg shrink-0">
                <h3 className="font-bold mb-1">Registrera ny punkt</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Fånga upp frågor och förslag direkt.
                </p>

                <form onSubmit={handleQuickAddPoint} className="relative">
                  <input
                    autoFocus
                    type="text"
                    value={newPointTitle}
                    onChange={(e) => setNewPointTitle(e.target.value)}
                    placeholder="Vad gäller saken?"
                    className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-700 border border-slate-600 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none placeholder:text-slate-500 text-white"
                  />
                  <button
                    type="submit"
                    disabled={!newPointTitle.trim() || pointMutation.isPending}
                    className="absolute right-2 top-2 p-1.5 bg-indigo-500 hover:bg-indigo-400 rounded-lg transition-colors text-white disabled:opacity-50"
                  >
                    {pointMutation.isPending ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Plus size={18} />
                    )}
                  </button>
                </form>
              </div>

              {/* Points List */}
              <div className="flex-1 overflow-y-auto space-y-3">
                {meeting.points && meeting.points.length > 0 ? (
                  meeting.points.map((point) => (
                    <div
                      key={point.id}
                      className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-indigo-100 transition-colors group"
                    >
                      <p className="font-medium text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">
                        {point.title}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">
                          {point.priority}
                        </span>
                        <span
                          className="w-2 h-2 rounded-full bg-blue-500"
                          title="Status: Ny"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-300">
                      <Plus size={20} />
                    </div>
                    <p className="text-slate-400 text-sm">Inga punkter än.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: FOLLOW UP */}
          {sidebarTab === 'followup' && (
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Pågående Åtgärder
              </h3>

              {actions?.length === 0 ? (
                <p className="text-slate-500 italic text-sm">
                  Allt klart! Inga öppna åtgärder.
                </p>
              ) : (
                actions.map((action) => {
                  const isOverdue = new Date(action.dueDate) < new Date();

                  return (
                    <div
                      key={action.id}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-800 text-sm leading-tight">
                          {action.title}
                        </h4>
                        {isOverdue && (
                          <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                            FÖRSENAD
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 mb-3 space-y-1">
                        <p>
                          Ansvarig:{' '}
                          <span className="text-slate-700">
                            {action.assignedTo}
                          </span>
                        </p>
                        <p>
                          Klar senast:{' '}
                          {new Date(action.dueDate).toLocaleDateString()}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          updateActionMutation.mutate({
                            id: action.id,
                            status: 'DONE',
                          })
                        }
                        className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <CheckSquare size={14} /> Markera klar
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}