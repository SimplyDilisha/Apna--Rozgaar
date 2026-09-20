import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, Search, Briefcase, MapPin, Loader2, Filter, X, Lock, AlertCircle, FileCheck, Sparkles } from 'lucide-react';

import { AccessibleButton } from '../components/AccessibleButton';
import { getAllJobs } from '../firebase/jobs';
import { useAuth } from '../context/AuthContext';
import { getCandidateProfile } from '../firebase/candidates';

export default function JobListings() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(new Set());
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('All');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recent'); // 'recent' or 'accessibility'

  useEffect(() => {
    getAllJobs().then((r) => {
      if (r.success) { setJobs(r.data); setFiltered(r.data); }
      else setError(r.error || 'Failed to load jobs.');
      setLoading(false);
    });
  }, []);

  // Check if user is verified
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user) {
      setIsVerified(false);
      setVerificationLoading(false);
      return;
    }

    getCandidateProfile(user.uid).then(r => {
      if (r.success) {
        const isUserVerified = r.data?.certificationStatus === 'verified';
        setIsVerified(isUserVerified);
      }
      setVerificationLoading(false);
    }).catch(() => {
      setVerificationLoading(false);
    });
  }, [user, isAuthenticated, authLoading]);

  useEffect(() => {
    let res = [...jobs];
    if (search.trim()) {
      const q = search.toLowerCase();
      res = res.filter(j =>
        (j.title || '').toLowerCase().includes(q) ||
        (j.company || '').toLowerCase().includes(q) ||
        (j.location || '').toLowerCase().includes(q)
      );
    }
    if (modeFilter !== 'All') {
      res = res.filter(j => (j.jobType || '').toLowerCase() === modeFilter.toLowerCase());
    }

    // Sorting
    if (sortBy === 'accessibility') {
      res.sort((a, b) => (b.accessibilityScore || 0) - (a.accessibilityScore || 0));
    } else {
      // Sort by recent (default behavior in getAllJobs, but good to reinforce)
      res.sort((a, b) => {
        const ta = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt || 0).getTime();
        const tb = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt || 0).getTime();
        return tb - ta;
      });
    }

    setFiltered(res);
  }, [search, modeFilter, sortBy, jobs]);

  const toggleSave = (id) => {
    const n = new Set(saved);
    n.has(id) ? n.delete(id) : n.add(id);
    setSaved(n);
  };

  const logoColor = (name) => {
    const c = ['#6B46C1', '#0D9488', '#D97706', '#DC2626', '#2563EB', '#059669'];
    let h = 0;
    for (let i = 0; i < (name || '').length; i++) h = (name || '').charCodeAt(i) + ((h << 5) - h);
    return c[Math.abs(h) % c.length];
  };

  const timeAgo = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const days = Math.floor((Date.now() - d) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 30) return `${days} days ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, type: 'spring' } })
  };

  const Sidebar = () => (
    <aside style={{
      width: '260px', flexShrink: 0, padding: '24px', borderRadius: '16px',
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
      height: 'fit-content', position: 'sticky', top: '90px'
    }}>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '20px', fontWeight: '700' }}>Filters</h2>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search roles, companies…"
          style={{ paddingLeft: '36px', width: '100%', boxSizing: 'border-box' }}
          aria-label="Search jobs"
        />
      </div>

      {/* Work Mode */}
      <div>
        <p style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '12px' }}>Work Mode</p>
        {['All', 'Remote', 'Hybrid', 'Onsite'].map(m => (
          <label key={m} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', cursor: 'pointer', fontWeight: modeFilter === m ? '700' : '400', color: modeFilter === m ? 'var(--accent-purple)' : 'var(--text-primary)' }}>
            <input type="radio" name="mode" checked={modeFilter === m} onChange={() => setModeFilter(m)} style={{ accentColor: 'var(--accent-purple)' }} />
            {m}
          </label>
        ))}
      </div>

      {/* Sort By */}
      <div style={{ marginTop: '24px' }}>
        <p style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '12px' }}>Sort By</p>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '10px',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            outline: 'none',
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          <option value="recent">Most Recent</option>
          <option value="accessibility">Top Accessibility</option>
        </select>
      </div>

      {(search || modeFilter !== 'All' || sortBy !== 'recent') && (
        <button onClick={() => { setSearch(''); setModeFilter('All'); setSortBy('recent'); }} style={{ marginTop: '20px', width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <X size={14} /> Clear Filters
        </button>
      )}
    </aside>
  );

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>

        {/* Desktop Sidebar */}
        <div className="desktop-only">
          <Sidebar />
        </div>

        {/* Mobile filter button */}
        <button
          className="mobile-only"
          onClick={() => setMobileOpen(true)}
          style={{
            position: 'fixed', bottom: '90px', right: '20px', zIndex: 50,
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'var(--accent-purple)', border: 'none', color: 'white',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(139,92,246,0.4)'
          }}
        >
          <Filter size={22} />
        </button>

        {/* Mobile Sidebar Drawer */}
        {mobileOpen && (
          <div className="mobile-only" style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)' }} onClick={() => setMobileOpen(false)}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '280px', background: 'var(--bg-primary)', padding: '24px', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2 style={{ margin: 0 }}>Filters</h2>
                <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', padding: '4px' }}><X size={22} /></button>
              </div>
              <Sidebar />
            </div>
          </div>
        )}

        {/* Main */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {/* Verification Check */}
          {!authLoading && isAuthenticated && !verificationLoading && !isVerified && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '24px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(249,115,22,0.08), rgba(239,68,68,0.08))',
                border: '2px solid rgba(249,115,22,0.3)',
                marginBottom: '28px'
              }}
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0, marginTop: '2px' }}>
                  <Lock size={24} color='#f97316' />
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 8px 0', color: '#f97316' }}>Certificate Verification Recommended</h2>
                  <p style={{ color: 'var(--text-muted)', margin: '0 0 12px 0', lineHeight: '1.5' }}>
                    To build trust with employers, we recommend verifying your certificate. While you can still view and apply for jobs, verified candidates are 5x more likely to get hired and gain instant credibility.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <AccessibleButton
                      onClick={() => navigate('/profile')}
                      style={{ fontSize: '0.85rem', padding: '0 16px', minHeight: '36px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <FileCheck size={14} />
                      Go to Verify Certificate
                    </AccessibleButton>
                    <AccessibleButton
                      variant="outline"
                      onClick={() => navigate('/interview-prep')}
                      style={{ fontSize: '0.85rem', padding: '0 16px', minHeight: '36px' }}
                    >
                      Continue Learning
                    </AccessibleButton>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {!verificationLoading && isAuthenticated && !isVerified && (
            <>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '28px' }}>
                💡 Upload your certificate photo to get verified and unlock job opportunities.
              </p>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <h1 style={{ fontSize: '1.8rem', margin: 0 }}>
              {loading ? 'Loading jobs…' : `${filtered.length} job${filtered.length !== 1 ? 's' : ''} found`}
            </h1>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: 'var(--text-muted)', gap: '16px' }}>
              <Loader2 size={40} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: '1rem' }}>Loading jobs from database…</p>
              <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : error ? (
            <div style={{ padding: '40px', borderRadius: '16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', textAlign: 'center' }}>
              <p style={{ fontWeight: '600', marginBottom: '8px' }}>Error loading jobs</p>
              <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px 40px', borderRadius: '20px', background: 'var(--bg-secondary)', border: '1px dashed var(--border)', textAlign: 'center' }}>
              <p style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '8px' }}>No jobs found</p>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                {jobs.length === 0 ? 'No jobs posted yet. Be the first to post one!' : 'Try different search terms or filters.'}
              </p>
              {(search || modeFilter !== 'All' || sortBy !== 'recent') && (
                <AccessibleButton variant="outline" onClick={() => { setSearch(''); setModeFilter('All'); setSortBy('recent'); }}>Clear Filters</AccessibleButton>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {filtered.map((job, i) => {
                const isSaved = saved.has(job.id);
                const color = logoColor(job.company);
                const logo = (job.company || 'J').charAt(0).toUpperCase();
                const mode = (job.jobType || 'remote');
                const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);
                const tags = (job.accessibilityFeatures || []).slice(0, 3);

                return (
                  <motion.article
                    key={job.id}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    style={{
                      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                      borderRadius: '18px', padding: '24px', display: 'flex', gap: '20px',
                      flexWrap: 'wrap', transition: 'box-shadow 0.2s, border-color 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--card-shadow-hover)'; e.currentTarget.style.borderColor = 'var(--accent-purple)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    {/* Logo */}
                    <div style={{
                      width: '52px', height: '52px', borderRadius: '12px', flexShrink: 0,
                      background: `${color}20`, color, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontWeight: '800', fontSize: '1.4rem'
                    }}>{logo}</div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <h2 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>
                        <Link to={`/jobs/${job.id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                          {job.title}
                        </Link>
                      </h2>
                      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '12px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Briefcase size={13} />{job.company}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={13} />{job.location}</span>
                        <span style={{
                          padding: '2px 10px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: '600',
                          background: mode === 'remote' ? 'rgba(5,150,105,0.1)' : mode === 'hybrid' ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)',
                          color: mode === 'remote' ? 'var(--success)' : mode === 'hybrid' ? 'var(--accent-amber)' : 'var(--accent-purple)'
                        }}>{modeLabel}</span>
                        {job.salary && <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>💰 {job.salary}</span>}
                      </div>

                      {/* Badges */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {job.status === 'active' && (
                          <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', background: 'rgba(13, 148, 136, 0.12)', color: '#0d9488', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Sparkles size={12} /> Groq AI Verified
                          </span>
                        )}
                        {job.deafFriendly && <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', background: 'rgba(37,99,235,0.1)', color: '#2563EB' }}>🤟 Deaf Friendly</span>}
                        {tags.map(t => (
                          <span key={t} style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', background: 'rgba(5,150,105,0.1)', color: 'var(--success)', textTransform: 'capitalize' }}>
                            ✓ {t.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {job.createdAt && <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-primary)' }}>{timeAgo(job.createdAt)}</span>}
                      </div>

                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', gap: '12px', flexShrink: 0 }}>
                      {job.accessibilityScore != null && (
                        <div style={{ textAlign: 'center', minWidth: '80px' }}>
                          <div style={{
                            fontSize: '1.6rem',
                            fontWeight: '900',
                            background: 'var(--primary-gradient)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            lineHeight: 1
                          }}>
                            {Math.round((job.accessibilityScore / 18) * 100)}%
                          </div>
                          <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>Accessibility</div>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => toggleSave(job.id)}
                          aria-pressed={isSaved}
                          style={{
                            padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)',
                            background: isSaved ? 'var(--accent-purple)' : 'transparent',
                            color: isSaved ? 'white' : 'var(--text-muted)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center'
                          }}
                        >
                          <Bookmark size={17} fill={isSaved ? 'white' : 'none'} />
                        </button>
                        <Link to={`/jobs/${job.id}`} style={{ textDecoration: 'none' }}>
                          <AccessibleButton
                            className="view-apply-btn"
                            data-voice-command="view and apply"
                            style={{ minHeight: '38px', padding: '0 16px', fontSize: '0.88rem' }}
                          >
                            View & Apply
                          </AccessibleButton>
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
