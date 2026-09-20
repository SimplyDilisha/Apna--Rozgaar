import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, RefreshCw, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { registerUser, loginUser, resendVerificationEmail, signInWithGoogle, loginAsGuest } from '../firebase/auth';
import { getCandidateProfile } from '../firebase/candidates';
import { useAuth } from '../context/AuthContext';
import interview from '../assets/interview.jpg';

/* ─── Colour tokens (match Tailwind config) ──────────────── */
const C = {
  primary: '#091426',
  secondary: '#006a61',
  secondaryFixed: '#89f5e7',
  surface: '#f8f9ff',
  surfaceLowest: '#ffffff',
  onSurface: '#0b1c30',
  onSurfaceVar: '#45474c',
  outlineVar: '#c5c6cd',
  surfaceContainer: '#e5eeff',
};

/* ─── Shared input style ──────────────────────────────────── */
const inp = (focus) => ({
  width: '100%',
  height: '48px',
  padding: '0 16px',
  borderRadius: '8px',
  border: `1px solid ${focus ? C.secondary : C.outlineVar}`,
  background: C.surface,
  color: C.onSurface,
  outline: 'none',
  fontSize: '14px',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
  boxShadow: focus ? `0 0 0 2px rgba(0,106,97,0.15)` : 'none',
});

/* ─── Focusable Input ─────────────────────────────────────── */
const FocusInput = ({ id, name, type = 'text', placeholder, value, onChange, required, style = {} }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      id={id} name={name} type={type} placeholder={placeholder}
      value={value} onChange={onChange} required={required}
      style={{ ...inp(focused), ...style }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
};

/* ─── Email Verification Pending Screen ───────────────────── */
const VerificationPending = ({ email, password, onBack }) => {
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [resendError, setResendError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true); setResendMsg(''); setResendError('');
    const result = await resendVerificationEmail(email, password);
    if (result.success) { setResendMsg(result.message); setCooldown(60); }
    else { setResendError(result.error || 'Failed to resend. Please try again.'); }
    setResending(false);
  };

  return (
    <motion.div
      key="verify"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35 }}
      style={{ textAlign: 'center' }}
    >
      <motion.div
        initial={{ y: -10 }}
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'rgba(0,106,97,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          border: `2px solid ${C.outlineVar}`,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '36px', color: C.secondary }}>mark_email_read</span>
      </motion.div>

      <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: C.onSurface, marginBottom: '12px' }}>Check Your Email ✉️</h2>
      <p style={{ color: C.onSurfaceVar, fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '8px' }}>
        We sent a verification link to:
      </p>
      <p style={{
        fontWeight: 700, color: C.secondary, fontSize: '1rem',
        marginBottom: '24px', wordBreak: 'break-all',
        padding: '10px 16px', background: C.surfaceContainer,
        borderRadius: '8px', border: `1px solid ${C.outlineVar}`
      }}>
        {email}
      </p>

      <div style={{
        padding: '16px', background: C.surfaceContainer, border: `1px solid ${C.outlineVar}`,
        borderRadius: '10px', marginBottom: '28px', textAlign: 'left'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <CheckCircle size={20} color={C.secondary} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p style={{ fontSize: '0.9rem', color: C.onSurface, fontWeight: 600, marginBottom: '6px' }}>Next steps:</p>
            <ol style={{ fontSize: '0.88rem', color: C.onSurfaceVar, margin: 0, paddingLeft: '18px', lineHeight: '1.8' }}>
              <li>Open the email from ApnaRozgaar</li>
              <li>Click the <strong style={{ color: C.onSurface }}>Verify Email</strong> button</li>
              <li>Return here and sign in</li>
            </ol>
          </div>
        </div>
      </div>

      {resendMsg && (
        <div style={{ padding: '12px 16px', background: 'rgba(0,106,97,0.1)', border: `1px solid rgba(0,106,97,0.3)`, borderRadius: '8px', color: C.secondary, marginBottom: '16px', fontSize: '0.9rem' }}>
          ✅ {resendMsg}
        </div>
      )}
      {resendError && (
        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', marginBottom: '16px', fontSize: '0.9rem' }}>
          {resendError}
        </div>
      )}

      <button
        onClick={handleResend}
        disabled={resending || cooldown > 0}
        style={{
          width: '100%', padding: '14px', background: C.surfaceLowest,
          border: `1px solid ${C.outlineVar}`, borderRadius: '8px',
          color: C.onSurface, fontWeight: 600, fontSize: '0.9rem',
          cursor: cooldown > 0 || resending ? 'not-allowed' : 'pointer',
          opacity: cooldown > 0 || resending ? 0.6 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          transition: 'all 0.2s', marginBottom: '16px'
        }}
      >
        <RefreshCw size={16} style={{ animation: resending ? 'spin 1s linear infinite' : 'none' }} />
        {resending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Verification Email'}
      </button>

      <button
        onClick={onBack}
        style={{ background: 'none', border: 'none', color: C.onSurfaceVar, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto' }}
      >
        <ArrowLeft size={16} /> Back to Sign In
      </button>
    </motion.div>
  );
};

/* ─── Main AuthPage ───────────────────────────────────────── */
const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState('candidate');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingPassword, setPendingPassword] = useState('');
  const [needsVerificationLogin, setNeedsVerificationLogin] = useState(false);

  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  useEffect(() => {
    const role = searchParams.get('role');
    if (role === 'candidate' || role === 'employer') {
      setUserType(role);
    }
    if (searchParams.get('verified') === 'true') {
      setSuccess('🎉 Email verified! You can now sign in.');
      setIsLogin(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const checkRedirect = async () => {
      const isAuth = user && (user.emailVerified || user.email === 'guest@apnarozgaar.com' || user.isAnonymous);
      if (isAuth) {
        try {
          const profileRes = await getCandidateProfile(user.uid);
          const profileData = profileRes.success ? profileRes.data : null;
          const isEmployer = (profileData?.userType === 'employer' || userType === 'employer');
          
          if (isEmployer) {
            navigate('/employer');
          } else {
            const isVerified = profileData?.certificationStatus === 'verified';
            if (isVerified) {
              navigate('/');
            } else {
              navigate('/profile');
            }
          }
        } catch (err) {
          navigate(userType === 'employer' ? '/employer' : '/');
        }
      }
    };
    checkRedirect();
  }, [user, userType, navigate]);


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const switchTab = (toLogin) => {
    setIsLogin(toLogin);
    setError(''); setSuccess('');
    setNeedsVerificationLogin(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess(''); setNeedsVerificationLogin(false);

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.'); setLoading(false); return;
    }
    if (!isLogin && formData.password.length < 6) {
      setError('Password must be at least 6 characters.'); setLoading(false); return;
    }

    try {
      if (isLogin) {
        const result = await loginUser(formData.email, formData.password);
        if (result.success) {
          setSuccess('Welcome back! Redirecting...');
          setTimeout(() => navigate('/'), 1200);
        } else if (result.needsVerification) {
          setNeedsVerificationLogin(true);
          setPendingEmail(formData.email); setPendingPassword(formData.password);
          setError(result.error);
        } else {
          setError(result.error || 'Login failed. Please try again.');
        }
      } else {
        const userData = { name: formData.name, email: formData.email };
        const result = await registerUser(formData.email, formData.password, userData, userType);
        if (result.success && result.needsVerification) {
          setPendingEmail(formData.email); setPendingPassword(formData.password);
          setNeedsVerification(true);
        } else if (result.success) {
          setSuccess('Account created! Redirecting...');
          setTimeout(() => navigate(userType === 'employer' ? '/employer' : '/'), 1500);
        } else {
          setError(result.error || 'Registration failed. Please try again.');
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const result = await signInWithGoogle(userType);
      if (result.success) {
        setSuccess('Success! Redirecting...');
        setTimeout(() => navigate(userType === 'employer' ? '/employer' : '/'), 1200);
      } else {
        setError(result.error || 'Google sign-in failed.');
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const result = await loginAsGuest(userType);
      if (result.success) {
        setSuccess('🎉 Logged in as guest! Redirecting...');
        setTimeout(() => navigate(userType === 'employer' ? '/employer' : '/'), 1200);
      } else {
        setError(result.error || 'Guest login failed.');
      }
    } catch {
      setError('An unexpected error occurred during guest login.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Shared btn styles ── */
  const primaryBtn = {
    width: '100%', height: '48px',
    background: C.secondary, color: '#fff',
    border: 'none', borderRadius: '8px',
    fontSize: '14px', fontWeight: 700,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1,
    transition: 'box-shadow 0.2s, transform 0.1s',
    letterSpacing: '0.01em',
  };

  const socialBtn = {
    flex: 1, height: '48px',
    border: `1px solid ${C.outlineVar}`,
    borderRadius: '8px', background: C.surfaceLowest,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '10px', cursor: 'pointer',
    fontSize: '14px', fontWeight: 600, color: C.onSurface,
    transition: 'background 0.2s',
  };

  return (
    <main style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Left: Hero Panel ── */}
      <section style={{
        display: 'none',
        width: '50%',
        position: 'relative',
        background: C.primary,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
        className="auth-hero-panel"
      >
        {/* Background image */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <img
            src={interview}
            alt="Professional Empowerment"
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.95, filter: 'grayscale(30%)' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(to top, ${C.primary}ee 0%, ${C.primary}44 50%, transparent 100%)`
          }} />
        </div>

        {/* Branding top-left */}
        <div style={{ position: 'absolute', top: '32px', left: '32px', zIndex: 20 }}>
          <span style={{ fontSize: '2.25rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.05em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Welcome To ApnaRozgaar
          </span>
        </div>
      </section>

      {/* ── Right: Form Panel ── */}
      <section style={{
        width: '100%',
        background: C.surfaceLowest,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', overflowY: 'auto',
      }}
        className="auth-form-panel"
      >
        <div style={{ width: '100%', maxWidth: '448px' }}>

          {/* Mobile branding */}
          <div className="auth-mobile-brand" style={{ marginBottom: '32px', textAlign: 'center' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: C.primary, letterSpacing: '-0.02em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              ApnaRozgaar
            </span>
          </div>

          <AnimatePresence mode="wait">
            {needsVerification ? (
              <VerificationPending
                key="verify-pending"
                email={pendingEmail}
                password={pendingPassword}
                onBack={() => {
                  setNeedsVerification(false);
                  setIsLogin(true);
                  setFormData({ name: '', email: '', password: '', confirmPassword: '' });
                }}
              />
            ) : (
              <motion.div
                key="auth-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {/* Header */}
                <div style={{ marginBottom: '40px' }}>
                  <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.5rem', fontWeight: 600, color: C.onSurface, marginBottom: '8px' }}>
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                  </h2>
                  <p style={{ fontSize: '14px', color: C.onSurfaceVar }}>
                    Empowering professional journeys through clear communication.
                  </p>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: `1px solid ${C.outlineVar}`, marginBottom: '32px' }}>
                  {['Login', 'Sign Up'].map((label, i) => {
                    const active = i === 0 ? isLogin : !isLogin;
                    return (
                      <button
                        key={label}
                        onClick={() => switchTab(i === 0)}
                        style={{
                          flex: 1, padding: '12px 0',
                          fontSize: '14px', fontWeight: active ? 700 : 600,
                          color: active ? C.secondary : C.onSurfaceVar,
                          background: 'none', border: 'none',
                          borderBottom: active ? `2px solid ${C.secondary}` : '2px solid transparent',
                          cursor: 'pointer', transition: 'color 0.2s',
                          marginBottom: '-1px',
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* User type (signup only) */}
                  {!isLogin && (
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: C.onSurfaceVar, marginBottom: '8px' }}>I am a:</label>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {[['candidate', 'person', 'Job Seeker'], ['employer', 'business_center', 'Employer']].map(([val, icon, label]) => (
                          <button
                            key={val} type="button"
                            onClick={() => setUserType(val)}
                            style={{
                              flex: 1, padding: '12px',
                              borderRadius: '8px',
                              border: `1px solid ${userType === val ? C.secondary : C.outlineVar}`,
                              background: userType === val ? 'rgba(0,106,97,0.06)' : C.surfaceLowest,
                              color: userType === val ? C.secondary : C.onSurface,
                              fontWeight: 600, fontSize: '13px',
                              cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                              transition: 'all 0.2s',
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{icon}</span>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Full Name (signup) */}
                  {!isLogin && (
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: C.onSurfaceVar, marginBottom: '6px' }} htmlFor="signup-name">Full Name</label>
                      <FocusInput id="signup-name" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required={!isLogin} />
                    </div>
                  )}

                  {/* Email */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: C.onSurfaceVar, marginBottom: '6px' }} htmlFor="auth-email">
                      {isLogin ? 'Email or Username' : 'Email Address'}
                    </label>
                    <FocusInput id="auth-email" name="email" type="email" placeholder="name@example.com" value={formData.email} onChange={handleChange} required />
                  </div>

                  {/* Password */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: C.onSurfaceVar }} htmlFor="auth-password">Password</label>
                      {isLogin && (
                        <a href="#" style={{ fontSize: '13px', fontWeight: 600, color: C.secondary, textDecoration: 'none' }}>Forgot Password?</a>
                      )}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <FocusInput
                        id="auth-password" name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={isLogin ? '••••••••' : 'Min. 6 characters'}
                        value={formData.password} onChange={handleChange} required
                        style={{ paddingRight: '44px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="pass-visible-btn"
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.onSurfaceVar, padding: '4px', display: 'flex' }}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password (signup) */}
                  {!isLogin && (
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: C.onSurfaceVar, marginBottom: '6px' }} htmlFor="auth-confirm">Confirm Password</label>
                      <FocusInput
                        id="auth-confirm" name="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Repeat your password"
                        value={formData.confirmPassword} onChange={handleChange} required={!isLogin}
                      />
                    </div>
                  )}

                  {/* Remember me (login) */}
                  {isLogin && (
                    <label className="auth-label">
                      <input type="checkbox" id="remember" className="auth-checkbox" style={{ accentColor: C.secondary, cursor: 'pointer' }} />
                      <span style={{ fontSize: '14px', color: C.onSurfaceVar }}>Remember me</span>
                    </label>
                  )}

                  {/* Terms (signup) */}
                  {!isLogin && (
                    <label className="auth-label" style={{ alignItems: 'flex-start' }}>
                      <input type="checkbox" id="terms" required className="auth-checkbox" style={{ marginTop: '2px', accentColor: C.secondary, cursor: 'pointer', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: C.onSurfaceVar, lineHeight: 1.5 }}>
                        I agree to the{' '}
                        <a href="#" style={{ color: C.secondary, textDecoration: 'none', fontWeight: 600 }}>Terms of Service</a>
                        {' '}and{' '}
                        <a href="#" style={{ color: C.secondary, textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</a>.
                      </span>
                    </label>
                  )}

                  {/* Error */}
                  {error && (
                    <div role="alert" style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                      <div>
                        <span>{error}</span>
                        {needsVerificationLogin && (
                          <button type="button" onClick={() => setNeedsVerification(true)}
                            style={{ display: 'block', marginTop: '6px', background: 'none', border: 'none', color: '#ef4444', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px', padding: 0 }}>
                            Resend verification email →
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Success */}
                  {success && (
                    <div role="status" style={{ padding: '12px 16px', background: 'rgba(0,106,97,0.08)', border: `1px solid rgba(0,106,97,0.25)`, borderRadius: '8px', color: C.secondary, fontSize: '13px' }}>
                      {success}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    style={primaryBtn}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,106,97,0.35)'; }}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                    onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)'; }}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {loading ? 'Please wait…' : isLogin ? 'Login' : 'Create Account'}
                  </button>

                  {isLogin && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleGuestSignIn}
                      style={{
                        ...primaryBtn,
                        background: 'none',
                        border: `2px solid ${C.secondary}`,
                        color: C.secondary,
                        marginTop: '8px'
                      }}
                      onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(0,106,97,0.05)'; }}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      {loading ? 'Please wait…' : 'Sign in as Guest'}
                    </button>
                  )}
                </form>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '28px 0' }}>
                  <div style={{ flex: 1, height: '1px', background: C.outlineVar }} />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(69,71,76,0.55)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Or continue with</span>
                  <div style={{ flex: 1, height: '1px', background: C.outlineVar }} />
                </div>

                {/* Social buttons */}
                <div style={{ display: 'flex', gap: '16px' }}>
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    style={{ ...socialBtn, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.background = C.surfaceContainer; }}
                    onMouseLeave={e => e.currentTarget.style.background = C.surfaceLowest}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>Google</span>
                  </button>

                  <button
                    style={{ ...socialBtn, cursor: 'not-allowed', opacity: 0.55 }}
                    title="LinkedIn sign-in coming soon"
                    disabled
                  >
                    <svg width="20" height="20" fill="#0A66C2" viewBox="0 0 24 24">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                    </svg>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>LinkedIn</span>
                  </button>
                </div>

                {/* Back to home */}
                <button
                  onClick={() => navigate('/')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: C.onSurfaceVar, cursor: 'pointer', fontSize: '13px', margin: '24px auto 0' }}
                >
                  <ArrowLeft size={15} /> Back to Home
                </button>

                {/* Footer */}
                <p style={{ marginTop: '32px', textAlign: 'center', fontSize: '12px', color: 'rgba(69,71,76,0.5)' }}>
                  © 2026 ApnaRozgaar. Built for accessibility and dignity.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Scoped responsive CSS */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .auth-hero-panel { display: none !important; }
        .auth-mobile-brand { display: block; }
        
        /* Overrides for checkbox elements stretched by global touch target CSS */
        .auth-checkbox {
          width: 20px !important;
          height: 20px !important;
          min-width: 20px !important;
          min-height: 20px !important;
          cursor: pointer;
        }

        /* Reset wrappers that match global accessibility label spacing */
        .auth-label {
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
          padding: 0 !important;
          margin: 0 !important;
          min-height: auto !important;
          background: none !important;
        }

        /* Stripping button decoration from absolute visibility toggle */
        .pass-visible-btn {
          border: none !important;
          background: none !important;
          box-shadow: none !important;
          min-width: auto !important;
          min-height: auto !important;
          width: 36px !important;
          height: 36px !important;
          padding: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        @media (min-width: 1024px) {
          .auth-hero-panel { display: flex !important; }
          .auth-form-panel { width: 50% !important; }
          .auth-mobile-brand { display: none !important; }
        }
      `}</style>
    </main>
  );
};

export default AuthPage;
