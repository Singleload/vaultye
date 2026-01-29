import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Trash2, UserPlus, Shield, Check, X, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- API ---
const getUsers = async () => (await axios.get('http://localhost:3000/api/users')).data;
const createUser = async (data) => (await axios.post('http://localhost:3000/api/users', data)).data;
const updateUser = async ({id, data}) => (await axios.patch(`http://localhost:3000/api/users/${id}`, data)).data;
const deleteUser = async (id) => (await axios.delete(`http://localhost:3000/api/users/${id}`));

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const { data: users, isLoading } = useQuery({ queryKey: ['users'], queryFn: getUsers });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => { queryClient.invalidateQueries(['users']); setIsModalOpen(false); }
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => { queryClient.invalidateQueries(['users']); setIsModalOpen(false); setEditingUser(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => queryClient.invalidateQueries(['users'])
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      name: fd.get('name'),
      email: fd.get('email'),
      role: fd.get('role'),
      isActive: fd.get('isActive') === 'on',
      password: fd.get('password') || undefined // Skicka bara om det är ifyllt
    };

    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Användarhantering</h1>
        <button onClick={() => { setEditingUser(null); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <UserPlus size={18} /> Skapa Användare
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
            <tr>
              <th className="p-4">Namn</th>
              <th className="p-4">Email</th>
              <th className="p-4">Roll</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Åtgärd</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users?.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="p-4 font-medium">{u.name}</td>
                <td className="p-4 text-slate-500">{u.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {u.role === 'ADMIN' ? <span className="flex items-center gap-1"><Shield size={12}/> Admin</span> : 'Förvaltare'}
                  </span>
                </td>
                <td className="p-4">
                  {u.isActive ? <span className="text-emerald-600 font-bold text-xs flex items-center gap-1"><Check size={14}/> Aktiv</span> 
                             : <span className="text-red-500 font-bold text-xs flex items-center gap-1"><X size={14}/> Inaktiv</span>}
                </td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <button onClick={() => { setEditingUser(u); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => { if(confirm(`Radera ${u.name}? All data försvinner.`)) deleteMutation.mutate(u.id); }}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL (Create/Edit) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">{editingUser ? 'Redigera Användare' : 'Ny Användare'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input required name="name" defaultValue={editingUser?.name} placeholder="Namn" className="w-full p-2 border rounded" />
                <input required type="email" name="email" defaultValue={editingUser?.email} placeholder="Email" className="w-full p-2 border rounded" />
                <input type="password" name="password" placeholder={editingUser ? "Nytt lösenord (lämna tomt för att behålla)" : "Lösenord"} className="w-full p-2 border rounded" required={!editingUser} />
                
                <div className="flex gap-4">
                   <select name="role" defaultValue={editingUser?.role || 'MANAGER'} className="w-full p-2 border rounded bg-white">
                     <option value="MANAGER">Systemförvaltare</option>
                     <option value="ADMIN">Administratör</option>
                   </select>
                   <div className="flex items-center gap-2">
                     <input type="checkbox" name="isActive" defaultChecked={editingUser ? editingUser.isActive : true} className="w-5 h-5" />
                     <label>Aktiv</label>
                   </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2">Avbryt</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Spara</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}