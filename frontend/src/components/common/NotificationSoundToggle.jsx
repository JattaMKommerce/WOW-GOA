import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isSoundEnabled, toggleSound, subscribeSoundPref, playTestSound, setSoundEnabled } from '../../utils/notificationSound';

export default function NotificationSoundToggle({
  size = 13,
  variant = 'dark', // 'dark' (navy headers) or 'light' (white headers)
  className = ''
}) {
  const [enabled, setEnabled] = useState(isSoundEnabled());
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return subscribeSoundPref(setEnabled);
  }, []);

  // Clicking the speaker icon ALWAYS plays the notification sound preview
  const handlePlaySoundOnly = async (e) => {
    e.stopPropagation();
    setIsPlaying(true);
    if (!enabled) {
      setSoundEnabled(true);
      setEnabled(true);
    }
    await playTestSound();
    setTimeout(() => setIsPlaying(false), 500);
  };

  // Clicking ON/OFF toggles mute/unmute
  const handleToggleMute = async (e) => {
    e.stopPropagation();
    const next = toggleSound();
    setEnabled(next);
    if (next) {
      setIsPlaying(true);
      await playTestSound();
      setTimeout(() => setIsPlaying(false), 500);
    }
  };

  const isDark = variant === 'dark';

  return (
    <div
      className={`d-inline-flex align-items-center rounded-pill px-2 py-0.5 flex-shrink-0 ${className}`}
      style={{
        background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.10)'}`,
        gap: '4px',
        userSelect: 'none',
        lineHeight: 1
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* 1. Speaker Icon Button (Click to hear chime immediately!) */}
      <button
        type="button"
        onClick={handlePlaySoundOnly}
        className="btn btn-link p-0 text-decoration-none d-inline-flex align-items-center border-0"
        style={{
          color: isPlaying ? '#ffc107' : (enabled ? '#00B8D9' : '#94a3b8'),
          transition: 'all 0.15s ease',
          outline: 'none'
        }}
        title="Click to test notification sound"
        aria-label="Play sound test"
      >
        <Volume2 size={size} style={{ transform: isPlaying ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.15s' }} />
      </button>

      {/* Divider */}
      <span style={{ color: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)', fontSize: '0.62rem' }}>|</span>

      {/* 2. ON / OFF Text Toggle */}
      <button
        type="button"
        onClick={handleToggleMute}
        className="btn btn-link p-0 text-decoration-none d-inline-flex align-items-center border-0"
        style={{
          color: enabled ? '#00e676' : '#f87171',
          fontSize: '0.65rem',
          fontWeight: 800,
          letterSpacing: '0.2px',
          transition: 'all 0.15s ease',
          outline: 'none'
        }}
        title={enabled ? 'Sound is ON (Click to mute)' : 'Sound is MUTED (Click to unmute)'}
        aria-label={enabled ? 'Mute notification sound' : 'Unmute notification sound'}
      >
        {enabled ? (
          <span>ON</span>
        ) : (
          <span className="d-inline-flex align-items-center gap-0.5">
            <VolumeX size={10} /> OFF
          </span>
        )}
      </button>
    </div>
  );
}
