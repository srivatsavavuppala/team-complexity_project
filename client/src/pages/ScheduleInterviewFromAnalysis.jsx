import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Alert,
  Avatar,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const schema = yup.object({
  scheduledAt: yup.date().required('Schedule date and time is required').typeError('Invalid date format'),
});

const ScheduleInterviewFromAnalysis = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      scheduledAt: new Date().toISOString().slice(0, 16),
    }
  });

  const { candidateId, candidateName, jobId, jobTitle, jobDescription } = location.state || {};

  // Redirect if no state data (direct URL access)
  if (!candidateId || !jobId) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Invalid access. Please use the Schedule Interview button from the analysis dialog.
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/interviews/from-assessment', {
        candidateId,
        jobId,
        scheduledAt: new Date(data.scheduledAt).toISOString(),
      });

      toast.success('Interview scheduled successfully!');
      navigate(`/interviews/${response.data.interview.id}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to schedule interview');
      console.error('Schedule interview error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, flexGrow: 1 }}>
          Schedule Interview
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Pre-filled Candidate & Job Info */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  Interview Details
                </Typography>

                {/* Candidate Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 56, height: 56 }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Candidate
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {candidateName}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Job Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', mr: 2, width: 56, height: 56 }}>
                    <WorkIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Position
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {jobTitle}
                    </Typography>
                  </Box>
                </Box>

                {jobDescription && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Job Description
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6 }}>
                        {jobDescription.substring(0, 300)}
                        {jobDescription.length > 300 ? '...' : ''}
                      </Typography>
                    </Box>
                  </>
                )}

                <Alert severity="info" sx={{ mt: 3 }}>
                  <Typography variant="body2">
                    This interview is being scheduled based on the AI assessment recommendation. The candidate will be prepared for their interview session.
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Schedule Form */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                  Schedule Interview Date & Time
                </Typography>

                <form onSubmit={handleSubmit(onSubmit)}>
                  <Controller
                    name="scheduledAt"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Interview Date & Time"
                        type="datetime-local"
                        error={!!errors.scheduledAt}
                        helperText={errors.scheduledAt?.message}
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 3 }}
                        inputProps={{
                          min: new Date().toISOString().slice(0, 16),
                        }}
                      />
                    )}
                  />

                  <Alert severity="warning" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      <strong>Note:</strong> Questions will be configured during the interview. The interviewer can customize the assessment as needed.
                    </Typography>
                  </Alert>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => navigate(-1)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      type="submit"
                      disabled={loading}
                      startIcon={loading && <CircularProgress size={20} />}
                    >
                      {loading ? 'Scheduling...' : 'Schedule Interview'}
                    </Button>
                  </Box>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ScheduleInterviewFromAnalysis;