import React, { useMemo, useState } from 'react';
import { 
  ArrowLeft, Star, MapPin, Users, Fuel, Settings, ShieldCheck, 
  CheckCircle, ChevronRight, Wind, AlertCircle, PhoneCall, FileText, 
  Clock, Award, Car as CarIcon, Sparkles, X
} from 'lucide-react';
import ImageCarousel from '../../components/common/ImageCarousel';

/**
 * CarDetailsPage
 * Dedicated information and review page for Self-Drive Rental Cars.
 * Displays comprehensive vehicle specifications, live availability,
 * driver options, rental terms, and connects seamlessly to the existing booking flow.
 */
export default function CarDetailsPage({
  car,
  pickupDate,
  dropDate,
  bookingDays = 2,
  onBack,
  onBook,
  backLabel,
  actionLabel,
  breadcrumbPrefix,
  memberCount,
  onMemberCountChange,
  isCraftMyTrip = false
}) {
  const [capacityError, setCapacityError] = useState(null);

  // 1. Calculate rental days and pricing
  const pricePerDay = Math.round(parseFloat(car?.price || 1500));
  const originalPricePerDay = Math.round(pricePerDay * 1.25); // 25% strikethrough

  const calculatedDays = useMemo(() => {
    if (pickupDate && dropDate) {
      const diff = Math.round((new Date(dropDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24));
      if (diff > 0) return diff;
    }
    return bookingDays || 2;
  }, [pickupDate, dropDate, bookingDays]);

  const baseRentalTotal = pricePerDay * calculatedDays;
  const gstAmount = Math.round(baseRentalTotal * 0.18);
  const estimatedTotal = baseRentalTotal + gstAmount;

  // 2. Normalize all car images from actual DB columns
  const carImages = useMemo(() => {
    if (!car) return [];
    const list = [];
    const add = (img) => {
      if (!img) return;
      if (typeof img === 'string') {
        const trimmed = img.trim();
        if (trimmed && !list.includes(trimmed)) list.push(trimmed);
      } else if (Array.isArray(img)) {
        img.forEach(add);
      }
    };

    // Primary image
    add(car.image);
    add(car.image_url);

    // images_json
    if (car.images_json) {
      try {
        const parsed = typeof car.images_json === 'string' ? JSON.parse(car.images_json) : car.images_json;
        add(parsed);
      } catch (e) {}
    }

    // mediaList / additional_images
    if (Array.isArray(car.mediaList)) add(car.mediaList.map(m => m?.url || m));
    if (Array.isArray(car.media_list)) add(car.media_list.map(m => m?.url || m));
    if (Array.isArray(car.additional_images)) add(car.additional_images);

    if (list.length === 0) {
      list.push(
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80'
      );
    }
    return list;
  }, [car]);

  if (!car) return null;

  const isAvailable = car.is_available === 1 || car.is_available === true || car.is_available === '1' || car.is_available === undefined;
  const ratingVal = parseFloat(car.rating || 4.8);
  const seatingCapacity = parseInt(car?.seating, 10) || 4;

  const handleBookNowClick = () => {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    if (isCraftMyTrip && memberCount && memberCount > seatingCapacity) {
      setCapacityError(`This vehicle accommodates up to ${seatingCapacity} passengers. Please choose another vehicle or reduce the number of members.`);
      return;
    }
    setCapacityError(null);
    if (onBook) onBook(car);
  };

  return (
    <div className="car-details-page animate-fade-in-up pb-5" style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      
      {/* ─── 1. TOP STICKY NAVBAR ─── */}
      <div 
        className="bg-white border-bottom sticky-top shadow-sm px-4 py-3 d-flex align-items-center justify-content-between"
        style={{ zIndex: 1020 }}
      >
        <div className="d-flex align-items-center gap-3">
          <button 
            type="button"
            onClick={() => {
              if (document.activeElement?.blur) document.activeElement.blur();
              onBack();
            }}
            className={`btn btn-light border hover-scale d-flex align-items-center gap-1.5 ${
              backLabel ? 'rounded-pill px-3 py-1.5 fw-bold text-xs' : 'rounded-circle p-2 justify-content-center'
            }`}
            title={backLabel || "Back to Car Listings"}
          >
            <ArrowLeft size={16} />
            {backLabel && <span>{backLabel.replace(/^←\s*/, '')}</span>}
          </button>
          <div>
            <div className="text-muted text-xxs text-uppercase fw-semibold" style={{ letterSpacing: '0.5px' }}>
              {breadcrumbPrefix || 'Self-Drive Rental Cars'} &gt; {car.category || 'Goa'} &gt; {car.name}
            </div>
            <h5 className="mb-0 fw-bold text-dark font-heading">{car.name}</h5>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button 
            type="button"
            onClick={handleBookNowClick}
            className="btn btn-warning text-dark btn-sm rounded-pill px-3.5 py-1.5 fw-bold d-none d-md-flex align-items-center gap-1.5 shadow-sm font-heading hover-scale"
            style={{ background: '#FF6333', borderColor: '#FF6333', color: '#FFFFFF' }}
          >
            <span>{actionLabel || 'Book Now'}</span>
            <ChevronRight size={15} />
          </button>
          <button 
            type="button"
            onClick={() => {
              if (document.activeElement?.blur) document.activeElement.blur();
              onBack();
            }}
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 rounded-pill px-3 py-1"
          >
            <X size={15} /> Close
          </button>
        </div>
      </div>

      <div className="container py-4" style={{ maxWidth: '1200px' }}>

        {/* ─── 2. CAR HEADER & HIGHLIGHTS ─── */}
        <div className="bg-white rounded-4 shadow-sm p-4 mb-4 border" style={{ borderColor: '#E2E8F0' }}>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1.5 flex-wrap">
                <span className="badge rounded-pill px-3 py-1 text-xs fw-bold" style={{ background: '#0B192C', color: '#FFFFFF' }}>
                  🚗 {car.category || 'Self-Drive Car'}
                </span>
                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2.5 py-1 text-xxs fw-bold">
                  ✓ WOW GOA Certified Fleet
                </span>
                {car.badge && (
                  <span
                    className="badge rounded-pill px-2.5 py-1 text-xxs fw-bold"
                    style={{
                      background: 'rgba(245, 158, 11, 0.12)',
                      color: '#B45309',
                      border: '1px solid rgba(245, 158, 11, 0.3)'
                    }}
                  >
                    ★ {car.badge}
                  </span>
                )}
                {isAvailable ? (
                  <span className="badge bg-success text-white rounded-pill px-2.5 py-1 text-xxs fw-bold">
                    ● Instant Confirmation
                  </span>
                ) : (
                  <span className="badge bg-secondary text-white rounded-pill px-2.5 py-1 text-xxs fw-bold">
                    On Request
                  </span>
                )}
              </div>

              <h1 className="fw-black text-dark mb-1 fs-2 font-heading tracking-tight">{car.name}</h1>
              
              <div className="d-flex align-items-center gap-3 text-muted text-sm flex-wrap mt-2">
                <div className="d-flex align-items-center gap-1">
                  <Star size={16} fill="#F59E0B" color="#F59E0B" />
                  <span className="fw-bold text-dark">{ratingVal.toFixed(1)}</span>
                  <span className="text-muted text-xs">(Verified Rental Host)</span>
                </div>
                <span>•</span>
                <div className="d-flex align-items-center gap-1">
                  <MapPin size={15} className="text-warning" />
                  <span>{car.location || 'All Goa Delivery (Airport, Railway Station & Hotels)'}</span>
                </div>
              </div>
            </div>

            {/* Quick Price Badge */}
            <div className="d-flex flex-column align-items-start align-items-md-end bg-light p-3 rounded-3 border flex-shrink-0" style={{ minWidth: '220px' }}>
              <span className="text-muted text-xxs text-uppercase fw-bold">Daily Rental Rate</span>
              <div className="d-flex align-items-baseline gap-1">
                <span className="text-decoration-line-through text-muted text-xs">₹{originalPricePerDay.toLocaleString('en-IN')}</span>
                <h3 className="fw-black text-primary mb-0 font-heading" style={{ fontSize: '26px' }}>₹{pricePerDay.toLocaleString('en-IN')}</h3>
                <span className="text-muted text-xs">/ day</span>
              </div>
              <span className="text-success text-xxs fw-bold mt-0.5">Includes Unlimited Kilometres</span>
            </div>
          </div>
        </div>

        {/* ─── 3. INTERACTIVE CAR IMAGE GALLERY ─── */}
        <div className="bg-white rounded-4 shadow-sm p-3 mb-4 border" style={{ borderColor: '#E2E8F0' }}>
          <ImageCarousel
            images={carImages}
            alt={car.name}
            height="440px"
            rounded="16px"
          />
          <div className="d-flex justify-content-between align-items-center mt-2 px-1 text-muted text-xs">
            <span>📸 Showing all real vehicle exterior &amp; interior photos ({carImages.length} total)</span>
            <span className="text-muted">Click photo to zoom fullscreen</span>
          </div>
        </div>

        {/* ─── 4. MAIN CONTENT ROW (SPECS, OPTIONS & SIDEBAR) ─── */}
        <div className="row g-4">
          
          {/* Left Column: Specifications, Driver Options & Rental Policies */}
          <div className="col-12 col-lg-8">

            {/* Vehicle Specifications Grid */}
            <div className="bg-white rounded-4 shadow-sm p-4 mb-4 border" style={{ borderColor: '#E2E8F0' }}>
              <h5 className="fw-bold text-dark font-heading mb-3 d-flex align-items-center gap-2">
                <CarIcon size={20} className="text-warning" />
                Vehicle Specifications
              </h5>

              <div className="row g-3">
                <div className="col-6 col-sm-4">
                  <div className="border rounded-3 p-3 text-center bg-light h-100 d-flex flex-column justify-content-center">
                    <Users className="text-primary mb-1.5 mx-auto" size={24} />
                    <span className="text-muted text-xxs text-uppercase fw-bold">Seating Capacity</span>
                    <span className="fw-bold text-dark fs-6 mt-1">{car.seating || '5 Seater'}</span>
                  </div>
                </div>

                <div className="col-6 col-sm-4">
                  <div className="border rounded-3 p-3 text-center bg-light h-100 d-flex flex-column justify-content-center">
                    <Settings className="text-primary mb-1.5 mx-auto" size={24} />
                    <span className="text-muted text-xxs text-uppercase fw-bold">Transmission</span>
                    <span className="fw-bold text-dark fs-6 mt-1">{car.transmission || 'Manual'}</span>
                  </div>
                </div>

                <div className="col-6 col-sm-4">
                  <div className="border rounded-3 p-3 text-center bg-light h-100 d-flex flex-column justify-content-center">
                    <Fuel className="text-primary mb-1.5 mx-auto" size={24} />
                    <span className="text-muted text-xxs text-uppercase fw-bold">Fuel Type</span>
                    <span className="fw-bold text-dark fs-6 mt-1">{car.fuel || 'Petrol'}</span>
                  </div>
                </div>

                <div className="col-6 col-sm-4">
                  <div className="border rounded-3 p-3 text-center bg-light h-100 d-flex flex-column justify-content-center">
                    <Wind className="text-primary mb-1.5 mx-auto" size={24} />
                    <span className="text-muted text-xxs text-uppercase fw-bold">Air Conditioning</span>
                    <span className="fw-bold text-dark fs-6 mt-1">Air Conditioned</span>
                  </div>
                </div>

                <div className="col-6 col-sm-4">
                  <div className="border rounded-3 p-3 text-center bg-light h-100 d-flex flex-column justify-content-center">
                    <Sparkles className="text-primary mb-1.5 mx-auto" size={24} />
                    <span className="text-muted text-xxs text-uppercase fw-bold">Fuel Economy / Mileage</span>
                    <span className="fw-bold text-dark fs-6 mt-1">{car.mileage || 'Standard Fuel Economy'}</span>
                  </div>
                </div>

                <div className="col-6 col-sm-4">
                  <div className="border rounded-3 p-3 text-center bg-light h-100 d-flex flex-column justify-content-center">
                    <ShieldCheck className="text-primary mb-1.5 mx-auto" size={24} />
                    <span className="text-muted text-xxs text-uppercase fw-bold">Insurance Status</span>
                    <span className="fw-bold text-dark fs-6 mt-1">Comprehensive Included</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Driver Options & Information */}
            <div className="bg-white rounded-4 shadow-sm p-4 mb-4 border" style={{ borderColor: '#E2E8F0' }}>
              <h5 className="fw-bold text-dark font-heading mb-3 d-flex align-items-center gap-2">
                <Users size={20} className="text-warning" />
                Driver Options &amp; Rental Mode
              </h5>

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <div className="border rounded-3 p-3 bg-light h-100">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="badge bg-primary text-white rounded-pill px-2 py-1 text-xxs fw-bold">Primary</span>
                      <h6 className="fw-bold mb-0 text-dark">Customer Self-Drive</h6>
                    </div>
                    <p className="text-muted text-xs mb-2">
                      You drive the vehicle independently across Goa. Enjoy complete privacy and freedom with unlimited kilometres.
                    </p>
                    <div className="d-flex align-items-center gap-1 text-success text-xs fw-semibold">
                      <CheckCircle size={14} /> Valid Driving License required at pickup
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="border rounded-3 p-3 bg-light h-100">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="badge bg-secondary text-white rounded-pill px-2 py-1 text-xxs fw-bold">Optional</span>
                      <h6 className="fw-bold mb-0 text-dark">With Driver / Chauffeur</h6>
                    </div>
                    <p className="text-muted text-xs mb-2">
                      Want to relax? A verified, professional local Goan chauffeur can be arranged upon request at standard daily allowance.
                    </p>
                    <div className="d-flex align-items-center gap-1 text-muted text-xs">
                      <PhoneCall size={14} className="text-primary" /> Request directly during checkout or upon delivery
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Inclusions & Features */}
            <div className="bg-white rounded-4 shadow-sm p-4 mb-4 border" style={{ borderColor: '#E2E8F0' }}>
              <h5 className="fw-bold text-dark font-heading mb-3 d-flex align-items-center gap-2">
                <Award size={20} className="text-warning" />
                Included Features &amp; Amenities
              </h5>

              <div className="row g-2.5">
                {[
                  'Powerful Climate Control Air Conditioning',
                  'Bluetooth & USB Music Entertainment System',
                  'Dual Front Airbags & ABS Safety Braking',
                  'Power Steering with Smooth Handling',
                  'Power Windows & Central Remote Locking',
                  'Clean, Deep-Sanitized Interior Before Every Rental',
                  'Spare Tyre, Jack & Emergency Tool Kit Included',
                  '24/7 Breakdown & Roadside Assistance Across Goa'
                ].map((feat, fIdx) => (
                  <div key={fIdx} className="col-12 col-sm-6">
                    <div className="d-flex align-items-center gap-2 p-2 rounded-2 bg-light text-xs">
                      <CheckCircle size={15} className="text-success flex-shrink-0" />
                      <span className="text-dark fw-medium">{feat}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Standard Rental Policies & Guidelines */}
            <div className="bg-white rounded-4 shadow-sm p-4 mb-4 border" style={{ borderColor: '#E2E8F0' }}>
              <h5 className="fw-bold text-dark font-heading mb-3 d-flex align-items-center gap-2">
                <FileText size={20} className="text-warning" />
                Standard Rental Terms &amp; Conditions
              </h5>

              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-start gap-2.5">
                  <CheckCircle size={18} className="text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-dark text-xs d-block">Original Documents Required</strong>
                    <span className="text-muted text-xs">
                      The primary driver must present a valid physical Driving License (minimum 1 year old) along with an original government photo ID (Aadhaar or Passport) during vehicle pickup.
                    </span>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-2.5">
                  <CheckCircle size={18} className="text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-dark text-xs d-block">Refundable Security Deposit</strong>
                    <span className="text-muted text-xs">
                      A standard refundable security deposit is collected at delivery and refunded immediately upon vehicle return in good condition.
                    </span>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-2.5">
                  <CheckCircle size={18} className="text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-dark text-xs d-block">Fuel Policy (Same-to-Same)</strong>
                    <span className="text-muted text-xs">
                      The car is handed over with an indicated fuel level. Please return the car with the exact same fuel level. Fuel costs are borne by the renter.
                    </span>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-2.5">
                  <AlertCircle size={18} className="text-danger flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-dark text-xs d-block">Goa Traffic &amp; Beach Guidelines</strong>
                    <span className="text-muted text-xs">
                      Driving any vehicle on Goa beaches is strictly illegal by law and incurs heavy police penalties. Please respect local speed limits (typically 60–70 km/h on highways).
                    </span>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-2.5">
                  <Clock size={18} className="text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-dark text-xs d-block">24-Hour Rental Day Calculation</strong>
                    <span className="text-muted text-xs">
                      1 rental day equals 24 continuous hours from your scheduled pickup time. Early delivery and airport handover can be easily coordinated.
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Booking & Fare Breakdown Sidebar */}
          <div className="col-12 col-lg-4">
            <div className="card border shadow-sm rounded-4 p-4 sticky-top bg-white" style={{ top: '90px', borderColor: '#E2E8F0' }}>
              
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="badge bg-warning bg-opacity-15 text-dark fw-bold px-2.5 py-1 text-xxs rounded-pill">
                  ⚡ Best Price Guaranteed
                </span>
                <span className="text-success text-xxs fw-bold">✓ Free Cancellation Available</span>
              </div>

              <div className="text-center py-3.5 mb-3 bg-light rounded-4 border">
                <span className="text-muted text-xxs text-uppercase fw-bold d-block mb-1">Rental Fare</span>
                <div className="d-flex align-items-baseline justify-content-center gap-1.5">
                  <span className="text-decoration-line-through text-muted small">₹{originalPricePerDay.toLocaleString('en-IN')}</span>
                  <h2 className="fw-black text-primary mb-0 font-heading" style={{ fontSize: '32px' }}>₹{pricePerDay.toLocaleString('en-IN')}</h2>
                  <span className="text-muted text-xs">/ day</span>
                </div>
                <span className="badge bg-success bg-opacity-10 text-success text-xxs mt-1">20% Off Direct Booking Deal</span>
              </div>

              {/* Rental Dates Summary */}
              <div className="p-3 bg-light rounded-3 mb-3 border text-xs">
                <div className="d-flex justify-content-between mb-1.5">
                  <span className="text-muted">Pickup Date:</span>
                  <strong className="text-dark">{pickupDate || 'Today'}</strong>
                </div>
                <div className="d-flex justify-content-between mb-1.5">
                  <span className="text-muted">Drop Date:</span>
                  <strong className="text-dark">{dropDate || 'In 2 Days'}</strong>
                </div>
                <div className="d-flex justify-content-between pt-1 border-top">
                  <span className="text-muted">Duration:</span>
                  <strong className="text-primary">{calculatedDays} {calculatedDays === 1 ? 'Day' : 'Days'}</strong>
                </div>
              </div>

              {/* Fare Breakdown */}
              <div className="d-flex flex-column gap-2 mb-4 text-xs">
                <div className="d-flex justify-content-between text-muted">
                  <span>Base Rental ({calculatedDays} {calculatedDays === 1 ? 'Day' : 'Days'} × ₹{pricePerDay.toLocaleString('en-IN')})</span>
                  <span className="fw-semibold text-dark">₹{baseRentalTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="d-flex justify-content-between text-muted">
                  <span>Taxes &amp; GST (18%)</span>
                  <span className="fw-semibold text-dark">₹{gstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="d-flex justify-content-between text-muted">
                  <span>Unlimited Kilometres</span>
                  <span className="text-success fw-semibold">FREE</span>
                </div>
                <div className="d-flex justify-content-between text-muted">
                  <span>Doorstep Airport / Hotel Delivery</span>
                  <span className="text-success fw-semibold">FREE</span>
                </div>
                
                <hr className="my-1 border-secondary border-opacity-25" />
                
                <div className="d-flex justify-content-between align-items-baseline">
                  <div>
                    <span className="fw-bold text-dark fs-6 d-block">Estimated Total</span>
                    <span className="text-muted text-xxs">All taxes &amp; fees included</span>
                  </div>
                  <span className="fw-black text-primary fs-4">₹{estimatedTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Capacity Validation Notice */}
              {isCraftMyTrip && (memberCount > seatingCapacity || capacityError) && (
                <div className="alert alert-warning border border-warning rounded-3 p-3 mb-3 text-xs" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
                  <div className="d-flex align-items-start gap-2">
                    <AlertCircle size={17} className="text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="fw-bold text-dark mb-1">Capacity Notice</div>
                      <div className="text-secondary mb-2">
                        {capacityError || `This vehicle accommodates up to ${seatingCapacity} passengers. Please choose another vehicle or reduce the number of members.`}
                      </div>
                      <div className="d-flex gap-2 flex-wrap">
                        {onMemberCountChange && (
                          <button
                            type="button"
                            className="btn btn-sm btn-warning text-dark fw-bold rounded-pill px-2.5 py-1 text-xxs"
                            onClick={() => {
                              onMemberCountChange(seatingCapacity);
                              setCapacityError(null);
                            }}
                          >
                            Update to {seatingCapacity} members
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-1 text-xxs"
                          onClick={() => {
                            if (document.activeElement?.blur) document.activeElement.blur();
                            onBack();
                          }}
                        >
                          Choose Another Vehicle
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Primary CTA: Book Now / Select & Continue */}
              <button
                type="button"
                onClick={handleBookNowClick}
                className="btn btn-primary btn-lg w-100 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 hover-scale font-heading"
                style={{ background: '#FF6333', borderColor: '#FF6333', padding: '12px 20px', fontSize: '15px' }}
              >
                <span>{actionLabel || 'Continue to Booking'}</span>
                <ChevronRight size={18} />
              </button>

              <div className="text-center mt-3 text-muted text-xxs">
                🔒 Safe &amp; Secure Booking • Fast Confirmation via WhatsApp/SMS
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* ─── 5. MOBILE STICKY BOTTOM BAR ─── */}
      <div 
        className="d-lg-none fixed-bottom bg-white border-top px-4 py-3 shadow-lg d-flex justify-content-between align-items-center"
        style={{ zIndex: 1010 }}
      >
        <div>
          <span className="text-muted text-xxs d-block">Total ({calculatedDays} {calculatedDays === 1 ? 'day' : 'days'})</span>
          <div className="fw-black text-primary font-heading fs-5 mb-0">
            ₹{estimatedTotal.toLocaleString('en-IN')}
          </div>
        </div>
        <button
          type="button"
          onClick={handleBookNowClick}
          className="btn btn-primary rounded-pill px-4 py-2 fw-bold d-flex align-items-center gap-1.5 shadow-sm font-heading hover-scale"
          style={{ background: '#FF6333', borderColor: '#FF6333', color: '#FFFFFF' }}
        >
          <span>{actionLabel || 'Continue to Booking'}</span>
          <ChevronRight size={16} />
        </button>
      </div>

    </div>
  );
}
