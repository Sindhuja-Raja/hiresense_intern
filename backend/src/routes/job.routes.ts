import { Router } from 'express';
import { authenticate, authorizeRole } from '../middleware/auth.middleware';
import { 
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  getActiveJobs
} from '../controllers/job.controller';

const router = Router();

// Public routes - view active jobs
router.get('/active', getActiveJobs);

// Authenticated routes
router.get('/', authenticate, getJobs);
router.get('/:id', authenticate, getJobById);

// Recruiter-only routes
router.post('/', authenticate, authorizeRole('recruiter'), createJob);
router.put('/:id', authenticate, authorizeRole('recruiter'), updateJob);
router.delete('/:id', authenticate, authorizeRole('recruiter'), deleteJob);

export default router;
