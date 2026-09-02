import React, { useState, useMemo, useEffect } from 'react';
import { X, CheckCircle, ShieldCheck, Compass, Calendar, Clock, MapPin, Cake, Award, Sparkles } from 'lucide-react';
import { getTodayDateStr, addDays } from '../utils/dateUtils';
import { checkCustomerDob } from '../services/api';
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
  lastConfirmedBooking,
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
  const [userDob, setUserDob] = useState('');
  const [isDobSaved, setIsDobSaved] = useState(false);
  const [dobChecking, setDobChecking] = useState(false);

  // Customer Wallet Cashback State
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWalletCashback, setUseWalletCashback] = useState(false);

  useEffect(() => {
    if (pickupDate) setModalPickupDate(pickupDate);
    if (dropDate) setModalDropDate(dropDate);
    if (pickupTime) setModalPickupTime(pickupTime);
    if (dropTime) setModalDropTime(dropTime);
    if (pickupLoc) setModalPickupLoc(pickupLoc);
  }, [pickupDate, dropDate, pickupTime, dropTime, pickupLoc]);

  // Repeat customer lookup for Date of Birth & Wallet Balance
  useEffect(() => {
    const clean = String(userPhone || '').replace(/\D/g, '');
    if (clean.length >= 10) {
      setDobChecking(true);
      checkCustomerDob(clean).then(res => {
        if (res && res.exists && res.date_of_birth) {
          setUserDob(res.date_of_birth);
          setIsDobSaved(true);
          if (!userName && res.name && setUserName) {
            setUserName(res.name);
          }
        } else {
          setIsDobSaved(false);
        }
      }).catch(() => {
        setIsDobSaved(false);
      }).finally(() => {
        setDobChecking(false);
      });

      // Fetch customer wallet
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
  }, [userPhone]);

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

  // Driver / Chauffeur Service States
  const [driverRequired, setDriverRequired] = useState(false);
  const [driverPickupEnabled, setDriverPickupEnabled] = useState(false);
  const [driverPickupDate, setDriverPickupDate] = useState('');
  const [driverPickupTime, setDriverPickupTime] = useState('10:00 AM');
  const [driverPickupLoc, setDriverPickupLoc] = useState('Goa Airport (Dabolim)');
  const [driverPickupCustomLoc, setDriverPickupCustomLoc] = useState('');

  const [driverDropEnabled, setDriverDropEnabled] = useState(false);
  const [driverDropDate, setDriverDropDate] = useState('');
  const [driverDropTime, setDriverDropTime] = useState('10:00 AM');
  const [driverDropLoc, setDriverDropLoc] = useState('Goa Airport (Dabolim)');
  const [driverDropCustomLoc, setDriverDropCustomLoc] = useState('');

  const [driverFullDayEnabled, setDriverFullDayEnabled] = useState(false);
  const [driverFullDayStart, setDriverFullDayStart] = useState('');
  const [driverFullDayEnd, setDriverFullDayEnd] = useState('');
  const [driverFullDayStartLoc, setDriverFullDayStartLoc] = useState('Hotel');
  const [driverFullDayCustomStartLoc, setDriverFullDayCustomStartLoc] = useState('');
  const [driverFullDayEndLoc, setDriverFullDayEndLoc] = useState('Hotel');
  const [driverFullDayCustomEndLoc, setDriverFullDayCustomEndLoc] = useState('');

  // Default driver dates from modal trip dates
  useEffect(() => {
    if (modalPickupDate) {
      if (!driverPickupDate) setDriverPickupDate(modalPickupDate);
      if (!driverFullDayStart) setDriverFullDayStart(modalPickupDate);
    }
    if (modalDropDate) {
      if (!driverDropDate) setDriverDropDate(modalDropDate);
      if (!driverFullDayEnd) setDriverFullDayEnd(modalDropDate);
    }
  }, [modalPickupDate, modalDropDate]);

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

  // Calculate Full-Day Driver Days automatically
  const driverFullDayDaysCount = useMemo(() => {
    if (!driverFullDayEnabled || !driverFullDayStart || !driverFullDayEnd) return 0;
    const start = new Date(driverFullDayStart);
    const end = new Date(driverFullDayEnd);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1; // inclusive count
    return diff > 0 ? diff : 1;
  }, [driverFullDayEnabled, driverFullDayStart, driverFullDayEnd]);

  // Exact driver costs based ONLY on selected services (₹400 for Pickup, ₹400 for Drop, ₹800/day for Full-Day)
  const driverPickupCost = (driverRequired && driverPickupEnabled) ? 400 : 0;
  const driverDropCost = (driverRequired && driverDropEnabled) ? 400 : 0;
  const driverFullDayCost = (driverRequired && driverFullDayEnabled) ? (800 * driverFullDayDaysCount) : 0;
  const driverTotalCharge = driverRequired ? (driverPickupCost + driverDropCost + driverFullDayCost) : 0;
  const totalDriverServiceDays = driverRequired 
    ? (driverFullDayDaysCount + (driverPickupEnabled ? 1 : 0) + (driverDropEnabled ? 1 : 0)) 
    : 0;

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
  const baseTotal = subtotal + tax + fee;
  const total = baseTotal + driverTotalCharge;

  // Wallet Deduction & 10% Cashback Calculations
  const appliedWalletAmount = (useWalletCashback && walletBalance > 0) ? Math.min(walletBalance, total) : 0;
  const finalPayable = Math.max(0, total - appliedWalletAmount);
  const projectedCashback = Math.round(finalPayable * 0.10);

  const handleFormSubmit = (e) => {
    e.preventDefault();

    // Validation for driver services when enabled
    if (driverRequired) {
      if (!driverPickupEnabled && !driverDropEnabled && !driverFullDayEnabled) {
        alert("Please select at least one Driver Service option: Pickup (₹400), Drop (₹400), or Full-Day Driver (₹800/day).");
        return;
      }

      if (driverPickupEnabled) {
        if (!driverPickupDate) {
          alert("Please select a valid Pickup Date for the Driver Pickup service.");
          return;
        }
        if (driverPickupLoc === 'Custom Address' && !driverPickupCustomLoc.trim()) {
          alert("Please enter the Custom Address for the Driver Pickup service.");
          return;
        }
      }

      if (driverDropEnabled) {
        if (!driverDropDate) {
          alert("Please select a valid Drop Date for the Driver Drop service.");
          return;
        }
        if (driverDropLoc === 'Custom Address' && !driverDropCustomLoc.trim()) {
          alert("Please enter the Custom Address for the Driver Drop service.");
          return;
        }
      }

      if (driverFullDayEnabled) {
        if (!driverFullDayStart || !driverFullDayEnd) {
          alert("Please select both Start and End Dates for the Full-Day Driver service.");
          return;
        }
        if (driverFullDayStart > driverFullDayEnd) {
          alert("Driver Start Date cannot be after End Date.");
          return;
        }
        if (driverFullDayStartLoc === 'Custom Address' && !driverFullDayCustomStartLoc.trim()) {
          alert("Please enter the Custom Start Location for the Driver service.");
          return;
        }
        if (driverFullDayEndLoc === 'Custom Address' && !driverFullDayCustomEndLoc.trim()) {
          alert("Please enter the Custom End Location for the Driver service.");
          return;
        }
      }
    }

    const finalPickupLocResolved = driverPickupLoc === 'Custom Address' ? driverPickupCustomLoc : driverPickupLoc;
    const finalDropLocResolved = driverDropLoc === 'Custom Address' ? driverDropCustomLoc : driverDropLoc;
    const finalFullDayStartLocResolved = driverFullDayStartLoc === 'Custom Address' ? driverFullDayCustomStartLoc : driverFullDayStartLoc;
    const finalFullDayEndLocResolved = driverFullDayEndLoc === 'Custom Address' ? driverFullDayCustomEndLoc : driverFullDayEndLoc;

    const driverDetailsPayload = {
      enabled: Boolean(driverRequired && (driverPickupEnabled || driverDropEnabled || driverFullDayEnabled)),
      pickup: {
        enabled: driverPickupEnabled,
        date: driverPickupDate || modalPickupDate,
        time: driverPickupTime || modalPickupTime,
        location: finalPickupLocResolved
      },
      drop: {
        enabled: driverDropEnabled,
        date: driverDropDate || modalDropDate,
        time: driverDropTime || modalDropTime,
        location: finalDropLocResolved
      },
      fullDay: {
        enabled: driverFullDayEnabled,
        startDate: driverFullDayStart || modalPickupDate,
        endDate: driverFullDayEnd || modalDropDate,
        daysCount: driverFullDayDaysCount,
        startLocation: finalFullDayStartLocResolved,
        endLocation: finalFullDayEndLocResolved
      },
      dutyStartTime: "09:00",
      dutyEndTime: "19:00",
      dutyDescription: "8–10 Hours Local Daily Duty",
      totalCharge: driverTotalCharge
    };

    handleConfirmBooking(e, selectedPaymentMethod, {
      pickupDate: modalPickupDate,
      dropDate: modalDropDate,
      pickupTime: modalPickupTime,
      dropTime: modalDropTime,
      pickupLoc: modalPickupLoc,
      bookingDays: calculatedDays,
      driver_required: driverRequired ? 1 : 0,
      driver_charge: driverTotalCharge,
      driver_days: totalDriverServiceDays,
      driver_earning: driverTotalCharge,
      driver_payment_status: 'Pending',
      driver_pickup_enabled: driverPickupEnabled ? 1 : 0,
      driver_pickup_date: driverPickupDate || modalPickupDate,
      driver_pickup_time: driverPickupTime || modalPickupTime,
      driver_pickup_loc: finalPickupLocResolved,
      driver_drop_enabled: driverDropEnabled ? 1 : 0,
      driver_drop_date: driverDropDate || modalDropDate,
      driver_drop_time: driverDropTime || modalDropTime,
      driver_drop_loc: finalDropLocResolved,
      driver_fullday_enabled: driverFullDayEnabled ? 1 : 0,
      driver_fullday_start: driverFullDayStart || modalPickupDate,
      driver_fullday_end: driverFullDayEnd || modalDropDate,
      driver_fullday_days: driverFullDayDaysCount,
      driver_details: driverDetailsPayload,
      date_of_birth: userDob,
      wallet_amount_used: appliedWalletAmount,
      subtotal,
      tax,
      fee,
      total,
      amount_paid: finalPayable,
      total_amount: total
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
              <h3 className="fw-black mb-1 font-heading text-dark">Booking Confirmed!</h3>
              <div className="badge bg-dark text-white text-xs px-3 py-1.5 rounded-pill fw-bold mb-3">
                Booking ID: {lastConfirmedBooking?.id || `WG${Math.floor(1000 + Math.random() * 9000)}`}
              </div>
              <p className="text-muted text-xs mb-3">
                Thank you, <strong>{userName}</strong>. Your reservation for <strong>{selectedBookingItem.name}</strong> has been successfully booked and confirmed.
              </p>
              {addonPackage && (
                <p className="text-success small fw-bold mb-1">
                  ✓ Bundled Tour Package: {addonPackage.name}
                </p>
              )}
              {addonVehicle && (
                <p className="text-success small fw-bold mb-2">
                  ✓ Bundled Self-Drive Vehicle: {addonVehicle.name}
                </p>
              )}

              {/* 10% Cashback Notification Card */}
              <div className="card border-0 shadow-sm rounded-4 p-3.5 my-3 text-start" style={{ background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)', color: '#ffffff' }}>
                <div className="d-flex align-items-center gap-2 mb-1.5">
                  <div className="rounded-circle p-1.5 bg-warning text-dark d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
                    <Gift size={16} />
                  </div>
                  <h6 className="fw-black text-white mb-0 font-heading" style={{ fontSize: '15px' }}>
                    🎁 Cashback You Can Earn: ₹{projectedCashback.toLocaleString('en-IN')}
                  </h6>
                </div>
                <p className="text-white-50 text-xs mb-2">
                  💰 <strong>10% Cashback (₹{projectedCashback.toLocaleString('en-IN')})</strong> will be added to your <strong>WOW GOA Wallet</strong> after your booking is marked <strong>Completed</strong>.
                </p>
                <div className="text-warning text-xxs fw-semibold d-flex align-items-center gap-1">
                  <Clock size={12} />
                  <span>⏳ Valid for 30 days upon completion. Usable on future Car, Hotel & Trip bookings.</span>
                </div>
              </div>

              {/* Customer Portal Notification Card */}
              <div className="card border-0 shadow-sm rounded-4 p-4 my-3 text-start bg-light" style={{ border: '1px solid #e2e8f0' }}>
                <div className="d-flex align-items-center gap-2 mb-1.5">
                  <Compass size={20} className="text-warning" />
                  <h6 className="fw-bold text-dark mb-0 font-heading" style={{ fontSize: '15px' }}>
                    Track in WOW GOA Customer Portal
                  </h6>
                </div>
                <p className="text-muted text-xs mb-3">
                  Track your booking, trip details, wallet cashback and loyalty tier from your WOW GOA Customer Portal.
                </p>
                <button 
                  type="button" 
                  className="btn btn-warning text-dark fw-bold rounded-pill px-4 py-2.5 text-xs d-flex align-items-center justify-content-center gap-2 shadow-sm w-100"
                  onClick={() => {
                    if (userPhone) {
                      try {
                        sessionStorage.setItem('customer_login_phone', userPhone);
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

              <button 
                type="button" 
                className="btn btn-link text-muted text-xs text-decoration-none mt-1"
                onClick={() => setSelectedBookingItem(null)}
              >
                Close & Return to Home
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
                        <label className="form-label small fw-bold">Full Name <span className="text-danger">*</span></label>
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
                        <label className="form-label small fw-bold">
                          Mobile Phone Number <span className="text-danger">* (Required for Tracking)</span>
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-light fw-bold text-xs">+91</span>
                          <input 
                            type="tel" 
                            className={`form-control ${userPhone && String(userPhone).replace(/\D/g, '').length < 10 ? 'is-invalid' : ''}`} 
                            placeholder="10-digit mobile number" 
                            value={userPhone} 
                            onChange={(e) => setUserPhone(e.target.value)} 
                            required 
                          />
                        </div>
                        <small className="text-muted" style={{ fontSize: '11px' }}>
                          Use this 10-digit mobile number to log in to the Customer Portal & track your booking.
                        </small>
                      </div>

                      {/* Date of Birth Mandatory Field with Auto-Retrieval for Repeat Bookings */}
                      {isDobSaved ? (
                        <div className="mb-3 p-2.5 rounded-3 bg-success bg-opacity-10 border border-success border-opacity-25 d-flex align-items-center justify-content-between animate-fade-in">
                          <div className="d-flex align-items-center gap-2">
                            <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', minWidth: '28px' }}>
                              <Cake size={14} />
                            </div>
                            <div>
                              <div className="text-xs fw-bold text-success d-flex align-items-center gap-1">
                                <ShieldCheck size={13} /> Verified DOB on WOW GOA Account
                              </div>
                              <div className="text-xs text-dark mt-0.5">
                                🎂 Date of Birth: <strong>{userDob}</strong> <span className="text-muted">(Saved for birthday benefits)</span>
                              </div>
                            </div>
                          </div>
                          <span className="badge bg-success text-white text-xs px-2 py-1 rounded-pill">Saved</span>
                        </div>
                      ) : (
                        <div className="mb-3 animate-fade-in">
                          <label className="form-label small fw-bold d-flex align-items-center justify-content-between">
                            <span className="d-flex align-items-center gap-1">
                              <Cake size={14} className="text-warning" /> Date of Birth <span className="text-danger">*</span>
                            </span>
                            <span className="text-muted" style={{ fontSize: '11px' }}>[ DD / MM / YYYY ]</span>
                          </label>
                          <input 
                            type="date" 
                            className="form-control" 
                            value={userDob}
                            onChange={(e) => setUserDob(e.target.value)}
                            required 
                            max={new Date().toISOString().split('T')[0]}
                          />
                          <small className="text-muted d-block mt-1" style={{ fontSize: '11px', color: '#64748b' }}>
                            Date of Birth is required to provide birthday benefits and special offers from WOW GOA.
                          </small>
                        </div>
                      )}
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
                       {userDob && (
                         <div className="d-flex align-items-center gap-2 mt-1 pt-1 border-top">
                           <span className="text-muted small">🎂 Birthday:</span>
                           <span className="fw-bold text-success">{userDob}</span>
                         </div>
                       )}
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

                  {/* Optional Private Driver Service Section */}
                  {!isFlight && (
                    <div className="mb-3 p-3 rounded-3" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                      <div className="form-check d-flex align-items-center gap-2 mb-1">
                        <input
                          type="checkbox"
                          className="form-check-input mt-0"
                          id="modal_driver_req"
                          checked={driverRequired}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setDriverRequired(checked);
                            if (checked && !driverPickupEnabled && !driverDropEnabled && !driverFullDayEnabled) {
                              setDriverPickupEnabled(true);
                            }
                          }}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label className="form-check-label fw-black text-dark mb-0 small d-flex align-items-center gap-1.5 flex-wrap font-heading" htmlFor="modal_driver_req" style={{ cursor: 'pointer' }}>
                          <span>Need a Verified Private Driver in Goa?</span>
                        </label>
                      </div>
                      
                      <div className="text-muted small ps-4 mb-2" style={{ fontSize: '0.74rem' }}>
                        Customized driver service in Goa. You are charged ONLY for the selected services & dates (not whole stay).
                      </div>

                      {driverRequired && (
                        <div className="mt-3 pt-3 border-top border-warning border-opacity-40 d-flex flex-column gap-2.5 ps-1 pe-1 animate-fade-in">
                          
                          {/* ─── Choice 1: 🚗 Pickup Service — ₹400 ─── */}
                          <div className="p-2.5 rounded-3 bg-white border border-warning border-opacity-40 shadow-xs">
                            <div className="form-check d-flex align-items-center justify-content-between mb-0">
                              <div className="d-flex align-items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="form-check-input mt-0"
                                  id="driver_service_pickup"
                                  checked={driverPickupEnabled}
                                  onChange={(e) => setDriverPickupEnabled(e.target.checked)}
                                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <label className="form-check-label fw-bold text-dark mb-0 small" htmlFor="driver_service_pickup" style={{ cursor: 'pointer' }}>
                                  🚗 Pickup Service
                                </label>
                              </div>
                              <span className="badge bg-warning text-dark fw-bold px-2 py-1" style={{ fontSize: '0.72rem' }}>
                                ₹400
                              </span>
                            </div>

                            {driverPickupEnabled && (
                              <div className="row g-2 mt-2 pt-2 border-top border-light animate-fade-in">
                                <div className="col-sm-4">
                                  <label className="form-label text-muted text-xxs fw-bold mb-1">Pickup Date</label>
                                  <input
                                    type="date"
                                    className="form-control form-control-sm text-xs"
                                    min={getTodayDateStr()}
                                    value={driverPickupDate || modalPickupDate || getTodayDateStr()}
                                    onChange={(e) => setDriverPickupDate(e.target.value)}
                                    required={driverPickupEnabled}
                                  />
                                </div>
                                <div className="col-sm-4">
                                  <label className="form-label text-muted text-xxs fw-bold mb-1">Pickup Time</label>
                                  <select
                                    className="form-select form-select-sm text-xs"
                                    value={driverPickupTime}
                                    onChange={(e) => setDriverPickupTime(e.target.value)}
                                  >
                                    {['06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM'].map(t => (
                                      <option key={t} value={t}>{t}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="col-sm-4">
                                  <label className="form-label text-muted text-xxs fw-bold mb-1">Pickup Location</label>
                                  <select
                                    className="form-select form-select-sm text-xs"
                                    value={driverPickupLoc}
                                    onChange={(e) => setDriverPickupLoc(e.target.value)}
                                  >
                                    <option value="Goa Airport (Dabolim)">✈️ Goa Airport (Dabolim)</option>
                                    <option value="Goa Airport (Mopa)">✈️ Goa Airport (Mopa / GOX)</option>
                                    <option value="Madgaon Railway Station">🚆 Madgaon Railway Station</option>
                                    <option value="Thivim Railway Station">🚆 Thivim Railway Station</option>
                                    <option value="Hotel">🏨 Hotel</option>
                                    <option value="Custom Address">📍 Custom Address</option>
                                  </select>
                                </div>
                                {driverPickupLoc === 'Custom Address' && (
                                  <div className="col-12 mt-1">
                                    <input
                                      type="text"
                                      className="form-control form-control-sm text-xs"
                                      placeholder="Enter full pickup address or landmark..."
                                      value={driverPickupCustomLoc}
                                      onChange={(e) => setDriverPickupCustomLoc(e.target.value)}
                                      required
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* ─── Choice 2: 🏁 Drop Service — ₹400 ─── */}
                          <div className="p-2.5 rounded-3 bg-white border border-warning border-opacity-40 shadow-xs">
                            <div className="form-check d-flex align-items-center justify-content-between mb-0">
                              <div className="d-flex align-items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="form-check-input mt-0"
                                  id="driver_service_drop"
                                  checked={driverDropEnabled}
                                  onChange={(e) => setDriverDropEnabled(e.target.checked)}
                                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <label className="form-check-label fw-bold text-dark mb-0 small" htmlFor="driver_service_drop" style={{ cursor: 'pointer' }}>
                                  🏁 Drop Service
                                </label>
                              </div>
                              <span className="badge bg-warning text-dark fw-bold px-2 py-1" style={{ fontSize: '0.72rem' }}>
                                ₹400
                              </span>
                            </div>

                            {driverDropEnabled && (
                              <div className="row g-2 mt-2 pt-2 border-top border-light animate-fade-in">
                                <div className="col-sm-4">
                                  <label className="form-label text-muted text-xxs fw-bold mb-1">Drop Date</label>
                                  <input
                                    type="date"
                                    className="form-control form-control-sm text-xs"
                                    min={getTodayDateStr()}
                                    value={driverDropDate || modalDropDate || getTodayDateStr()}
                                    onChange={(e) => setDriverDropDate(e.target.value)}
                                    required={driverDropEnabled}
                                  />
                                </div>
                                <div className="col-sm-4">
                                  <label className="form-label text-muted text-xxs fw-bold mb-1">Drop Time</label>
                                  <select
                                    className="form-select form-select-sm text-xs"
                                    value={driverDropTime}
                                    onChange={(e) => setDriverDropTime(e.target.value)}
                                  >
                                    {['06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM'].map(t => (
                                      <option key={t} value={t}>{t}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="col-sm-4">
                                  <label className="form-label text-muted text-xxs fw-bold mb-1">Drop Location</label>
                                  <select
                                    className="form-select form-select-sm text-xs"
                                    value={driverDropLoc}
                                    onChange={(e) => setDriverDropLoc(e.target.value)}
                                  >
                                    <option value="Goa Airport (Dabolim)">✈️ Goa Airport (Dabolim)</option>
                                    <option value="Goa Airport (Mopa)">✈️ Goa Airport (Mopa / GOX)</option>
                                    <option value="Madgaon Railway Station">🚆 Madgaon Railway Station</option>
                                    <option value="Thivim Railway Station">🚆 Thivim Railway Station</option>
                                    <option value="Hotel">🏨 Hotel</option>
                                    <option value="North Goa">🏖️ North Goa</option>
                                    <option value="South Goa">🏖️ South Goa</option>
                                    <option value="Custom Address">📍 Custom Address</option>
                                  </select>
                                </div>
                                {driverDropLoc === 'Custom Address' && (
                                  <div className="col-12 mt-1">
                                    <input
                                      type="text"
                                      className="form-control form-control-sm text-xs"
                                      placeholder="Enter full drop-off address or landmark..."
                                      value={driverDropCustomLoc}
                                      onChange={(e) => setDriverDropCustomLoc(e.target.value)}
                                      required
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* ─── Choice 3: 👨‍✈️ Full-Day Driver — ₹800/day ─── */}
                          <div className="p-2.5 rounded-3 bg-white border border-warning border-opacity-40 shadow-xs">
                            <div className="form-check d-flex align-items-center justify-content-between mb-0">
                              <div className="d-flex align-items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="form-check-input mt-0"
                                  id="driver_service_fullday"
                                  checked={driverFullDayEnabled}
                                  onChange={(e) => setDriverFullDayEnabled(e.target.checked)}
                                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <label className="form-check-label fw-bold text-dark mb-0 small" htmlFor="driver_service_fullday" style={{ cursor: 'pointer' }}>
                                  👨‍✈️ Full-Day Driver
                                </label>
                              </div>
                              <span className="badge bg-warning text-dark fw-bold px-2 py-1" style={{ fontSize: '0.72rem' }}>
                                ₹800 / day
                              </span>
                            </div>

                            <div className="text-muted text-xxs mt-1 ps-4" style={{ fontSize: '0.7rem' }}>
                              ⏰ 09:00 AM – 07:00 PM (8–10 Hours Local Daily Duty)
                            </div>

                            {driverFullDayEnabled && (
                              <div className="row g-2 mt-2 pt-2 border-top border-light animate-fade-in">
                                <div className="col-sm-6">
                                  <label className="form-label text-muted text-xxs fw-bold mb-1">Driver Start Date</label>
                                  <input
                                    type="date"
                                    className="form-control form-control-sm text-xs"
                                    min={getTodayDateStr()}
                                    value={driverFullDayStart || modalPickupDate || getTodayDateStr()}
                                    onChange={(e) => {
                                      const newStart = e.target.value;
                                      setDriverFullDayStart(newStart);
                                      if (driverFullDayEnd && driverFullDayEnd < newStart) {
                                        setDriverFullDayEnd(newStart);
                                      }
                                    }}
                                    required={driverFullDayEnabled}
                                  />
                                </div>

                                <div className="col-sm-6">
                                  <label className="form-label text-muted text-xxs fw-bold mb-1">Driver End Date</label>
                                  <input
                                    type="date"
                                    className="form-control form-control-sm text-xs"
                                    min={driverFullDayStart || getTodayDateStr()}
                                    value={driverFullDayEnd || modalDropDate || getTodayDateStr()}
                                    onChange={(e) => setDriverFullDayEnd(e.target.value)}
                                    required={driverFullDayEnabled}
                                  />
                                </div>

                                <div className="col-sm-6">
                                  <label className="form-label text-muted text-xxs fw-bold mb-1">Pickup / Start Location</label>
                                  <select
                                    className="form-select form-select-sm text-xs"
                                    value={driverFullDayStartLoc}
                                    onChange={(e) => setDriverFullDayStartLoc(e.target.value)}
                                  >
                                    <option value="Hotel">🏨 Hotel</option>
                                    <option value="Goa Airport (Dabolim)">✈️ Goa Airport (Dabolim)</option>
                                    <option value="Goa Airport (Mopa)">✈️ Goa Airport (Mopa / GOX)</option>
                                    <option value="North Goa (Calangute / Baga / Anjuna)">🏖️ North Goa (Calangute / Baga / Anjuna)</option>
                                    <option value="South Goa (Margao / Colva)">🏖️ South Goa (Margao / Colva)</option>
                                    <option value="Custom Address">📍 Custom Address</option>
                                  </select>
                                  {driverFullDayStartLoc === 'Custom Address' && (
                                    <input
                                      type="text"
                                      className="form-control form-control-sm text-xs mt-1"
                                      placeholder="Enter start location..."
                                      value={driverFullDayCustomStartLoc}
                                      onChange={(e) => setDriverFullDayCustomStartLoc(e.target.value)}
                                      required
                                    />
                                  )}
                                </div>

                                <div className="col-sm-6">
                                  <label className="form-label text-muted text-xxs fw-bold mb-1">Drop / End Location</label>
                                  <select
                                    className="form-select form-select-sm text-xs"
                                    value={driverFullDayEndLoc}
                                    onChange={(e) => setDriverFullDayEndLoc(e.target.value)}
                                  >
                                    <option value="Hotel">🏨 Hotel</option>
                                    <option value="Goa Airport (Dabolim)">✈️ Goa Airport (Dabolim)</option>
                                    <option value="Goa Airport (Mopa)">✈️ Goa Airport (Mopa / GOX)</option>
                                    <option value="North Goa (Calangute / Baga / Anjuna)">🏖️ North Goa (Calangute / Baga / Anjuna)</option>
                                    <option value="South Goa (Margao / Colva)">🏖️ South Goa (Margao / Colva)</option>
                                    <option value="Custom Address">📍 Custom Address</option>
                                  </select>
                                  {driverFullDayEndLoc === 'Custom Address' && (
                                    <input
                                      type="text"
                                      className="form-control form-control-sm text-xs mt-1"
                                      placeholder="Enter end location..."
                                      value={driverFullDayCustomEndLoc}
                                      onChange={(e) => setDriverFullDayCustomEndLoc(e.target.value)}
                                      required
                                    />
                                  )}
                                </div>

                                <div className="col-12">
                                  <div className="p-2 rounded bg-light border text-xxs text-dark d-flex align-items-center justify-content-between">
                                    <span>Total Driver Days: <strong>{driverFullDayDaysCount} {driverFullDayDaysCount === 1 ? 'day' : 'days'}</strong></span>
                                    <span className="fw-black text-warning">₹{(800 * driverFullDayDaysCount).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* ─── Bottom Driver Total Display ─── */}
                          <div className="d-flex align-items-center justify-content-between pt-2 border-top border-warning border-opacity-40">
                            <span className="text-dark fw-bold text-xs">Driver Service Total:</span>
                            <span className="fs-6 fw-black text-dark font-heading">₹{driverTotalCharge.toLocaleString()}</span>
                          </div>

                        </div>
                      )}
                    </div>
                  )}

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

                      {driverRequired && driverTotalCharge > 0 && (
                        <div className="p-2 rounded mb-2" style={{ background: '#fffbeb', border: '1px solid #fef3c7', fontSize: '11px' }}>
                          <div className="fw-bold text-dark mb-1 d-flex justify-content-between">
                            <span>Private Driver Services:</span>
                            <span className="text-warning fw-black">₹{driverTotalCharge.toLocaleString()}</span>
                          </div>
                          {driverPickupEnabled && (
                            <div className="d-flex justify-content-between text-muted text-xxs mb-0.5">
                              <span>• Driver Pickup ({driverPickupDate || modalPickupDate} • {driverPickupTime}):</span>
                              <span className="fw-bold text-dark">₹400</span>
                            </div>
                          )}
                          {driverFullDayEnabled && (
                            <div className="d-flex justify-content-between text-muted text-xxs mb-0.5">
                              <span>• Full-Day Driver ({driverFullDayDaysCount} {driverFullDayDaysCount === 1 ? 'day' : 'days'}):</span>
                              <span className="fw-bold text-dark">₹{driverFullDayCost.toLocaleString()}</span>
                            </div>
                          )}
                          {driverDropEnabled && (
                            <div className="d-flex justify-content-between text-muted text-xxs mb-0.5">
                              <span>• Driver Drop ({driverDropDate || modalDropDate} • {driverDropTime}):</span>
                              <span className="fw-bold text-dark">₹400</span>
                            </div>
                          )}
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
                                id="useWalletCashback"
                                checked={useWalletCashback}
                                onChange={(e) => setUseWalletCashback(e.target.checked)}
                                style={{ cursor: 'pointer' }}
                              />
                              <label className="form-check-label text-xs fw-bold text-success" htmlFor="useWalletCashback">
                                Use ₹{Math.min(walletBalance, total).toLocaleString('en-IN')}
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
                        <span>Final Amount Payable:</span>
                        <span>₹{finalPayable.toLocaleString('en-IN')}</span>
                      </div>

                      {/* 10% Cashback Earning Preview */}
                      <div className="mt-2.5 p-2 rounded-3 text-center" style={{ background: '#fef3c7', border: '1px solid #fde68a' }}>
                        <div className="text-xs fw-bold text-dark d-flex align-items-center justify-content-center gap-1">
                          <Gift size={13} className="text-warning" />
                          <span>10% Cashback You Will Earn: <strong className="text-success font-heading">₹{projectedCashback.toLocaleString('en-IN')}</strong></span>
                        </div>
                        <div className="text-muted text-xxs mt-0.5">
                          Credited to your wallet on booking completion • Valid 30 days
                        </div>
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
