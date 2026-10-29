import express from 'express';
import {
  getHabits,
  createHabit,
  getHabitById,
  updateHabit,
  deleteHabit,
  toggleArchiveHabit,
  toggleHabitCompletion,
  getCompletions,
} from '../controllers/habitController.js';
import { protect } from '../middleware/auth.js';
import { validate, habitSchemaValidator } from '../middleware/validate.js';

const router = express.Router();

// Apply auth protection to all habit routes
router.use(protect);

router.get('/', getHabits);
router.post('/', validate(habitSchemaValidator), createHabit);
router.get('/completions', getCompletions);
router.get('/:id', getHabitById);
router.patch('/:id', updateHabit);
router.delete('/:id', deleteHabit);
router.patch('/:id/archive', toggleArchiveHabit);
router.post('/:id/toggle', toggleHabitCompletion);

export default router;
