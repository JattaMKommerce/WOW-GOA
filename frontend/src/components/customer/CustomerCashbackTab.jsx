import React from 'react';
import {
  Gift, Award, TrendingUp, Clock, CheckCircle2,
  Sparkles, ArrowRight, ShieldCheck, Tag
} from 'lucide-react';

export default function CustomerCashbackTab({
  currentUser,
  cashbackBalance = 0,
  cashbackHistory = []
}) {
  return (
    <div className="customer-tab-content animate-fade-in">
      
      {/* ─── Header ─── */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h4 className="fw-black text-dark mb-1 font-heading" style={{ fontSize: '22px' }}>
            My Cashback & Rewards
          </h4>
          <p className="text-muted text-xs mb-0">
            Earn automatic cashback on every Self Drive Holiday and vehicle rental in Goa.
          </p>
        </div>
      </div>

      {/* ─── Cashback Metric Cards ─── */}
      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 text-white p-4 h-100 overflow-hidden position-relative" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)' }}>
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <span className="badge bg-white bg-opacity-20 text-white text-xxs px-2.5 py-1 rounded-pill fw-bold">
                  🎁 REWARDS CLUB
                </span>
                <div className="text-white-50 text-xs mt-2">Available Cashback Balance</div>
                <div className="fs-1 fw-black text-white font-heading mt-1">
                  ₹{Number(cashbackBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="rounded-circle p-3 bg-white bg-opacity-20 text-white">
                <Gift size={28} />
              </div>
            </div>

            <div className="pt-3 border-top border-white border-opacity-20 d-flex justify-content-between align-items-center text-xs text-white-50">
              <span>Automatic 100% redemption at checkout</span>
              <span className="text-white fw-bold">No expiry</span>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white" style={{ border: '1px solid #eef2f6' }}>
            <h6 className="fw-bold text-dark mb-3 font-heading">Loyalty Tiers &amp; Cashback Benefits</h6>
            
            <div className="d-flex flex-column gap-2">
              <div className="p-2 rounded-3 bg-light d-flex align-items-center justify-content-between text-xs border">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge text-dark fw-bold" style={{ background: '#cd7f32', color: '#fff' }}>🥉 BRONZE (1–3)</span>
                  <span className="fw-bold text-dark">Standard 10% Cashback</span>
                </div>
                <span className="text-muted text-xxs">All completed bookings</span>
              </div>

              <div className="p-2 rounded-3 bg-light d-flex align-items-center justify-content-between text-xs border">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-secondary text-white fw-bold">🥈 SILVER (4–6)</span>
                  <span className="fw-bold text-dark">10% Cashback + Priority Support</span>
                </div>
                <span className="text-muted text-xxs">Dedicated assistance</span>
              </div>

              <div className="p-2 rounded-3 bg-light d-flex align-items-center justify-content-between text-xs border">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-warning text-dark fw-bold">🥇 GOLD (7–9)</span>
                  <span className="fw-bold text-dark">10% Cashback + ₹500 Extra Discount</span>
                </div>
                <span className="text-muted text-xxs">On eligible bookings</span>
              </div>

              <div className="p-2 rounded-3 bg-light d-flex align-items-center justify-content-between text-xs border">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-purple text-white fw-bold" style={{ background: '#8b5cf6' }}>💎 PLATINUM (10+)</span>
                  <span className="fw-bold text-dark">10% Cashback + Free Upgrade / VIP</span>
                </div>
                <span className="text-muted text-xxs">Highest tier perks</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Cashback History Ledger ─── */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white" style={{ border: '1px solid #eef2f6' }}>
        <div className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-bottom">
          <h6 className="fw-bold text-dark mb-0 font-heading">Cashback Activity Ledger</h6>
          <span className="text-muted text-xxs">{cashbackHistory.length} record(s)</span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead className="bg-light text-muted text-xs text-uppercase">
              <tr>
                <th className="ps-4">Reward ID</th>
                <th>Trip Reference</th>
                <th>Promotion</th>
                <th>Date</th>
                <th>Cashback Earned</th>
                <th className="text-end pe-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {cashbackHistory.map((cb, idx) => (
                <tr key={cb.id || idx}>
                  <td className="ps-4 fw-bold text-dark font-heading">
                    #{cb.id || `CB-${1000 + idx}`}
                  </td>
                  <td className="fw-bold text-dark">
                    {cb.booking_title || cb.package_name || 'Self Drive Booking'}
                  </td>
                  <td>
                    <span className="badge bg-purple bg-opacity-10 text-purple text-xxs fw-bold px-2 py-0.5 rounded" style={{ color: '#7C3AED', background: 'rgba(124,58,237,0.1)' }}>
                      {cb.promo_name || 'Holiday Reward'}
                    </span>
                  </td>
                  <td className="text-xs text-muted">
                    {cb.created_at ? new Date(cb.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                  </td>
                  <td className="fw-black text-success">
                    +₹{Number(cb.amount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="text-end pe-4">
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1 rounded-pill text-xxs fw-bold">
                      {cb.status || 'Credited'}
                    </span>
                  </td>
                </tr>
              ))}

              {cashbackHistory.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    <Gift size={36} className="mb-2 text-muted opacity-50" />
                    <div>No cashback rewards recorded yet. Complete a Self Drive Holiday to earn cashback!</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
