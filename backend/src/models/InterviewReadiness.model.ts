import mongoose, { Document, Schema } from 'mongoose';

interface IReadinessQuestion {
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface IReadinessAnswer {
  question: string;
  answer: string;
  score: number;
  feedback: string;
}

export interface IInterviewReadiness extends Document {
  applicantId: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  roleTitle: string;
  status: 'in_progress' | 'completed';
  questions: IReadinessQuestion[];
  answers: IReadinessAnswer[];
  readinessScore: number;
  strengths: string[];
  improvements: string[];
  recommendation: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReadinessQuestionSchema = new Schema<IReadinessQuestion>(
  {
    question: { type: String, required: true, trim: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  },
  { _id: false }
);

const ReadinessAnswerSchema = new Schema<IReadinessAnswer>(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    feedback: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const InterviewReadinessSchema = new Schema<IInterviewReadiness>(
  {
    applicantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      unique: true,
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
    roleTitle: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed'],
      default: 'in_progress',
      index: true,
    },
    questions: {
      type: [ReadinessQuestionSchema],
      default: [],
    },
    answers: {
      type: [ReadinessAnswerSchema],
      default: [],
    },
    readinessScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      index: true,
    },
    strengths: {
      type: [String],
      default: [],
    },
    improvements: {
      type: [String],
      default: [],
    },
    recommendation: {
      type: String,
      default: 'Complete at least 3 practice answers to generate actionable readiness guidance.',
    },
  },
  { timestamps: true }
);

InterviewReadinessSchema.index({ applicantId: 1, updatedAt: -1 });
InterviewReadinessSchema.index({ jobId: 1, readinessScore: -1 });

export const InterviewReadiness = mongoose.model<IInterviewReadiness>('InterviewReadiness', InterviewReadinessSchema);
