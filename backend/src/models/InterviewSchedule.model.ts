import mongoose, { Document, Schema } from 'mongoose';

export interface IInterviewSchedule extends Document {
  applicationId: mongoose.Types.ObjectId;
  recruiterId: mongoose.Types.ObjectId;
  applicantId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  proposedSlots: Date[];
  requestedSlots?: Date[];
  selectedSlot?: Date;
  timezone: string;
  mode: 'online' | 'offline';
  meetingLink?: string;
  location?: string;
  notes?: string;
  status: 'pending' | 'reschedule_requested' | 'scheduled' | 'completed' | 'cancelled';
  reminderSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewScheduleSchema = new Schema<IInterviewSchedule>(
  {
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
    recruiterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    applicantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
    proposedSlots: {
      type: [Date],
      default: [],
    },
    requestedSlots: {
      type: [Date],
      default: [],
    },
    selectedSlot: {
      type: Date,
    },
    timezone: {
      type: String,
      default: 'UTC',
      trim: true,
    },
    mode: {
      type: String,
      enum: ['online', 'offline'],
      default: 'online',
    },
    meetingLink: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['pending', 'reschedule_requested', 'scheduled', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    reminderSentAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

InterviewScheduleSchema.index({ applicationId: 1 }, { unique: true });
InterviewScheduleSchema.index({ applicantId: 1, status: 1, selectedSlot: 1 });

export const InterviewSchedule = mongoose.model<IInterviewSchedule>('InterviewSchedule', InterviewScheduleSchema);
