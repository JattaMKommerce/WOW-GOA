import React, { useState, useEffect, useCallback } from 'react';
import {
  Car, Bike, Hotel, Plane, Users, CheckCircle, ArrowLeft, ArrowRight,
  Search, Star, MapPin, Zap, X, CreditCard, Shield, PlaneTakeoff, PlaneLanding, Calendar, User,
  Wand2, AlertCircle, BadgeCheck, Check, Loader2
} from 'lucide-react';
import * as api from '../../services/api';
import HotelImageGallery from '../../components/HotelImageGallery';
import { getTodayDateStr, getNextDayDateStr } from '../../utils/dateUtils';

// Fallback seed vehicles if API is empty or connecting
const FALLBACK_CARS = [
  { id: 101, name: 'Mahindra Thar 4x4', seating: 4, fuel: 'Diesel', price: 3200, is_available: 1, image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80', location: 'Goa (All Areas)' },
  { id: 102, name: 'Maruti Suzuki Swift', seating: 5, fuel: 'Petrol', price: 1400, is_available: 1, image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80', location: 'North Goa / Airport' },
  { id: 103, name: 'Hyundai Creta SX', seating: 5, fuel: 'Diesel', price: 2600, is_available: 1, image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80', location: 'Goa (Free Delivery)' },
  { id: 104, name: 'Maruti Suzuki Ertiga (7 Seater)', seating: 7, fuel: 'Petrol', price: 2800, is_available: 1, image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=400&q=80', location: 'Airport / Madgaon' }
];

const FALLBACK_BIKES = [
  { id: 201, name: 'Royal Enfield Classic 350', seating: 2, fuel: 'Petrol', price: 800, is_available: 1, image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80', location: 'Calangute / Baga' },
  { id: 202, name: 'Honda Activa 6G', seating: 2, fuel: 'Petrol', price: 450, is_available: 1, image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=400&q=80', location: 'All Goa' },
  { id: 203, name: 'Yamaha FZ-S V3', seating: 2, fuel: 'Petrol', price: 700, is_available: 1, image: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=400&q=80', location: 'Panaji / North Goa' }
];

// ─── Step Indicator ─────────────────────────────────────────────────────────
function StepIndicator({ currentStep }) {
  const steps = [
    { num: 1, label: 'Choose Ride', icon: Car },
    { num: 2, label: 'Pick Hotel', icon: Hotel },
    { num: 3, label: 'Add Flight', icon: Plane },
    { num: 4, label: 'Review & Pay', icon: CreditCard },
  ];

  return (
    <div className="cmt-step-indicator">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const isDone = currentStep > s.num;
        const isActive = currentStep === s.num;
        return (
          <React.Fragment key={s.num}>
            <div className={`cmt-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
              <div className="cmt-step-circle">
                {isDone ? <CheckCircle size={18} /> : <Icon size={18} />}
              </div>
              <span className="cmt-step-label">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`cmt-step-line ${isDone ? 'done' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Step 1: Choose Your Ride ────────────────────────────────────────────────
function Step1Vehicle({ allCars = [], allBikes = [], bookings = [], pickupDate, dropDate, selectedVehicle, setSelectedVehicle, memberCount, setMemberCount, onNext, onBack }) {
  const [vehicleType, setVehicleType] = useState(selectedVehicle?.vehicle_type === 'bike' || selectedVehicle?.type === 'bike' ? 'bike' : 'car');
  const [error, setError] = useState('');
  const [localCars, setLocalCars] = useState(allCars);
  const [localBikes, setLocalBikes] = useState(allBikes);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // Auto-fetch if parent props were empty on mount
  useEffect(() => {
    if ((!allCars || allCars.length === 0) && (!allBikes || allBikes.length === 0)) {
      setLoadingVehicles(true);
      Promise.all([api.fetchCars().catch(() => []), api.fetchBikes().catch(() => [])])
        .then(([c, b]) => {
          setLocalCars(c && c.length > 0 ? c : FALLBACK_CARS);
          setLocalBikes(b && b.length > 0 ? b : FALLBACK_BIKES);
        })
        .finally(() => setLoadingVehicles(false));
    } else {
      setLocalCars(allCars.length > 0 ? allCars : FALLBACK_CARS);
      setLocalBikes(allBikes.length > 0 ? allBikes : FALLBACK_BIKES);
    }
  }, [allCars, allBikes]);

  const isDateOverlap = (s1, e1, s2, e2) => {
    if (!s1 || !e1 || !s2 || !e2) return false;
    return new Date(s1) <= new Date(e2) && new Date(s2) <= new Date(e1);
  };

  const bookedIds = (bookings || [])
    .filter(b => isDateOverlap(b.pickup_date, b.drop_date, pickupDate, dropDate))
    .map(b => b.item_id)
    .filter(Boolean);

  const isItemAvailable = (item, prefix) => {
    if (item.is_available === 0 || item.is_available === '0' || item.is_available === false) return false;
    const isBooked = bookedIds.some(bid => String(bid) === String(item.id) || String(bid) === `${prefix}-${item.id}`);
    return !isBooked;
  };

  const availableCars = (localCars.length > 0 ? localCars : FALLBACK_CARS).filter(c => isItemAvailable(c, 'car'));
  const availableBikes = (localBikes.length > 0 ? localBikes : FALLBACK_BIKES).filter(b => isItemAvailable(b, 'bike'));

  const vehicles = vehicleType === 'car' ? availableCars : availableBikes;

  const maxMembers = selectedVehicle
    ? vehicleType === 'bike' ? 2 : (parseInt(selectedVehicle.seating) || 4)
    : vehicleType === 'bike' ? 2 : 6;

  const handleSelectVehicle = (v) => {
    setSelectedVehicle(v);
    const max = vehicleType === 'bike' ? 2 : (parseInt(v.seating) || 4);
    if (memberCount > max) setMemberCount(max);
    setError('');
  };

  const handleVehicleTypeChange = (type) => {
    setVehicleType(type);
    setSelectedVehicle(null);
    setMemberCount(1);
    setError('');
  };

  const handleNext = () => {
    if (!selectedVehicle) {
      setError('Please select a vehicle to continue, or click "Skip Ride".');
      return;
    }
    setError('');
    onNext();
  };

  const handleSkip = () => {
    setSelectedVehicle(null);
    setError('');
    onNext();
  };

  return (
    <div className="cmt-step-body animate-fade-in-up">
      <div className="cmt-step-header">
        <div className="cmt-step-icon-wrap" style={{ background: 'linear-gradient(135deg,#0052ff,#00c6ff)' }}>
          <Car size={28} color="#fff" />
        </div>
        <div>
          <h2 className="cmt-step-title">Choose Your Ride</h2>
          <p className="cmt-step-sub">Pick a self-drive vehicle or skip if you already have local transport</p>
        </div>
      </div>

      {/* Vehicle Type Toggle */}
      <div className="cmt-toggle-row">
        <button
          type="button"
          className={`cmt-toggle-btn ${vehicleType === 'car' ? 'active' : ''}`}
          onClick={() => handleVehicleTypeChange('car')}
        >
          <Car size={20} /> Cars <span className="cmt-badge">{availableCars.length}</span>
        </button>
        <button
          type="button"
          className={`cmt-toggle-btn ${vehicleType === 'bike' ? 'active' : ''}`}
          onClick={() => handleVehicleTypeChange('bike')}
        >
          <Bike size={20} /> Bikes <span className="cmt-badge">{availableBikes.length}</span>
        </button>
      </div>

      {vehicleType === 'bike' && (
        <div className="cmt-info-banner">
          <AlertCircle size={16} />
          <span>Bikes support a maximum of <strong>2 members</strong> (rider + 1 pillion)</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loadingVehicles && (
        <div className="text-center py-5">
          <Loader2 size={32} className="animate-spin text-primary mb-2" />
          <p className="text-muted fw-semibold">Loading available vehicles for your dates...</p>
        </div>
      )}

      {/* Vehicle Grid */}
      {!loadingVehicles && (
        <div className="cmt-vehicle-grid">
          {vehicles.length === 0 && (
            <div className="cmt-empty">
              <Car size={40} opacity={0.3} />
              <p>No {vehicleType}s available for your selected dates. Click "Skip Ride" to proceed with Hotel & Flight.</p>
            </div>
          )}
          {vehicles.map(v => {
            const isSelected = selectedVehicle?.id === v.id;
            const seats = vehicleType === 'bike' ? 2 : (parseInt(v.seating) || 4);
            return (
              <div
                key={v.id}
                className={`cmt-vehicle-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectVehicle(v)}
              >
                {isSelected && <div className="cmt-selected-badge"><CheckCircle size={16} /> Selected</div>}
                <div className="cmt-vehicle-img-wrap">
                  <img
                    src={v.image || `https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=400&q=80`}
                    alt={v.name}
                    className="cmt-vehicle-img"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80'; }}
                  />
                  <div className="cmt-vehicle-type-tag">{vehicleType === 'bike' ? '🏍️ Bike' : '🚗 Car'}</div>
                </div>
                <div className="cmt-vehicle-info">
                  <h4 className="cmt-vehicle-name">{v.name}</h4>
                  {v.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#0052ff', fontWeight: 600, marginBottom: '6px' }}>
                      <MapPin size={11} /> {v.location}
                    </div>
                  )}
                  <div className="cmt-vehicle-specs">
                    <span><Users size={13} /> {seats} seats</span>
                    {v.fuel && <span>⛽ {v.fuel}</span>}
                    {v.category && <span>🏷️ {v.category}</span>}
                  </div>
                  <div className="cmt-vehicle-price">
                    <span className="cmt-price-label">per day</span>
                    <span className="cmt-price-val">₹{Number(v.price).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Member Count */}
      {selectedVehicle && (
        <div className="cmt-member-section">
          <h5 className="cmt-section-label"><Users size={16} /> Number of Members</h5>
          <div className="cmt-member-slots">
            {Array.from({ length: maxMembers }).map((_, i) => (
              <div
                key={i}
                className={`cmt-member-slot ${i < memberCount ? 'active' : ''}`}
                onClick={() => setMemberCount(i + 1)}
              >
                <User size={20} />
                <span>{i === 0 ? 'You' : `+${i}`}</span>
              </div>
            ))}
          </div>
          <p className="cmt-member-hint">
            {memberCount} member{memberCount > 1 ? 's' : ''} selected
            {vehicleType === 'bike' && ' • Max 2 for bikes'}
          </p>
        </div>
      )}

      {error && <div className="cmt-error"><AlertCircle size={15} /> {error}</div>}

      <div className="cmt-nav-row">
        <button type="button" className="cmt-btn-secondary" onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="cmt-btn-secondary" onClick={handleSkip}>Skip Ride</button>
          <button type="button" className="cmt-btn-primary" onClick={handleNext}>
            Next: Pick Hotel <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Pick Hotel ──────────────────────────────────────────────────────
const GOA_HOTEL_AREAS = [
  'North Goa', 'South Goa', 'Panaji', 'Calangute', 'Baga', 'Anjuna',
  'Vagator', 'Candolim', 'Sinquerim', 'Morjim', 'Arambol', 'Mapusa',
  'Margao', 'Vasco da Gama', 'Colva', 'Benaulim', 'Palolem', 'Ponda'
];

function Step2Hotel({ allHotels = [], pickupDate, dropDate, selectedHotel, setSelectedHotel, memberCount, onNext, onBack }) {
  const [searchLoc, setSearchLoc] = useState('Goa');
  const [liveHotels, setLiveHotels] = useState([]);
  const [loadingLive, setLoadingLive] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [galleryHotel, setGalleryHotel] = useState(null);

  const validPickup = pickupDate || getTodayDateStr();
  const validDrop = dropDate || getNextDayDateStr(validPickup);
  const nights = Math.max(1, Math.ceil((new Date(validDrop) - new Date(validPickup)) / (1000 * 60 * 60 * 24)));

  const handleSearchLive = useCallback(async (overrideLoc) => {
    const locationToSearch = typeof overrideLoc === 'string' ? overrideLoc : searchLoc;
    setLoadingLive(true);
    setError('');
    
    try {
      let pool = allHotels;
      if (!pool || pool.length === 0) {
        pool = await api.fetchHotels().catch(() => []);
      }
      
      const locClean = (locationToSearch || 'Goa').toLowerCase();
      const results = pool.filter(h => {
        const hName = (h.name || '').toLowerCase();
        const hArea = (h.area || '').toLowerCase();
        const hLoc = (h.location || '').toLowerCase();
        return locClean === 'goa' || locClean === 'all goa' || hArea.includes(locClean) || hName.includes(locClean) || hLoc.includes(locClean);
      });

      setLiveHotels(results.length > 0 ? results : pool);
      setHasSearched(true);
    } catch (e) {
      setError(`Could not fetch hotels for "${locationToSearch}".`);
      setLiveHotels(allHotels || []);
      setHasSearched(true);
    } finally {
      setLoadingLive(false);
    }
  }, [searchLoc, allHotels]);

  useEffect(() => {
    handleSearchLive('Goa');
  }, []);

  const handleAreaClick = (area) => {
    const newLoc = area + ', Goa';
    setSearchLoc(newLoc);
    handleSearchLive(newLoc);
  };

  const handleNext = () => {
    if (!selectedHotel) {
      setError('Please select a hotel to continue, or click "Skip Hotel".');
      return;
    }
    setError('');
    onNext();
  };

  const handleSkip = () => {
    setSelectedHotel(null);
    setError('');
    onNext();
  };

  const getHotelNightPrice = (hotel) => {
    const p = parseFloat(hotel.price_per_night || hotel.price || hotel.rate || 0);
    return isNaN(p) || p === 0 ? 2500 : p;
  };

  return (
    <div className="cmt-step-body animate-fade-in-up">
      <div className="cmt-step-header">
        <div className="cmt-step-icon-wrap" style={{ background: 'linear-gradient(135deg,#ff6b35,#f7c59f)' }}>
          <Hotel size={28} color="#fff" />
        </div>
        <div>
          <h2 className="cmt-step-title">Pick Your Hotel</h2>
          <p className="cmt-step-sub">Select a stay or skip if you have your own accommodation · {nights} night{nights > 1 ? 's' : ''} · {memberCount} guest{memberCount > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Live Search Bar */}
      <div className="cmt-search-bar" style={{ marginBottom: '15px' }}>
        <div className="cmt-search-input-wrap">
          <MapPin size={16} className="cmt-search-icon" />
          <input
            type="text"
            className="cmt-search-input"
            placeholder="Search location e.g. Goa, North Goa, Calangute..."
            value={searchLoc}
            onChange={e => setSearchLoc(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearchLive()}
          />
        </div>
        <button type="button" className="cmt-btn-search" onClick={handleSearchLive} disabled={loadingLive}>
          {loadingLive ? <span className="cmt-spinner" /> : <Search size={16} />}
          {loadingLive ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Quick Goa Area Selector */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {GOA_HOTEL_AREAS.map(area => (
            <button
              key={area}
              type="button"
              onClick={() => handleAreaClick(area)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid #e5e7eb',
                background: searchLoc === (area + ', Goa') ? '#eff6ff' : '#fff',
                color: searchLoc === (area + ', Goa') ? '#0052ff' : '#6b7280',
                fontWeight: searchLoc === (area + ', Goa') ? 700 : 500,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="cmt-error"><AlertCircle size={15} /> {error}</div>}

      {/* Hotel List */}
      <div className="mmt-hotel-list">
        {loadingLive && (
          <div className="text-center py-5">
            <Loader2 size={32} className="animate-spin text-primary mb-2" />
            <p className="text-muted fw-semibold">Finding premium hotels in Goa...</p>
          </div>
        )}
        {!loadingLive && hasSearched && liveHotels.length === 0 && (
          <div className="cmt-empty text-center py-5 bg-white rounded border">
            <Hotel size={40} opacity={0.3} className="mb-3" />
            <h4 className="text-muted">No hotels found in {searchLoc}. Try searching for "Goa".</h4>
          </div>
        )}
        {!loadingLive && liveHotels.map((h, idx) => {
          const isSelected = selectedHotel?.id === h.id || (selectedHotel?.name === h.name);
          const nightPrice = getHotelNightPrice(h);
          const totalHotelPrice = nightPrice * nights;
          const stars = parseInt(h.stars || h.star_rating || h.rating || 3);
          
          return (
            <div 
              key={h.id || idx} 
              className={`mmt-hotel-card ${isSelected ? 'border-primary' : ''}`}
              style={{ 
                cursor: 'pointer', 
                borderWidth: isSelected ? '2px' : '1px', 
                boxShadow: isSelected ? '0 8px 24px rgba(0,82,255,0.15)' : '',
                position: 'relative'
              }}
              onClick={() => setSelectedHotel({ ...h, _nightPrice: nightPrice, _totalPrice: totalHotelPrice, _nights: nights })}
            >
              {isSelected && (
                <div className="position-absolute top-0 end-0 m-2" style={{ zIndex: 10 }}>
                  <CheckCircle size={28} color="#0052ff" fill="#fff" />
                </div>
              )}
              <div className="mmt-hotel-img-wrapper" onClick={(e) => { e.stopPropagation(); setGalleryHotel(h); }} style={{ cursor: 'pointer', position: 'relative' }}>
                <img 
                  src={h.image || h.photo || `https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80`} 
                  alt={h.name} 
                  className="mmt-hotel-img" 
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80'; }}
                />
                <span className="position-absolute top-0 start-0 m-3 badge bg-dark text-white rounded-pill shadow-sm">
                  {h.badge || 'Verified Stay'}
                </span>
                <div className="position-absolute bottom-0 end-0 m-2 badge bg-dark bg-opacity-75 text-white rounded shadow-sm">
                  View Photos
                </div>
              </div>
              
              <div className="mmt-hotel-info">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <div className="d-flex text-warning">
                        {[...Array(Math.min(stars, 5))].map((_, i) => (
                          <Star key={i} size={14} fill="currentColor" />
                        ))}
                      </div>
                    </div>
                    <h3 className="mmt-hotel-title">{h.name}</h3>
                    <div className="mmt-hotel-location">
                      <MapPin size={14} />
                      {h.area || h.location || searchLoc}
                    </div>
                  </div>
                  
                  <div className="d-flex flex-column align-items-end">
                    <div className="d-flex align-items-center bg-success text-white px-2 py-1 rounded mb-1">
                      <span className="fw-bold fs-6">{h.rating || 4.5}</span>
                      <span className="ms-1 small">/ 5</span>
                    </div>
                    <span className="small text-muted fw-semibold">Excellent</span>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="text-success small fw-bold d-flex align-items-center mb-1">
                    <Check size={14} className="me-1" /> Free Cancellation till 24 hrs before check-in
                  </span>
                  <div className="text-muted small">
                    {h.amenities ? (Array.isArray(h.amenities) ? h.amenities.slice(0, 4).join(' • ') : h.amenities) : 'Free WiFi • Pool • Breakfast'}
                  </div>
                </div>

                <div className="mmt-hotel-price-row">
                  <div>
                    <span className="mmt-hotel-price">₹{nightPrice.toLocaleString('en-IN')}</span>
                    <span className="mmt-hotel-per-night"> / night</span>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                      ₹{totalHotelPrice.toLocaleString('en-IN')} for {nights} night{nights > 1 ? 's' : ''} (excl. taxes)
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline-primary'} px-3 fw-bold rounded-pill`}
                  >
                    {isSelected ? 'Selected' : 'Select Hotel'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="cmt-nav-row">
        <button type="button" className="cmt-btn-secondary" onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="cmt-btn-secondary" onClick={handleSkip}>Skip Hotel</button>
          <button type="button" className="cmt-btn-primary" onClick={handleNext}>
            Next: Flight Options <ArrowRight size={16} />
          </button>
        </div>
      </div>
      
      {galleryHotel && (
        <HotelImageGallery 
          hotel={galleryHotel} 
          nights={nights}
          onSelect={() => {
            const nightPrice = getHotelNightPrice(galleryHotel);
            const totalHotelPrice = nightPrice * nights;
            setSelectedHotel({ ...galleryHotel, _nightPrice: nightPrice, _totalPrice: totalHotelPrice, _nights: nights });
            setGalleryHotel(null);
          }}
          onClose={() => setGalleryHotel(null)} 
        />
      )}
    </div>
  );
}

// ─── Step 3: Add Flight (Optional) ──────────────────────────────────────────
function Step3Flight({ selectedFlight, setSelectedFlight, withFlight, setWithFlight, pickupDate, memberCount, onNext, onBack }) {
  const [fromAirport, setFromAirport] = useState('DEL');
  const [toAirport, setToAirport] = useState('GOI');
  const [flightDate, setFlightDate] = useState(pickupDate || getTodayDateStr());
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!fromAirport || !toAirport || !flightDate) {
      setError('Please fill From, To, and Date fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const results = await api.searchFlights(fromAirport, toAirport, flightDate, memberCount, 0, 0, 'economy');
      setFlights(results || []);
      setSearched(true);
    } catch (e) {
      setError('Could not fetch flights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (withFlight && !selectedFlight) {
      setError('Please select a flight, or choose "Without Flight".');
      return;
    }
    setError('');
    onNext();
  };

  return (
    <div className="cmt-step-body animate-fade-in-up">
      <div className="cmt-step-header">
        <div className="cmt-step-icon-wrap" style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>
          <Plane size={28} color="#fff" />
        </div>
        <div>
          <h2 className="cmt-step-title">Add a Flight?</h2>
          <p className="cmt-step-sub">Flights are <strong>optional</strong> — skip if you're already in Goa!</p>
        </div>
      </div>

      {/* With / Without Toggle */}
      <div className="cmt-flight-toggle-row">
        <button
          type="button"
          className={`cmt-flight-toggle ${withFlight ? 'active' : ''}`}
          onClick={() => { setWithFlight(true); setSelectedFlight(null); }}
        >
          <PlaneTakeoff size={18} /> With Flight
        </button>
        <button
          type="button"
          className={`cmt-flight-toggle ${!withFlight ? 'active-no' : ''}`}
          onClick={() => { setWithFlight(false); setSelectedFlight(null); setFlights([]); setSearched(false); }}
        >
          <X size={18} /> Without Flight
        </button>
      </div>

      {!withFlight && (
        <div className="cmt-no-flight-card">
          <BadgeCheck size={40} color="#10b981" />
          <h4>No Flight Selected</h4>
          <p>You'll arrange your own travel to Goa. We'll focus on your stay and vehicle! 🏖️</p>
        </div>
      )}

      {withFlight && (
        <>
          {/* Search Form */}
          <div className="cmt-flight-search-form">
            <div className="cmt-flight-field">
              <label><PlaneTakeoff size={14} /> From (IATA Code)</label>
              <input
                className="cmt-input"
                placeholder="e.g. DEL, BOM, BLR"
                value={fromAirport}
                onChange={e => setFromAirport(e.target.value.toUpperCase())}
              />
            </div>
            <div className="cmt-flight-field">
              <label><PlaneLanding size={14} /> To (IATA Code)</label>
              <input
                className="cmt-input"
                placeholder="e.g. GOI"
                value={toAirport}
                onChange={e => setToAirport(e.target.value.toUpperCase())}
              />
            </div>
            <div className="cmt-flight-field">
              <label><Calendar size={14} /> Travel Date</label>
              <input
                type="date"
                className="cmt-input"
                min={getTodayDateStr()}
                value={flightDate}
                onChange={e => setFlightDate(e.target.value)}
                required
              />
            </div>
            <div className="cmt-flight-field">
              <label><Users size={14} /> Passengers</label>
              <div className="cmt-input cmt-input-static">{memberCount} Adult{memberCount > 1 ? 's' : ''}</div>
            </div>
            <button type="button" className="cmt-btn-search cmt-flight-search-btn" onClick={handleSearch} disabled={loading}>
              {loading ? <span className="cmt-spinner" /> : <Search size={16} />}
              {loading ? 'Searching...' : 'Search Flights'}
            </button>
          </div>

          {error && <div className="cmt-error"><AlertCircle size={15} /> {error}</div>}

          {/* Flight Results */}
          {searched && (
            <div className="mmt-flight-list mt-4">
              {flights.length === 0 && (
                <div className="text-center py-5 bg-white rounded border">
                  <Plane size={40} opacity={0.3} className="mb-3" />
                  <h4 className="text-muted">No direct flights found. Showing standard Goa flight options.</h4>
                </div>
              )}
              {flights.map((f, i) => {
                const isSelected = selectedFlight?.id === f.id;
                const airlineName = f.airline?.name || f.airline || 'IndiGo';
                const depTime = f.departure_time || '08:00';
                const arrTime = f.arrival_time || '10:30';
                const price = parseFloat(f.price || 4500);
                const totalFlightPrice = (price * memberCount).toLocaleString('en-IN');

                return (
                  <div 
                    key={f.id || i} 
                    className="card border-0 shadow-sm rounded mb-3" 
                    style={{ borderWidth: isSelected ? '2px' : '1px', borderStyle: 'solid', borderColor: isSelected ? '#0d6efd' : '#e5e7eb', cursor: 'pointer' }}
                    onClick={() => setSelectedFlight(f)}
                  >
                    <div className="card-body p-3 d-flex flex-column flex-md-row align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-3">
                        <div className="fw-bold text-dark">{airlineName} ({f.flight_number || '6E-204'})</div>
                      </div>
                      
                      <div className="d-flex align-items-center gap-4 my-2 my-md-0">
                        <div className="text-center">
                          <div className="fw-bold text-dark">{depTime}</div>
                          <span className="text-muted small">{f.from_loc || fromAirport}</span>
                        </div>
                        <span className="small text-muted">✈️ 2h 30m</span>
                        <div className="text-center">
                          <div className="fw-bold text-dark">{arrTime}</div>
                          <span className="text-muted small">{f.to_loc || toAirport}</span>
                        </div>
                      </div>

                      <div className="text-end">
                        <div className="fw-bold text-dark fs-5">₹{price.toLocaleString('en-IN')}</div>
                        <div className="small text-muted mb-2">Total: ₹{totalFlightPrice}</div>
                        <button type="button" className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline-primary'} rounded-pill px-3`}>
                          {isSelected ? 'Selected ✓' : 'Select'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <div className="cmt-nav-row">
        <button type="button" className="cmt-btn-secondary" onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <button type="button" className="cmt-btn-primary" onClick={handleNext}>
          Next: Review & Pay <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: Review & Pay ────────────────────────────────────────────────────
function Step4ReviewPay({ selectedVehicle, selectedHotel, selectedFlight, withFlight, memberCount, pickupDate, dropDate, onBack, onConfirm }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [license, setLicense] = useState('');
  const [paymentMode, setPaymentMode] = useState('full');
  const [showSuccess, setShowSuccess] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  const validPickup = pickupDate || getTodayDateStr();
  const validDrop = dropDate || getNextDayDateStr(validPickup);
  const nights = Math.max(1, Math.ceil((new Date(validDrop) - new Date(validPickup)) / (1000 * 60 * 60 * 24)));

  const vehiclePrice = selectedVehicle ? (parseFloat(selectedVehicle.price) || 0) * nights : 0;
  const hotelPrice = selectedHotel ? (selectedHotel._totalPrice || (parseFloat(selectedHotel.price_per_night || selectedHotel.price || 2500) * nights)) : 0;
  const flightPrice = withFlight && selectedFlight ? (parseFloat(selectedFlight.price) || 4500) * memberCount : 0;

  const subtotal = vehiclePrice + hotelPrice + flightPrice;
  const gst = Math.round(subtotal * 0.18);
  const serviceFee = subtotal > 0 ? 250 : 0;
  const grandTotal = subtotal + gst + serviceFee;
  const advanceAmount = Math.round(grandTotal * 0.3);
  const amountDue = paymentMode === 'full' ? grandTotal : advanceAmount;

  const handleConfirm = async () => {
    if (!selectedVehicle && !selectedHotel && (!withFlight || !selectedFlight)) {
      setError('Please select at least one item (Vehicle, Hotel, or Flight) to book.');
      return;
    }
    if (!name || !phone) {
      setError('Please fill in your name and phone number.');
      return;
    }
    setError('');
    setBooking(true);

    const itemName = [
      selectedVehicle ? selectedVehicle.name : null,
      selectedHotel ? selectedHotel.name : null,
      withFlight && selectedFlight ? (selectedFlight.airline?.name || selectedFlight.airline || 'Flight') : null
    ].filter(Boolean).join(' + ') || 'Custom Goa Holiday';

    try {
      await api.createBooking({
        name,
        phone,
        license,
        pickup_loc: selectedVehicle?.location || 'Goa',
        pickup_date: validPickup,
        drop_date: validDrop,
        item_id: `craft-${Date.now()}`,
        item_name: `Craft My Trip: ${itemName}`,
        booking_days: nights,
        total_amount: grandTotal,
        amount_paid: amountDue,
        remaining_amount: grandTotal - amountDue,
        total_paid: amountDue,
        status: 'Confirmed',
        payment_status: paymentMode === 'full' ? 'Full' : 'Partial',
        customizations: JSON.stringify({
          vehicle: selectedVehicle ? { id: selectedVehicle.id, name: selectedVehicle.name, price: vehiclePrice } : null,
          hotel: selectedHotel ? { id: selectedHotel.id, name: selectedHotel.name, price: hotelPrice } : null,
          flight: withFlight && selectedFlight ? { id: selectedFlight.id, airline: selectedFlight.airline, price: flightPrice } : null,
          members: memberCount,
          payment_mode: paymentMode
        })
      });
      setShowSuccess(true);
      if (onConfirm) onConfirm();
    } catch (e) {
      setError('Booking failed: ' + e.message);
    } finally {
      setBooking(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="cmt-success-screen animate-fade-in-up">
        <div className="cmt-success-circle">
          <CheckCircle size={64} color="#10b981" />
        </div>
        <h2>Booking Confirmed! 🎉</h2>
        <p>Your custom Goa trip has been booked successfully.</p>
        <div className="cmt-success-summary">
          {selectedVehicle && <div><strong>Vehicle:</strong> {selectedVehicle.name}</div>}
          {selectedHotel && <div><strong>Hotel:</strong> {selectedHotel.name}</div>}
          {withFlight && selectedFlight && (
            <div><strong>Flight:</strong> {selectedFlight.airline?.name || selectedFlight.airline}</div>
          )}
          <div><strong>Total Amount:</strong> ₹{grandTotal.toLocaleString('en-IN')}</div>
          <div><strong>Amount Paid:</strong> ₹{amountDue.toLocaleString('en-IN')} ({paymentMode === 'full' ? 'Full' : '30% Advance'})</div>
        </div>
        <p className="cmt-success-note">Our team will contact you at <strong>{phone}</strong> shortly to confirm details.</p>
      </div>
    );
  }

  return (
    <div className="cmt-step-body animate-fade-in-up">
      <div className="cmt-step-header">
        <div className="cmt-step-icon-wrap" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
          <CreditCard size={28} color="#fff" />
        </div>
        <div>
          <h2 className="cmt-step-title">Review & Pay</h2>
          <p className="cmt-step-sub">Review your customized package breakdown before confirming</p>
        </div>
      </div>

      <div className="cmt-review-grid">
        {/* Itemized Summary */}
        <div className="cmt-summary-card">
          <h5 className="cmt-summary-title">Trip Summary ({nights} Days · {memberCount} Member{memberCount > 1 ? 's' : ''})</h5>
          
          <div className="cmt-summary-items">
            {selectedVehicle ? (
              <div className="cmt-summary-item">
                <div className="d-flex align-items-center gap-2">
                  <Car size={18} className="text-primary" />
                  <div>
                    <div className="fw-bold">{selectedVehicle.name}</div>
                    <div className="text-muted small">₹{Number(selectedVehicle.price).toLocaleString('en-IN')} × {nights} days</div>
                  </div>
                </div>
                <span className="fw-bold">₹{vehiclePrice.toLocaleString('en-IN')}</span>
              </div>
            ) : (
              <div className="cmt-summary-item text-muted">
                <div className="d-flex align-items-center gap-2">
                  <Car size={18} opacity={0.4} />
                  <span>No vehicle selected (Skipped)</span>
                </div>
                <span>₹0</span>
              </div>
            )}

            {selectedHotel ? (
              <div className="cmt-summary-item">
                <div className="d-flex align-items-center gap-2">
                  <Hotel size={18} className="text-warning" />
                  <div>
                    <div className="fw-bold">{selectedHotel.name}</div>
                    <div className="text-muted small">{nights} night{nights > 1 ? 's' : ''}</div>
                  </div>
                </div>
                <span className="fw-bold">₹{hotelPrice.toLocaleString('en-IN')}</span>
              </div>
            ) : (
              <div className="cmt-summary-item text-muted">
                <div className="d-flex align-items-center gap-2">
                  <Hotel size={18} opacity={0.4} />
                  <span>No hotel selected (Skipped)</span>
                </div>
                <span>₹0</span>
              </div>
            )}

            {withFlight && selectedFlight ? (
              <div className="cmt-summary-item">
                <div className="d-flex align-items-center gap-2">
                  <Plane size={18} className="text-info" />
                  <div>
                    <div className="fw-bold">{selectedFlight.airline?.name || selectedFlight.airline || 'Flight'}</div>
                    <div className="text-muted small">{memberCount} passenger{memberCount > 1 ? 's' : ''}</div>
                  </div>
                </div>
                <span className="fw-bold">₹{flightPrice.toLocaleString('en-IN')}</span>
              </div>
            ) : (
              <div className="cmt-summary-item text-muted">
                <div className="d-flex align-items-center gap-2">
                  <Plane size={18} opacity={0.4} />
                  <span>No flight selected</span>
                </div>
                <span>₹0</span>
              </div>
            )}
          </div>

          <div className="cmt-price-breakdown">
            <div className="cmt-price-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="cmt-price-row">
              <span>GST (18%)</span>
              <span>₹{gst.toLocaleString('en-IN')}</span>
            </div>
            <div className="cmt-price-row">
              <span>Convenience / Service Fee</span>
              <span>₹{serviceFee}</span>
            </div>
            <div className="cmt-grand-total">
              <span>Grand Total</span>
              <span className="cmt-grand-total-val">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Payment Mode */}
          <div className="cmt-payment-toggle">
            <button
              type="button"
              className={`cmt-pay-btn ${paymentMode === 'full' ? 'active' : ''}`}
              onClick={() => setPaymentMode('full')}
            >
              <Shield size={15} /> Pay Full
              <span>₹{grandTotal.toLocaleString('en-IN')}</span>
            </button>
            <button
              type="button"
              className={`cmt-pay-btn ${paymentMode === 'advance' ? 'active' : ''}`}
              onClick={() => setPaymentMode('advance')}
            >
              <Zap size={15} /> Pay 30% Advance
              <span>₹{advanceAmount.toLocaleString('en-IN')}</span>
            </button>
          </div>
        </div>

        {/* Traveller Details */}
        <div className="cmt-traveller-card">
          <h5 className="cmt-summary-title">👤 Contact Details</h5>
          <div className="cmt-form-group">
            <label><User size={14} /> Full Name *</label>
            <input className="cmt-input" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="cmt-form-group">
            <label>📞 Phone *</label>
            <input className="cmt-input" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div className="cmt-form-group">
            <label>✉️ Email</label>
            <input className="cmt-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          {selectedVehicle && (
            <div className="cmt-form-group">
              <label>🪪 Driving License No.</label>
              <input className="cmt-input" placeholder="Required for vehicle pickup" value={license} onChange={e => setLicense(e.target.value)} />
            </div>
          )}

          <div className="cmt-you-pay-box">
            <div className="cmt-you-pay-label">You Pay {paymentMode === 'advance' ? '(30% Advance)' : '(Full Amount)'}</div>
            <div className="cmt-you-pay-amount">₹{amountDue.toLocaleString('en-IN')}</div>
            {paymentMode === 'advance' && (
              <div className="cmt-you-pay-note">Remaining ₹{(grandTotal - amountDue).toLocaleString('en-IN')} due at check-in</div>
            )}
          </div>

          {error && <div className="cmt-error"><AlertCircle size={15} /> {error}</div>}

          <button
            type="button"
            className="cmt-btn-confirm"
            onClick={handleConfirm}
            disabled={booking || subtotal === 0}
          >
            {booking ? <span className="cmt-spinner" /> : <CheckCircle size={18} />}
            {booking ? 'Confirming...' : `Confirm Booking · ₹${amountDue.toLocaleString('en-IN')}`}
          </button>

          <div className="cmt-secure-note">
            <Shield size={13} /> Secure booking · Instant confirmation
          </div>
        </div>
      </div>

      <div className="cmt-nav-row" style={{ marginTop: '24px' }}>
        <button type="button" className="cmt-btn-secondary" onClick={onBack}><ArrowLeft size={16} /> Back</button>
      </div>
    </div>
  );
}

// ─── Main CraftMyTripPage ────────────────────────────────────────────────────
export default function CraftMyTripPage({ allCars = [], allBikes = [], allHotels = [], pickupDate, dropDate, bookings = [], onBack }) {
  const [step, setStep] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [memberCount, setMemberCount] = useState(1);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [withFlight, setWithFlight] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);

  const goNext = () => setStep(s => Math.min(s + 1, 4));
  const goBack = () => {
    if (step === 1) { onBack(); return; }
    setStep(s => s - 1);
  };

  return (
    <div className="cmt-page">
      {/* Page Header */}
      <div className="cmt-page-hero">
        <div className="cmt-hero-content">
          <div className="cmt-hero-badge"><Wand2 size={16} /> Build From Scratch</div>
          <h1 className="cmt-hero-title">Craft My Trip</h1>
          <p className="cmt-hero-sub">Design your perfect Goa getaway — choose your ride, stay, and fly your way</p>
          <div className="cmt-hero-chips">
            <span>🚗 Self Drive Vehicle</span>
            <span>+</span>
            <span>🏨 Hotel Stay</span>
            <span>+</span>
            <span>✈️ Optional Flight</span>
          </div>
        </div>
      </div>

      <div className="cmt-content">
        <StepIndicator currentStep={step} />

        {step === 1 && (
          <Step1Vehicle
            allCars={allCars}
            allBikes={allBikes}
            bookings={bookings}
            pickupDate={pickupDate}
            dropDate={dropDate}
            selectedVehicle={selectedVehicle}
            setSelectedVehicle={setSelectedVehicle}
            memberCount={memberCount}
            setMemberCount={setMemberCount}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {step === 2 && (
          <Step2Hotel
            allHotels={allHotels}
            pickupDate={pickupDate}
            dropDate={dropDate}
            selectedHotel={selectedHotel}
            setSelectedHotel={setSelectedHotel}
            memberCount={memberCount}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {step === 3 && (
          <Step3Flight
            selectedFlight={selectedFlight}
            setSelectedFlight={setSelectedFlight}
            withFlight={withFlight}
            setWithFlight={setWithFlight}
            pickupDate={pickupDate}
            memberCount={memberCount}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {step === 4 && (
          <Step4ReviewPay
            selectedVehicle={selectedVehicle}
            selectedHotel={selectedHotel}
            selectedFlight={selectedFlight}
            withFlight={withFlight}
            memberCount={memberCount}
            pickupDate={pickupDate}
            dropDate={dropDate}
            onBack={goBack}
            onConfirm={null}
          />
        )}
      </div>
    </div>
  );
}
