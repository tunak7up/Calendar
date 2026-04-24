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
  const dObj = new Date(y, m - 1, d);
  return dObj.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
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
