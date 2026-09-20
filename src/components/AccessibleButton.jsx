import React from 'react';

// Base accessible button component used throughout
export const AccessibleButton = ({ children, onClick, className = '', variant = 'primary', style, ...props }) => {
  const baseStyle = {
    minHeight: '44px',
    borderRadius: '16px',
    fontWeight: '600',
    padding: '0 24px',
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.95rem',
    position: 'relative',
    overflow: 'hidden',
  };

  const variants = {
    primary: {
      background: 'var(--primary-gradient)',
      color: 'white',
      border: '1px solid var(--border)',
      boxShadow: '0 8px 20px -6px var(--accent-purple-glow)'
    },
    outline: {
      background: 'rgba(255,255,255,0.7)',
      backdropFilter: 'blur(8px)',
      border: '1.5px solid rgba(37, 99, 235, 0.2)',
      color: 'var(--text-primary)',
      boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-muted)'
    },
    premium: {
      background: 'var(--premium-gradient)',
      color: 'white',
      border: 'none',
      boxShadow: '0 8px 20px -6px rgba(245, 158, 11, 0.4)',
      fontWeight: '700'
    }
  };

  const mergedStyle = { ...baseStyle, ...variants[variant], ...style };

  return (
    <button
      onClick={onClick}
      className={`accessible-button ${className}`}
      style={mergedStyle}
      {...props}
    >
      {children}
    </button>
  );
};
