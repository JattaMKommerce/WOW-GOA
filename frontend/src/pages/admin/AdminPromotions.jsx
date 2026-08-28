import React, { useState } from 'react';
import { Tag, Plus, Trash2, Zap, Gift, Percent, Calendar, Copy, X, Save, Check } from 'lucide-react';
import * as api from '../../services/api';

const PROMO_TYPES = [
  { id: 'coupon', label: 'Coupon Codes', icon: <Tag size={16} />, desc: 'Discount codes for checkout' },
  { id: 'flash', label: 'Flash Deals', icon: <Zap size={16} />, desc: 'Limited-time offers' },
  { id: 'seasonal', label: 'Seasonal Offers', icon: <Calendar size={16} />, desc: 'Holiday & season promotions' },
  { id: 'gifts', label: 'Gift Vouchers', icon: <Gift size={16} />, desc: 'Prepaid gift codes' },
];

const MOCK_COUPONS = [
  { id: 1, code: 'GOA10', discount_type: 'percentage', discount_value: 10, min_amount: 5000, max_uses: 100, uses: 34, valid_from: '2026-07-01', valid_until: '2026-08-31', status: 'active' },
  { id: 2, code: 'FLAT500', discount_type: 'fixed', discount_value: 500, min_amount: 2000, max_uses: 50, uses: 12, valid_from: '2026-07-15', valid_until: '2026-07-31', status: 'active' },
  { id: 3, code: 'WELCOME20', discount_type: 'percentage', discount_value: 20, min_amount: 3000, max_uses: 200, uses: 89, valid_from: '2026-06-01', valid_until: '2026-09-30', status: 'active' },
  { id: 4, code: 'SUMMER15', discount_type: 'percentage', discount_value: 15, min_amount: 4000, max_uses: 75, uses: 75, valid_from: '2026-05-01', valid_until: '2026-06-30', status: 'expired' },
];

const MOCK_DEALS = [
  { id: 1, title: 'Monsoon Special', discount: 25, validUntil: '2026-08-15', category: 'Hotels', uses: 45 },
  { id: 2, title: 'Weekend Getaway', discount: 15, validUntil: '2026-07-31', category: 'Vehicles', uses: 23 },
  { id: 3, title: 'Early Bird Offer', discount: 30, validUntil: '2026-08-01', category: 'Packages', uses: 67 },
];

function StatusBadge({ status }) {
  const m = { active: ['#dcfce7', '#16a34a'], expired: ['#fee2e2', '#dc2626'], draft: ['#fef9c3', '#ca8a04'] };
  const [bg, color] = m[status] || ['#f1f5f9', '#64748b'];
  return <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: bg, color, fontSize: '0.65rem', textTransform: 'uppercase' }}>{status}</span>;
}

function CouponCard({ coupon, onDelete }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(coupon.code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const usagePercent = Math.round((coupon.uses / coupon.max_uses) * 100);

  return (
    <div className="rounded-3 p-4" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <code className="fw-bold px-2 py-1 rounded-2" style={{ background: '#f1f5f9', color: '#0D1B2E', fontSize: '1rem', letterSpacing: '2px' }}>{coupon.code}</code>
            <button onClick={copy} className="btn btn-sm p-1 border-0" style={{ background: 'transparent', color: copied ? '#16a34a' : '#94a3b8' }}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% off` : `₹${coupon.discount_value} off`}
            {' · '}Min ₹{coupon.min_amount}
          </div>
        </div>
        <StatusBadge status={coupon.status} />
      </div>
      <div className="mb-2">
        <div className="d-flex justify-content-between mb-1">
          <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Usage</span>
          <span style={{ fontSize: '0.7rem', color: '#0D1B2E', fontWeight: 700 }}>{coupon.uses}/{coupon.max_uses}</span>
        </div>
        <div className="rounded-pill overflow-hidden" style={{ height: '6px', background: '#f1f5f9' }}>
          <div className="rounded-pill" style={{ height: '100%', width: `${Math.min(usagePercent, 100)}%`, background: usagePercent >= 90 ? '#dc2626' : usagePercent >= 70 ? '#ca8a04' : '#16a34a', transition: 'width 0.3s' }} />
        </div>
      </div>
      <div className="d-flex justify-content-between align-items-center mt-3">
        <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Valid: {coupon.valid_from} → {coupon.valid_until}</span>
        <button onClick={() => onDelete(coupon.id)} className="btn btn-sm p-1 border-0" style={{ color: '#dc2626', background: 'transparent' }}><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

export default function AdminPromotions() {
  const [activeType, setActiveType] = useState('coupon');
  const [coupons, setCoupons] = useState(MOCK_COUPONS);
  const [deals, setDeals] = useState(MOCK_DEALS);
  const [showCreateCoupon, setShowCreateCoupon] = useState(false);
  const [form, setForm] = useState({ code: '', discount_type: 'percentage', discount_value: 10, min_amount: 1000, max_uses: 100, valid_from: '', valid_until: '' });

  const handleDeleteCoupon = (id) => setCoupons(c => c.filter(x => x.id !== id));

  const handleCreateCoupon = (e) => {
    e.preventDefault();
    if (!form.code) return;
    const newCoupon = { ...form, id: Date.now(), uses: 0, status: 'active' };
    setCoupons(c => [newCoupon, ...c]);
    setShowCreateCoupon(false);
    setForm({ code: '', discount_type: 'percentage', discount_value: 10, min_amount: 1000, max_uses: 100, valid_from: '', valid_until: '' });
  };

  return (
    <div className="p-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: '#0D1B2E', fontSize: '16px' }}>Promotions & Offers</h5>
          <p className="mb-0 mt-1" style={{ fontSize: '0.78rem', color: '#64748b' }}>Manage coupons, flash deals, seasonal offers and gift vouchers</p>
        </div>
        <button onClick={() => setShowCreateCoupon(true)} className="btn px-4 py-2 fw-bold text-white d-flex align-items-center gap-2 rounded-3" style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)', fontSize: '0.83rem' }}>
          <Plus size={14} /> Create Offer
        </button>
      </div>

      {/* Type Tabs */}
      <div className="d-flex gap-2 mb-4">
        {PROMO_TYPES.map(t => (
          <button key={t.id} onClick={() => setActiveType(t.id)} className="btn d-flex align-items-center gap-2 px-4 py-2 rounded-3 fw-bold" style={{ fontSize: '0.82rem', background: activeType === t.id ? '#0D1B2E' : '#fff', color: activeType === t.id ? '#fff' : '#475569', border: `1px solid ${activeType === t.id ? 'transparent' : 'rgba(0,0,0,0.1)'}` }}>
            <span style={{ color: activeType === t.id ? '#FF6333' : '#94a3b8' }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-md-3"><div className="rounded-3 p-3" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}><div className="fw-bold" style={{ fontSize: '1.4rem', color: '#0D1B2E' }}>{coupons.length}</div><div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Active Coupons</div></div></div>
        <div className="col-md-3"><div className="rounded-3 p-3" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}><div className="fw-bold" style={{ fontSize: '1.4rem', color: '#7c3aed' }}>{coupons.reduce((s, c) => s + (c.uses || 0), 0)}</div><div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Total Redemptions</div></div></div>
        <div className="col-md-3"><div className="rounded-3 p-3" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}><div className="fw-bold" style={{ fontSize: '1.4rem', color: '#16a34a' }}>₹48K</div><div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Discount Given</div></div></div>
        <div className="col-md-3"><div className="rounded-3 p-3" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}><div className="fw-bold" style={{ fontSize: '1.4rem', color: '#d97706' }}>{deals.length}</div><div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Flash Deals</div></div></div>
      </div>

      {activeType === 'coupon' && (
        <div className="row g-3">
          {coupons.map(c => <div key={c.id} className="col-md-4"><CouponCard coupon={c} onDelete={handleDeleteCoupon} /></div>)}
          {coupons.length === 0 && <div className="col-12 text-center py-5 text-muted">No coupons yet</div>}
        </div>
      )}

      {activeType === 'flash' && (
        <div className="row g-3">
          {deals.map(d => (
            <div key={d.id} className="col-md-4">
              <div className="rounded-3 p-4 position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#0D1B2E,#1e3a5f)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="position-absolute top-0 end-0 p-3">
                  <span className="fw-bold text-white" style={{ fontSize: '2rem', opacity: 0.1 }}>⚡</span>
                </div>
                <div className="mb-2"><span className="px-2 py-1 rounded-pill fw-bold" style={{ background: 'rgba(255,99,51,0.2)', color: '#FF6333', fontSize: '0.65rem' }}>FLASH DEAL</span></div>
                <div className="fw-bold text-white mb-1" style={{ fontSize: '16px' }}>{d.title}</div>
                <div className="fw-bold mb-2" style={{ fontSize: '2rem', color: '#FF6333' }}>{d.discount}% OFF</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>{d.category} · {d.uses} uses</div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>Until {d.validUntil}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeType === 'seasonal' && (
        <div className="rounded-3 p-5 text-center" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
          <Calendar size={40} style={{ color: '#94a3b8' }} className="mb-3" />
          <h6 className="fw-bold mb-2" style={{ color: '#0D1B2E' }}>Seasonal Campaigns</h6>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Create holiday and season-specific promotions like Diwali, Christmas, New Year and Monsoon specials.</p>
          <button className="btn px-4 py-2 fw-bold rounded-3 text-white" style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)', fontSize: '0.83rem' }}>
            <Plus size={14} className="me-2" />Create Seasonal Offer
          </button>
        </div>
      )}

      {activeType === 'gifts' && (
        <div className="rounded-3 p-5 text-center" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
          <Gift size={40} style={{ color: '#94a3b8' }} className="mb-3" />
          <h6 className="fw-bold mb-2" style={{ color: '#0D1B2E' }}>Gift Vouchers</h6>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Create prepaid gift vouchers that customers can purchase and gift to others for travel bookings.</p>
          <button className="btn px-4 py-2 fw-bold rounded-3 text-white" style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)', fontSize: '0.83rem' }}>
            <Plus size={14} className="me-2" />Create Gift Voucher
          </button>
        </div>
      )}

      {/* Create Coupon Modal */}
      {showCreateCoupon && (
        <div className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center" style={{ background: 'rgba(13,27,46,0.65)', backdropFilter: 'blur(6px)', zIndex: 1060 }} onClick={() => setShowCreateCoupon(false)}>
          <div className="rounded-4 overflow-hidden shadow-lg" style={{ width: '100%', maxWidth: '480px', background: '#fff', margin: '0 16px' }} onClick={e => e.stopPropagation()}>
            <div className="d-flex align-items-center justify-content-between px-4 py-3" style={{ background: '#0D1B2E' }}>
              <h6 className="mb-0 fw-bold text-white" style={{ fontSize: '14px' }}>Create Coupon Code</h6>
              <button className="btn p-1 border-0 text-white-50" onClick={() => setShowCreateCoupon(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateCoupon} className="p-4">
              <div className="mb-3">
                <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Coupon Code *</label>
                <input type="text" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px', textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '2px' }} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="GOA10" required />
              </div>
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Discount Type</label>
                  <select className="form-select" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Discount Value</label>
                  <input type="number" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} />
                </div>
              </div>
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Min Order Amount (₹)</label>
                  <input type="number" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={form.min_amount} onChange={e => setForm(f => ({ ...f, min_amount: e.target.value }))} />
                </div>
                <div className="col-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Max Uses</label>
                  <input type="number" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} />
                </div>
              </div>
              <div className="row g-2 mb-4">
                <div className="col-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Valid From</label>
                  <input type="date" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={form.valid_from} onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))} />
                </div>
                <div className="col-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Valid Until</label>
                  <input type="date" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} />
                </div>
              </div>
              <button type="submit" className="btn w-100 py-2 fw-bold text-white rounded-3 d-flex align-items-center justify-content-center gap-2" style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)' }}><Save size={14} />Create Coupon</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
