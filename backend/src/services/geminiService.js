import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY?.trim();
const modelName = process.env.GEMINI_MODEL?.trim() || 'gemini-1.5-flash';

let genAI = null;
if (apiKey && apiKey !== 'your-gemini-api-key-here') {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log(`[Gemini] Initialized GoogleGenerativeAI with model: ${modelName}`);
  } catch (err) {
    console.warn(`[Gemini] Warning initializing Gemini SDK: ${err.message}`);
  }
} else {
  console.log(`[Gemini] No active GEMINI_API_KEY provided. Intelligent fallback mode active.`);
}

/**
 * Safely parse JSON returned by Gemini, removing Markdown fences if present
 */
const parseGeminiJson = (text, fallback) => {
  try {
    let clean = text.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    return JSON.parse(clean);
  } catch (e) {
    console.warn('[Gemini] JSON parse failed, returning fallback:', e.message);
    return fallback;
  }
};

/**
 * FEATURE A: AI Habit Suggestions based on a user goal
 */
export const generateHabitSuggestions = async (goal) => {
  const fallbackSuggestions = [
    {
      title: 'Morning Focus Session',
      description: 'Spend 25 minutes of undistracted time on your most important task.',
      category: 'productivity',
      frequency: 'daily',
      scheduledDays: [1, 2, 3, 4, 5],
      targetValue: 25,
      targetUnit: 'minutes',
      difficulty: 'Easy',
      reason: 'Structured micro-focus sessions establish momentum without causing cognitive fatigue.',
    },
    {
      title: 'Physical Activity & Movement',
      description: 'Engage in moderate exercise, brisk walking, or stretching.',
      category: 'fitness',
      frequency: 'daily',
      scheduledDays: [0, 1, 2, 3, 4, 5, 6],
      targetValue: 30,
      targetUnit: 'minutes',
      difficulty: 'Medium',
      reason: 'Daily movement boosts metabolic rate and reduces daily stress levels.',
    },
    {
      title: 'Daily Reflection & Wind-Down',
      description: 'Review the day and prepare key priorities for tomorrow.',
      category: 'mindfulness',
      frequency: 'daily',
      scheduledDays: [0, 1, 2, 3, 4, 5, 6],
      targetValue: 10,
      targetUnit: 'minutes',
      difficulty: 'Easy',
      reason: 'Evening reflection clarifies focus and improves sleep transition quality.',
    },
  ];

  if (!genAI) {
    return {
      source: 'heuristic_fallback',
      suggestions: fallbackSuggestions,
      notice: 'Gemini API key is not configured. Displaying structured recommendation templates.',
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = `You are a behavioral psychology and habit design expert.
The user wants to achieve this goal: "${goal}".
Suggest 3 to 4 actionable, highly realistic habits to build consistency toward this goal.
Return ONLY valid JSON (no markdown explanation outside the json) matching this exact schema:
[
  {
    "title": "Short title (under 50 chars)",
    "description": "Clear actionable instruction",
    "category": "health" | "productivity" | "learning" | "mindfulness" | "fitness" | "finance" | "other",
    "frequency": "daily" | "weekly_days",
    "scheduledDays": [0,1,2,3,4,5,6], // 0 is Sun, 1 is Mon, etc.
    "targetValue": 1, // numeric value
    "targetUnit": "times" | "minutes" | "pages" | "glasses",
    "difficulty": "Easy" | "Medium" | "Challenging",
    "reason": "Why this habit works based on behavioral science"
  }
]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = parseGeminiJson(text, fallbackSuggestions);

    return {
      source: 'gemini',
      suggestions: Array.isArray(parsed) && parsed.length > 0 ? parsed : fallbackSuggestions,
    };
  } catch (error) {
    console.error('[Gemini API Error] Habit suggestions:', error.message);
    return {
      source: 'heuristic_fallback',
      suggestions: fallbackSuggestions,
      notice: `AI service temporarily unavailable (${error.message}). Showing recommended habits.`,
    };
  }
};

/**
 * FEATURE B: Personalized Weekly Report based on calculated metrics
 */
export const generateWeeklyReport = async (userMetrics) => {
  const { currentWeekRate, prevWeekRate, rateDelta, mostConsistent, needsAttention, period } = userMetrics;

  const fallbackReport = {
    summary: `During the week of ${period.start} to ${period.end}, you maintained an overall consistency rate of ${currentWeekRate}%. ${
      rateDelta >= 0
        ? `This represents a positive gain of +${rateDelta}% over the previous week.`
        : `Your consistency shifted by ${rateDelta}% compared to last week.`
    }`,
    strengths: mostConsistent.length > 0
      ? mostConsistent.map((h) => `${h.title}: Strong ${h.weekRate}% completion rate with an active streak of ${h.currentStreak} occurrences.`)
      : ['You are initiating habits and logging your daily activities.'],
    areasForImprovement: needsAttention.length > 0
      ? needsAttention.map((h) => `${h.title}: Completed ${h.weekCompleted}/${h.weekScheduled} scheduled days (${h.weekRate}%).`)
      : ['Continue sustaining your current routine.'],
    actionableTips: [
      'Anchor your most challenging habit to an existing morning ritual (habit stacking).',
      'Reduce initial target friction—commit to just 2 minutes on days with low energy.',
      'Prepare your environment the night before to eliminate startup resistance.',
    ],
    motivation: 'Consistency is not about perfection; it is about returning to your habits when friction occurs.',
  };

  if (!genAI) {
    return {
      source: 'calculated_with_rules',
      report: fallbackReport,
      notice: 'Gemini API key is not configured. Insights generated using deterministic behavioral analytics.',
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = `You are an empathetic, data-driven habit coach.
Analyze these AUTHORITATIVE user metrics for the past week (${period.start} to ${period.end}):
- Overall Weekly Completion Rate: ${currentWeekRate}%
- Previous Week Rate: ${prevWeekRate}% (Delta: ${rateDelta >= 0 ? '+' : ''}${rateDelta}%)
- Most Consistent Habits: ${JSON.stringify(mostConsistent.map((h) => ({ title: h.title, rate: `${h.weekRate}%`, streak: h.currentStreak })))}
- Habits Needing Attention: ${JSON.stringify(needsAttention.map((h) => ({ title: h.title, scheduled: h.weekScheduled, completed: h.weekCompleted, rate: `${h.weekRate}%` })))}

Provide an insightful, personalized weekly review.
Return ONLY valid JSON matching this schema:
{
  "summary": "2-3 sentences evaluating their week objectively with empathy",
  "strengths": ["specific observation 1", "specific observation 2"],
  "areasForImprovement": ["specific habit observation 1", "specific habit observation 2"],
  "actionableTips": ["practical behavioral tip 1", "practical behavioral tip 2", "practical behavioral tip 3"],
  "motivation": "A grounded, encouraging 1-sentence closing thought"
}`;

    const result = await model.generateContent(prompt);
    const parsed = parseGeminiJson(result.response.text(), fallbackReport);

    return {
      source: 'gemini',
      report: parsed,
    };
  } catch (error) {
    console.error('[Gemini API Error] Weekly report:', error.message);
    return {
      source: 'calculated_with_rules',
      report: fallbackReport,
      notice: `AI service temporarily unavailable (${error.message}). Calculated analytics displayed.`,
    };
  }
};

/**
 * FEATURE C: 3-Day Streak Recovery Plan
 */
export const generateRecoveryPlan = async (habit, streakData) => {
  const fallbackPlan = {
    habitTitle: habit.title,
    diagnosis: `A break in your streak for "${habit.title}" is a normal part of habit building. The goal now is to reduce friction and regain momentum.`,
    day1: {
      step: 'Micro-Start',
      action: `Perform a 2-minute miniature version of "${habit.title}". Do not push for maximum effort, just show up.`,
      frictionReduction: 'Set out any needed materials or reminders an hour beforehand.',
    },
    day2: {
      step: 'Comfortable Effort',
      action: `Complete roughly 50% of your typical target (${Math.ceil(habit.targetValue / 2)} ${habit.targetUnit}).`,
      frictionReduction: 'Schedule a specific calendar block immediately following an established routine.',
    },
    day3: {
      step: 'Full Routine Re-entry',
      action: `Return to your standard goal of ${habit.targetValue} ${habit.targetUnit} with full intentionality.`,
      frictionReduction: 'Celebrate completing day 3 to reinforce dopamine pathways.',
    },
    mindsetSupport: 'Remember James Clear\'s rule: "Never miss twice." Today is your day to step back on track.',
  };

  if (!genAI) {
    return {
      source: 'structured_template',
      plan: fallbackPlan,
      notice: 'Gemini API key is not configured. Providing structured 3-day recovery framework.',
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = `You are an expert in behavioral restoration and resilience.
A user lost their streak on the habit: "${habit.title}".
Habit Details:
- Category: ${habit.category}
- Frequency: ${habit.frequency}
- Target: ${habit.targetValue} ${habit.targetUnit}
- Previous Longest Streak: ${streakData.longestStreak} days/occurrences
- Current Streak: ${streakData.currentStreak}

Design a supportive, realistic, non-judgmental 3-Day Recovery Plan.
Return ONLY valid JSON matching this schema:
{
  "habitTitle": "${habit.title}",
  "diagnosis": "Gentle, non-judgmental explanation of why setbacks happen and how to view it",
  "day1": {
    "step": "Micro-Start",
    "action": "Extremely low-friction restart action",
    "frictionReduction": "One concrete environmental tweak"
  },
  "day2": {
    "step": "Moderate Ramp-Up",
    "action": "A manageable step closer to the normal routine",
    "frictionReduction": "Implementation intention / timing cue"
  },
  "day3": {
    "step": "Full Routine Return",
    "action": "Completing the standard target with confidence",
    "frictionReduction": "Momentum stabilization tip"
  },
  "mindsetSupport": "Supportive motivational takeaway"
}`;

    const result = await model.generateContent(prompt);
    const parsed = parseGeminiJson(result.response.text(), fallbackPlan);

    return {
      source: 'gemini',
      plan: parsed,
    };
  } catch (error) {
    console.error('[Gemini API Error] Recovery plan:', error.message);
    return {
      source: 'structured_template',
      plan: fallbackPlan,
      notice: `AI service unavailable (${error.message}). Displaying structured recovery plan.`,
    };
  }
};

/**
 * FEATURE D: Natural-Language Habit Analysis (Q&A)
 */
export const analyzeHabitsWithNLP = async (question, userContext) => {
  const { habits, overallRate, topHabit, strugglingHabit, activeCount } = userContext;

  const fallbackAnswer = `Based on your logged data:
- You currently have ${activeCount} active habits.
- Overall completion rate across active habits is ${overallRate}%.
- Most consistent habit: "${topHabit || 'None yet'}".
- Habit needing the most attention: "${strugglingHabit || 'None yet'}".
To answer "${question}": Focus on lowering the starting barrier for your lowest-performing habits and stacking them immediately after your most consistent routines.`;

  if (!genAI) {
    return {
      source: 'calculated_rule_engine',
      answer: fallbackAnswer,
      contextMetrics: { activeCount, overallRate, topHabit, strugglingHabit },
      notice: 'Gemini API key is not configured. Answering using deterministic habit metrics.',
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = `You are an AI Habit Intelligence Analyst.
Answer the user's specific question using ONLY their authentic habit tracking data below.
Do not hallucinate statistics not present in the context.

User Data:
- Active Habits Count: ${activeCount}
- Overall Completion Rate: ${overallRate}%
- Most Consistent Habit: ${topHabit || 'None yet'}
- Most Struggling Habit: ${strugglingHabit || 'None yet'}
- Habit Breakdown: ${JSON.stringify(habits)}

User's Question: "${question}"

Provide a concise, direct, helpful answer (2-4 paragraphs).
Highlight exact figures where relevant, identify root causes, and provide 1-2 realistic next steps.`;

    const result = await model.generateContent(prompt);
    return {
      source: 'gemini',
      answer: result.response.text(),
      contextMetrics: { activeCount, overallRate, topHabit, strugglingHabit },
    };
  } catch (error) {
    console.error('[Gemini API Error] NLP analysis:', error.message);
    return {
      source: 'calculated_rule_engine',
      answer: fallbackAnswer,
      contextMetrics: { activeCount, overallRate, topHabit, strugglingHabit },
      notice: `AI service unavailable (${error.message}). Showing calculated metrics.`,
    };
  }
};

/**
 * FEATURE E: Contextual Motivational Insight
 */
export const getMotivationalInsight = async (context) => {
  const { completionRate, highestStreak, habitCount } = context;

  const quotes = [
    { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant" },
    { text: "Small habits don't add up, they compound.", author: "James Clear" },
    { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
    { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  ];
  const chosenQuote = quotes[Math.floor(Math.random() * quotes.length)];

  let message = "";
  if (completionRate >= 80) {
    message = `Outstanding performance! You are achieving an ${completionRate}% completion rate. Keep this momentum running!`;
  } else if (highestStreak >= 5) {
    message = `Impressive dedication! You have built a streak of ${highestStreak} days. Protect your rhythm today.`;
  } else if (habitCount > 0) {
    message = `Every checkmark counts toward the person you want to become. Take it one habit at a time.`;
  } else {
    message = `Welcome! Create your first habit today to start building lasting consistency.`;
  }

  return {
    message,
    quote: chosenQuote,
  };
};
