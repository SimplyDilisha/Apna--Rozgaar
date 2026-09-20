import { useState, useEffect, useCallback } from 'react';
import { 
  Accessibility, MousePointer2, Keyboard, Target, Clock, 
  Focus, Pause, PointerOff, RotateCcw, X, ChevronUp
} from 'lucide-react';

const STORAGE_KEY = 'motor-a11y-settings';

const defaultSettings = {
  largeCursor: false,
  stickyKeysMode: false,
  bigTargets: false,
  slowHover: false,
  keyboardHighlight: false,
  reduceMotion: false,
  singleClickMode: false,
  focusMode: false,
};

export default function MotorAccessibilityToolbar({ embedded = false }) {
  const [isOpen, setIsOpen] = useState(embedded ? true : false);
  const [settings, setSettings] = useState(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (e) {
        console.error('Failed to parse motor accessibility settings');
      }
    }
  }, []);

  // Apply settings to document
  useEffect(() => {
    const html = document.documentElement;
    
    // Large Cursor
    html.classList.toggle('large-cursor', settings.largeCursor);
    
    // Big Targets
    html.classList.toggle('big-targets', settings.bigTargets);
    
    // Slow Hover
    html.classList.toggle('slow-hover', settings.slowHover);
    
    // Keyboard Highlight
    html.classList.toggle('keyboard-highlight', settings.keyboardHighlight);
    
    // Reduce Motion
    html.classList.toggle('reduce-motion', settings.reduceMotion);

    // Focus Mode
    html.classList.toggle('focus-mode', settings.focusMode);

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    document.dispatchEvent(new CustomEvent('motor-a11y-settings-change', { detail: settings }));
  }, [settings]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const resetAll = () => {
    setSettings(defaultSettings);
    localStorage.removeItem(STORAGE_KEY);
  };

  const options = [
     {
      key: 'focusMode',
      label: 'Focus Mode',
      description: 'Blurs surrounding content and spotlights the active area',
      icon: Focus,
    },
    {
      key: 'largeCursor',
      label: 'Large Cursor',
      description: 'Shows a larger, more visible cursor',
      icon: MousePointer2,
    },
    {
      key: 'stickyKeysMode',
      label: 'Sticky Keys Hint',
      description: 'Shows indicator for sequential key presses',
      icon: Keyboard,
    },
    {
      key: 'bigTargets',
      label: 'Bigger Click Targets',
      description: 'Increases size of all buttons and links',
      icon: Target,
    },
    {
      key: 'slowHover',
      label: 'Slow Hover Delay',
      description: 'Prevents accidental hover triggers',
      icon: Clock,
    },
    {
      key: 'keyboardHighlight',
      label: 'Focus Highlight',
      description: 'Adds pulsing highlight to focused element',
      icon: Focus,
    },
    {
      key: 'reduceMotion',
      label: 'Reduce Motion',
      description: 'Disables all animations and transitions',
      icon: Pause,
    },
    {
      key: 'singleClickMode',
      label: 'Single Click Mode',
      description: 'Converts double-clicks to single clicks',
      icon: PointerOff,
    },
   
  ];

  return (
    <>
      {/* Sticky Keys Badge */}
      {settings.stickyKeysMode && (
        <div 
          className="sticky-keys-badge" 
          role="status" 
          aria-live="polite"
        >
          ⌨️ Sticky Keys Mode Active
        </div>
      )}

      {/* Main Toolbar */}
      <div 
        className={embedded ? "motor-a11y-toolbar-embedded" : "motor-a11y-toolbar"}
        role="region"
        aria-label="Motor Accessibility Toolbar"
      >
        {/* Toggle Button */}
        {!embedded && (
          <button
            className="motor-a11y-toggle-btn"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-controls="motor-a11y-panel"
            aria-label={isOpen ? 'Close accessibility toolbar' : 'Open accessibility toolbar'}
            title="Motor Accessibility Options"
          >
            {isOpen ? <X size={24} /> : <Accessibility size={24} />}
          </button>
        )}

        {/* Panel */}
        {isOpen && (
          <div 
            id="motor-a11y-panel"
            className={embedded ? "motor-a11y-panel-embedded" : "motor-a11y-panel"}
            role="dialog"
            aria-label="Motor Accessibility Options"
            style={embedded ? {
              width: '100%',
              background: 'var(--card-bg)',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              boxShadow: 'none'
            } : {}}
          >
            <div className="motor-a11y-panel-header">
              <h3 id="motor-a11y-title">
                <Accessibility size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Motor Accessibility
              </h3>
              <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: '0.85rem' }}>
                Customize for easier navigation
              </p>
            </div>

            <div className="motor-a11y-panel-content" role="group" aria-labelledby="motor-a11y-title">
              {options.map((option) => {
                const Icon = option.icon;
                const isActive = settings[option.key];
                
                return (
                  <div 
                    key={option.key}
                    className="motor-a11y-option"
                  >
                    <label 
                      className="motor-a11y-option-label"
                      htmlFor={`a11y-${option.key}`}
                      style={{ flex: 1, cursor: 'pointer' }}
                    >
                      <span className="motor-a11y-option-icon">
                        <Icon size={18} />
                      </span>
                      <span>
                        <span style={{ display: 'block' }}>{option.label}</span>
                        <span style={{ 
                          fontSize: '0.8rem', 
                          color: 'var(--text-muted)',
                          display: 'block',
                          marginTop: '2px'
                        }}>
                          {option.description}
                        </span>
                      </span>
                    </label>
                    <input
                      id={`a11y-${option.key}`}
                      type="checkbox"
                      role="switch"
                      checked={isActive}
                      onChange={() => toggleSetting(option.key)}
                      aria-pressed={isActive}
                      aria-label={`${option.label}: ${isActive ? 'On' : 'Off'}`}
                    />
                  </div>
                );
              })}

              {/* Reset Button */}
              <button
                className="motor-a11y-reset-btn"
                onClick={resetAll}
                type="button"
              >
                <RotateCcw size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Reset All Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
