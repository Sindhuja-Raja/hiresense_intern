import { Response, NextFunction } from 'express';
import { Job } from '../models/Job.model';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { groqClient } from '../utils/groq-client';

// Simplified Job Controller - Basic CRUD operations only

export const createJob = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { 
      title, 
      description, 
      location, 
      employmentType,
      applicationDeadline,
      experienceMin,
      experienceMax,
      salaryMin,
      salaryMax,
      salaryCurrency,
      skillsRequired,
      educationLevel,
      openings,
      knockoutQuestions
    } = req.body;

    if (!title || !description) {
      throw new AppError('Title and description are required', 400);
    }

    const normalizedSkills = Array.isArray(skillsRequired)
      ? skillsRequired
      : (typeof skillsRequired === 'string'
          ? skillsRequired.split(',').map((s: string) => s.trim()).filter(Boolean)
          : undefined);

    let interviewQuestions: string[] = [];
    if (groqClient.isEnabled()) {
      try {
        const prompt = `Based on the following job description, generate 5 highly specific interview questions to assess a candidate's readiness for the role. Make them a mix of technical, situational, and architectural questions.
Title: ${title}
Required Skills: ${(normalizedSkills || []).join(', ')}
Description: ${description}

Return ONLY a JSON object exactly like this: { "questions": ["question1", "question2", ...] }`;
        const result = await groqClient.complete(prompt, "You are an expert technical interviewer. Respond with valid JSON only.", 0.7);
        const parsed = JSON.parse(result);
        if (Array.isArray(parsed.questions)) {
          interviewQuestions = parsed.questions.slice(0, 5);
        }
      } catch (err) {
        console.warn('⚠️ Failed to generate AI interview questions for job:', err);
      }
    }

    const job = await Job.create({
      recruiterId: req.user?.id,
      title,
      description,
      location: location || 'Remote',
      employmentType: employmentType || 'Full-time',
      experienceMin,
      experienceMax,
      salaryMin,
      salaryMax,
      salaryCurrency,
      skillsRequired: normalizedSkills,
      educationLevel,
      openings,
      status: 'active',
      applicationDeadline,
      knockoutQuestions: Array.isArray(knockoutQuestions) ? knockoutQuestions : [],
      interviewQuestions
    });

    res.status(201).json({
      status: 'success',
      message: 'Job created successfully',
      data: { job }
    });
  } catch (error) {
    next(error);
  }
};

export const getJobs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const filter: any = {};

    // If recruiter, show their jobs; if applicant, show only active jobs
    if (req.user?.role === 'recruiter') {
      filter.recruiterId = req.user.id;
      if (status) filter.status = status;
    } else {
      filter.status = 'active';
    }

    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .populate('recruiterId', 'fullName email');

    res.status(200).json({
      status: 'success',
      results: jobs.length,
      data: { jobs }
    });
  } catch (error) {
    next(error);
  }
};

export const getJobById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('recruiterId', 'fullName email');

    if (!job) {
      throw new AppError('Job not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { job }
    });
  } catch (error) {
    next(error);
  }
};

export const updateJob = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Only allow updating basic fields
    const allowedUpdates = [
      'title',
      'description',
      'location',
      'employmentType',
      'status',
      'applicationDeadline',
      'experienceMin',
      'experienceMax',
      'salaryMin',
      'salaryMax',
      'salaryCurrency',
      'skillsRequired',
      'educationLevel',
      'openings'
    ];
    const updates: any = {};
    
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        if (field === 'skillsRequired') {
          const value = req.body[field];
          updates[field] = Array.isArray(value)
            ? value
            : (typeof value === 'string'
                ? value.split(',').map((s: string) => s.trim()).filter(Boolean)
                : value);
        } else {
          updates[field] = req.body[field];
        }
      }
    }

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, recruiterId: req.user?.id },
      updates,
      { new: true, runValidators: true }
    );

    if (!job) {
      throw new AppError('Job not found or unauthorized', 404);
    }

    res.status(200).json({
      status: 'success',
      message: 'Job updated successfully',
      data: { job }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteJob = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      recruiterId: req.user?.id
    });

    if (!job) {
      throw new AppError('Job not found or unauthorized', 404);
    }

    res.status(200).json({
      status: 'success',
      message: 'Job deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get all active jobs for applicants (public)
export const getActiveJobs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      search,
      skills,
      salaryMin,
      salaryMax,
      experienceMin,
      experienceMax,
      location,
      employmentType,
    } = req.query;

    const filter: any = { status: 'active' };

    if (search && typeof search === 'string') {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    if (location && typeof location === 'string') {
      filter.location = { $regex: location, $options: 'i' };
    }

    if (employmentType && typeof employmentType === 'string') {
      filter.employmentType = employmentType;
    }

    if (skills && typeof skills === 'string') {
      const skillTokens = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (skillTokens.length > 0) {
        filter.skillsRequired = { $in: skillTokens.map((skill) => new RegExp(`^${skill}$`, 'i')) };
      }
    }

    const salaryFilter: any = {};
    if (salaryMin && !Number.isNaN(Number(salaryMin))) {
      salaryFilter.$gte = Number(salaryMin);
    }
    if (salaryMax && !Number.isNaN(Number(salaryMax))) {
      salaryFilter.$lte = Number(salaryMax);
    }
    if (Object.keys(salaryFilter).length > 0) {
      filter.salaryMin = salaryFilter;
    }

    const expFilter: any = {};
    if (experienceMin && !Number.isNaN(Number(experienceMin))) {
      expFilter.$gte = Number(experienceMin);
    }
    if (experienceMax && !Number.isNaN(Number(experienceMax))) {
      expFilter.$lte = Number(experienceMax);
    }
    if (Object.keys(expFilter).length > 0) {
      filter.experienceMin = expFilter;
    }

    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .select('title description location employmentType applicationDeadline createdAt experienceMin experienceMax salaryMin salaryMax salaryCurrency skillsRequired educationLevel openings knockoutQuestions');

    res.status(200).json({
      status: 'success',
      results: jobs.length,
      data: { jobs }
    });
  } catch (error) {
    next(error);
  }
};
