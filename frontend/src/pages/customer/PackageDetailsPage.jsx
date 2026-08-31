import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Star, MapPin, Clock, CheckCircle, XCircle, 
  Car, Hotel, Plane, Utensils, Shield, ChevronRight,
  Sparkles, Calendar, Image as ImageIcon 
} from 'lucide-react';
import ImageCarousel from '../../components/common/ImageCarousel';
import { getTodayDateStr, addDays, formatDisplayDate } from '../../utils/dateUtils';

export default function PackageDetailsPage({ pkg, onBack, onBook }) {
  if (!pkg) return null;

  const price = parseFloat(pkg.price) || 0;
  
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

  // Duration Parsing
  const getPackageNights = () => {
    let nights = 0;
    const rawItinerary = pkg.day_wise_itinerary || pkg.itinerary || pkg.day_plan || pkg.dayPlan || pkg.dayWiseItinerary;
    if (rawItinerary) {
      try {
        const parsed = typeof rawItinerary === 'string' ? JSON.parse(rawItinerary) : rawItinerary;
        if (Array.isArray(parsed) && parsed.length > 0) {
          nights = Math.max(1, parsed.length - 1);
        }
      } catch (e) {}
    }
    if (nights === 0 && pkg.duration) {
       const nMatch = String(pkg.duration).match(/(\d+)\s*Nights?/i);
       if (nMatch) nights = parseInt(nMatch[1]);
       else {
           const dMatch = String(pkg.duration).match(/(\d+)\s*Days?/i);
           if (dMatch) nights = Math.max(1, parseInt(dMatch[1]) - 1);
           else {
             const shortMatch = String(pkg.duration).match(/(\d+)\s*N/i);
             if (shortMatch) nights = parseInt(shortMatch[1]);
           }
       }
    }
    return nights || 3;
  };

  const nights = getPackageNights();
  const days = nights + 1;

  const [departureDate, setDepartureDate] = useState(pkg.pickupDate || pkg.departureDate || getTodayDateStr());
  const returnDate = useMemo(() => addDays(departureDate, nights), [departureDate, nights]);

  // Itinerary parsing with full fallbacks
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

  if (!Array.isArray(itinerary) || itinerary.length === 0) {
    const destName = pkg.destination || 'Goa';
    const hotelName = pkg.hotel_included || '4-Star Beach Resort';
    const carName = pkg.car_included || 'Mahindra Thar 4x4 / Self-Drive Cab';
    const places = (pkg.places_included || 'Calangute, Baga, Fort Aguada, Panaji Latin Quarter, Vagator, Miramar').split(',').map(s => s.trim()).filter(Boolean);

    itinerary = [
      {
        day: 1,
        title: `Day 1: Arrival in ${destName} & Private Transfer`,
        description: `Airport/Railway station greeting by your private driver. Transfer to ${hotelName}, welcome drink on arrival, and evening leisure at the beach.`,
        inclusions: ['Airport Transfer', 'Welcome Drinks', 'Dinner']
      },
      {
        day: 2,
        title: `Day 2: North ${destName} Coastal Tour & Water Sports`,
        description: `Explore scenic North Goa beaches: ${places[0] || 'Calangute'}, ${places[1] || 'Baga'}, and Anjuna. Visit historical Fort Aguada and enjoy thrilling water sport activities.`,
        inclusions: ['Breakfast', carName, 'Sightseeing Pass', 'Water Sports']
      },
      {
        day: 3,
        title: `Day 3: South ${destName} Heritage, Churches & Sunset River Cruise`,
        description: `Experience the rich Latin Quarter of Fontainhas, ancient Old Goa basilicas, Miramar Beach, and a 1-hour sunset cruise along Mandovi river.`,
        inclusions: ['Breakfast', 'Heritage Guide', 'River Cruise Ticket', 'Dinner']
      },
      {
        day: days,
        title: `Day ${days}: Leisure Morning & Departure Transfer`,
        description: `Enjoy a lavish breakfast by the poolside. Last-minute souvenir shopping before your private transfer to ${destName} Airport / Railway Station.`,
        inclusions: ['Breakfast', 'Airport Drop Transfer']
      }
    ];
  }

  // Inclusions parsing
  let inclusions = [];
  try {
    inclusions = typeof pkg.inclusions === 'string' ? JSON.parse(pkg.inclusions) : (pkg.inclusions || []);
    if (!Array.isArray(inclusions)) inclusions = [];
  } catch (e) { inclusions = []; }
  
  if (inclusions.length === 0) {
    inclusions = [
      `Stay for ${nights} Nights / ${days} Days in ${pkg.hotel_included || '5-Star Beach Resort'}`,
      `Dedicated Vehicle: ${pkg.car_included || 'Mahindra Thar 4x4 / Self-Drive Cab'}`,
      pkg.food_included || 'Daily Buffet Breakfast & Gourmet Dinners',
      pkg.pickup_drop_included || 'Airport / Railway Station Pickup & Drop Included',
      'All Sightseeing Tours as per detailed Itinerary',
      'Mandovi River Sunset Cruise Tickets Included',
      'All Tolls, Parking Charges, and Fuel Included',
      '24x7 Dedicated Local Tour Assistant'
    ];
  }

  const exclusions = [
    'Personal expenses & shopping',
    'Optional water sports not specified',
    'Tips & porter charges',
    'Airfare (unless booked with flight option)'
  ];

  // Places parsing
  const placesList = pkg.places_included 
    ? pkg.places_included.split(',').map(p => p.trim())
    : ['Calangute Beach', 'Baga Beach', 'Fort Aguada', 'Panaji Latin Quarter', 'Vagator Beach'];

  return (
    <div className="package-details-page animate-fade-in pb-5" style={{ background: '#f8fafc', minHeight: '100vh' }}>
      
      {/* ─── STICKY HEADER ────────────────────────────────────────────────────── */}
      <div className="bg-white border-bottom sticky-top shadow-sm px-4 py-3 d-flex align-items-center justify-content-between" style={{ zIndex: 100 }}>
        <div className="d-flex align-items-center gap-3">
          <button 
            type="button"
            onClick={onBack} 
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
          <button 
            type="button" 
            onClick={() => onBook(pkg)} 
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
                    <MapPin size={13} className="text-danger" /> {pkg.destinations || pkg.location || 'Goa, India'}
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
                  {pkg.description || `Experience the ultimate Goan vacation with our ${nights} Nights / ${days} Days curated package with luxury stay, dedicated vehicle, and sightseeing.`}
                </p>
              </div>

              <div className="p-3 bg-light rounded-3 border">
                <div className="text-muted small mb-1">Starting Price per person</div>
                <div className="d-flex align-items-baseline gap-2">
                  <h3 className="fw-black text-primary mb-0">₹{price.toLocaleString()}</h3>
                  <span className="text-decoration-line-through text-muted small">₹{Math.round(price * 1.25).toLocaleString()}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => onBook(pkg)} 
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
            
            {/* Included in this package highlights */}
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#0D1B2E' }}>
                <Sparkles size={18} className="text-warning" /> Included in This Holiday Package
              </h5>
              
              <div className="row g-3">
                {/* Hotel Card */}
                <div className="col-md-6">
                  <div className="p-3 rounded-3 border bg-light h-100 d-flex gap-3 align-items-center">
                    <div className="rounded-3 bg-white p-3 text-primary shadow-sm">
                      <Hotel size={26} />
                    </div>
                    <div>
                      <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.68rem' }}>Accommodation</span>
                      <h6 className="fw-bold mb-0 text-dark">{pkg.hotel_included || 'JW Marriott Goa (5-Star)'}</h6>
                      <small className="text-muted">{nights} Nights with Breakfast Included</small>
                    </div>
                  </div>
                </div>

                {/* Vehicle Card */}
                <div className="col-md-6">
                  <div className="p-3 rounded-3 border bg-light h-100 d-flex gap-3 align-items-center">
                    <div className="rounded-3 bg-white p-3 text-success shadow-sm">
                      <Car size={26} />
                    </div>
                    <div>
                      <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.68rem' }}>Vehicle & Transfers</span>
                      <h6 className="fw-bold mb-0 text-dark">{pkg.car_included || 'Mahindra Thar 4x4 / Self-Drive'}</h6>
                      <small className="text-muted">Free Airport Pickup & Drop</small>
                    </div>
                  </div>
                </div>

                {/* Meals Card */}
                <div className="col-md-6">
                  <div className="p-3 rounded-3 border bg-light h-100 d-flex gap-3 align-items-center">
                    <div className="rounded-3 bg-white p-3 text-warning shadow-sm">
                      <Utensils size={26} />
                    </div>
                    <div>
                      <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.68rem' }}>Dining & Meals</span>
                      <h6 className="fw-bold mb-0 text-dark">{pkg.food_included || 'Buffet Breakfast & Dinner'}</h6>
                      <small className="text-muted">Inclusive gourmet meal plan</small>
                    </div>
                  </div>
                </div>

                {/* Flights Card */}
                <div className="col-md-6">
                  <div className="p-3 rounded-3 border bg-light h-100 d-flex gap-3 align-items-center">
                    <div className="rounded-3 bg-white p-3 text-info shadow-sm">
                      <Plane size={26} />
                    </div>
                    <div>
                      <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.68rem' }}>Flight Option</span>
                      <h6 className="fw-bold mb-0 text-dark">
                        {pkg.price_with_flight ? `Flights Available (₹${parseFloat(pkg.price_with_flight).toLocaleString()})` : 'Optional Flight Addon'}
                      </h6>
                      <small className="text-muted">Round-trip airport transit</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Places to Visit */}
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#0D1B2E' }}>
                <MapPin size={18} className="text-danger" /> Sightseeing & Key Attractions Covered
              </h5>
              <div className="d-flex flex-wrap gap-2">
                {placesList.map((place, idx) => (
                  <span key={idx} className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-bold" style={{ fontSize: '0.78rem' }}>
                    📍 {place}
                  </span>
                ))}
              </div>
            </div>

            {/* Day Wise Itinerary */}
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
              <h5 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ color: '#0D1B2E' }}>
                <Calendar size={18} className="text-primary" /> Detailed Day-by-Day Itinerary
              </h5>
              
              <div className="d-flex flex-column gap-3">
                {itinerary.map((day, idx) => (
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
                {pkg.price_with_flight && (
                  <div className="small text-success mt-2 pt-2 border-top">
                    ✈️ With Flight: <strong>₹{parseFloat(pkg.price_with_flight).toLocaleString('en-IN')}</strong> / person
                  </div>
                )}
              </div>

              {/* Trip Schedule & Auto Return Date Box */}
              <div className="p-3 bg-light rounded-3 mb-3 border">
                <div className="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom">
                  <span className="fw-bold text-dark small d-flex align-items-center gap-1.5">
                    <Calendar size={14} className="text-primary" /> Trip Schedule &amp; Dates
                  </span>
                  <span className="badge bg-primary bg-opacity-10 text-primary fw-bold" style={{ fontSize: '0.7rem' }}>
                    {nights}N / {days}D
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
                    onChange={(e) => setDepartureDate(e.target.value)} 
                    style={{ fontSize: '0.82rem', borderRadius: '8px' }}
                  />
                  <span className="text-muted text-xxs d-block mt-1" style={{ fontSize: '10.5px' }}>
                    {formatDisplayDate(departureDate)}
                  </span>
                </div>

                <div>
                  <label className="form-label text-muted small fw-bold mb-1 d-flex align-items-center justify-content-between" style={{ fontSize: '0.72rem' }}>
                    <span>End / Check-Out Date:</span>
                    <span className="badge bg-success bg-opacity-10 text-success p-0" style={{ fontSize: '9px' }}>Auto</span>
                  </label>
                  <div 
                    className="p-1.5 px-2 bg-white rounded border fw-bold text-success text-truncate d-flex align-items-center justify-content-between"
                    style={{ fontSize: '0.82rem', backgroundColor: '#f0fdf4' }}
                    title={`${formatDisplayDate(returnDate)} (${nights} Nights / ${days} Days)`}
                  >
                    <span>{formatDisplayDate(returnDate)}</span>
                  </div>
                  <span className="text-success fw-semibold text-xxs d-block mt-1" style={{ fontSize: '10.5px' }}>
                    ({nights} Nights / {days} Days)
                  </span>
                </div>
              </div>

              <div className="d-flex flex-column gap-2.5 mb-4 small text-muted">
                <div className="d-flex justify-content-between">
                  <span>Duration:</span>
                  <span className="fw-bold text-dark">{nights} Nights / {days} Days</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Destination:</span>
                  <span className="fw-bold text-dark">Goa, India</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Hotel Stay:</span>
                  <span className="fw-bold text-dark">{pkg.hotel_included || 'Luxury Resort'}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Vehicle:</span>
                  <span className="fw-bold text-dark">{pkg.car_included || 'Self-Drive Car'}</span>
                </div>
              </div>

              <div className="d-flex flex-column gap-2">
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
                  className="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                  style={{ background: '#FF6333', borderColor: '#FF6333', fontSize: '1rem' }}
                >
                  <span>Proceed to Book</span>
                  <ChevronRight size={18} />
                </button>
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
