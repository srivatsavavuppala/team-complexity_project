import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, IconButton, Typography, CircularProgress } from '@mui/material';
import { Mic, Stop, PlayArrow } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const Assess = () => {
  const { userId } = useParams();

  const [sections, setSections] = useState([]);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [audioURLs, setAudioURLs] = useState({});
  const [transcripts, setTranscripts] = useState({});
  const [timeLeft, setTimeLeft] = useState(10);
  const [loading, setLoading] = useState(false);
  const maxTime = 20;

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  const [questions, setQuestions] = useState({
    technical: [],
    behavioral: [],
    situational: [],
    cultural: []
  });

  const completionPage = `
            <div style="
              display:flex;flex-direction:column;align-items:center;justify-content:center;
              height:100vh;text-align:center;background:linear-gradient(135deg,#e0f7fa,#fce4ec);
            ">
              <div style="background:white;padding:2rem 3rem;border-radius:20px;box-shadow:0 4px 15px rgba(0,0,0,0.1);max-width:400px;">
                <h2>Assessment Completed 🎉</h2>
                <p>Thank you for completing your assessment! You can close this page now.</p>
                <button style="
                  margin-top:1rem;padding:0.6rem 1.2rem;background-color:#7FFFD4;
                  color:black;border:none;border-radius:8px;cursor:pointer;font-weight:500;
                ">The result will be shared on your registered email soon.</button>
              </div>
            </div>
          `

  // 🔹 Fetch assessment questions
  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const response = await axios.post('/api/submit/get-ai-assessment', { userId });
        const status = response.data.status
        if(status === 'complete'){
          // alert('You have already completed the assessment. Thank you!');
          document.body.innerHTML = completionPage;
          return;
        }
        let incomingData = JSON.parse(JSON.parse(response.data.questions));
        let data = {};

        for (const category in incomingData) {
          if(category === 'meta') continue;
          data[category] = incomingData[category].map(item => ({
            question: item.question,
            category: item.category
          }));
        }
        setQuestions(data);
        setAudioURLs(Array(Object.values(data).flat().length).fill(null));
        // setTranscripts(Array(Object.values(data).flat().length).fill(''));
        const formattedSections = Object.entries(data).map(([category, questions]) => ({
          category,
          questions
        }));
        setSections(formattedSections);
      } catch (error) {
        console.error('Error fetching assessment:', error);
      }
    };
    fetchAssessment();
  }, [userId]);

  // Helpers for accessing current question
  const currentSection = sections[sectionIndex];
  const currentQuestion = currentSection?.questions[questionIndex];

  // 🎙️ Start recording + live transcription
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const key = `${sectionIndex}-${questionIndex}`;
        setAudioURLs((prev) => ({ ...prev, [key]: audioUrl }));
        clearInterval(timerRef.current);
        setTimeLeft(maxTime);
      };

      // 🧠 Start speech recognition
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognitionRef.current = recognition;

        let finalTranscript = '';

        recognition.onresult = (event) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
              setTranscripts((prev) => ({
                ...prev,
                [`${sectionIndex}-${questionIndex}`]: finalTranscript.trim()
              }));
            } else {
              interim += transcript;
              setTranscripts((prev) => ({
                ...prev,
                [`${sectionIndex}-${questionIndex}`]: finalTranscript + interim
              }));
            }
          }
        };

        recognition.onerror = (err) => console.error('SpeechRecognition error:', err);
        recognition.start();
      }

      // Start audio recording
      mediaRecorderRef.current.start();
      setRecording(true);
      setTimeLeft(maxTime);

      // Timer countdown
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopRecording(); // auto-stop
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      alert('Microphone permission denied or error starting recording.');
      console.error(err);
    }
  };

  // ⏹️ Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    clearInterval(timerRef.current);
    setRecording(false);
    setTimeLeft(maxTime);
  };

  // 🔊 Play recorded audio
  const playAudio = () => {
    const key = `${sectionIndex}-${questionIndex}`;
    if (audioURLs[key]) {
      new Audio(audioURLs[key]).play();
    }
  };

  // Navigation
  const handleNext = () => {
    if (!currentSection) return;
    if (questionIndex < currentSection.questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
    } else if (sectionIndex < sections.length - 1) {
      setSectionIndex(sectionIndex + 1);
      setQuestionIndex(0);
    }
  };

  const handlePrev = () => {
    if (questionIndex > 0) {
      setQuestionIndex(questionIndex - 1);
    } else if (sectionIndex > 0) {
      const prevSection = sections[sectionIndex - 1];
      setSectionIndex(sectionIndex - 1);
      setQuestionIndex(prevSection.questions.length - 1);
    }
  };

const handleSubmit = async () => {
  setLoading(true);

  const formattedAnswers = {};

  Object.keys(questions).forEach((section, sectionIndex) => {
    formattedAnswers[section] = [];

    questions[section].forEach((q, questionIndex) => {
      const transcriptKey = `${sectionIndex}-${questionIndex}`;
      const answer = transcripts[transcriptKey] || "No answer recorded.";
      
      formattedAnswers[section].push(answer);
    });
  });

  console.log(formattedAnswers);

  const data = {
    userId: userId,
    formattedAnswers, 
  };

  console.log('Submitting formatted data:\n', JSON.stringify(formattedAnswers));

  try {
    const response = await axios.post('/api/submit/submit-assessment', data);
    setLoading(false);

    document.body.innerHTML = completionPage;
    // alert('Assessment saved successfully!');
  } catch (error) {
    console.error('Error submitting assessment:', error);
  }
};


  useEffect(() => () => clearInterval(timerRef.current), []);

  if (!currentQuestion) return <div>Loading questions...</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        height: '70vh',
        width: '90vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '40px',
        background: 'linear-gradient(135deg, #f0f4f8, #e8f5e9)',
        padding: '2rem'
      }}
    >
      <Card sx={{ width: { xs: '90%', sm: 500 }, p: 3, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${sectionIndex}-${questionIndex}`}
            initial={{ x: 200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -200, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2>{currentSection.category.toUpperCase()} — Question {questionIndex + 1}</h2>
            <p>{currentQuestion.question}</p>

            {/* 🎙️ Audio Controls */}
            <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                {recording && (
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '-10px',
                      right: '-10px',
                      bottom: '-10px',
                      borderRadius: '50%',
                      background: 'rgba(255, 0, 0, 0.3)',
                      zIndex: 0
                    }}
                  />
                )}

                <IconButton
                  onClick={recording ? stopRecording : startRecording}
                  color={recording ? 'error' : 'primary'}
                  sx={{ zIndex: 1 }}
                >
                  {recording ? <Stop fontSize="large" /> : <Mic fontSize="large" />}
                </IconButton>
              </div>

              {/* Timer */}
              {recording && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  Recording... {timeLeft}s
                </Typography>
              )}

              {/* Play Button */}
              {audioURLs[`${sectionIndex}-${questionIndex}`] && !recording && (
                <IconButton color="success" onClick={playAudio} sx={{ mt: 1 }}>
                  <PlayArrow />
                </IconButton>
              )}

              {/* Transcript */}
              {transcripts[`${sectionIndex}-${questionIndex}`] && (
                <Typography
                  variant="body2"
                  sx={{
                    mt: 2,
                    p: 1,
                    backgroundColor: '#f5f5f5',
                    borderRadius: 1,
                    maxHeight: 100,
                    overflowY: 'auto'
                  }}
                >
                  <strong>Transcript:</strong> {transcripts[`${sectionIndex}-${questionIndex}`]}
                </Typography>
              )}
            </div>

            {/* Navigation */}
            <div style={{ marginTop: '30px' }}>
              <Button
                onClick={handlePrev}
                variant="outlined"
                disabled={sectionIndex === 0 && questionIndex === 0}
                sx={{ mr: 2 }}
              >
                Previous
              </Button>

              {sectionIndex === sections.length - 1 &&
              questionIndex === currentSection.questions.length - 1 ? (
                <Button variant="contained" color="success" onClick={handleSubmit}>
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Submit'
                  )}
                </Button>
              ) : (
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

export default Assess;
