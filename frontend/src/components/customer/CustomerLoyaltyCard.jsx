// frontend/src/components/customer/CustomerLoyaltyCard.jsx
import React from 'react';
import { Car, Hotel, Compass, Crown, Sparkles, Award, CheckCircle2, ChevronRight, ShieldCheck, Info } from 'lucide-react';
import { calculateLoyaltyTiers } from '../../utils/loyaltyHelper';

export default function CustomerLoyaltyCard({ bookings = [], loyaltyData = null }) {
  // Use authoritative backend loyalty data if provided, else compute locally
  const computed = loyaltyData || calculateLoyaltyTiers(bookings);
  const car = computed.car || {};
  const hotel = computed.hotel || {};
  const trip = computed.trip || {};

  const categories = [
    {
      key: 'car',
      title: 'Car & Bike Tier',
      icon: <Car size={18} className="text-white" />,
      data: car,
      bgGradient: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
      accentColor: '#3b82f6',
      badgeBg: car.tier === 'Platinum' ? '#8b5cf6' : car.tier === 'Gold' ? '#eab308' : car.tier === 'Silver' ? '#94a3b8' : '#cd7f32'
    },
    {
      key: 'hotel',
      title: 'Hotel Stays Tier',
      icon: <Hotel size={18} className="text-white" />,
      data: hotel,
      bgGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      accentColor: '#10b981',
      badgeBg: hotel.tier === 'Platinum' ? '#8b5cf6' : hotel.tier === 'Gold' ? '#eab308' : hotel.tier === 'Silver' ? '#94a3b8' : '#cd7f32'
    },
    {
      key: 'trip',
      title: 'Trip & Package Tier',
      icon: <Compass size={18} className="text-white" />,
      data: trip,
      bgGradient: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
      accentColor: '#f97316',
      badgeBg: trip.tier === 'Platinum' ? '#8b5cf6' : trip.tier === 'Gold' ? '#eab308' : trip.tier === 'Silver' ? '#94a3b8' : '#cd7f32'
    }
  ];

  return (
    <div className="card border-0 rounded-4 shadow-sm mb-4 overflow-hidden" style={{ background: '#ffffff', border: '1px solid #eef2f6' }}>
      {/* Header */}
      <div className="p-4 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3" style={{ background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)' }}>
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-3 p-2.5 text-white d-flex align-items-center justify-content-center shadow-sm" style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)' }}>
            <Crown size={24} className="text-warning" />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h5 className="fw-black text-white mb-0 font-heading" style={{ fontSize: '18px' }}>
                My WOW GOA Membership & Loyalty Tiers
              </h5>
              <span className="badge bg-warning text-dark text-xs fw-bold px-2.5 py-0.5 rounded-pill">
                Active Member
              </span>
            </div>
            <p className="text-white-50 text-xs mb-0 mt-0.5">
              Service-specific tiers update automatically with every completed trip in Goa.
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 text-white-50 text-xs bg-black bg-opacity-25 px-3 py-1.5 rounded-pill">
          <ShieldCheck size={14} className="text-success" />
          <span>Only <strong>Completed Bookings</strong> count toward tier progression</span>
        </div>
      </div>

      {/* 3 Tier Cards Grid */}
      <div className="p-4 bg-light">
        <div className="row g-3">
          {categories.map((cat) => {
            const d = cat.data;
            const count = d.count || 0;
            const isPlat = d.is_platinum || count >= 10;
            const progress = d.progress || 0;

            return (
              <div key={cat.key} className="col-12 col-md-4">
                <div className="card h-100 border-0 rounded-4 shadow-sm p-3.5 bg-white position-relative overflow-hidden d-flex flex-column" style={{ border: '1px solid #e2e8f0', transition: 'transform 0.2s' }}>
                  {/* Top Header */}
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <div className="rounded-3 p-2 d-flex align-items-center justify-content-center shadow-sm" style={{ background: cat.bgGradient, width: '36px', height: '36px' }}>
                        {cat.icon}
                      </div>
                      <div>
                        <div className="fw-bold text-dark text-xs">{cat.title}</div>
                        <div className="text-muted" style={{ fontSize: '11px' }}>{count} Completed Booking{count !== 1 ? 's' : ''}</div>
                      </div>
                    </div>

                    <span className="badge text-white fw-bold px-2.5 py-1 rounded-pill shadow-sm" style={{ background: cat.badgeBg, fontSize: '11px' }}>
                      {d.badge || '🥉 Bronze'}
                    </span>
                  </div>

                  {/* Current Active Benefits */}
                  <div className="mb-3">
                    <div className="text-muted fw-bold mb-1" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Current Tier Benefits
                    </div>
                    <div className="d-flex flex-column gap-1">
                      {(d.benefits || ['Standard 10% cashback']).map((b, bIdx) => (
                        <div key={bIdx} className="d-flex align-items-center gap-1.5 text-xs text-dark">
                          <CheckCircle2 size={13} className="text-success flex-shrink-0" />
                          <span style={{ fontSize: '11px' }}>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Progress Bar & Target */}
                  <div className="mt-auto mb-2">
                    <div className="d-flex align-items-center justify-content-between text-xs mb-1">
                      <span className="fw-bold text-dark" style={{ fontSize: '11px' }}>
                        {isPlat ? 'Highest Tier Reached' : `Progress to ${d.next_tier || 'Next Tier'}`}
                      </span>
                      <span className="text-muted fw-bold" style={{ fontSize: '11px' }}>
                        {isPlat ? '10+ / 10' : `${count} / ${d.target || 4}`}
                      </span>
                    </div>

                    <div className="progress rounded-pill overflow-hidden" style={{ height: '7px', background: '#e2e8f0' }}>
                      <div 
                        className="progress-bar rounded-pill" 
                        role="progressbar" 
                        style={{ 
                          width: `${isPlat ? 100 : progress}%`, 
                          background: isPlat ? 'linear-gradient(90deg, #8b5cf6, #ec4899)' : `linear-gradient(90deg, ${cat.accentColor}, #f59e0b)`,
                          transition: 'width 0.6s ease'
                        }}
                      />
                    </div>
                  </div>

                  {/* Next-Tier UI Callout */}
                  {!isPlat && d.next_tier && d.next_perk && (
                    <div className="p-2.5 rounded-3 mt-1" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                      <div className="fw-bold text-dark text-xs mb-0.5 d-flex align-items-center gap-1.5">
                        <Sparkles size={13} className="text-warning flex-shrink-0" />
                        <span><strong>{d.remaining}</strong> {d.remaining === 1 ? 'booking' : 'bookings'} away from <strong>{d.next_tier}</strong></span>
                      </div>
                      <div className="text-xs fw-bold ps-3.5" style={{ color: '#15803d', fontSize: '11px' }}>
                        Unlock {d.next_perk}
                      </div>
                    </div>
                  )}

                  {isPlat && (
                    <div className="p-2.5 rounded-3 mt-1" style={{ background: '#faf5ff', border: '1px solid #e9d5ff' }}>
                      <div className="fw-bold text-xs d-flex align-items-center gap-1.5" style={{ color: '#7e22ce' }}>
                        <Sparkles size={13} />
                        <span>Platinum VIP Privileges Active</span>
                      </div>
                      <div className="text-muted mt-0.5 ps-3.5" style={{ fontSize: '10px' }}>
                        10% cashback • Free upgrade / VIP benefits
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tier Progression Explanation Legend */}
        <div className="mt-3 p-3 rounded-3 bg-white border d-flex flex-column gap-2 text-xs">
          <div className="d-flex align-items-center gap-2 text-dark fw-bold">
            <Info size={14} className="text-primary flex-shrink-0" />
            <span>WOW GOA Loyalty Tier Milestones &amp; Benefits:</span>
          </div>
          <div className="row g-2">
            <div className="col-12 col-md-6 col-lg-3">
              <div className="p-2 rounded-2 bg-light border h-100">
                <div className="fw-bold text-dark">🥉 Bronze (1–3 Bookings)</div>
                <div className="text-muted mt-0.5" style={{ fontSize: '11px' }}>• Standard 10% cashback</div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <div className="p-2 rounded-2 bg-light border h-100">
                <div className="fw-bold text-dark">🥈 Silver (4–6 Bookings)</div>
                <div className="text-muted mt-0.5" style={{ fontSize: '11px' }}>• 10% cashback<br />• Priority support</div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <div className="p-2 rounded-2 bg-light border h-100">
                <div className="fw-bold text-dark">🥇 Gold (7–9 Bookings)</div>
                <div className="text-muted mt-0.5" style={{ fontSize: '11px' }}>• 10% cashback<br />• ₹500 extra discount on eligible bookings</div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <div className="p-2 rounded-2 bg-light border h-100">
                <div className="fw-bold text-dark">💎 Platinum (10+ Bookings)</div>
                <div className="text-muted mt-0.5" style={{ fontSize: '11px' }}>• 10% cashback<br />• Free upgrade / VIP benefits</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
