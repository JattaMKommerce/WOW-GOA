import React from 'react';
import { ChevronRight, ArrowLeft, Star, MapPin, Users, Fuel, CheckCircle, Shield, Settings, Zap } from 'lucide-react';

export default function VehicleDetailsPage({ vehicle, type, onBack, onBook }) {
  const isBike = type === 'bike';
  const features = isBike 
    ? ['Helmet Included', 'Full Tank', 'Well Maintained', 'Instant Booking']
    : ['AC', 'Music System', 'Airbags', 'Power Windows', 'Clean Interior'];
    
  const price = parseFloat(vehicle.price) || 0;
  const originalPrice = Math.round(price * 1.25); // 25% markup for strikethrough

  return (
    <div className="vehicle-details-page animate-fade-in-up pb-5" style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      
      {/* Top Navbar */}
      <div className="bg-white border-bottom sticky-top shadow-sm px-4 py-3 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3">
          <button onClick={onBack} className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center">
            <ArrowLeft size={20} />
          </button>
          <h4 className="mb-0 fw-bold">{vehicle.name}</h4>
        </div>
        <button onClick={onBack} className="btn btn-outline-secondary d-flex align-items-center gap-2 rounded-pill px-3 py-1">
          Back
        </button>
      </div>

      <div className="container py-4">
        <div className="bg-white rounded-4 shadow-sm p-4">
          
          {/* Header Info */}
          <div className="mb-4">
            <div className="d-flex align-items-center gap-2 text-muted mb-2">
              <span className="badge bg-primary bg-opacity-10 text-primary">{vehicle.category}</span>
              {isBike ? <Zap size={16} /> : <Settings size={16} />} 
              <span>{vehicle.transmission || (isBike ? 'Manual' : 'Automatic')}</span>
            </div>
            <h2 className="fw-bold mb-2 d-flex align-items-center gap-2">
              {vehicle.name}
              <div className="d-flex text-warning ms-2">
                {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
              </div>
            </h2>
            <div className="text-muted d-flex align-items-center gap-1">
              <MapPin size={16} /> Available for pickup in Goa
            </div>
          </div>

          <div className="row g-5">
            {/* Left Col: Image & Details */}
            <div className="col-12 col-lg-8">
              <div className="rounded-4 overflow-hidden mb-5 bg-light d-flex align-items-center justify-content-center" style={{ height: '400px' }}>
                <img 
                  src={vehicle.image || 'https://placehold.co/800x400?text=No+Image'} 
                  alt={vehicle.name} 
                  className="w-100 h-100 object-fit-contain p-4"
                />
              </div>

              <h4 className="fw-bold mb-3">Vehicle Specifications</h4>
              <div className="row g-3 mb-5">
                <div className="col-6 col-md-3">
                  <div className="border rounded-3 p-3 text-center bg-light">
                    <Users className="text-primary mb-2 mx-auto" size={24} />
                    <div className="text-muted small">Seating</div>
                    <div className="fw-bold">{vehicle.seating || '2'} Seats</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="border rounded-3 p-3 text-center bg-light">
                    <Fuel className="text-primary mb-2 mx-auto" size={24} />
                    <div className="text-muted small">Fuel Type</div>
                    <div className="fw-bold">{vehicle.fuel || 'Petrol'}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="border rounded-3 p-3 text-center bg-light">
                    <Settings className="text-primary mb-2 mx-auto" size={24} />
                    <div className="text-muted small">Transmission</div>
                    <div className="fw-bold">{vehicle.transmission || 'Manual'}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="border rounded-3 p-3 text-center bg-light">
                    <Shield className="text-primary mb-2 mx-auto" size={24} />
                    <div className="text-muted small">Insurance</div>
                    <div className="fw-bold">Included</div>
                  </div>
                </div>
              </div>

              <h4 className="fw-bold mb-3">Key Features</h4>
              <div className="d-flex flex-wrap gap-2 mb-4">
                {features.map((feature, idx) => (
                  <span key={idx} className="badge bg-light text-dark border px-3 py-2 rounded-pill d-flex align-items-center gap-1">
                    <CheckCircle size={14} className="text-success" />
                    {feature}
                  </span>
                ))}
              </div>
              
              <div className="alert alert-info d-flex align-items-center gap-3 rounded-4 mt-4">
                <Shield size={32} className="text-primary" />
                <div>
                  <h6 className="fw-bold mb-1">Safety First Guarantee</h6>
                  <p className="mb-0 small text-muted">All our vehicles are thoroughly sanitized and inspected before every trip to ensure your safety and comfort.</p>
                </div>
              </div>
            </div>
            
            {/* Right Col: Pricing Sidebar */}
            <div className="col-12 col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 p-4 sticky-top" style={{ top: '100px' }}>
                <h5 className="fw-bold mb-3">Booking Details</h5>
                
                <div className="mb-4 text-center py-4 bg-light rounded-4">
                  <div className="text-decoration-line-through text-muted small">₹ {originalPrice.toLocaleString()}</div>
                  <h2 className="fw-bold text-primary mb-0 d-inline-block">₹ {price.toLocaleString()}</h2>
                  <span className="text-muted ms-1">/ day</span>
                </div>

                <ul className="list-unstyled mb-4">
                  <li className="d-flex align-items-start gap-2 mb-3">
                    <CheckCircle size={18} className="text-success mt-1" />
                    <span className="text-muted small">Zero hidden charges. Transparent pricing always.</span>
                  </li>
                  <li className="d-flex align-items-start gap-2 mb-3">
                    <CheckCircle size={18} className="text-success mt-1" />
                    <span className="text-muted small">Free cancellation up to 24 hours before pickup.</span>
                  </li>
                  <li className="d-flex align-items-start gap-2">
                    <CheckCircle size={18} className="text-success mt-1" />
                    <span className="text-muted small">24/7 Roadside Assistance included in your trip.</span>
                  </li>
                </ul>

                <button 
                  className="btn btn-primary w-100 py-3 rounded-pill fw-bold fs-6 d-flex align-items-center justify-content-center gap-2 hover-scale" 
                  onClick={() => onBook(vehicle)}
                >
                  Book Now <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
