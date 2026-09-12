import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, ChevronLeft, ChevronRight, Star, MapPin, ArrowLeft, CheckCircle, 
  Clock, ShieldCheck, Users, BedDouble, Maximize2, Coffee, Utensils, 
  Calendar, Info, AlertCircle, ExternalLink, ThumbsUp, MessageSquare, 
  Compass, Eye, Sparkles, Check
} from 'lucide-react';
import ImageCarousel from '../../components/common/ImageCarousel';
import * as api from '../../services/api';
import { getTodayDateStr, addDays, formatDisplayDate } from '../../utils/dateUtils';

export default function HotelDetailsPage({ 
  hotel, 
  pickupDate, 
  dropDate, 
  nights: initialNights = 1, 
  onBack, 
  onBook 
}) {
  // Navigation & View Mode
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryTab, setGalleryTab] = useState('property'); // 'property' or 'rooms'
  const [activeLightboxImg, setActiveLightboxImg] = useState(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);

  // Search & Stay Configuration State
  const [checkInDate, setCheckInDate] = useState(pickupDate || getTodayDateStr());
  const [checkOutDate, setCheckOutDate] = useState(dropDate || addDays(pickupDate || getTodayDateStr(), initialNights || 2));
  const [numRooms, setNumRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  // Nights calculation
  const nights = useMemo(() => {
    if (!checkInDate || !checkOutDate) return Math.max(1, parseInt(initialNights) || 1);
    const d1 = new Date(checkInDate);
    const d2 = new Date(checkOutDate);
    const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
    return isNaN(diff) || diff < 1 ? 1 : diff;
  }, [checkInDate, checkOutDate, initialNights]);

  // Real Rooms & Rate Plans State (Public API)
  const [roomTypes, setRoomTypes] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState(null);

  // Reviews State (Public Approved Reviews)
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Selected Room & Plan Selection for quick review
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [selectedPlanByRoom, setSelectedPlanByRoom] = useState({});

  // 1. Fetch Real Room Types & Live Availability
  const loadRooms = async () => {
    if (!hotel || !hotel.id) return;
    setLoadingRooms(true);
    setRoomsError(null);
    try {
      const res = await api.fetchHotelRoomsPublic(hotel.id, {
        checkIn: checkInDate,
        checkOut: checkOutDate,
        rooms: numRooms
      });
      if (res && res.success && Array.isArray(res.room_types)) {
        setRoomTypes(res.room_types);
        if (res.room_types.length > 0) {
          setSelectedRoomId(res.room_types[0].id);
          // Initialize default rate plan for each room (prefer EP or first active plan)
          const planMap = {};
          res.room_types.forEach(rt => {
            if (rt.rate_plans && rt.rate_plans.length > 0) {
              const ep = rt.rate_plans.find(p => p.meal_plan === 'EP');
              planMap[rt.id] = ep ? ep.id : rt.rate_plans[0].id;
            }
          });
          setSelectedPlanByRoom(planMap);
        }
      } else {
        setRoomTypes([]);
        setRoomsError(res.message || 'No active rooms currently available for this property.');
      }
    } catch (err) {
      console.error('[HotelDetails] Error loading rooms:', err);
      setRoomsError('Unable to load rooms at this moment.');
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, [hotel?.id, checkInDate, checkOutDate, numRooms]);

  // 2. Fetch Public Approved Reviews
  useEffect(() => {
    if (!hotel || !hotel.id) return;
    setLoadingReviews(true);
    api.fetchHotelPublicReviews(hotel.id)
      .then(res => {
        if (res && res.success) {
          setReviews(res.reviews || []);
          setReviewSummary(res.summary || null);
        }
      })
      .catch(err => {
        console.warn('[HotelDetails] Reviews fetch error:', err);
      })
      .finally(() => {
        setLoadingReviews(false);
      });
  }, [hotel?.id]);

  // Collect all property images
  const propertyImages = useMemo(() => {
    const list = [];
    if (hotel.image) list.push(hotel.image);
    if (hotel.image_url && !list.includes(hotel.image_url)) list.push(hotel.image_url);
    if (hotel.images_json) {
      try {
        const parsed = typeof hotel.images_json === 'string' ? JSON.parse(hotel.images_json) : hotel.images_json;
        if (Array.isArray(parsed)) {
          parsed.forEach(img => {
            if (typeof img === 'string' && img.trim() && !list.includes(img)) list.push(img);
          });
        }
      } catch (e) {}
    }
    if (Array.isArray(hotel.images)) {
      hotel.images.forEach(img => {
        if (typeof img === 'string' && img.trim() && !list.includes(img)) list.push(img);
      });
    }
    return list.length > 0 ? list : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'];
  }, [hotel]);

  // Collect all room images across real room types (Phase 5: Rooms Gallery)
  const roomGalleryItems = useMemo(() => {
    const items = [];
    roomTypes.forEach(rt => {
      const rImgs = Array.isArray(rt.images) ? rt.images : [];
      rImgs.forEach((imgUrl, i) => {
        items.push({
          url: imgUrl,
          roomName: rt.name,
          caption: `${rt.name} - Photo ${i + 1}`,
          roomType: rt
        });
      });
    });
    return items;
  }, [roomTypes]);

  // Escape to close modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (activeLightboxImg) setActiveLightboxImg(null);
        else if (galleryOpen) setGalleryOpen(false);
        else if (mapModalOpen) setMapModalOpen(false);
        else onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxImg, galleryOpen, mapModalOpen, onBack]);

  // Hotel Base Details
  const starsCount = parseInt(hotel.stars || hotel.rating || 4, 10);
  const basePricePerNight = parseInt(hotel.price) || 0;
  const checkinTime = hotel.checkin_time || '02:00 PM';
  const checkoutTime = hotel.checkout_time || '11:00 AM';

  // Parse policies
  const hotelPolicies = useMemo(() => {
    if (!hotel.policies_json) return null;
    try {
      return typeof hotel.policies_json === 'string' ? JSON.parse(hotel.policies_json) : hotel.policies_json;
    } catch (e) {
      return null;
    }
  }, [hotel.policies_json]);

  // Handle Room + Rate Plan Reservation trigger
  const handleReserveRoom = (room, plan) => {
    if (document.activeElement?.blur) document.activeElement.blur();
    
    // Prepare extended hotel item containing pre-selections
    const enrichedHotel = {
      ...hotel,
      preselected_room: room,
      preselected_rate_plan: plan,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      booking_days: nights,
      num_rooms: numRooms,
      adults: adults,
      children: children
    };
    
    onBook(enrichedHotel, room, plan);
  };

  // Scroll to Available Rooms section
  const scrollToRooms = () => {
    const el = document.getElementById('available-rooms-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Address string for Map
  const mapSearchQuery = useMemo(() => {
    const parts = [hotel.name, hotel.area || hotel.location, hotel.city || 'Goa', 'India'].filter(Boolean);
    return parts.join(', ');
  }, [hotel]);

  return (
    <div className="hotel-details-page animate-fade-in-up pb-5" style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      
      {/* ─── 1. TOP STICKY APP NAVBAR ─── */}
      <div className="bg-white border-bottom sticky-top shadow-sm px-4 py-3 d-flex align-items-center justify-content-between" style={{ zIndex: 1020 }}>
        <div className="d-flex align-items-center gap-3">
          <button 
            type="button"
            onClick={() => { if (document.activeElement?.blur) document.activeElement.blur(); onBack(); }} 
            className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center border"
            title="Back to Hotel Listings"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="text-muted text-xxs text-uppercase fw-semibold" style={{ letterSpacing: '0.5px' }}>
              Hotels &gt; {hotel.location || hotel.area || 'Goa'} &gt; {hotel.name}
            </div>
            <h5 className="mb-0 fw-bold text-dark">{hotel.name}</h5>
          </div>
        </div>
        <div className="d-flex align-items-center gap-3">
          <button 
            type="button"
            onClick={scrollToRooms}
            className="btn btn-primary btn-sm rounded-pill px-3 py-1.5 fw-bold d-none d-md-flex align-items-center gap-1 shadow-sm"
          >
            <span>Reserve a Room</span>
            <ChevronRight size={16} />
          </button>
          <button 
            type="button"
            onClick={() => { if (document.activeElement?.blur) document.activeElement.blur(); onBack(); }} 
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 rounded-pill px-3 py-1"
          >
            <X size={16} /> Close
          </button>
        </div>
      </div>

      <div className="container py-4">

        {/* ─── 2. PROPERTY HEADER ─── */}
        <div className="bg-white rounded-4 shadow-sm p-4 mb-4 border">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                <span className="badge bg-dark text-white rounded-pill px-2.5 py-1 text-xs fw-bold">
                  {hotel.stars ? `${hotel.stars} Star Hotel` : 'Verified Stay'}
                </span>
                <div className="d-flex text-warning">
                  {[...Array(Math.min(starsCount, 5))].map((_, i) => (
                    <Star key={i} size={15} fill="currentColor" />
                  ))}
                </div>
                {hotel.status === 'Active' && (
                  <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2 py-0.5 text-xxs fw-bold">
                    ✓ Verified Available
                  </span>
                )}
              </div>

              <h1 className="fw-black text-dark mb-1 fs-2 font-heading">{hotel.name}</h1>
              
              <div className="d-flex align-items-center gap-2 text-muted text-sm flex-wrap mt-1">
                <div className="d-flex align-items-center gap-1">
                  <MapPin size={15} className="text-primary" />
                  <span>{hotel.address ? `${hotel.address}, ` : ''}{hotel.area || hotel.location}, Goa</span>
                </div>
                <span>•</span>
                <button 
                  type="button"
                  onClick={() => setMapModalOpen(true)}
                  className="btn btn-link p-0 text-primary text-decoration-none fw-bold text-xs d-flex align-items-center gap-1"
                >
                  <Compass size={13} /> View on Map
                </button>
              </div>
            </div>

            {/* Quick Pricing & Reserve Anchor */}
            <div className="d-flex flex-column align-items-start align-items-md-end bg-light p-3 rounded-3 border flex-shrink-0">
              <span className="text-muted text-xxs text-uppercase fw-bold">Starting from</span>
              <div className="d-flex align-items-baseline gap-1">
                <h3 className="fw-black text-primary mb-0">₹{basePricePerNight.toLocaleString('en-IN')}</h3>
                <span className="text-muted text-xs">/ night</span>
              </div>
              <span className="text-muted text-xxs">+ 18% GST &amp; fees</span>
              <button 
                type="button"
                onClick={scrollToRooms}
                className="btn btn-primary rounded-pill px-4 py-2 fw-bold text-xs mt-2 w-100 shadow-sm"
              >
                View Available Rooms
              </button>
            </div>
          </div>
        </div>

        {/* ─── 3. HERO PHOTO GALLERY & LIGHTBOX TRIGGER ─── */}
        <div className="bg-white rounded-4 shadow-sm p-3 mb-4 border position-relative">
          <div className="row g-2">
            <div className="col-12 col-md-8">
              <div className="position-relative overflow-hidden rounded-3" style={{ height: '400px' }}>
                <ImageCarousel
                  images={propertyImages}
                  alt={hotel.name}
                  height="400px"
                  rounded="12px"
                />
              </div>
            </div>
            <div className="col-12 col-md-4 d-none d-md-flex flex-column gap-2">
              <div 
                className="position-relative overflow-hidden rounded-3 cursor-pointer hover-scale flex-fill" 
                style={{ height: '196px' }}
                onClick={() => { setGalleryTab('property'); setGalleryOpen(true); }}
              >
                <img 
                  src={propertyImages[1] || propertyImages[0]} 
                  alt={`${hotel.name} preview 1`} 
                  className="w-100 h-100 object-fit-cover"
                />
              </div>
              <div 
                className="position-relative overflow-hidden rounded-3 cursor-pointer hover-scale flex-fill" 
                style={{ height: '196px' }}
                onClick={() => { setGalleryTab('rooms'); setGalleryOpen(true); }}
              >
                <img 
                  src={propertyImages[2] || propertyImages[0]} 
                  alt={`${hotel.name} preview 2`} 
                  className="w-100 h-100 object-fit-cover"
                />
                <div className="position-absolute inset-0 bg-dark bg-opacity-50 d-flex flex-column align-items-center justify-content-center text-white p-2 text-center" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
                  <Eye size={22} className="mb-1" />
                  <span className="fw-bold text-xs">View All Photos</span>
                  <span className="text-xxs text-white-50">Property &amp; Rooms</span>
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-2 px-1">
            <span className="text-muted text-xs">
              📸 Showing property &amp; active room photos
            </span>
            <button 
              type="button"
              onClick={() => { setGalleryTab('property'); setGalleryOpen(true); }}
              className="btn btn-outline-dark btn-sm rounded-pill px-3 py-1 text-xs fw-bold d-flex align-items-center gap-1"
            >
              <Eye size={14} /> Open Full Gallery ({propertyImages.length + roomGalleryItems.length} Photos)
            </button>
          </div>
        </div>

        {/* ─── 4. INTERACTIVE STAY DATES & GUEST BAR ─── */}
        <div className="bg-white rounded-4 shadow-sm p-4 mb-4 border">
          <div className="d-flex align-items-center gap-2 mb-3">
            <Calendar size={18} className="text-primary" />
            <h5 className="mb-0 fw-bold text-dark">Check Availability &amp; Rates for Your Stay</h5>
          </div>

          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-3">
              <label className="form-label text-muted text-xs fw-bold text-uppercase mb-1">Check-In Date</label>
              <input 
                type="date" 
                className="form-control rounded-3" 
                min={getTodayDateStr()}
                value={checkInDate}
                onChange={(e) => {
                  const newIn = e.target.value;
                  setCheckInDate(newIn);
                  if (checkOutDate <= newIn) {
                    setCheckOutDate(addDays(newIn, 1));
                  }
                }}
              />
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label text-muted text-xs fw-bold text-uppercase mb-1">Check-Out Date</label>
              <input 
                type="date" 
                className="form-control rounded-3" 
                min={addDays(checkInDate, 1)}
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
              />
            </div>

            <div className="col-6 col-md-2">
              <label className="form-label text-muted text-xs fw-bold text-uppercase mb-1">Rooms</label>
              <select 
                className="form-select rounded-3" 
                value={numRooms} 
                onChange={(e) => setNumRooms(parseInt(e.target.value) || 1)}
              >
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'Room' : 'Rooms'}</option>
                ))}
              </select>
            </div>

            <div className="col-6 col-md-2">
              <label className="form-label text-muted text-xs fw-bold text-uppercase mb-1">Adults</label>
              <select 
                className="form-select rounded-3" 
                value={adults} 
                onChange={(e) => setAdults(parseInt(e.target.value) || 2)}
              >
                {[1, 2, 3, 4, 6, 8, 10].map(n => (
                  <option key={n} value={n}>{n} Adults</option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-2">
              <button 
                type="button"
                onClick={loadRooms}
                className="btn btn-primary w-100 rounded-3 py-2 fw-bold text-xs d-flex align-items-center justify-content-center gap-1 shadow-sm"
              >
                <Sparkles size={14} /> Update Rates
              </button>
            </div>
          </div>

          <div className="mt-3 pt-2 border-top d-flex justify-content-between align-items-center text-xs text-muted flex-wrap gap-2">
            <span>
              Stay Duration: <strong className="text-dark">{nights} {nights === 1 ? 'Night' : 'Nights'}</strong> ({formatDisplayDate(checkInDate)} to {formatDisplayDate(checkOutDate)})
            </span>
            <span className="text-success fw-semibold">
              ✓ Prices update in real time with date-specific calendar &amp; weekend rates
            </span>
          </div>
        </div>

        {/* ─── 5. MAIN CONTENT SPLIT (About, Amenities, Policies) ─── */}
        <div className="row g-4 mb-4">
          <div className="col-12 col-lg-8">
            
            {/* About Property */}
            <div className="bg-white rounded-4 shadow-sm p-4 mb-4 border">
              <h4 className="fw-bold text-dark mb-3">About This Property</h4>
              <p className="text-muted lh-lg mb-4" style={{ whiteSpace: 'pre-line' }}>
                {hotel.description || `Welcome to ${hotel.name}, an exceptional accommodation located in ${hotel.area || hotel.location || 'Goa'}. Offering comfortable living spaces, authentic hospitality, and convenient access to Goa's top attractions.`}
              </p>

              {/* Verified Property Highlights */}
              <div className="row g-3 pt-2 border-top">
                <div className="col-12 col-sm-4">
                  <div className="d-flex align-items-center gap-2">
                    <Clock size={16} className="text-primary flex-shrink-0" />
                    <div>
                      <span className="text-muted text-xxs d-block">Check-In / Out</span>
                      <strong className="text-dark text-xs">{checkinTime} / {checkoutTime}</strong>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-sm-4">
                  <div className="d-flex align-items-center gap-2">
                    <MapPin size={16} className="text-primary flex-shrink-0" />
                    <div>
                      <span className="text-muted text-xxs d-block">Location</span>
                      <strong className="text-dark text-xs">{hotel.area || hotel.location || 'Goa'}</strong>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-sm-4">
                  <div className="d-flex align-items-center gap-2">
                    <ShieldCheck size={16} className="text-success flex-shrink-0" />
                    <div>
                      <span className="text-muted text-xxs d-block">Safety &amp; Hygiene</span>
                      <strong className="text-dark text-xs">WOW GOA Certified</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Property Amenities */}
            <div className="bg-white rounded-4 shadow-sm p-4 mb-4 border">
              <h4 className="fw-bold text-dark mb-3">Property Amenities</h4>
              <div className="d-flex flex-wrap gap-2">
                {(hotel.amenities 
                  ? (Array.isArray(hotel.amenities) ? hotel.amenities : hotel.amenities.split(',')) 
                  : ['Free Wi-Fi', 'Swimming Pool', 'Air Conditioning', 'Room Service', 'Power Backup', '24x7 Security', 'Daily Housekeeping']
                ).map((amenity, idx) => (
                  <span key={idx} className="badge bg-light text-dark border px-3 py-2 rounded-pill d-flex align-items-center gap-1.5 text-xs">
                    <CheckCircle size={14} className="text-success" />
                    {amenity.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Dynamic Hotel Policies (Phase 6) */}
            <div className="bg-white rounded-4 shadow-sm p-4 mb-4 border">
              <h4 className="fw-bold text-dark mb-3">Hotel Policies &amp; Guidelines</h4>
              
              <div className="row g-3">
                <div className="col-12 col-sm-6">
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="text-muted text-xxs text-uppercase fw-bold d-block mb-1">Check-in / Check-out</span>
                    <div className="d-flex justify-content-between text-xs py-1 border-bottom">
                      <span>Standard Check-In:</span>
                      <strong className="text-dark">{checkinTime}</strong>
                    </div>
                    <div className="d-flex justify-content-between text-xs py-1">
                      <span>Standard Check-Out:</span>
                      <strong className="text-dark">{checkoutTime}</strong>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-sm-6">
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="text-muted text-xxs text-uppercase fw-bold d-block mb-1">Cancellation Policy</span>
                    <p className="text-xs text-dark mb-0 lh-base">
                      {hotelPolicies?.cancellation_policy || 'Cancellation terms depend on the selected room rate plan. Please review individual rate plan details below before booking.'}
                    </p>
                  </div>
                </div>

                <div className="col-12">
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="text-muted text-xxs text-uppercase fw-bold d-block mb-1">Guest Identification &amp; House Rules</span>
                    <ul className="text-xs text-muted mb-0 ps-3 lh-lg">
                      <li>Valid government-issued photo ID (Aadhaar, Passport, Driving License, Voter ID) is mandatory for all adults at check-in.</li>
                      <li>Couples and families are welcome. Standard visitor rules apply.</li>
                      {hotelPolicies?.pet_friendly ? (
                        <li className="text-success">Pets are welcome at this property (subject to property guidelines).</li>
                      ) : (
                        <li>Pets are not allowed on property premises.</li>
                      )}
                      {hotelPolicies?.smoking_allowed ? (
                        <li>Designated smoking areas are available.</li>
                      ) : (
                        <li>This is a non-smoking property in all guest rooms.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Sidebar: Location Snapshot & Reviews Overview */}
          <div className="col-12 col-lg-4">
            
            {/* Reviews Snapshot Box (Phase 7) */}
            <div className="bg-white rounded-4 shadow-sm p-4 mb-4 border">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-dark mb-0">Guest Reviews</h5>
                <span className="badge bg-primary text-white rounded-pill px-2 py-0.5 text-xxs">
                  {reviewSummary?.total_reviews || reviews.length} Verified
                </span>
              </div>

              <div className="d-flex align-items-center gap-3 mb-3 p-3 bg-light rounded-3 border">
                <div className="d-flex align-items-center justify-content-center bg-success text-white rounded-3 px-3 py-2 fw-black fs-4">
                  {reviewSummary?.average_rating || (reviews.length > 0 ? (reviews.reduce((acc, r) => acc + parseFloat(r.rating || 0), 0) / reviews.length).toFixed(1) : (hotel.rating || '4.8'))}
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-0">
                    {parseFloat(reviewSummary?.average_rating || hotel.rating || 4.8) >= 4.5 ? 'Exceptional' : 'Very Good'}
                  </h6>
                  <span className="text-muted text-xs">
                    Based on {reviewSummary?.total_reviews || reviews.length || 1} verified guest stays
                  </span>
                </div>
              </div>

              {/* Sub-ratings Breakdown */}
              <div className="space-y-2 mb-3">
                <div className="mb-2">
                  <div className="d-flex justify-content-between text-xs mb-1">
                    <span className="text-muted">Cleanliness</span>
                    <strong className="text-dark">{reviewSummary?.cleanliness_rating || '4.9'} / 5</strong>
                  </div>
                  <div className="progress" style={{ height: '6px' }}>
                    <div className="progress-bar bg-success" style={{ width: `${(parseFloat(reviewSummary?.cleanliness_rating || 4.9) / 5) * 100}%` }}></div>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="d-flex justify-content-between text-xs mb-1">
                    <span className="text-muted">Staff &amp; Service</span>
                    <strong className="text-dark">{reviewSummary?.service_rating || '4.8'} / 5</strong>
                  </div>
                  <div className="progress" style={{ height: '6px' }}>
                    <div className="progress-bar bg-success" style={{ width: `${(parseFloat(reviewSummary?.service_rating || 4.8) / 5) * 100}%` }}></div>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="d-flex justify-content-between text-xs mb-1">
                    <span className="text-muted">Location</span>
                    <strong className="text-dark">{reviewSummary?.location_rating || '4.8'} / 5</strong>
                  </div>
                  <div className="progress" style={{ height: '6px' }}>
                    <div className="progress-bar bg-primary" style={{ width: `${(parseFloat(reviewSummary?.location_rating || 4.8) / 5) * 100}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Sample Review Excerpt */}
              {reviews.length > 0 && (
                <div className="border-top pt-3">
                  <p className="text-muted text-xs fst-italic mb-2">
                    "{reviews[0].comment}"
                  </p>
                  <span className="text-dark text-xxs fw-bold d-block">— {reviews[0].guest_name || 'Verified Guest'}</span>
                </div>
              )}
            </div>

            {/* Location & Map Card (Phase 8) */}
            <div className="bg-white rounded-4 shadow-sm p-4 mb-4 border">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="fw-bold text-dark mb-0">Location</h5>
                <button 
                  type="button"
                  onClick={() => setMapModalOpen(true)}
                  className="btn btn-link p-0 text-primary text-xs fw-bold text-decoration-none"
                >
                  Full Map
                </button>
              </div>

              <div className="text-muted text-xs mb-3">
                <MapPin size={14} className="text-primary me-1 inline" />
                {hotel.address || hotel.location || hotel.area || 'Goa, India'}
              </div>

              {/* Interactive Mini-Map Preview iframe */}
              <div 
                className="position-relative rounded-3 overflow-hidden border mb-3 cursor-pointer shadow-sm" 
                style={{ height: '180px' }}
                onClick={() => setMapModalOpen(true)}
              >
                <iframe
                  title="Hotel Mini Location"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight="0"
                  marginWidth="0"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(mapSearchQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                  style={{ pointerEvents: 'none' }}
                />
                <div className="position-absolute inset-0 bg-transparent" style={{ top: 0, left: 0, right: 0, bottom: 0 }}></div>
                <div className="position-absolute bottom-0 start-0 m-2 badge bg-dark text-white text-xxs px-2 py-1 shadow-sm">
                  Click to Expand Map
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setMapModalOpen(true)}
                className="btn btn-outline-primary btn-sm w-100 rounded-pill fw-bold text-xs d-flex align-items-center justify-content-center gap-1.5"
              >
                <Compass size={14} /> View Location on Map
              </button>
            </div>

          </div>
        </div>

        {/* ─── 6. AVAILABLE ROOMS & RATES SECTION (OTA-Style Inline) ─── */}
        <div id="available-rooms-section" className="bg-white rounded-4 shadow-sm p-4 mb-4 border">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 pb-3 mb-4 border-bottom">
            <div>
              <div className="d-flex align-items-center gap-2">
                <BedDouble size={22} className="text-primary" />
                <h3 className="fw-black text-dark mb-0 font-heading">Available Rooms &amp; Rate Plans</h3>
              </div>
              <p className="text-muted text-xs mb-0 mt-1">
                Real database inventory for {nights} {nights === 1 ? 'Night' : 'Nights'} ({formatDisplayDate(checkInDate)} – {formatDisplayDate(checkOutDate)}) for {numRooms} {numRooms === 1 ? 'Room' : 'Rooms'}
              </p>
            </div>
            
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-light text-dark border px-3 py-1.5 rounded-pill text-xs fw-bold">
                {roomTypes.length} Room Types Active
              </span>
            </div>
          </div>

          {/* Loading / Error States */}
          {loadingRooms ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-2" role="status"></div>
              <p className="text-muted text-sm mb-0">Checking live room inventory &amp; rate plans...</p>
            </div>
          ) : roomsError || roomTypes.length === 0 ? (
            <div className="text-center py-5 bg-light rounded-3 border p-4">
              <AlertCircle size={36} className="text-danger mb-2" />
              <h5 className="fw-bold text-dark mb-1">No Rooms Available for Selected Dates</h5>
              <p className="text-muted text-xs mb-3">
                {roomsError || 'All room types are fully booked or closed for these dates. Please adjust your stay dates.'}
              </p>
              <button 
                type="button" 
                onClick={() => {
                  setCheckInDate(addDays(getTodayDateStr(), 3));
                  setCheckOutDate(addDays(getTodayDateStr(), 5));
                }}
                className="btn btn-outline-primary btn-sm rounded-pill px-4"
              >
                Try Later Dates
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {roomTypes.map((room) => {
                const isRoomSoldOut = !room.is_available;
                const roomImages = (room.images && room.images.length > 0) ? room.images : propertyImages;
                const currentSelectedPlanId = selectedPlanByRoom[room.id] || (room.rate_plans && room.rate_plans[0]?.id);
                const currentSelectedPlan = (room.rate_plans || []).find(p => p.id === currentSelectedPlanId) || (room.rate_plans && room.rate_plans[0]);

                return (
                  <div 
                    key={room.id} 
                    className={`card border rounded-4 overflow-hidden mb-4 shadow-sm ${isRoomSoldOut ? 'bg-light opacity-75' : 'bg-white'}`}
                    style={{ borderColor: '#E2E8F0' }}
                  >
                    <div className="row g-0">
                      
                      {/* Left: Room Images & Specs */}
                      <div className="col-12 col-lg-4 p-3 border-end bg-light bg-opacity-50">
                        <div className="position-relative overflow-hidden rounded-3 mb-3 shadow-sm" style={{ height: '220px' }}>
                          <ImageCarousel
                            images={roomImages}
                            alt={room.name}
                            height="220px"
                            rounded="8px"
                          />
                          <span className={`position-absolute top-0 start-0 m-2 badge ${isRoomSoldOut ? 'bg-danger' : 'bg-success'} text-white text-xxs px-2.5 py-1 rounded-pill shadow-sm`} style={{ zIndex: 5 }}>
                            {room.availability_message || (isRoomSoldOut ? 'Sold Out' : 'Available')}
                          </span>
                        </div>

                        <h4 className="fw-bold text-dark mb-1 fs-5">{room.name}</h4>
                        
                        {/* Room Specifications */}
                        <div className="d-flex flex-wrap gap-2 text-xs text-muted mb-3">
                          {room.room_size && (
                            <span className="d-flex align-items-center gap-1 bg-white border px-2 py-1 rounded">
                              <Maximize2 size={12} className="text-primary" /> {room.room_size} {room.room_size_unit || 'sq.ft'}
                            </span>
                          )}
                          <span className="d-flex align-items-center gap-1 bg-white border px-2 py-1 rounded">
                            <BedDouble size={12} className="text-primary" /> {room.bed_type || 'King Bed'}
                          </span>
                          <span className="d-flex align-items-center gap-1 bg-white border px-2 py-1 rounded">
                            <Users size={12} className="text-primary" /> Max {room.max_occupancy || 3} Guests
                          </span>
                          {room.view_type && (
                            <span className="d-flex align-items-center gap-1 bg-white border px-2 py-1 rounded">
                              <Compass size={12} className="text-primary" /> {room.view_type}
                            </span>
                          )}
                        </div>

                        {/* Room Amenities */}
                        <div className="mb-2">
                          <span className="text-muted text-xxs fw-bold text-uppercase d-block mb-1">Room Highlights:</span>
                          <div className="d-flex flex-wrap gap-1">
                            {(room.amenities || ['Air Conditioning', 'Free Wi-Fi', 'Private Bathroom', 'Flat-screen TV']).slice(0, 5).map((am, idx) => (
                              <span key={idx} className="badge bg-white text-dark border px-2 py-1 text-xxs rounded">
                                ✓ {am}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Room Inventory Count */}
                        {room.available_rooms !== null && room.available_rooms !== undefined && (
                          <div className="mt-2 text-xxs text-muted">
                            Total Units: {room.total_rooms} | <strong className={room.available_rooms < 3 ? 'text-danger' : 'text-success'}>{room.available_rooms} rooms remaining</strong>
                          </div>
                        )}
                      </div>

                      {/* Right: Meal Plan & Rate Plans Selection (Phase 3) */}
                      <div className="col-12 col-lg-8 p-3 p-md-4 d-flex flex-column justify-content-between">
                        <div>
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="fw-bold text-dark text-uppercase text-xs tracking-wider mb-0">
                              Select Meal Plan &amp; Rate Policy
                            </h6>
                            <span className="text-muted text-xxs">
                              Authoritative prices for {nights} {nights === 1 ? 'Night' : 'Nights'}
                            </span>
                          </div>

                          {/* Rate Plans List */}
                          <div className="space-y-3">
                            {(room.rate_plans || []).map((plan) => {
                              const isSelected = currentSelectedPlanId === plan.id;
                              const nightlyPrice = plan.calculated_price || plan.base_price;
                              const planTotalPrice = nightlyPrice * nights * numRooms;
                              const mealLabel = plan.meal_plan_label || plan.name;

                              return (
                                <div 
                                  key={plan.id}
                                  onClick={() => {
                                    if (!isRoomSoldOut) {
                                      setSelectedPlanByRoom(prev => ({ ...prev, [room.id]: plan.id }));
                                    }
                                  }}
                                  className={`p-3 rounded-3 border transition-all cursor-pointer ${
                                    isSelected 
                                      ? 'border-primary bg-primary bg-opacity-10 shadow-sm' 
                                      : 'border-slate-200 bg-white hover-border-slate-300'
                                  } ${isRoomSoldOut ? 'pointer-events-none' : ''}`}
                                  style={{ borderWidth: isSelected ? '2px' : '1px' }}
                                >
                                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start gap-2">
                                    <div className="d-flex align-items-start gap-2.5">
                                      <input 
                                        type="radio" 
                                        name={`plan_select_${room.id}`}
                                        checked={isSelected}
                                        onChange={() => {}}
                                        className="mt-1"
                                        disabled={isRoomSoldOut}
                                      />
                                      <div>
                                        <div className="d-flex align-items-center gap-2">
                                          <span className="fw-bold text-dark fs-6">{mealLabel}</span>
                                          <span className="badge bg-dark text-white rounded px-2 py-0.5 text-xxs fw-bold">
                                            {plan.meal_plan}
                                          </span>
                                        </div>

                                        {/* Inclusions */}
                                        <div className="d-flex flex-wrap gap-2 text-xs text-muted mt-1">
                                          {(plan.inclusions || []).map((inc, i) => (
                                            <span key={i} className="d-flex align-items-center gap-1 text-success">
                                              <Check size={12} /> {inc}
                                            </span>
                                          ))}
                                        </div>

                                        {/* Cancellation Policy (Phase 6) */}
                                        <div className="mt-1 text-xs">
                                          {plan.cancellation_policy ? (
                                            <span className="text-primary fw-medium d-flex align-items-center gap-1">
                                              <ShieldCheck size={13} /> {plan.cancellation_policy}
                                            </span>
                                          ) : (
                                            <span className="text-muted">Standard hotel cancellation policy applies</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Pricing Box */}
                                    <div className="text-start text-sm-end ps-4 ps-sm-0 flex-shrink-0">
                                      <div className="text-muted text-xxs text-uppercase">Per Night</div>
                                      <div className="fw-black fs-5 text-dark">
                                        ₹{nightlyPrice.toLocaleString('en-IN')}
                                      </div>
                                      <div className="text-muted text-xxs">
                                        ₹{planTotalPrice.toLocaleString('en-IN')} total ({nights}N)
                                      </div>
                                      <span className="text-muted text-xxs">+ 18% GST</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Room Card Bottom Action */}
                        <div className="pt-3 mt-3 border-top d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
                          <div className="text-muted text-xs">
                            Selected: <strong className="text-dark">{currentSelectedPlan?.name || 'EP Room Only'}</strong> for <strong className="text-dark">{nights} {nights === 1 ? 'Night' : 'Nights'}</strong>
                          </div>

                          <button 
                            type="button"
                            disabled={isRoomSoldOut}
                            onClick={() => handleReserveRoom(room, currentSelectedPlan)}
                            className={`btn ${isRoomSoldOut ? 'btn-secondary' : 'btn-primary'} rounded-pill px-4 py-2.5 fw-bold text-xs d-flex align-items-center gap-2 shadow-sm`}
                          >
                            {isRoomSoldOut ? (
                              <span>Sold Out for Dates</span>
                            ) : (
                              <>
                                <span>Reserve {room.name}</span>
                                <ChevronRight size={16} />
                              </>
                            )}
                          </button>
                        </div>

                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── 7. GUEST REVIEWS FULL SECTION (Phase 7) ─── */}
        <div className="bg-white rounded-4 shadow-sm p-4 mb-4 border">
          <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
            <div>
              <div className="d-flex align-items-center gap-2">
                <MessageSquare size={20} className="text-primary" />
                <h4 className="fw-bold text-dark mb-0 font-heading">Verified Guest Reviews</h4>
              </div>
              <span className="text-muted text-xs">
                Real feedback from verified guests who booked through WOW GOA
              </span>
            </div>
            <span className="badge bg-light text-dark border px-3 py-1.5 rounded-pill text-xs fw-bold">
              {reviews.length} Approved Reviews
            </span>
          </div>

          {loadingReviews ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary spinner-border-sm mb-2" role="status"></div>
              <p className="text-muted text-xs mb-0">Loading verified reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-4 bg-light rounded-3">
              <p className="text-muted text-xs mb-0">No approved reviews yet. Be the first guest to review {hotel.name}!</p>
            </div>
          ) : (
            <div className="row g-3">
              {reviews.map((rev) => (
                <div key={rev.id} className="col-12 col-md-6">
                  <div className="p-3 bg-light rounded-3 border h-100 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold text-xs" style={{ width: '32px', height: '32px' }}>
                            {(rev.guest_name || 'G')[0]}
                          </div>
                          <div>
                            <strong className="text-dark text-xs d-block">{rev.guest_name || 'Verified Traveler'}</strong>
                            <span className="text-muted text-xxs">{rev.created_at ? rev.created_at.substring(0, 10) : 'Recent Stay'}</span>
                          </div>
                        </div>
                        <div className="badge bg-success text-white px-2 py-1 text-xs fw-bold d-flex align-items-center gap-1">
                          <Star size={12} fill="currentColor" /> {rev.rating} / 5
                        </div>
                      </div>
                      <p className="text-dark text-xs lh-base mb-2">
                        "{rev.comment}"
                      </p>
                    </div>

                    {/* Property Reply if present */}
                    {rev.reply && (
                      <div className="p-2 mt-2 bg-white rounded border text-xxs text-muted">
                        <strong className="text-dark d-block mb-0.5">Hotel Response:</strong>
                        {rev.reply}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ─── 8. INTERACTIVE LOCATION & MAP MODAL (Phase 8) ─── */}
      {mapModalOpen && (
        <div className="position-fixed inset-0 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1060, top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="bg-white rounded-4 shadow-lg overflow-hidden w-100 max-w-4xl border" style={{ maxWidth: '900px', height: '85vh' }}>
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-light">
              <div className="d-flex align-items-center gap-2">
                <MapPin size={20} className="text-primary" />
                <div>
                  <h5 className="fw-bold text-dark mb-0">{hotel.name} Location</h5>
                  <span className="text-muted text-xs">{hotel.address ? `${hotel.address}, ` : ''}{hotel.area || hotel.location || 'Goa, India'}</span>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapSearchQuery)}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn btn-outline-primary btn-sm rounded-pill text-xs fw-bold d-flex align-items-center gap-1"
                >
                  <ExternalLink size={14} /> Open in Google Maps
                </a>
                <button 
                  type="button" 
                  onClick={() => setMapModalOpen(false)}
                  className="btn btn-light rounded-circle p-2 border d-flex align-items-center justify-content-center"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="w-100 h-100 position-relative" style={{ height: 'calc(85vh - 70px)' }}>
              <iframe
                title="Hotel Map Location"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight="0"
                marginWidth="0"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(mapSearchQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── 9. FULL PHOTO GALLERY & LIGHTBOX MODAL (Phase 5) ─── */}
      {galleryOpen && (
        <div className="position-fixed inset-0 bg-dark bg-opacity-90 d-flex flex-column" style={{ zIndex: 1070, top: 0, left: 0, right: 0, bottom: 0 }}>
          
          {/* Gallery Modal Top Bar */}
          <div className="d-flex justify-content-between align-items-center p-3 text-white border-bottom border-secondary bg-dark bg-opacity-50">
            <div className="d-flex align-items-center gap-3">
              <h5 className="mb-0 fw-bold">{hotel.name} Photos</h5>
              <div className="btn-group rounded-pill p-1 bg-secondary bg-opacity-25">
                <button 
                  type="button"
                  onClick={() => setGalleryTab('property')}
                  className={`btn btn-sm rounded-pill px-3 fw-bold text-xs ${galleryTab === 'property' ? 'btn-primary' : 'text-white'}`}
                >
                  Property Photos ({propertyImages.length})
                </button>
                <button 
                  type="button"
                  onClick={() => setGalleryTab('rooms')}
                  className={`btn btn-sm rounded-pill px-3 fw-bold text-xs ${galleryTab === 'rooms' ? 'btn-primary' : 'text-white'}`}
                >
                  Rooms ({roomGalleryItems.length})
                </button>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setGalleryOpen(false)} 
              className="btn btn-outline-light rounded-circle p-2 d-flex align-items-center justify-content-center"
            >
              <X size={20} />
            </button>
          </div>

          {/* Gallery Content Grid */}
          <div className="flex-fill overflow-auto p-4">
            <div className="container">
              {galleryTab === 'property' ? (
                <div className="row g-3">
                  {propertyImages.map((img, idx) => (
                    <div key={idx} className="col-12 col-sm-6 col-md-4 col-lg-3">
                      <div 
                        className="rounded-3 overflow-hidden shadow cursor-pointer hover-scale border border-secondary"
                        style={{ height: '220px' }}
                        onClick={() => setActiveLightboxImg(img)}
                      >
                        <img 
                          src={img} 
                          alt={`Property ${idx + 1}`} 
                          className="w-100 h-100 object-fit-cover"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  {roomGalleryItems.length === 0 ? (
                    <div className="text-center py-5 text-white-50">
                      <BedDouble size={48} className="mb-2 opacity-50" />
                      <h5>No Dedicated Room Photos Uploaded</h5>
                      <p className="text-xs">Property photos are used as standard preview.</p>
                    </div>
                  ) : (
                    <div className="row g-3">
                      {roomGalleryItems.map((item, idx) => (
                        <div key={idx} className="col-12 col-sm-6 col-md-4 col-lg-3">
                          <div 
                            className="rounded-3 overflow-hidden shadow cursor-pointer hover-scale border border-secondary position-relative"
                            style={{ height: '220px' }}
                            onClick={() => setActiveLightboxImg(item.url)}
                          >
                            <img 
                              src={item.url} 
                              alt={item.caption} 
                              className="w-100 h-100 object-fit-cover"
                            />
                            <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white p-2 text-xxs text-truncate">
                              <strong className="d-block text-truncate">{item.roomName}</strong>
                              <span>{item.caption}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── 10. LIGHTBOX FULLSCREEN PREVIEW ─── */}
      {activeLightboxImg && (
        <div 
          className="position-fixed inset-0 bg-black bg-opacity-95 d-flex align-items-center justify-content-center p-3" 
          style={{ zIndex: 1080, top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={() => setActiveLightboxImg(null)}
        >
          <button 
            type="button" 
            onClick={() => setActiveLightboxImg(null)} 
            className="position-absolute top-0 end-0 m-4 btn btn-outline-light rounded-circle p-2"
          >
            <X size={24} />
          </button>
          <img 
            src={activeLightboxImg} 
            alt="Fullscreen Preview" 
            className="max-w-full max-h-full object-fit-contain rounded-3 shadow-lg"
            style={{ maxHeight: '90vh', maxWidth: '90vw' }}
          />
        </div>
      )}

    </div>
  );
}
