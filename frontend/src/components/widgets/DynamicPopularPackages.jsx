import React from 'react';
import { MapPin, Clock, ArrowRight } from 'lucide-react';

export default function DynamicPopularPackages({ config, packages = [], onBook, onViewDetails }) {
  if (config && !config.visible) return null;

  // Take top 3 packages, fallback to all packages if filtering yields none
  let topPackages = packages.filter(p => p.package_type !== 'Self Drive Package');
  if (topPackages.length === 0) topPackages = packages;
  topPackages = topPackages.slice(0, 3);

  return (
    <div className="py-5 bg-white">
      <div className="container">
        <div className="section-header text-center mb-5">
          <span className="section-tagline text-primary fw-bold text-uppercase" style={{ letterSpacing: '2px', fontSize: '0.8rem' }}>
            Exclusive Deals
          </span>
          <h2 className="section-title fw-bold mt-2" style={{ color: '#0D1B2E', fontSize: '2rem' }}>
            {config?.heading || 'Popular Trip Packages'}
          </h2>
          <p className="text-muted mt-2 mx-auto" style={{ maxWidth: '600px' }}>
            {config?.subtext || 'Curated experiences for the perfect getaway'}
          </p>
        </div>

        <div className="row g-4 justify-content-center">
          {topPackages.map(pkg => (
            <div key={pkg.id} className="col-lg-4 col-md-6">
              <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden" style={{ transition: 'transform 0.3s ease' }}>
                <div style={{ height: '220px', position: 'relative' }}>
                  <img 
                    src={pkg.image || pkg.image_url || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=500'} 
                    alt={pkg.name} 
                    className="w-100 h-100" 
                    style={{ objectFit: 'cover' }} 
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=500'; }}
                  />
                  <span className="position-absolute top-0 end-0 m-3 badge bg-primary text-white rounded-pill px-3 py-2 shadow-sm">
                    {pkg.package_type || 'Tour'}
                  </span>
                </div>
                <div className="card-body p-4 d-flex flex-column">
                  <h4 className="fw-bold mb-2" style={{ color: '#0D1B2E', fontSize: '1.25rem' }}>{pkg.name}</h4>
                  <div className="d-flex align-items-center gap-3 text-muted mb-3" style={{ fontSize: '0.85rem' }}>
                    <span className="d-flex align-items-center"><MapPin size={14} className="me-1" /> {pkg.destination || 'Goa'}</span>
                    <span className="d-flex align-items-center"><Clock size={14} className="me-1" /> {pkg.duration || '3N/4D'}</span>
                  </div>
                  <p className="text-muted mb-4" style={{ fontSize: '0.9rem', flexGrow: 1 }}>
                    {pkg.description?.substring(0, 100) || 'An amazing experience awaits you...'}...
                  </p>
                  <div className="d-flex align-items-center justify-content-between pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Price starts at</div>
                      <div className="fw-bold text-dark" style={{ fontSize: '1.3rem' }}>₹{parseFloat(pkg.price).toLocaleString()}</div>
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-bold" onClick={() => onViewDetails(pkg)}>
                        View Details
                      </button>
                      <button className="btn btn-primary btn-sm rounded-pill px-3 fw-bold" onClick={() => onBook(pkg, 'package')}>
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {topPackages.length === 0 && (
            <div className="col-12 text-center text-muted py-5">
              No packages available right now.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
