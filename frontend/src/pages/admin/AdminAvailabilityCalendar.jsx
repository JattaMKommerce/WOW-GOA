import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar, Hotel, Car, CheckCircle2, 
  Clock, Users, X, Eye, Phone, Mail, MapPin, Package, 
  Plane, Search, RefreshCw, BarChart3, CheckCircle
} from 'lucide-react';
import * as api from '../../services/api';
import { vehicleUnitsData } from '../../data/mockData';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

// Enterprise Status Badge Color Resolution
function getStatusStyle(rawStatus) {
  const s = String(rawStatus || '').trim().toLowerCase();
  if (s === 'confirmed' || s === 'success') {
    return { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', label: 'Confirmed' };
  }
  if (s === 'completed') {
    return { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', label: 'Completed' };
  }
  if (s.includes('check') && s.includes('in')) {
    return { bg: '#fffbeb', color: '#92400e', border: '#fde68a', label: 'Checked In' };
  }
  if (s.includes('check') && s.includes('out')) {
    return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0', label: 'Checked Out' };
  }
  if (s === 'pickup' || s === 'picked up') {
    return { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe', label: 'Pickup' };
  }
  if (s === 'pending') {
    return { bg: '#fffbeb', color: '#92400e', border: '#fde68a', label: 'Pending' };
  }
  if (s === 'cancelled' || s === 'rejected') {
    return { bg: '#fef2f2', color: '#991b1b', border: '#fecaca', label: 'Cancelled' };
  }
  return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0', label: rawStatus || 'Active' };
}

export default function AdminAvailabilityCalendar({
  currentUser,
  hotels = [],
  cars = [],
  bikes = [],
  packages = [],
  vehicleUnits: propVehicleUnits = [],
  bookings: propBookings = [],
  onRefresh
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'vehicle' | 'hotel' | 'package' | 'flight'
  const [selectedItem, setSelectedItem] = useState('all');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [selectedDayDetails, setSelectedDayDetails] = useState(null);
  const [viewBookingModal, setViewBookingModal] = useState(null);
  const [liveBookings, setLiveBookings] = useState(propBookings);
  const [vehicleUnits, setVehicleUnits] = useState(() => (Array.isArray(propVehicleUnits) && propVehicleUnits.length > 0 ? propVehicleUnits : (vehicleUnitsData || [])));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUtilizationModal, setShowUtilizationModal] = useState(false);
  const [drawerTab, setDrawerTab] = useState('bookings'); // 'bookings' | 'available'
  const [utilizationSearch, setUtilizationSearch] = useState('');

  // Today Date String (YYYY-MM-DD)
  const todayDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Synchronize bookings when prop changes
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

  // Synchronize vehicle units when prop changes or load fresh from API
  const loadVehicleUnits = async () => {
    try {
      const units = await api.fetchVehicleUnits({ status: 'Active' });
      if (Array.isArray(units) && units.length > 0) {
        setVehicleUnits(units);
      }
    } catch (e) {
      console.warn('[Calendar] Error loading vehicle units:', e);
    }
  };

  useEffect(() => {
    if (Array.isArray(propVehicleUnits) && propVehicleUnits.length > 0) {
      setVehicleUnits(propVehicleUnits);
    } else {
      loadVehicleUnits();
    }
  }, [propVehicleUnits]);

  // Real-time synchronization engine
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

  useEffect(() => {
    const handleSync = (e) => {
      if (e?.detail) {
        setLiveBookings(prev => {
          const exists = prev.some(b => String(b.id) === String(e.detail.id));
          return exists ? prev.map(b => String(b.id) === String(e.detail.id) ? { ...b, ...e.detail } : b) : [e.detail, ...prev];
        });
      }
      fetchFreshBookings();
      loadVehicleUnits();
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
        bc.onmessage = () => { fetchFreshBookings(); loadVehicleUnits(); };
      }
    } catch (e) {}

    const interval = setInterval(() => {
      fetchFreshBookings();
      loadVehicleUnits();
    }, 5000);

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

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (typeof onRefresh === 'function') await onRefresh();
      await Promise.all([fetchFreshBookings(), loadVehicleUnits()]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 450);
    }
  };

  // Vendor Isolation RBAC Check
  const isVendorUser = Boolean(currentUser && (currentUser.role === 'vendor' || currentUser.role === 'vehicle_vendor'));
  const currentVendorId = isVendorUser ? String(currentUser.id || currentUser.username || '') : null;

  // Active physical units respecting vendor isolation, enriched with model names
  const activePhysicalUnits = useMemo(() => {
    const modelMap = {};
    (cars || []).forEach(c => { if (c?.id) modelMap[String(c.id)] = c.name; });
    (bikes || []).forEach(b => { if (b?.id) modelMap[String(b.id)] = b.name; });

    return (vehicleUnits || []).filter(u => {
      const isAct = u.status === 'Active' || !u.status;
      if (!isAct) return false;
      if (isVendorUser && currentVendorId) {
        return String(u.vendor_id || '') === currentVendorId;
      }
      return true;
    }).map(u => ({
      ...u,
      vehicle_name: u.vehicle_name || modelMap[String(u.vehicle_id)] || u.unit_name || 'Vehicle'
    }));
  }, [vehicleUnits, cars, bikes, isVendorUser, currentVendorId]);

  // Inventory lists from authoritative database models with physical fleet counts
  const vehicleList = useMemo(() => {
    const rawList = [
      ...(cars || []).map(c => ({
        id: c.id,
        name: c.name,
        type: 'car',
        category: c.category || 'Car',
        price: c.price,
        is_available: c.is_available,
        vendor_id: c.vendor_id,
        fleet_count: activePhysicalUnits.filter(u => u.vehicle_id === c.id).length || c.fleet_count || 1
      })),
      ...(bikes || []).map(b => ({
        id: b.id,
        name: b.name,
        type: 'bike',
        category: b.category || 'Bike',
        price: b.price,
        is_available: b.is_available,
        vendor_id: b.vendor_id,
        fleet_count: activePhysicalUnits.filter(u => u.vehicle_id === b.id).length || b.fleet_count || 1
      }))
    ];

    if (isVendorUser && currentVendorId) {
      return rawList.filter(v => String(v.vendor_id || '') === currentVendorId);
    }
    return rawList;
  }, [cars, bikes, activePhysicalUnits, isVendorUser, currentVendorId]);

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

    // 3. Vehicle check
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
    if (!b) return false;
    const status = String(b.status || '').trim().toLowerCase();
    if (['cancelled', 'rejected', 'failed'].includes(status)) return false;
    const { start, end } = getBookingDateRange(b);
    if (!start) return false;
    if (start && end) {
      return dateStr >= start && dateStr <= end;
    }
    return dateStr === start;
  };

  // True physical vehicle unit availability calculation
  // Formula: availableVehicles = totalPhysicalVehicles - bookedPhysicalVehicles
  const getVehicleAvailabilityForDay = (dateStr, modelFilter = null) => {
    let unitsInScope = activePhysicalUnits;
    if (modelFilter && modelFilter !== 'all') {
      const q = String(modelFilter).toLowerCase().trim();
      unitsInScope = unitsInScope.filter(u => 
        String(u.vehicle_id).toLowerCase() === q ||
        String(u.vehicle_name || '').toLowerCase() === q ||
        String(u.unit_name || '').toLowerCase().includes(q)
      );
    }

    // Active vehicle bookings overlapping dateStr
    const activeVehicleBookings = (liveBookings || []).filter(b => {
      if (!isBookingOnDate(b, dateStr)) return false;
      if (getBookingCategory(b) !== 'vehicle') return false;
      if (isVendorUser && currentVendorId) {
        if (b.vendor_id && String(b.vendor_id) !== currentVendorId) return false;
      }
      return true;
    });

    const bookedUnitIdSet = new Set();

    // 1st Pass: Match bookings with explicit physical_unit_id
    activeVehicleBookings.forEach(b => {
      const pid = b.physical_unit_id ? String(b.physical_unit_id).trim() : '';
      if (pid) {
        bookedUnitIdSet.add(pid);
      }
    });

    // 2nd Pass: Fallback for bookings without physical_unit_id (match to unbooked unit of that model)
    activeVehicleBookings.forEach(b => {
      const pid = b.physical_unit_id ? String(b.physical_unit_id).trim() : '';
      if (!pid) {
        const bItemId = String(b.item_id || '').toLowerCase();
        const bItemName = String(b.item_name || b.vehicle_name || '').toLowerCase();
        const candidateUnit = activePhysicalUnits.find(u => 
          !bookedUnitIdSet.has(u.id) && (
            String(u.vehicle_id).toLowerCase() === bItemId ||
            (bItemName && u.vehicle_name && bItemName.includes(u.vehicle_name.toLowerCase())) ||
            (bItemName && u.unit_name && bItemName.includes(u.unit_name.toLowerCase()))
          )
        );
        if (candidateUnit) {
          bookedUnitIdSet.add(candidateUnit.id);
        }
      }
    });

    // Total and booked within unitsInScope
    const bookedPhysicalVehicles = unitsInScope.filter(u => bookedUnitIdSet.has(u.id)).length;
    const totalPhysicalVehicles = unitsInScope.length;
    const availableVehicles = Math.max(0, totalPhysicalVehicles - bookedPhysicalVehicles);
    const availableUnits = unitsInScope.filter(u => !bookedUnitIdSet.has(u.id));

    // Per-model breakdown
    const modelBreakdown = {};
    unitsInScope.forEach(u => {
      const mId = u.vehicle_id || u.id;
      const mName = u.vehicle_name || u.unit_name || 'Vehicle';
      if (!modelBreakdown[mId]) {
        modelBreakdown[mId] = {
          vehicle_id: mId,
          vehicle_name: mName,
          total: 0,
          booked: 0,
          available: 0
        };
      }
      modelBreakdown[mId].total++;
      if (bookedUnitIdSet.has(u.id)) {
        modelBreakdown[mId].booked++;
      }
    });
    Object.values(modelBreakdown).forEach(m => {
      m.available = Math.max(0, m.total - m.booked);
    });

    return {
      totalPhysicalVehicles,
      bookedPhysicalVehicles,
      availableVehicles,
      availableUnits,
      bookedUnitIdSet,
      modelBreakdown
    };
  };

  // Calculate available inventory for a specific day
  const getAvailableInventoryForDay = (dateStr) => {
    if (typeFilter === 'vehicle') {
      const vehAvail = getVehicleAvailabilityForDay(dateStr, selectedItem);
      return vehAvail.availableUnits;
    }

    if (typeFilter === 'hotel') {
      return hotelList.filter(item => {
        if (selectedItem !== 'all' && item.name !== selectedItem && String(item.id) !== String(selectedItem)) return false;
        if (item.blocked_dates) {
          try {
            const blocked = typeof item.blocked_dates === 'string' ? JSON.parse(item.blocked_dates) : item.blocked_dates;
            if (Array.isArray(blocked) && blocked.includes(dateStr)) return false;
          } catch (e) {}
        }
        const hasConflict = (liveBookings || []).some(b => {
          if (!isBookingOnDate(b, dateStr)) return false;
          return (String(b.item_id) === String(item.id)) || 
                 (b.item_name && b.item_name.toLowerCase().includes(item.name.toLowerCase())) ||
                 (b.hotel_name && b.hotel_name.toLowerCase().includes(item.name.toLowerCase()));
        });
        return !hasConflict;
      });
    }

    // typeFilter === 'all'
    const vehAvail = getVehicleAvailabilityForDay(dateStr, selectedItem !== 'all' ? selectedItem : null);
    const availHotels = hotelList.filter(item => {
      if (selectedItem !== 'all' && item.name !== selectedItem && String(item.id) !== String(selectedItem)) return false;
      if (item.blocked_dates) {
        try {
          const blocked = typeof item.blocked_dates === 'string' ? JSON.parse(item.blocked_dates) : item.blocked_dates;
          if (Array.isArray(blocked) && blocked.includes(dateStr)) return false;
        } catch (e) {}
      }
      const hasConflict = (liveBookings || []).some(b => {
        if (!isBookingOnDate(b, dateStr)) return false;
        return (String(b.item_id) === String(item.id)) || 
               (b.item_name && b.item_name.toLowerCase().includes(item.name.toLowerCase())) ||
               (b.hotel_name && b.hotel_name.toLowerCase().includes(item.name.toLowerCase()));
      });
      return !hasConflict;
    });

    if (selectedItem !== 'all') {
      if (vehAvail.totalPhysicalVehicles > 0) return vehAvail.availableUnits;
      return availHotels;
    }

    return [...vehAvail.availableUnits, ...availHotels];
  };

  // Filter bookings for a specific day in viewMonth & viewYear
  const getBookingsForDay = (y, m, d) => {
    const checkDateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    return (liveBookings || []).filter(b => {
      if (!isBookingOnDate(b, checkDateStr)) return false;

      const category = getBookingCategory(b);

      // Filter by category
      if (typeFilter === 'vehicle' && category !== 'vehicle') return false;
      if (typeFilter === 'hotel' && category !== 'hotel') return false;
      if (typeFilter === 'package' && category !== 'package') return false;
      if (typeFilter === 'flight' && category !== 'flight') return false;

      // Filter by specific item if selected
      if (selectedItem !== 'all') {
        const matchesId = String(b.item_id) === String(selectedItem);
        const matchesName = (b.item_name && b.item_name.toLowerCase().includes(selectedItem.toLowerCase())) ||
                            (b.vehicle_name && b.vehicle_name.toLowerCase().includes(selectedItem.toLowerCase())) ||
                            (b.hotel_name && b.hotel_name.toLowerCase().includes(selectedItem.toLowerCase())) ||
                            (b.package_name && b.package_name.toLowerCase().includes(selectedItem.toLowerCase()));
        if (!matchesId && !matchesName) return false;
      }

      return true;
    });
  };

  // Navigation handlers
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleTodayClick = () => {
    const curYear = today.getFullYear();
    const curMonth = today.getMonth();
    const curDay = today.getDate();
    
    setViewYear(curYear);
    setViewMonth(curMonth);
    
    const dayBks = getBookingsForDay(curYear, curMonth, curDay);
    const availUnits = getAvailableInventoryForDay(todayDateStr);
    
    setSelectedDayDetails({
      dateStr: todayDateStr,
      day: curDay,
      month: curMonth,
      year: curYear,
      bookings: dayBks,
      availableUnits: availUnits,
      isToday: true
    });
    setDrawerTab('bookings');
  };

  // Open day inspector drawer directly
  const openDayDrawer = (cell) => {
    const { day, month, year, dateStr, isToday } = cell;
    const dayBookings = getBookingsForDay(year, month, day);
    const availableUnits = getAvailableInventoryForDay(dateStr);
    
    setSelectedDayDetails({
      dateStr,
      day,
      month,
      year,
      bookings: dayBookings,
      availableUnits,
      isToday
    });
    setDrawerTab('bookings');
  };

  // Build the complete 7-column calendar grid with leading & trailing days
  const calendarCells = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 for Sun, 1 for Mon, etc.
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const cells = [];

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = viewMonth === 0 ? 11 : viewMonth - 1;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        day: d,
        month: m,
        year: y,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayDateStr
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        day: d,
        month: viewMonth,
        year: viewYear,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayDateStr
      });
    }

    // Trailing days from next month to complete the row
    const remainder = cells.length % 7;
    if (remainder !== 0) {
      const needed = 7 - remainder;
      for (let d = 1; d <= needed; d++) {
        const m = viewMonth === 11 ? 0 : viewMonth + 1;
        const y = viewMonth === 11 ? viewYear + 1 : viewYear;
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cells.push({
          day: d,
          month: m,
          year: y,
          dateStr,
          isCurrentMonth: false,
          isToday: dateStr === todayDateStr
        });
      }
    }

    return cells;
  }, [viewYear, viewMonth, todayDateStr]);

  // Overall Month Statistics
  const monthStats = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    let totalBookingsInMonth = 0;
    const seenBookingIds = new Set();

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      (liveBookings || []).forEach(b => {
        if (isBookingOnDate(b, dateStr)) {
          if (b.id) seenBookingIds.add(String(b.id));
        }
      });
    }
    totalBookingsInMonth = seenBookingIds.size;

    const todayVehAvail = getVehicleAvailabilityForDay(todayDateStr);
    const vehiclesBookedToday = todayVehAvail.bookedPhysicalVehicles;
    const totalVehicles = todayVehAvail.totalPhysicalVehicles;

    let hotelsBookedToday = 0;
    (liveBookings || []).forEach(b => {
      if (isBookingOnDate(b, todayDateStr)) {
        const cat = getBookingCategory(b);
        if (cat === 'hotel') hotelsBookedToday++;
      }
    });

    const totalAvailableToday = getAvailableInventoryForDay(todayDateStr).length;

    return {
      totalBookingsInMonth,
      vehiclesBookedToday,
      hotelsBookedToday,
      totalAvailableToday,
      totalVehicles,
      totalHotels: hotelList.length
    };
  }, [viewYear, viewMonth, liveBookings, todayDateStr, activePhysicalUnits, hotelList, isVendorUser, currentVendorId]);

  // Inventory utilization breakdown
  const activeInventory = useMemo(() => {
    if (typeFilter === 'hotel') return hotelList;
    if (typeFilter === 'vehicle') return vehicleList;
    if (typeFilter === 'package') return packageList;
    return [...vehicleList, ...hotelList];
  }, [typeFilter, hotelList, vehicleList, packageList]);

  const inventoryStats = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    return activeInventory.map(item => {
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
  }, [activeInventory, viewYear, viewMonth, liveBookings]);

  // Filtered utilization stats by search
  const filteredInventoryStats = useMemo(() => {
    if (!utilizationSearch.trim()) return inventoryStats;
    const q = utilizationSearch.toLowerCase();
    return inventoryStats.filter(it => (it.name || '').toLowerCase().includes(q) || (it.type || '').toLowerCase().includes(q));
  }, [inventoryStats, utilizationSearch]);

  // Dynamic resource availability label formatter based on typeFilter and selectedItem
  const getResourceAvailability = (count, filter = typeFilter, modelInfo = null) => {
    let effectiveType = filter;
    if (effectiveType === 'all' && selectedItem !== 'all') {
      const found = activeInventory.find(it => it.name === selectedItem || String(it.id) === String(selectedItem));
      if (found) {
        if (found.type === 'hotel') effectiveType = 'hotel';
        else if (found.type === 'car' || found.type === 'bike' || found.type === 'vehicle') effectiveType = 'vehicle';
        else if (found.type === 'package') effectiveType = 'package';
        else if (found.type === 'flight') effectiveType = 'flight';
      }
    }

    if (modelInfo) {
      const nameParts = String(modelInfo.name || 'Vehicle').split(' ');
      const shortName = nameParts.length > 2 && nameParts[0].toLowerCase() === 'mahindra' 
        ? nameParts[1] 
        : nameParts.length > 2 && nameParts[0].toLowerCase() === 'royal' 
          ? `${nameParts[0]} ${nameParts[1]}` 
          : nameParts[0];
      const text = `${shortName}: ${modelInfo.available} / ${modelInfo.total} free`;
      return {
        full: text,
        badge: text,
        unit: 'vehicles',
        title: text
      };
    }

    switch (effectiveType) {
      case 'vehicle':
        return {
          full: count === 1 ? `✓ 1 vehicle free` : `✓ ${count} vehicles free`,
          badge: count === 1 ? `✓ 1 vehicle free` : `✓ ${count} vehicles free`,
          unit: count === 1 ? 'vehicle' : 'vehicles',
          title: count === 1 ? '1 vehicle free' : `${count} vehicles free`
        };
      case 'hotel':
        return {
          full: count === 1 ? `✓ 1 room free` : `✓ ${count} rooms free`,
          badge: count === 1 ? `✓ 1 room free` : `✓ ${count} rooms free`,
          unit: count === 1 ? 'room' : 'rooms',
          title: count === 1 ? '1 room free' : `${count} rooms free`
        };
      case 'package':
      case 'trip':
        return {
          full: count === 1 ? `✓ 1 package free` : `✓ ${count} packages free`,
          badge: count === 1 ? `✓ 1 package free` : `✓ ${count} packages free`,
          unit: count === 1 ? 'package' : 'packages',
          title: count === 1 ? '1 package free' : `${count} packages free`
        };
      case 'flight':
        return {
          full: count === 1 ? `✓ 1 seat free` : `✓ ${count} seats free`,
          badge: count === 1 ? `✓ 1 seat free` : `✓ ${count} seats free`,
          unit: count === 1 ? 'seat' : 'seats',
          title: count === 1 ? '1 seat free' : `${count} seats free`
        };
      case 'all':
      default:
        return {
          full: count === 1 ? `✓ 1 unit free` : `✓ ${count} units free`,
          badge: count === 1 ? `✓ 1 unit free` : `✓ ${count} units free`,
          unit: count === 1 ? 'unit' : 'units',
          title: count === 1 ? '1 unit free' : `${count} units free`
        };
    }
  };

  // Enterprise Controlled Color System (Light tinted backgrounds, clear icons and borders)
  const getCategoryStyles = (category) => {
    switch (category) {
      case 'hotel':
        return {
          bg: '#f0fdfa',
          color: '#0f766e',
          border: '#99f6e4',
          dot: '#0d9488',
          emoji: '🏨',
          label: 'Hotel'
        };
      case 'package':
        return {
          bg: '#fff7ed',
          color: '#c2410c',
          border: '#fed7aa',
          dot: '#ea580c',
          emoji: '📦',
          label: 'Package'
        };
      case 'flight':
        return {
          bg: '#faf5ff',
          color: '#6b21a8',
          border: '#e9d5ff',
          dot: '#9333ea',
          emoji: '✈️',
          label: 'Flight'
        };
      case 'vehicle':
      default:
        return {
          bg: '#f0f7ff',
          color: '#1e40af',
          border: '#bfdbfe',
          dot: '#2563eb',
          emoji: '🚗',
          label: 'Vehicle'
        };
    }
  };

  return (
    <div className="w-100" style={{ maxWidth: '100%', boxSizing: 'border-box' }}>
      
      {/* Top Professional Header Bar */}
      <div className="card border rounded-3 p-3 mb-3 bg-white shadow-xs" style={{ borderColor: '#e2e8f0' }}>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h4 className="fw-bold mb-0 font-heading" style={{ color: '#0D1B2E', letterSpacing: '-0.3px', fontSize: '1.25rem' }}>
                Availability &amp; Reservation Calendar
              </h4>
              <span className="badge rounded-pill d-inline-flex align-items-center gap-1.5 px-2.5 py-1" style={{ background: '#f0fdf4', color: '#166534', fontSize: '0.72rem', border: '1px solid #bbf7d0' }}>
                <span className="rounded-circle" style={{ width: '6px', height: '6px', background: '#16a34a', display: 'inline-block' }} />
                Live Sync
              </span>
            </div>
            <p className="text-muted mb-0 small" style={{ fontSize: '0.82rem' }}>
              Real-time PMS occupancy matrix mapped across fleet, hotels, and custom travel packages.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* Primary Control: Today Jump Button */}
            <button
              type="button"
              onClick={handleTodayClick}
              className="btn btn-sm shadow-xs rounded-pill px-3 fw-bold d-flex align-items-center gap-1.5 transition-all"
              style={{
                background: '#FF6333',
                color: '#ffffff',
                border: '1px solid #e05325',
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
              title="Jump to today's date"
            >
              <Calendar size={14} /> Today
            </button>

            {/* Secondary Control: Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn btn-sm btn-outline-secondary shadow-xs rounded-pill px-3 fw-semibold d-flex align-items-center gap-1.5 transition-all"
              style={{ fontSize: '0.8rem', borderColor: '#cbd5e1', color: '#475569', cursor: isRefreshing ? 'wait' : 'pointer' }}
              title="Refresh Calendar Data"
            >
              <RefreshCw size={13} className={isRefreshing ? 'spin-animation' : ''} />
              {isRefreshing ? 'Syncing...' : 'Refresh'}
            </button>

            {/* Secondary Control: Utilization View Button */}
            <button
              type="button"
              onClick={() => setShowUtilizationModal(true)}
              className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-semibold d-flex align-items-center gap-1.5 shadow-xs transition-all"
              style={{ fontSize: '0.8rem', borderColor: '#cbd5e1', color: '#475569', cursor: 'pointer' }}
              title="Open fleet and property utilization breakdown"
            >
              <BarChart3 size={13} />
              Utilization Stats
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Strip (Clean, Balanced, Enterprise Styling) */}
      <div className="row g-2 mb-3">
        <div className="col-6 col-md-3">
          <div className="card border rounded-3 p-3 h-100 bg-white shadow-xs" style={{ borderColor: '#e2e8f0', minHeight: '76px' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>Month Bookings</div>
                <div className="fw-bold fs-5 mt-1" style={{ color: '#0D1B2E', lineHeight: 1 }}>{monthStats.totalBookingsInMonth}</div>
              </div>
              <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569' }}>
                <Calendar size={18} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border rounded-3 p-3 h-100 bg-white shadow-xs" style={{ borderColor: '#e2e8f0', minHeight: '76px' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>Vehicles Today</div>
                <div className="fw-bold fs-5 mt-1" style={{ color: '#1e40af', lineHeight: 1 }}>
                  {monthStats.vehiclesBookedToday} <span className="text-muted fw-normal" style={{ fontSize: '0.74rem' }}>/ {monthStats.totalVehicles}</span>
                </div>
              </div>
              <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px', background: '#f0f7ff', border: '1px solid #bfdbfe', color: '#2563eb' }}>
                <Car size={18} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border rounded-3 p-3 h-100 bg-white shadow-xs" style={{ borderColor: '#e2e8f0', minHeight: '76px' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>Hotels Today</div>
                <div className="fw-bold fs-5 mt-1" style={{ color: '#0f766e', lineHeight: 1 }}>
                  {monthStats.hotelsBookedToday} <span className="text-muted fw-normal" style={{ fontSize: '0.74rem' }}>/ {monthStats.totalHotels}</span>
                </div>
              </div>
              <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px', background: '#f0fdfa', border: '1px solid #99f6e4', color: '#0d9488' }}>
                <Hotel size={18} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border rounded-3 p-3 h-100 bg-white shadow-xs" style={{ borderColor: '#bbf7d0', minHeight: '76px' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-success text-uppercase fw-semibold" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>Free Capacity Today</div>
                <div className="fw-bold fs-5 mt-1 text-success" style={{ lineHeight: 1 }}>
                  {monthStats.totalAvailableToday} <span className="fw-normal text-muted" style={{ fontSize: '0.72rem' }}>{getResourceAvailability(monthStats.totalAvailableToday).unit}</span>
                </div>
              </div>
              <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a' }}>
                <CheckCircle size={18} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Navigator Card */}
      <div className="card border rounded-3 shadow-xs p-3 mb-3 bg-white" style={{ borderColor: '#e2e8f0' }}>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          
          {/* Month & Year Navigator */}
          <div className="d-flex align-items-center gap-2">
            <button 
              type="button"
              onClick={prevMonth} 
              className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center border-0 shadow-xs transition-all hover-scale" 
              style={{ width: '34px', height: '34px', background: '#f1f5f9', color: '#334155', cursor: 'pointer' }}
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <h5 className="fw-bold mb-0 px-2 font-heading" style={{ color: '#0D1B2E', minWidth: '175px', textAlign: 'center', fontSize: '1.05rem' }}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h5>
            <button 
              type="button"
              onClick={nextMonth} 
              className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center border-0 shadow-xs transition-all hover-scale" 
              style={{ width: '34px', height: '34px', background: '#f1f5f9', color: '#334155', cursor: 'pointer' }}
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Service Filter Tabs (Clean Segmented Control) */}
          <div className="btn-group btn-group-sm rounded-pill p-0.5 shadow-xs" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={() => { setTypeFilter('all'); setSelectedItem('all'); }}
              className={`btn btn-sm rounded-pill px-3 fw-semibold border-0 transition-all ${typeFilter === 'all' ? 'text-white' : 'text-secondary'}`}
              style={{ background: typeFilter === 'all' ? '#0D1B2E' : 'transparent', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => { setTypeFilter(prev => prev === 'vehicle' ? 'all' : 'vehicle'); setSelectedItem('all'); }}
              className={`btn btn-sm rounded-pill px-3 fw-semibold border-0 transition-all ${typeFilter === 'vehicle' ? 'text-white' : 'text-secondary'}`}
              style={{ background: typeFilter === 'vehicle' ? '#0D1B2E' : 'transparent', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              <span style={{ color: typeFilter === 'vehicle' ? '#fff' : '#2563eb' }}>🚗</span> Vehicles ({activePhysicalUnits.length})
            </button>
            <button
              type="button"
              onClick={() => { setTypeFilter(prev => prev === 'hotel' ? 'all' : 'hotel'); setSelectedItem('all'); }}
              className={`btn btn-sm rounded-pill px-3 fw-semibold border-0 transition-all ${typeFilter === 'hotel' ? 'text-white' : 'text-secondary'}`}
              style={{ background: typeFilter === 'hotel' ? '#0D1B2E' : 'transparent', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              <span style={{ color: typeFilter === 'hotel' ? '#fff' : '#0d9488' }}>🏨</span> Hotels ({hotelList.length})
            </button>
            <button
              type="button"
              onClick={() => { setTypeFilter(prev => prev === 'package' ? 'all' : 'package'); setSelectedItem('all'); }}
              className={`btn btn-sm rounded-pill px-3 fw-semibold border-0 transition-all ${typeFilter === 'package' ? 'text-white' : 'text-secondary'}`}
              style={{ background: typeFilter === 'package' ? '#0D1B2E' : 'transparent', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              <span style={{ color: typeFilter === 'package' ? '#fff' : '#ea580c' }}>📦</span> Trips ({packageList.length})
            </button>
          </div>

          {/* Item Selector & Available Mode Toggle */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* Searchable Dropdown */}
            <div className="position-relative" style={{ minWidth: '190px' }}>
              <select
                className="form-select form-select-sm shadow-xs"
                style={{ 
                  borderRadius: '10px', 
                  fontSize: '0.8rem', 
                  borderColor: '#e2e8f0', 
                  paddingLeft: '28px', 
                  backgroundPosition: 'right 0.6rem center',
                  color: selectedItem !== 'all' ? '#0D1B2E' : '#64748b',
                  cursor: 'pointer'
                }}
                value={selectedItem}
                onChange={e => setSelectedItem(e.target.value)}
              >
                <option value="all">
                  {typeFilter === 'hotel' ? 'All Hotels' : typeFilter === 'vehicle' ? 'All Vehicles' : typeFilter === 'package' ? 'All Packages' : 'Filter Property / Car'}
                </option>
                {activeInventory.map(it => (
                  <option key={it.id} value={it.name}>
                    {it.name} {it.fleet_count ? `(${it.fleet_count} fleet units)` : `(${it.type || it.category || 'item'})`}
                  </option>
                ))}
              </select>
              <Search size={13} className="position-absolute text-muted" style={{ left: '9px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>

            {/* Toggle Available Only Units */}
            <button
              type="button"
              onClick={() => setShowAvailableOnly(prev => !prev)}
              className={`btn btn-sm rounded-pill px-3 fw-semibold border shadow-xs transition-all d-flex align-items-center gap-1.5 ${
                showAvailableOnly ? 'bg-success text-white border-success' : 'bg-white text-secondary border'
              }`}
              style={{ 
                borderColor: showAvailableOnly ? '#16a34a' : '#cbd5e1',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
              title="Toggle to view remaining free inventory capacity"
            >
              <CheckCircle size={13} />
              {showAvailableOnly ? (typeFilter === 'all' ? 'Free Capacity Active' : `Free ${getResourceAvailability(0).unit} Active`) : 'Show Free Capacity'}
            </button>
          </div>

        </div>

        {/* Minimal Modern Legend Strip (Secondary, Clean Micro-Dots) */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-2.5 mt-2.5 border-top" style={{ fontSize: '0.74rem', borderColor: '#f1f5f9' }}>
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <span className="text-muted fw-semibold" style={{ fontSize: '0.72rem' }}>Legend:</span>
            <div className="d-flex align-items-center gap-1.5 cursor-pointer" onClick={() => setTypeFilter(prev => prev === 'vehicle' ? 'all' : 'vehicle')}>
              <span className="rounded-circle" style={{ width: '7px', height: '7px', background: '#3b82f6', display: 'inline-block' }} />
              <span style={{ color: '#475569', fontWeight: 500 }}>Vehicles</span>
            </div>
            <div className="d-flex align-items-center gap-1.5 cursor-pointer" onClick={() => setTypeFilter(prev => prev === 'hotel' ? 'all' : 'hotel')}>
              <span className="rounded-circle" style={{ width: '7px', height: '7px', background: '#0d9488', display: 'inline-block' }} />
              <span style={{ color: '#475569', fontWeight: 500 }}>Hotels</span>
            </div>
            <div className="d-flex align-items-center gap-1.5 cursor-pointer" onClick={() => setTypeFilter(prev => prev === 'package' ? 'all' : 'package')}>
              <span className="rounded-circle" style={{ width: '7px', height: '7px', background: '#ea580c', display: 'inline-block' }} />
              <span style={{ color: '#475569', fontWeight: 500 }}>Packages</span>
            </div>
            <div className="d-flex align-items-center gap-1.5 cursor-pointer" onClick={() => setTypeFilter(prev => prev === 'flight' ? 'all' : 'flight')}>
              <span className="rounded-circle" style={{ width: '7px', height: '7px', background: '#9333ea', display: 'inline-block' }} />
              <span style={{ color: '#475569', fontWeight: 500 }}>Flights</span>
            </div>
            <div className="d-flex align-items-center gap-1.5 cursor-pointer" onClick={handleTodayClick}>
              <span className="rounded-circle" style={{ width: '7px', height: '7px', background: '#FF6333', display: 'inline-block' }} />
              <span style={{ color: '#475569', fontWeight: 500 }}>Today</span>
            </div>
          </div>

          <div className="text-muted" style={{ fontSize: '0.72rem' }}>
            Click any date cell to view detailed schedule
          </div>
        </div>
      </div>

      {/* Main Professional Calendar Grid (Strict 7-Column Layout, 100% Width, Zero Horizontal Overflow) */}
      <div 
        className="card border rounded-3 shadow-xs mb-4 w-100 bg-white" 
        style={{ 
          borderColor: '#e2e8f0', 
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        {/* Day Name Header Row */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', 
            width: '100%', 
            background: '#f8fafc', 
            borderBottom: '1px solid #e2e8f0' 
          }}
        >
          {DAYS.map((d, index) => {
            const isSunday = index === 0;
            const isSaturday = index === 6;
            return (
              <div 
                key={d} 
                className="text-center py-2.5 fw-semibold" 
                style={{ 
                  fontSize: '0.72rem', 
                  color: isSunday ? '#e11d48' : isSaturday ? '#475569' : '#64748b', 
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase'
                }}
              >
                {d}
              </div>
            );
          })}
        </div>

        {/* Calendar Day Cells Grid (1px gap border-grid technique for crisp lines) */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', 
            width: '100%', 
            gap: '1px', 
            background: '#e2e8f0',
            boxSizing: 'border-box'
          }}
        >
          {calendarCells.map((cell, idx) => {
            const { day, month, year, dateStr, isCurrentMonth, isToday } = cell;
            const dayBookings = getBookingsForDay(year, month, day);
            const vehDayAvail = getVehicleAvailabilityForDay(dateStr, selectedItem);

            let resAvail;
            if (typeFilter === 'vehicle') {
              if (selectedItem !== 'all') {
                const modelObj = Object.values(vehDayAvail.modelBreakdown)[0];
                resAvail = getResourceAvailability(
                  vehDayAvail.availableVehicles,
                  'vehicle',
                  modelObj ? { name: modelObj.vehicle_name, available: modelObj.available, total: modelObj.total } : null
                );
              } else {
                resAvail = getResourceAvailability(vehDayAvail.availableVehicles, 'vehicle');
              }
            } else if (typeFilter === 'hotel') {
              const availableHotels = getAvailableInventoryForDay(dateStr);
              resAvail = getResourceAvailability(availableHotels.length, 'hotel');
            } else {
              const availableUnits = getAvailableInventoryForDay(dateStr);
              resAvail = getResourceAvailability(availableUnits.length, 'all');
            }

            const hasBookings = dayBookings.length > 0;
            const isSelected = selectedDayDetails?.dateStr === dateStr;
            const cellDayOfWeek = new Date(year, month, day).getDay();
            const isSunday = cellDayOfWeek === 0;
            const isWeekend = isSunday || cellDayOfWeek === 6;

            return (
              <div
                key={`${dateStr}-${idx}`}
                onClick={() => openDayDrawer(cell)}
                className="d-flex flex-column transition-all"
                style={{
                  minHeight: '110px',
                  maxHeight: '122px',
                  padding: '6px 7px',
                  background: isSelected 
                    ? '#eff6ff' 
                    : isToday 
                      ? '#fffbf7' 
                      : !isCurrentMonth 
                        ? '#f8fafc' 
                        : isWeekend 
                          ? '#fdfdfd' 
                          : '#ffffff',
                  opacity: isCurrentMonth ? 1 : 0.4,
                  border: isToday 
                    ? '1px solid rgba(255, 99, 51, 0.45)' 
                    : isSelected 
                      ? '1px solid #2563eb' 
                      : 'none',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                  minWidth: 0,
                  width: '100%',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                {/* Cell Header: Date Number + Subtle Today Badge + Right Count */}
                <div className="d-flex align-items-center justify-content-between mb-1" style={{ minWidth: 0, width: '100%' }}>
                  <div className="d-flex align-items-center gap-1.5" style={{ minWidth: 0 }}>
                    <span 
                      style={{ 
                        fontWeight: isToday ? 700 : isWeekend ? 600 : 500,
                        color: isToday ? '#FF6333' : isCurrentMonth ? (isSunday ? '#e11d48' : '#1e293b') : '#94a3b8',
                        fontSize: '0.82rem',
                        lineHeight: 1
                      }}
                    >
                      {day}
                    </span>

                    {/* Subtle Professional Today Highlight Badge */}
                    {isToday && (
                      <span 
                        style={{ 
                          fontSize: '0.58rem', 
                          fontWeight: 700, 
                          color: '#FF6333', 
                          background: '#fff5f0', 
                          border: '1px solid rgba(255, 99, 51, 0.35)', 
                          padding: '1px 5px', 
                          borderRadius: '4px',
                          letterSpacing: '0.2px',
                          lineHeight: 1.2
                        }}
                      >
                        Today
                      </span>
                    )}
                  </div>

                  {/* Right count badge / Free capacity badge */}
                  <div className="d-flex align-items-center gap-1" style={{ flexShrink: 0 }}>
                    {showAvailableOnly ? (
                      <span 
                        className="badge rounded-pill fw-semibold text-nowrap" 
                        style={{ 
                          background: (typeFilter === 'vehicle' && vehDayAvail.availableVehicles === 0) ? '#fef2f2' : '#f0fdf4', 
                          color: (typeFilter === 'vehicle' && vehDayAvail.availableVehicles === 0) ? '#dc2626' : '#166534', 
                          border: `1px solid ${(typeFilter === 'vehicle' && vehDayAvail.availableVehicles === 0) ? '#fecaca' : '#bbf7d0'}`, 
                          fontSize: '0.58rem', 
                          padding: '1px 5px' 
                        }}
                        title={`${resAvail.title} on this date`}
                      >
                        {resAvail.badge}
                      </span>
                    ) : (
                      <>
                        {typeFilter === 'vehicle' && isCurrentMonth && (
                          <span 
                            className="badge rounded-pill fw-semibold text-nowrap" 
                            style={{ 
                              background: vehDayAvail.availableVehicles === 0 ? '#fef2f2' : '#f0fdf4', 
                              color: vehDayAvail.availableVehicles === 0 ? '#dc2626' : '#166534', 
                              border: `1px solid ${vehDayAvail.availableVehicles === 0 ? '#fecaca' : '#bbf7d0'}`, 
                              fontSize: '0.56rem', 
                              padding: '1px 5px' 
                            }}
                            title={`${resAvail.title} on this date`}
                          >
                            {vehDayAvail.availableVehicles === 0 ? '0 free' : resAvail.badge}
                          </span>
                        )}
                        {hasBookings && (
                          <span 
                            className="badge rounded-pill fw-bold" 
                            style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', fontSize: '0.58rem', padding: '1px 5px' }}
                            title={`${dayBookings.length} active reservation(s)`}
                          >
                            {dayBookings.length}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Available highlight mode if toggled */}
                {showAvailableOnly && isCurrentMonth && (
                  <div 
                    className={`fw-bold text-truncate mb-1 ${(typeFilter === 'vehicle' && vehDayAvail.availableVehicles === 0) ? 'text-danger' : 'text-success'}`} 
                    style={{ fontSize: '0.62rem', lineHeight: 1.1 }}
                  >
                    {(typeFilter === 'vehicle' && vehDayAvail.availableVehicles === 0) ? (selectedItem !== 'all' ? resAvail.full : '⚠️ 0 vehicles free') : resAvail.full}
                  </div>
                )}

                {/* Booking event chips (Clean, Compact, Readable, Controlled Color System) */}
                <div className="d-flex flex-column gap-1 overflow-hidden" style={{ minWidth: 0, width: '100%', marginTop: '1px' }}>
                  {dayBookings.slice(0, 2).map((b, bIdx) => {
                    const cat = getBookingCategory(b);
                    const style = getCategoryStyles(cat);
                    const statusObj = getStatusStyle(b.status);
                    const displayItem = b.vehicle_name || b.hotel_name || b.package_name || b.item_name || 'Booked Item';

                    return (
                      <div
                        key={b.id || bIdx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewBookingModal(b);
                        }}
                        className="d-flex align-items-center justify-content-between rounded transition-all"
                        title={`${style.emoji} ${displayItem}\nCustomer: ${b.name || b.customer_name || 'Guest'} (${b.phone || '—'})\nStatus: ${statusObj.label}\nSchedule: ${b.pickup_date || b.checkin_date || '—'} → ${b.drop_date || b.checkout_date || '—'}\nClick to view full reservation`}
                        style={{
                          background: style.bg,
                          border: `1px solid ${style.border}`,
                          fontSize: '0.68rem',
                          padding: '3px 6px',
                          lineHeight: 1.25,
                          minWidth: 0,
                          width: '100%',
                          cursor: 'pointer',
                          boxSizing: 'border-box',
                          marginBottom: '2px',
                          borderRadius: '5px'
                        }}
                        onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.97)'}
                        onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                      >
                        <div className="d-flex align-items-center gap-1.5" style={{ minWidth: 0, overflow: 'hidden' }}>
                          <span style={{ fontSize: '0.72rem', flexShrink: 0, lineHeight: 1 }}>{style.emoji}</span>
                          <span 
                            style={{ 
                              color: style.color, 
                              fontWeight: 600,
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              whiteSpace: 'nowrap' 
                            }}
                          >
                            {displayItem}
                          </span>
                        </div>
                        <span 
                          style={{ 
                            fontSize: '0.55rem', 
                            fontWeight: 600,
                            background: statusObj.bg, 
                            color: statusObj.color,
                            border: `1px solid ${statusObj.border}`,
                            padding: '1px 4px',
                            borderRadius: '3px',
                            flexShrink: 0,
                            marginLeft: '4px',
                            lineHeight: 1.1
                          }}
                        >
                          {statusObj.label}
                        </span>
                      </div>
                    );
                  })}

                  {/* Clean "+N more →" link */}
                  {dayBookings.length > 2 && (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        openDayDrawer(cell);
                      }}
                      className="d-flex align-items-center justify-content-start gap-1 transition-all"
                      style={{ 
                        fontSize: '0.68rem', 
                        fontWeight: 600, 
                        color: '#2563eb', 
                        background: 'transparent', 
                        padding: '1px 2px',
                        cursor: 'pointer',
                        lineHeight: 1.2,
                        marginTop: '1px'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = '#1d4ed8';
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = '#2563eb';
                        e.currentTarget.style.textDecoration = 'none';
                      }}
                      title="Click to view all bookings for this date"
                    >
                      +{dayBookings.length - 2} more →
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🚀 EXECUTIVE SLIDE-OVER DRAWER FOR SELECTED DATE DETAILS (FIXED OVERLAY) */}
      {/* ========================================================================= */}
      {selectedDayDetails && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1065,
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(13, 27, 46, 0.55)',
            backdropFilter: 'blur(3px)'
          }}
          onClick={() => setSelectedDayDetails(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="animate-fade-in d-flex flex-column h-100 shadow-2xl"
            style={{
              width: '580px',
              maxWidth: '94vw',
              background: '#fff',
              borderLeft: '4px solid #FF6333',
              overflowY: 'auto'
            }}
          >
            {/* Drawer Header */}
            <div className="p-3.5 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2 sticky-top" style={{ background: '#f8fafc', zIndex: 10 }}>
              <div className="d-flex align-items-center gap-2.5">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center text-white" 
                  style={{ width: '40px', height: '40px', background: selectedDayDetails.isToday ? '#FF6333' : '#0D1B2E', flexShrink: 0 }}
                >
                  <Calendar size={19} />
                </div>
                <div>
                  <h6 className="fw-bold mb-0 font-heading" style={{ color: '#0D1B2E', fontSize: '1.02rem' }}>
                    {selectedDayDetails.isToday ? '🔥 Today\'s Schedule' : 'Schedule & Capacity'}
                  </h6>
                  <div className="fw-semibold text-secondary" style={{ fontSize: '0.82rem' }}>
                    {DAYS[new Date(selectedDayDetails.year, selectedDayDetails.month, selectedDayDetails.day).getDay()]}, {MONTH_NAMES[selectedDayDetails.month]} {selectedDayDetails.day}, {selectedDayDetails.year}
                  </div>
                  <div className="d-flex align-items-center gap-2 text-muted mt-0.5" style={{ fontSize: '0.74rem' }}>
                    <span className="fw-bold text-primary">{selectedDayDetails.bookings.length} Reservation(s)</span>
                    <span>•</span>
                    <span className="fw-bold text-success">
                      {typeFilter === 'all' ? `${selectedDayDetails.availableUnits.length} Available` : `${selectedDayDetails.availableUnits.length} Free ${getResourceAvailability(selectedDayDetails.availableUnits.length).unit}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDayDetails(null)}
                  className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center p-0"
                  style={{ width: '34px', height: '34px', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                  title="Close Inspector"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Segmented Tab Navigation inside Drawer */}
            <div className="px-3.5 pt-3 pb-2 border-bottom bg-white">
              <div className="btn-group btn-group-sm w-100 rounded-pill p-1 border" style={{ background: '#f8fafc' }}>
                <button
                  type="button"
                  onClick={() => setDrawerTab('bookings')}
                  className={`btn btn-sm rounded-pill fw-semibold border-0 transition-all ${drawerTab === 'bookings' ? 'btn-primary text-white shadow-xs' : 'text-secondary'}`}
                  style={{ fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Active Bookings ({selectedDayDetails.bookings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab('available')}
                  className={`btn btn-sm rounded-pill fw-semibold border-0 transition-all ${drawerTab === 'available' ? 'btn-success text-white shadow-xs' : 'text-secondary'}`}
                  style={{ fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Free {typeFilter === 'all' ? 'Inventory' : getResourceAvailability(0).unit} ({selectedDayDetails.availableUnits.length})
                </button>
              </div>
            </div>

            {/* Drawer Body Content */}
            <div className="p-3.5 flex-grow-1">
              {drawerTab === 'bookings' ? (
                selectedDayDetails.bookings.length === 0 ? (
                  <div className="p-5 text-center text-muted bg-light rounded-4 my-3" style={{ fontSize: '0.88rem' }}>
                    <CheckCircle2 size={36} className="text-success mb-2" />
                    <div className="fw-bold text-dark fs-6">No reservations active on this date</div>
                    <div className="small mt-1 text-muted">All inventory units are 100% available for booking.</div>
                    <button
                      type="button"
                      onClick={() => setDrawerTab('available')}
                      className="btn btn-sm btn-outline-success rounded-pill px-3 py-1.5 mt-3 fw-semibold"
                    >
                      View Available {typeFilter === 'all' ? 'Units' : getResourceAvailability(0).unit} ({selectedDayDetails.availableUnits.length}) →
                    </button>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2.5">
                    {selectedDayDetails.bookings.map(b => {
                      const cat = getBookingCategory(b);
                      const style = getCategoryStyles(cat);
                      const statusObj = getStatusStyle(b.status);
                      const displayItem = b.vehicle_name || b.hotel_name || b.package_name || b.item_name || 'Item';

                      return (
                        <div 
                          key={b.id} 
                          className="card border rounded-3 p-3 shadow-xs transition-all hover-shadow-sm" 
                          style={{ background: '#fff', borderLeft: `3px solid ${style.dot}` }}
                        >
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <span 
                              className="badge rounded-pill px-2.5 py-1 fw-semibold" 
                              style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}`, fontSize: '0.72rem' }}
                            >
                              {style.emoji} {style.label}
                            </span>
                            <div className="d-flex align-items-center gap-1.5 flex-wrap justify-content-end">
                              {b.physical_unit_id && (
                                <span 
                                  className="badge rounded-pill px-2 py-0.5" 
                                  style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: '0.66rem', fontWeight: 700 }}
                                  title={`Assigned Physical Unit: ${b.physical_unit_id}`}
                                >
                                  Unit: {b.physical_unit_id}
                                </span>
                              )}
                              <span className="fw-bold text-primary" style={{ fontSize: '0.85rem' }}>#{b.id}</span>
                              <span 
                                className="badge rounded-pill px-2 py-0.5" 
                                style={{ background: statusObj.bg, color: statusObj.color, border: `1px solid ${statusObj.border}`, fontSize: '0.68rem', fontWeight: 600 }}
                              >
                                {statusObj.label}
                              </span>
                            </div>
                          </div>

                          <div className="fw-bold fs-6 mb-1" style={{ color: '#0D1B2E' }}>
                            {displayItem}
                          </div>

                          <div className="row g-2 mb-2" style={{ fontSize: '0.76rem' }}>
                            <div className="col-6">
                              <span className="text-muted d-block">Customer:</span>
                              <strong>{b.name || b.customer_name || 'Guest'}</strong>
                              {b.phone && <div className="text-muted small"><Phone size={10} /> {b.phone}</div>}
                            </div>
                            <div className="col-6">
                              <span className="text-muted d-block">Schedule:</span>
                              <div>{b.pickup_date || b.checkin_date || '—'} → {b.drop_date || b.checkout_date || '—'}</div>
                              {b.pickup_time && <span className="text-muted text-xs">⏰ {b.pickup_time}</span>}
                            </div>
                          </div>

                          <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                            <div>
                              <span className="text-muted small">Total: </span>
                              <strong className="text-success fs-6">₹{Number(b.total_amount || b.total_paid || 0).toLocaleString()}</strong>
                              <span className="text-muted text-xs ms-1">({b.payment_status || 'Paid'})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setViewBookingModal(b)}
                              className="btn btn-sm btn-outline-primary py-1 px-3 d-inline-flex align-items-center gap-1 rounded-pill fw-semibold shadow-xs"
                              style={{ fontSize: '0.76rem' }}
                            >
                              <Eye size={12} /> Inspect Details
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                /* Free Inventory Units List */
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h6 className="fw-bold text-success mb-0 d-flex align-items-center gap-1.5" style={{ fontSize: '0.9rem' }}>
                      <CheckCircle2 size={16} /> Available {typeFilter === 'all' ? 'Inventory Units' : getResourceAvailability(0).unit} ({selectedDayDetails.availableUnits.length} Free)
                    </h6>
                  </div>

                  <div className="row g-2">
                    {selectedDayDetails.availableUnits.map(it => (
                      <div key={it.id} className="col-12 col-sm-6">
                        <div className="card p-2.5 border rounded-3 h-100 shadow-xs" style={{ background: '#f8fafc' }}>
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <span className="badge rounded-pill bg-white text-dark border px-2 py-0.5" style={{ fontSize: '0.66rem' }}>
                              {it.type === 'hotel' ? '🏨 Hotel' : it.type === 'bike' ? '🏍️ Bike' : (it.category || '🚗 Vehicle')}
                            </span>
                            {it.registration_no && (
                              <span className="badge rounded-pill bg-light text-primary border fw-semibold" style={{ fontSize: '0.66rem' }}>
                                {it.registration_no}
                              </span>
                            )}
                            {it.price && (
                              <span className="fw-bold text-success" style={{ fontSize: '0.78rem' }}>
                                ₹{it.price}/day
                              </span>
                            )}
                          </div>
                          <div className="fw-bold text-truncate" style={{ fontSize: '0.82rem', color: '#0D1B2E' }} title={it.unit_name || it.name}>
                            {it.unit_name || it.name}
                          </div>
                          {it.vehicle_name && it.unit_name && it.unit_name !== it.vehicle_name && (
                            <div className="text-secondary small fw-medium" style={{ fontSize: '0.7rem' }}>
                              Model: {it.vehicle_name}
                            </div>
                          )}
                          <div className="text-muted small mt-1" style={{ fontSize: '0.68rem' }}>
                            Unit ID: #{it.id} • 100% Available
                          </div>
                        </div>
                      </div>
                    ))}
                    {selectedDayDetails.availableUnits.length === 0 && (
                      <div className="col-12 p-4 text-center text-muted">
                        No {typeFilter === 'all' ? 'units' : getResourceAvailability(0).unit} available on this date.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-top bg-light text-end">
              <button
                type="button"
                className="btn btn-secondary rounded-pill px-4 fw-semibold"
                onClick={() => setSelectedDayDetails(null)}
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 COMPREHENSIVE INDIVIDUAL BOOKING DETAILS MODAL (TOP Z-INDEX) */}
      {/* ========================================================================= */}
      {viewBookingModal && (
        <div 
          className="modal show d-block" 
          style={{ backgroundColor: 'rgba(13, 27, 46, 0.78)', zIndex: 1070, backdropFilter: 'blur(4px)' }}
          onClick={() => setViewBookingModal(null)}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
              <div className="modal-header border-0 px-4 pt-4 pb-3" style={{ background: '#0D1B2E', color: '#fff' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px', background: 'rgba(255,99,51,0.15)', color: '#FF6333' }}>
                    <Calendar size={22} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-0 font-heading">Booking #{viewBookingModal.id}</h5>
                    <span className="text-white-50 small">Reservation details and customer information</span>
                  </div>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setViewBookingModal(null)} />
              </div>

              <div className="modal-body p-4 text-start bg-light">
                <div className="row g-3">
                  {/* Category & Status */}
                  <div className="col-12 d-flex align-items-center gap-2 flex-wrap pb-2 border-bottom">
                    {(() => {
                      const cat = getBookingCategory(viewBookingModal);
                      const style = getCategoryStyles(cat);
                      const statusObj = getStatusStyle(viewBookingModal.status);
                      return (
                        <>
                          <span className="badge rounded-pill px-3 py-1.5 fw-semibold" style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}`, fontSize: '0.82rem' }}>
                            {style.emoji} {style.label} Booking
                          </span>
                          <span className="badge rounded-pill px-3 py-1.5 fw-semibold" style={{ background: statusObj.bg, color: statusObj.color, border: `1px solid ${statusObj.border}`, fontSize: '0.82rem' }}>
                            {statusObj.label}
                          </span>
                        </>
                      );
                    })()}
                    <span className="badge rounded-pill px-3 py-1.5 fw-semibold bg-white text-secondary border" style={{ fontSize: '0.82rem' }}>
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
                        Financial &amp; Payment
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
                <button type="button" className="btn btn-secondary rounded-pill px-4 fw-semibold" onClick={() => setViewBookingModal(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 EXECUTIVE UTILIZATION ANALYTICS MODAL */}
      {/* ========================================================================= */}
      {showUtilizationModal && (
        <div 
          className="modal show d-block" 
          style={{ backgroundColor: 'rgba(13, 27, 46, 0.78)', zIndex: 1060, backdropFilter: 'blur(3px)' }}
          onClick={() => setShowUtilizationModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered modal-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
              <div className="modal-header border-0 px-4 pt-4 pb-3" style={{ background: '#0D1B2E', color: '#fff' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px', background: 'rgba(0,184,217,0.18)', color: '#00B8D9' }}>
                    <BarChart3 size={22} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-0 font-heading">Fleet &amp; Property Utilization Analytics</h5>
                    <span className="text-white-50 small">Occupancy breakdown for {MONTH_NAMES[viewMonth]} {viewYear}</span>
                  </div>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowUtilizationModal(false)} />
              </div>

              <div className="modal-body p-4 text-start bg-light">
                {/* Search & Filter within Utilization */}
                <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                  <div className="position-relative" style={{ maxWidth: '320px', width: '100%' }}>
                    <input
                      type="text"
                      className="form-control form-control-sm rounded-pill shadow-xs"
                      placeholder="Search property or vehicle name..."
                      value={utilizationSearch}
                      onChange={e => setUtilizationSearch(e.target.value)}
                      style={{ paddingLeft: '32px', fontSize: '0.82rem' }}
                    />
                    <Search size={14} className="position-absolute text-muted" style={{ left: '11px', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>

                  <span className="text-muted small">
                    Showing <strong>{filteredInventoryStats.length}</strong> of {inventoryStats.length} inventory units
                  </span>
                </div>

                <div className="table-responsive bg-white rounded-3 shadow-sm border" style={{ maxHeight: '450px' }}>
                  <table className="table align-middle table-hover mb-0" style={{ fontSize: '0.82rem' }}>
                    <thead className="table-light sticky-top" style={{ fontSize: '0.72rem' }}>
                      <tr>
                        <th className="px-3 py-3 fw-bold text-secondary text-uppercase">Inventory Item</th>
                        <th className="px-3 py-3 fw-bold text-secondary text-uppercase">Type</th>
                        <th className="px-3 py-3 fw-bold text-secondary text-uppercase">Booked Days</th>
                        <th className="px-3 py-3 fw-bold text-secondary text-uppercase">Available Days</th>
                        <th className="px-4 py-3 fw-bold text-secondary text-uppercase">Monthly Occupancy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventoryStats.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td className="px-3 py-2.5 fw-bold" style={{ color: '#0D1B2E' }}>
                            {item.name}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="badge rounded-pill px-2.5 py-1 text-uppercase" style={{
                              background: item.type === 'car' ? '#f0f7ff' : item.type === 'bike' ? '#faf5ff' : '#f0fdfa',
                              color: item.type === 'car' ? '#1d4ed8' : item.type === 'bike' ? '#6d28d9' : '#0f766e',
                              border: `1px solid ${item.type === 'car' ? '#bfdbfe' : item.type === 'bike' ? '#e9d5ff' : '#99f6e4'}`,
                              fontSize: '0.66rem',
                              fontWeight: 600
                            }}>
                              {item.type}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 fw-semibold" style={{ color: item.bookedDays > 0 ? '#2563eb' : '#64748b' }}>
                            {item.bookedDays} days
                          </td>
                          <td className="px-3 py-2.5 fw-semibold" style={{ color: '#16a34a' }}>
                            {item.availableDays} days
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="d-flex align-items-center gap-2" style={{ maxWidth: '190px' }}>
                              <div className="flex-grow-1 rounded-pill overflow-hidden" style={{ height: '7px', background: '#f1f5f9' }}>
                                <div
                                  className="rounded-pill"
                                  style={{
                                    width: `${item.occupancy}%`,
                                    height: '100%',
                                    background: item.occupancy >= 70 ? '#ea580c' : item.occupancy >= 30 ? '#d97706' : '#16a34a'
                                  }}
                                />
                              </div>
                              <span className="fw-bold" style={{ fontSize: '0.78rem', color: '#0D1B2E' }}>
                                {item.occupancy}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredInventoryStats.length === 0 && (
                        <tr>
                          <td colSpan="5" className="py-4 text-center text-muted">
                            No inventory items match your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-footer border-0 px-4 py-3 bg-white">
                <button type="button" className="btn btn-secondary rounded-pill px-4 fw-semibold" onClick={() => setShowUtilizationModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
