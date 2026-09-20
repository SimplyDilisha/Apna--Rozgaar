import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie } from 'lucide-react';
import { AccessibleButton } from './AccessibleButton';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="card glass"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '24px',
            width: 'calc(100% - 48px)',
            maxWidth: '400px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              padding: '10px', 
              background: 'var(--bg-secondary)', 
              borderRadius: '12px', 
              color: 'var(--accent-purple)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              <Cookie size={24} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 700 }}>
              Privacy & Cookies
            </h3>
          </div>
          
          <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic securely.
          </p>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <AccessibleButton 
              variant="outline" 
              onClick={handleDecline}
              style={{ flex: 1, minHeight: '44px', fontSize: '0.95rem', padding: '0' }}
            >
              Decline
            </AccessibleButton>
            <AccessibleButton 
              variant="primary" 
              onClick={handleAccept}
              style={{ flex: 1, minHeight: '44px', fontSize: '0.95rem', padding: '0' }}
            >
              Accept All
            </AccessibleButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
