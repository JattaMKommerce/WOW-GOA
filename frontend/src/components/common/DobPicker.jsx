import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { calculateAge as calcAgeUtil } from '../../utils/dateUtils';

const DOB_MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
];

const DEFAULT_MAX_YEAR = 2026;
const DEFAULT_MIN_YEAR = 1930;

export default function DobPicker({
  value = '',
  onChange,
  required = false,
  id = 'dob-picker',
  referenceDate = null,
  maxYear: propMaxYear = DEFAULT_MAX_YEAR,
  minYear: propMinYear = DEFAULT_MIN_YEAR
}) {
  const effectiveMaxYear = Number(propMaxYear) || DEFAULT_MAX_YEAR;
  const effectiveMinYear = Number(propMinYear) || DEFAULT_MIN_YEAR;

  const yearsList = useMemo(() => {
    return Array.from(
      { length: effectiveMaxYear - effectiveMinYear + 1 },
      (_, i) => String(effectiveMaxYear - i)
    );
  }, [effectiveMaxYear, effectiveMinYear]);
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [mode, setMode] = useState('dropdown'); // 'dropdown' | 'type'
  const [typeInput, setTypeInput] = useState('');

  // Sync state from value prop (YYYY-MM-DD)
  useEffect(() => {
    if (value && typeof value === 'string' && value.includes('-')) {
      const parts = value.split('-');
      if (parts.length === 3) {
        setYear(parts[0] || '');
        setMonth(parts[1] || '');
        setDay(parts[2] || '');
        setTypeInput(`${parts[2]}/${parts[1]}/${parts[0]}`);
      }
    } else if (!value) {
      setDay('');
      setMonth('');
      setYear('');
      setTypeInput('');
    }
  }, [value]);

  // Determine max days in selected month & year
  const getDaysInMonth = (m, y) => {
    if (!m) return 31;
    const mo = parseInt(m, 10);
    const yr = parseInt(y, 10) || 2000;
    return new Date(yr, mo, 0).getDate();
  };

  const daysCount = getDaysInMonth(month, year);
  const daysList = Array.from({ length: daysCount }, (_, i) => String(i + 1).padStart(2, '0'));

  const handleSelect = (newDay, newMonth, newYear) => {
    setDay(newDay);
    setMonth(newMonth);
    setYear(newYear);

    if (newDay && newMonth && newYear) {
      const maxD = getDaysInMonth(newMonth, newYear);
      let validD = newDay;
      if (parseInt(newDay, 10) > maxD) {
        validD = String(maxD).padStart(2, '0');
        setDay(validD);
      }
      const formatted = `${newYear}-${newMonth}-${validD}`;
      onChange(formatted);
      setTypeInput(`${validD}/${newMonth}/${newYear}`);
    } else {
      onChange('');
    }
  };

  // Direct typing handler with auto slashes (DD/MM/YYYY)
  const handleTypeChange = (e) => {
    let input = e.target.value.replace(/[^\d]/g, '');
    if (input.length > 8) input = input.slice(0, 8);

    let formatted = '';
    if (input.length > 0) {
      formatted = input.slice(0, 2);
      if (input.length >= 2) {
        formatted += '/' + input.slice(2, 4);
      }
      if (input.length >= 4) {
        formatted += '/' + input.slice(4, 8);
      }
    }
    setTypeInput(formatted);

    if (input.length === 8) {
      const d = input.slice(0, 2);
      const m = input.slice(2, 4);
      const y = input.slice(4, 8);
      const dNum = parseInt(d, 10);
      const mNum = parseInt(m, 10);
      const yNum = parseInt(y, 10);

      if (dNum >= 1 && dNum <= 31 && mNum >= 1 && mNum <= 12 && yNum >= effectiveMinYear && yNum <= effectiveMaxYear) {
        setDay(d);
        setMonth(m);
        setYear(y);
        onChange(`${y}-${m}-${d}`);
      }
    } else {
      onChange('');
    }
  };

  // Calculate age using centralized utility against reference date
  const age = useMemo(() => {
    if (!day || !month || !year) return null;
    const formatted = `${year}-${month}-${day}`;
    return calcAgeUtil(formatted, referenceDate);
  }, [day, month, year, referenceDate]);

  const selectedMonthObj = DOB_MONTHS.find(m => m.value === month);

  return (
    <div className="dob-picker-container">
      {/* Hidden input for HTML5 form validation */}
      <input
        id={id}
        type="text"
        value={value || ''}
        onChange={() => {}}
        required={required}
        tabIndex={-1}
        style={{ position: 'absolute', opacity: 0, width: '1px', height: '1px', pointerEvents: 'none' }}
      />

      {mode === 'dropdown' ? (
        <div>
          <div className="row g-2">
            {/* Day Dropdown */}
            <div className="col-4">
              <select
                className="form-select form-select-sm shadow-2xs fw-semibold text-dark"
                value={day}
                onChange={(e) => handleSelect(e.target.value, month, year)}
                style={{ borderRadius: '8px', fontSize: '0.85rem', borderColor: '#cbd5e1', cursor: 'pointer', height: '38px' }}
                title="Select Birth Day"
              >
                <option value="">Day</option>
                {daysList.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Month Dropdown */}
            <div className="col-4">
              <select
                className="form-select form-select-sm shadow-2xs fw-semibold text-dark"
                value={month}
                onChange={(e) => handleSelect(day, e.target.value, year)}
                style={{ borderRadius: '8px', fontSize: '0.85rem', borderColor: '#cbd5e1', cursor: 'pointer', height: '38px' }}
                title="Select Birth Month"
              >
                <option value="">Month</option>
                {DOB_MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Year Dropdown */}
            <div className="col-4">
              <select
                className="form-select form-select-sm shadow-2xs fw-semibold text-dark"
                value={year}
                onChange={(e) => handleSelect(day, month, e.target.value)}
                style={{ borderRadius: '8px', fontSize: '0.85rem', borderColor: '#cbd5e1', cursor: 'pointer', height: '38px' }}
                title="Select Birth Year"
              >
                <option value="">Year</option>
                {yearsList.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ) : (
        <div className="position-relative">
          <input
            type="text"
            className="form-control form-control-sm shadow-2xs fw-semibold text-dark"
            placeholder="DD / MM / YYYY (e.g. 15/08/1998)"
            value={typeInput}
            onChange={handleTypeChange}
            maxLength={10}
            style={{ borderRadius: '8px', fontSize: '0.88rem', height: '38px', borderColor: '#cbd5e1' }}
          />
        </div>
      )}

      {/* Helper Bar: Mode switch & Active Age Confirmation */}
      <div className="d-flex align-items-center justify-content-between mt-1.5 px-0.5">
        <div>
          {day && month && year && age !== null ? (
            <span className="text-success fw-bold d-flex align-items-center gap-1 animate-fade-in" style={{ fontSize: '0.75rem' }}>
              <CheckCircle2 size={13} className="text-success" />
              <span>{day} {selectedMonthObj ? selectedMonthObj.label : ''} {year}</span>
              <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-0.5" style={{ fontSize: '0.65rem' }}>
                {age} yrs old
              </span>
            </span>
          ) : (
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>
              Select Day, Month, and Year
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMode(mode === 'dropdown' ? 'type' : 'dropdown')}
          className="btn btn-link p-0 text-decoration-none fw-semibold"
          style={{ fontSize: '0.72rem', color: '#FF6333' }}
        >
          {mode === 'dropdown' ? 'Type DD/MM/YYYY ⌨️' : 'Use Dropdowns ▾'}
        </button>
      </div>
    </div>
  );
}
