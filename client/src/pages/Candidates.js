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
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  CloudUpload as UploadIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

import {
  Delete as DeleteIcon,
} from '@mui/icons-material';

const CandidateCard = ({ candidate, onView, onDelete }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card sx={{ height: '100%', position: 'relative', cursor: 'pointer', minWidth: 300 }} onClick={() => onView(candidate.id)}>
      
        <IconButton
        size="small"
        sx={{ position: 'absolute', top: 8, right: 8, color: 'error.main' }}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(candidate);
        }}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2, mr: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
            <PersonIcon />
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 400, overflow: 'hidden' }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              {candidate.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {candidate.experience_years} years experience
              {candidate.current_job_title && ` • ${candidate.current_job_title}`}
            </Typography>
          </Box>
          
          
        </Box>

        {candidate.email && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <EmailIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {candidate.email}
            </Typography>
          </Box>
        )}

        {candidate.phone && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {candidate.phone}
            </Typography>
          </Box>
        )}


        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            AI Score: {candidate.resume_analysis?.overallScore != null
                ? `${candidate.resume_analysis.overallScore}/100`
                : 'N/A'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  </motion.div>
);

const UploadDialog = ({ open, onClose, onSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [file, setFile] = useState(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      setFile(acceptedFiles[0]);
    },
  });

  const handleUpload = async () => {
    if (!file || !candidateName) {
      toast.error('Please provide candidate name and resume file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('name', candidateName);

      await axios.post('/api/candidates/upload-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Resume uploaded and analyzed successfully!');
      onSuccess();
      onClose();
      setCandidateName('');
      setFile(null);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload Candidate Resume</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Candidate Name"
          value={candidateName}
          onChange={(e) => setCandidateName(e.target.value)}
          sx={{ mb: 3, mt: 1 }}
        />

        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.300',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: isDragActive ? 'action.hover' : 'background.paper',
            transition: 'all 0.2s',
          }}
        >
          <input {...getInputProps()} />
          <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          {file ? (
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {file.name}
            </Typography>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                Drop resume file here
              </Typography>
              <Typography variant="body2" color="text.secondary">
                or click to browse (PDF, DOCX, TXT)
              </Typography>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={uploading || !file || !candidateName}
        >
          {uploading ? 'Uploading...' : 'Upload & Analyze'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const Candidates = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery(
    ['candidates', { search, page }],
    () => axios.get('/api/candidates', {
      params: { search, page, limit: 12 }
    }).then(res => res.data),
    { keepPreviousData: true }
  );

  const onDelete = async (candidate) => {
    const res = await axios.delete(`/api/candidates/${candidate.id}`);
    if(res.status === 200){
      queryClient.invalidateQueries('candidates');
      toast.success('Job position deleted successfully!');
    }
    else
      toast.error('Failed to delete job position');
  }


  const handleSearch = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries('candidates');
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading candidates..." />;
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load candidates: {error.response?.data?.error || error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Candidates
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setUploadDialogOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          Upload Resume
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search candidates by name, email, or skills..."
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

      {data?.candidates?.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No candidates found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {search ? 'Try adjusting your search criteria' : 'Upload your first candidate resume to get started'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setUploadDialogOpen(true)}
            >
              Upload Resume
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Grid container spacing={3}>
            {data?.candidates?.map((candidate) => (
              <Grid item xs={12} sm={6} md={4} key={candidate.id}>
                <CandidateCard
                  candidate={candidate}
                  onView={(id) => navigate(`/candidates/${id}`)}
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

      <UploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </Box>
  );
};

export default Candidates;