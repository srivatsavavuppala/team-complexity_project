## Database

SQLite managed in `server/config/database.js` with automatic table creation.

### Tables
- `users`
  - id, email (unique), password (bcrypt), name, role, created_at
- `candidates`
  - id, name, email, phone, resume_text, resume_analysis (JSON), skills (JSON), experience_years, created_at, updated_at
- `job_positions`
  - id, title, description, requirements, skills_required, experience_required, created_by, created_at
- `interviews`
  - id, candidate_id, job_position_id, interviewer_id, questions (JSON), answers (JSON), ai_analysis (JSON), score, status, scheduled_at, completed_at, created_at
- `candidate_matches`
  - id, candidate_id, job_position_id, match_score, ai_reasoning (JSON), created_at
- `assessments`
  - id, candidate_id, job_id, questions (JSON), status, assessment_response (JSON or NULL), analysis (JSON), created_at, expires_at, response (legacy?)
- `assessment_response` (auxiliary)
  - id, response (JSON)

### Notes
- JSON fields are stored as strings; parse on read.
- Foreign keys refer to `candidates`, `job_positions`, and `users`.
- `assessment_response` table is used by submit flow; canonical responses also stored in `assessments.assessment_response` for analysis.
