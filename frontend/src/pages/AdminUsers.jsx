import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Trash2, UserPlus, Shield, Check, X, Edit2, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- API ---
const getUsers = async () => {
  const res = await axios.get('http://localhost:3000/api/users');
  return res.data;
};

const createUser = async (data) => {
  const res = await axios.post('http://localhost:3000/api/users', data);
  return res.data;
};

const updateUser = async ({id, data}) => {
  const res = await axios.patch(`http://localhost:3000/api/users/${id}`, data);
  return res.data;
};

const deleteUser = async (id) => {
  await axios.delete(`http://localhost:3000/api/users/${id}`);
};

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const { data: users, isLoading } = useQuery({ 
    queryKey: ['users'], 
    queryFn: getUsers 
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setIsModalOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setIsModalOpen(false);
      setEditingUser(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    
    const data = {
      name: fd.get('name'),
      email: fd.get('email'),
      role: fd.get('role'),
      isActive: fd.get('isActive') === 'on',
      // Skicka bara med password om det är ifyllt (eller ny användare)
      password: fd.get('password') || undefined
    };

    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  if (isLoading) return <div className="flex h-96 justify-center items-center"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Användare</h1>
          <p className="text-slate-500 mt-2 text-lg">Hantera åtkomst och roller i plattformen.</p>
        </div>
        <button 
          onClick={openCreate}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200 flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <UserPlus size={20} /> 
          Skapa Användare
        </button>
      </div>

      {/* Users Table Card */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-100">
            <tr>
              <th className="p-6 pl-8">Namn</th>
              <th className="p-6">Email</th>
              <th className="p-6">Roll</th>
              <th className="p-6">Status</th>
              <th className="p-6 text-right pr-8">Åtgärd</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users?.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="p-6 pl-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                      {u.name[0]}
                    </div>
                    <span className="font-bold text-slate-800 text-base">{u.name}</span>
                  </div>
                </td>
                <td className="p-6 text-slate-500 font-medium">{u.email}</td>
                <td className="p-6">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 ${
                    u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                  }`}>
                    {u.role === 'ADMIN' ? <Shield size={12}/> : <User size={12}/>}
                    {u.role === 'ADMIN' ? 'Admin' : 'Förvaltare'}
                  </span>
                </td>
                <td className="p-6">
                  {u.isActive ? (
                    <span className="text-emerald-700 font-bold text-xs flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 w-fit">
                      <Check size={12}/> Aktiv
                    </span>
                  ) : (
                    <span className="text-red-700 font-bold text-xs flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 w-fit">
                      <X size={12}/> Inaktiv
                    </span>
                  )}
                </td>
                <td className="p-6 text-right pr-8">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEdit(u)} 
                      className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                      title="Redigera"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => { if(confirm(`Radera ${u.name}?`)) deleteMutation.mutate(u.id); }} 
                      className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Radera"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users?.length === 0 && (
           <div className="p-10 text-center text-slate-400 italic">Inga användare hittades.</div>
        )}
      </div>

      {/* CREATE/EDIT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md" onClick={() => setIsModalOpen(false)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl" 
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-6 text-slate-800">
                {editingUser ? 'Redigera Användare' : 'Ny Användare'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="font-bold text-sm text-slate-700 mb-1 block">Namn</label>
                  <input 
                    required 
                    name="name" 
                    defaultValue={editingUser?.name} 
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    placeholder="Förnamn Efternamn"
                  />
                </div>
                
                <div>
                  <label className="font-bold text-sm text-slate-700 mb-1 block">Email</label>
                  <input 
                    required 
                    type="email" 
                    name="email" 
                    defaultValue={editingUser?.email} 
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    placeholder="namn@foretag.se"
                  />
                </div>

                <div>
                  <label className="font-bold text-sm text-slate-700 mb-1 block">
                    Lösenord {editingUser && <span className="font-normal text-slate-400 ml-1">(Lämna tomt för att behålla)</span>}
                  </label>
                  <input 
                    type="password" 
                    name="password" 
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    required={!editingUser}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                   <div>
                     <label className="font-bold text-sm text-slate-700 mb-1 block">Roll</label>
                     <select 
                       name="role" 
                       defaultValue={editingUser?.role || 'MANAGER'} 
                       className="w-full p-3 border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                     >
                       <option value="MANAGER">Förvaltare</option>
                       <option value="ADMIN">Admin</option>
                     </select>
                   </div>
                   
                   <div className="flex items-center gap-3 pt-6 pl-2">
                     <input 
                       type="checkbox" 
                       name="isActive" 
                       defaultChecked={editingUser ? editingUser.isActive : true} 
                       className="w-6 h-6 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                     />
                     <label className="font-bold text-slate-700">Aktivt konto</label>
                   </div>
                </div>

                <div className="flex justify-end gap-3 pt-6">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="px-5 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    Avbryt
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                  >
                    Spara
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}