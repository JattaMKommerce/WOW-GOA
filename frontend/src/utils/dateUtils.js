/**
 * Date utility helpers for Hotel & Travel booking date validation
 */

/**
 * Returns today's date in YYYY-MM-DD format (local timezone)
 */
export function getTodayDateStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns date + 1 day in YYYY-MM-DD format
 */
export function getNextDayDateStr(dateStr) {
  if (!dateStr) return getTodayDateStr();
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (isNaN(date.getTime())) return getTodayDateStr();
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adds N days to a date string in YYYY-MM-DD format
 */
export function addDays(dateStr, numDays = 1) {
  if (!dateStr) return getTodayDateStr();
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (isNaN(date.getTime())) return getTodayDateStr();
  date.setDate(date.getDate() + numDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a given date string is in the past (before today)
 */
export function isPastDate(dateStr) {
  if (!dateStr) return false;
  const today = getTodayDateStr();
  return dateStr < today;
}

/**
 * Validates check-in and check-out date range
 * Returns { valid: boolean, error: string | null }
 */
export function validateBookingDates(checkIn, checkOut, options = { allowSameDay: false, minDays: 1 }) {
  const today = getTodayDateStr();

  if (!checkIn) {
    return { valid: false, error: 'Please select a check-in date.' };
  }

  if (checkIn < today) {
    return { valid: false, error: 'Check-in date cannot be in the past. Please select today or a future date.' };
  }

  if (!checkOut) {
    return { valid: false, error: 'Please select a check-out date.' };
  }

  if (!options.allowSameDay && checkOut <= checkIn) {
    return { valid: false, error: 'Check-out date must be at least 1 day after check-in date.' };
  }

  if (options.allowSameDay && checkOut < checkIn) {
    return { valid: false, error: 'Return/Check-out date cannot be before check-in date.' };
  }

  return { valid: true, error: null };
}

/**
 * Formats YYYY-MM-DD for display (e.g. "Wed, 26 Aug 2026")
 */
export function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}
