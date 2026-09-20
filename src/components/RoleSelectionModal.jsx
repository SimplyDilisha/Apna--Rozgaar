import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Building2, X } from 'lucide-react';

const C = {
  primary: '#091426',
  secondary: '#006a61',
  surface: '#f8f9ff',
  surfaceLowest: '#ffffff',
  onSurface: '#0b1c30',
  onSurfaceVar: '#45474c',
  outlineVar: '#c5c6cd',
  surfaceContainer: '#e5eeff',
};

const RoleSelectionModal = ({ onSelect, onClose }) => {
  const [hoveredRole, setHoveredRole] = useState(null);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const roles = [
    {
      id: 'candidate',
      label: 'Job Seeker',
      sublabel: 'I\'m looking for opportunities',
      icon: User,
      color: C.secondary,
      bgGradient: 'linear-gradient(135deg, #006a61 0%, #0891b2 100%)',
    },
    {
      id: 'employer',
      label: 'Employer / Hirer',
      sublabel: 'I want to hire talent',
      icon: Building2,
      color: '#0891b2',
      bgGradient: 'linear-gradient(135deg, #0891b2 0%, #006a61 100%)',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(9, 20, 38, 0.6)',
        backdropFilter: 'blur(8px)',
        padding: '24px',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-selection-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: C.surfaceLowest,
          borderRadius: '24px',
          padding: '48px',
          maxWidth: '520px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: `1px solid ${C.outlineVar}`,
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close role selection"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: 'none',
            background: C.surfaceContainer,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: C.onSurfaceVar,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.08)';
            e.currentTarget.style.color = C.onSurface;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = C.surfaceContainer;
            e.currentTarget.style.color = C.onSurfaceVar;
          }}
        >
          <X style={{ fontSize: '18px' }} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: C.surfaceContainer,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              border: `1px solid ${C.outlineVar}`,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '32px', color: C.secondary }}>
              how_to_reg
            </span>
          </motion.div>
          <h2
            id="role-selection-title"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '1.75rem',
              fontWeight: 700,
              color: C.onSurface,
              margin: '0 0 8px',
              letterSpacing: '-0.02em',
            }}
          >
            Welcome to ApnaRozgaar
          </h2>
          <p style={{ color: C.onSurfaceVar, fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
            Choose your role to get started
          </p>
        </div>

        {/* Role Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {roles.map((role, index) => (
            <motion.button
              key={role.id}
              onClick={() => onSelect(role.id)}
              onMouseEnter={() => setHoveredRole(role.id)}
              onMouseLeave={() => setHoveredRole(null)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.08, duration: 0.3 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '20px 24px',
                borderRadius: '16px',
                border: `2px solid ${hoveredRole === role.id ? role.color : C.outlineVar}`,
                background: hoveredRole === role.id ? C.surfaceContainer : C.surfaceLowest,
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: hoveredRole === role.id
                  ? `0 8px 24px -4px ${role.color}33`
                  : '0 2px 8px rgba(0,0,0,0.04)',
                textAlign: 'left',
                width: '100%',
                position: 'relative',
                overflow: 'hidden',
              }}
              aria-label={`Select ${role.label} role`}
            >
              {/* Icon */}
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: role.bgGradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: `0 4px 12px ${role.color}33`,
                }}
              >
                <role.icon style={{ fontSize: '24px', color: '#fff' }} />
              </div>

              {/* Text */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: C.onSurface,
                    marginBottom: '2px',
                  }}
                >
                  {role.label}
                </div>
                <div style={{ fontSize: '0.85rem', color: C.onSurfaceVar }}>
                  {role.sublabel}
                </div>
              </div>

              {/* Arrow indicator */}
              <motion.div
                animate={{ x: hoveredRole === role.id ? 4 : 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  color: role.color,
                  opacity: hoveredRole === role.id ? 1 : 0.5,
                  flexShrink: 0,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </motion.div>
            </motion.button>
          ))}
        </div>

        {/* Footer note */}
        <p
          style={{
            textAlign: 'center',
            marginTop: '24px',
            fontSize: '0.8rem',
            color: C.onSurfaceVar,
            opacity: 0.7,
          }}
        >
          You can change this later in your profile settings
        </p>
      </motion.div>
    </motion.div>
  );
};

export default RoleSelectionModal;
