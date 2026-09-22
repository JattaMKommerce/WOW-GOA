import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, Calendar, BedDouble, Lock, Unlock, DollarSign, 
  RefreshCw, AlertTriangle, Check, X, Eye, Phone, Mail, MapPin, Clock, 
  Users, RotateCcw, Building, ShieldCheck, CheckCircle2, ChevronDown, Save, Tag
} from 'lucide-react';
import * as api from '../../../services/api';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const currentYear = new Date().getFullYear();
const startYear = 2020;
const endYear = Math.max(2035, currentYear + 5);
const YEARS = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

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

export default function PMSAvailabilityCalendar({
  currentUser,
  vendorHotels = [],
  vendorBookings = [],
  allBookings = []
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Selected hotel filter: 'all' or hotel id
  const [selectedHotel, setSelectedHotel] = useState((vendorHotels || [])[0]?.id || 'all');
  const [roomTypes, setRoomTypes] = useState([]);
  const [selectedRoomType, setSelectedRoomType] = useState('all');

  // Active highlighted / selected date (defaults to today's date)
  const [selectedDate, setSelectedDate] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
    day: today.getDate()
  });

  // Selected day details drawer & booking details modal
  const [selectedDayDetails, setSelectedDayDetails] = useState(null);
  const [viewBookingModal, setViewBookingModal] = useState(null);
  const dayDetailsRef = useRef(null);

  // Date picker calendar popover
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef(null);
  const [pickerMonth, setPickerMonth] = useState(today.getMonth());
  const [pickerYear, setPickerYear] = useState(today.getFullYear());

  // Manual PMS block/override data
  const [calendarData, setCalendarData] = useState({});
  const [selectedDates, setSelectedDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionPanel, setActionPanel] = useState(null);
  const [actionForm, setActionForm] = useState({
    status: 'Blocked', block_reason: '', available_rooms: '', price_override: '', min_stay: 1, stop_sale: false
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  // Live real-time bookings synchronization
  const initialBookings = useMemo(() => {
    const source = (vendorBookings && vendorBookings.length > 0) ? vendorBookings : (allBookings || []);
    return source;
  }, [vendorBookings, allBookings]);

  const [liveBookings, setLiveBookings] = useState(initialBookings);

  useEffect(() => {
    if (initialBookings && initialBookings.length > 0) {
      setLiveBookings(prev => {
        const idMap = new Map();
        prev.forEach(b => { if (b?.id) idMap.set(String(b.id), b); });
        initialBookings.forEach(b => { if (b?.id) idMap.set(String(b.id), b); });
        return Array.from(idMap.values());
      });
    }
  }, [initialBookings]);

  // Real-time synchronization for fresh bookings
  useEffect(() => {
    const fetchFresh = async () => {
      try {
        const fresh = await api.fetchBookings();
        if (Array.isArray(fresh) && fresh.length > 0) {
          setLiveBookings(prev => {
            const idMap = new Map();
            prev.forEach(b => { if (b?.id) idMap.set(String(b.id), b); });
            fresh.forEach(b => { if (b?.id) idMap.set(String(b.id), b); });
            return Array.from(idMap.values());
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
      fetchFresh();
    };

    window.addEventListener('new-booking-created', handleSync);
    window.addEventListener('booking-updated', handleSync);
    window.addEventListener('booking-status-updated', handleSync);
    window.addEventListener('booking-deleted', fetchFresh);
    window.addEventListener('tripgalileo-booking-sync', handleSync);

    const interval = setInterval(fetchFresh, 5000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('new-booking-created', handleSync);
      window.removeEventListener('booking-updated', handleSync);
      window.removeEventListener('booking-status-updated', handleSync);
      window.removeEventListener('booking-deleted', fetchFresh);
      window.removeEventListener('tripgalileo-booking-sync', handleSync);
    };
  }, []);

  // Fetch room types when selectedHotel changes
  useEffect(() => {
    if (!selectedHotel || selectedHotel === 'all') {
      // Gather all room types from all hotels
      const vendorId = currentUser?.id || 'admin';
      api.pmsListRoomTypes(vendorId).then(res => {
        setRoomTypes(res.room_types || []);
      }).catch(() => setRoomTypes([]));
      return;
    }

    const vendorId = currentUser?.id || 'admin';
    api.pmsListRoomTypes(vendorId, selectedHotel).then(res => {
      let hotelTypes = (res.room_types || []).filter(rt => String(rt.hotel_id) === String(selectedHotel));
      if (hotelTypes.length === 0) {
        const currentHotel = (vendorHotels || []).find(h => String(h.id) === String(selectedHotel));
        hotelTypes = [{
          id: `std_${selectedHotel}`,
          hotel_id: selectedHotel,
          name: 'Standard Room / All Rooms',
          price: currentHotel?.price || 5000,
          total_rooms: 10
        }];
      }
      setRoomTypes(hotelTypes);
    }).catch(() => {
      const currentHotel = (vendorHotels || []).find(h => String(h.id) === String(selectedHotel));
      const fallback = [{
        id: `std_${selectedHotel}`,
        hotel_id: selectedHotel,
        name: 'Standard Room / All Rooms',
        price: currentHotel?.price || 5000,
        total_rooms: 10
      }];
      setRoomTypes(fallback);
    });
  }, [selectedHotel, currentUser?.id, vendorHotels]);

  // Fetch manual calendar availability blocks
  useEffect(() => {
    if (!selectedHotel || selectedHotel === 'all') return;
    setLoading(true);
    const fromDate = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-01`;
    const lastDay = getDaysInMonth(viewYear, viewMonth);
    const toDate = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${lastDay}`;
    const targetRoomType = selectedRoomType === 'all' ? '' : selectedRoomType;

    api.pmsGetAvailabilityCalendar(selectedHotel, targetRoomType, fromDate, toDate)
      .then(res => {
        const map = {};
        (res.calendar || []).forEach(entry => { map[entry.date] = entry; });
        setCalendarData(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedHotel, selectedRoomType, viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(y => y - 1);
      setViewMonth(11);
      setPickerYear(y => y - 1);
      setPickerMonth(11);
    } else {
      setViewMonth(m => m - 1);
      setPickerMonth(m => m - 1);
    }
    setSelectedDates([]);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(y => y + 1);
      setViewMonth(0);
      setPickerYear(y => y + 1);
      setPickerMonth(0);
    } else {
      setViewMonth(m => m + 1);
      setPickerMonth(m => m + 1);
    }
    setSelectedDates([]);
  };

  const fmtDate = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const currentHotelObj = useMemo(() => {
    if (!selectedHotel || selectedHotel === 'all') return null;
    return (vendorHotels || []).find(h => String(h.id) === String(selectedHotel));
  }, [selectedHotel, vendorHotels]);

  // Filter hotel bookings for a given day
  const getBookingsForDay = (day, yr = viewYear, mo = viewMonth) => {
    const checkDateStr = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    return (liveBookings || []).filter(b => {
      if (b.status === 'Cancelled') return false;

      // Ensure it is a hotel booking
      const isHotel = b.type === 'hotel' || String(b.item_id).startsWith('hotel-') || b.property_type || b.stars || b.hotel_name || b.room_type;
      if (!isHotel) return false;

      // Match selected hotel
      if (selectedHotel && selectedHotel !== 'all') {
        const hotelMatch = 
          String(b.item_id) === String(selectedHotel) ||
          String(b.hotel_id) === String(selectedHotel) ||
          (b.item_name && currentHotelObj?.name && b.item_name.toLowerCase().includes(currentHotelObj.name.toLowerCase())) ||
          (b.hotel_name && currentHotelObj?.name && b.hotel_name.toLowerCase().includes(currentHotelObj.name.toLowerCase()));
        if (!hotelMatch) return false;
      }

      // Match selected room type
      if (selectedRoomType && selectedRoomType !== 'all') {
        const currentRoomTypeObj = roomTypes.find(rt => rt.id === selectedRoomType);
        if (currentRoomTypeObj) {
          const roomMatch = 
            String(b.room_type_id) === String(selectedRoomType) ||
            (b.room_type && b.room_type.toLowerCase() === currentRoomTypeObj.name?.toLowerCase());
          if (!roomMatch) return false;
        }
      }

      const pStr = normalizeCalendarDate(b.check_in_date || b.pickup_date);
      const dStr = normalizeCalendarDate(b.check_out_date || b.drop_date) || pStr;

      if (pStr && dStr) {
        return checkDateStr >= pStr && checkDateStr <= dStr;
      }
      return false;
    });
  };

  const isDaySelected = (day) => {
    return selectedDate && 
      selectedDate.year === viewYear && 
      selectedDate.month === viewMonth && 
      selectedDate.day === day;
  };

  // Focus on a specific day
  const handleSelectDay = (day, yr = viewYear, mo = viewMonth) => {
    setViewYear(yr);
    setViewMonth(mo);
    setPickerYear(yr);
    setPickerMonth(mo);
    setSelectedDate({ year: yr, month: mo, day });

    const dayBookings = getBookingsForDay(day, yr, mo);
    const isToday = day === today.getDate() && mo === today.getMonth() && yr === today.getFullYear();
    const dateStr = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    setSelectedDayDetails({
      dateStr,
      day,
      bookings: dayBookings,
      isToday
    });

    setTimeout(() => {
      dayDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 60);
  };

  // Next Date Navigation
  const handleNextDay = () => {
    const curDate = new Date(selectedDate.year, selectedDate.month, selectedDate.day);
    curDate.setDate(curDate.getDate() + 1);
    const newYear = curDate.getFullYear();
    const newMonth = curDate.getMonth();
    const newDay = curDate.getDate();

    setViewYear(newYear);
    setViewMonth(newMonth);
    setSelectedDate({ year: newYear, month: newMonth, day: newDay });

    const checkDateStr = `${newYear}-${String(newMonth + 1).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`;
    const dayBks = getBookingsForDay(newDay, newYear, newMonth);
    const isToday = newDay === today.getDate() && newMonth === today.getMonth() && newYear === today.getFullYear();

    setSelectedDayDetails({
      dateStr: checkDateStr,
      day: newDay,
      bookings: dayBks,
      isToday
    });
  };

  // Previous Date Navigation
  const handlePrevDay = () => {
    const curDate = new Date(selectedDate.year, selectedDate.month, selectedDate.day);
    curDate.setDate(curDate.getDate() - 1);
    const newYear = curDate.getFullYear();
    const newMonth = curDate.getMonth();
    const newDay = curDate.getDate();

    setViewYear(newYear);
    setViewMonth(newMonth);
    setSelectedDate({ year: newYear, month: newMonth, day: newDay });

    const checkDateStr = `${newYear}-${String(newMonth + 1).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`;
    const dayBks = getBookingsForDay(newDay, newYear, newMonth);
    const isToday = newDay === today.getDate() && newMonth === today.getMonth() && newYear === today.getFullYear();

    setSelectedDayDetails({
      dateStr: checkDateStr,
      day: newDay,
      bookings: dayBks,
      isToday
    });
  };

  // Reset to Today
  const handleRefreshToToday = () => {
    const tYear = today.getFullYear();
    const tMonth = today.getMonth();
    const tDay = today.getDate();

    setViewYear(tYear);
    setViewMonth(tMonth);
    setPickerYear(tYear);
    setPickerMonth(tMonth);
    setSelectedDate({ year: tYear, month: tMonth, day: tDay });

    const todayDateStr = `${tYear}-${String(tMonth + 1).padStart(2, '0')}-${String(tDay).padStart(2, '0')}`;
    const dayBks = getBookingsForDay(tDay, tYear, tMonth);

    setSelectedDayDetails({
      dateStr: todayDateStr,
      day: tDay,
      bookings: dayBks,
      isToday: true
    });
  };

  // Apply manual block / price overrides
  const handleApply = async () => {
    if (selectedDates.length === 0) { alert('Select at least one date'); return; }
    if (!selectedHotel || selectedHotel === 'all') { alert('Please select a specific hotel to apply changes.'); return; }
    setSaving(true);
    try {
      await api.pmsUpdateAvailability({
        hotel_id: selectedHotel,
        room_type_id: selectedRoomType === 'all' ? (roomTypes[0]?.id || null) : selectedRoomType,
        vendor_id: currentUser?.id || 'admin',
        dates: selectedDates,
        status: actionForm.status,
        block_reason: actionForm.block_reason || null,
        available_rooms: actionForm.available_rooms || null,
        price_override: actionForm.price_override || null,
        min_stay: actionForm.min_stay || 1,
        stop_sale: actionForm.stop_sale ? 1 : 0
      });
      setSuccess(`✅ ${selectedDates.length} date(s) updated!`);
      setSelectedDates([]);
      setActionPanel(null);

      // Refresh
      const fromDate = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-01`;
      const lastDay = getDaysInMonth(viewYear, viewMonth);
      const toDate = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${lastDay}`;
      const res = await api.pmsGetAvailabilityCalendar(selectedHotel, selectedRoomType === 'all' ? '' : selectedRoomType, fromDate, toDate);
      const map = {};
      (res.calendar || []).forEach(entry => { map[entry.date] = entry; });
      setCalendarData(map);
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      alert('Error: ' + e.message);
    } finally { setSaving(false); }
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyBefore = Array.from({ length: firstDay }, (_, i) => i);
  const todayStr = today.toISOString().split('T')[0];

  return (
    <div className="p-3 p-md-4 pb-5" style={{ background: '#f8fafc', minHeight: '100%', boxSizing: 'border-box' }}>
      <style>{`
        .calendar-scroll-wrapper::-webkit-scrollbar { height: 9px; }
        .calendar-scroll-wrapper::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 6px; }
        .calendar-scroll-wrapper::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 6px; border: 2px solid #f1f5f9; }
        .calendar-scroll-wrapper::-webkit-scrollbar-thumb:hover { background: #64748b; }
      `}</style>

      {/* Top Header & Filters */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div>
          <h4 className="fw-bold mb-1 font-heading" style={{ color: '#0D1B2E', fontSize: '1.25rem' }}>
            Availability Calendar
          </h4>
          <p className="text-muted mb-0" style={{ fontSize: '0.82rem' }}>
            Real-time hotel room availability, reservations from database, and rate management
          </p>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          {/* Hotel Filter */}
          <div className="d-flex align-items-center gap-1.5">
            <Building size={16} className="text-muted" />
            <select
              className="form-select form-select-sm shadow-sm"
              style={{ borderRadius: '10px', fontSize: '0.82rem', minWidth: '200px', borderColor: '#e2e8f0' }}
              value={selectedHotel}
              onChange={e => { setSelectedHotel(e.target.value); setSelectedDates([]); }}
            >
              <option value="all">All My Hotels ({vendorHotels.length})</option>
              {vendorHotels.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          {/* Room Type Filter */}
          <div className="d-flex align-items-center gap-1.5">
            <BedDouble size={16} className="text-muted" />
            <select
              className="form-select form-select-sm shadow-sm"
              style={{ borderRadius: '10px', fontSize: '0.82rem', minWidth: '180px', borderColor: '#e2e8f0' }}
              value={selectedRoomType}
              onChange={e => { setSelectedRoomType(e.target.value); setSelectedDates([]); }}
            >
              <option value="all">All Room Types ({roomTypes.length > 0 ? roomTypes.length : 'All'})</option>
              {roomTypes.map(rt => (
                <option key={rt.id} value={rt.id}>{rt.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Month & Date Navigation Bar */}
      <div className="card border-0 rounded-4 shadow-sm p-3 mb-3" style={{ background: '#fff' }}>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          
          {/* Left: Month & Year Controller */}
          <div className="d-flex align-items-center gap-1.5">
            <button
              onClick={prevMonth}
              className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center border-0 shadow-sm"
              style={{ width: '34px', height: '34px', background: '#f1f5f9' }}
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="d-flex align-items-center gap-1">
              <select
                value={viewMonth}
                onChange={(e) => {
                  const m = Number(e.target.value);
                  setViewMonth(m);
                  setPickerMonth(m);
                }}
                className="form-select form-select-sm border-0 fw-bold font-heading text-dark py-1 ps-2 pe-4 shadow-none"
                style={{ fontSize: '1rem', background: '#f1f5f9', borderRadius: '8px', cursor: 'pointer', width: 'auto' }}
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={(e) => {
                  const y = Number(e.target.value);
                  setViewYear(y);
                  setPickerYear(y);
                }}
                className="form-select form-select-sm border-0 fw-bold font-heading text-dark py-1 ps-2 pe-4 shadow-none"
                style={{ fontSize: '1rem', background: '#f1f5f9', borderRadius: '8px', cursor: 'pointer', width: 'auto' }}
              >
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button
              onClick={nextMonth}
              className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center border-0 shadow-sm"
              style={{ width: '34px', height: '34px', background: '#f1f5f9' }}
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Center: Date Stepper (Prev Date / Next Date) with Calendar Popover */}
          <div className="position-relative d-flex align-items-center gap-1.5 p-1 rounded-pill border bg-light shadow-2xs">
            <button
              onClick={handlePrevDay}
              className="btn btn-sm btn-light rounded-pill px-2.5 py-1 d-flex align-items-center gap-1 border-0 fw-semibold text-dark"
              style={{ fontSize: '0.74rem' }}
              title="Navigate to Previous Date"
            >
              <ChevronLeft size={14} /> Prev Date
            </button>

            <button
              type="button"
              onClick={() => {
                setPickerMonth(selectedDate.month);
                setPickerYear(selectedDate.year);
                setShowDatePicker(prev => !prev);
              }}
              className="btn btn-sm rounded-pill px-3 py-1 d-flex align-items-center gap-1.5 border-0 fw-bold shadow-xs"
              style={{
                background: '#FF6333',
                color: '#fff',
                fontSize: '0.76rem',
                letterSpacing: '0.2px'
              }}
              title="Click to open full calendar date jump"
            >
              <Calendar size={13} />
              <span>
                {selectedDate.day} {MONTH_NAMES[selectedDate.month]?.slice(0, 3)} {selectedDate.year}
              </span>
              <ChevronDown size={12} />
            </button>

            <button
              onClick={handleNextDay}
              className="btn btn-sm btn-light rounded-pill px-2.5 py-1 d-flex align-items-center gap-1 border-0 fw-semibold text-dark"
              style={{ fontSize: '0.74rem' }}
              title="Navigate to Next Date"
            >
              Next Date <ChevronRight size={14} />
            </button>

            {/* Calendar Popover */}
            {showDatePicker && (
              <div
                ref={datePickerRef}
                className="position-absolute shadow-lg border rounded-4 p-3 bg-white animate-fade-in"
                style={{
                  top: 'calc(100% + 8px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 1050,
                  width: '310px'
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="fw-bold text-dark text-xs">Jump to Date</span>
                  <button onClick={() => setShowDatePicker(false)} className="btn btn-sm btn-link text-muted p-0"><X size={14} /></button>
                </div>
                <div className="d-grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  {Array.from({ length: getFirstDayOfMonth(pickerYear, pickerMonth) }, (_, i) => (
                    <div key={`empty-p-${i}`} />
                  ))}
                  {Array.from({ length: getDaysInMonth(pickerYear, pickerMonth) }, (_, i) => i + 1).map(d => {
                    const isSel = selectedDate.year === pickerYear && selectedDate.month === pickerMonth && selectedDate.day === d;
                    const isTod = today.getFullYear() === pickerYear && today.getMonth() === pickerMonth && today.getDate() === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          handleSelectDay(d, pickerYear, pickerMonth);
                          setShowDatePicker(false);
                        }}
                        className="btn btn-sm p-0 rounded-circle d-flex align-items-center justify-content-center fw-bold"
                        style={{
                          width: '30px',
                          height: '30px',
                          margin: 'auto',
                          fontSize: '0.74rem',
                          background: isSel ? '#FF6333' : (isTod ? '#FFF5F2' : 'transparent'),
                          color: isSel ? '#fff' : (isTod ? '#FF6333' : '#1e293b'),
                          border: isSel ? '1px solid #FF6333' : (isTod ? '1px dashed #FF6333' : 'none')
                        }}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: Legend & Refresh */}
          <div className="d-flex flex-wrap align-items-center gap-2">
            <button
              onClick={handleRefreshToToday}
              className="btn btn-sm rounded-pill px-3 py-1 fw-bold d-flex align-items-center gap-1.5 shadow-sm transition-all"
              style={{
                fontSize: '0.74rem',
                background: isDaySelected(today.getDate()) && viewMonth === today.getMonth() && viewYear === today.getFullYear() ? '#FF6333' : '#fff',
                color: isDaySelected(today.getDate()) && viewMonth === today.getMonth() && viewYear === today.getFullYear() ? '#fff' : '#FF6333',
                border: '1px solid #FF6333'
              }}
              title="Refresh / Reset calendar back to Today's date"
            >
              <RotateCcw size={13} /> Refresh (Today)
            </button>

            {/* Booked Indicator */}
            <div className="d-flex align-items-center gap-1.5 px-2.5 py-1 rounded" style={{ background: '#dbeafe', border: '1px solid #bfdbfe' }}>
              <div style={{ width: '12px', height: '12px', background: '#dbeafe', border: '1px solid #2563eb', borderRadius: '3px' }} />
              <span style={{ fontSize: '0.74rem', color: '#1e40af', fontWeight: 600 }}>Booked</span>
            </div>

            {/* Block / Override Quick Buttons */}
            <button
              onClick={() => { setActionForm(f => ({ ...f, status: 'Blocked' })); setActionPanel(true); }}
              className="btn btn-sm rounded-pill px-3 py-1 fw-semibold text-xs border"
              style={{ background: '#fff', color: '#d63031' }}
              title="Block dates or manage stop sales"
            >
              <Lock size={12} className="me-1" /> Block Dates
            </button>
          </div>
        </div>

        {/* Action Panel for Blocking / Price Overrides */}
        {actionPanel && (
          <div className="border rounded-4 p-3 mt-3 bg-light animate-fade-in" style={{ border: '1.5px solid #FF6333' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="fw-bold mb-0 text-dark text-xs">
                Apply Availability / Rate Changes {selectedDates.length > 0 ? `to ${selectedDates.length} Selected Date(s)` : '(Select dates on calendar below)'}
              </h6>
              <button onClick={() => setActionPanel(null)} className="btn btn-sm btn-link text-muted p-0"><X size={15} /></button>
            </div>
            <div className="row g-2">
              <div className="col-12 col-md-3">
                <label className="form-label text-xxs fw-bold mb-1">Status</label>
                <select className="form-select form-select-sm text-xs" value={actionForm.status} onChange={e => setActionForm(f => ({ ...f, status: e.target.value }))}>
                  {['Blocked', 'Available', 'Sold Out'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label text-xxs fw-bold mb-1">Price Override (₹)</label>
                <input type="number" className="form-control form-control-sm text-xs" placeholder="e.g. 6500" value={actionForm.price_override} onChange={e => setActionForm(f => ({ ...f, price_override: e.target.value }))} />
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label text-xxs fw-bold mb-1">Available Rooms</label>
                <input type="number" className="form-control form-control-sm text-xs" placeholder="e.g. 5" value={actionForm.available_rooms} onChange={e => setActionForm(f => ({ ...f, available_rooms: e.target.value }))} />
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label text-xxs fw-bold mb-1">Block Reason</label>
                <input className="form-control form-control-sm text-xs" placeholder="e.g. renovation, sold out" value={actionForm.block_reason} onChange={e => setActionForm(f => ({ ...f, block_reason: e.target.value }))} />
              </div>
            </div>
            <div className="d-flex gap-2 mt-2.5">
              <button onClick={handleApply} disabled={saving || selectedDates.length === 0} className="btn btn-sm rounded-pill px-3 fw-bold text-white shadow-xs" style={{ background: '#0D1B2E', fontSize: '0.78rem' }}>
                <Save size={12} className="me-1" />{saving ? 'Saving...' : `Apply to ${selectedDates.length} Date(s)`}
              </button>
              {selectedDates.length > 0 && (
                <button onClick={() => setSelectedDates([])} className="btn btn-sm btn-link text-danger p-0 ms-2 text-xs">
                  Clear {selectedDates.length} Selected
                </button>
              )}
            </div>
          </div>
        )}

        {success && <div className="alert alert-success py-2 px-3 mt-3 mb-0 text-xs">{success}</div>}
      </div>

      {/* Main Calendar Grid */}
      <div className="card border-0 rounded-4 shadow-sm mb-4" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="calendar-scroll-wrapper" style={{ overflowX: 'auto', overflowY: 'hidden', paddingBottom: '8px' }}>
          <div style={{ minWidth: '980px' }}>
            {/* Days Header */}
            <div className="d-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {DAYS.map(d => (
                <div key={d} className="text-center py-2.5 fw-bold" style={{ fontSize: '0.72rem', color: '#64748b', letterSpacing: '0.5px' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="d-grid p-2" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
              {emptyBefore.map(i => (
                <div key={`empty-${i}`} className="rounded-3" style={{ minHeight: '94px', background: '#f8fafc', opacity: 0.5 }} />
              ))}

              {days.map(day => {
                const dayBookings = getBookingsForDay(day);
                const isSelected = isDaySelected(day);
                const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
                const hasBookings = dayBookings.length > 0;
                const dateStr = fmtDate(viewYear, viewMonth, day);
                const dayOverride = calendarData[dateStr];
                const isDateMarked = selectedDates.includes(dateStr);

                return (
                  <div
                    key={day}
                    onClick={() => {
                      if (actionPanel) {
                        setSelectedDates(prev => prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]);
                      }
                      handleSelectDay(day);
                    }}
                    className="rounded-3 p-2 d-flex flex-column transition-all position-relative"
                    style={{
                      minHeight: '100px',
                      background: isSelected ? '#FFF5F2' : (isToday ? '#fffaf8' : (hasBookings ? '#f8fafc' : (dayOverride?.status === 'Blocked' ? '#fff0f0' : '#fff'))),
                      border: isSelected ? '2px solid #FF6333' : (isToday ? '1px dashed #FF6333' : (hasBookings ? '1.5px solid #93c5fd' : (dayOverride?.status === 'Blocked' ? '1px solid #fca5a5' : '1px solid #e2e8f0'))),
                      cursor: 'pointer',
                      overflow: 'hidden',
                      boxShadow: isSelected ? '0 0 0 1px #FF6333, 0 4px 12px rgba(255,99,51,0.18)' : 'none',
                      transform: isSelected ? 'scale(1.01)' : 'none'
                    }}
                    title={`Click to focus on ${day} ${MONTH_NAMES[viewMonth]}`}
                  >
                    {/* Day Number Header */}
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="fw-bold d-flex align-items-center gap-1" style={{ fontSize: '0.82rem', color: isSelected || isToday ? '#FF6333' : '#0D1B2E' }}>
                        {day}
                        {isToday && <span className="badge bg-danger p-0 px-1" style={{ fontSize: '0.58rem' }}>TODAY</span>}
                        {isSelected && !isToday && <span className="badge p-0 px-1" style={{ fontSize: '0.55rem', background: '#FF6333', color: '#fff' }}>ACTIVE</span>}
                      </span>

                      <div className="d-flex align-items-center gap-1">
                        {hasBookings && (
                          <span
                            className="badge rounded-pill shadow-xs"
                            style={{
                              background: isSelected ? '#FF6333' : '#2563eb',
                              color: '#fff',
                              fontSize: '0.62rem',
                              padding: '2px 6px'
                            }}
                            title={`${dayBookings.length} reservation(s) on this date`}
                          >
                            {dayBookings.length} {dayBookings.length === 1 ? 'Booking' : 'Bookings'}
                          </span>
                        )}
                        {dayOverride?.status === 'Blocked' && (
                          <span className="badge bg-danger text-white p-0 px-1" style={{ fontSize: '0.55rem' }}>
                            <Lock size={8} /> Blocked
                          </span>
                        )}
                        {isDateMarked && (
                          <span className="badge bg-warning text-dark p-0 px-1" style={{ fontSize: '0.55rem' }}>
                            <Check size={8} />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price Override Badge if any */}
                    {dayOverride?.price_override && (
                      <div className="text-primary fw-bold text-xxs mb-1">
                        ₹{Number(dayOverride.price_override).toLocaleString('en-IN')}
                      </div>
                    )}

                    {/* Real Bookings Mini Cards (Like Vehicle Calendar) */}
                    <div className="d-flex flex-column gap-1 overflow-hidden mt-0.5">
                      {dayBookings.slice(0, 2).map((b, idx) => {
                        const guestDisplay = b.customer_name || b.name || 'Valued Guest';
                        const roomDisplay = b.room_type || b.room_category || b.item_name || 'Room Stay';

                        return (
                          <div
                            key={b.id || idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectDay(day);
                              setViewBookingModal(b);
                            }}
                            className="rounded p-1 text-truncate shadow-2xs"
                            title={`🏨 ${roomDisplay} • 👤 ${guestDisplay} (${b.status || 'Confirmed'})`}
                            style={{
                              background: '#eff6ff',
                              color: '#1e40af',
                              borderLeft: '3px solid #2563eb',
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              lineHeight: 1.25,
                              cursor: 'pointer'
                            }}
                          >
                            <div className="d-flex align-items-center justify-content-between gap-1">
                              <span className="text-truncate">
                                🏨 {roomDisplay}
                              </span>
                              <span
                                className="badge p-0 px-1"
                                style={{
                                  fontSize: '0.52rem',
                                  background: b.status === 'Checked In' ? '#dcfce7' : '#dbeafe',
                                  color: b.status === 'Checked In' ? '#15803d' : '#1e40af'
                                }}
                              >
                                {b.status || 'Confirmed'}
                              </span>
                            </div>
                            <div className="text-truncate mt-0.5" style={{ fontSize: '0.56rem', fontWeight: 500, opacity: 0.85 }}>
                              👤 {guestDisplay} {b.pickup_time || b.checkin_time ? `• ⏰ ${b.pickup_time || b.checkin_time}` : ''}
                            </div>
                          </div>
                        );
                      })}

                      {/* "+X more" button if > 2 bookings */}
                      {dayBookings.length > 2 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectDay(day);
                          }}
                          className="btn p-0 border-0 text-start w-100 fw-bold d-block text-decoration-none"
                          style={{ fontSize: '0.62rem', color: '#2563eb', cursor: 'pointer' }}
                        >
                          <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary py-0.5 px-1.5 w-100 text-truncate text-start" style={{ fontSize: '0.62rem', fontWeight: 700 }}>
                            +{dayBookings.length - 2} more
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Day Details Drawer (Identical to Vehicle Fleet Calendar & Admin Calendar) */}
      {selectedDayDetails && (
        <div
          ref={dayDetailsRef}
          className="card border-0 rounded-4 shadow-sm p-4 mb-4 animate-fade-in"
          style={{ background: '#fff', borderLeft: '4px solid #FF6333' }}
        >
          <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <div>
                <h5 className="fw-bold mb-1 font-heading" style={{ color: '#0D1B2E', fontSize: '1.15rem' }}>
                  📅 Reservations for {selectedDayDetails.dateStr}
                </h5>
                <p className="text-muted mb-0 text-xs">
                  {selectedDayDetails.bookings.length} active reservation(s) on this date
                </p>
              </div>

              {selectedDayDetails.isToday && (
                <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2.5 py-1 rounded-pill text-xs fw-bold">
                  TODAY
                </span>
              )}
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                onClick={handlePrevDay}
                className="btn btn-sm btn-outline-secondary rounded-pill px-3 text-xs fw-semibold"
              >
                <ChevronLeft size={13} className="me-0.5" /> Prev Date
              </button>
              <button
                onClick={handleNextDay}
                className="btn btn-sm btn-outline-secondary rounded-pill px-3 text-xs fw-semibold"
              >
                Next Date <ChevronRight size={13} className="ms-0.5" />
              </button>
              <button
                onClick={() => setSelectedDayDetails(null)}
                className="btn btn-sm btn-light rounded-circle p-1 text-muted"
                title="Close Drawer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Bookings Table for Selected Day */}
          {selectedDayDetails.bookings.length === 0 ? (
            <div className="p-4 text-center rounded-3 bg-light border text-muted">
              <BedDouble size={28} className="text-muted opacity-50 mb-2" />
              <p className="mb-0 text-xs fw-semibold">No reservations on this date.</p>
              <small className="text-muted">Rooms are available for guest bookings.</small>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 text-xs">
                <thead className="table-light">
                  <tr>
                    <th className="fw-bold text-muted text-xxs text-uppercase py-2.5">Booking ID</th>
                    <th className="fw-bold text-muted text-xxs text-uppercase py-2.5">Guest Name</th>
                    <th className="fw-bold text-muted text-xxs text-uppercase py-2.5">Hotel &amp; Room</th>
                    <th className="fw-bold text-muted text-xxs text-uppercase py-2.5">Stay Dates</th>
                    <th className="fw-bold text-muted text-xxs text-uppercase py-2.5">Guests / Rooms</th>
                    <th className="fw-bold text-muted text-xxs text-uppercase py-2.5">Total &amp; Paid</th>
                    <th className="fw-bold text-muted text-xxs text-uppercase py-2.5">Status</th>
                    <th className="fw-bold text-muted text-xxs text-uppercase py-2.5 text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDayDetails.bookings.map((b, idx) => {
                    const guestName = b.customer_name || b.name || 'Valued Guest';
                    const guestPhone = b.customer_phone || b.phone || '';
                    const hotelName = b.hotel_name || b.item_name || 'Hotel Property';
                    const roomName = b.room_type || b.room_category || 'Standard Room';
                    const checkIn = normalizeCalendarDate(b.check_in_date || b.pickup_date);
                    const checkOut = normalizeCalendarDate(b.check_out_date || b.drop_date) || checkIn;
                    const totalVal = b.total_amount || b.total_paid || 0;
                    const paidVal = b.amount_paid || 0;

                    return (
                      <tr key={b.id || idx}>
                        <td>
                          <span className="fw-bold text-dark font-monospace">
                            #{String(b.id || b.booking_id || '').replace(/^#/, '')}
                          </span>
                        </td>
                        <td>
                          <div className="fw-bold text-dark">{guestName}</div>
                          {guestPhone && (
                            <div className="text-muted text-xxs d-flex align-items-center gap-1">
                              <Phone size={10} /> +91 {guestPhone}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="fw-bold text-dark">{hotelName}</div>
                          <div className="text-muted text-xxs">{roomName}</div>
                        </td>
                        <td>
                          <div className="fw-semibold text-dark">{checkIn} → {checkOut}</div>
                          <div className="text-muted text-xxs">
                            {b.booking_days ? `${b.booking_days} Nights` : 'Resort Stay'}
                          </div>
                        </td>
                        <td>
                          <div className="fw-semibold text-dark">
                            {b.adults ? `${b.adults} Adults` : '2 Guests'}
                            {b.children ? `, ${b.children} Child` : ''}
                          </div>
                          <div className="text-muted text-xxs">
                            {b.num_rooms ? `${b.num_rooms} Room(s)` : '1 Room'}
                          </div>
                        </td>
                        <td>
                          <div className="fw-bold text-dark">₹{Number(totalVal).toLocaleString('en-IN')}</div>
                          <div className="text-success text-xxs fw-semibold">
                            {paidVal > 0 ? `Paid: ₹${Number(paidVal).toLocaleString('en-IN')}` : (b.payment_mode || 'Pay at Hotel')}
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill text-xxs fw-bold">
                            {b.status || 'Confirmed'}
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            onClick={() => setViewBookingModal(b)}
                            className="btn btn-sm btn-outline-primary rounded-pill px-2.5 py-1 text-xxs fw-bold d-inline-flex align-items-center gap-1 shadow-2xs"
                          >
                            <Eye size={12} /> View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Booking View Modal */}
      {viewBookingModal && (
        <div className="checkout-modal-backdrop" onClick={() => setViewBookingModal(null)}>
          <div className="checkout-modal-content animate-fade-in-up" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
            <div className="checkout-header bg-dark text-white d-flex align-items-center justify-content-between p-3 rounded-top-4">
              <div className="d-flex align-items-center gap-2">
                <BedDouble size={20} className="text-warning" />
                <h5 className="m-0 fw-bold font-heading">
                  Reservation #{String(viewBookingModal.id || viewBookingModal.booking_id || '').replace(/^#/, '')}
                </h5>
              </div>
              <button type="button" className="btn btn-link text-white p-0 border-0" onClick={() => setViewBookingModal(null)}>
                <X size={22} />
              </button>
            </div>

            <div className="p-4 text-start">
              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <div>
                  <h5 className="fw-bold mb-0 text-dark font-heading">
                    {viewBookingModal.hotel_name || viewBookingModal.item_name || 'Hotel Stay'}
                  </h5>
                  <span className="text-muted text-xs">
                    {viewBookingModal.room_type || viewBookingModal.room_category || 'Standard Room'}
                  </span>
                </div>
                <span className="badge bg-success text-white px-2.5 py-1 rounded-pill text-xs fw-bold">
                  {viewBookingModal.status || 'Confirmed'}
                </span>
              </div>

              <div className="row g-2 mb-3 text-xs">
                <div className="col-6">
                  <span className="text-muted d-block text-xxs text-uppercase">Guest Name</span>
                  <strong className="text-dark fs-6">{viewBookingModal.customer_name || viewBookingModal.name || 'Valued Guest'}</strong>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block text-xxs text-uppercase">Contact Mobile</span>
                  <strong className="text-dark fs-6">+91 {viewBookingModal.customer_phone || viewBookingModal.phone || 'N/A'}</strong>
                </div>
                {viewBookingModal.customer_email && (
                  <div className="col-12 mt-1">
                    <span className="text-muted d-block text-xxs text-uppercase">Email Address</span>
                    <span className="text-dark">{viewBookingModal.customer_email}</span>
                  </div>
                )}
              </div>

              <div className="bg-light rounded-3 p-3 mb-3 border text-xs">
                <div className="d-flex justify-content-between mb-1.5">
                  <span className="text-muted">Check-in Date:</span>
                  <strong className="text-dark">{normalizeCalendarDate(viewBookingModal.check_in_date || viewBookingModal.pickup_date)} ({viewBookingModal.checkin_time || '02:00 PM'})</strong>
                </div>
                <div className="d-flex justify-content-between mb-1.5">
                  <span className="text-muted">Check-out Date:</span>
                  <strong className="text-dark">{normalizeCalendarDate(viewBookingModal.check_out_date || viewBookingModal.drop_date)} ({viewBookingModal.checkout_time || '11:00 AM'})</strong>
                </div>
                <div className="d-flex justify-content-between mb-1.5">
                  <span className="text-muted">Guests &amp; Rooms:</span>
                  <strong className="text-dark">
                    {viewBookingModal.adults ? `${viewBookingModal.adults} Adults` : '2 Guests'}
                    {viewBookingModal.children ? `, ${viewBookingModal.children} Children` : ''} 
                    ({viewBookingModal.num_rooms || 1} Room)
                  </strong>
                </div>
                {viewBookingModal.driver_required && (
                  <div className="d-flex justify-content-between text-warning-emphasis fw-bold pt-1 border-top">
                    <span>Chauffeur Service:</span>
                    <span>✓ Included ({viewBookingModal.driver_service_type || 'Dedicated Chauffeur'})</span>
                  </div>
                )}
              </div>

              <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                <div>
                  <span className="text-muted text-xxs text-uppercase d-block">Total Booking Amount</span>
                  <strong className="text-dark fs-5 font-heading">₹{Number(viewBookingModal.total_amount || viewBookingModal.total_paid || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div className="text-end">
                  <span className="text-muted text-xxs text-uppercase d-block">Payment Method</span>
                  <span className="badge bg-warning-subtle text-dark border border-warning-subtle px-2 py-1 fw-bold text-xs">
                    {viewBookingModal.payment_mode || 'Pay at Hotel Front Desk'}
                  </span>
                </div>
              </div>

              <div className="mt-4 text-end">
                <button
                  type="button"
                  className="btn btn-secondary rounded-pill px-4 py-2 text-xs fw-bold"
                  onClick={() => setViewBookingModal(null)}
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
