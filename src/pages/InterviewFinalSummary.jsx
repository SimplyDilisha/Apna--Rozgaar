import { useNavigate } from 'react-router-dom';
import './InterviewFinalSummary.css';

const InterviewFinalSummary = () => {
  const navigate = useNavigate();

  return (
    <div className="summary-page-shell">
      <header className="summary-topbar">
        <div className="summary-topbar-inner">
          <div className="summary-topbar-left">
            {/* Back link visible on mobile (sidebar hidden) */}
            <button
              className="summary-back-btn focus-ring"
              onClick={() => navigate('/interview-prep')}
              type="button"
              aria-label="Back to Interview Prep"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1>Interview Prep Buddy</h1>
          </div>
          <div className="summary-topbar-actions">
            <button aria-label="Accessibility Settings" className="material-symbols-outlined focus-ring" type="button">settings_accessibility</button>
            <button aria-label="Voice Settings" className="material-symbols-outlined focus-ring" type="button">record_voice_over</button>
          </div>
        </div>
      </header>

      <div className="summary-shell-grid">
        <aside className="summary-sidenav">
          <div className="summary-sidenav-head">
            <h2>Interview Prep Buddy</h2>
            <p>Ready to practice?</p>
          </div>

          <nav>
            <a className="summary-side-active focus-ring" href="#">
              <span className="material-symbols-outlined">dashboard</span>
              <span>Dashboard</span>
            </a>
            <a className="focus-ring" href="#">
              <span className="material-symbols-outlined">mic_external_on</span>
              <span>Practice</span>
            </a>
            <a className="focus-ring" href="#">
              <span className="material-symbols-outlined">library_books</span>
              <span>Resources</span>
            </a>
            <a className="focus-ring" href="#">
              <span className="material-symbols-outlined">help_center</span>
              <span>Support</span>
            </a>
          </nav>

          <button className="summary-side-cta focus-ring" onClick={() => navigate('/interview-prep/session')} type="button">
            Start Practice
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </aside>

        <main className="summary-main">
          <div className="summary-main-wrap">
            <header className="summary-headline">
              <h2 className="summary-headline-desktop">Final Readiness Summary</h2>
              <h2 className="summary-headline-mobile">Final Readiness</h2>
              <p>
                Fantastic work today! You&apos;ve shown significant improvement in your delivery and technical depth. Here is your final breakdown.
              </p>
            </header>

            <section className="summary-top-metrics">
              <article className="summary-card summary-gauge-card ambient-shadow">
                <h3>Overall Readiness</h3>
                <div className="summary-gauge-wrap">
                  <svg className="summary-gauge" viewBox="0 0 192 192" aria-label="Overall readiness 88 percent" role="img">
                    <circle className="summary-gauge-track" cx="96" cy="96" fill="transparent" r="70" strokeWidth="12" />
                    <circle className="summary-gauge-fill animate-progress" cx="96" cy="96" fill="transparent" r="70" strokeDasharray="440" strokeLinecap="round" strokeWidth="12" />
                  </svg>
                  <div className="summary-gauge-center">
                    <span>88%</span>
                    <small>Ready!</small>
                  </div>
                </div>
                <p>You&apos;re in the top 5% of candidates for this role type.</p>
              </article>

              <div className="summary-detail-grid">
                <article className="summary-card summary-metric-card ambient-shadow">
                  <div className="summary-metric-icon summary-metric-icon-secondary">
                    <span className="material-symbols-outlined summary-icon-fill">terminal</span>
                  </div>
                  <div className="summary-metric-content">
                    <div className="summary-metric-head"><h4>Technical Accuracy</h4><strong>92%</strong></div>
                    <div className="summary-meter-track"><div className="summary-meter-fill secondary" style={{ width: '92%' }} /></div>
                  </div>
                </article>

                <article className="summary-card summary-metric-card ambient-shadow">
                  <div className="summary-metric-icon summary-metric-icon-primary">
                    <span className="material-symbols-outlined summary-icon-fill">record_voice_over</span>
                  </div>
                  <div className="summary-metric-content">
                    <div className="summary-metric-head"><h4>Delivery Confidence</h4><strong className="primary">84%</strong></div>
                    <div className="summary-meter-track"><div className="summary-meter-fill primary" style={{ width: '84%' }} /></div>
                  </div>
                </article>

                <article className="summary-card summary-metric-card ambient-shadow">
                  <div className="summary-metric-icon summary-metric-icon-tertiary">
                    <span className="material-symbols-outlined summary-icon-fill">sign_language</span>
                  </div>
                  <div className="summary-metric-content">
                    <div className="summary-metric-head"><h4>Visual/Speech Clarity</h4><strong className="tertiary">88%</strong></div>
                    <div className="summary-meter-track"><div className="summary-meter-fill tertiary" style={{ width: '88%' }} /></div>
                  </div>
                </article>
              </div>
            </section>

            <section className="summary-recommendations">
              <div className="summary-reco-head">
                <span className="material-symbols-outlined">lightbulb</span>
                <h3>Actionable Recommendations</h3>
              </div>

              <div className="summary-reco-grid">
                <article className="summary-reco-card secondary">
                  <h4>
                    <span className="material-symbols-outlined">check_circle</span>
                    Refine Star Method
                  </h4>
                  <p>Your &quot;Action&quot; step in the behavioral questions could be more concise. Try to focus on three key steps you took.</p>
                </article>

                <article className="summary-reco-card tertiary">
                  <h4>
                    <span className="material-symbols-outlined">trending_up</span>
                    Technical Deep Dive
                  </h4>
                  <p>Refresh your knowledge on System Design patterns, specifically &quot;Load Balancing,&quot; as noted in question 4.</p>
                </article>
              </div>
            </section>

            <section className="summary-actions">
              <button className="summary-btn-primary focus-ring" onClick={() => navigate('/interview-prep/session')} type="button">
                <span className="material-symbols-outlined">fitness_center</span>
                Practice Weak Areas
              </button>
              <button className="summary-btn-outline-primary focus-ring" type="button">
                <span className="material-symbols-outlined">picture_as_pdf</span>
                Download Transcript PDF
              </button>
              <button className="summary-btn-outline-neutral focus-ring" onClick={() => navigate('/interview-prep')} type="button">
                <span className="material-symbols-outlined">work</span>
                Try New Role
              </button>
            </section>

            <section className="summary-quote-block ambient-shadow">
              <div className="summary-quote-overlay">
                <p>&quot;Confidence comes not from always being right but from not fearing to be wrong.&quot;</p>
              </div>
              <div className="summary-quote-image" role="img" aria-label="A serene, professional office with warm wood textures and natural light." />
            </section>
          </div>
        </main>
      </div>

      <footer className="summary-footer">
        <div className="summary-footer-inner">
          <p>© 2024 Interview Prep Buddy. Built for accessibility.</p>
          <nav>
            <a className="focus-ring" href="#">Support</a>
            <a className="focus-ring" href="#">Transcript Downloads</a>
            <a className="focus-ring" href="#">Privacy Policy</a>
            <a className="focus-ring" href="#">Accessibility Statement</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default InterviewFinalSummary;