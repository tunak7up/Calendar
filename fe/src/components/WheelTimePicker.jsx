import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const WheelColumn = ({ items, value, onChange, label, disabledItems = [] }) => {
  const containerRef = useRef(null);
  const itemHeight = 40; // Height of each item in pixels
  const scrollTimeout = useRef(null);

  // Scroll to the selected value on mount
  useEffect(() => {
    if (containerRef.current) {
      const index = items.findIndex(item => item.value === value);
      if (index !== -1) {
        containerRef.current.scrollTop = index * itemHeight;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const handleScroll = () => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    
    scrollTimeout.current = setTimeout(() => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        // Calculate the nearest index based on scroll position
        const index = Math.round(scrollTop / itemHeight);
        if (items[index] && items[index].value !== value && !disabledItems.includes(items[index].value)) {
          onChange(items[index].value);
        }
      }
    }, 150); // Wait 150ms after scrolling stops to trigger change
  };

  return (
    <div className="flex flex-col items-center flex-1 relative">
      <div className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-widest">{label}</div>
      <div className="relative w-full">
        <div 
          className="relative w-full h-[120px] overflow-y-auto hide-scrollbar"
          style={{ scrollSnapType: 'y mandatory', scrollBehavior: 'smooth' }}
          ref={containerRef}
          onScroll={handleScroll}
        >
          {/* Padding blocks to allow the first and last items to be centered */}
          <div style={{ height: `${itemHeight}px` }}></div>
          {items.map((item, idx) => {
            const isDisabled = disabledItems.includes(item.value);
            const isSelected = item.value === value;
            return (
              <div 
                key={item.value}
                className={`h-[40px] flex items-center justify-center text-lg transition-all duration-200 ${
                  isDisabled ? 'text-gray-200 cursor-not-allowed opacity-40' : 'cursor-pointer'
                } ${
                  isSelected ? 'text-blue-600 font-extrabold scale-110' : (!isDisabled ? 'text-gray-400 font-medium hover:text-gray-600' : '')
                }`}
                style={{ scrollSnapAlign: isDisabled ? 'none' : 'center' }}
                onClick={() => {
                  if (isDisabled) return;
                  if (containerRef.current) {
                    containerRef.current.scrollTo({ top: idx * itemHeight, behavior: 'smooth' });
                  }
                  onChange(item.value);
                }}
              >
                {item.label}
              </div>
            );
          })}
          <div style={{ height: `${itemHeight}px` }}></div>
        </div>
        
        {/* Highlight overlay for the centered item */}
        <div className="absolute top-[40px] left-2 right-2 h-[40px] border-y-2 border-blue-500/20 pointer-events-none rounded-lg bg-blue-50/30"></div>
      </div>
    </div>
  );
};

export default function WheelTimePicker({ value, onChange, onClose, minTime, maxTime }) {
  const { t } = useTranslation();
  // Value is expected in "HH:mm" format
  const [hourStr, minStr] = (value || "08:30").split(':');
  
  const hours = Array.from({ length: 24 }).map((_, i) => {
    const val = i.toString().padStart(2, '0');
    return { label: val, value: val };
  });

  const minutes = Array.from({ length: 60 }).map((_, i) => {
    const val = i.toString().padStart(2, '0');
    return { label: val, value: val };
  });

  let minHour = 0, minMinute = 0;
  let maxHour = 23, maxMinute = 59;

  if (minTime) {
    const [h, m] = minTime.split(':').map(Number);
    minHour = h; minMinute = m;
  }
  if (maxTime) {
    const [h, m] = maxTime.split(':').map(Number);
    maxHour = h; maxMinute = m;
  }

  const disabledHours = hours
    .map(h => parseInt(h.value, 10))
    .filter(h => h < minHour || h > maxHour)
    .map(h => h.toString().padStart(2, '0'));

  const currentHourNum = parseInt(hourStr, 10);
  const disabledMinutes = minutes
    .map(m => parseInt(m.value, 10))
    .filter(m => (currentHourNum === minHour && m < minMinute) || (currentHourNum === maxHour && m > maxMinute))
    .map(m => m.toString().padStart(2, '0'));

  const handleHourChange = (newHourStr) => {
    let newMinStr = minStr;
    const newHourNum = parseInt(newHourStr, 10);
    
    if (newHourNum === minHour && parseInt(newMinStr, 10) < minMinute) {
      newMinStr = minMinute.toString().padStart(2, '0');
    } else if (newHourNum === maxHour && parseInt(newMinStr, 10) > maxMinute) {
      newMinStr = maxMinute.toString().padStart(2, '0');
    }
    
    onChange(`${newHourStr}:${newMinStr}`);
  };

  const handleMinChange = (newMinStr) => {
    onChange(`${hourStr}:${newMinStr}`);
  };

  return (
    <div className="bg-white p-5 rounded-3xl shadow-2xl shadow-blue-900/10 border border-gray-100 min-w-[260px] animate-in fade-in zoom-in-95 duration-200">
      <div className="flex gap-4 mb-6">
        <WheelColumn items={hours} value={hourStr} onChange={handleHourChange} label={t('components.wheelTimePicker.hour')} disabledItems={disabledHours} />
        <div className="text-2xl font-bold text-gray-300 self-center pt-4">:</div>
        <WheelColumn items={minutes} value={minStr} onChange={handleMinChange} label={t('components.wheelTimePicker.minute')} disabledItems={disabledMinutes} />
      </div>
      <button 
        onClick={onClose}
        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20 active:scale-[0.98]"
      >
        {t('components.wheelTimePicker.confirm')}
      </button>
      
      {/* Inline styles to hide scrollbar for webkit and standard browsers */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
