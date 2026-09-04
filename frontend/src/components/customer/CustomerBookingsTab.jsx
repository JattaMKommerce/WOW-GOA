import React, { useState } from 'react';
import {
  Calendar, Car, Hotel, Compass, Plane, Package, Search,
  Filter, Download, Eye, CheckCircle2, Clock, XCircle,
  FileText, ArrowRight, ShieldCheck, MapPin, ChevronRight, X
} from 'lucide-react';

export default function CustomerBookingsTab({
  currentUser,
  bookings = [],
  onOpenBookingDetails
}) {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVoucherBooking, setSelectedVoucherBooking] = useState(null);

  // Bookings passed from CustomerPortalPage are already strictly isolated for the customer
  const myBookings = Array.isArray(bookings) ? bookings : [];

  // ─── Unified Category Helpers ───
  const isCraftBooking = (b) => {
    if (!b) return false;
    const type = String(b.package_type || b.type || '').toLowerCase();
    const itemName = String(b.item_name || b.package_name || '').toLowerCase();
    const itemId = String(b.item_id || '').toLowerCase();
    return type.includes('craft') || itemName.includes('craft my trip') || itemId.includes('craft');
  };

  const isFlightBooking = (b) => {
    if (!b || isCraftBooking(b)) return false;
    const type = String(b.package_type || b.type || '').toLowerCase();
    const itemName = String(b.item_name || b.package_name || '').toLowerCase();
    const itemId = String(b.item_id || '').toLowerCase();
    return type === 'flight' || type.includes('flight') || itemName.includes('flight') || itemName.includes('air') || itemId.includes('flight');
  };

  const isDriverBooking = (b) => {
    if (!b || isCraftBooking(b)) return false;
    const svcType = String(b.driver_service_type || '').toUpperCase();
    return Boolean(
      ['PICKUP', 'DROP', 'FULL'].includes(svcType) ||
      b.driver_required == 1 ||
      b.driver_required === 'yes' ||
      b.driver_required === true ||
      b.assigned_driver_id ||
      (b.package_type && String(b.package_type).toLowerCase().includes('driver')) ||
      (b.item_name && String(b.item_name).toLowerCase().includes('driver'))
    );
  };

  const isHotelBooking = (b) => {
    if (!b || isCraftBooking(b) || isFlightBooking(b)) return false;
    const type = String(b.package_type || b.type || '').toLowerCase();
    const itemName = String(b.item_name || b.package_name || b.hotel_name || '').toLowerCase();
    const itemId = String(b.item_id || '').toLowerCase();
    if (type.includes('package') || type.includes('self drive') || type === 'selfdrive' || itemId.startsWith('pkg-') || itemId.startsWith('package-')) {
      return false;
    }
    return (
      type === 'hotel' ||
      type.includes('hotel') ||
      Boolean(b.hotel_name && !b.vehicle_name && !b.car_included) ||
      itemId.includes('hotel') ||
      itemName.includes('hotel') ||
      itemName.includes('resort') ||
      itemName.includes('villa') ||
      itemName.includes('palace') ||
      itemName.includes('beachfront') ||
      itemName.includes('suites') ||
      itemName.includes('stay')
    );
  };

  const isPackageBooking = (b) => {
    if (!b || isCraftBooking(b) || isFlightBooking(b)) return false;
    const type = String(b.package_type || b.type || '').toLowerCase();
    const itemName = String(b.item_name || b.package_name || '').toLowerCase();
    const itemId = String(b.item_id || '').toLowerCase();
    
    // Explicitly exclude self drive bookings
    if (type.includes('self drive') || itemName.includes('self drive') || type === 'selfdrive') {
      return false;
    }

    // Explicit trip package types
    if (
      type === 'package' ||
      type === 'trip_package' ||
      type === 'tour' ||
      type === 'trip' ||
      type.includes('trip package') ||
      type.includes('tour package') ||
      type.includes('holiday package') ||
      type.includes('complete package') ||
      type.includes('tour') ||
      type.includes('package')
    ) {
      return true;
    }

    // Item ID indicators
    if (itemId.startsWith('pkg-') || itemId.startsWith('package-') || itemId.startsWith('tp-')) {
      return true;
    }

    // Known Package Names & themes (e.g. Tropical Bali Getaway, Romantic Sunset Escape, etc.)
    const packageKeywords = [
      'package', 'tour', 'getaway', 'explorer', 'escape', 'holiday',
      'vacation', 'experience', 'bali', 'kerala', 'kashmir', 'dubai',
      'thailand', 'maldives', 'goa tour', 'heritage trail', 'coastal goa',
      'sunset escape', 'honeymoon'
    ];
    if (packageKeywords.some(kw => itemName.includes(kw))) {
      if (!itemId.startsWith('car-') && !itemId.startsWith('bike-')) {
        return true;
      }
    }

    // Multi-day packages with duration / itinerary
    if (Boolean(b.duration && (b.hotel_name || b.hotel_included) && !itemId.startsWith('car-') && !itemId.startsWith('bike-'))) {
      return true;
    }

    return false;
  };

  const isSelfDriveBooking = (b) => {
    if (!b || isCraftBooking(b) || isFlightBooking(b) || isPackageBooking(b)) return false;
    const type = String(b.package_type || b.type || '').toLowerCase();
    const itemName = String(b.item_name || b.package_name || '').toLowerCase();
    return (
      type.includes('self drive') ||
      type === 'selfdrive' ||
      itemName.includes('self drive') ||
      (b.package_name && String(b.package_name).toLowerCase().includes('self drive'))
    );
  };

  const isBikeBooking = (b) => {
    if (!b || isCraftBooking(b) || isPackageBooking(b) || isSelfDriveBooking(b)) return false;
    const type = String(b.package_type || b.type || '').toLowerCase();
    const itemName = String(b.item_name || b.package_name || '').toLowerCase();
    const itemId = String(b.item_id || '').toLowerCase();
    return (
      type === 'bike' ||
      type.includes('bike') ||
      type.includes('scooter') ||
      itemId.startsWith('bike-') ||
      itemName.includes('bike') ||
      itemName.includes('scooter') ||
      itemName.includes('activa') ||
      itemName.includes('himalayan') ||
      itemName.includes('bullet') ||
      itemName.includes('jupiter') ||
      itemName.includes('classic 350') ||
      itemName.includes('fz-s')
    );
  };

  const isCarBooking = (b) => {
    if (!b || isCraftBooking(b) || isPackageBooking(b) || isSelfDriveBooking(b) || isBikeBooking(b) || isHotelBooking(b) || isFlightBooking(b)) return false;
    const type = String(b.package_type || b.type || '').toLowerCase();
    const itemName = String(b.item_name || b.package_name || '').toLowerCase();
    const itemId = String(b.item_id || '').toLowerCase();
    return (
      type === 'car' ||
      type.includes('car rental') ||
      type.includes('vehicle rental') ||
      type === 'vehicle' ||
      itemId.startsWith('car-') ||
      itemId.startsWith('car_') ||
      itemName.includes('car rental') ||
      itemName.includes('thar') ||
      itemName.includes('swift') ||
      itemName.includes('creta') ||
      itemName.includes('ertiga') ||
      itemName.includes('fortuner') ||
      itemName.includes('innova') ||
      itemName.includes('cabriolet') ||
      itemName.includes('audi') ||
      itemName.includes('bmw')
    );
  };

  // Apply category and status filters
  const filteredBookings = myBookings.filter(b => {
    // Category filter
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'driver' && !isDriverBooking(b)) return false;
      if (categoryFilter === 'selfdrive' && !isSelfDriveBooking(b)) return false;
      if (categoryFilter === 'package' && !isPackageBooking(b)) return false;
      if (categoryFilter === 'hotel' && !isHotelBooking(b)) return false;
      if (categoryFilter === 'flight' && !isFlightBooking(b)) return false;
      if (categoryFilter === 'craftmytrip' && !isCraftBooking(b)) return false;
      if (categoryFilter === 'car' && !isCarBooking(b)) return false;
      if (categoryFilter === 'bike' && !isBikeBooking(b)) return false;
    }

    // Status filter
    if (statusFilter !== 'all') {
      if ((b.status || 'pending').toLowerCase() !== statusFilter.toLowerCase()) return false;
    }

    // Search query across ID, Destination, Hotel name, Vehicle, Package name, Flight number
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const id = String(b.id || b.booking_id || '').toLowerCase();
      const name = String(b.item_name || b.package_name || b.vehicle_name || b.hotel_name || '').toLowerCase();
      const loc = String(b.pickup_location || b.pickup_loc || b.pickup || b.hotel_location || '').toLowerCase();
      const cust = String(b.customer_name || b.name || '').toLowerCase();
      const phone = String(b.customer_phone || b.phone || '').toLowerCase();
      if (!id.includes(q) && !name.includes(q) && !loc.includes(q) && !cust.includes(q) && !phone.includes(q)) return false;
    }

    return true;
  });

  const getCategoryIcon = (b, optName = '') => {
    const item = (typeof b === 'object' && b !== null) ? b : { package_type: b, type: b, item_name: optName };
    if (isCraftBooking(item)) return <Compass size={15} className="text-warning" />;
    if (isFlightBooking(item)) return <Plane size={15} className="text-info" />;
    if (isHotelBooking(item)) return <Hotel size={15} className="text-success" />;
    if (isPackageBooking(item)) return <Package size={15} className="text-primary" />;
    if (isDriverBooking(item)) return <Car size={15} className="text-warning" />;
    if (isSelfDriveBooking(item)) return <Compass size={15} className="text-warning" />;
    if (isBikeBooking(item)) return <Car size={15} className="text-info" />;
    if (isCarBooking(item)) return <Car size={15} className="text-primary" />;
    return <Package size={15} className="text-primary" />;
  };

  const getCategoryTitle = (b) => {
    if (isCraftBooking(b)) return '✨ Craft My Trip';
    if (isFlightBooking(b)) return '✈️ Flight Booking';
    if (isHotelBooking(b)) {
      return isDriverBooking(b) ? '🏨 Hotel + Chauffeur' : '🏨 Hotel Stay';
    }
    if (isPackageBooking(b)) return '🌴 Trip Package';
    if (isSelfDriveBooking(b)) return '⭐ Self Drive Holiday';
    if (isDriverBooking(b)) return '🚗 Vehicle + Driver';
    if (isBikeBooking(b)) return '🏍️ Bike Rental';
    if (isCarBooking(b)) return '🚗 Car Rental';
    return b.package_type || (b.type === 'package' ? '🌴 Trip Package' : b.type) || '🌴 Trip Package';
  };

  const getStatusBadge = (status) => {
    const s = (status || 'Pending').toLowerCase();
    if (s === 'confirmed') return <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1 rounded-pill fw-bold">Confirmed</span>;
    if (s === 'upcoming') return <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2.5 py-1 rounded-pill fw-bold">Upcoming</span>;
    if (s === 'ongoing') return <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2.5 py-1 rounded-pill fw-bold">Ongoing</span>;
    if (s === 'completed') return <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-2.5 py-1 rounded-pill fw-bold">Completed</span>;
    if (s === 'cancelled') return <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2.5 py-1 rounded-pill fw-bold">Cancelled</span>;
    if (s.includes('review')) return <span className="badge bg-warning bg-opacity-10 text-dark border border-warning border-opacity-25 px-2.5 py-1 rounded-pill fw-bold">Under Review</span>;
    return <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2.5 py-1 rounded-pill fw-bold">Pending Confirmation</span>;
  };

  // Category counts
  const countByType = {
    all: myBookings.length,
    selfdrive: myBookings.filter(isSelfDriveBooking).length,
    driver: myBookings.filter(isDriverBooking).length,
    package: myBookings.filter(isPackageBooking).length,
    hotel: myBookings.filter(isHotelBooking).length,
    flight: myBookings.filter(isFlightBooking).length,
    craftmytrip: myBookings.filter(isCraftBooking).length,
    car: myBookings.filter(isCarBooking).length,
    bike: myBookings.filter(isBikeBooking).length,
  };

  return (
    <div className="customer-tab-content animate-fade-in">
      
      {/* ─── Header & Controls ─── */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h4 className="fw-black text-dark mb-1 font-heading" style={{ fontSize: '22px' }}>
            My Booking History
          </h4>
          <p className="text-muted text-xs mb-0">
            View all confirmed, upcoming, and past trip reservations across WOW GOA.
          </p>
        </div>

        {/* Search Bar */}
        <div className="d-flex align-items-center gap-2">
          <div className="position-relative" style={{ width: '260px' }}>
            <Search size={14} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
            <input 
              type="text" 
              className="form-control form-control-sm ps-5 rounded-pill border"
              placeholder="Search by ID, hotel, vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: '12px' }}
            />
          </div>
        </div>
      </div>

      {/* ─── Filters Bar ─── */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white" style={{ border: '1px solid #eef2f6' }}>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          {/* Category Filter Pills */}
          <div className="d-flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: `All Bookings (${countByType.all})` },
              { id: 'selfdrive', label: `⭐ Self Drive Holidays (${countByType.selfdrive})` },
              { id: 'driver', label: `🚗 Vehicle + Driver (${countByType.driver})` },
              { id: 'package', label: `🌴 Trip Packages (${countByType.package})` },
              { id: 'hotel', label: `🏨 Hotels (${countByType.hotel})` },
              { id: 'flight', label: `✈️ Flights (${countByType.flight})` },
              { id: 'craftmytrip', label: `✨ Craft My Trip (${countByType.craftmytrip})` },
              { id: 'car', label: `🚗 Cars (${countByType.car})` },
              { id: 'bike', label: `🏍️ Bikes (${countByType.bike})` },
            ].map(cat => (
              <button 
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`btn btn-sm px-3 py-1.5 rounded-pill fw-bold text-xs ${
                  categoryFilter === cat.id ? 'btn-dark text-white shadow-sm' : 'btn-light text-secondary border'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Status Dropdown */}
          <div className="d-flex align-items-center gap-2 text-xs">
            <span className="text-muted fw-bold">Status:</span>
            <select 
              className="form-select form-select-sm rounded-pill border text-xs" 
              style={{ width: '130px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── Responsive Bookings Grid / Cards for Mobile & Desktop ─── */}
      <div className="row g-3 mb-4 d-md-none">
        {filteredBookings.map((b, idx) => {
          const totalAmt = parseFloat(b.total_amount || b.amount || 0);
          const paidAmt = parseFloat(b.paid_amount || b.total_paid || 0);
          const pendingAmt = parseFloat(b.pending_amount || (totalAmt > paidAmt ? totalAmt - paidAmt : 0));
          const isPaid = paidAmt >= totalAmt && totalAmt > 0;

          return (
            <div key={b.id || idx} className="col-12">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white" style={{ border: '1px solid #eef2f6' }}>
                <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-light text-dark border text-xxs px-2 py-1 rounded fw-bold text-uppercase">
                      {getCategoryTitle(b)}
                    </span>
                    <span className="fw-black text-dark text-xs font-heading">#{b.id || b.booking_id || `WG-${1000 + idx}`}</span>
                  </div>
                  {getStatusBadge(b.status)}
                </div>

                <h6 className="fw-black text-dark mb-1 font-heading">
                  {b.package_name || b.item_name || b.hotel_name || b.vehicle_name || 'WOW GOA Booking'}
                </h6>

                <div className="text-muted text-xs mb-2">
                  📍 {b.pickup_location || b.pickup || b.hotel_location || 'Goa'} {b.pickup_time ? `• ${b.pickup_time}` : ''}
                </div>

                <div className="p-2.5 bg-light rounded-3 text-xs mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Travel Dates:</span>
                    <span className="fw-bold text-dark">{b.pickup_date || b.travel_date || 'Upcoming'}{b.drop_date ? ` to ${b.drop_date}` : ''}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Total Fare:</span>
                    <span className="fw-black text-dark">₹{totalAmt.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Payment Status:</span>
                    <span className={`fw-bold ${isPaid ? 'text-success' : 'text-warning'}`}>{isPaid ? 'Paid Full' : `Partially Paid (Pending: ₹${pendingAmt.toLocaleString('en-IN')})`}</span>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button 
                    onClick={() => setSelectedVoucherBooking(b)}
                    className="btn btn-sm btn-light border text-dark fw-bold rounded-pill px-3 py-1.5 text-xs flex-grow-1"
                  >
                    Print Voucher
                  </button>
                  <button 
                    onClick={() => onOpenBookingDetails(b)}
                    className="btn btn-sm btn-dark text-white fw-bold rounded-pill px-3 py-1.5 text-xs flex-grow-1"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Desktop Bookings Table ─── */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white d-none d-md-block" style={{ border: '1px solid #eef2f6' }}>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead className="bg-light text-muted text-xs text-uppercase">
              <tr>
                <th className="ps-4">Booking ID</th>
                <th>Service Details</th>
                <th>Type</th>
                <th>Travel Dates</th>
                <th>Total Fare</th>
                <th>Payment</th>
                <th>Status</th>
                <th className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b, idx) => {
                const totalAmt = parseFloat(b.total_amount || b.amount || 0);
                const paidAmt = parseFloat(b.paid_amount || b.total_paid || 0);
                const isPaid = paidAmt >= totalAmt && totalAmt > 0;

                return (
                  <tr key={b.id || idx}>
                    <td className="ps-4 fw-black text-dark font-heading">
                      #{b.id || b.booking_id || `WOW-${1000 + idx}`}
                    </td>

                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="p-2 rounded bg-light border flex-shrink-0">
                          {getCategoryIcon(b.package_type || b.type, b.item_name)}
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{b.package_name || b.item_name || b.hotel_name || b.vehicle_name || 'Goa Booking'}</div>
                          <div className="text-muted text-xxs">📍 {b.pickup_location || b.pickup || b.hotel_location || 'Goa'} {b.pickup_time ? `• ${b.pickup_time}` : ''}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="badge bg-light text-dark border px-2 py-1 rounded text-xxs fw-bold text-uppercase">
                        {getCategoryTitle(b)}
                      </span>
                    </td>

                    <td className="text-xs">
                      <div className="fw-bold text-dark">{b.pickup_date || b.travel_date || 'Scheduled'}</div>
                      {b.drop_date && <div className="text-muted text-xxs">to {b.drop_date}</div>}
                    </td>

                    <td className="fw-black text-dark">
                      ₹{totalAmt.toLocaleString('en-IN')}
                    </td>

                    <td>
                      {isPaid ? (
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-0.5 rounded text-xxs fw-bold">
                          Paid Full
                        </span>
                      ) : (
                        <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2 py-0.5 rounded text-xxs fw-bold">
                          Partially Paid
                        </span>
                      )}
                    </td>

                    <td>
                      {getStatusBadge(b.status)}
                    </td>

                    <td className="text-end pe-4">
                      <div className="d-flex align-items-center justify-content-end gap-1.5">
                        <button 
                          onClick={() => setSelectedVoucherBooking(b)}
                          className="btn btn-sm btn-light border text-dark fw-bold rounded-pill px-2.5 py-1 text-xs d-flex align-items-center gap-1"
                          title="Download Printable Receipt / Voucher"
                        >
                          <Download size={12} />
                          <span>Voucher</span>
                        </button>

                        <button 
                          onClick={() => onOpenBookingDetails(b)}
                          className="btn btn-sm btn-dark text-white fw-bold rounded-pill px-3 py-1 text-xs"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    {categoryFilter === 'hotel' ? (
                      <>
                        <Hotel size={40} className="mb-2 text-warning opacity-75" />
                        <h5 className="fw-bold text-dark mb-1">No Hotel Bookings Found</h5>
                        <p className="text-muted text-xs mb-3">You haven't reserved any hotel stays or resort accommodations yet.</p>
                        <a href="/#hotels" className="btn btn-sm btn-warning text-dark fw-bold rounded-pill px-4 py-2 shadow-sm">
                          Explore Goa Hotels & Resorts →
                        </a>
                      </>
                    ) : categoryFilter === 'flight' ? (
                      <>
                        <Plane size={40} className="mb-2 text-info opacity-75" />
                        <h5 className="fw-bold text-dark mb-1">No Flight Bookings Found</h5>
                        <p className="text-muted text-xs mb-3">Search direct and connecting flights to and from Goa Airport.</p>
                        <a href="/#flights" className="btn btn-sm btn-dark text-white fw-bold rounded-pill px-4 py-2 shadow-sm">
                          Search Flights →
                        </a>
                      </>
                    ) : categoryFilter === 'package' ? (
                      <>
                        <Package size={40} className="mb-2 text-primary opacity-75" />
                        <h5 className="fw-bold text-dark mb-1">No Trip Packages Found</h5>
                        <p className="text-muted text-xs mb-3">Discover curated North & South Goa holiday packages with luxury stays and transfers.</p>
                        <a href="/#packages" className="btn btn-sm btn-warning text-dark fw-bold rounded-pill px-4 py-2 shadow-sm">
                          Explore Trip Packages →
                        </a>
                      </>
                    ) : categoryFilter === 'craftmytrip' ? (
                      <>
                        <Compass size={40} className="mb-2 text-warning opacity-75" />
                        <h5 className="fw-bold text-dark mb-1">No Custom Trips Found</h5>
                        <p className="text-muted text-xs mb-3">Craft your own Goa holiday package customized with your choice of vehicle, hotel, and flights.</p>
                        <a href="/#craft-my-trip" className="btn btn-sm btn-warning text-dark fw-bold rounded-pill px-4 py-2 shadow-sm">
                          Craft Your Own Trip →
                        </a>
                      </>
                    ) : categoryFilter === 'driver' ? (
                      <>
                        <Car size={40} className="mb-2 text-warning opacity-75" />
                        <h5 className="fw-bold text-dark mb-1">No Vehicle + Driver Bookings Found</h5>
                        <p className="text-muted text-xs mb-3">Book premium vehicles with verified local Goa chauffeurs for doorstep pickup and effortless sightseeing.</p>
                        <a href="/#self-drive-categories" className="btn btn-sm btn-warning text-dark fw-bold rounded-pill px-4 py-2 shadow-sm">
                          Book Vehicle with Driver →
                        </a>
                      </>
                    ) : categoryFilter === 'selfdrive' ? (
                      <>
                        <Compass size={40} className="mb-2 text-warning opacity-75" />
                        <h5 className="fw-bold text-dark mb-1">No Self Drive Holidays Found</h5>
                        <p className="text-muted text-xs mb-3">Book premium Self Drive packages with unlimited KMs and resort stays.</p>
                        <a href="/#self-drive-categories" className="btn btn-sm btn-warning text-dark fw-bold rounded-pill px-4 py-2 shadow-sm">
                          Book a Self Drive Holiday →
                        </a>
                      </>
                    ) : (
                      <>
                        <Calendar size={40} className="mb-2 text-muted opacity-50" />
                        <h5 className="fw-bold text-dark mb-1">No Bookings Found</h5>
                        <p className="text-muted text-xs mb-3">No reservations matched your current filter criteria.</p>
                        <button 
                          onClick={() => { setCategoryFilter('all'); setStatusFilter('all'); setSearchQuery(''); }}
                          className="btn btn-sm btn-outline-dark rounded-pill px-4 py-1.5 fw-bold"
                        >
                          Reset All Filters
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Printable Voucher Modal ─── */}
      {selectedVoucherBooking && (
        <div className="modal-backdrop-custom d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(11, 25, 44, 0.6)', backdropFilter: 'blur(6px)', zIndex: 1060 }}>
          <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ width: '92%', maxWidth: '580px' }}>
            <div className="card-header bg-dark text-white p-4 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <Compass size={22} className="text-warning" />
                <h5 className="fw-black mb-0 text-white font-heading">WOW GOA Booking Voucher</h5>
              </div>
              <button onClick={() => setSelectedVoucherBooking(null)} className="btn btn-sm text-white-50 hover-text-white border-0">
                <X size={20} />
              </button>
            </div>

            <div className="card-body p-4">
              <div className="p-3 rounded-3 bg-light border mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-xs text-muted">Voucher ID</span>
                  <span className="fw-black text-dark font-heading">#{selectedVoucherBooking.id || 'WOW-101'}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-xs text-muted">Service Name</span>
                  <span className="fw-bold text-dark">{selectedVoucherBooking.item_name || selectedVoucherBooking.package_name}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-xs text-muted">Customer Name</span>
                  <span className="fw-bold text-dark">{selectedVoucherBooking.customer_name || selectedVoucherBooking.name || currentUser?.name || 'Customer'}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-xs text-muted">Travel Date</span>
                  <span className="fw-bold text-dark">{selectedVoucherBooking.pickup_date || selectedVoucherBooking.travel_date || 'Scheduled'}</span>
                </div>
              </div>

              <div className="text-center p-3 rounded-3 bg-success bg-opacity-10 border border-success border-opacity-25 mb-3">
                <div className="text-xs text-success fw-bold mb-1">✓ BOOKING STATUS: CONFIRMED</div>
                <div className="text-xxs text-muted">Please present this digital confirmation or your Booking ID at pickup.</div>
              </div>
            </div>

            <div className="card-footer bg-light p-3 d-flex justify-content-between">
              <button onClick={() => window.print()} className="btn btn-dark btn-sm rounded-pill px-4 fw-bold d-flex align-items-center gap-1.5">
                <Download size={14} />
                <span>Print / Save PDF</span>
              </button>
              <button onClick={() => setSelectedVoucherBooking(null)} className="btn btn-secondary btn-sm rounded-pill px-4 fw-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
