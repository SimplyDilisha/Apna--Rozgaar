import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { generateInterviewQuestions, transcribeAudio, evaluateAnswer } from '../services/groqService';
import { confidenceEngine } from '../services/confidenceEngine';
import ISLSignLanguagePanel from '../components/ISLSignLanguagePanel';
import './InterviewPracticeSession.css';

const TOTAL_QUESTIONS = 10;

const ROLE_LABELS = {
  'frontend-developer': 'Frontend Developer',
  'backend-developer': 'Backend Developer',
  'data-analyst': 'Data Analyst',
  'content-writer': 'Content Writer',
  'graphic-designer': 'Graphic Designer',
};

const LEVEL_LABELS = {
  entry: 'Entry Level',
  mid: 'Mid-Level',
  senior: 'Senior / Lead',
};

const QuestionSkeleton = () => (
  <div className="session-skeleton" aria-busy="true" aria-label="Loading questions...">
    <div className="session-skeleton-label" />
    <div className="session-skeleton-line session-skeleton-line--lg" />
    <div className="session-skeleton-line session-skeleton-line--md" />
    <div className="session-skeleton-line session-skeleton-line--sm" />
    <p className="session-loading-note">
      <span className="material-symbols-outlined session-spin-icon">autorenew</span>
      Groq AI is generating your personalised questions…
    </p>
  </div>
);

const InterviewPracticeSession = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const role = searchParams.get('role') || 'frontend-developer';
  const level = searchParams.get('level') || 'mid';
  const roleLabel = ROLE_LABELS[role] || 'Frontend Developer';
  const levelLabel = LEVEL_LABELS[level] || 'Mid-Level';

  // ── Question state ──────────────────────────────────────────────────────────
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);

  // ── Tab / UI state ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('video');
  const [showSignLanguage, setShowSignLanguage] = useState(false);
  const [textAnswer, setTextAnswer] = useState('');

  // ── Confidence engine state ─────────────────────────────────────────────────
  const [metrics, setMetrics] = useState(null);         // { eyeContact, posture, stability, total }
  const [engineReady, setEngineReady] = useState(false);
  const [engineError, setEngineError] = useState(false);
  const [webcamAvailable, setWebcamAvailable] = useState(true);

  // ── Audio recording state ───────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevels, setAudioLevels] = useState(new Array(20).fill(0));
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [liveCaption, setLiveCaption] = useState('Click the record button to start your answer…');

  // ── Answer evaluation state ────────────────────────────────────────────────
  const [evaluation, setEvaluation] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // ── Refs ────────────────────────────────────────────────────────────────────
  const videoRef = useRef(null);
  const videoStreamRef = useRef(null);
  const rafRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const timerRef = useRef(null);
  const animFrameRef = useRef(null);

  // ── Load Groq questions ─────────────────────────────────────────────────────
  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const qs = await generateInterviewQuestions(role, level, TOTAL_QUESTIONS);
      setQuestions(qs);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [role, level]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const totalQ = questions.length || TOTAL_QUESTIONS;
  const progress = Math.round(((questionIndex + 1) / totalQ) * 100);
  const currentQuestion = questions[questionIndex] || '';

  const handleNextQuestion = () => {
    if (questionIndex < totalQ - 1) {
      setQuestionIndex((p) => p + 1);
      setTextAnswer('');
      setEvaluation(null);
      setLiveCaption('Click the record button to start your answer…');
    }
  };

  const handlePrevQuestion = () => {
    if (questionIndex > 0) {
      setQuestionIndex((p) => p - 1);
      setTextAnswer('');
      setEvaluation(null);
      setLiveCaption('Click the record button to start your answer…');
    }
  };

  // ── Initialise MediaPipe confidence engine + webcam (Video tab only) ────────
  useEffect(() => {
    if (activeTab !== 'video') return;
    let mounted = true;

    const init = async () => {
      // Start webcam with BOTH video and audio enabled to ask permissions at once
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, frameRate: { ideal: 30 } },
          audio: true,
        });
        if (!mounted) { stream.getTracks().forEach((t) => t.stop()); return; }
        videoStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setWebcamAvailable(true);
      } catch (err) {
        console.warn('Webcam + Audio combined capture failed, trying video only:', err);
        // Fallback to video only if mic is blocked or unavailable
        try {
          const videoOnlyStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, frameRate: { ideal: 30 } },
          });
          if (!mounted) { videoOnlyStream.getTracks().forEach((t) => t.stop()); return; }
          videoStreamRef.current = videoOnlyStream;
          if (videoRef.current) {
            videoRef.current.srcObject = videoOnlyStream;
            await videoRef.current.play().catch(() => {});
          }
          setWebcamAvailable(true);
        } catch {
          if (mounted) setWebcamAvailable(false);
          return;
        }
      }

      // ── Camera is up — mark engine ready immediately so UI unlocks ─────────
      // MediaPipe loads in the background; processFrame() handles simulated mode
      if (mounted) setEngineReady(true);

      // Start analysis loop right away (processFrame returns null until initialized)
      const loop = () => {
        if (!mounted || !videoRef.current) return;
        const result = confidenceEngine.processFrame(videoRef.current, performance.now());
        if (result && mounted) setMetrics(result);
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);

      // Load MediaPipe models in the background (non-blocking)
      confidenceEngine.initialize().catch((err) => {
        console.warn('Background confidence engine init failed (simulated mode active):', err.message);
      });
    }; // end of init()

    init();

    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((t) => t.stop());
        videoStreamRef.current = null;
      }
    };
  }, [activeTab]);

  // ── Audio Recording ─────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      // Reuse the existing active stream if audio track is present
      let stream = videoStreamRef.current;
      const hasAudioTrack = stream && stream.getAudioTracks().length > 0;

      if (!hasAudioTrack) {
        // Fallback: request mic access if stream wasn't initialized or has no audio
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Waveform visualiser
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        // Stop the temporary mic stream if it wasn't the shared video stream
        if (!hasAudioTrack) {
          stream.getTracks().forEach((t) => t.stop());
        }
        
        try {
          audioCtx.close();
        } catch (err) {
          console.error(err);
        }

        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        // Send to Groq Whisper for transcription
        setTranscribing(true);
        try {
          const text = await transcribeAudio(blob);
          if (text) {
            setTextAnswer((prev) => prev ? prev + ' ' + text : text);
            setLiveCaption(text);
          }
        } catch (err) {
          console.error('Transcription failed:', err);
          setLiveCaption('Transcription failed. Please type your answer instead.');
        } finally {
          setTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);

      // Live waveform bars
      const updateLevels = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        setAudioLevels(Array.from(data.slice(0, 20)).map((v) => v / 255));
        animFrameRef.current = requestAnimationFrame(updateLevels);
      };
      updateLevels();
    } catch (err) {
      console.error('Microphone error:', err);
      alert('Could not access microphone. Please check permissions.');
      setIsRecording(false);
      setTranscribing(false);
    }
  };


  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setAudioLevels(new Array(20).fill(0));
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ── AI Answer Evaluation ────────────────────────────────────────────────────
  const handleSubmitAnswer = async () => {
    if (!textAnswer.trim()) return;
    setIsEvaluating(true);
    setEvaluation(null);
    try {
      const result = await evaluateAnswer(currentQuestion, textAnswer, roleLabel);
      setEvaluation(result);
    } catch (err) {
      console.error('Evaluation failed:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const getConfidenceColor = (score) => {
    if (score >= 75) return '#22c55e'; // green
    if (score >= 45) return '#f59e0b'; // amber
    return '#ef4444';                  // red
  };

  const getConfidenceLabel = (score) => {
    if (score >= 75) return 'Confident';
    if (score >= 45) return 'Neutral';
    return 'Low';
  };

  return (
    <div className="session-page-shell">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="session-topbar">
        <div className="session-topbar-inner">
          <div className="session-topbar-left">
            <h1>Interview Prep Buddy</h1>
            <div className="session-role-badge">
              <span className="material-symbols-outlined" aria-hidden="true">work</span>
              <span>{roleLabel}</span>
              <span className="session-role-divider" aria-hidden="true">·</span>
              <span>{levelLabel}</span>
            </div>
          </div>
          <div className="session-topbar-actions">
            <button aria-label="Accessibility Settings" className="focus-ring session-icon-btn" type="button">
              <span className="material-symbols-outlined">settings_accessibility</span>
            </button>
            <button
              className="focus-ring session-exit-btn"
              onClick={() => navigate('/interview-prep')}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
              <span className="session-exit-label">Exit Session</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main grid ───────────────────────────────────────────────────── */}
      <main className="session-main-grid">
        {/* ── Left column ── */}
        <section className="session-left-col">

          {/* Question card */}
          <div className="session-question-card ambient-shadow">
            <div className="session-question-strip" />
            {isLoading ? (
              <QuestionSkeleton />
            ) : loadError ? (
              <div className="session-error-state">
                <span className="material-symbols-outlined session-error-icon">error_outline</span>
                <p>Couldn&apos;t load questions.</p>
                <button className="focus-ring session-retry-btn" onClick={loadQuestions} type="button">
                  <span className="material-symbols-outlined">refresh</span> Retry
                </button>
              </div>
            ) : (
              <>
                <h2>Question {questionIndex + 1} of {totalQ}</h2>
                <p>&quot;{currentQuestion}&quot;</p>
                <div className="session-question-actions">
                  <button
                    className={`focus-ring session-secondary-btn ${showSignLanguage ? 'session-sign-active' : ''}`}
                    onClick={() => setShowSignLanguage((p) => !p)}
                    type="button"
                  >
                    <span className="material-symbols-outlined">sign_language</span>
                    <span className="session-sign-label">Sign Language</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Sign language panel */}
          {showSignLanguage && !isLoading && (
            <div className="session-sign-video ambient-shadow" id="sign-lang-video">
              <div className="session-sign-overlay">
                <div className="session-sign-image" role="img" aria-label="ASL interpreter" />
              </div>
              <div className="session-sign-tag">ASL Interpreter</div>
            </div>
          )}

          {/* Progress */}
          <div className="session-progress-card">
            <div className="session-progress-head">
              <span>Session Progress</span>
              <strong>{isLoading ? '—' : `${progress}%`}</strong>
            </div>
            <div className="session-progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="session-progress-fill" style={{ width: isLoading ? '0%' : `${progress}%` }} />
            </div>
            {!isLoading && questions.length > 0 && (
              <div className="session-q-nav" aria-label="Question navigation">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    className={`session-q-dot${i === questionIndex ? ' session-q-dot-active' : ''}${i < questionIndex ? ' session-q-dot-done' : ''}`}
                    onClick={() => { setQuestionIndex(i); setTextAnswer(''); setEvaluation(null); }}
                    aria-label={`Go to question ${i + 1}`}
                    type="button"
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Right column ── */}
        <section className="session-right-col ambient-shadow">
          <div className="session-tabs" role="tablist">
            <button
              className={`focus-ring session-tab-btn ${activeTab === 'video' ? 'session-tab-active' : ''}`}
              onClick={() => setActiveTab('video')}
              role="tab"
              aria-selected={activeTab === 'video'}
              type="button"
            >
              <span className="material-symbols-outlined">videocam</span>
              Live Capture & Confidence
            </button>
            <button
              className={`focus-ring session-tab-btn ${activeTab === 'text' ? 'session-tab-active' : ''}`}
              onClick={() => setActiveTab('text')}
              role="tab"
              aria-selected={activeTab === 'text'}
              type="button"
            >
              <span className="material-symbols-outlined">edit_note</span>
              Text Input
            </button>
            <button
              className={`focus-ring session-tab-btn ${activeTab === 'isl' ? 'session-tab-active' : ''}`}
              onClick={() => setActiveTab('isl')}
              role="tab"
              aria-selected={activeTab === 'isl'}
              type="button"
            >
              <span className="material-symbols-outlined">sign_language</span>
              Sign Language
            </button>
          </div>

          <div className="session-panel-content">
            {/* ── Video Tab ─── */}
            {activeTab === 'video' && (
              <div className="session-video-panel" role="tabpanel">
                {/* Live camera frame */}
                <div className="session-video-frame">
                  {webcamAvailable ? (
                    <video
                      ref={videoRef}
                      className="session-video-element"
                      muted
                      playsInline
                      aria-label="Live camera stream"
                    />
                  ) : (
                    <div className="session-video-image" role="img" aria-label="Camera unavailable" />
                  )}

                  {/* Top-left: Active status indicator */}
                  <div className="session-rec-indicator">
                    <span className="session-rec-dot" aria-hidden="true" style={{ background: isRecording ? '#ef4444' : '#22c55e' }} />
                    <span>{isRecording ? 'Recording Answer' : 'Camera Feed Live'}</span>
                  </div>

                  {/* Initialising overlay */}
                  {webcamAvailable && !engineReady && !engineError && (
                    <div className="session-engine-overlay">
                      <div className="session-engine-spinner" />
                      <p>Loading AI confidence models…</p>
                    </div>
                  )}

                  {engineError && (
                    <div className="session-engine-overlay session-engine-error">
                      <span className="material-symbols-outlined">error_outline</span>
                      <p>Confidence engine failed to load</p>
                    </div>
                  )}

                  {/* Live confidence HUD overlay */}
                  {engineReady && metrics && (
                    <div className="session-confidence-hud">
                      <div className="session-hud-score-row">
                        <span className="session-hud-label">Live Confidence</span>
                        <span
                          className="session-hud-score"
                          style={{ color: getConfidenceColor(metrics.total) }}
                        >
                          {metrics.total}%
                        </span>
                        <span
                          className="session-hud-badge-label"
                          style={{ background: getConfidenceColor(metrics.total) + '22', color: getConfidenceColor(metrics.total), border: `1px solid ${getConfidenceColor(metrics.total)}44` }}
                        >
                          {getConfidenceLabel(metrics.total)}
                        </span>
                      </div>
                      <div className="session-hud-meter-track">
                        <div
                          className="session-hud-meter-fill"
                          style={{ width: `${metrics.total}%`, background: getConfidenceColor(metrics.total) }}
                        />
                      </div>
                      <div className="session-hud-sub-metrics">
                        <div className="session-hud-sub">
                          <span>👁 Eye Contact</span>
                          <strong>{metrics.eyeContact}%</strong>
                        </div>
                        <div className="session-hud-sub">
                          <span>🧍 Posture</span>
                          <strong>{metrics.posture}%</strong>
                        </div>
                        <div className="session-hud-sub">
                          <span>⚖ Stability</span>
                          <strong>{metrics.stability}%</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Live caption bar */}
                  <div className="session-live-caption">
                    &quot;{liveCaption}&quot;
                  </div>
                </div>

                {/* Recording controls */}
                <div className="session-video-controls">
                  <button
                    className="focus-ring session-control-btn"
                    onClick={handlePrevQuestion}
                    disabled={questionIndex === 0 || isLoading}
                    type="button"
                  >
                    <span className="material-symbols-outlined">arrow_back</span>
                    <span>Previous</span>
                  </button>
                  <button
                    className={`focus-ring session-control-btn ${isRecording ? 'session-recording recording-pulse' : 'session-paused'}`}
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={transcribing || isEvaluating}
                    type="button"
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                  >
                    <span className="material-symbols-outlined">{isRecording ? 'stop_circle' : 'mic'}</span>
                    <span>{isRecording ? `${formatTime(recordingTime)} Stop` : 'Record Answer'}</span>
                  </button>
                  <button
                    className="focus-ring session-control-btn session-next-btn"
                    onClick={handleNextQuestion}
                    disabled={isLoading || questionIndex === totalQ - 1}
                    type="button"
                  >
                    <span className="material-symbols-outlined">arrow_forward</span>
                    <span>Next</span>
                  </button>
                </div>

                {/* Waveform visualiser while recording */}
                {isRecording && (
                  <div className="session-waveform" aria-label="Audio waveform">
                    {audioLevels.map((level, i) => (
                      <div
                        key={i}
                        className="session-wave-bar"
                        style={{ height: `${Math.max(6, level * 48)}px` }}
                      />
                    ))}
                  </div>
                )}

                {transcribing && (
                  <p className="session-transcribing-note">
                    <span className="material-symbols-outlined session-spin-icon">autorenew</span>
                    Transcribing your answer with Groq Whisper…
                  </p>
                )}

                {/* Analyze Answer Button for Video Tab */}
                {textAnswer.trim() && !isRecording && !transcribing && (
                  <div className="session-video-analyze-row">
                    <button
                      className="focus-ring session-secondary-solid"
                      onClick={handleSubmitAnswer}
                      disabled={isEvaluating}
                      type="button"
                      style={{ width: '100%', minHeight: '52px' }}
                    >
                      <span className="material-symbols-outlined">
                        {isEvaluating ? 'hourglass_top' : 'analytics'}
                      </span>
                      {isEvaluating ? 'AI Analyzing Answer…' : 'Analyze Spoken Answer'}
                    </button>
                  </div>
                )}

                {/* AI Evaluation card on Video Tab */}
                {evaluation && !isRecording && (
                  <EvaluationCard evaluation={evaluation} getScoreColor={getConfidenceColor} />
                )}
              </div>
            )}

            {/* ── Text Tab ── */}
            {activeTab === 'text' && (
              <div className="session-text-panel" role="tabpanel">
                <div className="session-text-group">
                  <label htmlFor="response-text">Your Response</label>
                  {isLoading ? (
                    <div className="session-textarea-skeleton" aria-hidden="true" />
                  ) : (
                    <textarea
                      className="focus-ring"
                      id="response-text"
                      placeholder="Type your answer here, or switch to the 'Live Capture' tab to record your voice…"
                      value={textAnswer}
                      onChange={(e) => setTextAnswer(e.target.value)}
                    />
                  )}
                  <p>Tip: Use the STAR method — Situation, Task, Action, Result.</p>
                </div>

                <div className="session-text-actions">
                  <button
                    className="focus-ring session-secondary-solid"
                    onClick={handleSubmitAnswer}
                    disabled={!textAnswer.trim() || isEvaluating || isLoading}
                    type="button"
                  >
                    <span className="material-symbols-outlined">
                      {isEvaluating ? 'hourglass_top' : 'analytics'}
                    </span>
                    {isEvaluating ? 'AI Analyzing Answer…' : 'Analyze Typed Answer'}
                  </button>
                  <button
                    className="focus-ring session-primary-btn-large"
                    onClick={handleNextQuestion}
                    disabled={isLoading || questionIndex === totalQ - 1}
                    type="button"
                  >
                    Next Question
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>

                {/* AI Evaluation card on Text Tab */}
                {evaluation && (
                  <EvaluationCard evaluation={evaluation} getScoreColor={getConfidenceColor} />
                )}
              </div>
            )}

            {/* ── ISL Sign Language Tab ── */}
            {activeTab === 'isl' && (
              <div className="session-isl-panel" role="tabpanel">
                <ISLSignLanguagePanel
                  onTextUpdate={(text) => setTextAnswer(text)}
                  existingVideoStream={videoStreamRef.current}
                />

                {textAnswer.trim() && (
                  <div className="session-video-analyze-row" style={{ marginTop: 16 }}>
                    <button
                      className="focus-ring session-secondary-solid"
                      onClick={handleSubmitAnswer}
                      disabled={isEvaluating}
                      type="button"
                      style={{ width: '100%', minHeight: '52px' }}
                    >
                      <span className="material-symbols-outlined">
                        {isEvaluating ? 'hourglass_top' : 'analytics'}
                      </span>
                      {isEvaluating ? 'AI Analyzing Answer…' : 'Analyze Sign Language Answer'}
                    </button>
                  </div>
                )}

                {evaluation && (
                  <EvaluationCard evaluation={evaluation} getScoreColor={getConfidenceColor} />
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="session-footer">
        <div className="session-footer-inner">
          <span>© 2024 Interview Prep Buddy. Built for accessibility.</span>
          <nav>
            <a className="focus-ring" href="#">Support</a>
            <a className="focus-ring" href="#">Transcript Downloads</a>
            <a className="focus-ring" href="#">Privacy Policy</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};

// ── Shared Subcomponent: Evaluation Results Card ─────────────────────────────
const EvaluationCard = ({ evaluation, getScoreColor }) => {
  return (
    <div className="session-eval-card animate-fade-in">
      {/* Score */}
      <div className="session-eval-score-row">
        <span className="session-eval-label">Answer Evaluation Score</span>
        <span
          className="session-eval-score"
          style={{ color: getScoreColor(evaluation.confidenceScore) }}
        >
          {evaluation.confidenceScore}%
        </span>
        <span
          className="session-eval-level"
          style={{
            background: getScoreColor(evaluation.confidenceScore) + '22',
            color: getScoreColor(evaluation.confidenceScore),
          }}
        >
          {evaluation.confidenceLevel}
        </span>
      </div>

      {/* Feedback */}
      <div className="session-eval-section">
        <h4>
          <span className="material-symbols-outlined">comment</span>
          Interviewer Feedback
        </h4>
        <p>{evaluation.feedback}</p>
      </div>

      {/* Missing elements */}
      {evaluation.missingElements.length > 0 && (
        <div className="session-eval-section">
          <h4>
            <span className="material-symbols-outlined">playlist_remove</span>
            What Was Missing
          </h4>
          <div className="session-eval-tags">
            {evaluation.missingElements.map((el, i) => (
              <span key={i} className="session-eval-tag">{el}</span>
            ))}
          </div>
        </div>
      )}

      {/* Strong answer */}
      <div className="session-eval-section session-eval-strong">
        <h4>
          <span className="material-symbols-outlined">star</span>
          Strong Candidate Answer
        </h4>
        <p>{evaluation.strongAnswer}</p>
      </div>
    </div>
  );
};

export default InterviewPracticeSession;