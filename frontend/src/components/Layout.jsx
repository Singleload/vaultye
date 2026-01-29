import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Server, 
  Users, 
  LogOut, 
  Shield 
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Basmeny
  const menuItems = [
    { icon: LayoutDashboard, label: 'Översikt', path: '/' },
    { icon: Server, label: 'System', path: '/systems' }
  ];

  // Lägg till Admin-länk dynamiskt om användaren är ADMIN
  if (user?.role === 'ADMIN') {
    menuItems.push({ icon: Users, label: 'Användare', path: '/admin/users' });
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-xl shadow-slate-200/50 z-50">
        
        {/* Header / Logo */}
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center">
              <span className="text-white font-bold text-xl">W</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800 leading-none">Waulty</h1>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Core Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 mt-6 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative",
                    isActive 
                      ? "bg-indigo-50 text-indigo-700 font-bold shadow-sm ring-1 ring-indigo-100" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium"
                  )}
                >
                  {/* Active Indicator Line (Estetisk detalj) */}
                  {isActive && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-600 rounded-r-full" 
                    />
                  )}
                  
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"} />
                  <span>{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            
            {/* User Info */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-slate-800 truncate" title={user?.name}>
                    {user?.name}
                  </p>
                  {user?.role === 'ADMIN' && (
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                       <Shield size={10} /> Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate" title={user?.email}>
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-slate-100 hover:border-red-100 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span>Logga ut</span>
            </button>
          </div>
        </div>

      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <div className="max-w-7xl mx-auto p-8 pb-20">
          {children}
        </div>
      </main>
    </div>
  );
}