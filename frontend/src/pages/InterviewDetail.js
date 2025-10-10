import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  CheckCircle as CheckIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Psychology as PsychologyIcon,
  QuestionAnswer as QuestionIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const AnswerDialog = ({ open, onClose, question, onSubmit }) => {
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!answer.trim()) {
      toast.error('Please provide an answer');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(answer);
      setAnswer('');
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Answer Question</DialogTitle>
      <DialogContent>
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Question:
        </Typography>
        <Typography variant="body1" paragraph sx={{ fontStyle: 'italic' }}>
          {question}
        </Typography>
        
        <TextField
          fullWidth
          multiline
          rows={6}
          label="Your Answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Provide a detailed answer to the question..."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || !answer.trim()}
        >
          {submitting ? 'Submitting...' : 'Submit Answer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const CompleteInterviewDialog = ({ open, onClose, onComplete }) => {
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState('');
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await onComplete(feedback, parseInt(score) || 0);
      setFeedback('');
      setScore('');
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setCompleting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Complete Interview</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          type="number"
          label="Final Score (0-100)"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          sx={{ mb: 2, mt: 2 }}
          inputProps={{ min: 0, max: 100 }}
        />
        
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Overall Feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Provide overall feedback about the candidate's performance..."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleComplete}
          variant="contained"
          disabled={completing}
        >
          {completing ? 'Completing...' : 'Complete Interview'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const InterviewDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [answerDialogOpen, setAnswerDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');

  const { data: interview, isLoading, error } = useQuery(
    ['interview', id],
    () => axios.get(`/api/interviews/${id}`).then(res => res.data.interview)
  );

  const startInterviewMutation = useMutation(
    () => axios.post(`/api/interviews/${id}/start`),
    {
      onSuccess: () => {
        toast.success('Interview started!');
        queryClient.invalidateQueries(['interview', id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to start interview');
      },
    }
  );

  const submitAnswerMutation = useMutation(
    (answerData) => axios.post(`/api/interviews/${id}/answer`, answerData),
    {
      onSuccess: () => {
        toast.success('Answer submitted and analyzed!');
        queryClient.invalidateQueries(['interview', id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to submit answer');
      },
    }
  );

  const completeInterviewMutation = useMutation(
    (data) => axios.post(`/api/interviews/${id}/complete`, data),
    {
      onSuccess: () => {
        toast.success('Interview completed!');
        queryClient.invalidateQueries(['interview', id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to complete interview');
      },
    }
  );

  const handleAnswerQuestion = (question) => {
    setCurrentQuestion(question);
    setAnswerDialogOpen(true);
  };

  const handleSubmitAnswer = async (answer) => {
    const answerData = {
      questionId: `q_${Date.now()}`,
      question: currentQuestion,
      answer: answer,
    };
    
    await submitAnswerMutation.mutateAsync(answerData);
  };

  const handleCompleteInterview = async (feedback, score) => {
    const data = {
      overallFeedback: feedback,
      finalScore: score,
    };
    
    await completeInterviewMutation.mutateAsync(data);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading interview details..." />;
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load interview: {error.response?.data?.error || error.message}
      </Alert>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'in_progress': return 'warning';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/interviews')}
          sx={{ mr: 2 }}
        >
          Back to Interviews
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, flexGrow: 1 }}>
          Interview Details
        </Typography>
        
        {interview?.status === 'scheduled' && (
          <Button
            variant="contained"
            startIcon={<PlayIcon />}
            onClick={() => startInterviewMutation.mutate()}
            disabled={startInterviewMutation.isLoading}
          >
            Start Interview
          </Button>
        )}
        
        {interview?.status === 'in_progress' && (
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckIcon />}
            onClick={() => setCompleteDialogOpen(true)}
          >
            Complete Interview
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Interview Information */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Interview Information
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {interview?.candidate_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Candidate
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                    <WorkIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {interview?.job_title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Position
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={interview?.status?.replace('_', ' ')}
                    color={getStatusColor(interview?.status)}
                    sx={{ textTransform: 'capitalize', mt: 0.5 }}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Scheduled At
                  </Typography>
                  <Typography variant="body1">
                    {new Date(interview?.scheduled_at).toLocaleString()}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Interviewer
                  </Typography>
                  <Typography variant="body1">
                    {interview?.interviewer_name}
                  </Typography>
                </Box>

                {interview?.score && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Final Score
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mr: 1 }}>
                        {interview.score}/100
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={interview.score}
                        sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                        color={interview.score >= 80 ? 'success' : interview.score >= 60 ? 'warning' : 'error'}
                      />
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Questions and Answers */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Interview Questions
                </Typography>

                {interview?.questions && interview.questions.length > 0 ? (
                  <List>
                    {interview.questions.map((q, index) => (
                      <ListItem
                        key={index}
                        sx={{
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 1,
                        }}
                      >
                        <ListItemText
                          primary={q.question || q}
                          secondary={q.category ? `Category: ${q.category}` : ''}
                        />
                        {interview.status === 'in_progress' && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<QuestionIcon />}
                            onClick={() => handleAnswerQuestion(q.question || q)}
                            sx={{ mt: 1 }}
                          >
                            Answer Question
                          </Button>
                        )}
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No questions available for this interview.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Answers and Analysis */}
        {interview?.answers && interview.answers.length > 0 && (
          <Grid item xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Answers & AI Analysis
                  </Typography>

                  {interview.answers.map((item, index) => (
                    <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Q: {item.question}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        A: {item.answer}
                      </Typography>
                      
                      {item.analysis && (
                        <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            AI Analysis (Score: {item.analysis.score}/10)
                          </Typography>
                          
                          {item.analysis.strengths && item.analysis.strengths.length > 0 && (
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                                Strengths:
                              </Typography>
                              <Typography variant="body2">
                                {item.analysis.strengths.join(', ')}
                              </Typography>
                            </Box>
                          )}
                          
                          {item.analysis.improvements && item.analysis.improvements.length > 0 && (
                            <Box>
                              <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
                                Areas for Improvement:
                              </Typography>
                              <Typography variant="body2">
                                {item.analysis.improvements.join(', ')}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        )}

        {/* Final Analysis */}
        {interview?.ai_analysis && (
          <Grid item xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Final AI Analysis
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Overall Performance
                      </Typography>
                      <Typography variant="body2" paragraph>
                        Average Score: {interview.ai_analysis.averageScore}/100
                      </Typography>
                      <Typography variant="body2" paragraph>
                        Total Questions: {interview.ai_analysis.totalQuestions}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Feedback
                      </Typography>
                      <Typography variant="body2">
                        {interview.ai_analysis.overallFeedback}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        )}
      </Grid>

      <AnswerDialog
        open={answerDialogOpen}
        onClose={() => setAnswerDialogOpen(false)}
        question={currentQuestion}
        onSubmit={handleSubmitAnswer}
      />

      <CompleteInterviewDialog
        open={completeDialogOpen}
        onClose={() => setCompleteDialogOpen(false)}
        onComplete={handleCompleteInterview}
      />
    </Box>
  );
};

export default InterviewDetail;