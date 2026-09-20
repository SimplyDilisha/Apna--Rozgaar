import { motion } from 'framer-motion';
import { Crown, Lock } from 'lucide-react';
import { AccessibleButton } from './AccessibleButton';
import { useNavigate } from 'react-router-dom';

const PremiumLockScreen = ({ featureName, description }) => {
  const navigate = useNavigate();
  
  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '60px 24px' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: 'var(--bg-dark)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '60px 40px',
          maxWidth: '600px',
          width: '100%',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{
          width: '80px',
          height: '80px',
          background: 'rgba(255, 215, 0, 0.1)',
          borderRadius: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          position: 'relative'
        }}>
          <Lock size={32} color="#FFD700" />
          <div style={{
            position: 'absolute',
            bottom: '-5px',
            right: '-5px',
            background: '#FFD700',
            borderRadius: '50%',
            padding: '4px'
          }}>
            <Crown size={14} color="black" />
          </div>
        </div>
        
        <h2 style={{ fontSize: '2rem', marginBottom: '16px', color: 'white' }}>
          {featureName} is a Premium Feature
        </h2>
        
        <p style={{ color: 'white', fontSize: '1.1rem', marginBottom: '32px', lineHeight: 1.6, opacity: 0.9 }}>
          {description || "Upgrade to ApnaRozgaar Premium to unlock this feature and supercharge your career journey."}
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '300px', margin: '0 auto' }}>
          <AccessibleButton
            onClick={() => navigate('/pricing')}
            style={{ background: 'linear-gradient(135deg, #FFD700 0%, #F59E0B 100%)', color: 'black', boxShadow: '0 4px 15px rgba(255,215,0,0.4)' }}
          >
            Upgrade to Premium
          </AccessibleButton>
          <AccessibleButton variant="ghost" onClick={() => navigate(-1)} style={{ color: 'white' }}>
            Go Back
          </AccessibleButton>
        </div>
      </motion.div>
    </div>
  );
};

export default PremiumLockScreen;