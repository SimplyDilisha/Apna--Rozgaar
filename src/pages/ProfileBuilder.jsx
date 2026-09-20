import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, Upload, X } from 'lucide-react';
import { AccessibleButton } from '../components/AccessibleButton';
import { useAuth } from '../context/AuthContext';
import { saveCandidateProfile } from '../firebase/candidates';
import confetti from 'canvas-confetti';

const STEPS = [
  'Personal Info',
  'Disability & Needs',
  'Experience',
  'Preferences'
];

// Helper to toggle a value in an array
const toggleInArray = (arr, val) =>
  arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

export default function ProfileBuilder() {
  const navigate = useNavigate();
  const { user, isAuthenticated, refreshProfile, userProfile, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // ── Step 1: Personal Info ──────────────────────────────────────
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [resumeLink, setResumeLink] = useState('');

  // ── Step 2: Disability & Needs ─────────────────────────────────
  const [disabilityType, setDisabilityType] = useState([]);
  const [assistiveTech, setAssistiveTech] = useState([]);
  const [primaryComm, setPrimaryComm] = useState('');
  const [interviewPrefs, setInterviewPrefs] = useState([]);
  const [contactPrefs, setContactPrefs] = useState([]);
  const [accommodations, setAccommodations] = useState([]);

  // ── Step 3: Experience ─────────────────────────────────────────
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [industries, setIndustries] = useState([]);

  // ── Step 4: Preferences ────────────────────────────────────────
  const [workMode, setWorkMode] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [availableFrom, setAvailableFrom] = useState('');
  const [openToRelocation, setOpenToRelocation] = useState(true);

  // Pre-fill from existing profile
  useEffect(() => {
    if (!userProfile) return;
    setFullName(userProfile.name || user?.displayName || '');
    setEmail(userProfile.email || user?.email || '');
    setPhone(userProfile.phone || '');
    setState(userProfile.state || '');
    setCity(userProfile.city || '');
    setResumeLink(userProfile.resumeLink || '');
    setDisabilityType(userProfile.disabilityType || []);
    setAssistiveTech(userProfile.assistiveTech || []);
    setPrimaryComm(userProfile.primaryComm || '');
    setInterviewPrefs(userProfile.interviewPrefs || []);
    setContactPrefs(userProfile.contactPrefs || []);
    setAccommodations(userProfile.accommodations || []);
    setSkills(userProfile.skills || []);
    setExperienceLevel(userProfile.experienceLevel || '');
    setIndustries(userProfile.industries || []);
    setWorkMode(userProfile.workPreference || '');
    setSalaryMin(userProfile.salaryMin || '');
    setSalaryMax(userProfile.salaryMax || '');
    setAvailableFrom(userProfile.availableFrom || '');
    setOpenToRelocation(userProfile.openToRelocation !== undefined ? userProfile.openToRelocation : true);
  }, [userProfile, user]);

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(s => s + 1);
    else handleComplete();
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(s => s - 1);
  };

  const handleComplete = async () => {
    setSaving(true);
    setSaveError('');

    const profileData = {
      name: fullName || user?.displayName || '',
      email: email || user?.email || '',
      phone: phone || '',
      state: state || '',
      city: city || '',
      resumeLink: resumeLink || '',
      disabilityType: disabilityType || [],
      assistiveTech: assistiveTech || [],
      primaryComm: primaryComm || '',
      interviewPrefs: interviewPrefs || [],
      contactPrefs: contactPrefs || [],
      accommodations: accommodations || [],
      skills: skills || [],
      experienceLevel: experienceLevel || '',
      industries: industries || [],
      workPreference: workMode || '',
      salaryMin: salaryMin || '',
      salaryMax: salaryMax || '',
      availableFrom: availableFrom || '',
      openToRelocation: openToRelocation,
      profileCompletedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    console.log('[ProfileBuilder] handleComplete fired');
    console.log('[ProfileBuilder] user:', user?.uid, '| isAuthenticated:', isAuthenticated);
    console.log('[ProfileBuilder] profileData to save:', profileData);

    // user must exist (even if email not verified, we allow saving)
    if (user) {
      const result = await saveCandidateProfile(user.uid, profileData);
      console.log('[ProfileBuilder] saveCandidateProfile result:', result);
      if (!result.success) {
        setSaveError(result.error || 'Failed to save profile. Check console for details.');
        setSaving(false);
        return;
      }
      await refreshProfile();
    } else {
      setSaveError('You must be signed in to save your profile.');
      setSaving(false);
      return;
    }

    setSaving(false);
    setIsCompleted(true);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2563EB', '#0D9488', '#F59E0B', '#10B981']
    });
  };

  const addSkill = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = skillInput.trim();
      if (val && !skills.includes(val)) {
        setSkills([...skills, val]);
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <motion.div
           animate={{ rotate: 360 }}
           transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
           style={{ width: 40, height: 40, border: '4px solid var(--border)', borderTopColor: 'var(--accent-purple)', borderRadius: '50%' }}
        />
      </div>
    );
  }

  if (isCompleted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ padding: '80px 24px', textAlign: 'center', maxWidth: '600px', margin: '0 auto', position: 'relative', zIndex: 10 }}
        role="status"
        aria-live="polite"
      >
        <motion.div 
          initial={{ rotate: -180, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          style={{
            width: '100px', height: '100px', background: 'var(--success)', color: 'white',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 32px',
            boxShadow: '0 10px 30px rgba(5, 150, 105, 0.3)'
          }}
          aria-hidden="true"
        >
          <Check size={50} strokeWidth={3} />
        </motion.div>
        <h1 style={{ fontSize: '3rem', marginBottom: '16px' }}>Your profile is live!</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', marginBottom: '40px', lineHeight: '1.6' }}>
          {isAuthenticated
            ? <>Your profile has been saved! Employers can now find and match with you.</>
            : <>Create an account to save your profile and let employers find you.</>}
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/profile" style={{ textDecoration: 'none' }}>
            <AccessibleButton 
              style={{ minHeight: '60px', fontSize: '1.15rem', padding: '0 36px', borderRadius: '16px' }}
            >
              View My Profile
            </AccessibleButton>
          </Link>
          <Link to="/jobs" style={{ textDecoration: 'none' }}>
            <AccessibleButton 
              variant="outline"
              style={{ minHeight: '60px', fontSize: '1.15rem', padding: '0 36px', borderRadius: '16px' }}
            >
              Browse Jobs <ChevronRight size={20} />
            </AccessibleButton>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '60px auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>
      <h1 className="sr-only">Create Your Profile</h1>
      
      {/* Progress Section */}
      <div style={{ marginBottom: '48px' }} aria-label="Profile setup progress">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', position: 'relative' }}>
          {STEPS.map((step, idx) => {
            const stepNum = idx + 1;
            const isPast = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;
            return (
              <div key={idx} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                flex: 1,
                position: 'relative',
                zIndex: 2
              }}>
                <motion.div 
                  initial={false}
                  animate={{ 
                    scale: isCurrent ? 1.2 : 1,
                    backgroundColor: isPast || isCurrent ? 'var(--accent-purple)' : 'var(--border)',
                    color: isPast || isCurrent ? 'white' : 'transparent'
                  }}
                  style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isCurrent ? '0 0 0 6px var(--accent-purple-glow)' : 'none',
                    transition: 'box-shadow 0.3s'
                  }}
                >
                  {(isPast || isCurrent) ? <Check size={16} strokeWidth={3} /> : null}
                </motion.div>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: isCurrent ? '700' : '600',
                  color: isCurrent ? 'var(--accent-purple)' : 'var(--text-muted)',
                  textAlign: 'center',
                  fontFamily: "'Outfit', sans-serif"
                }}>
                  <span className="desktop-only">{step}</span>
                  <span className="mobile-only">Step {stepNum}</span>
                  {isPast && <span className="sr-only">(Completed)</span>}
                  {isCurrent && <span className="sr-only">(Current Step)</span>}
                </span>
              </div>
            );
          })}
          {/* Progress bar line behind circles */}
          <div style={{ position: 'absolute', top: '16px', left: '10%', right: '10%', height: '2px', background: 'var(--border)', zIndex: 1 }}>
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${((currentStep - 1) / 3) * 100}%` }}
               style={{ height: '100%', background: 'var(--primary-gradient)' }}
             />
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="card" style={{ padding: '40px' }}>
        <form onSubmit={e => e.preventDefault()}>
          <AnimatePresence mode="wait">

            {/* ── STEP 1: Personal Info ── */}
            {currentStep === 1 && (
              <motion.fieldset key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                <legend className="sr-only">Personal Information</legend>
                <h2 style={{ marginBottom: '32px' }}>Personal Info</h2>
                
                <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label htmlFor="fullName">Full Name</label>
                    <input
                      id="fullName" type="text" required
                      placeholder="Priya Sharma" autoComplete="name"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="email">Email Address</label>
                    <input
                      id="email" type="email" required
                      placeholder="priya@example.com" autoComplete="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      id="phone" type="tel"
                      placeholder="+91 98765 43210" autoComplete="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="state">State</label>
                    <select
                      id="state" required autoComplete="address-level1"
                      value={state}
                      onChange={e => setState(e.target.value)}
                    >
                      <option value="">Select State...</option>
                      <option value="MH">Maharashtra</option>
                      <option value="KA">Karnataka</option>
                      <option value="DL">Delhi</option>
                      <option value="TN">Tamil Nadu</option>
                      <option value="UP">Uttar Pradesh</option>
                      <option value="RJ">Rajasthan</option>
                      <option value="GJ">Gujarat</option>
                      <option value="WB">West Bengal</option>
                      <option value="AP">Andhra Pradesh</option>
                      <option value="TS">Telangana</option>
                      <option value="KL">Kerala</option>
                      <option value="HR">Haryana</option>
                      <option value="MP">Madhya Pradesh</option>
                      <option value="OD">Odisha</option>
                      <option value="PB">Punjab</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="city">City</label>
                    <input
                      id="city" type="text" required
                      placeholder="Bangalore" autoComplete="address-level2"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
                    <label htmlFor="profilePhoto">Profile Photo (Optional)</label>
                    <p id="photoHelp" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Upload a professional headshot. This image will only be shown to verified employers.</p>
                    <input id="profilePhoto" type="file" accept="image/*" aria-describedby="photoHelp" style={{ display: 'none' }} />
                    <label htmlFor="profilePhoto" style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '8px', 
                      background: 'rgba(37, 99, 235, 0.05)', border: '2px dashed var(--accent-purple)', 
                      padding: '24px 32px', borderRadius: '12px', cursor: 'pointer',
                      color: 'var(--accent-purple)', fontWeight: '600'
                    }}>
                      <Upload size={20} /> Choose Image
                    </label>
                  </div>
                </div>

                <div style={{ marginTop: '32px' }}>
                  <label htmlFor="resumeLink">Resume Link (Google Drive / LinkedIn / Portfolio)</label>
                  <p id="resumeLinkHelp" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Paste a link to your resume for quick applications.
                  </p>
                  <input 
                    id="resumeLink" 
                    type="url" 
                    placeholder="https://drive.google.com/..." 
                    aria-describedby="resumeLinkHelp"
                    value={resumeLink}
                    onChange={e => setResumeLink(e.target.value)}
                  />
                </div>
              </motion.fieldset>
            )}

            {/* ── STEP 2: Disability & Needs ── */}
            {currentStep === 2 && (
              <motion.fieldset key="step2" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                <legend className="sr-only">Disability & Accessibility Needs</legend>
                <h2 style={{ marginBottom: '32px' }}>Disability & Needs</h2>

                <fieldset style={{ marginBottom: '40px' }}>
                  <legend style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Disability Type</legend>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                    {['Visual Impairment', 'Hearing Impairment', 'Mobility/Physical', 'Cognitive/Learning', 'Speech/Language', 'Autism Spectrum', 'Multiple Disabilities', 'Prefer not to say'].map((type) => (
                      <label key={type} className="glass" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500', margin: 0, padding: '12px 16px', borderRadius: '12px', background: disabilityType.includes(type) ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.4)', cursor: 'pointer', border: disabilityType.includes(type) ? '1.5px solid var(--accent-purple)' : '1.5px solid transparent' }}>
                        <input
                          type="checkbox"
                          checked={disabilityType.includes(type)}
                          onChange={() => setDisabilityType(toggleInArray(disabilityType, type))}
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset style={{ marginBottom: '40px' }}>
                  <legend style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Assistive Technology You Use</legend>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                    {['Screen reader (JAWS)', 'Screen reader (NVDA)', 'Screen reader (VoiceOver)', 'Braille display', 'Switch access', 'Voice control', 'Magnification software', 'Hearing aids', 'Cochlear implants', 'FM/loop system', 'Video relay service (VRS)', 'None currently'].map((type) => (
                      <label key={type} className="glass" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500', margin: 0, padding: '12px 16px', borderRadius: '12px', background: assistiveTech.includes(type) ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.4)', cursor: 'pointer', border: assistiveTech.includes(type) ? '1.5px solid var(--accent-purple)' : '1.5px solid transparent' }}>
                        <input
                          type="checkbox"
                          checked={assistiveTech.includes(type)}
                          onChange={() => setAssistiveTech(toggleInArray(assistiveTech, type))}
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Deaf/HoH Communication Preferences */}
                <div className="communication-prefs-section" style={{ marginBottom: '40px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', fontSize: '1.25rem' }}>
                    <span role="img" aria-label="Sign language">🤟</span>
                    Deaf/HoH Communication Preferences
                  </h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.95rem' }}>
                    Help employers understand your preferred communication methods.
                  </p>
                  
                  <fieldset style={{ marginBottom: '24px' }}>
                    <legend style={{ marginBottom: '12px', fontSize: '1rem', fontWeight: '600' }}>Primary Communication Method</legend>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      {['Spoken language', 'British Sign Language (BSL)', 'American Sign Language (ASL)', 'Indian Sign Language (ISL)', 'Lip reading', 'Written/Text only', 'Combination'].map((method) => (
                        <label key={method} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: primaryComm === method ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.6)', borderRadius: '20px', cursor: 'pointer', fontWeight: '500', border: primaryComm === method ? '1.5px solid var(--accent-purple)' : '1.5px solid transparent' }}>
                          <input
                            type="radio"
                            name="primaryComm"
                            value={method}
                            checked={primaryComm === method}
                            onChange={() => setPrimaryComm(method)}
                          />
                          {method}
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset style={{ marginBottom: '24px' }}>
                    <legend style={{ marginBottom: '12px', fontSize: '1rem', fontWeight: '600' }}>Interview Preferences</legend>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                      {[
                        'Video call with live captions',
                        'Sign language interpreter provided',
                        'Text-based/chat interview',
                        'Written questions in advance',
                        'Extra time for communication',
                        'CART (real-time captioning)',
                        'In-person with loop system',
                        'Asynchronous video responses'
                      ].map((pref) => (
                        <label key={pref} className="glass" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', fontWeight: '500', background: interviewPrefs.includes(pref) ? 'rgba(139,92,246,0.12)' : undefined, border: interviewPrefs.includes(pref) ? '1.5px solid var(--accent-purple)' : '1.5px solid transparent' }}>
                          <input
                            type="checkbox"
                            checked={interviewPrefs.includes(pref)}
                            onChange={() => setInterviewPrefs(toggleInArray(interviewPrefs, pref))}
                          />
                          {pref}
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend style={{ marginBottom: '12px', fontSize: '1rem', fontWeight: '600' }}>Contact Method Preferences</legend>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      {[
                        { label: 'Email', icon: '✉️' },
                        { label: 'SMS/Text', icon: '💬' },
                        { label: 'Video call', icon: '📹' },
                        { label: 'Text Relay (NGT/Relay UK)', icon: '📞' },
                        { label: 'WhatsApp', icon: '📱' },
                        { label: 'No phone calls', icon: '🚫' }
                      ].map(({ label, icon }) => (
                        <label key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: contactPrefs.includes(label) ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.6)', borderRadius: '20px', cursor: 'pointer', fontWeight: '500', border: contactPrefs.includes(label) ? '1.5px solid var(--accent-purple)' : '1.5px solid transparent' }}>
                          <input
                            type="checkbox"
                            checked={contactPrefs.includes(label)}
                            onChange={() => setContactPrefs(toggleInArray(contactPrefs, label))}
                          />
                          <span role="img" aria-hidden="true">{icon}</span> {label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>

                <fieldset>
                  <legend style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Workplace Accommodations Needed</legend>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                    {['Remote work', 'Flexible hours', 'Accessible office', 'Sign language interpreter', 'Large print materials', 'Text-to-speech software', 'Ergonomic equipment', 'Quiet workspace', 'Visual fire alarms', 'Induction/hearing loop', 'Video relay service', 'Real-time captioning (CART)', 'Deaf awareness trained team'].map((acc) => (
                      <label key={acc} className="glass" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500', margin: 0, padding: '12px 16px', borderRadius: '12px', background: accommodations.includes(acc) ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.4)', cursor: 'pointer', border: accommodations.includes(acc) ? '1.5px solid var(--accent-purple)' : '1.5px solid transparent' }}>
                        <input
                          type="checkbox"
                          checked={accommodations.includes(acc)}
                          onChange={() => setAccommodations(toggleInArray(accommodations, acc))}
                        />
                        {acc}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </motion.fieldset>
            )}

            {/* ── STEP 3: Experience ── */}
            {currentStep === 3 && (
              <motion.fieldset key="step3" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                <legend className="sr-only">Skills & Experience</legend>
                <h2 style={{ marginBottom: '32px' }}>Skills & Experience</h2>
                
                <div style={{ marginBottom: '32px' }}>
                  <label htmlFor="skillsInput">Skills</label>
                  <p id="skillsHelp" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Type a skill and press Enter to add.</p>
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px', border: '1px solid var(--border)', borderRadius: '12px', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(4px)'
                  }}>
                    <AnimatePresence>
                      {skills.map(skill => (
                        <motion.span key={skill} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={{
                          display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--primary-gradient)', color: 'white', padding: '6px 14px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '600', boxShadow: '0 2px 8px var(--accent-purple-glow)'
                        }}>
                          {skill}
                          <button type="button" onClick={() => removeSkill(skill)} aria-label={`Remove skill: ${skill}`} style={{
                            background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%'
                          }}>
                            <X size={14} strokeWidth={3} />
                          </button>
                        </motion.span>
                      ))}
                    </AnimatePresence>
                    <input
                      id="skillsInput"
                      type="text"
                      value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                      onKeyDown={addSkill}
                      aria-describedby="skillsHelp"
                      placeholder="e.g. Accessibility Auditing"
                      style={{ border: 'none', outline: 'none', flex: 1, minWidth: '180px', background: 'transparent', padding: '4px', fontSize: '1rem', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <fieldset style={{ marginBottom: '32px' }}>
                  <legend style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Experience Level</legend>
                  <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    {['Entry', 'Mid', 'Senior', 'Lead'].map((level) => (
                      <label key={level} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', margin: 0, padding: '12px 24px', borderRadius: '30px', border: experienceLevel === level ? '2px solid var(--accent-purple)' : '1px solid var(--border)', background: experienceLevel === level ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="expLevel"
                          value={level}
                          checked={experienceLevel === level}
                          onChange={() => setExperienceLevel(level)}
                        />
                        {level}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset style={{ marginBottom: '32px' }}>
                  <legend style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Industries of Interest</legend>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                    {['Technology', 'Finance', 'Healthcare', 'Education', 'Retail', 'Design', 'Customer Support', 'Marketing'].map((ind) => (
                      <label key={ind} className="glass" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500', margin: 0, padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', background: industries.includes(ind) ? 'rgba(139,92,246,0.12)' : undefined, border: industries.includes(ind) ? '1.5px solid var(--accent-purple)' : '1.5px solid transparent' }}>
                        <input
                          type="checkbox"
                          checked={industries.includes(ind)}
                          onChange={() => setIndustries(toggleInArray(industries, ind))}
                        />
                        {ind}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div>
                  <label htmlFor="resumeUpload">Upload Resume</label>
                  <p id="resumeHelp" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Accepted formats: .pdf, .doc, .docx</p>
                  <input id="resumeUpload" type="file" accept=".pdf,.doc,.docx" aria-describedby="resumeHelp" style={{ display: 'none' }} />
                  <label htmlFor="resumeUpload" style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '8px', 
                      background: 'rgba(37, 99, 235, 0.05)', border: '2px dashed var(--accent-purple)', 
                      padding: '24px 32px', borderRadius: '12px', cursor: 'pointer',
                      color: 'var(--accent-purple)', fontWeight: '600'
                    }}>
                      <Upload size={20} /> Choose File
                    </label>
                </div>
              </motion.fieldset>
            )}

            {/* ── STEP 4: Preferences ── */}
            {currentStep === 4 && (
              <motion.fieldset key="step4" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                <legend className="sr-only">Work Preferences</legend>
                <h2 style={{ marginBottom: '32px' }}>Work Preferences</h2>

                <fieldset style={{ marginBottom: '32px' }}>
                  <legend style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Work Mode Preference</legend>
                  <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    {['Remote', 'Hybrid', 'Onsite', 'Any'].map((mode) => (
                      <label key={mode} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', margin: 0, padding: '12px 24px', borderRadius: '30px', border: workMode === mode ? '2px solid var(--accent-purple)' : '1px solid var(--border)', background: workMode === mode ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="workMode"
                          value={mode}
                          checked={workMode === mode}
                          onChange={() => setWorkMode(mode)}
                        />
                        {mode}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset style={{ marginBottom: '32px' }}>
                  <legend style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Expected Salary Range (₹ / year)</legend>
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <label htmlFor="salaryMin" className="sr-only">Minimum Salary</label>
                      <input
                        id="salaryMin" type="number"
                        placeholder="Min (e.g. 500000)"
                        value={salaryMin}
                        onChange={e => setSalaryMin(e.target.value)}
                      />
                    </div>
                    <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>to</span>
                    <div style={{ flex: 1 }}>
                      <label htmlFor="salaryMax" className="sr-only">Maximum Salary</label>
                      <input
                        id="salaryMax" type="number"
                        placeholder="Max (e.g. 1200000)"
                        value={salaryMax}
                        onChange={e => setSalaryMax(e.target.value)}
                      />
                    </div>
                  </div>
                </fieldset>

                <div style={{ marginBottom: '32px' }}>
                  <label htmlFor="availableFrom">Available From</label>
                  <input
                    id="availableFrom" type="date"
                    value={availableFrom}
                    onChange={e => setAvailableFrom(e.target.value)}
                  />
                </div>

                <div className="glass" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', borderRadius: '16px' }}>
                  <div>
                    <label htmlFor="openReloc" style={{ margin: 0, display: 'inline', fontSize: '1.1rem' }}>Open to relocation</label>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>Employers outside your state can match with you.</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      id="openReloc" type="checkbox" role="switch"
                      checked={openToRelocation}
                      onChange={e => setOpenToRelocation(e.target.checked)}
                    />
                  </div>
                </div>

              </motion.fieldset>
            )}
          </AnimatePresence>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '48px', paddingTop: '32px', borderTop: '1px solid var(--border)' }}>
            <AccessibleButton 
              type="button" 
              variant="outline" 
              onClick={handlePrev}
              disabled={currentStep === 1}
              style={{ visibility: currentStep === 1 ? 'hidden' : 'visible' }}
            >
              Back
            </AccessibleButton>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              <AccessibleButton type="button" onClick={handleNext} disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : currentStep === 4 ? 'Complete Profile' : 'Next Step'} <ChevronRight size={20} strokeWidth={3} />
              </AccessibleButton>
              {saveError && (
                <div style={{ color: '#ef4444', fontSize: '0.9rem' }}>{saveError}</div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
