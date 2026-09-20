import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, MessageCircle, LogOut, Crown, Moon, Sun, Home, Briefcase, Target, FileText, Zap, User, Settings, Accessibility, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LandingHero from './pages/LandingHero';
import ProfileBuilder from './pages/ProfileBuilder';
import JobListings from './pages/JobListings';
import JobDetail from './pages/JobDetail';
import EmployerDashboard from './pages/EmployerDashboard';
import ChatbotPage from './pages/ChatbotPage';
import AuthPage from './pages/AuthPage';
import RoleSelectionModal from './components/RoleSelectionModal';
import ScreenReader from './ScreenReader';
import MotorAccessibilityToolbar from './MotorAccessibilityToolbar';
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp';
import VoiceControl from './VoiceControl';
import AccessibilityMenu from './AccessibilityMenu';
import InterviewPrepPage from './pages/InterviewPrepPage';
import InterviewPracticeSession from './pages/InterviewPracticeSession';
import InterviewAnswerReview from './pages/InterviewAnswerReview';
import InterviewFinalSummary from './pages/InterviewFinalSummary';
import AboutUs from './pages/AboutUs';
import ResumeBuilder from './pages/ResumeBuilder';
import UserProfile from './pages/UserProfile';
import MeetSync from './pages/MeetSync';
import AdminDashboard from './pages/AdminDashboard';
import { useAuth } from './context/AuthContext';
const faviconImg = '/favicon.png';
import CookieConsent from './components/CookieConsent';
import SplashScreen from './components/SplashScreen';
import './App.css';
import './voiceNavigator';
import './accessibilityDetector';

import { announceToScreenReader, triggerVisualAlert } from './utils/a11y';

// Import for use within App.jsx, and re-export for other files
import { AccessibleButton } from './components/AccessibleButton';
export { AccessibleButton } from './components/AccessibleButton';


const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const mobileMenuRef = useRef(null);
  const menuButtonRef = useRef(null);
  const firstFocusableRef = useRef(null);
  const { user, userProfile, logout, isAuthenticated } = useAuth();

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('app-theme');
    return savedTheme || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const mobileNavLinkStyle = {
    fontSize: '1.1rem',
    padding: '12px 20px',
    borderRadius: '12px',
    background: 'var(--bg-secondary)',
    display: 'flex',
    alignItems: 'center',
    color: 'var(--text-primary)',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'all 0.2s ease'
  };

  // Focus trapping and Escape key handling for mobile menu
  useEffect(() => {
    if (mobileMenuOpen && firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }

    const handleKeyDown = (e) => {
      if (!mobileMenuOpen) return;

      // Close on Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        setMobileMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      // Trap focus inside menu
      if (e.key === 'Tab' && mobileMenuRef.current) {
        const focusableElements = mobileMenuRef.current.querySelectorAll(
          'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
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
    };

    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Return focus to menu button when closed
  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      padding: scrolled ? '8px 24px' : '16px 24px',
      pointerEvents: 'none',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <header className={scrolled ? 'header-glass' : ''} style={{
        pointerEvents: 'auto',
        height: 'var(--header-height)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: scrolled ? 'var(--card-bg)' : 'rgba(255, 255, 255, 0.0)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        borderRadius: '24px',
        boxShadow: scrolled ? '0 10px 40px -10px rgba(0,0,0,0.08)' : '0 4px 20px rgba(0,0,0,0.03)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        maxWidth: '1400px',
        margin: '0 auto',
        gap: '12px'
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', flexShrink: 0 }}>
          <div className="brand-logo-badge" style={{ background: 'var(--bg-secondary)', boxShadow: '0 4px 12px var(--accent-purple-glow)' }}>
            <img src={faviconImg} alt="ApnaRozgaar logo" />
          </div>
          <span style={{
            fontWeight: '800',
            fontSize: '1.25rem',
            background: 'var(--text-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: "'Outfit', sans-serif",
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap'
          }}>
            ApnaRozgaar
          </span>
        </Link>

        <div className="header-actions">

          <AccessibleButton variant="ghost" className="desktop-only nav-link-hover" onClick={() => navigate('/meetsync')} aria-label="Intelligent Meetings" style={{ position: 'relative' }}>

            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '0',
              background: 'var(--accent-purple)',
              color: 'white',
              fontSize: '0.6rem',
              padding: '2px 6px',
              borderRadius: '10px',
              fontWeight: '800',
              textTransform: 'uppercase'
            }}></span>
          </AccessibleButton>
          <AccessibleButton variant="ghost" className="desktop-only nav-link-hover" onClick={() => navigate('/interview-prep')} aria-label="Practice Interviews">Interview Prep</AccessibleButton>
          <AccessibleButton variant="ghost" className="desktop-only nav-link-hover" onClick={() => navigate('/resume-builder')} aria-label="AI Resume Builder">AI Resume</AccessibleButton>
          {/* <AccessibleButton variant="ghost" className="desktop-only nav-link-hover" onClick={() => navigate('/library')} aria-label="AI Library">Library</AccessibleButton> */}

          <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 8px' }} className="desktop-only" />

          {isAuthenticated ? (
            <>
              <span className="desktop-only" style={{
                color: 'var(--text-primary)',
                fontWeight: '600',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '0 12px',
                whiteSpace: 'nowrap'
              }}
                onClick={() => navigate('/profile')}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && navigate('/profile')}
              >
                Hi, {userProfile?.name || user?.displayName || 'User'}
              </span>
              <AccessibleButton
                variant="outline"
                className="desktop-only"
                onClick={async () => { await logout(); navigate('/'); }}
                aria-label="Sign out of your account"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <LogOut size={16} />
                Sign Out
              </AccessibleButton>
            </>
          ) : (
            <AccessibleButton
              variant="outline"
              className="desktop-only"
              onClick={() => navigate('/auth')}
              aria-label="Sign in to your account"
            >
              Sign In
            </AccessibleButton>
          )}

          <AccessibleButton className="desktop-only" onClick={() => navigate('/employer')} aria-label="Post a new job listing" style={{ marginLeft: '8px' }}>Post a Job</AccessibleButton>



          <button
            ref={menuButtonRef}
            className="mobile-only"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ background: 'transparent', border: 'none', padding: '8px', cursor: 'pointer', minWidth: '44px', minHeight: '44px', alignItems: 'center', justifyContent: 'center' }}
          >
            {mobileMenuOpen ? <X size={28} color="var(--text-primary)" aria-hidden="true" /> : <Menu size={28} color="var(--text-primary)" aria-hidden="true" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              ref={mobileMenuRef}
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation menu"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{
                position: 'fixed',
                top: 'calc(var(--header-height) + 20px)',
                left: '16px',
                right: '16px',
                background: 'var(--card-bg)',
                backdropFilter: 'blur(20px)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                zIndex: 100,
                borderRadius: '24px',
                border: '1px solid var(--border)',
                maxHeight: 'calc(100vh - 120px)',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: '700', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Navigation</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={() => {
                      const event = new CustomEvent('toggle-accessibility-menu');
                      document.dispatchEvent(event);
                      closeMobileMenu();
                    }}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'var(--text-primary)'
                    }}
                    aria-label="Toggle Accessibility Menu"
                  >
                    <Accessibility size={16} />
                  </button>
                  <button
                    onClick={toggleTheme}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'var(--text-primary)'
                    }}
                    aria-label="Toggle dark mode"
                  >
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  </button>
                  <button
                    onClick={closeMobileMenu}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'var(--text-primary)'
                    }}
                    aria-label="Close menu"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Link onClick={closeMobileMenu} to="/" style={mobileNavLinkStyle}>Home</Link>
                <Link onClick={closeMobileMenu} to="/jobs" style={mobileNavLinkStyle}>Browse Jobs</Link>
                <Link onClick={closeMobileMenu} to="/chat" style={mobileNavLinkStyle}>Chat with Asha</Link>
                <Link onClick={closeMobileMenu} to="/meetsync" style={mobileNavLinkStyle}>MeetSync Meetings</Link>
                <Link onClick={closeMobileMenu} to="/interview-prep" style={mobileNavLinkStyle}>Interview Prep</Link>
                <Link onClick={closeMobileMenu} to="/resume-builder" style={mobileNavLinkStyle}>AI Resume Builder</Link>

                <Link onClick={closeMobileMenu} to="/profile" style={mobileNavLinkStyle}>My Profile</Link>
                <Link onClick={closeMobileMenu} to="/employer" style={mobileNavLinkStyle}>Employer Dashboard</Link>
                <Link onClick={closeMobileMenu} to="/admin" style={{ ...mobileNavLinkStyle, color: 'var(--accent-purple)', fontWeight: 700 }}>
                  <Shield size={14} style={{ display: 'inline', marginRight: '6px' }} />Admin Panel
                </Link>
              </div>

              <div style={{ marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                {isAuthenticated ? (
                  <AccessibleButton
                    variant="ghost"
                    onClick={async () => { await logout(); closeMobileMenu(); navigate('/'); }}
                    style={{
                      justifyContent: 'flex-start',
                      padding: '12px 20px',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      color: 'var(--danger)',
                      width: '100%'
                    }}
                  >
                    <LogOut size={18} />
                    Sign Out
                  </AccessibleButton>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <AccessibleButton
                      onClick={() => { closeMobileMenu(); navigate('/auth'); }}
                      style={{ width: '100%', fontSize: '1rem' }}
                    >
                      Sign In / Join
                    </AccessibleButton>
                    <AccessibleButton
                      variant="outline"
                      onClick={() => { closeMobileMenu(); navigate('/employer'); }}
                      style={{ width: '100%', fontSize: '1rem' }}
                    >
                      For Employers
                    </AccessibleButton>
                  </div>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
    </div>
  );
};

const FOCUS_OVERLAY_PADDING = 8;

const resolveFocusArea = (element) => {
  if (typeof HTMLElement === 'undefined' || !(element instanceof HTMLElement)) return null;
  return element;
};

const FocusModeOverlay = () => {
  const [isEnabled, setIsEnabled] = useState(() => document.documentElement.classList.contains('focus-mode'));
  const [spotlightRect, setSpotlightRect] = useState(null);
  const hoveredElementRef = useRef(null);

  const updateSpotlight = useCallback((targetElement = null) => {
    let target;

    if (targetElement) {
      target = resolveFocusArea(targetElement);
    } else {
      const activeElement = document.activeElement;
      const fallbackTarget = document.querySelector('[data-focus-area="main-content"]') || document.querySelector('main');
      target = resolveFocusArea(activeElement && activeElement !== document.body ? activeElement : fallbackTarget);
    }

    if (!target) {
      setSpotlightRect(null);
      return;
    }

    const rect = target.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      setSpotlightRect(null);
      return;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const top = Math.max(12, rect.top - FOCUS_OVERLAY_PADDING);
    const left = Math.max(12, rect.left - FOCUS_OVERLAY_PADDING);
    const right = Math.min(viewportWidth - 12, rect.right + FOCUS_OVERLAY_PADDING);
    const bottom = Math.min(viewportHeight - 12, rect.bottom + FOCUS_OVERLAY_PADDING);
    const width = Math.max(0, right - left);
    const height = Math.max(0, bottom - top);

    if (!width || !height) {
      setSpotlightRect(null);
      return;
    }

    // Site chrome (footer) should never be dimmed/blurred by focus mode —
    // only the main reading content is meant to be spotlighted. Clamp the
    // area the overlay is allowed to shade so it stops above the footer.
    const footerEl = document.querySelector('footer');
    const footerRect = footerEl ? footerEl.getBoundingClientRect() : null;
    const shadeFloor = footerRect ? Math.max(0, footerRect.top) : viewportHeight;

    setSpotlightRect({
      top,
      left,
      right,
      bottom,
      width,
      height,
      shadeFloor,
      borderRadius: window.getComputedStyle(target).borderRadius || '24px',
    });
  }, []);

  useEffect(() => {
    const syncFromDocument = () => {
      const nextEnabled = document.documentElement.classList.contains('focus-mode');
      setIsEnabled(nextEnabled);

      if (nextEnabled) {
        requestAnimationFrame(() => updateSpotlight());
      } else {
        setSpotlightRect(null);
      }
    };

    const handleFocusIn = () => {
      if (document.documentElement.classList.contains('focus-mode') && !hoveredElementRef.current) {
        requestAnimationFrame(() => updateSpotlight());
      }
    };

    const handleMouseOver = (e) => {
      if (document.documentElement.classList.contains('focus-mode')) {
        hoveredElementRef.current = e.target;
        requestAnimationFrame(() => updateSpotlight(e.target));
      }
    };

    const handleMouseOut = () => {
      if (document.documentElement.classList.contains('focus-mode')) {
        hoveredElementRef.current = null;
        requestAnimationFrame(() => updateSpotlight());
      }
    };

    const handleResizeOrScroll = () => {
      if (document.documentElement.classList.contains('focus-mode')) {
        requestAnimationFrame(() => updateSpotlight(hoveredElementRef.current));
      }
    };

    syncFromDocument();
    document.addEventListener('motor-a11y-settings-change', syncFromDocument);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, true);

    return () => {
      document.removeEventListener('motor-a11y-settings-change', syncFromDocument);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('mouseover', handleMouseOver, true);
      document.removeEventListener('mouseout', handleMouseOut, true);
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
    };
  }, [updateSpotlight]);

  if (!isEnabled || !spotlightRect) {
    return null;
  }

  return (
    <div className="focus-mode-overlay" aria-hidden="true">
      <div
        className="focus-mode-overlay-shade focus-mode-overlay-shade-top"
        style={{ height: `${spotlightRect.top}px` }}
      />
      <div
        className="focus-mode-overlay-shade focus-mode-overlay-shade-left"
        style={{ top: `${spotlightRect.top}px`, width: `${spotlightRect.left}px`, height: `${spotlightRect.height}px` }}
      />
      <div
        className="focus-mode-overlay-shade focus-mode-overlay-shade-right"
        style={{ top: `${spotlightRect.top}px`, left: `${spotlightRect.right}px`, height: `${spotlightRect.height}px` }}
      />
      <div
        className="focus-mode-overlay-shade focus-mode-overlay-shade-bottom"
        style={{
          top: `${spotlightRect.bottom}px`,
          height: `${Math.max(0, spotlightRect.shadeFloor - spotlightRect.bottom)}px`,
        }}
      />
      <div
        className="focus-mode-overlay-frame"
        style={{
          top: `${spotlightRect.top}px`,
          left: `${spotlightRect.left}px`,
          width: `${spotlightRect.width}px`,
          height: `${spotlightRect.height}px`,
          borderRadius: spotlightRect.borderRadius,
        }}
      />
    </div>
  );
};

const Footer = () => (
  <footer style={{
    marginTop: 'auto',
    position: 'relative',
    overflow: 'hidden',
    background: '#151515',
    color: 'white',
    padding: '40px 24px 24px',
    fontFamily: "'Inter', sans-serif",
    borderTop: '1px solid rgba(255,255,255,0.05)'
  }} role="contentinfo">
    <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
      <div className="site-footer-grid">
        {/* Left Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="brand-logo-badge" style={{ background: 'white' }}>
              <img src={faviconImg} alt="Apna Rozgaar logo" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <strong style={{ fontSize: '1.5rem', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em', color: 'white', lineHeight: '1.1' }}>
                apna
              </strong>
              <strong style={{ fontSize: '1.5rem', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em', color: 'white', lineHeight: '1.1' }}>
                rozgaar
              </strong>
            </div>
          </div>
          <p style={{ color: 'white', fontSize: '1rem', fontWeight: '500', margin: 0 }}>Unlocking Possibilities</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p style={{ color: '#ccc', margin: 0, fontSize: '0.85rem' }}>Drop us a line of any query</p>
            <a href="/contact" style={{ color: '#D8B4FE', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', letterSpacing: '0.5px' }}>CONTACT US &rarr;</a>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p style={{ color: '#ccc', margin: 0, fontSize: '0.85rem' }}>Like what we do & want to help?</p>
            <a href="/volunteer" style={{ color: '#D8B4FE', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', letterSpacing: '0.5px' }}>VOLUNTEER &rarr;</a>
          </div>
        </div>

        {/* Right Section (Links) */}
        <div className="footer-links-grid">
          <div>
            <h4 style={{ color: 'white', fontSize: '0.85rem', fontWeight: '700', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>FOR CANDIDATES</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link to="/jobs" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.8rem' }}>Employment Opportunities</Link>
              <Link to="/jobs" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.8rem' }}>Find a Job</Link>
              <Link to="/interview-prep" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.8rem' }}>Interview Prep</Link>
              <Link to="/resume-builder" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.8rem' }}>AI Resume Builder</Link>
            </div>
          </div>

          <div>
            <h4 style={{ color: 'white', fontSize: '0.85rem', fontWeight: '700', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>FOR CORPORATES</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link to="/employer" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.8rem' }}>Hire Full Time & Interns</Link>
              <Link to="/employer" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.8rem' }}>Post a Job Listing</Link>
              <Link to="/contact" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.8rem' }}>Partner with Us</Link>
            </div>
          </div>

          <div>
            <h4 style={{ color: 'white', fontSize: '0.85rem', fontWeight: '700', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>RESOURCES</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link to="/about" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.8rem' }}>Our Story</Link>
              <Link to="/blog" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.8rem' }}>Blog & Articles</Link>
              <Link to="/faq" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.8rem' }}>FAQs</Link>
            </div>
          </div>

          <div>
            <h4 style={{ color: 'white', fontSize: '0.85rem', fontWeight: '700', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>COMPANY</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link to="/about" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.8rem' }}>About Apna Rozgaar</Link>
              <Link to="/terms" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.8rem' }}>Terms of Use</Link>
              <Link to="/privacy" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.8rem' }}>Privacy Policy</Link>
              <Link to="/accessibility" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.8rem' }}>Accessibility Statement</Link>
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <p style={{ margin: 0, color: '#888', fontSize: '0.78rem' }}>&copy; {new Date().getFullYear()} Apna Rozgaar. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

// Animated Router Wrapper
const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <LandingHero />
          </motion.div>
        } />
        <Route path="/profile/create" element={
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            <ProfileBuilder />
          </motion.div>
        } />
        <Route path="/jobs" element={
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <JobListings />
          </motion.div>
        } />
        <Route path="/jobs/:id" element={
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <JobDetail />
          </motion.div>
        } />
        <Route path="/employer" element={
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <EmployerDashboard />
          </motion.div>
        } />
        <Route path="/chat" element={
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <ChatbotPage />
          </motion.div>
        } />
        <Route path="/auth" element={
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <AuthPage />
          </motion.div>
        } />
        <Route path="/interview-prep" element={
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <InterviewPrepPage />
          </motion.div>
        } />
        <Route path="/interview-prep/session" element={
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <InterviewPracticeSession />
          </motion.div>
        } />
        <Route path="/interview-prep/review" element={
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <InterviewAnswerReview />
          </motion.div>
        } />
        <Route path="/interview-prep/summary" element={
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <InterviewFinalSummary />
          </motion.div>
        } />
        <Route path="/resume-builder" element={
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <ResumeBuilder />
          </motion.div>
        } />

        <Route path="/about" element={
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <AboutUs />
          </motion.div>
        } />
        <Route path="/profile" element={
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <UserProfile />
          </motion.div>
        } />

        <Route path="/meetsync" element={
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <MeetSync />
          </motion.div>
        } />

        <Route path="/admin" element={
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <AdminDashboard />
          </motion.div>
        } />
      </Routes>
    </AnimatePresence>
  );
};
const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splash-shown');
  });
  const isChatPage = location.pathname === '/chat';
  const isResumeBuilderPage = location.pathname === '/resume-builder';
  const isHomePage = location.pathname === '/';
  const isAuthPage = location.pathname === '/auth';
  const isInterviewPrepPage = location.pathname.startsWith('/interview-prep');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(() => {
    return localStorage.getItem('selectedRole') || null;
  });

  useEffect(() => {
    if (isAuthPage && !selectedRole) {
      setShowRoleModal(true);
    }
  }, [isAuthPage, selectedRole]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    localStorage.setItem('selectedRole', role);
    setShowRoleModal(false);
    // Navigate with role param so AuthPage can pre-select it
    navigate(`/auth?role=${role}`);
  };

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <SplashScreen
            finishLoading={() => {
              setShowSplash(false);
              sessionStorage.setItem('splash-shown', 'true');
            }}
          />
        )}
      </AnimatePresence>

      <a href="#main-content" className="skip-link">Skip to main content</a>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {!(isAuthPage || isInterviewPrepPage) && <Header />}

        <main
          id="main-content"
          data-focus-area="main-content"
          tabIndex="-1"
          className={(!isHomePage && !isAuthPage && !isInterviewPrepPage) ? 'grain-bg' : ''}
          style={{ flex: 1, paddingTop: (isHomePage || isAuthPage || isInterviewPrepPage) ? '0' : '100px' }}
          role="main"
        >
          <AnimatedRoutes />
        </main>

        {!(isChatPage || isResumeBuilderPage || isAuthPage || isInterviewPrepPage) && <Footer />}
      </div>

      {/* Role Selection Modal for Auth Page */}
      <AnimatePresence>
        {showRoleModal && (
          <RoleSelectionModal
            onSelect={handleRoleSelect}
            onClose={() => {
              setShowRoleModal(false);
              navigate('/');
            }}
          />
        )}
      </AnimatePresence>

      {/* Chatbot quick launch button above voice control */}
      {!(isChatPage || isAuthPage) && (
        <button
          type="button"
          onClick={() => navigate('/chat')}
          aria-label="Open full chatbot page"
          title="Open Chatbot"
          style={{
            position: 'fixed',
            right: '24px',
            bottom: '70px',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'black',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
            zIndex: 9991,
          }}
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Floating Screen Reader Button */}
      {!isAuthPage && <ScreenReader />}

      {/* Floating Voice Control Mic */}
      {!isAuthPage && <VoiceControl />}

      {/* Unified Accessibility Menu */}
      {!isAuthPage && <AccessibilityMenu />}

      {/* Keyboard Shortcuts Help */}
      {!isAuthPage && <KeyboardShortcutsHelp />}

      {/* ADHD Focus Mode Spotlight */}
      <FocusModeOverlay />

      {/* Cookie Consent Popup */}
      <CookieConsent />
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;