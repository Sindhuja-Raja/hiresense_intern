import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// User model with profile fields for applicants
export interface IUser extends Document {
  email: string;
  password: string;
  fullName: string;
  role: 'recruiter' | 'applicant';
  // Shared profile fields
  phone?: string;
  location?: string;
  bio?: string;
  // Applicant-centric fields
  skills?: string[];
  resumeUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  experience?: string;
  education?: string;
  certifications?: string[];
  languages?: string[];
  summary?: string;
  // Recruiter company profile fields
  companyName?: string;
  companyWebsite?: string;
  companyLinkedinUrl?: string;
  companyLogoUrl?: string;
  companyIndustry?: string;
  companySize?: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';
  companyFoundedYear?: number;
  companyHeadquarters?: string;
  companyDescription?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const COMPANY_SIZE_OPTIONS = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] as const;

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['recruiter', 'applicant'],
    required: [true, 'Role is required']
  },
  // Profile fields
  phone: { type: String, trim: true },
  location: { type: String, trim: true },
  bio: { type: String, maxlength: 500 },
  skills: [{ type: String, trim: true }],
  resumeUrl: { type: String },
  linkedinUrl: { type: String },
  portfolioUrl: { type: String },
  experience: { type: String, maxlength: 4000 },
  education: { type: String, maxlength: 2000 },
  certifications: [{ type: String, trim: true }],
  languages: [{ type: String, trim: true }],
  summary: { type: String, maxlength: 1000 },
  companyName: { type: String, trim: true, maxlength: 120 },
  companyWebsite: { type: String, trim: true, maxlength: 300 },
  companyLinkedinUrl: { type: String, trim: true, maxlength: 300 },
  companyLogoUrl: { type: String, trim: true, maxlength: 500 },
  companyIndustry: { type: String, trim: true, maxlength: 100 },
  companySize: { type: String, enum: COMPANY_SIZE_OPTIONS },
  companyFoundedYear: {
    type: Number,
    min: [1800, 'Company founded year must be 1800 or later'],
    max: [new Date().getFullYear() + 1, 'Company founded year cannot be in the far future'],
  },
  companyHeadquarters: { type: String, trim: true, maxlength: 120 },
  companyDescription: { type: String, maxlength: 2000 },
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
