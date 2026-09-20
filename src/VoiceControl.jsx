import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, X, Volume2, Navigation, MousePointer,
  Search, Home, Briefcase, User, MessageCircle, Settings,
  ChevronUp, ChevronDown, ArrowLeft, HelpCircle, Zap, Target,
  Globe, Check, AlertCircle
} from 'lucide-react';
import { useVoiceControl, useVoiceCommands } from './useVoiceControl';
import { announceToScreenReader } from './utils/a11y';

const STORAGE_KEY = 'voice-control-settings';

/**
 * VoiceControl Component
 * A comprehensive voice command system for hands-free website navigation
 * Supports navigation, scrolling, clicking, and custom actions
 */
export default function VoiceControl({ embedded = false }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(embedded ? true : false);
  const [showHelp, setShowHelp] = useState(false);
  const [commandHistory, setCommandHistory] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [settings, setSettings] = useState({
    language: 'en-US',
    feedbackSound: true,
    autoListen: false,
    showTranscript: true,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);

  const feedbackTimeoutRef = useRef(null);

  // Load settings
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSettings(prev => ({ ...prev, ...JSON.parse(stored) }));
      } catch {
        console.error('Failed to parse voice control settings');
      }
    }
  }, []);

  // Save settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        const voicesArray = Array.from(v);
        setVoices(voicesArray);

        // Prioritize Microsoft Ravi, then any English (India) voice, then any English voice
        const raviVoice = voicesArray.find(voice => voice.name.includes('Ravi'));
        const indianVoice = voicesArray.find(voice => voice.lang === 'en-IN' || voice.lang === 'en_IN');
        const englishVoice = voicesArray.find(voice => voice.lang.startsWith('en'));

        const bestVoice = raviVoice || indianVoice || englishVoice || voicesArray[0];
        setSelectedVoice(bestVoice);
        return true;
      }
      return false;
    };

    // Polling fallback as getVoices() can be empty initially
    if (!loadVoices()) {
      const interval = setInterval(() => {
        if (loadVoices()) clearInterval(interval);
      }, 100);
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Show feedback with auto-dismiss
  const showFeedback = useCallback((message, type = 'success') => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    setFeedback({ message, type });
    announceToScreenReader(message);

    // Play feedback sound
    if (settings.feedbackSound) {
      const audio = new Audio();
      audio.src = type === 'success'
        ? 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU' // Short beep
        : 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'; // Error beep
      // Commenting out audio play to avoid issues, visual feedback is enough
    }

    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
    }, 3000);
  }, [settings.feedbackSound]);

  // Define all voice commands
  const commands = {
    // Navigation Commands
    'go home': () => { navigate('/'); showFeedback('Navigating to home page', 'success'); },
    'go to home': () => { navigate('/'); showFeedback('Navigating to home page', 'success'); },
    'home page': () => { navigate('/'); showFeedback('Navigating to home page', 'success'); },

    'go to jobs': () => { navigate('/jobs'); showFeedback('Navigating to job listings', 'success'); },
    'find jobs': () => { navigate('/jobs'); showFeedback('Navigating to job listings', 'success'); },
    'job listings': () => { navigate('/jobs'); showFeedback('Navigating to job listings', 'success'); },
    'show jobs': () => { navigate('/jobs'); showFeedback('Navigating to job listings', 'success'); },

    'go to profile': () => { navigate('/profile/create'); showFeedback('Navigating to profile', 'success'); },
    'create profile': () => { navigate('/profile/create'); showFeedback('Navigating to profile builder', 'success'); },
    'my profile': () => { navigate('/profile/create'); showFeedback('Navigating to profile', 'success'); },

    'go to chat': () => { navigate('/chat'); showFeedback('Opening chat with Asha', 'success'); },
    'open chat': () => { navigate('/chat'); showFeedback('Opening chat with Asha', 'success'); },
    'talk to asha': () => { navigate('/chat'); showFeedback('Opening chat with Asha', 'success'); },
    'chat with asha': () => { navigate('/chat'); showFeedback('Opening chat with Asha', 'success'); },

    'post a job': () => { navigate('/employer'); showFeedback('Navigating to employer dashboard', 'success'); },
    'employer dashboard': () => { navigate('/employer'); showFeedback('Navigating to employer dashboard', 'success'); },

    'about us': () => { navigate('/about'); showFeedback('Navigating to about page', 'success'); },
    'go to about': () => { navigate('/about'); showFeedback('Navigating to about us', 'success'); },

    'interview prep': () => { navigate('/interview-prep'); showFeedback('Navigating to interview prep', 'success'); },
    'interview help': () => { navigate('/interview-prep'); showFeedback('Navigating to interview prep', 'success'); },
    'practice interview': () => { navigate('/interview-prep'); showFeedback('Navigating to interview prep', 'success'); },

    'sign in': () => { navigate('/auth'); showFeedback('Navigating to sign in', 'success'); },
    'login': () => { navigate('/auth'); showFeedback('Navigating to sign in', 'success'); },
    'sign up': () => { navigate('/auth'); showFeedback('Navigating to sign up', 'success'); },

    'go back': () => { navigate(-1); showFeedback('Going back', 'success'); },
    'back': () => { navigate(-1); showFeedback('Going back', 'success'); },
    'previous page': () => { navigate(-1); showFeedback('Going back', 'success'); },

    // Scrolling Commands
    'scroll down': () => { window.scrollBy({ top: 400, behavior: 'smooth' }); showFeedback('Scrolling down', 'success'); },
    'scroll up': () => { window.scrollBy({ top: -400, behavior: 'smooth' }); showFeedback('Scrolling up', 'success'); },
    'scroll to top': () => { window.scrollTo({ top: 0, behavior: 'smooth' }); showFeedback('Scrolling to top', 'success'); },
    'go to top': () => { window.scrollTo({ top: 0, behavior: 'smooth' }); showFeedback('Scrolling to top', 'success'); },
    'scroll to bottom': () => { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); showFeedback('Scrolling to bottom', 'success'); },
    'page down': () => { window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' }); showFeedback('Page down', 'success'); },
    'page up': () => { window.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' }); showFeedback('Page up', 'success'); },

    // Click Commands
    'click': () => {
      const focused = document.activeElement;
      if (focused && focused !== document.body) {
        focused.click();
        showFeedback('Clicked focused element', 'success');
      } else {
        showFeedback('No element focused to click', 'error');
      }
    },
    'press enter': () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      document.activeElement?.dispatchEvent(event);
      showFeedback('Pressed enter', 'success');
    },
    'submit': () => {
      const form = document.querySelector('form');
      if (form) {
        form.requestSubmit();
        showFeedback('Form submitted', 'success');
      } else {
        const button = document.querySelector('button[type="submit"], button.submit-btn, button:contains("Submit")');
        button?.click();
        showFeedback('Submit clicked', 'success');
      }
    },

    // Focus Commands
    'next': () => {
      const focusable = getFocusableElements();
      const currentIndex = focusable.indexOf(document.activeElement);
      const nextIndex = (currentIndex + 1) % focusable.length;
      focusable[nextIndex]?.focus();
      showFeedback('Focused next element', 'success');
    },
    'previous': () => {
      const focusable = getFocusableElements();
      const currentIndex = focusable.indexOf(document.activeElement);
      const prevIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
      focusable[prevIndex]?.focus();
      showFeedback('Focused previous element', 'success');
    },
    'focus search': () => {
      const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i], input[name*="search" i]');
      if (searchInput) {
        searchInput.focus();
        showFeedback('Search focused', 'success');
      } else {
        showFeedback('No search field found', 'error');
      }
    },

    // Accessibility Commands
    'read page': () => {
      const mainContent = document.querySelector('main') || document.body;
      const text = mainContent.innerText;
      const utterance = new SpeechSynthesisUtterance(text);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      window.speechSynthesis.speak(utterance);
      showFeedback('Reading page content', 'success');
    },
    'stop reading': () => {
      window.speechSynthesis.cancel();
      showFeedback('Stopped reading', 'success');
    },

    // UI Commands
    'show help': () => { setShowHelp(true); showFeedback('Showing voice commands help', 'success'); },
    'hide help': () => { setShowHelp(false); showFeedback('Help panel closed', 'success'); },
    'close': () => { setIsOpen(false); showFeedback('Voice control panel closed', 'success'); },
    'stop listening': () => { stopListening(); showFeedback('Voice control stopped', 'success'); },

    // Dynamic search command
    'search for': (transcript) => {
      const query = transcript.replace(/search for/i, '').trim();
      if (query) {
        navigate(`/jobs?search=${encodeURIComponent(query)}`);
        showFeedback(`Searching for: ${query}`, 'success');
      }
    },

    // ===== CHATBOT VOICE COMMANDS =====
    // Type and send to chatbot
    'ask asha': (transcript) => {
      const message = transcript.replace(/ask asha/i, '').trim();
      if (message) {
        typeAndSendToChat(message);
        showFeedback(`Asking Asha: "${message}"`, 'success');
      } else {
        showFeedback('Please say "Ask Asha" followed by your question', 'error');
      }
    },
    'tell asha': (transcript) => {
      const message = transcript.replace(/tell asha/i, '').trim();
      if (message) {
        typeAndSendToChat(message);
        showFeedback(`Telling Asha: "${message}"`, 'success');
      }
    },
    'send message': (transcript) => {
      const message = transcript.replace(/send message/i, '').trim();
      if (message) {
        typeAndSendToChat(message);
        showFeedback(`Sending: "${message}"`, 'success');
      } else {
        // Just click send button if no message specified
        clickChatSendButton();
      }
    },
    'type': (transcript) => {
      const text = transcript.replace(/^type\s*/i, '').trim();
      if (text) {
        typeInChatInput(text);
        showFeedback(`Typed: "${text}"`, 'success');
      }
    },
    'send': () => {
      clickChatSendButton();
      showFeedback('Message sent!', 'success');
    },
    'clear chat': () => {
      const clearBtn = document.querySelector('button[aria-label*="clear" i], button[title*="clear" i]');
      if (clearBtn) {
        clearBtn.click();
        showFeedback('Chat cleared', 'success');
      } else {
        showFeedback('Clear button not found', 'error');
      }
    },

    // ===== JOB APPLICATION COMMANDS =====
    'view and apply': () => {
      const btn = document.querySelector('[data-voice-command="view and apply"]');
      if (btn) {
        btn.click();
        showFeedback('Opening job details', 'success');
      } else {
        showFeedback('View and apply button not found', 'error');
      }
    },
    'apply job': () => {
      const btn = document.getElementById('apply-job-btn');
      if (btn) {
        btn.click();
        showFeedback('Applying for job', 'success');
      } else {
        showFeedback('Apply button not found', 'error');
      }
    },
    'apply now': () => {
      const btn = document.getElementById('apply-job-btn');
      if (btn) {
        btn.click();
        showFeedback('Applying for job', 'success');
      } else {
        showFeedback('Apply button not found', 'error');
      }
    },
    'add resume': () => {
      const input = document.getElementById('resume-input');
      if (input) {
        input.focus();
        showFeedback('Resume field focused', 'success');
      } else {
        // If the area is not showing yet, click apply once to show it
        const btn = document.getElementById('apply-job-btn');
        if (btn) {
          btn.click();
          showFeedback('Opening resume field', 'info');
          setTimeout(() => {
            document.getElementById('resume-input')?.focus();
          }, 300);
        } else {
          showFeedback('Resume field not found', 'error');
        }
      }
    },
    'magic apply': async () => {
      if (!isAuthenticated) {
        navigate('/auth');
        showFeedback('Please sign in first', 'info');
        return;
      }

      showFeedback('Starting magic application workflow...', 'info');

      // Step 1: Open first available job if on listings page
      if (location.pathname === '/jobs') {
        const firstJob = document.querySelector('[data-voice-command="view and apply"]');
        if (firstJob) {
          firstJob.click();
          // Wait for load
          setTimeout(() => commands['magic apply'](), 1500);
          return;
        }
      }

      // Step 2: Handle Job Detail page
      const applyBtn = document.getElementById('apply-job-btn');
      if (applyBtn) {
        // If it says "✓ Applied", stop
        if (applyBtn.innerText.includes('Applied')) {
          showFeedback('You have already applied for this job', 'success');
          return;
        }

        applyBtn.click();
        showFeedback('Filling details and applying...', 'info');

        // Final click for confirmation
        setTimeout(() => {
          const confirmBtn = document.getElementById('apply-job-btn');
          if (confirmBtn) {
            confirmBtn.click();
            showFeedback('Job Application Submitted Successfully!', 'success');
          }
        }, 1000);
      } else {
        showFeedback('No apply button found. Please navigate to a job.', 'error');
      }
    },
    'automate': () => commands['magic apply'](),
    'workflow': () => commands['magic apply'](),
  };

  // Helper function to find and type in chat input
  const typeInChatInput = (text) => {
    // Find chatbot textarea/input
    const chatInput = document.querySelector(
      'textarea[placeholder*="message" i], ' +
      'textarea[placeholder*="ask" i], ' +
      'textarea[placeholder*="type" i], ' +
      'input[placeholder*="message" i], ' +
      '.chat-input textarea, ' +
      '.chatbot textarea'
    );

    if (chatInput) {
      // Focus the input
      chatInput.focus();

      // Set the value using native input value setter to trigger React state update
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      )?.set || Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )?.set;

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(chatInput, text);
      } else {
        chatInput.value = text;
      }

      // Dispatch input event to trigger React onChange
      const inputEvent = new Event('input', { bubbles: true });
      chatInput.dispatchEvent(inputEvent);

      return true;
    }
    return false;
  };

  // Helper function to click the send button
  const clickChatSendButton = () => {
    const sendBtn = document.querySelector(
      'button[aria-label*="send" i], ' +
      'button[type="submit"], ' +
      'button svg[class*="send" i], ' +
      '.chat-send-btn, ' +
      'button:has(svg)'
    );

    // Find button with Send icon or text
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      const text = btn.textContent?.toLowerCase() || '';
      const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
      if (text.includes('send') || ariaLabel.includes('send') || btn.querySelector('svg')) {
        // Check if it's near a textarea (likely send button)
        const parent = btn.closest('form') || btn.closest('div');
        if (parent?.querySelector('textarea')) {
          btn.click();
          return true;
        }
      }
    }

    if (sendBtn) {
      sendBtn.click();
      return true;
    }

    // Fallback: press Enter on the textarea
    const chatInput = document.querySelector('textarea');
    if (chatInput) {
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true
      });
      chatInput.dispatchEvent(enterEvent);
      return true;
    }

    return false;
  };

  // Helper function to type and send message to chat
  const typeAndSendToChat = (message) => {
    // If not on chat page, navigate there first
    if (location.pathname !== '/chat') {
      navigate('/chat');
      // Wait for page to load, then type and send
      setTimeout(() => {
        typeInChatInput(message);
        setTimeout(() => {
          clickChatSendButton();
        }, 300);
      }, 500);
    } else {
      typeInChatInput(message);
      setTimeout(() => {
        clickChatSendButton();
      }, 200);
    }
  };

  const { processCommand } = useVoiceCommands(commands);

  // Voice control hook - use ref for callback to prevent re-initialization
  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    confidence,
    error,
    startListening,
    stopListening,
    toggleListening,
  } = useVoiceControl({
    language: settings.language,
    onResult: (text) => {
      const result = processCommand(text);

      setCommandHistory(prev => [
        { text, matched: result.matched, timestamp: Date.now() },
        ...prev.slice(0, 9)
      ]);

      if (!result.matched) {
        showFeedback(`Command not recognized: "${text}"`, 'error');
      }
    },
  });

  // Keyboard shortcut (Alt + V) to toggle voice control
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === 'v') {
        e.preventDefault();
        if (isOpen) {
          toggleListening();
        } else {
          setIsOpen(true);
        }
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        stopListening();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggleListening, stopListening]);

  // Get all focusable elements
  const getFocusableElements = () => {
    return Array.from(document.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(el => el.offsetParent !== null);
  };

  const commandCategories = [
    {
      title: 'Navigation',
      icon: Navigation,
      commands: [
        { phrase: '"Go home"', action: 'Navigate to home page' },
        { phrase: '"Go to jobs"', action: 'Open job listings' },
        { phrase: '"Go to profile"', action: 'Open profile builder' },
        { phrase: '"Go to chat"', action: 'Open AI assistant' },
        { phrase: '"About us"', action: 'Learn about our mission' },
        { phrase: '"Interview prep"', action: 'Practice for interviews' },
        { phrase: '"Go back"', action: 'Previous page' },
        { phrase: '"Search for [query]"', action: 'Search jobs' },
        { phrase: '"View and apply"', action: 'Open selected job details' },
        { phrase: '"Apply job"', action: 'Apply for the current job' },
        { phrase: '"Add resume"', action: 'Focus resume input field' },
      ]
    },
    {
      title: 'Chat with Asha',
      icon: MessageCircle,
      commands: [
        { phrase: '"Ask Asha [question]"', action: 'Ask Asha directly' },
        { phrase: '"Tell Asha [message]"', action: 'Send message to Asha' },
        { phrase: '"Type [text]"', action: 'Type in chat input' },
        { phrase: '"Send"', action: 'Send the message' },
        { phrase: '"Clear chat"', action: 'Clear chat history' },
      ]
    },
    {
      title: 'Scrolling',
      icon: ChevronDown,
      commands: [
        { phrase: '"Scroll down"', action: 'Scroll page down' },
        { phrase: '"Scroll up"', action: 'Scroll page up' },
        { phrase: '"Scroll to top"', action: 'Go to page top' },
        { phrase: '"Page down"', action: 'Scroll one screen' },
      ]
    },
    {
      title: 'Automation',
      icon: Zap,
      commands: [
        { phrase: '"Magic apply"', action: 'Auto-apply to the first job' },
        { phrase: '"Automate"', action: 'Execute smart workflow' },
        { phrase: '"Workflow"', action: 'Run multi-step application' },
      ]
    },
    {
      title: 'Interaction',
      icon: MousePointer,
      commands: [
        { phrase: '"Click"', action: 'Click focused element' },
        { phrase: '"Next"', action: 'Focus next element' },
        { phrase: '"Previous"', action: 'Focus previous element' },
        { phrase: '"Submit"', action: 'Submit current form' },
      ]
    },
    {
      title: 'Accessibility',
      icon: Volume2,
      commands: [
        { phrase: '"Read page"', action: 'Read page aloud' },
        { phrase: '"Stop reading"', action: 'Stop text-to-speech' },
        { phrase: '"Show help"', action: 'Show commands list' },
      ]
    },
  ];

  const languages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'hi-IN', name: 'Hindi (भारत)' },
    { code: 'es-ES', name: 'Spanish (España)' },
    { code: 'fr-FR', name: 'French (France)' },
    { code: 'de-DE', name: 'German (Deutschland)' },
  ];

  if (!isSupported) {
    return (
      <div
        className="voice-control-unsupported"
        style={{
          position: 'fixed',
          bottom: '180px',
          right: '24px',
          padding: '12px 16px',
          background: 'var(--card-bg)',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          border: '1px solid var(--danger)',
          zIndex: 9997,
          maxWidth: '280px',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MicOff size={16} />
          Voice control not supported in this browser. Try Chrome or Edge.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Floating Voice Control Button */}
      {!embedded && (
        <div
          style={{
            position: 'fixed',
            bottom: '180px',
            right: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 9997,
          }}
        >
          {/* Status Label */}
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{
              opacity: (isHovered || isListening) ? 1 : 0,
              x: (isHovered || isListening) ? 0 : 20,
              scale: (isHovered || isListening) ? 1 : 0.8
            }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            style={{
              background: isListening
                ? 'var(--success)'
                : 'var(--card-bg)',
              padding: '8px 14px',
              borderRadius: '20px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
              border: isListening ? 'none' : '1px solid var(--border)',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: isListening ? 'white' : 'var(--text-primary)',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              pointerEvents: (isHovered || isListening) ? 'auto' : 'none',
            }}
          >
            {isListening ? (
              <>
                <span className="voice-pulse" style={{
                  width: '8px',
                  height: '8px',
                  background: 'white',
                  borderRadius: '50%',
                  animation: 'pulse 1.5s infinite',
                }} />
                Listening...
              </>
            ) : isHovered ? (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Volume2 size={16} /> 🎤 Voice Control
              </motion.span>
            ) : (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                🎤 Voice Control
              </motion.span>
            )}
          </motion.div>
        </div>
      )}

      {/* Feedback Toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            style={{
              position: 'fixed',
              bottom: '100px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '14px 24px',
              background: feedback.type === 'success'
                ? 'var(--success)'
                : 'var(--danger)',
              color: 'white',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: 600,
              fontSize: '0.95rem',
            }}
          >
            {feedback.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            {feedback.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Control Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="voice-control-panel"
            role="dialog"
            aria-label="Voice Control Panel"
            style={embedded ? {
              width: '100%',
              background: 'var(--card-bg)',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '400px', // Restrict height inside panel
            } : {
              position: 'fixed',
              bottom: '250px',
              right: '24px',
              width: '380px',
              maxHeight: '70vh',
              background: 'var(--card-bg)',
              borderRadius: '20px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
              border: '1px solid var(--border)',
              zIndex: 9998,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '24px',
              background: 'var(--accent-purple)',
              color: 'white',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Mic size={28} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>
                      Voice Control
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.95rem', opacity: 1 }}>
                      {isListening ? 'Speak a command...' : 'Click mic to start'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    aria-label="Settings"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: showSettings ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Settings size={22} />
                  </button>
                  <button
                    onClick={() => setShowHelp(!showHelp)}
                    aria-label="Help"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: showHelp ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <HelpCircle size={22} />
                  </button>
                </div>
              </div>

              {/* Confidence indicator */}
              {isListening && confidence > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    opacity: 1,
                    marginBottom: '6px',
                  }}>
                    <span>Recognition confidence</span>
                    <span>{confidence}%</span>
                  </div>
                  <div style={{
                    height: '6px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${confidence}%` }}
                      style={{
                        height: '100%',
                        background: 'white',
                        borderRadius: '3px',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{
                    background: 'var(--bg-secondary)',
                    borderBottom: '1px solid var(--border)',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '20px' }}>
                    {/* Language Selection */}
                    <label style={{ display: 'block', marginBottom: '16px' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Globe size={18} /> Language
                      </span>
                      <select
                        value={settings.language}
                        onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '10px',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          fontSize: '1rem',
                        }}
                      >
                        {languages.map(lang => (
                          <option key={lang.code} value={lang.code}>{lang.name}</option>
                        ))}
                      </select>
                    </label>

                    {/* Toggle Settings */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 600 }}>Auto-listen when opened</span>
                        <input
                          type="checkbox"
                          checked={settings.autoListen}
                          onChange={(e) => setSettings(prev => ({ ...prev, autoListen: e.target.checked }))}
                          style={{ width: '22px', height: '22px', accentColor: 'var(--accent-purple)' }}
                        />
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 600 }}>Show live transcript</span>
                        <input
                          type="checkbox"
                          checked={settings.showTranscript}
                          onChange={(e) => setSettings(prev => ({ ...prev, showTranscript: e.target.checked }))}
                          style={{ width: '22px', height: '22px', accentColor: 'var(--accent-purple)' }}
                        />
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Live Transcript */}
            {settings.showTranscript && (isListening || interimTranscript || transcript) && (
              <div style={{
                padding: '20px',
                background: isListening ? 'rgba(5, 150, 105, 0.1)' : 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border)',
                minHeight: '80px',
              }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                  {isListening && (
                    <span style={{
                      width: '10px',
                      height: '10px',
                      background: 'var(--success)',
                      borderRadius: '50%',
                      animation: 'pulse 1.5s infinite',
                    }} />
                  )}
                  {isListening ? 'Listening...' : 'Last heard:'}
                </div>
                <p style={{
                  margin: 0,
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  fontStyle: interimTranscript ? 'italic' : 'normal',
                  opacity: interimTranscript ? 0.8 : 1,
                  lineHeight: 1.4
                }}>
                  {interimTranscript || transcript || 'Say something...'}
                </p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div style={{
                padding: '16px 20px',
                background: 'rgba(220, 38, 38, 0.1)',
                borderBottom: '1px solid rgba(220, 38, 38, 0.2)',
                color: 'var(--danger)',
                fontSize: '1rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            {/* Main Content - Help or Controls */}
            <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
              {showHelp ? (
                // Help Panel - Command Categories
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {commandCategories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <div key={category.title}>
                        <h4 style={{
                          margin: '0 0 12px',
                          fontSize: '1rem',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                        }}>
                          <Icon size={20} style={{ color: 'var(--accent-purple)' }} />
                          {category.title}
                        </h4>
                        <div style={{
                          background: 'var(--bg-secondary)',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          border: '1px solid var(--border)'
                        }}>
                          {category.commands.map((cmd, idx) => (
                            <div
                              key={idx}
                              style={{
                                padding: '14px 18px',
                                borderBottom: idx < category.commands.length - 1 ? '1px solid var(--border)' : 'none',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '16px',
                              }}
                            >
                              <code style={{
                                fontSize: '1rem',
                                fontWeight: 700,
                                color: 'var(--accent-purple)',
                                background: 'rgba(37, 99, 235, 0.12)',
                                padding: '6px 10px',
                                borderRadius: '8px',
                              }}>
                                {cmd.phrase}
                              </code>
                              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'right', fontWeight: 500 }}>
                                {cmd.action}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Main Controls
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Quick Actions */}
                  <div>
                    <h4 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      Quick Navigation
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                      {[
                        { icon: Home, label: 'Home', path: '/' },
                        { icon: Briefcase, label: 'Jobs', path: '/jobs' },
                        { icon: User, label: 'Profile', path: '/profile/create' },
                        { icon: MessageCircle, label: 'Chat', path: '/chat' },
                        { icon: Target, label: 'About', path: '/about' },
                        { icon: Zap, label: 'Practice', path: '/interview-prep' },
                        { icon: ArrowLeft, label: 'Back', action: () => navigate(-1) },
                        { icon: ChevronUp, label: 'Top', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                          <button
                            key={item.label}
                            onClick={() => item.action ? item.action() : navigate(item.path)}
                            style={{
                              padding: '16px 12px',
                              borderRadius: '16px',
                              border: isActive ? '2px solid var(--accent-purple)' : '1px solid var(--border)',
                              background: isActive ? 'rgba(37, 99, 235, 0.1)' : 'var(--bg-secondary)',
                              color: isActive ? 'var(--accent-purple)' : 'var(--text-primary)',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '10px',
                              fontSize: '0.9rem',
                              fontWeight: 700,
                              transition: 'all 0.2s',
                            }}
                          >
                            <Icon size={22} />
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Command History */}
                  {commandHistory.length > 0 && (
                    <div>
                      <h4 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                        Recent Commands
                      </h4>
                      <div style={{
                        background: 'var(--bg-secondary)',
                        borderRadius: '16px',
                        maxHeight: '180px',
                        overflow: 'auto',
                        border: '1px solid var(--border)'
                      }}>
                        {commandHistory.slice(0, 5).map((cmd, idx) => (
                          <div
                            key={cmd.timestamp}
                            style={{
                              padding: '14px 18px',
                              borderBottom: idx < Math.min(commandHistory.length, 5) - 1 ? '1px solid var(--border)' : 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                            }}
                          >
                            {cmd.matched ? (
                              <Check size={18} style={{ color: 'var(--success)' }} />
                            ) : (
                              <X size={18} style={{ color: 'var(--danger)' }} />
                            )}
                            <span style={{
                              fontSize: '1rem',
                              fontWeight: 500,
                              color: cmd.matched ? 'var(--text-primary)' : 'var(--text-muted)',
                            }}>
                              {cmd.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer - Main Action Button */}
            <div style={{
              padding: '20px',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
            }}>
              <button
                onClick={toggleListening}
                style={{
                  width: '100%',
                  padding: '18px',
                  borderRadius: '16px',
                  border: 'none',
                  background: isListening
                    ? 'var(--danger)'
                    : 'var(--accent-purple)',
                  color: 'white',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  boxShadow: isListening
                    ? '0 6px 20px rgba(220, 38, 38, 0.45)'
                    : '0 6px 20px var(--accent-purple-glow)',
                  transition: 'all 0.3s ease',
                }}
              >
                {isListening ? (
                  <>
                    <MicOff size={24} />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Mic size={24} />
                    Start Voice Control
                  </>
                )}
              </button>
              <p style={{
                margin: '12px 0 0',
                fontSize: '0.9rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
                fontWeight: 500
              }}>
                💡 Press <kbd style={{
                  padding: '3px 8px',
                  background: 'var(--bg-primary)',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  fontSize: '0.8rem',
                  fontWeight: 700
                }}>Alt + V</kbd> to toggle voice control
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        
        .voice-control-panel::-webkit-scrollbar {
          width: 6px;
        }
        
        .voice-control-panel::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .voice-control-panel::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 3px;
        }
        
        .voice-control-panel::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }
      `}</style>
    </>
  );
}
