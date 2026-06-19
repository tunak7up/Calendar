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
  if (str.includes('+') || str.includes('Z')) return new Date(str);
  // Normalize space to T and append +07:00 offset
  return new Date(str.replace(' ', 'T') + '+07:00');
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
