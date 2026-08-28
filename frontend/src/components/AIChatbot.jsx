import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User } from 'lucide-react';
import chatbotVideo from '../assets/aichatbot.mp4';
import { chatWithAI, API_BASE, createAiLead, updateAiLeadChat } from '../services/api';

const aiMessages = [
  "Hey, I am Maya",
  "Plan your Goa trip",
  "Need help booking?",
  "Rent a Car or Bike"
];

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [leadId, setLeadId] = useState(null);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(true);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const chatBodyRef = useRef(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let animationFrameId;

    const computeFrame = () => {
      if (video.paused || video.ended) return;
      if (video.videoWidth > 0 && canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = frame.data;
      const length = data.length;
      for (let i = 0; i < length; i += 4) {
        let r = data[i + 0];
        let g = data[i + 1];
        let b = data[i + 2];
        if (g > 100 && g > r * 1.2 && g > b * 1.2) {
          data[i + 3] = 0; 
        }
      }
      ctx.putImageData(frame, 0, 0);
      animationFrameId = requestAnimationFrame(computeFrame);
    };

    const handlePlay = () => computeFrame();
    video.addEventListener('play', handlePlay);
    if (!video.paused) computeFrame();

    return () => {
      video.removeEventListener('play', handlePlay);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

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

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    if (!leadName || !leadPhone) return;
    
    setShowLeadForm(false);
    
    // Save lead to DB
    try {
      const res = await createAiLead(leadName, leadPhone);
      if (res.success && res.id) {
        setLeadId(res.id);
      }
    } catch (err) {
      console.error('Failed to submit lead:', err);
    }
    
    setMessages([{ role: 'assistant', content: `Hi ${leadName}! I'm Maya, your AI travel expert for Goa. How can I help you customize a package, book a car, or find a luxury hotel today?` }]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    
    if (leadId) {
      updateAiLeadChat(leadId, newMessages).catch(console.error);
    }
    
    try {
      const replyText = await chatWithAI(newMessages);
      const updatedMessages = [...newMessages, { role: 'assistant', content: replyText }];
      setMessages(updatedMessages);
      if (leadId) {
        updateAiLeadChat(leadId, updatedMessages).catch(console.error);
      }
    } catch (err) {
      const errorMessages = [...newMessages, { role: 'assistant', content: "I'm having trouble connecting to my brain right now. Please try again later!" }];
      setMessages(errorMessages);
      if (leadId) {
        updateAiLeadChat(leadId, errorMessages).catch(console.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

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
          <video ref={videoRef} src={chatbotVideo} autoPlay loop muted playsInline crossOrigin="anonymous" style={{ opacity: 0, position: 'absolute', width: '1px', height: '1px', pointerEvents: 'none' }} />
          <canvas ref={canvasRef} className="head-movement" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ marginLeft: '12px', marginRight: '10px', fontSize: '15px', color: '#1a202c', transition: 'opacity 0.5s ease-in-out', opacity: fade ? 1 : 0, whiteSpace: 'nowrap' }}>
          {msgIndex === 0 ? <span>Hey, <strong style={{ color: '#6b46c1', fontSize: '16px' }}>I am Maya</strong></span> : <span style={{ fontWeight: '500' }}>{aiMessages[msgIndex]}</span>}
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
            <div className="rounded-circle bg-white d-flex align-items-center justify-content-center shadow-sm" style={{ width: '40px', height: '40px', fontSize: '20px' }}>🤖</div>
            <div>
              <h6 className="mb-0 fw-bold">Maya - Your Goa Expert</h6>
              <small style={{ opacity: 0.9 }}>Online | Powered by TripGalileo</small>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="btn btn-sm p-1 rounded-circle d-flex align-items-center justify-content-center hover-scale" style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.25)', color: 'white', border: 'none', backdropFilter: 'blur(4px)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div ref={chatBodyRef} className="flex-grow-1 p-3 overflow-auto" style={{ background: '#f8fafc', position: 'relative' }}>
          {showLeadForm ? (
            <div className="d-flex align-items-center justify-content-center h-100 position-absolute top-0 start-0 w-100" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(5px)', zIndex: 10 }}>
              <div className="bg-white p-4 rounded-3 border shadow-sm w-75 text-center">
                <h5 className="fw-bold text-dark mb-2">Welcome to Goa! 🌴</h5>
                <p className="text-muted small mb-4">Please enter your details to start chatting with Maya, our AI expert.</p>
                <form onSubmit={handleLeadSubmit}>
                  <input type="text" className="form-control mb-3" placeholder="Your Name" value={leadName} onChange={e => setLeadName(e.target.value)} required />
                  <input type="tel" className="form-control mb-3" placeholder="Mobile Number" value={leadPhone} onChange={e => setLeadPhone(e.target.value)} required />
                  <button type="submit" className="btn btn-amber-gradient w-100 rounded-pill fw-bold text-white shadow-sm">Start Chat</button>
                </form>
              </div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {messages.map((msg, idx) => (
                <div key={idx} className={`d-flex flex-column ${msg.role === 'user' ? 'align-items-end' : 'align-items-start'}`}>
                  <div className={`p-3 rounded-4 shadow-sm ${msg.role === 'user' ? 'text-white' : 'bg-white text-dark border'}`} style={{ maxWidth: '85%', background: msg.role === 'user' ? '#0B192C' : 'white', borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px', borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '16px', fontSize: '14px', lineHeight: '1.5' }}>
                    {msg.content}
                  </div>
                </div>
              ))}
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
            <div className="d-flex gap-2 overflow-auto pb-2 mb-2 custom-scrollbar">
              {['Self Drive Packages', 'Best beaches in North Goa', 'Rent a Thar'].map(suggestion => (
                <button key={suggestion} onClick={() => {setInput(suggestion); document.getElementById('ai-submit').click();}} className="btn btn-sm rounded-pill fw-bold text-nowrap" style={{ fontSize: '12px', border: '1px solid #FF6B35', color: '#FF6B35', background: 'transparent' }}>
                  {suggestion}
                </button>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="d-flex align-items-center gap-2 p-1 rounded-pill border" style={{ background: '#f1f5f9' }}>
              <input type="text" className="form-control border-0 bg-transparent shadow-none px-3" placeholder="Ask about Goa..." value={input} onChange={e => setInput(e.target.value)} disabled={isLoading} />
              <button id="ai-submit" type="submit" disabled={!input.trim() || isLoading} className="btn rounded-circle d-flex align-items-center justify-content-center p-0" style={{ width: '36px', height: '36px', minWidth: '36px', background: '#FF6B35', color: 'white', border: 'none' }}>
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>

      <style>{`
        .scale-0 { transform: scale(0); opacity: 0; }
        .scale-100 { transform: scale(1); opacity: 1; }
        .hover-scale:hover { transform: scale(1.1); transition: 0.2s; }
        
        .avatar-glow-container { box-shadow: 0 0 15px 5px rgba(11, 25, 44, 0.4); animation: blue-glow 2s infinite alternate; }
        @keyframes blue-glow { from { box-shadow: 0 0 10px 2px rgba(11, 25, 44, 0.4); } to { box-shadow: 0 0 20px 8px rgba(11, 25, 44, 0.7); } }
        
        .head-movement { animation: head-tilt 3s infinite ease-in-out; transform-origin: center bottom; }
        @keyframes head-tilt { 0% { transform: rotate(0deg); } 25% { transform: rotate(8deg); } 50% { transform: rotate(0deg); } 75% { transform: rotate(-8deg); } 100% { transform: rotate(0deg); } }
        
        @keyframes typing { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
        
        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>
    </>
  );
}
