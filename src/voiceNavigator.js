const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

class VoiceNavigator {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    // Load state from localStorage to persist across navigation
    this.isListening = localStorage.getItem('vn_is_listening') === 'true';
    this.transcriptBubble = null;
    this.micButton = null;
    this.silenceTimer = null;
    this.lastSpoken = "";
    this.isProcessingAI = false;
    this.helpText = "Available commands: Go to jobs, Go to home, Open my profile, Go back, Scroll down, Scroll up, Go to top, Go to bottom. " +
      "Search for [job title], Filter remote jobs, Filter full time, Clear filters, Read job results. " +
      "Open job number [1, 2, 3...], Read this job, Apply for this job, Save this job, Go back to results. " +
      "Fill my name, Fill my email, Fill my phone, Upload my resume, Submit application, Read the form. " +
      "Increase text size, Decrease text size, Enable high contrast, Read page, Stop reading, Help, Repeat. " +
      "To stop, say 'Stop listening'.";

    // Attempt to initialize on load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      this.createFallbackUI();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      localStorage.setItem('vn_is_listening', 'true');
      this.updateUIListening(true);
      if (sessionStorage.getItem('vn_first_start') !== 'false') {
        this.speak("Voice Control Active. I am listening continuously.");
        sessionStorage.setItem('vn_first_start', 'false');
      }
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (interimTranscript) {
        this.showTranscript(interimTranscript);
      }

      if (finalTranscript) {
        this.showTranscript(finalTranscript);
        this.processCommand(finalTranscript.trim().toLowerCase());
      }
    };

    this.recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === 'not-allowed') {
        this.speak("Microphone access denied.");
        this.isListening = false;
        localStorage.setItem('vn_is_listening', 'false');
      }
      this.stopListening();
    };

    this.recognition.onend = () => {
      // If we are still supposed to be listening (continuous mode), restart
      if (this.isListening) {
        try {
          this.recognition.start();
        } catch (e) {
          console.log("Restarting recognition...");
        }
      } else {
        this.updateUIListening(false);
        setTimeout(() => this.hideTranscript(), 2000);
      }
    };

    this.createUI();

    // Auto-start if it was listening before reload
    if (this.isListening) {
      setTimeout(() => this.startListening(), 1000);
    }
  }

  createFallbackUI() {
    console.warn("SpeechRecognition not supported in this browser.");
    const msg = document.createElement('div');
    msg.innerText = "Voice commands are not supported in your browser.";
    msg.style.cssText = "position:fixed;bottom:20px;right:20px;background:#ef4444;color:white;padding:12px 20px;border-radius:12px;z-index:9999;font-weight:600;box-shadow:0 10px 25px rgba(239, 68, 68, 0.3);";
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 5000);
  }

  createUI() {
    const style = document.createElement('style');
    style.innerHTML = `
      .vn-mic-btn {
        position: fixed;
        bottom: 10px;
        left: 20px;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, #08080aff, #07070aff);
        color: white;
        border: none;
        box-shadow: 0 10px 30px rgba(12, 12, 12, 0.4);
        cursor: pointer;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .vn-mic-btn:focus, .vn-mic-btn:hover {
        transform: scale(1.15);
        box-shadow: 0 15px 40px rgba(79, 70, 229, 0.5);
        outline: none;
      }
      .vn-mic-btn.vn-listening {
        background: linear-gradient(135deg, #10b981, #059669);
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
        animation: vn-pulse 1.5s infinite;
      }
      @keyframes vn-pulse {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
        70% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(16, 185, 129, 0); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
      }
      .vn-transcript {
        position: fixed;
        bottom: 70px;
        left: 30px;
        background: rgba(15, 10, 26, 0.9);
        backdrop-filter: blur(8px);
        color: white;
        padding: 16px 24px;
        border-radius: 20px;
        font-size: 16px;
        font-family: 'Inter', sans-serif;
        font-weight: 500;
        z-index: 10000;
        display: none;
        max-width: 320px;
        box-shadow: 0 15px 45px rgba(0,0,0,0.3);
        border: 1px solid rgba(255,255,255,0.1);
        word-wrap: break-word;
        transition: all 0.3s ease;
      }
      .vn-status-dot {
        display: inline-block;
        width: 10px;
        height: 10px;
        background: #10b981;
        border-radius: 50%;
        margin-right: 10px;
        animation: vn-blink 1s infinite;
      }
      @keyframes vn-blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);

    this.micButton = document.createElement('button');
    this.micButton.className = 'vn-mic-btn';
    this.micButton.setAttribute('aria-label', 'Activate Voice Navigation');
    this.micButton.setAttribute('tabindex', '0');
    this.micButton.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`;

    this.micButton.addEventListener('click', () => this.toggleListening());

    this.transcriptBubble = document.createElement('div');
    this.transcriptBubble.className = 'vn-transcript';

    document.body.appendChild(this.micButton);
    document.body.appendChild(this.transcriptBubble);
  }

  updateUIListening(isListening) {
    if (isListening) {
      this.micButton.classList.add('vn-listening');
      this.showTranscript("Listening...");
    } else {
      this.micButton.classList.remove('vn-listening');
    }
  }

  showTranscript(text) {
    this.transcriptBubble.style.display = 'block';
    this.transcriptBubble.innerHTML = `<span class="vn-status-dot"></span>${text}`;
  }

  hideTranscript() {
    this.transcriptBubble.style.display = 'none';
  }

  speak(text) {
    this.lastSpoken = text;
    this.synthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 1;
    utterance.rate = 1;
    this.synthesis.speak(utterance);
    this.showTranscript(" " + text);
  }

  toggleListening() {
    if (this.isListening) {
      this.isListening = false;
      localStorage.setItem('vn_is_listening', 'false');
      this.stopListening();
      this.speak("Voice Control Deactivated.");
    } else {
      this.startListening();
    }
  }

  startListening() {
    try {
      this.isListening = true;
      localStorage.setItem('vn_is_listening', 'true');
      this.recognition.start();
    } catch (e) { }
  }

  stopListening() {
    try {
      this.recognition.stop();
    } catch (e) { }
  }

  async extractIntentWithAI(transcript) {
    if (this.isProcessingAI) return null;
    this.isProcessingAI = true;

    const COMMAND_SYSTEM_PROMPT = `
You are the voice assistant for ApnaRozgaar. Extract the user's intent.
Respond ONLY with a JSON object: {"intent": "INTENT_NAME", "params": {"key": "value"}}.

Intents:
- NAV_JOBS, NAV_HOME, NAV_PROFILE, NAV_BACK
- NAV_TO: params {"keyword": "tab or page name"} - User wants to go to a specific section/tab
- CLICK: params {"keyword": "button or link text"} - User wants to click something specific
- SCROLL_DOWN, SCROLL_UP, SCROLL_TOP, SCROLL_BOTTOM
- SEARCH: params {"query": "job title"}
- FILTER: params {"type": "remote" | "fulltime" | "clear"}
- READ_RESULTS, READ_JOB, SAVE_JOB, APPLY
- OPEN_JOB: params {"number": 1}
- FILL_FORM: params {"field": "name" | "email" | "phone"}
- SUBMIT, HELP, STOP_LISTENING

Example: "Click on the employer tab" -> {"intent": "CLICK", "params": {"keyword": "employer"}}
Example: "Go to the interview preparation section" -> {"intent": "NAV_TO", "params": {"keyword": "interview preparation"}}
`;

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'groq/compound-mini',
          messages: [
            { role: 'system', content: COMMAND_SYSTEM_PROMPT },
            { role: 'user', content: transcript }
          ],
          temperature: 0.1
        })
      });

      const data = await response.json();
      const content = data.choices[0].message.content;
      this.isProcessingAI = false;
      return JSON.parse(content.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch (e) {
      this.isProcessingAI = false;
      return null;
    }
  }

  fuzzyMatch(text, target) {
    const normalize = s => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const normText = normalize(text);
    const normTarget = normalize(target);
    return normText.includes(normTarget) || normTarget.includes(normText);
  }

  findAndClickElement(identifiers, feedbackMsg) {
    let foundEl = null;

    // 1. Try exact data-voice match
    for (let id of identifiers) {
      const el = document.querySelector(`[data-voice="${id}"]`);
      if (el) { foundEl = el; break; }
    }

    // 2. Try contains match on multiple attributes
    if (!foundEl) {
      const allElements = document.querySelectorAll('a, button, input, select, [role="button"], [role="link"], [tabindex="0"]');
      for (let el of allElements) {
        const textContent = (el.innerText || '').toLowerCase().trim();
        const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
        const title = (el.getAttribute('title') || '').toLowerCase();

        for (let id of identifiers) {
          const lowerId = id.toLowerCase().trim();
          if (textContent.includes(lowerId) || ariaLabel.includes(lowerId) || title.includes(lowerId)) {
            foundEl = el; break;
          }
        }
        if (foundEl) break;
      }
    }

    if (foundEl) {
      foundEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        foundEl.focus();
        foundEl.click();
      }, 300);

      if (feedbackMsg) this.speak(feedbackMsg);
      return true;
    }
    return false;
  }

  fillField(field, value) {
    const fieldMap = {
      'name': ["fill-name", "name", "first name", "full name"],
      'email': ["fill-email", "email"],
      'phone': ["fill-phone", "phone", "mobile"]
    };

    const identifiers = fieldMap[field] || [field];
    let foundEl = null;

    const inputs = document.querySelectorAll('input, textarea');
    for (let el of inputs) {
      const name = (el.getAttribute('name') || '').toLowerCase();
      const idAttr = (el.getAttribute('id') || '').toLowerCase();
      const placeholder = (el.getAttribute('placeholder') || '').toLowerCase();

      for (let id of identifiers) {
        if (name.includes(id) || idAttr.includes(id) || placeholder.includes(id)) {
          foundEl = el; break;
        }
      }
      if (foundEl) break;
    }

    if (foundEl) {
      foundEl.focus();
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (nativeSetter) nativeSetter.call(foundEl, value);
      else foundEl.value = value;

      foundEl.dispatchEvent(new Event('input', { bubbles: true }));
      foundEl.dispatchEvent(new Event('change', { bubbles: true }));
      this.speak(`Filled ${field}`);
      return true;
    }
    this.speak(`Could not find ${field} field`);
    return false;
  }

  async processCommand(command) {
    console.log("Processing:", command);

    // Explicit hard-coded checks for reliability
    if (this.fuzzyMatch(command, "stop listening") || this.fuzzyMatch(command, "deactivate")) {
      this.toggleListening();
      return;
    }

    // Try AI for natural language parsing
    const aiResponse = await this.extractIntentWithAI(command);
    if (!aiResponse || aiResponse.intent === 'UNKNOWN') {
      this.executeManualMatch(command);
    } else {
      this.executeAIIntent(aiResponse);
    }
  }

  executeAIIntent(ai) {
    console.log("AI Intent:", ai.intent, ai.params);
    switch (ai.intent) {
      case 'NAV_JOBS': window.location.href = "/jobs"; this.speak("Going to jobs"); break;
      case 'NAV_HOME': window.location.href = "/"; this.speak("Going home"); break;
      case 'NAV_PROFILE': window.location.href = "/profile"; this.speak("Opening profile"); break;
      case 'NAV_BACK': window.history.back(); this.speak("Going back"); break;
      case 'NAV_TO':
      case 'CLICK':
        const keyword = ai.params.keyword || ai.params.query;
        const success = this.findAndClickElement([keyword], `Clicking on ${keyword}`);
        if (!success) this.speak(`Could not find ${keyword}`);
        break;
      case 'SCROLL_DOWN': window.scrollBy({ top: 500, behavior: 'smooth' }); break;
      case 'SCROLL_UP': window.scrollBy({ top: -500, behavior: 'smooth' }); break;
      case 'SCROLL_TOP': window.scrollTo({ top: 0, behavior: 'smooth' }); break;
      case 'SCROLL_BOTTOM': window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); break;
      case 'SEARCH':
        this.fillField('search', ai.params.query);
        this.findAndClickElement(['submit', 'search-btn', 'search'], 'Searching...');
        break;
      case 'FILTER':
        if (ai.params.type === 'remote') this.findAndClickElement(['filter-remote', 'remote'], 'Filtering remote');
        else if (ai.params.type === 'fulltime') this.findAndClickElement(['filter-fulltime', 'full time'], 'Filtering full time');
        else this.findAndClickElement(['clear-filters', 'clear'], 'Filters cleared');
        break;
      case 'FILL_FORM':
        const val = ai.params.field === 'name' ? 'Aryan' : (ai.params.field === 'email' ? 'aryan@example.com' : '9876543210');
        this.fillField(ai.params.field, val);
        break;
      case 'SUBMIT': this.findAndClickElement(['submit-form', 'apply', 'submit'], 'Submitting application'); break;
      case 'STOP_LISTENING': this.toggleListening(); break;
      case 'HELP': this.speak(this.helpText); break;
      default: this.executeManualMatch(ai.params.keyword || "");
    }
  }

  executeManualMatch(command) {
    if (!command) return;
    // Fallback to manual fuzzy matching if AI fails
    if (this.fuzzyMatch(command, "go to jobs")) window.location.href = "/jobs";
    else if (this.fuzzyMatch(command, "go to home")) window.location.href = "/";
    else if (this.fuzzyMatch(command, "help")) this.speak(this.helpText);
    else {
      // Generic click fallback
      this.findAndClickElement([command], `Attempting to click ${command}`);
    }
  }
}

window.voiceNavigator = new VoiceNavigator();
export default window.voiceNavigator;

