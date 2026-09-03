// frontend/src/components/customer/CustomerWalletTab.jsx
import React, { useState, useEffect } from 'react';
import { 
  Wallet, Clock, Gift, ArrowUpRight, ArrowDownLeft, ShieldCheck, 
  AlertCircle, Sparkles, RefreshCw, CheckCircle2, ChevronRight, Info, AlertTriangle, Calendar
} from 'lucide-react';
import * as api from '../../services/api';

export default function CustomerWalletTab({ currentUser, onNavigateToBookings }) {
  const [wallet, setWallet] = useState({
    available_balance: 0,
    total_earned: 0,
    total_used: 0,
    total_expired: 0,
    nearest_expiring: null,
    server_time: new Date().toISOString(),
    transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'EARNED' | 'USED' | 'EXPIRED'
  const [countdownText, setCountdownText] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  const phone = currentUser?.phone || currentUser?.username || '';
  const customerId = currentUser?.id || '';

  const loadWallet = async () => {
    setLoading(true);
    try {
      const data = await api.fetchCustomerWallet(phone, customerId);
      if (data) {
        setWallet(data);
        if (data.nearest_expiring && data.nearest_expiring.seconds_remaining > 0) {
          setSecondsRemaining(data.nearest_expiring.seconds_remaining);
        } else {
          setSecondsRemaining(0);
        }
      }
    } catch (e) {
      console.warn("Failed to load customer wallet", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, [phone, customerId]);

  // Live countdown timer ticker (ticks every second)
  useEffect(() => {
    if (secondsRemaining <= 0) {
      setCountdownText('Expired or No Active Expiry');
      return;
    }

    const formatCountdown = (totalSec) => {
      const days = Math.floor(totalSec / (3600 * 24));
      const hours = Math.floor((totalSec % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      if (days > 0) {
        return `${days} Day${days > 1 ? 's' : ''} ${hours}h ${minutes}m ${seconds}s`;
      } else if (hours > 0) {
        return `${hours} Hours ${minutes} Minutes ${seconds} Seconds`;
      } else {
        return `${minutes} Minutes ${seconds} Seconds`;
      }
    };

    setCountdownText(formatCountdown(secondsRemaining));

    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setCountdownText('Expired');
          return 0;
        }
        const next = prev - 1;
        setCountdownText(formatCountdown(next));
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining]);

  const transactions = wallet.transactions || [];

  const filteredTransactions = transactions.filter(t => {
    const type = (t.transaction_type || '').toUpperCase();
    const st = (t.status || '').toUpperCase();
    if (filterType === 'EARNED') return type === 'CASHBACK_CREDIT';
    if (filterType === 'USED') return type === 'CASHBACK_USED';
    if (filterType === 'EXPIRED') return type === 'CASHBACK_EXPIRED' || st === 'EXPIRED';
    return true;
  });

  const formatExpiryRelative = (tx) => {
    if (tx.status === 'EXPIRED') return <span className="text-danger fw-bold">❌ Expired</span>;
    if (tx.status === 'USED') return <span className="text-muted">✅ Fully Used</span>;
    if (tx.status === 'REVERSED') return <span className="text-secondary">↩️ Reversed</span>;
    if (!tx.expires_at) return '—';

    const exp = new Date(tx.expires_at).getTime();
    const diff = exp - Date.now();
    if (diff <= 0) return <span className="text-danger fw-bold">❌ Expired</span>;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days >= 1) {
      return (
        <span className={`fw-bold ${days <= 3 ? 'text-danger' : 'text-warning'}`}>
          ⏳ Expires in {days} day{days > 1 ? 's' : ''}
        </span>
      );
    }
    return (
      <span className="fw-bold text-danger animate-pulse">
        ⏳ Expires in {hours}h {Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))}m
      </span>
    );
  };

  return (
    <div className="customer-tab-content animate-fade-in">
      
      {/* ─── Top Balance Hero Card ─── */}
      <div className="card border-0 rounded-4 shadow-sm mb-4 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)' }}>
        <div className="card-body p-4 text-white">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-4 p-3 text-warning d-flex align-items-center justify-content-center shadow" style={{ background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(10px)' }}>
                <Wallet size={28} />
              </div>
              <div>
                <div className="d-flex align-items-center gap-2">
                  <h4 className="fw-black mb-0 font-heading text-white" style={{ fontSize: '22px' }}>
                    WOW GOA Cashback Wallet
                  </h4>
                  <span className="badge bg-warning text-dark fw-bold text-xs px-2.5 py-0.5 rounded-pill">
                    10% Cashback Active
                  </span>
                </div>
                <p className="text-white-50 text-xs mb-0 mt-0.5">
                  Earn 10% instant cashback on customer-paid amounts across Cars, Hotels, and Tours upon trip completion.
                </p>
              </div>
            </div>

            <button 
              onClick={loadWallet} 
              disabled={loading}
              className="btn btn-sm btn-light bg-white bg-opacity-20 text-white border-0 rounded-pill px-3 py-1.5 text-xs fw-bold d-flex align-items-center gap-1.5"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh Balance
            </button>
          </div>

          <div className="row g-3 align-items-center pt-2">
            {/* Main Balance Display */}
            <div className="col-12 col-md-5">
              <div className="p-3.5 rounded-4" style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                <div className="text-white-50 text-xs text-uppercase fw-bold tracking-wider mb-1">
                  Available Cashback Balance
                </div>
                <div className="fs-1 fw-black text-warning font-heading mb-1 d-flex align-items-baseline gap-1">
                  <span>₹{wallet.available_balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="text-white-50 text-xs d-flex align-items-center gap-1">
                  <ShieldCheck size={13} className="text-success" />
                  <span>Usable during checkout on your next Goa booking</span>
                </div>
              </div>
            </div>

            {/* Nearest Expiry Countdown */}
            <div className="col-12 col-md-7">
              <div className="p-3.5 rounded-4 h-100 d-flex flex-column justify-content-center" style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                {wallet.nearest_expiring && wallet.available_balance > 0 ? (
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="text-warning text-xs fw-bold d-flex align-items-center gap-1">
                        <Clock size={14} /> Nearest Expiry Countdown (30-Day Policy)
                      </span>
                      <span className="badge bg-danger bg-opacity-75 text-white text-xs px-2 py-0.5 rounded-pill">
                        ₹{wallet.nearest_expiring.amount} expiring
                      </span>
                    </div>

                    <div className="fw-black text-white font-monospace fs-4 my-1">
                      ⏳ {countdownText}
                    </div>

                    <div className="text-white-50 text-xs mt-1">
                      Expires on: <strong>{wallet.nearest_expiring.formatted_expires_at}</strong>. Use before expiry on any eligible booking.
                    </div>
                  </div>
                ) : (
                  <div className="py-2 text-center text-md-start">
                    <div className="text-white fw-bold text-sm mb-1 d-flex align-items-center gap-1">
                      <Sparkles size={16} className="text-warning" /> No Urgent Expiring Cashback
                    </div>
                    <div className="text-white-50 text-xs">
                      Complete an upcoming booking to earn 10% Cashback credited directly to your WOW GOA Wallet.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Metric Cards ─── */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 rounded-4 shadow-sm p-3 bg-white" style={{ border: '1px solid #eef2f6' }}>
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-xs fw-bold text-muted text-uppercase tracking-wider">Total Earned</span>
              <div className="rounded-circle p-1.5 bg-success bg-opacity-10 text-success">
                <ArrowDownLeft size={16} />
              </div>
            </div>
            <div className="fs-4 fw-black text-success font-heading">
              ₹{wallet.total_earned.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-muted" style={{ fontSize: '11px' }}>10% cashback credited</div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 rounded-4 shadow-sm p-3 bg-white" style={{ border: '1px solid #eef2f6' }}>
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-xs fw-bold text-muted text-uppercase tracking-wider">Total Used</span>
              <div className="rounded-circle p-1.5 bg-primary bg-opacity-10 text-primary">
                <ArrowUpRight size={16} />
              </div>
            </div>
            <div className="fs-4 fw-black text-primary font-heading">
              ₹{wallet.total_used.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-muted" style={{ fontSize: '11px' }}>Deducted on bookings</div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 rounded-4 shadow-sm p-3 bg-white" style={{ border: '1px solid #eef2f6' }}>
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-xs fw-bold text-muted text-uppercase tracking-wider">Total Expired</span>
              <div className="rounded-circle p-1.5 bg-danger bg-opacity-10 text-danger">
                <Clock size={16} />
              </div>
            </div>
            <div className="fs-4 fw-black text-danger font-heading">
              ₹{wallet.total_expired.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-muted" style={{ fontSize: '11px' }}>Past 30-day window</div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 rounded-4 shadow-sm p-3 bg-white" style={{ border: '1px solid #eef2f6' }}>
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-xs fw-bold text-muted text-uppercase tracking-wider">Cashback Rate</span>
              <div className="rounded-circle p-1.5 bg-warning bg-opacity-10 text-warning">
                <Gift size={16} />
              </div>
            </div>
            <div className="fs-4 fw-black text-dark font-heading">
              10%
            </div>
            <div className="text-muted" style={{ fontSize: '11px' }}>On customer-paid amount</div>
          </div>
        </div>
      </div>

      {/* ─── Transaction History Table ─── */}
      <div className="card border-0 rounded-4 shadow-sm bg-white overflow-hidden mb-4" style={{ border: '1px solid #eef2f6' }}>
        <div className="p-3.5 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h6 className="fw-black text-dark mb-0 font-heading" style={{ fontSize: '16px' }}>
              Cashback Transaction History
            </h6>
            <span className="text-muted text-xs">Complete ledger of your cashback credits, redemptions, and 30-day expiries.</span>
          </div>

          <div className="d-flex flex-wrap gap-1.5">
            {['ALL', 'EARNED', 'USED', 'EXPIRED'].map(filter => (
              <button
                key={filter}
                onClick={() => setFilterType(filter)}
                className={`btn btn-sm px-3 py-1 rounded-pill text-xs fw-bold border-0 ${filterType === filter ? 'bg-dark text-white shadow-sm' : 'bg-light text-muted'}`}
              >
                {filter === 'ALL' ? 'All Transactions' : filter}
              </button>
            ))}
          </div>
        </div>

        <div className="table-responsive">
          <table className="table align-middle mb-0" style={{ fontSize: '0.82rem' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Transaction Type</th>
                <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Booking Reference</th>
                <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Amount</th>
                <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Validity / Expiry</th>
                <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Status</th>
                <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(tx => {
                const isCredit = tx.transaction_type === 'CASHBACK_CREDIT';
                const isUsed = tx.transaction_type === 'CASHBACK_USED';
                const isExpired = tx.transaction_type === 'CASHBACK_EXPIRED' || tx.status === 'EXPIRED';
                const isReversed = tx.transaction_type === 'CASHBACK_REVERSED' || tx.status === 'REVERSED';

                return (
                  <tr key={tx.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <td className="px-3 py-3">
                      <div className="d-flex align-items-center gap-2">
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center text-white" 
                          style={{ 
                            width: '32px', 
                            height: '32px', 
                            minWidth: '32px',
                            background: isCredit ? '#10b981' : (isUsed ? '#3b82f6' : (isExpired ? '#ef4444' : '#6b7280'))
                          }}
                        >
                          {isCredit ? <Gift size={14} /> : (isUsed ? <ArrowUpRight size={14} /> : <Clock size={14} />)}
                        </div>
                        <div>
                          <div className="fw-bold text-dark">
                            {isCredit ? '🎁 Cashback Earned' : (isUsed ? '💳 Cashback Used' : (isExpired ? '❌ Cashback Expired' : '↩️ Cashback Reversed'))}
                          </div>
                          <div className="text-muted" style={{ fontSize: '11px' }}>
                            {tx.description || (isCredit ? '10% Cashback Credited' : 'Redeemed on Booking')}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      {tx.booking_id ? (
                        <span className="badge bg-light text-dark border px-2.5 py-1 font-monospace fw-bold">
                          #{tx.booking_id}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <div className={`fw-black fs-6 font-heading ${isCredit ? 'text-success' : (isUsed ? 'text-primary' : 'text-danger')}`}>
                        {isCredit ? `+₹${parseFloat(tx.amount).toLocaleString('en-IN')}` : `-₹${parseFloat(tx.amount).toLocaleString('en-IN')}`}
                      </div>
                      {isCredit && tx.remaining_amount !== undefined && tx.status !== 'EXPIRED' && tx.status !== 'USED' && (
                        <div className="text-muted" style={{ fontSize: '10px' }}>
                          Remaining: ₹{parseFloat(tx.remaining_amount).toLocaleString('en-IN')}
                        </div>
                      )}
                    </td>

                    <td className="px-3 py-3">
                      {isCredit ? (
                        <div>
                          <div>{formatExpiryRelative(tx)}</div>
                          {tx.expires_at && (
                            <div className="text-muted" style={{ fontSize: '10px' }}>
                              Expires: {new Date(tx.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <span className={`badge text-xs px-2.5 py-1 rounded-pill fw-bold ${
                        tx.status === 'AVAILABLE' ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25' :
                        tx.status === 'PARTIALLY_USED' ? 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25' :
                        tx.status === 'USED' ? 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25' :
                        tx.status === 'REVERSED' ? 'bg-secondary bg-opacity-10 text-secondary border' :
                        'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25'
                      }`}>
                        {tx.status}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-muted" style={{ fontSize: '11px' }}>
                      {tx.created_at || tx.earned_at || '—'}
                    </td>
                  </tr>
                );
              })}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    <Wallet size={36} className="mx-auto text-secondary opacity-50 mb-2" />
                    <h6 className="fw-bold text-dark mb-1">No Wallet Transactions Found</h6>
                    <p className="text-muted text-xs mb-0">
                      When you book cars, hotels, or packages, your 10% cashback movements will appear here.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Cashback Rules Explanatory Banner ─── */}
      <div className="card border-0 rounded-4 shadow-sm p-4 bg-light">
        <div className="d-flex align-items-start gap-3">
          <div className="rounded-3 p-2 bg-primary text-white mt-1">
            <Info size={20} />
          </div>
          <div>
            <h6 className="fw-bold text-dark mb-1">How WOW GOA 10% Cashback Works</h6>
            <div className="row g-3 mt-1 text-xs text-muted">
              <div className="col-12 col-md-4">
                <div className="fw-bold text-dark mb-0.5">1. Automatic Calculation</div>
                <div>You receive 10% cashback on the actual eligible amount you paid (Cash, Online, UPI, Card). Wallet discounts used are excluded.</div>
              </div>
              <div className="col-12 col-md-4">
                <div className="fw-bold text-dark mb-0.5">2. Credited on Trip Completion</div>
                <div>Cashback is added to your wallet once your booking is marked <strong>Completed</strong>.</div>
              </div>
              <div className="col-12 col-md-4">
                <div className="fw-bold text-dark mb-0.5">3. 30-Day Validity & Earliest First</div>
                <div>Each cashback credit expires 30 days after being earned. When you book again, your earliest-expiring cashback is deducted first.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
