import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Habit title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    category: {
      type: String,
      enum: ['health', 'productivity', 'learning', 'mindfulness', 'fitness', 'finance', 'other'],
      default: 'productivity',
    },
    color: {
      type: String,
      default: '#10B981', // emerald-500
    },
    icon: {
      type: String,
      default: 'CheckCircle2',
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly_days'],
      default: 'daily',
    },
    scheduledDays: {
      type: [Number],
      default: [0, 1, 2, 3, 4, 5, 6], // 0: Sun, 1: Mon, ..., 6: Sat
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0 && v.every((d) => d >= 0 && d <= 6);
        },
        message: 'Habit must have at least one scheduled day (0-6).',
      },
    },
    targetValue: {
      type: Number,
      default: 1,
      min: [1, 'Target value must be at least 1'],
    },
    targetUnit: {
      type: String,
      default: 'times',
      trim: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user habit listing
habitSchema.index({ user: 1, isArchived: 1 });

export const Habit = mongoose.model('Habit', habitSchema);
