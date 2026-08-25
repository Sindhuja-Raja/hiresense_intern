require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['recruiter', 'applicant'], required: true },
  phone: String,
  location: String,
  bio: String,
  skills: [String],
  resumeUrl: String,
  linkedinUrl: String,
  portfolioUrl: String,
  experience: String,
  education: String,
}, { timestamps: true });

const jobSchema = new mongoose.Schema({
  recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, default: 'Remote' },
  employmentType: { type: String, default: 'Full-time' },
  experienceMin: Number,
  experienceMax: Number,
  salaryMin: Number,
  salaryMax: Number,
  salaryCurrency: { type: String, default: 'USD' },
  skillsRequired: [String],
  educationLevel: String,
  openings: { type: Number, default: 1 },
  status: { type: String, default: 'active' },
  applicationDeadline: Date,
}, { timestamps: true });

const applicationSchema = new mongoose.Schema({
  applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  resumeUrl: { type: String, default: '' },
  coverLetter: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'reviewed', 'selected', 'rejected'], default: 'pending' },
  appliedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);
const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);

const recruiterEmail = 'recruiter@company.com';
const recruiterPassword = 'Recruiter@123';

const applicants = [
  {
    email: 'candidate.strong@test.com',
    fullName: 'Arun Strong',
    password: 'Test@123',
    skills: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'Docker', 'AWS'],
    experience: '5 years full stack development',
    location: 'Bangalore',
    education: 'Bachelors in Computer Science',
    status: 'reviewed',
  },
  {
    email: 'candidate.mid@test.com',
    fullName: 'Divya Mid',
    password: 'Test@123',
    skills: ['React', 'JavaScript', 'Node.js'],
    experience: '2 years web development',
    location: 'Chennai',
    education: 'Bachelors in IT',
    status: 'pending',
  },
  {
    email: 'candidate.low@test.com',
    fullName: 'Rahul Low',
    password: 'Test@123',
    skills: ['HTML', 'CSS', 'jQuery'],
    experience: '0.8 years internship',
    location: 'Remote',
    education: 'Diploma in Software Engineering',
    status: 'pending',
  }
];

async function hashPassword(plainText) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

async function ensureRecruiter() {
  let recruiter = await User.findOne({ email: recruiterEmail });
  if (!recruiter) {
    recruiter = await User.create({
      email: recruiterEmail,
      password: await hashPassword(recruiterPassword),
      fullName: 'Company Recruiter',
      role: 'recruiter',
    });
    console.log('Created recruiter:', recruiterEmail);
  }
  return recruiter;
}

async function ensureJob(recruiterId) {
  let job = await Job.findOne({ recruiterId, title: 'Frontend Developer (Skill Match Test)' });
  if (!job) {
    job = await Job.create({
      recruiterId,
      title: 'Frontend Developer (Skill Match Test)',
      description: 'Test job for validating deterministic skill and experience matching.',
      location: 'Remote',
      employmentType: 'Full-time',
      experienceMin: 2,
      experienceMax: 5,
      salaryMin: 60000,
      salaryMax: 90000,
      salaryCurrency: 'USD',
      skillsRequired: ['React', 'TypeScript', 'Node.js', 'Docker', 'MongoDB'],
      educationLevel: 'Bachelors',
      openings: 2,
      status: 'active',
    });
    console.log('Created test job:', job.title);
  }
  return job;
}

async function ensureApplicant(entry) {
  let applicant = await User.findOne({ email: entry.email });
  if (!applicant) {
    applicant = await User.create({
      email: entry.email,
      password: await hashPassword(entry.password),
      fullName: entry.fullName,
      role: 'applicant',
      skills: entry.skills,
      experience: entry.experience,
      location: entry.location,
      education: entry.education,
      bio: `Test candidate profile for ${entry.fullName}`,
      resumeUrl: 'https://example.com/resume.pdf',
      linkedinUrl: 'https://linkedin.com/in/test-candidate',
    });
    console.log('Created applicant:', entry.email);
  } else {
    await User.updateOne(
      { _id: applicant._id },
      {
        $set: {
          skills: entry.skills,
          experience: entry.experience,
          location: entry.location,
          education: entry.education,
          bio: `Test candidate profile for ${entry.fullName}`,
          resumeUrl: 'https://example.com/resume.pdf',
          linkedinUrl: 'https://linkedin.com/in/test-candidate',
        }
      }
    );
  }
  return applicant;
}

async function ensureApplication(applicantId, jobId, status) {
  const existing = await Application.findOne({ applicantId, jobId });
  if (!existing) {
    await Application.create({
      applicantId,
      jobId,
      coverLetter: 'I am interested in this role and would like to contribute.',
      resumeUrl: 'https://example.com/resume.pdf',
      status,
    });
  } else if (existing.status !== status) {
    existing.status = status;
    await existing.save();
  }
}

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set in backend/.env');
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const recruiter = await ensureRecruiter();
  const job = await ensureJob(recruiter._id);

  for (const candidate of applicants) {
    const applicant = await ensureApplicant(candidate);
    await ensureApplication(applicant._id, job._id, candidate.status);
  }

  console.log('\nSeed complete. Use these credentials for testing:');
  console.log('Recruiter: recruiter@company.com / Recruiter@123');
  console.log('Applicant test password: Test@123');
  console.log('Candidates:');
  applicants.forEach((item) => console.log(`- ${item.email}`));

  await mongoose.disconnect();
  console.log('Disconnected');
}

main().catch(async (err) => {
  console.error('Seed failed:', err.message);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});
