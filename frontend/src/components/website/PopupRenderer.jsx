import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function PopupRenderer({ popups = [], onAction }) {
  const [activePopupId, setActivePopupId] = useState(null);
  const [shownPopups, setShownPopups] = useState(new Set());

  useEffect(() => {
    // 1. Listen for programmatic triggers
    const handleOpenPopup = (e) => {
      setActivePopupId(e.detail);
      setShownPopups(prev => new Set(prev).add(e.detail));
    };
    window.addEventListener('open-builder-popup', handleOpenPopup);

    // 2. Setup automatic triggers
    const timeouts = [];
    const handleMouseLeave = (e) => {
      if (e.clientY <= 0) {
        const exitIntentPopup = popups.find(p => p.trigger === 'exit_intent' && !shownPopups.has(p.id));
        if (exitIntentPopup) {
          setActivePopupId(exitIntentPopup.id);
          setShownPopups(prev => new Set(prev).add(exitIntentPopup.id));
        }
      }
    };

    popups.forEach(popup => {
      if (shownPopups.has(popup.id)) return;
      
      if (popup.trigger === 'time_delay' && popup.delay > 0) {
        const t = setTimeout(() => {
          setActivePopupId(popup.id);
          setShownPopups(prev => new Set(prev).add(popup.id));
        }, popup.delay * 1000);
        timeouts.push(t);
      }
      
      if (popup.trigger === 'exit_intent') {
        document.addEventListener('mouseleave', handleMouseLeave);
      }
    });

    return () => {
      window.removeEventListener('open-builder-popup', handleOpenPopup);
      document.removeEventListener('mouseleave', handleMouseLeave);
      timeouts.forEach(clearTimeout);
    };
  }, [popups, shownPopups]);

  if (!activePopupId) return null;
  const popup = popups.find(p => p.id === activePopupId);
  if (!popup) return null;

  const content = popup.content || {};
  const style = popup.style || {};

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: style.overlayColor || 'rgba(0,0,0,0.6)',
      padding: '24px', animation: 'fadeIn 0.3s'
    }}>
      <div style={{
        background: style.background || '#fff',
        width: '100%', maxWidth: `${style.width || 400}px`,
        borderRadius: '16px', position: 'relative',
        boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Close Button */}
        <button
          onClick={() => setActivePopupId(null)}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'rgba(0,0,0,0.05)', border: 'none',
            width: '32px', height: '32px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 10, color: '#64748b'
          }}
        >
          <X size={16} />
        </button>

        <div style={{ padding: '40px 32px', textAlign: 'center' }}>
          {content.heading && (
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0D1B2E', marginBottom: '12px' }}>
              {content.heading}
            </h2>
          )}
          {content.subheading && (
            <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
              {content.subheading}
            </p>
          )}
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            {content.buttonText && (
              <button
                onClick={() => {
                  if(onAction && popup.buttonAction) {
                    onAction(popup.buttonAction, {
                      url: popup.buttonUrl,
                      phone: popup.buttonPhone,
                      email: popup.buttonEmail,
                      fileUrl: popup.buttonFileUrl
                    });
                  }
                  setActivePopupId(null);
                }}
                style={{
                  padding: '14px 28px', background: 'linear-gradient(135deg, #FF6333, #FF8A00)',
                  color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px',
                  fontWeight: 700, cursor: 'pointer', width: '100%'
                }}
              >
                {content.buttonText}
              </button>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
}
