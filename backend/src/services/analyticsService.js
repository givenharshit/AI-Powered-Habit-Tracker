import { parseISO, format, subDays, addDays, getDay } from 'date-fns';
import { Habit } from '../models/Habit.js';
import { HabitCompletion } from '../models/HabitCompletion.js';
import { calculateHabitStreak, isScheduledDay, formatDateKey } from './streakEngine.js';

/**
 * Returns comprehensive dashboard summary metrics for a user
 */
export const getDashboardSummary = async (userId, todayKey = formatDateKey(new Date())) => {
  // Fetch active habits
  const habits = await Habit.find({ user: userId, isArchived: false }).sort({ createdAt: -1 });

  // Fetch all completions for the user
  const completions = await HabitCompletion.find({ user: userId });

  // Group completions by habitId
  const completionsByHabit = new Map();
  completions.forEach((c) => {
    const hid = c.habit.toString();
    if (!completionsByHabit.has(hid)) {
      completionsByHabit.set(hid, []);
    }
    completionsByHabit.get(hid).push(c);
  });

  let completedTodayCount = 0;
  let scheduledTodayCount = 0;
  let highestCurrentStreak = 0;
  let highestCurrentStreakHabit = null;
  let highestLongestStreak = 0;
  let highestLongestStreakHabit = null;

  const habitMetrics = habits.map((habit) => {
    const habitComps = completionsByHabit.get(habit._id.toString()) || [];
    const streakData = calculateHabitStreak(habit, habitComps, todayKey);

    if (streakData.scheduledForToday) {
      scheduledTodayCount += 1;
      if (streakData.isCompletedToday) {
        completedTodayCount += 1;
      }
    }

    if (streakData.currentStreak > highestCurrentStreak) {
      highestCurrentStreak = streakData.currentStreak;
      highestCurrentStreakHabit = habit.title;
    }

    if (streakData.longestStreak > highestLongestStreak) {
      highestLongestStreak = streakData.longestStreak;
      highestLongestStreakHabit = habit.title;
    }

    return {
      habitId: habit._id,
      title: habit.title,
      category: habit.category,
      color: habit.color,
      icon: habit.icon,
      frequency: habit.frequency,
      targetValue: habit.targetValue,
      targetUnit: habit.targetUnit,
      ...streakData,
    };
  });

  const todayCompletionRate = scheduledTodayCount > 0
    ? Math.round((completedTodayCount / scheduledTodayCount) * 100)
    : 0;

  // 7-day activity trend
  const sevenDayTrend = [];
  const todayDate = parseISO(todayKey);
  for (let i = 6; i >= 0; i--) {
    const d = subDays(todayDate, i);
    const dateKey = format(d, 'yyyy-MM-dd');
    const dayName = format(d, 'EEE'); // Mon, Tue, etc.

    let scheduled = 0;
    let completed = 0;

    habits.forEach((habit) => {
      if (isScheduledDay(habit, dateKey)) {
        scheduled += 1;
        const hComps = completionsByHabit.get(habit._id.toString()) || [];
        if (hComps.some((c) => c.date === dateKey && c.completed !== false)) {
          completed += 1;
        }
      }
    });

    sevenDayTrend.push({
      date: dateKey,
      dayName,
      scheduled,
      completed,
      rate: scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0,
    });
  }

  // Habits remaining for today
  const pendingToday = habitMetrics.filter(
    (h) => h.scheduledForToday && !h.isCompletedToday
  );
  const completedToday = habitMetrics.filter(
    (h) => h.scheduledForToday && h.isCompletedToday
  );

  return {
    todayKey,
    totalHabits: habits.length,
    scheduledTodayCount,
    completedTodayCount,
    todayCompletionRate,
    highestCurrentStreak,
    highestCurrentStreakHabit,
    highestLongestStreak,
    highestLongestStreakHabit,
    sevenDayTrend,
    pendingToday,
    completedToday,
    habitMetrics,
  };
};

/**
 * Returns 90-day activity heatmap data
 */
export const getHeatmapData = async (userId, todayKey = formatDateKey(new Date()), days = 90) => {
  const habits = await Habit.find({ user: userId, isArchived: false });
  const completions = await HabitCompletion.find({ user: userId });

  // Map: date -> Array of completed habit IDs/titles
  const completionsByDate = new Map();
  completions.forEach((c) => {
    if (!completionsByDate.has(c.date)) {
      completionsByDate.set(c.date, []);
    }
    completionsByDate.get(c.date).push(c.habit.toString());
  });

  const heatmap = [];
  const todayDate = parseISO(todayKey);

  for (let i = days - 1; i >= 0; i--) {
    const curDate = subDays(todayDate, i);
    const dateKey = format(curDate, 'yyyy-MM-dd');
    const dayOfWeek = getDay(curDate);

    let scheduled = 0;
    const completedHabitTitles = [];

    habits.forEach((habit) => {
      // Habit must have been created on or before this day
      const habitCreatedKey = formatDateKey(habit.createdAt);
      if (habitCreatedKey <= dateKey && isScheduledDay(habit, dateKey)) {
        scheduled += 1;
      }
    });

    const dayCompletedIds = completionsByDate.get(dateKey) || [];
    habits.forEach((h) => {
      if (dayCompletedIds.includes(h._id.toString())) {
        completedHabitTitles.push(h.title);
      }
    });

    const completed = completedHabitTitles.length;
    const rate = scheduled > 0 ? Math.round((completed / scheduled) * 100) : (completed > 0 ? 100 : 0);

    // Calculate intensity 0-4
    let intensity = 0;
    if (completed > 0) {
      if (rate >= 80) intensity = 4;
      else if (rate >= 50) intensity = 3;
      else if (rate >= 25) intensity = 2;
      else intensity = 1;
    }

    heatmap.push({
      date: dateKey,
      dayOfWeek,
      scheduled,
      completed,
      rate,
      intensity,
      completedHabits: completedHabitTitles,
    });
  }

  return heatmap;
};

/**
 * Returns weekly analytics and habit consistency comparison
 */
export const getWeeklyAnalytics = async (userId, todayKey = formatDateKey(new Date())) => {
  const habits = await Habit.find({ user: userId, isArchived: false });
  const completions = await HabitCompletion.find({ user: userId });

  const completionsByHabit = new Map();
  completions.forEach((c) => {
    const hid = c.habit.toString();
    if (!completionsByHabit.has(hid)) completionsByHabit.set(hid, []);
    completionsByHabit.get(hid).push(c);
  });

  const todayDate = parseISO(todayKey);

  // Current week (last 7 days: day -6 to today)
  let currentWeekScheduled = 0;
  let currentWeekCompleted = 0;

  // Previous week (days -13 to -7)
  let prevWeekScheduled = 0;
  let prevWeekCompleted = 0;

  for (let i = 0; i < 7; i++) {
    const dateKeyCur = format(subDays(todayDate, i), 'yyyy-MM-dd');
    const dateKeyPrev = format(subDays(todayDate, i + 7), 'yyyy-MM-dd');

    habits.forEach((h) => {
      const hComps = completionsByHabit.get(h._id.toString()) || [];
      if (isScheduledDay(h, dateKeyCur)) {
        currentWeekScheduled++;
        if (hComps.some((c) => c.date === dateKeyCur)) currentWeekCompleted++;
      }
      if (isScheduledDay(h, dateKeyPrev)) {
        prevWeekScheduled++;
        if (hComps.some((c) => c.date === dateKeyPrev)) prevWeekCompleted++;
      }
    });
  }

  const currentWeekRate = currentWeekScheduled > 0
    ? Math.round((currentWeekCompleted / currentWeekScheduled) * 100)
    : 0;

  const prevWeekRate = prevWeekScheduled > 0
    ? Math.round((prevWeekCompleted / prevWeekScheduled) * 100)
    : 0;

  const rateDelta = currentWeekRate - prevWeekRate;

  // Habit consistency analysis for current week
  const habitConsistency = habits.map((h) => {
    const hComps = completionsByHabit.get(h._id.toString()) || [];
    let weekScheduled = 0;
    let weekCompleted = 0;

    for (let i = 0; i < 7; i++) {
      const dateKey = format(subDays(todayDate, i), 'yyyy-MM-dd');
      if (isScheduledDay(h, dateKey)) {
        weekScheduled++;
        if (hComps.some((c) => c.date === dateKey)) weekCompleted++;
      }
    }

    const streakData = calculateHabitStreak(h, hComps, todayKey);
    const weekRate = weekScheduled > 0 ? Math.round((weekCompleted / weekScheduled) * 100) : 0;

    return {
      habitId: h._id,
      title: h.title,
      category: h.category,
      color: h.color,
      frequency: h.frequency,
      weekScheduled,
      weekCompleted,
      weekRate,
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak,
      allTimeRate: streakData.completionRate,
    };
  });

  // Sort to find most consistent and habits needing attention
  const sortedByWeekRate = [...habitConsistency].sort((a, b) => b.weekRate - a.weekRate || b.currentStreak - a.currentStreak);
  const mostConsistent = sortedByWeekRate.filter((h) => h.weekRate >= 60).slice(0, 3);
  const needsAttention = sortedByWeekRate.filter((h) => h.weekRate < 60 || h.weekCompleted < h.weekScheduled).reverse().slice(0, 3);

  return {
    period: {
      start: format(subDays(todayDate, 6), 'yyyy-MM-dd'),
      end: todayKey,
    },
    currentWeekScheduled,
    currentWeekCompleted,
    currentWeekRate,
    prevWeekScheduled,
    prevWeekCompleted,
    prevWeekRate,
    rateDelta,
    mostConsistent,
    needsAttention,
    habitConsistency,
  };
};
