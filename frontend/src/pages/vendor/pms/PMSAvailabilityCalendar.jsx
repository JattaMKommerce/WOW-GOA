import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Lock, Unlock, DollarSign, RefreshCw,
  AlertTriangle, Check, X, BedDouble, Calendar, Save
} from 'lucide-react';
import * as api from '../../../services/api';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function PMSAvailabilityCalendar({ currentUser, vendorHotels }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedHotel, setSelectedHotel] = useState((vendorHotels || [])[0]?.id || '');
  const [roomTypes, setRoomTypes] = useState([]);
  const [selectedRoomType, setSelectedRoomType] = useState('');
  const [calendarData, setCalendarData] = useState({});
  const [selectedDates, setSelectedDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionPanel, setActionPanel] = useState(null);
  const [actionForm, setActionForm] = useState({
    status: 'Blocked', block_reason: '', available_rooms: '', price_override: '', min_stay: 1, stop_sale: false
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!selectedHotel) return;
    const vendorId = currentUser?.id || 'admin';
    api.pmsListRoomTypes(vendorId).then(res => {
      let hotelTypes = (res.room_types || []).filter(rt => rt.hotel_id === selectedHotel);
      if (hotelTypes.length === 0) {
        const currentHotel = (vendorHotels || []).find(h => h.id === selectedHotel);
        hotelTypes = [{
          id: `std_${selectedHotel}`,
          hotel_id: selectedHotel,
          name: 'Standard Room / All Rooms',
          price: currentHotel?.price || 5000,
          total_rooms: 10
        }];
      }
      setRoomTypes(hotelTypes);
      if (hotelTypes.length > 0) setSelectedRoomType(hotelTypes[0].id);
    }).catch(() => {
      const currentHotel = (vendorHotels || []).find(h => h.id === selectedHotel);
      const fallback = [{
        id: `std_${selectedHotel}`,
        hotel_id: selectedHotel,
        name: 'Standard Room / All Rooms',
        price: currentHotel?.price || 5000,
        total_rooms: 10
      }];
      setRoomTypes(fallback);
      setSelectedRoomType(fallback[0].id);
    });
  }, [selectedHotel, currentUser?.id]);

  useEffect(() => {
    if (!selectedHotel || !selectedRoomType) return;
    setLoading(true);
    const fromDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = getDaysInMonth(year, month);
    const toDate = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`;
    api.pmsGetAvailabilityCalendar(selectedHotel, selectedRoomType, fromDate, toDate)
      .then(res => {
        const map = {};
        (res.calendar || []).forEach(entry => { map[entry.date] = entry; });
        setCalendarData(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedHotel, selectedRoomType, year, month]);

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); setSelectedDates([]); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); setSelectedDates([]); };

  const fmtDate = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const toggleDate = (dateStr) => {
    setSelectedDates(prev => prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]);
  };

  const handleApply = async () => {
    if (selectedDates.length === 0) { alert('Select at least one date'); return; }
    setSaving(true);
    try {
      await api.pmsUpdateAvailability({
        hotel_id: selectedHotel,
        room_type_id: selectedRoomType,
        vendor_id: currentUser.id,
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
      const fromDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = getDaysInMonth(year, month);
      const toDate = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`;
      const res = await api.pmsGetAvailabilityCalendar(selectedHotel, selectedRoomType, fromDate, toDate);
      const map = {};
      (res.calendar || []).forEach(entry => { map[entry.date] = entry; });
      setCalendarData(map);
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      alert('Error: ' + e.message);
    } finally { setSaving(false); }
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const todayStr = today.toISOString().split('T')[0];

  const getDayStyle = (dateStr) => {
    const data = calendarData[dateStr];
    if (!data) return { bg: '#fff', color: '#2d3748', border: '#dee2e6' };
    if (data.stop_sale) return { bg: '#fff3f0', color: '#d63031', border: '#e17055' };
    if (data.status === 'Blocked') return { bg: '#fff0f0', color: '#d63031', border: '#e17055' };
    if (data.status === 'Sold Out') return { bg: '#ffeaa7', color: '#e17055', border: '#fdcb6e' };
    return { bg: '#edf7f0', color: '#00b894', border: '#00b894' };
  };

  return (
    <div className="p-4" style={{ background: '#f0f2f5', minHeight: '100%' }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#1a2b4a' }}>Availability Calendar</h4>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Manage room availability, blocking and pricing by date</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card border-0 rounded-4 shadow-sm p-4 mb-4" style={{ background: '#fff' }}>
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-4">
            <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Hotel</label>
            <select className="form-select form-select-sm rounded-3" value={selectedHotel} onChange={e => { setSelectedHotel(e.target.value); setSelectedDates([]); }}>
              {vendorHotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-4">
            <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Room Type</label>
            <select className="form-select form-select-sm rounded-3" value={selectedRoomType} onChange={e => { setSelectedRoomType(e.target.value); setSelectedDates([]); }}>
              {roomTypes.length === 0 ? <option>No room types — add one first</option> : roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-4">
            <div className="d-flex gap-2 flex-wrap">
              {[['Block Selected', 'Blocked', '#d63031', '#fff0f0'], ['Set Available', 'Available', '#00b894', '#edf7f0'], ['Stop Sale', 'Blocked', '#e17055', '#fff3f0']].map(([label, status, color, bg]) => (
                <button key={label} onClick={() => { setActionForm(f => ({ ...f, status, stop_sale: label === 'Stop Sale' })); setActionPanel(true); }} disabled={selectedDates.length === 0}
                  className="btn btn-sm rounded-pill px-3 fw-bold"
                  style={{ background: selectedDates.length > 0 ? bg : '#f8f9fa', color: selectedDates.length > 0 ? color : '#adb5bd', border: 'none', fontSize: '0.78rem' }}>
                  {label}
                </button>
              ))}
              <button onClick={() => { setActionForm(f => ({ ...f, status: 'Available' })); setActionPanel('price'); }} disabled={selectedDates.length === 0} className="btn btn-sm rounded-pill px-3 fw-bold" style={{ background: selectedDates.length > 0 ? '#e3f2fd' : '#f8f9fa', color: selectedDates.length > 0 ? '#0984e3' : '#adb5bd', border: 'none', fontSize: '0.78rem' }}>
                Update Price
              </button>
            </div>
          </div>
        </div>

        {selectedDates.length > 0 && (
          <div className="mt-3 d-flex align-items-center gap-2">
            <span className="badge rounded-pill px-3 py-1" style={{ background: '#e3f2fd', color: '#0984e3', fontSize: '0.78rem' }}>
              {selectedDates.length} date(s) selected
            </span>
            <button onClick={() => setSelectedDates([])} className="btn btn-sm btn-link text-danger p-0" style={{ fontSize: '0.78rem' }}>Clear Selection</button>
          </div>
        )}

        {success && <div className="alert alert-success py-2 px-3 mt-3 mb-0" style={{ fontSize: '0.82rem' }}>{success}</div>}
      </div>

      {/* Action Panel */}
      {actionPanel && (
        <div className="card border-0 rounded-4 shadow-sm p-4 mb-4" style={{ background: '#fff', border: '2px solid #FF6333 !important' }}>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h6 className="fw-bold mb-0" style={{ color: '#1a2b4a' }}>Apply Changes to {selectedDates.length} Date(s)</h6>
            <button onClick={() => setActionPanel(null)} className="btn btn-sm btn-link text-muted p-0"><X size={16} /></button>
          </div>
          <div className="row g-3">
            <div className="col-12 col-md-3">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Status</label>
              <select className="form-select form-select-sm" value={actionForm.status} onChange={e => setActionForm(f => ({ ...f, status: e.target.value }))}>
                {['Available', 'Blocked', 'Sold Out'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Price Override (₹)</label>
              <input type="number" className="form-control form-control-sm" placeholder="Leave blank to keep current" value={actionForm.price_override} onChange={e => setActionForm(f => ({ ...f, price_override: e.target.value }))} />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Available Rooms</label>
              <input type="number" className="form-control form-control-sm" placeholder="e.g. 5" value={actionForm.available_rooms} onChange={e => setActionForm(f => ({ ...f, available_rooms: e.target.value }))} />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Min Stay (nights)</label>
              <input type="number" className="form-control form-control-sm" value={actionForm.min_stay} onChange={e => setActionForm(f => ({ ...f, min_stay: parseInt(e.target.value) }))} />
            </div>
            {actionForm.status === 'Blocked' && (
              <div className="col-12">
                <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Block Reason</label>
                <input className="form-control form-control-sm" placeholder="Reason for blocking (e.g. renovation, sold out)" value={actionForm.block_reason} onChange={e => setActionForm(f => ({ ...f, block_reason: e.target.value }))} />
              </div>
            )}
          </div>
          <div className="d-flex gap-2 mt-3">
            <button onClick={handleApply} disabled={saving} className="btn rounded-pill px-4 fw-bold" style={{ background: '#0D1B2E', color: '#fff', fontSize: '0.85rem' }}>
              <Save size={13} className="me-1" />{saving ? 'Saving...' : 'Apply to Selected Dates'}
            </button>
            <button onClick={() => setActionPanel(null)} className="btn rounded-pill px-4" style={{ background: '#f0f2f5', color: '#495057', fontSize: '0.85rem' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="card border-0 rounded-4 shadow-sm p-4" style={{ background: '#fff' }}>
        {/* Month Nav */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <button onClick={prevMonth} className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', background: '#f0f2f5', border: 'none' }}>
            <ChevronLeft size={16} />
          </button>
          <h5 className="fw-bold mb-0" style={{ color: '#1a2b4a' }}>{MONTH_NAMES[month]} {year}</h5>
          <button onClick={nextMonth} className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', background: '#f0f2f5', border: 'none' }}>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Legend */}
        <div className="d-flex gap-3 mb-4 flex-wrap">
          {[['Available', '#edf7f0', '#00b894'], ['Blocked', '#fff0f0', '#d63031'], ['Sold Out', '#fff9e6', '#e17055'], ['Today', '#0D1B2E', '#fff']].map(([l, bg, c]) => (
            <div key={l} className="d-flex align-items-center gap-1">
              <div className="rounded" style={{ width: '14px', height: '14px', background: bg, border: `1px solid ${c}` }}></div>
              <span style={{ fontSize: '0.72rem', color: '#6c757d' }}>{l}</span>
            </div>
          ))}
        </div>

        {/* Day headers */}
        <div className="row g-1 mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="col text-center" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6c757d', padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" style={{ width: '2rem', height: '2rem' }}></div></div>
        ) : (
          <div>
            {Array.from({ length: Math.ceil((firstDay + daysInMonth) / 7) }).map((_, weekIdx) => (
              <div key={weekIdx} className="row g-1 mb-1">
                {Array.from({ length: 7 }).map((_, dayOfWeek) => {
                  const dayNum = weekIdx * 7 + dayOfWeek - firstDay + 1;
                  if (dayNum < 1 || dayNum > daysInMonth) return <div key={dayOfWeek} className="col" style={{ minHeight: '72px' }}></div>;
                  const dateStr = fmtDate(year, month, dayNum);
                  const isToday = dateStr === todayStr;
                  const isSelected = selectedDates.includes(dateStr);
                  const dayData = calendarData[dateStr];
                  const style = getDayStyle(dateStr);
                  const isPast = dateStr < todayStr;

                  return (
                    <div key={dayOfWeek} className="col">
                      <div
                        onClick={() => !isPast && toggleDate(dateStr)}
                        className="rounded-3 p-2 d-flex flex-column"
                        style={{
                          minHeight: '72px',
                          background: isSelected ? '#0D1B2E' : isToday ? '#0D1B2E' : style.bg,
                          border: `1.5px solid ${isSelected ? '#FF6333' : isToday ? '#FF6333' : style.border}`,
                          cursor: isPast ? 'not-allowed' : 'pointer',
                          opacity: isPast ? 0.4 : 1,
                          transition: 'all 0.15s'
                        }}
                      >
                        <div className="fw-bold" style={{ fontSize: '0.85rem', color: isSelected || isToday ? '#fff' : style.color }}>{dayNum}</div>
                        {dayData?.price_override && (
                          <div style={{ fontSize: '0.62rem', color: isSelected || isToday ? '#a0aec0' : '#0984e3', marginTop: '2px' }}>₹{dayData.price_override}</div>
                        )}
                        {dayData?.status === 'Blocked' && (
                          <div style={{ fontSize: '0.6rem', color: isSelected || isToday ? '#fc8181' : '#d63031', marginTop: '2px' }}>
                            <Lock size={9} className="me-1" />Blocked
                          </div>
                        )}
                        {dayData?.stop_sale === 1 && (
                          <div style={{ fontSize: '0.6rem', color: '#e17055', marginTop: '2px' }}>Stop Sale</div>
                        )}
                        {dayData?.available_rooms !== null && dayData?.available_rooms !== undefined && (
                          <div style={{ fontSize: '0.62rem', color: isSelected || isToday ? '#a0aec0' : '#6c757d', marginTop: '2px' }}>{dayData.available_rooms} rooms</div>
                        )}
                        {isSelected && <Check size={10} color="#FF6333" style={{ marginTop: 'auto', alignSelf: 'flex-end' }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {roomTypes.length === 0 && (
          <div className="alert alert-warning mt-3 py-2 px-3" style={{ fontSize: '0.82rem' }}>
            ⚠️ No room types found for this hotel. Go to <strong>Rooms & Room Types</strong> to create room types first, then manage their availability here.
          </div>
        )}
      </div>
    </div>
  );
}
