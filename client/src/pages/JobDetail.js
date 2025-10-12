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
  CircularProgress,
  LinearProgress,
} from '@mui/material';

import {
  ArrowBack as ArrowBackIcon,
  Psychology as PsychologyIcon,
  People as PeopleIcon,
  Work as WorkIcon,
  Person as PersonIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import {Calendar as CalendarIcon} from '@mui/icons-material'

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
      onQuestionsGenerated?.(response.data.questions);
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

const AnalysisDialog = ({ open, onClose, candidate, analysis, loading, job }) => {
  const navigate = useNavigate();

  // Validate analysis structure
  const isValidAnalysis = analysis && 
    analysis.sectionAnalysis && 
    analysis.overallScore !== undefined;

  const renderSectionAnalysis = (section, title, color) => {
    if (!section) return null;

    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color }}>
          {title}
        </Typography>
        
        {/* Section Score */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Score</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{section.score}/100</Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={section.score} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: 'rgba(0,0,0,0.1)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: section.score >= 70 ? 'success.main' : section.score >= 50 ? 'warning.main' : 'error.main'
              }
            }}
          />
        </Box>

        {/* Feedback */}
        {section.feedback && (
          <Typography variant="body2" paragraph sx={{ mb: 2 }}>
            {section.feedback}
          </Typography>
        )}

        {/* Strengths */}
        {section.strengths && section.strengths.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'success.main' }}>
              Strengths
            </Typography>
            <List dense>
              {section.strengths.map((strength, idx) => (
                <ListItem key={idx} sx={{ py: 0.5 }}>
                  <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main', mr: 1 }} />
                  <ListItemText 
                    primary={strength}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Weaknesses */}
        {section.weaknesses && section.weaknesses.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'warning.main' }}>
              Areas for Improvement
            </Typography>
            <List dense>
              {section.weaknesses.map((weakness, idx) => (
                <ListItem key={idx} sx={{ py: 0.5 }}>
                  <WarningIcon sx={{ fontSize: 16, color: 'warning.main', mr: 1 }} />
                  <ListItemText 
                    primary={weakness}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Individual Responses */}
        {section.responses && section.responses.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Detailed Response Analysis
            </Typography>
            {section.responses.map((resp, idx) => (
              <Card key={idx} variant="outlined" sx={{ mb: 2, p: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Q: {resp.question}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontStyle: 'italic' }}>
                  A: {resp.answer}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Score: {resp.score}/10
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={resp.score * 10} 
                    sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {resp.feedback}
                </Typography>
              </Card>
            ))}
          </Box>
        )}

        <Divider sx={{ mt: 3 }} />
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PsychologyIcon color="secondary" />
          <Typography variant="h6">
            AI Assessment Analysis - {candidate?.name}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ maxHeight: '70vh' }}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress size={48} />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Generating AI analysis...
            </Typography>
          </Box>
        ) : !isValidAnalysis ? (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              No valid analysis available for this assessment.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {analysis ? 'The analysis data structure is invalid. Please regenerate the analysis.' : 'Click "Create Analysis" to generate a new assessment report.'}
            </Typography>
          </Alert>
        ) : analysis ? (
          <Box sx={{ mt: 2 }}>
            {/* Overall Score */}
            {analysis.overallScore !== undefined && (
              <Box sx={{ mb: 4, p: 3, bgcolor: 'primary.light', borderRadius: 2 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  Overall Score: {analysis.overallScore}/100
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={analysis.overallScore} 
                  sx={{ 
                    height: 12, 
                    borderRadius: 6,
                    mb: 2,
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'white'
                    }
                  }}
                />
                {analysis.overallFeedback && (
                  <Typography variant="body1">
                    {analysis.overallFeedback}
                  </Typography>
                )}
              </Box>
            )}

            {/* Section Analysis */}
            {analysis.sectionAnalysis && (
              <>
                {renderSectionAnalysis(analysis.sectionAnalysis.technical, '💻 Technical Assessment', 'info.main')}
                {renderSectionAnalysis(analysis.sectionAnalysis.behavioral, '🤝 Behavioral Assessment', 'secondary.main')}
                {renderSectionAnalysis(analysis.sectionAnalysis.situational, '🎯 Situational Assessment', 'warning.main')}
                {renderSectionAnalysis(analysis.sectionAnalysis.cultural, '🏢 Cultural Fit Assessment', 'success.main')}
              </>
            )}

            {/* Recommendation */}
            {analysis.recommendation && (
              <Box sx={{ 
                mt: 3, 
                p: 3, 
                bgcolor: analysis.recommendation === 'Schedule an Interview' ? 'success.light' : 
                         analysis.recommendation === 'CONSIDER' ? 'warning.light' : 'error.light',
                borderRadius: 2 
              }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Final Recommendation: {analysis.recommendation}
                </Typography>
                {analysis.recommendationReason && (
                  <Typography variant="body1">
                    {analysis.recommendationReason}
                  </Typography>
                )}
              </Box>
            )}

            {/* Key Takeaways */}
            {analysis.keyTakeaways && analysis.keyTakeaways.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Key Takeaways
                </Typography>
                <List>
                  {analysis.keyTakeaways.map((takeaway, idx) => (
                    <ListItem key={idx}>
                      <ListItemText 
                        primary={`${idx + 1}. ${takeaway}`}
                        primaryTypographyProps={{ variant: 'body1' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        ) : (
          <Alert severity="info">No analysis available</Alert>
        )}
      </DialogContent>
      <DialogActions>
  <Button onClick={onClose}>Close</Button>
  {analysis && (
    <>
      <Button
        onClick={() => {
          navigate(`/candidates/${candidate?.candidate_id}`);
        }}
        variant="outlined"
      >
        View Candidate Profile
      </Button>
      {analysis.recommendation === 'Schedule an Interview' && (
        <Button
          onClick={() => {
            onClose();
            navigate(`/interviews/schedule`, {
              state: {
                candidateId: candidate?.candidate_id,
                candidateName: candidate?.name,
                jobId: job?.id,
                jobTitle: job?.title,
                jobDescription: job?.description,
              }
            });
          }}
          variant="contained"
          color="success"
        >
          Schedule Interview
        </Button>
      )}
    </>
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
      await axios.post(`/api/candidates/${candidate.candidate_id}/send-assessment`, {
        jobId: job.id || job.job_id || job._id,
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
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [sendingAutoGenerate, setSendingAutoGenerate] = useState(false);
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [generatedAnalysis, setGeneratedAnalysis] = useState(null);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(null);
  const [candidateAnalyses, setCandidateAnalyses] = useState({}); // Store analyses by candidate ID

  const { data: job, isLoading: jobLoading, error: jobError } = useQuery(
    ['job', id],
    () => axios.get(`/api/jobs/${id}`).then(res => res.data.job)
  );

  const { data: matches, isLoading: matchesLoading, refetch: refetchMatches } = useQuery(
    ['job-matches', id],
    () => axios.get(`/api/jobs/${id}/matches`).then(res => res.data.matches),
    { 
      enabled: !!id,
      refetchInterval: 30000,
      refetchIntervalInBackground: false,
      onSuccess: async (matchesData) => {
        // Load existing analyses from database for completed assessments
        if (matchesData && matchesData.length > 0) {
          const analyses = {};
          for (const match of matchesData) {
            if (match.assessment_status === 'completed') {
              try {
                const response = await axios.get(`/api/candidates/${match.candidate_id}/analysis/${id}`);
                if (response.data.success && response.data.analysis) {
                  // Validate the analysis structure before storing
                  const analysis = response.data.analysis;
                  if (analysis.sectionAnalysis && analysis.overallScore !== undefined) {
                    analyses[match.candidate_id] = analysis;
                  } else {
                    console.log('Invalid analysis structure for candidate:', match.candidate_id);
                  }
                }
              } catch (err) {
                // Analysis doesn't exist yet or is invalid, skip
                if (err.response?.status !== 404) {
                  console.error('Error loading analysis:', err);
                }
              }
            }
          }
          if (Object.keys(analyses).length > 0) {
            setCandidateAnalyses(analyses);
          }
        }
      }
    }
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
    if (lastGeneratedQuestions) {
      setSelectedCandidate(candidate);
      setSendDialogOpen(true);
      return;
    }

    setSendingAutoGenerate(true);
    try {
      const resp = await axios.post(`/api/jobs/${id}/generate-questions`, {
        difficulty: 'easy',
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

  // Replace your handleGenerateOrViewAnalysis function with this fixed version

const handleGenerateOrViewAnalysis = async (candidate) => {
  setSelectedCandidate(candidate);
  setAnalysisDialogOpen(true);
  
  // Always try to generate/fetch analysis
  setGeneratingAnalysis(candidate.candidate_id);
  setGeneratedAnalysis(null);
  
  try {
    // Call the generate-analysis endpoint (it will return cached if exists)
    const response = await axios.post(
      `/api/candidates/${candidate.candidate_id}/generate-analysis`, 
      { jobId: id }
    );
    
    const analysis = response.data.analysis;
    setGeneratedAnalysis(analysis);
    
    // Store analysis in state
    setCandidateAnalyses(prev => ({
      ...prev,
      [candidate.candidate_id]: analysis
    }));
    
    if (response.data.cached) {
      toast.success('Analysis loaded successfully!');
    } else {
      toast.success('Analysis generated and saved successfully!');
    }
  } catch (err) {
    console.error('Analysis error:', err);
    const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to generate analysis';
    toast.error(errorMsg);
    setAnalysisDialogOpen(false);
  } finally {
    setGeneratingAnalysis(null);
  }
};

  const hasAnalysis = (candidateId) => {
    return !!candidateAnalyses[candidateId];
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
        {/* <Button
          variant="contained"
          startIcon={<PsychologyIcon />}
          onClick={() => setQuestionsDialogOpen(true)}
          sx={{ mr: 1 }}
        >
          Generate Questions
        </Button> */}
      </Box>

      <Grid container spacing={3}>
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

        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Matched Candidates
                  </Typography>
                  <Tooltip title="Refresh to check for assessment status updates" arrow>
                    <IconButton 
                      onClick={() => {
                        refetchMatches();
                        toast.success('Refreshing candidate list...');
                      }} 
                      size="small"
                      color="primary"
                      sx={{ 
                        '&:hover': { 
                          transform: 'rotate(180deg)',
                          transition: 'transform 0.3s ease'
                        }
                      }}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                </Box>

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
                        onClick={(e) => {
                          if ((e.target.closest && e.target.closest('button')) || e.target.tagName === 'BUTTON') return;
                          navigate(`/candidates/${match.candidate_id}`);
                        }}
                        secondaryAction={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            {match.assessment_status && (
                              <Tooltip 
                                title={`Assessment Status: ${match.assessment_status === 'completed' ? 'Completed' : 'Pending'}`}
                                arrow
                                placement="top"
                              >
                                <Chip
                                  label={match.assessment_status.charAt(0).toUpperCase() + match.assessment_status.slice(1).toLowerCase()}
                                  size="small"
                                  color={match.assessment_status === 'completed' ? 'success' : 'warning'}
                                  sx={{ minWidth: 90, fontWeight: 600 }}
                                />
                              </Tooltip>
                            )}
                            
                            {match.assessment_status === 'completed' ? (
                              <Tooltip 
                                title={hasAnalysis(match.candidate_id) ? 'View Analysis' : 'Generate AI Analysis'}
                                arrow
                                placement="top"
                              >
                                <span>
                                  <Button
                                    size="small"
                                    variant={hasAnalysis(match.candidate_id) ? 'outlined' : 'contained'}
                                    color="secondary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleGenerateOrViewAnalysis(match);
                                    }}
                                    disabled={generatingAnalysis === match.candidate_id}
                                    startIcon={hasAnalysis(match.candidate_id) ? <VisibilityIcon sx={{ fontSize: 16 }} /> : <PsychologyIcon sx={{ fontSize: 16 }} />}
                                    sx={{ 
                                      minWidth: 130,
                                      textTransform: 'none',
                                      fontWeight: 600
                                    }}
                                  >
                                  {generatingAnalysis === match.candidate_id ? 'Analyzing...' : hasAnalysis(match.candidate_id) ? 'View Analysis' : 'Create Analysis'}
                                  </Button>
                                </span>
                              </Tooltip>
                            ) : (
                              <Tooltip 
                                title={match.assessment_status ? 'Resend Assessment Link' : 'Send Assessment Link'}
                                arrow
                                placement="top"
                              >
                                <span>
                                  <Button
                                    size="small"
                                    variant={match.assessment_status ? 'outlined' : 'contained'}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openSendDialogFor(match);
                                    }}
                                    disabled={sendingAutoGenerate}
                                    startIcon={<SendIcon sx={{ fontSize: 16 }} />}
                                    sx={{ 
                                      minWidth: 100,
                                      textTransform: 'none',
                                      fontWeight: 600
                                    }}
                                  >
                                    {match.assessment_status ? 'Resend' : 'Send'}
                                  </Button>
                                </span>
                              </Tooltip>
                            )}
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
          refetchMatches();
        }}
      />

      <AnalysisDialog
        open={analysisDialogOpen}
        onClose={() => {
          setAnalysisDialogOpen(false);
          setSelectedCandidate(null);
          setGeneratedAnalysis(null);
        }}
        candidate={selectedCandidate}
        analysis={generatedAnalysis}
        loading={generatingAnalysis !== null}
        job={job}
      />
    </Box>
  );
};

export default JobDetail;