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
