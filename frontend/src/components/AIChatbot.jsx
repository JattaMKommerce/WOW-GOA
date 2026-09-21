import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Send, Mic, Volume2, VolumeX, Sparkles, AlertCircle, 
  Compass, Hotel, Car, Users, Calendar, ArrowRight, CheckCircle2 
} from 'lucide-react';
import chatbotAvatar from '../assets/aichatbot.webp';
import chatbotAnimationVideo from '../assets/chatbot-animation.mp4';
import { chatWithAI, createAiLead, updateAiLeadChat, getAIChatbotSettings } from '../services/api';

const aiMessages = [
  "Plan Your Goa Trip",
  "Need Help? Ask Sophia",
  "Let’s Explore Goa",
  "Welcome to Goa! 🌴"
];

const CRAFT_SUGGESTIONS = [
  'Plan trip for 4 people',
  'I want an SUV',
  '5-star beach resort',
  'Include Scuba Diving'
];

const DEFAULT_SUGGESTIONS = [
  'Craft My Trip with AI 🤖',
  'Self Drive Packages',
  'Rent a Thar',
  'Best beaches in North Goa'
];

export default function AIChatbot() {
  const [isChatbotEnabled, setIsChatbotEnabled] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [leadId, setLeadId] = useState(null);
  const [aiLeadId, setAiLeadId] = useState(null);
  const [activeContext, setActiveContext] = useState(null);
  const [activeProposal, setActiveProposal] = useState(null);
  const [showConfirmReplace, setShowConfirmReplace] = useState(false);
  const [chatMode, setChatMode] = useState('normal');

  const avatarVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const chatBodyRef = useRef(null);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadError, setLeadError] = useState('');

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const recognitionRef = useRef(null);
  const lastSpokenMsgRef = useRef(null);
  const activeUtteranceRef = useRef(null);
  const isStartingMicRef = useRef(false);
  const pendingVoiceTranscriptRef = useRef(null);
  const [availableVoices, setAvailableVoices] = useState([]);

  const SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

  // Auto pre-fill customer details from session
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('currentUser') || localStorage.getItem('customerUser');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u && (u.name || u.customer_name)) {
          setLeadName(u.name || u.customer_name);
        }
        if (u && (u.phone || u.customer_phone)) {
          setLeadPhone(u.phone || u.customer_phone);
        }
      }
    } catch (e) {}
  }, []);

  // Listen to open_ai_chat event (including Craft My Trip mode)
  useEffect(() => {
    const handleOpenAIChat = (e) => {
      setIsOpen(true);
      const isCraftMode = e?.detail?.mode === 'craft_my_trip';
      if (isCraftMode) {
        setChatMode('craft_my_trip');
        setActiveContext(prev => ({ ...(prev || {}), mode: 'craft_my_trip' }));
        // Add personalized Craft My Trip welcome message if chat is currently empty
        setMessages(prev => {
          if (prev.length === 0) {
            return [{
              role: 'assistant',
              content: "Hi! I'm **Sophia** 🌴 Let's craft your dream Goa trip together!\n\nHow many people are traveling, and what are your dates or preferences? (For example: *4 people from Oct 25 to Oct 28 with an SUV and beach resort*)"
            }];
          }
          return prev;
        });
      }
    };
    window.addEventListener('open_ai_chat', handleOpenAIChat);
    return () => window.removeEventListener('open_ai_chat', handleOpenAIChat);
  }, []);

  // Listen to sophia_nav event — navigates to a specific tab (bikes, cars, hotels) when user clicks a booking link in chat
  useEffect(() => {
    const handleSophiaNav = (e) => {
      const tab = e?.detail?.tab;
      const itemId = e?.detail?.itemId;
      const itemType = e?.detail?.itemType;
      const itemName = e?.detail?.itemName ? decodeURIComponent(e.detail.itemName) : '';
      if (tab) {
        // Close chatbot
        setIsOpen(false);
        // Fire navigation event to App.jsx to switch tab and open the requested item
        window.dispatchEvent(new CustomEvent('sophia_switch_tab', { 
          detail: { tab, itemId, itemType, itemName } 
        }));
      }
    };
    window.addEventListener('sophia_nav', handleSophiaNav);
    return () => window.removeEventListener('sophia_nav', handleSophiaNav);
  }, []);

  // Listen to sophia_send_msg event — fired when customer clicks in-chat action buttons like [Get Price for My Dates]
  useEffect(() => {
    const handleSophiaSendMsg = (e) => {
      const text = e?.detail?.text;
      if (text) {
        handleSendMessage(null, text);
      }
    };
    window.addEventListener('sophia_send_msg', handleSophiaSendMsg);
    return () => window.removeEventListener('sophia_send_msg', handleSophiaSendMsg);
  }, [messages, activeContext, isLoading]);

  // Sync AI Chatbot enabled state from database
  useEffect(() => {
    let isMounted = true;
    getAIChatbotSettings()
      .then(res => {
        if (isMounted && res && typeof res.ai_chatbot_enabled !== 'undefined') {
          setIsChatbotEnabled(Boolean(res.ai_chatbot_enabled));
        }
      })
      .catch(() => {});

    const handleToggleEvent = (e) => {
      if (e?.detail && typeof e.detail.enabled !== 'undefined') {
        setIsChatbotEnabled(Boolean(e.detail.enabled));
      }
    };
    window.addEventListener('ai_chatbot_toggled', handleToggleEvent);
    return () => {
      isMounted = false;
      window.removeEventListener('ai_chatbot_toggled', handleToggleEvent);
    };
  }, []);

  // Load available browser voices for TTS
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) setAvailableVoices(v);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Real-time canvas processing to strip black background into true transparency
  useEffect(() => {
    const video = avatarVideoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let animId;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const renderCurrentFrame = () => {
      if (video.readyState >= 2) {
        if (video.videoWidth && canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = frame.data;
        const l = data.length / 4;
        const cw = canvas.width;
        const ch = canvas.height;

        for (let i = 0; i < l; i++) {
          const idx = i * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const px = i % cw;
          const py = (i / cw) | 0;

          if (px < cw * 0.055 || px > cw * 0.93 || py < ch * 0.04 || (px > cw * 0.77 && py > ch * 0.64)) {
            data[idx + 3] = 0;
            continue;
          }

          const normX = px / cw;
          const normY = py / ch;
          const isEyeZone = (normY >= 0.20 && normY <= 0.42 && normX >= 0.43 && normX <= 0.59);

          if (isEyeZone) {
            data[idx + 3] = 255;
          } else {
            const maxChannel = Math.max(r, g, b);
            if (maxChannel < 28) {
              data[idx + 3] = 0;
            } else if (maxChannel < 45) {
              data[idx + 3] = Math.floor(((maxChannel - 28) / 17) * 255);
            }
          }
        }
        ctx.putImageData(frame, 0, 0);
      }
    };

    const drawFrame = () => {
      renderCurrentFrame();
      animId = requestAnimationFrame(drawFrame);
    };

    const handleImmediateRedraw = () => {
      renderCurrentFrame();
    };

    video.addEventListener('play', handleImmediateRedraw);
    video.addEventListener('seeking', handleImmediateRedraw);
    video.addEventListener('seeked', handleImmediateRedraw);
    video.addEventListener('timeupdate', handleImmediateRedraw);
    video.addEventListener('loadeddata', handleImmediateRedraw);

    video.play().catch(() => {});
    animId = requestAnimationFrame(drawFrame);

    return () => {
      cancelAnimationFrame(animId);
      video.removeEventListener('play', handleImmediateRedraw);
      video.removeEventListener('seeking', handleImmediateRedraw);
      video.removeEventListener('seeked', handleImmediateRedraw);
      video.removeEventListener('timeupdate', handleImmediateRedraw);
      video.removeEventListener('loadeddata', handleImmediateRedraw);
    };
  }, []);

  // Cycling speech pill text every 4 seconds
  useEffect(() => {
    if (isOpen) return;
    const intervalId = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMsgIndex((prev) => (prev + 1) % aiMessages.length);
        setFade(true);
      }, 500);
    }, 4000);
    return () => clearInterval(intervalId);
  }, [isOpen]);

  // Scroll to bottom when messages or proposal change
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, activeProposal]);

  // Initial welcome message if chat opened fresh
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greetingName = leadName ? ` ${leadName}` : '';
      setMessages([{
        role: 'assistant',
        content: `Hello${greetingName}! 👋 I’m **Sophia**, your AI Travel Expert for Goa. How can I help you explore Goa or craft your trip today?`
      }]);
    }
  }, [isOpen, leadName]);

  // Tiered Natural Female Voice Selection
  const getBestFemaleEnglishVoice = (voices) => {
    if (!voices || voices.length === 0) return null;
    const isEnglish = (v) => (v.lang || '').toLowerCase().startsWith('en');
    const isIndian = (v) => (v.lang || '').toLowerCase().includes('in') || (v.name || '').toLowerCase().includes('india');
    const isFemale = (v) => {
      const n = (v.name || '').toLowerCase();
      if (/\b(male|david|mark|george|ravi|guy)\b/i.test(n)) return false;
      return /\b(female|heera|neerja|veena|aditi|priya|sonia|libby|jenny|samantha|victoria|karen|serena|zira|fiona|ava)\b/i.test(n);
    };

    const enVoices = voices.filter(isEnglish);
    const tier1 = enVoices.find(v => isIndian(v) && isFemale(v));
    if (tier1) return tier1;
    const tier2 = enVoices.find(isFemale);
    if (tier2) return tier2;
    return enVoices[0] || voices[0];
  };

  const cleanTextForSpeech = (text) => {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/•/g, '')
      .replace(/[*_~`#]/g, '')
      .replace(/\n+/g, '. ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };

  const speakText = (rawText) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    const clean = cleanTextForSpeech(rawText);
    if (!clean) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(clean);
      activeUtteranceRef.current = utterance;
      utterance.lang = 'en-IN';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      const voicesToUse = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
      const best = getBestFemaleEnglishVoice(voicesToUse);
      if (best) utterance.voice = best;

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
    }
  };

  // Speak latest assistant reply
  useEffect(() => {
    if (!isOpen || isMuted || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant') {
      speakText(lastMsg.content);
    }
  }, [messages, isOpen, isMuted]);

  // Cancel speech on close
  useEffect(() => {
    if (!isOpen) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      stopListening();
    }
  }, [isOpen]);

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      if (next && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
  };

  // Voice Input (Speech-to-Text)
  const startListening = () => {
    if (!SpeechRecognition) {
      setVoiceError("Voice input is not supported in this browser. Please type your message.");
      setTimeout(() => setVoiceError(null), 4000);
      return;
    }
    if (isListening) {
      stopListening();
      return;
    }
    if (isStartingMicRef.current) return;

    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setVoiceError(null);

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      recognitionRef.current = null;
    }

    try {
      isStartingMicRef.current = true;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        isStartingMicRef.current = false;
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        isStartingMicRef.current = false;
        setIsListening(false);
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript && transcript.trim()) {
          handleSendMessage(null, transcript.trim());
        }
      };

      recognition.onerror = (event) => {
        isStartingMicRef.current = false;
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setVoiceError("Microphone access denied. Please check browser permissions.");
        } else if (event.error !== 'no-speech') {
          setVoiceError("Could not capture speech. Please try speaking again.");
        }
        setTimeout(() => setVoiceError(null), 4000);
      };

      recognition.onend = () => {
        isStartingMicRef.current = false;
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      isStartingMicRef.current = false;
      setIsListening(false);
    }
  };

  const stopListening = () => {
    isStartingMicRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  // Lead Submission
  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    setLeadError('');
    const cleanName = (leadName || '').trim();
    let cleanPhone = (leadPhone || '').replace(/\D/g, '');
    if (cleanPhone.length > 10) cleanPhone = cleanPhone.slice(-10);

    if (!cleanName) {
      setLeadError('Please enter your name.');
      return;
    }
    if (!/^\d{10}$/.test(cleanPhone)) {
      setLeadError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLeadName(cleanName);
    setLeadPhone(cleanPhone);
    setShowLeadForm(false);

    try {
      const res = await createAiLead(cleanName, cleanPhone);
      if (res && res.success) {
        if (res.lead_id) setLeadId(res.lead_id);
        else if (res.id) setLeadId(res.id);
        if (res.id) setAiLeadId(res.id);
      }
    } catch (err) {
      console.error('Lead submit failed:', err);
    }

    const preTyped = input ? input.trim() : '';
    if (preTyped) {
      handleSendMessage(null, preTyped);
    } else {
      setMessages([{
        role: 'assistant',
        content: `Hello ${cleanName}! 👋 I’m **Sophia**, your AI Travel Expert for Goa. How can I help you today?`
      }]);
    }
  };

  // Message Handler
  const handleSendMessage = async (e, directText = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const textToSend = typeof directText === 'string' ? directText : input;
    if (!textToSend.trim() || isLoading) return;

    stopListening();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    // Check if user clicked "Craft My Trip with AI 🤖" suggestion
    if (textToSend.includes('Craft My Trip with AI') || textToSend.toLowerCase().includes('craft my trip')) {
      setActiveContext(prev => ({ ...(prev || {}), mode: 'craft_my_trip' }));
    }

    // Direct vehicle booking click from suggestion chip: "Book [Name] →"
    if (textToSend.startsWith('Book ') && textToSend.endsWith('→') && activeContext?.active_item_id) {
      const tab = activeContext.active_item_type === 'car' ? 'cars' : (activeContext.active_item_type === 'hotel' ? 'hotels' : (activeContext.active_item_type === 'activity' ? 'activities' : 'bikes'));
      setIsOpen(false);
      window.dispatchEvent(new CustomEvent('sophia_switch_tab', {
        detail: {
          tab,
          itemId: String(activeContext.active_item_id),
          itemType: activeContext.active_item_type,
          itemName: activeContext.active_item_name
        }
      }));
      return;
    }

    // Direct confirm and book from suggestion chip
    if (textToSend.startsWith('Confirm & Book') && activeContext?.booking_preview) {
      const bp = activeContext.booking_preview;
      const tab = bp.item_type === 'car' ? 'cars' : (bp.item_type === 'hotel' ? 'hotels' : (bp.item_type === 'activity' ? 'activities' : 'bikes'));
      setIsOpen(false);
      window.dispatchEvent(new CustomEvent('sophia_switch_tab', {
        detail: {
          tab,
          itemId: String(bp.item_id),
          itemType: bp.item_type,
          itemName: bp.item_name
        }
      }));
      return;
    }

    const userMsg = { role: 'user', content: textToSend.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    if (leadId) {
      updateAiLeadChat(leadId, newMessages, aiLeadId).catch(() => {});
    }

    try {
      const aiRes = await chatWithAI(newMessages, activeContext);
      const replyText = typeof aiRes === 'string' ? aiRes : (aiRes?.reply || '');

      if (aiRes && aiRes.context) {
        // Always preserve the last known craft_proposal in context so backend can rebuild it on next turn
        const incomingProposal = aiRes.craft_proposal || aiRes.context?.craft_proposal || activeContext?.craft_proposal;
        setActiveContext({ ...aiRes.context, craft_proposal: incomingProposal });
      }

      // Show review card only when backend returns a real proposal (after car/hotel/activity selection)
      // When browsing options (craft_proposal is null), hide the card to keep UI clean
      if (aiRes && aiRes.craft_proposal) {
        setActiveProposal(aiRes.craft_proposal);
      } else {
        setActiveProposal(null);
      }

      const updatedMessages = [...newMessages, { role: 'assistant', content: replyText }];
      setMessages(updatedMessages);

      if (leadId) {
        updateAiLeadChat(leadId, updatedMessages, aiLeadId).catch(() => {});
      }
    } catch (err) {
      const errorMessages = [...newMessages, { 
        role: 'assistant', 
        content: "I'm having trouble connecting to my system right now. Please try again in a moment!" 
      }];
      setMessages(errorMessages);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── DRAFT HANDOFF: REVIEW TRIP IN BUILDER ─────────────────────────────────
  const handleReviewTripInBuilder = () => {
    if (!activeProposal) return;

    // Rule 9: Manual Draft Protection
    try {
      const existingDraftStr = sessionStorage.getItem('tg_craft_draft');
      if (existingDraftStr) {
        const d = JSON.parse(existingDraftStr);
        const hasExistingPlan = Boolean(d.selectedVehicle || d.selectedHotel || (d.selectedActivities && d.selectedActivities.length > 0) || d.selectedFlight);
        if (hasExistingPlan) {
          setShowConfirmReplace(true);
          return;
        }
      }
    } catch (e) {}

    executeDraftHandoff(activeProposal);
  };

  const executeDraftHandoff = (proposal) => {
    // Write validated proposal to sessionStorage.tg_craft_draft matching exact state contract
    const craftDraft = {
      step: 5,
      selectedVehicle: proposal.vehicle || null,
      memberCount: proposal.memberCount || 1,
      selectedHotel: proposal.hotel || null,
      selectedActivities: proposal.activities || [],
      withFlight: false,
      selectedFlight: null,
      pickupDate: proposal.pickup_date,
      dropDate: proposal.drop_date
    };

    try {
      sessionStorage.setItem('tg_craft_draft', JSON.stringify(craftDraft));
    } catch (e) {}

    // Dispatch craft_draft_updated event for instant Step 5 hydration
    window.dispatchEvent(new CustomEvent('craft_draft_updated', { detail: craftDraft }));

    setIsOpen(false);
    setShowConfirmReplace(false);

    // If not already on /craft route, navigate smoothly
    if (!window.location.pathname.startsWith('/craft')) {
      window.history.pushState(null, '', '/craft');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleKeepCurrentTrip = () => {
    setShowConfirmReplace(false);
    setIsOpen(false);
    if (!window.location.pathname.startsWith('/craft')) {
      window.history.pushState(null, '', '/craft');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const isCraftModeActive = activeContext?.mode === 'craft_my_trip' || Boolean(activeProposal) || Boolean(activeContext?.craft_proposal);
  let suggestions = DEFAULT_SUGGESTIONS;
  if (isCraftModeActive) {
    const lastMsg = messages[messages.length - 1]?.content || '';
    if (lastMsg.includes('category of car') || lastMsg.includes('available vehicles') || lastMsg.includes('Luxury Cars & Premium') || lastMsg.includes('SUVs & 4x4') || lastMsg.includes('7-Seater')) {
      // Browsing car categories — show category chips
      if (lastMsg.includes('Luxury Cars & Premium') || lastMsg.includes('DEFENDAR')) {
        suggestions = ['DEFENDAR', 'Toyota Fortuner'];
      } else if (lastMsg.includes('SUVs & 4x4') || lastMsg.includes('Mahindra Thar')) {
        suggestions = ['Mahindra Thar', 'Hyundai Creta'];
      } else if (lastMsg.includes('7-Seater') || lastMsg.includes('Ertiga')) {
        suggestions = ['Maruti Suzuki Ertiga'];
      } else {
        suggestions = ['💎 Luxury Cars', '🚙 SUVs / Thar', '🚐 7-Seater Ertiga', '🚗 Swift'];
      }
    } else if (lastMsg.includes('category of stay') || lastMsg.includes('star rating') || lastMsg.includes('5-Star Luxury') || lastMsg.includes('4-Star Beachfront') || lastMsg.includes('3-Star')) {
      // Browsing hotel star categories
      if (lastMsg.includes('5-Star Luxury') || lastMsg.includes('Taj Exotica')) {
        suggestions = ['Taj Exotica Resort & Spa'];
      } else if (lastMsg.includes('4-Star Beachfront') || lastMsg.includes('Candolim')) {
        suggestions = ['The Grand Candolim'];
      } else if (lastMsg.includes('3-Star') || lastMsg.includes('Casa Baga')) {
        suggestions = ['Casa Baga Boutique Resort'];
      } else {
        suggestions = ['5-Star Luxury', '4-Star Beachfront', '3-Star Budget'];
      }
    } else if (lastMsg.includes('experiences would you like') || lastMsg.includes('options by category') || lastMsg.includes('Water Sports') || lastMsg.includes('Heritage Tours')) {
      // Browsing activities
      suggestions = ['🤿 Scuba Diving', '🪂 Parasailing', '🏛️ Heritage Tour', '🏖️ North Goa Tour'];
    } else if (activeProposal) {
      // Proposal card is showing — offer modification options
      suggestions = ['Change the car', 'Change hotel', 'Change activities', 'Review My Trip'];
    } else if (activeContext?.craft_proposal) {
      // No card showing but we have a proposal in context (browsing mode) — keep modification chips
      suggestions = ['Change the car', 'Change hotel', 'Change activities'];
    } else {
      suggestions = CRAFT_SUGGESTIONS;
    }
  } else {
    // Normal mode: dynamic chips for active item
    if (activeContext?.booking_preview) {
      suggestions = ['Confirm & Book →', 'Change dates', 'Browse Bikes', 'Browse Cars'];
    } else if (activeContext?.active_item_name && (activeContext.active_item_type === 'bike' || activeContext.active_item_type === 'car')) {
      suggestions = [`Book ${activeContext.active_item_name} →`, 'Get Price for My Dates', 'Browse Bikes', 'Browse Cars'];
    }
  }

  if (!isChatbotEnabled) return null;

  return (
    <>
      {/* ─── FLOATING AI ASSISTANT ROBOT TRIGGER ──────────────────────── */}
      <video
        ref={avatarVideoRef}
        src={chatbotAnimationVideo}
        id="ai-hidden-video"
        autoPlay
        loop
        muted
        playsInline
        style={{ display: 'none' }}
      />

      <div
        onClick={() => setIsOpen(true)}
        role="button"
        tabIndex={0}
        aria-label="Open Sophia AI Assistant"
        className={`sophia-floating-trigger ai-floating-trigger ${isOpen ? 'is-hidden' : 'is-visible'}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
      >
        {/* Left Speech Bubble / Pill Badge */}
        <div className="sophia-speech-pill ai-speech-pill">
          <span className="sophia-status-dot ai-status-indicator" />
          <span
            className="sophia-speech-text"
            style={{
              color: '#0f172a',
              fontWeight: 700,
              fontSize: '15px',
              opacity: fade ? 1 : 0,
              transition: 'opacity 0.35s ease-in-out',
              whiteSpace: 'nowrap'
            }}
          >
            {aiMessages[msgIndex]}
          </span>
        </div>

        {/* Floating Robot Avatar Wrapper with Centered Round Aura & Canvas */}
        <div className="sophia-avatar-wrapper ai-avatar-wrapper">
          <canvas
            ref={canvasRef}
            id="ai-avatar-canvas"
            width="1280"
            height="720"
          />
        </div>
      </div>

      <style>{`
        /* 1. Main Floating Trigger Container */
        .sophia-floating-trigger,
        .ai-floating-trigger {
          position: fixed;
          bottom: 12px;
          right: -6px;
          z-index: 1045;
          display: flex;
          align-items: center;
          cursor: pointer;
          user-select: none;
          background: transparent !important;
          -webkit-tap-highlight-color: transparent;
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
        }
        .sophia-floating-trigger.is-hidden,
        .ai-floating-trigger.is-hidden {
          transform: scale(0);
          opacity: 0;
          pointer-events: none;
        }
        .sophia-floating-trigger.is-visible,
        .ai-floating-trigger.is-visible {
          transform: scale(1);
          opacity: 1;
          pointer-events: auto;
        }
        .sophia-floating-trigger:hover,
        .ai-floating-trigger:hover {
          transform: scale(1.03);
        }
        .sophia-floating-trigger:active,
        .ai-floating-trigger:active {
          transform: scale(0.97);
        }

        /* 2. Overlapping Speech Pill Badge */
        .sophia-speech-pill,
        .ai-speech-pill {
          position: relative;
          z-index: 1;
          margin-right: -32px;
          padding: 11px 24px;
          background: #ffffff;
          border: 1.5px solid rgba(0, 168, 255, 0.25);
          box-shadow: 0 10px 25px rgba(0, 140, 255, 0.12), 0 4px 6px rgba(0, 0, 0, 0.03);
          border-radius: 9999px;
          color: #0f172a !important;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 15.5px;
          font-weight: 700;
          letter-spacing: -0.2px;
          display: flex;
          align-items: center;
          gap: 10px;
          white-space: nowrap;
          transition: all 0.3s ease;
          animation: sophiaPillFloat 3.8s ease-in-out infinite;
        }
        @keyframes sophiaPillFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        .sophia-speech-text {
          color: #0f172a !important;
          font-weight: 700 !important;
          font-size: 15.5px !important;
          letter-spacing: -0.2px;
        }
        .sophia-floating-trigger:hover .sophia-speech-pill,
        .ai-floating-trigger:hover .sophia-speech-pill {
          box-shadow: 0 14px 30px rgba(0, 140, 255, 0.2), 0 6px 10px rgba(0, 0, 0, 0.05);
          border-color: rgba(0, 168, 255, 0.4);
        }

        /* 3. Glowing Green Status Indicator Dot */
        .sophia-status-dot,
        .ai-status-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6);
          animation: dot-pulse 2s infinite;
          flex-shrink: 0;
        }
        @keyframes dot-pulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
          70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        /* 4. Large Avatar Container */
        .sophia-avatar-wrapper,
        .ai-avatar-wrapper {
          position: relative;
          z-index: 10;
          width: 210px;
          height: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: visible !important;
          background: transparent !important;
          border: none !important;
          animation: sophiaAntiGravityFloat 3.8s ease-in-out infinite;
        }
        @keyframes sophiaAntiGravityFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        /* Centered Blue Aura Glow behind character */
        .sophia-avatar-wrapper::before,
        .ai-avatar-wrapper::before {
          content: '';
          position: absolute;
          top: 52%;
          left: 51%;
          transform: translate(-50%, -50%);
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 195, 255, 0.45) 0%, rgba(0, 140, 255, 0.12) 55%, transparent 75%);
          filter: blur(22px);
          z-index: 0;
          pointer-events: none;
        }

        /* 5. Canvas Display Resolution */
        #ai-avatar-canvas {
          -webkit-mask-image: linear-gradient(to bottom, black 72%, rgba(0, 0, 0, 0.85) 86%, transparent 100%);
          mask-image: linear-gradient(to bottom, black 72%, rgba(0, 0, 0, 0.85) 86%, transparent 100%);
          width: 210px;
          height: auto;
          z-index: 10;
          position: relative;
          pointer-events: none;
          display: block;
        }

        @keyframes typing {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        @keyframes mic-pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1.15); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .listening-pulse {
          animation: mic-pulse 1.4s infinite;
        }

        .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

        /* Mobile Responsiveness */
        @media (max-width: 600px) {
          .sophia-floating-trigger,
          .ai-floating-trigger {
            bottom: 8px;
            right: -8px;
          }
          .sophia-speech-pill,
          .ai-speech-pill {
            font-size: 13px;
            padding: 8px 16px;
            margin-right: -22px;
          }
          .sophia-avatar-wrapper,
          .ai-avatar-wrapper {
            width: 145px;
          }
          #ai-avatar-canvas {
            width: 145px;
          }
          .sophia-avatar-wrapper::before,
          .ai-avatar-wrapper::before {
            width: 140px;
            height: 140px;
          }
        }
      `}</style>

      {/* ─── CHATBOT WINDOW ───────────────────────────────────────────── */}
      <div 
        className="position-fixed shadow-2xl rounded-4 overflow-hidden transition-all bg-white d-flex flex-column"
        style={{
          bottom: isOpen ? '24px' : '-660px',
          right: '24px',
          width: '400px',
          height: '630px',
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100vh - 48px)',
          zIndex: 1050,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'all' : 'none',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.08)',
          borderRadius: '24px',
        }}
      >
        {/* Header */}
        <div 
          className="d-flex align-items-center justify-content-between p-3" 
          style={{ 
            background: 'linear-gradient(135deg, #FF6B35, #FF9F1C)', 
            color: 'white',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px'
          }}
        >
          <div className="d-flex align-items-center gap-2.5">
            <div className="rounded-circle bg-white d-flex align-items-center justify-content-center shadow-sm overflow-hidden" style={{ width: '40px', height: '40px' }}>
              <img src={chatbotAvatar} alt="Sophia AI" style={{ width: '92%', height: '92%', objectFit: 'contain' }} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-1.5">
                <h6 className="mb-0 fw-bold text-white" style={{ fontSize: '15px' }}>Sophia</h6>
                <span className="badge bg-white text-dark rounded-pill px-2 py-0.5" style={{ fontSize: '10px', fontWeight: 700 }}>AI Expert</span>
              </div>
              <small style={{ opacity: 0.95, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }}></span>
                Online | WOW GOA Assistant
              </small>
            </div>
          </div>
          <div className="d-flex align-items-center gap-1.5">
            <button 
              type="button"
              onClick={toggleMute} 
              title={isMuted ? "Unmute Sophia's Voice" : "Mute Sophia's Voice"}
              className="btn btn-sm p-0 rounded-circle d-flex align-items-center justify-content-center" 
              style={{ width: '32px', height: '32px', background: isMuted ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)', color: 'white', border: 'none', backdropFilter: 'blur(4px)', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <button 
              type="button"
              onClick={() => setIsOpen(false)} 
              aria-label="Close Chat"
              className="btn btn-sm p-0 rounded-circle d-flex align-items-center justify-content-center" 
              style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.25)', color: 'white', border: 'none', backdropFilter: 'blur(4px)', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Dual Mode Switcher Tabs */}
        <div className="d-flex align-items-center justify-content-between px-3 py-1.5 bg-white border-bottom shadow-2xs" style={{ zIndex: 5 }}>
          <div className="d-flex align-items-center gap-1.5 w-100">
            <button
              type="button"
              id="btn-chat-mode-general"
              onClick={() => {
                setChatMode('normal');
                setActiveContext(prev => ({ ...(prev || {}), mode: 'normal' }));
              }}
              className={`btn btn-sm flex-grow-1 rounded-pill py-1 fw-bold transition-all ${chatMode === 'normal' ? 'bg-dark text-white shadow-xs' : 'text-secondary bg-light'}`}
              style={{ fontSize: '11px', border: 'none' }}
            >
              💬 Ask Questions
            </button>
            <button
              type="button"
              id="btn-chat-mode-craft"
              onClick={() => {
                setChatMode('craft_my_trip');
                setActiveContext(prev => ({ ...(prev || {}), mode: 'craft_my_trip' }));
                if (messages.length === 0) {
                  setMessages([{
                    role: 'assistant',
                    content: "Hi! I'm **Sophia** 🌴 Let's craft your dream Goa trip together!\n\nHow many people are traveling, and what are your dates or preferences? (For example: *4 people from Oct 25 to Oct 28 with an SUV and beach resort*)"
                  }]);
                }
              }}
              className={`btn btn-sm flex-grow-1 rounded-pill py-1 fw-bold transition-all ${chatMode === 'craft_my_trip' ? 'text-white shadow-xs' : 'text-secondary bg-light'}`}
              style={{
                fontSize: '11px',
                background: chatMode === 'craft_my_trip' ? 'linear-gradient(135deg, #FF6B35, #FF9F1C)' : '',
                border: 'none'
              }}
            >
              🌴 Plan Trip with AI 🤖
            </button>
          </div>
        </div>

        {/* ─── SINGLE SOPHIA: Native chat for all modes ─── */}
        <>
            {/* Chat Body */}
            <div ref={chatBodyRef} className="flex-grow-1 p-3 overflow-auto" style={{ background: '#f8fafc', position: 'relative' }}>
              {showLeadForm ? (
                <div className="d-flex align-items-center justify-content-center h-100 position-absolute top-0 start-0 w-100" style={{ background: 'rgba(255, 255, 255, 0.96)', backdropFilter: 'blur(5px)', zIndex: 10 }}>
                  <div className="bg-white p-4 rounded-4 border shadow-sm w-85 text-center">
                    <h5 className="fw-bold text-dark mb-1">Welcome to Goa! 🌴</h5>
                    <p className="text-muted small mb-3" style={{ fontSize: '12.5px' }}>Enter your details to chat with Sophia, our AI travel specialist.</p>
                    <form onSubmit={handleLeadSubmit}>
                      <input 
                        type="text" 
                        className="form-control form-control-sm mb-2" 
                        placeholder="Your Name" 
                        value={leadName} 
                        onChange={e => { setLeadName(e.target.value); if (leadError) setLeadError(''); }} 
                        required 
                      />
                      <input 
                        type="tel" 
                        className="form-control form-control-sm mb-2" 
                        placeholder="10-digit Mobile Number" 
                        maxLength={10}
                        value={leadPhone} 
                        onChange={e => { 
                          setLeadPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); 
                          if (leadError) setLeadError(''); 
                        }} 
                        required 
                      />
                      {leadError && (
                        <div className="alert alert-danger py-1 px-2 mb-2 d-flex align-items-center gap-1 border-0 shadow-sm text-start" style={{ fontSize: '11px', background: '#fef2f2', color: '#b91c1c' }}>
                          <AlertCircle size={14} className="flex-shrink-0" />
                          <span>{leadError}</span>
                        </div>
                      )}
                      <button 
                        type="submit" 
                        className="btn w-100 rounded-pill fw-bold text-white shadow-sm mt-2 py-2"
                        style={{ background: 'linear-gradient(135deg, #FF6B35, #FF9F1C)', border: 'none', fontSize: '13px' }}
                      >
                        Start Chatting
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`d-flex flex-column ${msg.role === 'user' ? 'align-items-end' : 'align-items-start'}`}>
                      <div 
                        className={`p-3 rounded-4 shadow-xs ${msg.role === 'user' ? 'text-white' : 'bg-white text-dark border'}`} 
                        style={{ 
                          maxWidth: '88%', 
                          background: msg.role === 'user' ? '#0B192C' : 'white', 
                          borderBottomRightRadius: msg.role === 'user' ? '4px' : '18px', 
                          borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '18px', 
                          fontSize: '13.5px', 
                          lineHeight: '1.55',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}
                        dangerouslySetInnerHTML={{
                          __html: typeof msg.content === 'string'
                            ? msg.content
                                // Bold: **text** → <strong>text</strong>
                                .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                                // Inline italic: *text* → <em>text</em>
                                .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>')
                                // Markdown links: [text](/path?id=...&type=...) → styled clickable buttons with item metadata
                                .replace(
                                  /\[([^\]]+)\]\(\/(bikes|cars|hotels|activities|packages)([^\)]*)\)/g,
                                  (match, text, tab, query) => {
                                    let itemId = '';
                                    let itemType = '';
                                    if (query) {
                                      const idM = query.match(/[?&]id=([^&]+)/);
                                      if (idM) itemId = idM[1];
                                      const typeM = query.match(/[?&]type=([^&]+)/);
                                      if (typeM) itemType = typeM[1];
                                    }
                                    if (!itemId && activeContext?.active_item_id) itemId = String(activeContext.active_item_id);
                                    if (!itemType && activeContext?.active_item_type) itemType = String(activeContext.active_item_type);
                                    const itemName = activeContext?.active_item_name || '';
                                    return `<a href="#" onclick="window.dispatchEvent(new CustomEvent('sophia_nav',{detail:{tab:'${tab}',itemId:'${itemId}',itemType:'${itemType}',itemName:'${encodeURIComponent(itemName)}'}}));return false;" style="display:inline-block;margin-top:6px;padding:6px 14px;background:linear-gradient(135deg,#FF6B35,#FF9F1C);color:#fff;border-radius:20px;text-decoration:none;font-weight:700;font-size:12.5px;">${text}</a>`;
                                  }
                                )
                                // Action link: [Get Price for My Dates](#get-price)
                                .replace(
                                  /\[([^\]]+)\]\(#get-price\)/g,
                                  (match, text) => {
                                    return `<a href="#" onclick="window.dispatchEvent(new CustomEvent('sophia_send_msg',{detail:{text:'Get Price for My Dates'}}));return false;" style="display:inline-block;margin-top:6px;padding:6px 14px;background:#ffffff;color:#FF6B35;border:1.5px solid #FF6B35;border-radius:20px;text-decoration:none;font-weight:700;font-size:12.5px;cursor:pointer;transition:all 0.2s;">${text}</a>`;
                                  }
                                )
                                // Generic markdown links
                                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:#FF6B35;font-weight:600;text-decoration:underline;">$1</a>')
                            : msg.content
                        }}
                      />
                    </div>
                  ))}

                  {/* ─── SOPHIA SINGLE-ITEM BOOKING SUMMARY CARD ──────────────── */}
                  {activeContext?.booking_preview && !activeProposal && (
                    <div 
                      className="card border-0 shadow-sm rounded-4 overflow-hidden my-2 align-self-stretch animate-fade-in" 
                      style={{ background: '#ffffff', border: '1.5px solid #fed7aa', boxShadow: '0 8px 24px rgba(255, 107, 53, 0.12)' }}
                    >
                      <div className="p-3" style={{ background: 'linear-gradient(135deg, #FF6B35, #FF9F1C)', color: 'white' }}>
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center gap-2">
                            <Sparkles size={18} />
                            <div>
                              <div className="fw-bold" style={{ fontSize: '14px' }}>Booking Summary</div>
                              <small style={{ color: '#fff7ed', fontSize: '11px' }}>
                                {activeContext.booking_preview.item_type === 'bike' ? 'Two-Wheeler Rental' : (activeContext.booking_preview.item_type === 'car' ? 'Self-Drive Car' : (activeContext.booking_preview.item_type === 'hotel' ? 'Hotel Stay' : 'Activity Experience'))}
                              </small>
                            </div>
                          </div>
                          <span className="badge bg-white text-dark fw-bold px-2 py-1 rounded-pill shadow-xs" style={{ fontSize: '11px' }}>
                            {activeContext.booking_preview.item_type === 'bike' || activeContext.booking_preview.item_type === 'car'
                              ? `${activeContext.booking_preview.days || 1} ${activeContext.booking_preview.days === 1 ? 'Rental Day' : 'Rental Days'}`
                              : (activeContext.booking_preview.duration || `${activeContext.booking_preview.days || 1} Days`)}
                          </span>
                        </div>
                      </div>

                      <div className="p-3" style={{ fontSize: '12px', color: '#334155' }}>
                        {/* Item Name */}
                        <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom">
                          <span className="text-muted d-flex align-items-center gap-1.5">
                            {activeContext.booking_preview.item_type === 'bike' ? '🏍️ Bike:' : (activeContext.booking_preview.item_type === 'car' ? <><Car size={13} /> Vehicle:</> : (activeContext.booking_preview.item_type === 'hotel' ? <><Hotel size={13} /> Hotel:</> : <><Compass size={13} /> Activity:</>))}
                          </span>
                          <span className="text-dark fw-bold">{activeContext.booking_preview.item_name}</span>
                        </div>

                        {/* Dates */}
                        <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom">
                          <span className="text-muted d-flex align-items-center gap-1.5"><Calendar size={13} /> {activeContext.booking_preview.item_type === 'bike' || activeContext.booking_preview.item_type === 'car' ? 'Rental Dates:' : 'Dates:'}</span>
                          <span className="text-dark fw-semibold">{activeContext.booking_preview.travel_dates || `${activeContext.booking_preview.pickup_date} to ${activeContext.booking_preview.drop_date}`}</span>
                        </div>

                        {/* Estimated Total */}
                        <div className="d-flex align-items-center justify-content-between p-2.5 rounded-3 mb-3" style={{ background: '#fff7ed', border: '1px dashed #fdba74' }}>
                          <div>
                            <span className="fw-semibold text-dark d-block" style={{ fontSize: '12px' }}>Total Amount:</span>
                            <small className="text-muted" style={{ fontSize: '10px' }}>Pay 25% token to reserve, rest on delivery</small>
                          </div>
                          <span className="fw-bold" style={{ fontSize: '16px', color: '#c2410c' }}>
                            ₹{Number(activeContext.booking_preview.estimated_total || 0).toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* Confirm & Book Button */}
                        <button
                          type="button"
                          id="btn-confirm-and-book"
                          onClick={() => {
                            const bp = activeContext.booking_preview;
                            const tab = bp.item_type === 'bike' ? 'bikes' : (bp.item_type === 'car' ? 'cars' : (bp.item_type === 'hotel' ? 'hotels' : 'activities'));
                            setIsOpen(false);
                            window.dispatchEvent(new CustomEvent('sophia_switch_tab', { 
                              detail: { 
                                tab, 
                                itemId: String(bp.item_id), 
                                itemType: bp.item_type, 
                                itemName: bp.item_name 
                              } 
                            }));
                          }}
                          className="btn w-100 fw-bold text-white shadow-sm py-2.5 rounded-pill d-flex align-items-center justify-content-center gap-2 hover-scale transition-all"
                          style={{
                            background: 'linear-gradient(135deg, #FF6B35, #FF9F1C)',
                            border: 'none',
                            fontSize: '13px',
                            boxShadow: '0 4px 14px rgba(255, 107, 53, 0.35)',
                            cursor: 'pointer'
                          }}
                        >
                          <span>Confirm & Book {activeContext.booking_preview.item_name}</span>
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ─── SOPHIA TRIP PROPOSAL CARD ──────────────────────────── */}
                  {activeProposal && (
                    <div 
                      className="card border-0 shadow-sm rounded-4 overflow-hidden my-2 align-self-stretch animate-fade-in" 
                      style={{ background: '#ffffff', border: '1.5px solid #fed7aa', boxShadow: '0 8px 24px rgba(255, 107, 53, 0.12)' }}
                    >
                      <div className="p-3" style={{ background: 'linear-gradient(135deg, #FF6B35, #FF9F1C)', color: 'white' }}>
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center gap-2">
                            <Sparkles size={18} />
                            <div>
                              <div className="fw-bold" style={{ fontSize: '14px' }}>Sophia's Trip Proposal</div>
                              <small style={{ color: '#fff7ed', fontSize: '11px' }}>Custom Goa Vacation</small>
                            </div>
                          </div>
                          <span className="badge bg-white text-dark fw-bold px-2 py-1 rounded-pill shadow-xs" style={{ fontSize: '11px' }}>
                            {activeProposal.days || 3} Days
                          </span>
                        </div>
                      </div>

                      <div className="p-3" style={{ fontSize: '12px', color: '#334155' }}>
                        {/* Dates & Travellers */}
                        <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom">
                          <span className="text-muted d-flex align-items-center gap-1.5"><Calendar size={13} /> Dates:</span>
                          <span className="text-dark fw-semibold">{activeProposal.pickup_date} to {activeProposal.drop_date}</span>
                        </div>
                        <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom">
                          <span className="text-muted d-flex align-items-center gap-1.5"><Users size={13} /> Travellers:</span>
                          <span className="text-dark fw-semibold">{activeProposal.memberCount || 2} Adults</span>
                        </div>

                        {/* Vehicle */}
                        {activeProposal.vehicle && (
                          <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom">
                            <span className="text-muted d-flex align-items-center gap-1.5"><Car size={13} /> Vehicle:</span>
                            <div className="text-end">
                              <span className="text-dark fw-bold d-block">{activeProposal.vehicle.name}</span>
                              <small className="text-muted">{activeProposal.vehicle.seating ? `${activeProposal.vehicle.seating} • ` : ''}₹{Number(activeProposal.vehicle.price).toLocaleString('en-IN')}/day</small>
                            </div>
                          </div>
                        )}

                        {/* Hotel */}
                        {activeProposal.hotel && (
                          <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom">
                            <span className="text-muted d-flex align-items-center gap-1.5"><Hotel size={13} /> Stay:</span>
                            <div className="text-end">
                              <span className="text-dark fw-bold d-block">{activeProposal.hotel.name}</span>
                              <small className="text-muted">{activeProposal.hotel.stars ? `${activeProposal.hotel.stars}★ • ` : ''}₹{Number(activeProposal.hotel.price).toLocaleString('en-IN')}/night</small>
                            </div>
                          </div>
                        )}

                        {/* Sightseeing & Activities */}
                        {activeProposal.activities && activeProposal.activities.length > 0 && (
                          <div className="pb-2 mb-2 border-bottom">
                            <span className="text-muted d-flex align-items-center gap-1.5 mb-1"><Compass size={13} /> Experiences ({activeProposal.activities.length}):</span>
                            <div className="d-flex flex-column gap-1 ps-2">
                              {activeProposal.activities.map((a, i) => (
                                <div key={i} className="d-flex align-items-center justify-content-between" style={{ fontSize: '11px' }}>
                                  <span className="text-dark text-truncate" style={{ maxWidth: '210px' }}>• {a.title || a.name}</span>
                                  <span className="text-muted">₹{Number(a.price).toLocaleString('en-IN')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Estimated Preview */}
                        <div className="d-flex align-items-center justify-content-between p-2.5 rounded-3 mb-3" style={{ background: '#fff7ed', border: '1px dashed #fdba74' }}>
                          <div>
                            <span className="fw-semibold text-dark d-block" style={{ fontSize: '12px' }}>Estimated Total:</span>
                            <small className="text-muted" style={{ fontSize: '10px' }}>Final pricing calculated with GST in builder</small>
                          </div>
                          <span className="fw-bold" style={{ fontSize: '16px', color: '#c2410c' }}>
                            ₹{Number(activeProposal.estimated_total || 0).toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* Manual Draft Protection Confirmation Box */}
                        {showConfirmReplace ? (
                          <div className="p-2.5 rounded-3 mb-2 bg-light border">
                            <div className="d-flex align-items-center gap-1.5 text-warning mb-1">
                              <AlertCircle size={15} />
                              <strong className="text-dark" style={{ fontSize: '11.5px' }}>Trip Already in Progress</strong>
                            </div>
                            <p className="text-muted mb-2" style={{ fontSize: '11px' }}>
                              You already have a trip in progress in Craft My Trip. Do you want to replace it with Sophia's plan?
                            </p>
                            <div className="d-flex gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary flex-grow-1 rounded-pill py-1 fw-bold"
                                style={{ fontSize: '11px' }}
                                onClick={handleKeepCurrentTrip}
                              >
                                Keep Current Trip
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm text-white flex-grow-1 rounded-pill py-1 fw-bold"
                                style={{ background: '#059669', border: 'none', fontSize: '11px' }}
                                onClick={() => executeDraftHandoff(activeProposal)}
                              >
                                Replace With Sophia's
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            id="btn-review-trip-in-builder"
                            onClick={handleReviewTripInBuilder}
                            className="btn w-100 fw-bold text-white shadow-sm py-2.5 rounded-pill d-flex align-items-center justify-content-center gap-2 hover-scale transition-all"
                            style={{
                              background: 'linear-gradient(135deg, #059669, #10b981)',
                              border: 'none',
                              fontSize: '13px',
                              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                              cursor: 'pointer'
                            }}
                          >
                            <span>Review My Trip in Builder</span>
                            <ArrowRight size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Typing indicator */}
                  {isLoading && (
                    <div className="align-self-start p-3 bg-white rounded-4 border shadow-xs d-flex align-items-center gap-2" style={{ borderBottomLeftRadius: '4px' }}>
                      <div className="typing-dot bg-secondary rounded-circle" style={{ width: '6px', height: '6px', animation: 'typing 1.4s infinite ease-in-out both' }}></div>
                      <div className="typing-dot bg-secondary rounded-circle" style={{ width: '6px', height: '6px', animation: 'typing 1.4s infinite ease-in-out both', animationDelay: '0.2s' }}></div>
                      <div className="typing-dot bg-secondary rounded-circle" style={{ width: '6px', height: '6px', animation: 'typing 1.4s infinite ease-in-out both', animationDelay: '0.4s' }}></div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {!showLeadForm && (
              <div className="p-3 bg-white border-top">
                {voiceError && (
                  <div className="alert alert-warning py-1 px-2 mb-2 d-flex align-items-center gap-1.5 border-0 shadow-xs" style={{ fontSize: '11px', background: '#fffbeb', color: '#b45309' }}>
                    <AlertCircle size={14} className="flex-shrink-0" />
                    <span>{voiceError}</span>
                  </div>
                )}
                {/* Suggestion Chips */}
                <div className="d-flex gap-2 overflow-auto pb-2 mb-2 custom-scrollbar">
                  {suggestions.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSendMessage(null, s)}
                      className="btn btn-sm rounded-pill fw-bold text-nowrap"
                      style={{ fontSize: '11.5px', border: '1px solid #FF6B35', color: '#FF6B35', background: 'transparent' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Input form */}
                <form onSubmit={handleSendMessage} className="d-flex align-items-center gap-2 p-1 rounded-pill border" style={{ background: isListening ? '#fef2f2' : '#f1f5f9', borderColor: isListening ? '#ef4444' : '#e2e8f0', transition: 'all 0.25s' }}>
                  <button
                    type="button"
                    onClick={startListening}
                    title={isListening ? "Listening... Click to stop" : "Speak to Sophia with your voice"}
                    className={`btn rounded-circle d-flex align-items-center justify-content-center p-0 ${isListening ? 'listening-pulse' : ''}`}
                    style={{
                      width: '36px',
                      height: '36px',
                      minWidth: '36px',
                      background: isListening ? '#ef4444' : 'transparent',
                      color: isListening ? 'white' : '#FF6B35',
                      border: 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Mic size={18} />
                  </button>
                  <input
                    type="text"
                    className="form-control border-0 bg-transparent shadow-none px-2"
                    placeholder={isListening ? "Listening... Speak now 🎙️" : "Ask Sophia or craft your trip..."}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={isLoading}
                    style={{ fontSize: '13px' }}
                  />
                  <button
                    id="ai-submit"
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="btn rounded-circle d-flex align-items-center justify-content-center p-0"
                    style={{
                      width: '36px',
                      height: '36px',
                      minWidth: '36px',
                      background: 'linear-gradient(135deg, #FF6B35, #FF9F1C)',
                      color: 'white',
                      border: 'none',
                      cursor: (!input.trim() || isLoading) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            )}
          </>
      </div>
    </>
  );
}
