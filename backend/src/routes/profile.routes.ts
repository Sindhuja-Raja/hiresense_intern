import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorizeRole } from '../middleware/auth.middleware';
import {
  getProfile,
  updateProfile,
  addSkill,
  removeSkill,
  getApplicantProfile,
  parseResumeForProfile,
  parseAndSaveResumeForProfile,
} from '../controllers/profile.controller';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// All routes require authentication
router.use(authenticate);

// Get current user's profile
router.get('/me', getProfile);

// Update current user's profile
router.put('/me', updateProfile);

// Skill management
router.post('/skills', addSkill);
router.delete('/skills/:skill', removeSkill);

// Resume parsing for applicant profile
router.post('/resume/parse', authorizeRole('applicant'), upload.single('resume'), parseResumeForProfile);
router.post('/resume/parse-save', authorizeRole('applicant'), upload.single('resume'), parseAndSaveResumeForProfile);

// Get applicant profile by ID (recruiter only)
router.get('/applicant/:id', authorizeRole('recruiter'), getApplicantProfile);

export default router;
