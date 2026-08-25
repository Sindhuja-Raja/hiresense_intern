/**
 * Text-to-Speech Hook
 * 
 * Uses the Web Speech API to convert text to speech.
 * Makes the avatar "speak" the AI response.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseTextToSpeechResult {
  isSpeaking: boolean;
  speak: (text: string, options?: SpeakOptions) => void;
  stop: () => void;
  isSupported: boolean;
}

interface SpeakOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onBoundary?: (word: string, elapsedTime: number) => void;
  rate?: number;
  pitch?: number;
  voiceName?: string;
}

export function useTextToSpeech(): UseTextToSpeechResult {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setIsSupported('speechSynthesis' in window);
  }, []);

  const speak = useCallback((text: string, options: SpeakOptions = {}) => {
    if (!('speechSynthesis' in window)) {
      console.error('Text-to-speech not supported');
      return;
    }

    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Configure voice settings
    utterance.rate = options.rate ?? 0.9;  // Slightly slower for clarity
    utterance.pitch = options.pitch ?? 1.1; // Slightly higher for female voice
    utterance.volume = 1;

    // Try to find a female English voice
    const voices = window.speechSynthesis.getVoices();
    const preferredByName = options.voiceName
      ? voices.find(v => v.name === options.voiceName)
      : undefined;

    const femaleVoice = preferredByName || voices.find(voice => 
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
      options.onStart?.();
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      options.onEnd?.();
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    const wordSpans = getWordSpans(text);
    utterance.onboundary = (event: SpeechSynthesisEvent) => {
      if (event.name !== 'word') return;
      const word = findWordAtIndex(wordSpans, event.charIndex);
      if (word) {
        options.onBoundary?.(word, event.elapsedTime || 0);
      }
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

function getWordSpans(text: string): Array<{ word: string; start: number; end: number }> {
  const spans: Array<{ word: string; start: number; end: number }> = [];
  const regex = /\b[\w']+\b/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    spans.push({
      word: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return spans;
}

function findWordAtIndex(
  spans: Array<{ word: string; start: number; end: number }>,
  index: number
): string | null {
  for (const span of spans) {
    if (index >= span.start && index <= span.end) {
      return span.word;
    }
  }
  return null;
}
