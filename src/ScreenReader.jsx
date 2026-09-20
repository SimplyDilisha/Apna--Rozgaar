import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Pause, Play, Settings } from 'lucide-react';
import { useTextToSpeech } from './hooks/useTextToSpeech';

/**
 * ScreenReader Component
 * Text-to-Speech feature that reads content on the screen aloud
 * Uses Web Speech API (SpeechSynthesis)
 */
export default function ScreenReader({ embedded = false }) {
  const [isOpen, setIsOpen] = useState(embedded ? true : false);
  console.log('ScreenReader rendering, embedded:', embedded, 'isOpen:', isOpen);
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [currentWord, setCurrentWord] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  const location = useLocation();
  const utteranceRef = useRef(null);

  // Track auto-reading preference (saved in localStorage)
  const [autoStart, setAutoStart] = useState(() => {
    return localStorage.getItem('sr_auto_start') === 'true';
  });

  // Effect to automatically start reading when location changes
  useEffect(() => {
    if (autoStart) {
      // Give a tiny delay for page content to settle
      const timer = setTimeout(() => {
        readPage();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, autoStart]);

  // Persist autoStart setting
  useEffect(() => {
    localStorage.setItem('sr_auto_start', autoStart.toString());
  }, [autoStart]);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        const voicesArray = Array.from(v);
        setVoices(voicesArray);

        // Prioritize Microsoft Ravi, then any English (India) voice, then any English voice
        const raviVoice = voicesArray.find(voice => voice.name.includes('Ravi'));
        const indianVoice = voicesArray.find(voice => voice.lang === 'en-IN' || voice.lang === 'en_IN');
        const englishVoice = voicesArray.find(voice => voice.lang.startsWith('en'));

        const bestVoice = raviVoice || indianVoice || englishVoice || voicesArray[0];
        setSelectedVoice(bestVoice);
        return true;
      }
      return false;
    };

    // Polling fallback as getVoices() can be empty initially
    if (!loadVoices()) {
      const interval = setInterval(() => {
        if (loadVoices()) clearInterval(interval);
      }, 100);
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Listen for text selection
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection().toString().trim();
      if (selection) {
        setSelectedText(selection);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keyup', handleSelection);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('keyup', handleSelection);
    };
  }, []);

  const readPage = () => {
    const mainContent = document.querySelector('main') || document.body;
    const text = mainContent.innerText;
    speak(text);
  };

  const readSelection = () => {
    if (selectedText) {
      speak(selectedText);
    }
  };

  const speak = (text) => {
    window.speechSynthesis.cancel();
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const word = text.substring(event.charIndex, event.charIndex + event.charLength);
        setCurrentWord(word);
      }
    };

    utterance.onstart = () => {
      setIsReading(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsReading(false);
      setIsPaused(false);
      setCurrentWord('');
    };

    utterance.onerror = () => {
      setIsReading(false);
      setIsPaused(false);
      setCurrentWord('');
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const togglePause = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsReading(false);
    setIsPaused(false);
    setCurrentWord('');
  };

  return (
    <>
      {/* Floating Toggle Button with Label */}
      {!embedded && (
        <div
          style={{
            position: 'fixed',
            bottom: '72px',
            left: '18px',
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'row-reverse',
            gap: '12px',
            zIndex: 9993,
          }}
        >
          {/* Text Label */}
          

          {/* Button */}
          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="screen-reader-toggle"
            aria-label={isOpen ? 'Close screen reader' : 'Open screen reader'}
            aria-expanded={isOpen}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: isReading ? 'var(--success)' : 'var(--accent-purple)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px var(--accent-purple-glow)',
              transition: 'all 0.3s ease',
            }}
          >
            {isReading ? <Volume2 size={24} /> : <VolumeX size={24} />}
          </motion.button>
        </div>
      )}

      {/* Screen Reader Panel */}
      {isOpen && (
        <div
          className="screen-reader-panel"
          role="dialog"
          aria-label="Screen Reader Controls"
          style={embedded ? {
            width: '100%',
            background: 'var(--card-bg)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
          } : {
            position: 'fixed',
            bottom: '230px',
            left: '24px',
            width: '320px',
            background: 'var(--card-bg)',
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            border: '1px solid var(--border-color)',
            zIndex: 9999,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px',
            background: 'var(--accent-purple)',
            color: 'white',
          }}>
            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>
              🔊 Screen Reader
            </h3>
            <p style={{ margin: '6px 0 0', fontSize: '1rem', opacity: 1 }}>
              Text-to-Speech Assistant
            </p>
          </div>

          {/* Current Word Display */}
          {isReading && currentWord && (
            <div style={{
              padding: '16px 20px',
              background: 'rgba(124, 58, 237, 0.1)',
              borderBottom: '1px solid var(--border-color)',
              textAlign: 'center',
            }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Now reading:</span>
              <p style={{
                margin: '6px 0 0',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--accent-purple)',
              }}>
                {currentWord}
              </p>
            </div>
          )}

          {/* Main Controls */}
          <div style={{ padding: '20px' }}>
            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <button
                onClick={readPage}
                disabled={isReading}
                style={{
                  flex: 1,
                  padding: '16px 12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'var(--accent-purple)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: isReading ? 'not-allowed' : 'pointer',
                  opacity: isReading ? 0.6 : 1,
                }}
              >
                📄 Read Page
              </button>
              <button
                onClick={readSelection}
                disabled={!selectedText || isReading}
                style={{
                  flex: 1,
                  padding: '16px 12px',
                  borderRadius: '12px',
                  border: '2px solid var(--accent-purple)',
                  background: 'transparent',
                  color: 'var(--accent-purple)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: (!selectedText || isReading) ? 'not-allowed' : 'pointer',
                  opacity: (!selectedText || isReading) ? 0.6 : 1,
                }}
              >
                ✂️ Read Selection
              </button>
            </div>

            {/* Selected Text Preview */}
            {selectedText && (
              <div style={{
                padding: '12px',
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                marginBottom: '20px',
                fontSize: '0.95rem',
                color: 'var(--text-secondary)',
                maxHeight: '80px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                border: '1px solid var(--border-color)',
              }}>
                <strong>Selected:</strong> {selectedText.substring(0, 100)}
                {selectedText.length > 100 && '...'}
              </div>
            )}

            {/* Playback Controls */}
            {isReading && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '20px',
                marginBottom: '20px',
              }}>
                <button
                  onClick={togglePause}
                  aria-label={isPaused ? 'Resume' : 'Pause'}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    border: '2px solid var(--accent-purple)',
                    background: 'transparent',
                    color: 'var(--accent-purple)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isPaused ? <Play size={28} /> : <Pause size={28} />}
                </button>
                <button
                  onClick={stop}
                  aria-label="Stop"
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    border: '2px solid var(--danger)',
                    background: 'var(--danger)',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: '24px' }}>⏹</span>
                </button>
              </div>
            )}

            {/* Settings Toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
              }}
            >
              <Settings size={20} />
              {showSettings ? 'Hide Settings' : 'Voice Settings'}
            </button>

            {/* Settings Panel */}
            {showSettings && (
              <div style={{ marginTop: '20px' }}>
                {/* Voice Selection */}
                <label style={{ display: 'block', marginBottom: '16px' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                    Voice
                  </span>
                  <select
                    value={selectedVoice?.name || ''}
                    onChange={(e) => {
                      const voice = voices.find(v => v.name === e.target.value);
                      setSelectedVoice(voice);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '1rem',
                    }}
                  >
                    {voices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </label>

                {/* Speed Control */}
                <label style={{ display: 'block', marginBottom: '16px' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    Speed <span>{rate}x</span>
                  </span>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={rate}
                    onChange={(e) => setRate(parseFloat(e.target.value))}
                    style={{ width: '100%', height: '8px' }}
                  />
                </label>

                {/* Pitch Control */}
                <label style={{ display: 'block', marginBottom: '16px' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    Pitch <span>{pitch}</span>
                  </span>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={pitch}
                    onChange={(e) => setPitch(parseFloat(e.target.value))}
                    style={{ width: '100%', height: '8px' }}
                  />
                </label>

                {/* Volume Control */}
                <label style={{ display: 'block' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    Volume <span>{Math.round(volume * 100)}%</span>
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    style={{ width: '100%', height: '8px' }}
                  />
                </label>

                {/* Auto-Start Toggle */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '20px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={autoStart}
                    onChange={(e) => setAutoStart(e.target.checked)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '1rem', fontWeight: 600 }}>
                    Auto-read on page change
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Keyboard Shortcuts Help */}
          <div style={{
            padding: '12px 16px',
            background: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border-color)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}>
            💡 <strong>Tip:</strong> Select any text and click "Read Selection"
          </div>
        </div>
      )}
    </>
  );
}


