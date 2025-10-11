import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Psychology as PsychologyIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Work as WorkIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const GenerateQuestionsDialog = ({ open, onClose, jobId, jobTitle, onQuestionsGenerated }) => {
  const [difficulty, setDifficulty] = useState('medium');
  const [candidateSkills, setCandidateSkills] = useState('');
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState(null);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await axios.post(`/api/jobs/${jobId}/generate-questions`, {
        difficulty,
        candidateSkills: candidateSkills.split(',').map(s => s.trim()).filter(Boolean),
      });
      setQuestions(response.data.questions);
      onQuestionsGenerated?.(response.data.questions); // pass up to parent
      toast.success('Interview questions generated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate questions');
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = () => {
    onClose();
    setQuestions(null);
    setCandidateSkills('');
    setDifficulty('medium');
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Generate Interview Questions for {jobTitle}</DialogTitle>
      <DialogContent>
        {!questions ? (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Difficulty Level</InputLabel>
                <Select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  label="Difficulty Level"
                >
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Candidate Skills (optional, comma-separated):
              </Typography>
              <input
                type="text"
                value={candidateSkills}
                onChange={(e) => setCandidateSkills(e.target.value)}
                placeholder="React, Node.js, Python, etc."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>Generated Questions:</Typography>
            {questions.technical && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Technical Questions
                </Typography>
                <List dense>
                  {questions.technical.map((q, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={q.question}
                        secondary={`Difficulty: ${q.difficulty}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {questions.behavioral && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Behavioral Questions
                </Typography>
                <List dense>
                  {questions.behavioral.map((q, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={q.question} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {questions.situational && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Situational Questions
                </Typography>
                <List dense>
                  {questions.situational.map((q, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={q.question} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {questions.cultural && (
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Cultural Fit Questions
                </Typography>
                <List dense>
                  {questions.cultural.map((q, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={q.question} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        {!questions && (
          <Button
            onClick={handleGenerate}
            variant="contained"
            disabled={generating}
          >
            {generating ? 'Generating...' : 'Generate Questions'}
          </Button>
        )}
        {questions && (
          <Button
            onClick={() => setQuestions(null)}
            variant="outlined"
          >
            Generate New Questions
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [questionsDialogOpen, setQuestionsDialogOpen] = useState(false);

  const { data: job, isLoading: jobLoading, error: jobError } = useQuery(
    ['job', id],
    () => axios.get(`/api/jobs/${id}`).then(res => res.data.job)
  );

  const { data: matches, isLoading: matchesLoading } = useQuery(
    ['job-matches', id],
    () => axios.get(`/api/jobs/${id}/matches`).then(res => res.data.matches),
    { enabled: !!id }
  );

  if (jobLoading) {
    return <LoadingSpinner message="Loading job details..." />;
  }

  if (jobError) {
    return (
      <Alert severity="error">
        Failed to load job: {jobError.response?.data?.error || jobError.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/jobs')}
          sx={{ mr: 2 }}
        >
          Back to Jobs
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, flexGrow: 1 }}>
          Job Details
        </Typography>
        <Button
          variant="contained"
          startIcon={<PsychologyIcon />}
          onClick={() => setQuestionsDialogOpen(true)}
          sx={{ mr: 1 }}
        >
          Generate Questions
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Job Information */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', mr: 2, width: 56, height: 56 }}>
                    <WorkIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {job?.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Created by {job?.created_by_name}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Job Description
                </Typography>
                <Typography variant="body1" paragraph>
                  {job?.description}
                </Typography>

                {job?.requirements && (
                  <>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3 }}>
                      Requirements
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {job.requirements}
                    </Typography>
                  </>
                )}

                {job?.skills_required && (
                  <>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3 }}>
                      Required Skills
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {job.skills_required.split(',').map((skill, index) => (
                        <Chip
                          key={index}
                          label={skill.trim()}
                          variant="outlined"
                          size="medium"
                        />
                      ))}
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Job Stats */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Job Information
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Experience Required
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {job?.experience_required ? `${job.experience_required}+ years` : 'Any level'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Posted Date
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {new Date(job?.created_at).toLocaleDateString()}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Matched Candidates
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {matches?.length || 0}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Matched Candidates */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Matched Candidates
                </Typography>

                {matchesLoading ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography>Loading matches...</Typography>
                  </Box>
                ) : matches?.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <PeopleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      No candidates matched to this job yet
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {matches?.map((match, index) => (
                      <ListItem
                        key={index}
                        divider
                        sx={{
                          cursor: 'pointer',
                          borderRadius: 1,
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                        onClick={() => navigate(`/candidates/${match.candidate_id}`)}
                      >
                        <Avatar sx={{ mr: 2 }}>
                          <PersonIcon />
                        </Avatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {match.name}
                              </Typography>
                              <Chip
                                label={`${match.match_score}% match`}
                                size="small"
                                color={match.match_score >= 80 ? 'success' : match.match_score >= 60 ? 'warning' : 'default'}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {match.email} • {match.experience_years} years experience
                              </Typography>
                              {match.ai_reasoning?.recommendation && (
                                <Typography variant="caption" color="text.secondary">
                                  AI Recommendation: {match.ai_reasoning.recommendation}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      <GenerateQuestionsDialog
        open={questionsDialogOpen}
        onClose={() => setQuestionsDialogOpen(false)}
        jobId={id}
        jobTitle={job?.title}
      />
    </Box>
  );
};

export default JobDetail;
