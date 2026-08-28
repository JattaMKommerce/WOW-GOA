import React, { useState, useMemo } from 'react';
import { Star, MapPin, Check, ChevronRight, AlertCircle, RotateCcw } from 'lucide-react';
import HotelImageGallery from '../../components/HotelImageGallery';
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
  markups = []
}) {
  // Local state for advanced filters
  const [selectedStars, setSelectedStars] = useState([]);
  const [galleryHotel, setGalleryHotel] = useState(null);
  
  // Calculate mock original prices (MakeMyTrip shows strikethrough prices)
  const getOriginalPrice = (price) => Math.round(price * 1.35); // 35% markup

  const handleStarToggle = (star) => {
    setSelectedStars(prev => 
      prev.includes(star) 
        ? prev.filter(s => s !== star)
        : [...prev, star]
    );
  };

  const handleResetAllFilters = () => {
    setSelectedStars([]);
    if (setHotelPriceRange) setHotelPriceRange('All');
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
    const results = displayHotels.filter(hotel => {
      const hotelName = (hotel.name || '').toLowerCase();
      const hotelArea = (hotel.area || '').toLowerCase();
      const hotelLoc = (hotel.location || '').toLowerCase();

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
      const starsMatch = selectedStars.length === 0 || selectedStars.includes(hotelStarsStr);
      
      // Price filter
      let priceMatch = true;
      if (hotelPriceRange === 'under-10000') priceMatch = hotel.price < 10000;
      else if (hotelPriceRange === '10000-20000') priceMatch = hotel.price >= 10000 && hotel.price <= 20000;
      else if (hotelPriceRange === 'over-20000') priceMatch = hotel.price > 20000;

      // Flexible Location matching:
      // If location is 'Goa', 'All Goa', 'India', '', or departure cities (Hubli, Delhi, Mumbai, etc.), match all Goa properties!
      const loc = (pickupLoc || '').toLowerCase().trim();
      let locMatch = true;
      const genericCities = ['goa', 'all goa', 'india', 'all', '', 'hubli', 'delhi', 'new delhi', 'mumbai', 'bengaluru', 'bangalore', 'pune', 'hyderabad', 'chennai', 'kolkata', 'ahmedabad', 'jaipur', 'kochi'];
      
      if (loc && !genericCities.includes(loc)) {
        const cleanLoc = loc.replace(/,.*$/, '').trim(); // e.g. "Calangute, Goa" -> "calangute"
        locMatch = hotelArea.includes(cleanLoc) || 
                   cleanLoc.includes(hotelArea) || 
                   hotelName.includes(cleanLoc) || 
                   hotelLoc.includes(cleanLoc) ||
                   loc.includes('goa') ||
                   loc.includes('north') ||
                   loc.includes('south');
      }

      // Guest / Room capacity check: Only filter out if max_guests is explicitly defined and strictly < hotelAdults
      let capacityMatch = true;
      if (hotel.max_guests && parseInt(hotel.max_guests, 10) > 0 && hotelAdults) {
        capacityMatch = parseInt(hotel.max_guests, 10) >= parseInt(hotelAdults, 10);
      }

      return searchMatch && starsMatch && priceMatch && locMatch && capacityMatch;
    });

    console.log('[HotelsPage Filter Evaluation]', {
      totalHotels: displayHotels.length,
      matchedHotels: results.length,
      pickupLoc,
      searchQuery,
      hotelPriceRange,
      selectedStars,
      hotelAdults
    });

    return results;
  }, [displayHotels, searchQuery, selectedStars, hotelPriceRange, pickupLoc, hotelAdults]);

  // If filteredHotels is empty due to restrictive filter, display fallback items gracefully
  const hotelsToRender = filteredHotels.length > 0 ? filteredHotels : displayHotels;
  const isFallbackView = filteredHotels.length === 0 && displayHotels.length > 0;

  return (
    <div className="animate-fade-in-up">
      <div className="section-header mb-4 text-start">
        <h2 className="fs-3 fw-bold text-dark">Properties in Goa</h2>
        <p className="text-muted small">
          Showing {hotelsToRender.length} luxury stays for your dates.
          {pickupLoc && <span className="ms-1 text-primary fw-semibold">({pickupLoc})</span>}
        </p>
      </div>

      {/* Fallback Notice Banner if strict filter returned 0 */}
      {isFallbackView && (
        <div className="alert alert-info d-flex align-items-center justify-content-between p-3 rounded-4 mb-4 border-0 shadow-sm" style={{ background: '#f0fdf4', borderLeft: '4px solid #10b981' }}>
          <div className="d-flex align-items-center gap-2">
            <AlertCircle size={20} className="text-success flex-shrink-0" />
            <span className="text-dark small fw-semibold">
              No hotels matched all strict filter parameters for "{pickupLoc || searchQuery || 'your search'}". Showing all available verified stays in Goa.
            </span>
          </div>
          <button 
            type="button" 
            className="btn btn-sm btn-outline-success rounded-pill px-3 d-flex align-items-center gap-1"
            onClick={handleResetAllFilters}
          >
            <RotateCcw size={14} /> Reset Filters
          </button>
        </div>
      )}

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
                      <UnifiedGalleryViewer
                        images={validHotelImages}
                        variant="compact"
                        compactHeight="185px"
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
