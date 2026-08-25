/**
 * Groq Speech-to-Text Hook
 * 
 * Records audio from the microphone and transcribes it using Groq's Whisper API
 * via the backend endpoint.
 */

import { useState, useRef, useCallback } from 'react';

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface TranscriptionResult {
  text: string;
  words?: WordTimestamp[];
  duration?: number;
}

interface UseGroqSTTResult {
  isRecording: boolean;
  isTranscribing: boolean;
  transcript: string;
  wordTimestamps: WordTimestamp[];
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<TranscriptionResult | null>;
  clearTranscript: () => void;
  isSupported: boolean;
}

export function useGroqSTT(): UseGroqSTTResult {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [wordTimestamps, setWordTimestamps] = useState<WordTimestamp[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(() => 
    typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError('Audio recording is not supported in your browser');
      return;
    }

    try {
      setError(null);
      audioChunksRef.current = [];

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      
      streamRef.current = stream;

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
    } catch (err: any) {
      console.error('Failed to start recording:', err);
      setError(err.message || 'Failed to access microphone');
      
      // Clean up stream if it was created
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [isSupported]);

  const stopRecording = useCallback(async (): Promise<TranscriptionResult | null> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }

      mediaRecorder.addEventListener('stop', async () => {
        setIsRecording(false);
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        // Create audio blob from chunks
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType || 'audio/webm' 
        });

        if (audioBlob.size === 0) {
          setError('No audio data recorded');
          resolve(null);
          return;
        }

        // Transcribe audio
        setIsTranscribing(true);
        try {
          const result = await transcribeAudio(audioBlob);
          setTranscript(result.text);
          setWordTimestamps(result.words || []);
          setError(null);
          resolve(result);
        } catch (err: any) {
          console.error('Transcription failed:', err);
          setError(err.message || 'Failed to transcribe audio');
          resolve(null);
        } finally {
          setIsTranscribing(false);
        }
      }, { once: true });

      mediaRecorder.stop();
    });
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setWordTimestamps([]);
    setError(null);
  }, []);

  return {
    isRecording,
    isTranscribing,
    transcript,
    wordTimestamps,
    error,
    startRecording,
    stopRecording,
    clearTranscript,
    isSupported,
  };
}

/**
 * Send audio to backend for transcription
 */
async function transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('hiresense_token');

  const formData = new FormData();
  const filename = getRecordingFilename(audioBlob.type);
  formData.append('audio', audioBlob, filename);

  const response = await fetch(`${API_BASE_URL}/api/virtual-interview/transcribe`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Transcription failed' }));
    throw new Error(errorData.message || 'Failed to transcribe audio');
  }

  const data = await response.json();
  
  return {
    text: data.data.text || '',
    words: data.data.words || [],
    duration: data.data.duration,
  };
}

function getRecordingFilename(mimeType: string): string {
  if (mimeType.includes('audio/webm')) return 'recording.webm';
  if (mimeType.includes('audio/mp4')) return 'recording.mp4';
  if (mimeType.includes('audio/mpeg')) return 'recording.mp3';
  if (mimeType.includes('audio/wav')) return 'recording.wav';
  return 'recording.webm';
}
