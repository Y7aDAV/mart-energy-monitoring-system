import { Router } from 'express';
import { ingestTelemetry, getLiveTelemetry } from '../controllers/telemetryController.js';

const router = Router();

router.post('/', ingestTelemetry);
router.get('/live', getLiveTelemetry);

export default router;
