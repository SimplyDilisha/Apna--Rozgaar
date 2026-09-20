import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Accessibility, X, Keyboard } from 'lucide-react';
import ScreenReader from './ScreenReader';
import VoiceControl from './VoiceControl';
import MotorAccessibilityToolbar from './MotorAccessibilityToolbar';

export default function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const triggerKeyboardShortcuts = () => {
    const event = new KeyboardEvent('keydown', { key: '?', bubbles: true });
    document.dispatchEvent(event);
  };

  React.useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    document.addEventListener('toggle-accessibility-menu', handleToggle);
    return () => document.removeEventListener('toggle-accessibility-menu', handleToggle);
  }, []);

  return (
    <div style={{ position: 'fixed', right: '24px', bottom: '10px', zIndex: 9999 }}>
      {/* Floating Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        style={{
          width: '48px', height: '48px', borderRadius: '50%',
          background: 'var(--primary-gradient)', color: 'white',
          border: 'none', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 12px 32px rgba(37, 99, 235, 0.45)',
          position: 'absolute', bottom: 0, right: 0, zIndex: 2
        }}
        aria-label="Toggle Accessibility Menu"
      >
        {isOpen ? <X size={36} /> : <Accessibility size={36} />}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'absolute',
              bottom: '85px',
              right: '0',
              width: '480px',
              maxHeight: '80vh',
              background: 'var(--card-bg)',
              borderRadius: '24px',
              boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 1,
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '24px', background: 'var(--primary-gradient)', color: 'white', flexShrink: 0 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.5rem' }}>
                <Accessibility size={32} /> Accessibility Menu
              </h3>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px', overflowY: 'auto' }}>
              <div>
                <ScreenReader embedded={true} />
              </div>
              <hr style={{ borderColor: 'var(--border)', margin: 0, opacity: 0.5 }} />
              <div>
                <VoiceControl embedded={true} />
              </div>
              <hr style={{ borderColor: 'var(--border)', margin: 0, opacity: 0.5 }} />
              <div>
                <MotorAccessibilityToolbar embedded={true} />
              </div>
              <hr style={{ borderColor: 'var(--border)', margin: 0, opacity: 0.5 }} />
              <div>
                <button
                  onClick={triggerKeyboardShortcuts}
                  style={{
                    width: '100%',
                    padding: '20px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  <Keyboard size={24} /> Show Keyboard Shortcuts
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
