# FastAPI Backend

This is the FastAPI backend for the AI Recruitment Helper application.

## Features

- **FastAPI**: Modern, fast web framework for building APIs
- **Uvicorn**: ASGI server for running the application
- **SQLAlchemy**: Database ORM with SQLite support
- **Authentication**: JWT-based authentication system
- **Rate Limiting**: Built-in rate limiting with SlowAPI
- **CORS**: Configured for React frontend
- **File Processing**: Support for PDF and DOCX resume parsing
- **AI Integration**: Groq AI service integration

## Setup

1. **Install Dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Environment Variables** (optional):
   Create a `.env` file in the backend directory:
   ```env
   ENVIRONMENT=development
   HOST=127.0.0.1
   PORT=8000
   SECRET_KEY=your-secret-key-here
   GROQ_API_KEY=your-groq-api-key
   ```

## Running the Backend

### Method 1: Using the run script (recommended)
```bash
cd backend
python run.py
```

### Method 2: Using uvicorn directly
```bash
cd backend
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### Method 3: Using Python module
```bash
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The backend will be available at: http://127.0.0.1:8000

## API Documentation

Once the server is running, you can access:
- **Interactive API docs**: http://127.0.0.1:8000/docs
- **ReDoc documentation**: http://127.0.0.1:8000/redoc
- **Health check**: http://127.0.0.1:8000/api/health

## Project Structure

```
backend/
├── config/          # Database configuration
├── middleware/      # Custom middleware (auth, security)
├── models/          # Pydantic models and schemas
├── routes/          # API route handlers
├── services/        # Business logic services
├── utils/           # Utility functions
├── main.py          # FastAPI application
├── run.py           # Application runner script
└── requirements.txt # Python dependencies
```

## Development

The application includes:
- Auto-reload in development mode
- Comprehensive error handling
- Rate limiting (10 requests/minute for health endpoint)
- CORS configuration for React frontend
- Security middleware
- Database connection management