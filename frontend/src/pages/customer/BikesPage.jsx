import React, { useState, useMemo } from 'react';
import { Star, TrendingUp, ShieldCheck, Award, Clock, Filter, AlertCircle, RotateCcw } from 'lucide-react';

export default function BikesPage({
  bikeFilterType = 'All',
  setBikeFilterType,
  handleOpenBooking,
  onViewDetails,
  bikes = [],
  searchQuery,
  markups = [],
  appliedFilters = {},
  setAppliedFilters
}) {
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

  const displayBikes = useMemo(() => {
    return (bikes || []).map(bike => ({
      ...bike,
      price: getMarkupPrice(parseFloat(bike.price || 0), bike.vendor_id || 'global', 'bikes', bike.id)
    }));
  }, [bikes, markups]);

  const filteredBikes = useMemo(() => {
    const bikeSubs = appliedFilters?.bikeSubFilters || [];
    const appBudget = appliedFilters?.vehicleBudget || [];

    const results = displayBikes.filter(bike => {
      const bCat = (bike.category || '').toLowerCase();
      const bName = (bike.name || '').toLowerCase();
      const bFuel = (bike.fuel || '').toLowerCase();
      const price = parseFloat(bike.price || 0);
      const selCat = (bikeFilterType || 'All').toLowerCase();

      const typeMatch = selCat === 'all' 
        || bCat === selCat 
        || bCat.includes(selCat) 
        || selCat.includes(bCat)
        || (selCat.includes('scooter') && bCat.includes('scooter'))
        || (selCat.includes('sports') && bCat.includes('sports'))
        || (selCat.includes('cruiser') && bCat.includes('cruiser'));

      const subMatch = bikeSubs.length === 0 || bikeSubs.some(sub => {
        const s = sub.toLowerCase();
        if (s.includes('scooter')) return bCat.includes('scooter') || bName.includes('activa') || bName.includes('jupiter') || bName.includes('access');
        if (s.includes('cruiser') || s.includes('enfield')) return bCat.includes('cruiser') || bName.includes('classic') || bName.includes('bullet') || bName.includes('hunter') || bName.includes('meteor') || bName.includes('himalayan');
        if (s.includes('sports')) return bCat.includes('sports') || bCat.includes('superbike') || bName.includes('r15') || bName.includes('ktm') || bName.includes('duke') || bName.includes('pulsar') || bName.includes('ninja');
        if (s.includes('electric') || s.includes('ev')) return bFuel.includes('electric') || bFuel.includes('ev') || bName.includes('ev') || bName.includes('ather') || bName.includes('ola');
        return bCat.includes(s) || bName.includes(s);
      });

      const budgetMatch = appBudget.length === 0 || appBudget.some(b => {
        if (b === '< 1500') return price < 1500;
        if (b === '1500-3000') return price >= 1500 && price <= 3000;
        if (b === '3000-6000') return price >= 3000 && price <= 6000;
        if (b === '> 6000') return price > 6000;
        return true;
      });

      const q = (searchQuery || '').toLowerCase().trim();
      const searchMatch = !q || 
                          q === 'goa' || 
                          q === 'all goa' || 
                          q === 'all' || 
                          q === 'india' ||
                          bName.includes(q) || 
                          bCat.includes(q) || 
                          (bike.location && bike.location.toLowerCase().includes(q));
      return typeMatch && subMatch && budgetMatch && searchMatch;
    });

    return results;
  }, [displayBikes, bikeFilterType, searchQuery, appliedFilters]);

  const bikesToRender = filteredBikes;

  const [activeMediaIndexes, setActiveMediaIndexes] = useState({});

  const handlePrevMedia = (bikeId, mediaCount, e) => {
    e.stopPropagation();
    setActiveMediaIndexes(prev => {
      const curr = prev[bikeId] || 0;
      const nextIdx = (curr - 1 + mediaCount) % mediaCount;
      return { ...prev, [bikeId]: nextIdx };
    });
  };

  const handleNextMedia = (bikeId, mediaCount, e) => {
    e.stopPropagation();
    setActiveMediaIndexes(prev => {
      const curr = prev[bikeId] || 0;
      const nextIdx = (curr + 1) % mediaCount;
      return { ...prev, [bikeId]: nextIdx };
    });
  };

  const handleResetFilters = () => {
    if (setBikeFilterType) setBikeFilterType('All');
  };

  return (
    <div className="animate-fade-in-up container px-3 px-md-0 pt-4" style={{ minHeight: '100vh' }}>
      
      {/* Header */}
      <div className="section-header mb-4 text-start">
        <h2 className="fs-3 fw-bold text-dark">Rental Bikes & Scooters in Goa</h2>
        <p className="text-muted small">
          Showing {bikesToRender.length} verified scooters and premium cruiser bikes.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="d-flex flex-wrap gap-2 align-items-center mb-4 bg-white p-3 rounded-4 shadow-sm border">
        <span className="text-muted small fw-bold me-2">Category:</span>
        {['All', 'Scooter / Moped', 'Sports Bike', 'Cruiser', 'Standard'].map(cat => (
          <button
            key={cat}
            type="button"
            className={`btn btn-sm rounded-pill px-3 ${bikeFilterType === cat ? 'btn-primary' : 'btn-light border'}`}
            onClick={() => setBikeFilterType && setBikeFilterType(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Bike Grid */}
      <div className="row g-4 mb-5">
        {bikesToRender.length === 0 ? (
          <div className="col-12 text-center py-5 bg-white rounded-4 border shadow-sm">
            <h4 className="text-muted mb-2">No rental bikes available in this category.</h4>
            <button 
              type="button"
              className="btn btn-primary rounded-pill px-4 py-2 mt-2"
              onClick={handleResetFilters}
            >
              View All Bikes
            </button>
          </div>
        ) : (
          bikesToRender.map(bike => {
            const parsedImages = [];
            if (bike.images_json) {
              try {
                const p = typeof bike.images_json === 'string' ? JSON.parse(bike.images_json) : bike.images_json;
                if (Array.isArray(p)) parsedImages.push(...p);
              } catch (e) {}
            }
            if (bike.mediaList && Array.isArray(bike.mediaList)) {
              parsedImages.push(...bike.mediaList.map(m => m?.url || m));
            }
            if (bike.media_list && Array.isArray(bike.media_list)) {
              parsedImages.push(...bike.media_list.map(m => m?.url || m));
            }
            if (bike.additional_images && Array.isArray(bike.additional_images)) {
              parsedImages.push(...bike.additional_images);
            }
            if (bike.image) parsedImages.push(bike.image);

            const mediaList = Array.from(new Set(parsedImages.filter(Boolean)));
            const activeIdx = activeMediaIndexes[bike.id] || 0;
            const currentImg = mediaList[activeIdx] || bike.image || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80';

            return (
              <div key={bike.id} className="col-md-6 col-lg-4">
                <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative">
                  <div className="position-relative bg-dark" style={{ height: '200px' }}>
                    <img 
                      src={currentImg} 
                      alt={bike.name} 
                      className="w-100 h-100 object-fit-cover"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80'; }}
                    />
                    <span className="badge bg-dark bg-opacity-75 text-white position-absolute top-0 start-0 m-3 px-2 py-1 rounded-pill small" style={{ zIndex: 2 }}>
                      {bike.category || 'Scooter'}
                    </span>
                    {mediaList.length > 1 && (
                      <>
                        <button
                          type="button"
                          className="btn btn-sm btn-dark position-absolute start-0 top-50 translate-middle-y ms-2 rounded-circle d-flex align-items-center justify-content-center opacity-75 shadow"
                          style={{ width: '26px', height: '26px', padding: 0, zIndex: 2 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMediaNav(bike.id, -1, mediaList.length);
                          }}
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-dark position-absolute end-0 top-50 translate-middle-y me-2 rounded-circle d-flex align-items-center justify-content-center opacity-75 shadow"
                          style={{ width: '26px', height: '26px', padding: 0, zIndex: 2 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMediaNav(bike.id, 1, mediaList.length);
                          }}
                        >
                          ›
                        </button>
                        <div className="position-absolute bottom-0 end-0 m-2 badge bg-dark bg-opacity-75 text-white rounded" style={{ zIndex: 2 }}>
                          📷 {activeIdx + 1} / {mediaList.length}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="card-body p-3 d-flex flex-column justify-content-between">
                    <div>
                      <h5 className="fw-bold text-dark mb-1">{bike.name}</h5>
                      <div className="d-flex align-items-center gap-2 text-muted small mb-3">
                        <span>👥 2 Seats</span>
                        <span>•</span>
                        <span>⛽ {bike.fuel || 'Petrol'}</span>
                        <span>•</span>
                        <span>📍 {bike.location || 'Goa Delivery'}</span>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      <div>
                        <span className="text-muted small d-block">per day</span>
                        <h4 className="fw-black text-primary mb-0">₹{Number(bike.price).toLocaleString('en-IN')}</h4>
                      </div>
                      <div className="d-flex gap-2">
                        {onViewDetails && (
                          <button 
                            type="button" 
                            className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                            onClick={() => onViewDetails(bike)}
                          >
                            Details
                          </button>
                        )}
                        <button 
                          type="button" 
                          className="btn btn-primary btn-sm rounded-pill px-3 fw-bold"
                          style={{ background: '#FF6333', borderColor: '#FF6333' }}
                          onClick={() => handleOpenBooking(bike)}
                        >
                          Book Now
                        </button>
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
