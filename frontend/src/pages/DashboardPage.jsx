import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Flame,
  Trophy,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Plus,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../services/api';
import { Heatmap } from '../components/analytics/Heatmap';

export const DashboardPage = () => {
  const { refreshKey, triggerRefresh, openAddModal } = useOutletContext();
  const [dashboard, setDashboard] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [aiInsight, setAiInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [refreshingAI, setRefreshingAI] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashRes, heatRes, aiRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/analytics/heatmap?days=90'),
        api.get('/ai/motivational'),
      ]);

      if (dashRes.data.success) setDashboard(dashRes.data.data);
      if (heatRes.data.success) setHeatmapData(heatRes.data.data);
      if (aiRes.data.success) setAiInsight(aiRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [refreshKey]);

  const handleToggleHabit = async (habitId) => {
    try {
      setActionLoadingId(habitId);
      await api.post(`/habits/${habitId}/toggle`, {});
      // Refresh dashboard
      await fetchDashboardData();
      triggerRefresh();
    } catch (err) {
      console.error('Failed to toggle habit:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRefreshAI = async () => {
    setRefreshingAI(true);
    try {
      const res = await api.get('/ai/motivational');
      if (res.data.success) setAiInsight(res.data);
    } catch (err) {
      console.error('Failed to refresh AI insight:', err);
    } finally {
      setRefreshingAI(false);
    }
  };

  if (loading && !dashboard) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-slate-200/70 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-200/70 rounded-2xl" />
          ))}
        </div>
        <div className="h-72 bg-slate-200/70 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Behavioral Coach Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-200 text-[10px] font-bold tracking-wider uppercase border border-indigo-400/30">
                Gemini AI Coach
              </span>
              <span className="text-xs text-indigo-200">Personalized Behavioral Insight</span>
            </div>
            <p className="text-sm md:text-base font-semibold leading-relaxed text-slate-100">
              {aiInsight?.message || "Build steady momentum today by starting with your smallest friction habit."}
            </p>
            {aiInsight?.quote && (
              <p className="text-xs text-indigo-200 italic">
                "{aiInsight.quote.text}" — <span className="font-medium">{aiInsight.quote.author}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={handleRefreshAI}
              disabled={refreshingAI}
              title="Regenerate Coach Insight"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshingAI ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to="/ai-coach"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full AI Coach</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Habits */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Active Habits</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{dashboard?.totalHabits || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {dashboard?.scheduledTodayCount || 0} scheduled for today
          </div>
        </div>

        {/* Today's Progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Today's Completion</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {dashboard?.todayCompletionRate || 0}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {dashboard?.completedTodayCount || 0} of {dashboard?.scheduledTodayCount || 0} completed
          </div>
        </div>

        {/* Current Active Streak */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Highest Active Streak</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {dashboard?.highestCurrentStreak || 0}{' '}
            <span className="text-xs font-semibold text-slate-400">days</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 truncate">
            {dashboard?.highestCurrentStreakHabit ? `"${dashboard.highestCurrentStreakHabit}"` : 'Keep tracking!'}
          </div>
        </div>

        {/* Longest Streak Record */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Best Streak Record</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {dashboard?.highestLongestStreak || 0}{' '}
            <span className="text-xs font-semibold text-slate-400">days</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 truncate">
            {dashboard?.highestLongestStreakHabit ? `"${dashboard.highestLongestStreakHabit}"` : 'Record to beat'}
          </div>
        </div>
      </div>

      {/* Main Grid: 7-Day Trend Chart & Today's Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Activity Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">7-Day Completion Trend</h3>
              <p className="text-xs text-slate-500">Completed vs scheduled routines over the last week</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Live MongoDB Data
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboard?.sevenDayTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="dayName" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-lg space-y-1">
                          <p className="font-bold">{data.date} ({data.dayName})</p>
                          <p className="text-emerald-400">Completed: {data.completed} / {data.scheduled}</p>
                          <p className="text-slate-300">Rate: {data.rate}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#completedGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Scheduled Habits Quick Check */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Today's Habits</h3>
              <p className="text-xs text-slate-500">
                {dashboard?.completedTodayCount || 0} of {dashboard?.scheduledTodayCount || 0} completed
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="Add Habit"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-80 pr-1">
            {dashboard?.habitMetrics && dashboard.habitMetrics.filter((h) => h.scheduledForToday).length > 0 ? (
              dashboard.habitMetrics
                .filter((h) => h.scheduledForToday)
                .map((h) => (
                  <div
                    key={h.habitId}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                      h.isCompletedToday
                        ? 'bg-emerald-50/60 border-emerald-200/80'
                        : 'bg-white border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => handleToggleHabit(h.habitId)}
                        disabled={actionLoadingId === h.habitId}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                          h.isCompletedToday
                            ? 'bg-emerald-600 text-white'
                            : 'border-2 border-slate-300 hover:border-emerald-500'
                        }`}
                      >
                        {h.isCompletedToday && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                      </button>
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-semibold truncate ${
                            h.isCompletedToday ? 'text-emerald-950 line-through' : 'text-slate-800'
                          }`}
                        >
                          {h.title}
                        </p>
                        <p className="text-[10px] text-slate-400 capitalize">
                          {h.targetValue} {h.targetUnit} • {h.category}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 text-amber-600 font-semibold text-[11px] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                      <Flame className="w-3.5 h-3.5" />
                      <span>{h.currentStreak}</span>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-500" />
                <p className="text-xs font-medium">No habits scheduled for today.</p>
                <button
                  onClick={openAddModal}
                  className="mt-2 text-xs font-semibold text-emerald-600 hover:underline"
                >
                  Create a habit now
                </button>
              </div>
            )}
          </div>

          <Link
            to="/tracking"
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-600 hover:text-emerald-600 flex items-center justify-center gap-1 transition-colors"
          >
            <span>Open Full Daily Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 90-Day Heatmap Section */}
      <Heatmap data={heatmapData} />
    </div>
  );
};
