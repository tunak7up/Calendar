export const getFullDateStr = (date) => {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
};

export const getTimeRangeStr = (shift) => {
  switch (shift) {
    case 'Morning':
      return '08:30 - 12:00';
    case 'Afternoon':
      return '13:00 - 17:30';
    case 'Full Day':
      return '08:30 - 17:30';
    default:
      return '';
  }
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes} ${d}/${m}/${y}`;
};

// Parse datetime string from BE (assumes VN time and adds +07:00 if not present)
export const parseVNTime = (str) => {
  if (!str) return null;
  if (str instanceof Date) return str;

  // If it's not a string, try standard parsing
  if (typeof str !== 'string') {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  // Check if it already has offset/UTC indicator
  if (str.includes('Z') || /([+-]\d{2}:?\d{2})$/.test(str)) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;
  }

  // Otherwise, parse components manually to avoid iOS/Safari bugs
  const match = str.match(/^(\d{4})[./-](\d{2})[./-](\d{2})(?:[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?)?/);
  if (match) {
    const [, y, m, d, h = '00', min = '00', s = '00'] = match;
    const year = parseInt(y, 10);
    const month = parseInt(m, 10) - 1;
    const date = parseInt(d, 10);
    const hours = parseInt(h, 10);
    const minutes = parseInt(min, 10);
    const seconds = parseInt(s, 10);

    const utcTime = Date.UTC(year, month, date, hours, minutes, seconds);
    const targetDate = new Date(utcTime - 7 * 60 * 60 * 1000); // VN offset is +7 hours
    if (!isNaN(targetDate.getTime())) {
      return targetDate;
    }
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

// Formats value as YYYY-MM-DD in VN timezone
export const getLocalYYYYMMDD = (val) => {
  if (!val) return '';
  const d = val instanceof Date ? val : parseVNTime(val);
  if (!d || isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Formats time portion of VN timezone date string to HH:MM
export const formatVNTime = (str) => {
  const d = parseVNTime(str);
  if (!d) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
