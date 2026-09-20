import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, Mail, Phone, MapPin, Briefcase, Edit3, LogOut,
  Star, Shield, Settings, ChevronRight, BookOpen, Clock,
  CheckCircle, Loader2, Crown, FileCheck, AlertCircle, Send,
  DollarSign, Calendar, Globe, Headphones, MessageSquare, Zap,
  RefreshCw
} from 'lucide-react';
import { AccessibleButton } from '../components/AccessibleButton';
import { useAuth } from '../context/AuthContext';
import { getCandidateProfile, updateCertificationStatus } from '../firebase/candidates';

const STATE_MAP = {
  MH: 'Maharashtra', KA: 'Karnataka', DL: 'Delhi', TN: 'Tamil Nadu',
  UP: 'Uttar Pradesh', RJ: 'Rajasthan', GJ: 'Gujarat', WB: 'West Bengal',
  AP: 'Andhra Pradesh', TS: 'Telangana', KL: 'Kerala', HR: 'Haryana',
  MP: 'Madhya Pradesh', OD: 'Odisha', PB: 'Punjab'
};

export default function UserProfile() {
  const navigate = useNavigate();
  const { user, userProfile, userType, logout, isAuthenticated, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [verificationSubmitting, setVerificationSubmitting] = useState(false);
  const [certificatePhoto, setCertificatePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoError, setPhotoError] = useState('');

  const fetchProfile = useCallback(async (showRefreshSpinner = false) => {
    if (!user) return;
    if (showRefreshSpinner) setRefreshing(true);
    else setLoading(true);

    const r = await getCandidateProfile(user.uid);
    console.log('[UserProfile] fetchProfile result:', r);

    if (r.success) {
      setProfile(r.data);
      setVerificationPending(r.data?.certificationStatus === 'pending');
    } else {
      // Fallback to auth context data if no RTDB entry yet
      console.warn('[UserProfile] No RTDB data, falling back to userProfile context:', userProfile);
      setProfile(userProfile);
    }

    if (showRefreshSpinner) setRefreshing(false);
    else setLoading(false);
  }, [user, userProfile]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    fetchProfile();
  }, [user, authLoading, fetchProfile]);

  const handleVerificationRequest = async () => {
    if (!user || !profile) return;
    if (!certificatePhoto) {
      setPhotoError('Please upload a certificate photo first');
      return;
    }
    setVerificationSubmitting(true);
    try {
      const updateResult = await updateCertificationStatus(user.uid, 'pending', photoPreview);
      if (updateResult.success) {
        setVerificationPending(true);
        setShowVerificationMessage(true);
        setCertificatePhoto(null);
        setPhotoPreview(null);
        const teamEmail = 'relaxitsaryan@gmail.com';
        const subject = encodeURIComponent(`Certificate Verification Request - ${profile.name || user.displayName}`);
        const body = encodeURIComponent(
          `Hello,\n\nI am submitting my certificate for PWD verification.\n\nUser Details:\nName: ${profile.name || user.displayName}\nEmail: ${user.email}\nUser ID: ${user.uid}\n\nPlease find the certificate photo attached.\n\nThank you,\n${profile.name || user.displayName}`
        );
        window.location.href = `mailto:${teamEmail}?subject=${subject}&body=${body}`;
        setTimeout(() => setShowVerificationMessage(false), 6000);
      }
    } catch (error) {
      console.error('Verification error:', error);
      alert('Failed to submit verification request. Please try again.');
    } finally {
      setVerificationSubmitting(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setPhotoError('Please upload an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { setPhotoError('File size must be less than 5MB'); return; }
    setPhotoError('');
    setCertificatePhoto(file);
    const reader = new FileReader();
    reader.onload = (event) => setPhotoPreview(event.target?.result);
    reader.readAsDataURL(file);
  };

  // Not logged in
  if (!authLoading && !isAuthenticated) return (
    <div style={{ maxWidth: '560px', margin: '100px auto', padding: '0 24px', textAlign: 'center' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ width: '96px', height: '96px', borderRadius: '50%', margin: '0 auto 28px', background: 'linear-gradient(135deg,rgba(139,92,246,0.15),rgba(20,184,166,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={42} color="var(--accent-purple)" />
        </div>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>Sign in to view your profile</h1>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '28px' }}>Build your profile, save jobs, and get matched with accessible employers.</p>
        <AccessibleButton onClick={() => navigate('/auth')} style={{ fontSize: '1rem', padding: '0 36px', minHeight: '52px' }}>Sign In / Create Account</AccessibleButton>
      </motion.div>
    </div>
  );

  if (loading || authLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: '12px', color: 'var(--text-muted)' }}>
      <Loader2 size={36} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <p>Loading your profile…</p>
    </div>
  );

  const name = profile?.name || userProfile?.name || user?.displayName || 'User';
  const email = profile?.email || user?.email || '';
  const phone = profile?.phone || '';
  const city = profile?.city || '';
  const stateCode = profile?.state || '';
  const stateName = STATE_MAP[stateCode] || stateCode;
  const skills = profile?.skills || [];
  const disabilities = Array.isArray(profile?.disabilityType) ? profile.disabilityType : profile?.disabilityType ? [profile.disabilityType] : [];
  const accommodations = profile?.accommodations || [];
  const assistiveTech = profile?.assistiveTech || [];
  const workMode = profile?.workPreference || '';
  const expLevel = profile?.experienceLevel || '';
  const industries = profile?.industries || [];
  const salaryMin = profile?.salaryMin || '';
  const salaryMax = profile?.salaryMax || '';
  const availableFrom = profile?.availableFrom || '';
  const openToRelocation = profile?.openToRelocation;
  const primaryComm = profile?.primaryComm || '';
  const interviewPrefs = profile?.interviewPrefs || [];
  const contactPrefs = profile?.contactPrefs || [];
  const resumeLink = profile?.resumeLink || '';
  const hasProfile = !!(skills.length || city || disabilities.length || workMode || expLevel);
  const joined = profile?.createdAt || userProfile?.createdAt;

  const card = { padding: '24px', borderRadius: '18px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' };
  const sectionTitle = { fontSize: '1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' };
  const tag = (bg, color) => ({ padding: '5px 12px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: '600', background: bg, color });

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '36px 24px 80px' }}>
      <motion.div 
        initial={{ opacity: 0, y: 16 }} 
        animate={{ opacity: 1, y: 0 }} 
        style={{ 
          ...card, 
          marginBottom: '28px', 
          position: 'relative', 
          overflow: 'hidden',
          padding: '24px 24px 20px 24px'
        }}
      >
        {/* Gradient banner */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100px', background: 'linear-gradient(135deg,rgba(139,92,246,0.18),rgba(20,184,166,0.12))', borderRadius: '18px 18px 0 0' }} />

        {/* Profile Details Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 2 }}>
          
          {/* Top Row: Avatar, Name & Main Actions */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', flexWrap: 'wrap', marginTop: '30px' }}>
            
            {/* Avatar overlapping the banner */}
            <div style={{ 
              width: '90px', 
              height: '90px', 
              borderRadius: '50%', 
              background: 'var(--primary-gradient)', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '2.2rem', 
              fontWeight: '800', 
              flexShrink: 0, 
              border: '4px solid var(--bg-secondary)', 
              boxShadow: 'var(--card-shadow-hover)',
              marginTop: '-45px'
            }}>
              {name.charAt(0).toUpperCase()}
            </div>

            {/* Name and Quick Role Info */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: '0 0 2px 0', lineHeight: '1.2' }}>{name}</h1>
              <p style={{ margin: 0, color: 'var(--accent-purple)', fontWeight: '600', fontSize: '0.9rem', textTransform: 'capitalize' }}>
                {userType || 'Candidate'} {workMode && `• ${workMode}`} {expLevel && `• ${expLevel} Level`}
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {resumeLink && (
                <a href={resumeLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <AccessibleButton variant="outline" style={{ fontSize: '0.85rem', padding: '0 14px', minHeight: '38px' }}>
                    <BookOpen size={14} /> Resume
                  </AccessibleButton>
                </a>
              )}
              <AccessibleButton variant="outline" onClick={() => navigate('/profile/create')} style={{ fontSize: '0.85rem', padding: '0 14px', minHeight: '38px' }}>
                <Edit3 size={14} /> {hasProfile ? 'Edit Profile' : 'Complete Profile'}
              </AccessibleButton>
              <AccessibleButton
                variant="outline"
                onClick={() => fetchProfile(true)}
                disabled={refreshing}
                style={{ fontSize: '0.85rem', padding: '0 14px', minHeight: '38px' }}
                title="Refresh profile data from database"
              >
                <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </AccessibleButton>
              <AccessibleButton variant="ghost" onClick={async () => { await logout(); navigate('/'); }} style={{ fontSize: '0.85rem', padding: '0 14px', minHeight: '38px', color: '#ef4444' }}>
                <LogOut size={14} /> Sign Out
              </AccessibleButton>
            </div>

          </div>

          {/* Bottom Row: Contact Details & Status Badges */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '16px', 
            borderTop: '1px solid var(--border)', 
            paddingTop: '16px',
            marginTop: '8px'
          }}>
            
            {/* Contact Information List */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {email && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} />{email}</span>}
              {phone && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} />{phone}</span>}
              {(city || stateName) && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} />{[city, stateName].filter(Boolean).join(', ')}</span>}
              {availableFrom && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} />Available from {new Date(availableFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
            </div>

            {/* Status Badges */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {profile?.isPremium && (
                <span style={{ ...tag('rgba(255,215,0,0.15)', '#FFD700'), display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Crown size={12} /> Premium
                </span>
              )}
              <span style={{ ...tag('rgba(5,150,105,0.1)', 'var(--success)'), display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={12} /> Verified Email
              </span>
              {profile?.certificationStatus === 'verified' && (
                <span style={{ ...tag('rgba(59,130,246,0.1)', '#3b82f6'), display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <FileCheck size={12} /> Verified Certificate
                </span>
              )}
              {profile?.certificationStatus === 'pending' && (
                <span style={{ ...tag('rgba(249,115,22,0.1)', '#f97316'), display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> Verification Pending
                </span>
              )}
              {openToRelocation && (
                <span style={{ ...tag('rgba(16,185,129,0.1)', '#10b981'), display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Globe size={12} /> Relocation OK
                </span>
              )}
            </div>

          </div>

        </div>
      </motion.div>

      {/* Complete profile prompt */}
      {!hasProfile && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{ ...card, marginBottom: '28px', textAlign: 'center', border: '2px dashed var(--accent-purple)', background: 'rgba(139,92,246,0.04)' }}>
          <h2 style={{ color: 'var(--accent-purple)', marginBottom: '8px' }}>Complete Your Profile</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', maxWidth: '480px', margin: '0 auto 20px' }}>Add your skills and preferences so employers can match you with accessible jobs.</p>
          <AccessibleButton onClick={() => navigate('/profile/create')}>Build My Profile <ChevronRight size={16} /></AccessibleButton>
        </motion.div>
      )}

      {/* ── Main Info Grid (Bento Grid) ── */}
      <div 
        className="bento-grid"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', 
          gap: '20px',
        }}
      >
        {/* Inject CSS rules for the bento grid desktop behavior */}
        <style>{`
          @media (min-width: 1024px) {
            .bento-grid {
              grid-template-columns: repeat(3, 1fr) !important;
              grid-auto-flow: dense;
            }
            .bento-skills {
              grid-column: span 2;
            }
            .bento-work {
              grid-row: span 2;
            }
            .bento-accessibility {
              grid-row: span 2;
            }
            .bento-certificate {
              grid-column: span 2;
            }
            .bento-account {
              grid-column: span 1;
            }
            .bento-tech {
              grid-column: span 1;
            }
            .bento-comm {
              grid-column: span 1;
            }
          }
        `}</style>

        {/* Skills */}
        <motion.div 
          className="bento-skills"
          initial={{ opacity: 0, y: 16 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }} 
          style={card}
        >
          <p style={sectionTitle}><Star size={18} color="var(--accent-purple)" /> Skills</p>
          {skills.length > 0 ? (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {skills.map(s => <span key={s} style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '0.83rem', fontWeight: '700', background: 'var(--primary-gradient)', color: 'white' }}>{s}</span>)}
            </div>
          ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No skills added yet.</p>}
        </motion.div>

        {/* Work Preferences */}
        <motion.div 
          className="bento-work"
          initial={{ opacity: 0, y: 16 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.14 }} 
          style={card}
        >
          <p style={sectionTitle}><Briefcase size={18} color="var(--accent-teal)" /> Work Preferences</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
            {[
              ['Work Mode', workMode],
              ['Experience', expLevel],
              ['Open to Relocation', openToRelocation !== undefined ? (openToRelocation ? 'Yes' : 'No') : '—']
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                <span style={{ fontWeight: '600', textTransform: 'capitalize', color: v === 'Yes' ? 'var(--success)' : 'var(--text-primary)' }}>{v || '—'}</span>
              </div>
            ))}
            {(salaryMin || salaryMax) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><DollarSign size={13} /> Salary</span>
                <span style={{ fontWeight: '600' }}>
                  {salaryMin && salaryMax
                    ? `₹${Number(salaryMin).toLocaleString('en-IN')} – ₹${Number(salaryMax).toLocaleString('en-IN')}`
                    : salaryMin
                    ? `₹${Number(salaryMin).toLocaleString('en-IN')}+`
                    : `Up to ₹${Number(salaryMax).toLocaleString('en-IN')}`}
                </span>
              </div>
            )}
            {industries.length > 0 && (
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>Industries</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {industries.map(i => <span key={i} style={{ padding: '3px 12px', borderRadius: '14px', fontSize: '0.78rem', fontWeight: '600', background: 'rgba(20,184,166,0.1)', color: 'var(--accent-teal)' }}>{i}</span>)}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Accessibility Needs */}
        <motion.div 
          className="bento-accessibility"
          initial={{ opacity: 0, y: 16 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.18 }} 
          style={card}
        >
          <p style={sectionTitle}><Shield size={18} color="var(--success)" /> Accessibility Needs</p>
          {disabilities.length > 0 ? (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {disabilities.map(d => <span key={d} style={{ padding: '5px 12px', borderRadius: '14px', fontSize: '0.82rem', fontWeight: '600', background: 'rgba(5,150,105,0.1)', color: 'var(--success)' }}>{d}</span>)}
            </div>
          ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '10px' }}>Not specified.</p>}
          {accommodations.length > 0 && (
            <div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '600' }}>Accommodations</p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {accommodations.map(a => <span key={a} style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: '600', background: 'rgba(139,92,246,0.08)', color: 'var(--accent-purple)' }}>{a}</span>)}
              </div>
            </div>
          )}
        </motion.div>

        {/* Assistive Technology */}
        {assistiveTech.length > 0 && (
          <motion.div 
            className="bento-tech"
            initial={{ opacity: 0, y: 16 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }} 
            style={card}
          >
            <p style={sectionTitle}><Headphones size={18} color="var(--accent-purple)" /> Assistive Technology</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {assistiveTech.map(t => <span key={t} style={{ padding: '5px 12px', borderRadius: '14px', fontSize: '0.82rem', fontWeight: '600', background: 'rgba(139,92,246,0.08)', color: 'var(--accent-purple)' }}>{t}</span>)}
            </div>
          </motion.div>
        )}

        {/* Communication Preferences */}
        {(primaryComm || interviewPrefs.length > 0 || contactPrefs.length > 0) && (
          <motion.div 
            className="bento-comm"
            initial={{ opacity: 0, y: 16 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.22 }} 
            style={card}
          >
            <p style={sectionTitle}><MessageSquare size={18} color="var(--accent-teal)" /> Communication</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
              {primaryComm && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Primary Method</span>
                  <span style={{ fontWeight: '600', maxWidth: '55%', textAlign: 'right' }}>{primaryComm}</span>
                </div>
              )}
              {contactPrefs.length > 0 && (
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', display: 'block', marginBottom: '8px' }}>Contact Preferences</span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {contactPrefs.map(c => <span key={c} style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: '600', background: 'rgba(20,184,166,0.1)', color: 'var(--accent-teal)' }}>{c}</span>)}
                  </div>
                </div>
              )}
              {interviewPrefs.length > 0 && (
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', display: 'block', marginBottom: '8px' }}>Interview Preferences</span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {interviewPrefs.map(p => <span key={p} style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: '600', background: 'rgba(99,102,241,0.08)', color: '#6366f1' }}>{p}</span>)}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Account */}
        <motion.div 
          className="bento-account"
          initial={{ opacity: 0, y: 16 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.24 }} 
          style={card}
        >
          <p style={sectionTitle}><Settings size={18} color="var(--text-muted)" /> Account</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
            {[
              ['Email', email],
              ['Verified', '✓ Yes'],
              ['Account Type', userType || 'Candidate'],
              ['Joined', joined ? new Date(joined).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—']
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                <span style={{ fontWeight: '600', color: l === 'Verified' ? 'var(--success)' : 'var(--text-primary)', textTransform: l === 'Account Type' ? 'capitalize' : 'none', maxWidth: '60%', textAlign: 'right', wordBreak: 'break-all' }}>{v}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Certificate Verification */}
        <motion.div 
          className="bento-certificate"
          initial={{ opacity: 0, y: 16 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.28 }} 
          style={card}
        >
          <p style={sectionTitle}><FileCheck size={18} color={verificationPending ? '#f97316' : profile?.certificationStatus === 'verified' ? '#3b82f6' : 'var(--text-muted)'} /> Certificate Verification</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {profile?.certificationStatus === 'verified' ? (
              <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(59,130,246,0.08)', borderLeft: '4px solid #3b82f6' }}>
                <p style={{ color: '#3b82f6', fontWeight: '600', fontSize: '0.9rem', margin: '0 0 4px 0' }}>✓ Verified</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Your certificate has been verified by our team.</p>
              </div>
            ) : verificationPending ? (
              <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(249,115,22,0.08)', borderLeft: '4px solid #f97316' }}>
                <p style={{ color: '#f97316', fontWeight: '600', fontSize: '0.9rem', margin: '0 0 4px 0' }}>⏳ Verification Pending</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Your verification request is being reviewed. We'll notify you soon.</p>
              </div>
            ) : (
              <>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Verify your credentials to build trust and get better opportunities.</p>
                <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(139,92,246,0.05)', border: '2px dashed var(--accent-purple)' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>📸 Upload Certificate Photo</p>
                  {photoPreview ? (
                    <div style={{ marginBottom: '12px' }}>
                      <img src={photoPreview} alt="Certificate preview" style={{ maxHeight: '120px', borderRadius: '8px', marginBottom: '8px', display: 'block' }} />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <AccessibleButton onClick={() => document.getElementById('photoInput')?.click()} style={{ flex: 1, fontSize: '0.8rem', padding: '0 8px', minHeight: '32px' }}>Change Photo</AccessibleButton>
                        <AccessibleButton variant="outline" onClick={() => { setCertificatePhoto(null); setPhotoPreview(null); setPhotoError(''); }} style={{ flex: 1, fontSize: '0.8rem', padding: '0 8px', minHeight: '32px' }}>Remove</AccessibleButton>
                      </div>
                    </div>
                  ) : (
                    <div onClick={() => document.getElementById('photoInput')?.click()} style={{ padding: '24px', borderRadius: '8px', background: 'var(--bg-primary)', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-primary)'}
                    >
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Click to upload certificate photo</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '4px 0 0 0' }}>JPG, PNG up to 5MB</p>
                    </div>
                  )}
                  <input id="photoInput" type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} aria-label="Upload certificate photo" />
                  {photoError && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '8px', margin: '8px 0 0 0' }}>⚠️ {photoError}</p>}
                </div>
                <AccessibleButton onClick={handleVerificationRequest} disabled={verificationSubmitting || !certificatePhoto} style={{ fontSize: '0.85rem', padding: '0 16px', minHeight: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: !certificatePhoto ? 0.6 : 1, cursor: !certificatePhoto ? 'not-allowed' : 'pointer' }}>
                  {verificationSubmitting ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</> : <><Send size={14} /> Submit for Verification</>}
                </AccessibleButton>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0', textAlign: 'center' }}>Must upload a photo to submit verification request</p>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Verification Success Message */}
      {showVerificationMessage && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          style={{ position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, maxWidth: '480px', width: '90vw' }}>
          <div style={{ padding: '16px 20px', borderRadius: '12px', background: 'var(--success)', color: 'white', boxShadow: '0 8px 24px var(--accent-teal-glow)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle size={20} style={{ flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: '700', margin: '0 0 2px 0' }}>Verification Request Submitted</p>
              <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.95 }}>Our team will verify your certificate within a few hours. We'll send you an email once done.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '16px', marginTop: '28px' }}>
        {[
          { to: '/jobs', icon: <Briefcase size={26} color="var(--accent-purple)" />, title: 'Browse Jobs', sub: 'Find accessible opportunities' },
          { to: '/resume-builder', icon: <BookOpen size={26} color="var(--accent-teal)" />, title: 'AI Resume', sub: 'Build your resume with AI' },
          { to: '/interview-prep', icon: <Clock size={26} color="var(--success)" />, title: 'Interview Prep', sub: 'Practice with AI' },
          { to: '/profile/create', icon: <Zap size={26} color="#f59e0b" />, title: 'Update Profile', sub: 'Keep your info fresh' }
        ].map(item => (
          <Link key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
            <motion.div whileHover={{ y: -4, boxShadow: '0 12px 36px rgba(0,0,0,0.1)' }} transition={{ type: 'spring', stiffness: 300 }}
              style={{ ...card, textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ marginBottom: '10px' }}>{item.icon}</div>
              <p style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '4px' }}>{item.title}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>{item.sub}</p>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
