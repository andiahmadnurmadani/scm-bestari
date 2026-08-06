import { Router } from 'express';
import {
  getNotifications,
  createNotification,
  markNotificationRead,
  deleteNotification,
} from '../controllers/notificationsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Semua endpoint wajib login (JWT)
router.use(authenticateToken);

router.get('/', getNotifications);                 // GET /api/notifications
router.post('/', createNotification);              // POST /api/notifications
router.put('/:id/read', markNotificationRead);     // PUT /api/notifications/:id/read | /all/read
router.delete('/:id', deleteNotification);         // DELETE /api/notifications/:id

export default router;
