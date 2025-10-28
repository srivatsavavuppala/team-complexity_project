## Security & Configuration

### Authentication
- JWT via `Authorization: Bearer <token>`
- Tokens created on register/login; verified in `server/middleware/auth.js`

### Middleware
- `helmet` for headers
- `express-rate-limit` at `/api/`
- `cors` configured for local dev and production origins

### Validation
- Joi schemas validate inputs for auth, candidates, jobs, interviews

### Environment Variables
- `PORT`, `NODE_ENV`
- `JWT_SECRET` (required)
- `GROQ_API_KEY` (required for AI features)
- `DB_PATH` (SQLite location)
- Email (choose one): `GMAIL_USER`, `GMAIL_PASS` or `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- `FRONTEND_URL`, `COMPANY_NAME`

### File Uploads
- `multer` with memory storage and type/size restrictions

### Data Privacy
- Candidate resumes and analyses are stored in SQLite; ensure volume protection in production and restrict logs.
