import { Router } from 'express';
import { authenticate, authorizeRole } from '../middleware/auth.middleware';
import {
  getMyReadinessSessions,
  getReadinessByApplication,
  getReadinessByJob,
  startReadinessSession,
  submitReadinessAnswer,
} from '../controllers/interview-readiness.controller';

const router = Router();

router.use(authenticate);

router.get('/my', authorizeRole('applicant'), getMyReadinessSessions);
router.get('/application/:applicationId', getReadinessByApplication);
router.get('/job/:jobId', authorizeRole('recruiter'), getReadinessByJob);
router.post('/application/:applicationId/start', authorizeRole('applicant'), startReadinessSession);
router.put('/:id/answer', authorizeRole('applicant'), submitReadinessAnswer);

export default router;
