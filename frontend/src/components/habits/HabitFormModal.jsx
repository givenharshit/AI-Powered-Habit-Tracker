import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import api from '../../services/api';

const CATEGORIES = [
  { id: 'productivity', label: 'Productivity' },
  { id: 'health', label: 'Health' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'learning', label: 'Learning' },
  { id: 'mindfulness', label: 'Mindfulness' },
  { id: 'finance', label: 'Finance' },
  { id: 'other', label: 'Other' },
];

const COLORS = [
  '#10B981', // emerald
  '#06B6D4', // cyan
  '#3B82F6', // blue
  '#6366F1', // indigo
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#F59E0B', // amber
  '#EF4444', // red
];

const WEEKDAYS = [
  { day: 0, label: 'S', name: 'Sun' },
  { day: 1, label: 'M', name: 'Mon' },
  { day: 2, label: 'T', name: 'Tue' },
  { day: 3, label: 'W', name: 'Wed' },
  { day: 4, label: 'T', name: 'Thu' },
  { day: 5, label: 'F', name: 'Fri' },
  { day: 6, label: 'S', name: 'Sat' },
];

export const HabitFormModal = ({ isOpen, onClose, onHabitSaved, initialData = null }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('productivity');
  const [color, setColor] = useState('#10B981');
  const [frequency, setFrequency] = useState('daily');
  const [scheduledDays, setScheduledDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [targetValue, setTargetValue] = useState(1);
  const [targetUnit, setTargetUnit] = useState('times');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setCategory(initialData.category || 'productivity');
      setColor(initialData.color || '#10B981');
      setFrequency(initialData.frequency || 'daily');
      setScheduledDays(initialData.scheduledDays || [0, 1, 2, 3, 4, 5, 6]);
      setTargetValue(initialData.targetValue || 1);
      setTargetUnit(initialData.targetUnit || 'times');
    } else {
      setTitle('');
      setDescription('');
      setCategory('productivity');
      setColor('#10B981');
      setFrequency('daily');
      setScheduledDays([0, 1, 2, 3, 4, 5, 6]);
      setTargetValue(1);
      setTargetUnit('times');
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const toggleDay = (day) => {
    if (scheduledDays.includes(day)) {
      if (scheduledDays.length > 1) {
        setScheduledDays(scheduledDays.filter((d) => d !== day));
      }
    } else {
      setScheduledDays([...scheduledDays, day].sort());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a habit title.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        color,
        frequency,
        scheduledDays: frequency === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : scheduledDays,
        targetValue: Number(targetValue) || 1,
        targetUnit: targetUnit.trim() || 'times',
      };

      if (initialData && initialData._id) {
        await api.patch(`/habits/${initialData._id}`, payload);
      } else {
        await api.post('/habits', payload);
      }

      onHabitSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save habit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            {initialData ? 'Edit Habit' : 'Create New Habit'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Habit Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Read for 30 minutes, Morning workout"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Notes
            </label>
            <textarea
              rows="2"
              placeholder="Why this habit matters, cues, location..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Category & Color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 capitalize"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Color Tag</label>
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Frequency & Days */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Frequency</label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setFrequency('daily')}
                className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                  frequency === 'daily'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Every Day
              </button>
              <button
                type="button"
                onClick={() => setFrequency('weekly_days')}
                className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                  frequency === 'weekly_days'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Specific Weekdays
              </button>
            </div>

            {frequency === 'weekly_days' && (
              <div className="flex items-center justify-between gap-1 pt-1">
                {WEEKDAYS.map((wd) => {
                  const isSelected = scheduledDays.includes(wd.day);
                  return (
                    <button
                      key={wd.day}
                      type="button"
                      onClick={() => toggleDay(wd.day)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {wd.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Target Value & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Quantity</label>
              <input
                type="number"
                min="1"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
              <input
                type="text"
                placeholder="minutes, times, pages, glasses"
                value={targetUnit}
                onChange={(e) => setTargetUnit(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm shadow-emerald-600/20 disabled:opacity-50 transition-all"
            >
              {loading ? 'Saving...' : initialData ? 'Update Habit' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
