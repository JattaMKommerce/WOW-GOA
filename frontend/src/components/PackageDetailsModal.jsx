import React, { useState, useEffect } from 'react';
import { 
  X, Star, MapPin, Clock, CheckCircle, XCircle, 
  Car, Hotel, Compass, Info, Plane, Utensils, Shield, 
  Sparkles, Calendar, ChevronRight, Image as ImageIcon,
  Check, FileText, PhoneCall, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';

export default function PackageDetailsModal({ pkg, isOpen, onClose, onBook }) {
  if (!isOpen || !pkg) return null;

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'itinerary', 'hotel_vehicle', 'inclusions', 'policies'
  const [expandedDay, setExpandedDay] = useState(0); // for accordion

  const price = parseFloat(pkg.price) || 0;
  const coverImg = pkg.image || pkg.image_url || pkg.cover_image || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80';

  // Strictly relevant contextual fallbacks based on package theme
  const getThemeFallbacks = () => {
    const pkgName = (pkg.name || pkg.package_name || '').toLowerCase();
    const pkgDesc = (pkg.description || '').toLowerCase();
    const pkgTag = (pkg.tag || '').toLowerCase();

    // 1. Romantic Sunset / Honeymoon Escapes
    if (pkgName.includes('romantic') || pkgName.includes('honeymoon') || pkgTag.includes('honeymoon') || pkgDesc.includes('candlelight')) {
      return [
        coverImg,
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80', // Candlelight Beachside Dinner
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80', // Luxury Honeymoon Ocean Suite
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80', // Convertible Car Drive
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1000&q=80'  // Sunset Mandovi Cruise
      ];
    }

    // 2. Bike & Backpack / Adventure Trail
    if (pkgName.includes('bike') || pkgName.includes('backpack') || pkgName.includes('adventure') || pkgTag.includes('adventure')) {
      return [
        coverImg,
        'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80', // Royal Enfield Classic 350
        'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80', // Fontainhas Latin Quarter
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80', // Cidade de Goa Stay
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80'  // Fort Aguada Coastal View
      ];
    }

    // 3. Self Drive & Coastal Explorer Packages
    if (pkgName.includes('explorer') || pkgName.includes('self drive') || pkgName.includes('hopper') || (pkg.package_type || '').includes('Self Drive')) {
      return [
        coverImg,
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80', // Mahindra Thar 4x4
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80', // Candolim Beach Resort
        'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80', // Coastal Palms & Shacks
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1000&q=80'  // Watersports & Mandovi View
      ];
    }

    // 4. Ultimate Goa Luxury & Complete Experience
    return [
      coverImg,
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1000&q=80', // 5-Star JW Marriott Resort & Pool
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80', // Mahindra Thar 4x4
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1000&q=80', // Mandovi Sunset Yacht Cruise
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80'  // Goa Beach Sun-kissed Coast
    ];
  };

  // Dynamic gallery image mapping from package object
  let rawGallery = [];
  if (Array.isArray(pkg.images) && pkg.images.length > 0) {
    rawGallery = pkg.images;
  } else if (Array.isArray(pkg.gallery) && pkg.gallery.length > 0) {
    rawGallery = pkg.gallery;
  } else if (pkg.images_json) {
    try {
      const parsed = typeof pkg.images_json === 'string' ? JSON.parse(pkg.images_json) : pkg.images_json;
      if (Array.isArray(parsed) && parsed.length > 0) rawGallery = parsed;
    } catch (e) {}
  }

  if (rawGallery.length === 0) {
    rawGallery = getThemeFallbacks();
  }

  // Ensure coverImg is first and deduplicate
  const galleryImages = [
    coverImg,
    ...rawGallery.filter(img => img && img !== coverImg)
  ].slice(0, 5);

  const [selectedPhoto, setSelectedPhoto] = useState(coverImg);

  // Sync selected photo and active tab on package change
  useEffect(() => {
    setSelectedPhoto(coverImg);
    setActiveTab('overview');
  }, [pkg?.id, coverImg]);

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
        day: 1,
        title: 'Arrival in Goa, Private Airport Transfer & Hotel Check-in',
        description: 'Warm greeting by your private chauffeur at Goa Airport/Railway Station. Enjoy a scenic drive to your luxury resort, welcome drinks on arrival, and evening relaxation by the beach or infinity pool.',
        inclusions: ['Airport Pickup', 'Welcome Drink', 'Resort Check-in', 'Buffet Dinner']
      },
      {
        day: 2,
        title: 'North Goa Coastal Explorer & Thrilling Water Sports',
        description: 'Head out in your dedicated vehicle to Calangute, Baga, and Vagator beaches. Explore historic Fort Aguada lighthouse with panoramic Arabian Sea views and partake in exciting water sports.',
        inclusions: ['Breakfast', 'Dedicated Vehicle', 'Fort Aguada Pass', 'Water Sports']
      },
      {
        day: 3,
        title: 'South Goa Heritage Trail, Latin Quarter & Sunset River Cruise',
        description: 'Discover the colorful heritage houses of Fontainhas in Panaji, visit ancient Basilica of Bom Jesus, and embark on a mesmerizing 1-hour Mandovi River sunset cruise with Goan cultural dance.',
        inclusions: ['Breakfast', 'Heritage Guide', 'Sunset Cruise Ticket', 'Buffet Dinner']
      },
      {
        day: days,
        title: 'Leisure Morning & Departure Transfer',
        description: 'Savor a leisurely breakfast by the pool. Enjoy last-minute shopping at local flea markets before your private drop-off at Goa Airport or Railway Station with unforgettable memories.',
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
    'Airfare / Train tickets (unless Flight Option is selected)',
    'Personal expenses like laundry, room service, telephone calls',
    'Entry tickets to nightclubs and special watersport adventures',
    'Early check-in and late check-out subject to availability'
  ];

  // Places parsing
  const placesList = pkg.places_included 
    ? pkg.places_included.split(',').map(p => p.trim())
    : ['Calangute Beach', 'Baga Beach', 'Fort Aguada', 'Panaji Latin Quarter', 'Vagator Beach', 'Miramar'];

  // Specific Hotel & Vehicle Image resolution
  const getHotelPhoto = () => {
    const h = (pkg.hotel_included || '').toLowerCase();
    if (h.includes('jw marriott') || h.includes('taj') || h.includes('alila') || h.includes('5-star')) {
      return 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80';
    }
    if (h.includes('w goa')) {
      return 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80';
    }
    return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80';
  };

  const getVehiclePhoto = () => {
    const v = (pkg.car_included || '').toLowerCase();
    if (v.includes('thar')) {
      return 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80';
    }
    if (v.includes('audi') || v.includes('convertible')) {
      return 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80';
    }
    if (v.includes('royal enfield') || v.includes('classic') || v.includes('bike')) {
      return 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80';
    }
    if (v.includes('fortuner')) {
      return 'https://images.unsplash.com/photo-1567818735868-e71b99932e29?auto=format&fit=crop&w=600&q=80';
    }
    return 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80';
  };

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleBookClick = () => {
    onClose();
    onBook(pkg);
  };

  return (
    <div 
      className="modal-backdrop-custom d-flex align-items-center justify-content-center"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        className="modal-content-custom bg-white rounded-4 shadow-lg overflow-hidden d-flex flex-column animate-fade-in-up"
        style={{
          width: '100%',
          maxWidth: '1050px',
          maxHeight: '90vh',
          position: 'relative',
          border: '1px solid rgba(255,255,255,0.2)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 py-3 bg-white border-bottom d-flex align-items-center justify-content-between sticky-top" style={{ zIndex: 10 }}>
          <div className="d-flex align-items-center gap-3">
            <span className="badge px-3 py-1.5 rounded-pill fw-bold text-uppercase" style={{ background: 'rgba(255, 99, 51, 0.12)', color: '#FF6333', fontSize: '0.72rem', letterSpacing: '0.5px' }}>
              {pkg.package_type || 'Tour Package'}
            </span>
            <h5 className="mb-0 fw-bold text-dark" style={{ fontSize: '1.2rem' }}>{pkg.name || pkg.package_name}</h5>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center text-muted"
            style={{ width: '36px', height: '36px', transition: 'all 0.2s' }}
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 overflow-y-auto" style={{ flexGrow: 1 }}>
          
          {/* ─── GALLERY & HERO SECTION ────────────────────────────────────────── */}
          <div className="row g-3 mb-4">
            {/* Main Featured Hero Preview */}
            <div className="col-12 col-md-8">
              <div className="rounded-4 overflow-hidden shadow-sm position-relative" style={{ height: '360px', background: '#0f172a' }}>
                <img 
                  src={selectedPhoto} 
                  alt={pkg.name} 
                  className="w-100 h-100 object-fit-cover"
                  style={{ transition: 'opacity 0.3s ease' }}
                />
                <div className="position-absolute bottom-0 start-0 w-100 p-3 text-white" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}>
                  <span className="badge bg-warning text-dark fw-bold px-2.5 py-1 rounded-pill mb-1.5" style={{ fontSize: '0.72rem' }}>
                    {pkg.tag || 'Special Holiday Deal'}
                  </span>
                  <h4 className="fw-bold mb-1" style={{ fontSize: '1.35rem' }}>{pkg.name || pkg.package_name}</h4>
                  <div className="d-flex flex-wrap gap-3 align-items-center small text-white-50">
                    <span className="d-flex align-items-center gap-1 text-white"><Clock size={14} /> {nights} Nights / {days} Days</span>
                    <span className="d-flex align-items-center gap-1 text-white"><MapPin size={14} /> {pkg.destinations || pkg.location || 'Goa, India'}</span>
                    <span className="d-flex text-warning"><Star size={14} fill="currentColor" /> 4.9 (142 Reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Thumbnail Strip (Interactive) */}
            <div className="col-12 col-md-4">
              <div className="d-flex flex-column gap-2 h-100">
                <div className="fw-bold small text-muted text-uppercase d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
                  <ImageIcon size={13} /> Photo Gallery ({galleryImages.length} Photos)
                </div>
                <div className="d-grid gap-2" style={{ gridTemplateColumns: 'repeat(2, 1fr)', flexGrow: 1 }}>
                  {galleryImages.slice(0, 4).map((img, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedPhoto(img)}
                      className="rounded-3 overflow-hidden position-relative shadow-sm"
                      style={{ 
                        height: '155px', 
                        cursor: 'pointer',
                        border: selectedPhoto === img ? '3px solid #FF6333' : '2px solid transparent',
                        transition: 'transform 0.15s, border-color 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.transform = 'scale(0.97)'}
                      onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                      title="Click to preview as main image"
                    >
                      <img src={img} alt={`Gallery ${idx + 1}`} className="w-100 h-100 object-fit-cover" />
                      {selectedPhoto === img && (
                        <span className="position-absolute top-0 end-0 m-1.5 badge bg-primary text-white rounded-circle p-1" style={{ background: '#FF6333' }}>
                          <Check size={10} />
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ─── NAVIGATION TABS ─────────────────────────────────────────────── */}
          <div className="d-flex border-bottom mb-4 gap-2 overflow-x-auto pb-1">
            {[
              { id: 'overview', label: 'Overview & Highlights', icon: <Sparkles size={14} /> },
              { id: 'itinerary', label: 'Day-Wise Itinerary', icon: <Calendar size={14} /> },
              { id: 'hotel_vehicle', label: 'Hotel & Vehicle', icon: <Hotel size={14} /> },
              { id: 'inclusions', label: 'Inclusions & Exclusions', icon: <CheckCircle size={14} /> },
              { id: 'policies', label: 'Policies & Support', icon: <Shield size={14} /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="btn btn-sm d-flex align-items-center gap-1.5 px-3 py-2 rounded-pill fw-bold"
                style={{
                  fontSize: '0.8rem',
                  background: activeTab === tab.id ? '#0D1B2E' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : '#64748b',
                  border: activeTab === tab.id ? '1px solid #0D1B2E' : '1px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* ─── TAB CONTENTS ─────────────────────────────────────────────────── */}
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="animate-fade-in">
              <div className="mb-4">
                <h6 className="fw-bold text-dark mb-2">Package Description</h6>
                <p className="text-secondary lh-lg mb-3" style={{ fontSize: '0.88rem' }}>
                  {pkg.description || `Experience the ultimate Goan vacation with our ${nights} Nights / ${days} Days package. Relax in premier beachside resorts, explore scenic North and South Goa attractions in a dedicated vehicle, and indulge in gourmet Goan cuisine with daily breakfast and dinner.`}
                </p>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-3 col-6">
                  <div className="p-3 rounded-3 border bg-light text-center">
                    <Clock size={20} className="text-primary mb-1" />
                    <div className="text-muted small">Duration</div>
                    <div className="fw-bold text-dark">{nights}N / {days}D</div>
                  </div>
                </div>
                <div className="col-md-3 col-6">
                  <div className="p-3 rounded-3 border bg-light text-center">
                    <Hotel size={20} className="text-primary mb-1" />
                    <div className="text-muted small">Hotel Stay</div>
                    <div className="fw-bold text-dark">{pkg.hotel_included || '5-Star Resort'}</div>
                  </div>
                </div>
                <div className="col-md-3 col-6">
                  <div className="p-3 rounded-3 border bg-light text-center">
                    <Car size={20} className="text-success mb-1" />
                    <div className="text-muted small">Vehicle Included</div>
                    <div className="fw-bold text-dark">{pkg.car_included || 'Thar 4x4 / Cab'}</div>
                  </div>
                </div>
                <div className="col-md-3 col-6">
                  <div className="p-3 rounded-3 border bg-light text-center">
                    <Utensils size={20} className="text-warning mb-1" />
                    <div className="text-muted small">Meal Plan</div>
                    <div className="fw-bold text-dark">{pkg.food_included ? 'Meals Included' : 'Breakfast & Dinner'}</div>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <h6 className="fw-bold text-dark mb-2.5">Key Attractions & Places Visited</h6>
                <div className="d-flex flex-wrap gap-2">
                  {placesList.map((place, idx) => (
                    <span key={idx} className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-bold" style={{ fontSize: '0.76rem' }}>
                      📍 {place}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ITINERARY */}
          {activeTab === 'itinerary' && (
            <div className="animate-fade-in d-flex flex-column gap-3">
              {itinerary.map((day, idx) => {
                const isExp = expandedDay === idx;
                return (
                  <div key={idx} className="border rounded-3 overflow-hidden bg-white shadow-sm">
                    <div 
                      className="p-3 d-flex align-items-center justify-content-between cursor-pointer"
                      style={{ background: isExp ? '#f8fafc' : '#ffffff', cursor: 'pointer' }}
                      onClick={() => setExpandedDay(isExp ? -1 : idx)}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <span className="badge rounded-circle p-0 d-inline-flex align-items-center justify-content-center fw-bold" style={{ width: '28px', height: '28px', background: isExp ? '#FF6333' : '#0D1B2E', color: '#fff', fontSize: '0.75rem' }}>
                          {idx + 1}
                        </span>
                        <span className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>{day.title || `Day ${idx + 1}`}</span>
                      </div>
                      {isExp ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
                    </div>

                    {isExp && (
                      <div className="p-3 border-top bg-light" style={{ fontSize: '0.84rem' }}>
                        <p className="text-muted lh-base mb-2.5">{day.description}</p>
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
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: HOTEL & VEHICLE */}
          {activeTab === 'hotel_vehicle' && (
            <div className="animate-fade-in row g-3">
              <div className="col-md-6">
                <div className="p-3 rounded-4 border bg-white shadow-sm h-100">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <div className="p-2 rounded-3 text-primary bg-primary bg-opacity-10"><Hotel size={20} /></div>
                    <div>
                      <span className="text-muted small text-uppercase fw-bold" style={{ fontSize: '0.68rem' }}>Resort Stay</span>
                      <h6 className="fw-bold mb-0 text-dark">{pkg.hotel_included || 'JW Marriott Goa'}</h6>
                    </div>
                  </div>
                  <img src={getHotelPhoto()} alt="Resort" className="w-100 rounded-3 mb-3 object-fit-cover" style={{ height: '140px' }} />
                  <ul className="list-unstyled small text-muted d-flex flex-column gap-1.5 mb-0" style={{ fontSize: '0.78rem' }}>
                    <li className="d-flex align-items-center gap-1.5"><Check size={14} className="text-success" /> 5-Star Luxury Beachfront Resort</li>
                    <li className="d-flex align-items-center gap-1.5"><Check size={14} className="text-success" /> Daily Buffet Breakfast & Dinner Included</li>
                    <li className="d-flex align-items-center gap-1.5"><Check size={14} className="text-success" /> Swimming Pool, Spa & Free High-Speed WiFi</li>
                  </ul>
                </div>
              </div>

              <div className="col-md-6">
                <div className="p-3 rounded-4 border bg-white shadow-sm h-100">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <div className="p-2 rounded-3 text-success bg-success bg-opacity-10"><Car size={20} /></div>
                    <div>
                      <span className="text-muted small text-uppercase fw-bold" style={{ fontSize: '0.68rem' }}>Self-Drive Vehicle</span>
                      <h6 className="fw-bold mb-0 text-dark">{pkg.car_included || 'Mahindra Thar 4x4 / Swift'}</h6>
                    </div>
                  </div>
                  <img src={getVehiclePhoto()} alt="Vehicle" className="w-100 rounded-3 mb-3 object-fit-cover" style={{ height: '140px' }} />
                  <ul className="list-unstyled small text-muted d-flex flex-column gap-1.5 mb-0" style={{ fontSize: '0.78rem' }}>
                    <li className="d-flex align-items-center gap-1.5"><Check size={14} className="text-success" /> Free Airport Pickup & Drop Delivery</li>
                    <li className="d-flex align-items-center gap-1.5"><Check size={14} className="text-success" /> Sanitized, Verified & Zero Security Deposit</li>
                    <li className="d-flex align-items-center gap-1.5"><Check size={14} className="text-success" /> Unlimited Kilometers for Goa Sightseeing</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: INCLUSIONS & EXCLUSIONS */}
          {activeTab === 'inclusions' && (
            <div className="animate-fade-in row g-4">
              <div className="col-md-6">
                <h6 className="fw-bold mb-3 text-success d-flex align-items-center gap-1.5">
                  <CheckCircle size={16} /> What's Included
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
                  <XCircle size={16} /> What's Not Included
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
          )}

          {/* TAB 5: POLICIES & CANCELLATION */}
          {activeTab === 'policies' && (
            <div className="animate-fade-in d-flex flex-column gap-3">
              <div className="p-3 rounded-3 bg-light border">
                <h6 className="fw-bold text-dark mb-1 d-flex align-items-center gap-1.5" style={{ fontSize: '0.88rem' }}>
                  <RefreshCw size={15} className="text-primary" /> Flexible Cancellation Policy
                </h6>
                <p className="text-muted small mb-0">Cancel up to 48 hours prior to your scheduled trip date for a 100% full refund. No cancellation fees for weather or emergency flight schedule adjustments.</p>
              </div>

              <div className="p-3 rounded-3 bg-light border">
                <h6 className="fw-bold text-dark mb-1 d-flex align-items-center gap-1.5" style={{ fontSize: '0.88rem' }}>
                  <Shield size={15} className="text-success" /> 100% Verified Experience Guarantee
                </h6>
                <p className="text-muted small mb-0">All accommodations are 100% verified 4-star and 5-star properties. All vehicles are sanitized, insured, and GPS-equipped with 24x7 roadside assistance.</p>
              </div>

              <div className="p-3 rounded-3 bg-light border">
                <h6 className="fw-bold text-dark mb-1 d-flex align-items-center gap-1.5" style={{ fontSize: '0.88rem' }}>
                  <PhoneCall size={15} className="text-info" /> 24/7 Dedicated Concierge Support
                </h6>
                <p className="text-muted small mb-0">Our local Goa travel manager will be assigned to you via WhatsApp upon booking to coordinate seamless airport pickups, dinner reservations, and special requests.</p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Sticky Footer CTA */}
        <div className="px-4 py-3 bg-white border-top d-flex align-items-center justify-content-between sticky-bottom" style={{ zIndex: 10 }}>
          <div>
            <span className="text-muted small d-block" style={{ fontSize: '0.72rem' }}>Total Package Rate</span>
            <div className="d-flex align-items-baseline gap-1.5">
              <h3 className="fw-bold text-dark mb-0" style={{ color: '#FF6333' }}>
                ₹{price.toLocaleString('en-IN')}
              </h3>
              <span className="text-muted small">/ per person</span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-outline-secondary rounded-pill px-3 py-2 fw-bold"
              style={{ fontSize: '0.85rem' }}
            >
              Close
            </button>
            <button 
              type="button" 
              onClick={handleBookClick} 
              className="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow d-flex align-items-center gap-2"
              style={{ background: 'linear-gradient(90deg, #FF6333, #FF8A00)', borderColor: '#FF6333', fontSize: '0.92rem' }}
            >
              Book This Package <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
