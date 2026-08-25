# Phase 2: Database Redesign

## Status: 🟡 IN PROGRESS

## Objective
Design PostgreSQL schema with 3NF normalization, ENUMs, constraints, indexes, and proper foreign keys.

## Design Principles

### 1. Third Normal Form (3NF)
- ✅ No repeating groups (skills stored as JSONB array)
- ✅ All non-key columns depend on primary key
- ✅ No transitive dependencies

### 2. ENUMs for State Machines
```sql
CREATE TYPE user_role_enum AS ENUM ('recruiter', 'applicant');
CREATE TYPE job_status_enum AS ENUM ('active', 'closed');
CREATE TYPE application_status_enum AS ENUM ('applied', 'shortlisted', 'rejected', 'interview_scheduled');
CREATE TYPE interview_status_enum AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE notification_type_enum AS ENUM ('application', 'interview', 'job_match', 'status_update');
CREATE TYPE talent_pool_status_enum AS ENUM ('interested', 'contacted', 'not_interested');
CREATE TYPE virtual_interview_status_enum AS ENUM ('in_progress', 'completed', 'abandoned');
CREATE TYPE job_type_enum AS ENUM ('full-time', 'part-time', 'contract', 'internship');
CREATE TYPE experience_level_enum AS ENUM ('entry', 'mid', 'senior');
```

### 3. Constraints for Business Logic
```sql
-- AI Score must be 0-100
CONSTRAINT ai_score_range CHECK (ai_score >= 0 AND ai_score <= 100)

-- Duration must be positive
CONSTRAINT positive_duration CHECK (duration > 0)

-- Salary min < max
CONSTRAINT valid_salary_range CHECK (salary_min <= salary_max)

-- Email format
CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
```

### 4. Indexes for Performance
```sql
-- Frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_jobs_recruiter_id ON jobs(recruiter_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_interviews_scheduled_at ON interviews(scheduled_at);
CREATE INDEX idx_notifications_user_id_is_read ON notifications(user_id, is_read);

-- Composite indexes for complex queries
CREATE INDEX idx_applications_job_status ON applications(job_id, status);
CREATE INDEX idx_applications_recruiter_status ON applications(recruiter_id, status);
```

### 5. Foreign Keys with Cascade

```sql
-- Recruiter deletes account → delete all their jobs
FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE

-- Job deleted → delete all applications
FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE

-- Application deleted → delete interview
FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE

-- User deleted → delete all notifications
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
```

## MongoDB → PostgreSQL Mapping

### Table 1: users
**From MongoDB:**
```javascript
{
  email: String,
  password: String,
  role: String,
  googleId: String,
  isEmailVerified: Boolean,
  createdAt: Date
}
```

**To PostgreSQL:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT,
  role user_role_enum NOT NULL,
  google_id VARCHAR(255) UNIQUE,
  is_email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);
```

### Table 2: recruiter_profiles
**From MongoDB:**
```javascript
{
  userId: ObjectId,
  companyName: String,
  companyWebsite: String,
  companyDescription: String,
  verificationToken: String,
  verificationTokenExpires: Date,
  name: String,
  position: String,
  phone: String
}
```

**To PostgreSQL:**
```sql
CREATE TABLE recruiter_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_website TEXT,
  company_description TEXT,
  verification_token TEXT,
  verification_token_expires TIMESTAMP,
  name VARCHAR(255),
  position VARCHAR(255),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table 3: applicant_profiles
**From MongoDB:**
```javascript
{
  userId: ObjectId,
  name: String,
  phone: String,
  location: String,
  skills: [String],
  experience: [{...}],
  education: [{...}],
  resumeUrl: String,
  avatarUrl: String,
  githubProfile: String,
  leetcodeUsername: String,
  bio: String
}
```

**To PostgreSQL:**
```sql
CREATE TABLE applicant_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  phone VARCHAR(20),
  location TEXT,
  skills JSONB DEFAULT '[]',
  experience JSONB DEFAULT '[]',
  education JSONB DEFAULT '[]',
  resume_url TEXT,
  avatar_url TEXT,
  github_profile TEXT,
  leetcode_username VARCHAR(255),
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table 4: jobs
**From MongoDB:**
```javascript
{
  recruiterId: ObjectId,
  title: String,
  description: String,
  requirements: [String],
  skills: [String],
  location: String,
  type: String,
  salaryRange: {...},
  experienceLevel: String,
  status: String,
  postedAt: Date
}
```

**To PostgreSQL:**
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements JSONB DEFAULT '[]',
  skills JSONB DEFAULT '[]',
  location TEXT,
  job_type job_type_enum,
  salary_min NUMERIC,
  salary_max NUMERIC,
  salary_currency VARCHAR(10) DEFAULT 'USD',
  experience_level experience_level_enum,
  status job_status_enum DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_salary_range CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max)
);
```

### Table 5: applications
**From MongoDB:**
```javascript
{
  applicantId: ObjectId,
  jobId: ObjectId,
  recruiterId: ObjectId,
  status: String,
  aiScore: Number,
  aiJustification: String,
  skillGapAnalysis: String,
  interviewFocus: [String],
  rejectionFeedback: String,
  appliedAt: Date,
  evaluatedAt: Date
}
```

**To PostgreSQL:**
```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status application_status_enum DEFAULT 'applied',
  ai_score NUMERIC CHECK (ai_score >= 0 AND ai_score <= 100),
  ai_justification TEXT,
  skill_gap_analysis TEXT,
  interview_focus JSONB DEFAULT '[]',
  rejection_feedback TEXT,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  evaluated_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(applicant_id, job_id)
);
```

### Table 6: interviews
**From MongoDB:**
```javascript
{
  applicationId: ObjectId,
  recruiterId: ObjectId,
  applicantId: ObjectId,
  jobId: ObjectId,
  scheduledDate: Date,
  duration: Number,
  location: String,
  notes: String,
  status: String,
  reminderSent: Boolean,
  candidateConfirmed: Boolean,
  candidateActions: [{...}]
}
```

**To PostgreSQL:**
```sql
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID UNIQUE NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP NOT NULL,
  duration INTEGER CHECK (duration > 0),
  location TEXT,
  notes TEXT,
  status interview_status_enum DEFAULT 'scheduled',
  reminder_sent BOOLEAN DEFAULT false,
  candidate_confirmed BOOLEAN DEFAULT false,
  candidate_actions JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table 7: talent_pool
**From MongoDB:**
```javascript
{
  recruiterId: ObjectId,
  applicantId: ObjectId,
  status: String,
  tags: [String],
  notes: String,
  suggestedJobs: [ObjectId],
  addedAt: Date,
  lastContacted: Date
}
```

**To PostgreSQL:**
```sql
CREATE TABLE talent_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status talent_pool_status_enum DEFAULT 'interested',
  tags JSONB DEFAULT '[]',
  notes TEXT,
  suggested_jobs JSONB DEFAULT '[]',
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_contacted TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(recruiter_id, applicant_id)
);
```

### Table 8: notifications
**From MongoDB:**
```javascript
{
  userId: ObjectId,
  type: String,
  title: String,
  message: String,
  isRead: Boolean,
  relatedId: ObjectId,
  actionUrl: String,
  createdAt: Date
}
```

**To PostgreSQL:**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type_enum NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  related_id UUID,
  action_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table 9: virtual_interviews
**From MongoDB:**
```javascript
{
  applicantId: ObjectId,
  jobId: ObjectId,
  sessionId: String,
  questions: [{...}],
  overallScore: Number,
  status: String,
  startedAt: Date,
  completedAt: Date,
  duration: Number
}
```

**To PostgreSQL:**
```sql
CREATE TABLE virtual_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  questions JSONB DEFAULT '[]',
  overall_score NUMERIC CHECK (overall_score >= 0 AND overall_score <= 100),
  status virtual_interview_status_enum DEFAULT 'in_progress',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  duration INTEGER,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table 10: interview_sessions
**From MongoDB:**
```javascript
{
  applicantId: ObjectId,
  sessionId: String,
  currentQuestionIndex: Number,
  totalQuestions: Number,
  audioTranscripts: [{...}],
  metadata: {...},
  createdAt: Date,
  lastActivityAt: Date
}
```

**To PostgreSQL:**
```sql
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  current_question_index INTEGER DEFAULT 0,
  total_questions INTEGER,
  audio_transcripts JSONB DEFAULT '[]',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Judge Talking Points

> **"We moved relationship and validation logic from application code into the database."**

**Examples:**
1. **ENUMs** - Application status can only be 4 values (enforced by database, not code)
2. **CHECK constraints** - AI score must be 0-100 (database rejects invalid data)
3. **Foreign Keys** - Can't create application for non-existent job (database prevents orphans)
4. **Unique constraints** - Can't apply twice to same job (database prevents duplicates)

**Benefits:**
- Validation happens even if bypassing API (e.g., admin tools, scripts)
- Data integrity guaranteed across all applications
- Business rules documented in schema

## Next Steps
Proceed to [Phase 3: PostgreSQL Schema](./PHASE_3_POSTGRESQL_SCHEMA.md) to create actual SQL files and Prisma schema.
