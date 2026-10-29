import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Flame,
  Trophy,
  Archive,
  RotateCcw,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import api from '../services/api';
import { HabitFormModal } from '../components/habits/HabitFormModal';

const CATEGORIES = ['all', 'productivity', 'health', 'fitness', 'learning', 'mindfulness', 'finance', 'other'];

export const HabitsPage = () => {
  const { refreshKey, triggerRefresh } = useOutletContext();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingHabit, setEditingHabit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingHabit, setDeletingHabit] = useState(null);

  const fetchHabits = async () => {
    try {
      setLoading(true);
      const res = await api.get('/habits', {
        params: {
          category: selectedCategory,
          archived: showArchived,
          search: searchTerm,
        },
      });
      if (res.data.success) {
        setHabits(res.data.habits);
      }
    } catch (err) {
      console.error('Failed to load habits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, [selectedCategory, showArchived, refreshKey]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHabits();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleToggleArchive = async (habitId) => {
    try {
      await api.patch(`/habits/${habitId}/archive`);
      fetchHabits();
      triggerRefresh();
    } catch (err) {
      console.error('Failed to toggle archive:', err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingHabit) return;
    try {
      await api.delete(`/habits/${deletingHabit._id}`);
      setDeletingHabit(null);
      fetchHabits();
      triggerRefresh();
    } catch (err) {
      console.error('Failed to delete habit:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Habit Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize, configure, and monitor your personal routines
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-emerald-600/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Habit</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search habits by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Categories Pills & Archived Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 md:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              showArchived
                ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{showArchived ? 'Showing Archived' : 'Active Only'}</span>
          </button>
        </div>
      </div>

      {/* Habit Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-slate-200/70 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : habits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {habits.map((habit) => {
            const stats = habit.streakStats || { currentStreak: 0, longestStreak: 0, completionRate: 0 };

            return (
              <div
                key={habit._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
              >
                {/* Top Accent Strip with habit color */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: habit.color || '#10B981' }}
                />

                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                      {habit.category}
                    </span>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingHabit(habit);
                          setIsEditModalOpen(true);
                        }}
                        title="Edit Habit"
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleArchive(habit._id)}
                        title={habit.isArchived ? 'Restore Habit' : 'Archive Habit'}
                        className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        {habit.isArchived ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => setDeletingHabit(habit)}
                        title="Delete Habit"
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">{habit.title}</h3>
                  {habit.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {habit.description}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {habit.frequency === 'daily'
                        ? 'Every day'
                        : `${habit.scheduledDays?.length || 0} days/week`}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">
                      {habit.targetValue} {habit.targetUnit}
                    </span>
                  </div>
                </div>

                {/* Bottom Stats: Streaks & Completion Rate */}
                <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-amber-50/70 p-2 rounded-xl border border-amber-200/50">
                      <div className="flex items-center justify-center gap-1 text-amber-700 font-bold text-sm">
                        <Flame className="w-3.5 h-3.5 text-amber-600" />
                        <span>{stats.currentStreak} d</span>
                      </div>
                      <span className="text-[10px] text-amber-600 font-medium">Current Streak</span>
                    </div>

                    <div className="bg-purple-50/70 p-2 rounded-xl border border-purple-200/50">
                      <div className="flex items-center justify-center gap-1 text-purple-700 font-bold text-sm">
                        <Trophy className="w-3.5 h-3.5 text-purple-600" />
                        <span>{stats.longestStreak} d</span>
                      </div>
                      <span className="text-[10px] text-purple-600 font-medium">Longest Streak</span>
                    </div>
                  </div>

                  {/* Rate Bar */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500 font-medium">Completion Rate</span>
                      <span className="font-bold text-slate-800">{stats.completionRate}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${stats.completionRate}%`,
                          backgroundColor: habit.color || '#10B981',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
          <Layers className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <h3 className="text-base font-bold text-slate-800">No habits found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchTerm || selectedCategory !== 'all'
              ? 'Try adjusting your search query or category filters.'
              : 'You have not created any habits yet. Start by defining your first daily routine.'}
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors"
          >
            Create Your First Habit
          </button>
        </div>
      )}

      {/* Edit Modal */}
      <HabitFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingHabit(null);
        }}
        initialData={editingHabit}
        onHabitSaved={() => {
          fetchHabits();
          triggerRefresh();
        }}
      />

      {/* Add Modal */}
      <HabitFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onHabitSaved={() => {
          fetchHabits();
          triggerRefresh();
        }}
      />

      {/* Delete Confirmation Dialog */}
      {deletingHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Delete Habit?</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-800">"{deletingHabit.title}"</span>?
              All historical completion records for this habit will be permanently deleted. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeletingHabit(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors"
              >
                Yes, Delete Habit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
