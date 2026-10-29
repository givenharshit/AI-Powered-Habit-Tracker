import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Award,
  AlertCircle,
  Calendar,
  Sparkles,
  Flame,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import api from '../services/api';
import { Heatmap } from '../components/analytics/Heatmap';

export const AnalyticsPage = () => {
  const navigate = useNavigate();
  const [weeklyData, setWeeklyData] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHeatmapDay, setSelectedHeatmapDay] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [weeklyRes, heatRes] = await Promise.all([
        api.get('/analytics/weekly'),
        api.get('/analytics/heatmap?days=90'),
      ]);

      if (weeklyRes.data.success) setWeeklyData(weeklyRes.data.data);
      if (heatRes.data.success) setHeatmapData(heatRes.data.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading && !weeklyData) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-slate-200/70 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64 bg-slate-200/70 rounded-2xl" />
          <div className="h-64 bg-slate-200/70 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Performance & Behavioral Analytics</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Detailed completion rates, habit-wise consistency metrics, and 90-day activity records
        </p>
      </div>

      {/* Week Over Week Comparison Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Week Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Current Week Consistency</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">
            {weeklyData?.currentWeekRate || 0}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {weeklyData?.currentWeekCompleted || 0} of {weeklyData?.currentWeekScheduled || 0} scheduled tasks completed
          </div>
        </div>

        {/* Previous Week Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Previous Week Rate</span>
          <div className="text-3xl font-extrabold text-slate-700 mt-1">
            {weeklyData?.prevWeekRate || 0}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {weeklyData?.prevWeekCompleted || 0} of {weeklyData?.prevWeekScheduled || 0} scheduled tasks completed
          </div>
        </div>

        {/* Momentum Delta */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Week-over-Week Momentum</span>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-3xl font-extrabold ${
                (weeklyData?.rateDelta || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {(weeklyData?.rateDelta || 0) >= 0 ? `+${weeklyData?.rateDelta}%` : `${weeklyData?.rateDelta}%`}
            </span>
            {(weeklyData?.rateDelta || 0) >= 0 ? (
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            ) : (
              <TrendingDown className="w-6 h-6 text-rose-600" />
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {(weeklyData?.rateDelta || 0) >= 0
              ? 'Positive trajectory maintained!'
              : 'Consistency dip detected. Recovery recommended.'}
          </div>
        </div>
      </div>

      {/* Habit Consistency Breakdown: Best vs Needing Attention */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Consistent Habits */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Most Consistent Habits</h3>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              Top Performers
            </span>
          </div>

          {weeklyData?.mostConsistent?.length > 0 ? (
            <div className="space-y-3">
              {weeklyData.mostConsistent.map((h) => (
                <div
                  key={h.habitId}
                  className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40 flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{h.title}</h4>
                    <span className="text-[11px] text-slate-500 capitalize">
                      {h.weekCompleted}/{h.weekScheduled} this week • All-time: {h.allTimeRate}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-emerald-700 bg-white px-2 py-1 rounded-lg border border-emerald-200">
                      {h.weekRate}%
                    </span>
                    <div className="flex items-center gap-1 text-xs text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/60">
                      <Flame className="w-3 h-3 text-amber-500" />
                      <span>{h.currentStreak}d</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic py-6 text-center">
              Complete more scheduled habits this week to establish top performers.
            </p>
          )}
        </div>

        {/* Habits Needing Attention & Recovery */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900">Habits Needing Attention</h3>
            </div>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              Friction Identified
            </span>
          </div>

          {weeklyData?.needsAttention?.length > 0 ? (
            <div className="space-y-3">
              {weeklyData.needsAttention.map((h) => (
                <div
                  key={h.habitId}
                  className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/40 flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{h.title}</h4>
                    <span className="text-[11px] text-slate-500 capitalize">
                      Completed {h.weekCompleted} of {h.weekScheduled} scheduled days
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-800 bg-white px-2 py-1 rounded-lg border border-amber-200">
                      {h.weekRate}%
                    </span>
                    <button
                      onClick={() => navigate('/ai-coach', { state: { recoveryHabitId: h.habitId } })}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold transition-colors"
                      title="Generate 3-Day Recovery Plan"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Recover</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic py-6 text-center">
              All active habits are performing with high consistency this week!
            </p>
          )}
        </div>
      </div>

      {/* 90-Day Heatmap with Drill-down */}
      <Heatmap data={heatmapData} onSelectDate={(day) => setSelectedHeatmapDay(day)} />
    </div>
  );
};
