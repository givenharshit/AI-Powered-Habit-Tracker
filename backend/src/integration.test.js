import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from './server.js';
import { formatDateKey } from './services/streakEngine.js';

let mongod;
let server;
let baseUrl;

test.before(async () => {
  process.env.NODE_ENV = 'test';
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(uri);

  server = app.listen(0);
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
  if (server) server.close();
});

test('Full Integration Flow: Auth, Habits, Completions, Analytics, AI & Isolation', async (t) => {
  let userAToken;
  let userAId;
  let userBToken;
  let userBId;
  let habit1Id;
  let habit2Id;
  const today = formatDateKey(new Date());

  await t.test('1. User A Registration & Profile', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sarah Connor',
        email: 'sarah@example.com',
        password: 'Password123!',
      }),
    });
    const data = await res.json();
    assert.equal(res.status, 201);
    assert.equal(data.success, true);
    assert.ok(data.token);
    assert.equal(data.user.email, 'sarah@example.com');
    userAToken = data.token;
    userAId = data.user.id;

    // Verify /api/auth/me
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const meData = await meRes.json();
    assert.equal(meRes.status, 200);
    assert.equal(meData.user.name, 'Sarah Connor');
  });

  await t.test('2. User B Registration for Isolation Checks', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password456!',
      }),
    });
    const data = await res.json();
    assert.equal(res.status, 201);
    userBToken = data.token;
    userBId = data.user.id;
  });

  await t.test('3. User A creates daily and weekly habits', async () => {
    // Habit 1: Daily Reading
    const res1 = await fetch(`${baseUrl}/api/habits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        title: 'Read 30 mins',
        description: 'Read technical and philosophy books',
        category: 'learning',
        frequency: 'daily',
        targetValue: 30,
        targetUnit: 'minutes',
      }),
    });
    const data1 = await res1.json();
    assert.equal(res1.status, 201);
    assert.equal(data1.habit.title, 'Read 30 mins');
    habit1Id = data1.habit._id;

    // Habit 2: Workout (Mon, Wed, Fri)
    const res2 = await fetch(`${baseUrl}/api/habits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        title: 'Gym Workout',
        description: 'Resistance training',
        category: 'fitness',
        frequency: 'weekly_days',
        scheduledDays: [1, 3, 5],
        targetValue: 45,
        targetUnit: 'minutes',
      }),
    });
    const data2 = await res2.json();
    assert.equal(res2.status, 201);
    habit2Id = data2.habit._id;
  });

  await t.test('4. Habit List returns only User A habits', async () => {
    const res = await fetch(`${baseUrl}/api/habits`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.count, 2);

    // User B should see 0 habits
    const resB = await fetch(`${baseUrl}/api/habits`, {
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    const dataB = await resB.json();
    assert.equal(resB.status, 200);
    assert.equal(dataB.count, 0);
  });

  await t.test('5. Data Isolation: User B cannot modify User A habit', async () => {
    const res = await fetch(`${baseUrl}/api/habits/${habit1Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userBToken}`,
      },
      body: JSON.stringify({ title: 'Hacked Title' }),
    });
    assert.equal(res.status, 404);
  });

  await t.test('6. Complete habit and toggle undo', async () => {
    // Toggle complete
    const res1 = await fetch(`${baseUrl}/api/habits/${habit1Id}/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({ date: today }),
    });
    const data1 = await res1.json();
    assert.equal(res1.status, 200);
    assert.equal(data1.isCompleted, true);
    assert.equal(data1.streakStats.currentStreak, 1);

    // Toggle again -> Undoes completion
    const res2 = await fetch(`${baseUrl}/api/habits/${habit1Id}/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({ date: today }),
    });
    const data2 = await res2.json();
    assert.equal(res2.status, 200);
    assert.equal(data2.isCompleted, false);
    assert.equal(data2.streakStats.currentStreak, 0);

    // Re-complete so it has active data for analytics
    await fetch(`${baseUrl}/api/habits/${habit1Id}/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({ date: today }),
    });
  });

  await t.test('7. Analytics: Dashboard, Weekly, Heatmap, Streaks', async () => {
    const dashRes = await fetch(`${baseUrl}/api/analytics/dashboard?date=${today}`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const dashData = await dashRes.json();
    assert.equal(dashRes.status, 200);
    assert.equal(dashData.data.totalHabits, 2);
    assert.equal(dashData.data.completedTodayCount, 1);

    // Heatmap (90 days)
    const heatRes = await fetch(`${baseUrl}/api/analytics/heatmap?date=${today}`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const heatData = await heatRes.json();
    assert.equal(heatRes.status, 200);
    assert.equal(heatData.data.length, 90);

    // Streaks
    const streakRes = await fetch(`${baseUrl}/api/analytics/streaks`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const streakData = await streakRes.json();
    assert.equal(streakRes.status, 200);
    assert.equal(streakData.count, 2);
  });

  await t.test('8. AI Endpoints (Suggestions, Weekly Report, Recovery Plan, NLP Q&A)', async () => {
    // A: Habit Suggestions
    const sugRes = await fetch(`${baseUrl}/api/ai/suggestions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({ goal: 'Improve sleep routines and wake up at 6am' }),
    });
    const sugData = await sugRes.json();
    assert.equal(sugRes.status, 200);
    assert.ok(Array.isArray(sugData.suggestions));
    assert.ok(sugData.suggestions.length > 0);

    // B: Weekly Report
    const repRes = await fetch(`${baseUrl}/api/ai/weekly-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({ date: today }),
    });
    const repData = await repRes.json();
    assert.equal(repRes.status, 200);
    assert.ok(repData.report.summary);
    assert.ok(repData.metrics);

    // C: Recovery Plan
    const recRes = await fetch(`${baseUrl}/api/ai/recovery-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({ habitId: habit1Id }),
    });
    const recData = await recRes.json();
    assert.equal(recRes.status, 200);
    assert.ok(recData.plan.day1);
    assert.ok(recData.plan.day2);
    assert.ok(recData.plan.day3);

    // D: NLP Analysis
    const qaRes = await fetch(`${baseUrl}/api/ai/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({ question: 'Which habit am I doing best with?' }),
    });
    const qaData = await qaRes.json();
    assert.equal(qaRes.status, 200);
    assert.ok(qaData.answer);
  });
});
