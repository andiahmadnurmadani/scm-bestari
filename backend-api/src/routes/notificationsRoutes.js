import { Router } from 'express';
import {
  getNotifications,
  createNotification,
  markNotificationRead,
  deleteNotification,
} from '../controllers/notificationsController.js';

const router = Router();

router.get('/', getNotifications);                 // GET /api/notifications
router.post('/', createNotification);              // POST /api/notifications
router.put('/:id/read', markNotificationRead);     // PUT /api/notifications/:id/read | /all/read
router.delete('/:id', deleteNotification);         // DELETE /api/notifications/:id

export default router;
