import { motion } from 'framer-motion';
import {
  Video,
  Brain,
  Sparkles,
  Zap,
  ExternalLink,
  Accessibility as AccessibilityIcon,
  MessageSquare,
  Shield,
  Target,
  ArrowRight,
} from 'lucide-react';
import { AccessibleButton } from '../components/AccessibleButton';
import dashboardImg from '../assets/meetsync-dashboard.png';

const MeetSync = () => {
  const meetsyncUrl = 'https://meetsync-xcelerators.vercel.app';

  const features = [
    {
      title: "Real-time Meetings",
      description: "Experience crystal-clear video and audio conferencing with low latency, built for professional collaboration.",
      icon: <Video className="text-blue-600" />,
      color: "rgba(37, 99, 235, 0.1)"
    },
    {
      title: "AI Analysis (Llama 3.3)",
      description: "Automatically extract promises made, action items, and sentiment after every meeting.",
      icon: <Brain className="text-purple-600" />,
      color: "rgba(124, 58, 237, 0.1)"
    },
    {
      title: "Hindsight Memory",
      description: "Search across all your meetings using natural language. Never lose context again.",
      icon: <Zap className="text-amber-600" />,
      color: "rgba(245, 158, 11, 0.1)"
    }
  ];

  return (
    <div className="meetsync-container grain-bg" style={{ minHeight: '100vh', paddingBottom: '100px' }}>
      <div className="meetsync-showcase" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '80px 24px',
        fontFamily: "'Outfit', sans-serif"
      }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '80px', position: 'relative' }}>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
              fontWeight: '800',
              background: 'var(--text-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.1,
              marginBottom: '24px',
              letterSpacing: '-0.04em'
            }}
          >
            Meetings that <br />Remember for You.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              fontSize: '1.25rem',
              color: 'var(--text-muted)',
              maxWidth: '700px',
              margin: '0 auto 48px',
              lineHeight: 1.6
            }}
          >
            MeetSync is your specialized space for inclusive video conferencing.
            Built-in AI tracks promises, action items, and sentiment so you can focus on the conversation.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}
          >
            <AccessibleButton
              onClick={() => window.open(meetsyncUrl, '_blank', 'noopener,noreferrer')}
              style={{
                padding: '18px 40px',
                fontSize: '1.1rem',
                background: 'black',
                color: 'white',
                gap: '12px',
                borderRadius: '20px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
              }}
            >
              Launch MeetSync Hub <ExternalLink size={20} />
            </AccessibleButton>
            <AccessibleButton
              variant="outline"
              style={{ padding: '18px 40px', fontSize: '1.1rem', borderRadius: '20px', border: '2px solid var(--border)' }}
              onClick={() => {
                const element = document.getElementById('features');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Explore Intelligence
            </AccessibleButton>
          </motion.div>
        </div>

        {/* Floating Screenshot Frame */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: 'spring', damping: 20 }}
          style={{
            background: 'white',
            padding: '12px',
            borderRadius: '32px',
            border: '1px solid var(--border)',
            boxShadow: '0 40px 100px rgba(0,0,0,0.08)',
            marginBottom: '100px',
            position: 'relative'
          }}
        >
          <div style={{
            aspectRatio: '16/9',
            background: '#0a0a0a',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <img
              src={dashboardImg}
              alt="MeetSync Dashboard"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '20px'
              }}
            />
          </div>
        </motion.div>

        {/* Features Section */}
        <div id="features" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '32px'
        }}>
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              style={{
                padding: '48px',
                background: 'white',
                borderRadius: '32px',
                border: '1px solid var(--border)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '24px',
                background: feature.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                marginBottom: '32px',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
              }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '16px' }}>{feature.title}</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '1.1rem', margin: 0 }}>{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Security & Trust */}
        <div style={{
          marginTop: '120px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '60px',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '24px' }}>Deep Intelligence, <br />Maximum Privacy.</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <Shield className="text-emerald-500" size={24} />
                <div>
                  <h4 style={{ margin: '0 0 4px', fontWeight: '700' }}>End-to-End Encryption</h4>
                  <p style={{ margin: 0, fontSize: '0.95rem' }}>Your meetings are yours. Audio data is scrubbed after analysis.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <Target className="text-blue-500" size={24} />
                <div>
                  <h4 style={{ margin: '0 0 4px', fontWeight: '700' }}>Actionable Accuracy</h4>
                  <p style={{ margin: 0, fontSize: '0.95rem' }}>Llama-3.3 extracts commitments with 98% linguistic precision.</p>
                </div>
              </div>
              <button
                onClick={() => window.open(meetsyncUrl, '_blank')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--accent-purple)',
                  fontWeight: '700',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: '12px',
                  padding: 0
                }}
              >
                Learn more about our AI architecture <ArrowRight size={18} />
              </button>
            </div>
          </div>
          <motion.div
            animate={{
              rotateY: [0, 10, 0],
              y: [0, -10, 0]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              background: 'var(--primary-gradient)',
              aspectRatio: '1',
              borderRadius: '40px',
              padding: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 50px 100px rgba(0,0,0,0.15)'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <Brain size={100} style={{ marginBottom: '24px', opacity: 0.8 }} />
              <div style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', fontSize: '0.9rem', fontWeight: '600' }}>
                Asha+ Intelligence Engine
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MeetSync;
