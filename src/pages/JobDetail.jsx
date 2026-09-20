import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, DollarSign, Clock, ArrowLeft, CheckCircle, Loader2, Flag, X, Sparkles } from 'lucide-react';

import { AccessibleButton } from '../components/AccessibleButton';
import { getJobById, applyToJob, reportJob } from '../firebase/jobs';
import { useAuth } from '../context/AuthContext';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userProfile, isAuthenticated } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(null); // { msg, type }
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetail, setReportDetail] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportDone, setReportDone] = useState(false);

  useEffect(() => {
    getJobById(id).then((r) => {
      if (r.success) {
        setJob(r.data);
        if (user && r.data.applicants) {
          setApplied(r.data.applicants.some(a => a.candidateId === user.uid));
        }
      } else {
        setError(r.error || 'Job not found');
      }
      setLoading(false);
    });
  }, [id, user]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const [resume, setResume] = useState('');
  const [showResumeInput, setShowResumeInput] = useState(false);

  const handleApply = async () => {
    if (!isAuthenticated) { navigate('/auth'); return; }

    if (!resume && !showResumeInput) {
      setShowResumeInput(true);
      showToast('Please provide a resume link to apply.', 'info');
      setTimeout(() => {
        const input = document.getElementById('resume-input');
        input?.focus();
      }, 100);
      return;
    }

    if (!resume) {
      showToast('Resume link is required.', 'error');
      return;
    }

    setApplying(true);
    const result = await applyToJob(id, user.uid, {
      name: userProfile?.name || user?.displayName || 'Applicant',
      skills: userProfile?.skills || [],
      isPremium: userProfile?.isPremium || false,
      resume: resume
    });
    if (result.success) {
      setApplied(true);
      showToast('Application submitted successfully! 🎉', 'success');
    } else {
      showToast(result.error || 'Failed to apply. Please try again.', 'error');
    }
    setApplying(false);
  };

  const handleReportJob = async () => {
    if (!isAuthenticated) { navigate('/auth'); return; }
    if (!reportReason) { showToast('Please select a reason.', 'error'); return; }
    setReportSubmitting(true);
    const result = await reportJob(id, user.uid, reportReason, reportDetail);
    if (result.success) {
      setReportDone(true);
      setTimeout(() => { setShowReportModal(false); setReportDone(false); setReportReason(''); setReportDetail(''); }, 2000);
      showToast('Report submitted. Our team will review it. 🛡️', 'success');
    } else {
      showToast(result.error || 'Failed to submit report.', 'error');
    }
    setReportSubmitting(false);
  };

  const featureLabel = (f) =>
    f.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const deafKeys = ['induction_loop', 'visual_fire_alarms', 'bsl_asl_isl_interpreters', 'cart_captioning', 'video_relay_service', 'text_alternatives'];

  const timeAgo = (ts) => {
    if (!ts) return 'Recently';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const days = Math.floor((Date.now() - d) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 30) return `${days} days ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: '16px', color: 'var(--text-muted)' }}>
      <Loader2 size={40} style={{ animation: 'spin 1s linear infinite' }} />
      <p>Loading job details…</p>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error || !job) return (
    <div style={{ maxWidth: '500px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      <h1 style={{ marginBottom: '12px' }}>Job Not Found</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{error || "This listing has been removed."}</p>
      <AccessibleButton onClick={() => navigate('/jobs')}><ArrowLeft size={16} /> Back to Jobs</AccessibleButton>
    </div>
  );

  const mode = (job.jobType || '').charAt(0).toUpperCase() + (job.jobType || '').slice(1);
  const color = '#6B46C1';
  const logo = (job.company || 'J').charAt(0).toUpperCase();
  const features = job.accessibilityFeatures || [];
  const generalFeat = features.filter(f => !deafKeys.includes(f));
  const deafFeat = features.filter(f => deafKeys.includes(f));

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <li><Link to="/">Home</Link> &gt;</li>
          <li><Link to="/jobs">Jobs</Link> &gt;</li>
          <li style={{ color: 'var(--text-primary)' }}>{job.title}</li>
        </ol>
      </nav>

      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* ── Left: Job Info ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ flex: '1 1 60%', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '28px' }}
        >
          {/* Header */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '16px', flexShrink: 0,
              background: `${color}18`, color, fontWeight: '800', fontSize: '2rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)'
            }}>{logo}</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <p style={{ color: 'var(--text-muted)', fontWeight: '600', margin: 0 }}>{job.company}</p>
                {job.status === 'active' && (
                  <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(13, 148, 136, 0.12)', color: '#0d9488', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Sparkles size={11} /> AI Safety Verified
                  </span>
                )}
              </div>
              <h1 style={{ fontSize: '2rem', margin: '4px 0 0 0' }}>{job.title}</h1>
            </div>
          </div>

          {/* AI Verification Banner */}
          {job.aiVerificationSummary && (
            <div style={{ padding: '14px 18px', borderRadius: '14px', background: 'rgba(13, 148, 136, 0.05)', border: '1px solid rgba(13, 148, 136, 0.2)', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(13, 148, 136, 0.15)', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sparkles size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#0d9488', display: 'block' }}>Groq AI Safety Assessment:</strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{job.aiVerificationSummary}</p>
              </div>
            </div>
          )}


          {/* Meta */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
            {job.location && <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontWeight: '500' }}><MapPin size={16} />{job.location}</span>}
            {mode && <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontWeight: '500' }}><Briefcase size={16} />{mode}</span>}
            {job.salary && <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontWeight: '500' }}><DollarSign size={16} />{job.salary}</span>}
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontWeight: '500' }}><Clock size={16} />Posted {timeAgo(job.createdAt)}</span>
          </div>

          {/* General Accessibility */}
          {generalFeat.length > 0 && (
            <section>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '14px' }}>Accessibility Features</h2>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {generalFeat.map(f => (
                  <span key={f} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600', background: 'rgba(5,150,105,0.1)', color: 'var(--success)' }}>
                    <CheckCircle size={13} /> {featureLabel(f)}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Deaf/HoH */}
          {deafFeat.length > 0 && (
            <section>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>🤟 Deaf/HoH Accessibility</h2>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {deafFeat.map(f => (
                  <span key={f} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600', background: 'rgba(37,99,235,0.1)', color: '#2563EB' }}>
                    <CheckCircle size={13} /> {featureLabel(f)}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {(job.skillsRequired || []).length > 0 && (
            <section>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '14px' }}>Skills Required</h2>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {job.skillsRequired.map(s => (
                  <span key={s} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', background: 'var(--primary-gradient)', color: 'white' }}>{s}</span>
                ))}
              </div>
            </section>
          )}

          {/* Description */}
          {job.description && (
            <section>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '14px' }}>About the Role</h2>
              <div style={{ lineHeight: '1.8', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{job.description}</div>
            </section>
          )}
        </motion.div>

        {/* ── Right: Apply Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ flex: '1 1 28%', minWidth: '280px', position: 'sticky', top: '90px', alignSelf: 'flex-start' }}
        >
          <div style={{ padding: '28px', borderRadius: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>

            {/* Score gauge */}
            {job.accessibilityScore != null && (
              <div style={{ textAlign: 'center', marginBottom: '24px', position: 'relative' }}>
                <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Outer Glow */}
                  <div style={{
                    position: 'absolute', inset: '5px', borderRadius: '50%',
                    boxShadow: `0 0 20px ${color}30`,
                    background: 'var(--bg-primary)', zIndex: 0
                  }} />

                  <svg width="120" height="120" style={{ transform: 'rotate(-90deg)', position: 'absolute', zIndex: 1 }}>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--accent-purple)" />
                        <stop offset="100%" stopColor="#9F7AEA" />
                      </linearGradient>
                    </defs>
                    <circle cx="60" cy="60" r="52" stroke="var(--border)" strokeWidth="10" fill="none" opacity="0.3" />
                    <circle cx="60" cy="60" r="52" stroke="url(#scoreGradient)" strokeWidth="10" fill="none"
                      strokeDasharray={2 * Math.PI * 52}
                      strokeDashoffset={2 * Math.PI * 52 * (1 - job.accessibilityScore / 18)}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
                  </svg>

                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                    <span style={{ fontSize: '1.8rem', fontWeight: '900', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>
                      {Math.round((job.accessibilityScore / 18) * 100)}%
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginTop: '12px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Accessibility Score</p>
              </div>
            )}

            {/* Quick info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', fontSize: '0.9rem' }}>
              {[
                ['Location', job.location],
                ['Work Mode', mode],
                ['Salary', job.salary || 'Not specified'],
                ['Applicants', `${(job.applicants || []).length} applied`]
              ].map(([label, val]) => val && (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontWeight: '600' }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Resume Input Area */}
            {!applied && showResumeInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{ marginBottom: '16px' }}
              >
                <label htmlFor="resume-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>
                  RESUME LINK (Google Drive/Dropbox)
                </label>
                <input
                  id="resume-input"
                  type="url"
                  placeholder="Paste your resume link here..."
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '2px solid var(--accent-purple)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  💡 Tip: Make sure the link is accessible.
                </p>
              </motion.div>
            )}

            {/* Apply button */}
            {applied ? (
              <div style={{ padding: '14px', textAlign: 'center', background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.3)', borderRadius: '12px', color: 'var(--success)', fontWeight: '700', marginBottom: '12px' }}>
                ✓ Application Submitted
              </div>
            ) : (
              <AccessibleButton
                id="apply-job-btn"
                onClick={handleApply}
                disabled={applying}
                style={{ width: '100%', minHeight: '52px', fontSize: '1rem', marginBottom: '12px', opacity: applying ? 0.7 : 1, position: 'relative', overflow: 'hidden' }}
              >
                {applying ? 'Submitting…' : isAuthenticated ? (showResumeInput ? 'Confirm & Apply' : 'Apply Now') : 'Sign In to Apply'}
                {isAuthenticated && !showResumeInput && !applying && (
                  <motion.div
                    style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.1)' }}
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                )}
              </AccessibleButton>
            )}

            <AccessibleButton
              variant={saved ? 'primary' : 'outline'}
              onClick={() => { setSaved(s => !s); if (!saved) showToast('Job saved to your list! 💼', 'success'); }}
              style={{ width: '100%', minHeight: '52px', fontSize: '1rem' }}
            >
              {saved ? '✓ Saved' : 'Save Job'}
            </AccessibleButton>

            <button
              id="report-job-btn"
              onClick={() => setShowReportModal(true)}
              style={{ width: '100%', marginTop: '10px', padding: '10px', borderRadius: '10px', border: '1.5px solid #fca5a5', background: 'rgba(239,68,68,0.05)', color: '#dc2626', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.05)'}
            >
              <Flag size={14} /> Report this Job
            </button>
          </div>
        </motion.div>
      </div>

      {/* Report Job Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(9,20,38,0.65)', backdropFilter: 'blur(6px)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowReportModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
              style={{ background: 'white', borderRadius: '20px', padding: '32px', maxWidth: '480px', width: '100%', position: 'relative' }}
            >
              <button onClick={() => setShowReportModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>

              {reportDone ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <CheckCircle size={48} style={{ color: 'var(--success)', marginBottom: '16px' }} />
                  <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Report Submitted!</h3>
                  <p style={{ color: '#6b7280', marginTop: '8px' }}>Our team will review this listing.</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Flag size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Report Suspicious Job</h3>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b7280' }}>Help keep the platform safe. Select why this job seems fake.</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {[
                      'Asking for money or registration fee',
                      'Unrealistic salary or benefits',
                      'Suspicious contact info or links',
                      'Fake or non-existent company',
                      'Spam or misleading content',
                      'Other scam indicators'
                    ].map(reason => (
                      <label key={reason} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', border: `1.5px solid ${reportReason === reason ? '#dc2626' : '#e5e7eb'}`, background: reportReason === reason ? 'rgba(239,68,68,0.06)' : 'white', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, transition: 'all 0.15s' }}>
                        <input type="radio" name="reportReason" value={reason} checked={reportReason === reason} onChange={() => setReportReason(reason)} style={{ accentColor: '#dc2626' }} />
                        {reason}
                      </label>
                    ))}
                  </div>

                  <textarea
                    value={reportDetail}
                    onChange={e => setReportDetail(e.target.value)}
                    placeholder="Add more detail (optional)..."
                    rows={3}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '0.88rem', resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: '16px' }}
                  />

                  <AccessibleButton
                    onClick={handleReportJob}
                    disabled={reportSubmitting || !reportReason}
                    style={{ width: '100%', minHeight: '44px', background: '#dc2626', fontSize: '0.92rem' }}
                  >
                    {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                  </AccessibleButton>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
            style={{
              position: 'fixed', bottom: '32px', right: '32px', zIndex: 1000,
              padding: '16px 24px', borderRadius: '14px', color: 'white', fontWeight: '600',
              background: toast.type === 'success' ? 'var(--success)' : '#ef4444',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '10px'
            }}
          >
            <CheckCircle size={20} /> {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
