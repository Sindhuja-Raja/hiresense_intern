import { Response, NextFunction } from 'express';
import { Job } from '../models/Job.model';
import { Application } from '../models/Application.model';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

// Simplified Recruiter Controller - Basic stats and dashboard only

// Get recruiter dashboard stats
export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get recruiter's jobs
    const jobs = await Job.find({ recruiterId: req.user?.id });
    const jobIds = jobs.map(job => job._id);

    // Get application counts
    const totalApplications = await Application.countDocuments({ jobId: { $in: jobIds } });
    const pendingApplications = await Application.countDocuments({ jobId: { $in: jobIds }, status: 'pending' });
    const reviewedApplications = await Application.countDocuments({ jobId: { $in: jobIds }, status: 'reviewed' });
    const selectedApplications = await Application.countDocuments({ jobId: { $in: jobIds }, status: 'selected' });
    const rejectedApplications = await Application.countDocuments({ jobId: { $in: jobIds }, status: 'rejected' });

    // Job stats
    const activeJobs = jobs.filter(job => job.status === 'active').length;
    const closedJobs = jobs.filter(job => job.status === 'closed').length;

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          jobs: {
            total: jobs.length,
            active: activeJobs,
            closed: closedJobs
          },
          applications: {
            total: totalApplications,
            pending: pendingApplications,
            reviewed: reviewedApplications,
            selected: selectedApplications,
            rejected: rejectedApplications
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get recent applications for recruiter's jobs
export const getRecentApplications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const jobs = await Job.find({ recruiterId: req.user?.id }).select('_id');
    const jobIds = jobs.map(job => job._id);

    const applications = await Application.find({ jobId: { $in: jobIds } })
      .populate('applicantId', 'fullName email')
      .populate('jobId', 'title')
      .sort({ appliedAt: -1 })
      .limit(10);

    res.status(200).json({
      status: 'success',
      data: { applications }
    });
  } catch (error) {
    next(error);
  }
};
