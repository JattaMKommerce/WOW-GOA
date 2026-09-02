import React, { useState, useEffect, useRef } from 'react';
import { 
  Car, 
  Hotel, 
  MapPin, 
  Compass, 
  ChevronDown, 
  Wand2, 
  Calendar as CalendarIcon, 
  Users, 
  SlidersHorizontal, 
  X, 
  Check, 
  Navigation, 
  Loader2, 
  Search as SearchIcon, 
  ChevronLeft,
  ChevronRight,
  Plane,
  AlertCircle
} from 'lucide-react';
import { getTodayDateStr, getNextDayDateStr, validateBookingDates } from '../utils/dateUtils';

// ─── STATIC DATASETS ──────────────────────────────────────────────────────────

const POPULAR_FROM_CITIES = [
  { city: 'Hubli', state: 'Karnataka', country: 'India', code: 'HBX' },
  { city: 'Bengaluru', state: 'Karnataka', country: 'India', code: 'BLR' },
  { city: 'Mumbai', state: 'Maharashtra', country: 'India', code: 'BOM' },
  { city: 'Delhi', state: 'Delhi NCR', country: 'India', code: 'DEL' },
  { city: 'Hyderabad', state: 'Telangana', country: 'India', code: 'HYD' },
  { city: 'Pune', state: 'Maharashtra', country: 'India', code: 'PNQ' },
  { city: 'Goa', state: 'Goa', country: 'India', code: 'GOI' },
  { city: 'Chennai', state: 'Tamil Nadu', country: 'India', code: 'MAA' },
  { city: 'Kolkata', state: 'West Bengal', country: 'India', code: 'CCU' },
  { city: 'Ahmedabad', state: 'Gujarat', country: 'India', code: 'AMD' },
  { city: 'Jaipur', state: 'Rajasthan', country: 'India', code: 'JAI' },
  { city: 'Kochi', state: 'Kerala', country: 'India', code: 'COK' }
];

const POPULAR_DESTINATIONS = [
  { name: 'Goa', country: 'India', tag: 'Sun, Sand & Beach', category: 'Beach', icon: '🏖️' },
  { name: 'Dubai', country: 'UAE', tag: 'Luxury & Skyline', category: 'International', icon: '🏙️' },
  { name: 'Bali', country: 'Indonesia', tag: 'Tropical & Culture', category: 'International', icon: '🌴' },
  { name: 'Maldives', country: 'Maldives', tag: 'Water Villas & Romance', category: 'Honeymoon', icon: '🌊' },
  { name: 'Paris', country: 'France', tag: 'Romance & Heritage', category: 'International', icon: '🗼' },
  { name: 'Thailand', country: 'Thailand', tag: 'Islands & Nightlife', category: 'International', icon: '🏝️' },
  { name: 'Manali', country: 'Himachal Pradesh, India', tag: 'Snow & Mountains', category: 'Hill Station', icon: '🏔️' },
  { name: 'Kerala', country: 'India', tag: 'Backwaters & Nature', category: 'Nature', icon: '🛶' },
  { name: 'Kashmir', country: 'India', tag: 'Valleys & Lakes', category: 'Honeymoon', icon: '⛷️' },
  { name: 'Rajasthan', country: 'India', tag: 'Palaces & Royalty', category: 'Heritage', icon: '🏰' },
  { name: 'Ladakh', country: 'India', tag: 'High Passes & Adventure', category: 'Adventure', icon: '🏍️' }
];

const AIRPORTS_DATA = [
  { code: 'GOI', name: 'Dabolim Airport', city: 'Goa', country: 'India' },
  { code: 'GOX', name: 'Manohar Intl Airport (Mopa)', city: 'Goa', country: 'India' },
  { code: 'DEL', name: 'Indira Gandhi Intl', city: 'New Delhi', country: 'India' },
  { code: 'BOM', name: 'Chhatrapati Shivaji Intl', city: 'Mumbai', country: 'India' },
  { code: 'BLR', name: 'Kempegowda Intl', city: 'Bengaluru', country: 'India' },
  { code: 'HYD', name: 'Rajiv Gandhi Intl', city: 'Hyderabad', country: 'India' },
  { code: 'MAA', name: 'Chennai Intl', city: 'Chennai', country: 'India' },
  { code: 'CCU', name: 'Netaji Subhash Chandra Bose', city: 'Kolkata', country: 'India' },
  { code: 'PNQ', name: 'Pune Airport', city: 'Pune', country: 'India' },
  { code: 'AMD', name: 'Sardar Vallabhbhai Patel', city: 'Ahmedabad', country: 'India' },
  { code: 'COK', name: 'Cochin Intl', city: 'Kochi', country: 'India' },
  { code: 'DXB', name: 'Dubai Intl', city: 'Dubai', country: 'UAE' },
  { code: 'DPS', name: 'Ngurah Rai Intl', city: 'Bali', country: 'Indonesia' },
  { code: 'MLE', name: 'Velana Intl', city: 'Maldives', country: 'Maldives' }
];

const TRAVEL_CATEGORIES = [
  { id: 'beach', label: 'Beach & Islands', icon: '🏖️' },
  { id: 'hills', label: 'Hill Stations', icon: '🏔️' },
  { id: 'honeymoon', label: 'Honeymoon & Romance', icon: '💍' },
  { id: 'adventure', label: 'Adventure & Wildlife', icon: '🧗' },
  { id: 'heritage', label: 'Heritage & Culture', icon: '🏰' },
  { id: 'luxury', label: 'Luxury Escapes', icon: '✨' }
];

// ─── MAIN SEARCH WIDGET COMPONENT ─────────────────────────────────────────────

export default function SearchWidget({
  activeTab,
  setActiveTab,
  pickupLoc,
  setPickupLoc,
  dropLoc,
  setDropLoc,
  pickupDate,
  setPickupDate,
  dropDate,
  setDropDate,
  pickupTime,
  setPickupTime,
  dropTime,
  setDropTime,
  handleSearchSubmit,
  setSearchTriggered,
  searchQuery,
  setSearchQuery,
  hotelRooms = 1,
  setHotelRooms,
  hotelAdults = 2,
  setHotelAdults,
  hotelChildren = 0,
  setHotelChildren,
  hotelPriceRange,
  setHotelPriceRange,
  flightAdults = 1,
  setFlightAdults,
  flightChildren = 0,
  setFlightChildren,
  flightInfants = 0,
  setFlightInfants,
  flightClass = 'economy',
  setFlightClass,
  appliedFilters = {},
  setAppliedFilters
}) {
  // Popover state: 'from' | 'to' | 'date-pickup' | 'date-drop' | 'guests' | 'filters' | 'flight-from' | 'flight-to' | 'passengers' | null
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Geolocation & Status
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState(null);
  const [validationError, setValidationError] = useState('');

  // Child ages state
  const [childAges, setChildAges] = useState([]);

  // Search input strings within popovers
  const [fromSearchQuery, setFromSearchQuery] = useState('');
  const [toSearchQuery, setToSearchQuery] = useState('');
  const [flightFromSearch, setFlightFromSearch] = useState('');
  const [flightToSearch, setFlightToSearch] = useState('');

  // Local filter states
  const [localFilters, setLocalFilters] = useState({
    priceRanges: appliedFilters?.priceRanges || [],
    hotelStars: appliedFilters?.hotelStars || [],
    tripTypes: appliedFilters?.tripTypes || [],
    durations: appliedFilters?.durations || [],
    inclusions: appliedFilters?.inclusions || []
  });

  const widgetRef = useRef(null);
  const todayStr = getTodayDateStr();
  const minCheckOutDate = getNextDayDateStr(pickupDate || todayStr);

  // Auto-init dates on mount if missing
  useEffect(() => {
    if (!pickupDate) {
      setPickupDate(todayStr);
    }
    if (!dropDate) {
      setDropDate(getNextDayDateStr(pickupDate || todayStr));
    }
  }, []);

  // Sync appliedFilters
  useEffect(() => {
    if (appliedFilters) {
      setLocalFilters({
        priceRanges: appliedFilters.priceRanges || [],
        hotelStars: appliedFilters.hotelStars || [],
        tripTypes: appliedFilters.tripTypes || [],
        durations: appliedFilters.durations || [],
        inclusions: appliedFilters.inclusions || []
      });
    }
  }, [appliedFilters]);

  // Click outside and Escape key handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // ─── GEOLOCATION DETECTION ──────────────────────────────────────────────────
  const handleUseCurrentLocation = (targetField = 'pickup') => {
    if (!navigator.geolocation) {
      setLocationStatus({
        type: 'error',
        msg: 'Geolocation is not supported by your browser.'
      });
      return;
    }

    setIsLocating(true);
    setLocationStatus(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            const address = data.address || {};
            const detectedCity = address.city || address.town || address.village || address.state_district || address.county || 'Goa';
            
            if (targetField === 'pickup') {
              setPickupLoc(detectedCity);
            } else {
              setDropLoc(detectedCity);
            }

            setLocationStatus({
              type: 'success',
              msg: `Detected: ${detectedCity}`
            });
            setTimeout(() => {
              setActiveDropdown(null);
              setLocationStatus(null);
            }, 1000);
          } else {
            throw new Error('Reverse geocoding failed');
          }
        } catch {
          const fallbackCity = 'Goa';
          if (targetField === 'pickup') setPickupLoc(fallbackCity);
          else setDropLoc(fallbackCity);
          
          setLocationStatus({
            type: 'success',
            msg: 'Location set to Goa, India'
          });
          setTimeout(() => {
            setActiveDropdown(null);
            setLocationStatus(null);
          }, 1000);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setLocationStatus({
            type: 'denied',
            msg: 'Location access was denied. Please choose manually.'
          });
        } else {
          setLocationStatus({
            type: 'error',
            msg: 'Could not detect location. Please choose manually.'
          });
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // ─── CHILDREN AGE HANDLER ───────────────────────────────────────────────────
  const handleChildrenCountChange = (newCount) => {
    const validCount = Math.max(0, newCount);
    if (setHotelChildren) setHotelChildren(validCount);
    const updatedAges = Array.from({ length: validCount }, (_, i) => childAges[i] !== undefined ? childAges[i] : 5);
    setChildAges(updatedAges);
  };

  const handleChildAgeChange = (index, ageVal) => {
    const updated = [...childAges];
    updated[index] = parseInt(ageVal, 10);
    setChildAges(updated);
  };

  // ─── FORM SUBMIT & VALIDATION ───────────────────────────────────────────────
  const onWidgetFormSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setValidationError('');

    if (activeTab === 'hotels' || activeTab === 'packages' || activeTab === 'craftmytrip') {
      const val = validateBookingDates(pickupDate, dropDate, { allowSameDay: false });
      if (!val.valid) {
        setValidationError(val.error);
        return;
      }
    } else if (activeTab === 'selfdrive') {
      const val = validateBookingDates(pickupDate, dropDate, { allowSameDay: true });
      if (!val.valid) {
        setValidationError(val.error);
        return;
      }
    } else if (activeTab === 'flights') {
      if (!pickupDate || pickupDate < todayStr) {
        setValidationError('Flight departure date cannot be in the past.');
        return;
      }
    }

    if (setAppliedFilters) {
      setAppliedFilters(localFilters);
    }

    if (setSearchTriggered) {
      setSearchTriggered(true);
    }

    if (handleSearchSubmit) {
      handleSearchSubmit(activeTab);
    }

    // Auto-scroll to results
    setTimeout(() => {
      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Date displays
  const parsedPickup = pickupDate ? new Date(pickupDate) : new Date();
  const validPickupObj = isNaN(parsedPickup.getTime()) ? new Date() : parsedPickup;
  const displayPickupDay = validPickupObj.getDate();
  const displayPickupMonthYear = validPickupObj.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  const displayPickupWeekday = validPickupObj.toLocaleString('en-US', { weekday: 'long' });

  const parsedDrop = dropDate ? new Date(dropDate) : new Date();
  const validDropObj = isNaN(parsedDrop.getTime()) ? new Date() : parsedDrop;
  const displayDropDay = validDropObj.getDate();
  const displayDropMonthYear = validDropObj.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  const displayDropWeekday = validDropObj.toLocaleString('en-US', { weekday: 'long' });

  const totalAppliedCount = 
    (localFilters?.priceRanges?.length || 0) +
    (localFilters?.hotelStars?.length || 0) +
    (localFilters?.tripTypes?.length || 0) +
    (localFilters?.durations?.length || 0) +
    (localFilters?.inclusions?.length || 0);

  const totalPassengers = (flightAdults || 1) + (flightChildren || 0) + (flightInfants || 0);

  return (
    <div className="container booking-widget-wrapper" ref={widgetRef}>
      <div className="booking-widget-card">
        
        {/* ─── BOOKING TYPE TABS ────────────────────────────────────────────── */}
        <div className="widget-tabs" role="tablist">
          <button 
            type="button" 
            role="tab"
            aria-selected={activeTab === 'selfdrive'}
            className={`widget-tab-btn ${activeTab === 'selfdrive' ? 'active' : ''}`}
            onClick={() => { setActiveTab('selfdrive'); setActiveDropdown(null); setValidationError(''); }}
          >
            <Car />
            <span>Self Drive Holidays</span>
          </button>
          <button 
            type="button" 
            role="tab"
            aria-selected={activeTab === 'packages'}
            className={`widget-tab-btn ${activeTab === 'packages' ? 'active' : ''}`}
            onClick={() => { setActiveTab('packages'); setActiveDropdown(null); setValidationError(''); }}
          >
            <Compass />
            <span>Trip Packages</span>
          </button>
          <button 
            type="button" 
            role="tab"
            aria-selected={activeTab === 'hotels'}
            className={`widget-tab-btn ${activeTab === 'hotels' ? 'active' : ''}`}
            onClick={() => { setActiveTab('hotels'); setActiveDropdown(null); setValidationError(''); }}
          >
            <Hotel />
            <span>Hotels</span>
          </button>
          <button 
            type="button" 
            role="tab"
            aria-selected={activeTab === 'flights'}
            className={`widget-tab-btn ${activeTab === 'flights' ? 'active' : ''}`}
            onClick={() => { setActiveTab('flights'); setActiveDropdown(null); setValidationError(''); }}
          >
            <Plane />
            <span>Flights</span>
          </button>
          <button 
            type="button" 
            role="tab"
            aria-selected={activeTab === 'craftmytrip'}
            className={`widget-tab-btn craft-tab ${activeTab === 'craftmytrip' ? 'active' : ''}`}
            onClick={() => { setActiveTab('craftmytrip'); setSearchTriggered(true); }}
          >
            <Wand2 />
            <span>Craft My Trip ✨</span>
          </button>
        </div>

        {/* ─── INLINE VALIDATION TOAST ──────────────────────────────────────── */}
        {validationError && (
          <div className="tg-validation-toast d-flex align-items-center justify-content-between p-3" style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
            <div className="d-flex align-items-center gap-2">
              <AlertCircle size={18} className="text-danger flex-shrink-0" />
              <span className="text-danger fw-semibold small">{validationError}</span>
            </div>
            <button type="button" className="btn btn-sm btn-link p-0 text-muted" onClick={() => setValidationError('')}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* ─── TAB-SPECIFIC SEARCH FORMS ────────────────────────────────────── */}
        <form onSubmit={onWidgetFormSubmit} className="p-3 position-relative">
          
          {/* ──────────────────────────────────────────────────────────────────
              TAB: HOTELS
          ────────────────────────────────────────────────────────────────── */}
          {activeTab === 'hotels' ? (
            <div className="booking-inputs-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              
              {/* Hotel Field 1: Destination / Location */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'hotel-loc' ? null : 'hotel-loc')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>City or Hotel Name</span>
                  <ChevronDown size={14} />
                </span>
                <div className="input-block-val">{pickupLoc && !['Hubli', 'Bengaluru', 'Mumbai', 'DEL', 'BLR', 'BOM', 'HYD', 'MAA', 'CCU', 'PNQ', 'AMD', 'COK', 'JAI', 'HBX'].includes(pickupLoc) ? pickupLoc : (dropLoc || 'Goa')}</div>
                <span className="input-block-sub">India</span>

                {activeDropdown === 'hotel-loc' && (
                  <div className="tg-popover-card shadow-xl p-3" onClick={e => e.stopPropagation()}>
                    <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom">
                      <span className="fw-bold text-dark small"><MapPin size={14} className="text-primary me-1" /> Destination / Area</span>
                      <button type="button" className="btn btn-sm btn-link p-0 text-muted" onClick={() => setActiveDropdown(null)}><X size={16} /></button>
                    </div>

                    <div className="position-relative mb-2">
                      <SearchIcon size={16} className="position-absolute text-muted" style={{ top: '10px', left: '10px' }} />
                      <input 
                        type="text" 
                        className="form-control form-control-sm ps-4" 
                        placeholder="Search Goa, Calangute, Baga..." 
                        value={pickupLoc && !['Hubli', 'Bengaluru', 'Mumbai', 'DEL', 'BLR', 'BOM', 'HYD', 'MAA', 'CCU', 'PNQ', 'AMD', 'COK', 'JAI', 'HBX'].includes(pickupLoc) ? pickupLoc : ''} 
                        onChange={e => { setPickupLoc(e.target.value); setDropLoc(e.target.value); }} 
                        autoFocus 
                      />
                    </div>

                    <button
                      type="button"
                      className="btn btn-light w-100 text-start d-flex align-items-center gap-2 p-2 rounded-2 mb-2"
                      style={{ background: '#fff7ed', color: '#c2410c' }}
                      onClick={() => handleUseCurrentLocation('pickup')}
                      disabled={isLocating}
                    >
                      {isLocating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                      <span className="fw-bold small">{isLocating ? 'Detecting...' : '📍 Use Current Location'}</span>
                    </button>

                    {locationStatus && (
                      <div className={`p-2 rounded small mb-2 ${locationStatus.type === 'error' || locationStatus.type === 'denied' ? 'bg-danger bg-opacity-10 text-danger' : 'bg-success bg-opacity-10 text-success'}`}>
                        {locationStatus.msg}
                      </div>
                    )}

                    <div className="text-muted small fw-bold mb-1">Popular Goa Areas</div>
                    <div className="d-flex flex-wrap gap-1">
                      {['All Goa', 'Calangute', 'Baga', 'Candolim', 'Panaji', 'Anjuna', 'Vagator', 'South Goa'].map(area => (
                        <button
                          key={area}
                          type="button"
                          className="btn btn-sm btn-outline-secondary rounded-pill py-0 px-2"
                          style={{ fontSize: '12px' }}
                          onClick={() => { setPickupLoc(area); setDropLoc(area); setActiveDropdown(null); }}
                        >
                          {area}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Hotel Field 2: Check-in Date */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'hotel-checkin' ? null : 'hotel-checkin')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>Check-in Date</span>
                  <ChevronDown size={14} />
                </span>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <span className="fw-black text-dark" style={{ fontSize: '26px', lineHeight: '1' }}>{displayPickupDay}</span>
                  <span className="text-dark fw-bold" style={{ fontSize: '15px' }}>{displayPickupMonthYear}</span>
                </div>
                <span className="input-block-sub">{displayPickupWeekday}</span>

                {activeDropdown === 'hotel-checkin' && (
                  <div className="tg-popover-card shadow-xl" onClick={e => e.stopPropagation()}>
                    <CalendarPickerView
                      title="Select Check-in Date"
                      selectedDate={pickupDate}
                      minDate={todayStr}
                      onSelect={(d) => {
                        setPickupDate(d);
                        if (!dropDate || dropDate <= d) {
                          setDropDate(getNextDayDateStr(d));
                        }
                        setActiveDropdown('hotel-checkout');
                      }}
                      onClose={() => setActiveDropdown(null)}
                    />
                  </div>
                )}
              </div>

              {/* Hotel Field 3: Check-out Date */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'hotel-checkout' ? null : 'hotel-checkout')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>Check-out Date</span>
                  <ChevronDown size={14} />
                </span>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <span className="fw-black text-dark" style={{ fontSize: '26px', lineHeight: '1' }}>{displayDropDay}</span>
                  <span className="text-dark fw-bold" style={{ fontSize: '15px' }}>{displayDropMonthYear}</span>
                </div>
                <span className="input-block-sub">{displayDropWeekday}</span>

                {activeDropdown === 'hotel-checkout' && (
                  <div className="tg-popover-card shadow-xl" onClick={e => e.stopPropagation()}>
                    <CalendarPickerView
                      title="Select Check-out Date"
                      selectedDate={dropDate}
                      minDate={minCheckOutDate}
                      onSelect={(d) => {
                        setDropDate(d);
                        setActiveDropdown(null);
                      }}
                      onClose={() => setActiveDropdown(null)}
                    />
                  </div>
                )}
              </div>

              {/* Hotel Field 4: Rooms & Guests */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'hotel-guests' ? null : 'hotel-guests')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>Rooms & Guests</span>
                  <ChevronDown size={14} />
                </span>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <span className="fw-black text-dark" style={{ fontSize: '26px', lineHeight: '1' }}>{hotelAdults || 2}</span>
                  <span className="text-dark fw-bold" style={{ fontSize: '15px' }}>
                    Adults {hotelChildren > 0 ? `· ${hotelChildren} Ch` : ''}
                  </span>
                </div>
                <span className="input-block-sub">{hotelRooms || 1} Room{(hotelRooms || 1) > 1 ? 's' : ''}</span>

                {activeDropdown === 'hotel-guests' && (
                  <div className="tg-popover-card shadow-xl p-3" onClick={e => e.stopPropagation()}>
                    <RoomsGuestsPopoverContent
                      rooms={hotelRooms}
                      setRooms={setHotelRooms}
                      adults={hotelAdults}
                      setAdults={setHotelAdults}
                      childrenCount={hotelChildren}
                      onChildrenChange={handleChildrenCountChange}
                      childAges={childAges}
                      onChildAgeChange={handleChildAgeChange}
                      onDone={() => setActiveDropdown(null)}
                    />
                  </div>
                )}
              </div>

            </div>
          ) : activeTab === 'flights' ? (
            /* ──────────────────────────────────────────────────────────────────
                TAB: FLIGHTS
            ────────────────────────────────────────────────────────────────── */
            <div className="booking-inputs-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              
              {/* Flight Field 1: FROM Airport */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'flight-from' ? null : 'flight-from')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>FROM (Airport)</span>
                  <ChevronDown size={14} />
                </span>
                <div className="input-block-val">{pickupLoc || 'DEL'}</div>
                <span className="input-block-sub">
                  {AIRPORTS_DATA.find(a => a.code === pickupLoc)?.city || 'New Delhi'}
                </span>

                {activeDropdown === 'flight-from' && (
                  <div className="tg-popover-card shadow-xl p-3" onClick={e => e.stopPropagation()}>
                    <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom">
                      <span className="fw-bold text-dark small"><Plane size={14} className="text-primary me-1" /> Departure Airport</span>
                      <button type="button" className="btn btn-sm btn-link p-0 text-muted" onClick={() => setActiveDropdown(null)}><X size={16} /></button>
                    </div>

                    <div className="position-relative mb-2">
                      <SearchIcon size={16} className="position-absolute text-muted" style={{ top: '10px', left: '10px' }} />
                      <input 
                        type="text" 
                        className="form-control form-control-sm ps-4" 
                        placeholder="Search city or IATA code e.g. DEL, BOM..." 
                        value={flightFromSearch} 
                        onChange={e => setFlightFromSearch(e.target.value)} 
                        autoFocus 
                      />
                    </div>

                    <button
                      type="button"
                      className="btn btn-light w-100 text-start d-flex align-items-center gap-2 p-2 rounded-2 mb-2"
                      style={{ background: '#fff7ed', color: '#c2410c' }}
                      onClick={() => handleUseCurrentLocation('pickup')}
                      disabled={isLocating}
                    >
                      {isLocating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                      <span className="fw-bold small">{isLocating ? 'Detecting...' : '📍 Nearest Airport (GPS)'}</span>
                    </button>

                    <div className="tg-scroll-area">
                      {AIRPORTS_DATA.filter(a => 
                        a.code.toLowerCase().includes(flightFromSearch.toLowerCase()) || 
                        a.city.toLowerCase().includes(flightFromSearch.toLowerCase()) ||
                        a.name.toLowerCase().includes(flightFromSearch.toLowerCase())
                      ).map(a => (
                        <button
                          key={a.code}
                          type="button"
                          className="btn btn-light w-100 text-start p-2 d-flex justify-content-between align-items-center mb-1 border-0"
                          onClick={() => { setPickupLoc(a.code); setActiveDropdown('flight-to'); }}
                        >
                          <div>
                            <div className="fw-bold text-dark">{a.city} ({a.code})</div>
                            <div className="text-muted" style={{ fontSize: '11px' }}>{a.name}</div>
                          </div>
                          <span className="badge bg-secondary font-monospace">{a.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Flight Field 2: TO Airport */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'flight-to' ? null : 'flight-to')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>TO (Airport)</span>
                  <ChevronDown size={14} />
                </span>
                <div className="input-block-val">{dropLoc || 'GOI'}</div>
                <span className="input-block-sub">
                  {AIRPORTS_DATA.find(a => a.code === dropLoc)?.city || 'Goa, India'}
                </span>

                {activeDropdown === 'flight-to' && (
                  <div className="tg-popover-card shadow-xl p-3" onClick={e => e.stopPropagation()}>
                    <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom">
                      <span className="fw-bold text-dark small"><Plane size={14} className="text-primary me-1" /> Destination Airport</span>
                      <button type="button" className="btn btn-sm btn-link p-0 text-muted" onClick={() => setActiveDropdown(null)}><X size={16} /></button>
                    </div>

                    <div className="position-relative mb-2">
                      <SearchIcon size={16} className="position-absolute text-muted" style={{ top: '10px', left: '10px' }} />
                      <input 
                        type="text" 
                        className="form-control form-control-sm ps-4" 
                        placeholder="Search destination airport e.g. GOI, GOX..." 
                        value={flightToSearch} 
                        onChange={e => setFlightToSearch(e.target.value)} 
                        autoFocus 
                      />
                    </div>

                    <div className="tg-scroll-area">
                      {AIRPORTS_DATA.filter(a => 
                        a.code.toLowerCase().includes(flightToSearch.toLowerCase()) || 
                        a.city.toLowerCase().includes(flightToSearch.toLowerCase()) ||
                        a.name.toLowerCase().includes(flightToSearch.toLowerCase())
                      ).map(a => (
                        <button
                          key={a.code}
                          type="button"
                          className="btn btn-light w-100 text-start p-2 d-flex justify-content-between align-items-center mb-1 border-0"
                          onClick={() => { setDropLoc(a.code); setActiveDropdown(null); }}
                        >
                          <div>
                            <div className="fw-bold text-dark">{a.city} ({a.code})</div>
                            <div className="text-muted" style={{ fontSize: '11px' }}>{a.name}</div>
                          </div>
                          <span className="badge bg-secondary font-monospace">{a.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Flight Field 3: Departure Date */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'flight-date' ? null : 'flight-date')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>Travel Date</span>
                  <ChevronDown size={14} />
                </span>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <span className="fw-black text-dark" style={{ fontSize: '26px', lineHeight: '1' }}>{displayPickupDay}</span>
                  <span className="text-dark fw-bold" style={{ fontSize: '15px' }}>{displayPickupMonthYear}</span>
                </div>
                <span className="input-block-sub">{displayPickupWeekday}</span>

                {activeDropdown === 'flight-date' && (
                  <div className="tg-popover-card shadow-xl" onClick={e => e.stopPropagation()}>
                    <CalendarPickerView
                      title="Select Flight Travel Date"
                      selectedDate={pickupDate}
                      minDate={todayStr}
                      onSelect={(d) => {
                        setPickupDate(d);
                        setActiveDropdown(null);
                      }}
                      onClose={() => setActiveDropdown(null)}
                    />
                  </div>
                )}
              </div>

              {/* Flight Field 4: Passengers & Class */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'passengers' ? null : 'passengers')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>Passengers & Class</span>
                  <ChevronDown size={14} />
                </span>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <span className="fw-black text-dark" style={{ fontSize: '26px', lineHeight: '1' }}>{totalPassengers}</span>
                  <span className="text-dark fw-bold" style={{ fontSize: '15px' }}>
                    Passenger{totalPassengers > 1 ? 's' : ''}
                  </span>
                </div>
                <span className="input-block-sub text-capitalize">{flightClass || 'Economy'}</span>

                {activeDropdown === 'passengers' && (
                  <div className="tg-popover-card shadow-xl p-3" onClick={e => e.stopPropagation()}>
                    <FlightPassengersPopoverContent
                      adults={flightAdults}
                      setAdults={setFlightAdults}
                      childrenCount={flightChildren}
                      setChildren={setFlightChildren}
                      infants={flightInfants}
                      setInfants={setFlightInfants}
                      flightClass={flightClass}
                      setFlightClass={setFlightClass}
                      onDone={() => setActiveDropdown(null)}
                    />
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* ──────────────────────────────────────────────────────────────────
                TABS: TRIP PACKAGES & SELF DRIVE HOLIDAYS
            ────────────────────────────────────────────────────────────────── */
            <div className="booking-inputs-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
              
              {/* Field 1: From City */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'from' ? null : 'from')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>From City</span>
                  <ChevronDown size={14} />
                </span>
                <div className="input-block-val">{pickupLoc || 'Hubli'}</div>
                <span className="input-block-sub">India</span>

                {activeDropdown === 'from' && (
                  <div className="tg-popover-card shadow-xl p-3" onClick={e => e.stopPropagation()}>
                    <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom">
                      <span className="fw-bold text-dark small"><MapPin size={14} className="text-primary me-1" /> Departure City</span>
                      <button type="button" className="btn btn-sm btn-link p-0 text-muted" onClick={() => setActiveDropdown(null)}><X size={16} /></button>
                    </div>

                    <div className="position-relative mb-2">
                      <SearchIcon size={16} className="position-absolute text-muted" style={{ top: '10px', left: '10px' }} />
                      <input 
                        type="text" 
                        className="form-control form-control-sm ps-4" 
                        placeholder="Search departure city e.g. Bengaluru..." 
                        value={fromSearchQuery} 
                        onChange={e => setFromSearchQuery(e.target.value)} 
                        autoFocus 
                      />
                    </div>

                    <button
                      type="button"
                      className="btn btn-light w-100 text-start d-flex align-items-center gap-2 p-2 rounded-2 mb-2"
                      style={{ background: '#fff7ed', color: '#c2410c' }}
                      onClick={() => handleUseCurrentLocation('pickup')}
                      disabled={isLocating}
                    >
                      {isLocating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                      <span className="fw-bold small">{isLocating ? 'Detecting...' : '📍 Use Current Location (GPS)'}</span>
                    </button>

                    {locationStatus && (
                      <div className={`p-2 rounded small mb-2 ${locationStatus.type === 'error' || locationStatus.type === 'denied' ? 'bg-danger bg-opacity-10 text-danger' : 'bg-success bg-opacity-10 text-success'}`}>
                        {locationStatus.msg}
                      </div>
                    )}

                    <div className="text-muted small fw-bold mb-1">Popular Departure Cities</div>
                    <div className="tg-scroll-area">
                      {POPULAR_FROM_CITIES.filter(c => 
                        c.city.toLowerCase().includes(fromSearchQuery.toLowerCase()) || 
                        c.state.toLowerCase().includes(fromSearchQuery.toLowerCase())
                      ).map(c => (
                        <button
                          key={c.city}
                          type="button"
                          className="btn btn-light w-100 text-start p-2 d-flex justify-content-between align-items-center mb-1 border-0"
                          onClick={() => { setPickupLoc(c.city); setActiveDropdown('to'); }}
                        >
                          <div>
                            <div className="fw-bold text-dark">{c.city}</div>
                            <div className="text-muted" style={{ fontSize: '11px' }}>{c.state}, {c.country}</div>
                          </div>
                          <span className="badge bg-secondary font-monospace">{c.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Field 2: To Destination */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'to' ? null : 'to')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>To Destination</span>
                  <ChevronDown size={14} />
                </span>
                <div className="input-block-val">{dropLoc || 'Goa'}</div>
                <span className="input-block-sub">India</span>

                {activeDropdown === 'to' && (
                  <div className="tg-popover-card shadow-xl p-3" onClick={e => e.stopPropagation()}>
                    <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom">
                      <span className="fw-bold text-dark small"><Compass size={14} className="text-warning me-1" /> Destination / Theme</span>
                      <button type="button" className="btn btn-sm btn-link p-0 text-muted" onClick={() => setActiveDropdown(null)}><X size={16} /></button>
                    </div>

                    <div className="position-relative mb-2">
                      <SearchIcon size={16} className="position-absolute text-muted" style={{ top: '10px', left: '10px' }} />
                      <input 
                        type="text" 
                        className="form-control form-control-sm ps-4" 
                        placeholder="Search Goa, Dubai, Manali, Beach..." 
                        value={toSearchQuery} 
                        onChange={e => setToSearchQuery(e.target.value)} 
                        autoFocus 
                      />
                    </div>

                    {!toSearchQuery && (
                      <div className="mb-2">
                        <div className="text-muted small fw-bold mb-1">Travel Themes</div>
                        <div className="d-flex flex-wrap gap-1">
                          {TRAVEL_CATEGORIES.map(cat => (
                            <button
                              key={cat.id}
                              type="button"
                              className="btn btn-sm btn-outline-secondary rounded-pill py-0 px-2 bg-white"
                              style={{ fontSize: '11px' }}
                              onClick={() => { setDropLoc(cat.label.split('&')[0].trim()); setActiveDropdown(null); }}
                            >
                              <span>{cat.icon}</span> {cat.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-muted small fw-bold mb-1">Top Destinations</div>
                    <div className="tg-scroll-area">
                      {POPULAR_DESTINATIONS.filter(d => 
                        d.name.toLowerCase().includes(toSearchQuery.toLowerCase()) || 
                        d.country.toLowerCase().includes(toSearchQuery.toLowerCase()) ||
                        d.category.toLowerCase().includes(toSearchQuery.toLowerCase()) ||
                        d.tag.toLowerCase().includes(toSearchQuery.toLowerCase())
                      ).map(d => (
                        <button
                          key={d.name}
                          type="button"
                          className="btn btn-light w-100 text-start p-2 d-flex justify-content-between align-items-center mb-1 border-0"
                          onClick={() => { setDropLoc(d.name); setActiveDropdown(null); }}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <span style={{ fontSize: '18px' }}>{d.icon}</span>
                            <div>
                              <div className="fw-bold text-dark">{d.name}</div>
                              <div className="text-muted" style={{ fontSize: '11px' }}>{d.country} · {d.tag}</div>
                            </div>
                          </div>
                          <span className="badge bg-light text-muted small">{d.category}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Field 3: Departure Date */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'pkg-date' ? null : 'pkg-date')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>Departure Date</span>
                  <ChevronDown size={14} />
                </span>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <span className="fw-black text-dark" style={{ fontSize: '26px', lineHeight: '1' }}>{displayPickupDay}</span>
                  <span className="text-dark fw-bold" style={{ fontSize: '15px' }}>{displayPickupMonthYear}</span>
                </div>
                <span className="input-block-sub">{displayPickupWeekday}</span>

                {activeDropdown === 'pkg-date' && (
                  <div className="tg-popover-card shadow-xl" onClick={e => e.stopPropagation()}>
                    <CalendarPickerView
                      title="Select Departure Date"
                      selectedDate={pickupDate}
                      minDate={todayStr}
                      onSelect={(d) => {
                        setPickupDate(d);
                        if (!dropDate || dropDate <= d) {
                          setDropDate(getNextDayDateStr(d));
                        }
                        setActiveDropdown(null);
                      }}
                      onClose={() => setActiveDropdown(null)}
                    />
                  </div>
                )}
              </div>

              {/* Field 4: Rooms & Guests */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'pkg-guests' ? null : 'pkg-guests')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>Rooms & Guests</span>
                  <ChevronDown size={14} />
                </span>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <span className="fw-black text-dark" style={{ fontSize: '26px', lineHeight: '1' }}>{hotelAdults || 2}</span>
                  <span className="text-dark fw-bold" style={{ fontSize: '15px' }}>
                    Adults {hotelChildren > 0 ? `· ${hotelChildren} Ch` : ''}
                  </span>
                </div>
                <span className="input-block-sub">{hotelRooms || 1} Room{(hotelRooms || 1) > 1 ? 's' : ''}</span>

                {activeDropdown === 'pkg-guests' && (
                  <div className="tg-popover-card shadow-xl p-3" onClick={e => e.stopPropagation()}>
                    <RoomsGuestsPopoverContent
                      rooms={hotelRooms}
                      setRooms={setHotelRooms}
                      adults={hotelAdults}
                      setAdults={setHotelAdults}
                      childrenCount={hotelChildren}
                      onChildrenChange={handleChildrenCountChange}
                      childAges={childAges}
                      onChildAgeChange={handleChildAgeChange}
                      onDone={() => setActiveDropdown(null)}
                    />
                  </div>
                )}
              </div>

              {/* Field 5: Multi-Category Filters */}
              <div 
                className="input-block position-relative" 
                onClick={() => setActiveDropdown(activeDropdown === 'filters' ? null : 'filters')}
              >
                <span className="input-block-label d-flex align-items-center justify-content-between">
                  <span>Filters</span>
                  <ChevronDown size={14} />
                </span>
                <div className="d-flex align-items-baseline gap-1 mt-1">
                  <span className="fw-bold text-dark" style={{ fontSize: '16px', lineHeight: '1.2' }}>
                    {totalAppliedCount > 0 ? (
                      <span className="text-warning fw-black">{totalAppliedCount} Applied</span>
                    ) : (
                      'Select Filters'
                    )}
                  </span>
                </div>
                <span className="input-block-sub mt-1">
                  {totalAppliedCount > 0 ? 'Click to edit' : '(Optional)'}
                </span>

                {activeDropdown === 'filters' && (
                  <div className="tg-popover-card tg-filters-popover shadow-xl p-3" onClick={e => e.stopPropagation()}>
                    <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom">
                      <span className="fw-bold text-dark small"><SlidersHorizontal size={14} className="text-primary me-1" /> Trip Filters</span>
                      <button type="button" className="btn btn-sm btn-link p-0 text-muted" onClick={() => setActiveDropdown(null)}><X size={16} /></button>
                    </div>

                    <div className="tg-scroll-area pe-1">
                      {/* Price Range */}
                      <div className="mb-3">
                        <div className="text-muted small fw-bold mb-1">Budget / Price</div>
                        <div className="d-flex flex-wrap gap-1">
                          {[
                            { id: '< 15000', label: '< ₹15k' },
                            { id: '15000-25000', label: '₹15k - ₹25k' },
                            { id: '> 25000', label: '> ₹25k' }
                          ].map(pr => {
                            const isChecked = localFilters.priceRanges?.includes(pr.id);
                            return (
                              <button
                                key={pr.id}
                                type="button"
                                className={`tg-filter-chip ${isChecked ? 'active' : ''}`}
                                onClick={() => {
                                  setLocalFilters(prev => ({
                                    ...prev,
                                    priceRanges: isChecked ? prev.priceRanges.filter(id => id !== pr.id) : [...(prev.priceRanges || []), pr.id]
                                  }));
                                }}
                              >
                                {isChecked && <Check size={12} />}
                                <span>{pr.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Hotel Stars */}
                      <div className="mb-3">
                        <div className="text-muted small fw-bold mb-1">Hotel Category</div>
                        <div className="d-flex flex-wrap gap-1">
                          {[
                            { id: '3', label: '3★ Standard' },
                            { id: '4', label: '4★ Premium' },
                            { id: '5', label: '5★ Luxury' }
                          ].map(st => {
                            const isChecked = localFilters.hotelStars?.includes(st.id);
                            return (
                              <button
                                key={st.id}
                                type="button"
                                className={`tg-filter-chip ${isChecked ? 'active' : ''}`}
                                onClick={() => {
                                  setLocalFilters(prev => ({
                                    ...prev,
                                    hotelStars: isChecked ? prev.hotelStars.filter(id => id !== st.id) : [...(prev.hotelStars || []), st.id]
                                  }));
                                }}
                              >
                                {isChecked && <Check size={12} />}
                                <span>{st.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Trip Types */}
                      <div className="mb-3">
                        <div className="text-muted small fw-bold mb-1">Trip Theme</div>
                        <div className="d-flex flex-wrap gap-1">
                          {['Family', 'Couple', 'Adventure', 'Honeymoon', 'Luxury', 'Self Drive'].map(tt => {
                            const isChecked = localFilters.tripTypes?.includes(tt);
                            return (
                              <button
                                key={tt}
                                type="button"
                                className={`tg-filter-chip ${isChecked ? 'active' : ''}`}
                                onClick={() => {
                                  setLocalFilters(prev => ({
                                    ...prev,
                                    tripTypes: isChecked ? prev.tripTypes.filter(id => id !== tt) : [...(prev.tripTypes || []), tt]
                                  }));
                                }}
                              >
                                {isChecked && <Check size={12} />}
                                <span>{tt}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Duration */}
                      <div className="mb-3">
                        <div className="text-muted small fw-bold mb-1">Duration</div>
                        <div className="d-flex flex-wrap gap-1">
                          {['1-3 Days', '4-6 Days', '7+ Days'].map(dur => {
                            const isChecked = localFilters.durations?.includes(dur);
                            return (
                              <button
                                key={dur}
                                type="button"
                                className={`tg-filter-chip ${isChecked ? 'active' : ''}`}
                                onClick={() => {
                                  setLocalFilters(prev => ({
                                    ...prev,
                                    durations: isChecked ? prev.durations.filter(id => id !== dur) : [...(prev.durations || []), dur]
                                  }));
                                }}
                              >
                                {isChecked && <Check size={12} />}
                                <span>{dur}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Inclusions */}
                      <div>
                        <div className="text-muted small fw-bold mb-1">Inclusions</div>
                        <div className="d-flex flex-wrap gap-1">
                          {['Flight Included', 'Cab Included', 'Meals Included'].map(inc => {
                            const isChecked = localFilters.inclusions?.includes(inc);
                            return (
                              <button
                                key={inc}
                                type="button"
                                className={`tg-filter-chip ${isChecked ? 'active' : ''}`}
                                onClick={() => {
                                  setLocalFilters(prev => ({
                                    ...prev,
                                    inclusions: isChecked ? prev.inclusions.filter(id => id !== inc) : [...(prev.inclusions || []), inc]
                                  }));
                                }}
                              >
                                {isChecked && <Check size={12} />}
                                <span>{inc}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center pt-3 border-top mt-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary px-3"
                        onClick={() => {
                          const reset = { priceRanges: [], hotelStars: [], tripTypes: [], durations: [], inclusions: [] };
                          setLocalFilters(reset);
                          if (setAppliedFilters) setAppliedFilters(reset);
                        }}
                      >
                        Clear All
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary px-3 fw-bold"
                        style={{ background: '#FF6333', borderColor: '#FF6333' }}
                        onClick={() => {
                          if (setAppliedFilters) setAppliedFilters(localFilters);
                          if (setSearchTriggered) setSearchTriggered(true);
                          setActiveDropdown(null);
                          setTimeout(() => {
                            document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        }}
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ─── FLOATING ORANGE SEARCH BUTTON ─────────────────────────────── */}
          {activeTab !== 'craftmytrip' && (
            <div className="search-btn-container">
              <button type="submit" className="btn-widget-search">
                SEARCH
              </button>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}

// ─── EMBEDDED CALENDAR POPUP VIEW ─────────────────────────────────────────────

function CalendarPickerView({ title, selectedDate, minDate, onSelect, onClose }) {
  const initial = selectedDate ? new Date(selectedDate) : new Date();
  const validInitial = isNaN(initial.getTime()) ? new Date() : initial;
  const [viewYear, setViewYear] = useState(validInitial.getFullYear());
  const [viewMonth, setViewMonth] = useState(validInitial.getMonth());

  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  const isCurrentMonthOrPast = () => {
    if (!minDate) return false;
    const [minY, minM] = minDate.split('-').map(Number);
    return viewYear < minY || (viewYear === minY && viewMonth <= minM - 1);
  };

  const handlePrev = () => {
    if (isCurrentMonthOrPast()) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  return (
    <div className="p-3" style={{ minWidth: '320px' }}>
      <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
        <span className="fw-bold text-dark small d-flex align-items-center gap-1">
          <CalendarIcon size={14} className="text-warning" />
          {title || "Select Date"}
        </span>
        <button type="button" className="btn btn-sm btn-link p-0 text-muted" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-2">
        <button 
          type="button" 
          className="btn btn-sm btn-light border rounded-circle p-1"
          onClick={handlePrev}
          disabled={isCurrentMonthOrPast()}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="fw-bold text-dark small">{monthNames[viewMonth]} {viewYear}</span>
        <button 
          type="button" 
          className="btn btn-sm btn-light border rounded-circle p-1"
          onClick={handleNext}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="mb-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>
        {weekdays.map(wd => <span key={wd}>{wd}</span>)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', textAlign: 'center' }}>
        {Array.from({ length: firstDay }).map((_, i) => <span key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const mm = String(viewMonth + 1).padStart(2, '0');
          const dd = String(day).padStart(2, '0');
          const dateStr = `${viewYear}-${mm}-${dd}`;
          const isSelected = dateStr === selectedDate;
          const isPast = minDate && dateStr < minDate;

          return (
            <button
              key={day}
              type="button"
              disabled={isPast}
              className={`tg-calendar-day ${isSelected ? 'selected' : ''} ${isPast ? 'disabled' : ''}`}
              onClick={() => onSelect(dateStr)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── ROOMS & GUESTS POPOVER CONTENT ───────────────────────────────────────────

function RoomsGuestsPopoverContent({ rooms, setRooms, adults, setAdults, childrenCount, onChildrenChange, childAges, onChildAgeChange, onDone }) {
  return (
    <div style={{ minWidth: '280px' }}>
      <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom">
        <span className="fw-bold text-dark small"><Users size={14} className="text-primary me-1" /> Rooms & Guests</span>
        <button type="button" className="btn btn-sm btn-link p-0 text-muted" onClick={onDone}><X size={16} /></button>
      </div>

      {/* Rooms */}
      <div className="d-flex align-items-center justify-content-between py-2 border-bottom">
        <div>
          <div className="fw-bold text-dark small">Rooms</div>
          <div className="text-muted" style={{ fontSize: '11px' }}>Minimum 1 room</div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button type="button" className="tg-counter-btn" disabled={rooms <= 1} onClick={() => setRooms(Math.max(1, (rooms || 1) - 1))}>−</button>
          <span className="fw-bold text-dark font-monospace" style={{ minWidth: '20px', textAlign: 'center' }}>{rooms || 1}</span>
          <button type="button" className="tg-counter-btn" disabled={rooms >= 10} onClick={() => setRooms((rooms || 1) + 1)}>+</button>
        </div>
      </div>

      {/* Adults */}
      <div className="d-flex align-items-center justify-content-between py-2 border-bottom">
        <div>
          <div className="fw-bold text-dark small">Adults</div>
          <div className="text-muted" style={{ fontSize: '11px' }}>Age 12+ years</div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button type="button" className="tg-counter-btn" disabled={adults <= 1} onClick={() => setAdults(Math.max(1, (adults || 2) - 1))}>−</button>
          <span className="fw-bold text-dark font-monospace" style={{ minWidth: '20px', textAlign: 'center' }}>{adults || 2}</span>
          <button type="button" className="tg-counter-btn" disabled={adults >= 30} onClick={() => setAdults((adults || 2) + 1)}>+</button>
        </div>
      </div>

      {/* Children */}
      <div className="d-flex align-items-center justify-content-between py-2">
        <div>
          <div className="fw-bold text-dark small">Children</div>
          <div className="text-muted" style={{ fontSize: '11px' }}>Age 0 - 11 years</div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button type="button" className="tg-counter-btn" disabled={childrenCount <= 0} onClick={() => onChildrenChange((childrenCount || 0) - 1)}>−</button>
          <span className="fw-bold text-dark font-monospace" style={{ minWidth: '20px', textAlign: 'center' }}>{childrenCount || 0}</span>
          <button type="button" className="tg-counter-btn" disabled={childrenCount >= 10} onClick={() => onChildrenChange((childrenCount || 0) + 1)}>+</button>
        </div>
      </div>

      {/* Child age selectors */}
      {childrenCount > 0 && (
        <div className="mt-2 pt-2 border-top">
          <div className="fw-bold text-dark small mb-1" style={{ fontSize: '11px' }}>Child Ages:</div>
          <div className="d-flex flex-wrap gap-1">
            {Array.from({ length: childrenCount }).map((_, idx) => (
              <div key={idx} className="d-flex align-items-center gap-1 bg-light p-1 rounded border">
                <span className="text-muted small" style={{ fontSize: '11px' }}>Child {idx + 1}:</span>
                <select
                  className="form-select form-select-sm border-0 bg-white py-0 px-1"
                  style={{ width: '65px', fontSize: '11px' }}
                  value={childAges[idx] !== undefined ? childAges[idx] : 5}
                  onChange={(e) => onChildAgeChange(idx, e.target.value)}
                >
                  {Array.from({ length: 12 }, (_, a) => (
                    <option key={a} value={a}>{a} yrs</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary btn-sm w-100 py-2 mt-3 fw-bold"
        style={{ background: '#FF6333', borderColor: '#FF6333', borderRadius: '8px' }}
        onClick={onDone}
      >
        Done
      </button>
    </div>
  );
}

// ─── FLIGHT PASSENGERS POPOVER CONTENT ────────────────────────────────────────

function FlightPassengersPopoverContent({ adults, setAdults, childrenCount, setChildren, infants, setInfants, flightClass, setFlightClass, onDone }) {
  return (
    <div style={{ minWidth: '280px' }}>
      <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom">
        <span className="fw-bold text-dark small"><Plane size={14} className="text-primary me-1" /> Passengers & Class</span>
        <button type="button" className="btn btn-sm btn-link p-0 text-muted" onClick={onDone}><X size={16} /></button>
      </div>

      {/* Adults */}
      <div className="d-flex align-items-center justify-content-between py-2 border-bottom">
        <div>
          <div className="fw-bold text-dark small">Adults</div>
          <div className="text-muted" style={{ fontSize: '11px' }}>12+ years</div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button type="button" className="tg-counter-btn" disabled={adults <= 1} onClick={() => setAdults(Math.max(1, (adults || 1) - 1))}>−</button>
          <span className="fw-bold text-dark font-monospace" style={{ minWidth: '20px', textAlign: 'center' }}>{adults || 1}</span>
          <button type="button" className="tg-counter-btn" disabled={adults >= 9} onClick={() => setAdults((adults || 1) + 1)}>+</button>
        </div>
      </div>

      {/* Children */}
      <div className="d-flex align-items-center justify-content-between py-2 border-bottom">
        <div>
          <div className="fw-bold text-dark small">Children</div>
          <div className="text-muted" style={{ fontSize: '11px' }}>2 - 11 years</div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button type="button" className="tg-counter-btn" disabled={childrenCount <= 0} onClick={() => setChildren(Math.max(0, (childrenCount || 0) - 1))}>−</button>
          <span className="fw-bold text-dark font-monospace" style={{ minWidth: '20px', textAlign: 'center' }}>{childrenCount || 0}</span>
          <button type="button" className="tg-counter-btn" disabled={childrenCount >= 9} onClick={() => setChildren((childrenCount || 0) + 1)}>+</button>
        </div>
      </div>

      {/* Infants */}
      <div className="d-flex align-items-center justify-content-between py-2 border-bottom">
        <div>
          <div className="fw-bold text-dark small">Infants</div>
          <div className="text-muted" style={{ fontSize: '11px' }}>Under 2 years</div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button type="button" className="tg-counter-btn" disabled={infants <= 0} onClick={() => setInfants(Math.max(0, (infants || 0) - 1))}>−</button>
          <span className="fw-bold text-dark font-monospace" style={{ minWidth: '20px', textAlign: 'center' }}>{infants || 0}</span>
          <button type="button" className="tg-counter-btn" disabled={infants >= 9} onClick={() => setInfants((infants || 0) + 1)}>+</button>
        </div>
      </div>

      {/* Cabin Class */}
      <div className="py-2">
        <div className="fw-bold text-dark small mb-1">Cabin Class</div>
        <select 
          className="form-select form-select-sm"
          value={flightClass || 'economy'}
          onChange={e => setFlightClass(e.target.value)}
        >
          <option value="economy">Economy</option>
          <option value="premium_economy">Premium Economy</option>
          <option value="business">Business</option>
          <option value="first">First</option>
        </select>
      </div>

      <button
        type="button"
        className="btn btn-primary btn-sm w-100 py-2 mt-2 fw-bold"
        style={{ background: '#FF6333', borderColor: '#FF6333', borderRadius: '8px' }}
        onClick={onDone}
      >
        Done
      </button>
    </div>
  );
}
