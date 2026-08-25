/**
 * AI Scoring Routes
 * 
 * Routes for AI-powered candidate scoring and analysis.
 * All routes require authentication (recruiter role).
 */

import { Router } from 'express';
import { authenticate, authorizeRole } from '../middleware/auth.middleware';
import {
  scoreApplication,
  scoreJobApplications,
  getJobScoringProgress,
  getInterviewQuestions,
  quickScore,
  getProviderStatus,
  setAIProvider,
} from '../controllers/scoring.controller';

const router = Router();

// All scoring routes require authentication and recruiter role
router.use(authenticate);
router.use(authorizeRole('recruiter'));

/**
 * @route   GET /api/scoring/provider
 * @desc    Get current AI provider status and configuration
 * @access  Private (Recruiter only)
 * @returns { provider, openaiAvailable, openaiModel, geminiAvailable }
 */
router.get('/provider', getProviderStatus);

/**
 * @route   POST /api/scoring/provider
 * @desc    Set AI provider (gemini, openai, or auto)
 * @access  Private (Recruiter only)
 * @body    { provider: 'gemini' | 'openai' | 'auto' }
 */
router.post('/provider', setAIProvider);

/**
 * @route   POST /api/scoring/application/:id
 * @desc    Score a single application using AI
 * @access  Private (Recruiter only)
 * @params  id - Application ID
 * @returns AI-generated score with breakdown
 */
router.post('/application/:id', scoreApplication);

/**
 * @route   POST /api/scoring/job/:jobId
 * @desc    Score and rank all applications for a job
 * @access  Private (Recruiter only)
 * @params  jobId - Job ID
 * @returns Ranked list of candidates with scores
 */
router.post('/job/:jobId', scoreJobApplications);

/**
 * @route   GET /api/scoring/job/:jobId/progress
 * @desc    Get progress of a background scoring job
 * @access  Private (Recruiter only)
 * @params  jobId - Job ID
 */
router.get('/job/:jobId/progress', getJobScoringProgress);

/**
 * @route   POST /api/scoring/application/:id/questions
 * @desc    Generate personalized interview questions for a candidate
 * @access  Private (Recruiter only)
 * @params  id - Application ID
 * @body    { count?: number } - Number of questions (default: 5)
 * @returns Array of AI-generated interview questions
 */
router.post('/application/:id/questions', getInterviewQuestions);

/**
 * @route   POST /api/scoring/quick
 * @desc    Quick score with provided candidate/job data (no application required)
 * @access  Private (Recruiter only)
 * @body    { 
 *            candidate: CandidateProfile, 
 *            job: JobRequirements 
 *          }
 * @returns AI-generated score
 */
router.post('/quick', quickScore);

export default router;
