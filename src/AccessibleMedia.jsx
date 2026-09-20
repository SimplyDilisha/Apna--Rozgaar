/**
 * AccessibleMedia Component
 * 
 * A fully accessible video/audio player component designed for Deaf/HoH users.
 * Features:
 * - Closed captions with customizable styling
 * - Full transcript toggle and display
 * - Downloadable transcript option
 * - Visual sound indicators
 * - Keyboard accessible controls
 * - Sign language video overlay support
 * - No auto-play audio (user-initiated only)
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, 
  FileText, Download, Settings 
} from 'lucide-react';

// Sample caption data structure
const sampleCaptions = [
  { start: 0, end: 3, text: "Welcome to ApnaRozgaar, India's most inclusive job platform." },
  { start: 3, end: 6, text: "We connect talented professionals with disabilities to accessible employment." },
  { start: 6, end: 10, text: "Our platform supports screen readers, sign language, and text-based communication." },
  { start: 10, end: 14, text: "Create your profile today and discover opportunities that match your skills." }
];

export default function AccessibleMedia({ 
  src,
  type = 'video',
  poster,
  captions = sampleCaptions,
  signLanguageOverlay = null,
  title = 'Media content',
  description = ''
}) {
  const mediaRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showCaptions, setShowCaptions] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [captionStyle, setCaptionStyle] = useState('default');
  const [currentCaption, setCurrentCaption] = useState('');
  const [showSignLanguage, setShowSignLanguage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const caption = captions.find(
      c => currentTime >= c.start && currentTime < c.end
    );
    setCurrentCaption(caption ? caption.text : '');
  }, [currentTime, captions]);

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (mediaRef.current) {
      mediaRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const generateTranscriptText = () => {
    let text = `Transcript: ${title}\n\n`;
    captions.forEach(c => {
      text += `[${formatTime(c.start)}] ${c.text}\n`;
    });
    return text;
  };

  const downloadTranscript = () => {
    const text = generateTranscriptText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '-').toLowerCase()}-transcript.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const seekToTime = (time) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  return (
    <div className="accessible-media-wrapper" style={{ marginBottom: '24px' }}>
      <div className="sr-only">
        <p>{title}</p>
        {description && <p>{description}</p>}
        <p>This {type} has captions and a full transcript available.</p>
      </div>

      <div 
        className="accessible-media-container"
        style={{
          position: 'relative',
          borderRadius: '16px',
          overflow: 'hidden',
          background: '#000',
          aspectRatio: type === 'video' ? '16/9' : 'auto'
        }}
      >
        {type === 'video' ? (
          <video
            ref={mediaRef}
            src={src}
            poster={poster}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            muted={isMuted}
            playsInline
            style={{ width: '100%', display: 'block' }}
            aria-label={title}
          >
            <track kind="captions" src="" label="English" default />
            Your browser does not support the video element.
          </video>
        ) : (
          <div style={{ padding: '40px', background: '#1a1a2e' }}>
            <audio
              ref={mediaRef}
              src={src}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              muted={isMuted}
              aria-label={title}
            />
            <div style={{ textAlign: 'center', color: 'white' }}>
              <Volume2 size={48} style={{ opacity: 0.5 }} aria-hidden="true" />
              <p style={{ marginTop: '12px', fontSize: '1.1rem' }}>{title}</p>
            </div>
          </div>
        )}

        {signLanguageOverlay && showSignLanguage && (
          <div style={{
            position: 'absolute',
            bottom: '80px',
            right: '12px',
            width: '200px',
            aspectRatio: '4/3',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '2px solid white',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <video
              src={signLanguageOverlay}
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              aria-label="Sign language interpretation"
            />
          </div>
        )}

        {showCaptions && currentCaption && (
          <div 
            className="captions-display"
            style={{
              position: 'absolute',
              bottom: '70px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              maxWidth: '80%'
            }}
          >
            <div 
              className={`caption-container ${captionStyle === 'high-visibility' ? 'high-visibility' : ''}`}
              role="status"
              aria-live="polite"
            >
              {currentCaption}
            </div>
          </div>
        )}

          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white'
            }}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <span style={{ color: 'white', fontSize: '0.9rem', minWidth: '90px' }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => seekToTime(Number(e.target.value))}
            aria-label="Seek position"
            style={{
              flex: 1,
              height: '6px',
              borderRadius: '3px',
              cursor: 'pointer',
              accentColor: 'var(--accent-purple)'
            }}
          />

          <button
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute (currently muted)' : 'Mute (currently playing audio)'}
            title={isMuted ? 'Sound is off' : 'Sound is on'}
            style={{
              background: isMuted ? 'rgba(220, 38, 38, 0.3)' : 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              color: 'white',
              fontSize: '0.75rem'
            }}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            <span>{isMuted ? 'Sound OFF' : 'Sound ON'}</span>
          </button>

          <button
            onClick={() => setShowCaptions(!showCaptions)}
            aria-label={showCaptions ? 'Hide captions' : 'Show captions'}
            aria-pressed={showCaptions}
            style={{
              background: showCaptions ? 'var(--accent-purple)' : 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              color: 'white',
              fontSize: '0.75rem'
            }}
          >
            CC
          </button>

          {signLanguageOverlay && (
            <button
              onClick={() => setShowSignLanguage(!showSignLanguage)}
              aria-label={showSignLanguage ? 'Hide sign language' : 'Show sign language interpretation'}
              aria-pressed={showSignLanguage}
              title="Sign Language Interpretation"
              style={{
                background: showSignLanguage ? 'var(--accent-teal)' : 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: '700'
              }}
            >
              🤟
            </button>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            aria-label="Caption settings"
            aria-expanded={showSettings}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white'
            }}
          >
            <Settings size={18} />
          </button>
        </div>

        {showSettings && (
          <div style={{
            position: 'absolute',
            bottom: '70px',
            right: '12px',
            background: 'rgba(0,0,0,0.95)',
            borderRadius: '12px',
            padding: '16px',
            minWidth: '200px',
            color: 'white',
            zIndex: 20
          }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem' }}>Caption Style</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="captionStyle"
                  checked={captionStyle === 'default'}
                  onChange={() => setCaptionStyle('default')}
                />
                Default (White on dark)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="captionStyle"
                  checked={captionStyle === 'high-visibility'}
                  onChange={() => setCaptionStyle('high-visibility')}
                />
                High Visibility (Yellow on black)
              </label>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          aria-expanded={showTranscript}
          aria-controls="transcript-panel"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            background: showTranscript ? 'var(--accent-purple)' : 'var(--bg-secondary)',
            color: showTranscript ? 'white' : 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.95rem'
          }}
        >
          <FileText size={18} />
          {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
        </button>

        <button
          onClick={downloadTranscript}
          aria-label="Download transcript as text file"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.95rem'
          }}
        >
          <Download size={18} />
          Download Transcript (.txt)
        </button>
      </div>

      {showTranscript && (
        <div 
          id="transcript-panel"
          className="transcript-panel"
          role="region"
          aria-label="Video transcript"
        >
          <h3>
            <FileText size={20} aria-hidden="true" />
            Full Transcript
          </h3>
          {captions.map((caption, index) => (
            <p key={index}>
              <button
                onClick={() => seekToTime(caption.start)}
                className="timestamp"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--accent-purple)',
                  fontWeight: '600',
                  padding: 0
                }}
                aria-label={`Jump to ${formatTime(caption.start)}`}
              >
                [{formatTime(caption.start)}]
              </button>
              {caption.text}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
