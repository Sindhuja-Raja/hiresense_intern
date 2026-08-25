/**
 * AI Scoring Controller
 * 
 * Handles API endpoints for AI-powered candidate scoring and analysis.
 */

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Application } from '../models/Application.model';
import { Job } from '../models/Job.model';
import { startBackgroundScoring, getScoringProgress } from '../services/scoring-queue.service';
import { User } from '../models/User.model';
import { 
  scoreCandidate, 
  batchScoreCandidates,
  generateInterviewQuestions,
  getProviderInfo,
  setProvider,
  AIProvider,
  CandidateProfile,
  JobRequirements 
} from '../services/ai-scoring.service';

/**
 * Get AI provider info
 * GET /api/scoring/provider
 */
export const getProviderStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const info = getProviderInfo();
    res.status(200).json({
      status: 'success',
      data: info
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set AI provider
 * POST /api/scoring/provider
 */
export const setAIProvider = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { provider } = req.body;
    
    if (!['gemini', 'openai', 'auto'].includes(provider)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid provider. Use: gemini, openai, or auto'
      });
    }
    
    setProvider(provider as AIProvider);
    const info = getProviderInfo();
    
    res.status(200).json({
      status: 'success',
      message: `Provider set to ${provider}`,
      data: info
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Score a single application
 * POST /api/scoring/application/:id
 */
export const scoreApplication = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Get application with populated data
    const application = await Application.findById(id)
      .populate('applicantId', 'fullName email phone location bio skills experience education')
      .populate('jobId');
    
    if (!application) {
      return res.status(404).json({
        status: 'error',
        message: 'Application not found'
      });
    }
    
    // Verify recruiter owns this job
    const job = application.jobId as any;
    if (job.recruiterId.toString() !== req.user?.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized to score this application'
      });
    }
    
    const applicant = application.applicantId as any;
    
    // Build candidate profile
    const candidateProfile: CandidateProfile = {
      fullName: applicant.fullName,
      email: applicant.email,
      skills: applicant.skills || [],
      experience: applicant.experience,
      education: applicant.education,
      bio: applicant.bio,
      coverLetter: application.coverLetter,
    };
    
    // Build job requirements properly extracting skills from the DB model
    const jobRequirements: JobRequirements = {
      title: job.title,
      description: job.description,
      requiredSkills: job.skillsRequired || [], // Fix: Use actual DB field
      preferredSkills: [],
      location: job.location,
    };
    
    // Score the candidate
    const score = await scoreCandidate(candidateProfile, jobRequirements);
    
    res.status(200).json({
      status: 'success',
      data: {
        applicationId: application._id,
        candidate: applicant.fullName,
        job: job.title,
        score
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Score all applications for a job
 * POST /api/scoring/job/:jobId
 */
export const scoreJobApplications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    
    // Get the job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: 'Job not found'
      });
    }
    
    // Verify recruiter owns this job
    if (job.recruiterId.toString() !== req.user?.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized to score applications for this job'
      });
    }
    
    // Get all applications for this job
    const applications = await Application.find({ jobId })
      .populate('applicantId', 'fullName email phone location bio skills experience education');
    
    if (applications.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No applications found for this job',
        data: { rankings: [] }
      });
    }
    
    // Build job requirements properly extracting skills from the DB model
    const jobRequirements: JobRequirements = {
      title: job.title,
      description: job.description || '',
      requiredSkills: job.skillsRequired || [],
      preferredSkills: [],
      location: job.location,
    };
    
    // Check if a scoring job is already running
    const currentProgress = getScoringProgress(jobId);
    if (currentProgress && currentProgress.status === 'processing') {
      return res.status(202).json({
        status: 'success',
        message: 'Scoring is already in progress',
        data: { progress: currentProgress }
      });
    }

    // Start scoring in the background (DO NOT AWAIT)
    startBackgroundScoring(jobId, applications, jobRequirements);
    
    // Immediately return 202 Accepted
    res.status(202).json({
      status: 'success',
      message: 'Scoring started in the background',
      data: {
        job: job.title,
        totalApplications: applications.length,
        status: 'processing'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get progress of background scoring job
 * GET /api/scoring/job/:jobId/progress
 */
export const getJobScoringProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    
    // Verify recruiter owns this job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ status: 'error', message: 'Job not found' });
    }
    
    if (job.recruiterId.toString() !== req.user?.id) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized' });
    }
    
    const progress = getScoringProgress(jobId);
    
    // If done, we can optionally fetch the completed applications to return
    if (!progress || progress.status === 'done') {
      const applications = await Application.find({ jobId })
        .populate('applicantId', 'fullName email')
        .sort({ aiScore: -1 });
        
      const rankings = applications.map((app: any, index) => ({
        rank: index + 1,
        applicationId: app._id,
        candidate: {
          name: app.applicantId?.fullName || 'Unknown',
          email: app.applicantId?.email || 'Unknown',
        },
        score: app.aiScore || 0,
      }));

      return res.status(200).json({
        status: 'success',
        data: {
          progress: progress || { status: 'done', total: applications.length, completed: applications.length },
          rankings
        }
      });
    }

    res.status(200).json({
      status: 'success',
      data: { progress }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate personalized interview questions for an application
 * POST /api/scoring/application/:id/questions
 */
export const getInterviewQuestions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { count = 5 } = req.body;
    
    // Get application with populated data
    const application = await Application.findById(id)
      .populate('applicantId', 'fullName email skills experience education bio')
      .populate('jobId');
    
    if (!application) {
      return res.status(404).json({
        status: 'error',
        message: 'Application not found'
      });
    }
    
    // Verify recruiter owns this job
    const job = application.jobId as any;
    if (job.recruiterId.toString() !== req.user?.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }
    
    const applicant = application.applicantId as any;
    
    // Build profiles
    const candidateProfile: CandidateProfile = {
      fullName: applicant.fullName,
      email: applicant.email,
      skills: applicant.skills || [],
      experience: applicant.experience,
      education: applicant.education,
      bio: applicant.bio,
    };
    
    const jobRequirements: JobRequirements = {
      title: job.title,
      description: job.description || '',
      requiredSkills: job.requirements?.split(',').map((s: string) => s.trim()) || [],
    };
    
    // Generate questions
    const questions = await generateInterviewQuestions(candidateProfile, jobRequirements, count);
    
    res.status(200).json({
      status: 'success',
      data: {
        candidate: applicant.fullName,
        job: job.title,
        questions
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Quick score based on provided data (no application required)
 * POST /api/scoring/quick
 */
export const quickScore = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { candidate, job } = req.body;
    
    if (!candidate || !job) {
      return res.status(400).json({
        status: 'error',
        message: 'Both candidate and job data are required'
      });
    }
    
    const score = await scoreCandidate(candidate, job);
    
    res.status(200).json({
      status: 'success',
      data: { score }
    });
  } catch (error) {
    next(error);
  }
};
