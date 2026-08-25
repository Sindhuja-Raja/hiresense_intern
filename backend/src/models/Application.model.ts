import mongoose, { Document, Schema } from 'mongoose';

// Simplified Application model for basic recruitment portal
export interface IApplication extends Document {
  applicantId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  resumeUrl?: string;
  coverLetter?: string;
  status: 'pending' | 'reviewed' | 'selected' | 'rejected';
  knockoutAnswers?: { question: string; answer: 'Yes' | 'No' }[];
  localMatchScore?: number;
  appliedAt: Date;
  interviewInvitation?: {
    sentAt: Date;
    interviewerName: string;
    scheduledAt: Date;
    mode: 'online' | 'offline';
    venue: string;
    message?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>({
  applicantId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobId: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  resumeUrl: {
    type: String,
    default: ''
  },
  coverLetter: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'selected', 'rejected'],
    default: 'pending'
  },
  knockoutAnswers: [{
    question: { type: String, required: true },
    answer: { type: String, enum: ['Yes', 'No'], required: true }
  }],
  localMatchScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  interviewInvitation: {
    sentAt: { type: Date },
    interviewerName: { type: String },
    scheduledAt: { type: Date },
    mode: { type: String, enum: ['online', 'offline'] },
    venue: { type: String },
    message: { type: String },
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate applications
ApplicationSchema.index({ applicantId: 1, jobId: 1 }, { unique: true });

// Index for efficient queries
ApplicationSchema.index({ jobId: 1, status: 1 });
ApplicationSchema.index({ applicantId: 1 });

export const Application = mongoose.model<IApplication>('Application', ApplicationSchema);
