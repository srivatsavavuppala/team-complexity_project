## Overview

AI-Powered Interview & Recruitment Helper is a full‑stack application that streamlines hiring with AI‑assisted resume parsing, candidate-job matching, interview question generation, and assessment analysis.

### Goals
- Reduce time-to-hire with automated screening and matching
- Improve decision quality via consistent, explainable AI analysis
- Provide a smooth recruiter/interviewer workflow and a clean UI

### High-level Features
- AI resume parsing and analysis (Groq)
- Candidate-job matching and scoring
- Interview question generation per job
- Assessment delivery via email and response collection
- Interview session tracking, real-time answer analysis, and scoring
- Dashboard with stats, activity, trends, and pipeline insights

### Tech Stack
- Backend: Node.js + Express, SQLite, JWT, Multer, Nodemailer
- Frontend: React 18 (CRA), MUI, React Query, React Router
- AI: Groq SDK (llama-3.3-70b-versatile)
- Docker: Multi-stage build with health checks
