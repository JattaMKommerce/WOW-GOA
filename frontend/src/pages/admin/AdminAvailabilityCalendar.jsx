import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar, Filter, Hotel, Car, CheckCircle2, 
  Clock, Users, X, Eye, Phone, Mail, MapPin, DollarSign, Tag, Check, Package, Sparkles 
} from 'lucide-react';
import * as api from '../../services/api';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function normalizeCalendarDate(raw) {
  if (!raw) return '';
  const str = String(raw).trim();
  if (!str) return '';
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    const d = String(dmyMatch[1]).padStart(2, '0');
    const m = String(dmyMatch[2]).padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = String(ymdMatch[2]).padStart(2, '0');
    const d = String(ymdMatch[3]).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (str.length >= 10) {
    return str.slice(0, 10);
  }
  return str;
}

export default function AdminAvailabilityCalendar({
  currentUser,
  hotels = [],
  cars = [],
  bikes = [],
  packages = [],
  bookings: propBookings = [],
  onRefresh
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'vehicle' | 'hotel'
  const [selectedItem, setSelectedItem] = useState('all');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [selectedDayDetails, setSelectedDayDetails] = useState(null);
  const [viewBookingModal, setViewBookingModal] = useState(null);
  const [liveBookings, setLiveBookings] = useState(propBookings);

  // Synchronize when prop changes
  useEffect(() => {
    if (Array.isArray(propBookings) && propBookings.length > 0) {
      setLiveBookings(prev => {
        const idMap = new Map();
        prev.forEach(b => { if (b?.id) idMap.set(String(b.id), b); });
        propBookings.forEach(b => { if (b?.id) idMap.set(String(b.id), b); });
        return Array.from(idMap.values());
      });
    }
  }, [propBookings]);

  // Real-time synchronization
  useEffect(() => {
    const fetchFreshBookings = async () => {
      try {
        const fresh = await api.fetchBookings();
        if (Array.isArray(fresh) && fresh.length > 0) {
          setLiveBookings(prev => {
            if (
              prev.length === fresh.length &&
              prev.every((b, idx) => b.id === fresh[idx].id && b.status === fresh[idx].status && b.payment_status === fresh[idx].payment_status)
            ) {
              return prev;
            }
            return fresh;
          });
        }
      } catch (e) {}
    };

    const handleSync = (e) => {
      if (e?.detail) {
        setLiveBookings(prev => {
          const exists = prev.some(b => String(b.id) === String(e.detail.id));
          return exists ? prev.map(b => String(b.id) === String(e.detail.id) ? { ...b, ...e.detail } : b) : [e.detail, ...prev];
        });
      }
      fetchFreshBookings();
    };

    window.addEventListener('new-booking-created', handleSync);
    window.addEventListener('booking-updated', handleSync);
    window.addEventListener('booking-status-updated', handleSync);
    window.addEventListener('booking-deleted', fetchFreshBookings);
    window.addEventListener('tripgalileo-booking-sync', handleSync);

    let bc = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('tripgalileo_bookings_sync');
        bc.onmessage = () => fetchFreshBookings();
      }
    } catch (e) {}

    const interval = setInterval(fetchFreshBookings, 5000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('new-booking-created', handleSync);
      window.removeEventListener('booking-updated', handleSync);
      window.removeEventListener('booking-status-updated', handleSync);
      window.removeEventListener('booking-deleted', fetchFreshBookings);
      window.removeEventListener('tripgalileo-booking-sync', handleSync);
      if (bc) bc.close();
    };
  }, []);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyBefore = Array.from({ length: firstDay }, (_, i) => i);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
    setSelectedDayDetails(null);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
    setSelectedDayDetails(null);
  };

  // Inventory lists from authoritative database models
  const vehicleList = useMemo(() => [
    ...(cars || []).map(c => ({ id: c.id, name: c.name, type: 'car', category: c.category || 'Car', price: c.price, is_available: c.is_available, vendor_id: c.vendor_id })),
    ...(bikes || []).map(b => ({ id: b.id, name: b.name, type: 'bike', category: b.category || 'Bike', price: b.price, is_available: b.is_available, vendor_id: b.vendor_id }))
  ], [cars, bikes]);

  const hotelList = useMemo(() => (hotels || []).map(h => ({
    id: h.id,
    name: h.name,
    type: 'hotel',
    category: 'Hotel',
    price: h.price,
    is_available: h.is_available,
    vendor_id: h.vendor_id,
    blocked_dates: h.blocked_dates
  })), [hotels]);

  const packageList = useMemo(() => (packages || []).map(p => ({
    id: p.id,
    name: p.name,
    type: 'package',
    category: 'Package',
    price: p.price
  })), [packages]);

  // Robust category classification: Vehicle, Hotel, Package, Flight
  const getBookingCategory = (b) => {
    if (!b) return 'other';
    const type = String(b.type || b.package_type || b.item_type || '').trim().toLowerCase();
    const itemId = String(b.item_id || '').trim().toLowerCase();
    const itemName = String(b.item_name || b.vehicle_name || b.hotel_name || b.package_name || b.service_name || '').trim().toLowerCase();

    // 1. Flight check
    if (
      type === 'flight' ||
      itemId.includes('flight') ||
      itemName.includes('flight') ||
      itemName.includes('airways') ||
      itemName.includes('airline') ||
      Boolean(b.flight_number || b.airline)
    ) {
      return 'flight';
    }

    // 2. Hotel check
    if (
      type === 'hotel' ||
      Boolean(b.hotel_id || b.hotel_name) ||
      itemId.startsWith('hotel-') ||
      itemId.startsWith('htl-') ||
      itemName.includes('hotel') ||
      itemName.includes('resort') ||
      itemName.includes('marriott') ||
      itemName.includes('taj') ||
      itemName.includes('stay') ||
      itemName.includes('villa') ||
      itemName.includes('suites') ||
      itemName.includes('palace') ||
      itemName.includes('inn') ||
      itemName.includes('homestay') ||
      hotelList.some(h => String(h.id) === String(b.item_id) || itemName.includes(h.name.toLowerCase()))
    ) {
      return 'hotel';
    }

    // 3. Vehicle check (Cars, Bikes, Self-Drive, Fleet)
    const vehicleKeywords = ['swift', 'thar', 'creta', 'innova', 'ertiga', 'baleno', 'i20', 'activa', 'bike', 'car', 'scooter', 'crysta', 'fortuner', 'scorpio', 'wagonr', 'sedan', 'suv', 'hatchback', 'rental', 'selfdrive', 'self-drive'];
    if (
      type === 'vehicle' ||
      type === 'car' ||
      type === 'bike' ||
      type === 'selfdrive' ||
      type === 'self-drive' ||
      Boolean(b.vehicle_id || b.vehicle_name) ||
      itemId.startsWith('car-') ||
      itemId.startsWith('bike-') ||
      itemId.startsWith('veh-') ||
      vehicleKeywords.some(kw => itemName.includes(kw) || itemId.includes(kw)) ||
      vehicleList.some(v => String(v.id) === String(b.item_id) || itemName.includes(v.name.toLowerCase()))
    ) {
      return 'vehicle';
    }

    // 4. Package check
    if (
      type === 'package' ||
      type === 'tour' ||
      type === 'trip' ||
      type === 'custom' ||
      type === 'craft' ||
      type === 'sightseeing' ||
      type === 'activity' ||
      Boolean(b.package_name) ||
      itemId.startsWith('pkg-') ||
      itemId.startsWith('package-') ||
      itemId.startsWith('craft-') ||
      itemId.startsWith('act-') ||
      itemId.startsWith('sight-') ||
      itemName.includes('package') ||
      itemName.includes('tour') ||
      itemName.includes('trip') ||
      itemName.includes('getaway') ||
      itemName.includes('escape') ||
      itemName.includes('craft my trip') ||
      packageList.some(p => String(p.id) === String(b.item_id) || itemName.includes(p.name.toLowerCase()))
    ) {
      return 'package';
    }

    return 'other';
  };

  // Safe date range normalization across all supported formats
  const getBookingDateRange = (b) => {
    if (!b) return { start: '', end: '' };
    const rawStart = b.pickup_date || b.check_in_date || b.checkin_date || b.departure_date || b.travel_date || b.start_date || (b.created_at ? String(b.created_at).slice(0, 10) : '');
    const rawEnd = b.drop_date || b.check_out_date || b.checkout_date || b.return_date || b.end_date || rawStart;
    const start = normalizeCalendarDate(rawStart);
    const end = normalizeCalendarDate(rawEnd) || start;
    return { start, end };
  };

  const isBookingOnDate = (b, dateStr) => {
    if (b.status === 'Cancelled' || b.status === 'Rejected') return false;
    const { start, end } = getBookingDateRange(b);
    if (!start) return false;
    if (start && end) {
      return dateStr >= start && dateStr <= end;
    }
    return dateStr === start;
  };

  // Filter bookings for a specific day in viewMonth & viewYear
  const getBookingsForDay = (day) => {
    const checkDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    return (liveBookings || []).filter(b => {
      if (!isBookingOnDate(b, checkDateStr)) return false;

      const category = getBookingCategory(b);

      // Filter by category
      if (typeFilter === 'vehicle' && category !== 'vehicle') return false;
      if (typeFilter === 'hotel' && category !== 'hotel') return false;
      if (typeFilter === 'trip' && category !== 'package') return false;
      if (typeFilter === 'flight' && category !== 'flight') return false;

      // Filter by specific item if selected
      if (selectedItem !== 'all') {
        const matchesId = String(b.item_id) === String(selectedItem);
        const matchesName = (b.item_name && b.item_name.toLowerCase().includes(selectedItem.toLowerCase())) ||
                            (b.vehicle_name && b.vehicle_name.toLowerCase().includes(selectedItem.toLowerCase())) ||
                            (b.hotel_name && b.hotel_name.toLowerCase().includes(selectedItem.toLowerCase()));
        if (!matchesId && !matchesName) return false;
      }

      return true;
    });
  };

  // Calculate available inventory for a specific day
  const getAvailableInventoryForDay = (dateStr) => {
    const targetInventory = typeFilter === 'hotel' 
      ? hotelList 
      : typeFilter === 'vehicle' 
        ? vehicleList 
        : (selectedItem !== 'all' 
            ? activeInventory.filter(it => it.name === selectedItem || it.id === selectedItem)
            : [...vehicleList, ...hotelList]);

    return targetInventory.filter(item => {
      // Check blocked dates (hotels)
      if (item.blocked_dates) {
        try {
          const blocked = typeof item.blocked_dates === 'string' ? JSON.parse(item.blocked_dates) : item.blocked_dates;
          if (Array.isArray(blocked) && blocked.includes(dateStr)) return false;
        } catch (e) {}
      }
      // Check active booking conflict
      const hasConflict = (liveBookings || []).some(b => {
        if (!isBookingOnDate(b, dateStr)) return false;
        return (String(b.item_id) === String(item.id)) || 
               (b.item_name && b.item_name.toLowerCase().includes(item.name.toLowerCase())) ||
               (b.vehicle_name && b.vehicle_name.toLowerCase().includes(item.name.toLowerCase())) ||
               (b.hotel_name && b.hotel_name.toLowerCase().includes(item.name.toLowerCase()));
      });
      return !hasConflict;
    });
  };

  // Today Date String
  const todayDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Fix Today Action: navigate to current month, highlight today, and open today's bookings
  const handleTodayClick = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    const day = today.getDate();
    const dayBks = (liveBookings || []).filter(b => isBookingOnDate(b, todayDateStr));
    const availUnits = getAvailableInventoryForDay(todayDateStr);
    setSelectedDayDetails({
      dateStr: todayDateStr,
      day: day,
      bookings: dayBks,
      availableUnits: availUnits,
      isToday: true
    });
  };

  // Dynamic Drill-Down Metrics for Hotels & Vehicles on Today / Current View
  const hotelMetrics = useMemo(() => {
    const bookedIds = new Set();
    (liveBookings || []).forEach(b => {
      if (isBookingOnDate(b, todayDateStr) && getBookingCategory(b) === 'hotel') {
        if (b.item_id) bookedIds.add(String(b.item_id));
        const matched = hotelList.find(h => b.item_name && b.item_name.toLowerCase().includes(h.name.toLowerCase()));
        if (matched) bookedIds.add(String(matched.id));
      }
    });
    const total = hotelList.length;
    const booked = Math.min(total, bookedIds.size);
    const available = Math.max(0, total - booked);
    return { total, booked, available };
  }, [hotelList, liveBookings, todayDateStr]);

  const vehicleMetrics = useMemo(() => {
    const bookedIds = new Set();
    (liveBookings || []).forEach(b => {
      if (isBookingOnDate(b, todayDateStr) && getBookingCategory(b) === 'vehicle') {
        if (b.item_id) bookedIds.add(String(b.item_id));
        const matched = vehicleList.find(v => b.item_name && b.item_name.toLowerCase().includes(v.name.toLowerCase()));
        if (matched) bookedIds.add(String(matched.id));
      }
    });
    const total = vehicleList.length;
    const booked = Math.min(total, bookedIds.size);
    const available = Math.max(0, total - booked);
    return { total, booked, available };
  }, [vehicleList, liveBookings, todayDateStr]);

  // Inventory utilization stats
  const activeInventory = typeFilter === 'hotel' 
    ? hotelList 
    : typeFilter === 'vehicle' 
      ? vehicleList 
      : [...vehicleList, ...hotelList];

  const inventoryStats = activeInventory.map(item => {
    let bookedDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const checkDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isBooked = (liveBookings || []).some(b => {
        if (!isBookingOnDate(b, checkDateStr)) return false;
        return (String(b.item_id) === String(item.id)) || 
               (b.item_name && b.item_name.toLowerCase().includes(item.name.toLowerCase())) ||
               (b.vehicle_name && b.vehicle_name.toLowerCase().includes(item.name.toLowerCase())) ||
               (b.hotel_name && b.hotel_name.toLowerCase().includes(item.name.toLowerCase()));
      });
      if (isBooked) bookedDays++;
    }
    const availableDays = Math.max(0, daysInMonth - bookedDays);
    const occupancy = Math.round((bookedDays / daysInMonth) * 100);

    return {
      ...item,
      bookedDays,
      availableDays,
      occupancy
    };
  });

  return (
    <div className="p-4" style={{ background: '#f8fafc', minHeight: '100%' }}>
      {/* Top Header & Controls */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#0D1B2E' }}>Availability & Reservation Calendar</h4>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
            Real-time inventory availability mapped from live database reservations.
          </p>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          {/* View Filter Buttons */}
          <div className="btn-group btn-group-sm rounded-pill p-1 shadow-sm" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
            <button
              onClick={() => { setTypeFilter('all'); setSelectedItem('all'); setShowAvailableOnly(false); }}
              className={`btn btn-sm rounded-pill px-3 fw-bold border-0 transition-all ${typeFilter === 'all' && !showAvailableOnly ? 'text-white' : 'text-secondary'}`}
              style={{ background: typeFilter === 'all' && !showAvailableOnly ? '#0D1B2E' : 'transparent', fontSize: '0.78rem' }}
            >
              All Inventory
            </button>
            <button
              onClick={() => { setTypeFilter('vehicle'); setSelectedItem('all'); setShowAvailableOnly(false); }}
              className={`btn btn-sm rounded-pill px-3 fw-bold border-0 transition-all ${typeFilter === 'vehicle' && !showAvailableOnly ? 'text-white' : 'text-secondary'}`}
              style={{ background: typeFilter === 'vehicle' && !showAvailableOnly ? '#FF6333' : 'transparent', fontSize: '0.78rem' }}
            >
              Vehicles ({vehicleList.length})
            </button>
            <button
              onClick={() => { setTypeFilter('hotel'); setSelectedItem('all'); setShowAvailableOnly(false); }}
              className={`btn btn-sm rounded-pill px-3 fw-bold border-0 transition-all ${typeFilter === 'hotel' && !showAvailableOnly ? 'text-white' : 'text-secondary'}`}
              style={{ background: typeFilter === 'hotel' && !showAvailableOnly ? '#0284c7' : 'transparent', fontSize: '0.78rem' }}
            >
              Hotels ({hotelList.length})
            </button>
            <button
              onClick={() => { setTypeFilter('trip'); setSelectedItem('all'); setShowAvailableOnly(false); }}
              className={`btn btn-sm rounded-pill px-3 fw-bold border-0 transition-all ${typeFilter === 'trip' && !showAvailableOnly ? 'text-white' : 'text-secondary'}`}
              style={{ background: typeFilter === 'trip' && !showAvailableOnly ? '#059669' : 'transparent', fontSize: '0.78rem' }}
            >
              Trips ({packageList.length})
            </button>
            <button
              onClick={() => setShowAvailableOnly(prev => !prev)}
              className={`btn btn-sm rounded-pill px-3 fw-bold border-0 transition-all ${showAvailableOnly ? 'text-white' : 'text-success'}`}
              style={{ background: showAvailableOnly ? '#16a34a' : 'transparent', fontSize: '0.78rem' }}
              title="Toggle Available units view"
            >
              {showAvailableOnly ? '✓ Available (Active)' : '✓ Available'}
            </button>
          </div>

          {/* Specific Item Selector */}
          <select
            className="form-select form-select-sm shadow-sm"
            style={{ borderRadius: '10px', fontSize: '0.82rem', minWidth: '180px', borderColor: '#e2e8f0' }}
            value={selectedItem}
            onChange={e => setSelectedItem(e.target.value)}
          >
            <option value="all">
              {typeFilter === 'hotel' ? 'Filter Specific Hotel (All)' : typeFilter === 'vehicle' ? 'Filter Specific Vehicle (All)' : typeFilter === 'trip' ? 'Filter Specific Trip (All)' : 'Filter Specific Item (All)'}
            </option>
            {(typeFilter === 'hotel' ? hotelList : typeFilter === 'vehicle' ? vehicleList : typeFilter === 'trip' ? packageList : [...vehicleList, ...hotelList]).map(it => (
              <option key={it.id} value={it.name}>{it.name} ({it.type})</option>
            ))}
          </select>

          {/* Today Button */}
          <button
            onClick={handleTodayClick}
            className="btn btn-sm btn-outline-secondary shadow-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-1.5"
            style={{ fontSize: '0.78rem' }}
            title="Jump to today and view active bookings"
          >
            <Calendar size={13} style={{ color: '#FF6333' }} /> Today
          </button>

          {/* Refresh Button */}
          <button
            onClick={async () => {
              if (onRefresh) await onRefresh();
              try {
                const fresh = await api.fetchBookings();
                if (Array.isArray(fresh)) setLiveBookings(fresh);
              } catch (e) {}
            }}
            className="btn btn-sm btn-outline-secondary shadow-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-1.5"
            style={{ fontSize: '0.78rem' }}
            title="Refresh Availability Calendar"
          >
            <Clock size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Category Drill-Down Banner for Hotel & Vehicle */}
      {typeFilter === 'hotel' && (
        <div className="card border-0 rounded-4 shadow-sm p-3 mb-3 animate-fade-in" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', border: '1px solid rgba(2, 132, 199, 0.2)' }}>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px', background: '#0284c7', color: '#fff' }}>
                <Hotel size={20} />
              </div>
              <div>
                <h6 className="fw-bold mb-0 text-dark font-heading">Hotel Inventory & Reservations</h6>
                <span className="text-muted small">Live room status and property-level availability</span>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="badge px-3 py-2 rounded-pill bg-white text-dark border shadow-xs">
                🏨 <strong>Total Hotels:</strong> {hotelMetrics.total}
              </span>
              <span className="badge px-3 py-2 rounded-pill bg-white text-danger border shadow-xs">
                🔒 <strong>Booked Today:</strong> {hotelMetrics.booked}
              </span>
              <span className="badge px-3 py-2 rounded-pill bg-white text-success border shadow-xs">
                ✓ <strong>Available Today:</strong> {hotelMetrics.available}
              </span>
            </div>
          </div>
        </div>
      )}

      {typeFilter === 'vehicle' && (
        <div className="card border-0 rounded-4 shadow-sm p-3 mb-3 animate-fade-in" style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: '1px solid rgba(255, 99, 51, 0.2)' }}>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px', background: '#FF6333', color: '#fff' }}>
                <Car size={20} />
              </div>
              <div>
                <h6 className="fw-bold mb-0 text-dark font-heading">Vehicle Fleet & Reservations</h6>
                <span className="text-muted small">Car & Bike rental status and fleet-level availability</span>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="badge px-3 py-2 rounded-pill bg-white text-dark border shadow-xs">
                🚗 <strong>Total Vehicles:</strong> {vehicleMetrics.total}
              </span>
              <span className="badge px-3 py-2 rounded-pill bg-white text-danger border shadow-xs">
                🔒 <strong>Booked Today:</strong> {vehicleMetrics.booked}
              </span>
              <span className="badge px-3 py-2 rounded-pill bg-white text-success border shadow-xs">
                ✓ <strong>Available Today:</strong> {vehicleMetrics.available}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Legend & Month Navigation Bar */}
      <div className="card border-0 rounded-4 shadow-sm p-3 mb-3" style={{ background: '#fff' }}>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          {/* Month Controller */}
          <div className="d-flex align-items-center gap-2">
            <button onClick={prevMonth} className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center border-0 shadow-sm" style={{ width: '34px', height: '34px', background: '#f1f5f9' }}>
              <ChevronLeft size={16} />
            </button>
            <h5 className="fw-bold mb-0 px-2 font-heading" style={{ color: '#0D1B2E', minWidth: '170px', textAlign: 'center' }}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h5>
            <button onClick={nextMonth} className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center border-0 shadow-sm" style={{ width: '34px', height: '34px', background: '#f1f5f9' }}>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Color Badges & Interactive Legend Toggles */}
          <div className="d-flex align-items-center gap-3 flex-wrap">
            {/* Vehicle Booking filter toggle */}
            <div 
              onClick={() => {
                setTypeFilter(prev => prev === 'vehicle' ? 'all' : 'vehicle');
                setSelectedItem('all');
                setShowAvailableOnly(false);
              }}
              className="d-flex align-items-center gap-1.5 cursor-pointer px-2 py-1 rounded transition-all"
              style={{
                background: typeFilter === 'vehicle' ? '#dbeafe' : 'transparent',
                border: typeFilter === 'vehicle' ? '1px solid #2563eb' : '1px solid transparent',
                borderRadius: '6px'
              }}
              title="Click to view only Vehicle Bookings"
            >
              <div style={{ width: '12px', height: '12px', background: '#dbeafe', border: '1px solid #2563eb', borderRadius: '3px' }} />
              <span style={{ fontSize: '0.74rem', color: typeFilter === 'vehicle' ? '#1e40af' : '#475569', fontWeight: 600 }}>Vehicle Booking</span>
            </div>

            {/* Hotel Booking filter toggle */}
            <div 
              onClick={() => {
                setTypeFilter(prev => prev === 'hotel' ? 'all' : 'hotel');
                setSelectedItem('all');
                setShowAvailableOnly(false);
              }}
              className="d-flex align-items-center gap-1.5 cursor-pointer px-2 py-1 rounded transition-all"
              style={{
                background: typeFilter === 'hotel' ? '#e0f2fe' : 'transparent',
                border: typeFilter === 'hotel' ? '1px solid #0284c7' : '1px solid transparent',
                borderRadius: '6px'
              }}
              title="Click to view only Hotel Bookings"
            >
              <div style={{ width: '12px', height: '12px', background: '#e0f2fe', border: '1px solid #0284c7', borderRadius: '3px' }} />
              <span style={{ fontSize: '0.74rem', color: typeFilter === 'hotel' ? '#0369a1' : '#475569', fontWeight: 600 }}>Hotel Booking</span>
            </div>

            {/* Today jump & filter button */}
            <div 
              onClick={handleTodayClick}
              className="d-flex align-items-center gap-1.5 cursor-pointer px-2 py-1 rounded transition-all"
              style={{
                background: selectedDayDetails?.isToday ? '#FFF5F2' : 'transparent',
                border: selectedDayDetails?.isToday ? '1px solid #FF6333' : '1px solid transparent',
                borderRadius: '6px'
              }}
              title="Click to jump to and view Today's active bookings"
            >
              <div style={{ width: '12px', height: '12px', background: '#FFF5F2', border: '1px solid #FF6333', borderRadius: '3px' }} />
              <span style={{ fontSize: '0.74rem', color: '#FF6333', fontWeight: 700 }}>Today</span>
            </div>

            {/* Available mode toggle */}
            <div 
              onClick={() => setShowAvailableOnly(prev => !prev)}
              className="d-flex align-items-center gap-1.5 cursor-pointer px-2 py-1 rounded transition-all"
              style={{
                background: showAvailableOnly ? '#dcfce7' : 'transparent',
                border: showAvailableOnly ? '1px solid #16a34a' : '1px solid transparent',
                borderRadius: '6px'
              }}
              title="Click to view Available inventory units per day"
            >
              <div style={{ width: '12px', height: '12px', background: '#dcfce7', border: '1px solid #16a34a', borderRadius: '3px' }} />
              <span style={{ fontSize: '0.74rem', color: showAvailableOnly ? '#15803d' : '#16a34a', fontWeight: 700 }}>
                {showAvailableOnly ? '✓ Available (Active)' : 'Available'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Calendar Grid */}
      <div className="card border-0 rounded-4 shadow-sm overflow-hidden mb-4" style={{ background: '#fff' }}>
        {/* Day Name Headers */}
        <div className="d-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          {DAYS.map(d => (
            <div key={d} className="text-center py-2.5 fw-bold" style={{ fontSize: '0.72rem', color: '#64748b', letterSpacing: '0.5px' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="d-grid p-2" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
          {emptyBefore.map(i => <div key={`empty-${i}`} className="rounded-3" style={{ minHeight: '88px', background: '#f8fafc', opacity: 0.5 }} />)}
          {days.map(day => {
            const dayBookings = getBookingsForDay(day);
            const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
            const hasBookings = dayBookings.length > 0;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const availableUnits = getAvailableInventoryForDay(dateStr);

            return (
              <div
                key={day}
                onClick={() => setSelectedDayDetails({ dateStr, day, bookings: dayBookings, availableUnits, isToday })}
                className="rounded-3 p-2 d-flex flex-column transition-all"
                style={{
                  minHeight: '94px',
                  background: isToday ? '#FFF5F2' : hasBookings ? '#f8fafc' : '#fff',
                  border: isToday ? '2px solid #FF6333' : hasBookings ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                  cursor: 'pointer'
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <span className="fw-bold" style={{ fontSize: '0.82rem', color: isToday ? '#FF6333' : '#0D1B2E' }}>
                    {day} {isToday && <span className="badge bg-danger p-0 px-1" style={{ fontSize: '0.58rem' }}>TODAY</span>}
                  </span>
                  
                  <div className="d-flex align-items-center gap-1">
                    {/* Available count badge if Available filter active */}
                    {showAvailableOnly ? (
                      <span className="badge rounded-pill bg-success" style={{ fontSize: '0.6rem', padding: '2px 6px' }} title={`${availableUnits.length} units available on this date`}>
                        ✓ {availableUnits.length} Free
                      </span>
                    ) : hasBookings && (
                      <span className="badge rounded-pill" style={{ background: '#2563eb', fontSize: '0.6rem', padding: '2px 6px' }}>
                        {dayBookings.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Available highlight mode if toggled */}
                {showAvailableOnly && (
                  <div className="text-success small fw-bold mb-1" style={{ fontSize: '0.62rem' }}>
                    ✓ {availableUnits.length} Available
                  </div>
                )}

                {/* Booking mini event cards */}
                <div className="d-flex flex-column gap-1 overflow-hidden">
                  {dayBookings.slice(0, 2).map((b, idx) => {
                    const cat = getBookingCategory(b);
                    const isH = cat === 'hotel';
                    const isPkg = cat === 'package';
                    const catEmoji = isH ? '🏨' : isPkg ? '📦' : '🚗';
                    const displayItem = b.vehicle_name || b.hotel_name || b.package_name || b.item_name || 'Booked Item';

                    return (
                      <div
                        key={b.id || idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewBookingModal(b);
                        }}
                        className="rounded p-1 text-truncate hover-scale"
                        title={`${catEmoji} ${displayItem} · Customer: ${b.name || 'Guest'} (${b.status || 'Confirmed'})`}
                        style={{
                          background: isH ? '#e0f2fe' : isPkg ? '#fef3c7' : '#dbeafe',
                          color: isH ? '#0369a1' : isPkg ? '#92400e' : '#1e40af',
                          borderLeft: `3px solid ${isH ? '#0284c7' : isPkg ? '#f59e0b' : '#2563eb'}`,
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          lineHeight: 1.2
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between gap-1">
                          <span className="text-truncate">
                            {catEmoji} {displayItem}
                          </span>
                          <span className="badge p-0 px-1" style={{ fontSize: '0.52rem', background: b.status === 'Confirmed' ? '#dcfce7' : '#fef9c3', color: b.status === 'Confirmed' ? '#15803d' : '#854d0e' }}>
                            {b.status || 'OK'}
                          </span>
                        </div>
                        <div className="text-truncate mt-0.5" style={{ fontSize: '0.56rem', fontWeight: 500, opacity: 0.85 }}>
                          👤 {b.name || 'Guest'} {b.pickup_time ? `• ⏰ ${b.pickup_time}` : ''}
                        </div>
                      </div>
                    );
                  })}

                  {dayBookings.length > 2 && (
                    <div style={{ fontSize: '0.6rem', color: '#2563eb', fontWeight: 700 }}>
                      +{dayBookings.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Modal / Drawer */}
      {selectedDayDetails && (
        <div className="card border-0 rounded-4 shadow-sm p-4 mb-4 animate-fade-in" style={{ background: '#fff', borderLeft: '4px solid #FF6333' }}>
          <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
            <div>
              <h6 className="fw-bold mb-0 font-heading" style={{ color: '#0D1B2E' }}>
                {selectedDayDetails.isToday ? '🔥 Today\'s Schedule — ' : 'Reservations & Availability — '} 
                {MONTH_NAMES[viewMonth]} {selectedDayDetails.day}, {viewYear}
              </h6>
              <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                {selectedDayDetails.bookings.length} active reservation(s) • {(selectedDayDetails.availableUnits || []).length} available inventory unit(s)
              </span>
            </div>
            <button
              onClick={() => setSelectedDayDetails(null)}
              className="btn btn-sm btn-outline-secondary rounded-pill px-3"
            >
              Close
            </button>
          </div>

          {selectedDayDetails.bookings.length === 0 ? (
            <div className="p-3 text-center text-muted bg-light rounded-3 mb-3" style={{ fontSize: '0.82rem' }}>
              No bookings active on this date. All inventory units available.
            </div>
          ) : (
            <div className="table-responsive mb-3">
              <table className="table align-middle small mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Category</th>
                    <th>Booking ID</th>
                    <th>Customer</th>
                    <th>Inventory Item</th>
                    <th>Dates / Schedule</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDayDetails.bookings.map(b => {
                    const cat = getBookingCategory(b);
                    const isH = cat === 'hotel';
                    const isPkg = cat === 'package';
                    const catEmoji = isH ? '🏨 Hotel' : isPkg ? '📦 Package' : '🚗 Vehicle';

                    return (
                      <tr key={b.id}>
                        <td>
                          <span className="badge rounded-pill px-2.5 py-1 fw-bold" style={{
                            background: isH ? '#e0f2fe' : isPkg ? '#fef3c7' : '#dbeafe',
                            color: isH ? '#0369a1' : isPkg ? '#92400e' : '#1e40af',
                            fontSize: '0.7rem'
                          }}>
                            {catEmoji}
                          </span>
                        </td>
                        <td className="fw-bold text-primary">#{b.id}</td>
                        <td>
                          <div className="fw-semibold">{b.name || b.customer_name || 'Guest'}</div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>{b.phone || '—'}</div>
                        </td>
                        <td className="fw-bold" style={{ color: '#0D1B2E' }}>
                          {b.vehicle_name || b.hotel_name || b.package_name || b.item_name || 'Item'}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.75rem' }}>
                            {b.pickup_date || b.checkin_date || '—'} → {b.drop_date || b.checkout_date || '—'}
                          </div>
                          {b.pickup_time && (
                            <span className="text-muted text-xs">⏰ {b.pickup_time}</span>
                          )}
                        </td>
                        <td className="fw-bold text-success">
                          ₹{b.total_paid || b.total_amount || 0}
                        </td>
                        <td>
                          <span className={`badge ${b.status === 'Confirmed' ? 'bg-success' : 'bg-warning text-dark'}`}>
                            {b.status || 'Confirmed'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => setViewBookingModal(b)}
                            className="btn btn-sm btn-outline-primary py-1 px-2.5 d-flex align-items-center gap-1 rounded-pill"
                            style={{ fontSize: '0.74rem' }}
                          >
                            <Eye size={12} /> Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Available Units on Selected Date */}
          {selectedDayDetails.availableUnits && selectedDayDetails.availableUnits.length > 0 && (
            <div className="border-top pt-3 mt-2">
              <h6 className="fw-bold mb-2 text-success font-heading" style={{ fontSize: '0.85rem' }}>
                ✓ Available Inventory Units on {selectedDayDetails.dateStr} ({selectedDayDetails.availableUnits.length} Units Free)
              </h6>
              <div className="d-flex flex-wrap gap-2">
                {selectedDayDetails.availableUnits.slice(0, 16).map(it => (
                  <span 
                    key={it.id} 
                    className="badge bg-light text-dark border px-2.5 py-1.5 rounded-pill shadow-xs d-flex align-items-center gap-1.5"
                    style={{ fontSize: '0.74rem' }}
                  >
                    {it.type === 'hotel' ? '🏨' : it.type === 'bike' ? '🏍️' : '🚗'} <strong>{it.name}</strong> (₹{it.price}/day)
                  </span>
                ))}
                {selectedDayDetails.availableUnits.length > 16 && (
                  <span className="badge bg-secondary text-white px-2 py-1.5 rounded-pill" style={{ fontSize: '0.74rem' }}>
                    +{selectedDayDetails.availableUnits.length - 16} more units available
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comprehensive Individual Booking Details Modal */}
      {viewBookingModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
              <div className="modal-header border-0 px-4 pt-4 pb-3" style={{ background: '#0D1B2E', color: '#fff' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', background: 'rgba(255,99,51,0.15)', color: '#FF6333' }}>
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-0">Booking #{viewBookingModal.id}</h5>
                    <span className="text-white-50 small">Reservation details and customer information</span>
                  </div>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setViewBookingModal(null)} />
              </div>

              <div className="modal-body p-4 text-start bg-light">
                <div className="row g-3">
                  {/* Category & Status */}
                  <div className="col-12 d-flex align-items-center gap-2 flex-wrap pb-2 border-bottom">
                    <span className="badge rounded-pill px-3 py-1.5 fw-bold" style={{
                      background: getBookingCategory(viewBookingModal) === 'hotel' ? '#e0f2fe' : getBookingCategory(viewBookingModal) === 'package' ? '#fef3c7' : '#dbeafe',
                      color: getBookingCategory(viewBookingModal) === 'hotel' ? '#0369a1' : getBookingCategory(viewBookingModal) === 'package' ? '#92400e' : '#1e40af',
                      fontSize: '0.82rem'
                    }}>
                      {getBookingCategory(viewBookingModal) === 'hotel' ? '🏨 Hotel Booking' : getBookingCategory(viewBookingModal) === 'package' ? '📦 Holiday Package' : '🚗 Vehicle Rental'}
                    </span>
                    <span className="badge rounded-pill px-3 py-1.5 fw-bold bg-success" style={{ fontSize: '0.82rem' }}>
                      {viewBookingModal.status || 'Confirmed'}
                    </span>
                    <span className="badge rounded-pill px-3 py-1.5 fw-bold bg-secondary" style={{ fontSize: '0.82rem' }}>
                      Payment: {viewBookingModal.payment_status || 'Paid'}
                    </span>
                  </div>

                  {/* Customer Information */}
                  <div className="col-md-6">
                    <div className="card p-3 border-0 shadow-sm rounded-3 h-100 bg-white">
                      <h6 className="fw-bold text-secondary text-uppercase mb-3" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                        Customer Details
                      </h6>
                      <div className="fw-bold fs-6 text-dark mb-1">{viewBookingModal.name || viewBookingModal.customer_name || 'Guest'}</div>
                      <div className="text-muted small d-flex align-items-center gap-1 mb-1">
                        <Phone size={13} /> {viewBookingModal.phone || 'No phone'}
                      </div>
                      <div className="text-muted small d-flex align-items-center gap-1 mb-2">
                        <Mail size={13} /> {viewBookingModal.email || 'No email'}
                      </div>
                      {viewBookingModal.license && (
                        <div className="small text-secondary">
                          <strong>License:</strong> {viewBookingModal.license}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Item Details */}
                  <div className="col-md-6">
                    <div className="card p-3 border-0 shadow-sm rounded-3 h-100 bg-white">
                      <h6 className="fw-bold text-secondary text-uppercase mb-3" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                        Reserved Item / Service
                      </h6>
                      <div className="fw-bold fs-6 text-primary mb-1">
                        {viewBookingModal.vehicle_name || viewBookingModal.hotel_name || viewBookingModal.package_name || viewBookingModal.item_name || 'Item'}
                      </div>
                      <div className="text-muted small mb-2">
                        <strong>Item ID:</strong> {viewBookingModal.item_id || '—'}
                      </div>
                      <div className="text-muted small d-flex align-items-center gap-1">
                        <MapPin size={13} /> Pickup / Location: {viewBookingModal.pickup_loc || 'Goa'}
                      </div>
                    </div>
                  </div>

                  {/* Dates & Schedule */}
                  <div className="col-md-6">
                    <div className="card p-3 border-0 shadow-sm rounded-3 h-100 bg-white">
                      <h6 className="fw-bold text-secondary text-uppercase mb-2" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                        Schedule / Dates
                      </h6>
                      <div className="small text-dark mb-1">
                        <strong>Start / Pickup:</strong> {viewBookingModal.pickup_date || viewBookingModal.checkin_date || '—'} {viewBookingModal.pickup_time ? `(${viewBookingModal.pickup_time})` : ''}
                      </div>
                      <div className="small text-dark mb-1">
                        <strong>End / Drop:</strong> {viewBookingModal.drop_date || viewBookingModal.checkout_date || '—'} {viewBookingModal.drop_time ? `(${viewBookingModal.drop_time})` : ''}
                      </div>
                      <div className="small text-muted">
                        <strong>Duration:</strong> {viewBookingModal.booking_days || 1} day(s)
                      </div>
                    </div>
                  </div>

                  {/* Financial Details */}
                  <div className="col-md-6">
                    <div className="card p-3 border-0 shadow-sm rounded-3 h-100 bg-white">
                      <h6 className="fw-bold text-secondary text-uppercase mb-2" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                        Financial & Payment
                      </h6>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small text-muted">Total Amount:</span>
                        <strong className="fs-6 text-success">₹{Number(viewBookingModal.total_amount || viewBookingModal.total_paid || 0).toLocaleString()}</strong>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small text-muted">Amount Paid:</span>
                        <span className="small fw-bold text-dark">₹{Number(viewBookingModal.amount_paid || viewBookingModal.total_paid || 0).toLocaleString()}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="small text-muted">Payment Method:</span>
                        <span className="small fw-semibold">{viewBookingModal.payment_method || 'Cash / Online'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Driver Information if assigned */}
                  {Boolean(viewBookingModal.assigned_driver_id || viewBookingModal.driver_required) && (
                    <div className="col-12">
                      <div className="card p-3 border-0 shadow-sm rounded-3 bg-white">
                        <h6 className="fw-bold text-secondary text-uppercase mb-1" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                          Driver Assignment
                        </h6>
                        <span className="small text-dark">
                          Driver {viewBookingModal.assigned_driver_name || viewBookingModal.assigned_driver_id ? `Assigned: ${viewBookingModal.assigned_driver_name || viewBookingModal.assigned_driver_id}` : 'Required (Pending Assignment)'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer border-0 px-4 py-3 bg-white">
                <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setViewBookingModal(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Utilization Table */}
      <div className="card border-0 rounded-4 shadow-sm overflow-hidden" style={{ background: '#fff' }}>
        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
          <h6 className="fw-bold mb-0 font-heading" style={{ color: '#0D1B2E' }}>
            Inventory Utilization Summary ({MONTH_NAMES[viewMonth]} {viewYear})
          </h6>
          <span className="text-muted" style={{ fontSize: '0.78rem' }}>
            {inventoryStats.length} properties & vehicles tracked
          </span>
        </div>

        <div className="table-responsive">
          <table className="table align-middle mb-0" style={{ fontSize: '0.82rem' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th className="px-4 py-3 fw-bold text-secondary text-uppercase" style={{ fontSize: '0.68rem' }}>Inventory Item</th>
                <th className="px-3 py-3 fw-bold text-secondary text-uppercase" style={{ fontSize: '0.68rem' }}>Type</th>
                <th className="px-3 py-3 fw-bold text-secondary text-uppercase" style={{ fontSize: '0.68rem' }}>Booked Days</th>
                <th className="px-3 py-3 fw-bold text-secondary text-uppercase" style={{ fontSize: '0.68rem' }}>Available Days</th>
                <th className="px-4 py-3 fw-bold text-secondary text-uppercase" style={{ fontSize: '0.68rem' }}>Monthly Occupancy</th>
              </tr>
            </thead>
            <tbody>
              {inventoryStats.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td className="px-4 py-2.5 fw-bold" style={{ color: '#0D1B2E' }}>
                    {item.name}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="badge rounded-pill px-2.5 py-1 text-uppercase" style={{
                      background: item.type === 'car' ? '#dbeafe' : item.type === 'bike' ? '#ede9fe' : '#e0f2fe',
                      color: item.type === 'car' ? '#1d4ed8' : item.type === 'bike' ? '#6d28d9' : '#0369a1',
                      fontSize: '0.65rem'
                    }}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 fw-bold" style={{ color: item.bookedDays > 0 ? '#2563eb' : '#64748b' }}>
                    {item.bookedDays} days
                  </td>
                  <td className="px-3 py-2.5 fw-bold" style={{ color: '#16a34a' }}>
                    {item.availableDays} days
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="d-flex align-items-center gap-2" style={{ maxWidth: '180px' }}>
                      <div className="flex-grow-1 rounded-pill overflow-hidden" style={{ height: '6px', background: '#f1f5f9' }}>
                        <div
                          className="rounded-pill"
                          style={{
                            width: `${item.occupancy}%`,
                            height: '100%',
                            background: item.occupancy >= 70 ? '#dc2626' : item.occupancy >= 30 ? '#d97706' : '#16a34a'
                          }}
                        />
                      </div>
                      <span className="fw-bold" style={{ fontSize: '0.74rem', color: '#0D1B2E' }}>
                        {item.occupancy}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {inventoryStats.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-muted">No inventory items found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
