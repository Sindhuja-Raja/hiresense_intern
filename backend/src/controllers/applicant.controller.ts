import { Response, NextFunction } from 'express';
import { Job } from '../models/Job.model';
import { Application } from '../models/Application.model';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

// Simplified Applicant Controller - Basic dashboard only

// Get applicant dashboard stats
export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get applicant's applications
    const applications = await Application.find({ applicantId: req.user?.id });

    // Count by status
    const totalApplications = applications.length;
    const pendingApplications = applications.filter(app => app.status === 'pending').length;
    const reviewedApplications = applications.filter(app => app.status === 'reviewed').length;
    const selectedApplications = applications.filter(app => app.status === 'selected').length;
    const rejectedApplications = applications.filter(app => app.status === 'rejected').length;

    // Get active jobs count
    const activeJobsCount = await Job.countDocuments({ status: 'active' });

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          applications: {
            total: totalApplications,
            pending: pendingApplications,
            reviewed: reviewedApplications,
            selected: selectedApplications,
            rejected: rejectedApplications
          },
          availableJobs: activeJobsCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get recent applications for applicant
export const getRecentApplications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const applications = await Application.find({ applicantId: req.user?.id })
      .populate('jobId', 'title location employmentType')
      .sort({ appliedAt: -1 })
      .limit(5);

    res.status(200).json({
      status: 'success',
      data: { applications }
    });
  } catch (error) {
    next(error);
  }
};
