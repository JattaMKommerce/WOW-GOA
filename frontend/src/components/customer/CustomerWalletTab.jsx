// frontend/src/components/customer/CustomerWalletTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet, Clock, Gift, ArrowUpRight, ArrowDownLeft, ShieldCheck,
  AlertCircle, Sparkles, RefreshCw, CheckCircle2, ChevronRight, Info,
  AlertTriangle, Star, Crown, Award, Zap, Shield, Trophy, TrendingUp
} from 'lucide-react';
import * as api from '../../services/api';

// ─── Tier config ──────────────────────────────────────────────────────────────
const TIER_CONFIG = {
  'New Member': {
    icon: '🆕', color: '#6b7280', gradient: 'linear-gradient(135deg, #6b7280, #9ca3af)',
    bg: '#f3f4f6', border: '#d1d5db', label: 'New Member'
  },
  Bronze: {
    icon: '🥉', color: '#b45309', gradient: 'linear-gradient(135deg, #92400e, #d97706)',
    bg: '#fef3c7', border: '#fbbf24', label: 'Bronze'
  },
  Silver: {
    icon: '🥈', color: '#374151', gradient: 'linear-gradient(135deg, #4b5563, #9ca3af)',
    bg: '#f3f4f6', border: '#9ca3af', label: 'Silver'
  },
  Gold: {
    icon: '🥇', color: '#92400e', gradient: 'linear-gradient(135deg, #d97706, #f59e0b)',
    bg: '#fffbeb', border: '#f59e0b', label: 'Gold'
  },
  Platinum: {
    icon: '💎', color: '#1e3a5f', gradient: 'linear-gradient(135deg, #1e40af, #7c3aed)',
    bg: '#eef2ff', border: '#818cf8', label: 'Platinum'
  }
};

const TRANSACTION_TYPE_CONFIG = {
  CASHBACK_CREDIT:   { label: 'Cashback Earned',    icon: <Gift size={14} />,           color: '#16a34a', bg: '#dcfce7' },
  CASHBACK_USED:     { label: 'Cashback Redeemed',  icon: <ArrowUpRight size={14} />,   color: '#2563eb', bg: '#dbeafe' },
  CASHBACK_REVERSED: { label: 'Cashback Reversed',  icon: <ArrowDownLeft size={14} />,  color: '#dc2626', bg: '#fee2e2' },
  CASHBACK_EXPIRED:  { label: 'Cashback Expired',   icon: <Clock size={14} />,          color: '#6b7280', bg: '#f3f4f6' },
  WALLET_REFUND:     { label: 'Wallet Refund',       icon: <CheckCircle2 size={14} />,   color: '#0891b2', bg: '#cffafe' },
};

function fmtCurrency(v) { return '₹' + Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d) { if (!d) return '—'; try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; } }
function fmtDatetime(d) { if (!d) return '—'; try { return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return d; } }

// ─── Countdown hook ───────────────────────────────────────────────────────────
function useCountdown(secondsRemaining) {
  const [display, setDisplay] = useState('');
  useEffect(() => {
    if (!secondsRemaining || secondsRemaining <= 0) { setDisplay(''); return; }
    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = secondsRemaining - (now - startRef.current);
      if (remaining <= 0) { setDisplay('Expired'); clearInterval(interval); return; }
      const d = Math.floor(remaining / 86400);
      const h = Math.floor((remaining % 86400) / 3600);
      const m = Math.floor((remaining % 3600) / 60);
      const s = remaining % 60;
      setDisplay(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${String(s).padStart(2,'0')}s`);
    };
    const startRef = { current: Math.floor(Date.now() / 1000) };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining]);
  return display;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CustomerWalletTab({ currentUser, onNavigateTab, onNavigateHome }) {
  const [wallet, setWallet] = useState({
    available_balance: 0, total_earned: 0, total_used: 0, total_expired: 0,
    nearest_expiring: null, server_time: new Date().toISOString(), transactions: []
  });
  const [loyalty, setLoyalty] = useState({
    unified_tier: 'New Member', resolved_tier: 'New Member', qualifying_trips_count: 0,
    qualifying_spend: 0, badge: '🆕 New Member', icon: '🆕', progress: 0,
    target: 1, remaining: 1, next_tier: 'Bronze',
    next_tier_callout: '1 qualifying booking to earn Bronze',
    benefits: ['10% Wallet Cashback on eligible bookings'],
    is_new_member: true, is_platinum: false, description: ''
  });
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');

  const phone = currentUser?.phone || currentUser?.username || '';
  const customerId = currentUser?.id || '';

  const countdown = useCountdown(wallet.nearest_expiring?.seconds_remaining || 0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchCustomerWallet(phone, customerId);
      // New unified API returns loyalty inside the wallet response
      if (data.loyalty) {
        setLoyalty(data.loyalty);
      }
      setWallet({
        available_balance: data.available_balance ?? 0,
        total_earned: data.total_earned ?? 0,
        total_used: data.total_used ?? 0,
        total_expired: data.total_expired ?? 0,
        nearest_expiring: data.nearest_expiring ?? null,
        server_time: data.server_time ?? new Date().toISOString(),
        transactions: data.transactions ?? []
      });
    } catch (err) {
      console.error('CustomerWalletTab fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [phone, customerId]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredTx = (wallet.transactions || []).filter(tx => {
    if (filterType === 'ALL') return true;
    if (filterType === 'EARNED') return tx.transaction_type === 'CASHBACK_CREDIT' || tx.transaction_type === 'WALLET_REFUND';
    if (filterType === 'USED')    return tx.transaction_type === 'CASHBACK_USED';
    if (filterType === 'EXPIRED') return tx.transaction_type === 'CASHBACK_EXPIRED' || tx.transaction_type === 'CASHBACK_REVERSED';
    return true;
  });

  const tierCfg = TIER_CONFIG[loyalty.unified_tier] || TIER_CONFIG['New Member'];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 10 }}>
        <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
        <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Loading your Wallet & Rewards…</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 0 40px' }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            🏆 WOW GOA Wallet & Rewards
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 4 }}>
            Your real-time cashback balance, tier status, and transaction history
          </p>
        </div>
        <button
          onClick={loadData}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: '0.82rem', color: '#374151', fontWeight: 500 }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── TIER BANNER ── */}
      <div style={{
        borderRadius: 16, padding: '24px 28px', marginBottom: 20,
        background: tierCfg.gradient, color: '#fff', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -20, right: -20, fontSize: 120, opacity: 0.12, userSelect: 'none' }}>
          {tierCfg.icon}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.85, marginBottom: 4 }}>
              YOUR LOYALTY STATUS
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 4 }}>
              {tierCfg.icon} {loyalty.unified_tier}
            </div>
            <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: 12 }}>
              {loyalty.description || (loyalty.is_new_member ? 'Complete your first qualifying trip to start earning tier benefits.' : `${loyalty.qualifying_trips_count} qualifying trip${loyalty.qualifying_trips_count !== 1 ? 's' : ''} in last 365 days`)}
            </div>
            {/* Progress bar */}
            {!loyalty.is_platinum && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, fontSize: '0.75rem', opacity: 0.85, marginBottom: 4 }}>
                  <span>{loyalty.qualifying_trips_count} / {loyalty.target} qualifying trips</span>
                  <span>{loyalty.next_tier_callout}</span>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.25)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#fff', borderRadius: 4, width: `${Math.max(3, loyalty.progress)}%`, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            )}
            {loyalty.is_platinum && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600 }}>
                <Crown size={13} /> Highest Tier — Platinum VIP
              </div>
            )}
          </div>
          {/* Qualifying spend */}
          {loyalty.qualifying_spend > 0 && (
            <div style={{ textAlign: 'right', minWidth: 120 }}>
              <div style={{ fontSize: '0.72rem', opacity: 0.8, marginBottom: 2 }}>365-day qualifying spend</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{fmtCurrency(loyalty.qualifying_spend)}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── PERKS CARD ── */}
      <div style={{ borderRadius: 14, border: `2px solid ${tierCfg.border}`, background: tierCfg.bg, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Sparkles size={15} style={{ color: tierCfg.color }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: tierCfg.color }}>
            {loyalty.is_new_member ? 'Welcome Perks' : `${loyalty.unified_tier} Tier Perks`}
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(loyalty.benefits || []).map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 12px', fontSize: '0.82rem', color: '#374151' }}>
              <CheckCircle2 size={13} style={{ color: tierCfg.color, flexShrink: 0 }} /> {b}
            </div>
          ))}
        </div>
        {loyalty.next_tier && (
          <div style={{ marginTop: 10, fontSize: '0.78rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 5 }}>
            <TrendingUp size={12} />
            Next: <strong style={{ color: '#374151' }}>{loyalty.next_tier_callout}</strong>
          </div>
        )}
      </div>

      {/* ── WALLET BALANCE CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        {/* Available */}
        <div style={{ borderRadius: 14, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', padding: '20px 18px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', bottom: -10, right: -10, opacity: 0.15 }}><Wallet size={60} /></div>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, opacity: 0.85, marginBottom: 6 }}>Available Balance</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{fmtCurrency(wallet.available_balance)}</div>
          <div style={{ fontSize: '0.73rem', opacity: 0.8, marginTop: 4 }}>Use up to 10% on your next booking</div>
        </div>
        {/* Earned */}
        <div style={{ borderRadius: 14, background: '#f0fdf4', border: '1.5px solid #bbf7d0', padding: '20px 18px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, color: '#15803d', marginBottom: 6 }}>Total Earned</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#166534' }}>{fmtCurrency(wallet.total_earned)}</div>
          <div style={{ fontSize: '0.73rem', color: '#16a34a', marginTop: 4 }}>10% cashback on completed trips</div>
        </div>
        {/* Used */}
        <div style={{ borderRadius: 14, background: '#eff6ff', border: '1.5px solid #bfdbfe', padding: '20px 18px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, color: '#1d4ed8', marginBottom: 6 }}>Total Redeemed</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e40af' }}>{fmtCurrency(wallet.total_used)}</div>
          <div style={{ fontSize: '0.73rem', color: '#3b82f6', marginTop: 4 }}>Applied on bookings</div>
        </div>
        {/* Expired */}
        <div style={{ borderRadius: 14, background: '#f9fafb', border: '1.5px solid #e5e7eb', padding: '20px 18px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, color: '#6b7280', marginBottom: 6 }}>Expired</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#374151' }}>{fmtCurrency(wallet.total_expired)}</div>
          <div style={{ fontSize: '0.73rem', color: '#9ca3af', marginTop: 4 }}>Unused after 30 days</div>
        </div>
      </div>

      {/* ── EXPIRY COUNTDOWN ── */}
      {wallet.nearest_expiring && countdown && (
        <div style={{ borderRadius: 12, background: '#fff7ed', border: '1.5px solid #fed7aa', padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fff', border: '1.5px solid #fdba74', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Clock size={16} style={{ color: '#ea580c' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#c2410c' }}>
              ⏳ {fmtCurrency(wallet.nearest_expiring.amount)} expires in {countdown}
            </div>
            <div style={{ fontSize: '0.77rem', color: '#9a3412', marginTop: 2 }}>
              Expires on {fmtDate(wallet.nearest_expiring.expires_at)} — Use it on your next booking!
            </div>
          </div>
          {(onNavigateTab || onNavigateHome) && (
            <button
              onClick={() => {
                if (onNavigateTab) {
                  onNavigateTab('overview', 'explore');
                } else if (onNavigateHome) {
                  onNavigateHome();
                }
              }}
              style={{ padding: '7px 14px', borderRadius: 8, background: '#ea580c', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}
            >
              Book Now
            </button>
          )}
        </div>
      )}

      {/* ── HOW IT WORKS ── */}
      <div style={{ borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', padding: '14px 18px', marginBottom: 20 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Info size={13} /> How WOW GOA Wallet & Rewards Works
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
          {[
            { icon: '🎯', title: 'Complete Trips', desc: 'Finish bookings ₹1,500+' },
            { icon: '💰', title: 'Earn 10% Cashback', desc: 'Credited after completion' },
            { icon: '⏱️', title: '30-Day Validity', desc: 'FIFO expiry — use early!' },
            { icon: '🔒', title: '10% Redemption Cap', desc: 'Max 10% of next booking' },
          ].map((item, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '10px 12px' }}>
              <div style={{ fontSize: '1.1rem', marginBottom: 4 }}>{item.icon}</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e293b' }}>{item.title}</div>
              <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: 2 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── LEDGER ── */}
      <div style={{ borderRadius: 14, border: '1.5px solid #e5e7eb', background: '#fff', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>Transaction History</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {['ALL', 'EARNED', 'USED', 'EXPIRED'].map(f => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                style={{
                  padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontSize: '0.75rem', fontWeight: 600,
                  background: filterType === f ? '#6366f1' : '#f3f4f6',
                  color: filterType === f ? '#fff' : '#6b7280',
                  transition: 'all 0.2s'
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filteredTx.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
            <Wallet size={32} style={{ marginBottom: 10, opacity: 0.4 }} />
            <div style={{ fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>No transactions yet</div>
            <div style={{ fontSize: '0.82rem' }}>
              {wallet.available_balance === 0
                ? 'Complete your first qualifying booking to earn cashback!'
                : 'No transactions match this filter.'}
            </div>
          </div>
        ) : (
          <div>
            {filteredTx.map((tx, idx) => {
              const cfg = TRANSACTION_TYPE_CONFIG[tx.transaction_type] || TRANSACTION_TYPE_CONFIG['CASHBACK_CREDIT'];
              const isCredit = tx.transaction_type === 'CASHBACK_CREDIT' || tx.transaction_type === 'WALLET_REFUND';
              return (
                <div
                  key={tx.id || idx}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: idx < filteredTx.length - 1 ? '1px solid #f3f4f6' : 'none' }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color, flexShrink: 0 }}>
                    {cfg.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.87rem', color: '#111827' }}>{cfg.label}</div>
                    {tx.description && (
                      <div style={{ fontSize: '0.77rem', color: '#6b7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</div>
                    )}
                    <div style={{ fontSize: '0.73rem', color: '#9ca3af', marginTop: 2 }}>
                      {fmtDatetime(tx.created_at)}
                      {tx.expires_at && tx.status === 'AVAILABLE' && (
                        <span style={{ marginLeft: 8, color: '#f59e0b' }}>· Expires {fmtDate(tx.expires_at)}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isCredit ? '#16a34a' : '#2563eb' }}>
                      {isCredit ? '+' : '-'}{fmtCurrency(tx.amount)}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: '#9ca3af', marginTop: 2 }}>
                      {tx.status === 'AVAILABLE' && tx.remaining_amount > 0
                        ? `₹${Number(tx.remaining_amount).toLocaleString('en-IN')} remaining`
                        : tx.status}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', marginTop: 16 }}>
        Wallet data refreshed as of {wallet.server_time ? new Date(wallet.server_time).toLocaleString('en-IN') : '—'} ·
        <button onClick={loadData} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '0.75rem', marginLeft: 4 }}>Refresh now</button>
      </p>
    </div>
  );
}
