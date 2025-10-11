import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, IconButton, Typography } from '@mui/material';
import { Mic, Stop, PlayArrow } from '@mui/icons-material';
import { useParams } from 'react-router-dom';

import axios from 'axios';

const questions = [
  'How confident are you in your coding skills?',
  'How often do you work on new technologies?',
  'How good are your problem-solving skills?',
  'How comfortable are you with public speaking?',
  'How well do you manage time under pressure?'
];

const Assess = () => {
  const { userId } = useParams();
  console.log('userId: ', userId)
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState(Array(questions.length).fill(50));
  const [audioURLs, setAudioURLs] = useState(Array(questions.length).fill(null));
  const [transcripts, setTranscripts] = useState(Array(questions.length).fill(''));
  const [recording, setRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);

  const maxTime = 20; // seconds
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

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
        const updated = [...audioURLs];
        updated[current] = audioUrl;
        setAudioURLs(updated);

        // stop timer and reset
        setTimeLeft(maxTime);
        clearInterval(timerRef.current);
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
              setTranscripts((prev) => {
                const updated = [...prev];
                updated[current] = finalTranscript.trim();
                return updated;
              });
            } else {
              interim += transcript;
              setTranscripts((prev) => {
                const updated = [...prev];
                updated[current] = finalTranscript + interim;
                return updated;
              });
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
            stopRecording(); // auto-stop after time limit
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

  // ⏹️ Stop recording + stop recognition
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
    if (audioURLs[current]) {
      const audio = new Audio(audioURLs[current]);
      audio.play();
    }
  };

  // ⏭️ Navigation
  const handleNext = () => current < questions.length - 1 && setCurrent(current + 1);
  const handlePrev = () => current > 0 && setCurrent(current - 1);

  // 💾 Submit assessment
  const handleSubmit = async () => {
    const formData = new FormData();
    // for (let i = 0; i < audioURLs.length; i++) {
    //   if (audioURLs[i]) {
    //     const response = await fetch(audioURLs[i]);
    //     const blob = await response.blob();
    //     formData.append('audioFiles', blob, `question${i + 1}.webm`);
    //   }
    // }

    const data = {
      userId: 'user125',
      questions,
      answers,
      transcripts
    };
    formData.append('data', JSON.stringify(data));

    console.log('Submitting data:', data);
    // console.log('form data: ', formData)
    // for (let pair of formData.entries()) {
    //     console.log(pair[0], pair[1]);
    //     }

    // Uncomment this when backend is ready:
    // const response = await fetch('/api/submit/submit-assessment', {
    //   method: 'POST',
    //   body: formData,
    // });
    const response = await axios.post('/api/submit/submit-assessment', data)
    // const result = await response.json();
    console.log('result: ',response)
    // if (result.success) alert('Assessment saved successfully!');
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}
    >
      <Card sx={{ width: 500, p: 3, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ x: 200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -200, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2>Question {current + 1}</h2>
            <p>{questions[current]}</p>

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
              {audioURLs[current] && !recording && (
                <IconButton color="success" onClick={playAudio} sx={{ mt: 1 }}>
                  <PlayArrow />
                </IconButton>
              )}

              {/* Transcript */}
              {transcripts[current] && (
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
                  <strong>Transcript:</strong> {transcripts[current]}
                </Typography>
              )}
            </div>

            {/* Navigation */}
            <div style={{ marginTop: '30px' }}>
              <Button
                onClick={handlePrev}
                variant="outlined"
                disabled={current === 0}
                sx={{ mr: 2 }}
              >
                Previous
              </Button>

              {current < questions.length - 1 ? (
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button variant="contained" color="success" onClick={handleSubmit}>
                  Submit
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
