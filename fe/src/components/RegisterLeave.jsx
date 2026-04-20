import React, { useState } from 'react';
import { 
  SunIcon, 
  CloudIcon, 
  CalendarDaysIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const getFullDateStr = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayOfMonth}`;
};

const generateWeek = (dateObj) => {
  const dates = [];
  const date = new Date(dateObj.getTime());
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
  const startOfWeek = new Date(date.setDate(diff));

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek.getTime());
    d.setDate(startOfWeek.getDate() + i);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const dateNum = d.getDate().toString();
    const fullDate = getFullDateStr(d);
    
    dates.push({ day: dayName, date: dateNum, fullDate, dateObj: d });
  }
  return dates;
};

export default function RegisterLeave() {
  const [selectedDateObj, setSelectedDateObj] = useState(new Date());
  const [selectedShift, setSelectedShift] = useState('Morning');

  const weekDates = generateWeek(selectedDateObj);
  const selectedDateStr = getFullDateStr(selectedDateObj);

  const handleDateChange = (e) => {
    const newDateStr = e.target.value; 
    if (newDateStr) {
      const [y, m, d] = newDateStr.split('-');
      setSelectedDateObj(new Date(y, m - 1, d));
    }
  };

  const handleDayClick = (dObj) => {
    setSelectedDateObj(dObj);
  };

  return (
    <div className="flex-1 p-8 sm:ml-64 pt-[80px]">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Register Leave</h1>
          <p className="text-gray-500 mt-2 text-[0.95rem]">Submit your leave request by selecting the date and providing a reason.</p>
        </div>

        <div className="bg-[#f8fafc] rounded-3xl p-8 shadow-sm border border-gray-100">
          {/* Select Date */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xs font-bold text-gray-500 tracking-wider uppercase m-0">Select Date</h2>
              <div className="relative w-8 h-8">
                <input 
                  type="date" 
                  value={selectedDateStr}
                  onChange={handleDateChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="absolute inset-0 flex items-center justify-center rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                  <CalendarIcon className="w-5 h-5" />
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center max-w-2xl gap-2 overflow-x-auto pb-2">
              {weekDates.map((d) => (
                <button
                  key={d.fullDate}
                  onClick={() => handleDayClick(d.dateObj)}
                  className={`flex flex-col items-center justify-center w-16 h-20 rounded-2xl transition-all flex-shrink-0 ${
                    selectedDateStr === d.fullDate
                      ? 'bg-[#dbeafe] text-blue-700 shadow-sm'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <span className={`text-[0.65rem] font-bold tracking-widest uppercase mb-1 ${selectedDateStr === d.fullDate ? 'text-blue-500' : 'text-gray-400'}`}>
                    {d.day}
                  </span>
                  <span className={`text-xl font-bold ${selectedDateStr === d.fullDate ? 'text-blue-700' : 'text-gray-900'}`}>
                    {d.date}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Choose Shift */}
          <div className="mb-10">
            <h2 className="text-xs font-bold text-gray-500 tracking-wider mb-6 uppercase">Choose Shift</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => setSelectedShift('Morning')}
                className={`flex flex-col items-start p-6 rounded-2xl border-2 transition-all ${
                  selectedShift === 'Morning' 
                    ? 'border-blue-500 bg-blue-50/30' 
                    : 'border-transparent bg-white hover:border-gray-200 shadow-sm'
                }`}
              >
                <SunIcon className={`w-6 h-6 mb-4 ${selectedShift === 'Morning' ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className="font-bold text-gray-900">Morning</span>
                <span className="text-xs text-gray-400 mt-1 font-medium">08:00 - 12:00</span>
              </button>

              <button 
                onClick={() => setSelectedShift('Afternoon')}
                className={`flex flex-col items-start p-6 rounded-2xl border-2 transition-all ${
                  selectedShift === 'Afternoon' 
                    ? 'border-blue-500 bg-blue-50/30' 
                    : 'border-transparent bg-white hover:border-gray-200 shadow-sm'
                }`}
              >
                <CloudIcon className={`w-6 h-6 mb-4 ${selectedShift === 'Afternoon' ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className="font-bold text-gray-900">Afternoon</span>
                <span className="text-xs text-gray-400 mt-1 font-medium">13:00 - 17:00</span>
              </button>

              <button 
                onClick={() => setSelectedShift('Full Day')}
                className={`flex flex-col items-start p-6 rounded-2xl border-2 transition-all ${
                  selectedShift === 'Full Day' 
                    ? 'border-blue-500 bg-blue-50/30' 
                    : 'border-transparent bg-white hover:border-gray-200 shadow-sm'
                }`}
              >
                <CalendarDaysIcon className={`w-6 h-6 mb-4 ${selectedShift === 'Full Day' ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className="font-bold text-gray-900">Full Day</span>
                <span className="text-xs text-gray-400 mt-1 font-medium">08:00 - 17:00</span>
              </button>
            </div>
          </div>

          {/* Reason */}
          <div className="mb-10">
            <h2 className="text-xs font-bold text-gray-500 tracking-wider mb-6 uppercase">Reason</h2>
            <textarea 
              className="w-full h-40 p-4 rounded-2xl border-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white shadow-sm resize-none"
              placeholder="Enter your reason here..."
            ></textarea>
          </div>

          {/* Bottom Bar */}
          <div className="flex justify-end items-center gap-3">
            <button className="px-6 py-2.5 rounded-lg text-sm font-semibold text-gray-600 bg-gray-200 hover:bg-gray-300 transition-colors">
              Cancel
            </button>
            <button className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/30 transition-colors">
              SUBMIT
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
