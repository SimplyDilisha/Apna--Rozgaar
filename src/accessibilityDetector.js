/**
 * AccessibilityDetector.js — ApnaRozgaar Smart Disability Detection + Onboarding
 * Self-contained: no external dependencies. Pure vanilla JS + injected CSS.
 *
 * Phase 1: Silent Auto Detection (every page load)
 * Phase 2: Onboarding Modal (first visit only)
 * Phase 3: Apply Profile Immediately
 * Phase 4: UDID Verification helpers (profile page integration)
 * Phase 5: Behavioural Learning (passive, ongoing)
 */

const STORAGE_KEY = 'arAccessibilityProfile';
const BEHAVIOUR_KEY = 'behaviourSignals';
const ONBOARDED_KEY = 'arOnboardingComplete';

// ─── Helpers ────────────────────────────────────────────
function loadProfile() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}
function saveProfile(p) { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }
function loadBehaviour() {
  try { return JSON.parse(localStorage.getItem(BEHAVIOUR_KEY)) || {}; } catch { return {}; }
}
function saveBehaviour(b) { localStorage.setItem(BEHAVIOUR_KEY, JSON.stringify(b)); }

// ─── PHASE 1 — Silent Auto Detection ───────────────────
function runAutoDetection() {
  const signals = loadProfile().detectedSignals || {};

  // High-contrast OS mode
  signals.highContrast = window.matchMedia('(forced-colors: active)').matches;

  // Reduced motion
  signals.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Possible low vision (high DPR + small screen)
  signals.possibleLowVision = window.devicePixelRatio > 1.5 && window.innerWidth < 500;

  // Large default font
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
  signals.largeText = rootFontSize > 16;

  // Referrer from disability orgs
  const ref = (document.referrer || '').toLowerCase();
  const disabilityDomains = ['nhfdc.nic.in', 'disabilityaffairs.gov.in', 'swavlambancard.gov.in',
    'niepmd.tn.nic.in', 'ccdisabilities.nic.in', 'udid.qcin.org', 'nab.in', 'nad.org',
    'who.int/health-topics/disability', 'aicb.org.in'];
  signals.referrerOrg = disabilityDomains.some(d => ref.includes(d));

  // Keyboard-only detection (no mouse within 3s)
  signals.keyboardOnly = false;
  let mouseDetected = false;
  const onMouse = () => { mouseDetected = true; };
  document.addEventListener('mousemove', onMouse, { once: true });
  setTimeout(() => {
    document.removeEventListener('mousemove', onMouse);
    if (!mouseDetected) {
      signals.keyboardOnly = true;
      const p = loadProfile();
      p.detectedSignals = signals;
      saveProfile(p);
    }
  }, 3000);

  // Screen-reader heuristic: linear tab pattern
  let tabCount = 0;
  const onTab = (e) => { if (e.key === 'Tab') tabCount++; };
  document.addEventListener('keydown', onTab);
  setTimeout(() => {
    document.removeEventListener('keydown', onTab);
    if (tabCount >= 5 && !mouseDetected) {
      signals.likelyScreenReader = true;
      const p = loadProfile();
      p.detectedSignals = signals;
      saveProfile(p);
    }
  }, 6000);

  signals.likelyScreenReader = signals.likelyScreenReader || false;

  const profile = loadProfile();
  profile.detectedSignals = signals;
  profile.lastDetected = Date.now();
  saveProfile(profile);
  return signals;
}

// ─── PHASE 2 — Onboarding Modal ────────────────────────
function injectStyles() {
  if (document.getElementById('ar-a11y-styles')) return;
  const style = document.createElement('style');
  style.id = 'ar-a11y-styles';
  style.textContent = `
    .ar-modal-overlay{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;transition:opacity .4s ease;font-family:'Inter','Outfit',system-ui,sans-serif}
    .ar-modal-overlay.ar-visible{opacity:1}
    .ar-modal{background:var(--bg-primary,#fff);border-radius:24px;max-width:720px;width:100%;max-height:90vh;overflow-y:auto;padding:40px 36px 32px;position:relative;box-shadow:0 32px 80px rgba(0,0,0,0.35);border:1px solid var(--border,rgba(0,0,0,0.1));animation:ar-slideUp .45s cubic-bezier(.16,1,.3,1) forwards}
    @keyframes ar-slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
    .ar-modal h1{font-size:1.7rem;font-weight:800;margin:0 0 6px;color:var(--text-primary,#0f0a1a);line-height:1.3}
    .ar-modal .ar-sub{color:var(--text-muted,#645E73);font-size:.95rem;margin:0 0 28px;line-height:1.6}
    .ar-skip-btn{position:absolute;top:16px;right:16px;background:none;border:none;color:var(--text-muted,#888);font-size:.85rem;cursor:pointer;padding:8px 14px;border-radius:10px;transition:background .2s}
    .ar-skip-btn:hover,.ar-skip-btn:focus{background:var(--bg-secondary,#f3f1f9);outline:2px solid var(--text-muted,#888);outline-offset:2px}
    .ar-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;margin-bottom:24px}
    .ar-card{border:2px solid var(--border,rgba(0,0,0,0.08));border-radius:16px;padding:20px 16px;cursor:pointer;transition:all .25s ease;display:flex;flex-direction:column;align-items:center;text-align:center;background:var(--bg-secondary,#f8f7fc);min-height:130px;justify-content:center;position:relative;user-select:none}
    .ar-card:hover{border-color:#1D9E75;transform:translateY(-3px);box-shadow:0 12px 28px rgba(29,158,117,0.12)}
    .ar-card:focus-visible{outline:3px solid #1D9E75;outline-offset:2px}
    .ar-card.ar-selected{border-color:#1D9E75;background:rgba(29,158,117,0.08);box-shadow:0 0 0 3px rgba(29,158,117,0.15)}
    .ar-card.ar-selected::after{content:'✓';position:absolute;top:10px;right:12px;width:22px;height:22px;border-radius:50%;background:#1D9E75;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}
    .ar-card-icon{font-size:2rem;margin-bottom:8px;line-height:1}
    .ar-card-label{font-weight:700;font-size:.95rem;margin-bottom:4px;color:var(--text-primary,#0f0a1a)}
    .ar-card-desc{font-size:.78rem;color:var(--text-muted,#645E73);line-height:1.45}
    .ar-continue{width:100%;padding:16px;border:none;border-radius:14px;font-size:1.05rem;font-weight:700;cursor:pointer;transition:all .25s;color:#fff;background:#1D9E75;min-height:52px}
    .ar-continue:disabled{opacity:.4;cursor:not-allowed;background:#888}
    .ar-continue:not(:disabled):hover{background:#178a65;transform:translateY(-1px);box-shadow:0 8px 24px rgba(29,158,117,0.3)}
    .ar-continue:focus-visible{outline:3px solid #1D9E75;outline-offset:3px}
    .ar-hint{text-align:center;color:var(--text-muted,#888);font-size:.8rem;margin-top:16px;line-height:1.5}
    @media(max-width:500px){.ar-modal{padding:28px 20px 24px;border-radius:18px}.ar-cards{grid-template-columns:1fr 1fr;gap:10px}.ar-card{padding:14px 10px;min-height:110px}.ar-modal h1{font-size:1.35rem}}
  `;
  document.head.appendChild(style);
}

const CARD_OPTIONS = [
  { id: 'visual', icon: '👁️', label: 'Visually Impaired or Blind', desc: 'Voice navigation and screen reader optimizations' },
  { id: 'deaf', icon: '👂', label: 'Deaf or Hard of Hearing', desc: 'Captions, visual alerts, and ISL video support' },
  { id: 'motor', icon: '🦽', label: 'Physical / Motor Disability', desc: 'Keyboard-only navigation and large click targets' },
  { id: 'cognitive', icon: '🧠', label: 'Cognitive / Learning Disability', desc: 'Simplified interface, reduced distractions' },
  { id: 'general', icon: '👤', label: 'Employer / General User', desc: 'Standard experience with all features' },
  { id: 'private', icon: '🔒', label: 'Prefer Not to Say', desc: 'Smart defaults based on device settings' }
];

function showOnboardingModal() {
  if (localStorage.getItem(ONBOARDED_KEY) === 'true') return;
  injectStyles();

  const selected = new Set();
  const overlay = document.createElement('div');
  overlay.className = 'ar-modal-overlay';
  overlay.setAttribute('role', 'presentation');

  const modal = document.createElement('div');
  modal.className = 'ar-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Welcome to ApnaRozgaar accessibility setup');
  modal.tabIndex = -1;

  // Skip button
  const skip = document.createElement('button');
  skip.className = 'ar-skip-btn';
  skip.textContent = '✕ Skip';
  skip.setAttribute('aria-label', 'Skip accessibility setup');
  skip.addEventListener('click', () => closeModal(false));

  // Title
  const h1 = document.createElement('h1');
  h1.textContent = "Welcome to ApnaRozgaar — let's set up your experience";

  const sub = document.createElement('p');
  sub.className = 'ar-sub';
  sub.textContent = "Tell us how you'd like to use this site. This helps us make it perfect for you.";

  // Cards grid
  const grid = document.createElement('div');
  grid.className = 'ar-cards';
  grid.setAttribute('role', 'group');
  grid.setAttribute('aria-label', 'Select your accessibility needs. You may choose multiple.');

  CARD_OPTIONS.forEach(opt => {
    const card = document.createElement('div');
    card.className = 'ar-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'checkbox');
    card.setAttribute('aria-checked', 'false');
    card.setAttribute('aria-label', `${opt.label}: ${opt.desc}`);
    card.dataset.id = opt.id;

    card.innerHTML = `<span class="ar-card-icon">${opt.icon}</span><span class="ar-card-label">${opt.label}</span><span class="ar-card-desc">${opt.desc}</span>`;

    const toggle = () => {
      if (selected.has(opt.id)) { selected.delete(opt.id); card.classList.remove('ar-selected'); card.setAttribute('aria-checked', 'false'); }
      else { selected.add(opt.id); card.classList.add('ar-selected'); card.setAttribute('aria-checked', 'true'); }
      continueBtn.disabled = selected.size === 0;
    };
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } });
    grid.appendChild(card);
  });

  // Continue button
  const continueBtn = document.createElement('button');
  continueBtn.className = 'ar-continue';
  continueBtn.textContent = 'Continue →';
  continueBtn.disabled = true;
  continueBtn.addEventListener('click', () => {
    const profile = loadProfile();
    profile.selectedNeeds = [...selected];
    profile.onboardedAt = Date.now();
    saveProfile(profile);
    localStorage.setItem(ONBOARDED_KEY, 'true');
    applyProfile(profile);
    closeModal(true);
  });

  // Hint
  const hint = document.createElement('p');
  hint.className = 'ar-hint';
  hint.textContent = 'You can always change this later in Settings → Accessibility';

  modal.append(skip, h1, sub, grid, continueBtn, hint);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Focus trap
  requestAnimationFrame(() => {
    overlay.classList.add('ar-visible');
    modal.focus();
    announceForSR('Accessibility setup dialog opened. Select how you would like to use this site.');
  });

  const focusableSelector = 'button, [tabindex="0"]';
  overlay.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(false); return; }
    if (e.key === 'Tab') {
      const focusable = [...modal.querySelectorAll(focusableSelector)];
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  function closeModal(applied) {
    overlay.classList.remove('ar-visible');
    setTimeout(() => overlay.remove(), 400);
    if (!applied) {
      // If skipped, mark onboarded but apply auto-detected only
      localStorage.setItem(ONBOARDED_KEY, 'true');
      const p = loadProfile();
      p.selectedNeeds = ['private'];
      p.onboardedAt = Date.now();
      saveProfile(p);
      applyProfile(p);
    }
  }
}

function announceForSR(msg) {
  let el = document.getElementById('ar-sr-announce');
  if (!el) {
    el = document.createElement('div');
    el.id = 'ar-sr-announce';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'assertive');
    el.setAttribute('aria-atomic', 'true');
    el.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap';
    document.body.appendChild(el);
  }
  el.textContent = '';
  setTimeout(() => { el.textContent = msg; }, 60);
}

// ─── PHASE 3 — Apply Profile Immediately ────────────────
function applyProfile(profile) {
  const needs = profile.selectedNeeds || [];
  const signals = profile.detectedSignals || {};

  // Visual / Blind
  if (needs.includes('visual')) {
    if (signals.highContrast) document.body.classList.add('high-contrast');
    // Activate voice navigator if available
    if (window.voiceNavigator) {
      try {
        window.voiceNavigator.startListening();
        window.voiceNavigator.speak('Voice navigation is now on. Say Help to hear all commands.');
      } catch (e) { /* silent */ }
    }
    document.body.classList.add('ar-visual-mode');
  }

  // Deaf / HoH
  if (needs.includes('deaf')) {
    document.body.classList.add('ar-deaf-mode');
    // Enable captions globally
    document.querySelectorAll('video').forEach(v => {
      for (let i = 0; i < v.textTracks.length; i++) v.textTracks[i].mode = 'showing';
    });
  }

  // Motor
  if (needs.includes('motor')) {
    document.body.classList.add('ar-motor-mode');
    injectMotorStyles();
  }

  // Cognitive
  if (needs.includes('cognitive')) {
    document.body.classList.add('ar-cognitive-mode');
    injectCognitiveStyles();
  }

  // Prefer not to say → silently apply detected signals
  if (needs.includes('private')) {
    if (signals.highContrast) document.body.classList.add('high-contrast');
    if (signals.reducedMotion) document.body.classList.add('ar-reduced-motion');
    if (signals.keyboardOnly || signals.likelyScreenReader) {
      document.body.classList.add('ar-visual-mode');
      if (window.voiceNavigator) {
        try { window.voiceNavigator.startListening(); } catch (e) { /* silent */ }
      }
    }
    if (signals.possibleLowVision || signals.largeText) {
      document.documentElement.style.fontSize = '18px';
    }
  }
}

function injectMotorStyles() {
  if (document.getElementById('ar-motor-css')) return;
  const s = document.createElement('style');
  s.id = 'ar-motor-css';
  s.textContent = `
    .ar-motor-mode *:focus-visible{outline:3px solid #1D9E75!important;outline-offset:4px!important}
  `;
  document.head.appendChild(s);
}

function injectCognitiveStyles() {
  if (document.getElementById('ar-cognitive-css')) return;
  const s = document.createElement('style');
  s.id = 'ar-cognitive-css';
  s.textContent = `
    .ar-cognitive-mode{line-height:1.9!important}
    .ar-cognitive-mode *{transition-duration:0s!important;animation-duration:0s!important}
    .ar-cognitive-mode .non-essential,.ar-cognitive-mode [data-decorative]{display:none!important}
  `;
  document.head.appendChild(s);
}

// ─── PHASE 4 — UDID Verification (helpers for profile page) ─
function getUDIDStatus() {
  const p = loadProfile();
  return p.udidStatus || 'none'; // none | pending | verified
}

function setUDIDStatus(status, photoData) {
  const p = loadProfile();
  p.udidStatus = status;
  if (photoData) p.udidPhotoPreview = photoData;
  p.udidSubmittedAt = Date.now();
  saveProfile(p);
}

// ─── PHASE 5 — Behavioural Learning ─────────────────────
function trackBehaviour() {
  const b = loadBehaviour();
  if (!b.sessionStart) b.sessionStart = Date.now();
  if (!b.voiceCommandCount) b.voiceCommandCount = 0;
  if (!b.captionToggleCount) b.captionToggleCount = 0;
  if (!b.zoomCount) b.zoomCount = 0;
  if (!b.formStartTimes) b.formStartTimes = {};
  if (!b.lastEvaluation) b.lastEvaluation = 0;

  // Voice command tracking
  const origProcessCommand = window.voiceNavigator?.processCommand?.bind(window.voiceNavigator);
  if (origProcessCommand && !window._arVoicePatched) {
    window._arVoicePatched = true;
    window.voiceNavigator.processCommand = function(cmd) {
      const bh = loadBehaviour();
      bh.voiceCommandCount = (bh.voiceCommandCount || 0) + 1;
      saveBehaviour(bh);
      return origProcessCommand(cmd);
    };
  }

  // Caption toggle tracking
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-caption-toggle], [aria-label*="caption" i]');
    if (t) {
      const bh = loadBehaviour();
      bh.captionToggleCount = (bh.captionToggleCount || 0) + 1;
      saveBehaviour(bh);
    }
  });

  // Zoom tracking
  let lastDPR = window.devicePixelRatio;
  const checkZoom = () => {
    if (window.devicePixelRatio !== lastDPR) {
      lastDPR = window.devicePixelRatio;
      const bh = loadBehaviour();
      bh.zoomCount = (bh.zoomCount || 0) + 1;
      saveBehaviour(bh);
      if (bh.zoomCount >= 3) showNonBlockingToast('💡 Would you like to switch to large text mode?', () => {
        document.documentElement.style.fontSize = '20px';
        const p = loadProfile();
        p.largeTextEnabled = true;
        saveProfile(p);
      });
    }
  };
  window.addEventListener('resize', checkZoom);

  // Form time tracking
  document.addEventListener('focusin', e => {
    if (e.target.matches('input, textarea, select')) {
      const form = e.target.closest('form');
      if (form && !form.dataset.arTracked) {
        form.dataset.arTracked = 'true';
        const bh = loadBehaviour();
        bh.formStartTimes[form.id || 'form_' + Date.now()] = Date.now();
        saveBehaviour(bh);
        setTimeout(() => {
          if (document.activeElement && document.activeElement.closest('form') === form) {
            showNonBlockingToast('🎤 Would you like help filling this form with voice commands?', () => {
              if (window.voiceNavigator) {
                try { window.voiceNavigator.startListening(); } catch (e) { /* silent */ }
              }
            });
          }
        }, 60000);
      }
    }
  });

  // Weekly re-evaluation
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  if (Date.now() - (b.lastEvaluation || 0) > SEVEN_DAYS) {
    setTimeout(() => weeklyEvaluation(), 10000);
  }

  saveBehaviour(b);
}

function weeklyEvaluation() {
  const b = loadBehaviour();
  const p = loadProfile();
  const suggestions = [];

  if ((b.voiceCommandCount || 0) >= 3 && !(p.selectedNeeds || []).includes('visual')) {
    suggestions.push('You use voice commands frequently. Enable full visual accessibility mode?');
  }
  if ((b.captionToggleCount || 0) >= 2 && !(p.selectedNeeds || []).includes('deaf')) {
    suggestions.push('You use captions often. Enable Deaf/HoH accessibility features?');
  }
  if ((b.zoomCount || 0) >= 3 && !p.largeTextEnabled) {
    suggestions.push('You zoom in frequently. Switch to large text mode?');
  }

  if (suggestions.length > 0) {
    showNonBlockingToast('🔔 ' + suggestions[0], () => {
      // Apply the first suggestion
      if (suggestions[0].includes('visual')) { p.selectedNeeds = [...(p.selectedNeeds || []), 'visual']; }
      if (suggestions[0].includes('Deaf')) { p.selectedNeeds = [...(p.selectedNeeds || []), 'deaf']; }
      if (suggestions[0].includes('large text')) { p.largeTextEnabled = true; document.documentElement.style.fontSize = '20px'; }
      saveProfile(p);
      applyProfile(p);
    });
  }

  b.lastEvaluation = Date.now();
  saveBehaviour(b);
}

function showNonBlockingToast(message, onAccept) {
  if (document.querySelector('.ar-toast')) return;
  const toast = document.createElement('div');
  toast.className = 'ar-toast';
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  toast.style.cssText = `position:fixed;bottom:80px;right:24px;max-width:360px;padding:16px 20px;border-radius:16px;background:var(--bg-secondary,#f3f1f9);border:1px solid var(--border,rgba(0,0,0,0.1));box-shadow:0 12px 40px rgba(0,0,0,0.15);z-index:99990;font-family:'Inter',sans-serif;font-size:.9rem;color:var(--text-primary,#0f0a1a);display:flex;flex-direction:column;gap:10px;animation:ar-slideUp .35s ease forwards`;

  const msg = document.createElement('p');
  msg.style.cssText = 'margin:0;line-height:1.5';
  msg.textContent = message;

  const btns = document.createElement('div');
  btns.style.cssText = 'display:flex;gap:8px;justify-content:flex-end';

  const dismiss = document.createElement('button');
  dismiss.textContent = 'Dismiss';
  dismiss.style.cssText = 'padding:8px 16px;border-radius:10px;border:1px solid var(--border,#ddd);background:transparent;cursor:pointer;font-size:.85rem;color:var(--text-muted,#888);min-height:36px';
  dismiss.addEventListener('click', () => toast.remove());

  const accept = document.createElement('button');
  accept.textContent = 'Yes, enable';
  accept.style.cssText = 'padding:8px 16px;border-radius:10px;border:none;background:#1D9E75;color:#fff;cursor:pointer;font-weight:600;font-size:.85rem;min-height:36px';
  accept.addEventListener('click', () => { if (onAccept) onAccept(); toast.remove(); });

  btns.append(dismiss, accept);
  toast.append(msg, btns);
  document.body.appendChild(toast);
  setTimeout(() => { if (toast.parentNode) toast.remove(); }, 15000);
}

// ─── EXPORTED API ───────────────────────────────────────
export function getAccessibilityProfile() { return loadProfile(); }
export function resetAccessibilityProfile() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(BEHAVIOUR_KEY);
  localStorage.removeItem(ONBOARDED_KEY);
  // Remove applied classes
  document.body.classList.remove('ar-visual-mode', 'ar-deaf-mode', 'ar-motor-mode', 'ar-cognitive-mode', 'ar-reduced-motion', 'high-contrast');
  document.documentElement.style.fontSize = '';
  ['ar-motor-css', 'ar-cognitive-css'].forEach(id => document.getElementById(id)?.remove());
}

export function reopenOnboarding() {
  localStorage.removeItem(ONBOARDED_KEY);
  showOnboardingModal();
}

export { getUDIDStatus, setUDIDStatus };

// ─── INIT — runs on import ──────────────────────────────
function init() {
  runAutoDetection();

  // Re-apply profile if already onboarded
  const profile = loadProfile();
  if (localStorage.getItem(ONBOARDED_KEY) === 'true' && profile.selectedNeeds) {
    applyProfile(profile);
  }

  // Show onboarding modal on first visit (after 1.5s)
  if (localStorage.getItem(ONBOARDED_KEY) !== 'true') {
    setTimeout(() => showOnboardingModal(), 1500);
  }

  // Phase 5 — behavioural tracking
  trackBehaviour();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export default { getAccessibilityProfile, resetAccessibilityProfile, reopenOnboarding, getUDIDStatus, setUDIDStatus };
