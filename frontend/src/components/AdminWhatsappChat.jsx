import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Check, CheckCheck, Clock, Search, MoreVertical, Paperclip, Smile, Settings, RotateCw, Filter, ChevronDown, ListFilter, Plus } from 'lucide-react';

export default function AdminWhatsappChat() {
  const [sessions, setSessions] = useState({});
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Poll for active sessions
  const fetchSessions = () => {
    const active = JSON.parse(localStorage.getItem('active_chat_sessions')) || {};
    setSessions(active);
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 3000);
    return () => clearInterval(interval);
  }, []);

  // Poll for messages of selected session
  const fetchMessages = () => {
    if (!selectedSessionId) return;
    const stored = JSON.parse(localStorage.getItem(`chat_${selectedSessionId}`)) || [];
    if (stored.length !== messages.length) {
      setMessages(stored);
      scrollToBottom();
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [selectedSessionId, messages.length]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedSessionId) return;

    const newMsg = {
      id: Date.now(),
      sender_type: 'admin',
      message: inputText.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedMsgs = [...messages, newMsg];
    setMessages(updatedMsgs);
    setInputText('');
    scrollToBottom();

    localStorage.setItem(`chat_${selectedSessionId}`, JSON.stringify(updatedMsgs));

    const active = JSON.parse(localStorage.getItem('active_chat_sessions')) || {};
    if (active[selectedSessionId]) {
      active[selectedSessionId].lastMessage = newMsg.message;
      active[selectedSessionId].lastTimestamp = newMsg.timestamp;
      localStorage.setItem('active_chat_sessions', JSON.stringify(active));
    }
  };

  const sessionEntries = Object.entries(sessions).sort((a, b) => new Date(b[1].lastTimestamp) - new Date(a[1].lastTimestamp));

  return (
    <div className="w-100" style={{ height: 'calc(100vh - 81px)', display: 'flex', overflow: 'hidden', padding: 0, margin: 0 }}>
      <div className="d-flex w-100 h-100">
        {/* Left Sidebar - Chat List (32%) */}
        <div className="border-end d-flex flex-column h-100" style={{ width: '32%', minWidth: '360px', maxWidth: '460px', backgroundColor: '#ffffff', borderColor: '#d1d7db' }}>
          <div className="p-3 py-4 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#f0f2f5', height: '60px' }}>
            <div className="d-flex align-items-center gap-2 text-dark">
              <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WA" width="28" />
              <h5 className="mb-0 fw-bold">WhatsApp</h5>
            </div>
            <div className="d-flex gap-3 text-muted">
              <Plus size={20} className="cursor-pointer" />
              <MoreVertical size={20} className="cursor-pointer" />
            </div>
          </div>
          <div className="p-2" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #f0f2f5' }}>
            <div className="input-group overflow-hidden" style={{ borderRadius: '8px', backgroundColor: '#f0f2f5' }}>
              <span className="input-group-text border-0 ps-3 text-muted" style={{ backgroundColor: 'transparent' }}><Search size={16} /></span>
              <input type="text" className="form-control border-0 shadow-none" placeholder="Search or start new chat" style={{ fontSize: '0.9rem', backgroundColor: 'transparent' }} />
              <span className="input-group-text border-0 pe-3 text-muted" style={{ backgroundColor: 'transparent' }}><ListFilter size={16} /></span>
            </div>
          </div>
          
          {/* Filters */}
          <div className="d-flex align-items-center gap-4 px-3 py-2 border-bottom fw-bold" style={{ fontSize: '0.85rem', color: '#667781', borderColor: '#f0f2f5' }}>
            <span className="cursor-pointer" style={{ color: '#008069', background: '#e7fce3', padding: '4px 12px', borderRadius: '16px' }}>All</span>
            <span className="cursor-pointer" style={{ background: '#f0f2f5', padding: '4px 12px', borderRadius: '16px' }}>Unread</span>
          </div>
          
          <div className="flex-grow-1 overflow-auto" style={{ backgroundColor: '#ffffff' }}>
            {sessionEntries.length === 0 ? (
              <div className="text-center p-5 text-muted small">No active customer chats.</div>
            ) : (
              sessionEntries.map(([sid, data]) => (
                  <div 
                  key={sid} 
                  className={`p-2 px-3 border-bottom d-flex align-items-center gap-3 cursor-pointer`}
                  onClick={() => { setSelectedSessionId(sid); setMessages([]); }}
                  style={{ 
                    cursor: 'pointer', 
                    backgroundColor: selectedSessionId === sid ? '#f0f2f5' : 'white',
                    height: '72px',
                    borderColor: '#f0f2f5'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = selectedSessionId === sid ? '#f0f2f5' : '#f5f6f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedSessionId === sid ? '#f0f2f5' : 'white'}
                >
                  <div className="rounded-circle d-flex align-items-center justify-content-center text-secondary" style={{ width: '49px', height: '49px', flexShrink: 0, backgroundColor: '#dfe5e7' }}>
                    <User size={24} color="#ffffff" />
                  </div>
                  <div className="flex-grow-1 overflow-hidden h-100 d-flex flex-column justify-content-center border-0">
                    <div className="d-flex justify-content-between align-items-start">
                      <h6 className="mb-0 text-dark text-truncate" style={{ fontSize: '1.05rem', color: '#111b21' }}>{data.customerName}</h6>
                      <small style={{ fontSize: '0.75rem', color: sid.includes('001') ? '#008069' : '#667781', marginTop: '2px' }}>
                        {new Date(data.lastTimestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </small>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-1">
                      <div className="text-truncate" style={{ fontSize: '0.85rem', color: '#667781' }}>{data.lastMessage}</div>
                      {sid.includes('001') && <span className="badge rounded-circle d-flex align-items-center justify-content-center" style={{ width: '20px', height: '20px', backgroundColor: '#00a884' }}>1</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Pane - Chat Window (68%) */}
        <div className="d-flex flex-column h-100 position-relative" style={{ width: '68%', flexGrow: 1 }}>
          {selectedSessionId ? (
            <>
              {/* Chat Header */}
              <div className="px-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#f0f2f5', height: '60px', borderBottom: '1px solid #d1d7db' }}>
                <div className="d-flex align-items-center gap-3 cursor-pointer">
                  <div className="rounded-circle d-flex align-items-center justify-content-center text-secondary" style={{ width: '40px', height: '40px', backgroundColor: '#dfe5e7' }}>
                    <User size={20} color="#ffffff" />
                  </div>
                  <div className="d-flex flex-column justify-content-center">
                    <span className="mb-0 text-dark" style={{ fontSize: '1rem', color: '#111b21', lineHeight: '21px' }}>{sessions[selectedSessionId]?.customerName}</span>
                    <span style={{ fontSize: '0.8rem', color: '#667781', lineHeight: '20px' }}>click here for contact info</span>
                  </div>
                </div>
                <div className="d-flex gap-4 text-muted">
                  <Search size={20} className="cursor-pointer" color="#54656f" />
                  <MoreVertical size={20} className="cursor-pointer" color="#54656f" />
                </div>
              </div>

              {/* Chat Messages */}
              <div 
                className="flex-grow-1 overflow-auto d-flex flex-column" 
                style={{ 
                  backgroundColor: '#efeae2', 
                  backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
                  backgroundSize: 'contain',
                  padding: '12px 8%'
                }}
              >
                <div className="text-center my-3">
                  <span className="px-3 py-1.5 rounded shadow-sm text-dark" style={{ fontSize: '0.75rem', backgroundColor: '#ffffff', color: '#54656f' }}>
                    TODAY
                  </span>
                </div>
                {messages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`p-2 rounded position-relative mb-2 ${msg.sender_type === 'admin' ? 'align-self-end' : 'align-self-start'}`}
                    style={{ 
                      maxWidth: '65%', 
                      backgroundColor: msg.sender_type === 'admin' ? '#d9fdd3' : '#ffffff',
                      fontSize: '0.9rem',
                      color: '#111b21',
                      boxShadow: '0 1px 0.5px rgba(11,20,26,.13)'
                    }}
                  >
                    <div style={{ paddingBottom: '12px', paddingRight: '40px', whiteSpace: 'pre-wrap', lineHeight: '19px' }}>{msg.message}</div>
                    <div className="position-absolute d-flex align-items-center gap-1" style={{ bottom: '4px', right: '8px', fontSize: '0.65rem', color: '#667781' }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      {msg.sender_type === 'admin' && <CheckCheck size={14} className="text-info" />}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="px-3 py-2 d-flex align-items-center gap-3 w-100" style={{ backgroundColor: '#f0f2f5', height: '62px' }}>
                <div className="d-flex gap-3 align-items-center" style={{ color: '#54656f' }}>
                  <Smile size={24} className="cursor-pointer" />
                  <Paperclip size={24} className="cursor-pointer" />
                </div>
                <form onSubmit={handleSend} className="d-flex flex-grow-1 m-0 align-items-center gap-3">
                  <input 
                    type="text" 
                    className="form-control border-0 px-3 py-2"
                    placeholder="Type a message"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    style={{ borderRadius: '8px', fontSize: '0.95rem', backgroundColor: '#ffffff', color: '#111b21', height: '42px' }}
                  />
                  {inputText.trim() ? (
                    <button 
                      type="submit" 
                      className="btn border-0 p-0 d-flex align-items-center justify-content-center"
                    >
                      <Send size={24} color="#54656f" />
                    </button>
                  ) : (
                    <div className="p-0 d-flex align-items-center justify-content-center" style={{ color: '#54656f' }}>
                      <Send size={24} className="opacity-50" />
                    </div>
                  )}
                </form>
              </div>
            </>
          ) : (
            <div className="d-flex flex-column justify-content-center align-items-center h-100 bg-light text-center">
              <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WA" width="120" className="mb-4 opacity-50" style={{ filter: 'grayscale(100%)' }} />
              <h3 className="fw-light text-muted mb-3">TripGalileo Web</h3>
              <p className="text-muted w-50">Select a customer chat from the left menu to start messaging. Messages sent here will appear instantly on the customer's screen.</p>
              <div className="mt-5 text-muted small d-flex align-items-center gap-2">
                <Clock size={16} /> End-to-end simulated encryption
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
