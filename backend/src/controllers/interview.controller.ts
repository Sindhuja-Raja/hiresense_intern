import { NextFunction, Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/errorHandler';
import { Application } from '../models/Application.model';
import { Job } from '../models/Job.model';
import { InterviewSchedule } from '../models/InterviewSchedule.model';
import { Notification } from '../models/Notification.model';
import { User } from '../models/User.model';
import { sendInterviewReminderEmail } from '../services/interview-reminder.service';

const toDateArray = (raw: unknown): Date[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => new Date(String(item)))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
};

const createInAppNotification = async (
  userId: Types.ObjectId,
  title: string,
  message: string,
  metadata?: { interviewId?: string; applicationId?: string }
) => {
  await Notification.create({
    userId,
    title,
    message,
    type: 'interview',
    metadata,
  });
};

export const proposeInterviewSlots = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'recruiter') {
      throw new AppError('Only recruiters can propose interview slots', 403);
    }

    const { applicationId } = req.params;
    const proposedSlots = toDateArray(req.body?.proposedSlots);
    const timezone = typeof req.body?.timezone === 'string' ? req.body.timezone.trim() : 'UTC';
    const mode = req.body?.mode === 'offline' ? 'offline' : 'online';
    const meetingLink = typeof req.body?.meetingLink === 'string' ? req.body.meetingLink.trim() : '';
    const location = typeof req.body?.location === 'string' ? req.body.location.trim() : '';
    const notes = typeof req.body?.notes === 'string' ? req.body.notes.trim() : '';

    if (proposedSlots.length === 0) {
      throw new AppError('At least one valid interview slot is required', 400);
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      throw new AppError('Application not found', 404);
    }

    const job = await Job.findById(application.jobId);
    if (!job || String(job.recruiterId) !== req.user.id) {
      throw new AppError('Not authorized to schedule interview for this application', 403);
    }

    const interview = await InterviewSchedule.findOneAndUpdate(
      { applicationId: application._id },
      {
        $set: {
          recruiterId: new Types.ObjectId(req.user.id),
          applicantId: application.applicantId,
          jobId: application.jobId,
          proposedSlots,
          requestedSlots: [],
          selectedSlot: undefined,
          timezone,
          mode,
          meetingLink,
          location,
          notes,
          status: 'pending',
        },
      },
      { new: true, upsert: true }
    );

    await createInAppNotification(
      application.applicantId as unknown as Types.ObjectId,
      'Interview Slots Proposed',
      `A recruiter proposed ${proposedSlots.length} interview slot(s).`,
      { interviewId: String(interview._id), applicationId: String(application._id) }
    );

    res.status(200).json({
      status: 'success',
      message: 'Interview slots proposed successfully',
      data: { interview },
    });
  } catch (error) {
    next(error);
  }
};

export const respondToInterview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'applicant') {
      throw new AppError('Only applicants can respond to interviews', 403);
    }

    const { id } = req.params;
    const action = String(req.body?.action || '');

    const interview = await InterviewSchedule.findById(id);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    if (String(interview.applicantId) !== req.user.id) {
      throw new AppError('Not authorized to respond to this interview', 403);
    }

    if (action === 'accept') {
      const selectedSlot = new Date(String(req.body?.selectedSlot || ''));
      if (Number.isNaN(selectedSlot.getTime())) {
        throw new AppError('Valid selectedSlot is required to accept interview', 400);
      }

      const allowed = interview.proposedSlots.some((slot) => slot.getTime() === selectedSlot.getTime());
      if (!allowed) {
        throw new AppError('Selected slot must match one of the proposed slots', 400);
      }

      interview.selectedSlot = selectedSlot;
      interview.status = 'scheduled';
      interview.requestedSlots = [];
    } else if (action === 'reschedule') {
      const requestedSlots = toDateArray(req.body?.requestedSlots);
      if (requestedSlots.length === 0) {
        throw new AppError('At least one valid requested slot is required for reschedule', 400);
      }
      interview.requestedSlots = requestedSlots;
      interview.status = 'reschedule_requested';
      interview.selectedSlot = undefined;
    } else {
      throw new AppError('Invalid action. Use accept or reschedule', 400);
    }

    await interview.save();

    await createInAppNotification(
      interview.recruiterId as unknown as Types.ObjectId,
      'Interview Response Received',
      action === 'accept'
        ? 'Candidate accepted one of the proposed interview slots.'
        : 'Candidate requested interview reschedule with new slot options.',
      { interviewId: String(interview._id), applicationId: String(interview.applicationId) }
    );

    res.status(200).json({
      status: 'success',
      message: action === 'accept' ? 'Interview accepted' : 'Reschedule requested',
      data: { interview },
    });
  } catch (error) {
    next(error);
  }
};

export const completeInterview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'recruiter') {
      throw new AppError('Only recruiters can complete interviews', 403);
    }

    const { id } = req.params;
    const interview = await InterviewSchedule.findById(id);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    if (String(interview.recruiterId) !== req.user.id) {
      throw new AppError('Not authorized to complete this interview', 403);
    }

    if (interview.status !== 'scheduled') {
      throw new AppError('Only scheduled interviews can be marked completed', 400);
    }

    interview.status = 'completed';
    await interview.save();

    await createInAppNotification(
      interview.applicantId as unknown as Types.ObjectId,
      'Interview Marked Completed',
      'Your interview has been marked completed by the recruiter.',
      { interviewId: String(interview._id), applicationId: String(interview.applicationId) }
    );

    res.status(200).json({
      status: 'success',
      message: 'Interview marked as completed',
      data: { interview },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyInterviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const filter = req.user?.role === 'recruiter'
      ? { recruiterId: userId }
      : { applicantId: userId };

    const interviews = await InterviewSchedule.find(filter)
      .populate('applicationId', 'status appliedAt')
      .populate('jobId', 'title location employmentType')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { interviews },
    });
  } catch (error) {
    next(error);
  }
};

export const sendUpcomingInterviewReminders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'recruiter') {
      throw new AppError('Only recruiters can trigger reminders', 403);
    }

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const interviews = await InterviewSchedule.find({
      status: 'scheduled',
      selectedSlot: { $gte: now, $lte: in24h },
      reminderSentAt: { $exists: false },
    }).populate('applicantId', 'email fullName').populate('recruiterId', 'fullName');

    let sent = 0;
    for (const interview of interviews) {
      const applicant = interview.applicantId as unknown as { email?: string; fullName?: string };
      const recruiter = interview.recruiterId as unknown as { fullName?: string };

      if (!applicant?.email || !interview.selectedSlot) continue;

      await sendInterviewReminderEmail({
        toEmail: applicant.email,
        candidateName: applicant.fullName || 'Candidate',
        recruiterName: recruiter?.fullName || 'Recruiter',
        scheduledAtIso: interview.selectedSlot.toISOString(),
        timezone: interview.timezone,
      });

      await createInAppNotification(
        interview.applicantId as unknown as Types.ObjectId,
        'Interview Reminder',
        `Reminder: interview scheduled at ${interview.selectedSlot.toISOString()} (${interview.timezone}).`,
        { interviewId: String(interview._id), applicationId: String(interview.applicationId) }
      );

      interview.reminderSentAt = new Date();
      await interview.save();
      sent += 1;
    }

    res.status(200).json({
      status: 'success',
      message: `Sent ${sent} interview reminder(s)`,
      data: { sent },
    });
  } catch (error) {
    next(error);
  }
};
