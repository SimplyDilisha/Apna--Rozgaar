import { useNavigate } from 'react-router-dom';
import './InterviewAnswerReview.css';

const InterviewAnswerReview = () => {
  const navigate = useNavigate();

  return (
    <div className="review-page-shell">
      <header className="review-topbar">
        <nav className="review-topbar-inner">
          <div className="review-brand">Interview Prep Buddy</div>

          <div className="review-nav-links">
            <a href="#">Dashboard</a>
            <a className="review-nav-active" href="#">Practice</a>
            <a href="#">Resources</a>
          </div>

          <div className="review-topbar-actions">
            <button className="material-symbols-outlined focus-ring" title="Accessibility Settings" type="button">settings_accessibility</button>
            <button className="material-symbols-outlined focus-ring" title="Voice Settings" type="button">record_voice_over</button>
          </div>
        </nav>
      </header>

      <main className="review-main">
        <section className="review-headline-row">
          <div>
            <h1>Practice Session Review</h1>
            <p>
              Reviewing your response for: <span>&quot;Tell me about a time you handled a difficult stakeholder.&quot;</span>
            </p>
          </div>
          <button className="review-try-again focus-ring" onClick={() => navigate('/interview-prep/session')} type="button">
            <span>Try Again</span>
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </section>

        <div className="review-grid">
          <div className="review-left-col">
            <article className="review-card review-confidence-card">
              <h2>Confidence Score</h2>

              <div className="review-gauge-wrap">
                <svg aria-label="Confidence meter showing 85 percent" role="img" viewBox="0 0 36 36">
                  <path
                    className="review-gauge-track"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="transparent"
                    strokeWidth="3"
                  />
                  <path
                    className="review-gauge-fill animate-progress"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="transparent"
                    strokeDasharray="85, 100"
                    strokeLinecap="round"
                    strokeWidth="3"
                  />
                </svg>

                <div className="review-gauge-center">
                  <strong>85%</strong>
                  <span>Excellent</span>
                </div>
              </div>

              <div className="review-score-bars">
                <div className="review-score-item">
                  <span>Tone</span>
                  <div className="review-bar-track"><div className="review-bar-fill w-90" /></div>
                </div>
                <div className="review-score-item">
                  <span>Clarity</span>
                  <div className="review-bar-track"><div className="review-bar-fill w-75" /></div>
                </div>
                <div className="review-score-item">
                  <span>Key Concepts</span>
                  <div className="review-bar-track"><div className="review-bar-fill w-85" /></div>
                </div>
              </div>
            </article>

            <div className="review-left-stack">
              <article className="review-strengths-card">
                <div className="review-section-title">
                  <span className="material-symbols-outlined review-icon-fill">check_circle</span>
                  <h3>What You Did Well</h3>
                </div>
                <ul>
                  <li><span>01</span><p>Used the STAR method effectively to structure the situation.</p></li>
                  <li><span>02</span><p>Maintained a calm, professional tone throughout the explanation.</p></li>
                </ul>
              </article>

              <article className="review-improve-card">
                <div className="review-section-title">
                  <span className="material-symbols-outlined">edit_square</span>
                  <h3>Areas to Improve</h3>
                </div>
                <ul>
                  <li><span>•</span><p>Try to quantify the result (e.g., &quot;reduced project delay by 2 weeks&quot;).</p></li>
                  <li><span>•</span><p>Avoid using filler words like &quot;um&quot; and &quot;you know&quot; during the transition to Action.</p></li>
                </ul>
              </article>
            </div>
          </div>

          <div className="review-right-col">
            <article className="review-card review-comparison-card">
              <div className="review-comparison-head">
                <h2>Answer Comparison</h2>
                <span>
                  <span className="material-symbols-outlined">visibility</span>
                  Side-by-Side
                </span>
              </div>

              <div className="review-comparison-columns">
                <section className="review-col">
                  <div className="review-col-head">
                    <span className="material-symbols-outlined">person</span>
                    <span>Your Response</span>
                  </div>
                  <div className="custom-scrollbar review-scroll">
                    <p>&quot;So, there was this one time when a client was really unhappy about the timeline. I think it was last year? Anyway, they wanted it done in two weeks but we needed four. I sat them down and explained why it was impossible.&quot;</p>
                    <p>&quot;I told them about the quality checks and the technical hurdles. They weren&apos;t happy at first, but eventually they agreed to a compromise of three and a half weeks. We hit that target and the project launched successfully.&quot;</p>
                    <p className="review-ai-observation"><strong>AI Observation:</strong> Good transparency, but could use more specific details about the &apos;technical hurdles&apos;.</p>
                  </div>
                </section>

                <section className="review-col review-ai-col">
                  <div className="review-col-head review-ai-head">
                    <span className="material-symbols-outlined review-icon-fill">auto_awesome</span>
                    <span>AI-Optimized Model</span>
                  </div>
                  <div className="custom-scrollbar review-scroll">
                    <p>&quot;<mark>In my previous role at TechFlow</mark>, I managed a stakeholder who demanded a 50% reduction in delivery time. <mark>Recognizing this would compromise code integrity</mark>, I scheduled a data-driven review.&quot;</p>
                    <p>&quot;I presented a <mark>visual roadmap</mark> showing exactly how the extra two weeks ensured WCAG compliance. By focusing on shared goals of &apos;long-term stability&apos;, we negotiated a revised 3.5-week deadline. <mark>The result was a zero-critical-bug launch</mark> and a 15% increase in stakeholder satisfaction scores.&quot;</p>
                    <div className="review-tags">
                      <span>Active Verbs</span>
                      <span>Quantified Impact</span>
                      <span>Strategic Tone</span>
                    </div>
                  </div>
                </section>
              </div>

              <div className="review-comparison-footer">
                <p>Highlighted sections show where AI improved your framing.</p>
                <button className="material-symbols-outlined focus-ring" title="Download Transcript" type="button">download</button>
              </div>
            </article>
          </div>
        </div>

        <section className="review-cta-row">
          <div>
            <h3>Keep the momentum going?</h3>
            <p>You&apos;re in the top 15% of practitioners today!</p>
          </div>

          <div className="review-cta-actions">
            <button className="focus-ring review-save-btn" type="button">Save to Library</button>
            <button className="focus-ring review-next-btn" onClick={() => navigate('/interview-prep/summary')} type="button">Next Question →</button>
          </div>
        </section>
      </main>

      <footer className="review-footer">
        <div className="review-footer-inner">
          <div>
            <strong>Interview Prep Buddy</strong>
            <p>© 2024 Interview Prep Buddy. Built for accessibility.</p>
          </div>

          <div className="review-footer-links">
            <a className="focus-ring" href="#">Support</a>
            <a className="focus-ring" href="#">Transcript Downloads</a>
            <a className="focus-ring" href="#">Privacy Policy</a>
            <a className="focus-ring" href="#">Accessibility Statement</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default InterviewAnswerReview;