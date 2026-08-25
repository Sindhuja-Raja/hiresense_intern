# Question Generator API - Testing Guide

## Endpoint
`POST /api/question-generator/generate`

## Request Body

### Required Fields
- `role` (string): The job role (e.g., "Backend Developer")
- `experience` (string): Experience level (e.g., "Fresher", "2-5 years", "5+ years")
- `skills` (string[]): Array of technical skills (e.g., ["Node.js", "MongoDB"])

### Optional Fields
- `difficulty` (string): "Easy", "Medium", or "Hard" (default: "Medium")
- `interviewType` (string): "Technical", "Behavioral", or "Mixed" (default: "Technical")
- `questionCount` (number): Number of questions to generate
  - Minimum: 3
  - Maximum: 15
  - Default: 5

## Example Requests

### Basic Request (Uses Defaults)
```bash
curl -X POST http://localhost:5000/api/question-generator/generate \
  -H "Content-Type: application/json" \
  -d '{
    "role": "Backend Developer",
    "experience": "Fresher",
    "skills": ["Node.js", "MongoDB"]
  }'
```

### Full Request with All Parameters
```bash
curl -X POST http://localhost:5000/api/question-generator/generate \
  -H "Content-Type: application/json" \
  -d '{
    "role": "Backend Developer",
    "experience": "Fresher",
    "skills": ["Node.js", "MongoDB"],
    "difficulty": "Medium",
    "interviewType": "Technical",
    "questionCount": 6
  }'
```

### Request with 10 Questions
```bash
curl -X POST http://localhost:5000/api/question-generator/generate \
  -H "Content-Type: application/json" \
  -d '{
    "role": "Full Stack Developer",
    "experience": "3-5 years",
    "skills": ["React", "Node.js", "PostgreSQL"],
    "difficulty": "Hard",
    "interviewType": "Mixed",
    "questionCount": 10
  }'
```

## Expected Response

### Success Response (200 OK)
```json
{
  "status": "success",
  "message": "Generated 6 interview questions",
  "data": {
    "questions": [
      "1. Can you explain your experience with Node.js?",
      "2. What are the key features and advantages of MongoDB?",
      "3. How would you approach debugging a production issue in Node.js?",
      "4. Describe a challenging project where you used MongoDB.",
      "5. What best practices do you follow when working with Node.js?",
      "6. How do you ensure code quality and maintainability in your projects?"
    ],
    "metadata": {
      "role": "Backend Developer",
      "experience": "Fresher",
      "skills": ["Node.js", "MongoDB"],
      "difficulty": "Medium",
      "interviewType": "Technical",
      "questionCount": 6
    }
  }
}
```

### Error Response (400 Bad Request)
```json
{
  "status": "error",
  "message": "Role is required and must be a string"
}
```

## Validation Rules

### QuestionCount Validation
- If `questionCount < 3`: Automatically set to 3
- If `questionCount > 15`: Automatically set to 15
- If `questionCount` is not provided: Defaults to 5
- If `questionCount` is not a number: Returns 400 error

### Difficulty Validation
- Must be one of: "Easy", "Medium", "Hard"
- Case-sensitive
- Defaults to "Medium" if not provided

### InterviewType Validation
- Must be one of: "Technical", "Behavioral", "Mixed"
- Case-sensitive
- Defaults to "Technical" if not provided

## Testing Checklist

- [ ] Test with minimum questionCount (3)
- [ ] Test with maximum questionCount (15)
- [ ] Test with default questionCount (5)
- [ ] Test with questionCount < 3 (should be clamped to 3)
- [ ] Test with questionCount > 15 (should be clamped to 15)
- [ ] Test with missing required fields (role, experience, skills)
- [ ] Test with invalid difficulty value
- [ ] Test with invalid interviewType value
- [ ] Test with empty skills array
- [ ] Test with all three interviewType values
- [ ] Test with all three difficulty values
- [ ] Verify questions are numbered correctly
- [ ] Verify AI-generated questions match the count requested

## Notes

1. The API uses Groq AI for question generation
2. If AI generation fails, it falls back to pre-defined questions
3. Questions are personalized based on role and skills
4. The difficulty parameter affects question complexity
5. The interviewType parameter affects the type of questions generated
