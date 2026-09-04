import React, { useState } from 'react';
import {
  Compass, Car, Calendar, MapPin, Hotel, Check, ShieldCheck,
  Download, Eye, Clock, Phone, AlertCircle, Sparkles, Fuel,
  Users, Key, FileText, ChevronRight, X, Layers
} from 'lucide-react';

import { getBookingDisplayImage } from '../../utils/bookingImageHelper';

export default function CustomerSelfDriveTab({
  currentUser,
  bookings = [],
  packages = [],
  cars = [],
  bikes = [],
  hotels = [],
  flights = [],
  onOpenBookingDetails,
  onNavigateTab
}) {
  const [selectedItineraryPkg, setSelectedItineraryPkg] = useState(null);

  // Filter Self Drive Holiday bookings for current user
  const selfDriveBookings = (bookings || []).filter(b => {
    const type = String(b.package_type || b.type || b.service_type || '').toLowerCase();
    const itemName = String(b.item_name || b.package_name || '').toLowerCase();
    return (
      b.package_type === 'Self Drive Package' || 
      b.type === 'selfdrive' || 
      type.includes('self drive') ||
      itemName.includes('self drive') ||
      b.type === 'package' ||
      b.type === 'vehicle' ||
      type === 'car'
    );
  });

  const getStatusStepIndex = (status) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'pending') return 0;
    if (s === 'confirmed') return 1;
    if (s === 'upcoming') return 2;
    if (s === 'ongoing') return 3;
    if (s === 'completed') return 4;
    return 1;
  };

  const STATUS_STEPS = [
    { label: 'Pending', desc: 'Awaiting verification' },
    { label: 'Confirmed', desc: 'Slot & vehicle reserved' },
    { label: 'Upcoming', desc: 'Ready for delivery' },
    { label: 'Ongoing', desc: 'Holiday in progress' },
    { label: 'Completed', desc: 'Returned successfully' },
  ];

  return (
    <div className="customer-tab-content animate-fade-in">
      
      {/* ─── Header Banner ─── */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <div className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill bg-warning bg-opacity-10 text-dark fw-bold text-xs mb-1">
            <Compass size={14} className="text-warning" />
            <span>PRIMARY BUSINESS FOCUS</span>
          </div>
          <h4 className="fw-black text-dark mb-0 font-heading" style={{ fontSize: '22px' }}>
            My Self Drive Holidays
          </h4>
          <p className="text-muted text-xs mb-0">
            Track your reserved self drive vehicles, pickup points, resort stays, inclusions, and Goa itineraries.
          </p>
        </div>

        <div className="d-flex gap-2">
          <a 
            href="/#self-drive-categories" 
            className="btn btn-warning text-dark fw-bold rounded-pill px-3 py-2 text-xs d-flex align-items-center gap-1.5 shadow-sm"
          >
            <Car size={15} />
            <span>Book Another Self Drive</span>
          </a>
        </div>
      </div>

      {/* ─── Self Drive Holiday Cards List ─── */}
      <div className="d-flex flex-column gap-4">
        {selfDriveBookings.map((b, idx) => {
          const stepIdx = getStatusStepIndex(b.status);
          const totalAmt = parseFloat(b.total_amount || b.amount || 0);
          const paidAmt = parseFloat(b.paid_amount || b.total_paid || 0);
          const pendingAmt = parseFloat(b.pending_amount || (totalAmt > paidAmt ? totalAmt - paidAmt : 0));

          return (
            <div key={b.id || idx} className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white" style={{ border: '1px solid #eef2f6' }}>
              
              {/* Card Header Bar */}
              <div className="card-header bg-light border-0 py-3 px-4 d-flex flex-wrap justify-content-between align-items-center gap-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-dark text-white text-xs px-3 py-1 rounded-pill fw-bold">
                    Booking ID: #{b.id || b.booking_id || `WOW-SD-${1000 + idx}`}
                  </span>
                  <span className="badge bg-warning bg-opacity-10 text-dark fw-bold text-xxs px-2.5 py-1 rounded">
                    🌴 Self Drive Holiday
                  </span>
                </div>

                <div className="d-flex align-items-center gap-2 text-xs">
                  <span className="text-muted">Booked on: {b.created_at ? new Date(b.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}</span>
                  <span className={`badge px-2.5 py-1 rounded-pill text-uppercase fw-bold ${
                    b.status === 'Confirmed' ? 'bg-success text-white' : 
                    b.status === 'Completed' ? 'bg-info text-white' : 
                    b.status === 'Cancelled' ? 'bg-danger text-white' : 'bg-warning text-dark'
                  }`}>
                    {b.status || 'Confirmed'}
                  </span>
                </div>
              </div>

              {/* Status Flow Tracker */}
              <div className="px-4 pt-3 pb-2 bg-white border-bottom">
                <div className="d-none d-md-flex align-items-center justify-content-between position-relative my-2">
                  <div className="position-absolute top-50 start-0 end-0 translate-middle-y bg-light" style={{ height: '3px', zIndex: 1 }} />
                  <div 
                    className="position-absolute top-50 start-0 translate-middle-y bg-warning" 
                    style={{ 
                      height: '3px', 
                      width: `${(stepIdx / (STATUS_STEPS.length - 1)) * 100}%`, 
                      zIndex: 2,
                      transition: 'width 0.4s ease'
                    }} 
                  />

                  {STATUS_STEPS.map((st, sIdx) => {
                    const isDone = sIdx <= stepIdx;
                    const isCurrent = sIdx === stepIdx;

                    return (
                      <div key={st.label} className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 3 }}>
                        <div 
                          className={`rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm ${
                            isCurrent ? 'bg-warning text-dark border-2 border-dark' : 
                            isDone ? 'bg-success text-white' : 'bg-white text-muted border'
                          }`}
                          style={{ width: '28px', height: '28px', fontSize: '11px' }}
                        >
                          {isDone ? <Check size={14} /> : sIdx + 1}
                        </div>
                        <div className={`text-xxs fw-bold mt-1 ${isCurrent ? 'text-dark' : isDone ? 'text-success' : 'text-muted'}`}>
                          {st.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card Body with Detailed Trip Information */}
              <div className="card-body p-4">
                <div className="row g-4">
                  
                  {/* Left Column: Vehicle Image & Specs */}
                  <div className="col-lg-4">
                    <div className="position-relative rounded-3 overflow-hidden p-3 text-center mb-3" style={{ background: '#f8fafc', border: '1px solid rgba(0,0,0,0.04)' }}>
                      <img 
                        src={getBookingDisplayImage(b, cars, bikes, packages, hotels, flights)} 
                        alt={b.item_name || 'Vehicle'} 
                        className="w-100 object-fit-contain"
                        style={{ height: '140px' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      <span className="position-absolute top-0 start-0 m-2 badge bg-success text-white text-xxs px-2 py-1 rounded-pill">
                        ✓ Sanitized & Verified
                      </span>
                    </div>

                    <h5 className="fw-black text-dark mb-1 font-heading" style={{ fontSize: '17px' }}>
                      {b.vehicle_name || b.item_name || 'Premium Self Drive Vehicle'}
                    </h5>
                    <div className="text-muted text-xs mb-3">
                      {b.vehicle_type || 'SUV / 4-Wheeler'} • Unlimited Kilometers
                    </div>

                    <div className="d-grid grid-cols-2 gap-2 text-xxs text-secondary">
                      <div className="p-2 bg-light rounded d-flex align-items-center gap-1.5">
                        <Fuel size={13} className="text-warning" />
                        <span>{b.fuel_type || 'Petrol / Diesel'}</span>
                      </div>
                      <div className="p-2 bg-light rounded d-flex align-items-center gap-1.5">
                        <Key size={13} className="text-warning" />
                        <span>Self Drive (Doorstep Delivery)</span>
                      </div>
                      <div className="p-2 bg-light rounded d-flex align-items-center gap-1.5">
                        <Users size={13} className="text-warning" />
                        <span>{b.seating || '5 Seater'}</span>
                      </div>
                      <div className="p-2 bg-light rounded d-flex align-items-center gap-1.5">
                        <ShieldCheck size={13} className="text-success" />
                        <span>Full Insurance Included</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Package Details & Schedule */}
                  <div className="col-lg-5">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="badge bg-warning bg-opacity-10 text-dark fw-bold text-xs px-2.5 py-1 rounded">
                        ⏱️ Duration: {b.duration || '3 Days / 2 Nights'}
                      </span>
                    </div>
                    <h4 className="fw-black text-dark mb-2 font-heading" style={{ fontSize: '20px' }}>
                      {b.package_name || b.item_name || 'Goa Coastal Bliss Self Drive Holiday'}
                    </h4>

                    {/* Pickup & Return Location Schedule Box */}
                    <div className="p-3 rounded-3 mb-3" style={{ background: '#f8fafc', border: '1px solid rgba(0,0,0,0.05)' }}>
                      <div className="d-flex align-items-start gap-2 mb-2 pb-2 border-bottom">
                        <MapPin size={15} className="text-danger flex-shrink-0 mt-0.5" />
                        <div className="w-100">
                          <div className="text-xxs text-muted text-uppercase fw-bold">Pickup Location & Time</div>
                          <div className="fw-bold text-dark text-xs">{b.pickup_location || b.pickup || 'Goa Airport (GOI)'}</div>
                          <div className="text-muted text-xxs">📅 {b.pickup_date || b.travel_date || 'Scheduled'} at {b.pickup_time || '10:00 AM'}</div>
                        </div>
                      </div>

                      <div className="d-flex align-items-start gap-2">
                        <MapPin size={15} className="text-success flex-shrink-0 mt-0.5" />
                        <div className="w-100">
                          <div className="text-xxs text-muted text-uppercase fw-bold">Return Drop Location & Time</div>
                          <div className="fw-bold text-dark text-xs">{b.drop_location || b.drop || 'North Goa / Airport'}</div>
                          <div className="text-muted text-xxs">📅 {b.drop_date || 'Scheduled Return'} at {b.drop_time || '10:00 AM'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Hotel Details if bundled */}
                    {(b.hotel_name || b.hotel_details) && (
                      <div className="p-2.5 rounded-3 bg-light d-flex align-items-center gap-2 text-xs mb-3">
                        <Hotel size={16} className="text-primary flex-shrink-0" />
                        <div>
                          <div className="fw-bold text-dark">{b.hotel_name || '4★ Beach Resort Stay Included'}</div>
                          <div className="text-muted text-xxs">Deluxe Room • Daily Breakfast Included</div>
                        </div>
                      </div>
                    )}

                    {/* Inclusions List */}
                    <div className="d-flex flex-wrap gap-1.5">
                      <span className="badge bg-light text-dark border text-xxs px-2 py-1">✓ Zero Security Deposit</span>
                      <span className="badge bg-light text-dark border text-xxs px-2 py-1">✓ Unlimited Kilometers</span>
                      <span className="badge bg-light text-dark border text-xxs px-2 py-1">✓ Free Delivery & Pickup</span>
                      <span className="badge bg-light text-dark border text-xxs px-2 py-1">✓ Goa Toll & Taxes Paid</span>
                    </div>
                  </div>

                  {/* Right Column: Pricing & Action Controls */}
                  <div className="col-lg-3 text-lg-end border-start-lg ps-lg-4 d-flex flex-column justify-content-between">
                    <div>
                      <div className="text-xs text-muted mb-1">Total Holiday Price</div>
                      <div className="fs-3 fw-black text-dark font-heading mb-2">
                        ₹{totalAmt.toLocaleString('en-IN')}
                      </div>

                      <div className="p-2.5 rounded-3 bg-light mb-3 text-xs">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="text-muted">Amount Paid:</span>
                          <span className="fw-bold text-success">₹{paidAmt.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Balance Due:</span>
                          <span className="fw-bold text-danger">₹{pendingAmt.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="d-grid gap-2">
                      <button 
                        onClick={() => setSelectedItineraryPkg(b)}
                        className="btn btn-warning text-dark fw-bold rounded-pill py-2 shadow-sm d-flex align-items-center justify-content-center gap-1.5"
                      >
                        <FileText size={15} />
                        <span>Day-by-Day Itinerary</span>
                      </button>

                      <button 
                        onClick={() => onOpenBookingDetails(b)}
                        className="btn btn-outline-dark btn-sm rounded-pill fw-bold"
                      >
                        View Voucher Details
                      </button>

                      <a 
                        href="https://wa.me/919876543210?text=Hi%20WOW%20GOA%20Team%2C%20I%20have%20an%20inquiry%20about%20my%20Self%20Drive%20Booking"
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-light btn-sm text-dark border rounded-pill fw-bold text-xxs d-flex align-items-center justify-content-center gap-1"
                      >
                        <Phone size={12} className="text-success" />
                        <span>WhatsApp Travel Concierge</span>
                      </a>
                    </div>
                  </div>

                </div>
              </div>

              {/* Chauffeur Add-on Strip if applicable */}
              {(b.driver_required == 1 || b.driver_required === 'yes' || b.driver_required === true) && (
                <div className="card-footer bg-warning bg-opacity-10 border-top border-warning border-opacity-25 px-4 py-3">
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-dark text-white fw-bold">Chauffeur Service</span>
                      <span className="text-xs text-dark">
                        {b.assigned_driver_name ? (
                          <span className="text-success fw-bold">
                            ✓ Driver Assigned: <strong>{b.assigned_driver_name}</strong> ({b.assigned_driver_phone || 'Call Available'}) • {b.assigned_driver_vehicle || 'Assigned Cab'}
                          </span>
                        ) : (
                          <span>⏳ Awaiting Chauffeur Acceptance (Driver notification dispatched)</span>
                        )}
                      </span>
                    </div>
                    <button 
                      onClick={() => onNavigateTab('driver-trips')}
                      className="btn btn-xs btn-dark fw-bold rounded-pill px-3 py-1"
                    >
                      View Driver Status →
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {selfDriveBookings.length === 0 && (
          <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
            <div className="rounded-circle p-4 bg-light d-inline-flex mx-auto mb-3 text-warning">
              <Compass size={48} />
            </div>
            <h4 className="fw-black text-dark mb-2 font-heading">No Self Drive Bookings Found</h4>
            <p className="text-muted text-sm mb-4" style={{ maxWidth: '450px', margin: '0 auto' }}>
              Experience Goa at your own pace with our curated Self Drive Holiday packages, including luxury cars, cruiser bikes, and verified beachfront stays.
            </p>
            <div>
              <a href="/#self-drive-categories" className="btn btn-warning text-dark fw-bold rounded-pill px-4 py-2.5 shadow-sm">
                Explore Self Drive Holidays →
              </a>
            </div>
          </div>
        )}
      </div>

      {/* ─── Day-by-Day Itinerary Modal ─── */}
      {selectedItineraryPkg && (
        <div className="modal-backdrop-custom d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(11, 25, 44, 0.6)', backdropFilter: 'blur(6px)', zIndex: 1060 }}>
          <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ width: '92%', maxWidth: '650px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header bg-dark text-white p-4 d-flex justify-content-between align-items-center">
              <div>
                <span className="badge bg-warning text-dark fw-bold text-xxs mb-1">GOA ITINERARY</span>
                <h5 className="fw-black mb-0 text-white font-heading">{selectedItineraryPkg.package_name || selectedItineraryPkg.item_name || 'Self Drive Trip Itinerary'}</h5>
              </div>
              <button onClick={() => setSelectedItineraryPkg(null)} className="btn btn-sm text-white-50 hover-text-white border-0">
                <X size={20} />
              </button>
            </div>

            <div className="card-body p-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 140px)' }}>
              <div className="d-flex flex-column gap-3">
                
                <div className="p-3 rounded-3 bg-light border">
                  <div className="d-flex align-items-center gap-2 text-xs fw-bold text-dark mb-1">
                    <span className="badge bg-warning text-dark">Day 1</span>
                    <span>Arrival in Goa & Vehicle Handover</span>
                  </div>
                  <p className="text-muted text-xs mb-0">
                    Doorstep vehicle delivery at {selectedItineraryPkg.pickup_location || 'Goa Airport'}. Quick digital inspection, key handover, and scenic coastal drive to your resort.
                  </p>
                </div>

                <div className="p-3 rounded-3 bg-light border">
                  <div className="d-flex align-items-center gap-2 text-xs fw-bold text-dark mb-1">
                    <span className="badge bg-warning text-dark">Day 2</span>
                    <span>North Goa Coastal Drive & Sunset Cruise</span>
                  </div>
                  <p className="text-muted text-xs mb-0">
                    Self-drive to Vagator, Anjuna, and Chapora Fort. Enjoy watersports at Calangute and an evening beach sunset dinner.
                  </p>
                </div>

                <div className="p-3 rounded-3 bg-light border">
                  <div className="d-flex align-items-center gap-2 text-xs fw-bold text-dark mb-1">
                    <span className="badge bg-warning text-dark">Day 3</span>
                    <span>South Goa Heritage Tour & Departure Handover</span>
                  </div>
                  <p className="text-muted text-xs mb-0">
                    Explore Old Goa Portuguese Churches, Fontainhas Latin Quarter, and seamless airport return drop-off at {selectedItineraryPkg.drop_location || 'Airport'}.
                  </p>
                </div>

              </div>
            </div>

            <div className="card-footer bg-light p-3 text-end">
              <button onClick={() => setSelectedItineraryPkg(null)} className="btn btn-secondary btn-sm rounded-pill px-4 fw-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
