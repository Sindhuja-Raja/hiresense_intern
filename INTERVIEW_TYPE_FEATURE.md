# Virtual Interview - Interview Type & Question Count Feature

## Overview
Enhanced the virtual interview feature to allow users to choose:
1. **Interview Type**: Technical, Behavioral, Experience, HR, or Mixed
2. **Question Count**: 3 to 15 questions (default: 10)

## Features Added

### Interview Types

#### 1. **Technical** 🔧
- Focus: Coding, system design, algorithms, frameworks
- Questions about: Tech stack, problem-solving, best practices
- Ideal for: Developer roles, technical assessments
- Examples:
  - "How do you approach debugging a complex production issue?"
  - "Design a scalable system for [technology]"
  - "Explain your experience with [framework/language]"

#### 2. **Behavioral** 🤝
- Focus: STAR method (Situation, Task, Action, Result)
- Questions about: Teamwork, leadership, conflict resolution
- Ideal for: Assessing soft skills, communication
- Examples:
  - "Describe a time when you had to work with a difficult team member"
  - "Tell me about a time when you failed and what you learned"
  - "How do you handle stress and pressure?"

#### 3. **Experience** 💼
- Focus: Past work history, projects, responsibilities
- Questions about: Previous roles, challenges, achievements
- Ideal for: Understanding career progression
- Examples:
  - "Tell me about your most challenging project"
  - "Describe your role at [company]"
  - "What accomplishment are you most proud of?"

#### 4. **HR** 📋
- Focus: Career goals, culture fit, logistics
- Questions about: Motivations, expectations, availability
- Ideal for: Final rounds, culture assessment
- Examples:
  - "Why are you looking for a new opportunity?"
  - "Where do you see yourself in 3-5 years?"
  - "What are your salary expectations?"
  - "What is your notice period?"

#### 5. **Mixed** (Default) 🎯
- Focus: Balanced assessment across all categories
- Questions distributed across: Technical, Behavioral, Experience, HR
- Ideal for: Comprehensive evaluation
- Most versatile option

## Backend Implementation

### API Endpoint
`POST /api/virtual-interview/start`

### Request Body
```json
{
  "questionCount": 7,        // Optional: 3-15 (default: 10)
  "interviewType": "Technical"  // Optional: Technical|Behavioral|Experience|HR|Mixed (default: Mixed)
}
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
      "questions": [
        {
          "questionNumber": 1,
          "questionText": "Can you describe your experience with React?",
          "category": "technical",
          "difficulty": "easy",
          "relatedSkill": "React"
        },
        ...
      ]
    },
    "greeting": "Hello! Welcome to your Technical interview...",
    "firstQuestion": {...}
  }
}
```

## Files Modified

### Backend
1. **`backend/src/services/virtual-interview.service.ts`**
   - Added `interviewType` parameter to `startInterview()`
   - Updated `generateQuestions()` with dynamic prompts based on type
   - Expanded `generateFallbackQuestions()` with type-specific questions
   - Added 40+ fallback questions categorized by type

2. **`backend/src/controllers/virtual-interview.controller.ts`**
   - Extract and validate `interviewType` from request body
   - Pass validated type to service layer

### Frontend
3. **`src/services/interviewService.ts`**
   - Updated `startInterview()` to accept `interviewType` parameter
   - Send both questionCount and interviewType to backend

4. **`src/pages/applicant/VirtualInterview.tsx`**
   - Added `interviewType` state (default: 'Mixed')
   - Added Interview Type dropdown selector with 5 options
   - Updated button text to show selected type
   - Pass interviewType to API call

## UI Components

### Interview Type Selector
```tsx
<select value={interviewType} onChange={(e) => setInterviewType(e.target.value)}>
  <option value="Mixed">Mixed (Balanced)</option>
  <option value="Technical">Technical (Coding & Systems)</option>
  <option value="Behavioral">Behavioral (STAR Method)</option>
  <option value="Experience">Experience (Past Work)</option>
  <option value="HR">HR (Career Goals & Culture)</option>
</select>
```

### Question Count Selector
```tsx
<select value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))}>
  <option value={3}>3 Questions (Quick)</option>
  <option value={5}>5 Questions (Short)</option>
  <option value={7}>7 Questions (Medium)</option>
  <option value={10}>10 Questions (Standard)</option>
  <option value={15}>15 Questions (Comprehensive)</option>
</select>
```

## AI Prompt Engineering

### Technical Interview Prompt
```
Focus: ALL questions should be TECHNICAL in nature.
- Deep dive into their tech stack, skills, and technical knowledge
- Ask about system design, algorithms, data structures, frameworks
- Focus on problem-solving and coding scenarios
- Technical implementation details and best practices
```

### Behavioral Interview Prompt
```
Focus: ALL questions should be BEHAVIORAL in nature.
- Use STAR method (Situation, Task, Action, Result)
- Ask about teamwork, leadership, conflict resolution
- Focus on soft skills, communication, collaboration
- Past experiences handling challenges and pressure
```

### Experience Interview Prompt
```
Focus: ALL questions should be about their WORK EXPERIENCE.
- Deep dive into their previous roles and responsibilities
- Ask about specific projects they've worked on
- Focus on challenges faced and how they overcame them
- Career progression and key achievements
```

### HR Interview Prompt
```
Focus: ALL questions should be HR/CULTURAL FIT in nature.
- Ask about career goals, motivations, and aspirations
- Company culture fit and values alignment
- Work-life balance, team preferences
- Salary expectations, notice period, availability
```

## Validation Rules

### InterviewType Validation
- **Valid Values**: Technical, Behavioral, Experience, HR, Mixed
- **Default**: Mixed
- **Case Sensitive**: Yes
- **Behavior**: Invalid values default to 'Mixed'

### QuestionCount Validation
- **Minimum**: 3 questions
- **Maximum**: 15 questions
- **Default**: 10 questions
- **Behavior**: 
  - Values < 3 are clamped to 3
  - Values > 15 are clamped to 15
  - Invalid/missing values default to 10

## Testing Guide

### Test Cases

#### Interview Type Testing
- [ ] Test Technical interview (should generate only technical questions)
- [ ] Test Behavioral interview (should generate only behavioral questions)
- [ ] Test Experience interview (should generate only experience questions)
- [ ] Test HR interview (should generate only HR/career questions)
- [ ] Test Mixed interview (should generate balanced questions)
- [ ] Test invalid interviewType (should default to Mixed)
- [ ] Test no interviewType (should default to Mixed)

#### Question Count Testing
- [ ] Test with 3 questions (minimum)
- [ ] Test with 10 questions (default)
- [ ] Test with 15 questions (maximum)
- [ ] Test with questionCount < 3 (should clamp to 3)
- [ ] Test with questionCount > 15 (should clamp to 15)
- [ ] Test with no questionCount (should default to 10)

#### Combined Testing
- [ ] Test Technical with 5 questions
- [ ] Test Behavioral with 7 questions
- [ ] Test HR with 3 questions
- [ ] Test Mixed with 15 questions
- [ ] Verify AI generates questions matching selected type
- [ ] Verify fallback questions match selected type if AI fails

## Example Use Cases

### Use Case 1: Quick Technical Screening
```json
{
  "questionCount": 3,
  "interviewType": "Technical"
}
```
**Result**: 3 focused technical questions for rapid assessment

### Use Case 2: Comprehensive Behavioral Assessment
```json
{
  "questionCount": 15,
  "interviewType": "Behavioral"
}
```
**Result**: 15 STAR-method behavioral questions

### Use Case 3: HR Final Round
```json
{
  "questionCount": 5,
  "interviewType": "HR"
}
```
**Result**: 5 questions about career goals, culture fit, logistics

### Use Case 4: Balanced Full Interview
```json
{
  "questionCount": 10,
  "interviewType": "Mixed"
}
```
**Result**: 10 questions distributed across all categories

## User Flow

1. **Navigate** to Virtual Interview page
2. **Select Interview Type** from dropdown:
   - Mixed (Balanced) - Default
   - Technical (Coding & Systems)
   - Behavioral (STAR Method)
   - Experience (Past Work)
   - HR (Career Goals & Culture)
3. **Select Question Count** from dropdown:
   - 3 Questions (Quick) - 5-7 mins
   - 5 Questions (Short) - 10-12 mins
   - 7 Questions (Medium) - 14-18 mins
   - 10 Questions (Standard) - 20-25 mins - Default
   - 15 Questions (Comprehensive) - 30-40 mins
4. **Click** "Start [Type] Interview (X Questions)"
5. **Complete** interview as normal
6. **Receive** final evaluation

## Benefits

### For Recruiters
- Customize interview focus based on role requirements
- Efficient screening with targeted questions
- Flexible duration based on interview stage

### For Candidates
- Know what to expect (type and duration)
- Prepare accordingly
- Better interview experience

### For System
- AI generates type-specific questions
- Fallback system ensures reliability
- Maintains personalization using resume data

## Notes

- All questions remain personalized based on user's resume
- AI (Groq) generates questions dynamically based on type
- Fallback system has 40+ pre-defined questions by type
- Backward compatible (defaults work if params not provided)
- No breaking changes to existing functionality

## Restart Required

**Yes**, restart the backend server for changes to take effect:

```bash
cd backend
npm run dev
```

Frontend will hot-reload automatically.
