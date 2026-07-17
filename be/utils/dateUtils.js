const getVNTime = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const dateObj = date instanceof Date ? date : new Date(date);
  const parts = formatter.formatToParts(dateObj);
  const partMap = {};
  parts.forEach(p => partMap[p.type] = p.value);
  
  let hour = partMap.hour;
  if (hour === '24') hour = '00';

  const dateStr = `${partMap.year}-${partMap.month}-${partMap.day}`;
  const timeStr = `${hour}:${partMap.minute}`;
  const dateTimeStr = `${dateStr} ${hour}:${partMap.minute}:${partMap.second}`;
  
  return {
    year: partMap.year,
    month: partMap.month,
    day: partMap.day,
    hour,
    minute: partMap.minute,
    second: partMap.second,
    dateStr,
    timeStr,
    dateTimeStr
  };
};

module.exports = {
  getVNTime
};
