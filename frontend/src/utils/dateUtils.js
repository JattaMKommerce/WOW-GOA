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

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Consistently formats booking dates and times to "11 Sep 2026 • 10:00 AM" format
 */
export function formatBookingDateTime(dateStr, timeStr = '') {
  if (!dateStr) return 'Scheduled';
  
  let datePart = String(dateStr).trim();
  let timePart = String(timeStr || '').trim();

  if (datePart.includes(' at ')) {
    const parts = datePart.split(' at ');
    datePart = parts[0];
    if (!timePart && parts[1]) timePart = parts[1];
  } else if (datePart.includes('T')) {
    const parts = datePart.split('T');
    datePart = parts[0];
    if (!timePart && parts[1]) timePart = parts[1].slice(0, 5);
  }

  let formattedDate = datePart;
  const ymdMatch = datePart.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    if (month >= 0 && month < 12 && day >= 1 && day <= 31) {
      formattedDate = `${day} ${MONTH_NAMES[month]} ${year}`;
    }
  } else {
    try {
      const d = new Date(datePart);
      if (!isNaN(d.getTime())) {
        formattedDate = `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
      }
    } catch (e) {
      formattedDate = datePart;
    }
  }

  let formattedTime = '';
  if (timePart) {
    timePart = timePart.replace(/^(at|•|@)\s*/i, '').trim();
    const hmMatch = timePart.match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*(AM|PM))?/i);
    if (hmMatch) {
      let hours = parseInt(hmMatch[1], 10);
      const minutes = hmMatch[2];
      const ampm = hmMatch[3];
      if (ampm) {
        formattedTime = `${hours}:${minutes} ${ampm.toUpperCase()}`;
      } else {
        const period = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        if (hours === 0) hours = 12;
        formattedTime = `${hours}:${minutes} ${period}`;
      }
    } else {
      formattedTime = timePart;
    }
  }

  return formattedTime ? `${formattedDate} • ${formattedTime}` : formattedDate;
}

/**
 * Formats a timestamp or date string to "11 Sep 2026"
 */
export function formatDateShort(dateStr) {
  if (!dateStr) return 'Recent';
  return formatBookingDateTime(dateStr, '');
}

