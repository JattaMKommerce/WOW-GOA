import React from 'react';
import {
  SlidersHorizontal, X, Check, Car, Bike, Hotel, Plane,
  Compass, Fuel, Gauge, DollarSign, MapPin, Sparkles, Utensils, Calendar
} from 'lucide-react';

export const VEHICLE_TYPES = ['Two Wheelers', 'Four Wheelers', 'Luxury Cars'];
export const CAR_SUB_FILTERS = ['Hatchback', 'Sedan', 'SUV', '7-Seater / MUV', 'Open Top / Thar', 'Convertible'];
export const BIKE_SUB_FILTERS = ['Scooters', 'Cruiser / Royal Enfield', 'Sports Bikes', 'Electric / EV'];
export const TRANSMISSIONS = ['Manual', 'Automatic'];
export const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric / EV'];
export const SEATING_OPTIONS = ['2 Seater', '4–5 Seater', '7+ Seater'];
export const VEHICLE_BUDGETS = [
  { id: '< 1500', label: 'Under ₹1,500' },
  { id: '1500-3000', label: '₹1,500–₹3,000' },
  { id: '3000-6000', label: '₹3,000–₹6,000' },
  { id: '> 6000', label: 'Above ₹6,000' }
];
export const VEHICLE_FEATURES = ['Unlimited KM', 'Free Airport Handover', 'Zero Security Deposit', 'Instant Booking'];

export const HOTEL_STARS = [
  { id: '3', label: '3★ Standard' },
  { id: '4', label: '4★ Premium' },
  { id: '5', label: '5★ Luxury' },
  { id: 'boutique', label: 'Heritage / Boutique' }
];
export const HOTEL_PROPERTY_TYPES = ['Beach Resort', 'Luxury Villa', 'Boutique Hotel', 'Budget Stay', 'Service Apartment'];
export const HOTEL_PRICES = [
  { id: '< 3000', label: 'Under ₹3,000' },
  { id: '3000-6000', label: '₹3,000–₹6,000' },
  { id: '6000-10000', label: '₹6,000–₹10,000' },
  { id: '> 10000', label: 'Above ₹10,000' }
];
export const HOTEL_NORTH_GOA_AREAS = ['Calangute', 'Baga', 'Candolim', 'Anjuna', 'Panaji'];
export const HOTEL_SOUTH_GOA_AREAS = ['Colva', 'Benaulim', 'Palolem'];
export const HOTEL_AMENITIES = [
  'Swimming Pool', 'Beach Access / Sea View', 'Free Breakfast',
  'Spa & Wellness', 'Free Wi-Fi', 'Bar & Lounge', 'Pet Friendly'
];

export const FLIGHT_STOPS = ['Non-Stop / Direct', '1 Stop', '2+ Stops'];
export const FLIGHT_DEP_TIMES = [
  { id: 'early_morning', label: 'Early Morning — Before 6 AM' },
  { id: 'morning', label: 'Morning — 6 AM–12 PM' },
  { id: 'afternoon', label: 'Afternoon — 12 PM–6 PM' },
  { id: 'evening', label: 'Evening/Night — After 6 PM' }
];
export const FLIGHT_ARR_TIMES = [
  { id: 'early_morning', label: 'Early Morning — Before 6 AM' },
  { id: 'morning', label: 'Morning — 6 AM–12 PM' },
  { id: 'afternoon', label: 'Afternoon — 12 PM–6 PM' },
  { id: 'evening', label: 'Evening/Night — After 6 PM' }
];
export const FLIGHT_AIRLINES = ['IndiGo', 'Air India', 'Air India Express', 'Akasa Air', 'SpiceJet', 'Vistara'];
export const FLIGHT_CLASSES = ['Economy', 'Premium Economy', 'Business Class', 'First Class'];
export const FLIGHT_PRICES = [
  { id: '< 4000', label: 'Under ₹4,000' },
  { id: '4000-6000', label: '₹4,000–₹6,000' },
  { id: '6000-8000', label: '₹6,000–₹8,000' },
  { id: '> 8000', label: 'Above ₹8,000' }
];
export const FLIGHT_BAGGAGE = ['Cabin Baggage', 'Check-in Baggage', 'Baggage Included', 'Baggage Not Included'];

export const PKG_THEMES = ['Family', 'Honeymoon / Couples', 'Adventure', 'Group / Friends', 'Luxury', 'Beach & Leisure'];
export const PKG_ACTIVITIES = [
  'Water Sports Combo', 'Mandovi Sunset Cruise', 'Scuba Diving & Island',
  'North Goa Sightseeing', 'South Goa Heritage', 'Dudhsagar Waterfall', 'Clubbing & Nightlife'
];
export const PKG_BUDGETS = [
  { id: '< 15000', label: 'Under ₹15,000' },
  { id: '15000-25000', label: '₹15,000–₹25,000' },
  { id: '25000-40000', label: '₹25,000–₹40,000' },
  { id: '> 40000', label: 'Above ₹40,000' }
];
export const PKG_BUDGET_BASIS = ['Per Person', 'Per Couple'];
export const PKG_HOTEL_RATINGS = [
  { id: '3', label: '3★ Standard' },
  { id: '4', label: '4★ Premium' },
  { id: '5', label: '5★ Luxury' }
];
export const PKG_MEALS = ['Breakfast Included', 'All Meals Included'];
export const PKG_DURATIONS = ['1–3 Days', '4–6 Days', '7+ Days'];
export const PKG_INCLUSIONS = ['Flight Included', 'Cab Included', 'Airport Transfers', 'Tour Guide'];

export function countActiveTabFilters(tab, filters) {
  if (!filters) return 0;
  if (tab === 'selfdrive') {
    return (
      (filters.vehicleTypes?.length || 0) +
      (filters.carSubFilters?.length || 0) +
      (filters.bikeSubFilters?.length || 0) +
      (filters.vehicleTransmission?.length || 0) +
      (filters.vehicleFuel?.length || 0) +
      (filters.vehicleSeating?.length || 0) +
      (filters.vehicleBudget?.length || 0) +
      (filters.vehicleFeatures?.length || 0)
    );
  }
  if (tab === 'hotels') {
    return (
      (filters.hotelStars?.length || 0) +
      (filters.hotelPropertyType?.length || 0) +
      (filters.hotelPriceRanges?.length || 0) +
      (filters.hotelAreas?.length || 0) +
      (filters.hotelAmenities?.length || 0)
    );
  }
  if (tab === 'flights') {
    return (
      (filters.flightStops?.length || 0) +
      (filters.flightDepTimes?.length || 0) +
      (filters.flightArrTimes?.length || 0) +
      (filters.flightAirlines?.length || 0) +
      (filters.flightClassFilter?.length || 0) +
      (filters.flightPriceRanges?.length || 0) +
      (filters.flightBaggage?.length || 0)
    );
  }
  if (tab === 'packages') {
    return (
      (filters.tripTypes?.length || 0) +
      (filters.packageActivities?.length || 0) +
      (filters.priceRanges?.length || 0) +
      (filters.packageBudgetBasis?.length || 0) +
      (filters.hotelStars?.length || 0) +
      (filters.packageMeals?.length || 0) +
      (filters.durations?.length || 0) +
      (filters.inclusions?.length || 0)
    );
  }
  return 0;
}

export default function UnifiedFilterPopover({
  activeTab,
  localFilters,
  setLocalFilters,
  onApply,
  onClearAll,
  onClose
}) {
  const toggleFilter = (key, item) => {
    setLocalFilters(prev => {
      const currentList = prev?.[key] || [];
      const exists = currentList.includes(item);
      const updated = exists ? currentList.filter(x => x !== item) : [...currentList, item];
      return { ...prev, [key]: updated };
    });
  };

  const activeCount = countActiveTabFilters(activeTab, localFilters);

  return (
    <div
      className="tg-popover-card tg-filters-popover shadow-2xl p-3"
      style={{
        width: '430px',
        maxWidth: 'calc(100vw - 20px)',
        zIndex: 1050,
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px'
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom">
        <div className="d-flex align-items-center gap-2">
          <SlidersHorizontal size={16} className="text-warning" />
          <span className="fw-bold text-dark" style={{ fontSize: '0.90rem' }}>
            {activeTab === 'selfdrive' ? 'Vehicle Filters' :
             activeTab === 'hotels' ? 'Hotel Filters' :
             activeTab === 'flights' ? 'Flight Filters' : 'Package Filters'}
          </span>
          {activeCount > 0 && (
            <span className="badge rounded-pill" style={{ background: '#fff7ed', color: '#ff6333', border: '1px solid #ffedd5', fontSize: '0.70rem', fontWeight: 700 }}>
              {activeCount} Applied
            </span>
          )}
        </div>
        <button
          type="button"
          className="btn btn-sm btn-link p-0 text-muted"
          onClick={onClose}
          aria-label="Close filters"
        >
          <X size={18} />
        </button>
      </div>

      {/* Scrollable Filters Content */}
      <div className="tg-scroll-area pe-2" style={{ maxHeight: '340px', overflowY: 'auto' }}>

        {/* ─────────────────────────────────────────────────────────────
            SELF DRIVE FILTERS
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'selfdrive' && (
          <div className="d-flex flex-column gap-3">
            {/* Vehicle Type */}
            <div>
              <div className="text-muted small fw-bold mb-1.5 d-flex align-items-center gap-1">
                <Car size={13} className="text-primary" /> Vehicle Type
              </div>
              <div className="d-flex flex-wrap gap-1.5">
                {VEHICLE_TYPES.map(vt => {
                  const active = localFilters.vehicleTypes?.includes(vt);
                  return (
                    <button
                      key={vt}
                      type="button"
                      className={`tg-filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleFilter('vehicleTypes', vt)}
                    >
                      {active && <Check size={12} />}
                      <span>{vt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Car Sub-Filters */}
            <div>
              <div className="text-muted small fw-bold mb-1.5">Car Sub-Filters (Body Types)</div>
              <div className="d-flex flex-wrap gap-1.5">
                {CAR_SUB_FILTERS.map(sub => {
                  const active = localFilters.carSubFilters?.includes(sub);
                  return (
                    <button
                      key={sub}
                      type="button"
                      className={`tg-filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleFilter('carSubFilters', sub)}
                    >
                      {active && <Check size={12} />}
                      <span>{sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bike Sub-Filters */}
            <div>
              <div className="text-muted small fw-bold mb-1.5 d-flex align-items-center gap-1">
                <Bike size={13} className="text-primary" /> Bike Sub-Filters
              </div>
              <div className="d-flex flex-wrap gap-1.5">
                {BIKE_SUB_FILTERS.map(sub => {
                  const active = localFilters.bikeSubFilters?.includes(sub);
                  return (
                    <button
                      key={sub}
                      type="button"
                      className={`tg-filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleFilter('bikeSubFilters', sub)}
                    >
                      {active && <Check size={12} />}
                      <span>{sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Transmission */}
            <div>
              <div className="text-muted small fw-bold mb-1.5 d-flex align-items-center gap-1">
                <Gauge size={13} className="text-primary" /> Transmission
              </div>
              <div className="d-flex flex-wrap gap-1.5">
                {TRANSMISSIONS.map(tr => {
                  const active = localFilters.vehicleTransmission?.includes(tr);
                  return (
                    <button
                      key={tr}
                      type="button"
                      className={`tg-filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleFilter('vehicleTransmission', tr)}
                    >
                      {active && <Check size={12} />}
                      <span>{tr}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fuel Type */}
            <div>
              <div className="text-muted small fw-bold mb-1.5 d-flex align-items-center gap-1">
                <Fuel size={13} className="text-primary" /> Fuel Type
              </div>
              <div className="d-flex flex-wrap gap-1.5">
                {FUEL_TYPES.map(fuel => {
                  const active = localFilters.vehicleFuel?.includes(fuel);
                  return (
                    <button
                      key={fuel}
                      type="button"
                      className={`tg-filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleFilter('vehicleFuel', fuel)}
                    >
                      {active && <Check size={12} />}
                      <span>{fuel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seating */}
            <div>
              <div className="text-muted small fw-bold mb-1.5">Seating Capacity</div>
              <div className="d-flex flex-wrap gap-1.5">
                {SEATING_OPTIONS.map(seat => {
                  const active = localFilters.vehicleSeating?.includes(seat);
                  return (
                    <button
                      key={seat}
                      type="button"
                      className={`tg-filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleFilter('vehicleSeating', seat)}
                    >
                      {active && <Check size={12} />}
                      <span>{seat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Budget Per Day */}
            <div>
              <div className="text-muted small fw-bold mb-1.5 d-flex align-items-center gap-1">
                <DollarSign size={13} className="text-primary" /> Budget Per Day
              </div>
              <div className="d-flex flex-wrap gap-1.5">
                {VEHICLE_BUDGETS.map(bg => {
                  const active = localFilters.vehicleBudget?.includes(bg.id);
                  return (
                    <button
                      key={bg.id}
                      type="button"
                      className={`tg-filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleFilter('vehicleBudget', bg.id)}
                    >
                      {active && <Check size={12} />}
                      <span>{bg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Features */}
            <div>
              <div className="text-muted small fw-bold mb-1.5 d-flex align-items-center gap-1">
                <Sparkles size={13} className="text-warning" /> Exclusive Features
              </div>
              <div className="d-flex flex-wrap gap-1.5">
                {VEHICLE_FEATURES.map(feat => {
                  const active = localFilters.vehicleFeatures?.includes(feat);
                  return (
                    <button
                      key={feat}
                      type="button"
                      className={`tg-filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleFilter('vehicleFeatures', feat)}
                    >
                      {active && <Check size={12} />}
                      <span>{feat}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            HOTELS FILTERS
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'hotels' && (
          <div className="d-flex flex-column gap-3">
            {/* Star Category */}
            <div>
              <div className="text-muted small fw-bold mb-1.5 d-flex align-items-center gap-1">
                <Hotel size={13} className="text-primary" /> Star Category
              </div>
              <div className="d-flex flex-wrap gap-1.5">
                {HOTEL_STARS.map(st => {
                  const active = localFilters.hotelStars?.includes(st.id);
                  return (
                    <button
                      key={st.id}
                      type="button"
                      className={`tg-filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleFilter('hotelStars', st.id)}
                    >
                      {active && <Check size={12} />}
                      <span>{st.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Property Type */}
            <div>
              <div className="text-muted small fw-bold mb-1.5">Property Type</div>
              <div className="d-flex flex-wrap gap-1.5">
                {HOTEL_PROPERTY_TYPES.map(pt => {
                  const active = localFilters.hotelPropertyType?.includes(pt);
                  return (
                    <button
                      key={pt}
                      type="button"
                      className={`tg-filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleFilter('hotelPropertyType', pt)}
                    >
                      {active && <Check size={12} />}
                      <span>{pt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Per Night */}
            <div>
              <div className="text-muted small fw-bold mb-1.5 d-flex align-items-center gap-1">
                <DollarSign size={13} className="text-primary" /> Price Per Night
              </div>
              <div className="d-flex flex-wrap gap-1.5">
                {HOTEL_PRICES.map(pr => {
                  const active = localFilters.hotelPriceRanges?.includes(pr.id);
                  return (
                    <button
                      key={pr.id}
                      type="button"
                      className={`tg-filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleFilter('hotelPriceRanges', pr.id)}
                    >
                      {active && <Check size={12} />}
                      <span>{pr.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Goa Area */}
            <div>
              <div className="text-muted small fw-bold mb-1 d-flex align-items-center gap-1">
                <MapPin size={13} className="text-primary" /> Goa Area
              </div>
              <div className="mb-1 text-muted" style={{ fontSize: '0.70rem', fontWeight: 600 }}>North Goa:</div>
              <div className="d-flex flex-wrap gap-1 mb-2">
                {HOTEL_NORTH_GOA_AREAS.map(area => {
                  const active = localFilters.hotelAreas?.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      className={`tg-filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleFilter('hotelAreas', area)}
                    >
                      {active && <Check size={12} />}
                      <span>{area}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mb-1 text-muted" style={{ fontSize: '0.70rem', fontWeight: 600 }}>South Goa:</div>
              <div className="d-flex flex-wrap gap-1">
                {HOTEL_SOUTH_GOA_AREAS.map(area => {
                  const active = localFilters.hotelAreas?.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      className={`tg-filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleFilter('hotelAreas', area)}
                    >
                      {active && <Check size={12} />}
                      <span>{area}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amenities */}
            <div>
              <div className="text-muted small fw-bold mb-1.5 d-flex align-items-center gap-1">
                <Sparkles size={13} className="text-warning" /> Popular Amenities
              </div>
              <div className="d-flex flex-wrap gap-1.5">
                {HOTEL_AMENITIES.map(amenity => {
                  const active = localFilters.hotelAmenities?.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      className={`tg-filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleFilter('hotelAmenities', amenity)}
                    >
                      {active && <Check size={12} />}
                      <span>{amenity}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            FLIGHTS FILTERS
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'flights' && (
          <div className="d-flex flex-column gap-3">
            {/* Stops */}
            <div>
              <div className="text-muted small fw-bold mb-1.5 d-flex align-items-center gap-1">
                <Plane size={13} className="text-primary" /> Stops
              </div>
              <div className="d-flex flex-wrap gap-1.5">
                {FLIGHT_STOPS.map(stop => {
                  const active = localFilters.flightStops?.includes(stop);
                  return (
                    <button
                      key={stop}
                      type="button"
                      className={`tg-filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleFilter('flightStops', stop)}
                    >
                      {active && <Check size={12} />}
                      <span>{stop}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Departure Time */}
            <div>
              <div className="text-muted small fw-bold mb-1.5 d-flex align-items-center gap-1">
                <Calendar size={13} className="text-primary" /> Departure Time
              </div>
              <div className="d-flex flex-wrap gap-1.5">
                {FLIGHT_DEP_TIMES.map(t => {
                  const active = localFilters.flightDepTimes?.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`tg-filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleFilter('flightDepTimes', t.id)}
                    >
                      {active && <Check size={12} />}
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Arrival Time */}
            <div>
              <div className="text-muted small fw-bold mb-1.5">Arrival Time</div>
              <div className="d-flex flex-wrap gap-1.5">
                {FLIGHT_ARR_TIMES.map(t => {
                  const active = localFilters.flightArrTimes?.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`tg-filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleFilter('flightArrTimes', t.id)}
                    >
                      {active && <Check size={12} />}
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Airlines */}
            <div>
              <div className="text-muted small fw-bold mb-1.5">Airlines</div>
              <div className="d-flex flex-wrap gap-1.5">
                {FLIGHT_AIRLINES.map(airline => {
                  const active = localFilters.flightAirlines?.includes(airline);
                  return (
                    <button
                      key={airline}
                      type="button"
                      className={`tg-filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleFilter('flightAirlines', airline)}
                    >
                      {active && <Check size={12} />}
                      <span>{airline}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Flight Class */}
            <div>
              <div className="text-muted small fw-bold mb-1.5">Flight Class</div>
              <div className="d-flex flex-wrap gap-1.5">
                {FLIGHT_CLASSES.map(cls => {
                  const active = localFilters.flightClassFilter?.includes(cls);
                  return (
                    <button
                      key={cls}
                      type="button"
                      className={`tg-filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleFilter('flightClassFilter', cls)}
                    >
                      {active && <Check size={12} />}
                      <span>{cls}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price */}
            <div>
              <div className="text-muted small fw-bold mb-1.5 d-flex align-items-center gap-1">
                <DollarSign size={13} className="text-primary" /> Price Range
              </div>
              <div className="d-flex flex-wrap gap-1.5">
                {FLIGHT_PRICES.map(pr => {
                  const active = localFilters.flightPriceRanges?.includes(pr.id);
                  return (
                    <button
                      key={pr.id}
                      type="button"
                      className={`tg-filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleFilter('flightPriceRanges', pr.id)}
                    >
                      {active && <Check size={12} />}
                      <span>{pr.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Baggage */}
            <div>
              <div className="text-muted small fw-bold mb-1.5">Baggage Inclusions</div>
              <div className="d-flex flex-wrap gap-1.5">
                {FLIGHT_BAGGAGE.map(bg => {
                  const active = localFilters.flightBaggage?.includes(bg);
                  return (
                    <button
                      key={bg}
                      type="button"
                      className={`tg-filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleFilter('flightBaggage', bg)}
                    >
                      {active && <Check size={12} />}
                      <span>{bg}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TRIP PACKAGES FILTERS
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'packages' && (
          <div className="d-flex flex-column gap-3">
            {/* Theme */}
            <div>
              <div className="text-muted small fw-bold mb-1.5 d-flex align-items-center gap-1">
                <Compass size={13} className="text-primary" /> Holiday Theme
              </div>
              <div className="d-flex flex-wrap gap-1.5">
                {PKG_THEMES.map(theme => {
                  const active = localFilters.tripTypes?.includes(theme);
                  return (
                    <button
                      key={theme}
                      type="button"
                      className={`tg-filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleFilter('tripTypes', theme)}
                    >
                      {active && <Check size={12} />}
                      <span>{theme}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Activities / Sub-Filters */}
            <div>
              <div className="text-muted small fw-bold mb-1.5 d-flex align-items-center gap-1">
                <Sparkles size={13} className="text-warning" /> Activities & Highlights
              </div>
              <div className="d-flex flex-wrap gap-1.5">
                {PKG_ACTIVITIES.map(act => {
                  const active = localFilters.packageActivities?.includes(act);
                  return (
                    <button
                      key={act}
                      type="button"
                      className={`tg-filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleFilter('packageActivities', act)}
                    >
                      {active && <Check size={12} />}
                      <span>{act}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Budget */}
            <div>
              <div className="text-muted small fw-bold mb-1.5 d-flex align-items-center gap-1">
                <DollarSign size={13} className="text-primary" /> Budget
              </div>
              <div className="d-flex flex-wrap gap-1.5 mb-2">
                {PKG_BUDGETS.map(bg => {
                  const active = localFilters.priceRanges?.includes(bg.id);
                  return (
                    <button
                      key={bg.id}
                      type="button"
                      className={`tg-filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleFilter('priceRanges', bg.id)}
                    >
                      {active && <Check size={12} />}
                      <span>{bg.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mb-1 text-muted" style={{ fontSize: '0.70rem', fontWeight: 600 }}>Budget Basis:</div>
              <div className="d-flex flex-wrap gap-1.5">
                {PKG_BUDGET_BASIS.map(basis => {
                  const active = localFilters.packageBudgetBasis?.includes(basis);
                  return (
                    <button
                      key={basis}
                      type="button"
                      className={`tg-filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleFilter('packageBudgetBasis', basis)}
                    >
                      {active && <Check size={12} />}
                      <span>{basis}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hotel Rating */}
            <div>
              <div className="text-muted small fw-bold mb-1.5 d-flex align-items-center gap-1">
                <Hotel size={13} className="text-primary" /> Hotel Rating
              </div>
              <div className="d-flex flex-wrap gap-1.5 mb-2">
                {PKG_HOTEL_RATINGS.map(rate => {
                  const active = localFilters.hotelStars?.includes(rate.id);
                  return (
                    <button
                      key={rate.id}
                      type="button"
                      className={`tg-filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleFilter('hotelStars', rate.id)}
                    >
                      {active && <Check size={12} />}
                      <span>{rate.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mb-1 text-muted" style={{ fontSize: '0.70rem', fontWeight: 600 }}>Meal Plan:</div>
              <div className="d-flex flex-wrap gap-1.5">
                {PKG_MEALS.map(meal => {
                  const active = localFilters.packageMeals?.includes(meal);
                  return (
                    <button
                      key={meal}
                      type="button"
                      className={`tg-filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleFilter('packageMeals', meal)}
                    >
                      {active && <Check size={12} />}
                      <Utensils size={11} className="me-0.5" />
                      <span>{meal}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration */}
            <div>
              <div className="text-muted small fw-bold mb-1.5 d-flex align-items-center gap-1">
                <Calendar size={13} className="text-primary" /> Duration
              </div>
              <div className="d-flex flex-wrap gap-1.5">
                {PKG_DURATIONS.map(dur => {
                  const active = localFilters.durations?.includes(dur);
                  return (
                    <button
                      key={dur}
                      type="button"
                      className={`tg-filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleFilter('durations', dur)}
                    >
                      {active && <Check size={12} />}
                      <span>{dur}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inclusions */}
            <div>
              <div className="text-muted small fw-bold mb-1.5">Inclusions</div>
              <div className="d-flex flex-wrap gap-1.5">
                {PKG_INCLUSIONS.map(inc => {
                  const active = localFilters.inclusions?.includes(inc);
                  return (
                    <button
                      key={inc}
                      type="button"
                      className={`tg-filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleFilter('inclusions', inc)}
                    >
                      {active && <Check size={12} />}
                      <span>{inc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer Actions */}
      <div className="d-flex justify-content-between align-items-center pt-3 border-top mt-3">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary px-3"
          style={{ fontSize: '0.80rem' }}
          onClick={onClearAll}
        >
          Clear All
        </button>
        <button
          type="button"
          className="btn btn-sm text-white px-4 fw-bold shadow-sm"
          style={{ background: '#FF6333', borderColor: '#FF6333', fontSize: '0.80rem' }}
          onClick={onApply}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}
