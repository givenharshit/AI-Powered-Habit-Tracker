import express from 'express';
import { getDashboard, getWeekly, getHeatmap, getStreaks } from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/weekly', getWeekly);
router.get('/heatmap', getHeatmap);
router.get('/streaks', getStreaks);

export default router;
