import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
const faviconImg = '/favicon.png';
import splashBg from '../assets/Splash.png';

const SplashScreen = ({ finishLoading }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const timer1 = setTimeout(() => setStep(1), 800);
    const timer2 = setTimeout(() => setStep(2), 2000);
    const timer3 = setTimeout(() => {
      document.body.style.overflow = 'auto';
      if (finishLoading) finishLoading();
    }, 3200);

    return () => {
      document.body.style.overflow = 'auto';
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [finishLoading]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        transition: { duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#0d766b',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        overflow: 'hidden'
      }}
    >
      {/* Blurred Background Image Layer */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${splashBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        filter: 'blur(6px)',
        transform: 'scale(1.05)', // prevent blur edge artifacts
        zIndex: 0,
      }} />
      {/* Dark overlay for readability */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(13, 118, 107, 0.45)',
        zIndex: 1,
      }} />
      {/* Background Decorative Elements */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          rotate: [0, 90, 0]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 70%)',
          borderRadius: '50%',
          top: '-10%',
          left: '-10%',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
          rotate: [0, -90, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0) 70%)',
          borderRadius: '50%',
          zIndex: 2,
          bottom: '-5%',
          right: '-5%',
          pointerEvents: 'none'
        }}
      />

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3 }}>
        {/* Logo Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.2
          }}
          style={{
            width: '120px',
            height: '120px',
            background: 'white',
            padding: '15px',
            borderRadius: '50%',
            boxShadow: '0 0 40px rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '30px',
            zIndex: 2
          }}
        >
          <img
            src={faviconImg}
            alt="ApnaRozgaar Logo"
            style={{ width: '100%', height: '100%', borderRadius: '50%' }}
          />
        </motion.div>

        {/* Text Animation */}
        <div style={{ overflow: 'hidden', height: '80px', display: 'flex', alignItems: 'center' }}>
          <AnimatePresence mode="wait">
            {step >= 1 && (
              <motion.h1
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  color: 'white',
                  fontSize: '3.5rem',
                  fontWeight: '800',
                  margin: 0,
                  fontFamily: "'Outfit', sans-serif",
                  letterSpacing: '-0.03em',
                  background: 'linear-gradient(90deg, #fff 0%, #fff 40%, #555 50%, #fff 60%, #fff 100%)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'shimmer 3s linear infinite'
                }}
              >
                ApnaRozgaar
              </motion.h1>
            )}
          </AnimatePresence>
        </div>

        <style>{`
          @keyframes shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
        `}</style>

        {/* Tagline Animation */}
        <div style={{ overflow: 'hidden', height: '30px', marginTop: '10px' }}>
          <AnimatePresence>
            {step >= 2 && (
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 0.7 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                style={{
                  color: 'white',
                  fontSize: '1.1rem',
                  fontWeight: '400',
                  margin: 0,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  fontFamily: "'Inter', sans-serif"
                }}
              >
                Unlocking Possibilities
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Progress Line */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: step >= 1 ? '200px' : 0, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          style={{
            height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
            marginTop: '40px',
            borderRadius: '1px'
          }}
        />
      </div>

      {/* Decorative Particle effects */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: 0
          }}
          animate={{
            y: [null, Math.random() * -100 - 50],
            opacity: [0, 0.5, 0]
          }}
          transition={{
            duration: Math.random() * 2 + 2,
            repeat: Infinity,
            delay: Math.random() * 2
          }}
          style={{
            position: 'absolute',
            width: '4px',
            height: '4px',
            background: 'white',
            borderRadius: '50%',
            filter: 'blur(1px)'
          }}
        />
      ))}
    </motion.div>
  );
};

export default SplashScreen;
