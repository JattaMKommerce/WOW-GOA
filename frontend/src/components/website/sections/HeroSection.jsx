import React from 'react';

// ─── HERO SECTION ────────────────────────────────────────────────────────────
// Full-width hero banner with heading, subheading, CTA button
// Supports: solid color, gradient, image background, video background
export default function HeroSection({ section, liveData = {}, onAction }) {
  const p = section.props || {};
  const s = section.style || {};

  const getBackground = () => {
    if (p.backgroundType === 'image' && p.backgroundImage) {
      return {
        backgroundImage: `url(${p.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    if (p.backgroundType === 'gradient') {
      return {
        background: `linear-gradient(135deg, ${p.gradientFrom || '#0D1B2E'} 0%, ${p.gradientTo || '#1a3a5c'} 100%)`
      };
    }
    return { backgroundColor: p.backgroundColor || '#0D1B2E' };
  };

  const minHeight = p.minHeight || 600;
  const textAlign = p.textAlign || 'center';

  return (
    <section
      style={{
        position: 'relative',
        minHeight: `${minHeight}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
        overflow: 'hidden',
        ...getBackground(),
        ...s
      }}
    >
      {/* Overlay */}
      {p.showOverlay && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `rgba(0,0,0,${p.overlayOpacity || 0.5})`,
          zIndex: 1
        }} />
      )}

      {/* Parallax / Video BG */}
      {p.backgroundType === 'video' && p.videoUrl && (
        <video
          autoPlay muted loop playsInline
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
        >
          <source src={p.videoUrl} type="video/mp4" />
        </video>
      )}

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 2,
        textAlign,
        padding: '60px 24px',
        maxWidth: '900px',
        width: '100%'
      }}>
        {p.badge && (
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,99,51,0.9)',
            color: '#fff',
            padding: '6px 16px',
            borderRadius: '100px',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '20px',
            letterSpacing: '0.5px'
          }}>
            {p.badge}
          </div>
        )}

        <h1 style={{
          fontSize: p.headingSize ? `${p.headingSize}px` : 'clamp(36px, 7vw, 72px)',
          fontWeight: 800,
          color: p.headingColor || '#ffffff',
          lineHeight: 1.1,
          marginBottom: '20px',
          letterSpacing: '-1px'
        }}>
          {p.heading || 'Your Journey Begins Here'}
        </h1>

        {p.subheading && (
          <p style={{
            fontSize: p.subheadingSize ? `${p.subheadingSize}px` : '18px',
            color: p.subheadingColor || 'rgba(255,255,255,0.85)',
            lineHeight: 1.6,
            marginBottom: '36px',
            maxWidth: '700px',
            margin: textAlign === 'center' ? '0 auto 36px' : '0 0 36px'
          }}>
            {p.subheading}
          </p>
        )}

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
          flexWrap: 'wrap'
        }}>
          {p.buttonText && (
            <button
              onClick={() => onAction && onAction(p.buttonAction || 'scroll', {
                url: p.Url, phone: p.Phone, email: p.Email, fileUrl: p.FileUrl, popupId: p.PopupId
              })}
              style={{
                padding: '14px 36px',
                background: 'linear-gradient(135deg, #FF6333, #FF8A00)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 20px rgba(255,99,51,0.4)'
              }}
            >
              {p.buttonText}
            </button>
          )}
          {p.secondaryButtonText && (
            <button
              onClick={() => onAction && onAction(p.secondaryButtonAction || 'scroll', {
                url: p.secondaryUrl, phone: p.secondaryPhone, email: p.secondaryEmail, fileUrl: p.secondaryFileUrl, popupId: p.secondaryPopupId
              })}
              style={{
                padding: '14px 36px',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: '2px solid rgba(255,255,255,0.4)',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                backdropFilter: 'blur(10px)'
              }}
            >
              {p.secondaryButtonText}
            </button>
          )}
        </div>

        {/* Stats strip */}
        {p.showStats && p.stats && (
          <div style={{
            display: 'flex',
            gap: '40px',
            justifyContent: textAlign === 'center' ? 'center' : 'flex-start',
            marginTop: '48px',
            flexWrap: 'wrap'
          }}>
            {p.stats.map((stat, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#FF6333' }}>{stat.value}</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
