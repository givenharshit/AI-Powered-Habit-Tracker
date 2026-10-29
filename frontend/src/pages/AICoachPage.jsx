import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Lightbulb,
  FileText,
  LifeBuoy,
  MessageSquare,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Send,
  RefreshCw,
  Flame,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import api from '../services/api';

const QUICK_QUESTIONS = [
  'Which habit am I struggling with most?',
  'How consistent was I this week?',
  'What patterns do you notice in my habits?',
  'Which habit should I focus on improving?',
  'Give me a realistic plan for next week.',
];

export const AICoachPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Tab: 'suggestions' | 'weekly' | 'recovery' | 'qa' | 'history'
  const [activeTab, setActiveTab] = useState('suggestions');

  // Habits for dropdowns
  const [userHabits, setUserHabits] = useState([]);

  // Feature A: Suggestions
  const [goalInput, setGoalInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsNotice, setSuggestionsNotice] = useState('');
  const [addedHabitTitles, setAddedHabitTitles] = useState(new Set());

  // Feature B: Weekly Report
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [weeklyNotice, setWeeklyNotice] = useState('');

  // Feature C: Recovery Plan
  const [recoveryHabitId, setRecoveryHabitId] = useState('');
  const [recoveryPlan, setRecoveryPlan] = useState(null);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryNotice, setRecoveryNotice] = useState('');

  // Feature D: NLP Q&A
  const [questionInput, setQuestionInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I am your Gemini-powered Habit Intelligence Coach. Ask me anything about your completion patterns, streaks, or behavioral momentum.",
    },
  ]);
  const [qaLoading, setQaLoading] = useState(false);

  // Feature E: History
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Load habits on mount
  useEffect(() => {
    const loadHabits = async () => {
      try {
        const res = await api.get('/habits');
        if (res.data.success) {
          setUserHabits(res.data.habits);
          if (res.data.habits.length > 0 && !recoveryHabitId) {
            setRecoveryHabitId(res.data.habits[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load habits:', err);
      }
    };
    loadHabits();
  }, []);

  // Handle passed state (e.g. from Analytics "Recover" button)
  useEffect(() => {
    if (location.state?.recoveryHabitId) {
      setActiveTab('recovery');
      setRecoveryHabitId(location.state.recoveryHabitId);
    }
  }, [location.state]);

  // Handle Tab changes
  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await api.get('/ai/insights');
      if (res.data.success) {
        setHistoryItems(res.data.insights);
      }
    } catch (err) {
      console.error('Failed to load AI history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Feature A Handler: Generate Suggestions
  const handleGenerateSuggestions = async (e) => {
    e.preventDefault();
    if (!goalInput.trim()) return;

    setSuggestionsLoading(true);
    setSuggestionsNotice('');
    try {
      const res = await api.post('/ai/suggestions', { goal: goalInput.trim() });
      if (res.data.success) {
        setSuggestions(res.data.suggestions || []);
        if (res.data.notice) setSuggestionsNotice(res.data.notice);
      }
    } catch (err) {
      console.error('Suggestions error:', err);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  // Feature A: Approve & Add Suggestion to Database
  const handleApproveSuggestion = async (sug) => {
    try {
      await api.post('/habits', {
        title: sug.title,
        description: sug.description,
        category: sug.category || 'productivity',
        frequency: sug.frequency || 'daily',
        scheduledDays: sug.scheduledDays || [0, 1, 2, 3, 4, 5, 6],
        targetValue: sug.targetValue || 1,
        targetUnit: sug.targetUnit || 'times',
        color: '#10B981',
      });
      setAddedHabitTitles((prev) => new Set([...prev, sug.title]));
      // Refresh habits dropdown
      const res = await api.get('/habits');
      if (res.data.success) setUserHabits(res.data.habits);
    } catch (err) {
      console.error('Failed to add suggested habit:', err);
    }
  };

  // Feature B Handler: Generate Weekly Report
  const handleGenerateWeeklyReport = async () => {
    setWeeklyLoading(true);
    setWeeklyNotice('');
    try {
      const res = await api.post('/ai/weekly-report', {});
      if (res.data.success) {
        setWeeklyReport(res.data.report);
        if (res.data.notice) setWeeklyNotice(res.data.notice);
      }
    } catch (err) {
      console.error('Weekly report error:', err);
    } finally {
      setWeeklyLoading(false);
    }
  };

  // Feature C Handler: Generate Recovery Plan
  const handleGenerateRecoveryPlan = async () => {
    if (!recoveryHabitId) return;
    setRecoveryLoading(true);
    setRecoveryNotice('');
    try {
      const res = await api.post('/ai/recovery-plan', { habitId: recoveryHabitId });
      if (res.data.success) {
        setRecoveryPlan(res.data.plan);
        if (res.data.notice) setRecoveryNotice(res.data.notice);
      }
    } catch (err) {
      console.error('Recovery plan error:', err);
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Feature D Handler: Send Question to AI
  const handleSendQuestion = async (qText) => {
    const question = qText || questionInput;
    if (!question.trim()) return;

    const userMsg = { sender: 'user', text: question.trim() };
    setChatMessages((prev) => [...prev, userMsg]);
    setQuestionInput('');
    setQaLoading(true);

    try {
      const res = await api.post('/ai/analyze', { question: question.trim() });
      if (res.data.success) {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: res.data.answer,
            notice: res.data.notice,
          },
        ]);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Unable to process your request at this moment. Please check your connection.',
        },
      ]);
    } finally {
      setQaLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Google Gemini AI Behavioral Intelligence</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">AI Habit Coach & Resilience System</h2>
            <p className="text-xs text-indigo-200 mt-1 max-w-2xl">
              Personalized habit design, data-driven weekly performance audits, empathetic 3-day recovery pathways, and natural-language habit analytics.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
              activeTab === 'suggestions'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>Habit Suggestions</span>
          </button>

          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
              activeTab === 'weekly'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Weekly Report</span>
          </button>

          <button
            onClick={() => setActiveTab('recovery')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
              activeTab === 'recovery'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <LifeBuoy className="w-4 h-4" />
            <span>3-Day Recovery Plan</span>
          </button>

          <button
            onClick={() => setActiveTab('qa')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
              activeTab === 'qa'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Ask AI Coach</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
              activeTab === 'history'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Insights History</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: HABIT SUGGESTIONS                                 */}
      {/* ========================================================= */}
      {activeTab === 'suggestions' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Describe Your Goal</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter any life, health, or career goal. Gemini will structure scientifically calibrated habits with difficulty ratings and frequency recommendations.
            </p>

            <form onSubmit={handleGenerateSuggestions} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="e.g. Prepare for a half-marathon, become consistent with coding, read 20 books this year..."
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={suggestionsLoading || !goalInput.trim()}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs disabled:opacity-50 transition-all"
              >
                {suggestionsLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Goal...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Habits</span>
                  </>
                )}
              </button>
            </form>

            {suggestionsNotice && (
              <p className="mt-3 text-xs text-indigo-600 bg-indigo-50 p-2 rounded-lg border border-indigo-200">
                {suggestionsNotice}
              </p>
            )}
          </div>

          {/* Suggestions List */}
          {suggestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">Recommended Habits for You</h4>
                <span className="text-xs text-slate-500">Review and approve before saving</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestions.map((sug, idx) => {
                  const isAdded = addedHabitTitles.has(sug.title);
                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                            {sug.category}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sug.difficulty === 'Easy'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : sug.difficulty === 'Medium'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}
                          >
                            {sug.difficulty || 'Easy'}
                          </span>
                        </div>

                        <h5 className="text-base font-bold text-slate-900 mb-1">{sug.title}</h5>
                        <p className="text-xs text-slate-600 leading-relaxed mb-3">
                          {sug.description}
                        </p>

                        <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3">
                          <span className="font-semibold text-slate-700">Why this works:</span>{' '}
                          {sug.reason}
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>Target: {sug.targetValue} {sug.targetUnit}</span>
                          <span>•</span>
                          <span>{sug.frequency === 'daily' ? 'Every Day' : `${sug.scheduledDays?.length || 5} days/week`}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <button
                          onClick={() => handleApproveSuggestion(sug)}
                          disabled={isAdded}
                          className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
                            isAdded
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-700 stroke-[3]" />
                              <span>Added to Your Habits!</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 stroke-[2.5]" />
                              <span>Approve & Add Habit</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: PERSONALIZED WEEKLY REPORT                        */}
      {/* ========================================================= */}
      {activeTab === 'weekly' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Generate Weekly Behavioral Audit</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculates real numeric statistics on the server and asks Gemini to provide qualitative coaching.
              </p>
            </div>
            <button
              onClick={handleGenerateWeeklyReport}
              disabled={weeklyLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all shrink-0"
            >
              {weeklyLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Records...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Weekly Report</span>
                </>
              )}
            </button>
          </div>

          {weeklyNotice && (
            <p className="text-xs text-indigo-600 bg-indigo-50 p-2.5 rounded-xl border border-indigo-200">
              {weeklyNotice}
            </p>
          )}

          {weeklyReport && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
              {/* Summary */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Weekly Executive Summary
                </span>
                <p className="text-sm text-slate-800 leading-relaxed mt-1 font-medium bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                  {weeklyReport.summary}
                </p>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Behavioral Strengths</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {weeklyReport.strengths?.map((s, i) => (
                      <li key={i} className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 leading-relaxed">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>Friction & Growth Areas</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {weeklyReport.areasForImprovement?.map((a, i) => (
                      <li key={i} className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 leading-relaxed">
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actionable Tips */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Actionable Strategies for Next Week
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {weeklyReport.actionableTips?.map((tip, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
                      <span className="font-bold text-indigo-600 block mb-1">Tip #{i + 1}</span>
                      {tip}
                    </div>
                  ))}
                </div>
              </div>

              {/* Motivation */}
              {weeklyReport.motivation && (
                <div className="text-center p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-indigo-50 border border-emerald-200 text-xs font-semibold text-slate-800 italic">
                  "{weeklyReport.motivation}"
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: 3-DAY STREAK RECOVERY PLAN                        */}
      {/* ========================================================= */}
      {activeTab === 'recovery' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">3-Day Habit Recovery Pathway</h3>
            <p className="text-xs text-slate-500 mb-4">
              Setbacks happen to everyone. Select any habit where you missed a streak, and Gemini will engineer an achievable 3-day return sequence.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={recoveryHabitId}
                onChange={(e) => setRecoveryHabitId(e.target.value)}
                className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {userHabits.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.title} ({h.category})
                  </option>
                ))}
              </select>

              <button
                onClick={handleGenerateRecoveryPlan}
                disabled={recoveryLoading || !recoveryHabitId}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs disabled:opacity-50 transition-all"
              >
                {recoveryLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Designing Plan...</span>
                  </>
                ) : (
                  <>
                    <LifeBuoy className="w-4 h-4" />
                    <span>Generate Recovery Plan</span>
                  </>
                )}
              </button>
            </div>

            {recoveryNotice && (
              <p className="mt-3 text-xs text-indigo-600 bg-indigo-50 p-2 rounded-lg border border-indigo-200">
                {recoveryNotice}
              </p>
            )}
          </div>

          {recoveryPlan && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
              {/* Diagnosis */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Behavioral Assessment
                </span>
                <p className="text-sm text-slate-800 leading-relaxed mt-1 font-medium bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  {recoveryPlan.diagnosis}
                </p>
              </div>

              {/* 3 Days Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Day 1 */}
                <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 flex flex-col justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      Day 1 • {recoveryPlan.day1?.step || 'Micro-Start'}
                    </span>
                    <h5 className="text-sm font-bold text-slate-900 mt-2 mb-1">
                      {recoveryPlan.day1?.action}
                    </h5>
                  </div>
                  <div className="mt-4 pt-3 border-t border-emerald-200 text-xs text-emerald-900">
                    <span className="font-semibold block text-[11px] text-emerald-700">Friction Tweak:</span>
                    {recoveryPlan.day1?.frictionReduction}
                  </div>
                </div>

                {/* Day 2 */}
                <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/40 flex flex-col justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                      Day 2 • {recoveryPlan.day2?.step || 'Moderate Ramp'}
                    </span>
                    <h5 className="text-sm font-bold text-slate-900 mt-2 mb-1">
                      {recoveryPlan.day2?.action}
                    </h5>
                  </div>
                  <div className="mt-4 pt-3 border-t border-blue-200 text-xs text-blue-900">
                    <span className="font-semibold block text-[11px] text-blue-700">Friction Tweak:</span>
                    {recoveryPlan.day2?.frictionReduction}
                  </div>
                </div>

                {/* Day 3 */}
                <div className="p-5 rounded-2xl border border-indigo-200 bg-indigo-50/40 flex flex-col justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800">
                      Day 3 • {recoveryPlan.day3?.step || 'Full Routine'}
                    </span>
                    <h5 className="text-sm font-bold text-slate-900 mt-2 mb-1">
                      {recoveryPlan.day3?.action}
                    </h5>
                  </div>
                  <div className="mt-4 pt-3 border-t border-indigo-200 text-xs text-indigo-900">
                    <span className="font-semibold block text-[11px] text-indigo-700">Friction Tweak:</span>
                    {recoveryPlan.day3?.frictionReduction}
                  </div>
                </div>
              </div>

              {recoveryPlan.mindsetSupport && (
                <div className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs text-center leading-relaxed font-medium">
                  {recoveryPlan.mindsetSupport}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: ASK AI COACH (NLP Q&A)                             */}
      {/* ========================================================= */}
      {activeTab === 'qa' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col h-[600px]">
          {/* Quick Questions Chips */}
          <div className="mb-4 pb-3 border-b border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Suggested Questions
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendQuestion(q)}
                  className="px-3 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-xs font-medium transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`p-4 rounded-2xl max-w-xl text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-xs'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  {msg.text}
                  {msg.notice && (
                    <div className="mt-2 text-[10px] text-indigo-500 italic border-t border-slate-200/60 pt-1">
                      {msg.notice}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {qaLoading && (
              <div className="flex gap-3 items-center text-xs text-slate-400 italic">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <span>Analyzing your authentic habit metrics with Gemini...</span>
              </div>
            )}
          </div>

          {/* Question Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuestion();
            }}
            className="mt-4 pt-3 border-t border-slate-100 flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about your habit momentum, streaks, or consistency patterns..."
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={qaLoading || !questionInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>Ask</span>
            </button>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: AI INSIGHTS HISTORY                                */}
      {/* ========================================================= */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Historical AI Insights & Reports</h3>
              <p className="text-xs text-slate-500">
                All previously generated recommendations, recovery pathways, and weekly audits
              </p>
            </div>
            <button
              onClick={fetchHistory}
              disabled={historyLoading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              title="Refresh History"
            >
              <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {historyLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : historyItems.length > 0 ? (
            <div className="space-y-3">
              {historyItems.map((item) => (
                <div key={item._id} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-700 uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200">
                      {item.type.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {typeof item.content === 'string'
                      ? item.content
                      : item.content?.answer || item.content?.summary || item.content?.diagnosis || JSON.stringify(item.content)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-8">
              No historical insights found yet. Use any of the AI Coach tools above to generate insights.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
