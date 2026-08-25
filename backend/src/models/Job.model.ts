import mongoose, { Document, Schema } from 'mongoose';

// Simplified Job model for basic recruitment portal
export interface IJob extends Document {
  recruiterId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  location: string;
  employmentType: 'Full-time' | 'Contract' | 'Part-time' | 'Internship';
  experienceMin?: number;
  experienceMax?: number;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  skillsRequired?: string[];
  educationLevel?: string;
  openings?: number;
  status: 'active' | 'closed';
  applicationDeadline?: Date;
  knockoutQuestions?: { question: string; requiredAnswer: 'Yes' | 'No' }[];
  interviewQuestions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>({
  recruiterId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Job description is required']
  },
  location: {
    type: String,
    trim: true,
    default: 'Remote'
  },
  employmentType: {
    type: String,
    enum: ['Full-time', 'Contract', 'Part-time', 'Internship'],
    default: 'Full-time'
  },
  experienceMin: {
    type: Number,
    min: 0
  },
  experienceMax: {
    type: Number,
    min: 0
  },
  salaryMin: {
    type: Number,
    min: 0
  },
  salaryMax: {
    type: Number,
    min: 0
  },
  salaryCurrency: {
    type: String,
    default: 'USD',
    trim: true
  },
  skillsRequired: [{ type: String, trim: true }],
  educationLevel: {
    type: String,
    trim: true
  },
  openings: {
    type: Number,
    min: 1,
    default: 1
  },
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active'
  },
  applicationDeadline: {
    type: Date,
    required: false
  },
  knockoutQuestions: [{
    question: { type: String, required: true },
    requiredAnswer: { type: String, enum: ['Yes', 'No'], required: true }
  }],
  interviewQuestions: [{ type: String }]
}, {
  timestamps: true
});

// Index for efficient queries
JobSchema.index({ recruiterId: 1, status: 1 });
JobSchema.index({ status: 1, createdAt: -1 });

export const Job = mongoose.model<IJob>('Job', JobSchema);
