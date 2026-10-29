import React, { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Menu, X, Sparkles, CheckSquare, Calendar, Layers, BarChart3 } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Navbar = ({ onOpenAddModal }) => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const todayFormatted = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 py-3.5">
      <div className="flex items-center justify-between">
        {/* Left: Mobile Menu Button & Date */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div>
            <h1 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>{todayFormatted}</span>
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              Welcome back, <span className="font-medium text-slate-700">{user?.name}</span>
            </p>
          </div>
        </div>

        {/* Right: AI Coach Badge & Add Habit CTA */}
        <div className="flex items-center gap-3">
          <NavLink
            to="/ai-coach"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI-Powered Habit Tracker</span>
          </NavLink>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Habit</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden pt-4 pb-2 border-t border-slate-100 mt-3 space-y-1">
          <NavLink
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <CheckSquare className="w-4 h-4 text-emerald-600" /> Dashboard
          </NavLink>
          <NavLink
            to="/habits"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Layers className="w-4 h-4 text-emerald-600" /> My Habits
          </NavLink>
          <NavLink
            to="/tracking"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Calendar className="w-4 h-4 text-emerald-600" /> Daily Tracking
          </NavLink>
          <NavLink
            to="/analytics"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <BarChart3 className="w-4 h-4 text-emerald-600" /> Analytics & Heatmap
          </NavLink>
          <NavLink
            to="/ai-coach"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-indigo-700 hover:bg-indigo-50"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" /> AI Habit Coach
          </NavLink>
        </div>
      )}
    </header>
  );
};
