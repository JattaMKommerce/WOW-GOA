import React, { useState, useMemo } from 'react';
import { Filter, Car, Hotel, Plane, Utensils, MapPin, Check, ChevronDown, ChevronRight, ChevronLeft, AlertCircle, RotateCcw } from 'lucide-react';

export default function SelfDrivePage({
  handleOpenBooking,
  onViewDetails,
  packages = [],
  searchQuery,
  onClearSearch,
  markups = []
}) {
  const [selectedPriceRanges, setSelectedPriceRanges] = useState([]);
  const [selectedFlightStatus, setSelectedFlightStatus] = useState(null); // 'with', 'without', null
  const [selectedHotelCategories, setSelectedHotelCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL PACKAGES');

  const normalizePrice = (priceStr) => {
    if (priceStr === null || priceStr === undefined || priceStr === '') return 0;
    if (typeof priceStr === 'number') return priceStr;
    const cleanStr = String(priceStr).replace(/[^\d.]/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  };

  const hasFlight = (pkg) => {
    if (pkg.flights_included === '0' || pkg.flights_included === 'false' || pkg.flights_included === false) return false;
    return !!pkg.flights_included || !!pkg.price_with_flight;
  };

  const getPackageNights = (pkg) => {
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
       const nMatch = pkg.duration.match(/(\d+)\s*Nights?/i);
       if (nMatch) nights = parseInt(nMatch[1]);
       else {
           const dMatch = pkg.duration.match(/(\d+)\s*Days?/i);
           if (dMatch) nights = Math.max(1, parseInt(dMatch[1]) - 1);
       }
    }
    return nights || 3;
  };

  // 1. Filter packages by TAB (Theme) first
  const tabFilteredPackages = useMemo(() => {
    if (!packages || packages.length === 0) return [];
    if (activeTab === 'ALL PACKAGES') return packages;
    return packages.filter(pkg => {
      const tagUpper = (pkg.tag || '').toUpperCase();
      const typeUpper = (pkg.package_type || '').toUpperCase();
      const catUpper = (pkg.category || '').toUpperCase();
      return tagUpper.includes(activeTab) || typeUpper.includes(activeTab) || catUpper.includes(activeTab);
    });
  }, [packages, activeTab]);

  // Calculate dynamic max bounds based on data
  const maxDataNightsRaw = Math.max(10, ...tabFilteredPackages.map(getPackageNights));
  const maxDataPriceRaw = Math.max(60000, ...tabFilteredPackages.map(p => normalizePrice(p.price)));
  
  const maxDataNights = maxDataNightsRaw;
  const maxDataPrice = Math.ceil(maxDataPriceRaw / 1000) * 1000;

  const getMarkupPrice = (basePrice, vendorId, entityType, itemId = 'all') => {
    if (!markups) return basePrice;
    
    // 1. Item-specific markup for this vendor
    let applicableMarkup = markups.find(m => m.entity_type === entityType && m.vendor_id == vendorId && m.item_id == itemId);
    
    // 2. Global markup for this vendor (item_id = 'all')
    if (!applicableMarkup) {
      applicableMarkup = markups.find(m => m.entity_type === entityType && m.vendor_id == vendorId && (m.item_id === 'all' || !m.item_id));
    }

    // 3. Global markup for all vendors
    if (!applicableMarkup) {
      applicableMarkup = markups.find(m => m.entity_type === entityType && m.vendor_id === 'global');
    }
    if (applicableMarkup) {
      const val = parseFloat(applicableMarkup.markup_value);
      if (applicableMarkup.markup_type === 'flat') {
        return basePrice + val;
      } else if (applicableMarkup.markup_type === 'percentage') {
        return basePrice + (basePrice * (val / 100));
      }
    }
    return basePrice;
  };

  const displayPackages = useMemo(() => {
    return tabFilteredPackages.map(pkg => ({
      ...pkg,
      price: getMarkupPrice(normalizePrice(pkg.price), pkg.vendor_id || 'global', 'packages', pkg.id)
    }));
  }, [tabFilteredPackages, markups]);

  const [durationRange, setDurationRange] = useState({ min: 1, max: 15 });
  const [budgetRange, setBudgetRange] = useState({ min: 0, max: 100000 });

  // Update max values when data changes
  React.useEffect(() => {
     setDurationRange({ min: 1, max: Math.max(15, maxDataNights) });
     setBudgetRange({ min: 0, max: Math.max(100000, maxDataPrice) });
  }, [maxDataNights, maxDataPrice]);

  // Price ranges definition
  const priceRanges = [
    { id: '< ₹15,000', label: '< ₹15,000', match: (p) => p < 15000 },
    { id: '₹15,000 - ₹20,000', label: '₹15,000 - ₹20,000', match: (p) => p >= 15000 && p <= 20000 },
    { id: '> ₹20,000', label: '> ₹20,000', match: (p) => p > 20000 }
  ];

  // Hotel categories
  const hotelCategories = [
    { id: '3', label: '3★' },
    { id: '4', label: '4★' },
    { id: '5', label: '5★' }
  ];

  const handleResetFilters = () => {
    setSelectedPriceRanges([]);
    setSelectedFlightStatus(null);
    setSelectedHotelCategories([]);
    setActiveTab('ALL PACKAGES');
    if (onClearSearch) onClearSearch();
  };

  // 2. Extract unique themes for Tabs WITH counts
  const tabs = useMemo(() => {
    const counts = { 'ALL PACKAGES': (packages || []).length };
    (packages || []).forEach(pkg => {
      if (pkg.tag) {
        const t = pkg.tag.toUpperCase();
        counts[t] = (counts[t] || 0) + 1;
      }
    });
    return Object.keys(counts).map(t => ({ id: t, label: t, count: counts[t] }));
  }, [packages]);

  // Compute counts for Sidebar Filters based on current TAB filter
  const flightWithCount = tabFilteredPackages.filter(p => hasFlight(p)).length;
  const flightWithoutCount = tabFilteredPackages.filter(p => !hasFlight(p)).length;

  const getPriceCount = (range) => displayPackages.filter(p => {
     const price = normalizePrice(p.price);
     return range.match(price);
  }).length;

  // Flexible and forgiving filter execution
  const filteredPackages = useMemo(() => {
    const results = displayPackages.filter(pkg => {
      const q = (searchQuery || '').toLowerCase().trim();
      const searchMatch = !q || 
                          q === 'goa' || 
                          q === 'all goa' || 
                          q === 'all' || 
                          q === 'india' ||
                          (pkg.name && pkg.name.toLowerCase().includes(q)) || 
                          (pkg.description && pkg.description.toLowerCase().includes(q)) ||
                          (pkg.destination && pkg.destination.toLowerCase().includes(q)) ||
                          (pkg.places_included && pkg.places_included.toLowerCase().includes(q)) ||
                          (pkg.location && pkg.location.toLowerCase().includes(q)) ||
                          (pkg.tag && pkg.tag.toLowerCase().includes(q)) ||
                          (pkg.package_type && pkg.package_type.toLowerCase().includes(q)) ||
                          (pkg.category && pkg.category.toLowerCase().includes(q));

      if (!searchMatch) return false;

      const pkgPrice = normalizePrice(pkg.price);
      const nights = getPackageNights(pkg);

      // Filter by actual Slider Range (Inclusive Bounds)
      if (durationRange?.max && (nights < durationRange.min || nights > durationRange.max)) return false;
      if (budgetRange?.max && (pkgPrice < budgetRange.min || pkgPrice > budgetRange.max)) return false;

      // Checkboxes Budget Filter (if any selected, must match at least one)
      if (selectedPriceRanges.length > 0) {
        const matchesPriceCheckbox = selectedPriceRanges.some(id => {
          const range = priceRanges.find(r => r.id === id);
          return range && range.match(pkgPrice);
        });
        if (!matchesPriceCheckbox) return false;
      }

      // Flights
      if (selectedFlightStatus === 'with' && !hasFlight(pkg)) return false;
      if (selectedFlightStatus === 'without' && hasFlight(pkg)) return false;

      // Hotels
      if (selectedHotelCategories.length > 0) {
        if (!pkg.hotel_included) return true; // Don't strictly discard if not specified
        const matchesHotel = selectedHotelCategories.some(cat => 
          String(pkg.hotel_included).includes(`${cat} Star`) || 
          String(pkg.hotel_included).includes(`${cat}★`) ||
          String(pkg.hotel_category || '').includes(cat)
        );
        if (!matchesHotel) return false;
      }

      return true;
    });

    console.log('[SelfDrivePage Filter Evaluation]', {
      totalPackages: (packages || []).length,
      tabFiltered: tabFilteredPackages.length,
      matchedPackages: results.length,
      searchQuery,
      activeTab
    });

    return results;
  }, [displayPackages, searchQuery, durationRange, budgetRange, selectedPriceRanges, selectedFlightStatus, selectedHotelCategories]);

  // Fallback to displayPackages if strict criteria returned 0
  const packagesToRender = filteredPackages.length > 0 ? filteredPackages : displayPackages;
  const isFallbackView = filteredPackages.length === 0 && displayPackages.length > 0;

  return (
    <div className="animate-fade-in-up container px-3 px-md-0 pt-4" style={{ minHeight: '100vh' }}>
      
      {/* TOP TABS BAR */}
      <div className="d-flex align-items-center mb-4 border-bottom pb-2">
         <h4 className="fw-bold text-dark mb-0 me-4">Holiday Packages</h4>
         <div className="d-flex gap-4 overflow-auto no-scrollbar">
            {tabs.map(tab => (
              <button 
                key={tab.id}
                type="button"
                className={`btn btn-link text-decoration-none fw-bold p-0 position-relative tab-mmt ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                style={{ fontSize: '14px' }}
              >
                {tab.label} <span className="text-muted fw-normal">({tab.count})</span>
              </button>
            ))}
         </div>
      </div>

      {/* Fallback Notice Banner */}
      {isFallbackView && (
        <div className="alert alert-info d-flex align-items-center justify-content-between p-3 rounded-4 mb-4 border-0 shadow-sm" style={{ background: '#f0fdf4', borderLeft: '4px solid #10b981' }}>
          <div className="d-flex align-items-center gap-2">
            <AlertCircle size={20} className="text-success flex-shrink-0" />
            <span className="text-dark small fw-semibold">
              No packages matched all strict filter parameters for "{searchQuery || activeTab}". Showing all available curated Goa packages.
            </span>
          </div>
          <button 
            type="button" 
            className="btn btn-sm btn-outline-success rounded-pill px-3 d-flex align-items-center gap-1"
            onClick={handleResetFilters}
          >
            <RotateCcw size={14} /> Reset Filters
          </button>
        </div>
      )}

      {/* FULL WIDTH RESULTS GRID */}
      <div className="row g-4 mb-5">
        {packagesToRender.length === 0 ? (
          <div className="col-12 text-center py-5 bg-white rounded-4 border shadow-sm">
            <h4 className="text-muted mb-2">No packages available in this category.</h4>
            <button 
              type="button"
              className="btn btn-primary rounded-pill px-4 py-2 mt-2"
              onClick={handleResetFilters}
            >
              View All Packages
            </button>
          </div>
        ) : (
          packagesToRender.map((pkg) => {
            let dynamicDuration = pkg.duration || '3N/4D';
            const nights = getPackageNights(pkg);
            if (nights > 0) {
               dynamicDuration = `${nights}N/${nights+1}D`;
            }
            
            return (
              <div key={pkg.id} className="col-md-6 col-lg-12">
                <div className="premium-card bg-white rounded-4 overflow-hidden shadow-sm border-0 position-relative transition-all hover-lift" style={{ transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}>
                  <div className="row g-0">
                    {/* Image Section */}
                    <div className="col-sm-4 position-relative min-h-200" style={{ minHeight: '260px' }}>
                      <img 
                        src={pkg.image || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80'} 
                        alt={pkg.name} 
                        className="w-100 h-100 object-fit-cover"
                        style={{ minHeight: '260px', maxHeight: '320px' }}
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80'; }}
                      />
                      {pkg.tag && (
                        <span className="badge bg-dark bg-opacity-75 text-white position-absolute top-0 start-0 m-3 px-3 py-2 rounded-pill shadow-sm" style={{ backdropFilter: 'blur(4px)', fontSize: '11px', letterSpacing: '0.5px' }}>
                          ✨ {pkg.tag}
                        </span>
                      )}
                      <div className="position-absolute bottom-0 start-0 w-100 p-3 bg-gradient-to-t text-white" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                        <span className="badge bg-primary rounded-pill px-2 py-1 small fw-bold">{dynamicDuration}</span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="col-sm-8 p-4 d-flex flex-column justify-content-between">
                      <div>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h4 className="fw-bold text-dark mb-0 hover-primary cursor-pointer" onClick={() => onViewDetails(pkg)}>
                            {pkg.name}
                          </h4>
                          <div className="text-end">
                            <span className="text-muted small d-block">Starting from</span>
                            <h3 className="text-primary fw-black mb-0">₹{Number(pkg.price).toLocaleString('en-IN')}</h3>
                            <span className="text-muted" style={{ fontSize: '10px' }}>Per Person</span>
                          </div>
                        </div>

                        <p className="text-muted small line-clamp-2 mb-3">
                          {pkg.description || 'Experience the best of Goa with premium stays, customizable travel itinerary, and scenic locations.'}
                        </p>

                        {/* Inclusions Badges */}
                        <div className="d-flex flex-wrap gap-2 mb-3">
                          {pkg.hotel_included && (
                            <span className="badge bg-light text-dark border d-flex align-items-center gap-1 py-1 px-2">
                              <Hotel size={13} className="text-warning" /> {pkg.hotel_included}
                            </span>
                          )}
                          {hasFlight(pkg) && (
                            <span className="badge bg-light text-dark border d-flex align-items-center gap-1 py-1 px-2">
                              <Plane size={13} className="text-info" /> Flights Included
                            </span>
                          )}
                          {pkg.self_drive_included && (
                            <span className="badge bg-light text-dark border d-flex align-items-center gap-1 py-1 px-2">
                              <Car size={13} className="text-primary" /> Self Drive Vehicle
                            </span>
                          )}
                          {pkg.meals_included && (
                            <span className="badge bg-light text-dark border d-flex align-items-center gap-1 py-1 px-2">
                              <Utensils size={13} className="text-success" /> Meals Included
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center pt-3 border-top mt-2">
                        <div className="d-flex align-items-center gap-1 text-muted small">
                          <MapPin size={14} className="text-danger" />
                          <span>{pkg.places_included || pkg.destination || 'Goa & Surroundings'}</span>
                        </div>
                        <div className="d-flex gap-2">
                          <button 
                            type="button" 
                            className="btn btn-outline-secondary btn-sm px-3 rounded-pill fw-semibold"
                            onClick={() => onViewDetails(pkg)}
                          >
                            View Itinerary
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-primary btn-sm px-4 rounded-pill fw-bold"
                            style={{ background: '#FF6333', borderColor: '#FF6333' }}
                            onClick={() => handleOpenBooking(pkg)}
                          >
                            Book Package
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
