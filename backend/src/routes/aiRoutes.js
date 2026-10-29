import express from 'express';
import {
  getHabitSuggestionsController,
  getWeeklyReportController,
  getRecoveryPlanController,
  analyzeHabitsController,
  getMotivationalController,
  getInsightsHistory,
} from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/suggestions', getHabitSuggestionsController);
router.post('/weekly-report', getWeeklyReportController);
router.post('/recovery-plan', getRecoveryPlanController);
router.post('/analyze', analyzeHabitsController);
router.get('/motivational', getMotivationalController);
router.get('/insights', getInsightsHistory);

export default router;
