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
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Work as WorkIcon,
  Visibility as ViewIcon,
  Business as BusinessIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const schema = yup.object({
  title: yup.string().required('Job title is required'),
  description: yup.string().required('Job description is required'),
  requirements: yup.string(),
  skillsRequired: yup.string(),
  experienceRequired: yup.number().min(0, 'Experience must be 0 or greater'),
});

const JobCard = ({ job, onView }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card sx={{ height: '100%', cursor: 'pointer', minWidth: 300 }} onClick={() => onView(job.id)}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2, minWidth: 450 }}>
          <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
            <BusinessIcon />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              {job.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {job.experience_required ? `${job.experience_required}+ years experience` : 'Any experience level'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onView(job.id); }}>
            <ViewIcon />
          </IconButton>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {job.description}
        </Typography>

        {job.skills_required && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {job.skills_required.split(',').slice(0, 3).map((skill, index) => (
              <Chip
                key={index}
                label={skill.trim()}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            ))}
            {job.skills_required.split(',').length > 3 && (
              <Chip
                label={`+${job.skills_required.split(',').length - 3} more`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TimeIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
            <Typography variant="caption" color="text.secondary">
              {new Date(job.created_at).toLocaleDateString()}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            By {job.created_by_name}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  </motion.div>
);

const CreateJobDialog = ({ open, onClose, onSuccess }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
  });

  const createJobMutation = useMutation(
    (data) => axios.post('/api/jobs', data),
    {
      onSuccess: () => {
        toast.success('Job position created successfully!');
        onSuccess();
        onClose();
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to create job position');
      },
    }
  );

  const onSubmit = (data) => {
    createJobMutation.mutate(data);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Job Position</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                {...register('title')}
                fullWidth
                label="Job Title"
                error={!!errors.title}
                helperText={errors.title?.message}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                {...register('experienceRequired')}
                fullWidth
                label="Experience Required (years)"
                type="number"
                error={!!errors.experienceRequired}
                helperText={errors.experienceRequired?.message}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                {...register('skillsRequired')}
                fullWidth
                label="Required Skills (comma-separated)"
                error={!!errors.skillsRequired}
                helperText={errors.skillsRequired?.message}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                {...register('description')}
                fullWidth
                label="Job Description"
                multiline
                rows={4}
                error={!!errors.description}
                helperText={errors.description?.message}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                {...register('requirements')}
                fullWidth
                label="Additional Requirements"
                multiline
                rows={3}
                error={!!errors.requirements}
                helperText={errors.requirements?.message}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createJobMutation.isLoading}
          >
            {createJobMutation.isLoading ? 'Creating...' : 'Create Job'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const Jobs = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery(
    ['jobs', { search, page }],
    () => axios.get('/api/jobs', {
      params: { search, page, limit: 12 }
    }).then(res => res.data),
    { keepPreviousData: true }
  );

  const handleSearch = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries('jobs');
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading job positions..." />;
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load job positions: {error.response?.data?.error || error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Job Positions
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          Create Job
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search job positions by title, description, or skills..."
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
        </CardContent>
      </Card>

      {data?.jobs?.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <WorkIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No job positions found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {search ? 'Try adjusting your search criteria' : 'Create your first job position to get started'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Job Position
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Grid container spacing={3}>
            {data?.jobs?.map((job) => (
              <Grid item xs={12} sm={6} md={4} key={job.id}>
                <JobCard
                  job={job}
                  onView={(id) => navigate(`/jobs/${id}`)}
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

      <CreateJobDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </Box>
  );
};

export default Jobs;