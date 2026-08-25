# Virtual Interview - Dynamic Question Count Implementation

## Overview
Successfully modified the existing virtual interview feature to support a dynamic number of questions based on user selection.

## Changes Made

### Backend Changes

#### 1. **Service Layer** (`backend/src/services/virtual-interview.service.ts`)
- Updated `startInterview()` method to accept `questionCount` parameter (default: 10)
- Added validation to clamp questionCount between 3 and 15
- Modified `generateQuestions()` to accept and use dynamic questionCount
- Updated Groq prompt to request the exact number of questions
- Expanded `generateFallbackQuestions()` with 15 questions and slice to requested count

#### 2. **Controller Layer** (`backend/src/controllers/virtual-interview.controller.ts`)
- Updated `startInterview` endpoint to accept `questionCount` from request body
- Added validation for questionCount (min: 3, max: 15, default: 10)
- Passes validated questionCount to service layer

### Frontend Changes

#### 3. **Interview Service** (`src/services/interviewService.ts`)
- Updated `startInterview()` method to accept optional `questionCount` parameter
- Sends questionCount in request body to backend
- Added `totalQuestions` and `questionsAnswered` fields to `InterviewSession` interface

#### 4. **Virtual Interview UI** (`src/pages/applicant/VirtualInterview.tsx`)
- Added `questionCount` state (default: 10)
- Added dropdown selector for question count with options:
  - 3 Questions (Quick)
  - 5 Questions (Short)
  - 7 Questions (Medium)
  - 10 Questions (Standard) - Default
  - 15 Questions (Comprehensive)
- Updated "Start Interview" button text to show selected count
- Modified progress display to use `session.totalQuestions` instead of hardcoded 10
- Pass questionCount to API when starting interview

## API Usage

### Endpoint
`POST /api/virtual-interview/start`

### Request Body
```json
{
  "questionCount": 7  // Optional, defaults to 10
}
```

### Example Request with curl
```bash
curl -X POST http://localhost:5000/api/virtual-interview/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"questionCount": 7}'
```

### Response
```json
{
  "status": "success",
  "message": "Interview session started successfully",
  "data": {
    "session": {
      "_id": "...",
      "totalQuestions": 7,
      "questionsAnswered": 0,
      "questions": [...]
    },
    "greeting": "Hello! Welcome to your virtual interview...",
    "firstQuestion": {...}
  }
}
```

## Validation Rules

### QuestionCount Validation
- **Minimum**: 3 questions
- **Maximum**: 15 questions
- **Default**: 10 questions
- **Behavior**: 
  - Values < 3 are clamped to 3
  - Values > 15 are clamped to 15
  - Invalid/missing values default to 10

## Testing Checklist

- [x] Backend TypeScript compilation passes
- [ ] Test with 3 questions (minimum)
- [ ] Test with 10 questions (default)
- [ ] Test with 15 questions (maximum)
- [ ] Test with no questionCount (should default to 10)
- [ ] Test with questionCount < 3 (should clamp to 3)
- [ ] Test with questionCount > 15 (should clamp to 15)
- [ ] Test question generation with Groq AI
- [ ] Test fallback questions if AI fails
- [ ] Verify progress bar updates correctly
- [ ] Verify final evaluation includes all questions

## How to Use (User Perspective)

1. Navigate to the Virtual Interview page as an applicant
2. Ensure your profile is complete with skills, experience, etc.
3. Before starting the interview, select the desired number of questions from the dropdown:
   - Quick (3 questions) - ~5-7 minutes
   - Short (5 questions) - ~10-12 minutes
   - Medium (7 questions) - ~14-18 minutes
   - Standard (10 questions) - ~20-25 minutes
   - Comprehensive (15 questions) - ~30-40 minutes
4. Click "Start Interview (X Questions)"
5. Complete the interview as normal
6. Progress will show "X/Y" based on your selected count

## Files Modified

### Backend
- `backend/src/services/virtual-interview.service.ts`
- `backend/src/controllers/virtual-interview.controller.ts`

### Frontend
- `src/services/interviewService.ts`
- `src/pages/applicant/VirtualInterview.tsx`

## Notes

- The AI (Groq) will generate personalized questions based on the user's resume for the exact count requested
- If AI generation fails, the system falls back to pre-defined questions
- Questions remain personalized using data from the user's profile (skills, experience, projects)
- All existing functionality (STT, TTS, evaluation, final score) remains unchanged
- The feature is backward compatible - if questionCount is not provided, it defaults to 10

## Restart Required

**Yes, you need to restart the backend server** for these changes to take effect:

```bash
cd backend
npm run dev
```

The frontend will hot-reload automatically if using Vite/React dev server.
