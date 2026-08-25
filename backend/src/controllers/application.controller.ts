import { Response, NextFunction } from 'express';
import { Application } from '../models/Application.model';
import { Job } from '../models/Job.model';
import { User } from '../models/User.model';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

const APPLICANT_JOB_FIELDS = [
  'title',
  'description',
  'location',
  'employmentType',
  'experienceMin',
  'experienceMax',
  'salaryMin',
  'salaryMax',
  'salaryCurrency',
  'skillsRequired',
  'educationLevel',
  'openings',
  'applicationDeadline',
  'status',
  'createdAt',
  'recruiterId',
].join(' ');

const RECRUITER_COMPANY_FIELDS = [
  'fullName',
  'email',
  'companyName',
  'companyWebsite',
  'companyLinkedinUrl',
  'companyLogoUrl',
  'companyIndustry',
  'companySize',
  'companyFoundedYear',
  'companyHeadquarters',
  'companyDescription',
].join(' ');

// Simplified Application Controller - Basic CRUD operations only

// Apply for a job (Applicant)
export const applyForJob = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { jobId, coverLetter, resumeUrl, knockoutAnswers } = req.body;

    if (!jobId) {
      throw new AppError('Job ID is required', 400);
    }

    // Check if job exists and is active
    const job = await Job.findById(jobId);
    if (!job) {
      throw new AppError('Job not found', 404);
    }
    if (job.status !== 'active') {
      throw new AppError('This job is no longer accepting applications', 400);
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      applicantId: req.user?.id,
      jobId
    });

    if (existingApplication) {
      throw new AppError('You have already applied for this job', 409);
    }

    // Check knockout questions
    let autoReject = false;
    if (job.knockoutQuestions && job.knockoutQuestions.length > 0) {
      if (!knockoutAnswers) {
        autoReject = true;
      } else {
        for (const kq of job.knockoutQuestions) {
          const answer = knockoutAnswers.find((a: any) => a.question === kq.question);
          if (!answer || answer.answer !== kq.requiredAnswer) {
            autoReject = true;
            break;
          }
        }
      }
    }

    // Calculate localMatchScore using Regex
    let localMatchScore = 0;
    const applicant = await User.findById(req.user?.id);
    if (applicant && job.skillsRequired && job.skillsRequired.length > 0) {
      const requiredSkills = job.skillsRequired.map(s => s.toLowerCase().replace(/[.\-_/]/g, ' ').trim());
      const candidateSkills = (applicant.skills || []).map(s => s.toLowerCase().replace(/[.\-_/]/g, ' ').trim());
      
      const matchedSkills = requiredSkills.filter(required =>
        candidateSkills.some(candidate => candidate.includes(required) || required.includes(candidate))
      );
      localMatchScore = Math.round((matchedSkills.length / requiredSkills.length) * 100);
    } else if (job.skillsRequired && job.skillsRequired.length === 0) {
      localMatchScore = 100;
    }

    // Create application
    const application = await Application.create({
      applicantId: req.user?.id,
      jobId,
      coverLetter: coverLetter || '',
      resumeUrl: resumeUrl || '',
      knockoutAnswers: knockoutAnswers || [],
      localMatchScore,
      status: autoReject ? 'rejected' : 'pending'
    });

    res.status(201).json({
      status: 'success',
      message: autoReject ? 'Application submitted but unfortunately rejected due to requirements.' : 'Application submitted successfully',
      data: { application }
    });
  } catch (error) {
    next(error);
  }
};

// Get my applications (Applicant)
export const getMyApplications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const applications = await Application.find({ applicantId: req.user?.id })
      .populate({
        path: 'jobId',
        select: APPLICANT_JOB_FIELDS,
        populate: {
          path: 'recruiterId',
          select: RECRUITER_COMPANY_FIELDS,
        },
      })
      .sort({ appliedAt: -1 });

    res.status(200).json({
      status: 'success',
      results: applications.length,
      data: { applications }
    });
  } catch (error) {
    next(error);
  }
};

// Get applications for a job (Recruiter)
export const getJobApplications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    const { status } = req.query;

    // Verify job belongs to recruiter
    const job = await Job.findOne({ _id: jobId, recruiterId: req.user?.id });
    if (!job) {
      throw new AppError('Job not found or unauthorized', 404);
    }

    const filter: any = { jobId };
    if (status) filter.status = status;

    const applications = await Application.find(filter)
      .populate('applicantId', 'fullName email')
      .sort({ appliedAt: -1 });

    res.status(200).json({
      status: 'success',
      results: applications.length,
      data: { applications }
    });
  } catch (error) {
    next(error);
  }
};

// Get all applications for recruiter's jobs
export const getAllApplications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get all jobs belonging to this recruiter
    const jobs = await Job.find({ recruiterId: req.user?.id }).select('_id');
    const jobIds = jobs.map(job => job._id);

    const applications = await Application.find({ jobId: { $in: jobIds } })
      .populate('applicantId', 'fullName email')
      .populate('jobId', 'title location employmentType')
      .sort({ appliedAt: -1 });

    res.status(200).json({
      status: 'success',
      results: applications.length,
      data: { applications }
    });
  } catch (error) {
    next(error);
  }
};

// Get single application details
export const getApplicationById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const application = await Application.findById(id)
      .populate('applicantId', 'fullName email')
      .populate({
        path: 'jobId',
        select: APPLICANT_JOB_FIELDS,
        populate: {
          path: 'recruiterId',
          select: RECRUITER_COMPANY_FIELDS,
        },
      });

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    // Verify access: applicant can see own application, recruiter can see applications for their jobs
    const jobRef = typeof application.jobId === 'string'
      ? application.jobId
      : (application.jobId as any)?._id;
    const job = jobRef ? await Job.findById(jobRef) : null;

    const applicantRef = typeof application.applicantId === 'string'
      ? application.applicantId
      : (application.applicantId as any)?._id?.toString();
    const isOwner = applicantRef === req.user?.id;
    const isRecruiter = job && job.recruiterId.toString() === req.user?.id;

    if (!isOwner && !isRecruiter) {
      throw new AppError('Unauthorized to view this application', 403);
    }

    res.status(200).json({
      status: 'success',
      data: { application }
    });
  } catch (error) {
    next(error);
  }
};

// Update application status (Recruiter only)
export const updateApplicationStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'reviewed', 'selected', 'rejected'].includes(status)) {
      throw new AppError('Invalid status. Must be: pending, reviewed, selected, or rejected', 400);
    }

    const application = await Application.findById(id).populate('jobId');
    if (!application) {
      throw new AppError('Application not found', 404);
    }

    // Verify recruiter owns the job
    const job = application.jobId as any;
    if (job.recruiterId.toString() !== req.user?.id) {
      throw new AppError('Unauthorized to update this application', 403);
    }

    application.status = status;
    await application.save();

    res.status(200).json({
      status: 'success',
      message: 'Application status updated',
      data: { application }
    });
  } catch (error) {
    next(error);
  }
};

// Withdraw application (Applicant)
export const withdrawApplication = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const application = await Application.findOneAndDelete({
      _id: id,
      applicantId: req.user?.id,
      status: 'pending' // Can only withdraw pending applications
    });

    if (!application) {
      throw new AppError('Application not found or cannot be withdrawn', 404);
    }

    res.status(200).json({
      status: 'success',
      message: 'Application withdrawn successfully'
    });
  } catch (error) {
    next(error);
  }
};
