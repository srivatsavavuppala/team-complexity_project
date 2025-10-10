# AI Recruitment Helper

A full-stack application with FastAPI backend and React.js frontend for AI-powered recruitment and interview management.

## Project Structure

```
/
├── backend/         # FastAPI Python backend
├── frontend/        # React.js frontend
├── server/          # Legacy Node.js server (can be removed)
├── server_python/   # Legacy Python server (can be removed)
├── client/          # Legacy React client (can be removed)
└── README.md        # This file
```

## Quick Start

### Prerequisites

- **Python 3.8+** (for backend)
- **Node.js 16+** (for frontend)
- **npm or yarn** (for frontend package management)

### Backend Setup (FastAPI)

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the FastAPI server:
   ```bash
   python run.py
   ```
   
   Or alternatively:
   ```bash
   uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```

The backend will be available at: **http://localhost:8000**

### Frontend Setup (React.js)

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```

The frontend will be available at: **http://localhost:3000**

## API Documentation

Once the backend is running, you can access:
- **Interactive API docs**: http://localhost:8000/docs
- **ReDoc documentation**: http://localhost:8000/redoc
- **Health check**: http://localhost:8000/api/health

## Features

### Backend (FastAPI)
- ✅ RESTful API with FastAPI
- ✅ JWT Authentication
- ✅ SQLite database with SQLAlchemy
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ File upload and processing (PDF/DOCX)
- ✅ AI integration (Groq)
- ✅ Comprehensive error handling

### Frontend (React.js)
- ✅ Modern React 18 with hooks
- ✅ Material-UI components
- ✅ React Router for navigation
- ✅ Axios for API communication
- ✅ React Query for data management
- ✅ Form handling with validation
- ✅ Responsive design
- ✅ Authentication context

## Development Workflow

1. **Start Backend**: `cd backend && python run.py`
2. **Start Frontend**: `cd frontend && npm start`
3. **Access Application**: http://localhost:3000
4. **API Documentation**: http://localhost:8000/docs

## Environment Variables

### Backend (.env in backend/)
```env
ENVIRONMENT=development
HOST=127.0.0.1
PORT=8000
SECRET_KEY=your-secret-key-here
GROQ_API_KEY=your-groq-api-key
```

### Frontend (.env in frontend/)
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENVIRONMENT=development
```

## Production Deployment

### Backend
- Use `ENVIRONMENT=production` in environment variables
- Configure proper database (PostgreSQL recommended)
- Set up reverse proxy (nginx)
- Use process manager (PM2, systemd, or Docker)

### Frontend
- Run `npm run build` to create production build
- Serve static files with nginx or similar
- Update API URL for production backend

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both backend and frontend
5. Submit a pull request

## License

This project is licensed under the MIT License.