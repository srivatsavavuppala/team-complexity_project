import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { GlobalStyles } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import App from './App';
import theme from './theme';
import { AuthProvider } from './contexts/AuthContext';

// Global styles for better desktop experience
const globalStyles = (
  <GlobalStyles
    styles={{
      '*': {
        boxSizing: 'border-box',
      },
      html: {
        height: '100%',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      },
      body: {
        height: '100%',
        margin: 0,
        padding: 0,
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        backgroundColor: '#f8fafc',
        overflowX: 'hidden',
      },
      '#root': {
        height: '100%',
        width: '100%',
      },
      // Custom scrollbar styles
      '::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
      },
      '::-webkit-scrollbar-track': {
        background: '#f1f5f9',
        borderRadius: '4px',
      },
      '::-webkit-scrollbar-thumb': {
        background: '#cbd5e1',
        borderRadius: '4px',
        '&:hover': {
          background: '#94a3b8',
        },
      },
      // Selection styles
      '::selection': {
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        color: '#1e293b',
      },
      // Focus styles for better accessibility
      'button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible': {
        outline: '2px solid #2563eb',
        outlineOffset: '2px',
      },
      // Smooth transitions for interactive elements
      'a, button, input, textarea, select': {
        transition: 'all 0.2s ease-in-out',
      },
      // Prevent text selection on UI elements
      '.MuiButton-root, .MuiIconButton-root, .MuiChip-root': {
        userSelect: 'none',
      },
      // Better image rendering
      img: {
        maxWidth: '100%',
        height: 'auto',
        display: 'block',
      },
      // Remove default margins from headings
      'h1, h2, h3, h4, h5, h6': {
        margin: 0,
      },
      // Better list styling
      'ul, ol': {
        paddingLeft: '1.5rem',
      },
      // Responsive text scaling
      '@media (max-width: 600px)': {
        html: {
          fontSize: '14px',
        },
      },
      '@media (min-width: 1200px)': {
        html: {
          fontSize: '16px',
        },
      },
    }}
  />
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {globalStyles}
          <AuthProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                  color: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                  backdropFilter: 'blur(20px)',
                  fontSize: '14px',
                  fontWeight: 500,
                },
                success: {
                  style: {
                    background: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
                  },
                  iconTheme: {
                    primary: '#ffffff',
                    secondary: '#059669',
                  },
                },
                error: {
                  style: {
                    background: 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)',
                  },
                  iconTheme: {
                    primary: '#ffffff',
                    secondary: '#dc2626',
                  },
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);