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
  Work as WorkIcon,
  Person as PersonIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
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
            onClick={() => {
              onQuestionsGenerated?.(questions);
              setQuestions(null);
            }}
            variant="outlined"
          >
            Save & Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

const SendAssessmentDialog = ({ open, onClose, candidate, job, questions, onSent }) => {
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      // Send to your server: candidate endpoint should send the email containing the assessment link & questions
      await axios.post(`/api/candidates/${candidate.candidate_id}/send-assessment`, {
        jobId: job.id || job.job_id || job._id || job.id,
        questions,
      });
      toast.success(`Assessment sent to ${candidate.name}`);
      onSent?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send assessment');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Send Assessment to {candidate?.name}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This will send an email containing the assessment link and the following questions.
        </Typography>

        {!questions ? (
          <Typography variant="body2">No questions available.</Typography>
        ) : (
          <Box>
            {/* Show a concise preview of the questions */}
            {questions.technical && (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1 }}>
                  Technical
                </Typography>
                <List dense>
                  {questions.technical.slice(0, 5).map((q, i) => (
                    <ListItem key={`t-${i}`} dense>
                      <ListItemText primary={q.question} secondary={q.difficulty ? `Difficulty: ${q.difficulty}` : ''} />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
            {questions.behavioral && (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1 }}>
                  Behavioral
                </Typography>
                <List dense>
                  {questions.behavioral.slice(0, 5).map((q, i) => (
                    <ListItem key={`b-${i}`} dense>
                      <ListItemText primary={q.question} />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
            {questions.situational && (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1 }}>
                  Situational
                </Typography>
                <List dense>
                  {questions.situational.slice(0, 5).map((q, i) => (
                    <ListItem key={`s-${i}`} dense>
                      <ListItemText primary={q.question} />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
            {questions.cultural && (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1 }}>
                  Cultural
                </Typography>
                <List dense>
                  {questions.cultural.slice(0, 5).map((q, i) => (
                    <ListItem key={`c-${i}`} dense>
                      <ListItemText primary={q.question} />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={sending}>Cancel</Button>
        <Button
          onClick={handleSend}
          variant="contained"
          startIcon={<SendIcon />}
          disabled={sending || !questions}
        >
          {sending ? 'Sending...' : 'Send Assessment Link'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [questionsDialogOpen, setQuestionsDialogOpen] = useState(false);
  const [lastGeneratedQuestions, setLastGeneratedQuestions] = useState(null);

  // For sending confirmation
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [sendingAutoGenerate, setSendingAutoGenerate] = useState(false);

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

  const openSendDialogFor = async (candidate) => {
    // If we already have generated questions, open preview dialog
    if (lastGeneratedQuestions) {
      setSelectedCandidate(candidate);
      setSendDialogOpen(true);
      return;
    }

    // Otherwise auto-generate a set (medium, no skills) then open preview
    setSendingAutoGenerate(true);
    try {
      const resp = await axios.post(`/api/jobs/${id}/generate-questions`, {
        difficulty: 'medium',
        candidateSkills: [],
      });
      const generated = resp.data.questions;
      setLastGeneratedQuestions(generated);
      setSelectedCandidate(candidate);
      setSendDialogOpen(true);
      toast.success('Questions auto-generated for sending.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate questions');
    } finally {
      setSendingAutoGenerate(false);
    }
  };

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
                        // navigate when clicking on the body; use button area for send
                        onClick={(e) => {
                          // avoid navigating when Send button is clicked
                          if ((e.target.closest && e.target.closest('button')) || e.target.tagName === 'BUTTON') return;
                          navigate(`/candidates/${match.candidate_id}`);
                        }}
                        secondaryAction={
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Send Assessment Link">
                              <span>
                                <IconButton
                                  edge="end"
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openSendDialogFor(match);
                                  }}
                                  disabled={sendingAutoGenerate}
                                >
                                  <SendIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        }
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
        onQuestionsGenerated={(questions) => {
          setLastGeneratedQuestions(questions);
        }}
      />

      <SendAssessmentDialog
        open={sendDialogOpen}
        onClose={() => {
          setSendDialogOpen(false);
          setSelectedCandidate(null);
        }}
        candidate={selectedCandidate}
        job={job}
        questions={lastGeneratedQuestions}
        onSent={() => {
          // optional: track sent state per candidate or refresh matches
        }}
      />
    </Box>
  );
};

export default JobDetail;
