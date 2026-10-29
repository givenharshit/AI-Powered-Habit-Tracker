import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Zap,
  ArrowRight,
  Flame,
  Calendar,
  Layers,
} from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Navigation */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              AI Powered Habit Tracker
            </span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
              Gemini AI
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm shadow-emerald-600/20 transition-all"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Intelligent Behavioral Habit Tracking Powered by Google Gemini</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
          Build unbreakable habits with <span className="text-emerald-600">data-driven AI coaching.</span>
        </h1>

        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          Monitor your daily routines, maintain streaks, visualize a 90-day consistency heatmap, and receive personalized 3-day recovery plans when life gets in the way.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/25 active:scale-95 transition-all text-base"
          >
            <span>Start Building Today</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold shadow-xs transition-all text-base"
          >
            Explore Live Dashboard
          </Link>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Streak Preservation Engine</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Handles daily and weekly frequencies accurately. Never penalizes you prematurely for today, recalculates reliably on historical edits, and tracks your all-time records.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Gemini AI Habit Coach</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Synthesizes your real completion history to offer tailored suggestions, weekly performance audits, and empathetic 3-day recovery plans when streaks break.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">90-Day Consistency Heatmap</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Gain GitHub-style visual feedback on your long-term momentum with full inspection of completed tasks, intensity levels, and completion percentages.
            </p>
          </div>
        </div>
      </section>

      {/* 3-Day Recovery Spotlight */}
      <section className="py-12 px-6 max-w-5xl mx-auto w-full">
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs font-semibold uppercase tracking-wider">
              Exclusive Resilience Feature
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold mt-4 mb-4 tracking-tight">
              Missed a day? Recover in 3 days without guilt.
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
              Conventional habit trackers penalize failure. AI Powered Habit Tracker’s AI analyzes what caused friction and builds an achievable 3-step restart runway to protect your long-term momentum.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 transition-colors"
            >
              Try AI Powered Habit Tracker Today <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 py-8 px-6 bg-white text-center text-xs text-slate-500">
        <p>© 2026 AI Powered Habit Tracker. Full-Stack MERN Architecture with Google Gemini AI Integration.</p>
      </footer>
    </div>
  );
};
