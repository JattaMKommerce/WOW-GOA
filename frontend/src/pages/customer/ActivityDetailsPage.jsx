import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, MapPin, Clock, ChevronRight, X, 
  Calendar, Compass, Plus, Minus
} from 'lucide-react';
import ImageCarousel from '../../components/common/ImageCarousel';
import { getTodayDateStr } from '../../utils/dateUtils';

/**
 * ActivityDetailsPage
 * Canonical details view for WOW GOA Sightseeing Tours & Activities/Adventures.
 * Displays activity details, real pricing, guest counter, and connects seamlessly
 * to the canonical booking flow.
 */
export default function ActivityDetailsPage({
  activity,
  pickupDate,
  adultsCount = 2,
  onBack,
  onBook,
  isCraftMyTrip = false,
  backLabel,
  actionLabel,
  breadcrumbPrefix,
  isSelected = false,
  memberCount
}) {
  // 1. Interactive Guest State & Date (declared unconditionally for React rules of hooks)
  const [guests, setGuests] = useState(adultsCount > 0 ? adultsCount : 2);
  const [selectedTourDate, setSelectedTourDate] = useState(pickupDate || getTodayDateStr());

  // 2. Normalize all experience images from actual DB columns
  const experienceImages = useMemo(() => {
    if (!activity) return [];
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

    // images_json
    if (activity.images_json) {
      try {
        const parsed = typeof activity.images_json === 'string' ? JSON.parse(activity.images_json) : activity.images_json;
        add(parsed);
      } catch {}
    }

    // Primary images
    add(activity.image_url);
    add(activity.image);

    // mediaList / additional_images
    if (Array.isArray(activity.mediaList)) add(activity.mediaList.map(m => m?.url || m));
    if (Array.isArray(activity.media_list)) add(activity.media_list.map(m => m?.url || m));
    if (Array.isArray(activity.additional_images)) add(activity.additional_images);

    return list;
  }, [activity]);

  if (!activity) return null;

  // 3. Core Metadata & Category Resolution
  const rawType = (activity.type || activity.item_type || '').toLowerCase();
  const isSightseeing = rawType === 'sightseeing' || (activity.category || '').toLowerCase().includes('sight') || (activity.category || '').toLowerCase().includes('heritage');
  const typeLabel = isSightseeing ? 'Sightseeing Tour' : (rawType ? 'Adventure Activity' : 'Not specified');
  const typeIcon = isSightseeing ? '🏛️' : '⚡';

  const title = activity.title || activity.name || 'Not specified';
  const location = activity.location || 'Not specified';
  const duration = activity.duration || 'Not specified';
  const category = activity.category || 'Not specified';

  // 4. Guest Count & Pricing Calculations
  const currentGuests = isCraftMyTrip ? (memberCount || adultsCount || 1) : guests;

  const parsedPrice = parseFloat(activity.price);
  const hasPrice = Number.isFinite(parsedPrice);
  const pricePerPerson = hasPrice ? Math.round(parsedPrice) : 0;
  
  const subtotal = pricePerPerson * currentGuests;
  const gstAmount = Math.round(subtotal * 0.05); // 5% GST on tour experiences (standalone)
  const totalAmount = isCraftMyTrip ? subtotal : (subtotal + gstAmount);

  const isActive = activity.is_active !== 0;

  const handleBookNowClick = () => {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    const bookingPayload = {
      ...activity,
      guests: currentGuests,
      adults: currentGuests,
      totalMembers: currentGuests,
      total_members: currentGuests,
      pickupDate: selectedTourDate,
      pickup_date: selectedTourDate,
      dropDate: selectedTourDate,
      drop_date: selectedTourDate,
      price: pricePerPerson,
      total: totalAmount,
      total_amount: totalAmount,
      bookingDays: 1,
      booking_days: 1
    };
    if (onBook) onBook(bookingPayload);
  };

  return (
    <div className="activity-details-page animate-fade-in-up pb-5" style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      
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
            title={backLabel || "Back to Sightseeing & Activities"}
          >
            <ArrowLeft size={16} />
            {backLabel && <span>{backLabel.replace(/^←\s*/, '')}</span>}
          </button>
          <div>
            <div className="text-muted text-xxs text-uppercase fw-semibold" style={{ letterSpacing: '0.5px' }}>
              {breadcrumbPrefix || 'Sightseeing & Activities'} &gt; {category} &gt; {title}
            </div>
            <h5 className="mb-0 fw-bold text-dark font-heading">{title}</h5>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button 
            type="button"
            onClick={handleBookNowClick}
            className="btn btn-warning text-dark btn-sm rounded-pill px-3.5 py-1.5 fw-bold d-none d-md-flex align-items-center gap-1.5 shadow-sm font-heading hover-scale"
            style={{ background: '#FF6333', borderColor: '#FF6333', color: '#FFFFFF' }}
          >
            <span>{actionLabel || 'Book Experience'}</span>
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
            <X size={15} /> {backLabel ? 'Back' : 'Close'}
          </button>
        </div>
      </div>

      <div className="container py-4" style={{ maxWidth: '1200px' }}>

        {/* ─── 2. EXPERIENCE HEADER & HIGHLIGHTS ─── */}
        <div className="bg-white rounded-4 shadow-sm p-4 mb-4 border" style={{ borderColor: '#E2E8F0' }}>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1.5 flex-wrap">
                <span className="badge rounded-pill px-3 py-1 text-xs fw-bold" style={{ background: '#0B192C', color: '#FFFFFF' }}>
                  {typeIcon} {typeLabel}
                </span>
                <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-2.5 py-1 text-xxs fw-bold">
                  {category}
                </span>
                {!isActive && (
                  <span className="badge bg-secondary text-white rounded-pill px-2.5 py-1 text-xxs fw-bold">
                    On Request
                  </span>
                )}
                {isSelected && (
                  <span className="badge bg-success text-white rounded-pill px-2.5 py-1 text-xxs fw-bold d-inline-flex align-items-center gap-1">
                    ✓ Added to Trip
                  </span>
                )}
              </div>

              <h1 className="fw-black text-dark mb-1 fs-2 font-heading tracking-tight">{title}</h1>
              
              <div className="d-flex align-items-center gap-3 text-muted text-sm flex-wrap mt-2">
                <div className="d-flex align-items-center gap-1">
                  <MapPin size={15} className="text-warning" />
                  <span className="text-dark fw-medium">{location}</span>
                </div>
                <span>•</span>
                <div className="d-flex align-items-center gap-1">
                  <Clock size={15} className="text-primary" />
                  <span className="text-dark fw-medium">{duration}</span>
                </div>
              </div>
            </div>

            {/* Quick Price Badge */}
            <div className="d-flex flex-column align-items-start align-items-md-end bg-light p-3 rounded-3 border flex-shrink-0" style={{ minWidth: '220px' }}>
              <span className="text-muted text-xxs text-uppercase fw-bold">Starting From</span>
              <div className="d-flex align-items-baseline gap-1">
                <h3 className="fw-black text-primary mb-0 font-heading" style={{ fontSize: '26px' }}>{hasPrice ? `₹${pricePerPerson.toLocaleString('en-IN')}` : 'Not specified'}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 3. INTERACTIVE IMAGE GALLERY ─── */}
        <div className="mb-4">
          {experienceImages.length > 0 ? (
            <ImageCarousel 
              images={experienceImages} 
              alt={title} 
              height="420px" 
              rounded="20px"
            />
          ) : (
            <div className="d-flex align-items-center justify-content-center bg-light border rounded-4 text-muted" style={{ height: '420px' }}>
              Image not available
            </div>
          )}
        </div>

        {/* ─── 4. MAIN DETAILS & BOOKING SIDEBAR GRID ─── */}
        <div className="row g-4 text-start">
          
          {/* Left Column: Comprehensive Experience Information */}
          <div className="col-12 col-lg-8">
            
            {/* CARD 1: Key Specifications & Highlights Grid */}
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
              <h5 className="fw-bold text-dark mb-3 font-heading border-bottom pb-2">
                Experience Highlights &amp; Specifications
              </h5>

              <div className="row g-3">
                <div className="col-6 col-md-4">
                  <div className="p-3 bg-light rounded-3 border h-100">
                    <div className="text-muted text-xxs text-uppercase fw-bold d-flex align-items-center gap-1.5 mb-1">
                      <Clock size={13} className="text-primary" /> Duration
                    </div>
                    <div className="fw-bold text-dark text-sm">{duration}</div>
                  </div>
                </div>

                <div className="col-6 col-md-4">
                  <div className="p-3 bg-light rounded-3 border h-100">
                    <div className="text-muted text-xxs text-uppercase fw-bold d-flex align-items-center gap-1.5 mb-1">
                      <MapPin size={13} className="text-warning" /> Location
                    </div>
                    <div className="fw-bold text-dark text-sm text-truncate">{location}</div>
                  </div>
                </div>

                <div className="col-6 col-md-4">
                  <div className="p-3 bg-light rounded-3 border h-100">
                    <div className="text-muted text-xxs text-uppercase fw-bold d-flex align-items-center gap-1.5 mb-1">
                      <Compass size={13} className="text-info" /> Category
                    </div>
                    <div className="fw-bold text-dark text-sm text-truncate">{category}</div>
                  </div>
                </div>

              </div>
            </div>

            {/* CARD 2: Overview Narrative & Experience Description */}
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
              <h5 className="fw-bold text-dark mb-3 font-heading border-bottom pb-2">
                Overview &amp; Experience Details
              </h5>
              <div className="text-secondary lh-lg fs-6 mb-3">
                {activity.description ? (
                  activity.description.split('\n\n').map((para, idx) => (
                    <p key={idx} className="mb-2.5">{para}</p>
                  ))
                ) : (
                  <p>Not specified</p>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Booking & Fare Summary Sidebar */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white sticky-top" style={{ top: '90px' }}>
              
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="badge bg-warning bg-opacity-15 text-dark fw-bold px-2.5 py-1 rounded-pill text-xxs">
                  {typeIcon} {typeLabel}
                </span>
              </div>

              {/* Price Banner */}
              <div className="text-center py-3.5 mb-3 bg-light rounded-4 border">
                <span className="text-muted text-xxs text-uppercase fw-bold d-block mb-1">Activity Price</span>
                <div className="d-flex align-items-baseline justify-content-center gap-1.5">
                  <h2 className="fw-black text-primary mb-0 font-heading" style={{ fontSize: '32px' }}>{hasPrice ? `₹${pricePerPerson.toLocaleString('en-IN')}` : 'Not specified'}</h2>
                </div>
              </div>

              {/* Guest & Date Selector */}
              <div className="p-3 bg-light rounded-3 mb-3 border text-xs">
                
                {/* Guest Counter */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <span className="fw-bold text-dark d-block">Number of Guests</span>
                    {isCraftMyTrip && (
                      <span className="text-muted" style={{ fontSize: '10px' }}>From Craft My Trip party</span>
                    )}
                  </div>
                  {isCraftMyTrip ? (
                    <span className="badge bg-white text-dark border px-3 py-1.5 rounded-pill fw-bold text-xs shadow-xs">
                      {currentGuests} {currentGuests === 1 ? 'Guest' : 'Guests'}
                    </span>
                  ) : (
                    <div className="d-flex align-items-center gap-2 bg-white rounded-pill border px-2 py-1">
                      <button 
                        type="button" 
                        className="btn btn-sm btn-link p-0 text-dark"
                        onClick={() => setGuests(prev => Math.max(1, prev - 1))}
                        disabled={guests <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="fw-bold text-dark px-1.5">{guests}</span>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-link p-0 text-dark"
                        onClick={() => setGuests(prev => Math.min(20, prev + 1))}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Date Selection */}
                <div className="mb-2">
                  <label className="fw-bold text-dark d-block mb-1">Tour Date</label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white"><Calendar size={13} className="text-primary" /></span>
                    <input 
                      type="date" 
                      className="form-control"
                      min={getTodayDateStr()}
                      value={selectedTourDate}
                      onChange={(e) => setSelectedTourDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-between pt-2 border-top">
                  <span className="text-muted">Sector:</span>
                  <strong className="text-dark">{location}</strong>
                </div>
              </div>

              {/* Fare Breakdown */}
              <div className="d-flex flex-column gap-2 mb-4 text-xs">
                <div className="d-flex justify-content-between text-muted">
                  <span>Price per person</span>
                  <span className="fw-semibold text-dark">{hasPrice ? `₹${pricePerPerson.toLocaleString('en-IN')}` : 'Not specified'}</span>
                </div>
                {isCraftMyTrip ? (
                  <>
                    <div className="d-flex justify-content-between text-muted">
                      <span>Total ({currentGuests} guest{currentGuests > 1 ? 's' : ''})</span>
                      <span className="fw-semibold text-dark">{hasPrice ? `₹${(pricePerPerson * currentGuests).toLocaleString('en-IN')}` : 'Not specified'}</span>
                    </div>
                    <div className="text-muted text-xxs">+ Taxes calculated at checkout</div>
                    <hr className="my-1 border-secondary border-opacity-25" />
                    <div className="d-flex justify-content-between align-items-baseline">
                      <span className="fw-bold text-dark fs-6">Experience Total</span>
                      <span className="fw-black text-primary fs-4">{hasPrice ? `₹${(pricePerPerson * currentGuests).toLocaleString('en-IN')}` : 'Not specified'}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="d-flex justify-content-between text-muted">
                      <span>Base Fare ({guests} guest{guests > 1 ? 's' : ''})</span>
                      <span className="fw-semibold text-dark">{hasPrice ? `₹${subtotal.toLocaleString('en-IN')}` : 'Not specified'}</span>
                    </div>
                    <div className="d-flex justify-content-between text-muted">
                      <span>GST (5%)</span>
                      <span className="fw-semibold text-dark">{hasPrice ? `₹${gstAmount.toLocaleString('en-IN')}` : 'Not specified'}</span>
                    </div>
                    <hr className="my-1 border-secondary border-opacity-25" />
                    <div className="d-flex justify-content-between align-items-baseline">
                      <span className="fw-bold text-dark fs-6">Total Payable</span>
                      <span className="fw-black text-primary fs-4">{hasPrice ? `₹${totalAmount.toLocaleString('en-IN')}` : 'Not specified'}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Primary Action Button */}
              <button
                type="button"
                onClick={handleBookNowClick}
                className="btn btn-primary btn-lg w-100 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 hover-scale font-heading"
                style={{ background: '#FF6333', borderColor: '#FF6333', padding: '12px 20px', fontSize: '15px' }}
              >
                <span>{actionLabel || 'Book Experience'}</span>
                <ChevronRight size={18} />
              </button>

              <div className="text-center mt-3 text-muted text-xxs">
                Secure booking
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
          <span className="text-muted text-xxs d-block">
            {isCraftMyTrip ? `Total (${currentGuests} ${currentGuests === 1 ? 'guest' : 'guests'})` : 'Total Payable'}
          </span>
          <div className="fw-black font-heading fs-5 mb-0" style={{ color: '#FF6333' }}>
            ₹{totalAmount.toLocaleString('en-IN')}
          </div>
        </div>
        <button
          type="button"
          onClick={handleBookNowClick}
          className="btn btn-primary rounded-pill px-4 py-2 fw-bold d-flex align-items-center gap-1.5 shadow-sm font-heading hover-scale"
          style={{ background: '#FF6333', borderColor: '#FF6333', color: '#FFFFFF' }}
        >
          <span>{actionLabel || 'Book Experience'}</span>
          <ChevronRight size={16} />
        </button>
      </div>

    </div>
  );
}
