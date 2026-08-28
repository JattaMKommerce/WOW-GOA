import React, { useState } from 'react';
import { 
  ArrowLeft, Star, MapPin, Clock, CheckCircle, XCircle, 
  Car, Hotel, Compass, Info, Plane, Utensils, Shield, 
  Sparkles, Calendar, Users, ChevronRight, Image as ImageIcon 
} from 'lucide-react';

export default function PackageDetailsPage({ pkg, onBack, onBook }) {
  if (!pkg) return null;

  const price = parseFloat(pkg.price) || 0;
  
  // Collect gallery photos
  const defaultImages = [
    pkg.image || pkg.image_url || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80'
  ];

  let galleryImages = [...defaultImages];
  if (pkg.images_json) {
    try {
      const parsed = typeof pkg.images_json === 'string' ? JSON.parse(pkg.images_json) : pkg.images_json;
      if (Array.isArray(parsed) && parsed.length > 0) {
        galleryImages = parsed;
      }
    } catch (e) {}
  }

  const [selectedPhoto, setSelectedPhoto] = useState(galleryImages[0]);

  // Duration Parsing
  const getPackageNights = () => {
    let nights = 0;
    if (pkg.day_wise_itinerary) {
      try {
        const parsed = typeof pkg.day_wise_itinerary === 'string' ? JSON.parse(pkg.day_wise_itinerary) : pkg.day_wise_itinerary;
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
       }
    }
    return nights || 3;
  };

  const nights = getPackageNights();
  const days = nights + 1;

  // Itinerary parsing
  let itinerary = [];
  try {
    itinerary = typeof pkg.day_wise_itinerary === 'string' 
      ? JSON.parse(pkg.day_wise_itinerary) 
      : (pkg.day_wise_itinerary || []);
  } catch (e) {
    itinerary = [];
  }

  if (!Array.isArray(itinerary) || itinerary.length === 0) {
    itinerary = [
      {
        title: 'Day 1: Arrival in Goa & Private Transfer',
        description: 'Airport/Railway station greeting by your private driver. Transfer to your luxury hotel, welcome drink on arrival, and evening leisure at the beach.',
        inclusions: ['Airport Transfer', 'Welcome Drinks', 'Dinner']
      },
      {
        title: 'Day 2: North Goa Coastal Tour & Water Sports',
        description: 'Explore scenic North Goa beaches: Calangute, Baga, and Anjuna. Visit historical Fort Aguada and enjoy thrilling water sport activities.',
        inclusions: ['Breakfast', 'Self-Drive Vehicle / Cab', 'Sightseeing Pass']
      },
      {
        title: 'Day 3: South Goa Heritage, Churches & Sunset River Cruise',
        description: 'Experience the rich Latin Quarter of Fontainhas, ancient Old Goa basilicas, Miramar Beach, and a 1-hour sunset cruise along Mandovi river.',
        inclusions: ['Breakfast', 'Heritage Guide', 'River Cruise Ticket', 'Dinner']
      },
      {
        title: `Day ${days}: Leisure Morning & Departure`,
        description: 'Enjoy a lavish breakfast by the poolside. Last-minute souvenir shopping before your private transfer to Goa Airport / Railway Station.',
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
      `Stay for ${nights} Nights / ${days} Days in ${pkg.hotel_included || '5-Star Resort'}`,
      `Dedicated Vehicle: ${pkg.car_included || 'Mahindra Thar 4x4 or Similar'}`,
      pkg.food_included || 'Daily Buffet Breakfast & Gourmet Dinners',
      pkg.pickup_drop_included || 'Airport / Railway Station Pickup & Drop Included',
      'All Sightseeing Tours as per detailed Itinerary',
      'Mandovi River Sunset Cruise Tickets Included',
      'All Tolls, Parking Charges, and Fuel Included',
      '24x7 Dedicated Local Tour Assistant'
    ];
  }

  const exclusions = [
    'Airfare / Train tickets (unless Flight Option is selected)',
    'Personal expenses like laundry, room service, telephone calls',
    'Entry tickets to nightclubs and special watersport adventures',
    'Early check-in and late check-out subject to availability'
  ];

  // Places parsing
  const placesList = pkg.places_included 
    ? pkg.places_included.split(',').map(p => p.trim())
    : ['Calangute Beach', 'Baga Beach', 'Fort Aguada', 'Panaji Latin Quarter', 'Vagator Beach'];

  return (
    <div className="package-details-page animate-fade-in-up pb-5" style={{ background: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Top Header Bar */}
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
        
        {/* ─── INTERACTIVE PHOTO GALLERY ────────────────────────────────────────── */}
        <div className="row g-3 mb-4">
          {/* Main Hero Photo */}
          <div className="col-12 col-lg-8">
            <div className="rounded-4 overflow-hidden shadow-sm position-relative" style={{ height: '420px', background: '#0f172a' }}>
              <img 
                src={selectedPhoto} 
                alt={pkg.name} 
                className="w-100 h-100 object-fit-cover"
                style={{ transition: 'opacity 0.3s ease' }}
              />
              <div className="position-absolute bottom-0 start-0 w-100 p-4 text-white" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}>
                <span className="badge bg-warning text-dark fw-bold px-3 py-1.5 rounded-pill mb-2">
                  {pkg.tag || 'Special Holiday Deal'}
                </span>
                <h3 className="fw-bold mb-1">{pkg.name || pkg.package_name}</h3>
                <div className="d-flex flex-wrap gap-3 align-items-center small text-white-50">
                  <span className="d-flex align-items-center gap-1 text-white"><Clock size={15} /> {nights} Nights / {days} Days</span>
                  <span className="d-flex align-items-center gap-1 text-white"><MapPin size={15} /> {pkg.destinations || pkg.location || 'Goa, India'}</span>
                  <span className="d-flex text-warning"><Star size={15} fill="currentColor" /> 4.9 (142 Reviews)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Thumbnail Gallery List */}
          <div className="col-12 col-lg-4">
            <div className="d-flex flex-column gap-2.5 h-100">
              <div className="fw-bold small text-muted text-uppercase d-flex align-items-center gap-1">
                <ImageIcon size={14} /> Photo Gallery ({galleryImages.length} Photos)
              </div>
              <div className="d-grid gap-2" style={{ gridTemplateColumns: 'repeat(2, 1fr)', flexGrow: 1 }}>
                {galleryImages.slice(0, 4).map((img, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedPhoto(img)}
                    className="rounded-3 overflow-hidden position-relative shadow-sm cursor-pointer"
                    style={{ 
                      height: '180px', 
                      cursor: 'pointer',
                      border: selectedPhoto === img ? '3px solid #FF6333' : '2px solid transparent',
                      transition: 'transform 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <img src={img} alt={`Gallery ${idx}`} className="w-100 h-100 object-fit-cover" />
                  </div>
                ))}
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
                  <div key={idx} className="p-3 rounded-3 border bg-light">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                        <span className="badge bg-primary rounded-circle" style={{ width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          {idx + 1}
                        </span>
                        {day.title || `Day ${idx + 1}`}
                      </h6>
                    </div>
                    <p className="text-muted small mb-2 lh-base">{day.description}</p>
                    {day.inclusions && day.inclusions.length > 0 && (
                      <div className="d-flex flex-wrap gap-1.5">
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
                  onClick={() => onBook(pkg)}
                  className="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                  style={{ background: '#FF6333', borderColor: '#FF6333', fontSize: '1rem' }}
                >
                  Proceed to Book <ChevronRight size={18} />
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
