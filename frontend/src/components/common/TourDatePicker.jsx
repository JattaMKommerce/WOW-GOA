import React, { useRef } from 'react';
import { getTodayDateStr } from '../../utils/dateUtils';

/**
 * Fast, native tour date picker matching the exact Chromium/Edge date calendar popup
 * (from the Self-Drive booking modal in the 2nd reference image).
 * Provides 0ms lag, hardware-accelerated rendering, instant month/year navigation,
 * past date restriction via `min`, and auto-opens on click anywhere in the input.
 */
export default function TourDatePicker({
  value = '',
  onChange,
  minDate = getTodayDateStr(),
  required = true,
  id = 'tour-booking-date',
  placeholder = 'dd-mm-yyyy'
}) {
  const inputRef = useRef(null);

  const openPicker = () => {
    try {
      if (inputRef.current && typeof inputRef.current.showPicker === 'function') {
        inputRef.current.showPicker();
      }
    } catch (err) {
      if (inputRef.current) inputRef.current.focus();
    }
  };

  return (
    <div
      className="tour-date-picker-native-wrapper position-relative w-100"
      onClick={openPicker}
      style={{ cursor: 'pointer' }}
    >
      <input
        ref={inputRef}
        id={id}
        type="date"
        className="form-control fw-semibold text-dark shadow-2xs"
        min={minDate || getTodayDateStr()}
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        onClick={(e) => {
          e.stopPropagation();
          openPicker();
        }}
        onFocus={openPicker}
        required={required}
        placeholder={placeholder}
        style={{
          height: '42px',
          borderRadius: '8px',
          borderColor: '#cbd5e1',
          fontSize: '0.92rem',
          cursor: 'pointer',
          backgroundColor: '#ffffff',
          fontWeight: 600
        }}
        title="Click to choose tour date"
      />
    </div>
  );
}
