#!/bin/bash

echo "🚀 Setting up FastAPI Backend and React Frontend"
echo "================================================"

# Setup Backend
echo "📦 Setting up FastAPI Backend..."
cd backend
echo "Installing Python dependencies..."
pip3 install -r requirements.txt
if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed successfully"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi
cd ..

# Setup Frontend
echo "📦 Setting up React Frontend..."
cd frontend
echo "Installing Node.js dependencies..."
npm install
if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed successfully"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi
cd ..

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "To run the application:"
echo "1. Backend (FastAPI): cd backend && python3 run.py"
echo "2. Frontend (React):  cd frontend && npm start"
echo ""
echo "URLs:"
echo "- Frontend: http://localhost:3000"
echo "- Backend:  http://localhost:8000"
echo "- API Docs: http://localhost:8000/docs"