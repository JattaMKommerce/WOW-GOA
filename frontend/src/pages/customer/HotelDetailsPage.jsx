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
  onBook,
  backLabel,
  actionLabel,
  breadcrumbPrefix,
  isCraftMyTrip = false
}) {
  // Navigation & View Mode
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryTab, setGalleryTab] = useState('all'); // 'all', 'property', or 'rooms'
  const [activeLightboxImg, setActiveLightboxImg] = useState(null);
  const [activeLightboxIdx, setActiveLightboxIdx] = useState(0);
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

  // Collect all room images across real room types
  const roomGalleryItems = useMemo(() => {
    const items = [];
    roomTypes.forEach(rt => {
      const rImgs = Array.isArray(rt.images) ? rt.images : [];
      rImgs.forEach((imgUrl, i) => {
        items.push({
          url: imgUrl,
          category: 'rooms',
          roomName: rt.name,
          caption: `${rt.name} - Photo ${i + 1}`,
          roomType: rt
        });
      });
    });
    return items;
  }, [roomTypes]);

  // Combined all photos (Property + Rooms)
  const allGalleryItems = useMemo(() => {
    const list = [];
    propertyImages.forEach((img, i) => {
      list.push({
        url: img,
        category: 'property',
        roomName: 'Property & Grounds',
        caption: `${hotel.name} - Photo ${i + 1}`,
        type: 'Property'
      });
    });
    roomGalleryItems.forEach((item) => {
      list.push({
        url: item.url,
        category: 'rooms',
        roomName: item.roomName,
        caption: item.caption,
        type: item.roomName || 'Room'
      });
    });
    return list;
  }, [propertyImages, roomGalleryItems, hotel.name]);

  // Current list to display based on galleryTab
  const currentGalleryList = useMemo(() => {
    if (galleryTab === 'property') {
      return propertyImages.map((img, i) => ({
        url: img,
        category: 'property',
        roomName: 'Property & Grounds',
        caption: `${hotel.name} - Photo ${i + 1}`,
        type: 'Property'
      }));
    }
    if (galleryTab === 'rooms') {
      return roomGalleryItems;
    }
    return allGalleryItems;
  }, [galleryTab, propertyImages, roomGalleryItems, allGalleryItems, hotel.name]);

  const openLightbox = (index) => {
    const list = currentGalleryList;
    if (!list || list.length === 0) return;
    const safeIdx = Math.max(0, Math.min(index, list.length - 1));
    setActiveLightboxIdx(safeIdx);
    setActiveLightboxImg(list[safeIdx]?.url || null);
  };

  const nextLightboxImg = (e) => {
    if (e) e.stopPropagation();
    const list = currentGalleryList;
    if (!list || list.length === 0) return;
    const nextIdx = (activeLightboxIdx + 1) % list.length;
    setActiveLightboxIdx(nextIdx);
    setActiveLightboxImg(list[nextIdx]?.url || null);
  };

  const prevLightboxImg = (e) => {
    if (e) e.stopPropagation();
    const list = currentGalleryList;
    if (!list || list.length === 0) return;
    const prevIdx = (activeLightboxIdx - 1 + list.length) % list.length;
    setActiveLightboxIdx(prevIdx);
    setActiveLightboxImg(list[prevIdx]?.url || null);
  };

  // Keyboard navigation & escape to close modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (activeLightboxImg) setActiveLightboxImg(null);
        else if (galleryOpen) setGalleryOpen(false);
        else if (mapModalOpen) setMapModalOpen(false);
      } else if (activeLightboxImg) {
        if (e.key === 'ArrowRight') nextLightboxImg();
        else if (e.key === 'ArrowLeft') prevLightboxImg();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxImg, activeLightboxIdx, currentGalleryList, galleryOpen, mapModalOpen]);

  const starsCount = parseInt(hotel.stars || hotel.star_rating || 3, 10);
  const basePricePerNight = Math.round(parseFloat(hotel.price || 3500));
  const checkinTime = hotel.checkin_time || '02:00 PM';
  const checkoutTime = hotel.checkout_time || '11:00 AM';

  // Policies parser
  const hotelPolicies = useMemo(() => {
    if (!hotel.policies_json) return null;
    try {
      return typeof hotel.policies_json === 'string' ? JSON.parse(hotel.policies_json) : hotel.policies_json;
    } catch (e) {
      return null;
    }
  }, [hotel.policies_json]);

  // Handle Room + Rate Plan Reservation trigger
  const handleReserveRoom = (room = null, plan = null) => {
    if (document.activeElement?.blur) document.activeElement.blur();
    
    // Prepare extended hotel item containing pre-selections
    const enrichedHotel = {
      ...hotel,
      preselected_room: room || null,
      preselected_rate_plan: plan || null,
      has_selected_room: Boolean(room && plan),
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      booking_days: nights,
      num_rooms: numRooms,
      adults: adults,
      children: children
    };
    
    if (onBook) onBook(enrichedHotel, room, plan);
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
            className={`btn btn-light border hover-scale d-flex align-items-center gap-1.5 ${
              backLabel ? 'rounded-pill px-3 py-1.5 fw-bold text-xs' : 'rounded-circle p-2 justify-content-center'
            }`}
            title={backLabel || "Back to Hotel Listings"}
          >
            <ArrowLeft size={16} />
            {backLabel && <span>{backLabel.replace(/^←\s*/, '')}</span>}
          </button>
          <div>
            <div className="text-muted text-xxs text-uppercase fw-semibold" style={{ letterSpacing: '0.5px' }}>
              {breadcrumbPrefix || 'Hotels'} &gt; {hotel.location || hotel.area || 'Goa'} &gt; {hotel.name}
            </div>
            <h5 className="mb-0 fw-bold text-dark font-heading">{hotel.name}</h5>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          {roomTypes.length > 0 && (
            <button 
              type="button"
              onClick={scrollToRooms}
              className="btn btn-warning text-dark btn-sm rounded-pill px-3.5 py-1.5 fw-bold d-none d-md-flex align-items-center gap-1.5 shadow-sm font-heading hover-scale"
            >
              <span>View Rooms</span>
              <ChevronRight size={15} />
            </button>
          )}
          {isCraftMyTrip && (
            <button 
              type="button"
              onClick={() => handleReserveRoom(null, null)}
              className="btn btn-primary btn-sm rounded-pill px-3.5 py-1.5 fw-bold d-flex align-items-center gap-1.5 shadow-sm font-heading hover-scale"
              style={{ background: '#FF6333', borderColor: '#FF6333', color: '#FFFFFF' }}
            >
              <span>{actionLabel || 'Select & Continue'}</span>
              <ChevronRight size={15} />
            </button>
          )}
          <button 
            type="button"
            onClick={() => { if (document.activeElement?.blur) document.activeElement.blur(); onBack(); }} 
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 rounded-pill px-3 py-1"
          >
            <X size={15} /> Back
          </button>
        </div>
      </div>

      <div className="container py-4" style={{ maxWidth: '1200px' }}>

        {/* ─── 2. PROPERTY HEADER ─── */}
        <div className="bg-white rounded-4 shadow-sm p-4 mb-4 border" style={{ borderColor: '#E2E8F0' }}>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1.5 flex-wrap">
                <span className="badge rounded-pill px-3 py-1 text-xs fw-bold" style={{ background: '#0B192C', color: '#FFFFFF' }}>
                  ⭐ {starsCount}-Star {starsCount === 5 ? 'Luxury Resort' : starsCount === 4 ? 'Beachfront Resort' : 'Boutique Resort'}
                </span>
                <div className="d-flex text-warning">
                  {[...Array(Math.min(starsCount, 5))].map((_, i) => (
                    <Star key={i} size={15} fill="#F59E0B" color="#F59E0B" />
                  ))}
                </div>
                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2.5 py-1 text-xxs fw-bold">
                  ✓ WOW GOA Certified
                </span>
              </div>

              <h1 className="fw-black text-dark mb-1 fs-2 font-heading tracking-tight">{hotel.name}</h1>
              
              <div className="d-flex align-items-center gap-2 text-muted text-sm flex-wrap mt-1">
                <div className="d-flex align-items-center gap-1">
                  <MapPin size={15} className="text-warning" />
                  <span>{hotel.address ? `${hotel.address}, ` : ''}{hotel.area || hotel.location || 'Goa'}, India</span>
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
            <div className="d-flex flex-column align-items-start align-items-md-end bg-light p-3.5 rounded-3 border flex-shrink-0" style={{ minWidth: '220px' }}>
              <span className="text-muted text-xxs text-uppercase fw-bold">Starting from</span>
              <div className="d-flex align-items-baseline gap-1">
                <h3 className="fw-black text-dark mb-0 font-heading" style={{ fontSize: '26px' }}>₹{basePricePerNight.toLocaleString('en-IN')}</h3>
                <span className="text-muted text-xs">/ night</span>
              </div>
              <span className="text-muted text-xxs">+ 18% GST &amp; fees</span>
              {roomTypes.length > 0 ? (
                <button 
                  type="button"
                  onClick={scrollToRooms}
                  className="btn btn-warning text-dark rounded-pill px-4 py-2 fw-bold text-xs mt-2 w-100 shadow-sm font-heading hover-scale"
                >
                  View Available Rooms
                </button>
              ) : isCraftMyTrip ? (
                <button 
                  type="button"
                  onClick={() => handleReserveRoom(null, null)}
                  className="btn btn-primary rounded-pill px-4 py-2 fw-bold text-xs mt-2 w-100 shadow-sm font-heading hover-scale"
                  style={{ background: '#FF6333', borderColor: '#FF6333', color: '#FFFFFF' }}
                >
                  {actionLabel || 'Select & Continue'}
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={scrollToRooms}
                  className="btn btn-warning text-dark rounded-pill px-4 py-2 fw-bold text-xs mt-2 w-100 shadow-sm font-heading hover-scale"
                >
                  View Available Rooms
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── 3. HERO PHOTO GALLERY & LIGHTBOX TRIGGER ─── */}
        <div className="bg-white rounded-4 shadow-sm p-3 mb-4 border position-relative" style={{ borderColor: '#E2E8F0' }}>
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
                onClick={() => { setGalleryTab('all'); setGalleryOpen(true); }}
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
                onClick={() => { setGalleryTab('all'); setGalleryOpen(true); }}
              >
                <img 
                  src={propertyImages[2] || propertyImages[0]} 
                  alt={`${hotel.name} preview 2`} 
                  className="w-100 h-100 object-fit-cover"
                />
                <div className="position-absolute inset-0 bg-dark bg-opacity-50 d-flex flex-column align-items-center justify-content-center text-white p-2 text-center" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
                  <Eye size={22} className="mb-1 text-warning" />
                  <span className="fw-bold text-xs">View All Photos</span>
                  <span className="text-xxs text-white-50">{allGalleryItems.length} Property &amp; Rooms</span>
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-2 px-1">
            <span className="text-muted text-xs">
              📸 Showing property &amp; active room photos ({allGalleryItems.length} total)
            </span>
            <button 
              type="button"
              onClick={() => { setGalleryTab('all'); setGalleryOpen(true); }}
              className="btn btn-outline-dark btn-sm rounded-pill px-3 py-1 text-xs fw-bold d-flex align-items-center gap-1 hover-scale"
            >
              <Eye size={14} className="text-warning" /> Open Full Gallery ({allGalleryItems.length} Photos)
            </button>
          </div>
        </div>

        {/* ─── 4. INTERACTIVE STAY DATES & GUEST BAR ─── */}
        <div className="bg-white rounded-4 shadow-sm p-4 mb-4 border" style={{ borderColor: '#E2E8F0' }}>
          <div className="d-flex align-items-center gap-2 mb-3">
            <Calendar size={18} className="text-warning" />
            <h5 className="mb-0 fw-bold text-dark font-heading">Check Availability &amp; Rates for Your Stay</h5>
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
                className="btn btn-warning text-dark w-100 rounded-3 py-2 fw-bold text-xs d-flex align-items-center justify-content-center gap-1 shadow-sm font-heading hover-scale"
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
              ✓ Live calendar rates &amp; instant room confirmation
            </span>
          </div>
        </div>

        {/* ─── 5. MAIN CONTENT SPLIT (About, Amenities, Policies, Map) ─── */}
        <div className="row g-4 mb-4">
          <div className="col-12 col-lg-8">
            
            {/* About Property */}
            <div className="bg-white rounded-4 shadow-sm p-4 mb-4 border" style={{ borderColor: '#E2E8F0' }}>
              <h4 className="fw-bold text-dark mb-3 font-heading">About This Property</h4>
              <p className="text-muted lh-lg mb-4" style={{ whiteSpace: 'pre-line' }}>
                {hotel.description || `Welcome to ${hotel.name}, an exceptional accommodation located in ${hotel.area || hotel.location || 'Goa'}. Offering comfortable living spaces, authentic hospitality, and convenient access to Goa's top attractions.`}
              </p>

              {/* Verified Property Highlights */}
              <div className="row g-3 pt-2 border-top">
                <div className="col-12 col-sm-4">
                  <div className="d-flex align-items-center gap-2">
                    <Clock size={16} className="text-warning flex-shrink-0" />
                    <div>
                      <span className="text-muted text-xxs d-block">Check-In / Out</span>
                      <strong className="text-dark text-xs">{checkinTime} / {checkoutTime}</strong>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-sm-4">
                  <div className="d-flex align-items-center gap-2">
                    <MapPin size={16} className="text-warning flex-shrink-0" />
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
                      <strong className="text-dark text-xs">WOW GOA Verified</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Property Amenities */}
            <div className="bg-white rounded-4 shadow-sm p-4 mb-4 border" style={{ borderColor: '#E2E8F0' }}>
              <h4 className="fw-bold text-dark mb-3 font-heading">Property Amenities</h4>
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

            {/* Dynamic Hotel Policies */}
            <div className="bg-white rounded-4 shadow-sm p-4 mb-4 border" style={{ borderColor: '#E2E8F0' }}>
              <h4 className="fw-bold text-dark mb-3 font-heading">Hotel Policies &amp; Guidelines</h4>
              
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
                    </ul>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Rating Box & Mini Map */}
          <div className="col-12 col-lg-4">
            
            {/* Review Score Summary Box */}
            <div className="bg-white rounded-4 shadow-sm p-4 mb-4 border" style={{ borderColor: '#E2E8F0' }}>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h5 className="fw-bold text-dark mb-0 font-heading">Guest Rating</h5>
                  <span className="text-muted text-xs">Based on verified WOW GOA stays</span>
                </div>
                <div className="badge bg-success text-white px-2.5 py-1.5 rounded-3 fs-6 fw-bold">
                  {reviewSummary?.average_rating || (starsCount === 5 ? '4.9' : starsCount === 4 ? '4.7' : '4.6')}
                </div>
              </div>

              {/* Sub-Ratings */}
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

            {/* Location & Map Card */}
            <div className="bg-white rounded-4 shadow-sm p-4 mb-4 border" style={{ borderColor: '#E2E8F0' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="fw-bold text-dark mb-0 font-heading">Location</h5>
                <button 
                  type="button"
                  onClick={() => setMapModalOpen(true)}
                  className="btn btn-link p-0 text-primary text-xs fw-bold text-decoration-none"
                >
                  Full Map
                </button>
              </div>

              <div className="text-muted text-xs mb-3">
                <MapPin size={14} className="text-warning me-1 inline" />
                {hotel.address || hotel.location || hotel.area || 'Goa, India'}
              </div>

              {/* Mini-Map Preview iframe */}
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
                className="btn btn-outline-dark btn-sm w-100 rounded-pill fw-bold text-xs d-flex align-items-center justify-content-center gap-1.5"
              >
                <Compass size={14} /> View Location on Map
              </button>
            </div>

          </div>
        </div>

        {/* ─── 6. AVAILABLE ROOMS & RATES SECTION ─── */}
        <div id="available-rooms-section" className="bg-white rounded-4 shadow-sm p-4 mb-4 border" style={{ borderColor: '#E2E8F0' }}>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 pb-3 mb-4 border-bottom">
            <div>
              <div className="d-flex align-items-center gap-2">
                <BedDouble size={22} className="text-warning" />
                <h3 className="fw-black text-dark mb-0 font-heading">Available Room Types &amp; Meal Plans</h3>
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
              <div className="d-flex justify-content-center gap-2 flex-wrap">
                <button 
                  type="button" 
                  onClick={() => {
                    setCheckInDate(addDays(getTodayDateStr(), 3));
                    setCheckOutDate(addDays(getTodayDateStr(), 5));
                  }}
                  className="btn btn-primary btn-sm rounded-pill px-4"
                >
                  Try Later Dates
                </button>
                {isCraftMyTrip && (
                  <button 
                    type="button" 
                    onClick={() => handleReserveRoom(null, null)}
                    className="btn btn-outline-dark btn-sm rounded-pill px-4 fw-bold"
                  >
                    Select This Hotel (Standard Stay)
                  </button>
                )}
              </div>
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
                      
                      {/* Left: Room Images & Specifications */}
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

                        <h4 className="fw-bold text-dark mb-1 fs-5 font-heading">{room.name}</h4>
                        
                        {/* Room Specifications */}
                        <div className="d-flex flex-wrap gap-2 text-xs text-muted mb-3">
                          {room.room_size && (
                            <span className="d-flex align-items-center gap-1 bg-white border px-2 py-1 rounded">
                              <Maximize2 size={12} className="text-warning" /> {room.room_size} {room.room_size_unit || 'sq.ft'}
                            </span>
                          )}
                          <span className="d-flex align-items-center gap-1 bg-white border px-2 py-1 rounded">
                            <BedDouble size={12} className="text-warning" /> {room.bed_type || 'King Bed'}
                          </span>
                          <span className="d-flex align-items-center gap-1 bg-white border px-2 py-1 rounded">
                            <Users size={12} className="text-warning" /> Max {room.max_occupancy || 3} Guests
                          </span>
                          {room.view_type && (
                            <span className="d-flex align-items-center gap-1 bg-white border px-2 py-1 rounded">
                              <Compass size={12} className="text-warning" /> {room.view_type}
                            </span>
                          )}
                        </div>

                        {/* Room Amenities Highlights */}
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

                      {/* Right: Meal Plan & Rate Plans Selection */}
                      <div className="col-12 col-lg-8 p-3 p-md-4 d-flex flex-column justify-content-between">
                        <div>
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="fw-bold text-dark text-uppercase text-xs tracking-wider mb-0 font-heading">
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
                                      ? 'border-warning bg-warning bg-opacity-10 shadow-sm' 
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

                                        {/* Cancellation Policy */}
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
                                      <div className="fw-black fs-5 text-dark font-heading">
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

                        {/* Room Card Bottom Action: Clear Select Room Button */}
                        <div className="pt-3 mt-3 border-top d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
                          <div className="text-muted text-xs">
                            Selected Plan: <strong className="text-dark">{currentSelectedPlan?.name || 'EP Room Only'}</strong> ({nights} {nights === 1 ? 'Night' : 'Nights'})
                          </div>

                          <button 
                            type="button"
                            disabled={isRoomSoldOut}
                            onClick={() => handleReserveRoom(room, currentSelectedPlan)}
                            className={`btn ${isRoomSoldOut ? 'btn-secondary' : isCraftMyTrip ? 'btn-primary' : 'btn-warning text-dark'} rounded-pill px-4 py-2.5 fw-bold text-xs d-flex align-items-center gap-2 shadow-sm font-heading hover-scale`}
                            style={isCraftMyTrip && !isRoomSoldOut ? { background: '#FF6333', borderColor: '#FF6333', color: '#FFFFFF' } : {}}
                          >
                            {isRoomSoldOut ? (
                              <span>Sold Out for Dates</span>
                            ) : (
                              <>
                                <span>{actionLabel || 'Select Room & Book'}</span>
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

        {/* ─── 7. GUEST REVIEWS FULL SECTION ─── */}
        <div className="bg-white rounded-4 shadow-sm p-4 mb-4 border" style={{ borderColor: '#E2E8F0' }}>
          <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
            <div>
              <div className="d-flex align-items-center gap-2">
                <MessageSquare size={20} className="text-warning" />
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
                          <div className="bg-dark text-white rounded-circle d-flex align-items-center justify-content-center fw-bold text-xs" style={{ width: '32px', height: '32px' }}>
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

      {/* ─── 8. INTERACTIVE LOCATION & MAP MODAL ─── */}
      {mapModalOpen && (
        <div className="position-fixed inset-0 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1060, top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="bg-white rounded-4 shadow-lg overflow-hidden w-100 max-w-4xl border" style={{ maxWidth: '900px', height: '85vh' }}>
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-light">
              <div className="d-flex align-items-center gap-2">
                <MapPin size={20} className="text-warning" />
                <div>
                  <h5 className="fw-bold text-dark mb-0 font-heading">{hotel.name} Location</h5>
                  <span className="text-muted text-xs">{hotel.address ? `${hotel.address}, ` : ''}{hotel.area || hotel.location || 'Goa, India'}</span>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapSearchQuery)}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn btn-outline-dark btn-sm rounded-pill text-xs fw-bold d-flex align-items-center gap-1"
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

      {/* ─── 9. FULL PHOTO GALLERY & LIGHTBOX MODAL ─── */}
      {galleryOpen && (
        <div 
          className="position-fixed d-flex flex-column" 
          style={{ 
            zIndex: 1070, 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            width: '100vw', 
            height: '100vh', 
            backgroundColor: 'rgba(15, 23, 42, 0.97)', 
            backdropFilter: 'blur(10px)' 
          }}
        >
          {/* Gallery Modal Top Bar */}
          <div className="d-flex flex-wrap justify-content-between align-items-center p-3 text-white border-bottom border-secondary bg-dark bg-opacity-75">
            <div className="d-flex flex-wrap align-items-center gap-2 gap-sm-3">
              <h5 className="mb-0 fw-bold font-heading text-truncate" style={{ maxWidth: '280px' }}>{hotel.name} Gallery</h5>
              <div className="btn-group rounded-pill p-1 bg-secondary bg-opacity-25">
                <button 
                  type="button" 
                  onClick={() => setGalleryTab('all')}
                  className={`btn btn-sm rounded-pill px-3 fw-bold text-xs ${galleryTab === 'all' ? 'btn-warning text-dark' : 'text-white'}`}
                >
                  All Photos ({allGalleryItems.length})
                </button>
                <button 
                  type="button" 
                  onClick={() => setGalleryTab('property')}
                  className={`btn btn-sm rounded-pill px-3 fw-bold text-xs ${galleryTab === 'property' ? 'btn-warning text-dark' : 'text-white'}`}
                >
                  Property ({propertyImages.length})
                </button>
                <button 
                  type="button" 
                  onClick={() => setGalleryTab('rooms')}
                  className={`btn btn-sm rounded-pill px-3 fw-bold text-xs ${galleryTab === 'rooms' ? 'btn-warning text-dark' : 'text-white'}`}
                >
                  Rooms ({roomGalleryItems.length})
                </button>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setGalleryOpen(false)} 
              className="btn btn-outline-light rounded-circle p-2 d-flex align-items-center justify-content-center"
              title="Close Gallery (Esc)"
            >
              <X size={20} />
            </button>
          </div>

          {/* Gallery Content Grid */}
          <div className="flex-fill overflow-auto p-3 p-md-4">
            <div className="container-fluid" style={{ maxWidth: '1400px' }}>
              {currentGalleryList.length === 0 ? (
                <div className="text-center py-5 text-white-50">
                  <BedDouble size={48} className="mb-2 opacity-50" />
                  <h5>No Photos in this Section</h5>
                  <p className="text-xs">Select &quot;All Photos&quot; to see all uploaded property and room pictures.</p>
                </div>
              ) : (
                <div className="row g-3">
                  {currentGalleryList.map((item, idx) => (
                    <div key={idx} className="col-12 col-sm-6 col-md-4 col-lg-3">
                      <div 
                        className="rounded-3 overflow-hidden shadow cursor-pointer hover-scale border border-secondary border-opacity-50 position-relative"
                        style={{ height: '240px', backgroundColor: '#0f172a' }}
                        onClick={() => openLightbox(idx)}
                      >
                        <img 
                          src={item.url} 
                          alt={item.caption || `${hotel.name} Photo ${idx + 1}`} 
                          className="w-100 h-100 object-fit-cover transition"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
                          }}
                        />

                        {/* Top Category Badge */}
                        <div className="position-absolute top-0 start-0 m-2">
                          <span className={`badge ${item.category === 'property' ? 'bg-dark bg-opacity-80 text-warning border border-warning border-opacity-40' : 'bg-primary bg-opacity-90 text-white'} text-xxs px-2 py-1 rounded-pill shadow-sm`}>
                            {item.category === 'property' ? '🏨 Property' : `🛏️ ${item.roomName}`}
                          </span>
                        </div>

                        {/* Bottom Information Overlay */}
                        <div className="position-absolute bottom-0 start-0 end-0 p-2.5 text-white bg-dark bg-opacity-80 d-flex justify-content-between align-items-center text-xxs">
                          <span className="text-truncate me-2 fw-medium">{item.caption || item.roomName}</span>
                          <span className="badge bg-secondary bg-opacity-60 text-white text-xxs d-flex align-items-center gap-1">
                            <Maximize2 size={10} /> Full Photo
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── 10. LIGHTBOX FULLSCREEN PREVIEW WITH NAVIGATION & THUMBNAILS ─── */}
      {activeLightboxImg && (
        <div 
          className="position-fixed d-flex flex-column align-items-center justify-content-between p-3" 
          style={{ 
            zIndex: 1080, 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            width: '100vw', 
            height: '100vh', 
            backgroundColor: 'rgba(0, 0, 0, 0.96)', 
            backdropFilter: 'blur(12px)' 
          }}
          onClick={() => setActiveLightboxImg(null)}
        >
          {/* Lightbox Header Bar */}
          <div 
            className="w-100 d-flex justify-content-between align-items-center px-3 py-2 text-white" 
            style={{ zIndex: 1090 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-warning text-dark fw-bold px-2.5 py-1 text-xs rounded-pill">
                Photo {activeLightboxIdx + 1} of {currentGalleryList.length}
              </span>
              <span className="text-white-50 text-xs d-none d-sm-inline">
                {currentGalleryList[activeLightboxIdx]?.caption || currentGalleryList[activeLightboxIdx]?.roomName}
              </span>
            </div>
            <button 
              type="button" 
              onClick={() => setActiveLightboxImg(null)} 
              className="btn btn-outline-light rounded-circle p-2 d-flex align-items-center justify-content-center"
              title="Close Fullscreen (Esc)"
            >
              <X size={22} />
            </button>
          </div>

          {/* Main Photo with Previous / Next Arrows */}
          <div 
            className="position-relative d-flex align-items-center justify-content-center flex-fill w-100 my-2" 
            style={{ overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            {currentGalleryList.length > 1 && (
              <button 
                type="button"
                onClick={prevLightboxImg}
                className="position-absolute start-0 ms-2 ms-md-4 btn btn-dark bg-opacity-75 text-white rounded-circle p-3 d-flex align-items-center justify-content-center border border-white border-opacity-25 hover-scale shadow"
                style={{ zIndex: 1090 }}
                title="Previous Photo (Left Arrow)"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            <img 
              src={activeLightboxImg} 
              alt={currentGalleryList[activeLightboxIdx]?.caption || "Fullscreen Preview"} 
              className="rounded-3 shadow-lg"
              style={{ 
                maxHeight: '75vh', 
                maxWidth: '85vw', 
                objectFit: 'contain',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
              }}
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';
              }}
            />

            {currentGalleryList.length > 1 && (
              <button 
                type="button"
                onClick={nextLightboxImg}
                className="position-absolute end-0 me-2 me-md-4 btn btn-dark bg-opacity-75 text-white rounded-circle p-3 d-flex align-items-center justify-content-center border border-white border-opacity-25 hover-scale shadow"
                style={{ zIndex: 1090 }}
                title="Next Photo (Right Arrow)"
              >
                <ChevronRight size={28} />
              </button>
            )}
          </div>

          {/* Bottom Thumbnail Strip */}
          {currentGalleryList.length > 1 && (
            <div 
              className="d-flex align-items-center gap-2 overflow-auto py-2 px-3 w-100 justify-content-center" 
              style={{ maxHeight: '70px', zIndex: 1090 }}
              onClick={(e) => e.stopPropagation()}
            >
              {currentGalleryList.map((thumb, tIdx) => (
                <button
                  key={tIdx}
                  type="button"
                  onClick={() => openLightbox(tIdx)}
                  className={`border-0 p-0 rounded-2 overflow-hidden transition-all flex-shrink-0 ${tIdx === activeLightboxIdx ? 'ring-2' : 'opacity-50'}`}
                  style={{ 
                    width: '60px', 
                    height: '42px', 
                    cursor: 'pointer',
                    outline: tIdx === activeLightboxIdx ? '2px solid #F59E0B' : 'none',
                    opacity: tIdx === activeLightboxIdx ? 1 : 0.5
                  }}
                >
                  <img src={thumb.url} alt="" className="w-100 h-100 object-fit-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── 11. MOBILE STICKY BOTTOM BAR ─── */}
      <div 
        className="d-lg-none fixed-bottom bg-white border-top px-4 py-3 shadow-lg d-flex justify-content-between align-items-center"
        style={{ zIndex: 1010 }}
      >
        <div>
          <span className="text-muted text-xxs d-block">Starting from ({nights} {nights === 1 ? 'night' : 'nights'})</span>
          <div className="fw-black font-heading fs-5 mb-0" style={{ color: '#FF6333' }}>
            ₹{(basePricePerNight * nights).toLocaleString('en-IN')}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (roomTypes.length > 0) {
              const r = roomTypes.find(rt => rt.id === selectedRoomId) || roomTypes[0];
              const pId = selectedPlanByRoom[r?.id] || (r?.rate_plans && r.rate_plans[0]?.id);
              const p = (r?.rate_plans || []).find(plan => plan.id === pId) || (r?.rate_plans && r.rate_plans[0]);
              handleReserveRoom(r, p);
            } else {
              handleReserveRoom(null, null);
            }
          }}
          className="btn btn-primary rounded-pill px-4 py-2 fw-bold d-flex align-items-center gap-1.5 shadow-sm font-heading hover-scale"
          style={{ background: '#FF6333', borderColor: '#FF6333', color: '#FFFFFF' }}
        >
          <span>{actionLabel || (roomTypes.length > 0 ? 'Select Room & Book' : 'Select Hotel')}</span>
          <ChevronRight size={16} />
        </button>
      </div>

    </div>
  );
}
