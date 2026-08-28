import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Car } from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function VehicleFleetCalendar({ cars = [], bikes = [], bookings = [] }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedVehicle, setSelectedVehicle] = useState('all');

  const allVehicles = [
    ...(cars || []).map(c => ({ ...c, type: 'car' })),
    ...(bikes || []).map(b => ({ ...b, type: 'bike' }))
  ];

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
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  // Filter real bookings for a specific day in viewMonth & viewYear
  const getBookingsForDay = (day) => {
    const checkDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const checkDate = new Date(viewYear, viewMonth, day);

    return (bookings || []).filter(b => {
      if (b.status === 'Cancelled') return false;

      // Match selected vehicle
      if (selectedVehicle !== 'all') {
        const vehicleMatch = (b.item_name && b.item_name.toLowerCase().includes(selectedVehicle.toLowerCase())) ||
                             b.item_id === selectedVehicle;
        if (!vehicleMatch) return false;
      }

      // Check date range
      const pickup = b.pickup_date ? new Date(b.pickup_date) : null;
      const drop = b.drop_date ? new Date(b.drop_date) : pickup;

      if (!pickup) return false;

      // Format comparisons or Date comparisons
      const pStr = b.pickup_date ? b.pickup_date.slice(0, 10) : '';
      const dStr = b.drop_date ? b.drop_date.slice(0, 10) : pStr;

      if (pStr && dStr) {
        return checkDateStr >= pStr && checkDateStr <= dStr;
      }

      return checkDate >= pickup && checkDate <= (drop || pickup);
    });
  };

  // Calculate real stats for each vehicle in the fleet
  const vehicleStats = allVehicles.map(v => {
    let bookedCount = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const checkDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hasBooking = (bookings || []).some(b => {
        if (b.status === 'Cancelled') return false;
        const matchesVeh = (b.item_id === v.id) || (b.item_name && b.item_name.toLowerCase() === v.name?.toLowerCase());
        if (!matchesVeh) return false;

        const pStr = b.pickup_date ? b.pickup_date.slice(0, 10) : '';
        const dStr = b.drop_date ? b.drop_date.slice(0, 10) : pStr;
        return checkDateStr >= pStr && checkDateStr <= dStr;
      });
      if (hasBooking) bookedCount++;
    }

    const availableCount = Math.max(0, daysInMonth - bookedCount);
    const occupancyPct = Math.round((bookedCount / daysInMonth) * 100);

    return {
      ...v,
      bookedDays: bookedCount,
      availableDays: availableCount,
      occupancy: occupancyPct
    };
  });

  return (
    <div className="p-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: '#0D1B2E', fontSize: '16px' }}>Fleet Calendar</h5>
          <p className="mb-0 mt-1" style={{ fontSize: '0.78rem', color: '#64748b' }}>Real-time vehicle availability and bookings from database</p>
        </div>
        <div className="d-flex gap-2">
          <select className="form-select form-select-sm" style={{ fontSize: '0.82rem', borderRadius: '10px', maxWidth: '200px' }} value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)}>
            <option value="all">All Vehicles ({allVehicles.length})</option>
            {allVehicles.map(v => <option key={v.id} value={v.name}>{v.name} ({v.type})</option>)}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="d-flex gap-3 mb-3 flex-wrap">
        {[
          { label: 'Available', color: '#dcfce7', border: '#16a34a' },
          { label: 'Booked', color: '#dbeafe', border: '#2563eb' },
          { label: 'Today', color: '#FFF5F2', border: '#FF6333' },
        ].map(l => (
          <div key={l.label} className="d-flex align-items-center gap-1">
            <div style={{ width: '12px', height: '12px', background: l.color, border: `1px solid ${l.border}`, borderRadius: '3px' }} />
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="rounded-3 overflow-hidden shadow-sm" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between px-4 py-3" style={{ background: '#0D1B2E' }}>
          <button onClick={prevMonth} className="btn btn-sm p-1 border-0 text-white-50" style={{ background: 'transparent' }}><ChevronLeft size={18} /></button>
          <div className="fw-bold text-white" style={{ fontSize: '16px' }}>{MONTHS[viewMonth]} {viewYear}</div>
          <button onClick={nextMonth} className="btn btn-sm p-1 border-0 text-white-50" style={{ background: 'transparent' }}><ChevronRight size={18} /></button>
        </div>

        {/* Day Names */}
        <div className="d-grid px-2 pt-2" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {DAYS.map(d => (
            <div key={d} className="text-center py-2 fw-bold" style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>{d}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="d-grid px-2 pb-2" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {emptyBefore.map(i => <div key={`empty-${i}`} />)}
          {days.map(day => {
            const dayBookings = getBookingsForDay(day);
            const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
            const hasBooking = dayBookings.length > 0;
            return (
              <div key={day} className="rounded-2 p-1" style={{ minHeight: '70px', background: isToday ? '#FFF5F2' : hasBooking ? '#f0f7ff' : '#fff', border: `1px solid ${isToday ? '#FF6333' : hasBooking ? '#93c5fd' : '#f1f5f9'}`, cursor: 'default' }}>
                <div className="fw-bold mb-1" style={{ fontSize: '0.78rem', color: isToday ? '#FF6333' : '#0D1B2E' }}>{day}</div>
                {dayBookings.slice(0, 2).map(b => (
                  <div key={b.id} className="rounded-1 px-1 mb-1 text-truncate" title={`${b.item_name || 'Vehicle'} — ${b.name || b.customer_name || 'Customer'}`} style={{ background: '#dbeafe', color: '#1e40af', fontSize: '0.62rem', fontWeight: 700, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.item_name || 'Booked'} · {b.name || 'Client'}
                  </div>
                ))}
                {dayBookings.length > 2 && <div style={{ fontSize: '0.55rem', color: '#2563eb', fontWeight: 600 }}>+{dayBookings.length - 2} more</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Vehicle Availability List */}
      <div className="mt-4 rounded-3 overflow-hidden shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.07)', background: '#fff' }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="fw-bold" style={{ color: '#0D1B2E', fontSize: '13px' }}>Fleet Utilization for {MONTHS[viewMonth]} {viewYear}</div>
        </div>
        <div className="table-responsive">
          <table className="table align-middle mb-0" style={{ fontSize: '0.82rem' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th className="px-3 py-2 fw-bold" style={{ color: '#475569', fontSize: '0.65rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>Vehicle</th>
                <th className="px-3 py-2 fw-bold" style={{ color: '#475569', fontSize: '0.65rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>Type</th>
                <th className="px-3 py-2 fw-bold" style={{ color: '#475569', fontSize: '0.65rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>Booked Days</th>
                <th className="px-3 py-2 fw-bold" style={{ color: '#475569', fontSize: '0.65rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>Available Days</th>
                <th className="px-3 py-2 fw-bold" style={{ color: '#475569', fontSize: '0.65rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>Occupancy</th>
              </tr>
            </thead>
            <tbody>
              {vehicleStats.map((v) => (
                <tr key={v.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <td className="px-3 py-2 fw-bold" style={{ color: '#0D1B2E' }}>{v.name}</td>
                  <td className="px-3 py-2"><span className="px-2 py-1 rounded-pill fw-bold" style={{ background: v.type === 'car' ? '#dbeafe' : '#ede9fe', color: v.type === 'car' ? '#2563eb' : '#7c3aed', fontSize: '0.65rem', textTransform: 'uppercase' }}>{v.type}</span></td>
                  <td className="px-3 py-2 fw-bold" style={{ color: v.bookedDays > 0 ? '#dc2626' : '#64748b' }}>{v.bookedDays} days</td>
                  <td className="px-3 py-2 fw-bold" style={{ color: '#16a34a' }}>{v.availableDays} days</td>
                  <td className="px-3 py-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="flex-grow-1 rounded-pill overflow-hidden" style={{ height: '6px', background: '#f1f5f9' }}>
                        <div className="rounded-pill" style={{ width: `${v.occupancy}%`, height: '100%', background: v.occupancy >= 80 ? '#dc2626' : v.occupancy >= 50 ? '#d97706' : '#16a34a' }} />
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0D1B2E' }}>{v.occupancy}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {vehicleStats.length === 0 && <tr><td colSpan="5" className="px-3 py-4 text-center text-muted">No vehicles in fleet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

