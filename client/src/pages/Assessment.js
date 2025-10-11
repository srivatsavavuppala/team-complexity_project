import { useState, useEffect, useRef } from 'react';

const InterviewAssessment = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [responses, setResponses] = useState([]);
  const [mediaStream, setMediaStream] = useState(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [mediaError, setMediaError] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const videoRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const MAX_RECORDING_TIME = 60;

  const interviewQuestions = [
    {
      id: 1,
      type: 'Technical',
      question: 'Explain how you would set up a CI/CD pipeline for deploying a FastAPI application to a cloud platform like AWS or GCP.',
      difficulty: 'medium'
    },
    {
      id: 2,
      type: 'Behavioral',
      question: 'Tell me about a time you had to learn a new cloud technology quickly to meet a project deadline.',
      difficulty: 'medium'
    },
    {
      id: 3,
      type: 'Situational',
      question: 'You notice that the response time of your FastAPI service spikes during peak traffic. What steps would you take to diagnose and mitigate the issue?',
      difficulty: 'hard'
    },
    {
      id: 4,
      type: 'Technical',
      question: 'What are the differences between Streamlit caching mechanisms and how would you use them to improve performance?',
      difficulty: 'medium'
    },
    {
      id: 5,
      type: 'Cultural Fit',
      question: 'Our team values continuous learning and experimentation. How do you stay updated with new technologies?',
      difficulty: 'easy'
    },
  ];

  const currentQuestion = interviewQuestions[currentQuestionIndex];

  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true
        });
        setMediaStream(stream);
        setPermissionGranted(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
        setMediaError('Unable to access camera/microphone. Please grant permissions.');
      }
    };

    initializeMedia();

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_RECORDING_TIME - 1) {
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = () => {
    if (!mediaStream) {
      setMediaError('Media stream not available');
      return;
    }

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(mediaStream, {
      mimeType: 'video/webm;codecs=vp8,opus'
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      saveResponse(blob);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    setRecordingTime(0);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const saveResponse = (videoBlob) => {
    const newResponse = {
      questionId: currentQuestion.id,
      questionType: currentQuestion.type,
      question: currentQuestion.question,
      videoBlob: videoBlob,
      videoBlobURL: URL.createObjectURL(videoBlob),
      duration: recordingTime,
      timestamp: new Date().toISOString()
    };

    setResponses(prev => {
      const filtered = prev.filter(r => r.questionId !== currentQuestion.id);
      return [...filtered, newResponse];
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < interviewQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setRecordingTime(0);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setRecordingTime(0);
    }
  };

  const handleSubmitAssessment = async () => {
    const formData = new FormData();
    formData.append('interview_id', '12345');
    
    responses.forEach((response, index) => {
      formData.append(`question_${index}_id`, response.questionId);
      formData.append(`question_${index}_type`, response.questionType);
      formData.append(`question_${index}_text`, response.question);
      formData.append(`question_${index}_duration`, response.duration);
      formData.append(`question_${index}_timestamp`, response.timestamp);
      formData.append(`video_${index}`, response.videoBlob, `question_${index}.webm`);
    });

    try {
      const response = await fetch('/api/assessments/submit', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        alert('Assessment submitted successfully!');
        setShowCompleteDialog(false);
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      alert('Failed to submit assessment. Please try again.');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeColor = (type) => {
    const colors = {
      'Technical': 'bg-blue-100 text-blue-800',
      'Behavioral': 'bg-purple-100 text-purple-800',
      'Situational': 'bg-orange-100 text-orange-800',
      'Cultural Fit': 'bg-green-100 text-green-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'easy': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'hard': 'bg-red-100 text-red-800'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  const progress = ((currentQuestionIndex + 1) / interviewQuestions.length) * 100;
  const hasResponse = responses.some(r => r.questionId === currentQuestion.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Interview Assessment</h1>
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
              Question {currentQuestionIndex + 1} of {interviewQuestions.length}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {mediaError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg flex items-start">
            <span className="text-red-500 text-xl mr-3 flex-shrink-0">⚠️</span>
            <div>
              <p className="text-red-800 font-semibold">Camera/Microphone Error</p>
              <p className="text-red-700 text-sm">{mediaError}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex gap-2 mb-4 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getTypeColor(currentQuestion.type)}`}>
                {currentQuestion.type}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getDifficultyColor(currentQuestion.difficulty)}`}>
                {currentQuestion.difficulty}
              </span>
              {hasResponse && (
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 flex items-center gap-1">
                  <span>✓</span>
                  Answered
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Question {currentQuestionIndex + 1}
            </h2>
            
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              {currentQuestion.question}
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="font-semibold text-blue-900 mb-2">📋 Instructions:</p>
              <ul className="text-blue-800 text-sm space-y-1 list-disc list-inside">
                <li>You have up to 1 minute to record your answer</li>
                <li>Click Start Recording when ready</li>
                <li>Speak clearly and look at the camera</li>
                <li>You can re-record your answer anytime</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="relative w-full bg-black rounded-xl overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center bg-red-600 text-white px-3 py-2 rounded-lg gap-2 animate-pulse">
                  <span className="w-3 h-3 bg-white rounded-full"></span>
                  <span className="font-semibold text-sm">Recording</span>
                </div>
              )}

              {!permissionGranted && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                  <div className="text-center text-white">
                    <div className="text-5xl mb-3">📹</div>
                    <p>Requesting camera access...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  ⏱️ Recording Time
                </span>
                <span className="text-sm font-semibold">
                  {formatTime(recordingTime)} / {formatTime(MAX_RECORDING_TIME)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${recordingTime > 50 ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${(recordingTime / MAX_RECORDING_TIME) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={!permissionGranted}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <span className="text-xl">▶️</span>
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <span className="text-xl">⏹️</span>
                  Stop Recording
                </button>
              )}
            </div>

            {hasResponse && !isRecording && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                <span className="text-green-600 text-xl flex-shrink-0">✓</span>
                <p className="text-green-800 text-sm">
                  Response recorded! You can re-record or move to the next question.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0 || isRecording}
              className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span>◀️</span>
              Previous
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                {responses.length} of {interviewQuestions.length} questions answered
              </p>
            </div>

            {currentQuestionIndex < interviewQuestions.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={isRecording}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next Question
                <span>▶️</span>
              </button>
            ) : (
              <button
                onClick={() => setShowCompleteDialog(true)}
                disabled={isRecording}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Complete Assessment
                <span>✓</span>
              </button>
            )}
          </div>
        </div>

        {showCompleteDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Submit Assessment</h2>
              <p className="text-gray-600 mb-4">
                You have answered {responses.length} out of {interviewQuestions.length} questions.
              </p>
              {responses.length < interviewQuestions.length && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <span className="text-yellow-600 text-xl flex-shrink-0">⚠️</span>
                  <p className="text-yellow-800 text-sm">
                    Some questions are not answered. Are you sure you want to submit?
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCompleteDialog(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={handleSubmitAssessment}
                  disabled={responses.length === 0}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
                >
                  Submit Assessment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewAssessment;