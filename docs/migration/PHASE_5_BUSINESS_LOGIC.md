# Phase 5: Business Logic Hardening with Transactions

## Status: ⬜ PENDING

## Objective
Wrap critical workflows in ACID transactions to ensure data consistency.

## Critical Workflows Needing Transactions

### 1. Application Status Update
**Scenario:** Update application + send notification + log activity

**Before (No transaction):**
```typescript
// ❌ Problem: If notification fails, application is updated but user not notified
await Application.updateOne({ _id: id }, { status: 'shortlisted' });
await Notification.create({ userId, message: 'You were shortlisted!' });
await ActivityLog.create({ action: 'status_change' });
```

**After (With transaction):**
```typescript
// ✅ All-or-nothing: Either all succeed or all rollback
await prisma.$transaction(async (tx) => {
  // Update application
  const application = await tx.application.update({
    where: { id },
    data: { status: 'shortlisted' },
  });

  // Create notification
  await tx.notification.create({
    data: {
      userId: application.applicantId,
      type: 'status_update',
      title: 'Application Updated',
      message: 'You were shortlisted!',
      relatedId: id,
    },
  });

  // Log activity
  await tx.activityLog.create({
    data: { action: 'status_change', applicationId: id },
  });

  return application;
});
```

### 2. Interview Scheduling
**Scenario:** Create interview + update application status + send email notification

**Transaction ensures:**
- Interview created
- Application status changed to 'interview_scheduled'
- Notification sent to applicant
- All or nothing

**Implementation:**
```typescript
export async function scheduleInterview(data: {
  applicationId: string;
  scheduledAt: Date;
  duration: number;
  location: string;
  recruiterId: string;
}) {
  return prisma.$transaction(async (tx) => {
    // 1. Get application
    const application = await tx.application.findUnique({
      where: { id: data.applicationId },
      include: { applicant: true, job: true },
    });

    if (!application) throw new Error('Application not found');
    if (application.recruiterId !== data.recruiterId) {
      throw new Error('Unauthorized');
    }

    // 2. Create interview
    const interview = await tx.interview.create({
      data: {
        applicationId: data.applicationId,
        recruiterId: data.recruiterId,
        applicantId: application.applicantId,
        jobId: application.jobId,
        scheduledAt: data.scheduledAt,
        duration: data.duration,
        location: data.location,
      },
    });

    // 3. Update application status
    await tx.application.update({
      where: { id: data.applicationId },
      data: { status: 'interview_scheduled' },
    });

    // 4. Create notification
    await tx.notification.create({
      data: {
        userId: application.applicantId,
        type: 'interview',
        title: 'Interview Scheduled',
        message: `Interview for ${application.job.title} on ${data.scheduledAt}`,
        relatedId: interview.id,
        actionUrl: `/applicant/interviews/${interview.id}`,
      },
    });

    return interview;
  });
}
```

### 3. Bulk Reject Applications
**Scenario:** Reject 50 applications + create 50 notifications + send 50 emails

**Transaction ensures:**
- All applications rejected atomically
- All notifications created
- If any step fails, entire operation rolls back

**Implementation:**
```typescript
export async function bulkRejectApplications(
  jobId: string,
  recruiterId: string,
  applicationIds: string[]
) {
  return prisma.$transaction(async (tx) => {
    // 1. Verify all applications belong to this recruiter
    const count = await tx.application.count({
      where: {
        id: { in: applicationIds },
        jobId,
        recruiterId,
      },
    });

    if (count !== applicationIds.length) {
      throw new Error('Unauthorized or invalid application IDs');
    }

    // 2. Get all applications with applicant emails
    const applications = await tx.application.findMany({
      where: { id: { in: applicationIds } },
      include: { applicant: true, job: true },
    });

    // 3. Bulk update applications
    await tx.application.updateMany({
      where: { id: { in: applicationIds } },
      data: {
        status: 'rejected',
        updatedAt: new Date(),
      },
    });

    // 4. Create notifications for all applicants
    const notifications = applications.map((app) => ({
      userId: app.applicantId,
      type: 'status_update' as const,
      title: 'Application Status',
      message: `Your application for ${app.job.title} has been reviewed`,
      relatedId: app.id,
      actionUrl: `/applicant/applications/${app.id}`,
    }));

    await tx.notification.createMany({ data: notifications });

    // 5. Return count
    return applications.length;
  });

  // Note: Email sending happens outside transaction (async, non-critical)
}
```

### 4. Profile Update with Resume Parsing
**Scenario:** Upload resume + parse with AI + update profile + log activity

**Transaction ensures:**
- Resume URL saved
- Parsed data (skills, experience) saved
- Profile updated
- Activity logged

**Implementation:**
```typescript
export async function updateProfileWithResume(
  userId: string,
  resumeUrl: string,
  parsedData: {
    skills: string[];
    experience: any[];
    education: any[];
  }
) {
  return prisma.$transaction(async (tx) => {
    // 1. Update profile
    const profile = await tx.applicantProfile.update({
      where: { userId },
      data: {
        resumeUrl,
        skills: parsedData.skills,
        experience: parsedData.experience,
        education: parsedData.education,
        updatedAt: new Date(),
      },
    });

    // 2. Log parsing activity
    await tx.activityLog.create({
      data: {
        userId,
        action: 'resume_parsed',
        metadata: {
          skillsCount: parsedData.skills.length,
          experienceCount: parsedData.experience.length,
        },
      },
    });

    return profile;
  });
}
```

### 5. Job Deletion Cascade
**Scenario:** Delete job + all applications + all interviews + all notifications

**PostgreSQL handles this via CASCADE:**
```sql
FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
```

**But transaction ensures notification before delete:**
```typescript
export async function deleteJob(jobId: string, recruiterId: string) {
  return prisma.$transaction(async (tx) => {
    // 1. Verify ownership
    const job = await tx.job.findUnique({ where: { id: jobId } });
    if (!job) throw new Error('Job not found');
    if (job.recruiterId !== recruiterId) throw new Error('Unauthorized');

    // 2. Get all applicants who applied
    const applications = await tx.application.findMany({
      where: { jobId },
      include: { applicant: true },
    });

    // 3. Notify all applicants
    const notifications = applications.map((app) => ({
      userId: app.applicantId,
      type: 'job_match' as const,
      title: 'Job Closed',
      message: `The job "${job.title}" has been closed`,
      relatedId: jobId,
    }));

    if (notifications.length > 0) {
      await tx.notification.createMany({ data: notifications });
    }

    // 4. Delete job (CASCADE will delete applications, interviews)
    await tx.job.delete({ where: { id: jobId } });

    return { deleted: true, applicantsNotified: notifications.length };
  });
}
```

## Transaction Isolation Levels

**Prisma default:** `READ COMMITTED`

For critical operations, use stricter isolation:
```typescript
await prisma.$transaction(
  async (tx) => {
    // Your queries
  },
  {
    isolationLevel: 'Serializable', // Prevents race conditions
    maxWait: 5000, // 5 seconds
    timeout: 10000, // 10 seconds
  }
);
```

## Error Handling in Transactions

```typescript
try {
  await prisma.$transaction(async (tx) => {
    // Operations
  });
} catch (error) {
  if (error.code === 'P2002') {
    // Unique constraint violation
    throw new Error('Duplicate entry');
  }
  if (error.code === 'P2003') {
    // Foreign key constraint violation
    throw new Error('Related record not found');
  }
  throw error; // Rethrow unexpected errors
}
```

## Transaction Best Practices

### ✅ DO
- Keep transactions short (< 1 second)
- Only database operations inside transaction
- Handle errors gracefully
- Use for multi-table operations
- Log transaction failures

### ❌ DON'T
- Call external APIs inside transaction
- Send emails inside transaction
- Perform file uploads inside transaction
- Have long-running queries
- Nest transactions (Prisma doesn't support)

**Pattern:**
```typescript
// ✅ Good: Transaction for DB only, email after
const result = await prisma.$transaction(async (tx) => {
  // Database operations
  return data;
});

// Send email after transaction commits
await sendEmail(result.data);

// ❌ Bad: Email inside transaction
await prisma.$transaction(async (tx) => {
  await tx.application.update(...);
  await sendEmail(); // ❌ External call, slow, can fail
});
```

## Testing Transactions

```typescript
// Test rollback on error
test('should rollback application update if notification fails', async () => {
  const initialStatus = 'applied';

  try {
    await prisma.$transaction(async (tx) => {
      await tx.application.update({
        where: { id: 'test-id' },
        data: { status: 'shortlisted' },
      });

      // Force error
      throw new Error('Notification service down');
    });
  } catch (error) {
    // Expected
  }

  // Verify rollback
  const application = await prisma.application.findUnique({
    where: { id: 'test-id' },
  });

  expect(application.status).toBe(initialStatus); // Still 'applied'
});
```

## Judge Talking Points

> **"Critical hiring workflows are wrapped in transactions to ensure consistency."**

**Example:**
"When we schedule an interview, we need to:
1. Create the interview record
2. Update application status
3. Notify the candidate

If step 3 fails, we don't want steps 1-2 to succeed. PostgreSQL transactions ensure all-or-nothing behavior. This is impossible with MongoDB without complex application-level orchestration."

**Show code:**
- Before/after comparison
- Highlight `prisma.$transaction`
- Explain rollback behavior

**Business impact:**
- No orphaned interviews
- No lost notifications
- Data integrity guaranteed

## Next Steps
Proceed to [Phase 6: Validation & Security](./PHASE_6_VALIDATION_SECURITY.md) to add input validation and rate limiting.
