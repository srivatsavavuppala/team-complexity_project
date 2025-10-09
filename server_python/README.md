# AI Recruitment Helper - Python FastAPI Backend

A modern, high-performance backend for the AI-powered recruitment and interview management system.

## 🚀 Features

- **FastAPI Framework**: Modern, fast web framework with automatic API documentation
- **AI-Powered Analysis**: Resume analysis, interview questions, and candidate matching using Groq AI
- **File Processing**: Support for PDF, DOCX, and TXT resume uploads
- **Authentication**: JWT-based authentication with role-based access control
- **Database**: SQLAlchemy with SQLite for development (easily configurable for PostgreSQL/MySQL)
- **Rate Limiting**: Built-in API rate limiting
- **Security**: Comprehensive security headers and CORS configuration
- **Type Safety**: Full Pydantic validation for all API endpoints

## 📋 Requirements

- Python 3.11+
- Groq API Key

## 🛠️ Installation

1. **Clone and navigate to the Python backend**
   ```bash
   cd server_python
   ```

2. **Create virtual environment (recommended)**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run the application**
   ```bash
   python main.py
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Environment
ENVIRONMENT=development
PORT=5000

# Database
DATABASE_URL=sqlite:///./database.db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=24

# Groq AI Configuration
GROQ_API_KEY=your-groq-api-key-here

# File Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_EXTENSIONS=pdf,doc,docx,txt

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000

# Rate Limiting
RATE_LIMIT_PER_MINUTE=100
```

## 📚 API Documentation

Once the server is running, visit:

- **Interactive API Docs (Swagger)**: http://localhost:5000/docs
- **Alternative Docs (ReDoc)**: http://localhost:5000/redoc
- **OpenAPI JSON**: http://localhost:5000/openapi.json

## 🏗️ Project Structure

```
server_python/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── config/
│   └── database.py        # Database configuration and models
├── models/
│   └── schemas.py         # Pydantic models for validation
├── routes/
│   ├── auth.py           # Authentication endpoints
│   ├── candidates.py     # Candidate management
│   ├── jobs.py           # Job position management
│   ├── interviews.py     # Interview management
│   └── dashboard.py      # Analytics and statistics
├── middleware/
│   ├── auth.py           # JWT authentication middleware
│   └── security.py       # Security headers middleware
├── services/
│   └── groq_service.py   # AI service integration
└── utils/
    └── file_parser.py    # File processing utilities
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### User Roles

- **admin**: Full system access
- **recruiter**: Can manage jobs, candidates, and interviews
- **interviewer**: Can conduct interviews and view assigned candidates

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Candidates
- `POST /api/candidates/upload-resume` - Upload and analyze resume
- `GET /api/candidates` - List candidates (with pagination)
- `GET /api/candidates/{id}` - Get candidate details
- `PUT /api/candidates/{id}` - Update candidate
- `DELETE /api/candidates/{id}` - Delete candidate
- `POST /api/candidates/{id}/match-job/{job_id}` - Match candidate to job

### Jobs
- `POST /api/jobs` - Create job position
- `GET /api/jobs` - List job positions
- `GET /api/jobs/{id}` - Get job details
- `PUT /api/jobs/{id}` - Update job position
- `DELETE /api/jobs/{id}` - Delete job position
- `POST /api/jobs/{id}/generate-questions` - Generate interview questions

### Interviews
- `POST /api/interviews` - Schedule interview
- `GET /api/interviews` - List interviews
- `GET /api/interviews/{id}` - Get interview details
- `PUT /api/interviews/{id}` - Update interview
- `POST /api/interviews/{id}/start` - Start interview
- `POST /api/interviews/{id}/complete` - Complete interview

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-activity` - Get recent activity
- `GET /api/dashboard/performance-metrics` - Get performance analytics

## 🧪 Testing

Run tests using pytest:

```bash
pytest
```

For test coverage:

```bash
pytest --cov=.
```

## 🐳 Docker

Build and run with Docker:

```bash
docker build -t ai-recruitment-backend .
docker run -p 5000:5000 ai-recruitment-backend
```

Or use the provided docker-compose:

```bash
docker-compose -f ../docker-compose-python.yml up -d
```

## 🚀 Deployment

### Production Configuration

1. **Set environment to production**
   ```env
   ENVIRONMENT=production
   ```

2. **Use a production database**
   ```env
   DATABASE_URL=postgresql://user:password@localhost/dbname
   ```

3. **Configure security**
   - Use a strong JWT secret
   - Set up proper CORS origins
   - Configure rate limiting appropriately

4. **Use a production ASGI server**
   ```bash
   pip install gunicorn
   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

## 📈 Performance

The FastAPI backend provides:

- **High Performance**: Built on Starlette and Pydantic
- **Async Support**: Native async/await for I/O operations
- **Automatic Validation**: Request/response validation with detailed error messages
- **Type Safety**: Full type hints for better IDE support and fewer bugs

## 🔧 Development

### Adding New Endpoints

1. Create route handler in appropriate file under `routes/`
2. Define Pydantic models in `models/schemas.py`
3. Add route to main application in `main.py`
4. Update documentation

### Database Changes

1. Modify table definitions in `config/database.py`
2. Update Pydantic models in `models/schemas.py`
3. Handle data migration if needed

## 🆘 Troubleshooting

### Common Issues

1. **Import Errors**: Ensure all dependencies are installed
2. **Database Errors**: Check database file permissions
3. **File Upload Issues**: Verify `python-magic` installation
4. **AI Service Errors**: Verify Groq API key is set correctly

### Logging

The application logs detailed information. Check console output for debugging information.

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

---

For more information, see the main project README and migration guide.