import { getDashboardSummary, getWeeklyAnalytics, getHeatmapData } from '../services/analyticsService.js';
import { formatDateKey } from '../services/streakEngine.js';
import { Habit } from '../models/Habit.js';
import { HabitCompletion } from '../models/HabitCompletion.js';
import { calculateHabitStreak } from '../services/streakEngine.js';

export const getDashboard = async (req, res, next) => {
  try {
    const todayKey = req.query.date || formatDateKey(new Date());
    const data = await getDashboardSummary(req.user._id, todayKey);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getWeekly = async (req, res, next) => {
  try {
    const todayKey = req.query.date || formatDateKey(new Date());
    const data = await getWeeklyAnalytics(req.user._id, todayKey);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getHeatmap = async (req, res, next) => {
  try {
    const todayKey = req.query.date || formatDateKey(new Date());
    const days = parseInt(req.query.days, 10) || 90;
    const data = await getHeatmapData(req.user._id, todayKey, days);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getStreaks = async (req, res, next) => {
  try {
    const habits = await Habit.find({ user: req.user._id, isArchived: false });
    const completions = await HabitCompletion.find({ user: req.user._id });

    const completionsByHabit = new Map();
    completions.forEach((c) => {
      const hid = c.habit.toString();
      if (!completionsByHabit.has(hid)) completionsByHabit.set(hid, []);
      completionsByHabit.get(hid).push(c);
    });

    const streaks = habits.map((habit) => {
      const hComps = completionsByHabit.get(habit._id.toString()) || [];
      const streakStats = calculateHabitStreak(habit, hComps);
      return {
        habitId: habit._id,
        title: habit.title,
        category: habit.category,
        color: habit.color,
        icon: habit.icon,
        ...streakStats,
      };
    });

    streaks.sort((a, b) => b.currentStreak - a.currentStreak);

    res.json({
      success: true,
      count: streaks.length,
      streaks,
    });
  } catch (error) {
    next(error);
  }
};
