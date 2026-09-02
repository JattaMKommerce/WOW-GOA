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
                <div className="card h-100 border-0 rounded-4 shadow-sm p-3.5 bg-white position-relative overflow-hidden" style={{ border: '1px solid #e2e8f0', transition: 'transform 0.2s' }}>
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

                  {/* Progress Bar & Status */}
                  <div className="mb-2">
                    <div className="d-flex align-items-center justify-content-between text-xs mb-1">
                      <span className="fw-bold text-dark" style={{ fontSize: '12px' }}>
                        {isPlat ? 'Highest Tier Reached' : `Progress to ${d.tier === 'Bronze' ? 'Silver' : d.tier === 'Silver' ? 'Gold' : 'Platinum'}`}
                      </span>
                      <span className="text-muted fw-bold" style={{ fontSize: '11px' }}>
                        {isPlat ? '10+ / 10' : `${count} / ${d.target || 4}`}
                      </span>
                    </div>

                    <div className="progress rounded-pill overflow-hidden" style={{ height: '8px', background: '#e2e8f0' }}>
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

                  {/* Target / Remaining Note */}
                  <div className="d-flex align-items-center justify-content-between pt-2 border-top mt-2" style={{ fontSize: '11px' }}>
                    <span className="text-muted d-flex align-items-center gap-1">
                      {isPlat ? (
                        <span className="text-purple fw-bold d-flex align-items-center gap-1">
                          <Sparkles size={12} /> Platinum VIP Privileges Active
                        </span>
                      ) : (
                        <span>{d.description || `${d.remaining} more to next tier`}</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tier Progression Explanation Legend */}
        <div className="mt-3 p-3 rounded-3 bg-white border d-flex flex-wrap align-items-center justify-content-between gap-2 text-xs">
          <div className="d-flex align-items-center gap-2 text-muted">
            <Info size={14} className="text-primary" />
            <span>Tier Milestones:</span>
          </div>
          <div className="d-flex flex-wrap align-items-center gap-3 text-xs">
            <span className="badge bg-light text-dark border px-2 py-1">🥉 Bronze: 1–3 Trips</span>
            <span className="badge bg-light text-dark border px-2 py-1">🥈 Silver: 4–6 Trips</span>
            <span className="badge bg-light text-dark border px-2 py-1">🥇 Gold: 7–9 Trips</span>
            <span className="badge bg-light text-dark border px-2 py-1">💎 Platinum: 10+ Trips</span>
          </div>
        </div>
      </div>
    </div>
  );
}
