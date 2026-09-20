import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useVoiceControl Hook
 * A powerful voice control system using Web Speech API
 * Supports continuous listening, command matching, and multilingual support
 */
export function useVoiceControl(options = {}) {
  const {
    language = 'en-US',
    onResult,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState(null);
  
  const recognitionRef = useRef(null);
  const shouldBeListening = useRef(false);
  const onResultRef = useRef(onResult);

  // Keep callback ref updated
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  // Initialize Speech Recognition ONCE
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Voice control is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('🎤 Voice recognition started');
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        
        if (result.isFinal) {
          finalTranscript += text;
          setConfidence(Math.round(result[0].confidence * 100));
        } else {
          interim += text;
        }
      }

      if (finalTranscript) {
        console.log('🎤 Heard:', finalTranscript);
        setTranscript(finalTranscript);
        // Use ref to avoid dependency issues
        onResultRef.current?.(finalTranscript.toLowerCase().trim());
      }
      
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      console.log('🎤 Error:', event.error);
      
      // Only show critical errors
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access.');
        shouldBeListening.current = false;
        setIsListening(false);
      } else if (event.error === 'audio-capture') {
        setError('No microphone found.');
        shouldBeListening.current = false;
        setIsListening(false);
      }
      // Ignore no-speech, aborted, network errors - will auto-restart
    };

    recognition.onend = () => {
      console.log('🎤 Recognition ended, shouldBeListening:', shouldBeListening.current);
      
      // Auto-restart if we should still be listening
      if (shouldBeListening.current) {
        console.log('🎤 Auto-restarting...');
        setTimeout(() => {
          if (shouldBeListening.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.log('🎤 Restart failed, retrying...', e.message);
              // Try again after a delay
              setTimeout(() => {
                if (shouldBeListening.current && recognitionRef.current) {
                  try {
                    recognitionRef.current.start();
                  } catch {
                    // Give up
                  }
                }
              }, 500);
            }
          }
        }, 100);
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldBeListening.current = false;
      try {
        recognition.abort();
      } catch {
        // Ignore
      }
    };
  }, [language]); // Only recreate if language changes

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      console.log('🎤 Cannot start - not supported or no recognition');
      return;
    }
    
    console.log('🎤 Starting listening...');
    shouldBeListening.current = true;
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.log('🎤 Start error:', e.message);
      // Already started - that's fine
      if (e.name === 'InvalidStateError') {
        setIsListening(true);
      }
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    console.log('🎤 Stopping listening...');
    shouldBeListening.current = false;
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
    
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    confidence,
    error,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
}

/**
 * Voice Command Processor
 * Matches voice input against defined commands with fuzzy matching
 */
export function useVoiceCommands(commands, options = {}) {
  const { fuzzyMatch = true, minConfidence = 0.6 } = options;
  const [lastCommand, setLastCommand] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const processCommand = useCallback((transcript) => {
    const input = transcript.toLowerCase().trim();
    
    // Exact match first
    for (const [phrase, action] of Object.entries(commands)) {
      if (input.includes(phrase.toLowerCase())) {
        setLastCommand(phrase);
        const result = action(input, phrase);
        setLastResult(result);
        return { matched: true, command: phrase, result };
      }
    }

    // Fuzzy match if enabled
    if (fuzzyMatch) {
      let bestMatch = null;
      let bestScore = 0;

      for (const phrase of Object.keys(commands)) {
        const score = calculateSimilarity(input, phrase.toLowerCase());
        if (score > bestScore && score >= minConfidence) {
          bestScore = score;
          bestMatch = phrase;
        }
      }

      if (bestMatch) {
        setLastCommand(bestMatch);
        const result = commands[bestMatch](input, bestMatch);
        setLastResult(result);
        return { matched: true, command: bestMatch, result, fuzzy: true, score: bestScore };
      }
    }

    return { matched: false };
  }, [commands, fuzzyMatch, minConfidence]);

  return { processCommand, lastCommand, lastResult };
}

// Simple similarity calculation (Dice coefficient)
function calculateSimilarity(str1, str2) {
  const set1 = new Set(str1.split(/\s+/));
  const set2 = new Set(str2.split(/\s+/));
  
  let intersection = 0;
  for (const word of set1) {
    if (set2.has(word)) intersection++;
  }
  
  return (2 * intersection) / (set1.size + set2.size);
}

export default useVoiceControl;
