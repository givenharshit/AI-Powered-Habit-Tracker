import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  format,
  parseISO,
  subDays,
  addDays,
  isToday,
  isFuture,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Flame,
  Clock,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';

export const TrackingPage = () => {
  const { refreshKey, triggerRefresh } = useOutletContext();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchDataForDate = async () => {
    try {
      setLoading(true);
      const [habitsRes, compsRes] = await Promise.all([
        api.get(`/habits?date=${selectedDate}`),
        api.get(`/habits/completions?date=${selectedDate}`),
      ]);

      if (habitsRes.data.success) setHabits(habitsRes.data.habits);
      if (compsRes.data.success) setCompletions(compsRes.data.completions);
    } catch (err) {
      console.error('Failed to load tracking data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataForDate();
  }, [selectedDate, refreshKey]);

  const handleToggleHabit = async (habitId) => {
    try {
      setActionLoadingId(habitId);
      await api.post(`/habits/${habitId}/toggle`, { date: selectedDate });
      await fetchDataForDate();
      triggerRefresh();
    } catch (err) {
      console.error('Failed to toggle habit:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePrevDay = () => {
    const cur = parseISO(selectedDate);
    setSelectedDate(format(subDays(cur, 1), 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    const cur = parseISO(selectedDate);
    setSelectedDate(format(addDays(cur, 1), 'yyyy-MM-dd'));
  };

  const handleJumpToToday = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const completedHabitIds = new Set(completions.map((c) => c.habit?._id || c.habit));

  const parsedDate = parseISO(selectedDate);
  const dayOfWeek = parsedDate.getDay(); // 0 = Sun

  const scheduledHabits = habits.filter((h) => {
    if (h.frequency === 'daily') return true;
    return Array.isArray(h.scheduledDays) && h.scheduledDays.includes(dayOfWeek);
  });

  const completedCount = scheduledHabits.filter((h) => completedHabitIds.has(h._id)).length;
  const scheduledCount = scheduledHabits.length;
  const completionRate = scheduledCount > 0 ? Math.round((completedCount / scheduledCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header and Date Navigation */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Daily Habit Tracking</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Record checkmarks, review historical logs, and maintain your streak momentum
          </p>
        </div>

        {/* Date Navigator Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/70">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleNextDay}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isToday(parsedDate) && (
            <button
              onClick={handleJumpToToday}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100 transition-colors"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Daily Progress Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Day Overview
          </span>
          <h3 className="text-lg font-bold text-slate-900 mt-0.5">
            {format(parsedDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isToday(parsedDate)
              ? 'Today’s active session'
              : isFuture(parsedDate)
              ? 'Future date'
              : 'Historical log'}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div>
            <span className="text-[11px] font-medium text-slate-500">Scheduled Habits</span>
            <div className="text-xl font-extrabold text-slate-900">{scheduledCount}</div>
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500">Completed</span>
            <div className="text-xl font-extrabold text-emerald-600">{completedCount}</div>
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500">Success Rate</span>
            <div className="text-xl font-extrabold text-slate-900">{completionRate}%</div>
          </div>
        </div>
      </div>

      {/* Habit Checklist */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-4">Scheduled For This Day</h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : scheduledHabits.length > 0 ? (
          <div className="space-y-3">
            {scheduledHabits.map((habit) => {
              const isCompleted = completedHabitIds.has(habit._id);
              const stats = habit.streakStats || { currentStreak: 0, longestStreak: 0 };

              return (
                <div
                  key={habit._id}
                  className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                    isCompleted
                      ? 'bg-emerald-50/50 border-emerald-200/80'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button
                      onClick={() => handleToggleHabit(habit._id)}
                      disabled={actionLoadingId === habit._id}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'border-2 border-slate-300 hover:border-emerald-500 bg-white'
                      }`}
                    >
                      {isCompleted && <CheckCircle2 className="w-5 h-5 stroke-[3]" />}
                    </button>

                    <div className="min-w-0">
                      <h4
                        className={`text-sm font-bold truncate ${
                          isCompleted ? 'text-emerald-950 line-through' : 'text-slate-900'
                        }`}
                      >
                        {habit.title}
                      </h4>
                      <p className="text-xs text-slate-500 capitalize">
                        {habit.targetValue} {habit.targetUnit} • {habit.category}
                        {habit.description && ` — ${habit.description}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200/60">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      <span>{stats.currentStreak} day streak</span>
                    </div>

                    <button
                      onClick={() => handleToggleHabit(habit._id)}
                      disabled={actionLoadingId === habit._id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isCompleted ? 'Completed' : 'Mark Done'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="text-sm font-medium text-slate-600">No habits scheduled for this day.</p>
            <p className="text-xs text-slate-400 mt-1">
              Select another day or adjust habit frequency to include this weekday.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
