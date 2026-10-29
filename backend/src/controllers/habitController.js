import { Habit } from '../models/Habit.js';
import { HabitCompletion } from '../models/HabitCompletion.js';
import { calculateHabitStreak, isScheduledDay, formatDateKey } from '../services/streakEngine.js';

/**
 * Get all habits for the authenticated user
 */
export const getHabits = async (req, res, next) => {
  try {
    const { category, search, archived, date } = req.query;
    const query = { user: req.user._id };

    if (archived === 'true') {
      query.isArchived = true;
    } else if (archived === 'false' || archived === undefined) {
      query.isArchived = false;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    const habits = await Habit.find(query).sort({ createdAt: -1 });
    const todayKey = date || formatDateKey(new Date());

    // Fetch completions for all returned habits
    const habitIds = habits.map((h) => h._id);
    const completions = await HabitCompletion.find({
      user: req.user._id,
      habit: { $in: habitIds },
    });

    const completionsByHabit = new Map();
    completions.forEach((c) => {
      const hid = c.habit.toString();
      if (!completionsByHabit.has(hid)) completionsByHabit.set(hid, []);
      completionsByHabit.get(hid).push(c);
    });

    const habitsWithStats = habits.map((habit) => {
      const hComps = completionsByHabit.get(habit._id.toString()) || [];
      const streakStats = calculateHabitStreak(habit, hComps, todayKey);
      return {
        ...habit.toObject(),
        streakStats,
      };
    });

    res.json({
      success: true,
      count: habitsWithStats.length,
      habits: habitsWithStats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new habit
 */
export const createHabit = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      color,
      icon,
      frequency,
      scheduledDays,
      targetValue,
      targetUnit,
    } = req.body;

    const habit = await Habit.create({
      user: req.user._id,
      title,
      description,
      category,
      color: color || '#10B981',
      icon: icon || 'CheckCircle2',
      frequency: frequency || 'daily',
      scheduledDays: frequency === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : scheduledDays,
      targetValue: targetValue || 1,
      targetUnit: targetUnit || 'times',
    });

    const streakStats = calculateHabitStreak(habit, []);

    res.status(201).json({
      success: true,
      message: 'Habit created successfully',
      habit: {
        ...habit.toObject(),
        streakStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get habit by ID with history and streak stats
 */
export const getHabitById = async (req, res, next) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, user: req.user._id });
    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found or access denied.',
      });
    }

    const completions = await HabitCompletion.find({
      user: req.user._id,
      habit: habit._id,
    }).sort({ date: -1 });

    const streakStats = calculateHabitStreak(habit, completions);

    res.json({
      success: true,
      habit: {
        ...habit.toObject(),
        streakStats,
        completions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update habit
 */
export const updateHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, user: req.user._id });
    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found or access denied.',
      });
    }

    const allowedUpdates = [
      'title',
      'description',
      'category',
      'color',
      'icon',
      'frequency',
      'scheduledDays',
      'targetValue',
      'targetUnit',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        habit[field] = req.body[field];
      }
    });

    if (habit.frequency === 'daily') {
      habit.scheduledDays = [0, 1, 2, 3, 4, 5, 6];
    }

    await habit.save();

    const completions = await HabitCompletion.find({
      user: req.user._id,
      habit: habit._id,
    });
    const streakStats = calculateHabitStreak(habit, completions);

    res.json({
      success: true,
      message: 'Habit updated successfully',
      habit: {
        ...habit.toObject(),
        streakStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete habit and its completion records
 */
export const deleteHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found or access denied.',
      });
    }

    // Cascade delete associated completions
    await HabitCompletion.deleteMany({ habit: habit._id, user: req.user._id });

    res.json({
      success: true,
      message: 'Habit and associated completion history deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle archive status
 */
export const toggleArchiveHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, user: req.user._id });
    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found or access denied.',
      });
    }

    habit.isArchived = !habit.isArchived;
    await habit.save();

    res.json({
      success: true,
      message: `Habit ${habit.isArchived ? 'archived' : 'restored'} successfully`,
      isArchived: habit.isArchived,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle habit completion for a specific date
 */
export const toggleHabitCompletion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, value, notes } = req.body;
    const targetDate = date || formatDateKey(new Date());

    // 1. Verify habit ownership
    const habit = await Habit.findOne({ _id: id, user: req.user._id });
    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found or access denied.',
      });
    }

    // 2. Check if completion already exists for this habit & date
    const existing = await HabitCompletion.findOne({
      user: req.user._id,
      habit: habit._id,
      date: targetDate,
    });

    let isCompleted = false;

    if (existing) {
      // Undo completion
      await HabitCompletion.findByIdAndDelete(existing._id);
      isCompleted = false;
    } else {
      // Create new completion
      await HabitCompletion.create({
        user: req.user._id,
        habit: habit._id,
        date: targetDate,
        completed: true,
        value: value || habit.targetValue || 1,
        notes: notes || '',
      });
      isCompleted = true;
    }

    // 3. Recalculate streak stats after change
    const completions = await HabitCompletion.find({
      user: req.user._id,
      habit: habit._id,
    });
    const streakStats = calculateHabitStreak(habit, completions, formatDateKey(new Date()));

    res.json({
      success: true,
      message: isCompleted ? 'Habit marked complete!' : 'Habit completion undone.',
      isCompleted,
      date: targetDate,
      streakStats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get completions for a date or date range
 */
export const getCompletions = async (req, res, next) => {
  try {
    const { date, startDate, endDate } = req.query;
    const filter = { user: req.user._id };

    if (date) {
      filter.date = date;
    } else if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const completions = await HabitCompletion.find(filter).populate('habit', 'title category color icon targetValue targetUnit');

    res.json({
      success: true,
      count: completions.length,
      completions,
    });
  } catch (error) {
    next(error);
  }
};
