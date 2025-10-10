import React from 'react';
import { Box, CircularProgress, Typography, Avatar } from '@mui/material';
import { Psychology } from '@mui/icons-material';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <Box
        sx={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)',
          top: '20%',
          right: '10%',
          animation: 'float 8s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px) scale(1)' },
            '50%': { transform: 'translateY(-30px) scale(1.05)' }
          }
        }}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, zIndex: 1 }}
      >
        {/* Logo with pulsing animation */}
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Avatar
            sx={{
              width: 80,
              height: 80,
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              boxShadow: '0 10px 30px rgba(37, 99, 235, 0.3)',
              mb: 2,
            }}
          >
            <Psychology sx={{ fontSize: 40 }} />
          </Avatar>
        </motion.div>

        {/* Custom loading animation */}
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress 
            size={60} 
            thickness={3}
            sx={{
              color: 'primary.main',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              }
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { transform: 'scale(1)', opacity: 0.7 },
                '50%': { transform: 'scale(1.1)', opacity: 0.3 }
              }
            }}
          />
        </Box>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'text.primary',
              fontWeight: 600,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {message}
          </Typography>
        </motion.div>

        {/* Loading dots */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              animate={{
                y: [-5, 5, -5],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
                ease: "easeInOut"
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                }}
              />
            </motion.div>
          ))}
        </Box>
      </motion.div>
    </Box>
  );
};

export default LoadingSpinner;