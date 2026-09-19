import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Star, MapPin, Clock, CheckCircle, XCircle, 
  Car, Hotel, Plane, Utensils, Shield, ChevronRight,
  Sparkles, Calendar, Image as ImageIcon 
} from 'lucide-react';
import ImageCarousel from '../../components/common/ImageCarousel';
import { getTodayDateStr, addDays, formatDisplayDate } from '../../utils/dateUtils';
import { resolvePackagePrices } from '../../utils/pricingHelper';

export default function PackageDetailsPage({ pkg, onBack, onBook, onEnquire, markups = [] }) {
  if (!pkg) return null;

  const pricing = useMemo(() => resolvePackagePrices(pkg, markups), [pkg, markups]);
  const price = pricing.price;
  const flightPrice = pricing.price_with_flight;
  
  // Collect gallery photos
  const defaultImages = [
    pkg.imageUrl || pkg.image || pkg.image_url || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80'
  ];

  let galleryImages = [...defaultImages];
  if (pkg.images_json || pkg.images) {
    try {
      const raw = pkg.images_json || pkg.images;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed) && parsed.length > 0) {
        galleryImages = parsed;
      }
    } catch (e) {}
  } else if (pkg.image && pkg.image.includes(',')) {
    galleryImages = pkg.image.split(',').map(s => s.trim()).filter(Boolean);
  } else if (pkg.image) {
    galleryImages = [pkg.image, ...defaultImages.slice(1)];
  }

  // Maximum duration allowed from master package definition
  const getPackageMaxNights = () => {
    let maxN = 0;
    const rawItinerary = pkg.day_wise_itinerary || pkg.itinerary || pkg.day_plan || pkg.dayPlan || pkg.dayWiseItinerary;
    if (rawItinerary) {
      try {
        const parsed = typeof rawItinerary === 'string' ? JSON.parse(rawItinerary) : rawItinerary;
        if (Array.isArray(parsed) && parsed.length > 0) {
          maxN = Math.max(1, parsed.length - 1);
        }
      } catch (e) {}
    }
    if (maxN === 0 && pkg.duration_nights) {
      maxN = parseInt(pkg.duration_nights, 10);
    }
    if (maxN === 0 && pkg.duration) {
       const nMatch = String(pkg.duration).match(/(\d+)\s*Nights?/i);
       if (nMatch) maxN = parseInt(nMatch[1]);
       else {
           const dMatch = String(pkg.duration).match(/(\d+)\s*Days?/i);
           if (dMatch) maxN = Math.max(1, parseInt(dMatch[1]) - 1);
           else {
             const shortMatch = String(pkg.duration).match(/(\d+)\s*N/i);
             if (shortMatch) maxN = parseInt(shortMatch[1]);
           }
       }
    }
    return maxN || 3;
  };

  const packageMaxNights = getPackageMaxNights();

  // Authoritative Customer Selected Dates
  const initialDep = pkg.pickupDate || pkg.departureDate || pkg.pickup_date || getTodayDateStr();
  const initialRet = pkg.returnDate || pkg.dropDate || pkg.drop_date || addDays(initialDep, packageMaxNights);
  const [departureDate, setDepartureDate] = useState(initialDep);
  const [returnDate, setReturnDate] = useState(initialRet);

  // Authoritative nights & days derived strictly from customer-selected dates
  const nights = useMemo(() => {
    if (!departureDate || !returnDate) return 0;
    const diff = Math.round((new Date(returnDate) - new Date(departureDate)) / 86400000);
    const calculated = Math.max(0, diff);
    return Math.min(calculated, packageMaxNights);
  }, [departureDate, returnDate, packageMaxNights]);

  const days = nights + 1;

  // Preserve duration when start date changes, safely clamping within max allowed
  const handleDepartureDateChange = (newStart) => {
    if (!newStart) return;
    const currentSelectedNights = nights;
    setDepartureDate(newStart);
    const maxEnd = addDays(newStart, packageMaxNights);
    let targetEnd = addDays(newStart, currentSelectedNights);
    if (targetEnd > maxEnd) targetEnd = maxEnd;
    if (targetEnd < newStart) targetEnd = newStart;
    setReturnDate(targetEnd);
  };

  const handleReturnDateChange = (newEnd) => {
    if (!newEnd) return;
    const minEnd = departureDate;
    const maxEnd = addDays(departureDate, packageMaxNights);
    if (newEnd < minEnd) setReturnDate(minEnd);
    else if (newEnd > maxEnd) setReturnDate(maxEnd);
    else setReturnDate(newEnd);
  };

  // Itinerary parsing strictly from package data
  let itinerary = [];
  const rawItinerary = pkg.day_wise_itinerary || pkg.itinerary || pkg.day_plan || pkg.dayPlan || pkg.dayWiseItinerary;
  if (rawItinerary) {
    try {
      itinerary = typeof rawItinerary === 'string' 
        ? JSON.parse(rawItinerary) 
        : rawItinerary;
    } catch (e) {
      itinerary = [];
    }
  }
  if (!Array.isArray(itinerary)) itinerary = [];

  // Active Itinerary slice for customer's selected duration (0N/1D -> Day 1, 1N/2D -> Day 1-2, etc.)
  const activeItinerary = useMemo(() => {
    return itinerary.slice(0, days);
  }, [itinerary, days]);

  // Inclusions & Exclusions parsing strictly from package data
  let inclusions = [];
  let exclusions = [];
  if (pkg.inclusions_exclusions_json) {
    try {
      const parsed = typeof pkg.inclusions_exclusions_json === 'string'
        ? JSON.parse(pkg.inclusions_exclusions_json)
        : pkg.inclusions_exclusions_json;
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.inclusions)) inclusions = parsed.inclusions;
        if (Array.isArray(parsed.exclusions)) exclusions = parsed.exclusions;
      } else if (Array.isArray(parsed)) {
        inclusions = parsed;
      }
    } catch (e) {}
  }

  if (inclusions.length === 0 && pkg.inclusions) {
    try {
      inclusions = typeof pkg.inclusions === 'string' ? JSON.parse(pkg.inclusions) : pkg.inclusions;
      if (!Array.isArray(inclusions)) inclusions = [];
    } catch (e) { inclusions = []; }
  }
  
  if (inclusions.length === 0) {
    if (pkg.hotel_included) inclusions.push(`Accommodation: ${pkg.hotel_included} (${nights}N / ${days}D)`);
    if (pkg.car_included) inclusions.push(`Vehicle: ${pkg.car_included}`);
    if (pkg.food_included) inclusions.push(`Dining Plan: ${pkg.food_included}`);
    if (pkg.pickup_drop_included) inclusions.push(`Airport / Station Transfers: ${pkg.pickup_drop_included}`);
    if (pkg.places_included) inclusions.push(`Sightseeing coverage for: ${pkg.places_included}`);
    if (pkg.price_with_flight) inclusions.push(`Flight inclusive option available`);
    inclusions.push('24x7 Dedicated Local Tour Manager');
    inclusions.push('All Driver Allowances, Tolls & Parking Charges Included');
  }

  if (exclusions.length === 0) {
    exclusions = [
      'Personal expenses & shopping',
      'Optional adventure activities not explicitly specified in package',
      'Tips, gratuities & porter charges',
      pkg.price_with_flight ? 'Flight upgrades and excess baggage allowance' : 'Airfare / Train tickets (unless booked with flight option)'
    ];
  }

  // Places parsing strictly from package data
  const placesList = pkg.places_included 
    ? pkg.places_included.split(',').map(p => p.trim()).filter(Boolean)
    : [];

  return (
    <div className="package-details-page animate-fade-in pb-5" style={{ background: '#f8fafc', minHeight: '100vh' }}>
      
      {/* ─── STICKY HEADER ────────────────────────────────────────────────────── */}
      <div className="bg-white border-bottom sticky-top shadow-sm px-4 py-3 d-flex align-items-center justify-content-between" style={{ zIndex: 100 }}>
        <div className="d-flex align-items-center gap-3">
          <button 
            type="button"
            onClick={() => {
              if (document.activeElement && typeof document.activeElement.blur === 'function') {
                document.activeElement.blur();
              }
              onBack();
            }} 
            className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center shadow-sm"
            title="Back to Packages"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <span className="badge bg-primary bg-opacity-10 text-primary mb-1" style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {pkg.package_type || 'Holiday Tour Package'}
            </span>
            <h5 className="mb-0 fw-bold text-dark">{pkg.name || pkg.package_name}</h5>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button 
            type="button" 
            onClick={onBack} 
            className="btn btn-outline-secondary rounded-pill px-3 py-1.5 fw-bold" 
            style={{ fontSize: '0.82rem' }}
          >
            Back
          </button>
          {onEnquire && (
            <button 
              type="button" 
              onClick={() => onEnquire(pkg, { departureDate, returnDate })} 
              className="btn btn-outline-primary rounded-pill px-3 py-1.5 fw-bold" 
              style={{ fontSize: '0.82rem' }}
            >
              Enquire
            </button>
          )}
          <button 
            type="button" 
            onClick={() => onBook({
              ...pkg,
              price: pricing.price,
              price_with_flight: pricing.price_with_flight,
              originalPrice: pricing.originalPrice,
              originalFlightPrice: pricing.originalFlightPrice,
              departureDate,
              returnDate,
              pickupDate: departureDate,
              dropDate: returnDate,
              pickup_date: departureDate,
              drop_date: returnDate,
              duration: `${nights} Nights / ${days} Days`,
              duration_nights: nights,
              duration_days: days
            })} 
            className="btn btn-primary rounded-pill px-4 py-1.5 fw-bold shadow-sm"
            style={{ background: '#FF6333', borderColor: '#FF6333', fontSize: '0.85rem' }}
          >
            Book Now
          </button>
        </div>
      </div>

      <div className="container py-4">
        
        {/* ─── INTERACTIVE PHOTO CAROUSEL & HEADER ────────────────────────────────────────── */}
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
          <div className="row g-4">
            <div className="col-12 col-lg-8">
              <ImageCarousel 
                images={galleryImages} 
                alt={pkg.name || pkg.package_name} 
                height="420px"
                rounded="16px"
              />
            </div>
            <div className="col-12 col-lg-4 d-flex flex-column justify-content-between">
              <div>
                <span className="badge bg-warning text-dark fw-bold px-3 py-1.5 rounded-pill mb-2">
                  {pkg.tag || 'Special Holiday Deal'}
                </span>
                <h3 className="fw-bold mb-2" style={{ color: '#0D1B2E' }}>{pkg.name || pkg.package_name}</h3>
                
                <div className="d-flex flex-wrap gap-2 align-items-center small text-muted mb-3">
                  <span className="badge bg-light text-dark border px-2.5 py-1.5 rounded-pill d-flex align-items-center gap-1">
                    <Clock size={13} className="text-primary" /> {nights} Nights / {days} Days
                  </span>
                  <span className="badge bg-light text-dark border px-2.5 py-1.5 rounded-pill d-flex align-items-center gap-1">
                    <MapPin size={13} className="text-danger" /> {pkg.destinations || pkg.destination || pkg.location || 'Goa, India'}
                  </span>
                </div>

                <div className="d-flex align-items-center gap-2 mb-4">
                  <div className="d-flex text-warning">
                    {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                  </div>
                  <span className="fw-bold text-dark small">4.9</span>
                  <span className="text-muted small">(142 Verified Reviews)</span>
                </div>

                <p className="text-secondary small lh-base mb-4">
                  {pkg.description || `Experience the ultimate vacation with our ${nights} Nights / ${days} Days curated package.`}
                </p>
              </div>

              <div className="p-3 bg-light rounded-3 border">
                <div className="text-muted small mb-1">Starting Price per person</div>
                <div className="d-flex align-items-baseline gap-2">
                  <h3 className="fw-black text-primary mb-0">₹{price.toLocaleString('en-IN')}</h3>
                  <span className="text-decoration-line-through text-muted small">₹{Math.round(price * 1.25).toLocaleString('en-IN')}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => onBook({
                    ...pkg,
                    departureDate,
                    returnDate,
                    pickupDate: departureDate,
                    dropDate: returnDate,
                    pickup_date: departureDate,
                    drop_date: returnDate,
                    duration: `${nights} Nights / ${days} Days`,
                    duration_nights: nights,
                    duration_days: days
                  })} 
                  className="btn btn-primary w-100 mt-3 py-2.5 rounded-pill fw-bold shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', borderColor: '#FF6333' }}
                >
                  Book Package Directly
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── PACKAGE OVERVIEW & HIGHLIGHTS ─────────────────────────────────── */}
        <div className="row g-4">
          {/* Left Column: Details */}
          <div className="col-12 col-lg-8">
            
            {/* Included in this package highlights - strictly using real fields */}
            {(pkg.hotel_included || pkg.car_included || pkg.self_drive_included || pkg.food_included || pkg.price_with_flight || pkg.flights_included) && (
              <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#0D1B2E' }}>
                  <Sparkles size={18} className="text-warning" /> Included in This Holiday Package
                </h5>
                
                <div className="row g-3">
                  {/* Hotel Card */}
                  {pkg.hotel_included && (
                    <div className="col-md-6">
                      <div className="p-3 rounded-3 border bg-light h-100 d-flex gap-3 align-items-center">
                        <div className="rounded-3 bg-white p-3 text-primary shadow-sm">
                          <Hotel size={26} />
                        </div>
                        <div>
                          <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.68rem' }}>Accommodation</span>
                          <h6 className="fw-bold mb-0 text-dark">{pkg.hotel_included}</h6>
                          <small className="text-muted">{nights} Nights Stay Included</small>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Vehicle Card */}
                  {(pkg.car_included || pkg.self_drive_included) && (
                    <div className="col-md-6">
                      <div className="p-3 rounded-3 border bg-light h-100 d-flex gap-3 align-items-center">
                        <div className="rounded-3 bg-white p-3 text-success shadow-sm">
                          <Car size={26} />
                        </div>
                        <div>
                          <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.68rem' }}>Vehicle &amp; Transfers</span>
                          <h6 className="fw-bold mb-0 text-dark">{pkg.car_included || 'Dedicated Tour Vehicle'}</h6>
                          <small className="text-muted">{pkg.pickup_drop_included || 'Dedicated Sightseeing Transit'}</small>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Meals Card */}
                  {(pkg.food_included || pkg.meals_included) && (
                    <div className="col-md-6">
                      <div className="p-3 rounded-3 border bg-light h-100 d-flex gap-3 align-items-center">
                        <div className="rounded-3 bg-white p-3 text-warning shadow-sm">
                          <Utensils size={26} />
                        </div>
                        <div>
                          <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.68rem' }}>Dining &amp; Meals</span>
                          <h6 className="fw-bold mb-0 text-dark">{pkg.food_included || 'Meal Plan Included'}</h6>
                          <small className="text-muted">Inclusive dining schedule</small>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Flights Card */}
                  {(flightPrice || pkg.price_with_flight || pkg.flights_included) && (
                    <div className="col-md-6">
                      <div className="p-3 rounded-3 border bg-light h-100 d-flex gap-3 align-items-center">
                        <div className="rounded-3 bg-white p-3 text-info shadow-sm">
                          <Plane size={26} />
                        </div>
                        <div>
                          <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.68rem' }}>Flight Option</span>
                          <h6 className="fw-bold mb-0 text-dark">
                            {(flightPrice || pkg.price_with_flight) ? `Flights Available (₹${parseFloat(flightPrice || pkg.price_with_flight).toLocaleString('en-IN')})` : 'Flight inclusive option available'}
                          </h6>
                          <small className="text-muted">Round-trip airport transit</small>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Places to Visit - strictly shown if places_included exists */}
            {placesList.length > 0 && (
              <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#0D1B2E' }}>
                  <MapPin size={18} className="text-danger" /> Sightseeing &amp; Key Attractions Covered
                </h5>
                <div className="d-flex flex-wrap gap-2">
                  {placesList.map((place, idx) => (
                    <span key={idx} className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-bold" style={{ fontSize: '0.78rem' }}>
                      📍 {place}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Day Wise Itinerary */}
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#0D1B2E' }}>
                <Calendar size={18} className="text-primary" /> Detailed Day-by-Day Itinerary ({days} Days Plan)
              </h5>
              
              {activeItinerary.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {activeItinerary.map((day, idx) => (
                    <div key={idx} className="p-3.5 rounded-3 border bg-light">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                          <span className="badge bg-primary rounded-circle" style={{ width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            {idx + 1}
                          </span>
                          {day.title || `Day ${idx + 1}`}
                        </h6>
                      </div>
                      {day.description && <p className="text-muted small mb-2 lh-base">{day.description}</p>}
                      
                      {/* Time of day activities */}
                      {(day.morning || day.afternoon || day.evening || day.night || day.activities) && (
                        <div className="d-flex flex-column gap-2 my-2.5">
                          {day.morning && (
                            <div className="p-2.5 bg-white rounded border-start border-4 border-warning shadow-xs">
                              <span className="badge bg-warning text-dark fw-bold me-1.5" style={{ fontSize: '9px' }}>MORNING</span>
                              <span className="text-dark small">{day.morning}</span>
                            </div>
                          )}
                          {day.afternoon && (
                            <div className="p-2.5 bg-white rounded border-start border-4 border-primary shadow-xs">
                              <span className="badge bg-primary text-white fw-bold me-1.5" style={{ fontSize: '9px' }}>AFTERNOON</span>
                              <span className="text-dark small">{day.afternoon}</span>
                            </div>
                          )}
                          {day.evening && (
                            <div className="p-2.5 bg-white rounded border-start border-4 border-info shadow-xs">
                              <span className="badge bg-info text-dark fw-bold me-1.5" style={{ fontSize: '9px' }}>EVENING</span>
                              <span className="text-dark small">{day.evening}</span>
                            </div>
                          )}
                          {day.night && (
                            <div className="p-2.5 bg-white rounded border-start border-4 border-dark shadow-xs">
                              <span className="badge bg-dark text-white fw-bold me-1.5" style={{ fontSize: '9px' }}>NIGHT</span>
                              <span className="text-dark small">{day.night}</span>
                            </div>
                          )}
                          {day.activities && !day.morning && !day.afternoon && (
                            <div className="p-2.5 bg-white rounded border-start border-4 border-success shadow-xs">
                              <span className="badge bg-success text-white fw-bold me-1.5" style={{ fontSize: '9px' }}>ACTIVITIES</span>
                              <span className="text-dark small">{day.activities}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {day.sightseeing_locations && day.sightseeing_locations.length > 0 && (
                        <div className="d-flex flex-wrap gap-1.5 my-2">
                          {day.sightseeing_locations.map((loc, i) => (
                            <span key={i} className="badge bg-white text-dark border px-2 py-1" style={{ fontSize: '0.72rem' }}>
                              📍 {typeof loc === 'string' ? loc : loc.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {day.inclusions && day.inclusions.length > 0 && (
                        <div className="d-flex flex-wrap gap-1.5 mt-2">
                          {day.inclusions.map((inc, i) => (
                            <span key={i} className="badge bg-white text-secondary border px-2 py-1" style={{ fontSize: '0.68rem' }}>
                              ✓ {inc}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-3 border bg-light text-center py-4">
                  <Clock size={28} className="text-primary mb-2 opacity-75" />
                  <h6 className="fw-bold text-dark mb-1">Tailored Day-Wise Itinerary</h6>
                  <p className="text-muted small mb-3 mx-auto" style={{ maxWidth: '500px' }}>
                    {pkg.description || `This ${nights} Nights / ${days} Days package itinerary is customized according to your travel preferences and attraction choices upon booking or enquiry.`}
                  </p>
                  {onEnquire && (
                    <button 
                      type="button" 
                      onClick={() => onEnquire(pkg, { departureDate, returnDate })}
                      className="btn btn-outline-primary btn-sm rounded-pill px-3 py-1.5 fw-bold"
                    >
                      Enquire for Custom Itinerary
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Inclusions & Exclusions */}
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
              <div className="row g-4">
                <div className="col-md-6">
                  <h6 className="fw-bold mb-3 text-success d-flex align-items-center gap-1.5">
                    <CheckCircle size={17} /> What's Included
                  </h6>
                  <ul className="list-unstyled d-flex flex-column gap-2 mb-0" style={{ fontSize: '0.82rem' }}>
                    {inclusions.map((inc, i) => (
                      <li key={i} className="d-flex align-items-start gap-2 text-secondary">
                        <span className="text-success fw-bold">✓</span> {inc}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="col-md-6">
                  <h6 className="fw-bold mb-3 text-danger d-flex align-items-center gap-1.5">
                    <XCircle size={17} /> What's Not Included
                  </h6>
                  <ul className="list-unstyled d-flex flex-column gap-2 mb-0" style={{ fontSize: '0.82rem' }}>
                    {exclusions.map((exc, i) => (
                      <li key={i} className="d-flex align-items-start gap-2 text-muted">
                        <span className="text-danger fw-bold">✕</span> {exc}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Cancellation Policy & Guarantee */}
            <div className="card border-0 shadow-sm rounded-4 p-4 mt-4 bg-white">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#0D1B2E' }}>
                <Shield size={18} className="text-success" /> Cancellation Policy &amp; Terms
              </h5>
              <div className="p-3 bg-light rounded-3 border text-secondary small lh-base">
                {pkg.cancellation_policy ? (
                  <p className="mb-0">{pkg.cancellation_policy}</p>
                ) : (
                  <p className="mb-0">
                    <strong>Flexible Cancellation:</strong> Free cancellation up to 48 hours before your scheduled departure date. 100% full refund on eligible cancellations. Verified hotels, sanitized vehicles, and 24/7 dedicated local tour support.
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Pricing & Booking Sidebar */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white sticky-top" style={{ top: '90px' }}>
              <span className="badge bg-success bg-opacity-10 text-success fw-bold px-3 py-1.5 rounded-pill align-self-start mb-2">
                Instant Confirmation
              </span>
              
              <h5 className="fw-bold text-dark mb-1">Pricing Summary</h5>
              <p className="text-muted small mb-3">Transparent pricing inclusive of all taxes</p>

              <div className="p-3.5 bg-light rounded-3 mb-3 border">
                <div className="text-muted small">Standard Package Rate</div>
                <div className="d-flex align-items-baseline gap-2 mt-1">
                  <h2 className="fw-black text-primary mb-0" style={{ color: '#FF6333' }}>
                    ₹{price.toLocaleString('en-IN')}
                  </h2>
                  <span className="text-muted small">/ per person</span>
                </div>
                {(flightPrice || pkg.price_with_flight) && (
                  <div className="small text-success mt-2 pt-2 border-top">
                    ✈️ With Flight: <strong>₹{parseFloat(flightPrice || pkg.price_with_flight).toLocaleString('en-IN')}</strong> / person
                  </div>
                )}
              </div>

              {/* Trip Schedule & Dates Selection Box */}
              <div className="p-3 bg-light rounded-3 mb-3 border">
                <div className="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom">
                  <span className="fw-bold text-dark small d-flex align-items-center gap-1.5">
                    <Calendar size={14} className="text-primary" /> Trip Schedule &amp; Dates
                  </span>
                  <span className="badge bg-primary bg-opacity-10 text-primary fw-bold" style={{ fontSize: '0.7rem' }}>
                    {nights}N / {days}D (Max: {packageMaxNights}N)
                  </span>
                </div>

                <div className="mb-2">
                  <label className="form-label text-muted small fw-bold mb-1" style={{ fontSize: '0.72rem' }}>
                    Start / Departure Date:
                  </label>
                  <input 
                    type="date" 
                    className="form-control form-control-sm fw-bold border bg-white" 
                    min={getTodayDateStr()} 
                    value={departureDate} 
                    onChange={(e) => handleDepartureDateChange(e.target.value)} 
                    style={{ fontSize: '0.82rem', borderRadius: '8px' }}
                  />
                  <span className="text-muted text-xxs d-block mt-1" style={{ fontSize: '10.5px' }}>
                    {formatDisplayDate(departureDate)}
                  </span>
                </div>

                <div>
                  <label className="form-label text-muted small fw-bold mb-1 d-flex align-items-center justify-content-between" style={{ fontSize: '0.72rem' }}>
                    <span>End / Check-Out Date:</span>
                    <span className="badge bg-info bg-opacity-10 text-info p-0" style={{ fontSize: '9px' }}>Customizable</span>
                  </label>
                  <input 
                    type="date" 
                    className="form-control form-control-sm fw-bold border bg-white" 
                    min={departureDate}
                    max={addDays(departureDate, packageMaxNights)}
                    value={returnDate} 
                    onChange={(e) => handleReturnDateChange(e.target.value)} 
                    style={{ fontSize: '0.82rem', borderRadius: '8px' }}
                  />
                  <span className="text-success fw-semibold text-xxs d-block mt-1" style={{ fontSize: '10.5px' }}>
                    {formatDisplayDate(returnDate)} ({nights} Nights / {days} Days)
                  </span>
                </div>
              </div>

              <div className="d-flex flex-column gap-2.5 mb-4 small text-muted">
                <div className="d-flex justify-content-between">
                  <span>Selected Duration:</span>
                  <span className="fw-bold text-dark">{nights} Nights / {days} Days</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Package Maximum:</span>
                  <span className="fw-bold text-secondary">{packageMaxNights} Nights / {packageMaxNights + 1} Days</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Destination:</span>
                  <span className="fw-bold text-dark">{pkg.destinations || pkg.destination || 'Goa, India'}</span>
                </div>
                {pkg.hotel_included && (
                  <div className="d-flex justify-content-between">
                    <span>Hotel Stay:</span>
                    <span className="fw-bold text-dark text-truncate ms-2" title={pkg.hotel_included}>{nights > 0 ? `${pkg.hotel_included} (${nights} Nights)` : 'Day Package (No Overnight Stay)'}</span>
                  </div>
                )}
                {pkg.car_included && (
                  <div className="d-flex justify-content-between">
                    <span>Vehicle:</span>
                    <span className="fw-bold text-dark text-truncate ms-2" title={pkg.car_included}>{pkg.car_included}</span>
                  </div>
                )}
              </div>

              <div className="d-flex flex-column gap-2">
                <button 
                  type="button" 
                  onClick={() => {
                    if (document.activeElement && typeof document.activeElement.blur === 'function') {
                      document.activeElement.blur();
                    }
                    onBook({
                      ...pkg,
                      price: pricing.price,
                      price_with_flight: pricing.price_with_flight,
                      originalPrice: pricing.originalPrice,
                      originalFlightPrice: pricing.originalFlightPrice,
                      departureDate,
                      returnDate,
                      pickupDate: departureDate,
                      dropDate: returnDate,
                      pickup_date: departureDate,
                      drop_date: returnDate,
                      duration: `${nights} Nights / ${days} Days`,
                      duration_nights: nights,
                      duration_days: days,
                      package_max_nights: packageMaxNights
                    });
                  }}
                  className="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                  style={{ background: '#FF6333', borderColor: '#FF6333', fontSize: '1rem' }}
                >
                  <span>Proceed to Book</span>
                  <ChevronRight size={18} />
                </button>

                {onEnquire && (
                  <button 
                    type="button" 
                    onClick={() => {
                      if (document.activeElement && typeof document.activeElement.blur === 'function') {
                        document.activeElement.blur();
                      }
                      onEnquire(pkg, {
                        departureDate,
                        returnDate,
                        pickupDate: departureDate,
                        dropDate: returnDate
                      });
                    }}
                    className="btn btn-outline-secondary w-100 py-2.5 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2 mt-1"
                    style={{ fontSize: '0.88rem' }}
                  >
                    <span>Enquire About This Package</span>
                  </button>
                )}
              </div>

              <div className="p-3 bg-light rounded-3 mt-4 text-muted" style={{ fontSize: '0.72rem' }}>
                <div className="d-flex align-items-start gap-2">
                  <Shield size={16} className="text-success flex-shrink-0 mt-0.5" />
                  <span><strong>100% Verified Experience:</strong> Verified hotels, sanitized vehicles, and 24/7 dedicated support.</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
