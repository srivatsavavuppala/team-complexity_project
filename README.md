# AI-Powered Interview & Recruitment Helper

An enterprise-grade recruitment platform powered by AI that streamlines the hiring process with intelligent resume analysis, automated interview question generation, and real-time candidate evaluation.

## 🚀 Features

### Core Functionality
- **AI Resume Analysis**: Automatically parse and analyze resumes using Groq AI
- **Smart Candidate Matching**: AI-powered job-candidate compatibility scoring
- **Dynamic Interview Questions**: Generate tailored interview questions based on job requirements
- **Real-time Interview Analysis**: Live analysis of candidate responses during interviews
- **Comprehensive Dashboard**: Beautiful analytics and insights for HR teams

### AI Capabilities
- Resume parsing and skill extraction
- Experience level assessment
- Candidate-job fit analysis
- Interview question generation (technical, behavioral, situational, cultural)
- Real-time answer evaluation and scoring
- Automated feedback and recommendations

### Enterprise Features
- Role-based access control (Admin, Recruiter, Interviewer)
- Secure authentication with JWT
- File upload support (PDF, DOCX, TXT)
- RESTful API architecture
- Responsive modern UI
- Real-time notifications

## 🛠 Technology Stack

### Backend
- **Node.js** with Express.js
- **Groq SDK** for AI processing
- **SQLite** database with comprehensive schema
- **JWT** authentication
- **Multer** for file uploads
- **PDF/DOCX** parsing capabilities

### Frontend
- **React 18** with modern hooks
- **Material-UI (MUI)** for beautiful components
- **React Query** for data management
- **React Router** for navigation
- **Framer Motion** for animations
- **React Hook Form** with validation

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Groq API key ([Get one here](https://console.groq.com/))

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm install

# Install all dependencies (server + client)
npm run install-all
```

### 2. Environment Setup

Create a `.env` file in the `server` directory:

```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your configuration:

```env
PORT=5000
GROQ_API_KEY=your_groq_api_key_here
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
DB_PATH=./database.sqlite
```

### 3. Start the Application

```bash
# Start both server and client in development mode
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

### 4. Create Your First Account

1. Navigate to http://localhost:3000
2. Click "Sign up here" to create an account
3. Choose your role (Admin, Recruiter, or Interviewer)
4. Start using the platform!

## 📖 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Candidates Endpoints
- `GET /api/candidates` - List all candidates
- `POST /api/candidates/upload-resume` - Upload and analyze resume
- `GET /api/candidates/:id` - Get candidate details
- `PUT /api/candidates/:id` - Update candidate
- `DELETE /api/candidates/:id` - Delete candidate
- `POST /api/candidates/:id/match-job/:jobId` - Match candidate to job

### Jobs Endpoints
- `GET /api/jobs` - List all job positions
- `POST /api/jobs` - Create new job position
- `GET /api/jobs/:id` - Get job details
- `PUT /api/jobs/:id` - Update job position
- `DELETE /api/jobs/:id` - Delete job position
- `POST /api/jobs/:id/generate-questions` - Generate interview questions

### Interviews Endpoints
- `GET /api/interviews` - List all interviews
- `POST /api/interviews` - Schedule new interview
- `GET /api/interviews/:id` - Get interview details
- `POST /api/interviews/:id/start` - Start interview
- `POST /api/interviews/:id/answer` - Submit answer for analysis
- `POST /api/interviews/:id/complete` - Complete interview

### Dashboard Endpoints
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/activity` - Get recent activity
- `GET /api/dashboard/trends/interviews` - Get interview trends
- `GET /api/dashboard/pipeline` - Get candidate pipeline data

## 🎯 Usage Guide

### For Recruiters

1. **Upload Candidate Resumes**
   - Go to Candidates → Upload Resume
   - Drag & drop or select PDF/DOCX/TXT files
   - AI automatically analyzes and scores the resume

2. **Create Job Positions**
   - Navigate to Job Positions → Create Job
   - Fill in job details, requirements, and skills
   - System will help match candidates automatically

3. **Match Candidates to Jobs**
   - View candidate profiles
   - Click "Match to Job" to see AI compatibility analysis
   - Review match scores and AI reasoning

### For Interviewers

1. **Schedule Interviews**
   - Go to Interviews → Schedule Interview
   - Select candidate and job position
   - Set date and time

2. **Conduct AI-Powered Interviews**
   - Generate tailored questions using AI
   - Start the interview and ask questions
   - Submit candidate answers for real-time AI analysis
   - Get instant feedback and scoring

3. **Complete Interviews**
   - Provide final score and feedback
   - Review comprehensive AI analysis
   - Export interview reports

### For Admins

1. **Monitor Dashboard**
   - View recruitment metrics and trends
   - Track interview success rates
   - Analyze candidate pipeline

2. **Manage Users**
   - Create accounts for team members
   - Assign appropriate roles
   - Monitor system usage

## 🔧 Configuration

### Groq AI Configuration
The system uses Groq's fast inference API for AI processing. Configure your API key in the environment variables:

```env
GROQ_API_KEY=gsk_your_api_key_here
```

### Database Configuration
SQLite is used by default for simplicity. The database file is created automatically:

```env
DB_PATH=./database.sqlite
```

### Security Configuration
Set a strong JWT secret for token encryption:

```env
JWT_SECRET=your_very_secure_random_string_here
```

## 🚀 Production Deployment

### Build for Production

```bash
# Build the client
npm run build

# Set environment to production
export NODE_ENV=production
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
GROQ_API_KEY=your_production_groq_key
JWT_SECRET=your_production_jwt_secret
DB_PATH=/path/to/production/database.sqlite
```

### Docker Deployment (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 🧪 Testing

```bash
# Run server tests
cd server && npm test

# Run client tests
cd client && npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs via GitHub Issues
- **API**: Use the health check endpoint to verify system status

## 🔮 Roadmap

- [ ] Advanced AI models integration
- [ ] Video interview analysis
- [ ] Bulk candidate import
- [ ] Advanced reporting and analytics
- [ ] Integration with popular ATS systems
- [ ] Mobile application
- [ ] Multi-language support

---

**Built with ❤️ using Groq AI for lightning-fast inference**

🤖 **Enterprise Ready** • 🚀 **AI-Powered** • 🔒 **Secure** • 📊 **Analytics-Driven**