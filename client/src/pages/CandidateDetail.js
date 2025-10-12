import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Grid,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  Star as StarIcon,
  Psychology as PsychologyIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const MatchJobDialog = ({ open, onClose, candidateId }) => {
  const [selectedJobId, setSelectedJobId] = useState('');
  const [matching, setMatching] = useState(false);
  const queryClient = useQueryClient();

  const { data: jobs } = useQuery(
    'jobs-for-matching',
    () => axios.get('/api/jobs?limit=100').then(res => res.data.jobs)
  );

  const handleMatch = async () => {
    if (!selectedJobId) {
      toast.error('Please select a job position');
      return;
    }

    setMatching(true);
    try {
      const response = await axios.post(`/api/candidates/${candidateId}/match-job/${selectedJobId}`);
      toast.success('Candidate matched to job successfully!');
      queryClient.invalidateQueries(['candidate', candidateId]);
      onClose();
      setSelectedJobId('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to match candidate to job');
    } finally {
      setMatching(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Match Candidate to Job</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Select Job Position</InputLabel>
          <Select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            label="Select Job Position"
          >
            {jobs?.map((job) => (
              <MenuItem key={job.id} value={job.id}>
                {job.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleMatch}
          variant="contained"
          disabled={matching || !selectedJobId}
        >
          {matching ? 'Matching...' : 'Match Candidate'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ScoreCard = ({ title, score, maxScore = 100, color = 'primary' }) => (
  <Card sx={{ textAlign: 'center' }}>
    <CardContent>
      <Typography variant="h4" sx={{ fontWeight: 600, color: `${color}.main`, mb: 1 }}>
        {score}
        <Typography component="span" variant="h6" color="text.secondary">
          /{maxScore}
        </Typography>
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={(score / maxScore) * 100}
        sx={{ mt: 1, height: 6, borderRadius: 3 }}
        color={color}
      />
    </CardContent>
  </Card>
);

const CandidateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);

  const { data: candidate, isLoading, error } = useQuery(
    ['candidate', id],
    () => axios.get(`/api/candidates/${id}`).then(res => res.data.candidate)
  );

  const { data: autoMatches, isLoading: matchesLoading } = useQuery(
    ['candidate-matches', id],
    () => axios.get(`/api/candidates/${id}/matches`).then(res => res.data.matches),
    { enabled: !!id }
  );

  if (isLoading) {
    return <LoadingSpinner message="Loading candidate details..." />;
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load candidate: {error.response?.data?.error || error.message}
      </Alert>
    );
  }

  const analysis = candidate?.resume_analysis;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/candidates')}
          sx={{ mr: 2 }}
        >
          Back to Candidates
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, flexGrow: 1 }}>
          Candidate Profile
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: 'primary.main',
                    mx: 'auto',
                    mb: 2,
                    fontSize: '2rem',
                  }}
                >
                  {candidate?.name?.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  {candidate?.name}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  {candidate?.experience_years} years of experience
                </Typography>
                {candidate?.current_job_title && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {candidate.current_job_title}
                    {candidate?.current_company && ` at ${candidate.current_company}`}
                  </Typography>
                )}
                {candidate?.education_level && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {candidate.education_level}
                    {candidate?.education_field && ` in ${candidate.education_field}`}
                  </Typography>
                )}

                <Divider sx={{ my: 2 }} />

                {candidate?.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">{candidate.email}</Typography>
                  </Box>
                )}

                {candidate?.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">{candidate.phone}</Typography>
                  </Box>
                )}

                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Skills
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                  {candidate?.skills?.map((skill, index) => (
                    <Chip
                      key={index}
                      label={skill}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* AI Analysis Scores */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              AI Analysis Results
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} md={3}>
                <ScoreCard
                  title="Overall Score"
                  score={analysis?.overallScore || 0}
                  color="primary"
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <ScoreCard
                  title="Experience"
                  score={candidate?.experience_years || 0}
                  maxScore={15}
                  color="success"
                />
              </Grid>
            </Grid>

            {/* Strengths and Weaknesses */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'success.main' }}>
                      <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Strengths
                    </Typography>
                    <List dense>
                      {analysis?.strengths?.map((strength, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={strength}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'warning.main' }}>
                      <PsychologyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Areas for Improvement
                    </Typography>
                    <List dense>
                      {analysis?.weaknesses?.map((weakness, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={weakness}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </motion.div>
        </Grid>

        {/* AI Summary and Recommendations */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  AI Summary & Recommendations
                </Typography>
                
                {analysis?.summary && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                      Summary
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {analysis.summary}
                    </Typography>
                  </Box>
                )}

                {analysis?.recommendations && analysis.recommendations.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                      Recommendations
                    </Typography>
                    <List dense>
                      {analysis.recommendations.map((recommendation, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={recommendation}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Auto-Matched Jobs */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  🤖 AI Auto-Matched Jobs
                </Typography>
                
                {matchesLoading ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <LinearProgress sx={{ mb: 2 }} />
                    <Typography>Loading auto-matches...</Typography>
                  </Box>
                ) : autoMatches?.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <WorkIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      No job matches found yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Auto-matching happens when resumes are uploaded
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {autoMatches?.map((match, index) => (
                      <ListItem
                        key={index}
                        divider
                        sx={{
                          cursor: 'pointer',
                          borderRadius: 1,
                          '&:hover': { bgcolor: 'action.hover' },
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          p: 2,
                        }}
                        onClick={() => navigate(`/jobs/${match.job_position_id}`)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                          <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                            <WorkIcon />
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {match.title}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Chip
                                label={`${match.match_score}% match`}
                                size="small"
                                color={match.match_score >= 80 ? 'success' : match.match_score >= 60 ? 'warning' : 'default'}
                              />
                              {match.ai_reasoning?.recommendation && (
                                <Chip
                                  label={match.ai_reasoning.recommendation}
                                  size="small"
                                  variant="outlined"
                                  sx={{ textTransform: 'capitalize' }}
                                />
                              )}
                            </Box>
                          </Box>
                        </Box>
                        
                        {match.ai_reasoning && (
                          <Box sx={{ width: '100%', mt: 1, pl: 7 }}>
                            {match.ai_reasoning.skillsMatched?.length > 0 && (
                              <Box sx={{ mb: 1 }}>
                                <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                                  Matched Skills: 
                                </Typography>
                                <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                                  {match.ai_reasoning.skillsMatched.join(', ')}
                                </Typography>
                              </Box>
                            )}
                            
                            {match.ai_reasoning.skillsMissing?.length > 0 && (
                              <Box sx={{ mb: 1 }}>
                                <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
                                  Skills to Develop: 
                                </Typography>
                                <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                                  {match.ai_reasoning.skillsMissing.join(', ')}
                                </Typography>
                              </Box>
                            )}
                            
                            {match.ai_reasoning.reasoning && (
                              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                {match.ai_reasoning.reasoning}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Resume Text (if available) */}
        {candidate?.resume_text && (
          <Grid item xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
            </motion.div>
          </Grid>
        )}
      </Grid>

      <MatchJobDialog
        open={matchDialogOpen}
        onClose={() => setMatchDialogOpen(false)}
        candidateId={id}
      />
    </Box>
  );
};

export default CandidateDetail;