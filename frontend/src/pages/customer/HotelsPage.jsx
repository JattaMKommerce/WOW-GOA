import React, { useState, useMemo } from 'react';
import { Star, MapPin, Check, ChevronRight, AlertCircle, RotateCcw } from 'lucide-react';
import HotelImageGallery from '../../components/HotelImageGallery';
import ImageCarousel from '../../components/common/ImageCarousel';
import UnifiedGalleryViewer from '../../components/UnifiedGalleryViewer';

export default function HotelsPage({
  handleOpenBooking,
  onViewDetails,
  hotels = [],
  searchQuery,
  searchTriggered,
  setSearchTriggered,
  pickupLoc,
  pickupDate,
  dropDate,
  hotelAdults,
  hotelPriceRange,
  setHotelPriceRange,
  markups = [],
  appliedFilters = {},
  setAppliedFilters
}) {
  // Local state for advanced filters
  const [selectedStars, setSelectedStars] = useState(() => appliedFilters?.hotelStars || []);
  const [galleryHotel, setGalleryHotel] = useState(null);

  // Sync when appliedFilters changes
  React.useEffect(() => {
    if (appliedFilters?.hotelStars && appliedFilters.hotelStars.length > 0) {
      setSelectedStars(appliedFilters.hotelStars);
    }
  }, [appliedFilters?.hotelStars]);
  
  // Calculate mock original prices (MakeMyTrip shows strikethrough prices)
  const getOriginalPrice = (price) => Math.round(price * 1.35); // 35% markup

  const handleStarToggle = (star) => {
    setSelectedStars(prev => {
      const next = prev.includes(star) ? prev.filter(s => s !== star) : [...prev, star];
      if (setAppliedFilters) {
        setAppliedFilters(old => ({ ...(old || {}), hotelStars: next }));
      }
      return next;
    });
  };

  const handleResetAllFilters = () => {
    setSelectedStars([]);
    if (setHotelPriceRange) setHotelPriceRange('All');
    if (setAppliedFilters) {
      setAppliedFilters(old => ({ ...(old || {}), hotelStars: [], priceRanges: [] }));
    }
  };

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

  const rawDisplayHotels = hotels;

  const displayHotels = useMemo(() => {
    return (rawDisplayHotels || []).map(h => ({
      ...h,
      price: Math.round(getMarkupPrice(parseFloat(h.price || 0), h.vendor_id, 'hotels', h.id))
    }));
  }, [rawDisplayHotels, markups]);

  // Non-destructive, flexible filtering logic
  const filteredHotels = useMemo(() => {
    const activeStars = appliedFilters?.hotelStars || selectedStars || [];
    const activePropertyTypes = appliedFilters?.hotelPropertyType || [];
    const activePriceRanges = appliedFilters?.hotelPriceRanges || appliedFilters?.priceRanges || [];
    const activeAreas = appliedFilters?.hotelAreas || [];
    const activeAmenities = appliedFilters?.hotelAmenities || [];

    return displayHotels.filter(hotel => {
      const hotelName = (hotel.name || '').toLowerCase();
      const hotelArea = (hotel.area || '').toLowerCase();
      const hotelLoc = (hotel.location || '').toLowerCase();
      const hotelDesc = (hotel.description || '').toLowerCase();
      const hotelType = (hotel.type || hotel.property_type || '').toLowerCase();
      const hotelAmenitiesList = Array.isArray(hotel.amenities)
        ? hotel.amenities.map(a => String(a).toLowerCase())
        : String(hotel.amenities || '').toLowerCase().split(',').map(s => s.trim());

      // Search query filter
      const q = (searchQuery || '').toLowerCase().trim();
      const searchMatch = !q || 
                          q === 'goa' || 
                          q === 'all goa' || 
                          q === 'all' || 
                          q === 'india' || 
                          hotelName.includes(q) || 
                          hotelArea.includes(q) || 
                          hotelLoc.includes(q);
        
      // Star rating filter
      const hotelStarsStr = String(hotel.stars || hotel.star_rating || 3);
      let starsMatch = true;
      if (activeStars.length > 0) {
        starsMatch = activeStars.some(st => {
          if (st === 'boutique') {
            return hotelDesc.includes('boutique') || hotelDesc.includes('heritage') || hotelName.includes('boutique') || hotelType.includes('boutique');
          }
          return hotelStarsStr === String(st);
        });
      }

      // Property type filter
      let propTypeMatch = true;
      if (activePropertyTypes.length > 0) {
        propTypeMatch = activePropertyTypes.some(pt => {
          const s = pt.toLowerCase();
          if (s.includes('resort')) return hotelType.includes('resort') || hotelName.includes('resort') || hotelDesc.includes('resort');
          if (s.includes('villa')) return hotelType.includes('villa') || hotelName.includes('villa') || hotelDesc.includes('villa');
          if (s.includes('boutique')) return hotelType.includes('boutique') || hotelName.includes('boutique') || hotelDesc.includes('boutique');
          if (s.includes('budget')) return hotel.price < 4000 || hotelType.includes('budget') || hotelName.includes('inn') || hotelName.includes('stay');
          if (s.includes('apartment')) return hotelType.includes('apartment') || hotelName.includes('apartment') || hotelDesc.includes('apartment') || hotelDesc.includes('suite');
          return hotelType.includes(s) || hotelName.includes(s);
        });
      }
      
      // Price filter from sidebar or appliedFilters
      let priceMatch = true;
      if (hotelPriceRange === 'under-10000') priceMatch = hotel.price < 10000;
      else if (hotelPriceRange === '10000-20000') priceMatch = hotel.price >= 10000 && hotel.price <= 20000;
      else if (hotelPriceRange === 'over-20000') priceMatch = hotel.price > 20000;
      else if (activePriceRanges.length > 0) {
        priceMatch = activePriceRanges.some(rangeId => {
          if (rangeId === '< 3000' || rangeId === '< 15000') return hotel.price < 3000 || (rangeId === '< 15000' && hotel.price < 15000);
          if (rangeId === '3000-6000') return hotel.price >= 3000 && hotel.price <= 6000;
          if (rangeId === '6000-10000') return hotel.price >= 6000 && hotel.price <= 10000;
          if (rangeId === '> 10000' || rangeId === '> 25000') return hotel.price > 10000;
          return true;
        });
      }

      // Goa Area filter
      let areaMatch = true;
      if (activeAreas.length > 0) {
        areaMatch = activeAreas.some(area => {
          const a = area.toLowerCase();
          return hotelArea.includes(a) || hotelLoc.includes(a) || hotelName.includes(a);
        });
      }

      // Amenities filter
      let amenitiesMatch = true;
      if (activeAmenities.length > 0) {
        amenitiesMatch = activeAmenities.every(amenity => {
          const am = amenity.toLowerCase();
          if (am.includes('pool')) return hotelAmenitiesList.some(x => x.includes('pool')) || hotelDesc.includes('pool');
          if (am.includes('beach') || am.includes('sea view')) return hotelAmenitiesList.some(x => x.includes('beach') || x.includes('sea')) || hotelDesc.includes('beach') || hotelDesc.includes('sea view');
          if (am.includes('breakfast')) return hotelAmenitiesList.some(x => x.includes('breakfast') || x.includes('meal') || x.includes('dining')) || hotelDesc.includes('breakfast');
          if (am.includes('spa')) return hotelAmenitiesList.some(x => x.includes('spa')) || hotelDesc.includes('spa') || hotelDesc.includes('wellness');
          if (am.includes('wi-fi') || am.includes('wifi')) return hotelAmenitiesList.some(x => x.includes('wifi') || x.includes('wi-fi') || x.includes('internet')) || true; // standard hotel amenity
          if (am.includes('bar') || am.includes('lounge')) return hotelAmenitiesList.some(x => x.includes('bar') || x.includes('lounge')) || hotelDesc.includes('bar');
          if (am.includes('pet')) return hotelAmenitiesList.some(x => x.includes('pet')) || hotelDesc.includes('pet');
          return true;
        });
      }

      // Flexible Location matching:
      const loc = (pickupLoc || '').toLowerCase().trim();
      let locMatch = true;
      const genericCities = ['goa', 'all goa', 'india', 'all', '', 'hubli', 'delhi', 'new delhi', 'mumbai', 'bengaluru', 'bangalore', 'pune', 'hyderabad', 'chennai', 'kolkata', 'ahmedabad', 'jaipur', 'kochi'];
      
      if (loc && !genericCities.includes(loc)) {
        const cleanLoc = loc.replace(/,.*$/, '').trim();
        locMatch = hotelArea.includes(cleanLoc) || 
                   cleanLoc.includes(hotelArea) || 
                   hotelName.includes(cleanLoc) || 
                   hotelLoc.includes(cleanLoc) ||
                   loc.includes('goa') ||
                   loc.includes('north') ||
                   loc.includes('south');
      }

      // Guest / Room capacity check
      let capacityMatch = true;
      if (hotel.max_guests && parseInt(hotel.max_guests, 10) > 0 && hotelAdults) {
        capacityMatch = parseInt(hotel.max_guests, 10) >= parseInt(hotelAdults, 10);
      }

      return searchMatch && starsMatch && propTypeMatch && priceMatch && areaMatch && amenitiesMatch && locMatch && capacityMatch;
    });
  }, [displayHotels, searchQuery, selectedStars, hotelPriceRange, appliedFilters, pickupLoc, hotelAdults]);

  const hotelsToRender = filteredHotels;

  return (
    <div className="animate-fade-in-up">
      <div className="section-header mb-4 text-start">
        <h2 className="fs-3 fw-bold text-dark">Properties in Goa</h2>
        <p className="text-muted small">
          Showing {hotelsToRender.length} luxury stays for your dates.
          {pickupLoc && <span className="ms-1 text-primary fw-semibold">({pickupLoc})</span>}
        </p>
      </div>

      <div className="mmt-layout-container">
        {/* Left Sidebar - Filters */}
        <aside className="mmt-sidebar shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="fs-5 fw-bold mb-0">Select Filters</h4>
            {(selectedStars.length > 0 || (hotelPriceRange && hotelPriceRange !== 'All')) && (
              <button 
                type="button" 
                className="btn btn-sm btn-link p-0 text-decoration-none text-danger small fw-bold"
                onClick={handleResetAllFilters}
              >
                Clear All
              </button>
            )}
          </div>
          
          {/* Price Filter */}
          <div className="mmt-filter-group">
            <h5 className="mmt-filter-title">Price per night</h5>
            <div className="mmt-checkbox-wrapper" onClick={() => setHotelPriceRange('All')}>
              <input type="radio" name="hotel_price" checked={!hotelPriceRange || hotelPriceRange === 'All'} readOnly />
              <span className="mmt-checkbox-label">All Prices</span>
            </div>
            <div className="mmt-checkbox-wrapper" onClick={() => setHotelPriceRange('under-10000')}>
              <input type="radio" name="hotel_price" checked={hotelPriceRange === 'under-10000'} readOnly />
              <span className="mmt-checkbox-label">Under ₹10,000</span>
            </div>
            <div className="mmt-checkbox-wrapper" onClick={() => setHotelPriceRange('10000-20000')}>
              <input type="radio" name="hotel_price" checked={hotelPriceRange === '10000-20000'} readOnly />
              <span className="mmt-checkbox-label">₹10,000 - ₹20,000</span>
            </div>
            <div className="mmt-checkbox-wrapper" onClick={() => setHotelPriceRange('over-20000')}>
              <input type="radio" name="hotel_price" checked={hotelPriceRange === 'over-20000'} readOnly />
              <span className="mmt-checkbox-label">₹20,000+</span>
            </div>
          </div>

          {/* Star Rating Filter */}
          <div className="mmt-filter-group">
            <h5 className="mmt-filter-title">Star Category</h5>
            <div className="mmt-checkbox-wrapper" onClick={() => handleStarToggle('5')}>
              <input type="checkbox" checked={selectedStars.includes('5')} readOnly />
              <span className="mmt-checkbox-label text-warning d-flex align-items-center">
                5 Star <Star size={14} fill="currentColor" className="ms-1" />
              </span>
            </div>
            <div className="mmt-checkbox-wrapper" onClick={() => handleStarToggle('4')}>
              <input type="checkbox" checked={selectedStars.includes('4')} readOnly />
              <span className="mmt-checkbox-label text-warning d-flex align-items-center">
                4 Star <Star size={14} fill="currentColor" className="ms-1" />
              </span>
            </div>
            <div className="mmt-checkbox-wrapper" onClick={() => handleStarToggle('3')}>
              <input type="checkbox" checked={selectedStars.includes('3')} readOnly />
              <span className="mmt-checkbox-label text-warning d-flex align-items-center">
                3 Star <Star size={14} fill="currentColor" className="ms-1" />
              </span>
            </div>
          </div>
        </aside>

        {/* Right Content - Hotel List */}
        <div className="mmt-hotel-list">
          {hotelsToRender.length === 0 ? (
            <div className="text-center py-5 bg-white rounded border">
              <h4 className="text-muted">No hotels currently available in our system.</h4>
              <button 
                type="button"
                className="btn btn-outline-primary mt-3" 
                onClick={handleResetAllFilters}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            hotelsToRender.map((hotel) => {
              const starsCount = parseInt(hotel.stars || hotel.star_rating || 3, 10);
              const amenities = Array.isArray(hotel.amenities)
                ? hotel.amenities
                : typeof hotel.amenities === 'string'
                  ? hotel.amenities.split(',').map(s => s.trim()).filter(Boolean)
                  : ['Free WiFi', 'Swimming Pool', 'Breakfast Included'];

              // Parse all images for this hotel
              const parsedHotelImages = [];
              if (hotel.images_json) {
                try {
                  const p = typeof hotel.images_json === 'string' ? JSON.parse(hotel.images_json) : hotel.images_json;
                  if (Array.isArray(p)) parsedHotelImages.push(...p);
                } catch (e) {}
              }
              if (hotel.images && Array.isArray(hotel.images)) {
                parsedHotelImages.push(...hotel.images);
              }
              if (hotel.additional_images && Array.isArray(hotel.additional_images)) {
                parsedHotelImages.push(...hotel.additional_images);
              }
              if (hotel.image) parsedHotelImages.push(hotel.image);
              if (hotel.image_url) parsedHotelImages.push(hotel.image_url);

              const finalHotelImages = Array.from(new Set(parsedHotelImages.filter(u => typeof u === 'string' && u.trim().length > 0)));
              const validHotelImages = finalHotelImages.length > 0 ? finalHotelImages : [hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'];

              return (
                <div key={hotel.id} className="mmt-hotel-card">
                  <div className="mmt-hotel-img-wrapper p-2 bg-light">
                    <div className="position-relative w-100 h-100">
                      <ImageCarousel
                        images={validHotelImages}
                        height="190px"
                        rounded="12px"
                        alt={hotel.name}
                      />
                      <span className="position-absolute top-0 start-0 m-2 badge bg-dark text-white rounded-pill shadow-sm" style={{ zIndex: 6, pointerEvents: 'none' }}>
                        {hotel.badge || 'Verified Stay'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mmt-hotel-info">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <div className="d-flex text-warning">
                            {[...Array(Math.min(starsCount, 5))].map((_, i) => (
                              <Star key={i} size={14} fill="currentColor" />
                            ))}
                          </div>
                        </div>
                        <h3 className="mmt-hotel-title">{hotel.name}</h3>
                        <div className="mmt-hotel-location">
                          <MapPin size={14} />
                          {hotel.area || hotel.location || 'Goa'} 
                          <span className="text-muted fw-normal ms-1">| View on Map</span>
                        </div>
                      </div>
                      
                      <div className="d-flex flex-column align-items-end">
                        <div className="d-flex align-items-center bg-success text-white px-2 py-1 rounded mb-1">
                          <span className="fw-bold fs-6">{hotel.rating || 4.5}</span>
                          <span className="ms-1 small">/ 5</span>
                        </div>
                        <span className="small text-muted fw-semibold">Excellent</span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <span className="text-success small fw-bold d-flex align-items-center mb-1">
                        <Check size={14} className="me-1" /> Free Cancellation till 24 hrs before check-in
                      </span>
                      <span className="text-success small fw-bold d-flex align-items-center">
                        <Check size={14} className="me-1" /> Breakfast Included
                      </span>
                    </div>

                    <div className="mmt-hotel-amenities">
                      {amenities.slice(0, 3).map((am, i) => (
                        <span key={i} className="mmt-amenity-tag">
                          {am}
                        </span>
                      ))}
                      {amenities.length > 3 && (
                        <span className="mmt-amenity-tag fw-bold text-primary bg-light border">
                          +{amenities.length - 3} More
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mmt-hotel-price-box">
                    <div className="text-end mb-3">
                      <div className="mmt-price-strikethrough">₹ {getOriginalPrice(hotel.price).toLocaleString('en-IN')}</div>
                      <div className="mmt-price-final">₹ {hotel.price.toLocaleString('en-IN')}</div>
                      <div className="mmt-price-taxes">+ ₹ {Math.round(hotel.price * 0.18).toLocaleString('en-IN')} taxes & fees</div>
                      <div className="text-muted small">Per Night</div>
                    </div>
                    <button 
                      type="button" 
                      className="mmt-btn-book d-flex align-items-center justify-content-center"
                      onClick={() => onViewDetails(hotel)}
                    >
                      View Details <ChevronRight size={18} className="ms-1" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {galleryHotel && (
        <HotelImageGallery 
          hotel={galleryHotel} 
          onClose={() => setGalleryHotel(null)} 
        />
      )}
    </div>
  );
}
