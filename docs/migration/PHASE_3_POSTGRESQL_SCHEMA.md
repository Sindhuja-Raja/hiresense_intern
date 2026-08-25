# Phase 3: PostgreSQL Schema Implementation

## Status: ⬜ PENDING

## Objective
Create complete SQL schema files and Prisma schema for code generation.

## Deliverables

### 1. SQL Migration Files
```
backend/migrations/
├── 001_create_enums.sql
├── 002_create_users.sql
├── 003_create_profiles.sql
├── 004_create_jobs.sql
├── 005_create_applications.sql
├── 006_create_interviews.sql
├── 007_create_talent_pool.sql
├── 008_create_notifications.sql
├── 009_create_virtual_interviews.sql
├── 010_create_indexes.sql
└── 011_seed_data.sql
```

### 2. Prisma Schema File
`backend/prisma/schema.prisma`

### 3. Database Connection Config
`backend/src/config/database.ts` (PostgreSQL version)

## Implementation Steps

### Step 1: Install Dependencies
```bash
cd backend
npm install prisma @prisma/client pg
npm uninstall mongoose
```

### Step 2: Initialize Prisma
```bash
npx prisma init
```

This creates:
- `prisma/schema.prisma`
- `.env` with DATABASE_URL

### Step 3: Configure DATABASE_URL
```env
# Replace MongoDB URI with PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/hiresense?schema=public"
```

### Step 4: Create Prisma Schema
See complete schema in deliverable files.

### Step 5: Generate Prisma Client
```bash
npx prisma generate
```

### Step 6: Create Migration
```bash
npx prisma migrate dev --name init
```

### Step 7: Verify Schema
```bash
npx prisma studio
```

Opens GUI to browse database.

## Prisma Schema Preview

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  recruiter
  applicant
}

enum JobStatus {
  active
  closed
}

enum ApplicationStatus {
  applied
  shortlisted
  rejected
  interview_scheduled
}

model User {
  id                String    @id @default(uuid()) @db.Uuid
  email             String    @unique @db.VarChar(255)
  passwordHash      String?   @map("password_hash") @db.Text
  role              UserRole
  googleId          String?   @unique @map("google_id") @db.VarChar(255)
  isEmailVerified   Boolean   @default(false) @map("is_email_verified")
  createdAt         DateTime  @default(now()) @map("created_at") @db.Timestamp
  updatedAt         DateTime  @updatedAt @map("updated_at") @db.Timestamp

  // Relations
  recruiterProfile   RecruiterProfile?
  applicantProfile   ApplicantProfile?
  jobsPosted         Job[]             @relation("RecruiterJobs")
  applications       Application[]     @relation("ApplicantApplications")
  recruiterApps      Application[]     @relation("RecruiterApplications")
  interviewsAsRecruiter Interview[]    @relation("RecruiterInterviews")
  interviewsAsApplicant Interview[]    @relation("ApplicantInterviews")
  talentPoolEntries  TalentPool[]
  notifications      Notification[]
  virtualInterviews  VirtualInterview[]
  interviewSessions  InterviewSession[]

  @@map("users")
}

model RecruiterProfile {
  id                        String    @id @default(uuid()) @db.Uuid
  userId                    String    @unique @map("user_id") @db.Uuid
  companyName               String    @map("company_name") @db.Text
  companyWebsite            String?   @map("company_website") @db.Text
  companyDescription        String?   @map("company_description") @db.Text
  verificationToken         String?   @map("verification_token") @db.Text
  verificationTokenExpires  DateTime? @map("verification_token_expires") @db.Timestamp
  name                      String?   @db.VarChar(255)
  position                  String?   @db.VarChar(255)
  phone                     String?   @db.VarChar(20)
  createdAt                 DateTime  @default(now()) @map("created_at") @db.Timestamp
  updatedAt                 DateTime  @updatedAt @map("updated_at") @db.Timestamp

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("recruiter_profiles")
}

model ApplicantProfile {
  id                String   @id @default(uuid()) @db.Uuid
  userId            String   @unique @map("user_id") @db.Uuid
  name              String?  @db.VarChar(255)
  phone             String?  @db.VarChar(20)
  location          String?  @db.Text
  skills            Json     @default("[]") @db.JsonB
  experience        Json     @default("[]") @db.JsonB
  education         Json     @default("[]") @db.JsonB
  resumeUrl         String?  @map("resume_url") @db.Text
  avatarUrl         String?  @map("avatar_url") @db.Text
  githubProfile     String?  @map("github_profile") @db.Text
  leetcodeUsername  String?  @map("leetcode_username") @db.VarChar(255)
  bio               String?  @db.Text
  createdAt         DateTime @default(now()) @map("created_at") @db.Timestamp
  updatedAt         DateTime @updatedAt @map("updated_at") @db.Timestamp

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("applicant_profiles")
}

// ... more models
```

## Testing Checklist

### Database Creation
- [ ] PostgreSQL installed
- [ ] Database created
- [ ] User created with permissions
- [ ] Connection successful

### Schema Migration
- [ ] All ENUMs created
- [ ] All tables created
- [ ] All indexes created
- [ ] All constraints active
- [ ] Foreign keys working

### Prisma Client
- [ ] Client generated
- [ ] TypeScript types available
- [ ] Can query users table
- [ ] Relations work (include)
- [ ] Transactions work

## Rollback Plan
If migration fails:
1. Keep MongoDB running in parallel
2. Test PostgreSQL with subset of data
3. Once verified, cut over
4. Keep MongoDB backup for 30 days

## Judge Talking Points

> **"We designed the schema to enforce business rules at the database level."**

**Examples:**
- Show ENUM definition in Prisma
- Show CHECK constraint for ai_score
- Show CASCADE delete behavior
- Show composite indexes for performance

## Next Steps
Proceed to [Phase 4: Backend Refactor](./PHASE_4_BACKEND_REFACTOR.md) to implement repository pattern.
