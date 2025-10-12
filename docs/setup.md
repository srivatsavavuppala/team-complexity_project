## Setup

### Prerequisites
- Node.js v16+ and npm
- Groq API key
- (Optional) Gmail SMTP or custom SMTP for assessment emails

### Installation
```bash
# At repository root
npm install
npm run install-all
```

### Environment Configuration
Create `.env` in `server` (see `server/.env.example`).

```env
PORT=5000
GROQ_API_KEY=your_groq_api_key_here
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
DB_PATH=./database.sqlite
# Email (choose one setup)
GMAIL_USER=your_gmail_user
GMAIL_PASS=your_gmail_app_password
# or SMTP
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_USER=username
SMTP_PASS=password
# Frontend URL used in emails/links
FRONTEND_URL=http://localhost:3000
COMPANY_NAME=Your Company
```

### Running Locally
```bash
npm run dev
```
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Health: http://localhost:5000/api/health

### Seeding / Utilities
SQLite DB is created automatically on first run. No seed needed.
