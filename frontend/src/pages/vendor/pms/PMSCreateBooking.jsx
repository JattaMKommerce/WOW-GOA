import React, { useState } from 'react';
import {
  FilePlus, Building, BedDouble, Users, DollarSign, CreditCard,
  CheckCircle, AlertCircle, Phone, Mail, MapPin, FileText, Save
} from 'lucide-react';
import * as api from '../../../services/api';

export default function PMSCreateBooking({ currentUser, vendorHotels, onComplete }) {
  const [form, setForm] = useState({
    hotel_id: vendorHotels[0]?.id || '',
    room_type: '', adults: 2, children: 0,
    pickup_date: '', drop_date: '',
    guest_name: '', guest_phone: '', guest_email: '', guest_address: '',
    booking_source: 'Manual',
    room_price: '', discount: '', extra_charges: '', advance_payment: '',
    payment_method: 'Cash', special_request: '', internal_note: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const hotel = vendorHotels.find(h => h.id === form.hotel_id);

  const nights = form.pickup_date && form.drop_date
    ? Math.max(0, (new Date(form.drop_date) - new Date(form.pickup_date)) / 86400000)
    : 0;

  const roomPrice = parseInt(form.room_price || 0);
  const roomTotal = roomPrice * nights;
  const taxes = Math.round(roomTotal * 0.18);
  const discount = parseInt(form.discount || 0);
  const extra = parseInt(form.extra_charges || 0);
  const grandTotal = roomTotal + taxes - discount + extra;
  const advance = parseInt(form.advance_payment || 0);
  const balance = grandTotal - advance;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.hotel_id || !form.guest_name || !form.guest_phone || !form.pickup_date || !form.drop_date || !form.room_price) {
      setError('Please fill all required fields.'); return;
    }
    if (new Date(form.drop_date) <= new Date(form.pickup_date)) {
      setError('Check-out date must be after check-in date.'); return;
    }
    if (nights < 1) { setError('Minimum 1 night stay required.'); return; }

    setSaving(true); setError('');
    try {
      await api.pmsCreateManualBooking({
        ...form,
        hotel_name: hotel?.name || '',
        vendor_id: currentUser.id,
        nights,
        room_price: roomPrice,
        total_amount: grandTotal,
        amount_paid: advance,
        remaining_amount: balance
      });
      setSuccess('Booking created successfully!');
      window.dispatchEvent(new CustomEvent('new-booking-created'));
      setTimeout(onComplete, 1500);
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  };

  const inp = (label, key, type = 'text', placeholder = '', required = false) => (
    <div className="mb-3">
      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem', color: '#495057' }}>{label}{required && <span className="text-danger ms-1">*</span>}</label>
      <input className="form-control form-control-sm rounded-3" type={type} value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder} required={required} />
    </div>
  );

  return (
    <div className="p-4" style={{ background: '#f0f2f5', minHeight: '100%' }}>
      <div className="mb-4">
        <h4 className="fw-bold mb-1" style={{ color: '#1a2b4a' }}>Create Booking</h4>
        <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Create manual, walk-in or phone bookings directly from the PMS</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Left: Booking Form */}
          <div className="col-12 col-lg-8">
            {error && <div className="alert alert-danger py-2 px-3 mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.82rem' }}><AlertCircle size={14} />{error}</div>}
            {success && <div className="alert alert-success py-2 px-3 mb-3" style={{ fontSize: '0.82rem' }}>✅ {success}</div>}

            {/* Hotel & Dates */}
            <div className="card border-0 rounded-4 shadow-sm p-4 mb-4" style={{ background: '#fff' }}>
              <h6 className="fw-bold mb-3" style={{ color: '#1a2b4a', borderBottom: '2px solid #FF6333', paddingBottom: '8px', display: 'inline-block' }}>
                <Building size={15} className="me-2" />Property & Dates
              </h6>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Hotel *</label>
                  <select className="form-select form-select-sm rounded-3" value={form.hotel_id} onChange={e => set('hotel_id', e.target.value)} required>
                    {vendorHotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Check-in Date *</label>
                  <input type="date" className="form-control form-control-sm rounded-3" value={form.pickup_date} onChange={e => set('pickup_date', e.target.value)} required />
                </div>
                <div className="col-6">
                  <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Check-out Date *</label>
                  <input type="date" className="form-control form-control-sm rounded-3" value={form.drop_date} min={form.pickup_date} onChange={e => set('drop_date', e.target.value)} required />
                </div>
                <div className="col-12 col-md-4">{inp('Room Type', 'room_type', 'text', 'e.g. Deluxe Room')}</div>
                <div className="col-6 col-md-4">
                  <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Adults *</label>
                  <input type="number" min="1" className="form-control form-control-sm rounded-3" value={form.adults} onChange={e => set('adults', parseInt(e.target.value))} />
                </div>
                <div className="col-6 col-md-4">
                  <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Children</label>
                  <input type="number" min="0" className="form-control form-control-sm rounded-3" value={form.children} onChange={e => set('children', parseInt(e.target.value))} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Booking Source</label>
                  <select className="form-select form-select-sm rounded-3" value={form.booking_source} onChange={e => set('booking_source', e.target.value)}>
                    {['Manual', 'Walk-in', 'Phone Booking', 'Website', 'Partner', 'Other'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Guest Info */}
            <div className="card border-0 rounded-4 shadow-sm p-4 mb-4" style={{ background: '#fff' }}>
              <h6 className="fw-bold mb-3" style={{ color: '#1a2b4a', borderBottom: '2px solid #FF6333', paddingBottom: '8px', display: 'inline-block' }}>
                <Users size={15} className="me-2" />Guest Information
              </h6>
              <div className="row g-3">
                <div className="col-12 col-md-6">{inp('Guest Name *', 'guest_name', 'text', 'Full name', true)}</div>
                <div className="col-12 col-md-6">{inp('Mobile Number *', 'guest_phone', 'tel', '+91 9876543210', true)}</div>
                <div className="col-12 col-md-6">{inp('Email Address', 'guest_email', 'email', 'guest@example.com')}</div>
                <div className="col-12 col-md-6">{inp('Address', 'guest_address', 'text', 'City, State')}</div>
              </div>
            </div>

            {/* Pricing */}
            <div className="card border-0 rounded-4 shadow-sm p-4 mb-4" style={{ background: '#fff' }}>
              <h6 className="fw-bold mb-3" style={{ color: '#1a2b4a', borderBottom: '2px solid #FF6333', paddingBottom: '8px', display: 'inline-block' }}>
                <DollarSign size={15} className="me-2" />Pricing & Payment
              </h6>
              <div className="row g-3">
                <div className="col-6 col-md-3">{inp('Room Price (₹/night) *', 'room_price', 'number', '5000', true)}</div>
                <div className="col-6 col-md-3">{inp('Discount (₹)', 'discount', 'number', '0')}</div>
                <div className="col-6 col-md-3">{inp('Extra Charges (₹)', 'extra_charges', 'number', '0')}</div>
                <div className="col-6 col-md-3">{inp('Advance Payment (₹)', 'advance_payment', 'number', '0')}</div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Payment Method</label>
                  <select className="form-select form-select-sm rounded-3" value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
                    {['Cash', 'UPI', 'Card', 'Bank Transfer', 'Online', 'Cheque'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="card border-0 rounded-4 shadow-sm p-4 mb-4" style={{ background: '#fff' }}>
              <h6 className="fw-bold mb-3" style={{ color: '#1a2b4a' }}>Requests & Notes</h6>
              <div className="mb-3">
                <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Special Request</label>
                <textarea className="form-control form-control-sm rounded-3" rows={2} value={form.special_request} onChange={e => set('special_request', e.target.value)} placeholder="Guest requests, preferences..."></textarea>
              </div>
              <div>
                <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Internal Note</label>
                <textarea className="form-control form-control-sm rounded-3" rows={2} value={form.internal_note} onChange={e => set('internal_note', e.target.value)} placeholder="Staff-only notes..."></textarea>
              </div>
            </div>
          </div>

          {/* Right: Price Summary */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 rounded-4 shadow-sm p-4 sticky-top" style={{ background: '#fff', top: '20px' }}>
              <h6 className="fw-bold mb-4" style={{ color: '#1a2b4a' }}>Booking Summary</h6>

              {hotel && (
                <div className="d-flex align-items-center gap-2 mb-4 p-3 rounded-3" style={{ background: '#f8f9fa' }}>
                  <Building size={20} className="text-muted" />
                  <div>
                    <div className="fw-bold" style={{ fontSize: '0.85rem' }}>{hotel.name}</div>
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>{hotel.location}, Goa</div>
                  </div>
                </div>
              )}

              <div className="d-flex flex-column gap-2 mb-4">
                {[
                  ['Check-in', form.pickup_date || '—'],
                  ['Check-out', form.drop_date || '—'],
                  ['Duration', nights > 0 ? `${nights} night(s)` : '—'],
                  ['Guests', `${form.adults} adults, ${form.children} children`],
                  null,
                  ['Room (₹/night)', `₹${roomPrice.toLocaleString('en-IN')}`],
                  ['Room Total', `₹${roomTotal.toLocaleString('en-IN')}`],
                  ['GST (18%)', `₹${taxes.toLocaleString('en-IN')}`],
                  ['Discount', discount > 0 ? `-₹${discount.toLocaleString('en-IN')}` : '—'],
                  ['Extra Charges', extra > 0 ? `₹${extra.toLocaleString('en-IN')}` : '—'],
                ].map((row, i) => row === null ? <hr key={i} className="my-1" style={{ borderColor: '#f0f2f5' }} /> : (
                  <div key={i} className="d-flex justify-content-between align-items-center">
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>{row[0]}</span>
                    <span className="fw-semibold" style={{ fontSize: '0.82rem' }}>{row[1]}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-3 p-3 mb-4" style={{ background: '#0D1B2E' }}>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-white-50" style={{ fontSize: '0.8rem' }}>Grand Total</span>
                  <span className="text-white fw-bold" style={{ fontSize: '1.1rem' }}>₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-white-50" style={{ fontSize: '0.8rem' }}>Advance Paid</span>
                  <span className="fw-bold" style={{ color: '#00b894', fontSize: '0.9rem' }}>₹{advance.toLocaleString('en-IN')}</span>
                </div>
                <hr style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                <div className="d-flex justify-content-between">
                  <span className="text-white-50" style={{ fontSize: '0.8rem' }}>Balance Payable</span>
                  <span className="fw-bold" style={{ color: balance > 0 ? '#fd79a8' : '#00b894', fontSize: '0.95rem' }}>₹{balance.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button type="submit" disabled={saving} className="btn w-100 rounded-pill fw-bold py-3 d-flex align-items-center justify-content-center gap-2" style={{ background: saving ? '#6c757d' : '#00b894', color: '#fff' }}>
                <CheckCircle size={18} />{saving ? 'Creating Booking...' : 'Confirm & Create Booking'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
