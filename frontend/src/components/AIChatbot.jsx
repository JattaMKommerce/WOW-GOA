import React, { useState, useEffect, useRef } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import chatbotAvatar from '../assets/aichatbot.webp';
import chatbotAnimationVideo from '../assets/chatbot-animation.mp4';

const aiMessages = [
  "Plan Your Goa Trip",
  "Need Help? Ask Sophia",
  "Let’s Explore Goa",
  "Welcome to Goa! 🌴"
];

export default function AIChatbot() {
  const [isChatbotEnabled, setIsChatbotEnabled] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [hasEnteredChat, setHasEnteredChat] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [validationError, setValidationError] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [msgIndex, setMsgIndex] = useState(0);
  const [fade, setFade] = useState(true);

  const avatarVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const chatBodyRef = useRef(null);

  // Load Kratu AI Chat Widget script once user passes Name + Mobile entry
  useEffect(() => {
    if (!hasEnteredChat) return;

    const SCRIPT_URL = 'https://iamkratu.ai/customer-chat/widget.js';
    const DATA_KEY = '729298e2e92cfc51cce54b9766a30b52';

    // Prevent duplicate script injection
    if (document.querySelector(`script[src="${SCRIPT_URL}"]`)) {
      return;
    }

    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.setAttribute('data-key', DATA_KEY);
    script.async = true;

    script.onload = () => {
      console.log('[Sophia] Kratu AI Chat Widget script loaded successfully.');
    };

    script.onerror = (err) => {
      console.error('[Sophia] Failed to load Kratu AI Chat Widget script:', err);
    };

    document.body.appendChild(script);
  }, [hasEnteredChat]);

  // Listen to external open_ai_chat custom event
  useEffect(() => {
    const handleOpenAIChat = () => setIsOpen(true);
    window.addEventListener('open_ai_chat', handleOpenAIChat);
    return () => window.removeEventListener('open_ai_chat', handleOpenAIChat);
  }, []);

  // Listen to admin toggle event
  useEffect(() => {
    const handleToggleEvent = (e) => {
      if (e?.detail && typeof e.detail.enabled !== 'undefined') {
        setIsChatbotEnabled(Boolean(e.detail.enabled));
      }
    };
    window.addEventListener('ai_chatbot_toggled', handleToggleEvent);
    return () => window.removeEventListener('ai_chatbot_toggled', handleToggleEvent);
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

          // Clear outer edges & background floating dust particles outside robot silhouette
          if (px < cw * 0.055 || px > cw * 0.93 || py < ch * 0.04 || (px > cw * 0.77 && py > ch * 0.64)) {
            data[idx + 3] = 0;
            continue;
          }

          const normX = px / cw;
          const normY = py / ch;
          // Protect natural black eyes and pupils from being keyed out
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

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, hasEnteredChat]);

  // Handle entry screen submission (Frontend state only - NO API/backend/database)
  const handleEnterChatbot = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setValidationError('');

    const cleanName = name.trim();
    const cleanMobile = mobile.replace(/\D/g, '');

    if (!cleanName) {
      setValidationError('Please enter your name.');
      return;
    }

    if (!cleanMobile || cleanMobile.length < 10) {
      setValidationError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setHasEnteredChat(true);
    setMessages([
      {
        role: 'assistant',
        content: `Hi ${cleanName}! 👋 I'm Sophia, your personal AI Goa Concierge.\n\nHow can I help you today?`
      }
    ]);
  };

  // Handle message sending in chat (Frontend state only - Ready for future Kratu integration)
  const handleSendMessage = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setInput('');
  };

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
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-4px);
          }
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

        /* 3. Glowing Green Status Indicator Dot with Pulse */
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
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6);
          }
          70% {
            box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
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
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        /* Enlarged & Centered Blue Aura Glow behind character */
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

        /* 5. Canvas with Ultra-Sharp Display Resolution */
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

        /* 6. Mobile Responsiveness */
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
        className="position-fixed shadow-lg rounded-4 overflow-hidden transition-all bg-white d-flex flex-column"
        style={{
          bottom: isOpen ? '20px' : '-600px',
          right: '20px',
          width: '380px',
          height: '600px',
          maxWidth: 'calc(100vw - 40px)',
          maxHeight: 'calc(100vh - 40px)',
          zIndex: 1050,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'all' : 'none',
          border: '1px solid rgba(0,0,0,0.1)',
        }}
      >
        {/* Header */}
        <div 
          className="d-flex align-items-center justify-content-between p-3" 
          style={{ background: 'linear-gradient(135deg, #FF6B35, #FF9F1C)', color: 'white' }}
        >
          <div className="d-flex align-items-center gap-2">
            <div 
              className="rounded-circle bg-white d-flex align-items-center justify-content-center shadow-sm overflow-hidden" 
              style={{ width: '40px', height: '40px' }}
            >
              <img src={chatbotAvatar} alt="Sophia" style={{ width: '92%', height: '92%', objectFit: 'contain' }} />
            </div>
            <div>
              <h6 className="mb-0 fw-bold" style={{ fontSize: '15px' }}>I'm Sophia - Your Goa Expert</h6>
              <small style={{ opacity: 0.9, fontSize: '12px' }}>Online | Powered by TripGalileo</small>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setIsOpen(false)} 
            className="btn btn-sm p-1 rounded-circle d-flex align-items-center justify-content-center" 
            style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.25)', color: 'white', border: 'none' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div ref={chatBodyRef} className="flex-grow-1 p-3 overflow-auto" style={{ background: '#f8fafc', position: 'relative' }}>
          {!hasEnteredChat ? (
            /* STEP 2 — Welcome / Entry Screen: Name + Mobile Number */
            <div className="d-flex align-items-center justify-content-center h-100 p-2">
              <div className="bg-white p-4 rounded-4 border shadow-sm w-100 text-center" style={{ maxWidth: '320px' }}>
                <div 
                  className="mb-3 d-inline-flex align-items-center justify-content-center rounded-circle shadow-sm" 
                  style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #fff7ed, #ffedd5)' }}
                >
                  <img src={chatbotAvatar} alt="Sophia" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
                </div>
                
                <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '17px' }}>Hi, I'm Sophia 👋</h5>
                <p className="text-muted small mb-4">Let's get started</p>
                
                <form onSubmit={handleEnterChatbot} className="text-start">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary mb-1" style={{ fontSize: '12px' }}>Name</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm rounded-3 py-2 px-3" 
                      placeholder="Enter your name" 
                      value={name} 
                      onChange={e => {
                        setName(e.target.value);
                        if (validationError) setValidationError('');
                      }} 
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary mb-1" style={{ fontSize: '12px' }}>Mobile Number</label>
                    <input 
                      type="tel" 
                      className="form-control form-control-sm rounded-3 py-2 px-3" 
                      placeholder="Enter your mobile number" 
                      maxLength={10}
                      value={mobile} 
                      onChange={e => {
                        setMobile(e.target.value.replace(/\D/g, '').slice(0, 10));
                        if (validationError) setValidationError('');
                      }} 
                    />
                  </div>

                  {validationError && (
                    <div className="alert alert-danger py-1 px-2 mb-3 d-flex align-items-center gap-1 border-0 shadow-sm" style={{ fontSize: '11px', background: '#fef2f2', color: '#b91c1c' }}>
                      <AlertCircle size={14} className="flex-shrink-0" />
                      <span>{validationError}</span>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="btn w-100 rounded-pill fw-bold text-white shadow-sm py-2 mt-1" 
                    style={{ 
                      background: 'linear-gradient(135deg, #FF6B35, #FF9F1C)', 
                      border: 'none',
                      fontSize: '14px'
                    }}
                  >
                    Enter Chatbot
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* STEP 3 — Normal Sophia Chatbot UI (Empty / Ready for Kratu) */
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
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer — Chat Input Area (Shown only after entering chatbot) */}
        {hasEnteredChat && (
          <div className="p-3 bg-white border-top">
            <form onSubmit={handleSendMessage} className="d-flex align-items-center gap-2 p-1 rounded-pill border" style={{ background: '#f1f5f9', borderColor: '#e2e8f0' }}>
              <input 
                type="text" 
                className="form-control border-0 bg-transparent shadow-none px-3" 
                placeholder="Ask Sophia..." 
                value={input} 
                onChange={e => setInput(e.target.value)} 
              />
              <button 
                id="ai-submit" 
                type="submit" 
                disabled={!input.trim()} 
                className="btn rounded-circle d-flex align-items-center justify-content-center p-0" 
                style={{ width: '36px', height: '36px', minWidth: '36px', background: '#FF6B35', color: 'white', border: 'none' }}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
