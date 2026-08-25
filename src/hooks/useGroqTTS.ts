/**
 * Groq Text-to-Speech Hook
 * 
 * Converts text to speech using Groq's Orpheus TTS API via backend,
 * plays audio, and provides callbacks for lip sync synchronization.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

export interface TTSOptions {
  voice?: string;
  onWordSpoken?: (word: string, timestamp: number) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
}

interface UseGroqTTSResult {
  isSpeaking: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  error: string | null;
  speak: (text: string, options?: TTSOptions) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSupported: boolean;
}

export function useGroqTTS(): UseGroqTTSResult {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(() => typeof Audio !== 'undefined');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const optionsRef = useRef<TTSOptions>({});
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);

  // Update current time during playback
  const updateTime = useCallback(() => {
    if (audioRef.current && isSpeaking) {
      setCurrentTime(audioRef.current.currentTime);
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }
  }, [isSpeaking]);

  useEffect(() => {
    if (isSpeaking) {
      animationFrameRef.current = requestAnimationFrame(updateTime);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isSpeaking, updateTime]);

  const speak = useCallback(async (text: string, options: TTSOptions = {}) => {
    if (!isSupported) {
      setError('Audio playback is not supported in your browser');
      return;
    }

    // Stop any ongoing speech
    stop();

    setIsLoading(true);
    setError(null);
    optionsRef.current = options;

    try {
      // Fetch TTS audio from backend
      const audioBlob = await generateSpeech(text, options.voice);
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('TTS audio data is empty');
      }

      console.log('Audio blob received - Size:', audioBlob.size, 'Type:', audioBlob.type);

      // Create audio element
      const audio = new Audio();
      audioRef.current = audio;
      
      // Create blob URL with validation
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (!audioUrl || !audioUrl.startsWith('blob:')) {
        throw new Error('Failed to create blob URL');
      }
      
      console.log('Blob URL created:', audioUrl);

      // Setup ALL event listeners BEFORE setting src and loading
      audio.addEventListener('loadedmetadata', () => {
        console.log('Audio loaded - Duration:', audio.duration);
        setDuration(audio.duration);
      });

      audio.addEventListener('play', () => {
        setIsSpeaking(true);
        setIsLoading(false);
        startTimeRef.current = Date.now();
        options.onSpeechStart?.();
      });

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener('ended', () => {
        setIsSpeaking(false);
        setCurrentTime(0);
        options.onSpeechEnd?.();
        URL.revokeObjectURL(audioUrl);
      });

      audio.addEventListener('error', (e) => {
        const currentSrc = audio.src || '';
        if (!currentSrc.startsWith('blob:')) {
          console.warn('Ignoring audio error for empty/non-blob src:', currentSrc);
          return;
        }

        const message = getMediaErrorMessage(audio.error);
        console.error('Audio playback error:', message);
        console.error('Audio src:', currentSrc);
        console.error('Audio readyState:', audio.readyState);
        console.error('Audio networkState:', audio.networkState);
        console.error('Blob type:', audioBlob.type, 'Size:', audioBlob.size);
        console.error('Blob URL:', audioUrl);
        console.error('Error event:', e);
        setError(message);
        setIsSpeaking(false);
        setIsLoading(false);
        URL.revokeObjectURL(audioUrl);
      });
      
      // Now set src and load
      audio.src = audioUrl;
      audio.preload = 'auto';
      
      console.log('Audio src set to:', audio.src);
      
      // Load the audio
      await audio.load();

      // Start playback
      try {
        await audio.play();
      } catch (err: any) {
        const message = getPlayErrorMessage(err);
        console.error('Audio play() failed:', message, err);
        setError(message);
        setIsSpeaking(false);
        setIsLoading(false);
        URL.revokeObjectURL(audioUrl);
        throw err;
      }
    } catch (err: any) {
      console.error('TTS failed:', err);
      setError(err.message || 'Failed to generate speech');
      setIsSpeaking(false);
      setIsLoading(false);
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
      audioRef.current = null;
    }

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {
        // Ignore error if already stopped
      }
      sourceNodeRef.current = null;
    }

    setIsSpeaking(false);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current && isSpeaking) {
      audioRef.current.pause();
      pauseTimeRef.current = Date.now();
      setIsSpeaking(false);
    }
  }, [isSpeaking]);

  const resume = useCallback(() => {
    if (audioRef.current && !isSpeaking) {
      audioRef.current.play();
      setIsSpeaking(true);
    }
  }, [isSpeaking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isSpeaking,
    isLoading,
    currentTime,
    duration,
    error,
    speak,
    stop,
    pause,
    resume,
    isSupported,
  };
}

/**
 * Generate speech from text via backend
 */
async function generateSpeech(text: string, voice?: string): Promise<Blob> {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('hiresense_token');
  const response = await fetch(`${API_BASE_URL}/api/virtual-interview/speak`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ text, voice }),
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    const retryAfter = response.headers.get('retry-after');
    if (contentType?.includes('application/json')) {
      const errorData = await response.json().catch(() => ({ message: 'TTS failed' }));
      if (response.status === 429) {
        const retryMsg = retryAfter ? ` Try again in ${retryAfter}s.` : '';
        throw new Error(`TTS rate limited.${retryMsg}`);
      }
      throw new Error(errorData.message || 'Failed to generate speech');
    }
    if (response.status === 429) {
      const retryMsg = retryAfter ? ` Try again in ${retryAfter}s.` : '';
      throw new Error(`TTS rate limited.${retryMsg}`);
    }
    throw new Error(`TTS failed with status ${response.status}`);
  }

  // Get audio as blob directly from binary response
  const audioBlob = await response.blob();
  
  console.log('Audio received - Size:', audioBlob.size, 'Type:', audioBlob.type);
  
  return audioBlob;
}

/**
 * Convert base64 string to Blob with validation
 */
function base64ToBlob(base64: string, contentType: string = 'audio/wav'): Blob {
  try {
    // Remove any whitespace or newlines
    const cleanBase64 = base64.replace(/\s/g, '');
    
    // Decode base64
    const byteCharacters = atob(cleanBase64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    
    // Create blob with explicit type
    const blob = new Blob([byteArray], { type: contentType });
    
    console.log('Base64 decoded - Input length:', base64.length, 'Blob size:', blob.size);
    
    return blob;
  } catch (error) {
    console.error('Failed to decode base64 audio:', error);
    throw new Error('Failed to decode audio data');
  }
}


function getMediaErrorMessage(error: MediaError | null): string {
  if (!error) return 'Audio playback error: Unknown error';
  switch (error.code) {
    case MediaError.MEDIA_ERR_ABORTED:
      return 'Audio playback was aborted.';
    case MediaError.MEDIA_ERR_NETWORK:
      return 'Network error while loading audio.';
    case MediaError.MEDIA_ERR_DECODE:
      return 'Audio decoding failed. The audio file may be corrupted.';
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return 'Audio format not supported by your browser.';
    default:
      return error.message || 'Audio playback error.';
  }
}

function getPlayErrorMessage(err: any): string {
  if (!err) return 'Audio playback failed.';
  if (err.name === 'NotAllowedError') {
    return 'Audio playback was blocked by the browser. Please click Play or interact with the page and try again.';
  }
  if (err.name === 'NotSupportedError') {
    return 'Audio format not supported by your browser.';
  }
  return err.message || 'Audio playback failed.';
}
