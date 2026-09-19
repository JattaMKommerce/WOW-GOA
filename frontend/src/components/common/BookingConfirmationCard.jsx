import React from 'react';
import { 
  CheckCircle2, Gift, Clock, CreditCard, Lock, 
  Compass, Calendar, MapPin, Check
} from 'lucide-react';

/**
 * CashbackRewardCard — Prominent Brand Reward Section
 * Used standalone (e.g. in full-page checkout step 4) or inside BookingConfirmationCard
 * 
 * Strictly uses server-returned authoritative cashback data (cashback_preview).
 * Never recalculates cashback on the frontend.
 */
export function CashbackRewardCard({ cashbackPreview, isModalView = true, className = '' }) {
  const cashbackAmount = typeof cashbackPreview === 'number' 
    ? cashbackPreview 
    : (typeof cashbackPreview?.amount === 'number' ? cashbackPreview.amount : parseFloat(cashbackPreview?.amount || 0));

  if (isNaN(cashbackAmount) || cashbackAmount <= 0) {
    return null;
  }

  return (
    <div 
      className={`card border-0 rounded-4 p-3.5 mb-3.5 text-start position-relative overflow-hidden shadow-sm ${className}`}
      style={{ 
        background: 'linear-gradient(135deg, #0B192C 0%, #152A4A 60%, #1E3E62 100%)', 
        color: '#ffffff',
        border: '1px solid rgba(255, 193, 7, 0.35)',
        boxShadow: '0 10px 28px rgba(11, 25, 44, 0.25)'
      }}
    >
      {/* Top Gold Badge */}
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div className="d-inline-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill bg-warning text-dark text-xxs fw-black shadow-xs">
          <Gift size={13} />
          <span>🎁 Cashback Waiting for You</span>
        </div>
        <span className="badge bg-white bg-opacity-15 text-warning text-xxs fw-bold px-2 py-0.5 rounded-pill">
          WOW GOA REWARDS
        </span>
      </div>

      {/* Cashback Amount Highlight */}
      <div className="d-flex align-items-baseline gap-2 mb-1.5">
        <div className="fw-black text-warning font-heading" style={{ fontSize: '1.85rem', lineHeight: 1.1 }}>
          ₹{Number(cashbackAmount).toLocaleString('en-IN')}
        </div>
        <div className="text-white text-xs fw-bold">Cashback</div>
      </div>

      {/* Main Informative Message */}
      <p className="text-white-50 text-xs mb-3" style={{ lineHeight: 1.45 }}>
        This cashback will be added to your <strong>WOW GOA Wallet &amp; Rewards</strong> after your booking is completed.
      </p>

      {/* 4-Step Lifecycle Timeline */}
      <div 
        className="p-2.5 rounded-3 mb-3" 
        style={{ 
          background: 'rgba(255, 255, 255, 0.06)', 
          border: '1px solid rgba(255, 255, 255, 0.1)' 
        }}
      >
        <div className="text-white-50 text-xxs fw-bold text-uppercase mb-1.5 d-flex align-items-center gap-1">
          <span>Cashback Lifecycle</span>
        </div>
        <div className="d-flex align-items-center justify-content-between text-xxs text-center gap-1">
          <div className="d-flex flex-column align-items-center flex-1">
            <span className="badge bg-success rounded-circle p-1 mb-1 text-white">
              <Check size={9} strokeWidth={3} />
            </span>
            <span className="fw-bold text-white" style={{ fontSize: '10px' }}>1. Confirmed</span>
          </div>
          <span className="text-white-50">→</span>
          <div className="d-flex flex-column align-items-center flex-1">
            <span className="badge bg-secondary rounded-circle p-1 mb-1 text-white opacity-75" style={{ width: '16px', height: '16px', fontSize: '9px' }}>2</span>
            <span className="text-white-50" style={{ fontSize: '10px' }}>2. Completed</span>
          </div>
          <span className="text-white-50">→</span>
          <div className="d-flex flex-column align-items-center flex-1">
            <span className="badge bg-warning text-dark rounded-circle p-1 mb-1 fw-bold" style={{ width: '16px', height: '16px', fontSize: '9px' }}>3</span>
            <span className="text-warning fw-bold" style={{ fontSize: '10px' }}>3. Cashback Added</span>
          </div>
          <span className="text-white-50">→</span>
          <div className="d-flex flex-column align-items-center flex-1">
            <span className="badge bg-info text-white rounded-circle p-1 mb-1" style={{ width: '16px', height: '16px', fontSize: '9px' }}>4</span>
            <span className="text-info" style={{ fontSize: '10px' }}>4. Use on Next Trip</span>
          </div>
        </div>
      </div>

      {/* 3 Core Business Rule Bullet Points */}
      <div className="d-flex flex-column gap-1.5 pt-1 border-top border-white border-opacity-10">
        <div className="d-flex align-items-center gap-2 text-xxs text-white-50">
          <Clock size={12} className="text-warning flex-shrink-0" />
          <span>⏳ <strong>Valid for 30 days</strong> after it is credited to your wallet</span>
        </div>
        <div className="d-flex align-items-center gap-2 text-xxs text-white-50">
          <CreditCard size={12} className="text-info flex-shrink-0" />
          <span>💳 <strong>Use it on your next eligible booking</strong> through Customer Portal</span>
        </div>
        <div className="d-flex align-items-center gap-2 text-xxs text-white-50">
          <Lock size={12} className="text-success flex-shrink-0" />
          <span>🔒 <strong>Up to 10%</strong> of the eligible booking value can be redeemed per booking</span>
        </div>
      </div>
    </div>
  );
}

/**
 * BookingConfirmationCard — Unified WOW GOA Booking Confirmation Component
 * 
 * Standardized across all 7 D2C booking flows:
 * 1. Self Drive Cars
 * 2. Self Drive Bikes
 * 3. Vehicle + Driver
 * 4. Hotels
 * 5. Holiday Packages
 * 6. Craft My Trip
 * 7. Activities & Sightseeing
 * 
 * Strictly uses server-returned authoritative cashback data (cashback_preview).
 * Never recalculates cashback on the frontend.
 */
export default function BookingConfirmationCard({
  bookingId,
  customerName = 'Valued Guest',
  customerPhone = '',
  serviceTitle = '',
  serviceSubtitle = '',
  badgeText = '',
  cashbackPreview = null,
  details = [], // Array of { label, value, icon, badge, isHighlight, isSuccess }
  amountPaid = null,
  totalAmount = null,
  remainingBalance = null,
  paymentStatus = '',
  paymentMode = '',
  onClose = null,
  onTrackPortal = null,
  actions = null,
  showPortalCTA = true,
  isModalView = true,
}) {
  const handlePortalRedirect = () => {
    if (customerPhone) {
      try {
        const clean = String(customerPhone).replace(/\D/g, '');
        if (clean) {
          sessionStorage.setItem('customer_login_phone', clean);
          localStorage.setItem('customer_login_phone', clean);
        }
      } catch (e) {}
    }

    if (onTrackPortal && typeof onTrackPortal === 'function') {
      onTrackPortal();
    } else {
      window.location.href = '/customer';
    }
  };

  return (
    <div className={`wowgoa-booking-confirmation ${isModalView ? 'text-start' : 'w-100'}`} style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── A. SUCCESS HEADER ── */}
      <div className="text-center mb-4">
        <div 
          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-2"
          style={{ 
            width: '64px', 
            height: '64px', 
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.25) 100%)',
            color: '#10B981',
            boxShadow: '0 0 24px rgba(16, 185, 129, 0.25)'
          }}
        >
          <CheckCircle2 size={40} strokeWidth={2.5} />
        </div>

        <h3 className="fw-black text-dark mb-1 font-heading" style={{ fontSize: '1.65rem', letterSpacing: '-0.5px' }}>
          ✓ Booking Confirmed!
        </h3>

        {bookingId && (
          <div className="d-inline-flex align-items-center gap-1.5 badge bg-dark text-white px-3 py-1.5 rounded-pill text-xs fw-bold mb-2 shadow-xs">
            <span>Booking ID:</span>
            <span className="text-warning font-monospace" style={{ letterSpacing: '0.5px' }}>
              #{String(bookingId).replace(/^#/, '')}
            </span>
          </div>
        )}

        <p className="text-muted text-xs mb-0 px-2" style={{ maxWidth: '480px', margin: '0 auto' }}>
          Thank you, <strong className="text-dark">{customerName}</strong>. 
          {serviceTitle ? (
            <> Your reservation for <strong className="text-dark">{serviceTitle}</strong> has been successfully booked and confirmed.</>
          ) : (
            <> Your reservation has been successfully booked and confirmed.</>
          )}
        </p>

        {serviceSubtitle && (
          <p className="text-success text-xxs fw-bold mt-1 mb-0">
            {serviceSubtitle}
          </p>
        )}
      </div>

      {/* ── B. CASHBACK REWARD CARD (Authoritative Server Data) ── */}
      <CashbackRewardCard cashbackPreview={cashbackPreview} isModalView={isModalView} />

      {/* ── C. SERVICE-SPECIFIC BOOKING DETAILS ── */}
      {details && details.length > 0 && (
        <div 
          className="bg-light rounded-4 p-3.5 mb-3.5 border shadow-2xs text-start" 
          style={{ border: '1px solid #e2e8f0' }}
        >
          <div className="d-flex align-items-center justify-content-between mb-2.5 pb-2 border-bottom">
            <span className="text-secondary text-xs fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
              Reservation Summary
            </span>
            {paymentStatus && (
              <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 rounded-pill text-xxs fw-bold">
                {paymentStatus}
              </span>
            )}
          </div>

          <div className="d-flex flex-column gap-2">
            {details.map((item, idx) => (
              <div 
                key={idx} 
                className={`d-flex justify-content-between align-items-start gap-2 text-xs ${idx < details.length - 1 ? 'pb-2 border-bottom border-light' : ''}`}
              >
                <span className="text-muted d-flex align-items-center gap-1.5 flex-shrink-0">
                  {item.icon && <span className="text-secondary">{item.icon}</span>}
                  <span>{item.label}</span>
                </span>
                <span className={`text-end fw-bold ${item.isHighlight ? 'text-primary' : (item.isSuccess ? 'text-success' : 'text-dark')}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing & Payment Snapshot */}
          {(amountPaid !== null || totalAmount !== null) && (
            <div className="mt-2.5 pt-2.5 border-top d-flex flex-column gap-1.5">
              {totalAmount !== null && (
                <div className="d-flex justify-content-between align-items-center text-xs">
                  <span className="text-muted">Total Booking Value</span>
                  <span className="fw-bold text-dark">₹{Number(totalAmount).toLocaleString('en-IN')}</span>
                </div>
              )}
              {amountPaid !== null && (
                <div className="d-flex justify-content-between align-items-center text-xs">
                  <span className="text-muted">
                    Amount Paid {paymentMode ? `(${paymentMode})` : ''}
                  </span>
                  <span className="fw-black text-success fs-6">₹{Number(amountPaid).toLocaleString('en-IN')}</span>
                </div>
              )}
              {remainingBalance !== null && Number(remainingBalance) > 0 && (
                <div className="d-flex justify-content-between align-items-center text-xs text-primary fw-semibold pt-1 border-top border-light">
                  <span>Remaining Balance (Due at Check-in)</span>
                  <span className="fw-bold">₹{Number(remainingBalance).toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── D. CUSTOMER PORTAL TRACKING CTA ── */}
      {showPortalCTA && (
        <div 
          className="card border-0 shadow-sm rounded-4 p-3.5 mb-3 text-start bg-white" 
          style={{ border: '1.5px solid #fed7aa', background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFDF8 100%)' }}
        >
          <div className="d-flex align-items-center gap-2 mb-1.5">
            <Compass size={20} className="text-warning flex-shrink-0" />
            <h6 className="fw-bold text-dark mb-0 font-heading" style={{ fontSize: '14.5px' }}>
              Track in WOW GOA Customer Portal
            </h6>
          </div>
          <p className="text-muted text-xs mb-3" style={{ lineHeight: 1.45 }}>
            Track your booking itinerary, live driver assignment, voucher downloads, and <strong>Wallet Cashback</strong> anytime in your Customer Portal.
          </p>
          <button 
            type="button" 
            id="track-booking-portal-btn"
            className="btn btn-warning text-dark fw-bold rounded-pill px-4 py-2.5 text-xs d-flex align-items-center justify-content-center gap-2 shadow-sm w-100 font-heading"
            onClick={handlePortalRedirect}
          >
            <span>Track in WOW GOA Customer Portal →</span>
          </button>
        </div>
      )}

      {/* ── E. CUSTOM ACTIONS / BUTTONS ── */}
      {actions && (
        <div className="mt-2">
          {actions}
        </div>
      )}

      {onClose && !actions && (
        <div className="text-center mt-3">
          <button 
            type="button" 
            className="btn btn-outline-secondary rounded-pill px-4 py-2 text-xs fw-bold"
            onClick={onClose}
          >
            Close Window
          </button>
        </div>
      )}
    </div>
  );
}
