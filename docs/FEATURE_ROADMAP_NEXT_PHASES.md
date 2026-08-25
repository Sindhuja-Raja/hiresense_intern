# Feature Roadmap - Next Phases

## 1) Interview Scheduling Flow (Highest Value)

### Goal
Close the loop after shortlisting by enabling structured interview coordination between recruiter and applicant.

### Scope
- Recruiter can propose interview slots from candidate context.
- Applicant can accept or request reschedule.
- Interview lifecycle status transitions:
  - `pending` -> `scheduled` -> `completed`
- Reminder pipeline:
  - Email reminder hook
  - In-app reminder notification

### Current Implementation Start (This Iteration)
- Added interview scheduling backend APIs and data model.
- Added in-app notification backend APIs and data model.
- Added reminder dispatch service hook for scheduled interviews.
- Added frontend API integration for interviews and notifications.

## 2) Recruiter Pipeline Board

### Goal
Give recruiters a visual, stage-based workflow to move candidates quickly.

### Planned Scope
- Kanban stages: `Applied`, `Screening`, `Interview`, `Offer`, `Rejected`
- Drag-and-drop candidate movement
- Stage movement audit log
- Bottleneck metrics by stage

## 3) AI Screening Summary Card

### Goal
Provide transparent, decision-ready candidate fit summaries.

### Planned Scope
- Skill fit, experience fit, risk flags, confidence
- One-click score explanation from profile + job requirements
- Must-have missing skill badges

## 4) Applicant Interview Readiness Module

### Goal
Increase applicant quality and engagement before live interviews.

### Planned Scope
- Role-specific mock questions
- Answer recording/transcript
- Recruiter-visible readiness score

## 5) Notifications and Activity Feed

### Goal
Reduce no-shows and drop-offs with timely, unified updates.

### Planned Scope
- Real-time updates for status, schedule actions, and messages
- Unified activity feed for recruiter and applicant dashboards

## Proposed Delivery Sequence
1. Interview Scheduling Flow completion (UI + reminders + tests)
2. Notifications and Activity Feed UI
3. Recruiter Pipeline Board
4. AI Screening Summary Card enhancements
5. Applicant Interview Readiness Module
