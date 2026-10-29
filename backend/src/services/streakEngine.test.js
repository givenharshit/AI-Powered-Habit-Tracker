import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateHabitStreak, isScheduledDay, getScheduledDateKeys } from './streakEngine.js';

test('Streak Engine - Empty history', () => {
  const habit = { frequency: 'daily', createdAt: new Date('2026-10-01') };
  const result = calculateHabitStreak(habit, [], '2026-10-27');

  assert.equal(result.currentStreak, 0);
  assert.equal(result.longestStreak, 0);
  assert.equal(result.totalCompletions, 0);
  assert.equal(result.completionRate, 0);
  assert.equal(result.isCompletedToday, false);
  assert.equal(result.scheduledForToday, true);
});

test('Streak Engine - A first completion today', () => {
  const habit = { frequency: 'daily', createdAt: new Date('2026-10-27') };
  const completions = [{ date: '2026-10-27', completed: true }];
  const result = calculateHabitStreak(habit, completions, '2026-10-27');

  assert.equal(result.currentStreak, 1);
  assert.equal(result.longestStreak, 1);
  assert.equal(result.totalCompletions, 1);
  assert.equal(result.isCompletedToday, true);
});

test('Streak Engine - Consecutive successful days including today', () => {
  const habit = { frequency: 'daily', createdAt: new Date('2026-10-20') };
  const completions = [
    { date: '2026-10-24', completed: true },
    { date: '2026-10-25', completed: true },
    { date: '2026-10-26', completed: true },
    { date: '2026-10-27', completed: true },
  ];
  const result = calculateHabitStreak(habit, completions, '2026-10-27');

  assert.equal(result.currentStreak, 4);
  assert.equal(result.longestStreak, 4);
  assert.equal(result.totalCompletions, 4);
});

test('Streak Engine - Current day not yet completed preserves yesterday streak', () => {
  const habit = { frequency: 'daily', createdAt: new Date('2026-10-20') };
  const completions = [
    { date: '2026-10-24', completed: true },
    { date: '2026-10-25', completed: true },
    { date: '2026-10-26', completed: true },
  ];
  // Today is 2026-10-27, not completed yet
  const result = calculateHabitStreak(habit, completions, '2026-10-27');

  assert.equal(result.currentStreak, 3);
  assert.equal(result.longestStreak, 3);
  assert.equal(result.isCompletedToday, false);
});

test('Streak Engine - A missed scheduled day breaks active streak', () => {
  const habit = { frequency: 'daily', createdAt: new Date('2026-10-20') };
  // Missed 2026-10-26!
  const completions = [
    { date: '2026-10-23', completed: true },
    { date: '2026-10-24', completed: true },
    { date: '2026-10-25', completed: true },
  ];
  // Today is 2026-10-27 (not completed). Yesterday 2026-10-26 was also missed.
  const result = calculateHabitStreak(habit, completions, '2026-10-27');

  assert.equal(result.currentStreak, 0);
  assert.equal(result.longestStreak, 3); // Longest was 3
});

test('Streak Engine - Longest streak preserved after a gap', () => {
  const habit = { frequency: 'daily', createdAt: new Date('2026-10-01') };
  // Streak 1: 5 days (Oct 10 - Oct 14)
  // Gap on Oct 15
  // Streak 2: 2 days (Oct 16 - Oct 17)
  const completions = [
    { date: '2026-10-10' },
    { date: '2026-10-11' },
    { date: '2026-10-12' },
    { date: '2026-10-13' },
    { date: '2026-10-14' },
    { date: '2026-10-16' },
    { date: '2026-10-17' },
  ];
  const result = calculateHabitStreak(habit, completions, '2026-10-17');

  assert.equal(result.currentStreak, 2);
  assert.equal(result.longestStreak, 5);
  assert.equal(result.totalCompletions, 7);
});

test('Streak Engine - Weekly schedule (Mon, Wed, Fri only)', () => {
  // 2026-10-19 is Monday (1)
  // 2026-10-21 is Wednesday (3)
  // 2026-10-23 is Friday (5)
  // 2026-10-26 is Monday (1)
  const habit = {
    frequency: 'weekly_days',
    scheduledDays: [1, 3, 5], // Mon, Wed, Fri
    createdAt: new Date('2026-10-19'),
  };

  const completions = [
    { date: '2026-10-19' }, // Mon
    { date: '2026-10-21' }, // Wed
    { date: '2026-10-23' }, // Fri
    { date: '2026-10-26' }, // Mon
  ];

  // If today is Tuesday 2026-10-27 (not scheduled day for this habit):
  // Yesterday Monday was completed -> streak should be 4!
  const resultTue = calculateHabitStreak(habit, completions, '2026-10-27');
  assert.equal(resultTue.scheduledForToday, false);
  assert.equal(resultTue.currentStreak, 4);
  assert.equal(resultTue.longestStreak, 4);
});

test('Streak Engine - Historical correction / undo reduces streak', () => {
  const habit = { frequency: 'daily', createdAt: new Date('2026-10-20') };
  let completions = [
    { date: '2026-10-25' },
    { date: '2026-10-26' },
    { date: '2026-10-27' },
  ];
  let res = calculateHabitStreak(habit, completions, '2026-10-27');
  assert.equal(res.currentStreak, 3);

  // Undo completion on 2026-10-26 (leaves gap)
  completions = [
    { date: '2026-10-25' },
    { date: '2026-10-27' },
  ];
  res = calculateHabitStreak(habit, completions, '2026-10-27');
  assert.equal(res.currentStreak, 1); // Only today counts now
});
