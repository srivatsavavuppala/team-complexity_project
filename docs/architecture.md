## Architecture

### Directory Structure
```
/workspace
  client/               # React app (CRA)
  server/               # Express API + SQLite
  Dockerfile
  docker-compose.yml
```

### Backend (Express)
- Entry: `server/index.js`
- Config: `server/config/database.js` (creates tables; manages SQLite connection)
- Middleware: `server/middleware/auth.js` (JWT auth/role)
- Routes:
  - `api/auth` → `server/routes/auth.js`
  - `api/candidates` → `server/routes/candidates.js`
  - `api/jobs` → `server/routes/jobs.js`
  - `api/interviews` → `server/routes/interviews.js`
  - `api/dashboard` → `server/routes/dashboard.js`
  - `api/assessments` → `server/routes/assessments.js`
  - `api/submit` → `server/routes/assess.js` (assessment retrieval/submit)
- Services:
  - `server/services/groqService.js` (Groq AI calls)
  - `server/services/matchingService.js` (heuristic matching)
- Utils:
  - `server/utils/fileParser.js` (PDF/DOCX/TXT parsing; experience extraction)
  - `server/utils/assessmentEmailTemplate.js` (HTML email)

### Data Flow (key paths)
- Resume upload → parse file → analyze via Groq → store candidate → auto-match to jobs.
- Create job → persist → optionally match existing candidates (AI + heuristic path).
- Send assessment → email candidate → candidate completes form → responses saved → analysis generated via Groq.
- Interviews → schedule/start → per-answer analysis → complete with overall analysis.
- Dashboard → aggregate stats, activity, trends, pipeline.

### Security
- Helmet, rate limiting, CORS
- JWT auth for protected routes
- Input validation with Joi

### Error Handling
- Centralized error middleware, consistent 4xx/5xx responses
