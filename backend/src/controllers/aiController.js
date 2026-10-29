import { Habit } from '../models/Habit.js';
import { HabitCompletion } from '../models/HabitCompletion.js';
import { AIInsight } from '../models/AIInsight.js';
import {
  generateHabitSuggestions,
  generateWeeklyReport,
  generateRecoveryPlan,
  analyzeHabitsWithNLP,
  getMotivationalInsight,
} from '../services/geminiService.js';
import { getWeeklyAnalytics, getDashboardSummary } from '../services/analyticsService.js';
import { calculateHabitStreak, formatDateKey } from '../services/streakEngine.js';

export const getHabitSuggestionsController = async (req, res, next) => {
  try {
    const { goal } = req.body;
    if (!goal || typeof goal !== 'string' || goal.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a goal description (e.g. "Prepare for a marathon" or "Read more books").',
      });
    }

    const result = await generateHabitSuggestions(goal.trim());

    // Save insight to history
    await AIInsight.create({
      user: req.user._id,
      type: 'suggestion',
      title: `Habit Suggestions for: "${goal.trim().slice(0, 40)}"`,
      content: result,
      metadata: { goal: goal.trim() },
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getWeeklyReportController = async (req, res, next) => {
  try {
    const todayKey = req.body.date || formatDateKey(new Date());
    const weeklyData = await getWeeklyAnalytics(req.user._id, todayKey);
    const result = await generateWeeklyReport(weeklyData);

    // Persist report in AIInsight
    const insight = await AIInsight.create({
      user: req.user._id,
      type: 'weekly_report',
      title: `Weekly Coaching Report (${weeklyData.period.start} to ${weeklyData.period.end})`,
      content: result,
      metadata: {
        currentWeekRate: weeklyData.currentWeekRate,
        period: weeklyData.period,
      },
    });

    res.json({
      success: true,
      id: insight._id,
      ...result,
      metrics: weeklyData,
    });
  } catch (error) {
    next(error);
  }
};

export const getRecoveryPlanController = async (req, res, next) => {
  try {
    const { habitId } = req.body;
    if (!habitId) {
      return res.status(400).json({
        success: false,
        message: 'Habit ID is required to generate a recovery plan.',
      });
    }

    const habit = await Habit.findOne({ _id: habitId, user: req.user._id });
    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found or access denied.',
      });
    }

    const completions = await HabitCompletion.find({
      user: req.user._id,
      habit: habit._id,
    });
    const streakStats = calculateHabitStreak(habit, completions);

    const result = await generateRecoveryPlan(habit, streakStats);

    await AIInsight.create({
      user: req.user._id,
      habit: habit._id,
      type: 'recovery_plan',
      title: `3-Day Recovery Plan for: "${habit.title}"`,
      content: result,
      metadata: { habitId, streakStats },
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const analyzeHabitsController = async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a question about your habits.',
      });
    }

    // Build authentic user context
    const habits = await Habit.find({ user: req.user._id, isArchived: false });
    const completions = await HabitCompletion.find({ user: req.user._id });

    const completionsByHabit = new Map();
    completions.forEach((c) => {
      const hid = c.habit.toString();
      if (!completionsByHabit.has(hid)) completionsByHabit.set(hid, []);
      completionsByHabit.get(hid).push(c);
    });

    let totalRate = 0;
    let highestRate = -1;
    let lowestRate = 101;
    let topHabit = '';
    let strugglingHabit = '';

    const habitSummary = habits.map((h) => {
      const hComps = completionsByHabit.get(h._id.toString()) || [];
      const stats = calculateHabitStreak(h, hComps);
      totalRate += stats.completionRate;

      if (stats.completionRate > highestRate) {
        highestRate = stats.completionRate;
        topHabit = h.title;
      }
      if (stats.completionRate < lowestRate) {
        lowestRate = stats.completionRate;
        strugglingHabit = h.title;
      }

      return {
        title: h.title,
        category: h.category,
        frequency: h.frequency,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        completionRate: `${stats.completionRate}%`,
        totalCompleted: stats.totalCompletions,
      };
    });

    const overallRate = habits.length > 0 ? Math.round(totalRate / habits.length) : 0;

    const userContext = {
      activeCount: habits.length,
      overallRate,
      topHabit,
      strugglingHabit,
      habits: habitSummary,
    };

    const result = await analyzeHabitsWithNLP(question.trim(), userContext);

    await AIInsight.create({
      user: req.user._id,
      type: 'qa_analysis',
      title: `Q&A: ${question.trim().slice(0, 50)}`,
      content: result,
      metadata: { question: question.trim() },
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getMotivationalController = async (req, res, next) => {
  try {
    const summary = await getDashboardSummary(req.user._id);
    const result = await getMotivationalInsight({
      completionRate: summary.todayCompletionRate,
      highestStreak: summary.highestCurrentStreak,
      habitCount: summary.totalHabits,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getInsightsHistory = async (req, res, next) => {
  try {
    const { type, limit = 20 } = req.query;
    const filter = { user: req.user._id };
    if (type) filter.type = type;

    const insights = await AIInsight.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .populate('habit', 'title category color icon');

    res.json({
      success: true,
      count: insights.length,
      insights,
    });
  } catch (error) {
    next(error);
  }
};
