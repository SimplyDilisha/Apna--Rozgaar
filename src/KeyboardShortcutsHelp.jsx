import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Keyboard, Home, Search, ArrowUp, Menu, HelpCircle } from 'lucide-react';

const shortcuts = [
  { keys: ['Tab'], description: 'Move to next interactive element' },
  { keys: ['Shift', 'Tab'], description: 'Move to previous interactive element' },
  { keys: ['Enter'], description: 'Activate button or link' },
  { keys: ['Space'], description: 'Toggle checkbox, activate button' },
  { keys: ['Escape'], description: 'Close modal, cancel action' },
  { keys: ['↑', '↓'], description: 'Navigate within menus and lists' },
  { keys: ['Home'], description: 'Go to start of page' },
  { keys: ['End'], description: 'Go to end of page' },
  { keys: ['?'], description: 'Open this help panel' },
  { keys: ['Alt', '/'], description: 'Open this help panel (alternative)' },
  { keys: ['Alt', '1'], description: 'Skip to main content' },
  { keys: ['Alt', 'M'], description: 'Open/close mobile menu' },
];

export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);
  const lastFocusedElement = useRef(null);

  // Handle global keyboard shortcuts
  const handleGlobalKeyDown = useCallback((e) => {
    // Open with ? or Alt+/
    if ((e.key === '?' && !e.ctrlKey && !e.metaKey) || 
        (e.key === '/' && e.altKey)) {
      // Don't trigger if user is typing in an input
      if (e.target.tagName === 'INPUT' || 
          e.target.tagName === 'TEXTAREA' || 
          e.target.isContentEditable) {
        return;
      }
      e.preventDefault();
      lastFocusedElement.current = document.activeElement;
      setIsOpen(true);
    }

    // Alt+1 to skip to main content
    if (e.key === '1' && e.altKey) {
      e.preventDefault();
      const main = document.getElementById('main-content');
      if (main) {
        main.focus();
        main.scrollIntoView({ behavior: 'smooth' });
      }
    }

    // Alt+M for mobile menu
    if (e.key === 'm' && e.altKey) {
      e.preventDefault();
      const menuButton = document.querySelector('[aria-controls="mobile-menu"]');
      if (menuButton) {
        menuButton.click();
      }
    }
  }, []);

  // Close on Escape
  const handlePanelKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }

    // Trap focus inside panel
    if (e.key === 'Tab' && panelRef.current) {
      const focusableElements = panelRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  // Focus management
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    } else if (!isOpen && lastFocusedElement.current) {
      lastFocusedElement.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="keyboard-help-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-help-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
      onKeyDown={handlePanelKeyDown}
    >
      <div 
        ref={panelRef}
        className="keyboard-help-panel"
        role="document"
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '24px'
        }}>
          <h2 id="keyboard-help-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Keyboard size={28} color="var(--accent-purple)" />
            Keyboard Shortcuts
          </h2>
          <button
            ref={closeButtonRef}
            onClick={() => setIsOpen(false)}
            aria-label="Close keyboard shortcuts help"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '44px',
              minHeight: '44px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          Navigate this site using only your keyboard. Press <kbd className="keyboard-key">Tab</kbd> to move between elements.
        </p>

        <div role="list" aria-label="Available keyboard shortcuts">
          {shortcuts.map((shortcut, index) => (
            <div 
              key={index}
              className="keyboard-shortcut-row"
              role="listitem"
            >
              <span style={{ color: 'var(--text-muted)' }}>
                {shortcut.description}
              </span>
              <span style={{ display: 'flex', gap: '4px' }}>
                {shortcut.keys.map((key, keyIndex) => (
                  <span key={keyIndex}>
                    <kbd className="keyboard-key">{key}</kbd>
                    {keyIndex < shortcut.keys.length - 1 && (
                      <span style={{ margin: '0 4px', color: 'var(--text-muted)' }}>+</span>
                    )}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>

        <div style={{ 
          marginTop: '24px', 
          padding: '16px',
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <HelpCircle size={20} color="var(--accent-teal)" />
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            <strong>Tip:</strong> Use <kbd className="keyboard-key">Shift</kbd> + <kbd className="keyboard-key">Tab</kbd> 
            together if your OS has Sticky Keys enabled, press them sequentially.
          </p>
        </div>

        <button
          onClick={() => setIsOpen(false)}
          style={{
            width: '100%',
            marginTop: '24px',
            padding: '14px',
            background: 'var(--primary-gradient)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '1rem',
            cursor: 'pointer',
            minHeight: '48px'
          }}
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
