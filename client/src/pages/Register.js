import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  Container,
  Avatar,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Chip,
  Stack,
  Paper,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Psychology,
  WorkOutline,
  PersonAdd,
  Security,
  Speed,
  TrendingUp,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const schema = yup.object({
  name: yup.string().min(2, 'Name must be at least 2 characters').required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  role: yup.string().required('Role is required'),
});

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setError,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      role: 'recruiter',
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await registerUser(data.name, data.email, data.password, data.role);
      if (result.success) {
        toast.success('Account created successfully!');
        navigate('/dashboard');
      } else {
        setError('root', { message: result.error });
      }
    } catch (error) {
      setError('root', { message: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)
          `,
        }}
      />
      
      {/* Left Side - Branding */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 6,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Avatar
              sx={{
                bgcolor: 'rgba(59, 130, 246, 0.2)',
                width: 120,
                height: 120,
                mx: 'auto',
                mb: 4,
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              <Psychology sx={{ fontSize: 60, color: '#3b82f6' }} />
            </Avatar>
            
            <Typography 
              variant="h2" 
              sx={{ 
                color: 'white',
                fontWeight: 700,
                mb: 2,
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Join the Future
            </Typography>
            
            <Typography 
              variant="h5" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                mb: 4,
                fontWeight: 300,
              }}
            >
              of Recruitment
            </Typography>
            
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                mb: 6,
                maxWidth: 400,
                lineHeight: 1.6,
              }}
            >
              Start your journey with AI-powered recruitment tools that help you find 
              the perfect candidates faster and make data-driven hiring decisions.
            </Typography>
          </Box>

          {/* Benefits */}
          <Stack spacing={3} sx={{ maxWidth: 400 }}>
            {[
              { icon: <Psychology />, title: 'Smart Candidate Matching', desc: 'AI analyzes resumes and matches perfect candidates' },
              { icon: <TrendingUp />, title: 'Performance Insights', desc: 'Track hiring metrics and improve your process' },
              { icon: <Security />, title: 'Secure & Compliant', desc: 'Enterprise-grade security for sensitive data' },
              { icon: <Speed />, title: 'Save Time & Resources', desc: 'Automate repetitive tasks and focus on decisions' },
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              >
                <Paper
                  sx={{
                    p: 3,
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'rgba(59, 130, 246, 0.2)',
                        width: 40,
                        height: 40,
                        mr: 2,
                      }}
                    >
                      {React.cloneElement(benefit.icon, { sx: { color: '#3b82f6', fontSize: 20 } })}
                    </Avatar>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                      {benefit.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {benefit.desc}
                  </Typography>
                </Paper>
              </motion.div>
            ))}
          </Stack>
        </motion.div>
      </Box>

      {/* Right Side - Register Form */}
      <Box
        sx={{
          flex: { xs: 1, md: 0.6 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Container maxWidth="sm">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card
              sx={{
                borderRadius: 4,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                overflow: 'visible',
              }}
            >
              <CardContent sx={{ p: 5 }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'primary.main',
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      mb: 3,
                      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                      boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)',
                    }}
                  >
                    <PersonAdd fontSize="large" />
                  </Avatar>
                  
                  <Typography 
                    variant="h4" 
                    component="h1" 
                    gutterBottom 
                    sx={{ 
                      fontWeight: 700,
                      color: '#1e293b',
                      mb: 1,
                    }}
                  >
                    Create Account
                  </Typography>
                  
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    Join thousands of recruiters using AI
                  </Typography>

                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Chip 
                      label="Free Trial" 
                      size="small" 
                      sx={{ 
                        bgcolor: 'rgba(34, 197, 94, 0.1)',
                        color: '#22c55e',
                        fontWeight: 600,
                      }} 
                    />
                    <Chip 
                      label="No Credit Card" 
                      size="small" 
                      sx={{ 
                        bgcolor: 'rgba(59, 130, 246, 0.1)',
                        color: '#3b82f6',
                        fontWeight: 600,
                      }} 
                    />
                  </Stack>
                </Box>

                {errors.root && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mb: 3,
                        borderRadius: 2,
                        '& .MuiAlert-icon': {
                          fontSize: 20,
                        },
                      }}
                    >
                      {errors.root.message}
                    </Alert>
                  </motion.div>
                )}

                <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                  <TextField
                    {...register('name')}
                    fullWidth
                    label="Full Name"
                    autoComplete="name"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    sx={{ 
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': {
                          borderColor: '#3b82f6',
                        },
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person sx={{ color: '#64748b' }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    {...register('email')}
                    fullWidth
                    label="Email Address"
                    type="email"
                    autoComplete="email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    sx={{ 
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': {
                          borderColor: '#3b82f6',
                        },
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: '#64748b' }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                      <FormControl 
                        fullWidth 
                        sx={{ 
                          mb: 3,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover fieldset': {
                              borderColor: '#3b82f6',
                            },
                          },
                        }} 
                        error={!!errors.role}
                      >
                        <InputLabel>Your Role</InputLabel>
                        <Select
                          {...field}
                          label="Your Role"
                          startAdornment={
                            <InputAdornment position="start">
                              <WorkOutline sx={{ color: '#64748b' }} />
                            </InputAdornment>
                          }
                        >
                          <MenuItem value="recruiter">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography>Recruiter</Typography>
                              <Chip label="Most Popular" size="small" sx={{ ml: 1, fontSize: '0.7rem' }} />
                            </Box>
                          </MenuItem>
                          <MenuItem value="interviewer">Interviewer</MenuItem>
                          <MenuItem value="admin">Admin</MenuItem>
                        </Select>
                        {errors.role && (
                          <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                            {errors.role.message}
                          </Typography>
                        )}
                      </FormControl>
                    )}
                  />

                  <TextField
                    {...register('password')}
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    sx={{ 
                      mb: 4,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': {
                          borderColor: '#3b82f6',
                        },
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: '#64748b' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            sx={{ color: '#64748b' }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      mb: 3,
                      py: 2,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                      boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)',
                      textTransform: 'none',
                      '&:hover': {
                        boxShadow: '0 15px 35px rgba(59, 130, 246, 0.4)',
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    {loading ? 'Creating Account...' : 'Start Free Trial'}
                  </Button>

                  <Divider sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Already have an account?
                    </Typography>
                  </Divider>

                  <Box sx={{ textAlign: 'center' }}>
                    <Button
                      component={RouterLink}
                      to="/login"
                      variant="outlined"
                      fullWidth
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        borderColor: '#e2e8f0',
                        color: '#64748b',
                        fontWeight: 600,
                        textTransform: 'none',
                        '&:hover': {
                          borderColor: '#3b82f6',
                          backgroundColor: 'rgba(59, 130, 246, 0.05)',
                          color: '#3b82f6',
                        },
                      }}
                    >
                      Sign In Instead
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
};

export default Register;