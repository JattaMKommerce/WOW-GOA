import React from 'react';

export default function Hero({ config }) {
  if (config && !config.visible) return null;

  return (
    <header className="hero-section" id="hero-banner" style={{ position: 'relative', overflow: 'hidden', background: 'none' }}>
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 1
        }}
      >
        <source src="/beach.mp4" type="video/mp4" />
      </video>

      <div className="container" style={{ position: 'relative', zIndex: 3, textAlign: 'left', marginTop: '-45px' }}>
        <div style={{ maxWidth: '620px' }}>
          <span className="hero-subtitle animate-fade-in" style={{ color: '#FF9F1C', letterSpacing: '5px', fontWeight: '950', fontSize: '13.5px', textTransform: 'uppercase', display: 'inline-block', marginBottom: '8px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            {config?.subtext?.split('.')[0] || 'Self Drive Holidays'}
          </span>
          <h1 className="hero-title animate-fade-in-up" style={{ fontSize: '64px', fontWeight: '950', color: '#ffffff', marginBottom: '16px', lineHeight: '1.05', letterSpacing: '-1.5px', textShadow: '0 4px 15px rgba(11, 25, 44, 0.6)' }}>
            {config?.heading || 'WOW GOA'}
          </h1>
          <p className="lead animate-fade-in-up mb-0" style={{ fontSize: '16.5px', lineHeight: '1.65', fontWeight: '600', color: 'rgba(255,255,255,0.95)', textShadow: '0 2px 12px rgba(11, 25, 44, 0.7)' }}>
            {config?.subtext || 'Discover Goa on your own terms. Rent premium, fully sanitized open cars, sports motorbikes, and luxury hotels. Instant approval. No hidden charges.'}
          </p>
        </div>
      </div>
    </header>
  );
}

