# Backend Migration Guide: Node.js to Python (FastAPI)

This guide explains the migration of the AI Recruitment Helper backend from Node.js/Express to Python/FastAPI.

## 🚀 What's New

### Backend Changes
- **Framework**: Migrated from Express.js to FastAPI
- **Language**: Node.js → Python 3.11+
- **Database ORM**: Raw SQLite queries → SQLAlchemy with databases library
- **Authentication**: JWT implementation using python-jose
- **File Processing**: Migrated from Node.js libraries to Python equivalents
- **AI Service**: Groq SDK for Python
- **API Documentation**: Automatic OpenAPI/Swagger documentation via FastAPI

### Frontend
- **No Changes Required**: The React.js frontend remains unchanged
- **API Compatibility**: All endpoints maintain the same interface

## 📁 Project Structure

```
/
├── server/                 # Original Node.js backend (can be removed)
├── server_python/          # New Python FastAPI backend
│   ├── main.py            # FastAPI application entry point
│   ├── requirements.txt   # Python dependencies
│   ├── config/           # Database configuration
│   ├── models/           # Pydantic schemas
│   ├── routes/           # API route handlers
│   ├── middleware/       # Authentication & security middleware
│   ├── services/         # Business logic (Groq AI service)
│   └── utils/            # Utility functions (file parsing)
├── client/               # React frontend (unchanged)
├── docker-compose-python.yml  # Docker setup for Python backend
└── package.json          # Updated with Python scripts
```

## 🛠️ Installation & Setup

### Option 1: Local Development

1. **Install Python Dependencies**
   ```bash
   npm run install-python
   # or manually:
   cd server_python && pip install -r requirements.txt
   ```

2. **Set Environment Variables**
   ```bash
   cp server_python/.env.example server_python/.env
   # Edit .env file with your configuration
   ```

3. **Run the Application**
   ```bash
   npm run dev-python
   # This runs both Python backend and React frontend
   ```

### Option 2: Docker

1. **Using Docker Compose**
   ```bash
   npm run docker-up-python
   # or manually:
   docker-compose -f docker-compose-python.yml up -d
   ```

2. **Stop Services**
   ```bash
   npm run docker-down-python
   ```

## 🔧 Configuration

### Environment Variables (.env)
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

# Groq AI
GROQ_API_KEY=your-groq-api-key-here

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_EXTENSIONS=pdf,doc,docx,txt

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# Rate Limiting
RATE_LIMIT_PER_MINUTE=100
```

## 📚 API Documentation

FastAPI automatically generates interactive API documentation:
- **Swagger UI**: http://localhost:5000/docs
- **ReDoc**: http://localhost:5000/redoc
- **OpenAPI JSON**: http://localhost:5000/openapi.json

## 🔄 Migration Benefits

### Performance
- **Async Support**: FastAPI provides native async/await support
- **Type Safety**: Pydantic models ensure request/response validation
- **Automatic Serialization**: JSON serialization handled automatically

### Developer Experience
- **Interactive Docs**: Built-in API documentation
- **Type Hints**: Full Python type hinting support
- **Validation**: Automatic request validation with detailed error messages
- **IDE Support**: Better IntelliSense and debugging

### Security
- **Input Validation**: Pydantic models validate all inputs
- **Security Headers**: Custom security middleware
- **Rate Limiting**: Built-in rate limiting with slowapi
- **CORS**: Configurable CORS policies

## 🧪 Testing

The Python backend includes the same functionality as the Node.js version:

### API Endpoints
- ✅ `POST /api/auth/register` - User registration
- ✅ `POST /api/auth/login` - User authentication
- ✅ `GET /api/auth/me` - Get current user
- ✅ `POST /api/candidates/upload-resume` - Resume upload & analysis
- ✅ `GET /api/candidates` - List candidates
- ✅ `GET /api/candidates/{id}` - Get candidate details
- ✅ `POST /api/jobs` - Create job position
- ✅ `GET /api/jobs` - List job positions
- ✅ `POST /api/interviews` - Schedule interview
- ✅ `GET /api/interviews` - List interviews
- ✅ `GET /api/dashboard/stats` - Dashboard statistics

### Features
- ✅ File upload (PDF, DOCX, TXT)
- ✅ AI-powered resume analysis
- ✅ Interview question generation
- ✅ Candidate-job matching
- ✅ Interview response analysis
- ✅ Dashboard analytics
- ✅ User authentication & authorization
- ✅ Role-based access control

## 🚨 Breaking Changes

**None!** The API interface remains exactly the same. The React frontend will work without any modifications.

## 📦 Dependencies

### Python Backend
- **FastAPI**: Modern, fast web framework
- **Uvicorn**: ASGI server
- **SQLAlchemy**: SQL toolkit and ORM
- **Pydantic**: Data validation using Python type hints
- **python-jose**: JWT token handling
- **passlib**: Password hashing
- **groq**: Groq AI SDK
- **slowapi**: Rate limiting
- **python-multipart**: File upload support

### File Processing
- **PyPDF2**: PDF text extraction
- **python-docx**: DOCX file processing
- **python-magic**: File type detection

## 🔄 Rollback Plan

If you need to rollback to the Node.js backend:

1. **Stop Python Backend**
   ```bash
   npm run docker-down-python
   ```

2. **Start Node.js Backend**
   ```bash
   npm run dev
   ```

The original Node.js backend code remains in the `server/` directory.

## 🎯 Next Steps

1. **Test the Migration**: Verify all functionality works as expected
2. **Update CI/CD**: Update deployment scripts to use Python backend
3. **Monitor Performance**: Compare performance metrics
4. **Remove Node.js Backend**: Once confident, remove the `server/` directory
5. **Update Documentation**: Update any deployment or development docs

## 🆘 Troubleshooting

### Common Issues

1. **Port Conflicts**
   - Ensure port 5000 is available
   - Check if Node.js backend is still running

2. **Database Issues**
   - Database file is created automatically
   - Check file permissions in the data directory

3. **Python Dependencies**
   - Use Python 3.11+ for best compatibility
   - Consider using a virtual environment

4. **File Upload Issues**
   - Check `MAX_FILE_SIZE` environment variable
   - Verify `python-magic` is properly installed

### Getting Help

- Check the FastAPI logs for detailed error messages
- Use the interactive API docs at `/docs` for testing
- Verify environment variables are properly set

## 📈 Performance Comparison

The Python backend should provide:
- **Better Async Performance**: Native async/await support
- **Improved Memory Usage**: More efficient file processing
- **Faster Startup**: Quicker application initialization
- **Better Error Handling**: More detailed error responses

---

**Migration Status**: ✅ Complete
**Compatibility**: 🟢 Full backward compatibility
**Frontend Changes**: ❌ None required