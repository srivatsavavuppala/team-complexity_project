## API Reference

Base URL: `http://localhost:5000/api`

Auth: Bearer JWT via `Authorization: Bearer <token>` unless noted.

### Auth
- POST `/auth/register`
- POST `/auth/login`
- GET `/auth/me`

### Candidates
- POST `/candidates/upload-resume` (multipart `resume`, optional `name,email,phone`)
- POST `/candidates/:candidateId/send-assessment` (body: `{ jobId, questions }`)
- GET `/candidates/assessment/:assessmentId` (public for candidate)
- POST `/candidates/assessment/:assessmentId/submit` (public)
- POST `/candidates/:candidateId/generate-analysis` (body: `{ jobId }`)
- GET `/candidates/:candidateId/analysis/:jobId`
- GET `/candidates?search=&page=&limit=`
- GET `/candidates/:id`
- PUT `/candidates/:id`
- DELETE `/candidates/:id`
- GET `/candidates/:id/matches`
- POST `/candidates/:id/match-job/:jobId`

### Jobs
- POST `/jobs` (title, description, requirements?, skillsRequired?, experienceRequired?)
- GET `/jobs?search=&page=&limit=`
- GET `/jobs/:id`
- PUT `/jobs/:id`
- DELETE `/jobs/:id`
- POST `/jobs/:id/generate-questions` (candidateSkills[], difficulty)
- GET `/jobs/:id/matches`

### Interviews
- POST `/interviews` (candidateId, jobPositionId, scheduledAt, questions?)
- GET `/interviews?status=&page=&limit=`
- GET `/interviews/:id`
- POST `/interviews/from-assessment` (candidateId, jobId, scheduledAt)
- POST `/interviews/:id/start`
- POST `/interviews/:id/answer` (questionId, question, answer)
- POST `/interviews/:id/complete` (overallFeedback?, finalScore?)
- PUT `/interviews/:id` (scheduledAt?, questions?, status?)
- DELETE `/interviews/:id`

### Dashboard
- GET `/dashboard/stats`
- GET `/dashboard/activity?limit=`
- GET `/dashboard/trends/interviews?days=`
- GET `/dashboard/pipeline`

### Assessments (controller)
- POST `/assessments/send` (candidateId, jobId, questions) — uses controller and SMTP vars

### Submit (assessment form)
- POST `/submit/get-ai-assessment` (userId)
- POST `/submit/submit-assessment` (userId, formattedAnswers)

### Common Responses
Errors: `{ error: string, message?: string }`
Pagination: `{ page, limit, total, pages }`
