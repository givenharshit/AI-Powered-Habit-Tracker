import mongoose from 'mongoose';

const aiInsightSchema = new mongoose.Schema(
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
      default: null,
    },
    type: {
      type: String,
      enum: ['suggestion', 'weekly_report', 'recovery_plan', 'qa_analysis', 'motivational'],
      required: true,
    },
    title: {
      type: String,
      default: '',
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

aiInsightSchema.index({ user: 1, type: 1, createdAt: -1 });

export const AIInsight = mongoose.model('AIInsight', aiInsightSchema);
