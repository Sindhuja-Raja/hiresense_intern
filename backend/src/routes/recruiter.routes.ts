import { Router } from 'express';
import { authenticate, authorizeRole } from '../middleware/auth.middleware';
import { 
  getDashboardStats,
  getRecentApplications
} from '../controllers/recruiter.controller';

const router = Router();

// All routes require authentication and recruiter role
router.use(authenticate);
router.use(authorizeRole('recruiter'));

router.get('/dashboard', getDashboardStats);
router.get('/recent-applications', getRecentApplications);

export default router;
