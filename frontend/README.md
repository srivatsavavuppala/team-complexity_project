# React Frontend

This is the React.js frontend for the AI Recruitment Helper application.

## Features

- **React 18**: Modern React with hooks and functional components
- **React Router**: Client-side routing
- **Material-UI**: Modern, accessible UI components
- **Axios**: HTTP client for API communication
- **React Query**: Data fetching and caching
- **React Hook Form**: Form handling with validation
- **Framer Motion**: Smooth animations
- **React Hot Toast**: Toast notifications
- **Recharts**: Data visualization charts

## Setup

1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Environment Variables** (optional):
   Create a `.env` file in the frontend directory:
   ```env
   REACT_APP_API_URL=http://localhost:8000
   REACT_APP_ENVIRONMENT=development
   ```

## Running the Frontend

```bash
cd frontend
npm start
```

The frontend will be available at: http://localhost:3000

## Available Scripts

- `npm start`: Runs the app in development mode
- `npm build`: Builds the app for production
- `npm test`: Launches the test runner
- `npm run eject`: Ejects from Create React App (not recommended)

## Project Structure

```
frontend/
├── public/          # Static files
├── src/
│   ├── components/  # Reusable UI components
│   ├── contexts/    # React contexts (Auth, etc.)
│   ├── pages/       # Page components
│   ├── App.js       # Main application component
│   ├── index.js     # Application entry point
│   └── theme.js     # Material-UI theme configuration
├── package.json     # Dependencies and scripts
└── README.md        # This file
```

## Backend Integration

The frontend is configured to communicate with the FastAPI backend:
- **Backend URL**: http://localhost:8000 (configured in package.json proxy)
- **API Base Path**: `/api`
- **Authentication**: JWT tokens stored in localStorage

## Development

The application includes:
- Hot reloading in development
- Proxy configuration for backend API calls
- Material-UI theming
- Responsive design
- Authentication context
- Error handling with toast notifications