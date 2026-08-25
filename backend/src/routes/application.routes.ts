import { Router } from 'express';
import { authenticate, authorizeRole } from '../middleware/auth.middleware';
import { 
  applyForJob,
  getMyApplications,
  getJobApplications,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  withdrawApplication
} from '../controllers/application.controller';
import {
  sendInterviewInvitations,
  getMyInvitations,
} from '../controllers/interview-invitation.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Applicant routes
router.post('/', authorizeRole('applicant'), applyForJob);
router.get('/my-applications', authorizeRole('applicant'), getMyApplications);
router.get('/my-invitations', authorizeRole('applicant'), getMyInvitations);
router.delete('/:id/withdraw', authorizeRole('applicant'), withdrawApplication);

// Common route - both roles can view application details
router.get('/:id', getApplicationById);

// Recruiter routes
router.get('/recruiter/all', authorizeRole('recruiter'), getAllApplications);
router.post('/recruiter/send-invites', authorizeRole('recruiter'), sendInterviewInvitations);
router.get('/job/:jobId', authorizeRole('recruiter'), getJobApplications);
router.put('/:id/status', authorizeRole('recruiter'), updateApplicationStatus);

export default router;
