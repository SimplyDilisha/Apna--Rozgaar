import { useCallback } from 'react';

/**
 * Hook for programmatic text-to-speech
 */
export function useTextToSpeech() {
  const speak = useCallback((text, options = {}) => {
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;
    
    if (options.voice) {
      utterance.voice = options.voice;
    }
    
    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => window.speechSynthesis.cancel(), []);
  const pause = useCallback(() => window.speechSynthesis.pause(), []);
  const resume = useCallback(() => window.speechSynthesis.resume(), []);

  return { speak, stop, pause, resume };
}
