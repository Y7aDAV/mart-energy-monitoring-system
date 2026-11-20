import { Router } from 'express';
import { getDevices, createDevice, deleteDevice } from '../controllers/deviceController.js';

const router = Router();

router.get('/', getDevices);
router.post('/', createDevice);
router.delete('/:id', deleteDevice);

export default router;
