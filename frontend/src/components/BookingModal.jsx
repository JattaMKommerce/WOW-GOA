import React, { useState, useMemo, useEffect } from 'react';
import { X, CheckCircle, ShieldCheck, Compass, Calendar, Clock, MapPin } from 'lucide-react';
import { getTodayDateStr, addDays } from '../utils/dateUtils';
import UnifiedGalleryViewer from './UnifiedGalleryViewer';

export default function BookingModal({
  selectedBookingItem,
  setSelectedBookingItem,
  showSuccess,
  userName,
  setUserName,
  userPhone,
  setUserPhone,
  userLicense,
  setUserLicense,
  pickupLoc,
  pickupDate,
  pickupTime,
  dropDate,
  dropTime,
  bookingDays,
  handleConfirmBooking,
  allPackages = [],
  allCars = [],
  allBikes = []
}) {
  if (!selectedBookingItem) return null;

  const [modalPickupDate, setModalPickupDate] = useState(pickupDate || getTodayDateStr());
  const [modalDropDate, setModalDropDate] = useState(dropDate || addDays(pickupDate || getTodayDateStr(), bookingDays || 2));
  const [modalPickupTime, setModalPickupTime] = useState(pickupTime || '10:00 AM');
  const [modalDropTime, setModalDropTime] = useState(dropTime || '10:00 AM');
  const [modalPickupLoc, setModalPickupLoc] = useState(pickupLoc || 'Goa Airport (Dabolim / Mopa)');

  useEffect(() => {
    if (pickupDate) setModalPickupDate(pickupDate);
    if (dropDate) setModalDropDate(dropDate);
    if (pickupTime) setModalPickupTime(pickupTime);
    if (dropTime) setModalDropTime(dropTime);
    if (pickupLoc) setModalPickupLoc(pickupLoc);
  }, [pickupDate, dropDate, pickupTime, dropTime, pickupLoc]);

  const allItemImages = useMemo(() => {
    if (!selectedBookingItem) return [];
    let list = [];
    if (selectedBookingItem.images_json) {
      try {
        const parsed = typeof selectedBookingItem.images_json === 'string' ? JSON.parse(selectedBookingItem.images_json) : selectedBookingItem.images_json;
        if (Array.isArray(parsed)) list.push(...parsed);
      } catch (e) {}
    }
    if (selectedBookingItem.mediaList && Array.isArray(selectedBookingItem.mediaList)) {
      const urls = selectedBookingItem.mediaList.map(m => m?.url || m).filter(Boolean);
      list.push(...urls);
    }
    if (selectedBookingItem.media_list && Array.isArray(selectedBookingItem.media_list)) {
      const urls = selectedBookingItem.media_list.map(m => m?.url || m).filter(Boolean);
      list.push(...urls);
    }
    if (selectedBookingItem.additional_images && Array.isArray(selectedBookingItem.additional_images)) {
      list.push(...selectedBookingItem.additional_images);
    }
    if (selectedBookingItem.images && Array.isArray(selectedBookingItem.images)) {
      list.push(...selectedBookingItem.images);
    }
    if (selectedBookingItem.image) {
      list.push(selectedBookingItem.image);
    }
    if (selectedBookingItem.image_url) {
      list.push(selectedBookingItem.image_url);
    }
    const unique = Array.from(new Set(list.filter(u => typeof u === 'string' && u.trim().length > 0)));
    return unique.length > 0 ? unique : [selectedBookingItem.image || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80'];
  }, [selectedBookingItem]);

  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    setActiveImageIdx(0);
  }, [selectedBookingItem]);

  const [addonPackageId, setAddonPackageId] = useState('');
  const [addonVehicleId, setAddonVehicleId] = useState('');
  const [includeFlight, setIncludeFlight] = useState(false);
  const [hotelCategory, setHotelCategory] = useState('3');
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('upi');
  const [totalMembers, setTotalMembers] = useState(1);
  const [roomTypes, setRoomTypes] = useState([]);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState('any');

  const hotelUpgradeCost = {
    '3': 0,
    '4': 2500, // per person/package
    '5': 6000
  };

  useEffect(() => {
    import('../services/api').then(api => {
      const vendorId = selectedBookingItem?.vendor_id || selectedBookingItem?.vendorId;
      if (vendorId) {
        api.getVendorPaymentMethods(vendorId).then(methods => {
          setPaymentSettings(methods || []);
          if (methods && methods.length > 0) {
            setSelectedPaymentMethod(methods[0].id.toString());
          }
        }).catch(console.error);
      } else {
        // Fallback for global items without a vendor
        api.getAdminPaymentMethods().then(methods => {
          const activeMethods = methods.filter(m => m.status === 'Active');
          setPaymentSettings(activeMethods);
          if (activeMethods.length > 0) {
            setSelectedPaymentMethod(activeMethods[0].id.toString());
          }
        }).catch(console.error);
      }

      // Fetch room types if hotel
      const isHotelItem = selectedBookingItem && (selectedBookingItem.id.toString().startsWith('hotel-') || selectedBookingItem.property_type || selectedBookingItem.stars);
      if (isHotelItem && vendorId) {
         api.pmsListRoomTypes(vendorId).then(res => {
           const hotelRooms = (res.room_types || []).filter(rt => rt.hotel_id == selectedBookingItem.id && rt.status === 'Active');
           setRoomTypes(hotelRooms);
         }).catch(console.error);
      }
    });
  }, [selectedBookingItem]);

  const isHotel = String(selectedBookingItem?.id).startsWith('hotel-') || selectedBookingItem.property_type || selectedBookingItem.stars;
  const isCar = String(selectedBookingItem?.id).startsWith('car-') || selectedBookingItem.type === 'car';
  const isBike = String(selectedBookingItem?.id).startsWith('bike-') || selectedBookingItem.type === 'bike';
  const isFlight = String(selectedBookingItem?.id).startsWith('FL-') || String(selectedBookingItem?.id).startsWith('fl-') || String(selectedBookingItem?.id).startsWith('flt-') || selectedBookingItem.type === 'flight' || Boolean(selectedBookingItem.airline) || Boolean(selectedBookingItem.flight_number);
  const isPackage = !isCar && !isBike && !isFlight && !isHotel;
  
  const calculatedDays = useMemo(() => {
    if (!modalPickupDate || !modalDropDate) return bookingDays || 1;
    const start = new Date(modalPickupDate);
    const end = new Date(modalDropDate);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [modalPickupDate, modalDropDate, bookingDays]);

  const addonPackage = allPackages.find(p => p.id === addonPackageId);
  const addonVehicle = [...allCars, ...allBikes].find(v => v.id === addonVehicleId);

  const baseRate = (isPackage && includeFlight && selectedBookingItem.price_with_flight) 
    ? selectedBookingItem.price_with_flight 
    : selectedBookingItem.price;

  let itemCost = baseRate * calculatedDays;
  if (isPackage) {
    itemCost = baseRate; // packages are flat price
  }

  if (isFlight) {
    // If flight multiply base rate by members
    itemCost = baseRate * totalMembers;
  }

  let subtotal = itemCost;
  if (isPackage) {
    subtotal += hotelUpgradeCost[hotelCategory] || 0;
  }
  if (addonPackage) {
    subtotal += addonPackage.price;
  }
  if (addonVehicle) {
    subtotal += (addonVehicle.price * calculatedDays);
  }

  const tax = Math.round(subtotal * 0.18);
  const fee = 250;
  const total = subtotal + tax + fee;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleConfirmBooking(e, selectedPaymentMethod, {
      pickupDate: modalPickupDate,
      dropDate: modalDropDate,
      pickupTime: modalPickupTime,
      dropTime: modalDropTime,
      pickupLoc: modalPickupLoc,
      bookingDays: calculatedDays,
      subtotal,
      tax,
      fee,
      total
    });
  };

  return (
    <div className="checkout-modal-backdrop" onClick={() => setSelectedBookingItem(null)}>
      <div className="checkout-modal-content animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="checkout-header">
          <h4 className="m-0 font-heading text-white">
            Confirm Booking Summary
          </h4>
          <button 
            type="button" 
            className="btn btn-link text-white p-0 border-0"
            onClick={() => setSelectedBookingItem(null)}
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="checkout-body text-start">
          {showSuccess ? (
            <div className="text-center py-4 animate-fade-in">
              <div className="text-success mb-3">
                <CheckCircle size={64} className="mx-auto" />
              </div>
              <h3 className="fw-bold mb-2">Booking Reserved Successfully!</h3>
              <p className="text-muted">
                Thank you, <strong>{userName}</strong>. Your reservation for <strong>{selectedBookingItem.name}</strong> is confirmed. We have sent details and billing receipt to your contact number <strong>{userPhone}</strong>.
              </p>
              {addonPackage && (
                <p className="text-success small fw-bold">
                  ✓ Bundled Tour Package: {addonPackage.name}
                </p>
              )}
              {addonVehicle && (
                <p className="text-success small fw-bold">
                  ✓ Bundled Self-Drive Vehicle: {addonVehicle.name}
                </p>
              )}
              {(!isPackage || !selectedBookingItem.traveller_details) ? (
                  <p className="text-warning fw-semibold mt-3">
                    <Compass size={18} className="me-1 d-inline-block" /> Our delivery executive will call you shortly to coordinate pickup at {pickupLoc}.
                  </p>
              ) : (
                  <div className="mt-4 text-start bg-light p-3 rounded border border-success border-opacity-25">
                      <h6 className="fw-bold text-success mb-2">Trip Voucher Generated</h6>
                      <p className="small text-muted mb-0">Your detailed itinerary and payment receipts have been sent to your email. Our travel expert will contact you within 24 hours to confirm flight and hotel details.</p>
                  </div>
              )}
              <button 
                type="button" 
                className="btn btn-primary mt-4 px-5 py-2 rounded-pill"
                onClick={() => setSelectedBookingItem(null)}
              >
                Back to Catalog
              </button>
            </div>
          ) : (
            <div className="row g-4">
              {/* Left Column: Form Details */}
              <div className="col-lg-7 text-start">
                
                <h5 className="fw-bold mb-3 border-bottom pb-2">Customer & Trip Details</h5>
                
                <form onSubmit={handleFormSubmit} id="booking-form">
                  {(!isPackage || !selectedBookingItem.traveller_details) && (
                    <>
                      <div className="mb-3">
                        <label className="form-label small fw-bold">Full Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="e.g. Rohan Sharma"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          required 
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label small fw-bold">Mobile Phone Number</label>
                        <input 
                          type="tel" 
                          className="form-control" 
                          placeholder="e.g. +91 9876543210"
                          value={userPhone}
                          onChange={(e) => setUserPhone(e.target.value)}
                          required 
                        />
                      </div>
                    </>
                  )}

                {(isPackage && selectedBookingItem.traveller_details) && (
                  <div className="bg-light p-3 rounded border mb-4">
                     <h6 className="fw-bold text-primary mb-2">Lead Traveller Verified</h6>
                     <div className="d-flex align-items-center gap-2 mb-1">
                         <span className="text-muted small">Name:</span>
                         <span className="fw-bold">{userName}</span>
                     </div>
                     <div className="d-flex align-items-center gap-2">
                         <span className="text-muted small">Contact:</span>
                         <span className="fw-bold">{userPhone}</span>
                     </div>
                  </div>
                )}

                  {(isCar || isBike || addonVehicle) && (
                    <div className="mb-3">
                      <label className="form-label small fw-bold">Driving License Number</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="e.g. DL-1420180098765"
                        value={userLicense}
                        onChange={(e) => setUserLicense(e.target.value)}
                        required 
                      />
                    </div>
                  )}

                  {isFlight && (
                    <div className="mb-3">
                      <label className="form-label small fw-bold">Total Members</label>
                      <input 
                        type="number" 
                        min="1"
                        className="form-control" 
                        value={totalMembers}
                        onChange={(e) => setTotalMembers(parseInt(e.target.value) || 1)}
                        required 
                      />
                    </div>
                  )}

                  {/* Customization options removed as requested */}

                  {/* Interactive Date, Time & Pickup Location Picker */}
                  <div className="p-3 rounded mb-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom">
                      <span className="fw-bold text-dark small d-flex align-items-center gap-1">
                        <Calendar size={15} className="text-warning" /> Trip Dates & Location
                      </span>
                      <span className="badge bg-primary bg-opacity-10 text-primary fw-bold" style={{ fontSize: '0.72rem' }}>
                        {calculatedDays} {calculatedDays === 1 ? (isHotel ? 'Night' : 'Day') : (isHotel ? 'Nights' : 'Days')} Duration
                      </span>
                    </div>

                    <div className="row g-2">
                      {/* Pickup Date & Drop Date */}
                      <div className="col-sm-6">
                        <label className="form-label small fw-bold text-secondary mb-1">
                          {isFlight ? 'Departure Date' : isHotel ? 'Check-in Date' : 'Pickup Date'}
                        </label>
                        <input
                          type="date"
                          className="form-control form-control-sm fw-semibold"
                          min={getTodayDateStr()}
                          value={modalPickupDate}
                          onChange={(e) => {
                            const newPickup = e.target.value;
                            setModalPickupDate(newPickup);
                            if (modalDropDate <= newPickup) {
                              setModalDropDate(addDays(newPickup, 1));
                            }
                          }}
                          required
                        />
                      </div>

                      <div className="col-sm-6">
                        <label className="form-label small fw-bold text-secondary mb-1">
                          {isFlight ? 'Return Date' : isHotel ? 'Check-out Date' : 'Drop / Return Date'}
                        </label>
                        <input
                          type="date"
                          className="form-control form-control-sm fw-semibold"
                          min={modalPickupDate ? addDays(modalPickupDate, 1) : getTodayDateStr()}
                          value={modalDropDate}
                          onChange={(e) => setModalDropDate(e.target.value)}
                          required
                        />
                      </div>

                      {/* Pickup & Drop Times */}
                      {!isFlight && !isHotel && (
                        <>
                          <div className="col-6">
                            <label className="form-label small text-muted mb-1" style={{ fontSize: '0.75rem' }}>Pickup Time</label>
                            <select
                              className="form-select form-select-sm"
                              value={modalPickupTime}
                              onChange={(e) => setModalPickupTime(e.target.value)}
                            >
                              {['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM'].map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>

                          <div className="col-6">
                            <label className="form-label small text-muted mb-1" style={{ fontSize: '0.75rem' }}>Drop Time</label>
                            <select
                              className="form-select form-select-sm"
                              value={modalDropTime}
                              onChange={(e) => setModalDropTime(e.target.value)}
                            >
                              {['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM'].map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}

                      {/* Pickup Location */}
                      <div className="col-12 mt-1">
                        <label className="form-label small fw-bold text-secondary mb-1">
                          {isFlight ? 'Route / Sector' : 'Pickup & Drop Location'}
                        </label>
                        {isFlight ? (
                          <input
                            type="text"
                            className="form-control form-control-sm bg-white"
                            readOnly
                            value={`${selectedBookingItem.from || 'Origin'} to ${selectedBookingItem.to || 'Destination'}`}
                          />
                        ) : (
                          <select
                            className="form-select form-select-sm fw-semibold"
                            value={modalPickupLoc}
                            onChange={(e) => setModalPickupLoc(e.target.value)}
                          >
                            <option value="Goa Airport (Dabolim / Mopa)">✈️ Goa Airport (Dabolim / Mopa)</option>
                            <option value="Dabolim Airport (GOI)">✈️ Dabolim Airport (GOI)</option>
                            <option value="Mopa Airport (GOX)">✈️ Manohar International Airport (Mopa / GOX)</option>
                            <option value="Madgaon Railway Station">🚆 Madgaon Railway Station</option>
                            <option value="Thivim Railway Station">🚆 Thivim Railway Station</option>
                            <option value="Karmali Railway Station">🚆 Karmali Railway Station</option>
                            <option value="Calangute, Goa">🏖️ Calangute, Goa</option>
                            <option value="Baga, Goa">🏖️ Baga, Goa</option>
                            <option value="Candolim, Goa">🏖️ Candolim, Goa</option>
                            <option value="Anjuna, Goa">🏖️ Anjuna, Goa</option>
                            <option value="Vagator, Goa">🏖️ Vagator, Goa</option>
                            <option value="Panaji, Goa">🏙️ Panaji (City Center), Goa</option>
                            <option value="Margao, Goa">🏙️ Margao, Goa</option>
                            <option value="All Goa Hotel Delivery">📍 All Goa Hotel Delivery</option>
                          </select>
                        )}
                      </div>
                    </div>
                  </div>

                  {paymentSettings && Array.isArray(paymentSettings) && paymentSettings.length > 0 && (
                    <div className="mb-4">
                      <h6 className="fw-bold mb-3">Select Payment Method</h6>
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        {paymentSettings.map(pm => (
                          <div key={pm.id || pm.method_type} className="form-check p-0 mb-0">
                            <input type="radio" className="btn-check" name="payMethod" id={`pay_${pm.id || pm.method_type}`} autoComplete="off" 
                                   checked={selectedPaymentMethod === (pm.id?.toString() || 'global_upi')} onChange={() => setSelectedPaymentMethod(pm.id?.toString() || 'global_upi')} />
                            <label className="btn btn-outline-primary fw-bold" htmlFor={`pay_${pm.id || pm.method_type}`}>
                              {pm.display_name || pm.method_type}
                            </label>
                          </div>
                        ))}
                      </div>

                      {paymentSettings.filter(pm => selectedPaymentMethod === (pm.id?.toString() || 'global_upi')).map(pm => (
                        <div key={pm.id || 'global'} className="p-3 border border-primary rounded bg-white shadow-sm">
                          {pm.method_type === 'UPI' && (
                            <div className="text-center">
                              <h6 className="fw-bold text-primary mb-2">Pay via UPI</h6>
                              <p className="small text-muted mb-2">Scan the QR code or use the UPI ID below to make your payment of <strong>₹{total}</strong>.</p>
                              {pm.qr_image_url && (
                                <img src={pm.qr_image_url} alt="UPI QR Code" className="img-fluid border rounded mb-2 shadow-sm" style={{maxHeight: '150px'}} />
                              )}
                              <div className="fw-bold text-dark border p-2 bg-light rounded d-inline-block user-select-all">
                                {pm.upi_id || 'merchant@upi'}
                              </div>
                            </div>
                          )}
                          {pm.method_type === 'Bank Transfer' && (
                            <div>
                              <h6 className="fw-bold text-primary mb-2">Bank Transfer Details</h6>
                              <div className="small bg-light p-2 rounded">
                                <div><strong>Bank:</strong> {pm.bank_name}</div>
                                <div><strong>Account Name:</strong> {pm.account_name}</div>
                                <div><strong>Account Number:</strong> {pm.account_number}</div>
                                <div><strong>IFSC:</strong> {pm.ifsc_code}</div>
                              </div>
                            </div>
                          )}
                          {pm.method_type === 'Razorpay' && (
                            <div>
                              <h6 className="fw-bold text-primary mb-2">Pay via Razorpay</h6>
                              <p className="small text-muted mb-0">You will be redirected to the secure Razorpay checkout page when you confirm the booking.</p>
                            </div>
                          )}
                          <p className="text-xxs text-muted mt-2 text-center">After making the payment, click confirm to reserve your booking.</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <button type={(!isPackage || !selectedBookingItem.traveller_details) ? "submit" : "button"} onClick={(e) => { if (isPackage && selectedBookingItem.traveller_details) handleFormSubmit(e) }} form="booking-form" className="btn w-100 py-2.5 fw-bold text-white shadow-sm mt-3" style={{ background: '#FFC107' }}>
                    Confirm & Reserve Booking
                  </button>
                </form>
              </div>

              {/* Right Column: Billing Breakdowns */}
              <div className="col-lg-5 text-start">
                <h5 className="fw-bold mb-3 border-bottom pb-2">Price Breakdown</h5>
                
                <div className="card shadow-sm border mb-3 overflow-hidden">
                  <div className="p-2 bg-light border-bottom">
                    <UnifiedGalleryViewer
                      images={allItemImages}
                      variant="compact"
                      compactHeight="160px"
                      alt={selectedBookingItem.name}
                    />
                  </div>
                  <div className="card-body p-3">
                    <h6 className="fw-bold mb-1" style={{ fontSize: '14px' }}>{selectedBookingItem.name}</h6>
                    <span className="badge bg-secondary mb-2" style={{ fontSize: '10px' }}>
                      {isHotel ? 'Hotel Booking' :
                       isCar ? 'Car Rental' : 
                       isBike ? 'Bike Rental' : 
                       isFlight ? 'Flight Booking' : 'Holiday Package'}
                    </span>
                    
                    {selectedBookingItem.isCustomized && (
                      <div className="mb-2 p-2 bg-light rounded text-dark small border">
                        <span className="fw-bold d-block text-primary" style={{fontSize: '11px'}}>Customizations Included:</span>
                        <div style={{fontSize: '10px'}}>
                          {JSON.parse(selectedBookingItem.customizations).includeFlights && <div>✈️ Flights Added</div>}
                          {JSON.parse(selectedBookingItem.customizations).cabType === 'self-drive' && <div>🚗 Self-Drive Selected</div>}
                          {JSON.parse(selectedBookingItem.customizations).airportTransit && <div>🚕 Airport Transit Added</div>}
                        </div>
                      </div>
                    )}
                    
                    <div className="billing-summary-card mt-2 small">
                      <div className="d-flex justify-content-between mb-2">
                        <span>Base Price{isPackage && includeFlight ? ' (With Flight)' : ''}:</span>
                        <span>₹{baseRate} {isPackage ? '' : isFlight ? `× ${totalMembers} pax` : '/ day'}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>{isFlight ? 'Flight Info:' : 'Duration:'}</span>
                        <span>{isFlight ? `${selectedBookingItem.stops || 'Direct'} (${selectedBookingItem.duration || '2h'})` : `${calculatedDays} ${isHotel ? 'Nights' : 'Days'}`}</span>
                      </div>

                      {addonPackage && (
                        <div className="d-flex justify-content-between mb-2 text-success fw-bold">
                          <span>Addon Plan ({addonPackage.name}):</span>
                          <span>₹{addonPackage.price}</span>
                        </div>
                      )}

                      {addonVehicle && (
                        <div className="d-flex justify-content-between mb-2 text-success fw-bold">
                          <span>Addon Drive ({addonVehicle.name}):</span>
                          <span>₹{addonVehicle.price * calculatedDays}</span>
                        </div>
                      )}

                      <div className="d-flex justify-content-between border-top pt-2 mb-2 fw-semibold">
                        <span>Subtotal:</span>
                        <span>₹{subtotal}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2 text-muted">
                        <span>GST (18%):</span>
                        <span>₹{tax}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2 text-muted">
                        <span>Admin/Delivery Fee:</span>
                        <span>₹{fee}</span>
                      </div>
                      <div className="d-flex justify-content-between border-top border-dark pt-2 fw-bold text-primary" style={{ fontSize: '16px' }}>
                        <span>Total Payable:</span>
                        <span>₹{total}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {(isCar || isBike) && selectedBookingItem.documents_json && JSON.parse(selectedBookingItem.documents_json).length > 0 && (
                  <div className="card shadow-sm border mb-3">
                    <div className="card-body p-3">
                      <h6 className="fw-bold mb-2" style={{ fontSize: '13px' }}>Vehicle Documents</h6>
                      <div className="d-flex flex-wrap gap-2">
                        {JSON.parse(selectedBookingItem.documents_json).map((doc, i) => (
                          <a key={i} href={doc} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                            <Compass size={12} /> View Document {i + 1}
                          </a>
                        ))}
                      </div>
                      <p className="text-muted mt-2 mb-0" style={{ fontSize: '10px' }}>You can download the verified vehicle documents for your records before booking.</p>
                    </div>
                  </div>
                )}
                <div className="p-3 bg-light rounded text-muted" style={{ fontSize: '11px' }}>
                  <div className="d-flex align-items-start gap-2">
                    <ShieldCheck size={18} className="text-success flex-shrink-0 mt-0.5" />
                    <span><strong>Security Guarantee:</strong> Safe payments simulation. Original ID is required at delivery. No security deposit for premium cars.</span>
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
