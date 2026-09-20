/**
 * ISLSignLanguagePanel
 * Ported from Interview-Prep-Buddy-V2 · ISLSignLanguagePanel.tsx
 * Uses islGestureEngine to detect ISL (Indian Sign Language) A-Z hand gestures
 * and build up a text sentence the user can submit as their interview answer.
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { islGestureEngine } from '../services/islGestureEngine';
import { predictSentenceFromSignKeywords } from '../services/groqService';
import './ISLSignLanguagePanel.css';


// ISL reference hints per letter
const ISL_HINTS = {
  A: 'Fist, thumb beside',
  B: 'All 4 fingers up, thumb in',
  C: 'Curved C-shape',
  D: 'Index up, others curled',
  E: 'All curled inward',
  F: 'Index+thumb touch, others up',
  G: 'Index pointing sideways',
  H: 'Index+middle horizontal',
  I: 'Pinky only up',
  J: 'Pinky curved outward',
  K: 'Index+middle+thumb up',
  L: 'L-shape: index+thumb',
  M: '3 fingers over thumb',
  N: '2 fingers over thumb',
  O: 'O-shape with fingers',
  P: 'Index pointing down',
  Q: 'Index down, thumb out',
  R: 'Index+middle crossed',
  S: 'Fist, thumb over fingers',
  T: 'Thumb between fingers',
  U: 'Index+middle up, close',
  V: 'V-shape peace sign',
  W: 'Index+middle+ring up',
  X: 'Index finger hooked',
  Y: 'Thumb+pinky out (Shaka)',
  Z: 'Index pointing forward',
};

// Interview word-bank for autocomplete
const WORD_BANK = [
  'React','JavaScript','TypeScript','Python','Node','Express','MongoDB','SQL',
  'API','REST','GraphQL','Docker','Kubernetes','AWS','Git','GitHub','CSS','HTML',
  'Redux','Angular','Flutter','Swift','Kotlin','Java','Spring','machine','learning',
  'algorithm','database','backend','frontend','fullstack','testing','debugging',
  'deployment','agile','scrum','microservices','serverless','cloud','devops',
  'I','my','we','our','team','project','worked','built','developed','designed',
  'implemented','solved','improved','reduced','increased','managed','led','created',
  'experience','years','months','role','position','company','startup','product',
  'problem','solution','challenge','result','impact','success','failure','learned',
  'skill','technical','communication','leadership','collaboration','responsibility',
  'the','and','but','for','with','from','that','this','have','been','when','about',
].map(w => w.toLowerCase());
const UNIQUE_WORDS = [...new Set(WORD_BANK)];

// Hold-to-confirm constants
const HOLD_STEPS    = 12;  // frames before confirming (~0.4s)
const HOLD_DURATION = 1000; // ms feedback display


const ISLSignLanguagePanel = ({ onTextUpdate, disabled = false, existingVideoStream = null }) => {
  const videoRef          = useRef(null);
  const canvasRef         = useRef(null);
  const streamRef         = useRef(null);
  const rafRef            = useRef(null);
  const lastConfirmedRef  = useRef(null);

  const [isInitializing, setIsInitializing] = useState(true);
  const [engineLoaded,   setEngineLoaded]   = useState(false);
  const [error,          setError]          = useState(null);
  const [isPaused,       setIsPaused]       = useState(false);

  const [gestureResult,   setGestureResult]   = useState(null);
  const [detectedLetter,  setDetectedLetter]  = useState(null);
  const [holdProgress,    setHoldProgress]    = useState(0);
  const [isConfirming,    setIsConfirming]    = useState(false);
  const [confirmedFlash,  setConfirmedFlash]  = useState(false);

  const [sentence,     setSentence]     = useState('');
  const [currentWord,  setCurrentWord]  = useState('');

  // Autocomplete suggestions from word bank
  const suggestions = useMemo(() => {
    const q = currentWord.toLowerCase();
    if (q.length < 1) return [];
    return UNIQUE_WORDS
      .filter(w => w.startsWith(q) && w !== q)
      .sort((a, b) => a.length - b.length)
      .slice(0, 6);
  }, [currentWord]);

  const addLetter = useCallback((letter) => {
    if (letter === ' ') {
      setSentence(prev => {
        const next = prev + currentWord + ' ';
        onTextUpdate?.(next);
        return next;
      });
      setCurrentWord('');
    } else if (letter === 'DEL') {
      setCurrentWord(prev => prev.slice(0, -1));
    } else {
      setCurrentWord(prev => prev + letter);
    }
    setConfirmedFlash(true);
    setTimeout(() => setConfirmedFlash(false), 300);
  }, [currentWord, onTextUpdate]);

  // Draw skeleton hands on canvas overlay (supports both single & multi-hand arrays)
  const drawLandmarks = useCallback((landmarksData) => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video || !landmarksData || landmarksData.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const W = canvas.width;
    const H = canvas.height;

    // Support single hand [[x,y,z]...] and dual hand [hand1, hand2]
    const handsList = Array.isArray(landmarksData[0]?.[0]) ? landmarksData : [landmarksData];

    const CONNECTIONS = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],
      [0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20],
      [5,9],[9,13],[13,17],
    ];

    const HAND_COLORS = ['rgba(139,92,246,0.95)', 'rgba(13,148,136,0.95)'];

    handsList.forEach((handLandmarks, handIdx) => {
      if (!handLandmarks || handLandmarks.length === 0) return;
      const pts = handLandmarks.map(([x, y]) => [(1 - x) * W, y * H]);

      // Skeleton lines
      ctx.strokeStyle = HAND_COLORS[handIdx % HAND_COLORS.length];
      ctx.lineWidth = 3;
      for (const [a, b] of CONNECTIONS) {
        if (pts[a] && pts[b]) {
          ctx.beginPath();
          ctx.moveTo(pts[a][0], pts[a][1]);
          ctx.lineTo(pts[b][0], pts[b][1]);
          ctx.stroke();
        }
      }

      // Colored finger dots
      const COLORS = handIdx === 0
        ? ['#f43f5e','#8b5cf6','#06b6d4','#10b981','#f59e0b']
        : ['#ec4899','#10b981','#3b82f6','#f59e0b','#8b5cf6'];
      for (let i = 0; i < pts.length; i++) {
        const group = i === 0 ? 0 : Math.min(Math.ceil(i / 4), 4);
        if (pts[i]) {
          ctx.beginPath();
          ctx.arc(pts[i][0], pts[i][1], i % 4 === 0 ? 6 : 5, 0, Math.PI * 2);
          ctx.fillStyle   = COLORS[group];
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.8)';
          ctx.lineWidth   = 1.5;
          ctx.stroke();
        }
      }

      // Wrist dot
      if (pts[0]) {
        ctx.beginPath();
        ctx.arc(pts[0][0], pts[0][1], 8, 0, Math.PI * 2);
        ctx.fillStyle = HAND_COLORS[handIdx % HAND_COLORS.length];
        ctx.fill();
      }
    });
  }, []);


  // Main init effect
  useEffect(() => {
    let active = true;

    const init = async () => {
      // Start camera stream
      try {
        let stream = existingVideoStream;
        const isTrackActive = stream && stream.getVideoTracks().some(t => t.readyState === 'live');
        if (!isTrackActive) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          });
        }
        if (!active) {
          if (!existingVideoStream) stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        if (active) {
          console.error('[ISL Panel] Camera error:', err);
          setError(err.name === 'NotAllowedError'
            ? 'Camera permission denied. Please allow camera access.'
            : 'Unable to access camera.');
          setIsInitializing(false);
        }
        return;
      }

      // Camera is up — show UI immediately
      if (active) setIsInitializing(false);

      // Load ISL engine in background
      islGestureEngine.initialize().then(() => {
        if (active) setEngineLoaded(true);
      }).catch(err => {
        console.warn('[ISL Panel] Engine failed to load:', err.message);
      });

      // Hold-to-confirm state (local to the loop)
      let holdCount  = 0;
      let holdLetter = null;

      const processFrame = () => {
        if (
          !active ||
          !videoRef.current ||
          videoRef.current.readyState < 2 ||
          !videoRef.current.videoWidth ||
          !videoRef.current.videoHeight
        ) {
          rafRef.current = requestAnimationFrame(processFrame);
          return;
        }

        if (isPaused) {
          rafRef.current = requestAnimationFrame(processFrame);
          return;
        }

        try {
          const result = islGestureEngine.processFrame(videoRef.current, performance.now());
          if (active) {
            setGestureResult(result);
            setDetectedLetter(result.letter);
            drawLandmarks(result.landmarks);

            // Hold-to-confirm logic
            if (result.letter && result.letter !== '?' && result.letter !== holdLetter) {
              holdLetter = result.letter;
              holdCount  = 0;
              setHoldProgress(0);
              setIsConfirming(false);
            } else if (result.letter && result.letter === holdLetter) {
              holdCount++;
              const progress = Math.min((holdCount / HOLD_STEPS) * 100, 100);
              setHoldProgress(progress);
              setIsConfirming(holdCount > 0 && holdCount < HOLD_STEPS);

              if (holdCount >= HOLD_STEPS && holdLetter !== lastConfirmedRef.current) {
                lastConfirmedRef.current = holdLetter;
                addLetter(holdLetter);
                holdCount  = 0;
                holdLetter = null;
                setHoldProgress(0);
                setIsConfirming(false);
                setTimeout(() => { lastConfirmedRef.current = null; }, 1000);
              }
            } else if (!result.letter) {
              holdCount  = 0;
              holdLetter = null;
              setHoldProgress(0);
              setIsConfirming(false);
            }
          }
        } catch (err) {
          console.error('[ISL] Frame error:', err);
        }

        rafRef.current = requestAnimationFrame(processFrame);
      };

      rafRef.current = requestAnimationFrame(processFrame);
    };

    init();

    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // Only stop tracks if we own the stream (not a shared one)
      if (!existingVideoStream && streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddSpace = () => {
    if (!currentWord) return;
    setSentence(prev => {
      const next = prev + currentWord + ' ';
      onTextUpdate?.(next);
      return next;
    });
    setCurrentWord('');
  };

  const handleDelete = () => {
    if (currentWord.length > 0) {
      setCurrentWord(prev => prev.slice(0, -1));
    } else if (sentence.length > 0) {
      setSentence(prev => {
        const trimmed = prev.trimEnd().slice(0, -1);
        onTextUpdate?.(trimmed);
        return trimmed;
      });
    }
  };

  const handleClear = () => {
    setSentence('');
    setCurrentWord('');
    onTextUpdate?.('');
  };

  const [isPredicting, setIsPredicting] = useState(false);

  const handleGroqPredict = async () => {
    const raw = (sentence + currentWord).trim();
    if (!raw) return;
    setIsPredicting(true);
    try {
      const predicted = await predictSentenceFromSignKeywords(raw);
      setSentence(predicted + ' ');
      setCurrentWord('');
      onTextUpdate?.(predicted);
    } catch (err) {
      console.error(err);
    }
    setIsPredicting(false);
  };

  const handleUseText = () => {
    const full = (sentence + currentWord).trim();
    onTextUpdate?.(full);
  };


  const handleSuggestionTap = (word) => {
    setSentence(prev => {
      const next = prev + word + ' ';
      onTextUpdate?.(next);
      return next;
    });
    setCurrentWord('');
    setConfirmedFlash(true);
    setTimeout(() => setConfirmedFlash(false), 400);
  };

  const displayText = sentence + currentWord;

  return (
    <div className="isl-panel">
      {/* Header */}
      <div className="isl-header">
        <div className="isl-header-left">
          <div className="isl-icon-box">✋</div>
          <div>
            <p className="isl-title">ISL Sign Language</p>
            <p className="isl-subtitle">Indian Sign Language · A–Z Recognition</p>
          </div>
        </div>
        <button
          className="isl-pause-btn"
          onClick={() => setIsPaused(p => !p)}
          type="button"
        >
          {isPaused ? '▶ Resume' : '⏸ Pause'}
        </button>
      </div>

      {/* Camera + Canvas */}
      <div className="isl-camera-frame">
        <video
          ref={videoRef}
          className="isl-video"
          autoPlay
          playsInline
          muted
        />

        <canvas
          ref={canvasRef}
          className="isl-canvas"
        />

        {/* Loading overlay */}
        {isInitializing && !error && (
          <div className="isl-overlay isl-overlay--loading">
            <div className="isl-spinner" />
            <p className="isl-overlay-title">Starting Camera…</p>
            <p className="isl-overlay-sub">ISL Gesture Engine loading in background</p>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="isl-overlay isl-overlay--error">
            <span className="isl-error-icon">⚠</span>
            <p className="isl-overlay-title">Camera Error</p>
            <p className="isl-overlay-sub">{error}</p>
          </div>
        )}

        {/* Paused overlay */}
        {isPaused && !isInitializing && !error && (
          <div className="isl-overlay isl-overlay--paused">
            <span className="isl-paused-icon">⏸</span>
            <p className="isl-overlay-title">Paused</p>
          </div>
        )}

        {/* Engine loading badge */}
        {!isInitializing && !error && !engineLoaded && (
          <div className="isl-badge isl-badge--loading">
            <span className="isl-badge-dot isl-badge-dot--pulse" />
            Loading ISL Engine…
          </div>
        )}

        {/* Live badge */}
        {!isInitializing && !error && engineLoaded && (
          <div className="isl-badge isl-badge--live">
            <span className={`isl-badge-dot ${isPaused ? 'isl-badge-dot--amber' : 'isl-badge-dot--violet isl-badge-dot--pulse'}`} />
            {isPaused ? 'Paused' : 'ISL Live'}
          </div>
        )}

        {/* Detected letter pill */}
        {detectedLetter && !isPaused && gestureResult?.handDetected && (
          <div className={`isl-letter-pill ${confirmedFlash ? 'isl-letter-pill--confirmed' : isConfirming ? 'isl-letter-pill--confirming' : ''}`}>
            <span className="isl-letter-char">{detectedLetter}</span>
            <span className="isl-letter-pct">
              {confirmedFlash ? 'Added!' : `${Math.round((gestureResult.confidence || 0) * 100)}%`}
            </span>
          </div>
        )}

        {/* No-hand hint */}
        {!gestureResult?.handDetected && !isInitializing && !error && !isPaused && engineLoaded && (
          <div className="isl-no-hand">
            ✋ Show your hand to the camera
          </div>
        )}

        {/* Hold progress bar */}
        {isConfirming && detectedLetter && (
          <div className="isl-hold-track">
            <div className="isl-hold-fill" style={{ width: `${holdProgress}%` }} />
          </div>
        )}
      </div>

      {/* Gesture hint */}
      {detectedLetter && detectedLetter !== '?' && ISL_HINTS[detectedLetter] && (
        <div className="isl-hint-row">
          <div className="isl-hint-letter">{detectedLetter}</div>
          <div className="isl-hint-text">
            <p className="isl-hint-desc">{ISL_HINTS[detectedLetter]}</p>
            <p className="isl-hint-sub">Hold gesture ~1.5s to confirm letter</p>
          </div>
          {/* Circular hold progress */}
          <svg className="isl-hold-circle" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(139,92,246,0.2)" strokeWidth="3"/>
            <circle
              cx="18" cy="18" r="15"
              fill="none"
              stroke="rgb(139,92,246)"
              strokeWidth="3"
              strokeDasharray={`${(holdProgress / 100) * 94.2} 94.2`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.1s' }}
            />
          </svg>
        </div>
      )}

      {/* Sentence Builder */}
      <div className="isl-builder">
        {/* Current word */}
        <div className="isl-building-word">
          <p className="isl-section-label">Building Word</p>
          <div className="isl-word-chars">
            {currentWord ? (
              <>
                {currentWord.split('').map((char, i) => (
                  <span
                    key={i}
                    className={`isl-char ${i === currentWord.length - 1 ? 'isl-char--last' : ''}`}
                  >
                    {char}
                  </span>
                ))}
                <span className="isl-cursor" />
              </>
            ) : (
              <span className="isl-placeholder">Sign letters to build a word…</span>
            )}
          </div>
        </div>

        {/* Autocomplete suggestions */}
        {suggestions.length > 0 && (
          <div className="isl-suggestions">
            <p className="isl-section-label">⚡ Suggestions</p>
            <div className="isl-suggestion-chips">
              {suggestions.map(word => (
                <button
                  key={word}
                  className="isl-chip"
                  onClick={() => handleSuggestionTap(word)}
                  type="button"
                >
                  <span className="isl-chip-match">{currentWord.toLowerCase()}</span>
                  <span className="isl-chip-rest">{word.slice(currentWord.length)}</span>
                  <span className="isl-chip-enter">↵</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Completed sentence */}
        {sentence && (
          <div className="isl-sentence">
            <p className="isl-section-label">Sentence</p>
            <p className="isl-sentence-text">{sentence}<span className="isl-cursor-blink">▌</span></p>
          </div>
        )}

        {/* Action buttons */}
        <div className="isl-actions">
          <button className="isl-action-btn" onClick={handleAddSpace} disabled={!currentWord} type="button">
            Space
          </button>
          <button className="isl-action-btn isl-action-btn--delete" onClick={handleDelete} disabled={!displayText} type="button">
            Delete
          </button>
          <button className="isl-action-btn isl-action-btn--clear" onClick={handleClear} disabled={!displayText} type="button">
            Clear
          </button>
          <button className="isl-action-btn isl-action-btn--use" onClick={handleUseText} disabled={!displayText} type="button">
            ✓ Use as Answer
          </button>
          <button
            className="isl-action-btn"
            style={{ background: 'var(--accent-purple-glow, #8b5cf615)', color: '#8b5cf6', borderColor: '#8b5cf6', fontWeight: 700 }}
            onClick={handleGroqPredict}
            disabled={!displayText || isPredicting}
            type="button"
          >
            {isPredicting ? '⚡ AI Predicting…' : '✨ Groq AI Expand Sentence'}
          </button>

        </div>
      </div>

      {/* ISL Alphabet Quick Reference */}
      <details className="isl-reference" open>
        <summary className="isl-reference-summary">ISL Alphabet & Quick Sign Keyboard (Tap any letter to add) ▾</summary>
        <div className="isl-alphabet-grid">
          {Object.entries(ISL_HINTS).map(([letter, hint]) => (
            <button
              key={letter}
              type="button"
              onClick={() => addLetter(letter)}
              className={`isl-alpha-cell ${detectedLetter === letter ? 'isl-alpha-cell--active' : ''}`}
              title={`${letter}: ${hint} (Click to add)`}
              style={{ cursor: 'pointer', background: detectedLetter === letter ? 'var(--accent-purple)' : undefined, color: detectedLetter === letter ? 'white' : undefined }}
            >
              <span className="isl-alpha-letter">{letter}</span>
              {detectedLetter === letter && <span className="isl-alpha-dot" />}
            </button>
          ))}
        </div>
      </details>

      {/* Instructions */}
      <div className="isl-instructions">
        <span className="isl-instructions-icon">💡</span>
        <p className="isl-instructions-text">
          Show ISL hand signs in front of the camera or tap letters above.{' '}
          <strong>Hold gestures for ~0.4s</strong> to auto-confirm letters.
          Click <strong>✨ Groq AI Expand Sentence</strong> to turn raw signs into full, fluent interview responses!
        </p>
      </div>

    </div>
  );
};

export default ISLSignLanguagePanel;
