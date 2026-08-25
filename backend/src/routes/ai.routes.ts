import { Router } from 'express';
import { authenticate, authorizeRole } from '../middleware/auth.middleware';
import { searchCandidates } from '../controllers/ai-search.controller';

const router = Router();

// All AI search routes require authentication and recruiter role
router.use(authenticate);
router.use(authorizeRole('recruiter'));

/**
 * @route   POST /api/ai/search-candidates
 * @desc    Search candidates using natural language query
 * @access  Private (Recruiter only)
 */
router.post('/search-candidates', searchCandidates);

export default router;
