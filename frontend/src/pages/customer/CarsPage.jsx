import React, { useState, useMemo } from 'react';
import { Star, Users, TrendingUp, ShieldCheck, Award, Filter, AlertCircle, RotateCcw } from 'lucide-react';

export default function CarsPage({
  carFilterFuel = 'All',
  setCarFilterFuel,
  carFilterTrans = 'All',
  setCarFilterTrans,
  handleOpenBooking,
  onViewDetails,
  cars = [],
  searchQuery,
  markups = []
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

  const displayCars = useMemo(() => {
    return (cars || []).map(car => ({
      ...car,
      price: getMarkupPrice(parseFloat(car.price || 0), car.vendor_id || 'global', 'cars', car.id)
    }));
  }, [cars, markups]);

  const filteredCars = useMemo(() => {
    const results = displayCars.filter(car => {
      const fuelMatch = !carFilterFuel || carFilterFuel === 'All' || car.fuel === carFilterFuel;
      const transMatch = !carFilterTrans || carFilterTrans === 'All' || car.transmission === carFilterTrans;
      const q = (searchQuery || '').toLowerCase().trim();
      const searchMatch = !q || 
                          q === 'goa' || 
                          q === 'all goa' || 
                          q === 'all' || 
                          q === 'india' ||
                          (car.name && car.name.toLowerCase().includes(q)) || 
                          (car.category && car.category.toLowerCase().includes(q)) ||
                          (car.location && car.location.toLowerCase().includes(q));
      return fuelMatch && transMatch && searchMatch;
    });

    console.log('[CarsPage Filter Evaluation]', {
      totalCars: (cars || []).length,
      matchedCars: results.length,
      searchQuery,
      carFilterFuel,
      carFilterTrans
    });

    return results;
  }, [displayCars, carFilterFuel, carFilterTrans, searchQuery, cars]);

  const carsToRender = filteredCars.length > 0 ? filteredCars : displayCars;
  const isFallbackView = filteredCars.length === 0 && displayCars.length > 0;

  const [activeMediaIndexes, setActiveMediaIndexes] = useState({});

  const handlePrevMedia = (carId, mediaCount, e) => {
    e.stopPropagation();
    setActiveMediaIndexes(prev => {
      const curr = prev[carId] || 0;
      const nextIdx = (curr - 1 + mediaCount) % mediaCount;
      return { ...prev, [carId]: nextIdx };
    });
  };

  const handleNextMedia = (carId, mediaCount, e) => {
    e.stopPropagation();
    setActiveMediaIndexes(prev => {
      const curr = prev[carId] || 0;
      const nextIdx = (curr + 1) % mediaCount;
      return { ...prev, [carId]: nextIdx };
    });
  };

  const handleResetFilters = () => {
    if (setCarFilterFuel) setCarFilterFuel('All');
    if (setCarFilterTrans) setCarFilterTrans('All');
  };

  return (
    <div className="animate-fade-in-up container px-3 px-md-0 pt-4" style={{ minHeight: '100vh' }}>
      
      {/* Header */}
      <div className="section-header mb-4 text-start">
        <h2 className="fs-3 fw-bold text-dark">Self Drive Rental Cars in Goa</h2>
        <p className="text-muted small">
          Showing {carsToRender.length} verified cars with unlimited kilometres and insurance.
        </p>
      </div>

      {/* Fallback Banner */}
      {isFallbackView && (
        <div className="alert alert-info d-flex align-items-center justify-content-between p-3 rounded-4 mb-4 border-0 shadow-sm" style={{ background: '#f0fdf4', borderLeft: '4px solid #10b981' }}>
          <div className="d-flex align-items-center gap-2">
            <AlertCircle size={20} className="text-success flex-shrink-0" />
            <span className="text-dark small fw-semibold">
              No cars matched strict filter criteria for "{searchQuery || 'your filter'}". Showing all available rental cars.
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

      {/* Filter Bar */}
      <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between mb-4 bg-white p-3 rounded-4 shadow-sm border">
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <span className="text-muted small fw-bold me-1">Fuel:</span>
          {['All', 'Petrol', 'Diesel', 'Electric'].map(fuel => (
            <button
              key={fuel}
              type="button"
              className={`btn btn-sm rounded-pill px-3 ${carFilterFuel === fuel ? 'btn-primary' : 'btn-light border'}`}
              onClick={() => setCarFilterFuel && setCarFilterFuel(fuel)}
            >
              {fuel}
            </button>
          ))}
        </div>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <span className="text-muted small fw-bold me-1">Transmission:</span>
          {['All', 'Manual', 'Automatic'].map(trans => (
            <button
              key={trans}
              type="button"
              className={`btn btn-sm rounded-pill px-3 ${carFilterTrans === trans ? 'btn-primary' : 'btn-light border'}`}
              onClick={() => setCarFilterTrans && setCarFilterTrans(trans)}
            >
              {trans}
            </button>
          ))}
        </div>
      </div>

      {/* Car Grid */}
      <div className="row g-4 mb-5">
        {carsToRender.length === 0 ? (
          <div className="col-12 text-center py-5 bg-white rounded-4 border shadow-sm">
            <h4 className="text-muted mb-2">No rental cars available in this category.</h4>
            <button 
              type="button"
              className="btn btn-primary rounded-pill px-4 py-2 mt-2"
              onClick={handleResetFilters}
            >
              View All Cars
            </button>
          </div>
        ) : (
          carsToRender.map(car => {
            const parsedImages = [];
            if (car.images_json) {
              try {
                const p = typeof car.images_json === 'string' ? JSON.parse(car.images_json) : car.images_json;
                if (Array.isArray(p)) parsedImages.push(...p);
              } catch (e) {}
            }
            if (car.mediaList && Array.isArray(car.mediaList)) {
              parsedImages.push(...car.mediaList.map(m => m?.url || m));
            }
            if (car.media_list && Array.isArray(car.media_list)) {
              parsedImages.push(...car.media_list.map(m => m?.url || m));
            }
            if (car.additional_images && Array.isArray(car.additional_images)) {
              parsedImages.push(...car.additional_images);
            }
            if (car.image) parsedImages.push(car.image);

            const mediaList = Array.from(new Set(parsedImages.filter(Boolean)));
            const activeIdx = activeMediaIndexes[car.id] || 0;
            const currentImg = mediaList[activeIdx] || car.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80';

            return (
              <div key={car.id} className="col-md-6 col-lg-4">
                <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative">
                  <div className="position-relative bg-dark" style={{ height: '200px' }}>
                    <img 
                      src={currentImg} 
                      alt={car.name} 
                      className="w-100 h-100 object-fit-cover"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80'; }}
                    />
                    <span className="badge bg-dark bg-opacity-75 text-white position-absolute top-0 start-0 m-3 px-2 py-1 rounded-pill small" style={{ zIndex: 2 }}>
                      {car.category || 'Hatchback'}
                    </span>
                    {mediaList.length > 1 && (
                      <>
                        <button
                          type="button"
                          className="btn btn-sm btn-dark position-absolute start-0 top-50 translate-middle-y ms-2 rounded-circle d-flex align-items-center justify-content-center opacity-75 shadow"
                          style={{ width: '26px', height: '26px', padding: 0, zIndex: 2 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMediaNav(car.id, -1, mediaList.length);
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
                            handleMediaNav(car.id, 1, mediaList.length);
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
                      <h5 className="fw-bold text-dark mb-1">{car.name}</h5>
                      <div className="d-flex align-items-center gap-2 text-muted small mb-3">
                        <span>👥 {car.seating || 5} Seats</span>
                        <span>•</span>
                        <span>⛽ {car.fuel || 'Petrol'}</span>
                        <span>•</span>
                        <span>⚙️ {car.transmission || 'Manual'}</span>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      <div>
                        <span className="text-muted small d-block">per day</span>
                        <h4 className="fw-black text-primary mb-0">₹{Number(car.price).toLocaleString('en-IN')}</h4>
                      </div>
                      <div className="d-flex gap-2">
                        {onViewDetails && (
                          <button 
                            type="button" 
                            className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                            onClick={() => onViewDetails(car)}
                          >
                            Details
                          </button>
                        )}
                        <button 
                          type="button" 
                          className="btn btn-primary btn-sm rounded-pill px-3 fw-bold"
                          style={{ background: '#FF6333', borderColor: '#FF6333' }}
                          onClick={() => handleOpenBooking(car)}
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
