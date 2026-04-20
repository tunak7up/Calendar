import React, { useState } from 'react';
import { 
  SunIcon, 
  CloudIcon, 
  CalendarDaysIcon,
  CalendarIcon,
  ClockIcon,
  TrashIcon
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

export default function RegisterWork() {
  const [viewDateObj, setViewDateObj] = useState(new Date());
  const [draftDates, setDraftDates] = useState([getFullDateStr(new Date())]);
  const [selectedShift, setSelectedShift] = useState('Morning');
  const [schedule, setSchedule] = useState([]);

  const weekDates = generateWeek(viewDateObj);
  const viewDateStr = getFullDateStr(viewDateObj);

  const handleDateChange = (e) => {
    const newDateStr = e.target.value; 
    if (newDateStr) {
      const [y, m, d] = newDateStr.split('-');
      setViewDateObj(new Date(y, m - 1, d));
      setDraftDates(prev => {
        if (!prev.includes(newDateStr)) {
          return [...prev, newDateStr];
        }
        return prev;
      });
    }
  };

  const handleDayClick = (dObj) => {
    const dStr = getFullDateStr(dObj);
    setDraftDates(prev => {
      if (prev.includes(dStr)) {
        return prev.filter(s => s !== dStr);
      }
      return [...prev, dStr];
    });
  };

  const handleAddToSchedule = () => {
    if (draftDates.length === 0) return;
    
    setSchedule(prev => {
      const newSchedule = [...prev];
      draftDates.forEach(dateStr => {
        const existingIndex = newSchedule.findIndex(item => item.date === dateStr);
        const shiftData = {
          date: dateStr,
          shift: selectedShift,
          hours: selectedShift === 'Full Day' ? 8 : 4
        };
        if (existingIndex >= 0) {
          newSchedule[existingIndex] = shiftData;
        } else {
          newSchedule.push(shiftData);
        }
      });
      return newSchedule;
    });
    setDraftDates([]);
  };

  const handleRemoveFromSchedule = (dateStr) => {
    setSchedule(prev => prev.filter(item => item.date !== dateStr));
  };

  const sortedSchedule = [...schedule].sort((a, b) => a.date.localeCompare(b.date));
  const totalWeeklyHours = schedule.reduce((sum, item) => sum + item.hours, 0);

  const getTimeRangeStr = (shift) => {
    return shift === 'Morning' ? '08:00 - 12:00' : shift === 'Afternoon' ? '13:00 - 17:00' : '08:00 - 17:00';
  };

  return (
    <div className="flex-1 p-8 sm:ml-64 pt-[80px]">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Register Work Day</h1>
          <p className="text-gray-500 mt-2 text-[0.95rem]">Configure your upcoming session by selecting your project and preferred time slot.</p>
        </div>

        <div className="bg-[#f8fafc] rounded-3xl p-8 shadow-sm border border-gray-100">
          {/* Select Date */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xs font-bold text-gray-500 tracking-wider uppercase m-0">Select Date</h2>
              <div className="relative w-8 h-8">
                <input 
                  type="date" 
                  value={viewDateStr}
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
                  className={`flex flex-col items-center justify-center w-16 h-20 rounded-2xl transition-all flex-shrink-0 relative ${
                    draftDates.includes(d.fullDate)
                      ? 'bg-[#dbeafe] text-blue-700 shadow-sm'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {schedule.find(s => s.date === d.fullDate) && !draftDates.includes(d.fullDate) && (
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  )}
                  <span className={`text-[0.65rem] font-bold tracking-widest uppercase mb-1 ${draftDates.includes(d.fullDate) ? 'text-blue-500' : 'text-gray-400'}`}>
                    {d.day}
                  </span>
                  <span className={`text-xl font-bold ${draftDates.includes(d.fullDate) ? 'text-blue-700' : 'text-gray-900'}`}>
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
            
            <div className="mt-6 flex justify-end">
              <button 
                onClick={handleAddToSchedule}
                disabled={draftDates.length === 0}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span>Add to Schedule</span>
                {draftDates.length > 0 && (
                  <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{draftDates.length}</span>
                )}
              </button>
            </div>
          </div>

          {/* Selected Dates Table */}
          {schedule.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xs font-bold text-gray-500 tracking-wider mb-4 uppercase">Selected Schedule</h2>
              <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase text-gray-400">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Date</th>
                      <th className="px-6 py-3 font-semibold">Shift</th>
                      <th className="px-6 py-3 font-semibold">Time</th>
                      <th className="px-6 py-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {sortedSchedule.map(item => {
                      const [y, m, d] = item.date.split('-');
                      const dObj = new Date(y, m - 1, d);
                      const displayDate = dObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                      
                      return (
                        <tr key={item.date} className="hover:bg-gray-50/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                            {displayDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700 font-medium">
                            {item.shift}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                            {getTimeRangeStr(item.shift)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button 
                              onClick={() => handleRemoveFromSchedule(item.date)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                              title="Remove"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="h-px bg-gray-200 w-full my-6"></div>

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm min-w-[240px]">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <ClockIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-[0.65rem] font-bold text-gray-500 tracking-wider uppercase">Weekly Hours</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-900">{totalWeeklyHours}</span>
                  <span className="text-sm font-medium text-gray-400">/ 40h</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="px-6 py-2.5 rounded-lg text-sm font-semibold text-gray-600 bg-gray-200 hover:bg-gray-300 transition-colors">
                Cancel
              </button>
              <button className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/30 transition-colors">
                Register Work
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
