import React, { useState, useMemo } from 'react';
import { 
  Star, 
  MapPin, 
  Check, 
  ChevronRight, 
  Compass, 
  ExternalLink, 
  X, 
  Sparkles, 
  ShieldCheck, 
  Utensils, 
  Eye, 
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import ImageCarousel from '../../components/common/ImageCarousel';
import UnifiedGalleryViewer from '../../components/UnifiedGalleryViewer';

// Only these 3 approved hotels are allowed in the customer hotel inventory
const APPROVED_HOTEL_IDS = ['hotel-3star', 'hotel-4star', 'hotel-5star'];

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
  // Local state for star filters
  const [selectedStars, setSelectedStars] = useState(() => appliedFilters?.hotelStars || []);
  const [galleryHotel, setGalleryHotel] = useState(null);
  const [mapHotel, setMapHotel] = useState(null);

  // Sync when appliedFilters changes
  React.useEffect(() => {
    if (appliedFilters?.hotelStars && appliedFilters.hotelStars.length > 0) {
      setSelectedStars(appliedFilters.hotelStars);
    }
  }, [appliedFilters?.hotelStars]);

  // Original price for strikethrough display (35% markup reference)
  const getOriginalPrice = (price) => Math.round(price * 1.35);

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

    let applicableMarkup = markups.find(m => m.entity_type === entityType && m.vendor_id == vendorId && m.item_id == itemId);

    if (!applicableMarkup) {
      applicableMarkup = markups.find(m => m.entity_type === entityType && m.vendor_id == vendorId && (m.item_id === 'all' || !m.item_id));
    }

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

  // Strictly enforce only the 3 approved hotels for customer browsing
  const rawDisplayHotels = useMemo(() => {
    return (hotels || []).filter(h => {
      // Must be one of the approved 3 hotels
      if (!APPROVED_HOTEL_IDS.includes(String(h.id))) return false;
      // Must be active and live
      if (h.is_available === 0 || h.is_available === '0' || h.is_available === false) return false;
      if (h.hotel_status === 'Archived' || h.hotel_status === 'Inactive') return false;
      return true;
    });
  }, [hotels]);

  const displayHotels = useMemo(() => {
    return (rawDisplayHotels || []).map(h => ({
      ...h,
      price: Math.round(getMarkupPrice(parseFloat(h.price || 0), h.vendor_id, 'hotels', h.id))
    }));
  }, [rawDisplayHotels, markups]);

  // Filtering based on customer search query, star filters, price ranges, location
  const filteredHotels = useMemo(() => {
    const activeStars = appliedFilters?.hotelStars || selectedStars || [];
    const activePriceRanges = appliedFilters?.hotelPriceRanges || appliedFilters?.priceRanges || [];

    return displayHotels.filter(hotel => {
      const hotelName = (hotel.name || '').toLowerCase();
      const hotelArea = (hotel.area || '').toLowerCase();
      const hotelLoc = (hotel.location || '').toLowerCase();
      const hotelDesc = (hotel.description || '').toLowerCase();

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
            return hotelDesc.includes('boutique') || hotelDesc.includes('heritage') || hotelName.includes('boutique');
          }
          return hotelStarsStr === String(st);
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
          if (rangeId === '3000 - 7000' || rangeId === '15000 - 30000') return (hotel.price >= 3000 && hotel.price <= 7000) || (rangeId === '15000 - 30000' && hotel.price >= 15000 && hotel.price <= 30000);
          if (rangeId === '> 7000' || rangeId === '> 30000') return hotel.price > 7000 || (rangeId === '> 30000' && hotel.price > 30000);
          return true;
        });
      }

      // Pickup/drop location filter
      let locMatch = true;
      if (pickupLoc && !['goa', 'all goa', 'all', 'india'].includes(pickupLoc.toLowerCase().trim())) {
        const cleanLoc = pickupLoc.toLowerCase().trim();
        locMatch = hotelArea.includes(cleanLoc) || 
                   cleanLoc.includes(hotelArea) || 
                   hotelName.includes(cleanLoc) || 
                   hotelLoc.includes(cleanLoc) ||
                   cleanLoc.includes('goa');
      }

      return searchMatch && starsMatch && priceMatch && locMatch;
    });
  }, [displayHotels, searchQuery, selectedStars, hotelPriceRange, appliedFilters, pickupLoc]);

  const hotelsToRender = filteredHotels;

  return (
    <div className="wowgoa-hotels-container animate-fade-in-up pb-5" style={{ maxWidth: '1240px', margin: '0 auto' }}>
      
      {/* ─── 1. PAGE HEADER & QUICK FILTER CHIPS ─── */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 pt-2 pb-4 mb-4 border-bottom">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge rounded-pill px-3 py-1 text-xs fw-bold" style={{ background: '#FEF3C7', color: '#92400E' }}>
              ✨ Verified Customer Inventory
            </span>
            <span className="text-muted text-xs">
              Showing {hotelsToRender.length} of {displayHotels.length} approved stays
            </span>
          </div>
          <h2 className="fs-3 fw-black text-dark mb-0 font-heading tracking-tight">
            Handpicked Stays &amp; Beachfront Resorts in Goa
          </h2>
          <p className="text-muted text-xs mb-0 mt-1">
            Exclusive 3-Star, 4-Star &amp; 5-Star properties with authoritative date-specific availability and meal plans.
            {pickupLoc && <span className="ms-1 fw-bold text-primary">· Location: {pickupLoc}</span>}
          </p>
        </div>

        {/* Quick Star Filter Chips */}
        <div className="d-flex flex-wrap align-items-center gap-1.5">
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 py-1.5 text-xs fw-bold transition-all ${
              selectedStars.length === 0 
                ? 'btn-dark text-white shadow-sm' 
                : 'btn-outline-secondary bg-white text-dark'
            }`}
            onClick={handleResetAllFilters}
          >
            All Stays ({displayHotels.length})
          </button>

          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 py-1.5 text-xs fw-bold transition-all d-flex align-items-center gap-1 ${
              selectedStars.includes('5') 
                ? 'btn-warning text-dark shadow-sm' 
                : 'btn-outline-secondary bg-white text-dark'
            }`}
            onClick={() => handleStarToggle('5')}
          >
            <Star size={13} fill="currentColor" /> 5-Star Luxury
          </button>

          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 py-1.5 text-xs fw-bold transition-all d-flex align-items-center gap-1 ${
              selectedStars.includes('4') 
                ? 'btn-warning text-dark shadow-sm' 
                : 'btn-outline-secondary bg-white text-dark'
            }`}
            onClick={() => handleStarToggle('4')}
          >
            <Star size={13} fill="currentColor" /> 4-Star Premium
          </button>

          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 py-1.5 text-xs fw-bold transition-all d-flex align-items-center gap-1 ${
              selectedStars.includes('3') 
                ? 'btn-warning text-dark shadow-sm' 
                : 'btn-outline-secondary bg-white text-dark'
            }`}
            onClick={() => handleStarToggle('3')}
          >
            <Star size={13} fill="currentColor" /> 3-Star Boutique
          </button>

          {selectedStars.length > 0 && (
            <button
              type="button"
              className="btn btn-sm btn-link p-1 text-danger text-xs fw-bold text-decoration-none d-flex align-items-center gap-1"
              onClick={handleResetAllFilters}
            >
              <RotateCcw size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ─── 2. HOTEL RESULTS CARDS LIST ─── */}
      {hotelsToRender.length === 0 ? (
        <div className="text-center py-5 bg-white rounded-4 border p-4 shadow-sm">
          <div className="rounded-circle bg-light p-3 d-inline-flex mb-3">
            <SlidersHorizontal size={28} className="text-muted" />
          </div>
          <h4 className="fw-bold text-dark mb-1">No matching hotels found</h4>
          <p className="text-muted text-xs mb-3">
            Try adjusting your star rating or location search filters to view the approved stays.
          </p>
          <button 
            type="button" 
            className="btn btn-primary btn-sm rounded-pill px-4 py-2 fw-bold text-xs"
            onClick={handleResetAllFilters}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {hotelsToRender.map((hotel) => {
            const starsCount = parseInt(hotel.stars || hotel.star_rating || 3, 10);
            
            // Amenities array
            const amenities = Array.isArray(hotel.amenities)
              ? hotel.amenities
              : typeof hotel.amenities === 'string'
                ? hotel.amenities.split(',').map(s => s.trim()).filter(Boolean)
                : ['Free WiFi', 'Swimming Pool', 'Breakfast Included', 'Air Conditioning'];

            // Gather all valid photos
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
            if (hotel.image) parsedHotelImages.push(hotel.image);
            if (hotel.image_url) parsedHotelImages.push(hotel.image_url);

            const finalHotelImages = Array.from(new Set(parsedHotelImages.filter(u => typeof u === 'string' && u.trim().length > 0)));
            const validHotelImages = finalHotelImages.length > 0 
              ? finalHotelImages 
              : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'];

            // Star category display label
            const categoryBadgeLabel = starsCount === 5 
              ? '5-Star Luxury Resort' 
              : starsCount === 4 
                ? '4-Star Beachfront Resort' 
                : '3-Star Boutique Resort';

            return (
              <div 
                key={hotel.id}
                className="card border rounded-4 overflow-hidden shadow-sm bg-white transition-all"
                style={{
                  borderColor: '#E2E8F0',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div className="row g-0">
                  
                  {/* Left Column: Image Carousel with Badges */}
                  <div className="col-12 col-lg-5 p-3 bg-light bg-opacity-50">
                    <div className="position-relative overflow-hidden rounded-3 shadow-sm h-100" style={{ minHeight: '230px', maxHeight: '280px' }}>
                      <ImageCarousel
                        images={validHotelImages}
                        height="100%"
                        rounded="12px"
                        alt={hotel.name}
                      />

                      {/* Top Category Badge */}
                      <span 
                        className="position-absolute top-0 start-0 m-2.5 badge rounded-pill px-3 py-1.5 text-white fw-bold shadow"
                        style={{ 
                          zIndex: 6, 
                          pointerEvents: 'none',
                          background: starsCount === 5 
                            ? 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)' 
                            : starsCount === 4 
                              ? 'linear-gradient(135deg, #1E3E62 0%, #008080 100%)' 
                              : 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                          fontSize: '11px',
                          letterSpacing: '0.3px'
                        }}
                      >
                        ⭐ {categoryBadgeLabel}
                      </span>

                      {/* Photo count button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setGalleryHotel(hotel);
                        }}
                        className="position-absolute bottom-0 end-0 m-2.5 badge bg-dark bg-opacity-75 text-white border-0 px-2.5 py-1 rounded-pill text-xxs fw-bold d-flex align-items-center gap-1 shadow hover-scale"
                        style={{ zIndex: 6, cursor: 'pointer' }}
                      >
                        <Eye size={12} /> {validHotelImages.length} Photos
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Hotel Details, Highlights & Pricing */}
                  <div className="col-12 col-lg-7 p-3 p-md-4 d-flex flex-column justify-content-between">
                    <div>
                      {/* Top Bar: Stars, Rating & Location */}
                      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-1.5">
                        <div className="d-flex align-items-center gap-1.5">
                          <div className="d-flex text-warning">
                            {[...Array(Math.min(starsCount, 5))].map((_, i) => (
                              <Star key={i} size={15} fill="#F59E0B" color="#F59E0B" />
                            ))}
                          </div>
                          <span className="text-muted text-xxs fw-bold text-uppercase ms-1">
                            {starsCount} Star Property
                          </span>
                        </div>

                        {/* Verified Rating Pill */}
                        <div className="d-flex align-items-center gap-1.5 bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1 rounded-pill">
                          <Star size={13} fill="currentColor" />
                          <span className="fw-black text-xs">{hotel.rating || (starsCount === 5 ? '4.9' : starsCount === 4 ? '4.7' : '4.6')}</span>
                          <span className="text-muted text-xxs">/ 5.0 · Verified Stay</span>
                        </div>
                      </div>

                      {/* Hotel Name */}
                      <h3 
                        className="fw-black text-dark mb-1 font-heading cursor-pointer hover-text-primary"
                        style={{ fontSize: '22px', lineHeight: '1.25' }}
                        onClick={() => onViewDetails(hotel)}
                      >
                        {hotel.name}
                      </h3>

                      {/* Location with Map Trigger */}
                      <div className="d-flex align-items-center flex-wrap text-muted text-xs mb-3">
                        <MapPin size={14} className="text-warning me-1 flex-shrink-0" />
                        <span className="fw-semibold text-dark">{hotel.area || hotel.location || 'Goa, India'}</span>
                        <span className="mx-2 text-muted">·</span>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMapHotel(hotel);
                          }}
                          className="btn btn-link p-0 text-primary fw-bold text-xs text-decoration-none d-inline-flex align-items-center gap-1"
                        >
                          <Compass size={13} /> View on Map
                        </button>
                      </div>

                      {/* Key Amenities Badges */}
                      <div className="d-flex flex-wrap gap-1.5 mb-3">
                        {amenities.slice(0, 4).map((am, i) => (
                          <span 
                            key={i} 
                            className="badge bg-light text-dark border px-2.5 py-1 rounded-pill text-xxs fw-semibold d-flex align-items-center gap-1"
                          >
                            <Check size={11} className="text-success" />
                            {am}
                          </span>
                        ))}
                        {amenities.length > 4 && (
                          <span className="badge bg-light text-muted border px-2 py-1 rounded-pill text-xxs">
                            +{amenities.length - 4} more
                          </span>
                        )}
                      </div>

                      {/* Value Guarantees / Reassurance */}
                      <div className="d-flex flex-wrap gap-x-4 gap-y-1 text-xs mb-3 pt-2 border-top">
                        <span className="text-success fw-semibold d-flex align-items-center gap-1">
                          <Check size={13} /> Free Cancellation Available
                        </span>
                        <span className="text-success fw-semibold d-flex align-items-center gap-1">
                          <Utensils size={13} /> EP, CP, MAP &amp; AP Meal Plans
                        </span>
                        <span className="text-primary fw-semibold d-flex align-items-center gap-1">
                          <ShieldCheck size={13} /> 10% WOW GOA Cashback
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Price & Action CTA */}
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-end gap-3 pt-3 border-top">
                      <div>
                        <span className="text-muted text-xxs text-uppercase fw-bold d-block">Starting from</span>
                        <div className="d-flex align-items-baseline gap-2">
                          <span className="text-muted text-decoration-line-through text-xs">
                            ₹{getOriginalPrice(hotel.price).toLocaleString('en-IN')}
                          </span>
                          <span className="fw-black text-dark font-heading" style={{ fontSize: '26px', lineHeight: '1' }}>
                            ₹{hotel.price.toLocaleString('en-IN')}
                          </span>
                          <span className="text-muted text-xs">/ night</span>
                        </div>
                        <span className="text-muted text-xxs d-block mt-0.5">
                          + ₹{Math.round(hotel.price * 0.18).toLocaleString('en-IN')} (18% GST &amp; fees)
                        </span>
                      </div>

                      <button 
                        type="button"
                        className="btn btn-warning text-dark fw-bold rounded-pill px-4 py-2.5 text-xs d-flex align-items-center justify-content-center gap-2 shadow-sm font-heading hover-scale w-100 w-sm-auto"
                        onClick={() => {
                          if (document.activeElement?.blur) document.activeElement.blur();
                          onViewDetails(hotel);
                        }}
                      >
                        <span>View Rooms &amp; Rates</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>

                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── 3. INTERACTIVE IMAGE GALLERY VIEWER MODAL ─── */}
      {galleryHotel && (
        <UnifiedGalleryViewer
          item={galleryHotel}
          title={galleryHotel.name}
          type="hotel"
          onClose={() => setGalleryHotel(null)}
        />
      )}

      {/* ─── 4. INTERACTIVE GOOGLE MAPS MODAL ─── */}
      {mapHotel && (
        <div className="position-fixed inset-0 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1060, top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="bg-white rounded-4 shadow-lg overflow-hidden w-100 border" style={{ maxWidth: '850px', height: '80vh' }}>
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-light">
              <div className="d-flex align-items-center gap-2">
                <MapPin size={20} className="text-warning" />
                <div>
                  <h5 className="fw-bold text-dark mb-0 font-heading">{mapHotel.name}</h5>
                  <span className="text-muted text-xs">
                    {mapHotel.address ? `${mapHotel.address}, ` : ''}{mapHotel.area || mapHotel.location || 'Goa, India'}
                  </span>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([mapHotel.name, mapHotel.area || mapHotel.location, 'Goa, India'].filter(Boolean).join(', '))}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn btn-outline-dark btn-sm rounded-pill text-xs fw-bold d-flex align-items-center gap-1"
                >
                  <ExternalLink size={14} /> Open in Google Maps
                </a>
                <button 
                  type="button" 
                  onClick={() => setMapHotel(null)}
                  className="btn btn-light rounded-circle p-2 border d-flex align-items-center justify-content-center"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="w-100 h-100 position-relative" style={{ height: 'calc(80vh - 70px)' }}>
              <iframe
                title="Hotel Map Location"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight="0"
                marginWidth="0"
                src={`https://maps.google.com/maps?q=${encodeURIComponent([mapHotel.name, mapHotel.area || mapHotel.location, 'Goa, India'].filter(Boolean).join(', '))}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
