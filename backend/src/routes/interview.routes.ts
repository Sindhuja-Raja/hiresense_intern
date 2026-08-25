import { Router } from 'express';
import { authenticate, authorizeRole } from '../middleware/auth.middleware';
import {
  completeInterview,
  getMyInterviews,
  proposeInterviewSlots,
  respondToInterview,
  sendUpcomingInterviewReminders,
} from '../controllers/interview.controller';

const router = Router();

router.use(authenticate);

router.get('/my', getMyInterviews);
router.post('/application/:applicationId/propose', authorizeRole('recruiter'), proposeInterviewSlots);
router.put('/:id/respond', authorizeRole('applicant'), respondToInterview);
router.put('/:id/complete', authorizeRole('recruiter'), completeInterview);
router.post('/reminders/run', authorizeRole('recruiter'), sendUpcomingInterviewReminders);

export default router;
