import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Trash2, PlusCircle, CheckCircle, Users, Crown } from 'lucide-react';
import { AccessibleButton } from '../components/AccessibleButton';
import { useAuth } from '../context/AuthContext';
import { createJob, getJobsByEmployer, deleteJob, getAllJobsRaw } from '../firebase/jobs';
import { evaluateJobRiskWithAI } from '../utils/fakeJobDetector';
import CompanyVerificationPage from './CompanyVerificationPage';


export default function EmployerDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, userProfile, refreshProfile } = useAuth();

  const [myJobs, setMyJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    title: '', company: '', location: '', workMode: '',
    salaryMin: '', salaryMax: '', skillsRequired: '', description: ''
  });

  const [expandedJobId, setExpandedJobId] = useState(null);

  const [checks, setChecks] = useState({
    p1:false,p2:false,p3:false,p4:false,
    d1:false,d2:false,d3:false,d4:false,
    s1:false,s2:false,s3:false,s4:false,
    h1:false,h2:false,h3:false,h4:false,h5:false,h6:false
  });

  const score = Object.values(checks).filter(Boolean).length;
  const scorePct = (score / 18) * 100;
  const scoreColor = scorePct >= 80 ? 'var(--success)' : scorePct >= 50 ? 'var(--accent-amber)' : 'var(--danger)';

  const toggleCheck = (k) => setChecks(c => ({ ...c, [k]: !c[k] }));

  useEffect(() => {
    if (!user) { setJobsLoading(false); return; }
    getJobsByEmployer(user.uid).then(r => {
      if (r.success) setMyJobs(r.data);
      setJobsLoading(false);
    });
  }, [user]);

  // If authenticated but company verification is not complete, render verification screen
  if (isAuthenticated && userProfile?.companyVerificationStatus !== 'verified') {
    return (
      <CompanyVerificationPage 
        user={user} 
        profile={userProfile} 
        onRefresh={refreshProfile} 
      />
    );
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/auth'); return; }
    if (!form.title || !form.location || !form.workMode || !form.description) {
      showToast('Please fill all required fields.', 'error');
      return;
    }

    setSubmitting(true);

    const features = [];
    if (checks.p1) features.push('wheelchair_accessible_entrance');
    if (checks.p2) features.push('accessible_restrooms');
    if (checks.p3) features.push('elevator_access');
    if (checks.p4) features.push('accessible_parking');
    if (checks.d1) features.push('screen_reader_compatible');
    if (checks.d2) features.push('video_captions');
    if (checks.d3) features.push('closed_captioning_interviews');
    if (checks.d4) features.push('large_print_materials');
    if (checks.s1) features.push('flexible_hours');
    if (checks.s2) features.push('remote_work');
    if (checks.s3) features.push('sign_language_interpreter');
    if (checks.s4) features.push('accessibility_coordinator');
    if (checks.h1) features.push('induction_loop');
    if (checks.h2) features.push('visual_fire_alarms');
    if (checks.h3) features.push('bsl_asl_isl_interpreters');
    if (checks.h4) features.push('cart_captioning');
    if (checks.h5) features.push('video_relay_service');
    if (checks.h6) features.push('text_alternatives');

    const salary = form.salaryMin && form.salaryMax
      ? `₹${(+form.salaryMin/100000).toFixed(0)}L – ₹${(+form.salaryMax/100000).toFixed(0)}L`
      : form.salaryMin ? `From ₹${(+form.salaryMin/100000).toFixed(0)}L` : '';

    // Fetch all existing jobs to evaluate duplicates
    let existingJobs = [];
    const allJobsRes = await getAllJobsRaw();
    if (allJobsRes.success) {
      existingJobs = allJobsRes.data;
    }

    const jobPayload = {
      title: form.title,
      company: form.company || userProfile?.companyName || userProfile?.name || user?.displayName || 'My Company',
      location: form.location,
      description: form.description,
      jobType: form.workMode.toLowerCase(),
      salary,
      skillsRequired: form.skillsRequired ? form.skillsRequired.split(',').map(s => s.trim()).filter(Boolean) : [],
      accessibilityFeatures: features,
      accessibilityScore: score,
      deafFriendly: checks.h1 || checks.h2 || checks.h3 || checks.h4 || checks.h5 || checks.h6,
      signLanguage: checks.h3,
      captioning: checks.h4,
      employerName: userProfile?.recruiterName || userProfile?.name || user?.displayName || form.company,
      employerId: user.uid
    };

    // Evaluate job risk using Groq AI + rule scoring algorithm
    const evaluation = await evaluateJobRiskWithAI(jobPayload, existingJobs);
    jobPayload.status = evaluation.status;
    jobPayload.riskScore = evaluation.riskScore;
    jobPayload.riskLevel = evaluation.riskLevel;
    jobPayload.riskReasons = evaluation.reasons;
    jobPayload.aiVerificationSummary = evaluation.aiSummary;

    if (evaluation.status === 'rejected') {
      showToast(`🔴 Job Rejected by AI Safety: ${evaluation.reasons?.[0] || 'Failed automatic anti-scam checks.'}`, 'error');
      setSubmitting(false);
      return;
    }

    const result = await createJob(jobPayload, user.uid);

    if (result.success) {
      if (evaluation.status === 'pending_admin') {
        showToast('⚠️ Job flagged for Admin Review due to suspicious indicators. It will be published once approved.', 'info');
      } else {
        showToast('Job published! Candidates can now see it. 🎉', 'success');
      }
      setForm({ title:'', company:'', location:'', workMode:'', salaryMin:'', salaryMax:'', skillsRequired:'', description:'' });
      setChecks({ p1:false,p2:false,p3:false,p4:false,d1:false,d2:false,d3:false,d4:false,s1:false,s2:false,s3:false,s4:false,h1:false,h2:false,h3:false,h4:false,h5:false,h6:false });
      const r2 = await getJobsByEmployer(user.uid);
      if (r2.success) setMyJobs(r2.data);
    } else {
      showToast(result.error || 'Failed to publish job.', 'error');
    }
    setSubmitting(false);
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Delete this job posting?')) return;
    const r = await deleteJob(jobId);
    if (r.success) {
      setMyJobs(j => j.filter(x => x.id !== jobId));
      showToast('Job deleted.', 'success');
    }
  };

  const inp = { width:'100%', padding:'12px 14px', fontSize:'0.95rem', border:'1.5px solid var(--border)', borderRadius:'10px', background:'var(--bg-primary)', color:'var(--text-primary)', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s' };
  const focus = (e) => e.target.style.borderColor = 'var(--accent-purple)';
  const blur = (e) => e.target.style.borderColor = 'var(--border)';

  const Check = ({ id, label }) => (
    <label style={{ display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', padding:'6px 0', fontSize:'0.9rem', margin:0 }}>
      <input type="checkbox" checked={checks[id]} onChange={() => toggleCheck(id)} style={{ accentColor:'var(--accent-purple)', width:'16px', height:'16px' }} />
      {label}
    </label>
  );

  return (
    <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'40px 24px', display:'flex', flexDirection:'column', gap:'40px' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize:'2.2rem', marginBottom:'6px' }}>
          {isAuthenticated ? `Welcome, ${userProfile?.name || user?.displayName || 'Employer'}` : 'Employer Dashboard'}
        </h1>
        <p style={{ color:'var(--text-muted)', fontSize:'1.05rem' }}>Post accessible job listings and manage your openings.</p>
      </div>

      {/* Not logged in */}
      {!isAuthenticated && (
        <div style={{ padding:'32px', borderRadius:'16px', background:'var(--bg-secondary)', border:'1px dashed var(--border)', textAlign:'center' }}>
          <p style={{ color:'var(--text-muted)', marginBottom:'20px', fontSize:'1rem' }}>Sign in to post and manage job listings.</p>
          <AccessibleButton onClick={() => navigate('/auth')}>Sign In to Post Jobs</AccessibleButton>
        </div>
      )}

      {/* My Posted Jobs */}
      {isAuthenticated && (
        <section>
          <h2 style={{ fontSize:'1.5rem', marginBottom:'20px', display:'flex', alignItems:'center', gap:'10px' }}>
            <Briefcase size={24} color="var(--accent-purple)" /> My Posted Jobs
          </h2>

          {jobsLoading ? (
            <div style={{ padding:'40px', borderRadius:'14px', background:'var(--bg-secondary)', textAlign:'center', color:'var(--text-muted)' }}>Loading…</div>
          ) : myJobs.length === 0 ? (
            <div style={{ padding:'40px', borderRadius:'14px', background:'var(--bg-secondary)', border:'1px dashed var(--border)', textAlign:'center' }}>
              <p style={{ color:'var(--text-muted)' }}>No jobs posted yet. Use the form below to add one.</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
              {myJobs.map(job => (
                <motion.div key={job.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                  style={{ padding:'20px 24px', borderRadius:'14px', background:'var(--bg-secondary)', border:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'16px', flexWrap:'wrap' }}>
                  <div style={{ flex:1, minWidth:'200px' }}>
                    <h3 style={{ fontSize:'1rem', marginBottom:'4px' }}>{job.title}</h3>
                    <div style={{ display:'flex', gap:'14px', flexWrap:'wrap', fontSize:'0.85rem', color:'var(--text-muted)' }}>
                      <span>{job.company}</span>
                      <span>📍 {job.location}</span>
                      {job.salary && <span>💰 {job.salary}</span>}
                      <span style={{ padding:'2px 8px', borderRadius:'8px', fontWeight:'600', background:'rgba(5,150,105,0.1)', color:'var(--success)' }}>● Active</span>
                      <span>{(job.applicants||[]).length} applicant{(job.applicants||[]).length!==1?'s':''}</span>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'8px' }}>
                    <AccessibleButton variant="ghost" onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)} style={{ minHeight:'36px', padding:'0 14px', fontSize:'0.85rem', color: 'var(--accent-purple)' }}>
                      <Users size={16} /> Applicants
                    </AccessibleButton>
                    <AccessibleButton variant="outline" onClick={() => navigate(`/jobs/${job.id}`)} style={{ minHeight:'36px', padding:'0 14px', fontSize:'0.85rem' }}>View</AccessibleButton>
                    <button onClick={() => handleDelete(job.id)} style={{ padding:'8px 12px', borderRadius:'10px', border:'1px solid rgba(239,68,68,0.3)', background:'rgba(239,68,68,0.08)', color:'#ef4444', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px', fontSize:'0.82rem' }}>
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {expandedJobId === job.id && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }}
                        style={{ width: '100%', marginTop: '16px', overflow: 'hidden' }}
                      >
                        <div style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                          <h4 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Applicants ({job.applicants?.length || 0})</h4>
                          {!job.applicants || job.applicants.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No one has applied to this job yet.</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {job.applicants.sort((a,b) => (b.isPremium === a.isPremium ? 0 : b.isPremium ? 1 : -1)).map((applicant, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: applicant.isPremium ? '1px solid #FFD700' : '1px solid var(--border)' }}>
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                      <strong>{applicant.name}</strong>
                                      {applicant.isPremium && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', background: 'rgba(255,215,0,0.1)', color: '#FFD700', padding: '2px 6px', borderRadius: '12px' }}><Crown size={10} /> Premium Candidate</span>}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                      {applicant.email && <span>{applicant.email} • </span>}
                                      {applicant.skills && applicant.skills.length > 0 && <span>Skills: {applicant.skills.slice(0,3).join(', ')}{applicant.skills.length > 3 ? '...' : ''}</span>}
                                    </div>
                                  </div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    Applied: {new Date(applicant.appliedAt).toLocaleDateString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Post New Job Form */}
      <section>
        <h2 style={{ fontSize:'1.5rem', marginBottom:'24px', display:'flex', alignItems:'center', gap:'10px' }}>
          <PlusCircle size={24} color="var(--accent-purple)" /> Post a New Job
        </h2>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'32px' }}>

          {/* Basic fields */}
          <div style={{ padding:'32px', borderRadius:'18px', background:'var(--bg-secondary)', border:'1px solid var(--border)', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'20px' }}>
            <div>
              <label style={{ display:'block', marginBottom:'8px', fontWeight:'600', fontSize:'0.9rem' }}>Job Title *</label>
              <input name="title" required value={form.title} onChange={handleChange} onFocus={focus} onBlur={blur} placeholder="e.g. Frontend Engineer" style={inp} />
            </div>
            <div>
              <label style={{ display:'block', marginBottom:'8px', fontWeight:'600', fontSize:'0.9rem' }}>Company Name</label>
              <input name="company" value={form.company} onChange={handleChange} onFocus={focus} onBlur={blur} placeholder={userProfile?.name || 'Your Company'} style={inp} />
            </div>
            <div>
              <label style={{ display:'block', marginBottom:'8px', fontWeight:'600', fontSize:'0.9rem' }}>Location *</label>
              <input name="location" required value={form.location} onChange={handleChange} onFocus={focus} onBlur={blur} placeholder="e.g. Bangalore" style={inp} />
            </div>
            <div>
              <label style={{ display:'block', marginBottom:'8px', fontWeight:'600', fontSize:'0.9rem' }}>Skills (comma-separated)</label>
              <input name="skillsRequired" value={form.skillsRequired} onChange={handleChange} onFocus={focus} onBlur={blur} placeholder="React, Node.js, CSS" style={inp} />
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ display:'block', marginBottom:'8px', fontWeight:'600', fontSize:'0.9rem' }}>Work Mode *</label>
              <div style={{ display:'flex', gap:'14px', flexWrap:'wrap' }}>
                {['Remote','Hybrid','Onsite'].map(m => (
                  <label key={m} style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', padding:'10px 20px', borderRadius:'10px', border:`2px solid ${form.workMode===m?'var(--accent-purple)':'var(--border)'}`, background: form.workMode===m?'var(--accent-purple-glow)':'transparent', fontWeight:'600', transition:'all 0.2s' }}>
                    <input type="radio" name="workMode" value={m} required checked={form.workMode===m} onChange={handleChange} style={{ accentColor:'var(--accent-purple)' }} /> {m}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ display:'block', marginBottom:'8px', fontWeight:'600', fontSize:'0.9rem' }}>Job Description *</label>
              <textarea name="description" required rows={5} value={form.description} onChange={handleChange} onFocus={focus} onBlur={blur} placeholder="Describe the role, responsibilities, and your workplace culture…" style={{ ...inp, resize:'vertical', height:'120px' }} />
            </div>
            <div>
              <label style={{ display:'block', marginBottom:'8px', fontWeight:'600', fontSize:'0.9rem' }}>Min Salary (₹/year)</label>
              <input name="salaryMin" type="number" value={form.salaryMin} onChange={handleChange} onFocus={focus} onBlur={blur} placeholder="e.g. 600000" style={inp} />
            </div>
            <div>
              <label style={{ display:'block', marginBottom:'8px', fontWeight:'600', fontSize:'0.9rem' }}>Max Salary (₹/year)</label>
              <input name="salaryMax" type="number" value={form.salaryMax} onChange={handleChange} onFocus={focus} onBlur={blur} placeholder="e.g. 1200000" style={inp} />
            </div>
          </div>

          {/* Accessibility Checklist */}
          <div style={{ padding:'32px', borderRadius:'18px', background:'var(--bg-secondary)', border:'1px solid var(--border)' }}>
            <h3 style={{ fontSize:'1.2rem', marginBottom:'6px', display:'flex', alignItems:'center', gap:'8px' }}>
              <CheckCircle size={22} color="var(--accent-purple)" /> Workplace Accessibility Checklist
            </h3>
            <p style={{ color:'var(--text-muted)', fontSize:'0.9rem', marginBottom:'24px' }}>Check all that apply. These badges are shown on your job listing.</p>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:'24px' }}>
              {/* Physical */}
              <div style={{ padding:'20px', borderRadius:'12px', border:'1px solid var(--border)', background:'var(--bg-primary)' }}>
                <p style={{ fontWeight:'700', marginBottom:'14px', fontSize:'0.95rem' }}>🏢 Physical</p>
                <Check id="p1" label="Wheelchair accessible entrance" />
                <Check id="p2" label="Accessible restrooms" />
                <Check id="p3" label="Elevator access" />
                <Check id="p4" label="Accessible parking" />
              </div>
              {/* Digital */}
              <div style={{ padding:'20px', borderRadius:'12px', border:'1px solid var(--border)', background:'var(--bg-primary)' }}>
                <p style={{ fontWeight:'700', marginBottom:'14px', fontSize:'0.95rem' }}>💻 Digital</p>
                <Check id="d1" label="Screen reader compatible tools" />
                <Check id="d2" label="Video captions on meetings" />
                <Check id="d3" label="Captioning in interviews" />
                <Check id="d4" label="Large print materials" />
              </div>
              {/* Support */}
              <div style={{ padding:'20px', borderRadius:'12px', border:'1px solid var(--border)', background:'var(--bg-primary)' }}>
                <p style={{ fontWeight:'700', marginBottom:'14px', fontSize:'0.95rem' }}>🤝 Support & Flexibility</p>
                <Check id="s1" label="Flexible working hours" />
                <Check id="s2" label="Remote work available" />
                <Check id="s3" label="Sign language interpreter" />
                <Check id="s4" label="Accessibility coordinator" />
              </div>
              {/* Deaf/HoH */}
              <div style={{ padding:'20px', borderRadius:'12px', border:'1px solid var(--accent-purple-glow)', background:'var(--accent-purple-glow)' }}>
                <p style={{ fontWeight:'700', marginBottom:'14px', fontSize:'0.95rem' }}>🤟 Deaf/HoH</p>
                <Check id="h1" label="Induction / hearing loop" />
                <Check id="h2" label="Visual fire alarms" />
                <Check id="h3" label="BSL/ASL/ISL interpreters" />
                <Check id="h4" label="Real-time captioning (CART)" />
                <Check id="h5" label="Video relay service (VRS)" />
                <Check id="h6" label="Text-based alternatives" />
              </div>
            </div>

            {/* Score bar */}
            <div style={{ marginTop:'24px', padding:'20px', borderRadius:'12px', border:`2px solid ${scoreColor}`, background:'var(--bg-primary)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontWeight:'700', color:scoreColor, marginBottom:'10px' }}>
                <span>Accessibility Score: {score}/18</span>
                <span>{Math.round(scorePct)}%</span>
              </div>
              <div style={{ height:'10px', borderRadius:'5px', background:'var(--border)', overflow:'hidden' }}>
                <motion.div animate={{ width:`${scorePct}%` }} transition={{ type:'spring' }} style={{ height:'100%', background:scoreColor }} />
              </div>
            </div>
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <AccessibleButton type="submit" disabled={submitting || !isAuthenticated} style={{ minHeight:'52px', padding:'0 40px', fontSize:'1.05rem', opacity: (submitting || !isAuthenticated) ? 0.7 : 1 }}>
              {submitting ? 'Publishing…' : 'Publish Job Listing'}
            </AccessibleButton>
          </div>
        </form>
      </section>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:60 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:60 }}
            style={{ position:'fixed', bottom:'32px', right:'32px', zIndex:1000, padding:'16px 24px', borderRadius:'14px', color:'white', fontWeight:'600', background: toast.type==='success'?'var(--success)':'#ef4444', boxShadow:'0 8px 32px rgba(0,0,0,0.2)', display:'flex', alignItems:'center', gap:'10px', maxWidth:'360px' }}>
            <CheckCircle size={20} /> {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
