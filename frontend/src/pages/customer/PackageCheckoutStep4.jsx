import React from 'react';
import { CheckCircle2, ShieldCheck, Download, Printer, ArrowRight, Plane, Car, Hotel, MapPin, Calendar, Users, Phone, Mail, Compass, MessageCircle } from 'lucide-react';

export default function PackageCheckoutStep4({
  pkg,
  bookingRecord,
  serverPriceData,
  paymentMode,
  travellers,
  contactEmail,
  contactPhone,
  pickupDate,
  dropDate,
  onDone
}) {
  const bookingId = bookingRecord?.id || `TG-${Math.floor(100000 + Math.random() * 900000)}`;
  const total = Number(serverPriceData?.total_price || pkg?.price || 0);
  const isAdvance = paymentMode === 'advance';
  const advancePercent = serverPriceData?.advance_percentage || 25;
  const amountPaid = isAdvance ? Number(serverPriceData?.advance_amount || Math.round((total * advancePercent) / 100)) : total;
  const balanceDue = total - amountPaid;
  const leadTraveller = travellers?.[0] || { firstName: 'Valued', lastName: 'Guest' };
  const leadName = `${leadTraveller.firstName || ''} ${leadTraveller.lastName || ''}`.trim() || 'Valued Guest';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container py-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* Top Breadcrumb / Done Navigation */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button 
          type="button" 
          onClick={onDone} 
          className="btn btn-outline-secondary rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-2"
          style={{ fontSize: '0.85rem' }}
        >
          ← Back to Packages
        </button>
        <div className="d-flex gap-2">
          <button 
            type="button" 
            onClick={handlePrint} 
            className="btn btn-light border rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5 text-dark"
            style={{ fontSize: '0.85rem' }}
          >
            <Printer size={15} /> Print Receipt
          </button>
          <button 
            type="button" 
            onClick={handlePrint} 
            className="btn btn-primary rounded-pill px-4 py-1.5 fw-bold d-flex align-items-center gap-1.5 shadow-sm"
            style={{ background: '#00B8D9', borderColor: '#00B8D9', fontSize: '0.85rem' }}
          >
            <Download size={15} /> Download Voucher
          </button>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-9">

          {/* Success Hero Card */}
          <div className="bg-white border rounded-4 shadow-sm p-4 p-md-5 mb-4 text-center text-md-start position-relative overflow-hidden">
            <div className="position-absolute top-0 end-0 bg-success text-white px-4 py-1.5 rounded-bottom-start fw-bold small">
              ✓ Booking Confirmed &amp; Protected
            </div>

            <div className="d-flex flex-column flex-md-row align-items-center gap-4">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '74px', height: '74px', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}
              >
                <CheckCircle2 size={44} strokeWidth={2.4} />
              </div>
              <div className="flex-grow-1">
                <span className="badge bg-light text-success border border-success mb-2 px-3 py-1 fw-bold">
                  Instant Confirmation
                </span>
                <h2 className="fw-extrabold text-dark mb-1" style={{ fontSize: '1.75rem' }}>
                  Trip Package Booked Successfully!
                </h2>
                <p className="text-muted mb-2 small">
                  Thank you, <strong className="text-dark">{leadName}</strong>. Your reservation for <strong className="text-dark">{pkg?.name}</strong> is confirmed.
                </p>
                <div className="d-flex flex-wrap align-items-center gap-3 mt-3">
                  <div className="p-2 px-3 bg-light rounded-3 border d-flex align-items-center gap-2">
                    <span className="text-muted small">Booking Reference:</span>
                    <span className="fw-black text-primary font-monospace" style={{ fontSize: '1.05rem', letterSpacing: '0.5px' }}>
                      #{bookingId}
                    </span>
                  </div>
                  <div className="p-2 px-3 bg-light rounded-3 border d-flex align-items-center gap-2">
                    <span className="text-muted small">Status:</span>
                    <span className="badge bg-success">{isAdvance ? 'Confirmed (25% Advance Paid)' : 'Confirmed (Fully Paid)'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Voucher Document */}
          <div className="bg-white border rounded-4 shadow-sm p-4 p-md-5 mb-4">
            
            {/* Voucher Header */}
            <div className="d-flex justify-content-between align-items-start border-bottom pb-4 mb-4">
              <div>
                <h4 className="fw-bold text-dark mb-1">{pkg?.name}</h4>
                <div className="text-muted small d-flex align-items-center gap-2">
                  <MapPin size={14} className="text-danger" /> Goa, India • {pkg?.duration || '4 Days / 3 Nights'}
                </div>
              </div>
              <div className="text-end">
                <span className="text-muted small d-block">Booking Date</span>
                <strong className="text-dark">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
              </div>
            </div>

            {/* Grid Details */}
            <div className="row g-4 mb-4">
              
              {/* Trip Dates */}
              <div className="col-md-6">
                <div className="p-3.5 bg-light rounded-3 border h-100">
                  <div className="d-flex justify-content-between align-items-center mb-2.5">
                    <h6 className="fw-bold text-secondary mb-0 small text-uppercase d-flex align-items-center gap-1.5">
                      <Calendar size={15} className="text-primary" /> Trip Schedule &amp; Dates
                    </h6>
                    <span className="badge bg-primary bg-opacity-10 text-primary fw-bold" style={{ fontSize: '0.7rem' }}>
                      {pkg?.duration || '3 Nights / 4 Days'}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-1.5">
                    <span className="text-muted small">Start / Departure Date:</span>
                    <span className="fw-bold text-dark small">{pickupDate ? (new Date(pickupDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })) : 'Scheduled on arrival'}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted small">End / Check-Out Date:</span>
                    <span className="fw-bold text-success small">{dropDate ? (new Date(dropDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })) : 'Scheduled on departure'} ({pkg?.duration || '3 Nights / 4 Days'})</span>
                  </div>
                </div>
              </div>

              {/* Guest & Contact */}
              <div className="col-md-6">
                <div className="p-3.5 bg-light rounded-3 border h-100">
                  <h6 className="fw-bold text-secondary mb-2.5 small text-uppercase d-flex align-items-center gap-1.5">
                    <Users size={15} className="text-primary" /> Lead Traveller Details
                  </h6>
                  <div className="d-flex justify-content-between mb-1.5">
                    <span className="text-muted small">Lead Guest:</span>
                    <span className="fw-bold text-dark small">{leadName}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1.5">
                    <span className="text-muted small">Phone Number:</span>
                    <span className="fw-bold text-dark small">{contactPhone || 'Provided'}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted small">Email:</span>
                    <span className="fw-bold text-dark small">{contactEmail || 'Provided'}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Inclusions Card */}
            <div className="p-3.5 bg-light rounded-3 border mb-4">
              <h6 className="fw-bold text-secondary mb-3 small text-uppercase d-flex align-items-center gap-1.5">
                <ShieldCheck size={15} className="text-success" /> Confirmed Inclusions &amp; Services
              </h6>
              <div className="row g-3">
                <div className="col-md-4">
                  <div className="d-flex align-items-center gap-2">
                    <div className="p-2 bg-white rounded-2 border text-primary"><Hotel size={16} /></div>
                    <div>
                      <span className="text-muted text-xxs d-block">Accommodation</span>
                      <strong className="small text-dark">{pkg?.hotel_included || 'Luxury Resort Stay'}</strong>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-flex align-items-center gap-2">
                    <div className="p-2 bg-white rounded-2 border text-success"><Car size={16} /></div>
                    <div>
                      <span className="text-muted text-xxs d-block">Vehicle / Cab</span>
                      <strong className="small text-dark">{pkg?.car_included || 'Dedicated Chauffeur Cab'}</strong>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-flex align-items-center gap-2">
                    <div className="p-2 bg-white rounded-2 border text-info"><Compass size={16} /></div>
                    <div>
                      <span className="text-muted text-xxs d-block">Sightseeing &amp; Support</span>
                      <strong className="small text-dark">Daily Tours + 24/7 Concierge</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="border rounded-3 p-3.5 mb-4">
              <h6 className="fw-bold text-secondary mb-3 small text-uppercase">Payment &amp; Billing Summary</h6>
              <div className="d-flex justify-content-between mb-2 small">
                <span className="text-muted">Total Package Rate</span>
                <span className="fw-bold text-dark">₹{total.toLocaleString('en-IN')}</span>
              </div>
              <div className="d-flex justify-content-between mb-2 small">
                <span className="text-muted">Amount Paid Online ({isAdvance ? '25% Hold Advance' : 'Full Payment'})</span>
                <span className="fw-bold text-success">₹{amountPaid.toLocaleString('en-IN')}</span>
              </div>
              {balanceDue > 0 && (
                <div className="d-flex justify-content-between mb-2 small pt-2 border-top">
                  <span className="text-muted">Remaining Balance (Payable at Goa Check-in)</span>
                  <span className="fw-bold text-primary">₹{balanceDue.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            {/* Next Steps Info */}
            <div className="alert alert-info d-flex align-items-start gap-2.5 mb-0 small">
              <Compass size={18} className="flex-shrink-0 mt-0.5" />
              <div>
                <strong>What happens next?</strong>
                <p className="mb-0 mt-1">Our dedicated Goa travel manager has received your booking. You will receive an automated WhatsApp itinerary confirmation within 15 minutes, and our executive will coordinate airport pickup.</p>
              </div>
            </div>

          </div>

          {/* Action CTAs */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
            <a 
              href={`https://wa.me/919876543210?text=Hi%20TripGalileo,%20I%20just%20booked%20package%20#${bookingId}%20(${encodeURIComponent(pkg?.name || '')}).%20Please%20guide%20me.`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-success rounded-pill px-4 py-2.5 fw-bold d-flex align-items-center gap-2"
            >
              <MessageCircle size={18} /> Chat with Goa Travel Concierge
            </a>
            <button 
              type="button" 
              onClick={onDone} 
              className="btn btn-primary rounded-pill px-5 py-2.5 fw-bold shadow d-flex align-items-center gap-2"
              style={{ background: '#FF6333', borderColor: '#FF6333' }}
            >
              Explore More Goa Packages <ArrowRight size={18} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
