import React, { useState } from 'react';
import * as api from '../../../services/api';

// ─── FEATURES / WHY CHOOSE US SECTION ────────────────────────────────────────
export function FeaturesSection({ section, liveData, onAction }) {
  const p = section.props || {};
  const s = section.style || {};
  const primary = p.primaryColor || 'var(--wb-primary, #FF6333)';

  const defaultFeatures = [
    { icon: '🛡️', title: 'Trusted & Verified', desc: 'All hotels, vehicles and packages are verified by our expert team before listing.' },
    { icon: '💳', title: 'Secure Payments', desc: 'Your transactions are protected with bank-level encryption and fraud protection.' },
    { icon: '🌟', title: 'Premium Quality', desc: 'Only the finest hotels and vehicles make it to our curated marketplace.' },
    { icon: '📞', title: '24/7 Support', desc: 'Our dedicated travel experts are available round the clock to assist you.' },
    { icon: '💰', title: 'Best Price Guarantee', desc: 'Find a lower price? We\'ll match it. No questions asked.' },
    { icon: '🔄', title: 'Easy Cancellations', desc: 'Flexible booking policies with hassle-free cancellations and refunds.' }
  ];

  const features = (p.features && p.features.length > 0) ? p.features : defaultFeatures;

  return (
    <section style={{ padding: p.padding || '80px 24px', background: p.sectionBg || '#fff', ...s }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: p.textAlign || 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: '#0D1B2E', marginBottom: '14px' }}>
            {p.heading || 'Why Choose Us?'}
          </h2>
          {p.subheading && <p style={{ fontSize: '17px', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>{p.subheading}</p>}
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: p.columns === 2 ? 'repeat(2, 1fr)' : p.columns === 4 ? 'repeat(4, 1fr)' : 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '28px'
        }}>
          {features.map((f, i) => (
            <FeatureCard key={i} feature={f} primary={primary} style={p.cardStyle || 'shadow'} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, primary, style }) {
  const cardStyles = {
    shadow: { background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', border: 'none' },
    bordered: { background: '#fff', boxShadow: 'none', border: '1.5px solid #e2e8f0' },
    filled: { background: '#f8fafc', boxShadow: 'none', border: 'none' },
    gradient: { background: 'linear-gradient(135deg, #fff8f5, #fff)', boxShadow: '0 4px 24px rgba(255,99,51,0.08)', border: `1px solid rgba(255,99,51,0.1)` }
  };

  return (
    <div style={{
      padding: '28px', borderRadius: '16px',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      ...(cardStyles[style] || cardStyles.shadow)
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ fontSize: '36px', marginBottom: '16px' }}>{feature.icon}</div>
      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0D1B2E', marginBottom: '10px' }}>{feature.title}</h3>
      <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>{feature.desc}</p>
    </div>
  );
}

// ─── TESTIMONIALS SECTION ─────────────────────────────────────────────────────
export function TestimonialsSection({ section, liveData, onAction }) {
  const p = section.props || {};
  const s = section.style || {};
  const primary = p.primaryColor || 'var(--wb-primary, #FF6333)';

  // Uses LIVE customer reviews from booking system
  const liveTestimonials = liveData.reviews || liveData.testimonials || [];

  const defaultTestimonials = [
    { name: 'Rahul Sharma', rating: 5, review: 'Absolutely amazing experience! The hotel was top-notch and the service was excellent. Will definitely book again.', location: 'Mumbai', avatar: '' },
    { name: 'Priya Patel', rating: 5, review: 'Best trip ever! The self-drive car was in perfect condition and the prices were very reasonable.', location: 'Ahmedabad', avatar: '' },
    { name: 'Arjun Mehta', rating: 5, review: 'The package was exactly as described. Great itinerary, comfortable stay, and friendly support team.', location: 'Delhi', avatar: '' }
  ];

  const items = liveTestimonials.length > 0 ? liveTestimonials : defaultTestimonials;
  const [active, setActive] = useState(0);

  return (
    <section style={{ padding: p.padding || '80px 24px', background: p.sectionBg || '#0D1B2E', ...s }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
          {p.heading || 'What Our Customers Say'}
        </h2>
        {p.subheading && <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '48px', fontSize: '16px' }}>{p.subheading}</p>}

        {/* Active testimonial */}
        <div style={{
          background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '24px', padding: '48px', marginBottom: '32px'
        }}>
          <div style={{ fontSize: '48px', color: primary, marginBottom: '16px', fontFamily: 'Georgia, serif', lineHeight: 1 }}>"</div>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)', lineHeight: 1.8, marginBottom: '24px', fontStyle: 'italic' }}>
            {items[active]?.review || items[active]?.comment}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: `linear-gradient(135deg, ${primary}, #FF8A00)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: '18px'
            }}>
              {(items[active]?.name || 'U')[0]}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, color: '#fff' }}>{items[active]?.name}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                {'⭐'.repeat(items[active]?.rating || 5)} · {items[active]?.location}
              </div>
            </div>
          </div>
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          {items.map((_, i) => (
            <button key={i} onClick={() => setActive(i)} style={{
              width: i === active ? '28px' : '10px', height: '10px',
              borderRadius: '100px', border: 'none', cursor: 'pointer',
              background: i === active ? primary : 'rgba(255,255,255,0.3)',
              transition: 'all 0.3s ease'
            }} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA SECTION ──────────────────────────────────────────────────────────────
export function CTASection({ section, liveData, onAction }) {
  const p = section.props || {};
  const s = section.style || {};
  const primary = p.primaryColor || 'var(--wb-primary, #FF6333)';

  return (
    <section style={{
      padding: p.padding || '80px 24px',
      background: p.sectionBg || `linear-gradient(135deg, ${primary} 0%, #FF8A00 100%)`,
      textAlign: 'center', ...s
    }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        {p.badge && (
          <div style={{
            display: 'inline-block', background: 'rgba(255,255,255,0.2)',
            color: '#fff', padding: '6px 16px', borderRadius: '100px',
            fontSize: '13px', fontWeight: 600, marginBottom: '20px'
          }}>{p.badge}</div>
        )}
        <h2 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, color: '#fff', marginBottom: '16px', lineHeight: 1.2 }}>
          {p.heading || 'Ready to Start Your Journey?'}
        </h2>
        {p.subheading && (
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: '36px' }}>
            {p.subheading}
          </p>
        )}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {p.primaryBtnText && (
            <button onClick={() => onAction && onAction(p.primaryBtnAction || 'scroll-to-search', {
              url: p.primaryBtnUrl, phone: p.primaryBtnPhone, email: p.primaryBtnEmail, fileUrl: p.primaryBtnFileUrl, popupId: p.primaryBtnPopupId
            })} style={{
              padding: '16px 40px', background: '#fff', color: primary,
              border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
            }}>{p.primaryBtnText}</button>
          )}
          {p.secondaryBtnText && (
            <button onClick={() => onAction && onAction(p.secondaryBtnAction || 'scroll-to-search', {
              url: p.secondaryBtnUrl, phone: p.secondaryBtnPhone, email: p.secondaryBtnEmail, fileUrl: p.secondaryBtnFileUrl, popupId: p.secondaryBtnPopupId
            })} style={{
              padding: '16px 40px', background: 'rgba(255,255,255,0.15)',
              color: '#fff', border: '2px solid rgba(255,255,255,0.4)',
              borderRadius: '10px', fontSize: '16px', fontWeight: 600, cursor: 'pointer'
            }}>{p.secondaryBtnText}</button>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ SECTION ──────────────────────────────────────────────────────────────
export function FAQSection({ section, liveData, onAction }) {
  const p = section.props || {};
  const s = section.style || {};
  const primary = p.primaryColor || 'var(--wb-primary, #FF6333)';
  const [open, setOpen] = useState(null);

  const defaultFAQs = [
    { q: 'How do I make a booking?', a: 'Simply search for your desired hotel, vehicle, or package, select your dates, and complete the booking form. You\'ll receive instant confirmation.' },
    { q: 'Can I cancel or modify my booking?', a: 'Yes, you can cancel or modify bookings from your customer dashboard. Cancellation policies vary by property and vehicle.' },
    { q: 'What payment methods are accepted?', a: 'We accept all major credit/debit cards, UPI, net banking, and cash payments at select locations.' },
    { q: 'Is there a 24/7 customer support?', a: 'Yes! Our support team is available 24/7 via phone, WhatsApp, and email to assist you.' },
    { q: 'Are the listed prices inclusive of taxes?', a: 'Prices shown may be exclusive of taxes and service charges. The final amount including all charges will be shown before payment.' }
  ];

  const faqs = liveData.faqs?.length > 0 ? liveData.faqs : (p.faqs?.length > 0 ? p.faqs : defaultFAQs);

  return (
    <section style={{ padding: p.padding || '80px 24px', background: p.sectionBg || '#f8fafc', ...s }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: p.textAlign || 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: '#0D1B2E', marginBottom: '12px' }}>
            {p.heading || 'Frequently Asked Questions'}
          </h2>
          {p.subheading && <p style={{ color: '#64748b', fontSize: '16px' }}>{p.subheading}</p>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: '12px',
              border: open === i ? `1.5px solid ${primary}` : '1.5px solid #e2e8f0',
              overflow: 'hidden', transition: 'all 0.2s'
            }}>
              <button onClick={() => setOpen(open === i ? null : i)} style={{
                width: '100%', padding: '20px 24px', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left'
              }}>
                <span style={{ fontWeight: 600, fontSize: '15px', color: '#0D1B2E', flex: 1 }}>{faq.q || faq.question}</span>
                <span style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: open === i ? primary : '#f1f5f9', color: open === i ? '#fff' : '#64748b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', flexShrink: 0, transition: 'all 0.2s', marginLeft: '12px'
                }}>
                  {open === i ? '−' : '+'}
                </span>
              </button>
              {open === i && (
                <div style={{ padding: '0 24px 20px', fontSize: '14px', color: '#64748b', lineHeight: 1.7 }}>
                  {faq.a || faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CONTACT FORM SECTION ─────────────────────────────────────────────────────
export function ContactFormSection({ section, liveData, onAction }) {
  const p = section.props || {};
  const s = section.style || {};
  const primary = p.primaryColor || 'var(--wb-primary, #FF6333)';
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    onAction && onAction('contact-form-submit', form);
    setSent(true);
    try {
      await api.createLead({
        name: form.name,
        email: form.email,
        phone: form.phone || '',
        source: 'Contact Us',
        service: form.subject || 'Website Inquiry',
        notes: form.message || ''
      });
      window.dispatchEvent(new CustomEvent('realtime-lead-created'));
    } catch (err) {
      console.warn('Contact lead save error:', err);
    }
    setTimeout(() => setSent(false), 3000);
    setForm({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  return (
    <section style={{ padding: p.padding || '80px 24px', background: p.sectionBg || '#fff', ...s }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: p.textAlign || 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: '#0D1B2E', marginBottom: '12px' }}>
            {p.heading || 'Get In Touch'}
          </h2>
          {p.subheading && <p style={{ color: '#64748b', fontSize: '16px' }}>{p.subheading}</p>}
        </div>

        <form onSubmit={handleSubmit} style={{
          background: '#f8fafc', borderRadius: '24px', padding: '40px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <FormInput label="Full Name" placeholder="Your full name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required />
            <FormInput label="Email" placeholder="your@email.com" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} required />
            <FormInput label="Phone" placeholder="+91 9876543210" type="tel" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
            <FormInput label="Subject" placeholder="How can we help?" value={form.subject} onChange={v => setForm(f => ({ ...f, subject: v }))} />
          </div>
          <FormInput label="Message" placeholder="Tell us about your travel plans..." value={form.message} onChange={v => setForm(f => ({ ...f, message: v }))} multiline rows={5} />
          <button type="submit" style={{
            marginTop: '20px', width: '100%', padding: '14px',
            background: `linear-gradient(135deg, ${primary}, #FF8A00)`,
            color: '#fff', border: 'none', borderRadius: '10px',
            fontSize: '16px', fontWeight: 700, cursor: 'pointer'
          }}>
            {sent ? '✅ Message Sent!' : (p.submitText || 'Send Message')}
          </button>
        </form>
      </div>
    </section>
  );
}

function FormInput({ label, placeholder, value, onChange, type = 'text', required, multiline, rows }) {
  const inputStyle = {
    width: '100%', padding: '12px 14px',
    border: '1.5px solid #e2e8f0', borderRadius: '10px',
    fontSize: '14px', color: '#0D1B2E', background: '#fff',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
    resize: multiline ? 'vertical' : 'none'
  };
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
        {label}{required && ' *'}
      </label>
      {multiline
        ? <textarea rows={rows} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} style={inputStyle} />
        : <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} style={inputStyle} required={required} />
      }
    </div>
  );
}

// ─── TEAM SECTION ─────────────────────────────────────────────────────────────
export function TeamSection({ section, liveData, onAction }) {
  const p = section.props || {};
  const s = section.style || {};
  const primary = p.primaryColor || 'var(--wb-primary, #FF6333)';

  const members = p.team || [
    { name: 'Rajesh Kumar', role: 'CEO & Founder', image: '', bio: 'Travel enthusiast with 15 years in the tourism industry.' },
    { name: 'Priya Singh', role: 'Head of Operations', image: '', bio: 'Expert in luxury travel curation and customer experience.' },
    { name: 'Amit Verma', role: 'Chief Technology Officer', image: '', bio: 'Building seamless travel technology for a decade.' }
  ];

  return (
    <section style={{ padding: p.padding || '80px 24px', background: p.sectionBg || '#f8fafc', ...s }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: '#0D1B2E', marginBottom: '12px' }}>{p.heading || 'Meet Our Team'}</h2>
          {p.subheading && <p style={{ color: '#64748b', fontSize: '16px' }}>{p.subheading}</p>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '28px' }}>
          {members.map((m, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: '20px', padding: '32px 24px',
              textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
              transition: 'transform 0.3s'
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px',
                background: m.image ? `url(${m.image}) center/cover` : `linear-gradient(135deg, ${primary}, #FF8A00)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', fontWeight: 700, color: '#fff'
              }}>
                {!m.image && m.name[0]}
              </div>
              <div style={{ fontWeight: 700, fontSize: '18px', color: '#0D1B2E', marginBottom: '4px' }}>{m.name}</div>
              <div style={{ fontSize: '13px', color: primary, fontWeight: 600, marginBottom: '12px' }}>{m.role}</div>
              {m.bio && <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>{m.bio}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── COUNTER / STATS SECTION ──────────────────────────────────────────────────
export function CounterSection({ section, liveData, onAction }) {
  const p = section.props || {};
  const s = section.style || {};
  const primary = p.primaryColor || 'var(--wb-primary, #FF6333)';

  const stats = p.stats || [
    { value: '10,000+', label: 'Happy Customers' },
    { value: '500+', label: 'Hotels & Resorts' },
    { value: '200+', label: 'Vehicles Available' },
    { value: '150+', label: 'Packages Curated' }
  ];

  return (
    <section style={{
      padding: p.padding || '60px 24px',
      background: p.sectionBg || `linear-gradient(135deg, #0D1B2E 0%, #1a3a5c 100%)`,
      ...s
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: '32px', flexWrap: 'wrap' }}>
          {stats.map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, color: primary, marginBottom: '8px' }}>{stat.value}</div>
              <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── GALLERY SECTION ──────────────────────────────────────────────────────────
export function GallerySection({ section, liveData, onAction }) {
  const p = section.props || {};
  const s = section.style || {};
  const [selected, setSelected] = useState(null);

  const defaultImages = [
    { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600', caption: 'Beach Destination' },
    { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600', caption: 'Luxury Hotel' },
    { url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600', caption: 'Road Trip' },
    { url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600', caption: 'Resort Pool' },
    { url: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=600', caption: 'Travel Experience' },
    { url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600', caption: 'Adventure' }
  ];

  const images = liveData.gallery?.length > 0 ? liveData.gallery : (p.images?.length > 0 ? p.images : defaultImages);

  return (
    <section style={{ padding: p.padding || '80px 24px', background: p.sectionBg || '#fff', ...s }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: '#0D1B2E', marginBottom: '12px' }}>
            {p.heading || 'Photo Gallery'}
          </h2>
          {p.subheading && <p style={{ color: '#64748b', fontSize: '16px' }}>{p.subheading}</p>}
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {images.map((img, i) => (
            <div key={i} onClick={() => setSelected(img)} style={{
              borderRadius: '12px', overflow: 'hidden', cursor: 'pointer',
              position: 'relative', height: '220px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
            }}>
              <img src={img.url} alt={img.caption || `Gallery ${i + 1}`} style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transition: 'transform 0.4s ease'
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              />
              {img.caption && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                  color: '#fff', padding: '12px 14px', fontSize: '13px', fontWeight: 500
                }}>
                  {img.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <img src={selected.url} alt={selected.caption} style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '8px' }} />
        </div>
      )}
    </section>
  );
}

// ─── VIDEO SECTION ────────────────────────────────────────────────────────────
export function VideoSection({ section, liveData, onAction }) {
  const p = section.props || {};
  const s = section.style || {};

  return (
    <section style={{ padding: p.padding || '80px 24px', background: p.sectionBg || '#0D1B2E', ...s }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
        {p.heading && <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#fff', marginBottom: '24px' }}>{p.heading}</h2>}
        {p.subheading && <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '32px' }}>{p.subheading}</p>}
        <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
          {p.videoType === 'youtube' && p.videoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${p.videoId}?autoplay=0&rel=0`}
              style={{ width: '100%', height: '450px', border: 'none' }}
              allowFullScreen title={p.heading}
            />
          ) : p.videoUrl ? (
            <video controls style={{ width: '100%' }} poster={p.poster}>
              <source src={p.videoUrl} type="video/mp4" />
            </video>
          ) : (
            <div style={{
              height: '400px', background: 'rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.4)', fontSize: '16px', borderRadius: '16px', border: '2px dashed rgba(255,255,255,0.2)'
            }}>
              🎬 Add a YouTube video ID or direct video URL in properties
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── HEADING / TEXT SECTION ───────────────────────────────────────────────────
export function HeadingSection({ section, liveData, onAction }) {
  const p = section.props || {};
  const s = section.style || {};

  return (
    <section style={{ padding: p.padding || '60px 24px', background: p.sectionBg || '#fff', textAlign: p.textAlign || 'left', ...s }}>
      <div style={{ maxWidth: p.maxWidth || '900px', margin: '0 auto' }}>
        {p.badge && (
          <div style={{
            display: 'inline-block', background: '#FFF5F2', color: 'var(--wb-primary, #FF6333)',
            padding: '6px 16px', borderRadius: '100px', fontSize: '12px', fontWeight: 700,
            marginBottom: '16px', letterSpacing: '1px', textTransform: 'uppercase'
          }}>{p.badge}</div>
        )}
        {p.heading && (
          <h2 style={{
            fontSize: p.headingSize ? `${p.headingSize}px` : 'clamp(28px, 5vw, 52px)',
            fontWeight: p.headingWeight || 800, color: p.headingColor || '#0D1B2E',
            lineHeight: 1.2, marginBottom: '20px'
          }}>{p.heading}</h2>
        )}
        {p.subheading && (
          <p style={{
            fontSize: p.subheadingSize ? `${p.subheadingSize}px` : '18px',
            color: p.subheadingColor || '#64748b', lineHeight: 1.7,
            marginBottom: p.buttonText ? '28px' : '0',
            maxWidth: p.maxWidth || '700px'
          }}>{p.subheading}</p>
        )}
        {p.body && (
          <div style={{
            fontSize: '15px', color: '#64748b', lineHeight: 1.8,
            marginBottom: p.buttonText ? '28px' : '0'
          }}
            dangerouslySetInnerHTML={{ __html: p.body }}
          />
        )}
        {p.buttonText && (
          <button onClick={() => onAction && onAction(p.buttonAction || 'scroll', {
              url: p.Url, phone: p.Phone, email: p.Email, fileUrl: p.FileUrl, popupId: p.PopupId
          })} style={{
            padding: '14px 36px', background: 'linear-gradient(135deg, var(--wb-primary, #FF6333), #FF8A00)',
            color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: 'pointer'
          }}>{p.buttonText}</button>
        )}
      </div>
    </section>
  );
}

// ─── DIVIDER SECTION ──────────────────────────────────────────────────────────
export function DividerSection({ section }) {
  const p = section.props || {};
  return (
    <div style={{ padding: `${p.paddingV || 24}px ${p.paddingH || 24}px` }}>
      <div style={{
        maxWidth: p.maxWidth || '1200px', margin: '0 auto',
        height: `${p.thickness || 1}px`,
        background: p.gradient
          ? `linear-gradient(90deg, transparent, ${p.color || '#e2e8f0'}, transparent)`
          : (p.color || '#e2e8f0'),
        borderRadius: '100px'
      }} />
    </div>
  );
}

// ─── SPACER SECTION ───────────────────────────────────────────────────────────
export function SpacerSection({ section }) {
  const p = section.props || {};
  return <div style={{ height: `${p.height || 60}px`, background: p.background || 'transparent' }} />;
}
