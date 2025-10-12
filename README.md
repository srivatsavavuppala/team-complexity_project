# AI-Powered Interview & Recruitment Helper

An enterprise-grade recruitment platform that streamlines hiring with AI: resume analysis, smart matching, interview workflows, and rich analytics. This monorepo contains a React client and a Node/Express API backed by SQLite and Groq AI.

## 🚀 Features

- **AI Resume Analysis**: Parse PDFs/DOCX/TXT and extract skills, experience, and insights using Groq
- **Smart Candidate Matching**: Auto-match candidates to jobs with explainable scores
- **Dynamic Interview Questions**: Generate role-tailored question sets
- **Voice-based Candidate Assessment**: Guided voice responses with live transcription UI
- **Interview Lifecycle**: Schedule, conduct, score, and summarize interviews
- **Assessment Analysis**: Convert submitted answers to a structured AI report (per section + overall)
- **Secure AuthN/AuthZ**: JWT-based auth, role support, rate limiting, and hardened headers
- **Analytics Dashboard**: Stats, trends, pipeline views, and top skills

## 🧱 Repository Structure

```text
.
├─ client/                     # React app (CRA / MUI / React Query)
│  ├─ public/
│  └─ src/
│     ├─ components/          # Layout, spinners, shared UI
│     ├─ contexts/            # Auth context
│     ├─ pages/               # Dashboard, Candidates, Jobs, Interviews, Assess, etc.
│     ├─ App.js               # Routing (protected/public)
│     └─ theme.js
├─ server/                     # Express API (SQLite)
│  ├─ config/
│  │  └─ database.js          # SQLite initialization & schema
│  ├─ controllers/
│  │  └─ assessmentController.js  # (alt/legacy) SMTP-driven assessment mailer
│  ├─ middleware/
│  │  └─ auth.js              # JWT auth + role authorization
│  ├─ routes/                 # REST endpoints
│  │  ├─ auth.js              # /api/auth
│  │  ├─ candidates.js        # /api/candidates
│  │  ├─ jobs.js              # /api/jobs
│  │  ├─ interviews.js        # /api/interviews
│  │  ├─ dashboard.js         # /api/dashboard
│  │  ├─ assessments.js       # /api/assessments (alternative sender)
│  │  └─ assess.js            # /api/submit (assessment fetch/submit)
│  ├─ services/
│  │  └─ groqService.js       # Groq prompts for analysis/questions/matching
│  ├─ utils/
│  │  ├─ fileParser.js        # PDF/DOCX/TXT -> text, contact, exp years
│  │  └─ assessmentEmailTemplate.js
│  ├─ tests/
│  │  └─ api.test.js          # Health + basic auth tests
│  └─ index.js                # API bootstrap, health, static serving
├─ Dockerfile                  # Multi-stage build (client + server)
├─ docker-compose.yml          # Single service, persistent DB volume
├─ package.json                # Workspace scripts (dev/build/test)
├─ README.md                   # You are here
└─ server/.env.example         # Server-side env template
```

## 🛠 Technology Stack

- **Backend**: Node.js (Express), SQLite3, Multer, Joi, JWT, Helmet, Express Rate Limit
- **AI**: Groq SDK (LLM prompts for analysis, questions, matching)
- **Frontend**: React 18, React Router, React Query, MUI, Framer Motion, React Hook Form, Recharts
- **Email**: Nodemailer (Gmail or generic SMTP)
- **Container**: Dockerfile (multi-stage), docker-compose

## 📋 Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+ (or yarn/pnpm if you prefer adapting scripts)
- Groq API key (`https://console.groq.com`)

## ⚙️ Configuration

Create `server/.env` from the example, then fill values:

```bash
cp server/.env.example server/.env
```

Minimal variables (from `server/.env.example`):

```env
PORT=5000
NODE_ENV=development
DB_PATH=./database.sqlite
GROQ_API_KEY=your_groq_api_key_here
JWT_SECRET=your_jwt_secret_here
```

Additional variables used in the codebase:

- General
  - `FRONTEND_URL` (optional): e.g. `http://localhost:3000` for links in assessment emails
  - `COMPANY_NAME` (optional): used in outbound email branding
- Email (choose ONE approach)
  - Gmail (used by `candidates.js`):
    - `GMAIL_USER`: Gmail address
    - `GMAIL_PASS`: App Password (recommended) or OAuth token
  - SMTP (used by `controllers/assessmentController.js`):
    - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`

Notes:
- The route `/api/candidates/:candidateId/send-assessment` uses Gmail config by default.
- The alternate route `/api/assessments/send` uses the SMTP-based controller and has legacy/experimental data access; prefer the first route.

## ▶️ Local Development

Install dependencies for root, server, and client:

```bash
# From repository root
npm install
npm run install-all
```

Run both apps together (concurrently):

```bash
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

Client dev notes:
- The client uses CRA with a proxy to the API (`client/package.json -> proxy: http://localhost:5000`).
- Login/register from `/login` or `/register`; protected routes require a valid JWT.

## 📦 Useful Scripts

Root `package.json`:

- `npm run dev` — run API and client together (concurrently)
- `npm run server` — run server only (dev)
- `npm run client` — run client only (dev)
- `npm run build` — build client for production
- `npm run install-all` — install root + server + client deps
- `npm test` — run server tests then client tests

Server `package.json`:
- `npm run dev` — nodemon `index.js`
- `npm start` — node `index.js`
- `npm test` — jest tests

Client `package.json`:
- `npm start` — CRA dev server
- `npm build` — CRA build
- `npm test` — CRA tests

## 🗂 Database Schema (SQLite)

Tables created on boot (`server/config/database.js`):

- `users(id, email, password, name, role, created_at)`
- `candidates(id, name, email, phone, resume_text, resume_analysis, skills, experience_years, created_at, updated_at)`
- `job_positions(id, title, description, requirements, skills_required, experience_required, created_by, created_at)`
- `interviews(id, candidate_id, job_position_id, interviewer_id, questions, answers, ai_analysis, score, status, scheduled_at, completed_at, created_at)`
- `candidate_matches(id, candidate_id, job_position_id, match_score, ai_reasoning, created_at)`
- `assessments(id, candidate_id, job_id, questions, status, assessment_response, analysis, created_at, expires_at, response)`
- `assessment_response(id, response)` (stores submitted responses in legacy path)

Notes:
- JSON fields are stored as strings (`questions`, `resume_analysis`, `skills`, `answers`, `ai_analysis`, etc.).
- The assessment flow also writes `assessments.assessment_response` directly.

## 🔐 Security & Policies

- CORS: Dev allows `http://localhost:3000`, production expects your domain
- Helmet: Sensible security headers enabled
- Rate limiting: 100 req / 15 mins on `/api/*`
- JWT Auth: Bearer token required for protected endpoints; set `JWT_SECRET`

## 📡 API Reference (High level)

All routes are prefixed with `/api`. Most endpoints require `Authorization: Bearer <token>` headers after login.

### Auth
- `POST /api/auth/register` → Create account
- `POST /api/auth/login` → Authenticate and get JWT
- `GET /api/auth/me` → Current user (auth)

### Candidates
- `GET /api/candidates` → Paginated list with search (auth)
- `POST /api/candidates/upload-resume` → Upload PDF/DOCX/TXT; multipart field `resume` (auth)
- `GET /api/candidates/:id` → Candidate detail (auth)
- `PUT /api/candidates/:id` → Update profile (auth)
- `DELETE /api/candidates/:id` → Delete (auth)
- `GET /api/candidates/:id/matches` → Job matches (auth)
- `POST /api/candidates/:id/match-job/:jobId` → Force-match a candidate to a job (auth)

### Assessments
- `POST /api/candidates/:candidateId/send-assessment` → Send email with assessment link (auth)
- `GET /api/candidates/assessment/:assessmentId` → Fetch assessment (public to app)
- `POST /api/candidates/assessment/:assessmentId/submit` → Submit responses (public to app)
- `POST /api/candidates/:candidateId/generate-analysis` → Generate & persist AI analysis for completed assessment (auth)
- `GET /api/candidates/:candidateId/analysis/:jobId` → Retrieve stored analysis (auth)
- `POST /api/submit/get-ai-assessment` → Fetch questions for a candidate (auth; used by client Assess page)
- `POST /api/submit/submit-assessment` → Persist formatted answers (auth)
- `POST /api/assessments/send` → Alternate SMTP-based sender (legacy/experimental)

### Jobs
- `GET /api/jobs` → Paginated list (auth)
- `POST /api/jobs` → Create job (auth)
- `GET /api/jobs/:id` → Job detail (auth)
- `PUT /api/jobs/:id` → Update (auth, only creator)
- `DELETE /api/jobs/:id` → Delete (auth, only creator)
- `POST /api/jobs/:id/generate-questions` → AI-generate question set (auth)
- `GET /api/jobs/:id/matches` → Candidates matched to job (auth)

### Interviews
- `POST /api/interviews` → Schedule interview (auth)
- `GET /api/interviews` → List interviews (auth)
- `GET /api/interviews/:id` → Interview detail (auth)
- `POST /api/interviews/from-assessment` → Schedule interview for assessed candidate (auth)
- `POST /api/interviews/:id/start` → Mark in-progress (auth)
- `POST /api/interviews/:id/answer` → Submit one answer, receive AI analysis (auth)
- `POST /api/interviews/:id/complete` → Finalize interview and compute summary (auth)
- `PUT /api/interviews/:id` → Update (auth)
- `DELETE /api/interviews/:id` → Delete (auth)

### Dashboard
- `GET /api/dashboard/stats` → Aggregate counts and metrics (auth)
- `GET /api/dashboard/activity` → Recent activity feed (auth)
- `GET /api/dashboard/trends/interviews?days=30` → Time series (auth)
- `GET /api/dashboard/pipeline` → Experience bands and success rates (auth)

### Health
- `GET /api/health` → `{ status: "OK" }`

### Example: Login + Authenticated Request

```bash
# Login
curl -s -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"password123"}'

# Use the token for an authenticated call
TOKEN="<paste JWT here>"
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/candidates
```

### Example: Resume Upload (multipart)

```bash
curl -X POST http://localhost:5000/api/candidates/upload-resume \
  -H "Authorization: Bearer $TOKEN" \
  -F "resume=@/path/to/resume.pdf" \
  -F "name=Jane Doe" -F "email=jane@example.com"
```

## 🧭 Assessment Workflow

1. Recruiter creates a job (`/api/jobs`) and optionally generates questions (`/api/jobs/:id/generate-questions`).
2. Recruiter sends an assessment to a matched candidate (`/api/candidates/:candidateId/send-assessment`).
3. Candidate opens the link (frontend route `Assess/:userId`) and records voice answers; the app submits via `/api/submit/submit-assessment`.
4. Once status is `completed`, recruiter generates analysis (`/api/candidates/:candidateId/generate-analysis`), which is cached in `assessments.analysis`.
5. Recruiter can view the structured report per section plus overall recommendation in the UI (Job detail → Matched candidates).

## 🐳 Docker & Compose

Build and run with Compose (includes persistent DB volume):

```bash
docker compose up --build -d
```

- Service: `ai-recruiter` (exposes `5000:5000`)
- Volume: `ai-recruiter-data` mounted at `/app/data`, set `DB_PATH=/app/data/database.sqlite`
- Environment (override via your shell or a top-level `.env`):
  - `GROQ_API_KEY` (required)
  - `JWT_SECRET` (defaults to a fallback if not set but should be provided)
  - `PORT=5000`, `NODE_ENV=production`

Health checks poll `GET /api/health`.

## 🧪 Testing

```bash
# Server tests
cd server && npm test

# Client tests
cd client && npm test
```

## 🔧 Troubleshooting

- "CORS" errors in dev: ensure client proxy points to `http://localhost:5000` and server allows dev origin
- Gmail sender errors: use an App Password and enable IMAP; or switch to generic SMTP variables
- DB locked/permission denied in Docker: verify the named volume is writable by the container user
- Speech recognition not starting: browser must support Web Speech API; check permissions and HTTPS in prod

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-thing`
2. Run formatter/lints/tests locally
3. Open a PR with a clear description and test plan

## 📝 License

MIT

## 🔮 Roadmap (ideas)

- Advanced AI models and embeddings
- Video interview analysis
- Bulk candidate import
- Rich reporting and exports
- ATS integrations
- Mobile-friendly flows
- Multi-language support
