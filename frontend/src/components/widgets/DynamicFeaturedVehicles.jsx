import React, { useState } from 'react';
import { Car, Bike, Settings, Fuel, Users, Gauge } from 'lucide-react';

const BIKE_CATEGORIES = new Set([
  'scooter', 'scooter / moped', 'sports bike', 'cruiser', 'tourer / adventure',
  'electric scooter (ev)', 'superbike', 'dirt / off-road', 'cafe racer', 'standard / commuter', 'bike'
]);

function isBikeItem(item) {
  if (!item) return false;
  if (item._type === 'bike' || item.type === 'bike') return true;
  const cat = (item.category || '').toLowerCase().trim();
  if (BIKE_CATEGORIES.has(cat) || cat.includes('bike') || cat.includes('scooter') || cat.includes('moped')) return true;
  const name = (item.name || '').toLowerCase().trim();
  if (name.includes('ninja') || name.includes('kavasaki') || name.includes('kawasaki') || name.includes('activa') || name.includes('jupiter') || name.includes('bullet') || name.includes('ktm') || name.includes('duke') || name.includes('r15') || name.includes('pulsar')) return true;
  return false;
}

export default function DynamicFeaturedVehicles({ config, cars = [], bikes = [], onBook, onBookVehicle, onViewVehicle, onViewDetails }) {
  if (config && !config.visible) return null;

  const handleBook = (v) => {
    if (onBookVehicle) onBookVehicle(v);
    else if (onBook) onBook(v);
  };

  const handleView = (v) => {
    if (onViewVehicle) onViewVehicle(v);
    else if (onViewDetails) onViewDetails(v);
    else handleBook(v);
  };

  const [filter, setFilter] = useState('all');

  const allTypedCars = (cars || []).filter(c => !isBikeItem(c)).map(c => ({ ...c, type: 'car' }));
  const allTypedBikes = [
    ...(bikes || []).map(b => ({ ...b, type: 'bike' })),
    ...(cars || []).filter(c => isBikeItem(c)).map(c => ({ ...c, type: 'bike' }))
  ];

  const displayVehicles = (() => {
    if (filter === 'car') return allTypedCars;
    if (filter === 'bike') return allTypedBikes;
    return [...allTypedCars, ...allTypedBikes].sort((a, b) => (b.price || 0) - (a.price || 0));
  })();

  return (
    <div className="py-5" style={{ background: '#f8fafc' }}>
      <div className="container">
        <div className="section-header text-center mb-4">
          <div className="section-tagline text-primary fw-bold text-uppercase d-block mb-2" style={{ letterSpacing: '2px', fontSize: '0.85rem' }}>
            Drive the Best
          </div>
          <h2 className="section-title fw-bold" style={{ color: '#0D1B2E', fontSize: '2rem' }}>
            {config?.heading || 'Self Drive Fleet'}
          </h2>
          <p className="text-muted mt-3 mx-auto" style={{ maxWidth: '600px' }}>
            {config?.subtext || 'Top condition cars and bikes for your journey'}
          </p>
        </div>

        <div className="d-flex justify-content-center gap-3 mb-5">
          <button 
            type="button"
            className={`btn rounded-pill px-4 fw-bold shadow-xs ${filter === 'all' ? 'btn-primary' : 'btn-outline-secondary bg-white'}`} 
            onClick={() => setFilter('all')}
          >
            All Fleet
          </button>
          <button 
            type="button"
            className={`btn rounded-pill px-4 fw-bold shadow-xs ${filter === 'car' ? 'btn-primary' : 'btn-outline-secondary bg-white'}`} 
            onClick={() => setFilter('car')}
          >
            <Car size={16} className="me-2" />Cars
          </button>
          <button 
            type="button"
            className={`btn rounded-pill px-4 fw-bold shadow-xs ${filter === 'bike' ? 'btn-primary' : 'btn-outline-secondary bg-white'}`} 
            onClick={() => setFilter('bike')}
          >
            <Bike size={16} className="me-2" />Bikes
          </button>
        </div>

        <div className="row g-4 justify-content-center">
          {displayVehicles.map(v => (
            <div key={`${v.type}-${v.id}`} className="col-md-6 col-lg-3">
              <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden bg-white hover-lift transition-all">
                <div style={{ height: '180px', overflow: 'hidden', background: '#f8fafc', padding: '20px' }}>
                  <img 
                    src={v.image || (v.type === 'bike' ? 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500' : 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=500')} 
                    alt={v.name} 
                    className="w-100 h-100 object-fit-contain" 
                    onError={(e) => { 
                      e.target.onerror = null; 
                      e.target.src = v.type === 'bike' ? 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500' : 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=500'; 
                    }}
                  />
                </div>
                <div className="card-body p-4 d-flex flex-column justify-content-between">
                  <div>
                    <span className="badge bg-light text-primary mb-2 text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>
                      {v.category || (v.type === 'bike' ? 'Bike' : 'Car')}
                    </span>
                    <h5 className="fw-bold mb-3 text-truncate" style={{ color: '#0D1B2E' }} title={v.name}>{v.name}</h5>
                    
                    <div className="d-flex flex-wrap gap-2 mb-4">
                      {v.type === 'car' ? (
                        <>
                          {v.transmission && (
                            <span className="d-flex align-items-center text-muted" style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>
                              <Settings size={12} className="me-1" /> {v.transmission}
                            </span>
                          )}
                          {v.fuel && (
                            <span className="d-flex align-items-center text-muted" style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>
                              <Fuel size={12} className="me-1" /> {v.fuel}
                            </span>
                          )}
                          {v.seating && (
                            <span className="d-flex align-items-center text-muted" style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>
                              <Users size={12} className="me-1" /> {v.seating}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          {v.engine && (
                            <span className="d-flex align-items-center text-muted" style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>
                              <Settings size={12} className="me-1" /> {v.engine}
                            </span>
                          )}
                          {v.fuel && (
                            <span className="d-flex align-items-center text-muted" style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>
                              <Fuel size={12} className="me-1" /> {v.fuel}
                            </span>
                          )}
                          {v.mileage && (
                            <span className="d-flex align-items-center text-muted" style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>
                              <Gauge size={12} className="me-1" /> {v.mileage}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="d-flex align-items-center justify-content-between mt-auto pt-2 border-top">
                    <div>
                      <div className="fw-bold text-dark" style={{ fontSize: '1.2rem' }}>₹{parseFloat(v.price).toLocaleString()}</div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>Per Day</div>
                    </div>
                    <button type="button" className="btn btn-primary btn-sm rounded-pill px-3 fw-bold shadow-sm" onClick={() => handleBook(v)}>
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {displayVehicles.length === 0 && (
            <div className="col-12 text-center text-muted py-5 bg-white rounded-4 border">
              <p className="mb-0 fw-semibold">No vehicles available in this category right now.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
