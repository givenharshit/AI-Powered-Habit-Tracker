import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  BarChart3,
  Sparkles,
  Layers,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Habits', href: '/habits', icon: Layers },
  { name: 'Daily Tracking', href: '/tracking', icon: CheckSquare },
  { name: 'Analytics & Heatmap', href: '/analytics', icon: BarChart3 },
  { name: 'AI Habit Coach', href: '/ai-coach', icon: Sparkles, badge: 'Gemini' },
];

export const Sidebar = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 min-h-screen sticky top-0 shadow-sm">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
          <CheckSquare className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <span className="block font-bold text-sm leading-tight tracking-tight text-slate-900">
            AI Powered Habit Tracker
          </span>
          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            AI MERN
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5">
        <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Menu
        </div>
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-indigo-50 text-indigo-600 border border-indigo-200/80">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User profile & Logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0 border border-slate-300/60">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">{user?.name || 'User'}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
