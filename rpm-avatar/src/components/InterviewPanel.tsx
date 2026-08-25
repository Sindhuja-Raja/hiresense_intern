/**
 * Interview Panel Component
 * 
 * UI for the interview interaction:
 * - Job role selection
 * - Webcam feed for the candidate
 * - Microphone button to record user speech
 * - Display of conversation
 * - Evaluation scores display
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useWebcam } from '../hooks/useWebcam';
import { aiService, type JobRole, type InterviewScore } from '../services/aiService';
import type { GestureState } from '../types';
import './InterviewPanel.css';

interface InterviewPanelProps {
  onGestureChange: (gesture: GestureState) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function InterviewPanel({ onGestureChange }: InterviewPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<JobRole>('software-engineer');
  const [evaluation, setEvaluation] = useState<InterviewScore | null>(null);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [cameraContainer, setCameraContainer] = useState<HTMLElement | null>(null);
  
  const { 
    isListening, 
    transcript,
    interimTranscript,
    startListening, 
    stopListening,
    isSupported: sttSupported 
  } = useSpeechRecognition();
  
  const { 
    isSpeaking, 
    speak, 
    isSupported: ttsSupported 
  } = useTextToSpeech();

  const {
    videoRef,
    isEnabled: isCameraOn,
    isLoading: isCameraLoading,
    error: cameraError,
    toggleCamera
  } = useWebcam();

  const availableRoles = aiService.getAvailableRoles();

  // Find camera container after mount
  useEffect(() => {
    const container = document.getElementById('candidate-camera');
    setCameraContainer(container);
  }, []);

  // Update gesture state based on speaking/listening
  useEffect(() => {
    if (isSpeaking) {
      onGestureChange('speaking');
    } else if (isListening) {
      onGestureChange('listening');
    } else {
      onGestureChange('idle');
    }
  }, [isSpeaking, isListening, onGestureChange]);

  // Start interview with greeting and enable camera
  const startInterview = async () => {
    aiService.setJobRole(selectedRole);
    setHasStarted(true);
    setError(null);
    setEvaluation(null);
    setQuestionsAnswered(0);
    
    // Auto-start camera when interview begins
    if (!isCameraOn && !isCameraLoading) {
      toggleCamera();
    }
    
    const greeting = aiService.getGreeting();
    setMessages([{ role: 'assistant', content: greeting }]);
    speak(greeting);
  };

  // Handle recording toggle
  const handleMicClick = async () => {
    if (isListening) {
      stopListening();
      
      // Process the transcript if we have one
      if (transcript.trim()) {
        await processUserInput(transcript);
      }
    } else {
      startListening();
    }
  };

  // Process user speech and get AI response
  const processUserInput = async (userText: string) => {
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setIsProcessing(true);
    setError(null);
    
    try {
      // Get AI response from Gemini
      const response = await aiService.getResponse(userText);
      
      // Check if response contains evaluation
      const evalResult = aiService.parseEvaluation(response);
      if (evalResult) {
        setEvaluation(evalResult);
      }
      
      // Add assistant message (clean up evaluation markers for display)
      const displayResponse = response.replace(/---EVALUATION---|---END---/g, '').trim();
      setMessages(prev => [...prev, { role: 'assistant', content: displayResponse }]);
      
      // Speak the response
      speak(displayResponse);
      
      setQuestionsAnswered(prev => prev + 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get AI response';
      setError(errorMessage);
      console.error('Error getting AI response:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Request final evaluation
  const requestEvaluation = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const response = await aiService.requestEvaluation();
      
      // Parse and set evaluation
      const evalResult = aiService.parseEvaluation(response);
      if (evalResult) {
        setEvaluation(evalResult);
      }
      
      // Add assistant message
      const displayResponse = response.replace(/---EVALUATION---|---END---/g, '').trim();
      setMessages(prev => [...prev, { role: 'assistant', content: displayResponse }]);
      speak(displayResponse);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get evaluation';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset and start new interview
  const resetInterview = () => {
    aiService.resetConversation();
    setMessages([]);
    setHasStarted(false);
    setEvaluation(null);
    setQuestionsAnswered(0);
    setError(null);
  };

  if (!sttSupported || !ttsSupported) {
    return (
      <div className="interview-panel">
        <div className="error-message">
          Speech features are not supported in this browser. 
          Please use Chrome or Edge for the best experience.
        </div>
      </div>
    );
  }

  return (
    <div className="interview-panel">
      {/* Webcam Feed - Always visible, rendered via Portal */}
      {cameraContainer && createPortal(
        <div className="webcam-wrapper">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`webcam-video-large ${isCameraOn ? 'active' : ''}`}
          />
          {!isCameraOn && !isCameraLoading && (
            <div className="webcam-placeholder-large">
              <span>📷</span>
              <p>Camera Off</p>
              <button 
                className="enable-camera-btn"
                onClick={toggleCamera}
              >
                Enable Camera
              </button>
            </div>
          )}
          {isCameraLoading && (
            <div className="webcam-placeholder-large">
              <span>⏳</span>
              <p>Starting camera...</p>
            </div>
          )}
          {isCameraOn && (
            <button 
              className="camera-toggle-large"
              onClick={toggleCamera}
              disabled={isCameraLoading}
              title="Turn off camera"
            >
              📹 Camera On
            </button>
          )}
          {cameraError && (
            <div className="camera-error-large">{cameraError}</div>
          )}
        </div>,
        cameraContainer
      )}

      {/* Error display */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {!hasStarted ? (
        <div className="start-screen">
          <h2>🎯 AI Interview Practice</h2>
          <p>Select your job role and practice your interview skills. Sarah will evaluate your tone, communication, and content.</p>
          
          <div className="role-selector">
            <label htmlFor="job-role">Select Job Role:</label>
            <select 
              id="job-role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as JobRole)}
            >
              {availableRoles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
          
          <button className="start-button" onClick={startInterview}>
            Start Interview
          </button>
        </div>
      ) : (
        <>
          {/* Evaluation Score Card */}
          {evaluation && (
            <div className={`evaluation-card ${evaluation.verdict.toLowerCase()}`}>
              <h3>📊 Interview Evaluation</h3>
              <div className="scores">
                <div className="score-item">
                  <span className="score-label">Tone</span>
                  <span className="score-value">{evaluation.tone}/10</span>
                </div>
                <div className="score-item">
                  <span className="score-label">Communication</span>
                  <span className="score-value">{evaluation.communication}/10</span>
                </div>
                <div className="score-item">
                  <span className="score-label">Content</span>
                  <span className="score-value">{evaluation.content}/10</span>
                </div>
                <div className="score-item overall">
                  <span className="score-label">Overall</span>
                  <span className="score-value">{evaluation.overall}/10</span>
                </div>
              </div>
              <div className={`verdict ${evaluation.verdict.toLowerCase()}`}>
                {evaluation.verdict === 'ACCEPT' && '✅ ACCEPTED'}
                {evaluation.verdict === 'REJECT' && '❌ REJECTED'}
                {evaluation.verdict === 'MAYBE' && '🤔 MAYBE'}
              </div>
              <p className="feedback">{evaluation.feedback}</p>
              <button className="reset-button" onClick={resetInterview}>
                Start New Interview
              </button>
            </div>
          )}

          {/* Conversation display */}
          <div className="conversation">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                <span className="label">
                  {msg.role === 'assistant' ? '👩‍💼 Sarah' : '👤 You'}
                </span>
                <p>{msg.content}</p>
              </div>
            ))}
            {isProcessing && (
              <div className="message assistant">
                <span className="label">👩‍💼 Sarah</span>
                <p className="thinking">Thinking... (may take a moment if rate limited)</p>
              </div>
            )}
          </div>

          {/* Live transcript while recording */}
          {isListening && (
            <div className="live-transcript">
              <span>🎤 {interimTranscript || transcript || 'Listening...'}</span>
            </div>
          )}

          {/* Controls */}
          <div className="controls">
            {/* Microphone button */}
            <button 
              className={`mic-button ${isListening ? 'listening' : ''} ${isSpeaking ? 'disabled' : ''}`}
              onClick={handleMicClick}
              disabled={isSpeaking || isProcessing || !!evaluation}
            >
              {isListening ? (
                <>
                  <span className="mic-icon">⏹️</span>
                  <span>Stop Recording</span>
                </>
              ) : (
                <>
                  <span className="mic-icon">🎤</span>
                  <span>{isSpeaking ? 'Sarah is speaking...' : 'Click to Speak'}</span>
                </>
              )}
            </button>

            {/* Evaluation button - show after 5+ questions */}
            {questionsAnswered >= 5 && !evaluation && (
              <button 
                className="eval-button"
                onClick={requestEvaluation}
                disabled={isSpeaking || isProcessing || isListening}
              >
                📊 Get Final Evaluation
              </button>
            )}
          </div>

          {/* Status indicator */}
          <div className="status">
            {isSpeaking && <span className="status-speaking">🔊 Sarah is speaking...</span>}
            {isListening && <span className="status-listening">🎤 Listening...</span>}
            {!evaluation && (
              <span className="question-count">
                Questions answered: {questionsAnswered}/10 
                {questionsAnswered < 5 && ' (minimum 5 for evaluation)'}
                {questionsAnswered >= 5 && questionsAnswered < 8 && ' (can get evaluation now)'}
                {questionsAnswered >= 8 && ' (ready for final evaluation)'}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
