import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  BrainCircuit,
  Star,
  Award,
  Crown,
  Zap,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../firebase/auth';
import { AccessibleButton } from '../components/AccessibleButton';

const PricingPage = () => {
  const { user, userProfile, userType, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      navigate('/auth?redirect=/pricing');
      return;
    }

    setLoading(true);
    try {
      const res = await updateUserProfile({ isPremium: true }, userType || 'candidate');
      if (res.success) {
        await refreshProfile();
        // Give time for UI update
        setTimeout(() => {
          navigate('/profile');
        }, 1000);
      } else {
        alert('Failed to upgrade. Please try again.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const isAlreadyPremium = userProfile?.isPremium;

  return (
    <div className="page-container" style={{ padding: '60px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', marginBottom: '60px' }}
      >
        <div style={{ display: 'inline-flex', padding: '8px 16px', background: 'rgba(255,215,0,0.1)', color: '#FFD700', borderRadius: '30px', fontWeight: 'bold', gap: '8px', alignItems: 'center', marginBottom: '24px' }}>
          <Crown size={20} />
          <span>ApnaRozgaar Premium</span>
        </div>
        <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, marginBottom: '20px' }}>
          Accelerate Your Career Journey
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
          Unlock AI-powered tools, build standard resumes effortlessly, and get priority visibility to inclusive employers across the platform.
        </p>
      </motion.div>

      {isAlreadyPremium ? (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          style={{ textAlign: 'center', padding: '60px', background: 'rgba(255,215,0,0.1)', borderRadius: '32px', border: '1px solid rgba(255,215,0,0.3)' }}
        >
          <Award size={64} color="#FFD700" style={{ margin: '0 auto 24px' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '16px', color: 'white' }}>You're a Premium Member!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Enjoy your exclusive AI features and priority profile visibility.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <AccessibleButton onClick={() => navigate('/interview-prep')}>Go to Interview Buddy</AccessibleButton>
            <AccessibleButton variant="outline" onClick={() => navigate('/resume-builder')}>Build AI Resume</AccessibleButton>
          </div>
        </motion.div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'center' }}>
          {/* Free Plan */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ padding: '40px', background: 'white', borderRadius: '24px', border: '1px solid var(--border)' }}
          >
            <h3 style={{ fontSize: '1.5rem', marginBottom: '8px', color: 'black' }}>Free Tier</h3>
            <p style={{ color: '#4a4a4a', marginBottom: '24px' }}>Essential tools to get started</p>
            <div style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '32px', color: 'black' }}>₹0<span style={{ fontSize: '1rem', color: '#666', fontWeight: 400 }}>/forever</span></div>
            
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {['Search and apply to jobs', 'Basic profile creation', 'Accessibility features (Voice, Screen Reader)', 'Chat with AI Assistant (Asha)'].map((feature, i) => (
                <li key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <CheckCircle size={20} color="var(--accent-purple)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ color: 'black' }}>{feature}</span>
                </li>
              ))}
            </ul>
            
            <AccessibleButton variant="outline" style={{ width: '100%', borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)' }} onClick={() => navigate('/jobs')}>
              Explore Jobs
            </AccessibleButton>
          </motion.div>

          {/* Premium Plan */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ 
              padding: '40px', 
              background: 'white', 
              borderRadius: '24px', 
              border: '2px solid var(--accent-purple)', 
              position: 'relative' 
            }}
          >
            <div style={{ position: 'absolute', top: '-14px', right: '40px', background: 'var(--primary-gradient)', padding: '4px 16px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold', color: 'white' }}>
              MOST POPULAR
            </div>
            
            <h3 style={{ fontSize: '1.5rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: 'black' }}>
              <Star size={24} color="#FFD700" /> Premium
            </h3>
            <p style={{ color: '#4a4a4a', marginBottom: '24px' }}>AI-powered acceleration</p>
            <div style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '32px', color: 'black' }}>₹499<span style={{ fontSize: '1rem', color: '#666', fontWeight: 400 }}>/month</span></div>
            
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { text: 'Everything in Free', icon: <CheckCircle size={20} color="var(--accent-purple)" /> },
                { text: 'AI Interview Prep Buddy', icon: <BrainCircuit size={20} color="#F59E0B" /> },
                { text: 'AI Resume Maker Integration', icon: <FileText size={20} color="#F59E0B" /> },
                { text: 'Priority Profile Visibility to Employers', icon: <Zap size={20} color="#F59E0B" /> },
                { text: 'Standout Premium Badge', icon: <Crown size={20} color="#F59E0B" /> }
              ].map((item, i) => (
                <li key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0, marginTop: '2px' }}>{item.icon}</div>
                  <span style={{ color: 'black', fontWeight: 500 }}>{item.text}</span>
                </li>
              ))}
            </ul>
            
            <AccessibleButton 
              style={{ width: '100%', padding: '16px', fontSize: '1.1rem', color: 'white' }} 
              onClick={handleUpgrade}
              disabled={loading}
            >
              {loading ? 'Upgrading...' : 'Upgrade to Premium'}
            </AccessibleButton>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PricingPage;