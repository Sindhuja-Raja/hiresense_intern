import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/notification.controller';

const router = Router();

router.use(authenticate);

router.get('/my', getMyNotifications);
router.put('/:id/read', markNotificationRead);
router.put('/read-all', markAllNotificationsRead);

export default router;
