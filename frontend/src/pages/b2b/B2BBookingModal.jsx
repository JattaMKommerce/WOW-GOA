import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ShieldCheck, User, Phone, Mail, Calendar, Clock, DollarSign, Gift, Tag, Building2, Cake, AlertCircle, FileText, Download } from 'lucide-react';
import * as api from '../../services/api';
import { validateBookingDates } from '../../utils/dateUtils';

export default function B2BBookingModal({
  selectedItem,
  serviceType = 'hotel',
  b2bMode = 'COMMISSION',
  partnerUser,
  onClose,
  onBookingSuccess
}) {
  if (!selectedItem) return null;

  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestDob, setGuestDob] = useState('');
  const [pickupDate, setPickupDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dropDate, setDropDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [numRooms, setNumRooms] = useState(1);
  const [numGuests, setNumGuests] = useState(2);
  const [bookingDays, setBookingDays] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');

  // Authoritative Pricing State
  const [pricingSnapshot, setPricingSnapshot] = useState(null);
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Recalculate authoritative price preview whenever relevant fields change
  useEffect(() => {
    let isMounted = true;
    const fetchPricing = async () => {
      setLoadingPricing(true);
      setError('');
      try {
        const preview = await api.fetchB2BPricingPreview({
          b2b_partner_id: partnerUser?.id,
          service_type: serviceType,
          item_id: selectedItem.id,
          days: bookingDays,
          qty: serviceType === 'hotel' ? numRooms : numGuests,
          mode: b2bMode,
          room_price: selectedItem.price || selectedItem.price_per_night,
          guests: numGuests,
          total_amount: selectedItem.price ? (selectedItem.price * bookingDays) : 5000
        });
        if (isMounted) {
          setPricingSnapshot(preview);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to calculate B2B pricing.');
        }
      } finally {
        if (isMounted) setLoadingPricing(false);
      }
    };

    fetchPricing();
    return () => { isMounted = false; };
  }, [selectedItem, serviceType, b2bMode, bookingDays, numRooms, numGuests, partnerUser]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanPhone = String(guestPhone || '').replace(/\D/g, '');
    if (!guestName || cleanPhone.length < 10) {
      setError('Please enter a valid guest name and 10-digit mobile phone number.');
      return;
    }

    setSubmitting(true);
    try {
      const idempotencyKey = `idemp_${partnerUser.id}_${selectedItem.id}_${Date.now()}`;
      const payload = {
        b2b_partner_id: partnerUser.id,
        b2b_mode: b2bMode,
        service_type: serviceType,
        item_id: selectedItem.id,
        item_name: selectedItem.name,
        guest_name: guestName,
        guest_phone: cleanPhone,
        guest_email: guestEmail,
        guest_dob: guestDob,
        pickup_date: pickupDate,
        drop_date: dropDate,
        booking_days: bookingDays,
        num_rooms: numRooms,
        guests: numGuests,
        special_requests: specialRequests,
        idempotency_key: idempotencyKey,
        payment_method: 'B2B Account / Cash'
      };

      const res = await api.b2bBook(payload);
      if (res && res.success) {
        setConfirmedBooking(res);
        if (onBookingSuccess) onBookingSuccess(res);
      } else {
        setError(res.error || 'Failed to confirm B2B booking.');
      }
    } catch (err) {
      setError(err.message || 'B2B Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout-modal-backdrop animate-fade-in" onClick={onClose} style={{ zIndex: 1060 }}>
      <div className="checkout-modal-content rounded-4 overflow-hidden shadow-2xl" style={{ maxWidth: confirmedBooking ? '560px' : '880px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="px-4 py-3 text-white d-flex justify-content-between align-items-center" style={{ background: '#0D1B2E' }}>
          <div className="d-flex align-items-center gap-2">
            <Building2 size={20} className="text-warning" />
            <div>
              <h5 className="fw-bold mb-0 font-heading">
                {confirmedBooking ? 'B2B Booking Voucher Confirmed' : `B2B Booking: ${selectedItem.name}`}
              </h5>
              <div className="text-white-50 text-xxs">
                Agency: <strong>{partnerUser?.company_name || partnerUser?.name}</strong> • Mode: <span className="badge bg-warning text-dark text-xxs">{b2bMode}</span>
              </div>
            </div>
          </div>
          <button className="btn btn-link text-white-50 p-0 border-0" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          {confirmedBooking ? (
            /* Confirmation Screen */
            <div className="text-center py-3">
              <div className="rounded-circle mx-auto mb-3 p-3 bg-success text-white d-inline-flex align-items-center justify-content-center" style={{ width: '64px', height: '64px' }}>
                <CheckCircle2 size={36} />
              </div>
              <h4 className="fw-bold text-dark font-heading mb-1">Booking Confirmed Successfully!</h4>
              <p className="text-muted text-xs mb-3">
                B2B Reservation Reference: <strong className="text-primary font-monospace">{confirmedBooking.booking_id}</strong>
              </p>

              {/* Voucher Card */}
              <div className="card border-0 rounded-3 p-3 bg-light text-start mx-auto mb-4 border" style={{ maxWidth: '440px', fontSize: '0.82rem' }}>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Item / Service:</span>
                  <span className="fw-bold text-dark">{selectedItem.name}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Guest Name:</span>
                  <span className="fw-bold text-dark">{guestName}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Guest Contact:</span>
                  <span>{guestPhone}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Dates:</span>
                  <span>{pickupDate} to {dropDate}</span>
                </div>
                <div className="d-flex justify-content-between border-top pt-2 mb-2">
                  <span className="text-muted">B2B Mode:</span>
                  <span className="badge bg-dark text-warning">{b2bMode}</span>
                </div>

                {b2bMode === 'COMMISSION' ? (
                  <div className="d-flex justify-content-between bg-success bg-opacity-10 p-2 rounded text-success fw-bold">
                    <span>Partner Commission Earned:</span>
                    <span>₹{Number(confirmedBooking.pricing_snapshot?.b2b_commission_amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                ) : (
                  <div className="d-flex justify-content-between bg-primary bg-opacity-10 p-2 rounded text-primary fw-bold">
                    <span>Partner Net Price Paid:</span>
                    <span>₹{Number(confirmedBooking.pricing_snapshot?.final_payable_amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              <div className="d-flex gap-2 justify-content-center">
                <button className="btn btn-warning text-dark fw-bold rounded-pill px-4 text-xs font-heading" onClick={onClose}>
                  Done & Return to B2B
                </button>
              </div>
            </div>
          ) : (
            /* Booking Form + Authoritative Price Breakdown */
            <form onSubmit={handleBookingSubmit}>
              {error && (
                <div className="alert alert-danger py-2 px-3 rounded-3 text-xs d-flex align-items-center gap-2 mb-3">
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
              )}

              <div className="row g-4">
                {/* Guest Details Column */}
                <div className="col-lg-7">
                  <h6 className="fw-bold text-dark text-xs text-uppercase tracking-wider mb-3 pb-2 border-bottom">
                    1. Guest & Travel Details
                  </h6>

                  <div className="row g-3 mb-3">
                    <div className="col-12 col-sm-6">
                      <label className="form-label text-xs fw-semibold text-muted mb-1">Guest Full Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. John Doe"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label text-xs fw-semibold text-muted mb-1">Guest Mobile Phone *</label>
                      <input
                        type="tel"
                        className="form-control form-control-sm"
                        placeholder="10-digit mobile number"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-12 col-sm-6">
                      <label className="form-label text-xs fw-semibold text-muted mb-1">Guest Email (Optional)</label>
                      <input
                        type="email"
                        className="form-control form-control-sm"
                        placeholder="guest@example.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label text-xs fw-semibold text-muted mb-1">Guest Date of Birth</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={guestDob}
                        onChange={(e) => setGuestDob(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label text-xs fw-semibold text-muted mb-1">Check-in / Start Date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label text-xs fw-semibold text-muted mb-1">Check-out / End Date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={dropDate}
                        onChange={(e) => setDropDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    {serviceType === 'hotel' ? (
                      <>
                        <div className="col-6">
                          <label className="form-label text-xs fw-semibold text-muted mb-1">Number of Rooms</label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            className="form-control form-control-sm"
                            value={numRooms}
                            onChange={(e) => setNumRooms(parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label text-xs fw-semibold text-muted mb-1">Nights</label>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            className="form-control form-control-sm"
                            value={bookingDays}
                            onChange={(e) => setBookingDays(parseInt(e.target.value) || 1)}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="col-6">
                          <label className="form-label text-xs fw-semibold text-muted mb-1">Rental / Tour Days</label>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            className="form-control form-control-sm"
                            value={bookingDays}
                            onChange={(e) => setBookingDays(parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label text-xs fw-semibold text-muted mb-1">Number of Guests</label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            className="form-control form-control-sm"
                            value={numGuests}
                            onChange={(e) => setNumGuests(parseInt(e.target.value) || 1)}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Authoritative Financial Breakdown Column */}
                <div className="col-lg-5">
                  <div className="card border-0 rounded-4 shadow-sm p-3 bg-light border">
                    <h6 className="fw-bold text-dark text-xs text-uppercase tracking-wider mb-2 pb-2 border-bottom">
                      2. Authoritative B2B Pricing
                    </h6>

                    {loadingPricing ? (
                      <div className="text-center py-4">
                        <span className="spinner-border spinner-border-sm text-primary" role="status"></span>
                        <div className="text-muted text-xxs mt-2">Computing authoritative B2B price...</div>
                      </div>
                    ) : pricingSnapshot ? (
                      <div className="small">
                        <div className="d-flex justify-content-between mb-1.5 text-muted">
                          <span>Reference Public Price:</span>
                          <span>₹{pricingSnapshot.original_reference_price?.toLocaleString('en-IN')}</span>
                        </div>

                        {b2bMode === 'COMMISSION' ? (
                          <>
                            <div className="d-flex justify-content-between mb-1.5 text-muted">
                              <span>Applied Commission Rate:</span>
                              <span className="fw-bold text-dark">{pricingSnapshot.b2b_commission_percentage}%</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2 p-2 rounded bg-success bg-opacity-10 text-success fw-bold">
                              <span className="d-flex align-items-center gap-1">
                                <Gift size={13} /> Partner Commission:
                              </span>
                              <span>+₹{pricingSnapshot.b2b_commission_amount?.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="d-flex justify-content-between border-top pt-2 mb-2 fw-bold text-dark fs-6">
                              <span>Selling / Guest Price:</span>
                              <span>₹{pricingSnapshot.final_payable_amount?.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="text-muted text-xxs">
                              * Commission will be credited to agency statements upon booking completion.
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="d-flex justify-content-between mb-1.5 text-muted">
                              <span>B2B Net Discount:</span>
                              <span className="fw-bold text-primary">{pricingSnapshot.b2b_net_discount_percentage}% OFF</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2 p-2 rounded bg-primary bg-opacity-10 text-primary fw-bold">
                              <span className="d-flex align-items-center gap-1">
                                <Tag size={13} /> Partner Net Savings:
                              </span>
                              <span>-₹{(pricingSnapshot.original_reference_price - pricingSnapshot.final_payable_amount).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="d-flex justify-content-between border-top pt-2 mb-2 fw-bold text-dark fs-6">
                              <span>Partner Net Payable:</span>
                              <span className="text-primary font-heading">₹{pricingSnapshot.final_payable_amount?.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="text-muted text-xxs">
                              * Net rate booking. No separate commission credited.
                            </div>
                          </>
                        )}
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={submitting || loadingPricing}
                      className="btn btn-warning text-dark fw-bold w-100 py-2.5 rounded-pill mt-4 shadow-sm font-heading d-flex align-items-center justify-content-center gap-2"
                      style={{ fontSize: '0.88rem' }}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm"></span>
                          <span>Confirming Booking...</span>
                        </>
                      ) : (
                        <>
                          <span>Confirm B2B Booking</span>
                          <CheckCircle2 size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
