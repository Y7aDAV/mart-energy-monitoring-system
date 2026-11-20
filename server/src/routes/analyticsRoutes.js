import { Router } from 'express';
import { getSummary, getRealtimeTrend, getHistoricalTrend, getApplianceBreakdown } from '../controllers/analyticsController.js';

const router = Router();

router.get('/summary', getSummary);
router.get('/realtime', getRealtimeTrend);
router.get('/historical', getHistoricalTrend);
router.get('/breakdown', getApplianceBreakdown);

export default router;
