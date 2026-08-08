import { Router } from 'express';
import {
  getNotifications,
  createNotification,
  markNotificationRead,
  deleteNotification,
} from '../controllers/notificationsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authenticateTokenOrApiKey } from '../middleware/apiKeyMiddleware.js';

const router = Router();

// GET: boleh JWT atau API key (read-only). Tulis (POST/PUT/DELETE): wajib JWT.
router.use((req, res, next) => {
  if (req.method === 'GET') return authenticateTokenOrApiKey(req, res, next);
  return authenticateToken(req, res, next);
});

router.get('/', getNotifications);                 // GET /api/notifications
router.post('/', createNotification);              // POST /api/notifications
router.put('/:id/read', markNotificationRead);     // PUT /api/notifications/:id/read | /all/read
router.delete('/:id', deleteNotification);         // DELETE /api/notifications/:id

export default router;
