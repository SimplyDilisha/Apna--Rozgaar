import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users, Target, ShieldCheck, Eye,
  Ear, HeartHandshake, ArrowRight, Sparkles, Building2, Briefcase
} from 'lucide-react';
import { AccessibleButton } from '../components/AccessibleButton';

export default function AboutUs() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 300 } }
  };

  return (
    <div style={{ paddingBottom: '80px', overflow: 'hidden' }}>

      {/* Hero Section */}
      <section style={{
        padding: '80px 24px 60px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        position: 'relative'
      }}>
        {/* Decorative Background Elements */}
        <div style={{
          position: 'absolute',
          top: '10%',
          right: '5%',
          width: '300px',
          height: '300px',
          background: 'rgba(37, 99, 235, 0.05)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          pointerEvents: 'none'
        }} aria-hidden="true" />
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '5%',
          width: '250px',
          height: '250px',
          background: 'rgba(13, 148, 136, 0.05)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          pointerEvents: 'none'
        }} aria-hidden="true" />

        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)', marginBottom: '24px', lineHeight: '1.1' }}
          >
            Empowering Careers Through <span style={{ color: 'var(--accent-purple)' }}>True Accessibility</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '800px', margin: '0 auto 40px', lineHeight: '1.6' }}
          >
            ApnaRozgaar is India's most inclusive employment network. We bridge the gap between talented professionals with disabilities and employers committed to building diverse, accessible workplaces.
          </motion.p>
        </div>
      </section>

      {/* Impact Stats Section */}
      <section style={{ maxWidth: '1200px', margin: '-40px auto 80px', padding: '0 24px', position: 'relative', zIndex: 10 }}>

      </section>

      {/* Mission & Vision (Asymmetric Layout) */}
      <section style={{ maxWidth: '1200px', margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', alignItems: 'center' }}>

          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Target size={40} color="var(--accent-purple)" /> Our Mission
            </h2>
            <p style={{ fontSize: '1.1rem', marginBottom: '20px' }}>
              To democratize employment opportunities for over 1 Billion Persons with Disabilities worldwide. We believe that talent is equally distributed, but opportunity is not. A disability should never dictate a person's economic potential.
            </p>
            <p style={{ fontSize: '1.1rem' }}>
              By embedding accessibility natively into every interaction, we break down systemic barriers in the recruitment process—from perfectly readable job descriptions to fully accommodated interviews.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            style={{ background: 'var(--accent-purple)', padding: '48px', borderRadius: '24px', color: 'white', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
              <Eye size={200} />
            </div>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '24px', position: 'relative', zIndex: 1, color: 'white' }}>Our Vision</h2>
            <p style={{ fontSize: '1.2rem', lineHeight: '1.6', position: 'relative', zIndex: 1, opacity: 0.9 }}>
              A world where the term "inclusive hiring" is obsolete because every workplace is inherently designed for everyone. We envision a future where digital and physical environments adapt to the user, not the other way around.
            </p>
            <div style={{ marginTop: '32px', paddingLeft: '20px', borderLeft: '4px solid rgba(255,255,255,0.3)', position: 'relative', zIndex: 1 }}>
              <p style={{ fontStyle: 'italic', margin: 0, fontSize: '1.1rem', fontWeight: '500' }}>
                "Ability is what you're capable of doing. Motivation determines what you do. Accessibility determines how well you can do it."
              </p>
            </div>
          </motion.div>

        </div>
      </section>

      {/* What Makes Us Different */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-secondary)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '3rem', margin: '0 0 16px' }}>The ApnaRozgaar Difference</h2>
            <p style={{ fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>Built from the ground up prioritizing accessibility, not as an afterthought.</p>
          </div>

          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}
          >
            {[
              {
                icon: Ear,
                title: "Deaf/HoH First Integration",
                desc: "Real-time communication tools, visual indicator support, and direct BSL/ASL interpreter bookings built straight into our interview pipeline.",
                color: "var(--accent-teal)",
                bgColor: "rgba(13, 148, 136, 0.1)"
              },
              {
                icon: Eye,
                title: "Screen Reader Native",
                desc: "Every component, form, and floating element is strictly tested against JAWS, NVDA, and VoiceOver. Zero keyboard traps.",
                color: "var(--accent-purple)",
                bgColor: "rgba(37, 99, 235, 0.1)"
              },
              {
                icon: ShieldCheck,
                title: "Verified Workplaces",
                desc: "Employers cannot falsely claim accessibility. Our robust checklist system holds companies accountable for their digital and physical accommodations.",
                color: "var(--success)",
                bgColor: "rgba(16, 185, 129, 0.1)"
              }
            ].map((feature, idx) => (
              <motion.div key={idx} variants={itemVariants} className="card" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: feature.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                  <feature.icon size={28} color={feature.color} />
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>{feature.title}</h3>
                <p style={{ margin: 0, flex: 1 }}>{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Layer */}
      <section style={{ maxWidth: '1000px', margin: '80px auto 0', padding: '0 24px' }}>
        <div style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--accent-purple)',
          borderRadius: '24px',
          padding: '60px 40px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(37, 99, 235, 0.15)'
        }}>
          <HeartHandshake size={64} color="var(--accent-purple)" style={{ marginBottom: '24px' }} />
          <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Join the Movement</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' }}>
            Whether you are looking for your next big career leap, or you are an employer ready to tap into an extraordinary talent pool.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/auth" tabIndex="-1">
              <AccessibleButton style={{ minHeight: '56px', fontSize: '1.1rem', padding: '0 32px' }}>
                Get Started Today <ArrowRight size={20} />
              </AccessibleButton>
            </Link>
            <Link to="/employer" tabIndex="-1">
              <AccessibleButton variant="outline" style={{ minHeight: '56px', fontSize: '1.1rem', padding: '0 32px' }}>
                I'm an Employer
              </AccessibleButton>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
