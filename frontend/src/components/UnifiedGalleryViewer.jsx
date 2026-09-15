import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2, Layers } from 'lucide-react';

/**
 * UnifiedGalleryViewer
 * A self-contained, responsive media gallery supporting:
 * 1. Fullscreen Modal Viewer (when onClose is provided or variant === 'modal')
 * 2. Compact View with Lightbox Zoom
 * 3. Bento Grid View
 *
 * Works seamlessly with Bootstrap 5, Tailwind CSS, or Vanilla CSS.
 */
export default function UnifiedGalleryViewer({
  images = [],
  item = null,
  title = '',
  type = '',
  variant = 'compact',
  alt = 'Gallery image',
  className = '',
  compactHeight = '180px',
  onClose = null
}) {
  // 1. Normalize input image list (from images prop OR item object)
  const normalizedImages = useMemo(() => {
    let list = [];
    if (images && (Array.isArray(images) ? images.length > 0 : Boolean(images))) {
      if (typeof images === 'string') {
        try {
          const parsed = JSON.parse(images);
          if (Array.isArray(parsed)) list = parsed;
          else list = [images];
        } catch {
          list = images.split(',').map(s => s.trim()).filter(Boolean);
        }
      } else if (Array.isArray(images)) {
        list = images;
      }
    } else if (item) {
      if (item.images_json) {
        try {
          const parsed = typeof item.images_json === 'string' ? JSON.parse(item.images_json) : item.images_json;
          if (Array.isArray(parsed)) list.push(...parsed);
        } catch (e) {}
      }
      if (Array.isArray(item.images)) list.push(...item.images);
      if (item.image) list.push(item.image);
      if (item.image_url) list.push(item.image_url);
      if (item.gallery) {
        if (Array.isArray(item.gallery)) list.push(...item.gallery);
        else if (typeof item.gallery === 'string') list.push(item.gallery);
      }
      if (Array.isArray(item.room_types)) {
        item.room_types.forEach(rt => {
          if (Array.isArray(rt.images)) list.push(...rt.images);
        });
      }
      if (Array.isArray(item.rooms)) {
        item.rooms.forEach(r => {
          if (Array.isArray(r.images)) list.push(...r.images);
        });
      }
    }

    const cleaned = list
      .map(entry => {
        if (!entry) return null;
        if (typeof entry === 'string') return entry.trim();
        if (typeof entry === 'object') return entry.url || entry.src || entry.image || null;
        return null;
      })
      .filter(Boolean);

    return cleaned.length > 0
      ? Array.from(new Set(cleaned))
      : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80'];
  }, [images, item]);

  // State
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  // Determine if this viewer is operating as a modal overlay
  const isModal = Boolean(onClose) || variant === 'modal';

  const total = normalizedImages.length;
  const currentMainImage = normalizedImages[activeIdx] || normalizedImages[0];
  const displayTitle = title || item?.name || item?.package_name || alt || 'Photo Gallery';

  // Handlers
  const prevImage = useCallback((e) => {
    if (e) e.stopPropagation();
    setActiveIdx((prev) => (prev - 1 + total) % total);
  }, [total]);

  const nextImage = useCallback((e) => {
    if (e) e.stopPropagation();
    setActiveIdx((prev) => (prev + 1) % total);
  }, [total]);

  const prevLightboxImage = useCallback((e) => {
    if (e) e.stopPropagation();
    setLightboxIdx((prev) => (prev - 1 + total) % total);
  }, [total]);

  const nextLightboxImage = useCallback((e) => {
    if (e) e.stopPropagation();
    setLightboxIdx((prev) => (prev + 1) % total);
  }, [total]);

  const openLightboxAt = useCallback((index) => {
    setLightboxIdx(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (lightboxOpen) closeLightbox();
        else if (onClose) onClose();
      }
      if (e.key === 'ArrowLeft') {
        if (lightboxOpen) prevLightboxImage();
        else if (isModal) prevImage();
      }
      if (e.key === 'ArrowRight') {
        if (lightboxOpen) nextLightboxImage();
        else if (isModal) nextImage();
      }
    };

    if (lightboxOpen || isModal) {
      window.addEventListener('keydown', handleKeyDown);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [lightboxOpen, isModal, onClose, closeLightbox, prevLightboxImage, nextLightboxImage, prevImage, nextImage]);

  // ─────────────────────────────────────────────────────────────
  // MODE 0: FULLSCREEN MODAL VIEWER (When onClose or variant === 'modal')
  // ─────────────────────────────────────────────────────────────
  if (isModal) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          backgroundColor: 'rgba(10, 15, 30, 0.96)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '16px',
          boxSizing: 'border-box'
        }}
      >
        {/* Header Bar */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
            paddingBottom: '12px',
            borderBottom: '1px solid rgba(255,255,255,0.12)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h5 style={{ margin: 0, color: '#ffffff', fontWeight: 'bold', fontSize: '18px' }}>
              {displayTitle}
            </h5>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(255,255,255,0.12)',
                color: '#fff',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              <Layers size={13} color="#f59e0b" />
              <span>Photo {activeIdx + 1} of {total}</span>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              aria-label="Close Gallery"
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.25)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#ef4444'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
            >
              <X size={22} />
            </button>
          )}
        </div>

        {/* Center Stage: Image Display with Contain (NEVER CROPPED) */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            flex: 1,
            width: '100%',
            maxWidth: '1200px',
            margin: '12px auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          {total > 1 && (
            <button
              type="button"
              aria-label="Previous photo"
              onClick={prevImage}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.4)',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(6px)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; e.currentTarget.style.backgroundColor = '#00B8D9'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.85)'; }}
            >
              <ChevronLeft size={28} />
            </button>
          )}

          <img
            src={currentMainImage}
            alt={`${alt} - ${activeIdx + 1}`}
            style={{
              maxWidth: '100%',
              maxHeight: '68vh',
              objectFit: 'contain',
              borderRadius: '12px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.85)',
              display: 'block',
              userSelect: 'none'
            }}
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80';
            }}
          />

          {total > 1 && (
            <button
              type="button"
              aria-label="Next photo"
              onClick={nextImage}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.4)',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(6px)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; e.currentTarget.style.backgroundColor = '#00B8D9'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.85)'; }}
            >
              <ChevronRight size={28} />
            </button>
          )}
        </div>

        {/* Bottom Thumbnail Strip & Navigation Hint */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {total > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                maxWidth: '100%',
                overflowX: 'auto',
                padding: '6px 12px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: '14px',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.12)'
              }}
            >
              {normalizedImages.map((img, i) => {
                const isActive = activeIdx === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveIdx(i)}
                    style={{
                      flexShrink: 0,
                      width: '64px',
                      height: '44px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      padding: 0,
                      border: isActive ? '2.5px solid #f59e0b' : '2px solid transparent',
                      opacity: isActive ? 1 : 0.5,
                      boxShadow: isActive ? '0 0 0 2px rgba(245,158,11,0.4)' : 'none',
                      cursor: 'pointer',
                      background: '#000',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </button>
                );
              })}
            </div>
          )}

          <div style={{ color: '#94a3b8', fontSize: '11px' }}>
            Use <strong>←</strong> <strong>→</strong> keys to navigate • Press <strong>ESC</strong> to close
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`unified-gallery-wrapper ${className}`} style={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
      {/* ─────────────────────────────────────────────────────────────
          MODE 1: COMPACT VIEW (For Vehicle Modals / Compact Cards)
      ────────────────────────────────────────────────────────────── */}
      {variant === 'compact' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          {/* Main Preview Container */}
          <div
            onClick={() => openLightboxAt(activeIdx)}
            style={{
              position: 'relative',
              width: '100%',
              height: compactHeight,
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#111827',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <img
              src={currentMainImage}
              alt={`${alt} - ${activeIdx + 1}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                transition: 'transform 0.3s ease'
              }}
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80';
              }}
            />

            {/* Subtle Gradient Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%, rgba(0,0,0,0.3) 100%)',
                pointerEvents: 'none'
              }}
            />

            {/* Top Bar: Expand Button */}
            <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 5 }}>
              <button
                type="button"
                aria-label="Expand image"
                onClick={(e) => {
                  e.stopPropagation();
                  openLightboxAt(activeIdx);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  backdropFilter: 'blur(4px)'
                }}
              >
                <Maximize2 size={13} />
              </button>
            </div>

            {/* Bottom-Right Count Badge */}
            {total > 1 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  zIndex: 5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: '#fff',
                  padding: '3px 8px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '600',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255,255,255,0.15)'
                }}
              >
                <Layers size={11} color="#f59e0b" />
                <span>{activeIdx + 1} / {total}</span>
              </div>
            )}

            {/* Navigation Arrows */}
            {total > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous photo"
                  onClick={prevImage}
                  style={{
                    position: 'absolute',
                    left: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.65)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={nextImage}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.65)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>

          {/* Clickable Thumbnail Strip */}
          {total > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                overflowX: 'auto',
                padding: '4px 2px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {normalizedImages.map((img, i) => {
                const isActive = activeIdx === i;
                return (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Thumbnail ${i + 1}`}
                    onClick={() => setActiveIdx(i)}
                    style={{
                      flexShrink: 0,
                      width: '54px',
                      height: '38px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      padding: 0,
                      border: isActive ? '2px solid #2563eb' : '2px solid transparent',
                      opacity: isActive ? 1 : 0.6,
                      boxShadow: isActive ? '0 0 0 2px rgba(37,99,235,0.3)' : 'none',
                      cursor: 'pointer',
                      background: '#000',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <img
                      src={img}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80';
                      }}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODE 2: BENTO GRID VIEW (For Hotel / Property Pages)
      ────────────────────────────────────────────────────────────── */}
      {variant === 'bento' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '8px',
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: '#0f172a',
            padding: '8px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          {/* Main Hero Column */}
          <div
            onClick={() => openLightboxAt(0)}
            style={{
              position: 'relative',
              height: '320px',
              gridColumn: 'span 2',
              borderRadius: '12px',
              overflow: 'hidden',
              cursor: 'pointer',
              backgroundColor: '#1e293b'
            }}
          >
            <img
              src={normalizedImages[0]}
              alt={`${alt} - Primary`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                backgroundColor: 'rgba(0,0,0,0.6)',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '600',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              Primary View
            </div>
          </div>

          {/* Secondary Stack */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '320px' }}>
            {[1, 2].map((slotIdx) => {
              const img = normalizedImages[slotIdx];
              if (!img) return null;
              return (
                <div
                  key={slotIdx}
                  onClick={() => openLightboxAt(slotIdx)}
                  style={{
                    flex: 1,
                    position: 'relative',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    backgroundColor: '#1e293b'
                  }}
                >
                  <img
                    src={img}
                    alt={`${alt} - ${slotIdx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              );
            })}
          </div>

          {/* Tertiary Stack with Overlay Trigger */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '320px' }}>
            {normalizedImages[3] && (
              <div
                onClick={() => openLightboxAt(3)}
                style={{
                  flex: 1,
                  position: 'relative',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  backgroundColor: '#1e293b'
                }}
              >
                <img
                  src={normalizedImages[3]}
                  alt={`${alt} - 4`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
            )}

            <div
              onClick={() => openLightboxAt(4 < total ? 4 : 0)}
              style={{
                flex: 1,
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                cursor: 'pointer',
                backgroundColor: '#1e293b'
              }}
            >
              <img
                src={normalizedImages[4] || normalizedImages[0]}
                alt={`${alt} - 5`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.65)',
                  backdropFilter: 'blur(3px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  textAlign: 'center',
                  padding: '8px'
                }}
              >
                <Layers size={20} color="#f59e0b" style={{ marginBottom: '4px' }} />
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>
                  {total > 5 ? `+${total - 4} More` : 'View All Photos'}
                </span>
                <span style={{ fontSize: '10px', color: '#cbd5e1' }}>{total} total</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          RESPONSIVE LIGHTBOX ZOOM OVERLAY (FOR COMPACT / BENTO MODES)
      ────────────────────────────────────────────────────────────── */}
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeLightbox}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box'
          }}
        >
          {/* Header Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '16px',
              left: '20px',
              right: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 10000
            }}
          >
            {/* Counter */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(255,255,255,0.12)',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              <Layers size={14} color="#f59e0b" />
              <span>{lightboxIdx + 1} of {total}</span>
            </div>

            {/* Close Button */}
            <button
              type="button"
              aria-label="Close Lightbox"
              onClick={closeLightbox}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.25)',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s ease'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Centered Responsive Container (NO SQUEEZING / NO CUTTING PHOTOS) */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '92vw',
              maxHeight: '76vh',
              borderRadius: '20px',
              overflow: 'hidden',
              backgroundColor: '#0a0a0a',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img
              src={normalizedImages[lightboxIdx]}
              alt={`${alt} zoom - ${lightboxIdx + 1}`}
              style={{
                maxWidth: '90vw',
                maxHeight: '74vh',
                objectFit: 'contain',
                display: 'block',
                userSelect: 'none'
              }}
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80';
              }}
            />

            {/* Lightbox Overlay Navigation Arrows */}
            {total > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous photo"
                  onClick={prevLightboxImage}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10001,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(13, 27, 46, 0.9)',
                    color: '#fff',
                    border: '2px solid rgba(255,255,255,0.65)',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#00B8D9';
                    e.currentTarget.style.borderColor = '#ffffff';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.12)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(13, 27, 46, 0.9)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.65)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  }}
                >
                  <ChevronLeft size={28} strokeWidth={2.8} />
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={nextLightboxImage}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10001,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(13, 27, 46, 0.9)',
                    color: '#fff',
                    border: '2px solid rgba(255,255,255,0.65)',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#00B8D9';
                    e.currentTarget.style.borderColor = '#ffffff';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.12)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(13, 27, 46, 0.9)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.65)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  }}
                >
                  <ChevronRight size={28} strokeWidth={2.8} />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnails */}
          {total > 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                marginTop: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                maxWidth: '540px',
                overflowX: 'auto',
                padding: '6px 12px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: '14px',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.12)'
              }}
            >
              {normalizedImages.map((img, i) => {
                const isActive = lightboxIdx === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightboxIdx(i)}
                    style={{
                      flexShrink: 0,
                      width: '60px',
                      height: '42px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      padding: 0,
                      border: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                      opacity: isActive ? 1 : 0.45,
                      boxShadow: isActive ? '0 0 0 2px rgba(59,130,246,0.5)' : 'none',
                      cursor: 'pointer',
                      background: '#000',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </button>
                );
              })}
            </div>
          )}

          {/* Navigation Hint */}
          <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '10px' }}>
            Use <strong>←</strong> <strong>→</strong> keys to navigate • Press <strong>ESC</strong> to close
          </div>
        </div>
      )}
    </div>
  );
}
