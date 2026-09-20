import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Building, AlertTriangle, MessageSquare, Check, X, Eye, FileText, Globe, User, Phone, MapPin, Sparkles } from 'lucide-react';
import { AccessibleButton } from '../components/AccessibleButton';
import { useAuth } from '../context/AuthContext';
import { getAllEmployers, saveEmployerProfile } from '../firebase/employers';
import { getPendingJobs, getJobReports, resolveReport, updateJob, deleteJob } from '../firebase/jobs';
import { verifyCompanyWithAI } from '../services/groqService';


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

export default function AdminDashboard() {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('companies');
  
  // States
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [suspiciousJobs, setSuspiciousJobs] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingDoc, setViewingDoc] = useState(null); // base64 URL of company doc to view
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch pending companies
      const empRes = await getAllEmployers();
      if (empRes.success) {
        const pending = empRes.data.filter(emp => emp.companyVerificationStatus === 'pending');
        setPendingCompanies(pending);
      }

      // 2. Fetch suspicious jobs (pending_admin status)
      const jobRes = await getPendingJobs();
      if (jobRes.success) {
        setSuspiciousJobs(jobRes.data);
      }

      // 3. Fetch reported jobs
      const repRes = await getJobReports();
      if (repRes.success) {
        // filter reports that are 'pending'
        const pendingReps = repRes.data.filter(rep => rep.status === 'pending');
        setReports(pendingReps);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading moderation data', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Moderate Company Action
  const handleModerateCompany = async (empId, status) => {
    const res = await saveEmployerProfile(empId, { companyVerificationStatus: status });
    if (res.success) {
      showToast(`Company status updated to ${status}!`, 'success');
      setPendingCompanies(prev => prev.filter(c => c.id !== empId));
    } else {
      showToast('Failed to update company status.', 'error');
    }
  };

  // AI Re-verify Company Action
  const handleAiReVerifyCompany = async (emp) => {
    showToast(`Running Groq AI verification on ${emp.companyName}...`, 'info');
    const aiRes = await verifyCompanyWithAI({
      companyName: emp.companyName,
      companyEmail: emp.companyEmail,
      phone: emp.phone,
      website: emp.website,
      address: emp.address,
      recruiterName: emp.recruiterName,
      gstDetails: emp.gstDetails,
      hasDocument: !!emp.companyDocUrl
    });

    const newStatus = aiRes.status === 'verified' ? 'verified' : aiRes.status === 'rejected' ? 'rejected' : 'pending';
    const res = await saveEmployerProfile(emp.id, {
      companyVerificationStatus: newStatus,
      aiVerificationScore: aiRes.confidenceScore,
      aiVerificationSummary: aiRes.summary,
      aiRiskFlags: aiRes.riskFlags || []
    });

    if (res.success) {
      if (newStatus === 'verified') {
        showToast(`✨ Groq AI auto-verified ${emp.companyName}!`, 'success');
        setPendingCompanies(prev => prev.filter(c => c.id !== emp.id));
      } else {
        showToast(`Groq AI Assessment: ${aiRes.summary}`, 'info');
        setPendingCompanies(prev => prev.map(c => c.id === emp.id ? { ...c, aiVerificationScore: aiRes.confidenceScore, aiVerificationSummary: aiRes.summary } : c));
      }
    }
  };


  // Moderate Job Action (Flagged Jobs)
  const handleModerateJob = async (jobId, status) => {
    const res = await updateJob(jobId, { status });
    if (res.success) {
      showToast(`Job status updated to ${status}!`, 'success');
      setSuspiciousJobs(prev => prev.filter(j => j.id !== jobId));
    } else {
      showToast('Failed to update job status.', 'error');
    }
  };

  // Moderate Report Action (Reported Jobs)
  const handleResolveReport = async (report, action) => {
    // action: 'dismiss' (keep job) or 'resolve' (remove job)
    const reportRes = await resolveReport(report.id, action === 'dismiss' ? 'dismissed' : 'resolved');
    if (reportRes.success) {
      if (action === 'remove') {
        // Mark job as rejected/deleted
        await updateJob(report.jobId, { status: 'rejected' });
        showToast('Job removed and report marked resolved!', 'success');
      } else {
        showToast('Report dismissed. Job kept.', 'success');
      }
      setReports(prev => prev.filter(r => r.id !== report.id));
    } else {
      showToast('Failed to resolve report.', 'error');
    }
  };

  const cardStyle = {
    padding: '20px',
    borderRadius: '16px',
    background: C.surfaceLowest,
    border: `1px solid ${C.outlineVar}`,
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px 80px' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--accent-purple-glow)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={32} />
        </div>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0 }}>ApnaRozgaar Admin Panel</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '1rem' }}>Verify companies, evaluate risk alerts, and review job seeker reports.</p>
        </div>
      </div>

      {/* Bento Navigation Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '36px' }}>
        {[
          { id: 'companies', label: 'Company Approvals', count: pendingCompanies.length, icon: Building, color: 'var(--accent-purple)' },
          { id: 'jobs', label: 'Risk Flags', count: suspiciousJobs.length, icon: AlertTriangle, color: 'var(--accent-teal)' },
          { id: 'reports', label: 'Reported Jobs', count: reports.length, icon: MessageSquare, color: '#ef4444' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '24px',
              borderRadius: '20px',
              border: activeTab === tab.id ? `2.5px solid ${tab.color}` : `1px solid ${C.outlineVar}`,
              background: activeTab === tab.id ? 'rgba(0,0,0,0.02)' : C.surfaceLowest,
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: activeTab === tab.id ? '0 8px 24px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.02)',
              transition: 'all 0.25s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: activeTab === tab.id ? tab.color : C.surfaceContainer, color: activeTab === tab.id ? 'white' : 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <tab.icon size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Moderate</span>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>{tab.label}</span>
              </div>
            </div>
            <span style={{ fontSize: '1.8rem', fontWeight: 900, color: tab.color }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <p>Fetching database entries...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          
          {/* 1. Companies Panel */}
          {activeTab === 'companies' && (
            <motion.div
              key="companies"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}
            >
              {pendingCompanies.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '60px 0', textAlign: 'center', background: C.surfaceLowest, border: `1px solid ${C.outlineVar}`, borderRadius: '20px' }}>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.1rem' }}>🎉 All companies are reviewed! No pending verification requests.</p>
                </div>
              ) : (
                pendingCompanies.map(emp => (
                  <div key={emp.id} style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '1.2rem', margin: '0 0 4px 0', fontWeight: 800 }}>{emp.companyName}</h3>
                        <span style={{ fontSize: '0.8rem', color: C.secondary, fontWeight: 700, textTransform: 'uppercase' }}>GSTIN: {emp.gstDetails}</span>
                      </div>
                      <AccessibleButton variant="outline" style={{ padding: '0 10px', minHeight: '32px', fontSize: '0.75rem' }} onClick={() => setViewingDoc(emp.companyDocUrl)}>
                        <Eye size={12} /> View Doc
                      </AccessibleButton>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: C.onSurfaceVar }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /> Recruiter: {emp.recruiterName}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={14} /> Email: {emp.companyEmail}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} /> Phone: {emp.phone}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> Address: {emp.address}</span>
                      {emp.website && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Globe size={14} /> Web: <a href={emp.website} target="_blank" rel="noopener noreferrer">{emp.website}</a></span>}
                    </div>

                    {emp.aiVerificationSummary && (
                      <div style={{ background: 'rgba(9, 20, 38, 0.04)', padding: '10px 12px', borderRadius: '10px', fontSize: '0.8rem', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Sparkles size={13} /> AI Verification Audit
                          </span>
                          {emp.aiVerificationScore && (
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: emp.aiVerificationScore >= 70 ? 'var(--success)' : '#d97706' }}>
                              Score: {emp.aiVerificationScore}%
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, color: C.onSurfaceVar }}>{emp.aiVerificationSummary}</p>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px', flexWrap: 'wrap' }}>
                      <AccessibleButton style={{ flex: 1, minHeight: '38px', fontSize: '0.85rem' }} onClick={() => handleModerateCompany(emp.id, 'verified')}>
                        <Check size={14} /> Approve
                      </AccessibleButton>
                      <AccessibleButton variant="outline" style={{ flex: 1, minHeight: '38px', fontSize: '0.85rem', borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)' }} onClick={() => handleAiReVerifyCompany(emp)}>
                        <Sparkles size={14} /> AI Auto-Verify
                      </AccessibleButton>
                      <AccessibleButton variant="outline" style={{ minHeight: '38px', fontSize: '0.85rem', borderColor: '#ef4444', color: '#ef4444', padding: '0 12px' }} onClick={() => handleModerateCompany(emp.id, 'rejected')}>
                        <X size={14} /> Reject
                      </AccessibleButton>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* 2. Flagged Jobs Panel */}
          {activeTab === 'jobs' && (
            <motion.div
              key="jobs"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}
            >
              {suspiciousJobs.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '60px 0', textAlign: 'center', background: C.surfaceLowest, border: `1px solid ${C.outlineVar}`, borderRadius: '20px' }}>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.1rem' }}>🟢 No risk flags! All postings passed automated screening.</p>
                </div>
              ) : (
                suspiciousJobs.map(job => (
                  <div key={job.id} style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', margin: '0 0 2px 0', fontWeight: 800 }}>{job.title}</h3>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{job.company}</span>
                      </div>
                      <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                        Groq AI Risk: {job.riskScore}%
                      </span>
                    </div>

                    {job.aiVerificationSummary && (
                      <div style={{ fontSize: '0.82rem', background: 'rgba(245,158,11,0.08)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.2)', color: '#b45309' }}>
                        <strong style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                          <Sparkles size={14} /> Groq AI Risk Summary:
                        </strong>
                        {job.aiVerificationSummary}
                      </div>
                    )}

                    <div style={{ fontSize: '0.85rem', color: C.onSurfaceVar }}>
                      <strong style={{ color: '#ef4444', display: 'block', marginBottom: '6px' }}>Flags Detected:</strong>
                      <ul style={{ margin: 0, paddingLeft: '18px', color: '#b91c1c', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {(job.riskReasons || []).map((reason, idx) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                    </div>


                    <div style={{ fontSize: '0.82rem', background: C.surface, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', color: C.onSurfaceVar, maxHeight: '100px', overflowY: 'auto' }}>
                      <strong>Description excerpt:</strong> {job.description}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                      <AccessibleButton style={{ flex: 1, minHeight: '38px', fontSize: '0.85rem' }} onClick={() => handleModerateJob(job.id, 'active')}>
                        <Check size={14} /> Approve & Publish
                      </AccessibleButton>
                      <AccessibleButton variant="outline" style={{ flex: 1, minHeight: '38px', fontSize: '0.85rem', borderColor: '#ef4444', color: '#ef4444' }} onClick={() => handleModerateJob(job.id, 'rejected')}>
                        <X size={14} /> Hold & Reject
                      </AccessibleButton>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* 3. Reported Jobs Panel */}
          {activeTab === 'reports' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}
            >
              {reports.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '60px 0', textAlign: 'center', background: C.surfaceLowest, border: `1px solid ${C.outlineVar}`, borderRadius: '20px' }}>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.1rem' }}>🎉 No user reports! Job seekers haven't flagged any scam jobs.</p>
                </div>
              ) : (
                reports.map(rep => (
                  <div key={rep.id} style={cardStyle}>
                    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#ef4444', fontWeight: 800, letterSpacing: '0.5px' }}>Flagged Reason: {rep.reason}</span>
                      <h3 style={{ fontSize: '1.2rem', margin: '4px 0 0 0', fontWeight: 800 }}>Job Ref: {rep.jobId}</h3>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: C.onSurfaceVar }}>
                      <strong>User's Report Detail:</strong>
                      <p style={{ margin: '4px 0 0 0', fontStyle: 'italic', color: 'var(--text-primary)' }}>"{rep.description}"</p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                      <AccessibleButton style={{ flex: 1, minHeight: '38px', fontSize: '0.85rem' }} onClick={() => handleResolveReport(rep, 'remove')}>
                        <X size={14} /> Remove Job
                      </AccessibleButton>
                      <AccessibleButton variant="outline" style={{ flex: 1, minHeight: '38px', fontSize: '0.85rem' }} onClick={() => handleResolveReport(rep, 'dismiss')}>
                        Dismiss Report
                      </AccessibleButton>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

        </AnimatePresence>
      )}

      {/* Document View Lightbox/Modal */}
      {viewingDoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(9,20,38,0.7)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '20px', maxWidth: '640px', width: '100%', position: 'relative' }}>
            <button style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }} onClick={() => setViewingDoc(null)}>✕</button>
            <h3 style={{ margin: '0 0 16px 0' }}>Company Registration Document</h3>
            <div style={{ maxHeight: '70vh', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <img src={viewingDoc} alt="GST / Registration certificate" style={{ width: '100%', display: 'block' }} />
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
            style={{
              position: 'fixed', bottom: '32px', right: '32px', zIndex: 1000,
              padding: '16px 24px', borderRadius: '14px', color: 'white', fontWeight: '600',
              background: toast.type === 'success' ? 'var(--success)' : '#ef4444',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
            }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
