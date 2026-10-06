import { Router } from 'express';
import { clearAllData, seedDemoData } from '../controllers/settingsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Operasi berbahaya — wajib login (JWT).
router.post('/clear-data', authenticateToken, clearAllData);
router.post('/seed-data', authenticateToken, seedDemoData);

export default router;
