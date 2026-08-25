/**
 * Text-to-Speech Hook
 * 
 * Uses the Web Speech API to convert text to speech.
 * Makes the avatar "speak" the AI response.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseTextToSpeechResult {
  isSpeaking: boolean;
  speak: (text: string) => void;
  stop: () => void;
  isSupported: boolean;
}

export function useTextToSpeech(): UseTextToSpeechResult {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setIsSupported('speechSynthesis' in window);
  }, []);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      console.error('Text-to-speech not supported');
      return;
    }

    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Configure voice settings
    utterance.rate = 0.9;  // Slightly slower for clarity
    utterance.pitch = 1.1; // Slightly higher for female voice
    utterance.volume = 1;

    // Try to find a female English voice
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => 
      voice.lang.includes('en') && 
      (voice.name.includes('female') || 
       voice.name.includes('Female') ||
       voice.name.includes('Samantha') ||
       voice.name.includes('Victoria') ||
       voice.name.includes('Karen') ||
       voice.name.includes('Moira') ||
       voice.name.includes('Fiona'))
    ) || voices.find(voice => voice.lang.includes('en'));

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    isSpeaking,
    speak,
    stop,
    isSupported
  };
}
