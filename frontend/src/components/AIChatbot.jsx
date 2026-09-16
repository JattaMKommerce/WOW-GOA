import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Send, Bot, User, Mic, MicOff, Volume2, VolumeX, AlertCircle, 
  CheckCircle2, Eye, Printer, Calendar, ShieldCheck, Sparkles, Loader2,
  RotateCcw, MessageSquare, ChevronRight, Phone, Compass, MapPin, Check
} from 'lucide-react';
import chatbotVideo from '../assets/aichatbot.mp4';
import { chatWithAI, API_BASE, createAiLead, updateAiLeadChat, createBooking, getAIChatbotSettings } from '../services/api';
import BookingVoucher from './common/BookingVoucher';

const aiMessages = [
  "✨ Plan your Goa trip",
  "🚗 Rent a Thar or Bike",
  "🏖️ Hidden Beaches & Villas",
  "🎉 Nightclubs & Parties",
  "💬 Need help booking?"
];

const quickSuggestions = [
  { label: "🚗 Rent a Thar", query: "What are the rates and availability to rent a Mahindra Thar in Goa?" },
  { label: "🏖️ Best Beaches", query: "Which are the best beaches in North and South Goa?" },
  { label: "🛥️ Scuba & Water Sports", query: "Tell me about water sports and scuba diving packages in Goa." },
  { label: "🎉 Top Nightclubs", query: "What are the most popular nightclubs and beach parties in Goa?" },
  { label: "🏨 Luxury Villas", query: "I need luxury private pool villas in Goa for my stay." },
  { label: "🛵 Bike & Scooty", query: "How much does it cost to rent a scooty or Activa in Goa?" }
];

export default function AIChatbot() {
  const [isChatbotEnabled, setIsChatbotEnabled] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [showTeaserBubble, setShowTeaserBubble] = useState(true);
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
  const inputRef = useRef(null);

  // Booking state
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  const [voucherModalBooking, setVoucherModalBooking] = useState(null);
  const [isEditingContact, setIsEditingContact] = useState(false);

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const recognitionRef = useRef(null);
  const lastSpokenMsgRef = useRef(null);
  const activeUtteranceRef = useRef(null);
  const isStartingMicRef = useRef(false);
  const pendingVoiceTranscriptRef = useRef(null);
  const [availableVoices, setAvailableVoices] = useState([]);

  const videoRef = useRef(null);
  const headerVideoRef = useRef(null);
  
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
  }, [messages, isLoading, showLeadForm]);

  // Ensure videos play smoothly
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
    if (headerVideoRef.current && isOpen) {
      headerVideoRef.current.play().catch(() => {});
    }
  }, [isOpen]);

  // Rotating teaser messages in launcher
  useEffect(() => {
    if (isOpen) return;
    const intervalId = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMsgIndex((prev) => (prev + 1) % aiMessages.length);
        setFade(true);
      }, 400);
    }, 4500);
    return () => clearInterval(intervalId);
  }, [isOpen]);

  // Focus input when opened and not showing lead form
  useEffect(() => {
    if (isOpen && !showLeadForm && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, showLeadForm]);

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

    // 1. Natural Indian English female voice
    const tier1 = englishVoices.find(v => isIndianEnglish(v) && isFemale(v) && isNatural(v)) ||
                  englishVoices.find(v => isIndianEnglish(v) && isFemale(v) && !v.name.toLowerCase().includes('zira'));
    if (tier1) return tier1;

    // 2. Natural English female voice
    const tier2 = englishVoices.find(v => isFemale(v) && isNatural(v)) ||
                  englishVoices.find(v => isFemale(v) && !v.name.toLowerCase().includes('zira'));
    if (tier2) return tier2;

    // 3. Other English female voice
    const tier3 = englishVoices.find(v => isFemale(v));
    if (tier3) return tier3;

    // 4. Best available English voice
    const tier4 = englishVoices.find(v => !isExplicitlyMale(v)) || englishVoices[0];
    if (tier4) return tier4;

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

    // Duplicate speech prevention
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

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        activeUtteranceRef.current = null;
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
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
      setIsSpeaking(false);
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
      setIsSpeaking(false);
      activeUtteranceRef.current = null;
      stopListening();
    }
  }, [isOpen]);

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      if (next && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
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

    if (isStartingMicRef.current) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      activeUtteranceRef.current = null;
    }
    setVoiceError(null);

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
    if (e) e.preventDefault();
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
        content: `Hello ${cleanCustomerName}! 👋 I’m **Sophia**, your personal AI Travel Concierge for Goa. Whether you need a self-drive Thar, a scenic beach villa, watersports, or secret sunset spots—I've got you covered! What are you looking to plan today?` 
      }]);
    }
  };

  // Continue as guest
  const handleGuestContinue = () => {
    setShowLeadForm(false);
    if (!leadName) setLeadName('Traveler');
    setMessages([{
      role: 'assistant',
      content: `Hello there! 👋 I’m **Sophia**, your AI Goa Travel Concierge. Feel free to ask me anything about renting cars & bikes, booking luxury villas, clubbing, or hidden Goa spots!`
    }]);
  };

  // Reset chat conversation
  const handleResetChat = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setMessages([]);
    setShowLeadForm(true);
    setActiveContext(null);
    setConfirmedBooking(null);
    setBookingError(null);
    setInput('');
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
    
    stopListening();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      activeUtteranceRef.current = null;
    }

    const userMsg = { role: 'user', content: textToSend.trim(), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
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
      const updatedMessages = [...newMessages, { 
        role: 'assistant', 
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }];
      setMessages(updatedMessages);
      if (leadId) {
        updateAiLeadChat(leadId, updatedMessages, aiLeadId).catch(console.error);
      }
    } catch (err) {
      const errorMessages = [...newMessages, { 
        role: 'assistant', 
        content: "I'm having trouble connecting to my brain right now. Please try again in a moment!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }];
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

  // ─── CONFIRM & BOOK ACTION ──────────────────────────────────────────────────
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

        // Session synchronization for Customer Portal
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
          content: `🎉 **Booking Confirmed!** Your official booking ID is **${realBookingId}**.\n\nYour reservation for **${preview.item_name}** from **${preview.pickup_date}** to **${preview.drop_date}** is locked in. You can access it anytime under My Bookings or print your voucher below.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const updatedMsgs = [...messages, confirmMsg];
        setMessages(updatedMsgs);

        if (leadId) {
          updateAiLeadChat(leadId, updatedMsgs, aiLeadId).catch(console.error);
        }

        const spokenText = `Congratulations! Your booking is confirmed. Your booking ID is ${realBookingId}. You can view the full details in My Bookings.`;
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
        content: `⚠️ **Booking Error:** ${errMsg}\n\nYour selected vehicle (${preview.item_name}) and dates have been saved. Please review and click Confirm & Book again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
      {/* ─── FLOATING TEASER SPEECH BUBBLE ─── */}
      {showTeaserBubble && !isOpen && (
        <div 
          className="sophia-floating-teaser shadow-lg"
          onClick={() => setIsOpen(true)}
          role="button"
          tabIndex={0}
        >
          <button 
            type="button"
            className="sophia-teaser-close"
            onClick={(e) => { e.stopPropagation(); setShowTeaserBubble(false); }}
            title="Dismiss"
          >
            <X size={12} />
          </button>
          <div className="d-flex align-items-center gap-2">
            <span className="teaser-emoji">🌴</span>
            <div>
              <div className="teaser-title">Planning a Goa Vacation?</div>
              <div className="teaser-sub">Ask Sophia for Thar rentals, villas & secret spots!</div>
            </div>
          </div>
          <div className="teaser-arrow"></div>
        </div>
      )}

      {/* ─── FLOATING LAUNCHER PILL BUTTON ─── */}
      <div
        onClick={() => setIsOpen(true)}
        className={`sophia-launcher-pill ${isOpen ? 'sophia-launcher-hidden' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Open Sophia AI Travel Chatbot"
      >
        {/* Animated Avatar Container */}
        <div className="sophia-avatar-wrapper">
          <div className="sophia-avatar-inner">
            <video 
              ref={videoRef} 
              src={chatbotVideo} 
              autoPlay 
              loop 
              muted 
              playsInline 
              crossOrigin="anonymous" 
              className="sophia-video-elem"
            />
            {/* Subtle bottom vignette to blend naturally */}
            <div className="sophia-avatar-vignette"></div>
          </div>

          {/* Glowing Status Indicator */}
          <div className="sophia-status-dot" title="Sophia is Online">
            <span className="sophia-ping-ring"></span>
            <span className="sophia-dot-core"></span>
          </div>

          {/* AI Sparkle Tag */}
          <div className="sophia-ai-badge">
            <Sparkles size={9} />
            <span>AI</span>
          </div>
        </div>

        {/* Text Content */}
        <div className="sophia-pill-content">
          <div className="d-flex align-items-center gap-1 mb-0">
            <span className="sophia-name-label">Sophia</span>
            <span className="sophia-tag-pill">Goa Expert ✨</span>
          </div>
          <div className="sophia-rotating-msg">
            <span className={fade ? 'teaser-fade-in' : 'teaser-fade-out'}>
              {aiMessages[msgIndex]}
            </span>
          </div>
        </div>

        {/* Action Button Arrow */}
        <div className="sophia-action-circle">
          <ChevronRight size={16} />
        </div>
      </div>

      {/* ─── CHATBOT MODAL WINDOW ─── */}
      <div 
        className={`sophia-chat-window shadow-2xl ${isOpen ? 'sophia-window-open' : 'sophia-window-closed'}`}
        aria-hidden={!isOpen}
      >
        {/* ─── LUXURY HEADER ─── */}
        <div className="sophia-chat-header">
          <div className="d-flex align-items-center gap-3">
            <div className="sophia-header-avatar-ring">
              <div className="sophia-header-avatar-inner">
                <video 
                  ref={headerVideoRef}
                  src={chatbotVideo} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="sophia-header-video-elem"
                />
              </div>
              <span className="sophia-header-status-beacon"></span>
            </div>
            
            <div>
              <div className="d-flex align-items-center gap-2">
                <h6 className="mb-0 fw-bold text-white" style={{ fontSize: '16px', letterSpacing: '0.3px' }}>
                  Sophia
                </h6>
                <span className="sophia-verified-badge" title="Official TripGalileo AI Concierge">
                  <Check size={11} strokeWidth={3} />
                </span>
                <span className="badge bg-white-15 text-warning-subtle text-xxs px-2 py-0.5 rounded-pill border border-white-20">
                  AI Concierge
                </span>
              </div>
              
              {/* Dynamic Status / Voice Indicator */}
              <div className="d-flex align-items-center gap-2 mt-0.5">
                {isSpeaking ? (
                  <div className="d-flex align-items-center gap-1.5" style={{ fontSize: '11.5px', color: '#6ee7b7' }}>
                    <div className="sophia-equalizer-bars">
                      <span className="eq-bar eq-1"></span>
                      <span className="eq-bar eq-2"></span>
                      <span className="eq-bar eq-3"></span>
                      <span className="eq-bar eq-4"></span>
                    </div>
                    <span className="fw-semibold">Speaking...</span>
                  </div>
                ) : (
                  <small className="d-flex align-items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '11.5px' }}>
                    <span className="online-green-dot"></span>
                    <span>Online & Ready to Plan</span>
                  </small>
                )}
              </div>
            </div>
          </div>

          {/* Header Controls */}
          <div className="d-flex align-items-center gap-1.5">
            {/* Audio Mute/Unmute */}
            <button 
              type="button"
              onClick={toggleMute} 
              title={isMuted ? "Unmute Sophia's Voice" : "Mute Sophia's Voice"}
              className={`sophia-header-btn ${isMuted ? 'btn-muted' : ''}`}
              aria-label={isMuted ? "Unmute voice" : "Mute voice"}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {/* Clear / Restart Chat */}
            <button 
              type="button"
              onClick={handleResetChat}
              title="Restart Conversation"
              className="sophia-header-btn"
              aria-label="Restart chat"
            >
              <RotateCcw size={15} />
            </button>

            {/* Close Button */}
            <button 
              type="button"
              onClick={() => setIsOpen(false)} 
              title="Close chat"
              className="sophia-header-btn"
              aria-label="Close chat window"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* ─── CHAT BODY ─── */}
        <div ref={chatBodyRef} className="sophia-chat-body custom-scrollbar">
          {showLeadForm ? (
            /* ─── VIP TRAVEL ONBOARDING PASS ─── */
            <div className="sophia-onboarding-container animate-fade-in-up">
              <div className="sophia-vip-card">
                {/* Banner illustration */}
                <div className="vip-card-banner">
                  <div className="vip-badge-ribbon">VIP ACCESS</div>
                  <div className="vip-banner-content">
                    <span className="vip-goa-icon">🌴</span>
                    <h5 className="vip-title">Welcome to Goa!</h5>
                    <p className="vip-sub">Unlock exclusive vehicle rates, luxury villa access & customized itineraries.</p>
                  </div>
                </div>

                <div className="vip-form-body">
                  <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom border-light">
                    <div className="vip-avatar-mini">
                      <video src={chatbotVideo} autoPlay loop muted playsInline />
                    </div>
                    <div className="text-start">
                      <div className="fw-bold text-dark" style={{ fontSize: '13px' }}>Sophia is here to help</div>
                      <small className="text-muted" style={{ fontSize: '11px' }}>Enter your details to get instant quotes & WhatsApp support</small>
                    </div>
                  </div>

                  <form onSubmit={handleLeadSubmit}>
                    <div className="mb-2.5 text-start">
                      <label className="vip-input-label">Your Name</label>
                      <div className="vip-input-wrapper">
                        <User size={15} className="vip-input-icon" />
                        <input 
                          type="text" 
                          className="form-control vip-input" 
                          placeholder="e.g. Rahul Sharma" 
                          value={leadName} 
                          onChange={e => { setLeadName(e.target.value); if (leadError) setLeadError(''); }} 
                          required 
                        />
                      </div>
                    </div>

                    <div className="mb-3 text-start">
                      <label className="vip-input-label">WhatsApp / Mobile Number</label>
                      <div className="vip-input-wrapper">
                        <span className="vip-country-code">+91</span>
                        <input 
                          type="tel" 
                          className="form-control vip-input" 
                          placeholder="10-digit mobile number" 
                          maxLength={10}
                          value={leadPhone} 
                          onChange={e => { 
                            setLeadPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); 
                            if (leadError) setLeadError(''); 
                          }} 
                          required 
                        />
                      </div>
                    </div>

                    {leadError && (
                      <div className="alert alert-danger py-1.5 px-2.5 mb-3 d-flex align-items-center gap-2 border-0 shadow-sm text-start rounded-3" style={{ fontSize: '12px' }}>
                        <AlertCircle size={14} className="text-danger flex-shrink-0" />
                        <span>{leadError}</span>
                      </div>
                    )}

                    <button 
                      type="submit" 
                      className="btn w-100 fw-bold text-white shadow-md vip-submit-btn"
                    >
                      <Sparkles size={16} />
                      <span>Start Planning My Trip</span>
                    </button>
                  </form>

                  <div className="text-center mt-3 pt-2 border-top border-light">
                    <button 
                      type="button" 
                      onClick={handleGuestContinue}
                      className="btn btn-link text-decoration-none text-muted p-0"
                      style={{ fontSize: '12px', fontWeight: '500' }}
                    >
                      Just browsing? Continue as Guest →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ─── MESSAGES CONVERSATION ─── */
            <div className="d-flex flex-column gap-3 py-1">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`sophia-message-row ${msg.role === 'user' ? 'msg-user-row' : 'msg-bot-row'} animate-fade-in`}
                >
                  {msg.role === 'assistant' && (
                    <div className="sophia-msg-avatar">
                      <video src={chatbotVideo} autoPlay loop muted playsInline />
                    </div>
                  )}

                  <div className={`sophia-bubble ${msg.role === 'user' ? 'bubble-user' : 'bubble-assistant'}`}>
                    <div 
                      className="sophia-bubble-text"
                      dangerouslySetInnerHTML={{
                        __html: typeof msg.content === 'string' 
                          ? msg.content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                          : msg.content
                      }}
                    />

                    {/* Assistant message footer: timestamp and replay audio */}
                    {msg.role === 'assistant' && (
                      <div className="sophia-bubble-footer">
                        <span className="bubble-time">{msg.timestamp || 'Just now'}</span>
                        <button 
                          type="button"
                          onClick={() => speakText(msg.content, idx)}
                          className="bubble-audio-btn"
                          title="Listen to this response"
                        >
                          <Volume2 size={12} />
                          <span>Listen</span>
                        </button>
                      </div>
                    )}

                    {msg.role === 'user' && msg.timestamp && (
                      <div className="text-end mt-1" style={{ fontSize: '10px', opacity: 0.75 }}>
                        {msg.timestamp}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* ─── BOOKING SUMMARY CARD (BEFORE CONFIRMATION) ─── */}
              {activeContext?.booking_preview && !confirmedBooking && (
                <div className="sophia-ticket-card shadow-md animate-fade-in my-2">
                  <div className="ticket-card-header">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <span className="ticket-icon">📋</span>
                        <div>
                          <div className="ticket-title">Booking Summary</div>
                          <div className="ticket-sub">Verified Reservation Quote</div>
                        </div>
                      </div>
                      <span className="ticket-status-tag">Ready to Book</span>
                    </div>
                  </div>

                  <div className="ticket-body">
                    <div className="ticket-row">
                      <span className="ticket-label">Vehicle / Experience:</span>
                      <strong className="ticket-val text-dark">{activeContext.booking_preview.item_name}</strong>
                    </div>
                    <div className="ticket-row">
                      <span className="ticket-label">Pickup Date:</span>
                      <span className="ticket-val text-dark fw-semibold">{activeContext.booking_preview.pickup_date}</span>
                    </div>
                    <div className="ticket-row">
                      <span className="ticket-label">Return Date:</span>
                      <span className="ticket-val text-dark fw-semibold">{activeContext.booking_preview.drop_date}</span>
                    </div>
                    <div className="ticket-row">
                      <span className="ticket-label">Duration:</span>
                      <span className="ticket-val text-dark">{activeContext.booking_preview.duration || `${activeContext.booking_preview.days} Days`}</span>
                    </div>
                    <div className="ticket-row">
                      <span className="ticket-label">Price / Day:</span>
                      <span className="ticket-val text-dark">₹{Number(activeContext.booking_preview.price_per_day).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="ticket-row">
                      <span className="ticket-label">Customer Name:</span>
                      <span className="ticket-val text-dark fw-medium">{leadName || 'Guest Customer'}</span>
                    </div>
                    <div className="ticket-row">
                      <span className="ticket-label">Mobile Number:</span>
                      <span className="ticket-val text-dark fw-medium">{leadPhone || 'Not provided'}</span>
                    </div>

                    {(!leadName || !leadPhone || isEditingContact) && (
                      <div className="ticket-edit-box mt-2 p-2 rounded-3 bg-light border">
                        <label className="text-xxs fw-bold text-muted mb-1 d-block">Customer Details Required for Booking</label>
                        <input 
                          type="text" 
                          className="form-control form-control-sm mb-1.5" 
                          placeholder="Your Full Name" 
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

                    <div className="ticket-total-box mt-3">
                      <div>
                        <span className="text-muted text-xxs text-uppercase fw-bold d-block">Estimated Total</span>
                        <span className="ticket-total-price">
                          ₹{Number(activeContext.booking_preview.estimated_total).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 text-xxs">Best Rate Guaranteed</span>
                    </div>

                    {bookingError && (
                      <div className="alert alert-danger py-1.5 px-2.5 my-2 d-flex align-items-center gap-2 border-0 shadow-sm rounded-3" style={{ fontSize: '11.5px' }}>
                        <AlertCircle size={14} className="flex-shrink-0 text-danger" />
                        <span>{bookingError}</span>
                      </div>
                    )}

                    <button 
                      id="btn-confirm-and-book"
                      type="button"
                      onClick={handleConfirmBooking}
                      disabled={isBookingSubmitting}
                      className="btn w-100 fw-bold text-white shadow-md py-2.5 rounded-pill d-flex align-items-center justify-content-center gap-2 mt-3 ticket-confirm-btn"
                    >
                      {isBookingSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Securing Your Booking...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          <span>Confirm & Lock Booking</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ─── BOOKING CONFIRMATION CARD (AFTER CONFIRMATION) ─── */}
              {confirmedBooking && (
                <div className="sophia-confirmed-card shadow-lg animate-fade-in my-2">
                  <div className="confirmed-card-header">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <span style={{ fontSize: '24px' }}>🎉</span>
                        <div>
                          <div className="fw-bold text-white" style={{ fontSize: '15px' }}>Booking Confirmed!</div>
                          <small style={{ color: '#a7f3d0', fontSize: '11px' }}>Official System Reservation</small>
                        </div>
                      </div>
                      <span className="badge bg-white text-success fw-bold px-2.5 py-1.5 shadow-sm rounded-pill" style={{ fontSize: '12px' }}>
                        {confirmedBooking.id || confirmedBooking.booking_id}
                      </span>
                    </div>
                  </div>

                  <div className="p-3" style={{ fontSize: '12px', color: '#334155' }}>
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <span className="text-muted d-block text-xxs text-uppercase fw-semibold">Item / Vehicle</span>
                        <strong className="text-dark d-block text-truncate">{confirmedBooking.vehicle_name || confirmedBooking.item_name}</strong>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block text-xxs text-uppercase fw-semibold">Status</span>
                        <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-0.5 fw-bold">✓ Confirmed</span>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block text-xxs text-uppercase fw-semibold">Pickup Date</span>
                        <span className="text-dark fw-semibold">{confirmedBooking.pickup_date}</span>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block text-xxs text-uppercase fw-semibold">Return Date</span>
                        <span className="text-dark fw-semibold">{confirmedBooking.drop_date}</span>
                      </div>
                    </div>

                    <div className="d-flex align-items-center justify-content-between p-2 rounded-3 mb-3" style={{ background: '#ecfdf5', border: '1px dashed #a7f3d0' }}>
                      <span className="fw-semibold text-dark">Total Amount:</span>
                      <span className="fw-bold" style={{ fontSize: '16px', color: '#059669' }}>
                        ₹{Number(confirmedBooking.total_amount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="d-flex gap-2">
                      <button 
                        id="btn-view-my-booking"
                        type="button"
                        onClick={handleViewMyBooking}
                        className="btn btn-sm btn-outline-dark flex-grow-1 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-1.5 py-2 shadow-sm"
                        style={{ fontSize: '12px' }}
                      >
                        <Eye size={14} />
                        <span>My Bookings</span>
                      </button>
                      <button 
                        id="btn-print-voucher"
                        type="button"
                        onClick={() => setVoucherModalBooking(confirmedBooking)}
                        className="btn btn-sm text-white flex-grow-1 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-1.5 py-2 shadow-sm"
                        style={{ fontSize: '12px', background: 'linear-gradient(135deg, #059669, #047857)', border: 'none' }}
                      >
                        <Printer size={14} />
                        <span>Print Voucher</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── TYPING INDICATOR ─── */}
              {isLoading && (
                <div className="sophia-message-row msg-bot-row animate-fade-in">
                  <div className="sophia-msg-avatar">
                    <video src={chatbotVideo} autoPlay loop muted playsInline />
                  </div>
                  <div className="sophia-typing-bubble shadow-sm">
                    <span className="typing-text">Sophia is planning...</span>
                    <div className="typing-dots">
                      <span className="dot dot-1"></span>
                      <span className="dot dot-2"></span>
                      <span className="dot dot-3"></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── CHAT FOOTER & INPUT ─── */}
        {!showLeadForm && (
          <div className="sophia-chat-footer">
            {/* Voice Error Banner */}
            {voiceError && (
              <div className="alert alert-warning py-1.5 px-2.5 mb-2 d-flex align-items-center gap-2 border-0 shadow-sm rounded-3" style={{ fontSize: '11.5px', background: '#fffbeb', color: '#b45309' }}>
                <AlertCircle size={14} className="text-warning flex-shrink-0" />
                <span>{voiceError}</span>
              </div>
            )}

            {/* Listening Wave Banner */}
            {isListening && (
              <div className="sophia-listening-banner mb-2">
                <div className="d-flex align-items-center gap-2">
                  <div className="listening-pulse-dot"></div>
                  <span className="fw-semibold text-danger" style={{ fontSize: '12px' }}>Sophia is listening... Speak your query</span>
                </div>
                <div className="listening-waves">
                  <span className="l-bar"></span>
                  <span className="l-bar"></span>
                  <span className="l-bar"></span>
                  <span className="l-bar"></span>
                </div>
              </div>
            )}

            {/* Quick Suggestion Chips */}
            <div className="sophia-chips-scroll custom-scrollbar mb-2">
              {quickSuggestions.map((item, i) => (
                <button 
                  key={i} 
                  type="button" 
                  onClick={() => handleSendMessage(null, item.query)} 
                  className="sophia-quick-chip"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className={`sophia-input-container ${isListening ? 'input-listening-active' : ''}`}>
              <button 
                type="button" 
                onClick={startListening} 
                title={isListening ? "Listening... Click to stop" : "Speak with Sophia using your microphone"}
                className={`sophia-mic-btn ${isListening ? 'mic-active-pulse' : ''}`}
                aria-label="Voice input"
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              <input 
                ref={inputRef}
                type="text" 
                className="form-control sophia-text-input shadow-none" 
                placeholder={isListening ? "Listening... Speak now 🎙️" : "Ask Sophia anything about Goa..."} 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                disabled={isLoading} 
              />

              <button 
                id="ai-submit" 
                type="submit" 
                disabled={!input.trim() || isLoading} 
                className={`sophia-send-btn ${input.trim() ? 'send-btn-ready' : ''}`}
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </form>

            <div className="text-center mt-1.5">
              <small style={{ fontSize: '10px', color: '#94a3b8' }}>
                ⚡ Powered by TripGalileo AI Concierge • Voice & Instant Booking
              </small>
            </div>
          </div>
        )}
      </div>

      {/* ─── OFFICIAL BOOKING VOUCHER MODAL ─── */}
      {voucherModalBooking && (
        <BookingVoucher
          booking={voucherModalBooking}
          onClose={() => setVoucherModalBooking(null)}
          isModal={true}
        />
      )}

      {/* ─── STUNNING CUSTOM STYLING & ANIMATIONS ─── */}
      <style>{`
        /* ─── FLOATING TEASER SPEECH BUBBLE ─── */
        .sophia-floating-teaser {
          position: fixed;
          bottom: 110px;
          right: 32px;
          background: #ffffff;
          border-radius: 16px;
          padding: 12px 32px 12px 14px;
          z-index: 1045;
          cursor: pointer;
          border: 1px solid rgba(255, 107, 53, 0.25);
          box-shadow: 0 14px 35px -8px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.8) inset;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          animation: float-bob 3s ease-in-out infinite;
          max-width: 320px;
        }
        .sophia-floating-teaser:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 18px 40px -6px rgba(255, 107, 53, 0.25);
        }
        .sophia-teaser-close {
          position: absolute;
          top: 6px;
          right: 8px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: none;
          background: rgba(148, 163, 184, 0.2);
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }
        .sophia-teaser-close:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }
        .teaser-emoji {
          font-size: 24px;
          flex-shrink: 0;
        }
        .teaser-title {
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.2;
        }
        .teaser-sub {
          font-size: 11px;
          color: #64748b;
          margin-top: 2px;
          line-height: 1.3;
        }
        .teaser-arrow {
          position: absolute;
          bottom: -7px;
          right: 36px;
          width: 14px;
          height: 14px;
          background: #ffffff;
          border-right: 1px solid rgba(255, 107, 53, 0.25);
          border-bottom: 1px solid rgba(255, 107, 53, 0.25);
          transform: rotate(45deg);
        }

        /* ─── FLOATING LAUNCHER PILL ─── */
        .sophia-launcher-pill {
          position: fixed;
          bottom: 26px;
          right: 26px;
          height: 74px;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(16px);
          border-radius: 60px;
          z-index: 1040;
          border: 1.5px solid rgba(255, 107, 53, 0.3);
          box-shadow: 0 16px 40px -8px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(255, 255, 255, 0.8) inset;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 5px 14px 5px 6px;
          gap: 12px;
          transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          user-select: none;
        }
        .sophia-launcher-pill:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 20px 45px -6px rgba(255, 107, 53, 0.35), 0 0 20px rgba(255, 107, 53, 0.2);
          border-color: #FF6B35;
        }
        .sophia-launcher-hidden {
          transform: scale(0) translateY(40px);
          opacity: 0;
          pointer-events: none;
        }

        /* ─── AVATAR WRAPPER & VIDEO ─── */
        .sophia-avatar-wrapper {
          position: relative;
          width: 66px;
          height: 66px;
          border-radius: 50%;
          padding: 2.5px;
          background: linear-gradient(135deg, #FF6B35 0%, #FF9F1C 40%, #8B5CF6 80%, #EC4899 100%);
          background-size: 250% 250%;
          animation: avatar-gradient-spin 4s ease infinite;
          box-shadow: 0 6px 18px rgba(255, 107, 53, 0.4);
          flex-shrink: 0;
        }
        .sophia-avatar-inner {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: radial-gradient(circle at center, #ffffff 30%, #e2e8f0 100%);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sophia-video-elem {
          position: absolute;
          width: 135%;
          height: auto;
          left: -22%;
          top: 10%;
          pointer-events: none;
          object-fit: contain;
        }
        .sophia-avatar-vignette {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 28%;
          background: linear-gradient(to top, rgba(15, 23, 42, 0.25) 0%, transparent 100%);
          pointer-events: none;
        }

        /* Status Beacon & AI Badge */
        .sophia-status-dot {
          position: absolute;
          bottom: 1px;
          right: 1px;
          width: 14px;
          height: 14px;
        }
        .sophia-dot-core {
          position: absolute;
          inset: 0;
          background: #10b981;
          border-radius: 50%;
          border: 2px solid #ffffff;
          box-shadow: 0 0 8px #10b981;
        }
        .sophia-ping-ring {
          position: absolute;
          inset: -3px;
          background: rgba(16, 185, 129, 0.5);
          border-radius: 50%;
          animation: ping-pulse 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .sophia-ai-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: linear-gradient(135deg, #FF6B35, #FF9F1C);
          color: white;
          font-size: 8px;
          font-weight: 800;
          padding: 2px 5px;
          border-radius: 20px;
          border: 1.5px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          gap: 2px;
          letter-spacing: 0.5px;
        }

        /* Capsule Content */
        .sophia-pill-content {
          white-space: nowrap;
          display: flex;
          flex-direction: column;
        }
        .sophia-name-label {
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.2px;
        }
        .sophia-tag-pill {
          background: rgba(255, 107, 53, 0.12);
          color: #ea580c;
          font-size: 10px;
          font-weight: 700;
          padding: 1px 7px;
          border-radius: 20px;
          letter-spacing: 0.2px;
        }
        .sophia-rotating-msg {
          font-size: 12.5px;
          font-weight: 500;
          color: #475569;
          margin-top: 1px;
          height: 18px;
        }
        .sophia-action-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FF6B35, #FF9F1C);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: 4px;
          box-shadow: 0 4px 10px rgba(255, 107, 53, 0.35);
          transition: transform 0.2s;
        }
        .sophia-launcher-pill:hover .sophia-action-circle {
          transform: translateX(3px);
        }

        /* ─── CHATBOT WINDOW ─── */
        .sophia-chat-window {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 400px;
          height: 620px;
          max-width: calc(100vw - 32px);
          max-height: calc(100vh - 40px);
          background: #ffffff;
          border-radius: 24px;
          z-index: 1050;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          border: 1px solid rgba(255, 107, 53, 0.2);
          box-shadow: 0 25px 65px -12px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.15);
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .sophia-window-open {
          opacity: 1;
          transform: scale(1) translateY(0);
          pointer-events: all;
        }
        .sophia-window-closed {
          opacity: 0;
          transform: scale(0.9) translateY(40px);
          pointer-events: none;
        }

        /* ─── LUXURY HEADER ─── */
        .sophia-chat-header {
          background: linear-gradient(135deg, #0B192C 0%, #1E293B 45%, #FF6B35 120%);
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          flex-shrink: 0;
        }
        .sophia-header-avatar-ring {
          position: relative;
          width: 46px;
          height: 46px;
          border-radius: 50%;
          padding: 2px;
          background: linear-gradient(135deg, #FF6B35, #FF9F1C, #fbbf24);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
          flex-shrink: 0;
        }
        .sophia-header-avatar-inner {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          position: relative;
          background: #ffffff;
        }
        .sophia-header-video-elem {
          position: absolute;
          width: 135%;
          height: auto;
          left: -22%;
          top: 10%;
          pointer-events: none;
          object-fit: contain;
        }
        .sophia-header-status-beacon {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 12px;
          height: 12px;
          background: #10b981;
          border-radius: 50%;
          border: 2px solid #0B192C;
          box-shadow: 0 0 6px #10b981;
        }
        .sophia-verified-badge {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #38bdf8;
          color: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
        }
        .online-green-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 6px #10b981;
        }
        .sophia-header-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          backdrop-filter: blur(4px);
        }
        .sophia-header-btn:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: scale(1.08);
        }
        .sophia-header-btn.btn-muted {
          background: rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }

        /* Audio Equalizer */
        .sophia-equalizer-bars {
          display: flex;
          align-items: flex-end;
          gap: 2px;
          height: 12px;
        }
        .eq-bar {
          width: 2.5px;
          background: #6ee7b7;
          border-radius: 2px;
          animation: eq-jump 1s ease-in-out infinite alternate;
        }
        .eq-1 { height: 4px; animation-delay: 0.1s; }
        .eq-2 { height: 11px; animation-delay: 0.3s; }
        .eq-3 { height: 7px; animation-delay: 0.2s; }
        .eq-4 { height: 9px; animation-delay: 0.4s; }

        /* ─── CHAT BODY ─── */
        .sophia-chat-body {
          flex: 1;
          padding: 16px;
          background: #f8fafc;
          overflow-y: auto;
          position: relative;
        }

        /* ─── VIP ONBOARDING CARD ─── */
        .sophia-onboarding-container {
          padding: 8px 4px;
        }
        .sophia-vip-card {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #fed7aa;
          box-shadow: 0 10px 30px -8px rgba(255, 107, 53, 0.15);
          overflow: hidden;
        }
        .vip-card-banner {
          background: linear-gradient(135deg, #0B192C 0%, #1E3E62 60%, #FF6B35 120%);
          padding: 20px 16px 16px;
          color: white;
          text-align: center;
          position: relative;
        }
        .vip-badge-ribbon {
          position: absolute;
          top: 10px;
          right: 12px;
          background: rgba(255, 159, 28, 0.25);
          border: 1px solid rgba(255, 159, 28, 0.5);
          color: #FF9F1C;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.8px;
          padding: 2px 8px;
          border-radius: 12px;
        }
        .vip-goa-icon {
          font-size: 32px;
          display: block;
          margin-bottom: 4px;
        }
        .vip-title {
          font-size: 17px;
          font-weight: 800;
          margin-bottom: 4px;
          letter-spacing: -0.2px;
        }
        .vip-sub {
          font-size: 11.5px;
          color: #cbd5e1;
          margin-bottom: 0;
          line-height: 1.4;
        }
        .vip-form-body {
          padding: 18px 16px 14px;
        }
        .vip-avatar-mini {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          overflow: hidden;
          border: 1.5px solid #FF6B35;
          flex-shrink: 0;
          position: relative;
        }
        .vip-avatar-mini video {
          position: absolute;
          width: 135%;
          height: auto;
          left: -22%;
          top: 10%;
        }
        .vip-input-label {
          font-size: 11px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .vip-input-wrapper {
          display: flex;
          align-items: center;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 2px 10px;
          background: #f8fafc;
          transition: all 0.2s;
        }
        .vip-input-wrapper:focus-within {
          border-color: #FF6B35;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.15);
        }
        .vip-input-icon {
          color: #94a3b8;
          margin-right: 8px;
        }
        .vip-country-code {
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
          margin-right: 6px;
          padding-right: 6px;
          border-right: 1px solid #cbd5e1;
        }
        .vip-input {
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
          font-size: 13px;
          padding: 8px 4px;
          color: #0f172a;
        }
        .vip-submit-btn {
          background: linear-gradient(135deg, #FF6B35 0%, #FF9F1C 100%);
          border: none;
          border-radius: 30px;
          padding: 10px;
          font-size: 13px;
          letter-spacing: 0.2px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.25s;
        }
        .vip-submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(255, 107, 53, 0.4);
        }

        /* ─── MESSAGE ROWS ─── */
        .sophia-message-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          width: 100%;
        }
        .msg-user-row {
          justify-content: flex-end;
        }
        .msg-bot-row {
          justify-content: flex-start;
        }
        .sophia-msg-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          overflow: hidden;
          border: 1.5px solid #FF6B35;
          position: relative;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .sophia-msg-avatar video {
          position: absolute;
          width: 135%;
          height: auto;
          left: -22%;
          top: 10%;
        }

        /* Bubbles */
        .sophia-bubble {
          max-width: 82%;
          padding: 12px 14px;
          border-radius: 18px;
          font-size: 13.5px;
          line-height: 1.55;
          word-break: break-word;
          position: relative;
        }
        .bubble-user {
          background: linear-gradient(135deg, #FF6B35 0%, #FF8E3C 100%);
          color: #ffffff;
          border-bottom-right-radius: 4px;
          box-shadow: 0 4px 14px rgba(255, 107, 53, 0.25);
        }
        .bubble-assistant {
          background: #ffffff;
          color: #1e293b;
          border: 1px solid #e2e8f0;
          border-bottom-left-radius: 4px;
          box-shadow: 0 3px 12px rgba(15, 23, 42, 0.05);
        }
        .sophia-bubble-text strong {
          color: #0f172a;
        }
        .bubble-user .sophia-bubble-text strong {
          color: #ffffff;
          text-decoration: underline;
        }
        .sophia-bubble-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 8px;
          padding-top: 6px;
          border-top: 1px solid #f1f5f9;
        }
        .bubble-time {
          font-size: 10.5px;
          color: #94a3b8;
        }
        .bubble-audio-btn {
          border: none;
          background: #f1f5f9;
          color: #475569;
          border-radius: 12px;
          padding: 2px 8px;
          font-size: 10.5px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .bubble-audio-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        /* ─── TYPING BUBBLE ─── */
        .sophia-typing-bubble {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          border-bottom-left-radius: 4px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .typing-text {
          font-size: 12px;
          color: #64748b;
          font-style: italic;
        }
        .typing-dots {
          display: flex;
          gap: 3px;
        }
        .dot {
          width: 5px;
          height: 5px;
          background: #FF6B35;
          border-radius: 50%;
          animation: dot-bounce 1.4s infinite ease-in-out both;
        }
        .dot-1 { animation-delay: 0s; }
        .dot-2 { animation-delay: 0.2s; }
        .dot-3 { animation-delay: 0.4s; }

        /* ─── BOOKING TICKET CARDS ─── */
        .sophia-ticket-card {
          background: #ffffff;
          border-radius: 18px;
          border: 1px solid #fed7aa;
          overflow: hidden;
          width: 100%;
        }
        .ticket-card-header {
          background: linear-gradient(135deg, #0B192C 0%, #1E3E62 100%);
          padding: 12px 14px;
          color: white;
        }
        .ticket-icon {
          font-size: 18px;
        }
        .ticket-title {
          font-size: 13.5px;
          font-weight: 700;
        }
        .ticket-sub {
          font-size: 10px;
          color: #94a3b8;
        }
        .ticket-status-tag {
          background: rgba(255, 107, 53, 0.2);
          border: 1px solid rgba(255, 159, 28, 0.5);
          color: #FF9F1C;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
        }
        .ticket-body {
          padding: 14px;
          font-size: 12px;
        }
        .ticket-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px dashed #f1f5f9;
        }
        .ticket-label {
          color: #64748b;
        }
        .ticket-val {
          text-align: right;
        }
        .ticket-total-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-radius: 12px;
          background: #fff7ed;
          border: 1px dashed #fdba74;
        }
        .ticket-total-price {
          font-size: 18px;
          font-weight: 800;
          color: #ea580c;
        }
        .ticket-confirm-btn {
          background: linear-gradient(135deg, #FF6B35 0%, #FF9F1C 100%);
          border: none;
          font-size: 13.5px;
          box-shadow: 0 4px 14px rgba(255, 107, 53, 0.35);
          transition: all 0.2s;
        }
        .ticket-confirm-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(255, 107, 53, 0.45);
        }

        .sophia-confirmed-card {
          background: #ffffff;
          border-radius: 18px;
          border: 1px solid #86efac;
          overflow: hidden;
          width: 100%;
        }
        .confirmed-card-header {
          background: linear-gradient(135deg, #065f46 0%, #059669 100%);
          padding: 12px 14px;
          color: white;
        }

        /* ─── FOOTER & INPUT ─── */
        .sophia-chat-footer {
          padding: 12px 14px 14px;
          background: #ffffff;
          border-top: 1px solid #f1f5f9;
          flex-shrink: 0;
        }
        .sophia-listening-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #fef2f2;
          border: 1px solid #fecaca;
          padding: 6px 12px;
          border-radius: 12px;
        }
        .listening-pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 8px #ef4444;
          animation: ping-pulse 1s infinite;
        }
        .listening-waves {
          display: flex;
          align-items: flex-end;
          gap: 2px;
          height: 12px;
        }
        .l-bar {
          width: 2.5px;
          background: #ef4444;
          border-radius: 2px;
          animation: eq-jump 0.8s ease-in-out infinite alternate;
        }
        .l-bar:nth-child(1) { height: 4px; animation-delay: 0.1s; }
        .l-bar:nth-child(2) { height: 12px; animation-delay: 0.3s; }
        .l-bar:nth-child(3) { height: 7px; animation-delay: 0.2s; }
        .l-bar:nth-child(4) { height: 10px; animation-delay: 0.4s; }

        /* Quick Chips */
        .sophia-chips-scroll {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: none;
        }
        .sophia-chips-scroll::-webkit-scrollbar {
          display: none;
        }
        .sophia-quick-chip {
          border: 1px solid rgba(255, 107, 53, 0.4);
          background: #fffaf5;
          color: #c2410c;
          border-radius: 20px;
          padding: 4px 10px;
          font-size: 11.5px;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sophia-quick-chip:hover {
          background: #FF6B35;
          color: #ffffff;
          border-color: #FF6B35;
          transform: translateY(-1px);
        }

        /* Input Container */
        .sophia-input-container {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f1f5f9;
          border: 1.5px solid #e2e8f0;
          border-radius: 30px;
          padding: 3px 6px 3px 4px;
          transition: all 0.25s;
        }
        .sophia-input-container:focus-within {
          background: #ffffff;
          border-color: #FF6B35;
          box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.15);
        }
        .input-listening-active {
          border-color: #ef4444;
          background: #fef2f2;
        }
        .sophia-mic-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: transparent;
          color: #ea580c;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .sophia-mic-btn:hover {
          background: rgba(255, 107, 53, 0.15);
        }
        .mic-active-pulse {
          background: #ef4444 !important;
          color: #ffffff !important;
          animation: mic-ripple 1.2s infinite;
        }
        .sophia-text-input {
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
          font-size: 13px;
          color: #0f172a;
          padding: 6px 4px;
        }
        .sophia-send-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: #cbd5e1;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: not-allowed;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .send-btn-ready {
          background: linear-gradient(135deg, #FF6B35 0%, #FF9F1C 100%) !important;
          cursor: pointer !important;
          box-shadow: 0 3px 10px rgba(255, 107, 53, 0.35);
        }
        .send-btn-ready:hover {
          transform: scale(1.06);
        }

        /* ─── ANIMATIONS ─── */
        @keyframes avatar-gradient-spin {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes ping-pulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes mic-ripple {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes float-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes eq-jump {
          0% { height: 3px; }
          100% { height: 12px; }
        }
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        .teaser-fade-in {
          opacity: 1;
          transform: translateY(0);
          transition: all 0.4s ease;
          display: inline-block;
        }
        .teaser-fade-out {
          opacity: 0;
          transform: translateY(-6px);
          transition: all 0.4s ease;
          display: inline-block;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
      `}</style>
    </>
  );
}
