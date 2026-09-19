// frontend/src/components/customer/CustomerLoyaltyCard.jsx
// Phase 4 — Updated: shows unified WOW GOA Loyalty tier from authoritative API data.
import React, { useState, useEffect } from 'react';
import { Crown, Sparkles, CheckCircle2, ChevronRight, TrendingUp, RefreshCw } from 'lucide-react';
import * as api from '../../services/api';

const TIER_CONFIG = {
  'New Member': {
    icon: '🆕', gradient: 'linear-gradient(135deg, #6b7280, #9ca3af)', border: '#d1d5db',
    bg: '#f3f4f6', color: '#374151', textLight: '#6b7280'
  },
  Bronze: {
    icon: '🥉', gradient: 'linear-gradient(135deg, #92400e, #d97706)', border: '#fbbf24',
    bg: '#fef3c7', color: '#92400e', textLight: '#b45309'
  },
  Silver: {
    icon: '🥈', gradient: 'linear-gradient(135deg, #4b5563, #9ca3af)', border: '#9ca3af',
    bg: '#f3f4f6', color: '#374151', textLight: '#6b7280'
  },
  Gold: {
    icon: '🥇', gradient: 'linear-gradient(135deg, #d97706, #f59e0b)', border: '#f59e0b',
    bg: '#fffbeb', color: '#92400e', textLight: '#b45309'
  },
  Platinum: {
    icon: '💎', gradient: 'linear-gradient(135deg, #1e40af, #7c3aed)', border: '#818cf8',
    bg: '#eef2ff', color: '#1e3a5f', textLight: '#4338ca'
  }
};

export default function CustomerLoyaltyCard({ bookings = [], loyaltyData = null, currentUser = null, onNavigateTab }) {
  const [data, setData] = useState(loyaltyData);
  const [loading, setLoading] = useState(!loyaltyData);

  useEffect(() => {
    if (loyaltyData) { setData(loyaltyData); setLoading(false); return; }
    const phone = currentUser?.phone || '';
    const customerId = currentUser?.id || '';
    if (!phone && !customerId) { setLoading(false); return; }
    let cancelled = false;
    api.fetchCustomerWallet(phone, customerId).then(res => {
      if (!cancelled && res?.loyalty) setData(res.loyalty);
    }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [loyaltyData, currentUser]);

  if (loading) {
    return (
      <div className="card border-0 rounded-4 shadow-sm mb-4 p-4 d-flex align-items-center gap-2" style={{ color: '#6b7280' }}>
        <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '0.85rem' }}>Loading loyalty status…</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const tier = data?.unified_tier || data?.resolved_tier || 'New Member';
  const cfg = TIER_CONFIG[tier] || TIER_CONFIG['New Member'];
  const tripCount = data?.qualifying_trips_count ?? 0;
  const progress = data?.progress ?? 0;
  const target = data?.target ?? 1;
  const remaining = data?.remaining ?? 1;
  const benefits = data?.benefits ?? ['10% Wallet Cashback on eligible bookings'];
  const nextTierCallout = data?.next_tier_callout ?? '';
  const isPlatinum = data?.is_platinum ?? false;
  const isNewMember = data?.is_new_member ?? (tripCount === 0);

  return (
    <div className="card border-0 rounded-4 shadow-sm mb-4 overflow-hidden" style={{ background: '#ffffff' }}>
      {/* Header */}
      <div className="p-4 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3"
        style={{ background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)' }}>
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-3 p-2 d-flex align-items-center justify-content-center shadow-sm"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', width: 44, height: 44, fontSize: '1.4rem' }}>
            {cfg.icon}
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h5 className="fw-bold text-white mb-0" style={{ fontSize: 17 }}>WOW GOA Loyalty Status</h5>
              <span className="badge rounded-pill fw-bold" style={{ background: cfg.gradient, color: '#fff', fontSize: '0.75rem' }}>
                {cfg.icon} {tier}
              </span>
            </div>
            <p className="mb-0 mt-1" style={{ fontSize: '0.77rem', color: 'rgba(255,255,255,0.65)' }}>
              {isNewMember
                ? 'Complete your first qualifying booking (₹1,500+) to earn tier status.'
                : `${tripCount} qualifying trip${tripCount !== 1 ? 's' : ''} in the last 365 days`}
            </p>
          </div>
        </div>
        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('wallet')}
            className="btn btn-sm rounded-pill fw-bold d-flex align-items-center gap-1"
            style={{ background: cfg.gradient, color: '#fff', border: 'none', fontSize: '0.8rem', padding: '7px 14px' }}
          >
            View Full Rewards <ChevronRight size={13} />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Progress bar */}
        {!isPlatinum && (
          <div className="mb-4">
            <div className="d-flex justify-content-between mb-2" style={{ fontSize: '0.8rem', color: '#6b7280' }}>
              <span><strong style={{ color: '#111827' }}>{tripCount}</strong> of {target} qualifying trips</span>
              <span style={{ color: cfg.color, fontWeight: 600 }}>{nextTierCallout}</span>
            </div>
            <div style={{ height: 10, background: '#f3f4f6', borderRadius: 5, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 5,
                background: cfg.gradient,
                width: `${Math.max(3, progress)}%`,
                transition: 'width 0.7s ease'
              }} />
            </div>
          </div>
        )}
        {isPlatinum && (
          <div className="mb-4 p-3 rounded-3 d-flex align-items-center gap-2" style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}` }}>
            <Crown size={16} style={{ color: cfg.color }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: cfg.color }}>Platinum VIP — Highest Tier Reached</span>
          </div>
        )}

        {/* Benefits */}
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={14} style={{ color: cfg.color }} /> {tier} Benefits
        </div>
        <div className="d-flex flex-wrap gap-2">
          {benefits.map((b, i) => (
            <div key={i} className="d-flex align-items-center gap-2 rounded-3"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, padding: '7px 12px', fontSize: '0.8rem', color: cfg.color }}>
              <CheckCircle2 size={13} style={{ color: cfg.color }} /> {b}
            </div>
          ))}
        </div>

        {/* Qualifying trips note */}
        <div className="mt-3 pt-3 border-top d-flex align-items-start gap-2" style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
          <TrendingUp size={12} style={{ marginTop: 1, flexShrink: 0 }} />
          <span>
            Qualifying trips: completed bookings with <strong>₹1,500+</strong> gross value, D2C only, within the last <strong>365 days</strong>.
            Tier is re-evaluated after each booking completion or cancellation.
          </span>
        </div>
      </div>
    </div>
  );
}
