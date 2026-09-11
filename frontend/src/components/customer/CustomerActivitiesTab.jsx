import React, { useState, useEffect } from 'react';
import {
  Compass, MapPin, Clock, Users, Calendar, CheckCircle2,
  Search, Sparkles, Filter, ChevronRight, AlertCircle, Eye,
  ArrowRight, ShieldCheck, Tag, X, Check
} from 'lucide-react';
import * as api from '../../services/api';
import { getTodayDateStr, getNextDayDateStr } from '../../utils/dateUtils';

export default function CustomerActivitiesTab({
  currentUser,
  activities = [],
  bookings = [],
  onOpenBookingDetails,
  onNavigateTab,
  appliedFilters = {},
  setAppliedFilters,
  searchQuery: parentSearchQuery = '',
  setSearchQuery: setParentSearchQuery
}) {
  const [items, setItems] = useState(activities || []);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'sightseeing' | 'activity'
  const [searchQuery, setSearchQuery] = useState(parentSearchQuery || '');
  const [bookingModalItem, setBookingModalItem] = useState(null);

  // Sync parent search query when changed
  useEffect(() => {
    if (parentSearchQuery !== undefined && parentSearchQuery !== searchQuery) {
      setSearchQuery(parentSearchQuery);
    }
  }, [parentSearchQuery]);
  
  // Booking Form State
  const [travelDate, setTravelDate] = useState(getTodayDateStr());
  const [guests, setGuests] = useState(2);
  const [contactName, setContactName] = useState(currentUser?.name || '');
  const [contactPhone, setContactPhone] = useState(currentUser?.phone || '');
  const [contactEmail, setContactEmail] = useState(currentUser?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [formError, setFormError] = useState('');

  // Load fresh activities if empty
  useEffect(() => {
    if (!activities || activities.length === 0) {
      setLoading(true);
      api.fetchActivities()
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setItems(data);
          }
        })
        .catch(err => console.warn('Failed to load activities:', err))
        .finally(() => setLoading(false));
    } else {
      setItems(activities);
    }
  }, [activities]);

  // Keep contact info synced with currentUser
  useEffect(() => {
    if (currentUser) {
      if (!contactName && currentUser.name) setContactName(currentUser.name);
      if (!contactPhone && currentUser.phone) setContactPhone(currentUser.phone);
      if (!contactEmail && currentUser.email) setContactEmail(currentUser.email);
    }
  }, [currentUser]);

  // Filter activities — check both type and item_type fields, case-insensitively
  const filteredItems = items.filter(item => {
    // Resolve type from either `type` or `item_type` field, lowercase for comparison
    const rawType = (item.type || item.item_type || '').toLowerCase();
    const rawCat = (item.category || '').toLowerCase();
    const price = parseFloat(item.price || 0);
    const duration = (item.duration || '').toLowerCase();

    // 1. Quick pill filter (all / sightseeing / activity)
    if (typeFilter === 'sightseeing') {
      const isSight = rawType === 'sightseeing' ||
        rawCat.includes('sight') || rawCat.includes('heritage') ||
        rawCat.includes('tour') || rawCat.includes('monument');
      if (!isSight) return false;
    } else if (typeFilter === 'activity') {
      const isSight = rawType === 'sightseeing' ||
        rawCat.includes('sight') || rawCat.includes('heritage') ||
        rawCat.includes('tour') || rawCat.includes('monument');
      const isAct = rawType === 'activity' || rawType === 'addon' ||
        rawCat.includes('water') || rawCat.includes('adventure') ||
        rawCat.includes('sport') || rawCat.includes('cruise') ||
        rawCat.includes('experience') || (!isSight && rawType !== '');
      if (!isAct) return false;
    }

    // 2. Applied Categories / Types from popover
    const appTypes = appliedFilters?.activityTypes || [];
    if (appTypes.length > 0) {
      const typeMatch = appTypes.some(at => {
        const catLower = at.toLowerCase();
        if (catLower.includes('sightseeing')) {
          return rawType === 'sightseeing' || rawCat.includes('sight') || rawCat.includes('tour');
        }
        if (catLower.includes('water') || catLower.includes('adventure')) {
          return rawCat.includes('water') || rawCat.includes('adventure') || rawCat.includes('sport') || rawType === 'activity';
        }
        if (catLower.includes('cruise') || catLower.includes('boat')) {
          return rawCat.includes('cruise') || rawCat.includes('boat') || (item.title || '').toLowerCase().includes('cruise');
        }
        if (catLower.includes('heritage') || catLower.includes('culture')) {
          return rawCat.includes('heritage') || rawCat.includes('culture') || (item.title || '').toLowerCase().includes('heritage');
        }
        if (catLower.includes('island')) {
          return (item.location || '').toLowerCase().includes('island') || (item.title || '').toLowerCase().includes('island');
        }
        return rawCat.includes(catLower) || rawType.includes(catLower);
      });
      if (!typeMatch) return false;
    }

    // 3. Price range filter
    const appPrices = appliedFilters?.activityPriceRanges || [];
    if (appPrices.length > 0) {
      const priceMatch = appPrices.some(pr => {
        if (pr === '< 1500') return price < 1500;
        if (pr === '1500-2500') return price >= 1500 && price <= 2500;
        if (pr === '2500-4000') return price >= 2500 && price <= 4000;
        if (pr === '> 4000') return price > 4000;
        return true;
      });
      if (!priceMatch) return false;
    }

    // 4. Duration filter
    const appDurations = appliedFilters?.activityDurations || [];
    if (appDurations.length > 0) {
      const durMatch = appDurations.some(d => {
        const dLower = d.toLowerCase();
        if (dLower.includes('1–2') || dLower.includes('1-2')) return duration.includes('1') || duration.includes('2');
        if (dLower.includes('3–4') || dLower.includes('3-4')) return duration.includes('3') || duration.includes('4');
        if (dLower.includes('5–6') || dLower.includes('5-6')) return duration.includes('5') || duration.includes('6');
        if (dLower.includes('full')) return duration.includes('full') || duration.includes('day');
        return true;
      });
      if (!durMatch) return false;
    }

    // 5. Search query
    const effectiveQuery = (searchQuery || parentSearchQuery || '').trim().toLowerCase();
    if (effectiveQuery && effectiveQuery !== 'goa' && effectiveQuery !== 'all goa' && effectiveQuery !== 'all experiences') {
      const title = (item.title || item.name || '').toLowerCase();
      const loc = (item.location || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      if (!title.includes(effectiveQuery) && !loc.includes(effectiveQuery) && !rawCat.includes(effectiveQuery) && !desc.includes(effectiveQuery)) {
        return false;
      }
    }
    return true;
  });

  // Filter customer's existing activity/sightseeing bookings — only current user's
  const myActivityBookings = (bookings || []).filter(b => {
    // package_type stored as 'Sightseeing', 'Activity', 'sightseeing', 'activity', etc.
    const type = String(b.package_type || b.type || '').toLowerCase();
    const itemId = String(b.item_id || '').toLowerCase();
    const isActivity = type === 'activity' || type === 'sightseeing' ||
      itemId.startsWith('act-') || itemId.startsWith('sight-') ||
      itemId.startsWith('act') || type.includes('activity') || type.includes('sightseeing');
    if (!isActivity) return false;
    // Only show if belongs to current user (phone, email, or customer_id match)
    if (currentUser) {
      return (
        (currentUser.phone && b.phone === currentUser.phone) ||
        (currentUser.email && b.email === currentUser.email) ||
        (currentUser.id && (b.customer_id === currentUser.id || b.customer_id === String(currentUser.id)))
      );
    }
    return false; // hide all if not logged in
  });

  const handleOpenBooking = (item) => {
    setBookingModalItem(item);
    setTravelDate(getTodayDateStr());
    setGuests(2);
    setFormError('');
    setBookingSuccess(null);
  };

  const handleConfirmBooking = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) {
      setFormError('Please enter your name and contact phone number.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const pricePerPerson = parseFloat(bookingModalItem.price || 0);
      const totalCost = pricePerPerson * guests;
      const cleanDigits = String(contactPhone).replace(/\D/g, '');

      const payload = {
        name: contactName,
        customer_name: contactName,
        phone: contactPhone,
        customer_phone: contactPhone,
        email: contactEmail || `${cleanDigits}@customer.wowgoa.com`,
        customer_email: contactEmail || `${cleanDigits}@customer.wowgoa.com`,
        customer_id: currentUser?.id || `c_${cleanDigits}`,
        item_id: bookingModalItem.id || `act-${Date.now()}`,
        item_name: bookingModalItem.title || bookingModalItem.name,
        package_name: bookingModalItem.title || bookingModalItem.name,
        package_type: bookingModalItem.type === 'sightseeing' ? 'Sightseeing' : 'Activity',
        type: (bookingModalItem.type || 'activity').toLowerCase(),
        service_type: (bookingModalItem.type || 'activity').toUpperCase(),
        pickup_date: travelDate,
        pickup_time: '09:00 AM',
        drop_date: travelDate,
        pickup_loc: bookingModalItem.location || 'Goa',
        pickup_location: bookingModalItem.location || 'Goa',
        duration: bookingModalItem.duration || 'Flexible',
        booking_days: 1,
        total_amount: totalCost,
        amount_paid: totalCost,
        total_paid: totalCost,
        pending_amount: 0,
        status: 'Confirmed',
        notes: `Guests: ${guests} | Category: ${bookingModalItem.category || 'Experience'}`
      };

      const res = await api.createBooking(payload);
      const confirmed = res && (res.id || res.booking_id)
        ? { ...payload, id: res.id || res.booking_id }
        : { ...payload, id: `WG-ACT-${Math.floor(1000 + Math.random() * 9000)}` };

      setBookingSuccess(confirmed);
      
      // Dispatch sync event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('new-booking-created', { detail: confirmed }));
      }
    } catch (err) {
      setFormError(err.message || 'Failed to confirm booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="customer-tab-content animate-fade-in">
      
      {/* ─── Header Banner ─── */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <div className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill bg-warning bg-opacity-10 text-dark fw-bold text-xs mb-1">
            <Sparkles size={14} className="text-warning" />
            <span>CURATED EXPERIENCES & TOURS</span>
          </div>
          <h4 className="fw-black text-dark mb-0 font-heading" style={{ fontSize: '22px' }}>
            Sightseeing & Activities
          </h4>
          <p className="text-muted text-xs mb-0">
            Explore premier Goa coastal sightseeing, heritage monuments, water sports, and guided excursions.
          </p>
        </div>

        {/* Search */}
        <div className="d-flex align-items-center gap-2">
          <div className="position-relative" style={{ width: '260px' }}>
            <Search size={14} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
            <input 
              type="text" 
              className="form-control form-control-sm ps-5 rounded-pill border"
              placeholder="Search tours & activities..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (setParentSearchQuery) setParentSearchQuery(e.target.value);
              }}
              style={{ fontSize: '12px' }}
            />
          </div>
        </div>
      </div>

      {/* ─── Filter Pills Bar ─── */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white" style={{ border: '1px solid #eef2f6' }}>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex flex-wrap gap-2">
            {[
              { id: 'all', label: `✨ All Experiences (${items.length})` },
              { id: 'sightseeing', label: `🏛️ Sightseeing Tours (${items.filter(i => { const t = (i.type || i.item_type || '').toLowerCase(); const c = (i.category || '').toLowerCase(); return t === 'sightseeing' || c.includes('sight') || c.includes('heritage') || c.includes('tour'); }).length})` },
              { id: 'activity', label: `🌊 Activities & Adventures (${items.filter(i => { const t = (i.type || i.item_type || '').toLowerCase(); const c = (i.category || '').toLowerCase(); const isSight = t === 'sightseeing' || c.includes('sight') || c.includes('heritage') || c.includes('tour'); return !isSight && (t === 'activity' || t === 'addon' || c.includes('water') || c.includes('adventure') || c.includes('sport') || c.includes('cruise') || c.includes('experience') || t !== ''); }).length})` },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id)}
                className={`btn btn-sm px-3 py-1.5 rounded-pill fw-bold text-xs ${
                  typeFilter === tab.id ? 'btn-dark text-white shadow-sm' : 'btn-light text-secondary border'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="d-flex align-items-center gap-3">
            {((appliedFilters?.activityTypes?.length || 0) > 0 || (appliedFilters?.activityPriceRanges?.length || 0) > 0 || searchQuery) && (
              <button
                type="button"
                className="btn btn-sm btn-link text-danger text-decoration-none p-0 text-xs fw-bold"
                onClick={() => {
                  setTypeFilter('all');
                  setSearchQuery('');
                  if (setParentSearchQuery) setParentSearchQuery('');
                  if (setAppliedFilters) {
                    setAppliedFilters(prev => ({
                      ...prev,
                      activityTypes: [],
                      activityPriceRanges: [],
                      activityDurations: []
                    }));
                  }
                }}
              >
                ✕ Clear Filters
              </button>
            )}
            <div className="text-xs text-muted fw-bold">
              Showing {filteredItems.length} curated {filteredItems.length === 1 ? 'option' : 'options'}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Cards Grid ─── */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status"></div>
          <p className="text-muted text-xs mt-2">Loading Goa experiences...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
          <Compass size={40} className="text-muted mx-auto mb-2 opacity-50" />
          <h5 className="fw-bold text-dark mb-1">No Experiences Found</h5>
          <p className="text-muted text-xs mb-3">Try adjusting your filters or search keywords.</p>
          <button 
            className="btn btn-sm btn-dark rounded-pill px-4 mx-auto fw-bold"
            onClick={() => {
              setTypeFilter('all');
              setSearchQuery('');
              if (setParentSearchQuery) setParentSearchQuery('');
              if (setAppliedFilters) {
                setAppliedFilters(prev => ({
                  ...prev,
                  activityTypes: [],
                  activityPriceRanges: [],
                  activityDurations: []
                }));
              }
            }}
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="row g-3 mb-5">
          {filteredItems.map((item) => {
            const isSightseeing = (item.type || '').toLowerCase() === 'sightseeing';
            const price = parseFloat(item.price || 0);

            return (
              <div key={item.id} className="col-12 col-md-6 col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 h-100 bg-white overflow-hidden d-flex flex-column hover-shadow transition-all" style={{ border: '1px solid #eef2f6' }}>
                  {/* Card Image */}
                  <div className="position-relative" style={{ height: '200px', overflow: 'hidden', background: '#f1f5f9' }}>
                    <img 
                      src={item.image_url || (isSightseeing ? 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800' : 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800')} 
                      alt={item.title || item.name}
                      className="w-100 h-100 object-fit-cover"
                    />
                    <div className="position-absolute top-0 start-0 m-3">
                      <span className={`badge px-2.5 py-1 rounded-pill fw-bold text-xxs shadow-sm ${
                        isSightseeing ? 'bg-primary text-white' : 'bg-success text-white'
                      }`}>
                        {isSightseeing ? '🏛️ Sightseeing' : '⚡ Activity'}
                      </span>
                    </div>

                    <div className="position-absolute top-0 end-0 m-3">
                      <span className="badge bg-dark bg-opacity-75 text-white px-2.5 py-1 rounded-pill fw-bold text-xxs shadow-sm d-flex align-items-center gap-1">
                        <Clock size={11} /> {item.duration || 'Flexible'}
                      </span>
                    </div>

                    <div className="position-absolute bottom-0 start-0 w-100 p-2 text-white d-flex align-items-center gap-1.5" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
                      <MapPin size={12} className="text-warning flex-shrink-0" />
                      <span className="text-xxs fw-semibold text-truncate">{item.location || 'Goa'}</span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-3 d-flex flex-column flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <span className="badge bg-light text-secondary border text-xxs rounded-pill px-2 py-0.5">
                        {item.category || (isSightseeing ? 'Sightseeing & Tours' : 'Adventure')}
                      </span>
                      <div className="text-end">
                        <span className="text-xxs text-muted">Starting from</span>
                        <div className="fw-black text-dark fs-5 font-heading">
                          ₹{price.toLocaleString('en-IN')}
                          <span className="text-muted fw-normal" style={{ fontSize: '11px' }}> /person</span>
                        </div>
                      </div>
                    </div>

                    <h5 className="fw-bold text-dark mb-1 font-heading" style={{ fontSize: '16px' }}>
                      {item.title || item.name}
                    </h5>

                    <p className="text-muted text-xs mb-3 flex-grow-1" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.description || 'Experience the best of Goa with verified safety standards and expert local guides.'}
                    </p>

                    <div className="d-flex align-items-center justify-content-between pt-2 border-top mt-auto">
                      <div className="d-flex align-items-center gap-1 text-xxs text-success fw-bold">
                        <ShieldCheck size={13} />
                        <span>Instant Confirmation</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenBooking(item)}
                        className="btn btn-sm btn-warning text-dark fw-bold rounded-pill px-3 py-1.5 shadow-sm text-xs d-flex align-items-center gap-1"
                      >
                        <span>Book Experience</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── My Booked Experiences History ─── */}
      {myActivityBookings.length > 0 && (
        <div className="mt-5 pt-4 border-top">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h5 className="fw-bold text-dark mb-0 font-heading">
                My Booked Sightseeing & Activities
              </h5>
              <p className="text-muted text-xs mb-0">Your confirmed experience reservations</p>
            </div>
            <span className="badge bg-dark text-white rounded-pill px-2.5 py-1 text-xxs">
              {myActivityBookings.length} {myActivityBookings.length === 1 ? 'Booking' : 'Bookings'}
            </span>
          </div>

          <div className="row g-3">
            {myActivityBookings.map((b, idx) => (
              <div key={b.id || idx} className="col-12 col-md-6">
                <div className="card border-0 shadow-sm rounded-4 p-3 bg-white" style={{ border: '1px solid #eef2f6' }}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <span className="badge bg-light text-dark border text-xxs px-2 py-0.5 rounded fw-bold text-uppercase">
                        #{b.id || b.booking_id}
                      </span>
                      <h6 className="fw-bold text-dark mt-1 mb-0">{b.item_name || b.package_name}</h6>
                    </div>
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1 rounded-pill fw-bold text-xxs">
                      {b.status || 'Confirmed'}
                    </span>
                  </div>

                  <div className="text-xs text-muted d-flex flex-wrap gap-3 my-2">
                    <span className="d-flex align-items-center gap-1"><Calendar size={13} /> {b.pickup_date || 'Upcoming'}</span>
                    <span className="d-flex align-items-center gap-1"><MapPin size={13} /> {b.pickup_loc || b.pickup_location || 'Goa'}</span>
                  </div>

                  <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                    <div>
                      <span className="text-xxs text-muted">Amount Paid</span>
                      <div className="fw-bold text-dark">₹{parseFloat(b.total_amount || b.amount_paid || 0).toLocaleString('en-IN')}</div>
                    </div>
                    {onOpenBookingDetails && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-dark rounded-pill px-3 py-1 text-xs d-flex align-items-center gap-1"
                        onClick={() => onOpenBookingDetails(b)}
                      >
                        <Eye size={12} /> View Voucher
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Direct Booking Modal ─── */}
      {bookingModalItem && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              
              {/* Modal Header */}
              <div className="modal-header bg-dark text-white border-0 py-3 px-4">
                <div className="d-flex align-items-center gap-2">
                  <div className="bg-warning text-dark rounded-circle p-1 d-flex align-items-center justify-content-center">
                    <Compass size={16} />
                  </div>
                  <div>
                    <h6 className="modal-title fw-bold text-white mb-0 font-heading">
                      Book Experience
                    </h6>
                    <span className="text-xxs text-warning">
                      {bookingModalItem.type === 'sightseeing' ? '🏛️ Sightseeing Tour' : '⚡ Activity Adventure'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm text-white-50 p-1 border-0"
                  onClick={() => setBookingModalItem(null)}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4">
                {bookingSuccess ? (
                  <div className="text-center py-3">
                    <div className="bg-success bg-opacity-10 text-success rounded-circle p-3 d-inline-flex mb-3">
                      <CheckCircle2 size={42} />
                    </div>
                    <h5 className="fw-black text-dark mb-1 font-heading">Booking Confirmed!</h5>
                    <p className="text-muted text-xs mb-3">
                      Your experience reservation <strong>#{bookingSuccess.id}</strong> has been successfully registered.
                    </p>

                    <div className="card bg-light border rounded-3 p-3 text-start mb-4">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted text-xs">Experience:</span>
                        <span className="fw-bold text-dark text-xs">{bookingSuccess.item_name}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted text-xs">Date:</span>
                        <span className="fw-bold text-dark text-xs">{bookingSuccess.pickup_date}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted text-xs">Total Amount:</span>
                        <span className="fw-black text-dark text-xs">₹{parseFloat(bookingSuccess.total_amount).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted text-xs">Status:</span>
                        <span className="badge bg-success text-white text-xxs">Confirmed</span>
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-secondary w-100 rounded-pill text-xs py-2 fw-bold"
                        onClick={() => {
                          setBookingModalItem(null);
                          setBookingSuccess(null);
                        }}
                      >
                        Close
                      </button>
                      {onOpenBookingDetails && (
                        <button
                          type="button"
                          className="btn btn-warning text-dark w-100 rounded-pill text-xs py-2 fw-bold"
                          onClick={() => {
                            const b = bookingSuccess;
                            setBookingModalItem(null);
                            setBookingSuccess(null);
                            onOpenBookingDetails(b);
                          }}
                        >
                          View Voucher
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleConfirmBooking}>
                    <div className="card bg-light border-0 rounded-3 p-3 mb-3">
                      <div className="fw-bold text-dark text-sm">{bookingModalItem.title || bookingModalItem.name}</div>
                      <div className="d-flex align-items-center gap-3 text-xxs text-muted mt-1">
                        <span><MapPin size={11} className="text-warning" /> {bookingModalItem.location}</span>
                        <span><Clock size={11} /> {bookingModalItem.duration}</span>
                        <span className="fw-bold text-dark">₹{parseFloat(bookingModalItem.price).toLocaleString('en-IN')} / person</span>
                      </div>
                    </div>

                    {formError && (
                      <div className="alert alert-danger py-2 px-3 text-xs mb-3 rounded-3">
                        {formError}
                      </div>
                    )}

                    <div className="row g-2 mb-3">
                      <div className="col-7">
                        <label className="form-label text-xxs fw-bold text-muted mb-1">Select Date</label>
                        <input
                          type="date"
                          className="form-control form-control-sm rounded-3 text-xs"
                          min={getTodayDateStr()}
                          value={travelDate}
                          onChange={(e) => setTravelDate(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-5">
                        <label className="form-label text-xxs fw-bold text-muted mb-1">Guests</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          className="form-control form-control-sm rounded-3 text-xs"
                          value={guests}
                          onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value) || 1))}
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-2">
                      <label className="form-label text-xxs fw-bold text-muted mb-1">Full Name</label>
                      <input
                        type="text"
                        className="form-control form-control-sm rounded-3 text-xs"
                        placeholder="Your full name"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="form-label text-xxs fw-bold text-muted mb-1">Mobile Phone</label>
                        <input
                          type="tel"
                          className="form-control form-control-sm rounded-3 text-xs"
                          placeholder="10-digit number"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label text-xxs fw-bold text-muted mb-1">Email (Optional)</label>
                        <input
                          type="email"
                          className="form-control form-control-sm rounded-3 text-xs"
                          placeholder="email@example.com"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="card bg-warning bg-opacity-10 border border-warning border-opacity-25 rounded-3 p-3 mb-4">
                      <div className="d-flex justify-content-between text-xs mb-1">
                        <span>₹{parseFloat(bookingModalItem.price).toLocaleString('en-IN')} × {guests} {guests === 1 ? 'Guest' : 'Guests'}</span>
                        <span className="fw-bold">₹{(parseFloat(bookingModalItem.price) * guests).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="d-flex justify-content-between text-xs fw-bold text-dark pt-2 border-top border-warning border-opacity-25">
                        <span>Total Payable:</span>
                        <span className="fs-6 text-dark font-heading">₹{(parseFloat(bookingModalItem.price) * guests).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-light w-50 rounded-pill text-xs py-2 fw-bold"
                        onClick={() => setBookingModalItem(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-warning text-dark w-100 rounded-pill text-xs py-2 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-1.5"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status"></span>
                            <span>Confirming...</span>
                          </>
                        ) : (
                          <>
                            <span>Confirm & Book Now</span>
                            <ArrowRight size={13} />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
