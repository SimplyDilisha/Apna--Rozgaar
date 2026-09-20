import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, X, Send, Mic, MicOff, Volume2, VolumeX,
  Briefcase, FileText, HelpCircle, Accessibility, Sparkles,
  ChevronDown, User, Bot, Loader2, RefreshCw, Image as ImageIcon, Building2, Shield
} from 'lucide-react';
import { getAppContextImage, formatImageForDisplay } from './services/pexelsService';
import { getGroqResponse, isGroqConfigured } from './services/groqService';

// Chatbot responses database - job platform focused
const chatResponses = {
  greetings: [
    "Hello! 👋 I'm Asha, your friendly assistant at ApnaRozgaar. I'm here to help you find inclusive job opportunities. How can I assist you today?",
    "Welcome! 🌟 I'm Asha, and I'm excited to help you on your career journey. What would you like to know?",
    "Hi there! 💜 I'm here to make your job search easier and more accessible. Ask me anything!"
  ],
  profile: [
    "Creating your profile is easy! 📝\n\n1. Click 'My Profile' in the menu\n2. Fill in your skills and experience\n3. Optionally share accommodation needs (100% confidential)\n4. Get matched with suitable employers!\n\nYour information helps us find the perfect fit. Need help with any step?",
    "Your profile is your superpower! 💪 It helps employers understand your amazing skills. You can:\n• Add your work history\n• List certifications\n• Specify preferred work arrangements\n• Upload your resume\n\nAll accessibility info is optional and protected!"
  ],
  accommodations: [
    "Great question about accommodations! ♿\n\nWe work with employers who provide:\n• Screen reader compatible workstations\n• Flexible schedules\n• Remote work options\n• Physical accessibility features\n• Sign language interpreters\n• Assistive technology\n\nEach job listing clearly shows available accommodations!",
    "Workplace accommodations are legally protected! 🛡️\n\nPopular accommodations include:\n• Modified work hours\n• Ergonomic equipment\n• Quiet workspaces\n• Communication aids\n\nYou can filter jobs by specific accommodations you need."
  ],
  employers: [
    "For employers, we offer: 🏢\n\n• Access to talented, diverse candidates\n• Disability-confident hiring guidance\n• Accommodation planning support\n• Inclusive job posting tools\n\nVisit 'For Employers' to post inclusive opportunities!",
    "Inclusive hiring is smart business! 📊\n\nCompanies on our platform commit to:\n• Accessible workplaces\n• Equal opportunity hiring\n• Reasonable accommodations\n• Supportive culture\n\nWant to learn more about becoming an inclusive employer?"
  ],
  help: [
    "I'm here to help! 🤗 Here's what I can assist with:\n\n• 🔍 Finding accessible jobs\n• 📝 Building your profile\n• ♿ Understanding accommodations\n• 🏢 Employer information\n• 🌐 Navigating the platform\n\nJust ask me anything!",
    "Need assistance? I've got you! 💜\n\nTry asking about:\n• 'How do I find remote jobs?'\n• 'What accommodations are available?'\n• 'How do I apply for a job?'\n• 'Is my information private?'\n\nOr use the quick action buttons below!"
  ],
  privacy: [
    "Your privacy is our priority! 🔒\n\n• Disability information is OPTIONAL\n• Data is encrypted and secure\n• You control what employers see\n• We never share without consent\n• Compliant with privacy laws\n\nFeel safe sharing your story with us!",
    "We take privacy seriously! 🛡️\n\nYour accommodation needs are:\n• Only shared when YOU choose\n• Protected by encryption\n• Never used against you\n• Helpful for finding perfect matches\n\nYour journey, your control!"
  ],
  apply: [
    "Applying for jobs is simple! 📤\n\n1. Find a job you love\n2. Click 'Apply Now'\n3. Your profile auto-fills the form\n4. Add a cover letter (optional)\n5. Submit!\n\nYou can track all applications in 'My Profile'. Good luck! 🍀",
    "Ready to apply? Exciting! 🎉\n\nTips for success:\n• Customize your cover letter\n• Highlight relevant skills\n• Mention accommodation needs (if comfortable)\n• Follow up after a week\n\nYou've got this! 💪"
  ],
  default: [
    "That's an interesting question! 🤔 I'm still learning, but I'll do my best to help. Could you try rephrasing, or choose one of the quick actions below?",
    "Hmm, let me think about that! 💭 For the best assistance, try asking about jobs, profiles, accommodations, or how to use the platform. I'm here for you!",
    "I want to make sure I help you correctly! 🌟 Try asking about:\n• Finding jobs\n• Creating profiles\n• Accessibility features\n• Privacy concerns\n\nOr click a quick action button!"
  ],
  // Deaf/HoH specific responses
  deafHoH: [
    "Great question about Deaf/HoH support! 🤟\n\nWe're committed to Deaf accessibility:\n• Filter jobs by sign language support\n• Find employers with CART captioning\n• Text-based interview options\n• Video relay service (VRS) friendly\n\nCheck the 'Deaf/HoH Friendly' filter in job search!",
    "Our Deaf/HoH friendly features include: 🤟\n\n• BSL/ASL/ISL interpreter availability\n• Induction/hearing loop systems\n• Visual fire alarms at workplaces\n• Text relay support\n• Live captioning in meetings\n\nAll job listings show Deaf accessibility badges!"
  ],
  signLanguage: [
    "We support multiple sign languages! 🤟\n\n• British Sign Language (BSL)\n• American Sign Language (ASL)\n• Indian Sign Language (ISL)\n\nYou can specify your preferred sign language in your profile!",
    "Sign language support is important to us! 🤟\n\nMany employers offer:\n• Sign language interpreters for interviews\n• BSL/ASL/ISL trained colleagues\n• Video relay service for calls"
  ]
};

// Keywords for matching - Extended for Deaf/HoH
const keywordMap = {
  jobSearch: ['job', 'jobs', 'find', 'search', 'work', 'position', 'opportunity', 'career', 'employment', 'hiring', 'opening'],
  profile: ['profile', 'account', 'resume', 'cv', 'register', 'sign up', 'create', 'build'],
  accommodations: ['accommodation', 'accessible', 'accessibility', 'disability', 'wheelchair', 'blind', 'support', 'assistance', 'special needs', 'assistive'],
  employers: ['employer', 'company', 'business', 'hire', 'recruit', 'post job', 'organization'],
  help: ['help', 'how', 'what', 'guide', 'tutorial', 'explain', 'assist', 'support'],
  privacy: ['privacy', 'private', 'data', 'secure', 'security', 'confidential', 'share', 'protect'],
  apply: ['apply', 'application', 'submit', 'send', 'interested'],
  greetings: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'namaste', 'hola'],
  // Deaf/HoH keywords
  deafHoH: ['deaf', 'hoh', 'hard of hearing', 'hearing impair', 'hearing loss', 'tinnitus', 'cochlear', 'hearing aid'],
  signLanguage: ['sign language', 'bsl', 'asl', 'isl', 'signing', 'interpreter', 'sign', 'caption', 'cart']
};

// Detect category from user message
const detectCategory = (userMessage) => {
  const lowerMessage = userMessage.toLowerCase();

  for (const [category, keywords] of Object.entries(keywordMap)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      return category;
    }
  }

  return 'default';
};

const getResponse = async (userMessage) => {
  const category = detectCategory(userMessage);
  const responses = chatResponses[category];
  const text = responses[Math.floor(Math.random() * responses.length)];

  // Fetch related image from Pexels
  let image = null;
  try {
    const imageData = await getAppContextImage(category);
    if (imageData) {
      image = formatImageForDisplay(imageData);
    }
  } catch (error) {
    console.error('Error fetching image:', error);
  }

  return { text, image };
};

// Quick action buttons for accessibility and app context
const quickActions = [
  {
    label: 'Find Jobs',
    query: 'Can you help me find accessible jobs?',
    icon: Briefcase
  },
  {
    label: 'Build Profile',
    query: 'How do I create my profile?',
    icon: FileText
  },
  {
    label: 'Accommodations',
    query: 'What accommodations are available?',
    icon: Accessibility
  },
  {
    label: 'Top Companies',
    query: 'Which companies are leading in disability inclusion?',
    icon: Building2
  },
  {
    label: 'App Guide',
    query: 'How can I make my app more accessible for users?',
    icon: Sparkles
  },
  {
    label: 'Need Help?',
    query: 'Can you help me navigate the platform?',
    icon: HelpCircle
  }
];


const AccessibleChatbot = ({ isOpen: externalIsOpen, onOpenChange }) => {
  // Use external state if provided, otherwise manage internally
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: "Hello! 👋 I'm Asha, your friendly ApnaRozgaar assistant. I can help you find accessible jobs, build your profile, and navigate the platform. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setInputValue(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
    }

    synthesisRef.current = window.speechSynthesis;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check scroll position for scroll button
  const handleScroll = useCallback(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
    }
  }, []);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Text-to-speech function
  const speakText = useCallback((text) => {
    if (!voiceEnabled || !synthesisRef.current) return;
    
    // Cancel any ongoing speech
    synthesisRef.current.cancel();
    
    // Clean text (remove emojis for better speech)
    const cleanText = text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthesisRef.current.speak(utterance);
  }, [voiceEnabled]);

  // Toggle voice recognition
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please try Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInputValue('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Stop speaking
  const stopSpeaking = () => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  // Send message
  const sendMessage = async (text = inputValue) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: text.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Stop any ongoing speech
    stopSpeaking();

    // Simulate typing delay + wait for image fetch
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

    let responseText;
    let responseImage = null;

    // Try Groq API first, fallback to rule-based responses
    if (isGroqConfigured()) {
      try {
        const groqResponse = await getGroqResponse(text, messages.map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.text })));
        if (groqResponse) {
          responseText = groqResponse;
          // Optionally still fetch an image for the category detected
          const category = detectCategory(text);
          try {
            const imageData = await getAppContextImage(category);
            if (imageData) {
              responseImage = formatImageForDisplay(imageData);
            }
          } catch (e) { console.error('Image fetch error:', e); }
        } else {
          const fallback = await getResponse(text);
          responseText = fallback.text;
          responseImage = fallback.image;
        }
      } catch (error) {
        console.error('Groq error, using fallback:', error);
        const fallback = await getResponse(text);
        responseText = fallback.text;
        responseImage = fallback.image;
      }
    } else {
      const fallback = await getResponse(text);
      responseText = fallback.text;
      responseImage = fallback.image;
    }

    const botResponse = {
      id: Date.now() + 1,
      type: 'bot',
      text: responseText,
      image: responseImage,
      timestamp: new Date()
    };

    setIsTyping(false);
    setMessages(prev => [...prev, botResponse]);

    // Speak the response
    speakText(botResponse.text);
  };

  // Handle quick action
  const handleQuickAction = (query) => {
    sendMessage(query);
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Clear chat
  const clearChat = () => {
    setMessages([
      {
        id: Date.now(),
        type: 'bot',
        text: "Chat cleared! 🔄 I'm Asha, ready to help you again. What would you like to know?",
        timestamp: new Date()
      }
    ]);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close chat assistant' : 'Open chat assistant - Asha is here to help'}
        aria-expanded={isOpen}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--accent-purple)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px var(--accent-purple-glow)',
          zIndex: 1000
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{ 
          boxShadow: isOpen 
            ? '0 8px 32px var(--accent-purple-glow)' 
            : ['0 8px 32px var(--accent-purple-glow)', '0 8px 48px var(--accent-purple-glow)', '0 8px 32px var(--accent-purple-glow)']
        }}
        transition={{ 
          boxShadow: { duration: 2, repeat: Infinity },
          scale: { duration: 0.2 }
        }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X size={28} color="white" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <MessageCircle size={28} color="white" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Notification dot */}
        {!isOpen && (
          <motion.span
            style={{
              position: 'absolute',
              top: '0',
              right: '0',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: 'var(--success)',
              border: '2px solid white'
            }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-label="Chat with Asha, ApnaRozgaar Assistant"
            aria-modal="true"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed',
              bottom: '100px',
              right: '24px',
              width: '400px',
              maxWidth: 'calc(100vw - 48px)',
              height: '600px',
              maxHeight: 'calc(100vh - 140px)',
              borderRadius: '24px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 999,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px var(--border)'
            }}
            className="glass"
          >
            {/* Header */}
            <div style={{
              padding: '20px',
              background: 'var(--accent-purple)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  <Sparkles size={24} />
                  <span style={{
                    position: 'absolute',
                    bottom: '0',
                    right: '0',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#4ADE80',
                    border: '2px solid white'
                  }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Asha</h2>
                  <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>Your Accessibility Assistant</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                {/* Voice toggle */}
                <button
                  onClick={() => {
                    if (isSpeaking) stopSpeaking();
                    setVoiceEnabled(!voiceEnabled);
                  }}
                  aria-label={voiceEnabled ? 'Disable voice responses' : 'Enable voice responses'}
                  aria-pressed={voiceEnabled}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {voiceEnabled ? <Volume2 size={18} color="white" /> : <VolumeX size={18} color="white" />}
                </button>
                
                {/* Clear chat */}
                <button
                  onClick={clearChat}
                  aria-label="Clear chat history"
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <RefreshCw size={18} color="white" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={chatContainerRef}
              onScroll={handleScroll}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                background: 'var(--bg-primary)'
              }}
              role="log"
              aria-live="polite"
              aria-label="Chat messages"
            >
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'flex',
                    flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
                    gap: '12px',
                    alignItems: 'flex-start'
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: message.type === 'user'
                      ? 'var(--accent-teal)'
                      : 'var(--accent-purple)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {message.type === 'user'
                      ? <User size={18} color="white" />
                      : <Bot size={18} color="white" />
                    }
                  </div>

                  {/* Message bubble with image support */}
                  <div style={{
                    maxWidth: '75%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    {/* Image */}
                    {message.image && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                          borderRadius: '12px',
                          overflow: 'hidden',
                          boxShadow: 'var(--card-shadow)',
                          maxHeight: '240px'
                        }}
                      >
                        <img
                          src={message.image.url}
                          alt={message.image.alt}
                          title={message.image.alt}
                          style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block',
                            maxHeight: '240px',
                            objectFit: 'cover'
                          }}
                        />
                        {message.image.photographer && (
                          <div style={{
                            fontSize: '0.7rem',
                            padding: '4px 8px',
                            background: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            textAlign: 'center'
                          }}>
                            Photo by{' '}
                            <a
                              href={message.image.photographerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'white', textDecoration: 'underline' }}
                            >
                              {message.image.photographer}
                            </a>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Text message */}
                    <div style={{
                      padding: '14px 18px',
                      borderRadius: message.type === 'user'
                        ? '20px 20px 4px 20px'
                        : '20px 20px 20px 4px',
                      background: message.type === 'user'
                        ? 'var(--accent-purple)'
                        : 'var(--card-bg)',
                      color: message.type === 'user' ? 'white' : 'var(--text-primary)',
                      boxShadow: 'var(--card-shadow)',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.5,
                      fontSize: '0.95rem'
                    }}>
                      {message.text}

                      {/* Speak button for bot messages */}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start'
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--accent-purple)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Bot size={18} color="white" />
                  </div>
                  <div style={{
                    padding: '14px 18px',
                    borderRadius: '20px 20px 20px 4px',
                    background: 'var(--card-bg)',
                    boxShadow: 'var(--card-shadow)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-purple)' }}
                    />
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                      style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-purple)' }}
                    />
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                      style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-purple)' }}
                    />
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Scroll to bottom button */}
            <AnimatePresence>
              {showScrollButton && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={scrollToBottom}
                  aria-label="Scroll to latest message"
                  style={{
                    position: 'absolute',
                    bottom: '200px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: 'var(--card-shadow)'
                  }}
                >
                  <ChevronDown size={20} color="var(--accent-purple)" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Quick Actions */}
            <div style={{
              padding: '12px 20px',
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              background: 'var(--bg-secondary)',
              borderTop: '1px solid var(--border)'
            }}>
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.query)}
                  aria-label={action.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    minHeight: '36px'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--accent-purple)';
                    e.currentTarget.style.background = 'rgba(124, 58, 237, 0.05)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.background = 'var(--card-bg)';
                  }}
                >
                  <action.icon size={16} color="var(--accent-purple)" />
                  {action.label}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <div style={{
              padding: '16px 20px',
              background: 'var(--card-bg)',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}>
              {/* Voice input button */}
              <motion.button
                onClick={toggleListening}
                aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                aria-pressed={isListening}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: isListening ? 'var(--danger)' : 'var(--bg-secondary)',
                  border: isListening ? 'none' : '1px solid var(--border)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s'
                }}
              >
                {isListening ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    <MicOff size={22} color="white" />
                  </motion.div>
                ) : (
                  <Mic size={22} color="var(--accent-purple)" />
                )}
              </motion.button>

              {/* Text input */}
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isListening ? 'Listening...' : 'Type your message or speak...'}
                  aria-label="Type your message"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    paddingRight: '50px',
                    border: '1px solid var(--border)',
                    borderRadius: '24px',
                    background: 'var(--bg-primary)',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  disabled={isListening}
                />
                
                {/* Send button */}
                <motion.button
                  onClick={() => sendMessage()}
                  aria-label="Send message"
                  disabled={!inputValue.trim() || isTyping}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: inputValue.trim() ? 'var(--primary-gradient)' : 'var(--bg-secondary)',
                    border: 'none',
                    cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: inputValue.trim() ? 1 : 0.5,
                    transition: 'all 0.2s'
                  }}
                >
                  {isTyping ? (
                    <Loader2 size={18} color={inputValue.trim() ? 'white' : 'var(--text-muted)'} className="animate-spin" />
                  ) : (
                    <Send size={18} color={inputValue.trim() ? 'white' : 'var(--text-muted)'} />
                  )}
                </motion.button>
              </div>
            </div>

            {/* Privacy Badge */}
            <div style={{
              padding: '8px 20px 12px',
              background: 'var(--card-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              color: 'var(--text-muted)'
            }}>
              <Shield size={14} color="var(--success)" />
              <span>End-to-End Encrypted. Your data is never used for AI training.</span>
            </div>

            {/* Speaking indicator */}
            <AnimatePresence>
              {isSpeaking && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  style={{
                    position: 'absolute',
                    bottom: '160px',
                    left: '20px',
                    right: '20px',
                    padding: '10px 16px',
                    background: 'var(--accent-purple)',
                    color: 'white',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.9rem'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Volume2 size={18} />
                    Asha is speaking...
                  </span>
                  <button
                    onClick={stopSpeaking}
                    aria-label="Stop speaking"
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 12px',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    Stop
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AccessibleChatbot;
