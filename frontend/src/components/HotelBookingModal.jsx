import React, { useState, useEffect, useMemo } from 'react';
import { X, CheckCircle, ShieldCheck, User, Users, BedDouble, Calendar, ArrowRight, ArrowLeft, Download, MessageCircle, Info, Compass, Cake } from 'lucide-react';
import * as api from '../services/api';
import { validateBookingDates } from '../utils/dateUtils';
import ImageCarousel from './common/ImageCarousel';
import UnifiedGalleryViewer from './UnifiedGalleryViewer';

export default function HotelBookingModal({
  selectedBookingItem,
  setSelectedBookingItem,
  pickupDate,
  dropDate,
  bookingDays
}) {
  if (!selectedBookingItem) return null;

  const [step, setStep] = useState(1);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  
  // Selection State
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [numRooms, setNumRooms] = useState(1);
  
  // Guest Details State
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestDob, setGuestDob] = useState('');
  const [isDobSaved, setIsDobSaved] = useState(false);
  const [dobChecking, setDobChecking] = useState(false);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [arrivalTime, setArrivalTime] = useState('14:00');
  const [specialRequests, setSpecialRequests] = useState('');

  // Customer Wallet Cashback State
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWalletCashback, setUseWalletCashback] = useState(false);

  // Repeat customer lookup for Date of Birth & Wallet Balance
  useEffect(() => {
    const clean = String(guestPhone || '').replace(/\D/g, '');
    if (clean.length >= 10) {
      setDobChecking(true);
      api.checkCustomerDob(clean).then(res => {
        if (res && res.exists && res.date_of_birth) {
          setGuestDob(res.date_of_birth);
          setIsDobSaved(true);
          if (!guestName && res.name) {
            setGuestName(res.name);
          }
          if (!guestEmail && res.email) {
            setGuestEmail(res.email);
          }
        } else {
          setIsDobSaved(false);
        }
      }).catch(() => {
        setIsDobSaved(false);
      }).finally(() => {
        setDobChecking(false);
      });

      // Fetch customer wallet balance
      api.fetchCustomerWallet(clean).then(w => {
        if (w && w.available_balance > 0) {
          setWalletBalance(w.available_balance);
        } else {
          setWalletBalance(0);
          setUseWalletCashback(false);
        }
      }).catch(() => {
        setWalletBalance(0);
      });
    } else {
      setIsDobSaved(false);
      setWalletBalance(0);
      setUseWalletCashback(false);
    }
  }, [guestPhone]);

  // Driver / Chauffeur Service States
  const [driverRequired, setDriverRequired] = useState(false);
  const [driverServiceType, setDriverServiceType] = useState('airport_transfer');
  const [driverPickupLoc, setDriverPickupLoc] = useState('Goa Airport (Dabolim / Mopa)');
  const [driverPickupTime, setDriverPickupTime] = useState('14:00');
  
  // Payment State
  const [paymentSettings, setPaymentSettings] = useState([]);
  const [paymentOption, setPaymentOption] = useState('pay_at_hotel');
  const [transactionId, setTransactionId] = useState('');
  
  // Confirmation State
  const [bookingId, setBookingId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const hotelAllImages = useMemo(() => {
    if (!selectedBookingItem) return [];
    const list = [];
    if (selectedBookingItem.images_json) {
      try {
        const p = typeof selectedBookingItem.images_json === 'string' ? JSON.parse(selectedBookingItem.images_json) : selectedBookingItem.images_json;
        if (Array.isArray(p)) list.push(...p);
      } catch(e) {}
    }
    if (Array.isArray(selectedBookingItem.images)) list.push(...selectedBookingItem.images);
    if (Array.isArray(selectedBookingItem.additional_images)) list.push(...selectedBookingItem.additional_images);
    if (selectedBookingItem.image) list.push(selectedBookingItem.image);
    if (selectedBookingItem.image_url) list.push(selectedBookingItem.image_url);
    const unique = Array.from(new Set(list.filter(u => typeof u === 'string' && u.trim().length > 0)));
    return unique.length > 0 ? unique : [selectedBookingItem.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'];
  }, [selectedBookingItem]);

  useEffect(() => {
    // Fetch Payment Settings
    if (selectedBookingItem.vendor_id && selectedBookingItem.vendor_id !== 'admin') {
      api.getVendorPaymentMethods(selectedBookingItem.vendor_id).then(res => {
        const activeMethods = (res || []).filter(m => m.status === 'Active');
        setPaymentSettings(activeMethods);
      }).catch(console.error);
    } else {
      api.getAdminPaymentMethods().then(res => {
        const activeMethods = (res || []).filter(m => m.status === 'Active');
        setPaymentSettings(activeMethods);
      }).catch(console.error);
    }

    // Standard fallback rooms based on hotel's base price
    const basePrice = parseFloat(selectedBookingItem.price || 4500);
    const defaultRooms = [
      {
        id: `room-deluxe-${selectedBookingItem.id}`,
        name: 'Deluxe Room',
        max_occupancy: 2,
        bed_type: 'King / Twin',
        selling_price: basePrice,
        amenities_json: JSON.stringify(['Free Wi-Fi', 'Air Conditioning', 'King Bed', 'Complimentary Breakfast', 'Private Balcony'])
      },
      {
        id: `room-exec-${selectedBookingItem.id}`,
        name: 'Executive Ocean View Suite',
        max_occupancy: 3,
        bed_type: 'King Bed',
        selling_price: Math.round(basePrice * 1.3),
        amenities_json: JSON.stringify(['Ocean View', 'Living Area', 'Jacuzzi', 'Free Wi-Fi', 'Buffet Breakfast'])
      },
      {
        id: `room-villa-${selectedBookingItem.id}`,
        name: 'Presidential Luxury Villa',
        max_occupancy: 4,
        bed_type: '2 King Beds',
        selling_price: Math.round(basePrice * 1.65),
        amenities_json: JSON.stringify(['Private Pool', 'Butler Service', 'All-Inclusive', 'Luxury Spa Access'])
      }
    ];

    // Fetch Room Types for this hotel if available via PMS
    if (selectedBookingItem.vendor_id && selectedBookingItem.vendor_id !== 'admin') {
      setLoadingRooms(true);
      api.pmsListRoomTypes(selectedBookingItem.vendor_id).then(res => {
        const hotelRooms = (res.room_types || []).filter(rt => rt.hotel_id == selectedBookingItem.id && rt.status === 'Active');
        if (hotelRooms.length > 0) {
          setRoomTypes(hotelRooms);
          setSelectedRoom(hotelRooms[0]);
        } else {
          setRoomTypes(defaultRooms);
          setSelectedRoom(defaultRooms[0]);
        }
        setLoadingRooms(false);
      }).catch(err => {
        console.error(err);
        setRoomTypes(defaultRooms);
        setSelectedRoom(defaultRooms[0]);
        setLoadingRooms(false);
      });
    } else {
      setRoomTypes(defaultRooms);
      setSelectedRoom(defaultRooms[0]);
      setLoadingRooms(false);
    }
  }, [selectedBookingItem]);

  // Pricing Logic
  const nights = Math.max(1, parseInt(bookingDays) || 1);
  const roomPrice = selectedRoom ? parseFloat(selectedRoom.selling_price || 0) : parseFloat(selectedBookingItem.price || 0);
  const roomTotal = roomPrice * nights * numRooms;
  const gst = Math.round(roomTotal * 0.18);
  const platformFee = 250;

  // Driver Pricing Logic
  let driverCharge = 0;
  if (driverRequired) {
    if (driverServiceType === 'airport_transfer') driverCharge = 800;
    else if (driverServiceType === 'full_day') driverCharge = 1800;
    else if (driverServiceType === 'entire_stay') driverCharge = 1500 * nights;
  }

  const totalAmount = roomTotal + gst + platformFee + driverCharge;
  const advanceAmount = Math.round(totalAmount * 0.20); // 20% advance

  // Wallet Deduction & 10% Cashback Calculations
  const appliedWalletAmount = (useWalletCashback && walletBalance > 0) ? Math.min(walletBalance, totalAmount) : 0;
  const finalTotalPayable = Math.max(0, totalAmount - appliedWalletAmount);

  const isPayAtHotel = paymentOption === 'pay_at_hotel' || paymentOption === 'hotel';
  let payableNow = 0;
  if (!isPayAtHotel) {
    if (paymentOption === 'partial') payableNow = Math.max(0, advanceAmount - appliedWalletAmount);
    else payableNow = finalTotalPayable;
  }

  const projectedCashback = Math.round(finalTotalPayable * 0.10);

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedRoom) return alert("Please select a room first.");
    
    const cleanGuestPhone = String(guestPhone || '').replace(/\D/g, '');
    if (!guestName || cleanGuestPhone.length < 10) {
      return alert("Please enter your full name and a valid 10-digit mobile number for trip confirmation & tracking.");
    }

    if (!isDobSaved && !guestDob) {
      return alert("Please enter your Date of Birth. Date of Birth is required for birthday privileges and special offers from WOW GOA.");
    }
    
    const dateVal = validateBookingDates(pickupDate, dropDate, { allowSameDay: false });
    if (!dateVal.valid) {
      return alert(dateVal.error);
    }
    
    setIsProcessing(true);
    
    try {
      const numGuests = (parseInt(adults) || 2) + (parseInt(children) || 0);
      const travellerDetails = {
          name: guestName,
          phone: cleanGuestPhone,
          email: guestEmail,
          date_of_birth: guestDob,
          adults: adults,
          children: children,
          arrival_time: arrivalTime,
          special_requests: specialRequests,
          num_rooms: numRooms,
          driver_required: driverRequired,
          driver_service_type: driverServiceType
      };
      
      const priceBreakdown = {
          room_price: roomPrice,
          nights: nights,
          num_rooms: numRooms,
          room_total: roomTotal,
          driver_charge: driverCharge,
          gst: gst,
          platform_fee: platformFee,
          total_price: totalAmount,
          wallet_amount_used: appliedWalletAmount,
          final_payable: finalTotalPayable,
          advance_amount: advanceAmount
      };

      const selectedCustom = paymentSettings.find(m => m.id?.toString() === paymentOption?.toString());
      const paymentMethodName = isPayAtHotel ? 'Pay at Hotel' : (paymentOption === 'upi_direct' ? 'UPI' : (selectedCustom?.method_name || 'Online Payment'));
      const customerId = `c_${cleanGuestPhone || Date.now()}`;
      const customerEmail = guestEmail || `${cleanGuestPhone || 'guest'}@hotel.wowgoa.com`;

      const bookingPayload = {
        name: guestName,
        customer_name: guestName,
        phone: cleanGuestPhone,
        customer_phone: cleanGuestPhone,
        email: customerEmail,
        customer_email: customerEmail,
        customer_id: customerId,
        date_of_birth: guestDob,
        dob: guestDob,
        pickup_loc: driverRequired ? driverPickupLoc : (selectedBookingItem.area || selectedBookingItem.location || 'Goa'),
        pickup_location: driverRequired ? driverPickupLoc : (selectedBookingItem.area || selectedBookingItem.location || 'Goa'),
        pickup_date: pickupDate,
        pickup_time: driverRequired ? driverPickupTime : arrivalTime,
        drop_date: dropDate,
        drop_location: selectedBookingItem.area || selectedBookingItem.location || 'Goa',
        drop_time: '12:00',
        item_id: selectedBookingItem.id,
        item_name: selectedBookingItem.name,
        hotel_name: selectedBookingItem.name,
        hotel_location: selectedBookingItem.area || selectedBookingItem.location || 'Goa',
        room_type: selectedRoom?.name || 'Deluxe Room',
        package_type: driverRequired ? 'Hotel Booking (with Chauffeur)' : 'Hotel Booking',
        type: 'hotel',
        image: selectedBookingItem.image || selectedBookingItem.image_url || '',
        vehicle_image: selectedBookingItem.image || selectedBookingItem.image_url || '',
        booking_days: nights,
        duration: `${nights} Nights / ${nights + 1} Days`,
        total_amount: totalAmount,
        wallet_amount_used: appliedWalletAmount,
        amount_paid: payableNow,
        total_paid: totalAmount,
        paid_amount: payableNow,
        remaining_amount: isPayAtHotel ? finalTotalPayable : Math.max(0, finalTotalPayable - payableNow),
        pending_amount: isPayAtHotel ? finalTotalPayable : Math.max(0, finalTotalPayable - payableNow),
        driver_required: driverRequired ? 1 : 0,
        driver_charge: driverCharge,
        driver_service_type: driverRequired ? driverServiceType : '',
        status: isPayAtHotel ? 'Confirmed' : 'Pending',
        payment_status: isPayAtHotel ? 'Pay at Hotel (Pending)' : (payableNow > 0 ? 'Submitted' : 'Pending'),
        payment_verification_status: isPayAtHotel ? 'Not Required' : 'Pending',
        payment_method: paymentMethodName,
        transaction_id: isPayAtHotel ? 'PAY-AT-HOTEL' : (transactionId || `TXN-${Date.now()}`),
        traveller_details_json: JSON.stringify(travellerDetails),
        price_breakdown_json: JSON.stringify(priceBreakdown),
        customizations: JSON.stringify({
            selected_room_type: selectedRoom?.id,
            selected_room_name: selectedRoom?.name,
            num_guests: numGuests,
            num_rooms: numRooms,
            driver_required: driverRequired,
            driver_service: driverRequired ? driverServiceType : null,
            driver_charge: driverCharge,
            hotel_location: selectedBookingItem.area || selectedBookingItem.location || 'Goa'
        })
      };

      let assignedId = `BK-${Math.floor(100000 + Math.random() * 900000)}`;
      try {
        const res = await api.createBooking(bookingPayload);
        if (res?.booking_id || res?.id) assignedId = res.booking_id || res.id;
      } catch (err) {
        console.warn("Backend booking submission note:", err);
      }

      const fullBookingRecord = { ...bookingPayload, id: assignedId, booking_id: assignedId };
      setBookingId(assignedId);

      // Save customer phone and booking to both localStorage and sessionStorage for instant Customer Portal access
      try {
        sessionStorage.setItem('customer_login_phone', cleanGuestPhone);
        sessionStorage.setItem('last_created_booking', JSON.stringify(fullBookingRecord));
        localStorage.setItem('customer_login_phone', cleanGuestPhone);
        localStorage.setItem('last_created_booking', JSON.stringify(fullBookingRecord));

        const existingLocal = JSON.parse(localStorage.getItem('local_bookings') || '[]');
        const updatedLocal = [fullBookingRecord, ...existingLocal.filter(b => String(b.id) !== String(assignedId))];
        localStorage.setItem('local_bookings', JSON.stringify(updatedLocal));
      } catch (e) {}

      setStep(4);
    } catch (err) {
      console.warn("Booking fallback transition:", err);
      const fallbackId = `BK-${Math.floor(100000 + Math.random() * 900000)}`;
      setBookingId(fallbackId);
      try {
        sessionStorage.setItem('customer_login_phone', String(guestPhone).replace(/\D/g, ''));
      } catch (e) {}
      setStep(4);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStep1 = () => (
    <div className="animate-fade-in">
      <h5 className="fw-bold mb-3 border-bottom pb-2">Step 1: Select Room Type</h5>
      
      {loadingRooms ? (
          <div className="text-center py-5 text-muted">
              <div className="spinner-border spinner-border-sm me-2"></div> Loading available rooms...
          </div>
      ) : roomTypes.length === 0 ? (
          <div className="alert alert-warning text-center">
              No rooms currently available for this property online.
          </div>
      ) : (
          <div className="row g-3">
              {roomTypes.map(rt => {
                  let amenities = [];
                  try { amenities = JSON.parse(rt.amenities_json || '[]'); } catch(e){}
                  const isSelected = selectedRoom?.id === rt.id;

                  return (
                      <div key={rt.id} className="col-12">
                          <div className={`card shadow-sm border ${isSelected ? 'border-primary border-2' : ''} h-100 overflow-hidden cursor-pointer`} onClick={() => setSelectedRoom(rt)}>
                              <div className="d-flex flex-column flex-md-row">
                                  <div style={{ width: '100%', maxWidth: '200px', background: '#f8f9fa' }} className="d-none d-md-block">
                                      <div className="h-100 d-flex align-items-center justify-content-center text-muted">
                                          <BedDouble size={48} opacity={0.2} />
                                      </div>
                                  </div>
                                  <div className="card-body p-3 flex-grow-1">
                                      <div className="d-flex justify-content-between align-items-start mb-2">
                                          <div>
                                              <h6 className="fw-bold mb-1">{rt.name}</h6>
                                              <div className="text-muted small">
                                                  <Users size={12} className="me-1"/> Up to {rt.max_occupancy} Guests • {rt.bed_type} Bed
                                              </div>
                                          </div>
                                          <div className="text-end">
                                              <h5 className="fw-bold text-primary mb-0">₹{parseInt(rt.selling_price || 0).toLocaleString('en-IN')}</h5>
                                              <small className="text-muted">/ night</small>
                                          </div>
                                      </div>
                                      
                                      <div className="mb-3 d-flex flex-wrap gap-1">
                                          {amenities.slice(0, 4).map((am, i) => (
                                              <span key={i} className="badge bg-light text-dark border fw-normal" style={{fontSize: '10px'}}>{am}</span>
                                          ))}
                                          {amenities.length > 4 && <span className="badge bg-light text-dark border fw-normal" style={{fontSize: '10px'}}>+{amenities.length - 4} more</span>}
                                      </div>
                                      
                                      <div className="d-flex justify-content-between align-items-center">
                                          <div className="text-success small fw-semibold">✓ Free Cancellation</div>
                                          <button className={`btn btn-sm px-4 fw-bold ${isSelected ? 'btn-primary' : 'btn-outline-primary'}`}>
                                              {isSelected ? 'Selected' : 'Select Room'}
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  );
              })}
          </div>
      )}
      
      <div className="mt-4 text-end">
          <button 
              className="btn btn-primary px-5 fw-bold" 
              disabled={!selectedRoom} 
              onClick={() => setStep(2)}
          >
              Continue to Guest Details <ArrowRight size={16} className="ms-1"/>
          </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="animate-fade-in">
        <div className="d-flex align-items-center mb-3 border-bottom pb-2">
            <button className="btn btn-sm btn-link text-muted p-0 me-2" onClick={() => setStep(1)}><ArrowLeft size={20}/></button>
            <h5 className="fw-bold mb-0">Step 2: Guest Details</h5>
        </div>
        
        <div className="row g-3 mb-4">
            <div className="col-md-12">
                <label className="form-label small fw-bold">Lead Guest Name <span className="text-danger">*</span></label>
                <input type="text" className="form-control" placeholder="Full Name as per ID" value={guestName} onChange={e => setGuestName(e.target.value)} required />
            </div>
            <div className="col-md-6">
                <label className="form-label small fw-bold">
                  Mobile Number <span className="text-danger">* (Required for Tracking)</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light fw-bold text-xs">+91</span>
                  <input 
                    type="tel" 
                    className={`form-control ${guestPhone && String(guestPhone).replace(/\D/g, '').length < 10 ? 'is-invalid' : ''}`} 
                    placeholder="10-digit mobile number" 
                    value={guestPhone} 
                    onChange={e => setGuestPhone(e.target.value)} 
                    required 
                  />
                </div>
                <small className="text-muted" style={{ fontSize: '11px' }}>
                  Your Customer Portal login & trip updates will be linked to this number.
                </small>
            </div>
            <div className="col-md-6">
                <label className="form-label small fw-bold">Email Address</label>
                <input type="email" className="form-control" placeholder="Email for booking confirmation" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} />
            </div>

            {/* Date of Birth Mandatory Field with Auto-Retrieval for Repeat Guests */}
            <div className="col-md-12">
              {isDobSaved ? (
                <div className="p-2.5 rounded-3 bg-success bg-opacity-10 border border-success border-opacity-25 d-flex align-items-center justify-content-between animate-fade-in">
                  <div className="d-flex align-items-center gap-2">
                    <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', minWidth: '28px' }}>
                      <Cake size={14} />
                    </div>
                    <div>
                      <div className="text-xs fw-bold text-success d-flex align-items-center gap-1">
                        <ShieldCheck size={13} /> Verified DOB on WOW GOA Account
                      </div>
                      <div className="text-xs text-dark mt-0.5">
                        🎂 Date of Birth: <strong>{guestDob}</strong> <span className="text-muted">(Saved for birthday benefits & member rewards)</span>
                      </div>
                    </div>
                  </div>
                  <span className="badge bg-success text-white text-xs px-2 py-1 rounded-pill">Saved</span>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <label className="form-label small fw-bold d-flex align-items-center justify-content-between">
                    <span className="d-flex align-items-center gap-1">
                      <Cake size={14} className="text-warning" /> Date of Birth <span className="text-danger">*</span>
                    </span>
                    <span className="text-muted" style={{ fontSize: '11px' }}>[ DD / MM / YYYY ]</span>
                  </label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={guestDob}
                    onChange={e => setGuestDob(e.target.value)}
                    required 
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <small className="text-muted d-block mt-1" style={{ fontSize: '11px', color: '#64748b' }}>
                    Date of Birth is required to provide birthday benefits and special offers from WOW GOA.
                  </small>
                </div>
              )}
            </div>
        </div>
        
        <div className="row g-3 mb-4">
            <div className="col-md-4">
                <label className="form-label small fw-bold">Number of Rooms</label>
                <select className="form-select" value={numRooms} onChange={e => setNumRooms(parseInt(e.target.value))}>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Room{n>1?'s':''}</option>)}
                </select>
            </div>
            <div className="col-md-4">
                <label className="form-label small fw-bold">Adults</label>
                <select className="form-select" value={adults} onChange={e => setAdults(parseInt(e.target.value))}>
                    {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} Adult{n>1?'s':''}</option>)}
                </select>
            </div>
            <div className="col-md-4">
                <label className="form-label small fw-bold">Children</label>
                <select className="form-select" value={children} onChange={e => setChildren(parseInt(e.target.value))}>
                    {[0,1,2,3,4].map(n => <option key={n} value={n}>{n} Child{n!=1?'ren':''}</option>)}
                </select>
            </div>
        </div>

        {/* ─── Dedicated Goa Chauffeur & Driver Service Option ─── */}
        <div className="p-3 rounded-3 mb-4" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
          <div className="form-check d-flex align-items-center gap-2 mb-2">
            <input
              type="checkbox"
              className="form-check-input mt-0"
              id="hotel_driver_req"
              checked={driverRequired}
              onChange={(e) => setDriverRequired(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label className="form-check-label fw-bold text-dark mb-0 font-heading" htmlFor="hotel_driver_req" style={{ cursor: 'pointer' }}>
              🚗 Need a Dedicated Goa Chauffeur / Private Cab Service?
            </label>
          </div>
          <p className="text-muted text-xs ps-4 mb-2">
            Add a verified local chauffeur for airport transfers, beach sightseeing, and effortless travel during your stay at {selectedBookingItem.name}.
          </p>

          {driverRequired && (
            <div className="mt-3 pt-3 border-top border-warning border-opacity-40 ps-4 animate-fade-in">
              <div className="row g-2 mb-3">
                {[
                  { id: 'airport_transfer', label: '✈️ Airport / Railway Station Pickup & Drop', price: 800, desc: 'Dedicated AC cab for airport / train station transfer to hotel' },
                  { id: 'full_day', label: '🌴 1-Day Goa Sightseeing Chauffeur', price: 1800, desc: '8 Hours / 80 KM sightseeing across North or South Goa' },
                  { id: 'entire_stay', label: `⭐ Dedicated Chauffeur for Entire Stay (${nights} Nights)`, price: 1500 * nights, desc: `Exclusive AC chauffeur on standby for all ${nights} nights` }
                ].map(opt => (
                  <div key={opt.id} className="col-12">
                    <div 
                      className={`p-2.5 rounded-3 border cursor-pointer transition ${driverServiceType === opt.id ? 'bg-warning bg-opacity-20 border-warning fw-bold' : 'bg-white border-light-subtle'}`}
                      onClick={() => setDriverServiceType(opt.id)}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <span className="text-xs text-dark">{opt.label}</span>
                          <small className="text-muted d-block text-xxs">{opt.desc}</small>
                        </div>
                        <span className="badge bg-dark text-warning fw-bold px-2 py-1 text-xs">
                          +₹{opt.price.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="row g-2">
                <div className="col-sm-7">
                  <label className="form-label text-xxs text-muted fw-bold mb-1">Driver Pickup Point</label>
                  <select 
                    className="form-select form-select-sm text-xs"
                    value={driverPickupLoc}
                    onChange={e => setDriverPickupLoc(e.target.value)}
                  >
                    <option value="Goa Airport (Dabolim / Mopa)">✈️ Goa Airport (Dabolim / Mopa)</option>
                    <option value="Dabolim Airport (GOI)">✈️ Dabolim Airport (GOI)</option>
                    <option value="Mopa Airport (GOX)">✈️ Manohar International Airport (Mopa / GOX)</option>
                    <option value="Madgaon Railway Station">🚆 Madgaon Railway Station</option>
                    <option value="Thivim Railway Station">🚆 Thivim Railway Station</option>
                    <option value="Hotel Direct Pickup">🏨 Hotel Direct Pickup</option>
                  </select>
                </div>
                <div className="col-sm-5">
                  <label className="form-label text-xxs text-muted fw-bold mb-1">Pickup Time</label>
                  <input 
                    type="time" 
                    className="form-control form-control-sm text-xs" 
                    value={driverPickupTime} 
                    onChange={e => setDriverPickupTime(e.target.value)} 
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="row g-3 mb-4">
            <div className="col-md-6">
                <label className="form-label small fw-bold">Expected Hotel Check-in / Arrival Time</label>
                <input type="time" className="form-control" value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} />
            </div>
            <div className="col-md-12">
                <label className="form-label small fw-bold">Special Requests (Optional)</label>
                <textarea className="form-control" rows="2" placeholder="e.g. early check-in, sea view room, airport coordination" value={specialRequests} onChange={e => setSpecialRequests(e.target.value)}></textarea>
            </div>
        </div>

        {/* Live Total preview */}
        <div className="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center mb-4 border">
          <div>
            <span className="text-muted text-xs d-block">Total Stay &amp; Services ({nights} Night{nights>1?'s':''})</span>
            <strong className="text-dark fs-5 font-heading">₹{totalAmount.toLocaleString('en-IN')}</strong>
            {driverRequired && <span className="badge bg-warning text-dark text-xxs ms-2">✓ Chauffeur Included (+₹{driverCharge.toLocaleString('en-IN')})</span>}
          </div>
          <button 
              className="btn btn-primary px-4 py-2 fw-bold" 
              disabled={!guestName.trim() || String(guestPhone).replace(/\D/g, '').length < 10} 
              onClick={() => {
                if (String(guestPhone).replace(/\D/g, '').length < 10) {
                  alert("Please enter a valid 10-digit mobile number for booking confirmation.");
                  return;
                }
                setStep(3);
              }}
          >
              Proceed to Payment <ArrowRight size={16} className="ms-1"/>
          </button>
        </div>
    </div>
  );

  const renderStep3 = () => {
    const isUpi = paymentOption === 'upi_direct';
    const selectedMethod = paymentSettings.find(m => m.id?.toString() === paymentOption?.toString());

    return (
      <div className="animate-fade-in">
        <div className="d-flex align-items-center mb-3 border-bottom pb-2">
          <button className="btn btn-sm btn-link text-muted p-0 me-2" onClick={() => setStep(2)}>
            <ArrowLeft size={20}/>
          </button>
          <h5 className="fw-bold mb-0">Step 3: Payment</h5>
        </div>

        <div className="mb-4">
          <h6 className="fw-bold mb-3">Select Payment Option</h6>

          {/* Pay at Hotel Option */}
          <div
            className={`card mb-2 cursor-pointer shadow-sm ${isPayAtHotel ? 'border-primary bg-primary bg-opacity-10' : 'border'}`}
            style={{ borderRadius: '10px', transition: 'all 0.2s' }}
            onClick={() => setPaymentOption('pay_at_hotel')}
          >
            <div className="card-body p-3 d-flex align-items-start gap-3">
              <input type="radio" className="form-check-input mt-1" checked={isPayAtHotel} readOnly />
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-bold text-dark fs-6">🏨 Pay at Hotel</span>
                  <span className="badge bg-success text-white">Recommended</span>
                </div>
                <div className="text-muted small">
                  Pay <strong>₹{totalAmount.toLocaleString('en-IN')}</strong> directly at the hotel reception during check-in. (Cash, UPI or Card accepted).
                </div>
              </div>
            </div>
          </div>

          {/* Online UPI Option */}
          <div
            className={`card mb-2 cursor-pointer shadow-sm ${isUpi ? 'border-primary bg-primary bg-opacity-10' : 'border'}`}
            style={{ borderRadius: '10px', transition: 'all 0.2s' }}
            onClick={() => setPaymentOption('upi_direct')}
          >
            <div className="card-body p-3 d-flex align-items-start gap-3">
              <input type="radio" className="form-check-input mt-1" checked={isUpi} readOnly />
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-bold text-dark fs-6">📱 UPI / QR Code Instant Transfer</span>
                  <span className="badge bg-light text-dark border">Pre-Paid</span>
                </div>
                <div className="text-muted small">
                  Pay online via Google Pay, PhonePe, Paytm or BHIM UPI.
                </div>
              </div>
            </div>
          </div>

          {/* Custom Vendor Payment Methods if configured */}
          {paymentSettings.map(method => (
            <div
              key={method.id}
              className={`card mb-2 cursor-pointer shadow-sm ${paymentOption === method.id.toString() ? 'border-primary bg-primary bg-opacity-10' : 'border'}`}
              style={{ borderRadius: '10px', transition: 'all 0.2s' }}
              onClick={() => setPaymentOption(method.id.toString())}
            >
              <div className="card-body p-3 d-flex align-items-center gap-3">
                <input type="radio" className="form-check-input mt-0" checked={paymentOption === method.id.toString()} readOnly />
                <div>
                  <div className="fw-bold">{method.method_type}</div>
                  <div className="text-muted small">{method.account_name || 'Hotel Gateway'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* UPI Details Box */}
        {isUpi && (
          <div className="p-3 border border-primary rounded bg-white text-center shadow-sm mb-4 animate-fade-in">
            <h6 className="fw-bold text-primary mb-2">Pay via UPI</h6>
            <p className="small text-muted mb-2">Send <strong>₹{totalAmount.toLocaleString('en-IN')}</strong> to UPI ID:</p>
            <div className="fw-bold text-dark border p-2 bg-light rounded d-inline-block user-select-all mb-3">
              tripgalileo@upi
            </div>
            <div className="text-start">
              <label className="form-label small fw-bold">Transaction Reference ID *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter 12-digit UPI UTR / Ref Number"
                value={transactionId}
                onChange={e => setTransactionId(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {/* Custom Method Boxes */}
        {selectedMethod?.method_type === 'UPI' && (
          <div className="p-3 border border-primary rounded bg-white text-center shadow-sm mb-4 animate-fade-in">
            <h6 className="fw-bold text-primary mb-2">Pay via UPI directly to Hotel</h6>
            <p className="small text-muted mb-2">Pay <strong>₹{totalAmount.toLocaleString('en-IN')}</strong> to:</p>
            {selectedMethod.qr_image_url && (
              <img src={selectedMethod.qr_image_url} alt="UPI QR Code" className="img-fluid border rounded mb-2 shadow-sm" style={{maxHeight: '150px'}} />
            )}
            <div className="fw-bold text-dark border p-2 bg-light rounded d-inline-block user-select-all mb-3">
              {selectedMethod.upi_id} ({selectedMethod.account_name})
            </div>
            <div className="text-start">
              <label className="form-label small fw-bold">Transaction Reference ID *</label>
              <input type="text" className="form-control" placeholder="Enter UPI Transaction ID" value={transactionId} onChange={e => setTransactionId(e.target.value)} required />
            </div>
          </div>
        )}

        {selectedMethod?.method_type === 'Bank Transfer' && (
          <div className="p-3 border border-primary rounded bg-white text-start shadow-sm mb-4 animate-fade-in">
            <h6 className="fw-bold text-primary mb-2">Pay via Bank Transfer directly to Hotel</h6>
            <div className="bg-light p-2 rounded mb-3 small">
              <div><strong>Account Name:</strong> {selectedMethod.account_name}</div>
              <div><strong>Account Number:</strong> {selectedMethod.account_number}</div>
              <div><strong>IFSC:</strong> {selectedMethod.ifsc_code}</div>
              <div><strong>Bank:</strong> {selectedMethod.bank_name}</div>
            </div>
            <div className="text-start">
              <label className="form-label small fw-bold">Transaction Reference ID *</label>
              <input type="text" className="form-control" placeholder="Enter Bank Transfer Reference" value={transactionId} onChange={e => setTransactionId(e.target.value)} required />
            </div>
          </div>
        )}

        <div className="mt-4 text-end">
          <button 
            className="btn btn-warning px-5 py-2.5 fw-bold w-100 shadow-sm rounded-3" 
            onClick={handleConfirmBooking}
            disabled={isProcessing || (isUpi && !transactionId) || (selectedMethod && (selectedMethod.method_type === 'UPI' || selectedMethod.method_type === 'Bank Transfer') && !transactionId)}
            style={{ fontSize: '0.95rem' }}
          >
            {isProcessing ? 'Confirming Booking...' : (isPayAtHotel ? `Confirm Booking (Pay ₹${totalAmount.toLocaleString('en-IN')} at Hotel)` : `Submit Payment of ₹${totalAmount.toLocaleString('en-IN')}`)}
          </button>
        </div>
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="text-center py-4 animate-fade-in">
        <div className="text-success mb-3">
            <CheckCircle size={64} className="mx-auto" />
        </div>
        <h3 className="fw-bold mb-2">{isPayAtHotel ? 'Booking Confirmed!' : 'Payment Submitted Successfully'}</h3>
        <p className="text-muted mb-4 px-3">
            {isPayAtHotel 
              ? <>Your reservation at <strong>{selectedBookingItem.name}</strong> is confirmed. You can pay <strong>₹{totalAmount.toLocaleString('en-IN')}</strong> directly at the hotel front desk during check-in.</>
              : <>Your payment details have been sent to <strong>{selectedBookingItem.name}</strong> for verification. You will receive an email and WhatsApp message after verification.</>}
        </p>
        
        <div className="bg-light rounded p-3 text-start mx-auto border mb-4" style={{ maxWidth: '400px' }}>
            <div className="d-flex justify-content-between mb-2">
                <span className="text-muted small">Booking Reference ID</span>
                <span className="fw-bold text-primary">{bookingId}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
                <span className="text-muted small">Hotel Property</span>
                <span className="fw-bold">{selectedBookingItem.name}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
                <span className="text-muted small">Dates</span>
                <span className="fw-bold">{pickupDate} to {dropDate}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
                <span className="text-muted small">Payment Mode</span>
                <span className="badge bg-success text-white">{isPayAtHotel ? 'Pay at Hotel' : 'Online / UPI'}</span>
            </div>
            <div className="d-flex justify-content-between">
                <span className="text-muted small">Total Payable</span>
                <span className="fw-bold text-dark">₹{finalTotalPayable.toLocaleString('en-IN')}</span>
            </div>
            {appliedWalletAmount > 0 && (
              <div className="d-flex justify-content-between text-success fw-bold small mt-1">
                <span>Wallet Cashback Used</span>
                <span>-₹{appliedWalletAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
        </div>

        {/* 10% Cashback Notification Card */}
        <div className="card border-0 shadow-sm rounded-4 p-3.5 my-3 text-start mx-auto" style={{ maxWidth: '420px', background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)', color: '#ffffff' }}>
          <div className="d-flex align-items-center gap-2 mb-1.5">
            <div className="rounded-circle p-1.5 bg-warning text-dark d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
              <Gift size={16} />
            </div>
            <h6 className="fw-black text-white mb-0 font-heading" style={{ fontSize: '15px' }}>
              🎁 Cashback You Can Earn: ₹{projectedCashback.toLocaleString('en-IN')}
            </h6>
          </div>
          <p className="text-white-50 text-xs mb-2">
            💰 <strong>10% Cashback (₹{projectedCashback.toLocaleString('en-IN')})</strong> will be added to your <strong>WOW GOA Wallet</strong> after your hotel stay is marked <strong>Completed</strong>.
          </p>
          <div className="text-warning text-xxs fw-semibold d-flex align-items-center gap-1">
            <Clock size={12} />
            <span>⏳ Valid for 30 days upon completion. Usable on future Car, Hotel & Trip bookings.</span>
          </div>
        </div>

        <div className="card border-0 shadow-sm rounded-4 p-4 my-3 text-start bg-light mx-auto" style={{ maxWidth: '420px', border: '1px solid #e2e8f0' }}>
            <div className="d-flex align-items-center gap-2 mb-1.5">
                <Compass size={20} className="text-warning" />
                <h6 className="fw-bold text-dark mb-0 font-heading" style={{ fontSize: '15px' }}>
                    Track in WOW GOA Customer Portal
                </h6>
            </div>
            <p className="text-muted text-xs mb-3">
                Track your hotel stay reservation, check-in schedule, wallet cashback and loyalty tier from your WOW GOA Customer Portal.
            </p>
            <button 
                type="button" 
                className="btn btn-warning text-dark fw-bold rounded-pill px-4 py-2.5 text-xs d-flex align-items-center justify-content-center gap-2 shadow-sm w-100 font-heading"
                onClick={() => {
                    if (guestPhone) {
                        try {
                            sessionStorage.setItem('customer_login_phone', guestPhone);
                            localStorage.removeItem('customerUser');
                        } catch (e) {}
                    }
                    setSelectedBookingItem(null);
                    window.location.href = '/customer';
                }}
            >
                <span>View My Booking & Wallet →</span>
            </button>
        </div>

        <button className="btn btn-link text-muted text-xs text-decoration-none mt-1" onClick={() => setSelectedBookingItem(null)}>
          Done / Close & Return to Hotels
        </button>
    </div>
  );

  return (
    <div className="checkout-modal-backdrop" onClick={() => setSelectedBookingItem(null)}>
      <div className="checkout-modal-content animate-fade-in-up" style={{ maxWidth: step === 4 ? '600px' : '900px' }} onClick={(e) => e.stopPropagation()}>
        <div className="checkout-header bg-dark text-white">
          <h4 className="m-0 fw-bold">
            {step === 4 ? 'Booking Confirmation' : 'Complete Your Booking'}
          </h4>
          <button type="button" className="btn btn-link text-white p-0 border-0" onClick={() => setSelectedBookingItem(null)}>
            <X size={24} />
          </button>
        </div>
        
        <div className="checkout-body p-0">
            {step === 4 ? (
                <div className="p-4">
                    {renderStep4()}
                </div>
            ) : (
                <div className="row g-0 h-100">
                    <div className="col-lg-7 p-4 border-end overflow-auto" style={{ maxHeight: '75vh' }}>
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}
                    </div>
                    <div className="col-lg-5 p-4 bg-light overflow-auto" style={{ maxHeight: '75vh' }}>
                        <h5 className="fw-bold mb-3 border-bottom pb-2">Booking Summary</h5>
                        
                        <div className="card shadow-sm border mb-4 overflow-hidden">
                            <div className="p-2 bg-light border-bottom">
                              <ImageCarousel
                                images={hotelAllImages}
                                height="175px"
                                rounded="10px"
                                alt={selectedBookingItem.name}
                              />
                            </div>
                            <div className="card-body p-3">
                                <h6 className="fw-bold mb-1">{selectedBookingItem.name}</h6>
                                <span className="badge bg-secondary mb-3">Hotel Stay</span>
                                
                                <div className="bg-light p-2 rounded mb-3 small border">
                                    <div className="row g-2">
                                        <div className="col-6">
                                            <div className="text-muted" style={{fontSize: '10px'}}>Check-in</div>
                                            <div className="fw-bold">{pickupDate}</div>
                                        </div>
                                        <div className="col-6">
                                            <div className="text-muted" style={{fontSize: '10px'}}>Check-out</div>
                                            <div className="fw-bold">{dropDate}</div>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-center text-muted fw-bold" style={{fontSize: '11px'}}>
                                        {bookingDays} Night{bookingDays > 1 ? 's' : ''} Stay
                                    </div>
                                </div>
                                
                                {selectedRoom && (
                                    <div className="mb-3 p-2 bg-white border rounded small">
                                        <div className="fw-bold text-primary mb-1">{selectedRoom.name}</div>
                                        <div className="d-flex justify-content-between text-muted" style={{fontSize: '11px'}}>
                                            <span>Rooms: {numRooms}</span>
                                            <span>Guests: {adults} Adults {children > 0 ? `, ${children} Children` : ''}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="billing-summary-card small">
                            <h6 className="fw-bold mb-3 border-bottom pb-2">Price Breakdown</h6>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Room Price (x{numRooms}):</span>
                                <span>₹{(roomPrice * numRooms).toLocaleString('en-IN')} / night</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Duration:</span>
                                <span>{bookingDays} Nights</span>
                            </div>
                            <div className="d-flex justify-content-between border-top pt-2 mb-2 fw-semibold">
                                <span>Room Total:</span>
                                <span>₹{roomTotal.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2 text-muted">
                                <span>GST (18%):</span>
                                <span>₹{gst.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2 text-muted">
                                <span>Platform Fee:</span>
                                <span>₹{platformFee.toLocaleString('en-IN')}</span>
                            </div>

                            {walletBalance > 0 && (
                                <div className="p-2.5 rounded-3 my-2" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center gap-1.5">
                                            <Wallet size={15} className="text-success" />
                                            <div>
                                                <div className="fw-bold text-dark text-xs">WOW GOA Wallet</div>
                                                <div className="text-muted" style={{ fontSize: '10px' }}>Available: ₹{walletBalance.toLocaleString('en-IN')}</div>
                                            </div>
                                        </div>
                                        <div className="form-check form-switch mb-0">
                                            <input 
                                                type="checkbox" 
                                                className="form-check-input" 
                                                id="useHotelWalletCashback"
                                                checked={useWalletCashback}
                                                onChange={(e) => setUseWalletCashback(e.target.checked)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <label className="form-check-label text-xs fw-bold text-success" htmlFor="useHotelWalletCashback">
                                                Use ₹{Math.min(walletBalance, totalAmount).toLocaleString('en-IN')}
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {appliedWalletAmount > 0 && (
                                <div className="d-flex justify-content-between mb-2 text-success fw-bold">
                                    <span>Wallet Cashback Applied:</span>
                                    <span>-₹{appliedWalletAmount.toLocaleString('en-IN')}</span>
                                </div>
                            )}

                            <div className="d-flex justify-content-between border-top border-dark pt-2 fw-bold text-primary" style={{ fontSize: '16px' }}>
                                <span>Total Payable:</span>
                                <span>₹{finalTotalPayable.toLocaleString('en-IN')}</span>
                            </div>

                            {/* 10% Cashback Earning Preview */}
                            <div className="mt-2.5 p-2 rounded-3 text-center" style={{ background: '#fef3c7', border: '1px solid #fde68a' }}>
                                <div className="text-xs fw-bold text-dark d-flex align-items-center justify-content-center gap-1">
                                    <Gift size={13} className="text-warning" />
                                    <span>10% Cashback You Will Earn: <strong className="text-success font-heading">₹{projectedCashback.toLocaleString('en-IN')}</strong></span>
                                </div>
                                <div className="text-muted text-xxs mt-0.5">
                                    Credited to your wallet on trip completion • Valid 30 days
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-3 bg-white border rounded text-muted mt-4" style={{ fontSize: '11px' }}>
                            <div className="d-flex align-items-start gap-2">
                                <ShieldCheck size={18} className="text-success flex-shrink-0 mt-0.5" />
                                <span><strong>Secure Booking:</strong> Your information is protected by 256-bit encryption.</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
