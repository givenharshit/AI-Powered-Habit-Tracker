import mongoose from 'mongoose';

const habitCompletionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    habit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Habit',
      required: true,
      index: true,
    },
    date: {
      type: String, // 'YYYY-MM-DD' formatted date string
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'],
    },
    completed: {
      type: Boolean,
      default: true,
    },
    value: {
      type: Number,
      default: 1,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// CRITICAL: Ensure uniqueness so a habit cannot have multiple completion records for the same day
habitCompletionSchema.index({ user: 1, habit: 1, date: 1 }, { unique: true });
habitCompletionSchema.index({ user: 1, date: 1 });

export const HabitCompletion = mongoose.model('HabitCompletion', habitCompletionSchema);
