import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Star, MapPin, ArrowLeft, CheckCircle } from 'lucide-react';

export default function HotelImageGallery({ hotel, nights = 1, onClose, onSelect }) {
  const [viewMode, setViewMode] = useState('details'); // 'details' or 'gallery'
  const [currentIndex, setCurrentIndex] = useState(0);

  // Collect all images
  let images = [];
  if (hotel.image) images.push(hotel.image);
  if (hotel.image_url && !images.includes(hotel.image_url)) images.push(hotel.image_url);
  
  if (hotel.images_json) {
    try {
      const parsed = typeof hotel.images_json === 'string' ? JSON.parse(hotel.images_json) : hotel.images_json;
      if (Array.isArray(parsed)) {
        parsed.forEach(img => {
          if (!images.includes(img)) images.push(img);
        });
      }
    } catch (e) {}
  }

  // Fallback if no images
  if (images.length === 0) {
    images.push('https://placehold.co/800x600?text=No+Image+Available');
  }

  // Escape to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (viewMode === 'gallery') setViewMode('details');
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, onClose]);

  const pricePerNight = parseInt(hotel.price) || 0;
  const totalPrice = pricePerNight * nights;
  const taxes = Math.round(totalPrice * 0.18);
  const starsCount = parseInt(hotel.stars || hotel.rating || 3);

  return createPortal(
    <div className="position-fixed top-0 start-0 w-100 h-100 z-index-modal overflow-auto" style={{ background: '#f4f5f7', zIndex: 9999 }}>
      
      {/* Top Navbar */}
      <div className="bg-white border-bottom sticky-top shadow-sm px-4 py-3 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3">
          <button onClick={viewMode === 'gallery' ? () => setViewMode('details') : onClose} className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center">
            <ArrowLeft size={20} />
          </button>
          <h4 className="mb-0 fw-bold">{hotel.name}</h4>
        </div>
        <button onClick={onClose} className="btn btn-outline-secondary d-flex align-items-center gap-2 rounded-pill px-3 py-1">
          <X size={18} /> Close
        </button>
      </div>

      <div className="container py-4">
        {viewMode === 'details' && (
          <div className="bg-white rounded-4 shadow-sm p-4">
            
            {/* Header Info */}
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div>
                <h2 className="fw-bold mb-2 d-flex align-items-center gap-2">
                  {hotel.name}
                  <div className="d-flex text-warning">
                    {[...Array(starsCount)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                  </div>
                </h2>
                <div className="text-muted d-flex align-items-center gap-1">
                  <MapPin size={16} /> {hotel.location}, Goa
                </div>
              </div>
            </div>

            {/* Hero Images Grid */}
            <div className="row g-2 mb-4" style={{ height: '400px' }}>
              <div className="col-12 col-md-8 h-100 cursor-pointer" onClick={() => { setViewMode('gallery'); setCurrentIndex(0); }}>
                <img 
                  src={images[0]} 
                  alt={hotel.name} 
                  className="w-100 h-100 object-fit-cover rounded-start-4"
                  style={{ transition: 'transform 0.3s' }}
                />
              </div>
              <div className="col-12 col-md-4 d-none d-md-flex flex-column gap-2 h-100">
                <div className="h-50 w-100 cursor-pointer overflow-hidden rounded-end-top" onClick={() => { setViewMode('gallery'); setCurrentIndex(1); }}>
                  <img src={images[1] || images[0]} alt="Room view" className="w-100 h-100 object-fit-cover" />
                </div>
                <div className="h-50 w-100 cursor-pointer position-relative overflow-hidden rounded-end-bottom" onClick={() => setViewMode('gallery')}>
                  <img src={images[2] || images[0]} alt="Amenities view" className="w-100 h-100 object-fit-cover" />
                  <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-dark bg-opacity-50 text-white" style={{ transition: 'background 0.3s' }}>
                    <span className="fw-bold fs-5">+{images.length} Photos</span>
                    <span className="small">Property & Guest Photos</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Split */}
            <div className="row g-5">
              <div className="col-12 col-lg-8">
                <h4 className="fw-bold mb-3">About Property</h4>
                <p className="text-muted lh-lg mb-4">
                  {hotel.description || `Experience unparalleled comfort at ${hotel.name}, perfectly situated in ${hotel.location}, Goa. Offering world-class amenities and exceptional service to make your stay memorable.`}
                </p>

                <h4 className="fw-bold mb-3">Amenities</h4>
                <div className="d-flex flex-wrap gap-2">
                  {(hotel.amenities ? (Array.isArray(hotel.amenities) ? hotel.amenities : hotel.amenities.split(',')) : ['Pool', 'Free WiFi', 'AC', 'Room Service']).map((amenity, idx) => (
                    <span key={idx} className="badge bg-light text-dark border px-3 py-2 rounded-pill d-flex align-items-center gap-1">
                      <CheckCircle size={14} className="text-success" />
                      {amenity.trim()}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Pricing Sidebar */}
              <div className="col-12 col-lg-4">
                <div className="card border-0 shadow-sm rounded-4 p-4 sticky-top" style={{ top: '100px' }}>
                  <h5 className="fw-bold mb-3">Select Room</h5>
                  <p className="text-muted small mb-3">
                    <CheckCircle size={14} className="text-success me-1" /> Guaranteed Early Check-In<br/>
                    <CheckCircle size={14} className="text-success me-1" /> Free Cancellation
                  </p>
                  
                  <div className="mb-4">
                    <div className="text-muted small">Per Night:</div>
                    <div className="d-flex align-items-baseline gap-2">
                      <h2 className="fw-bold mb-0">₹ {pricePerNight.toLocaleString('en-IN')}</h2>
                      <span className="text-muted small">+ ₹ {Math.round(pricePerNight * 0.18)} taxes</span>
                    </div>
                  </div>

                  <div className="bg-light p-3 rounded-3 mb-4">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Total for {nights} night(s)</span>
                      <strong>₹ {totalPrice.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2 text-muted small">
                      <span>Taxes & Fees</span>
                      <span>₹ {taxes.toLocaleString('en-IN')}</span>
                    </div>
                    <hr/>
                    <div className="d-flex justify-content-between fs-5 fw-bold text-primary">
                      <span>Grand Total</span>
                      <span>₹ {(totalPrice + taxes).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <button className="btn btn-primary w-100 py-3 rounded-pill fw-bold fs-6 d-flex align-items-center justify-content-center gap-2" onClick={onSelect}>
                    Select Room <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {viewMode === 'gallery' && (
          <div className="bg-white rounded-4 shadow-sm p-4">
            
            {/* Gallery Tabs */}
            <ul className="nav nav-pills mb-4 border-bottom pb-3">
              <li className="nav-item">
                <button className="nav-link active rounded-pill px-4">Property Photos</button>
              </li>
              <li className="nav-item">
                <button className="nav-link text-muted px-4">Rooms</button>
              </li>
            </ul>

            <div className="row g-4">
              {images.map((img, idx) => (
                <div key={idx} className="col-12 col-md-6 col-lg-4">
                  <div className="card border-0 rounded-4 overflow-hidden shadow-sm h-100 cursor-pointer hover-scale">
                    <img 
                      src={img} 
                      alt={`Gallery ${idx}`} 
                      className="w-100 h-100 object-fit-cover"
                      style={{ height: '250px' }}
                    />
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
