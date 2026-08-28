import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTodayDateStr } from '../utils/dateUtils';

export default function DatePickerPopover({
  selectedDate,
  onDateChange,
  selectedTime,
  onTimeChange,
  onClose,
  title,
  minDate
}) {
  const todayStr = getTodayDateStr();
  const effectiveMinDate = minDate || todayStr;

  // Initial view month based on selectedDate or today
  const initialDate = selectedDate ? new Date(selectedDate) : new Date();
  const [viewYear, setViewYear] = useState(isNaN(initialDate.getTime()) ? new Date().getFullYear() : initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(isNaN(initialDate.getTime()) ? new Date().getMonth() : initialDate.getMonth()); // 0-indexed

  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const timeOptions = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', 
    '18:00', '19:00', '20:00', '21:00', '22:00'
  ];

  // Calculate days in viewMonth
  const daysInMonthCount = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun, 1 = Mon ...

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleDayClick = (day) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateStr = `${viewYear}-${mm}-${dd}`;
    if (dateStr < effectiveMinDate) return;
    onDateChange(dateStr);
  };

  return (
    <div className="datepicker-popover-card animate-fade-in shadow-lg" style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '16px', zIndex: 9999 }}>
      <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
        <span className="fw-bold text-primary small d-flex align-items-center gap-1">
          <CalendarIcon size={16} className="text-warning" />
          {title || "Select Date & Time"}
        </span>
        <button type="button" className="btn btn-link p-0 text-muted" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="row g-0">
        {/* Left Column: Calendar Grid */}
        <div className="col-8 pe-3 border-end">
          {/* Month & Year Navigation Header */}
          <div className="d-flex justify-content-between align-items-center mb-2 px-1">
            <button
              type="button"
              className="btn btn-sm p-1 border-0 text-secondary"
              onClick={handlePrevMonth}
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="fw-bold text-dark small">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              className="btn btn-sm p-1 border-0 text-secondary"
              onClick={handleNextMonth}
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="calendar-weekdays-grid mb-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>
            {weekdays.map((wd, i) => (
              <span key={i}>{wd}</span>
            ))}
          </div>

          <div className="calendar-days-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
            {/* Empty slots for start offset */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <span key={`empty-${i}`} className="calendar-day-empty"></span>
            ))}
            
            {/* Real Days */}
            {Array.from({ length: daysInMonthCount }, (_, i) => i + 1).map((day) => {
              const mm = String(viewMonth + 1).padStart(2, '0');
              const dd = String(day).padStart(2, '0');
              const dateStr = `${viewYear}-${mm}-${dd}`;
              const isSelected = dateStr === selectedDate;
              const isPast = dateStr < effectiveMinDate;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isPast}
                  style={{
                    padding: '6px 0',
                    fontSize: '12px',
                    fontWeight: isSelected ? 700 : 500,
                    borderRadius: '8px',
                    border: 'none',
                    background: isSelected ? '#FF6333' : 'transparent',
                    color: isSelected ? '#fff' : (isPast ? '#cbd5e1' : '#1e293b'),
                    opacity: isPast ? 0.35 : 1,
                    cursor: isPast ? 'not-allowed' : 'pointer',
                    pointerEvents: isPast ? 'none' : 'auto',
                    transition: 'all 0.15s'
                  }}
                  onClick={() => handleDayClick(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Time List */}
        <div className="col-4 ps-3">
          <span className="d-block text-center fw-bold mb-2 text-secondary small d-flex align-items-center justify-content-center gap-1">
            <Clock size={12} />
            Time
          </span>
          <div className="datepicker-time-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {timeOptions.map((time) => {
              const isSelected = time === selectedTime;
              return (
                <button
                  key={time}
                  type="button"
                  className={`btn btn-sm w-100 mb-1 py-1 ${isSelected ? 'btn-warning text-white fw-bold' : 'btn-light text-dark'}`}
                  style={{ fontSize: '11px', borderRadius: '6px' }}
                  onClick={() => onTimeChange(time)}
                >
                  {time}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="mt-3 text-end border-top pt-2">
        <button type="button" className="btn btn-warning btn-sm text-white px-3 py-1 rounded-pill fw-bold" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
