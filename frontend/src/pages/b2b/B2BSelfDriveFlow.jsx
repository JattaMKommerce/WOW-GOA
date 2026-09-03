import React, { useState, useEffect, useMemo } from 'react';
import { 
  Car, Calendar, Clock, MapPin, Fuel, Gauge, Users, Shield, 
  CheckCircle2, AlertCircle, ArrowRight, ChevronRight, User, Phone, 
  Mail, FileText, Check, DollarSign, Percent, Sparkles, Navigation, X
} from 'lucide-react';
import * as api from '../../services/api';

const GOA_LOCATIONS = [
  { id: 'mopa', name: 'Manohar International Airport (Mopa - GOX)', type: 'Airport' },
  { id: 'dabolim', name: 'Dabolim Airport (GOI - South Goa)', type: 'Airport' },
  { id: 'madgaon', name: 'Madgaon Railway Station (MAO)', type: 'Station' },
  { id: 'thivim', name: 'Thivim Railway Station', type: 'Station' },
  { id: 'panjim', name: 'Panjim Central Bus Stand / City Center', type: 'Hub' },
  { id: 'calangute', name: 'Calangute / Baga / Candolim Beach Hub', type: 'North Goa' },
  { id: 'anjuna', name: 'Anjuna / Vagator / Siolim', type: 'North Goa' },
  { id: 'colva', name: 'Colva / Benaulim / Varca', type: 'South Goa' },
  { id: 'doorstep', name: 'Hotel / Resort Doorstep Delivery (Anywhere in Goa)', type: 'Custom' }
];

export default function B2BSelfDriveFlow({ partner, activeMode, onBookingSuccess }) {
  // Mode: strictly governed by activeMode prop ('COMMISSION' or 'NON_COMMISSION')
  const mode = activeMode || (partner?.allow_commission ? 'COMMISSION' : 'NON_COMMISSION');

  // Search parameters
  const [pickupLoc, setPickupLoc] = useState('Manohar International Airport (Mopa - GOX)');
  const [dropLoc, setDropLoc] = useState('Manohar International Airport (Mopa - GOX)');
  const [sameDrop, setSameDrop] = useState(true);
  const [withDriver, setWithDriver] = useState(false);

  // Default dates: tomorrow to 4 days later
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const initialPickup = tomorrow.toISOString().split('T')[0];

  const defaultDrop = new Date();
  defaultDrop.setDate(defaultDrop.getDate() + 4);
  const initialDrop = defaultDrop.toISOString().split('T')[0];

  const [pickupDate, setPickupDate] = useState(initialPickup);
  const [dropDate, setDropDate] = useState(initialDrop);
  const [pickupTime, setPickupTime] = useState('10:00');
  const [dropTime, setDropTime] = useState('10:00');

  // Vehicles state
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');

  // Booking modal & form
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [guestDetails, setGuestDetails] = useState({
    name: '',
    phone: '',
    email: '',
    id_type: 'Aadhaar / Driving License',
    id_number: '',
    flight_number: '',
    special_requests: '',
    payment_method: 'B2B Account / Cash'
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccessData, setBookingSuccessData] = useState(null);

  // Calculate rental duration in days
  const daysCount = useMemo(() => {
    if (!pickupDate || !dropDate) return 1;
    const start = new Date(pickupDate);
    const end = new Date(dropDate);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  }, [pickupDate, dropDate]);

  // Load vehicles from backend
  useEffect(() => {
    async function loadVehicles() {
      setLoading(true);
      try {
        const res = await api.apiFetch(`${api.API_BASE}?resource=cars`);
        if (res.ok) {
          const data = await res.json();
          setVehicles(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.warn('Failed to load cars from backend:', err);
      } finally {
        setLoading(false);
      }
    }
    loadVehicles();
  }, []);

  // Compute B2B pricing for a vehicle
  const calculateVehiclePricing = (veh) => {
    const ratePerDay = parseFloat(veh.price_per_day || veh.price || 1500);
    const driverChargePerDay = withDriver ? 600 : 0;
    const totalDailyRate = ratePerDay + driverChargePerDay;
    const subtotal = totalDailyRate * daysCount;
    const taxAmount = Math.round(subtotal * 0.18);
    const originalSellingPrice = subtotal + taxAmount;

    // Commission rules (Default 10% commission or partner rate)
    const commPercent = parseFloat(partner?.default_commission_rate || 10.00);
    const netDiscountPercent = parseFloat(partner?.default_net_discount_rate || 10.00);

    if (mode === 'COMMISSION') {
      const commAmount = Math.round(originalSellingPrice * (commPercent / 100));
      return {
        sellingPrice: originalSellingPrice,
        commissionPercent: commPercent,
        commissionAmount: commAmount,
        netPayable: originalSellingPrice - commAmount,
        finalPrice: originalSellingPrice,
        mode: 'COMMISSION'
      };
    } else {
      // NON_COMMISSION (Wholesale Net)
      const discountAmount = Math.round(originalSellingPrice * (netDiscountPercent / 100));
      const netPrice = originalSellingPrice - discountAmount;
      return {
        sellingPrice: originalSellingPrice,
        netDiscountPercent: netDiscountPercent,
        discountAmount: discountAmount,
        netPrice: netPrice,
        finalPrice: netPrice,
        mode: 'NON_COMMISSION'
      };
    }
  };

  const handleSelectToBook = (veh) => {
    setSelectedVehicle(veh);
    setIsBookingModalOpen(true);
    setBookingError('');
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!guestDetails.name.trim() || !guestDetails.phone.trim()) {
      setBookingError('Primary guest name and phone number are required.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    const pricing = calculateVehiclePricing(selectedVehicle);

    const bookingPayload = {
      b2b_partner_id: partner?.id,
      b2b_mode: mode,
      service_type: 'vehicle',
      item_id: selectedVehicle.id,
      item_name: `${selectedVehicle.name} (${withDriver ? 'With Driver' : 'Self Drive'})`,
      days: daysCount,
      qty: 1,
      pickup_date: `${pickupDate} ${pickupTime}`,
      drop_date: `${dropDate} ${dropTime}`,
      pickup_location: pickupLoc,
      drop_location: sameDrop ? pickupLoc : dropLoc,
      guest_name: guestDetails.name,
      guest_phone: guestDetails.phone,
      guest_email: guestDetails.email,
      payment_method: guestDetails.payment_method,
      extra_details: {
        total_amount: pricing.sellingPrice,
        with_driver: withDriver,
        id_type: guestDetails.id_type,
        id_number: guestDetails.id_number,
        flight_number: guestDetails.flight_number,
        special_requests: guestDetails.special_requests
      }
    };

    try {
      const res = await api.b2bBook(bookingPayload);
      if (res && res.success) {
        setBookingSuccessData(res);
        if (onBookingSuccess) onBookingSuccess(res);
      } else {
        setBookingError(res.error || 'Failed to confirm booking.');
      }
    } catch (err) {
      setBookingError(err.message || 'An error occurred during booking creation.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Filter vehicles
  const filteredVehicles = useMemo(() => {
    if (filterCategory === 'All') return vehicles;
    return vehicles.filter(v => 
      (v.category && v.category.toLowerCase().includes(filterCategory.toLowerCase())) ||
      (v.transmission && v.transmission.toLowerCase().includes(filterCategory.toLowerCase())) ||
      (v.fuel_type && v.fuel_type.toLowerCase().includes(filterCategory.toLowerCase()))
    );
  }, [vehicles, filterCategory]);

  return (
    <div className="animate-fade-in">
      {/* Header Banner */}
      <div className="p-4 rounded-4 mb-4 text-white position-relative overflow-hidden shadow-sm" style={{ background: 'linear-gradient(135deg, #0D1B2E 0%, #162E4C 100%)' }}>
        <div className="position-relative z-1">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge bg-warning text-dark text-xxs fw-bold px-2 py-0.5 rounded-pill">
                  B2B VEHICLE RESERVATIONS
                </span>
                <span className={`badge ${mode === 'COMMISSION' ? 'bg-warning text-dark' : 'bg-primary text-white'} text-xxs fw-bold px-2.5 py-0.5 rounded-pill`}>
                  {mode === 'COMMISSION' ? 'Commission Mode (Standard)' : 'Non-Commission Mode (Net Wholesale)'}
                </span>
              </div>
              <h4 className="fw-bold mb-1 font-heading">Goa Self Drive Holiday & Rental Portal</h4>
              <p className="text-white-50 text-xs mb-0">
                Book premium hatchback, sedan, SUV & luxury vehicles across Goa airports and hotspots with live B2B rates.
              </p>
            </div>
            <div className="text-end d-none d-md-block">
              <span className="text-white-50 text-xxs d-block">Authorized Agency</span>
              <span className="fw-bold text-warning text-sm">{partner?.company_name || 'B2B Partner Agency'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Search & Filter Card */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden" style={{ background: '#ffffff' }}>
        <div className="p-4 border-bottom bg-light">
          <h6 className="fw-bold mb-3 text-dark text-xs text-uppercase tracking-wider font-heading d-flex align-items-center gap-2">
            <Navigation size={16} className="text-warning" /> Step 1: Trip Itinerary & Schedule
          </h6>

          <div className="row g-3">
            {/* Pickup Location */}
            <div className="col-12 col-md-6 col-lg-3">
              <label className="form-label text-xxs fw-bold text-muted text-uppercase mb-1">Pickup Location</label>
              <select
                className="form-select form-select-sm"
                value={pickupLoc}
                onChange={(e) => {
                  setPickupLoc(e.target.value);
                  if (sameDrop) setDropLoc(e.target.value);
                }}
              >
                {GOA_LOCATIONS.map(loc => (
                  <option key={loc.id} value={loc.name}>[{loc.type}] {loc.name}</option>
                ))}
              </select>
            </div>

            {/* Drop Location */}
            <div className="col-12 col-md-6 col-lg-3">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <label className="form-label text-xxs fw-bold text-muted text-uppercase mb-0">Drop Location</label>
                <div className="form-check form-switch mb-0" style={{ minHeight: 'auto' }}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="sameDropSwitch"
                    checked={sameDrop}
                    onChange={(e) => {
                      setSameDrop(e.target.checked);
                      if (e.target.checked) setDropLoc(pickupLoc);
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  <label className="form-check-label text-xxs text-muted" htmlFor="sameDropSwitch" style={{ cursor: 'pointer' }}>
                    Same
                  </label>
                </div>
              </div>
              <select
                className="form-select form-select-sm"
                value={sameDrop ? pickupLoc : dropLoc}
                onChange={(e) => setDropLoc(e.target.value)}
                disabled={sameDrop}
              >
                {GOA_LOCATIONS.map(loc => (
                  <option key={loc.id} value={loc.name}>[{loc.type}] {loc.name}</option>
                ))}
              </select>
            </div>

            {/* Pickup Date & Time */}
            <div className="col-12 col-md-6 col-lg-3">
              <label className="form-label text-xxs fw-bold text-muted text-uppercase mb-1">Pickup Date & Time</label>
              <div className="input-group input-group-sm">
                <input
                  type="date"
                  className="form-control"
                  value={pickupDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPickupDate(e.target.value)}
                />
                <input
                  type="time"
                  className="form-control"
                  style={{ maxWidth: '90px' }}
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                />
              </div>
            </div>

            {/* Drop Date & Time */}
            <div className="col-12 col-md-6 col-lg-3">
              <label className="form-label text-xxs fw-bold text-muted text-uppercase mb-1">Drop Date & Time</label>
              <div className="input-group input-group-sm">
                <input
                  type="date"
                  className="form-control"
                  value={dropDate}
                  min={pickupDate}
                  onChange={(e) => setDropDate(e.target.value)}
                />
                <input
                  type="time"
                  className="form-control"
                  style={{ maxWidth: '90px' }}
                  value={dropTime}
                  onChange={(e) => setDropTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mt-3 pt-3 border-top">
            <div className="d-flex align-items-center gap-3">
              <span className="text-xs fw-bold text-dark">Driving Preference:</span>
              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  onClick={() => setWithDriver(false)}
                  className={`btn ${!withDriver ? 'btn-dark' : 'btn-outline-secondary'} text-xs`}
                >
                  Pure Self Drive (No Driver)
                </button>
                <button
                  type="button"
                  onClick={() => setWithDriver(true)}
                  className={`btn ${withDriver ? 'btn-warning text-dark' : 'btn-outline-secondary'} text-xs`}
                >
                  With Chauffeur (+₹600/day)
                </button>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-dark text-white px-3 py-1.5 rounded-pill text-xs">
                Total Duration: <strong>{daysCount} Day{daysCount > 1 ? 's' : ''}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Filter Categories */}
        <div className="p-3 bg-white d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-1.5 flex-wrap">
            <span className="text-xxs fw-bold text-muted text-uppercase me-1">Category:</span>
            {['All', 'Hatchback', 'Sedan', 'SUV', 'Automatic', 'EV'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`btn btn-xs py-1 px-2.5 rounded-pill border text-xxs fw-semibold ${
                  filterCategory === cat 
                    ? 'btn-dark' 
                    : 'btn-light text-muted border-light-subtle'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <span className="text-xxs text-muted">
            Showing <strong>{filteredVehicles.length}</strong> available vehicles in Goa fleet
          </span>
        </div>
      </div>

      {/* Vehicles Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading fleet...</span>
          </div>
          <p className="text-muted text-xs mt-2">Loading authorized WOW GOA vehicle fleet...</p>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center text-muted">
          <Car size={36} className="mx-auto text-muted opacity-50 mb-2" />
          <h6 className="fw-bold text-dark">No vehicles matched the selected filter</h6>
          <p className="text-xs mb-3">Try clearing category filters to view all available vehicles.</p>
          <button className="btn btn-sm btn-outline-dark rounded-pill mx-auto px-3" onClick={() => setFilterCategory('All')}>
            View All Vehicles
          </button>
        </div>
      ) : (
        <div className="row g-3">
          {filteredVehicles.map(veh => {
            const pricing = calculateVehiclePricing(veh);
            return (
              <div key={veh.id} className="col-12 col-md-6 col-xl-4">
                <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden d-flex flex-column transition-all hover-shadow-lg" style={{ background: '#ffffff' }}>
                  {/* Vehicle Image */}
                  <div className="position-relative" style={{ height: '190px', background: '#F8F9FA' }}>
                    <img 
                      src={veh.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&q=80'} 
                      alt={veh.name}
                      className="w-100 h-100 object-fit-cover"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&q=80'; }}
                    />
                    <div className="position-absolute top-0 start-0 m-2.5 d-flex gap-1.5">
                      <span className="badge bg-dark bg-opacity-75 backdrop-blur text-white text-xxs px-2 py-1 rounded-pill">
                        {veh.category || 'Standard'}
                      </span>
                      {veh.transmission && (
                        <span className="badge bg-dark bg-opacity-75 backdrop-blur text-white text-xxs px-2 py-1 rounded-pill">
                          {veh.transmission}
                        </span>
                      )}
                    </div>
                    <div className="position-absolute bottom-0 end-0 m-2.5">
                      <span className="badge bg-warning text-dark fw-bold text-xxs px-2 py-1 rounded-pill shadow">
                        Goa Authorized
                      </span>
                    </div>
                  </div>

                  {/* Vehicle Card Body */}
                  <div className="p-3.5 flex-grow-1 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex align-items-start justify-content-between mb-1">
                        <h6 className="fw-bold text-dark font-heading mb-0 text-sm">{veh.name}</h6>
                        <span className="text-xxs text-muted">{veh.fuel_type || 'Petrol'}</span>
                      </div>

                      {/* Specs Badges */}
                      <div className="d-flex align-items-center gap-2 text-xxs text-muted my-2 pb-2 border-bottom flex-wrap">
                        <span className="d-flex align-items-center gap-1">
                          <Users size={12} /> {veh.seating_capacity || 5} Seats
                        </span>
                        <span>•</span>
                        <span className="d-flex align-items-center gap-1">
                          <Fuel size={12} /> {veh.fuel_type || 'Petrol'}
                        </span>
                        <span>•</span>
                        <span className="d-flex align-items-center gap-1">
                          <Gauge size={12} /> Unlimited KMs
                        </span>
                      </div>

                      <p className="text-muted text-xxs line-clamp-2 mb-2">
                        {veh.description || 'Full comprehensive insurance included. Clean & sanitized delivery.'}
                      </p>
                    </div>

                    {/* Mode Specific Pricing Box */}
                    <div className="mt-2 pt-2 border-top">
                      {mode === 'COMMISSION' ? (
                        <div className="p-2.5 rounded-3 bg-warning bg-opacity-10 border border-warning border-opacity-25 mb-2.5">
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <span className="text-xxs text-muted">Customer Selling Price:</span>
                            <span className="text-xs fw-bold text-dark">₹{pricing.sellingPrice.toLocaleString()}</span>
                          </div>
                          <div className="d-flex align-items-center justify-content-between mb-1 text-success">
                            <span className="text-xxs fw-semibold">Agent Commission ({pricing.commissionPercent}%):</span>
                            <span className="text-xs fw-bold">+₹{pricing.commissionAmount.toLocaleString()}</span>
                          </div>
                          <div className="d-flex align-items-center justify-content-between pt-1 border-top border-warning border-opacity-25">
                            <span className="text-xxs fw-bold text-dark">Net Payout to WOW Goa:</span>
                            <span className="text-sm fw-black text-dark">₹{pricing.netPayable.toLocaleString()}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-3 bg-primary bg-opacity-10 border border-primary border-opacity-25 mb-2.5">
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <span className="text-xxs text-muted">Retail D2C Price:</span>
                            <span className="text-xs text-muted text-decoration-line-through">₹{pricing.sellingPrice.toLocaleString()}</span>
                          </div>
                          <div className="d-flex align-items-center justify-content-between mb-1 text-primary">
                            <span className="text-xxs fw-semibold">B2B Net Discount ({pricing.netDiscountPercent}%):</span>
                            <span className="text-xs fw-bold">-₹{pricing.discountAmount.toLocaleString()}</span>
                          </div>
                          <div className="d-flex align-items-center justify-content-between pt-1 border-top border-primary border-opacity-25">
                            <span className="text-xxs fw-bold text-dark">B2B Net Rate Payable:</span>
                            <span className="text-sm fw-black text-primary">₹{pricing.netPrice.toLocaleString()}</span>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleSelectToBook(veh)}
                        className={`btn w-100 btn-sm rounded-pill fw-bold py-2 d-flex align-items-center justify-content-center gap-2 ${
                          mode === 'COMMISSION' ? 'btn-warning text-dark' : 'btn-primary text-white'
                        }`}
                      >
                        Book for Guest <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Form Modal */}
      {isBookingModalOpen && selectedVehicle && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ background: 'rgba(13, 27, 46, 0.75)', zIndex: 1050, backdropFilter: 'blur(4px)' }}
        >
          <div 
            className="card border-0 shadow-2xl rounded-4 overflow-hidden animate-fade-in"
            style={{ maxWidth: '620px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Modal Header */}
            <div className="p-3.5 text-white d-flex align-items-center justify-content-between" style={{ background: '#0D1B2E' }}>
              <div>
                <span className="badge bg-warning text-dark text-xxs fw-bold px-2 py-0.5 rounded-pill mb-1">
                  B2B VEHICLE BOOKING CONFIRMATION
                </span>
                <h5 className="fw-bold mb-0 text-white font-heading">{selectedVehicle.name}</h5>
              </div>
              <button 
                className="btn btn-link text-white-50 p-0 border-0" 
                onClick={() => {
                  setIsBookingModalOpen(false);
                  setBookingSuccessData(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-grow-1" style={{ background: '#F8F9FA' }}>
              {bookingSuccessData ? (
                <div className="text-center py-4">
                  <div className="rounded-circle p-3 bg-success bg-opacity-20 text-success d-inline-flex mb-3">
                    <CheckCircle2 size={42} />
                  </div>
                  <h4 className="fw-bold text-dark font-heading mb-1">Booking Confirmed Successfully!</h4>
                  <p className="text-muted text-xs mb-3">
                    B2B Booking ID: <strong>#{bookingSuccessData.booking_id}</strong>
                  </p>

                  <div className="p-3 bg-white rounded-3 border text-start mb-3">
                    <div className="d-flex justify-content-between text-xs py-1 border-bottom">
                      <span className="text-muted">Vehicle:</span>
                      <span className="fw-bold text-dark">{selectedVehicle.name}</span>
                    </div>
                    <div className="d-flex justify-content-between text-xs py-1 border-bottom">
                      <span className="text-muted">Rental Schedule:</span>
                      <span className="fw-bold text-dark">{pickupDate} to {dropDate} ({daysCount} Days)</span>
                    </div>
                    <div className="d-flex justify-content-between text-xs py-1 border-bottom">
                      <span className="text-muted">Pickup Location:</span>
                      <span className="fw-bold text-dark">{pickupLoc}</span>
                    </div>
                    <div className="d-flex justify-content-between text-xs py-1">
                      <span className="text-muted">Guest:</span>
                      <span className="fw-bold text-dark">{guestDetails.name} ({guestDetails.phone})</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-dark btn-sm rounded-pill px-4"
                    onClick={() => {
                      setIsBookingModalOpen(false);
                      setBookingSuccessData(null);
                    }}
                  >
                    Done & Return
                  </button>
                </div>
              ) : (
                <form onSubmit={handleConfirmBooking}>
                  {/* Summary bar */}
                  <div className="p-3 bg-white rounded-3 border mb-3">
                    <div className="row g-2 text-xs">
                      <div className="col-6">
                        <span className="text-muted d-block text-xxs">Rental Period:</span>
                        <strong className="text-dark">{pickupDate} → {dropDate} ({daysCount} Days)</strong>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block text-xxs">Pickup Location:</span>
                        <strong className="text-dark text-truncate d-block">{pickupLoc}</strong>
                      </div>
                    </div>
                  </div>

                  {bookingError && (
                    <div className="alert alert-danger py-2 px-3 rounded-3 text-xs mb-3 d-flex align-items-center gap-2">
                      <AlertCircle size={15} className="flex-shrink-0" />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  {/* Guest details fields */}
                  <h6 className="fw-bold text-dark text-xs text-uppercase mb-2.5 font-heading">
                    Guest Travel Details
                  </h6>
                  <div className="row g-2.5 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label text-xxs fw-bold text-muted mb-1">Primary Guest Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Amit Verma"
                        value={guestDetails.name}
                        onChange={(e) => setGuestDetails(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label text-xxs fw-bold text-muted mb-1">Guest Mobile Phone *</label>
                      <input
                        type="tel"
                        className="form-control form-control-sm"
                        placeholder="10-digit phone"
                        value={guestDetails.phone}
                        onChange={(e) => setGuestDetails(prev => ({ ...prev, phone: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label text-xxs fw-bold text-muted mb-1">Guest Email (Optional)</label>
                      <input
                        type="email"
                        className="form-control form-control-sm"
                        placeholder="guest@gmail.com"
                        value={guestDetails.email}
                        onChange={(e) => setGuestDetails(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label text-xxs fw-bold text-muted mb-1">Flight / Train Arrival No.</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. 6E 543"
                        value={guestDetails.flight_number}
                        onChange={(e) => setGuestDetails(prev => ({ ...prev, flight_number: e.target.value }))}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label text-xxs fw-bold text-muted mb-1">Special Delivery Requests</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Child seat, infant carrier, late night arrival"
                        value={guestDetails.special_requests}
                        onChange={(e) => setGuestDetails(prev => ({ ...prev, special_requests: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Pricing Breakdown Card */}
                  <div className="p-3 rounded-3 bg-white border mb-3">
                    <h6 className="fw-bold text-dark text-xxs text-uppercase mb-2 font-heading">
                      Financial Snapshot ({mode})
                    </h6>
                    {(() => {
                      const pr = calculateVehiclePricing(selectedVehicle);
                      return mode === 'COMMISSION' ? (
                        <div className="text-xs">
                          <div className="d-flex justify-content-between py-1 text-muted">
                            <span>Selling Rate ({daysCount} Days + Tax):</span>
                            <span>₹{pr.sellingPrice.toLocaleString()}</span>
                          </div>
                          <div className="d-flex justify-content-between py-1 text-success fw-semibold">
                            <span>Your Commission ({pr.commissionPercent}%):</span>
                            <span>+₹{pr.commissionAmount.toLocaleString()}</span>
                          </div>
                          <div className="d-flex justify-content-between py-1.5 border-top fw-bold text-dark fs-6 mt-1">
                            <span>Payable to WOW Goa:</span>
                            <span>₹{pr.netPayable.toLocaleString()}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs">
                          <div className="d-flex justify-content-between py-1 text-muted">
                            <span>D2C Retail Price:</span>
                            <span className="text-decoration-line-through">₹{pr.sellingPrice.toLocaleString()}</span>
                          </div>
                          <div className="d-flex justify-content-between py-1 text-primary fw-semibold">
                            <span>B2B Net Discount ({pr.netDiscountPercent}%):</span>
                            <span>-₹{pr.discountAmount.toLocaleString()}</span>
                          </div>
                          <div className="d-flex justify-content-between py-1.5 border-top fw-bold text-primary fs-6 mt-1">
                            <span>Total Wholesale Net Price:</span>
                            <span>₹{pr.netPrice.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className={`btn w-100 py-2.5 rounded-pill fw-bold text-sm font-heading ${
                      mode === 'COMMISSION' ? 'btn-warning text-dark' : 'btn-primary text-white'
                    }`}
                  >
                    {bookingLoading ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                    ) : (
                      <Check size={16} className="me-1" />
                    )}
                    Confirm B2B Booking Now
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
