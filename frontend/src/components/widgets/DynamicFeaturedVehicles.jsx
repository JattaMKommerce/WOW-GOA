import React, { useState } from 'react';
import { Car, Bike, Settings, Fuel } from 'lucide-react';

export default function DynamicFeaturedVehicles({ config, cars = [], bikes = [], onBook }) {
  if (config && !config.visible) return null;

  const [filter, setFilter] = useState('all');

  const typedCars = cars.map(c => ({ ...c, type: 'car' }));
  const typedBikes = bikes.map(b => ({ ...b, type: 'bike' }));
  const allVehicles = [...typedCars, ...typedBikes].sort((a, b) => (b.price || 0) - (a.price || 0)).slice(0, 8);
  const displayVehicles = filter === 'all' ? allVehicles : allVehicles.filter(v => v.type === filter);

  return (
    <div className="py-5" style={{ background: '#f8fafc' }}>
      <div className="container">
        <div className="section-header text-center mb-4">
          <span className="section-tagline text-primary fw-bold text-uppercase" style={{ letterSpacing: '2px', fontSize: '0.8rem' }}>
            Drive the Best
          </span>
          <h2 className="section-title fw-bold mt-2" style={{ color: '#0D1B2E', fontSize: '2rem' }}>
            {config?.heading || 'Self Drive Fleet'}
          </h2>
          <p className="text-muted mt-2 mx-auto" style={{ maxWidth: '600px' }}>
            {config?.subtext || 'Top condition cars and bikes for your journey'}
          </p>
        </div>

        <div className="d-flex justify-content-center gap-3 mb-5">
          <button className={`btn rounded-pill px-4 fw-bold ${filter === 'all' ? 'btn-primary' : 'btn-outline-secondary bg-white'}`} onClick={() => setFilter('all')}>All Fleet</button>
          <button className={`btn rounded-pill px-4 fw-bold ${filter === 'car' ? 'btn-primary' : 'btn-outline-secondary bg-white'}`} onClick={() => setFilter('car')}><Car size={16} className="me-2" />Cars</button>
          <button className={`btn rounded-pill px-4 fw-bold ${filter === 'bike' ? 'btn-primary' : 'btn-outline-secondary bg-white'}`} onClick={() => setFilter('bike')}><Bike size={16} className="me-2" />Bikes</button>
        </div>

        <div className="row g-4 justify-content-center">
          {displayVehicles.map(v => (
            <div key={`${v.type}-${v.id}`} className="col-md-6 col-lg-3">
              <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                <div style={{ height: '180px', overflow: 'hidden', background: '#e2e8f0', padding: '20px' }}>
                  <img 
                    src={v.image || 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=500'} 
                    alt={v.name} 
                    className="w-100 h-100" 
                    style={{ objectFit: 'contain' }} 
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=500'; }}
                  />
                </div>
                <div className="card-body p-4">
                  <span className="badge bg-light text-primary mb-2 text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>
                    {(v.type === 'bike' && v.category?.toLowerCase() === 'car') ? 'Bike' : (v.category || v.type)}
                  </span>
                  <h5 className="fw-bold mb-3" style={{ color: '#0D1B2E' }}>{v.name}</h5>
                  <div className="d-flex flex-wrap gap-2 mb-4">
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
                    {v.engine && (
                      <span className="d-flex align-items-center text-muted" style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>
                        <Settings size={12} className="me-1" /> {v.engine}
                      </span>
                    )}
                  </div>
                  <div className="d-flex align-items-center justify-content-between mt-auto">
                    <div>
                      <div className="fw-bold text-dark" style={{ fontSize: '1.2rem' }}>₹{parseFloat(v.price).toLocaleString()}</div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>Per Day</div>
                    </div>
                    <button className="btn btn-primary btn-sm rounded-pill px-3 fw-bold shadow-sm" onClick={() => onBook(v)}>
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {displayVehicles.length === 0 && (
            <div className="col-12 text-center text-muted py-5">
              No vehicles available in this category right now.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
