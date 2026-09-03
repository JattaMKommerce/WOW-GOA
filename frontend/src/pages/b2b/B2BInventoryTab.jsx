import React, { useState, useEffect, useMemo } from 'react';
import { 
  Hotel, Car, Compass, Plane, Wand2, Search, Filter, Gift, Tag, Check, Star, 
  Users, Calendar, Sparkles, MapPin, ArrowRight, ShieldCheck, Clock, 
  Eye, CheckCircle2, AlertCircle, X, Shield, PlaneTakeoff, PlaneLanding,
  CreditCard, Fuel, Gauge, Award, FileText, Wallet
} from 'lucide-react';
import * as api from '../../services/api';
import B2BSelfDriveFlow from './B2BSelfDriveFlow';

export default function B2BInventoryTab({
  mode = 'COMMISSION', // 'COMMISSION' or 'NON_COMMISSION' (passed strictly from database-approved portal state)
  partnerUser,
  initialService = 'selfdrive',
  onInitiateBooking
}) {
  const [activeService, setActiveService] = useState(initialService);
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected item for rich details modal
  const [detailItem, setDetailItem] = useState(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => new Date(Date.now() + 86400000).toISOString().split('T')[0], []);
  const dayAfterTomorrowStr = useMemo(() => new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], []);

  // Selected item for booking modal
  const [bookingItem, setBookingItem] = useState(null);
  const [guestDetails, setGuestDetails] = useState({
    name: '',
    phone: '',
    email: '',
    checkInDate: tomorrowStr,
    checkOutDate: dayAfterTomorrowStr,
    date: tomorrowStr,
    rooms: 1,
    guests: 2,
    daysOrQty: 1,
    special_requests: '',
    payment_method: 'Prepaid Agent Wallet'
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(null);

  const calculateHotelNights = () => {
    try {
      const inD = new Date(guestDetails.checkInDate || tomorrowStr);
      const outD = new Date(guestDetails.checkOutDate || dayAfterTomorrowStr);
      const diffTime = outD.getTime() - inD.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
      return Math.max(1, diffDays);
    } catch {
      return 1;
    }
  };

  // Commission and Net discount rate from partner profile or default
  const commRate = parseFloat(partnerUser?.default_commission_rate || 10.00);
  const netDiscountRate = parseFloat(partnerUser?.default_net_discount_rate || 10.00);

  useEffect(() => {
    if (initialService) {
      setActiveService(initialService);
    }
  }, [initialService]);

  // Load Inventory for non-selfdrive services
  useEffect(() => {
    if (activeService === 'selfdrive') {
      setItems([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const loadInventory = async () => {
      setLoading(true);
      try {
        let resData = [];
        if (activeService === 'hotels') {
          resData = await api.fetchHotels();
        } else if (activeService === 'packages' || activeService === 'trips') {
          resData = await api.fetchPackages();
        } else if (activeService === 'flights') {
          resData = await api.fetchFlights();
        } else if (activeService === 'craft') {
          // Packages with custom flag or all packages as custom template
          const pkgs = await api.fetchPackages();
          resData = Array.isArray(pkgs) ? pkgs.map(p => ({ ...p, is_custom: true })) : [];
        }
        if (isMounted) {
          setItems(Array.isArray(resData) ? resData : []);
        }
      } catch (err) {
        if (isMounted) setItems([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInventory();
    return () => { isMounted = false; };
  }, [activeService]);

  // Calculate pricing for an inventory item
  const getItemPricing = (item) => {
    let rawPrice = 0;
    if (activeService === 'hotels') {
      rawPrice = parseFloat(item.price_per_night || item.price || 3000);
    } else if (activeService === 'packages' || activeService === 'craft') {
      rawPrice = parseFloat(item.price_discounted || item.price || 5000);
    } else if (activeService === 'flights') {
      rawPrice = parseFloat(item.price || item.total_amount || 4500);
    } else {
      rawPrice = parseFloat(item.price || 2500);
    }

    const sellingPrice = Math.round(rawPrice);

    if (mode === 'COMMISSION') {
      const commAmount = Math.round(sellingPrice * (commRate / 100));
      const netPayable = sellingPrice - commAmount;
      return {
        sellingPrice,
        commPercent: commRate,
        commAmount,
        netPayable,
        finalPayable: sellingPrice,
        mode: 'COMMISSION'
      };
    } else {
      // NON_COMMISSION
      const discountAmount = Math.round(sellingPrice * (netDiscountRate / 100));
      const netPrice = sellingPrice - discountAmount;
      return {
        sellingPrice,
        netDiscountPercent: netDiscountRate,
        discountAmount,
        netPrice,
        finalPayable: netPrice,
        mode: 'NON_COMMISSION'
      };
    }
  };

  // Open booking modal
  const handleOpenBooking = (item) => {
    setBookingItem(item);
    setBookingError('');
    setBookingSuccess(null);
    setGuestDetails({
      name: '',
      phone: '',
      email: '',
      checkInDate: tomorrowStr,
      checkOutDate: dayAfterTomorrowStr,
      date: tomorrowStr,
      rooms: 1,
      guests: 2,
      daysOrQty: 1,
      special_requests: '',
      payment_method: 'Prepaid Agent Wallet'
    });
  };

  // Submit Booking
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!guestDetails.name.trim() || !guestDetails.phone.trim()) {
      setBookingError('Primary guest name and contact phone are required.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    const pr = getItemPricing(bookingItem);
    const isHotel = activeService === 'hotels';
    const nights = isHotel ? calculateHotelNights() : (parseInt(guestDetails.daysOrQty) || 1);
    const rooms = isHotel ? (parseInt(guestDetails.rooms) || 1) : 1;
    const qty = isHotel ? (nights * rooms) : (parseInt(guestDetails.daysOrQty) || 1);
    const serviceType = isHotel ? 'hotel' : (activeService === 'flights' ? 'flight' : 'package');

    const totalSelling = pr.sellingPrice * qty;

    const payload = {
      b2b_partner_id: partnerUser?.id,
      b2b_mode: mode,
      service_type: serviceType,
      item_id: bookingItem.id,
      item_name: bookingItem.name || bookingItem.title || 'WOW Goa Service',
      days: nights,
      qty: qty,
      pickup_date: isHotel ? guestDetails.checkInDate : guestDetails.date,
      drop_date: isHotel ? guestDetails.checkOutDate : undefined,
      guest_name: guestDetails.name,
      guest_phone: guestDetails.phone,
      guest_email: guestDetails.email,
      payment_method: guestDetails.payment_method,
      extra_details: {
        total_amount: totalSelling,
        special_requests: guestDetails.special_requests,
        room_price: isHotel ? pr.sellingPrice : undefined,
        rooms: isHotel ? rooms : undefined,
        nights: isHotel ? nights : undefined,
        airline: activeService === 'flights' ? (bookingItem.airline || 'Airline') : undefined
      }
    };

    try {
      const res = await api.b2bBook(payload);
      if (res && res.success) {
        setBookingSuccess(res);
      } else {
        setBookingError(res.error || 'Failed to submit booking.');
      }
    } catch (err) {
      setBookingError(err.message || 'Error creating booking.');
    } finally {
      setBookingLoading(false);
    }
  };

  const filteredItems = items.filter(it => {
    const nameMatch = (it.name || it.title || it.airline || '').toLowerCase().includes(searchQuery.toLowerCase());
    const locMatch = (it.location || it.area || it.destination || it.from_city || it.to_city || '').toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || locMatch;
  });

  return (
    <div className="animate-fade-in">
      {/* Top Banner with Active Mode and Services Bar */}
      <div className="card border-0 shadow-sm rounded-4 p-3.5 mb-4 bg-white">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          {/* Mode Pill (Strictly based on DB approval) */}
          <div className="d-flex align-items-center gap-2">
            <div 
              className="px-3 py-1.5 rounded-pill text-xs fw-bold d-flex align-items-center gap-2"
              style={mode === 'COMMISSION' 
                ? { background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }
                : { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }
              }
            >
              {mode === 'COMMISSION' ? (
                <>
                  <Gift size={15} />
                  <span>COMMISSION MODE: {commRate}% AGENT COMMISSION</span>
                </>
              ) : (
                <>
                  <Tag size={15} />
                  <span>NON-COMMISSION MODE: {netDiscountRate}% NET WHOLESALE B2B</span>
                </>
              )}
            </div>
            <span className="badge bg-light text-secondary border text-xxs d-none d-md-inline-block px-2.5 py-1 rounded-pill">
              Admin Approved Active Mode
            </span>
          </div>

          {/* ALL 5 MAIN WEBSITE SERVICE TABS */}
          <div className="d-flex gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveService('selfdrive')}
              className={`btn btn-sm rounded-pill px-3 py-1.5 text-xs fw-semibold d-flex align-items-center gap-1.5 transition-all ${
                activeService === 'selfdrive' ? 'btn-dark text-white shadow-sm' : 'btn-outline-secondary'
              }`}
            >
              <Car size={14} />
              <span>Self Drive Holidays</span>
            </button>
            <button
              onClick={() => setActiveService('packages')}
              className={`btn btn-sm rounded-pill px-3 py-1.5 text-xs fw-semibold d-flex align-items-center gap-1.5 transition-all ${
                activeService === 'packages' ? 'btn-dark text-white shadow-sm' : 'btn-outline-secondary'
              }`}
            >
              <Compass size={14} />
              <span>Trip Packages</span>
            </button>
            <button
              onClick={() => setActiveService('hotels')}
              className={`btn btn-sm rounded-pill px-3 py-1.5 text-xs fw-semibold d-flex align-items-center gap-1.5 transition-all ${
                activeService === 'hotels' ? 'btn-dark text-white shadow-sm' : 'btn-outline-secondary'
              }`}
            >
              <Hotel size={14} />
              <span>Hotels & Resorts</span>
            </button>
            <button
              onClick={() => setActiveService('flights')}
              className={`btn btn-sm rounded-pill px-3 py-1.5 text-xs fw-semibold d-flex align-items-center gap-1.5 transition-all ${
                activeService === 'flights' ? 'btn-dark text-white shadow-sm' : 'btn-outline-secondary'
              }`}
            >
              <Plane size={14} />
              <span>Flights</span>
            </button>
            <button
              onClick={() => setActiveService('craft')}
              className={`btn btn-sm rounded-pill px-3 py-1.5 text-xs fw-semibold d-flex align-items-center gap-1.5 transition-all ${
                activeService === 'craft' ? 'btn-dark text-white shadow-sm' : 'btn-outline-secondary'
              }`}
            >
              <Wand2 size={14} />
              <span>Craft My Trip</span>
            </button>
          </div>
        </div>

        {/* Search Bar for listed services */}
        {activeService !== 'selfdrive' && (
          <div className="mt-3 pt-3 border-top">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <Search size={15} />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder={`Search ${activeService} by name, location, destination...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="btn btn-outline-secondary" type="button" onClick={() => setSearchQuery('')}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Render Service Body */}
      {activeService === 'selfdrive' ? (
        <B2BSelfDriveFlow 
          partner={partnerUser} 
          activeMode={mode} 
          onBookingSuccess={(res) => {
            if (onInitiateBooking) onInitiateBooking(res);
          }}
        />
      ) : loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading inventory...</span>
          </div>
          <p className="text-muted text-xs mt-2">Connecting to single shared WOW GOA inventory...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center text-muted bg-white">
          <Sparkles size={36} className="mx-auto text-muted opacity-50 mb-2" />
          <h6 className="fw-bold text-dark">No inventory items found</h6>
          <p className="text-xs mb-0">No records matching your search query in this category.</p>
        </div>
      ) : (
        <div className="row g-3">
          {filteredItems.map((item) => {
            const pricing = getItemPricing(item);
            const title = item.name || item.title || (item.airline ? `${item.airline} Flight (${item.flight_number || ''})` : 'Service Item');
            const image = item.image || item.thumbnail || (item.gallery && item.gallery[0]) || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80';
            const location = item.location || item.city || item.destination || (item.from_city && item.to_city ? `${item.from_city} → ${item.to_city}` : 'Goa, India');

            return (
              <div key={item.id} className="col-12 col-md-6 col-xl-4">
                <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden d-flex flex-column transition-all hover-shadow-lg bg-white">
                  {/* Item Image */}
                  <div className="position-relative" style={{ height: '190px', background: '#F8F9FA' }}>
                    <img 
                      src={image} 
                      alt={title}
                      className="w-100 h-100 object-fit-cover"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80'; }}
                    />
                    <div className="position-absolute top-0 start-0 m-2.5 d-flex gap-1.5 flex-wrap">
                      <span className="badge bg-dark bg-opacity-75 backdrop-blur text-white text-xxs px-2 py-1 rounded-pill">
                        {activeService.toUpperCase()}
                      </span>
                      {item.tag && (
                        <span className="badge bg-warning text-dark text-xxs px-2 py-1 rounded-pill fw-bold">
                          {item.tag}
                        </span>
                      )}
                      {item.star_rating && (
                        <span className="badge bg-dark bg-opacity-75 text-warning text-xxs px-2 py-1 rounded-pill d-flex align-items-center gap-1">
                          <Star size={10} fill="#FFC107" /> {item.star_rating}★
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-3.5 flex-grow-1 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex align-items-start justify-content-between mb-1">
                        <h6 className="fw-bold text-dark font-heading mb-0 text-sm text-truncate pe-1">{title}</h6>
                      </div>

                      <div className="d-flex align-items-center gap-1 text-xxs text-muted mb-2">
                        <MapPin size={11} className="text-warning flex-shrink-0" />
                        <span className="text-truncate">{location}</span>
                        {item.duration && (
                          <>
                            <span>•</span>
                            <span className="d-flex align-items-center gap-1">
                              <Clock size={11} /> {item.duration}
                            </span>
                          </>
                        )}
                      </div>

                      <p className="text-muted text-xxs line-clamp-2 mb-2 leading-relaxed">
                        {item.description || item.short_desc || 'Rich inventory item with shared D2C/B2B database availability.'}
                      </p>

                      {/* Amenities or Highlights pill */}
                      {item.amenities && (
                        <div className="d-flex gap-1 flex-wrap mb-2">
                          {(typeof item.amenities === 'string' ? item.amenities.split(',') : item.amenities).slice(0, 3).map((am, i) => (
                            <span key={i} className="badge bg-light text-muted border text-xxs py-0.5 px-1.5 font-monospace">
                              {typeof am === 'string' ? am.trim() : am}
                            </span>
                          ))}
                        </div>
                      )}
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
                            <span className="text-xxs fw-semibold">Agent Commission ({pricing.commPercent}%):</span>
                            <span className="text-xs fw-bold">+₹{pricing.commAmount.toLocaleString()}</span>
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

                      {/* Action Buttons: View Details & Book for Guest */}
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailItem(item)}
                          className="btn btn-outline-secondary btn-sm rounded-pill text-xxs px-2.5 py-1.5 d-flex align-items-center gap-1"
                        >
                          <Eye size={13} /> Details
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenBooking(item)}
                          className={`btn flex-grow-1 btn-sm rounded-pill fw-bold py-1.5 d-flex align-items-center justify-content-center gap-1.5 ${
                            mode === 'COMMISSION' ? 'btn-warning text-dark' : 'btn-primary text-white'
                          }`}
                        >
                          <span>Book for Guest</span>
                          <ArrowRight size={14} />
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

      {/* RICH DETAILS MODAL (Preserves all details without simplified cards) */}
      {detailItem && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ background: 'rgba(13, 27, 46, 0.75)', zIndex: 1050, backdropFilter: 'blur(4px)' }}
        >
          <div 
            className="card border-0 shadow-2xl rounded-4 overflow-hidden animate-fade-in"
            style={{ maxWidth: '680px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: '#ffffff' }}
          >
            <div className="p-3.5 text-white d-flex align-items-center justify-content-between" style={{ background: '#0D1B2E' }}>
              <div>
                <span className="badge bg-warning text-dark text-xxs fw-bold px-2 py-0.5 rounded-pill mb-1">
                  FULL INVENTORY SPECIFICATION
                </span>
                <h5 className="fw-bold mb-0 text-white font-heading">
                  {detailItem.name || detailItem.title || 'Service Details'}
                </h5>
              </div>
              <button 
                className="btn btn-link text-white-50 p-0 border-0" 
                onClick={() => setDetailItem(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-grow-1">
              <div className="position-relative rounded-3 overflow-hidden mb-3" style={{ height: '220px' }}>
                <img 
                  src={detailItem.image || (detailItem.gallery && detailItem.gallery[0]) || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80'} 
                  alt="" 
                  className="w-100 h-100 object-fit-cover"
                />
              </div>

              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2">
                  <MapPin size={15} className="text-warning" />
                  <span className="text-xs fw-semibold text-dark">
                    {detailItem.location || detailItem.address || detailItem.city || 'Goa, India'}
                  </span>
                </div>
                {detailItem.duration && (
                  <span className="badge bg-light text-dark border text-xs">
                    ⏱️ Duration: {detailItem.duration}
                  </span>
                )}
              </div>

              {/* Descriptions */}
              <h6 className="fw-bold text-dark text-xs text-uppercase mb-1.5 font-heading">Overview</h6>
              <p className="text-muted text-xs leading-relaxed mb-3">
                {detailItem.description || detailItem.detailed_description || 'Full experience managed and serviced under WOW GOA premium standards.'}
              </p>

              {/* Day-wise itinerary for packages */}
              {detailItem.day_wise_itinerary && (
                <div className="mb-3">
                  <h6 className="fw-bold text-dark text-xs text-uppercase mb-2 font-heading">Day-Wise Itinerary</h6>
                  <div className="p-3 rounded-3 bg-light border text-xs">
                    {typeof detailItem.day_wise_itinerary === 'string' ? detailItem.day_wise_itinerary : JSON.stringify(detailItem.day_wise_itinerary)}
                  </div>
                </div>
              )}

              {/* Inclusions & Exclusions */}
              {(detailItem.inclusions || detailItem.exclusions) && (
                <div className="row g-2 mb-3">
                  {detailItem.inclusions && (
                    <div className="col-12 col-md-6">
                      <div className="p-2.5 rounded-3 bg-success bg-opacity-10 border border-success border-opacity-25 text-xxs">
                        <strong className="text-success d-block mb-1">Inclusions:</strong>
                        <span className="text-dark">{detailItem.inclusions}</span>
                      </div>
                    </div>
                  )}
                  {detailItem.exclusions && (
                    <div className="col-12 col-md-6">
                      <div className="p-2.5 rounded-3 bg-danger bg-opacity-10 border border-danger border-opacity-25 text-xxs">
                        <strong className="text-danger d-block mb-1">Exclusions:</strong>
                        <span className="text-dark">{detailItem.exclusions}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Amenities */}
              {detailItem.amenities && (
                <div className="mb-3">
                  <h6 className="fw-bold text-dark text-xs text-uppercase mb-1.5 font-heading">Amenities & Features</h6>
                  <div className="d-flex gap-1.5 flex-wrap">
                    {(typeof detailItem.amenities === 'string' ? detailItem.amenities.split(',') : detailItem.amenities).map((am, i) => (
                      <span key={i} className="badge bg-light text-dark border text-xxs py-1 px-2">
                        ✓ {typeof am === 'string' ? am.trim() : am}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer with Pricing */}
            <div className="p-3 border-top bg-light d-flex align-items-center justify-content-between">
              <div>
                {(() => {
                  const pr = getItemPricing(detailItem);
                  return mode === 'COMMISSION' ? (
                    <div>
                      <span className="text-xxs text-muted d-block">Retail: ₹{pr.sellingPrice.toLocaleString()}</span>
                      <strong className="text-success text-xs">Commission ({pr.commPercent}%): +₹{pr.commAmount.toLocaleString()}</strong>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xxs text-muted d-block">Retail: <del>₹{pr.sellingPrice.toLocaleString()}</del></span>
                      <strong className="text-primary text-xs">B2B Net Rate: ₹{pr.netPrice.toLocaleString()}</strong>
                    </div>
                  );
                })()}
              </div>

              <div className="d-flex gap-2">
                <button 
                  className="btn btn-outline-secondary btn-sm rounded-pill px-3 text-xs" 
                  onClick={() => setDetailItem(null)}
                >
                  Close
                </button>
                <button
                  className={`btn btn-sm rounded-pill px-4 fw-bold text-xs ${
                    mode === 'COMMISSION' ? 'btn-warning text-dark' : 'btn-primary text-white'
                  }`}
                  onClick={() => {
                    const it = detailItem;
                    setDetailItem(null);
                    handleOpenBooking(it);
                  }}
                >
                  Book This Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOOKING MODAL */}
      {bookingItem && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ background: 'rgba(13, 27, 46, 0.75)', zIndex: 1050, backdropFilter: 'blur(4px)' }}
        >
          <div 
            className="card border-0 shadow-2xl rounded-4 overflow-hidden animate-fade-in"
            style={{ maxWidth: '680px', width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: '#ffffff' }}
          >
            <div className="p-3.5 text-white d-flex align-items-center justify-content-between" style={{ background: '#0D1B2E' }}>
              <div>
                <span className="badge bg-warning text-dark text-xxs fw-bold px-2 py-0.5 rounded-pill mb-1">
                  CONFIRM B2B RESERVATION
                </span>
                <h5 className="fw-bold mb-0 text-white font-heading">
                  {bookingItem.name || bookingItem.title || 'Selected Service'}
                </h5>
              </div>
              <button 
                className="btn btn-link text-white-50 p-0 border-0" 
                onClick={() => setBookingItem(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-grow-1" style={{ background: '#F8F9FA' }}>
              {bookingSuccess ? (
                <div className="text-center py-4">
                  <div className="rounded-circle p-3 bg-success bg-opacity-20 text-success d-inline-flex mb-3">
                    <CheckCircle2 size={42} />
                  </div>
                  <h4 className="fw-bold text-dark font-heading mb-1">Booking Confirmed!</h4>
                  <p className="text-muted text-xs mb-3">
                    Booking Reference ID: <strong>#{bookingSuccess.booking_id}</strong>
                  </p>
                  <p className="text-xs text-muted">
                    Confirmation vouchers and notifications have been recorded.
                  </p>
                  <button
                    className="btn btn-dark btn-sm rounded-pill px-4 mt-2"
                    onClick={() => {
                      setBookingItem(null);
                      setBookingSuccess(null);
                    }}
                  >
                    Done & Return
                  </button>
                </div>
              ) : (
                <form onSubmit={handleConfirmBooking}>
                  {bookingError && (
                    <div className="alert alert-danger py-2 px-3 rounded-3 text-xs mb-3 d-flex align-items-center gap-2">
                      <AlertCircle size={15} className="flex-shrink-0" />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  <div className="row g-2.5 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label text-xxs fw-bold text-muted mb-1">Primary Guest Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Suman Sen"
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
                        placeholder="10-digit mobile"
                        value={guestDetails.phone}
                        onChange={(e) => setGuestDetails(prev => ({ ...prev, phone: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label text-xxs fw-bold text-muted mb-1">Guest Email</label>
                      <input
                        type="email"
                        className="form-control form-control-sm"
                        placeholder="guest@domain.com"
                        value={guestDetails.email}
                        onChange={(e) => setGuestDetails(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label text-xxs fw-bold text-muted mb-1">Payment Method</label>
                      <select
                        className="form-select form-select-sm"
                        value={guestDetails.payment_method}
                        onChange={(e) => setGuestDetails(prev => ({ ...prev, payment_method: e.target.value }))}
                      >
                        <option value="B2B Account / Cash">B2B Account / Cash</option>
                        <option value="Bank Transfer">Bank Transfer / NEFT</option>
                        <option value="UPI Payment">UPI Payment</option>
                        <option value="Credit Balance">Partner Credit Balance</option>
                      </select>
                    </div>
                  </div>

                  {/* DEDICATED DATE & CAPACITY SECTION (No calendar overlap, strict min=today) */}
                  {activeService === 'hotels' ? (
                    <div className="p-3 rounded-3 bg-white border mb-3 shadow-xs">
                      <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                        <span className="text-xxs fw-bold text-dark text-uppercase d-flex align-items-center gap-1.5 font-heading">
                          <Calendar size={14} className="text-warning" /> Hotel Stay Dates & Capacity
                        </span>
                        <span className="badge bg-dark text-white text-xxs px-2.5 py-1 rounded-pill">
                          {calculateHotelNights()} Night{calculateHotelNights() > 1 ? 's' : ''} • {guestDetails.rooms || 1} Room{(guestDetails.rooms || 1) > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="row g-2 mb-2">
                        <div className="col-12 col-sm-6">
                          <label className="form-label text-xxs fw-bold text-muted mb-1">Check-in Date *</label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            min={todayStr}
                            value={guestDetails.checkInDate}
                            onChange={(e) => {
                              const newIn = e.target.value;
                              setGuestDetails(prev => {
                                const nextDay = new Date(new Date(newIn).getTime() + 86400000).toISOString().split('T')[0];
                                const newOut = (!prev.checkOutDate || prev.checkOutDate <= newIn) ? nextDay : prev.checkOutDate;
                                return { ...prev, checkInDate: newIn, checkOutDate: newOut };
                              });
                            }}
                            required
                          />
                        </div>

                        <div className="col-12 col-sm-6">
                          <label className="form-label text-xxs fw-bold text-muted mb-1">Check-out Date *</label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            min={guestDetails.checkInDate || todayStr}
                            value={guestDetails.checkOutDate}
                            onChange={(e) => setGuestDetails(prev => ({ ...prev, checkOutDate: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      {/* Quick Check-in Jump */}
                      <div className="d-flex align-items-center gap-1.5 flex-wrap mb-2">
                        <span className="text-3xs text-muted fw-semibold">Check-in Jump:</span>
                        {[
                          { label: 'Tomorrow', offset: 1 },
                          { label: 'Next Weekend', offset: 5 },
                          { label: 'After 1 Month', offset: 30 },
                          { label: 'After 2 Months', offset: 60 }
                        ].map(preset => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              const s = new Date(Date.now() + preset.offset * 86400000);
                              const e = new Date(s.getTime() + 2 * 86400000);
                              setGuestDetails(prev => ({
                                ...prev,
                                checkInDate: s.toISOString().split('T')[0],
                                checkOutDate: e.toISOString().split('T')[0]
                              }));
                            }}
                            className="btn btn-xs py-0.5 px-2 rounded-pill border text-3xs btn-light text-muted bg-light"
                          >
                            📅 {preset.label}
                          </button>
                        ))}
                      </div>

                      {/* Quick Stay Duration Presets (1-click date setting without browser calendar hassle) */}
                      <div className="d-flex align-items-center gap-1.5 flex-wrap mb-2.5">
                        <span className="text-3xs text-muted fw-semibold">Quick Duration:</span>
                        {[
                          { label: '1 Night', days: 1 },
                          { label: '2 Nights', days: 2 },
                          { label: '3 Nights', days: 3 },
                          { label: '5 Nights', days: 5 },
                          { label: '7 Nights', days: 7 }
                        ].map(preset => (
                          <button
                            key={preset.days}
                            type="button"
                            onClick={() => {
                              const inDate = guestDetails.checkInDate || tomorrowStr;
                              const newOut = new Date(new Date(inDate).getTime() + preset.days * 86400000).toISOString().split('T')[0];
                              setGuestDetails(prev => ({ ...prev, checkInDate: inDate, checkOutDate: newOut }));
                            }}
                            className={`btn btn-xs py-0.5 px-2 rounded-pill border text-3xs fw-semibold ${
                              calculateHotelNights() === preset.days ? 'btn-dark text-white' : 'btn-light text-muted bg-light'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      <div className="row g-2">
                        <div className="col-6">
                          <label className="form-label text-xxs fw-bold text-muted mb-1">Rooms Count</label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            className="form-control form-control-sm"
                            value={guestDetails.rooms}
                            onChange={(e) => setGuestDetails(prev => ({ ...prev, rooms: parseInt(e.target.value) || 1 }))}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label text-xxs fw-bold text-muted mb-1">Guests Count</label>
                          <input
                            type="number"
                            min="1"
                            max="40"
                            className="form-control form-control-sm"
                            value={guestDetails.guests}
                            onChange={(e) => setGuestDetails(prev => ({ ...prev, guests: parseInt(e.target.value) || 1 }))}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-3 bg-white border mb-3 shadow-xs">
                      <div className="row g-2 mb-2">
                        <div className="col-12 col-sm-6">
                          <label className="form-label text-xxs fw-bold text-muted mb-1">Service / Travel Date *</label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            min={todayStr}
                            value={guestDetails.date}
                            onChange={(e) => setGuestDetails(prev => ({ ...prev, date: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="col-12 col-sm-6">
                          <label className="form-label text-xxs fw-bold text-muted mb-1">
                            {activeService === 'flights' ? 'Passengers Count' : 'Guests / Travelers Count'}
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            className="form-control form-control-sm"
                            value={guestDetails.daysOrQty}
                            onChange={(e) => setGuestDetails(prev => ({ ...prev, daysOrQty: e.target.value }))}
                          />
                        </div>
                      </div>

                      {/* Quick Date Presets */}
                      <div className="d-flex align-items-center gap-1.5 flex-wrap">
                        <span className="text-3xs text-muted fw-semibold">Quick Dates:</span>
                        {[
                          { label: 'Tomorrow', offset: 1 },
                          { label: 'In 3 Days', offset: 3 },
                          { label: 'Next Weekend', offset: 5 },
                          { label: 'After 1 Month', offset: 30 },
                          { label: 'After 2 Months', offset: 60 }
                        ].map(preset => (
                          <button
                            key={preset.offset}
                            type="button"
                            onClick={() => {
                              const d = new Date(Date.now() + preset.offset * 86400000).toISOString().split('T')[0];
                              setGuestDetails(prev => ({ ...prev, date: d }));
                            }}
                            className="btn btn-xs py-0.5 px-2 rounded-pill border text-3xs btn-light text-muted bg-light"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label text-xxs fw-bold text-muted mb-1">Special Notes / Instructions</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Add special instructions, arrival time, room preferences..."
                      value={guestDetails.special_requests}
                      onChange={(e) => setGuestDetails(prev => ({ ...prev, special_requests: e.target.value }))}
                    />
                  </div>

                  {/* Financial calculation breakdown */}
                  <div className="p-3 rounded-3 bg-white border mb-3">
                    <h6 className="fw-bold text-dark text-xxs text-uppercase mb-2 font-heading">
                      Financial Snapshot ({mode})
                    </h6>
                    {(() => {
                      const pr = getItemPricing(bookingItem);
                      const isHotel = activeService === 'hotels';
                      const nights = isHotel ? calculateHotelNights() : (parseInt(guestDetails.daysOrQty) || 1);
                      const rooms = isHotel ? (parseInt(guestDetails.rooms) || 1) : 1;
                      const qty = isHotel ? (nights * rooms) : (parseInt(guestDetails.daysOrQty) || 1);
                      const totalSelling = pr.sellingPrice * qty;
                      const totalComm = pr.commAmount * qty;
                      const totalNetPayable = pr.netPayable * qty;
                      const totalNetPrice = pr.netPrice * qty;
                      const totalDiscount = pr.discountAmount * qty;

                      return mode === 'COMMISSION' ? (
                        <div className="text-xs">
                          <div className="d-flex justify-content-between py-1 text-muted">
                            <span>
                              Selling Price {isHotel ? `(₹${pr.sellingPrice.toLocaleString()} × ${nights}N × ${rooms}R)` : `(×${qty})`}:
                            </span>
                            <span>₹{totalSelling.toLocaleString()}</span>
                          </div>
                          <div className="d-flex justify-content-between py-1 text-success fw-semibold">
                            <span>Agent Commission ({pr.commPercent}%):</span>
                            <span>+₹{totalComm.toLocaleString()}</span>
                          </div>
                          <div className="d-flex justify-content-between py-1.5 border-top fw-bold text-dark fs-6 mt-1">
                            <span>Payable to WOW Goa:</span>
                            <span>₹{totalNetPayable.toLocaleString()}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs">
                          <div className="d-flex justify-content-between py-1 text-muted">
                            <span>
                              Main Website Price {isHotel ? `(₹${pr.sellingPrice.toLocaleString()} × ${nights}N × ${rooms}R)` : `(×${qty})`}:
                            </span>
                            <span className="text-decoration-line-through">₹{totalSelling.toLocaleString()}</span>
                          </div>
                          <div className="d-flex justify-content-between py-1 text-primary fw-semibold">
                            <span>B2B Net Discount ({pr.netDiscountPercent}%):</span>
                            <span>-₹{totalDiscount.toLocaleString()}</span>
                          </div>
                          <div className="d-flex justify-content-between py-1.5 border-top fw-bold text-primary fs-6 mt-1">
                            <span>B2B Net Rate Payable:</span>
                            <span>₹{totalNetPrice.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Settlement Method */}
                  <div className="mb-3">
                    <label className="form-label text-xxs fw-bold text-muted text-uppercase mb-1">
                      Settlement Method *
                    </label>
                    <div className="p-2.5 rounded-3 bg-light border d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <span className="p-1.5 rounded-circle bg-warning text-dark">
                          <Wallet size={14} />
                        </span>
                        <div>
                          <strong className="text-dark d-block text-xs">Prepaid Agent Wallet</strong>
                          <span className="text-muted text-xxs">
                            Available: ₹{parseFloat(partnerUser?.wallet_balance || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                      <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 text-3xs rounded-pill">
                        Instant Booking Debit
                      </span>
                    </div>
                  </div>

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
