import { z } from 'zod';

export const validate = (schema) => (req, res, next) => {
  try {
    const validatedData = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    // Replace with sanitized/validated data
    if (validatedData.body) req.body = validatedData.body;
    if (validatedData.query) req.query = validatedData.query;
    if (validatedData.params) req.params = validatedData.params;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.slice(1).join('.'),
        message: err.message,
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please check your inputs.',
        errors: formattedErrors,
      });
    }
    next(error);
  }
};

// Common Schemas
export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    timezone: z.string().optional().default('UTC'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const habitSchemaValidator = z.object({
  body: z.object({
    title: z.string().min(1, 'Habit title is required').max(100),
    description: z.string().max(500).optional().default(''),
    category: z.enum(['health', 'productivity', 'learning', 'mindfulness', 'fitness', 'finance', 'other']).default('productivity'),
    color: z.string().optional().default('#10B981'),
    icon: z.string().optional().default('CheckCircle2'),
    frequency: z.enum(['daily', 'weekly_days']).default('daily'),
    scheduledDays: z.array(z.number().min(0).max(6)).min(1, 'Select at least one scheduled day').optional().default([0, 1, 2, 3, 4, 5, 6]),
    targetValue: z.number().min(1).optional().default(1),
    targetUnit: z.string().optional().default('times'),
  }),
});

export const completionSchema = z.object({
  body: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
    completed: z.boolean().optional().default(true),
    value: z.number().optional().default(1),
    notes: z.string().max(500).optional().default(''),
  }),
});
