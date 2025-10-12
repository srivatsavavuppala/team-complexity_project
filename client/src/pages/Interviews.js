import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  Alert,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  RecordVoiceOver as InterviewIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

import {
  Delete as DeleteIcon,
} from '@mui/icons-material';

const schema = yup.object({
  candidateId: yup.string().required('Candidate is required'),
  jobPositionId: yup.string().required('Job position is required'),
  scheduledAt: yup.date().required('Schedule date is required'),
});



const getStatusColor = (status) => {
  switch (status) {
    case 'scheduled': return 'primary';
    case 'in_progress': return 'warning';
    case 'completed': return 'success';
    default: return 'default';
  }
};

const InterviewCard = ({ interview, onView, onDelete }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card sx={{ height: '100%',position: 'relative', cursor: 'pointer' }} onClick={() => onView(interview.id)}>
      <IconButton
        size="small"
        sx={{ position: 'absolute', top: 8, right: 8, color: 'error.main' }}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(interview);
        }}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
            <InterviewIcon />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              {interview.candidate_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {interview.job_title}
            </Typography>
          </Box>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onView(interview.id); }}>
            <ViewIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {new Date(interview.scheduled_at).toLocaleString()}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PersonIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Interviewer: {interview.interviewer_name}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Chip
            label={interview.status.replace('_', ' ')}
            size="small"
            color={getStatusColor(interview.status)}
            sx={{ textTransform: 'capitalize' }}
          />
          {interview.score && (
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Score: {interview.score}/100
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  </motion.div>
);

const ScheduleInterviewDialog = ({ open, onClose, onSuccess }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
  });

  const { data: candidates } = useQuery(
    'candidates-for-interview',
    () => axios.get('/api/candidates?limit=100').then(res => res.data.candidates)
  );

  const { data: jobs } = useQuery(
    'jobs-for-interview',
    () => axios.get('/api/jobs?limit=100').then(res => res.data.jobs)
  );

  const scheduleInterviewMutation = useMutation(
    (data) => axios.post('/api/interviews', data),
    {
      onSuccess: () => {
        toast.success('Interview scheduled successfully!');
        onSuccess();
        onClose();
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to schedule interview');
      },
    }
  );

  const onSubmit = (data) => {
    scheduleInterviewMutation.mutate(data);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Schedule New Interview</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Controller
                name="candidateId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.candidateId}>
                    <InputLabel>Candidate</InputLabel>
                    <Select {...field} label="Candidate">
                      {candidates?.map((candidate) => (
                        <MenuItem key={candidate.id} value={candidate.id}>
                          {candidate.name} - {candidate.email}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.candidateId && (
                      <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                        {errors.candidateId.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Controller
                name="jobPositionId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.jobPositionId}>
                    <InputLabel>Job Position</InputLabel>
                    <Select {...field} label="Job Position">
                      {jobs?.map((job) => (
                        <MenuItem key={job.id} value={job.id}>
                          {job.title}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.jobPositionId && (
                      <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                        {errors.jobPositionId.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Controller
                name="scheduledAt"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Scheduled Date & Time"
                    type="datetime-local"
                    error={!!errors.scheduledAt}
                    helperText={errors.scheduledAt?.message}
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={scheduleInterviewMutation.isLoading}
          >
            {scheduleInterviewMutation.isLoading ? 'Scheduling...' : 'Schedule Interview'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const Interviews = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery(
    ['interviews', { search, statusFilter, page }],
    () => axios.get('/api/interviews', {
      params: { search, status: statusFilter, page, limit: 12 }
    }).then(res => res.data),
    { keepPreviousData: true }
  );

  const onDelete = async (interview) => {
    const interviewId = interview.id;
    const res = await axios.delete(`/api/interviews/${interviewId}`);
    if(res.status === 200){
      queryClient.invalidateQueries('interviews');
      toast.success('Job position deleted successfully!');
    }
    else
      toast.error('Failed to delete job position');
  }

  const handleSearch = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleStatusFilter = (event) => {
    setStatusFilter(event.target.value);
    setPage(1);
  };

  const handleScheduleSuccess = () => {
    queryClient.invalidateQueries('interviews');
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading interviews..." />;
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load interviews: {error.response?.data?.error || error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Interviews
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setScheduleDialogOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          Schedule Interview
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Search interviews by candidate name, job title..."
                value={search}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={handleStatusFilter}
                  label="Status Filter"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {data?.interviews?.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <InterviewIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No interviews found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {search || statusFilter ? 'Try adjusting your search criteria' : 'Schedule your first interview to get started'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setScheduleDialogOpen(true)}
            >
              Schedule Interview
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Grid container spacing={3}>
            {data?.interviews?.map((interview) => (
              <Grid item xs={12} sm={6} md={4} key={interview.id}>
                <InterviewCard
                  interview={interview}
                  onView={(id) => navigate(`/interviews/${id}`)}
                  onDelete={onDelete}
                />
              </Grid>
            ))}
          </Grid>

          {data?.pagination?.pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={data.pagination.pages}
                page={page}
                onChange={(event, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      <ScheduleInterviewDialog
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        onSuccess={handleScheduleSuccess}
      />
    </Box>
  );
};

export default Interviews;