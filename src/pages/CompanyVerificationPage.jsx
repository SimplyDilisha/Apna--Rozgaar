import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, ShieldAlert, Upload, CheckCircle, Clock, ArrowRight, Building, HelpCircle, Sparkles } from 'lucide-react';
import { AccessibleButton } from '../components/AccessibleButton';
import { saveEmployerProfile } from '../firebase/employers';
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

export default function CompanyVerificationPage({ user, profile, onRefresh }) {
  const [formData, setFormData] = useState({
    companyName: profile?.companyName || '',
    companyEmail: profile?.companyEmail || user?.email || '',
    phone: profile?.phone || '',
    website: profile?.website || '',
    address: profile?.address || '',
    recruiterName: profile?.recruiterName || profile?.name || user?.displayName || '',
    gstDetails: profile?.gstDetails || '',
  });

  const [documentPhoto, setDocumentPhoto] = useState(null);
  const [docPreview, setDocPreview] = useState(profile?.companyDocUrl || null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleDocUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }
    setDocumentPhoto(file);
    const reader = new FileReader();
    reader.onload = (event) => setDocPreview(event.target?.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.companyName || !formData.companyEmail || !formData.phone || !formData.address || !formData.recruiterName || !formData.gstDetails) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!docPreview) {
      setError('Please upload a company registration document / GST proof.');
      return;
    }

    setSubmitting(true);
    setError('');

    // Trigger Groq AI Company Verification
    const aiRes = await verifyCompanyWithAI({
      ...formData,
      hasDocument: !!docPreview
    });

    const isAiApproved = aiRes.status === 'verified';

    const payload = {
      ...formData,
      companyDocUrl: docPreview,
      companyVerificationStatus: isAiApproved ? 'verified' : aiRes.status === 'rejected' ? 'rejected' : 'pending',
      aiVerificationScore: aiRes.confidenceScore,
      aiVerificationSummary: aiRes.summary,
      aiRiskFlags: aiRes.riskFlags || [],
      companyVerificationSubmittedAt: new Date().toISOString()
    };

    const result = await saveEmployerProfile(user.uid, payload);
    if (result.success) {
      if (isAiApproved) {
        setSuccess('🎉 Company verified automatically by Groq AI! You can now publish job postings.');
      } else {
        setSuccess('Verification request submitted! AI flagged details for quick moderator review.');
      }
      if (onRefresh) await onRefresh();
    } else {
      setError(result.error || 'Failed to submit verification details.');
    }
    setSubmitting(false);
  };

  const status = profile?.companyVerificationStatus;


  // 1. Pending Screen
  if (status === 'pending') {
    return (
      <div style={{ maxWidth: '640px', margin: '40px auto', padding: '24px' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card"
          style={{ padding: '48px 32px', textAlign: 'center', background: C.surfaceLowest, border: `1px solid ${C.outlineVar}`, borderRadius: '24px' }}
        >
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'rgba(245,158,11,0.1)', color: '#D97706',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <Clock size={40} />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: C.onSurface, marginBottom: '16px' }}>Verification Pending ⏳</h2>
          <p style={{ color: C.onSurfaceVar, fontSize: '1rem', lineHeight: '1.6', marginBottom: '24px' }}>
            We've received your company profile for <strong>{profile?.companyName}</strong>. Our moderators are validating your GST registration and recruiter details.
          </p>
          <div style={{ padding: '16px 20px', background: C.surfaceContainer, borderRadius: '12px', textAlign: 'left', marginBottom: '24px' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: C.onSurface, fontWeight: 700 }}>Submitted Details:</p>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', fontSize: '0.85rem', color: C.onSurfaceVar }}>
              <strong>GST / Reg No:</strong> <span>{profile?.gstDetails}</span>
              <strong>Recruiter:</strong> <span>{profile?.recruiterName}</span>
              <strong>Company Email:</strong> <span>{profile?.companyEmail}</span>
            </div>
          </div>

          {profile?.aiVerificationSummary && (
            <div style={{ padding: '14px 18px', background: 'rgba(9, 20, 38, 0.03)', border: '1px solid var(--border)', borderRadius: '14px', textAlign: 'left', marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: 'var(--accent-purple)', fontWeight: 700, fontSize: '0.85rem' }}>
                <Sparkles size={16} /> Groq AI Compliance Assessment
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: C.onSurfaceVar, lineHeight: '1.5' }}>
                {profile.aiVerificationSummary}
              </p>
              {profile.aiVerificationScore && (
                <div style={{ marginTop: '8px', fontSize: '0.8rem', fontWeight: 600, color: profile.aiVerificationScore >= 70 ? 'var(--success)' : '#d97706' }}>
                  AI Confidence Score: {profile.aiVerificationScore}%
                </div>
              )}
            </div>
          )}

          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            Usually verification takes 1-2 hours. You'll gain access to job posting as soon as you're approved.
          </p>
          {onRefresh && (
            <AccessibleButton onClick={() => onRefresh(true)} style={{ marginTop: '24px' }}>
              Check Status Now
            </AccessibleButton>
          )}
        </motion.div>
      </div>
    );
  }

  // 2. Form Screen (New or Rejected)
  return (
    <div style={{ maxWidth: '780px', margin: '40px auto', padding: '0 24px' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{ padding: '40px', background: C.surfaceLowest, border: `1px solid ${C.outlineVar}`, borderRadius: '24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0,106,97,0.1)', color: C.secondary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 800 }}>Company Verification Required</h2>
            <p style={{ color: C.onSurfaceVar, margin: 0, fontSize: '0.9rem' }}>Fill in company registration details to publish accessible jobs.</p>
          </div>
        </div>

        {status === 'rejected' && (
          <div style={{ padding: '16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', color: '#ef4444', marginBottom: '28px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '4px' }}>Verification Rejected 🔴</strong>
              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.5' }}>
                Your previous request was rejected. This could be due to mismatched GST details or blurred document upload. Please review and resubmit.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: C.onSurfaceVar }} htmlFor="companyName">Company Name *</label>
              <input id="companyName" name="companyName" required value={formData.companyName} onChange={handleChange} placeholder="e.g. Tech Solutions Pvt Ltd" style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: `1.5px solid ${C.outlineVar}`, outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: C.onSurfaceVar }} htmlFor="companyEmail">Official Company Email *</label>
              <input id="companyEmail" name="companyEmail" type="email" required value={formData.companyEmail} onChange={handleChange} placeholder="hr@yourcompany.com" style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: `1.5px solid ${C.outlineVar}`, outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: C.onSurfaceVar }} htmlFor="phone">Contact Number *</label>
              <input id="phone" name="phone" required value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: `1.5px solid ${C.outlineVar}`, outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: C.onSurfaceVar }} htmlFor="website">Company Website (Optional)</label>
              <input id="website" name="website" type="url" value={formData.website} onChange={handleChange} placeholder="https://yourcompany.com" style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: `1.5px solid ${C.outlineVar}`, outline: 'none' }} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: C.onSurfaceVar }} htmlFor="address">Registered Office Address *</label>
              <input id="address" name="address" required value={formData.address} onChange={handleChange} placeholder="Plot No 42, Electronics City Phase 1, Bangalore, Karnataka" style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: `1.5px solid ${C.outlineVar}`, outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: C.onSurfaceVar }} htmlFor="recruiterName">Recruiter Name / Representative *</label>
              <input id="recruiterName" name="recruiterName" required value={formData.recruiterName} onChange={handleChange} placeholder="Priya Sharma (HR Manager)" style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: `1.5px solid ${C.outlineVar}`, outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: C.onSurfaceVar }} htmlFor="gstDetails">GSTIN / Registration Number *</label>
              <input id="gstDetails" name="gstDetails" required value={formData.gstDetails} onChange={handleChange} placeholder="29AAAAA1111A1Z1" style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: `1.5px solid ${C.outlineVar}`, outline: 'none' }} />
            </div>
          </div>

          {/* Document Upload Area */}
          <div style={{ border: `2px dashed ${C.outlineVar}`, padding: '24px', borderRadius: '16px', background: 'rgba(0, 106, 97, 0.02)', position: 'relative' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '700', margin: '0 0 4px 0', color: C.onSurface }}>Upload Registration Proof / GST Certificate *</p>
            <p style={{ fontSize: '0.78rem', color: C.onSurfaceVar, margin: '0 0 16px 0' }}>Upload a PDF or image of the certificate. Must be clear and readable.</p>

            {docPreview ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', background: 'white' }}>
                  <img src={docPreview} alt="Registration proof preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', fontWeight: '600' }}>Document Uploaded Successfully</p>
                  <label htmlFor="gstDocFile" style={{ fontSize: '0.8rem', color: C.secondary, cursor: 'pointer', textDecoration: 'underline' }}>Change File</label>
                </div>
              </div>
            ) : (
              <div onClick={() => document.getElementById('gstDocFile')?.click()} style={{ textAlign: 'center', padding: '24px', cursor: 'pointer', border: '1px solid var(--border)', borderRadius: '12px', background: 'white' }}>
                <Upload size={24} style={{ color: C.secondary, marginBottom: '8px' }} />
                <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: C.onSurfaceVar }}>Click to select a file</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>JPG, PNG or PDF up to 5MB</p>
              </div>
            )}
            <input id="gstDocFile" type="file" accept="image/*,application/pdf" onChange={handleDocUpload} style={{ display: 'none' }} />
          </div>

          {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: '600' }}>⚠️ {error}</div>}
          {success && <div style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: '600' }}>✓ {success}</div>}

          <AccessibleButton
            type="submit"
            disabled={submitting}
            style={{ minHeight: '50px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {submitting ? 'Submitting request...' : 'Submit Company for Verification'}
            <ArrowRight size={18} />
          </AccessibleButton>
        </form>
      </motion.div>
    </div>
  );
}
