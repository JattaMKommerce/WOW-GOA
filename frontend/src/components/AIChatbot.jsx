import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, Mic, MicOff, Volume2, VolumeX, AlertCircle, CheckCircle2, Eye, Printer, Calendar, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import chatbotAvatar from '../assets/aichatbot.webp';
import { chatWithAI, API_BASE, createAiLead, updateAiLeadChat, createBooking, getAIChatbotSettings } from '../services/api';
import BookingVoucher from './common/BookingVoucher';

const aiMessages = [
  "Hey, I'm Sophia",
  "Plan your Goa trip",
  "Need help booking?",
  "Rent a Car or Bike"
];

export default function AIChatbot() {
  const [isChatbotEnabled, setIsChatbotEnabled] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [leadId, setLeadId] = useState(null);
  const [aiLeadId, setAiLeadId] = useState(null);
  const [activeContext, setActiveContext] = useState(null);

  // Sync AI Chatbot enabled state from database and listen to real-time toggle events
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
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(true);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadError, setLeadError] = useState('');
  const chatBodyRef = useRef(null);

  // Booking state (Phase 3 Real Booking Integration)
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  const [voucherModalBooking, setVoucherModalBooking] = useState(null);
  const [isEditingContact, setIsEditingContact] = useState(false);

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

  // Speech Recognition API reference
  const SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

  // Load available browser voices reliably via onvoiceschanged
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) {
        setAvailableVoices(v);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

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

  // ─── TIERED NATURAL FEMALE VOICE SELECTION ──────────────────────────────────
  const getBestFemaleEnglishVoice = (voices) => {
    if (!voices || voices.length === 0) return null;

    const isEnglish = (v) => {
      const l = (v.lang || '').toLowerCase();
      return l.startsWith('en') || l.includes('en-') || l.includes('en_');
    };

    const isIndianEnglish = (v) => {
      const l = (v.lang || '').toLowerCase();
      const n = (v.name || '').toLowerCase();
      return l.includes('en-in') || l.includes('en_in') || n.includes('india');
    };

    const isExplicitlyMale = (v) => {
      const n = (v.name || '').toLowerCase();
      return /\b(male|david|mark|george|rishi|guy|stefan|ravi)\b/i.test(n) && !n.includes('female');
    };

    const isFemale = (v) => {
      if (isExplicitlyMale(v)) return false;
      const n = (v.name || '').toLowerCase();
      if (n.includes('female')) return true;
      return /\b(heera|neerja|veena|sangeeta|aditi|priya|sonia|libby|jenny|samantha|victoria|karen|serena|moira|zira|fiona|ava|clara|emma|aria|michelle|stephanie)\b/i.test(n);
    };

    const isNatural = (v) => {
      const n = (v.name || '').toLowerCase();
      return n.includes('natural') || n.includes('online') || n.includes('neural');
    };

    const englishVoices = voices.filter(isEnglish);
    if (englishVoices.length === 0) return null;

    // 1. Natural Indian English female voice (e.g., Microsoft Heera/Neerja Natural, Google Indian English Female)
    const tier1 = englishVoices.find(v => isIndianEnglish(v) && isFemale(v) && isNatural(v)) ||
                  englishVoices.find(v => isIndianEnglish(v) && isFemale(v) && !v.name.toLowerCase().includes('zira'));
    if (tier1) return tier1;

    // 2. Natural English female voice (e.g., Microsoft Sonia/Libby/Jenny Natural, Google UK English Female)
    const tier2 = englishVoices.find(v => isFemale(v) && isNatural(v)) ||
                  englishVoices.find(v => isFemale(v) && !v.name.toLowerCase().includes('zira'));
    if (tier2) return tier2;

    // 3. Other English female voice (e.g. Samantha, Victoria, Karen, or fallback to Zira)
    const tier3 = englishVoices.find(v => isFemale(v));
    if (tier3) return tier3;

    // 4. Best available English voice (avoiding male if possible, else first available English)
    const tier4 = englishVoices.find(v => !isExplicitlyMale(v)) || englishVoices[0];
    if (tier4) return tier4;

    // 5. Browser default as final fallback
    return null;
  };

  // ─── VOICE OUTPUT (TEXT-TO-SPEECH) ──────────────────────────────────────────
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

  const speakText = (rawText, turnIndex = null) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    const clean = cleanTextForSpeech(rawText);
    if (!clean) return;

    // Duplicate speech prevention: prevent re-speaking within the exact same turn or rapid duplicate trigger
    const now = Date.now();
    if (lastSpokenMsgRef.current) {
      const sameText = lastSpokenMsgRef.current.text === clean;
      const isSameTurn = turnIndex !== null && lastSpokenMsgRef.current.turnIndex === turnIndex;
      const isRapidDuplicate = turnIndex === null && (now - (lastSpokenMsgRef.current.timestamp || 0)) < 1500;
      if (sameText && (isSameTurn || isRapidDuplicate)) {
        return;
      }
    }
    lastSpokenMsgRef.current = { text: clean, turnIndex, timestamp: now };

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(clean);
      activeUtteranceRef.current = utterance;

      utterance.onend = () => {
        activeUtteranceRef.current = null;
      };
      utterance.onerror = () => {
        activeUtteranceRef.current = null;
      };

      utterance.lang = 'en-IN';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      const voicesToUse = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
      const bestVoice = getBestFemaleEnglishVoice(voicesToUse);
      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      window.speechSynthesis.speak(utterance);
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      activeUtteranceRef.current = null;
    }
  };

  // Automatically speak latest assistant reply
  useEffect(() => {
    if (!isOpen || isMuted || messages.length === 0) return;
    const lastIdx = messages.length - 1;
    const lastMsg = messages[lastIdx];
    if (lastMsg && lastMsg.role === 'assistant') {
      speakText(lastMsg.content, lastIdx);
    }
  }, [messages, isOpen, isMuted]);

  // Cancel speech on modal close or unmount
  useEffect(() => {
    if (!isOpen) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      activeUtteranceRef.current = null;
      stopListening();
    }
  }, [isOpen]);

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      if (next && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        activeUtteranceRef.current = null;
      }
      return next;
    });
  };

  // ─── VOICE INPUT (SPEECH-TO-TEXT) ───────────────────────────────────────────
  const startListening = () => {
    if (!SpeechRecognition) {
      setVoiceError("Voice input is not supported in this browser. Please use Chrome/Edge or type your message.");
      setTimeout(() => setVoiceError(null), 5000);
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    // Mic start lock: prevent rapid repeated clicks from creating concurrent instances
    if (isStartingMicRef.current) {
      return;
    }

    // Stop existing audio playback immediately if Sophia is talking
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      activeUtteranceRef.current = null;
    }
    setVoiceError(null);

    // Safely abort and clear previous recognition instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }

    try {
      isStartingMicRef.current = true;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isStartingMicRef.current = false;
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        isStartingMicRef.current = false;
        setIsListening(false);
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript && transcript.trim()) {
          const cleanSpeech = transcript.trim();
          if (isLoading) {
            pendingVoiceTranscriptRef.current = cleanSpeech;
          } else {
            handleSendMessage(null, cleanSpeech);
          }
        }
      };

      recognition.onerror = (event) => {
        isStartingMicRef.current = false;
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setVoiceError("Microphone access was denied. Please allow microphone permissions in browser settings.");
        } else if (event.error !== 'no-speech') {
          setVoiceError("Could not capture speech. Please try speaking again.");
        }
        setTimeout(() => setVoiceError(null), 5000);
      };

      recognition.onend = () => {
        isStartingMicRef.current = false;
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Speech recognition error:", err);
      isStartingMicRef.current = false;
      setIsListening(false);
    }
  };

  const stopListening = () => {
    isStartingMicRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  // ─── LEAD SUBMISSION ────────────────────────────────────────────────────────
  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    setLeadError('');
    const cleanCustomerName = (leadName || '').trim();
    let cleanPhone = (leadPhone || '').replace(/\D/g, '');
    if (cleanPhone.length > 10) cleanPhone = cleanPhone.slice(-10);

    if (!cleanCustomerName) {
      setLeadError('Please enter your name.');
      return;
    }
    if (!/^\d{10}$/.test(cleanPhone)) {
      setLeadError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLeadName(cleanCustomerName);
    setLeadPhone(cleanPhone);
    setShowLeadForm(false);
    
    // Save lead to DB
    try {
      const res = await createAiLead(cleanCustomerName, cleanPhone);
      if (res.success) {
        if (res.lead_id) setLeadId(res.lead_id);
        else if (res.id) setLeadId(res.id);
        if (res.id) setAiLeadId(res.id);
      }
    } catch (err) {
      console.error('Failed to submit lead:', err);
    }
    
    const preTypedQuery = input ? input.trim() : '';
    if (preTypedQuery) {
      handleSendMessage(null, preTypedQuery);
    } else {
      setMessages([{ 
        role: 'assistant', 
        content: `Hello ${cleanCustomerName}! 👋 I’m Sophia, your AI Travel Expert for Goa. How can I help you today?` 
      }]);
    }
  };

  // ─── MESSAGE HANDLER ────────────────────────────────────────────────────────
  const handleSendMessage = async (e, directText = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const textToSend = typeof directText === 'string' ? directText : input;
    if (!textToSend.trim() || isLoading) {
      if (typeof directText === 'string' && directText.trim() && isLoading) {
        pendingVoiceTranscriptRef.current = directText.trim();
      }
      return;
    }
    
    // Stop recognition if still active
    stopListening();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      activeUtteranceRef.current = null;
    }

    const userMsg = { role: 'user', content: textToSend.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    
    if (leadId) {
      updateAiLeadChat(leadId, newMessages, aiLeadId).catch(console.error);
    }
    
    try {
      const aiRes = await chatWithAI(newMessages, activeContext);
      const replyText = typeof aiRes === 'string' ? aiRes : (aiRes?.reply || '');
      if (aiRes && aiRes.context) {
        setActiveContext(aiRes.context);
      }
      const updatedMessages = [...newMessages, { role: 'assistant', content: replyText }];
      setMessages(updatedMessages);
      if (leadId) {
        updateAiLeadChat(leadId, updatedMessages, aiLeadId).catch(console.error);
      }
    } catch (err) {
      const errorMessages = [...newMessages, { role: 'assistant', content: "I'm having trouble connecting to my brain right now. Please try again later!" }];
      setMessages(errorMessages);
      if (leadId) {
        updateAiLeadChat(leadId, errorMessages, aiLeadId).catch(console.error);
      }
    } finally {
      setIsLoading(false);
      if (pendingVoiceTranscriptRef.current) {
        const nextQuery = pendingVoiceTranscriptRef.current;
        pendingVoiceTranscriptRef.current = null;
        setTimeout(() => {
          handleSendMessage(null, nextQuery);
        }, 300);
      }
    }
  };

  // Auto pre-fill customer details from session if available
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('currentUser') || localStorage.getItem('customerUser');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u && !leadName && (u.name || u.customer_name)) {
          setLeadName(u.name || u.customer_name);
        }
        if (u && !leadPhone && (u.phone || u.customer_phone)) {
          setLeadPhone(u.phone || u.customer_phone);
        }
      }
    } catch (e) {}
  }, []);

  // Reset confirmedBooking when user switches to a different active item
  useEffect(() => {
    if (confirmedBooking && activeContext?.active_item_id && String(activeContext.active_item_id) !== String(confirmedBooking.item_id)) {
      setConfirmedBooking(null);
    }
  }, [activeContext?.active_item_id]);

  // ─── CONFIRM & BOOK ACTION (PHASE 3) ────────────────────────────────────────
  const handleConfirmBooking = async () => {
    if (isBookingSubmitting) return;
    setBookingError(null);

    const preview = activeContext?.booking_preview;
    if (!preview || !preview.pickup_date || !preview.drop_date) {
      setBookingError("Please provide your travel dates before confirming the booking.");
      return;
    }

    const finalName = (leadName || '').trim();
    let finalPhone = (leadPhone || '').replace(/\D/g, '');
    if (finalPhone.length > 10) finalPhone = finalPhone.slice(-10);

    if (!finalName) {
      setBookingError("Please provide your name to complete the booking.");
      setIsEditingContact(true);
      return;
    }
    if (!/^\d{10}$/.test(finalPhone)) {
      setBookingError("Please provide a valid 10-digit mobile number.");
      setIsEditingContact(true);
      return;
    }

    setIsBookingSubmitting(true);

    const itemType = preview.item_type || 'vehicle';
    const isAct = (itemType === 'activity' || itemType === 'sightseeing');
    const resolvedType = isAct ? itemType : (itemType === 'bike' ? 'bike' : (itemType === 'car' ? 'car' : (itemType === 'hotel' ? 'hotel' : 'vehicle')));
    const resolvedServiceType = isAct ? itemType : (itemType === 'bike' || itemType === 'car' ? 'vehicle' : itemType);

    const payload = {
      name: finalName,
      customer_name: finalName,
      phone: finalPhone,
      customer_phone: finalPhone,
      customer_id: 'c_' + finalPhone,
      email: `${finalPhone}@guest.wowgoa.com`,
      customer_email: `${finalPhone}@guest.wowgoa.com`,
      item_id: preview.item_id || 'item-1',
      item_name: preview.item_name || 'Experience Booking',
      vehicle_name: preview.item_name || 'Experience Booking',
      type: resolvedType,
      service_type: resolvedServiceType,
      package_type: isAct ? itemType : null,
      booking_channel: 'D2C',
      source: 'sophia',
      pickup_date: preview.pickup_date,
      drop_date: preview.drop_date,
      departure_date: preview.pickup_date,
      return_date: preview.drop_date,
      booking_days: preview.days || 1,
      duration: preview.duration || `${preview.days || 1} Days`,
      price: preview.price_per_day,
      total_amount: preview.estimated_total,
      amount_paid: preview.estimated_total,
      total_paid: preview.estimated_total,
      pickup_loc: 'Goa Delivery',
      pickup_location: 'Goa Delivery',
      drop_loc: 'Goa Delivery',
      drop_location: 'Goa Delivery',
      status: 'Confirmed',
      payment_status: 'Paid Online',
      payment_method: 'Online Payment',
      idempotency_key: `sophia_${preview.item_id}_${finalPhone}_${Date.now()}`
    };

    try {
      const res = await createBooking(payload);
      if (res && res.success && (res.booking_id || res.id)) {
        const realBookingId = res.booking_id || res.id;
        const finalBookingData = {
          ...payload,
          id: realBookingId,
          booking_id: realBookingId,
          ...(res.booking || {})
        };
        setConfirmedBooking(finalBookingData);

        // Instant session synchronization for Customer Portal
        try {
          sessionStorage.setItem('customer_login_phone', finalPhone);
          localStorage.setItem('customer_login_phone', finalPhone);
          const customerProfile = {
            id: 'c_' + finalPhone,
            name: finalName,
            phone: finalPhone,
            role: 'customer'
          };
          localStorage.setItem('customerUser', JSON.stringify(customerProfile));
          sessionStorage.setItem('last_created_booking', JSON.stringify(finalBookingData));
          localStorage.setItem('last_created_booking', JSON.stringify(finalBookingData));
        } catch (e) {}

        const confirmMsg = {
          role: 'assistant',
          content: `🎉 **Booking Confirmed!** Your booking ID is **${realBookingId}**.\n\nYour reservation for **${preview.item_name}** from **${preview.pickup_date}** to **${preview.drop_date}** is confirmed in our booking system. You can view your full reservation in My Bookings or print your voucher.`
        };
        const updatedMsgs = [...messages, confirmMsg];
        setMessages(updatedMsgs);

        if (leadId) {
          updateAiLeadChat(leadId, updatedMsgs, aiLeadId).catch(console.error);
        }

        // Sophia voice speaks confirmation
        const spokenText = `Your booking is confirmed. Your booking ID is ${realBookingId}. You can view the complete booking in My Bookings.`;
        speakText(spokenText);
      } else {
        throw new Error(res?.error || res?.message || 'Server rejected booking creation.');
      }
    } catch (err) {
      console.error('Booking submission failed:', err);
      const errMsg = err.message || 'Unable to complete booking. Please try again.';
      setBookingError(errMsg);
      const errAssistantMsg = {
        role: 'assistant',
        content: `⚠️ **Booking Error:** ${errMsg}\n\nYour selected vehicle (${preview.item_name}) and dates (${preview.travel_dates || preview.pickup_date}) have been preserved. Please verify details and click Confirm & Book to retry.`
      };
      setMessages(prev => [...prev, errAssistantMsg]);
      speakText(`Sorry, booking could not be completed: ${errMsg}. Please try again.`);
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  const handleViewMyBooking = () => {
    const phoneToUse = confirmedBooking?.phone || confirmedBooking?.customer_phone || leadPhone || '';
    if (phoneToUse) {
      try {
        const clean = phoneToUse.replace(/\D/g, '').slice(-10);
        sessionStorage.setItem('customer_login_phone', clean);
        localStorage.setItem('customer_login_phone', clean);
        const customerProfile = {
          id: 'c_' + clean,
          name: confirmedBooking?.name || confirmedBooking?.customer_name || leadName || 'Customer',
          phone: clean,
          role: 'customer'
        };
        localStorage.setItem('customerUser', JSON.stringify(customerProfile));
        if (confirmedBooking) {
          sessionStorage.setItem('last_created_booking', JSON.stringify(confirmedBooking));
          localStorage.setItem('last_created_booking', JSON.stringify(confirmedBooking));
        }
      } catch (e) {}
    }
    window.history.pushState(null, '', '/customer');
    window.dispatchEvent(new PopStateEvent('popstate'));
    setIsOpen(false);
  };

  // If AI Chatbot is toggled OFF by administrator, do not render floating widget
  if (!isChatbotEnabled) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`position-fixed shadow-lg d-flex align-items-center p-0 transition-all ${isOpen ? 'scale-0' : 'scale-100'}`}
        style={{
          bottom: '30px', right: '30px', height: '60px', background: 'white',
          borderRadius: '50px', zIndex: 1040, border: '1px solid #eaeaea',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)', cursor: 'pointer',
          paddingRight: '20px', overflow: 'visible'
        }}
      >
        <div 
          className="avatar-glow-container rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: '64px', height: '64px', background: 'white', border: '2px solid #0B192C', marginLeft: '-4px', position: 'relative', overflow: 'hidden' }}
        >
          <img 
            src={chatbotAvatar} 
            alt="Sophia AI" 
            className="head-movement"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
          />
        </div>
        <div style={{ marginLeft: '14px', marginRight: '10px', fontSize: '15px', color: '#1a202c', transition: 'opacity 0.5s ease-in-out', opacity: fade ? 1 : 0, whiteSpace: 'nowrap' }}>
          {msgIndex === 0 ? <span>Hey, <strong style={{ color: '#6b46c1', fontSize: '16px' }}>I'm Sophia</strong></span> : <span style={{ fontWeight: '500' }}>{aiMessages[msgIndex]}</span>}
        </div>
      </button>

      {/* Chatbot Window */}
      <div 
        className={`position-fixed shadow-lg rounded-4 overflow-hidden transition-all bg-white d-flex flex-column`}
        style={{
          bottom: isOpen ? '30px' : '-600px', right: '30px', width: '380px', height: '600px',
          maxWidth: 'calc(100vw - 40px)', maxHeight: 'calc(100vh - 40px)', zIndex: 1050,
          opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'all' : 'none', border: '1px solid rgba(0,0,0,0.1)',
        }}
      >
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between p-3" style={{ background: 'linear-gradient(135deg, #FF6B35, #FF9F1C)', color: 'white' }}>
          <div className="d-flex align-items-center gap-2">
            <div className="rounded-circle bg-white d-flex align-items-center justify-content-center shadow-sm overflow-hidden" style={{ width: '40px', height: '40px' }}>
              <img src={chatbotAvatar} alt="AI Avatar" style={{ width: '92%', height: '92%', objectFit: 'contain' }} />
            </div>
            <div>
              <h6 className="mb-0 fw-bold">I'm Sophia - Your Goa Expert</h6>
              <small style={{ opacity: 0.9 }}>Online | Powered by TripGalileo</small>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button 
              type="button"
              onClick={toggleMute} 
              title={isMuted ? "Unmute Sophia's Voice" : "Mute Sophia's Voice"}
              className="btn btn-sm p-1 rounded-circle d-flex align-items-center justify-content-center hover-scale" 
              style={{ width: '32px', height: '32px', background: isMuted ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)', color: 'white', border: 'none', backdropFilter: 'blur(4px)' }}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <button onClick={() => setIsOpen(false)} className="btn btn-sm p-1 rounded-circle d-flex align-items-center justify-content-center hover-scale" style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.25)', color: 'white', border: 'none', backdropFilter: 'blur(4px)' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div ref={chatBodyRef} className="flex-grow-1 p-3 overflow-auto" style={{ background: '#f8fafc', position: 'relative' }}>
          {showLeadForm ? (
            <div className="d-flex align-items-center justify-content-center h-100 position-absolute top-0 start-0 w-100" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(5px)', zIndex: 10 }}>
              <div className="bg-white p-4 rounded-3 border shadow-sm w-75 text-center">
                <h5 className="fw-bold text-dark mb-2">Welcome to Goa! 🌴</h5>
                <p className="text-muted small mb-4">Please enter your details to start chatting with Sophia, our AI expert.</p>
                <form onSubmit={handleLeadSubmit}>
                  <input 
                    type="text" 
                    className="form-control mb-2" 
                    placeholder="Your Name" 
                    value={leadName} 
                    onChange={e => { setLeadName(e.target.value); if (leadError) setLeadError(''); }} 
                    required 
                  />
                  <input 
                    type="tel" 
                    className="form-control mb-2" 
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
                  <button type="submit" className="btn btn-amber-gradient w-100 rounded-pill fw-bold text-white shadow-sm mt-1">Start Chat</button>
                </form>
              </div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {messages.map((msg, idx) => (
                <div key={idx} className={`d-flex flex-column ${msg.role === 'user' ? 'align-items-end' : 'align-items-start'}`}>
                  <div 
                    className={`p-3 rounded-4 shadow-sm ${msg.role === 'user' ? 'text-white' : 'bg-white text-dark border'}`} 
                    style={{ 
                      maxWidth: '85%', 
                      background: msg.role === 'user' ? '#0B192C' : 'white', 
                      borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px', 
                      borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '16px', 
                      fontSize: '14px', 
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                    dangerouslySetInnerHTML={{
                      __html: typeof msg.content === 'string' 
                        ? msg.content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                        : msg.content
                    }}
                  />
                </div>
              ))}

              {/* ─── BOOKING SUMMARY CARD (BEFORE CONFIRMATION) ─── */}
              {activeContext?.booking_preview && !confirmedBooking && (
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden my-1 align-self-stretch animate-fade-in" style={{ background: '#ffffff', border: '1px solid #fed7aa' }}>
                  <div className="p-3" style={{ background: 'linear-gradient(135deg, #0B192C, #1E3E62)', color: 'white' }}>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <span style={{ fontSize: '20px' }}>📋</span>
                        <div>
                          <div className="fw-bold" style={{ fontSize: '14px', letterSpacing: '0.2px' }}>Booking Summary</div>
                          <small style={{ color: '#94a3b8', fontSize: '11px' }}>Official Reservation Preview</small>
                        </div>
                      </div>
                      <span className="badge px-2 py-1 rounded-pill" style={{ background: 'rgba(255,107,53,0.2)', color: '#FF9F1C', border: '1px solid rgba(255,159,28,0.4)', fontSize: '10px' }}>
                        Ready to Book
                      </span>
                    </div>
                  </div>

                  <div className="p-3" style={{ fontSize: '12px', color: '#334155' }}>
                    <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom">
                      <span className="text-muted">Vehicle / Item:</span>
                      <strong className="text-dark text-end" style={{ fontSize: '13px' }}>{activeContext.booking_preview.item_name}</strong>
                    </div>
                    <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom">
                      <span className="text-muted">Pickup Date:</span>
                      <span className="text-dark fw-semibold">{activeContext.booking_preview.pickup_date}</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom">
                      <span className="text-muted">Return Date:</span>
                      <span className="text-dark fw-semibold">{activeContext.booking_preview.drop_date}</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom">
                      <span className="text-muted">Duration:</span>
                      <span className="text-dark">{activeContext.booking_preview.duration || `${activeContext.booking_preview.days} Days`}</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom">
                      <span className="text-muted">Price / Day:</span>
                      <span className="text-dark">₹{Number(activeContext.booking_preview.price_per_day).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom">
                      <span className="text-muted">Customer Name:</span>
                      <span className="text-dark fw-medium">{leadName || 'Guest Customer'}</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom">
                      <span className="text-muted">Customer Mobile:</span>
                      <span className="text-dark fw-medium">{leadPhone || 'Not provided'}</span>
                    </div>

                    {(!leadName || !leadPhone || isEditingContact) && (
                      <div className="p-2 mb-2 rounded-3 bg-light border">
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <label className="text-xxs fw-bold text-muted mb-0">Customer Details Required</label>
                        </div>
                        <input 
                          type="text" 
                          className="form-control form-control-sm mb-2" 
                          placeholder="Full Name" 
                          value={leadName} 
                          onChange={e => setLeadName(e.target.value)} 
                        />
                        <input 
                          type="tel" 
                          className="form-control form-control-sm" 
                          placeholder="10-digit Mobile Number" 
                          maxLength={10}
                          value={leadPhone} 
                          onChange={e => {
                            setLeadPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                            if (bookingError) setBookingError(null);
                          }} 
                        />
                      </div>
                    )}

                    <div className="d-flex align-items-center justify-content-between p-2 rounded-3 mb-3" style={{ background: '#fff7ed', border: '1px dashed #fdba74' }}>
                      <span className="fw-semibold text-dark" style={{ fontSize: '13px' }}>Estimated Total:</span>
                      <span className="fw-bold" style={{ fontSize: '16px', color: '#c2410c' }}>
                        ₹{Number(activeContext.booking_preview.estimated_total).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {bookingError && (
                      <div className="alert alert-danger py-1 px-2 mb-2 d-flex align-items-center gap-2 border-0 shadow-sm" style={{ fontSize: '11px', background: '#fef2f2', color: '#b91c1c' }}>
                        <AlertCircle size={14} className="flex-shrink-0" />
                        <span>{bookingError}</span>
                      </div>
                    )}

                    <button 
                      id="btn-confirm-and-book"
                      type="button"
                      onClick={handleConfirmBooking}
                      disabled={isBookingSubmitting}
                      className="btn w-100 fw-bold text-white shadow-sm py-2 rounded-pill d-flex align-items-center justify-content-center gap-2 transition-all"
                      style={{
                        background: isBookingSubmitting ? '#94a3b8' : 'linear-gradient(135deg, #FF6B35, #FF9F1C)',
                        border: 'none',
                        fontSize: '13px',
                        cursor: isBookingSubmitting ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)'
                      }}
                    >
                      {isBookingSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          <span>Processing Booking...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          <span>Confirm & Book</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ─── BOOKING CONFIRMATION CARD (AFTER SUCCESSFUL BOOKING) ─── */}
              {confirmedBooking && (
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden my-1 align-self-stretch animate-fade-in" style={{ background: '#ffffff', border: '1px solid #86efac' }}>
                  <div className="p-3" style={{ background: 'linear-gradient(135deg, #065f46, #059669)', color: 'white' }}>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <span style={{ fontSize: '22px' }}>🎉</span>
                        <div>
                          <div className="fw-bold" style={{ fontSize: '15px' }}>Booking Confirmed</div>
                          <small style={{ color: '#a7f3d0', fontSize: '11px' }}>Official Reservation Created</small>
                        </div>
                      </div>
                      <span className="badge bg-white text-success fw-bold px-2 py-1 shadow-sm" style={{ fontSize: '12px', letterSpacing: '0.5px' }}>
                        {confirmedBooking.id || confirmedBooking.booking_id}
                      </span>
                    </div>
                  </div>

                  <div className="p-3" style={{ fontSize: '12px', color: '#334155' }}>
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <span className="text-muted d-block" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vehicle / Item</span>
                        <strong className="text-dark d-block text-truncate">{confirmedBooking.vehicle_name || confirmedBooking.item_name}</strong>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</span>
                        <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 fw-bold">✓ Confirmed</span>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pickup Date</span>
                        <span className="text-dark fw-semibold">{confirmedBooking.pickup_date}</span>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Return Date</span>
                        <span className="text-dark fw-semibold">{confirmedBooking.drop_date}</span>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Duration</span>
                        <span className="text-dark">{confirmedBooking.duration || `${confirmedBooking.booking_days || 1} Days`}</span>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Daily Rate</span>
                        <span className="text-dark">₹{Number(confirmedBooking.price || 0).toLocaleString('en-IN')} / day</span>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer Name</span>
                        <span className="text-dark text-truncate d-block">{confirmedBooking.name || confirmedBooking.customer_name}</span>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mobile</span>
                        <span className="text-dark">{confirmedBooking.phone || confirmedBooking.customer_phone}</span>
                      </div>
                    </div>

                    <div className="d-flex align-items-center justify-content-between p-2 rounded-3 mb-3" style={{ background: '#ecfdf5', border: '1px dashed #a7f3d0' }}>
                      <span className="fw-semibold text-dark" style={{ fontSize: '13px' }}>Total Amount:</span>
                      <span className="fw-bold" style={{ fontSize: '16px', color: '#059669' }}>
                        ₹{Number(confirmedBooking.total_amount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="d-flex gap-2">
                      <button 
                        id="btn-view-my-booking"
                        type="button"
                        onClick={handleViewMyBooking}
                        className="btn btn-sm btn-outline-dark flex-grow-1 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-1 py-2 shadow-sm"
                        style={{ fontSize: '11px' }}
                      >
                        <Eye size={13} />
                        <span>View My Booking</span>
                      </button>
                      <button 
                        id="btn-print-voucher"
                        type="button"
                        onClick={() => setVoucherModalBooking(confirmedBooking)}
                        className="btn btn-sm text-white flex-grow-1 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-1 py-2 shadow-sm"
                        style={{ fontSize: '11px', background: '#059669', border: 'none' }}
                      >
                        <Printer size={13} />
                        <span>Print Voucher</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="align-self-start p-3 bg-white rounded-4 border shadow-sm d-flex align-items-center gap-2" style={{ borderBottomLeftRadius: '4px' }}>
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
              <div className="alert alert-warning py-1 px-2 mb-2 d-flex align-items-center gap-2 border-0 shadow-sm" style={{ fontSize: '11px', background: '#fffbeb', color: '#b45309' }}>
                <AlertCircle size={14} className="text-warning flex-shrink-0" />
                <span>{voiceError}</span>
              </div>
            )}
            <div className="d-flex gap-2 overflow-auto pb-2 mb-2 custom-scrollbar">
              {['Self Drive Packages', 'Best beaches in North Goa', 'Rent a Thar'].map(suggestion => (
                <button key={suggestion} type="button" onClick={() => handleSendMessage(null, suggestion)} className="btn btn-sm rounded-pill fw-bold text-nowrap" style={{ fontSize: '12px', border: '1px solid #FF6B35', color: '#FF6B35', background: 'transparent' }}>
                  {suggestion}
                </button>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="d-flex align-items-center gap-2 p-1 rounded-pill border" style={{ background: isListening ? '#fef2f2' : '#f1f5f9', borderColor: isListening ? '#ef4444' : '#e2e8f0', transition: 'all 0.3s' }}>
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
                placeholder={isListening ? "Listening... Speak now 🎙️" : "Ask or speak to Sophia..."} 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                disabled={isLoading} 
              />
              <button id="ai-submit" type="submit" disabled={!input.trim() || isLoading} className="btn rounded-circle d-flex align-items-center justify-content-center p-0" style={{ width: '36px', height: '36px', minWidth: '36px', background: '#FF6B35', color: 'white', border: 'none' }}>
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ─── PROFESSIONAL CORPORATE A4 VOUCHER MODAL ─── */}
      {voucherModalBooking && (
        <BookingVoucher
          booking={voucherModalBooking}
          onClose={() => setVoucherModalBooking(null)}
          isModal={true}
        />
      )}

      <style>{`
        .scale-0 { transform: scale(0); opacity: 0; }
        .scale-100 { transform: scale(1); opacity: 1; }
        .hover-scale:hover { transform: scale(1.1); transition: 0.2s; }
        
        .avatar-glow-container { box-shadow: 0 0 15px 5px rgba(11, 25, 44, 0.4); animation: blue-glow 2s infinite alternate; }
        @keyframes blue-glow { from { box-shadow: 0 0 10px 2px rgba(11, 25, 44, 0.4); } to { box-shadow: 0 0 20px 8px rgba(11, 25, 44, 0.7); } }
        
        .head-movement { animation: head-tilt 3s infinite ease-in-out; transform-origin: center bottom; }
        @keyframes head-tilt { 0% { transform: rotate(0deg); } 25% { transform: rotate(8deg); } 50% { transform: rotate(0deg); } 75% { transform: rotate(-8deg); } 100% { transform: rotate(0deg); } }
        
        @keyframes typing { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

        @keyframes mic-pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1.15); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .listening-pulse {
          animation: mic-pulse 1.4s infinite;
        }
        
        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>
    </>
  );
}
