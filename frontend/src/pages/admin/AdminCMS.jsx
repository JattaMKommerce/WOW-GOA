import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, FileText, BookOpen, HelpCircle, Star, Image, Shield, ChevronDown, ChevronRight } from 'lucide-react';

const CMS_TYPES = [
  { id: 'pages', label: 'Pages', icon: <FileText size={16} /> },
  { id: 'blogs', label: 'Blog Posts', icon: <BookOpen size={16} /> },
  { id: 'faqs', label: 'FAQs', icon: <HelpCircle size={16} /> },
  { id: 'testimonials', label: 'Testimonials', icon: <Star size={16} /> },
  { id: 'gallery', label: 'Gallery', icon: <Image size={16} /> },
  { id: 'policies', label: 'Policies & Legal', icon: <Shield size={16} /> },
];

const DEFAULT_DATA = {
  pages: [
    { id: 1, title: 'About Us', slug: '/about', status: 'published', updated: '2026-07-28' },
    { id: 2, title: 'Contact Us', slug: '/contact', status: 'published', updated: '2026-07-25' },
    { id: 3, title: 'Destinations', slug: '/destinations', status: 'draft', updated: '2026-07-20' },
  ],
  blogs: [
    { id: 1, title: 'Top 10 Beaches in Goa', slug: 'top-beaches-goa', status: 'published', updated: '2026-07-30' },
    { id: 2, title: 'Monsoon Travel Tips', slug: 'monsoon-travel-tips', status: 'draft', updated: '2026-07-26' },
  ],
  faqs: [
    { id: 1, question: 'How do I cancel a booking?', answer: 'You can cancel your booking from the My Bookings section in your dashboard.', category: 'Booking' },
    { id: 2, question: 'What payment methods are accepted?', answer: 'We accept UPI, credit/debit cards, net banking and cash payments.', category: 'Payment' },
    { id: 3, question: 'Is there a cancellation fee?', answer: 'Cancellations made 24 hours before check-in are free. Later cancellations may incur a fee.', category: 'Booking' },
  ],
  testimonials: [
    { id: 1, name: 'Rahul Sharma', rating: 5, review: 'Amazing experience! The hotels were top-notch and service was excellent.', location: 'Mumbai' },
    { id: 2, name: 'Priya Patel', rating: 5, review: 'Best Goa trip ever! Highly recommend TripGalileo to everyone.', location: 'Ahmedabad' },
  ],
  gallery: [
    { id: 1, title: 'Baga Beach Sunset', category: 'Beaches', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400' },
    { id: 2, title: 'Old Goa Churches', category: 'Heritage', url: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400' },
  ],
  policies: [
    { id: 1, title: 'Privacy Policy', slug: '/privacy', status: 'published', updated: '2026-07-01' },
    { id: 2, title: 'Terms of Service', slug: '/terms', status: 'published', updated: '2026-07-01' },
    { id: 3, title: 'Refund Policy', slug: '/refund', status: 'published', updated: '2026-07-01' },
    { id: 4, title: 'Cookie Policy', slug: '/cookies', status: 'draft', updated: '2026-07-01' },
  ],
};

function StatusBadge({ status }) {
  const colors = { published: ['#dcfce7', '#16a34a'], draft: ['#fef9c3', '#ca8a04'] };
  const [bg, text] = colors[status] || ['#f1f5f9', '#64748b'];
  return <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: bg, color: text, fontSize: '0.65rem', textTransform: 'uppercase' }}>{status}</span>;
}

function RichTextEditor({ value, onChange }) {
  return (
    <div className="rounded-3 overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.12)' }}>
      <div className="d-flex gap-1 p-2" style={{ background: '#f8fafc', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        {['B', 'I', 'U', 'H1', 'H2', '•', '1.'].map(tool => (
          <button key={tool} className="btn btn-sm px-2 py-1 rounded-1 fw-bold" style={{ fontSize: '0.72rem', background: '#fff', border: '1px solid rgba(0,0,0,0.1)', color: '#475569' }}>{tool}</button>
        ))}
      </div>
      <textarea
        className="form-control border-0"
        rows={8}
        style={{ fontSize: '0.85rem', borderRadius: 0, resize: 'vertical' }}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Write your content here..."
      />
    </div>
  );
}

export default function AdminCMS() {
  const [activeType, setActiveType] = useState('pages');
  const [data, setData] = useState(DEFAULT_DATA);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({});

  const currentData = data[activeType] || [];

  const handleDelete = (id) => {
    if (!window.confirm('Delete this item?')) return;
    setData(d => ({ ...d, [activeType]: d[activeType].filter(i => i.id !== id) }));
  };

  const handleSave = () => {
    if (editing) {
      setData(d => ({ ...d, [activeType]: d[activeType].map(i => i.id === editing.id ? { ...i, ...formData } : i) }));
      setEditing(null);
    } else {
      const newItem = { id: Date.now(), ...formData, status: 'draft', updated: new Date().toISOString().slice(0, 10) };
      setData(d => ({ ...d, [activeType]: [...d[activeType], newItem] }));
      setCreating(false);
    }
    setFormData({});
  };

  const renderTable = () => {
    if (activeType === 'faqs') {
      return (
        <div>
          {currentData.map(item => (
            <div key={item.id} className="rounded-3 p-3 mb-3" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
              <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <div className="fw-bold" style={{ fontSize: '0.88rem', color: '#0D1B2E' }}>{item.question}</div>
                  <div className="mt-1" style={{ fontSize: '0.78rem', color: '#64748b' }}>{item.answer}</div>
                  <span className="badge mt-2" style={{ background: '#dbeafe', color: '#2563eb', fontSize: '0.65rem' }}>{item.category}</span>
                </div>
                <div className="d-flex gap-1 ms-2">
                  <button onClick={() => { setEditing(item); setFormData(item); }} className="btn btn-sm px-2 py-1 rounded-2" style={{ background: '#ede9fe', color: '#7c3aed', fontSize: '0.72rem' }}><Edit size={12} /></button>
                  <button onClick={() => handleDelete(item.id)} className="btn btn-sm px-2 py-1 rounded-2" style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.72rem' }}><Trash2 size={12} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activeType === 'testimonials') {
      return (
        <div className="row g-3">
          {currentData.map(item => (
            <div key={item.id} className="col-md-6">
              <div className="rounded-3 p-4" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <div className="fw-bold" style={{ fontSize: '0.88rem', color: '#0D1B2E' }}>{item.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{item.location}</div>
                  </div>
                  <div>{'⭐'.repeat(item.rating)}</div>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#475569' }}>"{item.review}"</p>
                <div className="d-flex gap-1 mt-2">
                  <button onClick={() => { setEditing(item); setFormData(item); }} className="btn btn-sm px-2 py-1 rounded-2" style={{ background: '#ede9fe', color: '#7c3aed', fontSize: '0.72rem' }}><Edit size={12} /></button>
                  <button onClick={() => handleDelete(item.id)} className="btn btn-sm px-2 py-1 rounded-2" style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.72rem' }}><Trash2 size={12} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activeType === 'gallery') {
      return (
        <div className="row g-3">
          {currentData.map(item => (
            <div key={item.id} className="col-md-4">
              <div className="rounded-3 overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
                <img src={item.url} alt={item.title} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                <div className="p-2 d-flex justify-content-between align-items-center" style={{ background: '#fff' }}>
                  <div>
                    <div className="fw-bold" style={{ fontSize: '0.78rem', color: '#0D1B2E' }}>{item.title}</div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{item.category}</div>
                  </div>
                  <button onClick={() => handleDelete(item.id)} className="btn btn-sm p-1 border-0" style={{ color: '#dc2626', background: 'transparent' }}><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Default table for pages, blogs, policies
    return (
      <div className="rounded-3 overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.07)', background: '#fff' }}>
        <table className="table align-middle mb-0" style={{ fontSize: '0.83rem' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th className="px-3 py-3 fw-bold" style={{ color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>Title</th>
              <th className="px-3 py-3 fw-bold" style={{ color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>Slug/URL</th>
              <th className="px-3 py-3 fw-bold" style={{ color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>Status</th>
              <th className="px-3 py-3 fw-bold" style={{ color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>Updated</th>
              <th className="px-3 py-3 fw-bold" style={{ color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <td className="px-3 py-3 fw-bold" style={{ color: '#0D1B2E' }}>{item.title}</td>
                <td className="px-3 py-3" style={{ color: '#64748b', fontFamily: 'monospace', fontSize: '0.78rem' }}>{item.slug}</td>
                <td className="px-3 py-3"><StatusBadge status={item.status || 'draft'} /></td>
                <td className="px-3 py-3" style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{item.updated}</td>
                <td className="px-3 py-3">
                  <div className="d-flex gap-1">
                    <button onClick={() => { setEditing(item); setFormData(item); }} className="btn btn-sm px-2 py-1 rounded-2" style={{ background: '#ede9fe', color: '#7c3aed', fontSize: '0.72rem', fontWeight: 600 }}>
                      <Edit size={12} className="me-1" />Edit
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="btn btn-sm px-2 py-1 rounded-2" style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.72rem', fontWeight: 600 }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {currentData.length === 0 && <div className="text-center py-5 text-muted" style={{ fontSize: '0.85rem' }}>No {activeType} yet</div>}
      </div>
    );
  };

  return (
    <div className="d-flex" style={{ minHeight: 'calc(100vh - 56px)', background: '#f0f2f5' }}>
      {/* Sidebar */}
      <div className="flex-shrink-0 p-3" style={{ width: '200px', background: '#fff', borderRight: '1px solid rgba(0,0,0,0.07)' }}>
        <div className="fw-bold mb-3" style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94a3b8' }}>Content Types</div>
        {CMS_TYPES.map(t => (
          <button key={t.id} onClick={() => setActiveType(t.id)} className="btn w-100 text-start d-flex align-items-center gap-2 py-2 px-2 rounded-2 mb-1" style={{ fontSize: '0.83rem', background: activeType === t.id ? '#FFF5F2' : 'transparent', color: activeType === t.id ? '#FF6333' : '#475569', fontWeight: activeType === t.id ? 700 : 400 }}>
            <span style={{ color: activeType === t.id ? '#FF6333' : '#94a3b8' }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Main */}
      <div className="flex-grow-1 p-4">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h5 className="fw-bold mb-0" style={{ color: '#0D1B2E', fontSize: '16px' }}>{CMS_TYPES.find(t => t.id === activeType)?.label}</h5>
            <p className="mb-0 mt-1" style={{ fontSize: '0.78rem', color: '#64748b' }}>Manage your website {activeType}</p>
          </div>
          <button onClick={() => { setCreating(true); setFormData({ status: 'draft' }); }} className="btn px-4 py-2 fw-bold text-white d-flex align-items-center gap-2 rounded-3" style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)', fontSize: '0.83rem' }}>
            <Plus size={14} /> Add New
          </button>
        </div>

        {renderTable()}
      </div>

      {/* Edit/Create Modal */}
      {(editing || creating) && (
        <div className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center" style={{ background: 'rgba(13,27,46,0.65)', backdropFilter: 'blur(6px)', zIndex: 1060 }} onClick={() => { setEditing(null); setCreating(false); setFormData({}); }}>
          <div className="rounded-4 overflow-hidden shadow-lg" style={{ width: '100%', maxWidth: '640px', background: '#fff', margin: '0 16px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="d-flex align-items-center justify-content-between px-4 py-3" style={{ background: '#0D1B2E', flexShrink: 0 }}>
              <h6 className="mb-0 fw-bold text-white" style={{ fontSize: '14px' }}>{editing ? 'Edit' : 'Create'} {CMS_TYPES.find(t => t.id === activeType)?.label.slice(0, -1)}</h6>
              <button className="btn p-1 border-0 text-white-50" onClick={() => { setEditing(null); setCreating(false); setFormData({}); }}><X size={16} /></button>
            </div>
            <div className="p-4 overflow-auto flex-grow-1">
              <div className="mb-3">
                <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Title / Question *</label>
                <input type="text" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={formData.title || formData.question || ''} onChange={e => setFormData(f => ({ ...f, title: e.target.value, question: e.target.value }))} placeholder="Enter title..." />
              </div>
              {(activeType === 'pages' || activeType === 'blogs' || activeType === 'policies') && (
                <div className="mb-3">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>URL Slug</label>
                  <input type="text" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px', fontFamily: 'monospace' }} value={formData.slug || ''} onChange={e => setFormData(f => ({ ...f, slug: e.target.value }))} placeholder="/page-slug" />
                </div>
              )}
              {(activeType === 'faqs') && (
                <div className="mb-3">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Answer *</label>
                  <textarea className="form-control" rows={4} style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={formData.answer || ''} onChange={e => setFormData(f => ({ ...f, answer: e.target.value }))} />
                </div>
              )}
              {(activeType === 'testimonials') && (
                <>
                  <div className="mb-3">
                    <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Review</label>
                    <textarea className="form-control" rows={3} style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={formData.review || ''} onChange={e => setFormData(f => ({ ...f, review: e.target.value }))} />
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Location</label>
                      <input type="text" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={formData.location || ''} onChange={e => setFormData(f => ({ ...f, location: e.target.value }))} placeholder="City, State" />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Rating</label>
                      <select className="form-select" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={formData.rating || 5} onChange={e => setFormData(f => ({ ...f, rating: parseInt(e.target.value) }))}>
                        {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} Stars</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}
              {(activeType === 'pages' || activeType === 'blogs') && (
                <div className="mb-3">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Content</label>
                  <RichTextEditor value={formData.content || ''} onChange={v => setFormData(f => ({ ...f, content: v }))} />
                </div>
              )}
              <div className="mb-3">
                <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Status</label>
                <select className="form-select" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={formData.status || 'draft'} onChange={e => setFormData(f => ({ ...f, status: e.target.value }))}>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
            <div className="px-4 py-3 d-flex justify-content-end gap-2" style={{ borderTop: '1px solid rgba(0,0,0,0.07)', background: '#f8fafc', flexShrink: 0 }}>
              <button onClick={() => { setEditing(null); setCreating(false); setFormData({}); }} className="btn px-4 py-2 rounded-3" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.83rem', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleSave} className="btn px-4 py-2 rounded-3 fw-bold text-white d-flex align-items-center gap-2" style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)', fontSize: '0.83rem' }}><Save size={14} /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
