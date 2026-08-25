import { Response, NextFunction } from 'express';
import { Application } from '../models/Application.model';
import { Job } from '../models/Job.model';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

// POST /api/applications/recruiter/send-invites
// Recruiter sends interview invitations to a list of selected applicants
export const sendInterviewInvitations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      applicationIds,
      interviewerName,
      scheduledAt,
      mode,
      venue,
      message,
    } = req.body;

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      throw new AppError('At least one application ID is required', 400);
    }
    if (!interviewerName || !scheduledAt || !mode || !venue) {
      throw new AppError('interviewerName, scheduledAt, mode and venue are required', 400);
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      throw new AppError('Invalid scheduledAt date', 400);
    }

    // Fetch all requested applications and verify the recruiter owns their jobs
    const applications = await Application.find({ _id: { $in: applicationIds } }).populate('jobId');

    if (applications.length === 0) {
      throw new AppError('No matching applications found', 404);
    }

    // Security: ensure every job belongs to this recruiter
    for (const app of applications) {
      const job = app.jobId as any;
      if (!job || job.recruiterId?.toString() !== req.user?.id) {
        throw new AppError('Unauthorized: one or more applications do not belong to your jobs', 403);
      }
    }

    const invitationPayload = {
      sentAt: new Date(),
      interviewerName: interviewerName.trim(),
      scheduledAt: scheduledDate,
      mode,
      venue: venue.trim(),
      message: message?.trim() || undefined,
    };

    // Bulk-update all matching applications
    await Application.updateMany(
      { _id: { $in: applicationIds } },
      { $set: { interviewInvitation: invitationPayload } }
    );

    res.status(200).json({
      status: 'success',
      message: `Interview invitation sent to ${applications.length} candidate(s)`,
      data: {
        invitedCount: applications.length,
        invitation: invitationPayload,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/applications/my-invitations
// Applicant fetches all of their applications that have an interview invitation
export const getMyInvitations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const applications = await Application.find({
      applicantId: req.user?.id,
      'interviewInvitation.sentAt': { $exists: true },
    })
      .populate({
        path: 'jobId',
        select: 'title location employmentType recruiterId',
        populate: {
          path: 'recruiterId',
          select: 'fullName email companyName companyLogoUrl',
        },
      })
      .sort({ 'interviewInvitation.scheduledAt': 1 });

    res.status(200).json({
      status: 'success',
      results: applications.length,
      data: { applications },
    });
  } catch (error) {
    next(error);
  }
};
