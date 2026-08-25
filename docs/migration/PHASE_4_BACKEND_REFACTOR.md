# Phase 4: Backend Refactor (MongoDB → PostgreSQL)

## Status: ⬜ PENDING

## Objective
Remove Mongoose, implement Repository pattern, separate concerns (Controllers → Services → Repositories).

## Target Architecture

```
HTTP Request
    ↓
Controller (HTTP handling, validation)
    ↓
Service (Business logic)
    ↓
Repository (Database queries)
    ↓
PostgreSQL
```

## Changes Required

### 1. Remove MongoDB Dependencies

**package.json:**
```diff
- "mongoose": "^8.0.3"
+ "prisma": "^5.0.0"
+ "@prisma/client": "^5.0.0"
+ "pg": "^8.11.3"
```

**Delete files:**
- `backend/src/config/database.ts` (MongoDB version)
- All `backend/src/models/*.model.ts` (Mongoose schemas)

### 2. Create New Folder Structure

```
backend/src/
├── controllers/          # HTTP handlers (unchanged API)
├── services/             # Business logic (NEW - extracted from controllers)
├── repositories/         # Database queries (NEW - Prisma calls)
├── validators/           # Input validation (NEW - centralized)
├── middleware/           # Auth, error handling
├── routes/               # API routes (minimal changes)
├── config/
│   └── database.ts       # Prisma client singleton
├── types/                # TypeScript interfaces
└── utils/                # Helpers
```

### 3. Create Prisma Client Singleton

**File:** `backend/src/config/database.ts`
```typescript
import { PrismaClient } from '@prisma/client';

// Singleton pattern
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function connectDB() {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connected successfully');
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
    process.exit(1);
  }
}

export async function disconnectDB() {
  await prisma.$disconnect();
}
```

### 4. Create Repository Layer

**File:** `backend/src/repositories/user.repository.ts`
```typescript
import { prisma } from '../config/database';
import { UserRole } from '@prisma/client';

export class UserRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        recruiterProfile: true,
        applicantProfile: true,
      },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        recruiterProfile: true,
        applicantProfile: true,
      },
    });
  }

  async create(data: {
    email: string;
    passwordHash?: string;
    role: UserRole;
    googleId?: string;
  }) {
    return prisma.user.create({ data });
  }

  async update(id: string, data: Partial<typeof prisma.user>) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.user.delete({ where: { id } });
  }

  async findByGoogleId(googleId: string) {
    return prisma.user.findUnique({ where: { googleId } });
  }
}

export const userRepository = new UserRepository();
```

**File:** `backend/src/repositories/application.repository.ts`
```typescript
import { prisma } from '../config/database';
import { ApplicationStatus } from '@prisma/client';

export class ApplicationRepository {
  async create(data: {
    applicantId: string;
    jobId: string;
    recruiterId: string;
  }) {
    return prisma.application.create({
      data,
      include: {
        applicant: { include: { applicantProfile: true } },
        job: true,
        recruiter: true,
      },
    });
  }

  async findById(id: string) {
    return prisma.application.findUnique({
      where: { id },
      include: {
        applicant: { include: { applicantProfile: true } },
        job: true,
        recruiter: true,
      },
    });
  }

  async findByJobId(jobId: string) {
    return prisma.application.findMany({
      where: { jobId },
      include: {
        applicant: { include: { applicantProfile: true } },
      },
      orderBy: { appliedAt: 'desc' },
    });
  }

  async findByApplicantId(applicantId: string) {
    return prisma.application.findMany({
      where: { applicantId },
      include: { job: true },
      orderBy: { appliedAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: ApplicationStatus) {
    return prisma.application.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  }

  async bulkUpdateStatus(ids: string[], status: ApplicationStatus) {
    return prisma.application.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
  }

  async findByRecruiterId(recruiterId: string, filters?: {
    status?: ApplicationStatus;
    jobId?: string;
  }) {
    return prisma.application.findMany({
      where: {
        recruiterId,
        ...filters,
      },
      include: {
        applicant: { include: { applicantProfile: true } },
        job: true,
      },
      orderBy: { appliedAt: 'desc' },
    });
  }
}

export const applicationRepository = new ApplicationRepository();
```

### 5. Create Service Layer

**File:** `backend/src/services/application.service.ts`
```typescript
import { applicationRepository } from '../repositories/application.repository';
import { notificationService } from './notification.service';
import { emailService } from './email.service';
import { ApplicationStatus } from '@prisma/client';
import { prisma } from '../config/database';

export class ApplicationService {
  async applyToJob(applicantId: string, jobId: string) {
    // Get job to find recruiter
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new Error('Job not found');
    if (job.status !== 'active') throw new Error('Job is closed');

    // Check for duplicate application
    const existing = await prisma.application.findUnique({
      where: {
        applicantId_jobId: { applicantId, jobId },
      },
    });
    if (existing) throw new Error('Already applied to this job');

    // Create application
    const application = await applicationRepository.create({
      applicantId,
      jobId,
      recruiterId: job.recruiterId,
    });

    // Send notification to recruiter
    await notificationService.create({
      userId: job.recruiterId,
      type: 'application',
      title: 'New Application',
      message: `New application for ${job.title}`,
      relatedId: application.id,
      actionUrl: `/recruiter/applications/${application.id}`,
    });

    return application;
  }

  async updateStatus(
    applicationId: string,
    status: ApplicationStatus,
    recruiterId: string
  ) {
    // Use transaction for atomic update
    return prisma.$transaction(async (tx) => {
      // Update application
      const application = await tx.application.update({
        where: { id: applicationId },
        data: { status },
        include: {
          applicant: true,
          job: true,
        },
      });

      // Verify recruiter owns this application
      if (application.recruiterId !== recruiterId) {
        throw new Error('Unauthorized');
      }

      // Send notification to applicant
      await tx.notification.create({
        data: {
          userId: application.applicantId,
          type: 'status_update',
          title: 'Application Status Updated',
          message: `Your application for ${application.job.title} is now ${status}`,
          relatedId: application.id,
          actionUrl: `/applicant/applications/${application.id}`,
        },
      });

      // Send email
      if (application.applicant.email) {
        await emailService.sendApplicationStatusUpdate(
          application.applicant.email,
          application.job.title,
          status
        );
      }

      return application;
    });
  }

  async bulkReject(jobId: string, recruiterId: string) {
    // Transaction ensures all-or-nothing
    return prisma.$transaction(async (tx) => {
      // Get all pending applications
      const applications = await tx.application.findMany({
        where: {
          jobId,
          recruiterId,
          status: 'applied',
        },
      });

      // Reject all
      await tx.application.updateMany({
        where: {
          id: { in: applications.map((a) => a.id) },
        },
        data: { status: 'rejected' },
      });

      // Create notifications for all applicants
      const notifications = applications.map((app) => ({
        userId: app.applicantId,
        type: 'status_update' as const,
        title: 'Application Status',
        message: 'Your application has been reviewed',
        relatedId: app.id,
        actionUrl: `/applicant/applications/${app.id}`,
      }));

      await tx.notification.createMany({ data: notifications });

      return applications.length;
    });
  }

  async getApplicationsByRecruiter(recruiterId: string, filters?: {
    status?: ApplicationStatus;
    jobId?: string;
  }) {
    return applicationRepository.findByRecruiterId(recruiterId, filters);
  }

  async getApplicationsByApplicant(applicantId: string) {
    return applicationRepository.findByApplicantId(applicantId);
  }
}

export const applicationService = new ApplicationService();
```

### 6. Refactor Controllers

**File:** `backend/src/controllers/application.controller.ts`

**Before (Mongoose):**
```typescript
export const applyForJob = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.body;
    const applicantId = req.user.id;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const existing = await Application.findOne({ applicantId, jobId });
    if (existing) return res.status(400).json({ message: 'Already applied' });

    const application = await Application.create({
      applicantId,
      jobId,
      recruiterId: job.recruiterId,
    });

    // Send notification...
    // Send email...

    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

**After (Prisma + Service Layer):**
```typescript
export const applyForJob = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.body;
    const applicantId = req.user.id;

    const application = await applicationService.applyToJob(applicantId, jobId);

    res.status(201).json(application);
  } catch (error) {
    if (error.message === 'Job not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Already applied to this job') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};
```

**Benefits:**
- Controller is 50% smaller
- Business logic in service (reusable, testable)
- Database logic in repository (swappable)
- Cleaner error handling

### 7. Migration Checklist

**For each model (10 total):**
- [ ] Create repository
- [ ] Create service (if has business logic)
- [ ] Refactor controller to use service
- [ ] Update routes (should be minimal)
- [ ] Test CRUD operations
- [ ] Test relationships (includes)
- [ ] Test transactions

**Models to migrate:**
1. User → UserRepository, AuthService
2. RecruiterProfile → RecruiterProfileRepository
3. ApplicantProfile → ApplicantProfileRepository
4. Job → JobRepository, JobService
5. Application → ApplicationRepository, ApplicationService
6. Interview → InterviewRepository, InterviewService
7. TalentPool → TalentPoolRepository
8. Notification → NotificationRepository, NotificationService
9. VirtualInterview → VirtualInterviewRepository
10. InterviewSession → InterviewSessionRepository

## Judge Talking Points

> **"We separated concerns to improve scalability and debugging."**

**What this means:**
- Controllers = HTTP only (routing, status codes)
- Services = Business logic (transactions, workflows)
- Repositories = SQL only (queries, relations)

**Benefits:**
1. **Testability:** Can unit test services without HTTP layer
2. **Reusability:** Services can be called from cron jobs, CLI, other services
3. **Maintainability:** Logic is isolated, easier to debug
4. **Scalability:** Can optimize each layer independently

**Show code example:**
- Controller went from 50 lines → 10 lines
- Service has the complex transaction logic
- Repository has clean, typed queries

## Next Steps
Proceed to [Phase 5: Business Logic Hardening](./PHASE_5_BUSINESS_LOGIC.md) to add transactions.
