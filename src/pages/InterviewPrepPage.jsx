import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './InterviewPrepPage.css';

const JOB_ROLES = [
  {
    id: 'frontend-developer',
    title: 'Frontend Developer',
    description: 'Build beautiful user interfaces and web experiences',
    icon: 'code',
    tags: ['React', 'TypeScript', 'CSS', 'UI/UX'],
  },
  {
    id: 'backend-developer',
    title: 'Backend Developer',
    description: 'Design scalable systems and APIs',
    icon: 'storage',
    tags: ['Node.js', 'Python', 'SQL', 'APIs'],
  },
  {
    id: 'data-analyst',
    title: 'Data Analyst',
    description: 'Transform data into actionable insights',
    icon: 'bar_chart',
    tags: ['SQL', 'Python', 'Excel', 'Visualization'],
  },
  {
    id: 'content-writer',
    title: 'Content Writer',
    description: 'Craft compelling narratives and copy',
    icon: 'draw',
    tags: ['Copywriting', 'SEO', 'Research', 'Editing'],
  },
  {
    id: 'graphic-designer',
    title: 'Graphic Designer',
    description: 'Create stunning visual concepts and designs',
    icon: 'palette',
    tags: ['Illustrator', 'Photoshop', 'Figma', 'Typography'],
  },
];

const LEVELS = [
  { id: 'entry', label: 'Entry Level', hint: '0–2 yrs' },
  { id: 'mid', label: 'Mid-Level', hint: '2–5 yrs' },
  { id: 'senior', label: 'Senior / Lead', hint: '5+ yrs' },
];

const InterviewPrepPage = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('frontend-developer');
  const [level, setLevel] = useState('mid');

  const handleStartPractice = () => {
    navigate(`/interview-prep/session?role=${selectedRole}&level=${level}`);
  };

  return (
    <div className="prep-page-shell">
      <header className="prep-topbar">
        <div className="prep-brand">
          <img
            alt="Interview Prep Buddy Logo"
            className="prep-brand-logo"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCteNaEGRvf_-gH_1ir-xiHUb1NOc6fBh29notWWjnlwsCPzEfszaSzkmwPLiSUjQn5TzCPtfkObZUT0e0G7_-ShpLKo24Q18_5jYaFrHyus_XSuAaNp7P7g6twguLxPeEDOtyg_OL0kej6PCgPIDJMy_mUGVqzzJ1d5AgbeaSbWl3oRaqYBAqqCIGbpHA8GOFmNZ8BvkR8vYNpsHd6Sc8KIN2mYhDT-TBwV-C184aPZXpnO-5I4MqkEQ"
          />
          <h1 className="prep-brand-title">Interview Prep Buddy</h1>
        </div>
        <div className="prep-ai-badge" aria-label="Powered by Groq AI">
          <span className="material-symbols-outlined" aria-hidden="true">auto_awesome</span>
          <span>Powered by Groq AI</span>
        </div>
      </header>

      <main className="prep-main">
        <div className="prep-content-wrap">
          <section className="prep-intro">
            <h2>Let&apos;s set up your practice</h2>
            <p>
              Choose your job role and experience level — Groq AI will generate
              personalized interview questions just for you.
            </p>
          </section>

          {/* Step 1: Role Cards */}
          <section className="prep-section">
            <h3>
              <span className="prep-step-badge">1</span>
              Choose Your Job Role
            </h3>
            <div className="prep-role-grid" role="listbox" aria-label="Select a job role">
              {JOB_ROLES.map((role) => {
                const isActive = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    className={`prep-role-card${isActive ? ' prep-role-card-active' : ''}`}
                    id={`role-${role.id}`}
                    onClick={() => setSelectedRole(role.id)}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                  >
                    {isActive && (
                      <span className="prep-role-check" aria-hidden="true">
                        <span className="material-symbols-outlined">check_circle</span>
                      </span>
                    )}
                    <div className="prep-role-icon-wrap" aria-hidden="true">
                      <span className="material-symbols-outlined prep-role-icon">
                        {role.icon}
                      </span>
                    </div>
                    <h4>{role.title}</h4>
                    <p>{role.description}</p>
                    <div className="prep-role-tags" aria-label={`Skills: ${role.tags.join(', ')}`}>
                      {role.tags.map((tag) => (
                        <span key={tag} className="prep-role-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Step 2: Level Pills */}
          <section className="prep-section">
            <h3>
              <span className="prep-step-badge">2</span>
              Experience Level
            </h3>
            <div className="prep-level-pills" role="radiogroup" aria-label="Experience Level">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl.id}
                  className={`prep-level-pill${level === lvl.id ? ' prep-level-pill-active' : ''}`}
                  id={`lvl-${lvl.id}`}
                  onClick={() => setLevel(lvl.id)}
                  role="radio"
                  aria-checked={level === lvl.id}
                  type="button"
                >
                  <span className="prep-level-label">{lvl.label}</span>
                  <span className="prep-level-hint">{lvl.hint}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Selected config preview */}
          <div className="prep-config-preview" aria-live="polite">
            <span className="material-symbols-outlined" aria-hidden="true">info</span>
            Generating{' '}
            <strong>
              {LEVELS.find((l) => l.id === level)?.label}
            </strong>{' '}
            questions for{' '}
            <strong>
              {JOB_ROLES.find((r) => r.id === selectedRole)?.title}
            </strong>
          </div>

          {/* CTA */}
          <section className="prep-cta-wrap">
            <button className="prep-start-btn" onClick={handleStartPractice} type="button">
              <span>Start Practice Session</span>
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_forward
              </span>
            </button>
            <p className="prep-privacy-note">
              <span className="material-symbols-outlined prep-note-icon" aria-hidden="true">
                auto_awesome
              </span>
              Questions are AI-generated and tailored to your selection
            </p>
          </section>
        </div>
      </main>

      <footer className="prep-footer">
        <div className="prep-footer-inner">
          <span>© 2024 Interview Prep Buddy. Built for accessibility.</span>
          <div className="prep-footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default InterviewPrepPage;
