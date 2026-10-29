import { format, parseISO, subDays, addDays, getDay, isAfter, isBefore, startOfDay } from 'date-fns';

/**
 * Normalizes a date to 'YYYY-MM-DD' string
 */
export const formatDateKey = (date) => {
  if (typeof date === 'string') {
    return date.split('T')[0];
  }
  return format(date, 'yyyy-MM-dd');
};

/**
 * Checks if a specific date (YYYY-MM-DD) is scheduled for a habit
 */
export const isScheduledDay = (habit, dateKey) => {
  const d = parseISO(dateKey);
  const dayOfWeek = getDay(d); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  if (habit.frequency === 'daily') {
    return true;
  }
  const scheduledDays = Array.isArray(habit.scheduledDays) ? habit.scheduledDays : [0, 1, 2, 3, 4, 5, 6];
  return scheduledDays.includes(dayOfWeek);
};

/**
 * Gets all scheduled date keys between startDate and endDate (inclusive)
 */
export const getScheduledDateKeys = (habit, startDate, endDate) => {
  const keys = [];
  let cur = parseISO(startDate);
  const end = parseISO(endDate);

  while (!isAfter(cur, end)) {
    const key = format(cur, 'yyyy-MM-dd');
    if (isScheduledDay(habit, key)) {
      keys.push(key);
    }
    cur = addDays(cur, 1);
  }
  return keys;
};

/**
 * Calculates streak metrics for a single habit given its completions
 * @param {Object} habit - The habit document or object
 * @param {Array<Object|string>} completions - Array of completion objects with `date` or date strings
 * @param {string} [todayKey] - The reference date key 'YYYY-MM-DD' (defaults to today)
 */
export const calculateHabitStreak = (habit, completions = [], todayKey = formatDateKey(new Date())) => {
  // Build a Set of completed date keys for O(1) lookup
  const completedSet = new Set();
  completions.forEach((c) => {
    if (!c) return;
    const dateKey = typeof c === 'string' ? c.split('T')[0] : (c.date ? c.date.split('T')[0] : null);
    const isCompleted = typeof c === 'object' ? (c.completed !== false) : true;
    if (dateKey && isCompleted) {
      completedSet.add(dateKey);
    }
  });

  const totalCompletions = completedSet.size;

  if (totalCompletions === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      completionRate: 0,
      isCompletedToday: completedSet.has(todayKey),
      scheduledForToday: isScheduledDay(habit, todayKey),
    };
  }

  // 1. Calculate Current Streak
  let currentStreak = 0;
  const isTodayScheduled = isScheduledDay(habit, todayKey);
  const isTodayCompleted = completedSet.has(todayKey);

  let checkDate = parseISO(todayKey);

  if (isTodayScheduled && isTodayCompleted) {
    // Today is scheduled and completed: counts towards current streak
    currentStreak += 1;
    checkDate = subDays(checkDate, 1);
  } else if (isTodayScheduled && !isTodayCompleted) {
    // Today is scheduled but not yet completed. The user is in the middle of today!
    // The streak from yesterday (or last scheduled day) is NOT broken yet.
    checkDate = subDays(checkDate, 1);
  } else {
    // Today is not a scheduled day. Check starting from yesterday.
    checkDate = subDays(checkDate, 1);
  }

  // Walk backwards day by day to count consecutive completed scheduled days
  // Safety cap of 3650 days (10 years)
  for (let i = 0; i < 3650; i++) {
    const key = format(checkDate, 'yyyy-MM-dd');
    const scheduled = isScheduledDay(habit, key);

    if (scheduled) {
      if (completedSet.has(key)) {
        currentStreak += 1;
      } else {
        // Scheduled day was missed -> active streak stops here
        break;
      }
    }
    checkDate = subDays(checkDate, 1);
  }

  // 2. Calculate Longest Streak
  // Sort all completed dates chronologically
  const sortedCompletedDates = Array.from(completedSet).sort();
  const firstCompletedDate = sortedCompletedDates[0];

  // We scan from the earlier of (habit.createdAt, firstCompletedDate) up to todayKey
  const creationKey = habit.createdAt ? formatDateKey(habit.createdAt) : firstCompletedDate;
  const historyStartKey = creationKey < firstCompletedDate ? creationKey : firstCompletedDate;

  const allScheduledDays = getScheduledDateKeys(habit, historyStartKey, todayKey);

  let longestStreak = 0;
  let runningStreak = 0;

  for (const scheduledKey of allScheduledDays) {
    if (completedSet.has(scheduledKey)) {
      runningStreak += 1;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else {
      // Missed scheduled day resets running streak
      // Exception: If this scheduled day is today and it's not completed yet,
      // it doesn't break the historical streak max
      if (scheduledKey !== todayKey) {
        runningStreak = 0;
      }
    }
  }

  // Ensure longestStreak is at least as large as currentStreak
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  // 3. Overall Completion Rate
  const scheduledCount = allScheduledDays.length;
  const completionRate = scheduledCount > 0
    ? Math.min(100, Math.round((totalCompletions / scheduledCount) * 100))
    : (totalCompletions > 0 ? 100 : 0);

  return {
    currentStreak,
    longestStreak,
    totalCompletions,
    completionRate,
    isCompletedToday: isTodayCompleted,
    scheduledForToday: isTodayScheduled,
  };
};

/**
 * Calculates recent consistency (last N days)
 */
export const calculateRecentConsistency = (habit, completions = [], days = 7, todayKey = formatDateKey(new Date())) => {
  const completedSet = new Set();
  completions.forEach((c) => {
    const dateKey = typeof c === 'string' ? c.split('T')[0] : (c.date ? c.date.split('T')[0] : null);
    if (dateKey && (typeof c === 'string' || c.completed !== false)) {
      completedSet.add(dateKey);
    }
  });

  const startKey = formatDateKey(subDays(parseISO(todayKey), days - 1));
  const scheduled = getScheduledDateKeys(habit, startKey, todayKey);
  const completed = scheduled.filter((k) => completedSet.has(k)).length;

  return {
    periodDays: days,
    scheduledCount: scheduled.length,
    completedCount: completed,
    rate: scheduled.length > 0 ? Math.round((completed / scheduled.length) * 100) : 0,
  };
};
