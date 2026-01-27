// src/components/Layout.jsx
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Server, 
  Calendar, 
  ArrowUpCircle, 
  Settings, 
  LogOut 
} from 'lucide-react';
import clsx from 'clsx';

const menuItems = [
  { icon: LayoutDashboard, label: 'Översikt', path: '/' },
  { icon: Server, label: 'System', path: '/systems' }
];

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">DA</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">Dennis Auto</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-1">Systemförvaltning 2.0</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200",
                    isActive 
                      ? "bg-indigo-50 text-indigo-700 font-medium shadow-sm" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-600 w-full transition-colors rounded-xl hover:bg-red-50">
            <LogOut size={20} />
            <span>Logga ut</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}