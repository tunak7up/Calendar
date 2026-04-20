import React, { useState, useRef } from 'react';
import { SunIcon, CloudIcon, CalendarDaysIcon, ClockIcon, TrashIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Button from '../components/Button';
import WeekDatePicker, { getFullDateStr } from '../components/WeekDatePicker';


export default function RegisterWork() {
  const [viewDateObj, setViewDateObj] = useState(new Date());
  const [draftDates, setDraftDates] = useState([getFullDateStr(new Date())]);
  const [selectedShift, setSelectedShift] = useState('Morning');
  const [schedule, setSchedule] = useState([]);
  const [isRepeatDropdownOpen, setIsRepeatDropdownOpen] = useState(false);
  const [repeatOption, setRepeatOption] = useState('none');
  const [repeatInterval, setRepeatInterval] = useState(1);
  const dropdownBtnRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  const handleToggleDropdown = () => {
    if (!isRepeatDropdownOpen && dropdownBtnRef.current) {
      const rect = dropdownBtnRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 8 + window.scrollY, left: rect.left + window.scrollX });
    }
    setIsRepeatDropdownOpen(v => !v);
  };
  
  // Custom End Condition states
  const [endOption, setEndOption] = useState('never'); // 'never', 'date', 'count'
  const [endDate, setEndDate] = useState(getFullDateStr(new Date()));
  const [endCount, setEndCount] = useState(13);

  const handleDayClick = (dObj) => {
    const dStr = getFullDateStr(dObj);
    setDraftDates(prev =>
      prev.includes(dStr) ? prev.filter(s => s !== dStr) : [...prev, dStr]
    );
  };

  const handleCalendarPick = (newDateStr) => {
    setDraftDates(prev => prev.includes(newDateStr) ? prev : [...prev, newDateStr]);
  };

  const resetForm = () => {
    const today = getFullDateStr(new Date());
    setDraftDates([today]);
    setSelectedShift('Morning');
    setRepeatOption('none');
    setRepeatInterval(1);
    setEndOption('never');
    setEndDate(today);
    setEndCount(13);
  };

  const handleAddToSchedule = () => {
    if (draftDates.length === 0) return;
    
    setSchedule(prev => {
      const newSchedule = [...prev];
      
      draftDates.forEach(dateStr => {
        let generatedDates = [dateStr];

        if (repeatOption === 'weekly' || repeatOption === 'yearly') {
          let count = 1;
          const [y, m, d] = dateStr.split('-');
          let currentDate = new Date(Number(y), Number(m) - 1, Number(d));
          
          while (true) {
             if (repeatOption === 'weekly') {
               currentDate.setDate(currentDate.getDate() + 7 * repeatInterval);
             } else if (repeatOption === 'yearly') {
               currentDate.setFullYear(currentDate.getFullYear() + 1 * repeatInterval);
             }

             const nextDateStr = getFullDateStr(currentDate);

             if (endOption === 'count') {
               if (count >= endCount) break;
             } else if (endOption === 'date') {
               if (endDate && nextDateStr > endDate) break;
               // Fallback safety
               if (!endDate && count >= 52) break;
             } else {
               // never - add a safe arbitrary limit
               if (count >= 52) break; 
             }

             generatedDates.push(nextDateStr);
             count++;
          }
        }

        generatedDates.forEach(gDateStr => {
           const existingIndex = newSchedule.findIndex(item => item.date === gDateStr);
           const shiftData = {
             date: gDateStr,
             shift: selectedShift,
             hours: selectedShift === 'Full Day' ? 8 : 4
           };
           if (existingIndex >= 0) {
             newSchedule[existingIndex] = shiftData;
           } else {
             newSchedule.push(shiftData);
           }
        });
      });

      return newSchedule;
    });
    
    resetForm();
  };

  const handleCancel = () => {
    resetForm();
    setSchedule([]);
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
            <WeekDatePicker
              viewDate={viewDateObj}
              onViewChange={setViewDateObj}
              selectedDates={draftDates}
              onDayClick={handleDayClick}
              onCalendarPick={handleCalendarPick}
            />
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
            {/* Container 1: Repeat controls */}
            <div className="mt-6 border-t border-gray-100 pt-5">
              <div className="flex flex-row items-center gap-3 flex-nowrap">

                {/* Step 1: Dropdown lặp lại */}
                <div className="relative flex-shrink-0" ref={dropdownBtnRef}>
                  <button 
                    onClick={handleToggleDropdown}
                    className="flex items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-xl shadow-sm text-[14px] font-semibold text-gray-900 border border-gray-200 hover:bg-gray-50 transition-colors min-w-[155px]"
                  >
                    <span>
                      {repeatOption === 'none' && 'Không lặp lại'}
                      {repeatOption === 'weekly' && 'Hằng tuần'}
                      {repeatOption === 'yearly' && 'Hằng năm'}
                    </span>
                    <ChevronDownIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  </button>

                  {isRepeatDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-[100]" onClick={() => setIsRepeatDropdownOpen(false)}></div>
                      <div
                        className="fixed min-w-[180px] bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-[101] overflow-hidden"
                        style={{ top: dropdownPos.top, left: dropdownPos.left }}
                      >
                        {['none', 'weekly', 'yearly'].map(opt => (
                          <button
                            key={opt}
                            onClick={() => {
                              setRepeatOption(opt);
                              setIsRepeatDropdownOpen(false);
                              if (opt === 'none') setEndOption('never');
                            }}
                            className={`w-full text-left px-5 py-2.5 text-[14px] hover:bg-blue-50/60 hover:text-blue-600 transition-colors ${repeatOption === opt ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 font-medium'}`}
                          >
                            {opt === 'none' && 'Không lặp lại'}
                            {opt === 'weekly' && 'Hằng tuần'}
                            {opt === 'yearly' && 'Hằng năm'}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Step 2: Kết thúc */}
                {(repeatOption === 'weekly' || repeatOption === 'yearly') && (
                  <>
                    <span className="text-gray-400 text-[13px] flex-shrink-0">›</span>
                    <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-gray-200 flex-shrink-0">
                      <span className="text-[14px] font-medium text-gray-600 whitespace-nowrap">Kết thúc:</span>
                      <select
                        className="text-[14px] font-semibold text-gray-900 border-0 focus:ring-0 p-0 cursor-pointer bg-transparent"
                        value={endOption}
                        onChange={(e) => setEndOption(e.target.value)}
                      >
                        <option value="never">Không bao giờ</option>
                        <option value="date">Vào ngày</option>
                        <option value="count">Sau</option>
                      </select>
                      {endOption === 'date' && (
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="text-[14px] border border-gray-200 bg-gray-50 rounded-lg py-1 px-2 focus:ring-0 text-gray-700 w-[132px] ml-1"
                        />
                      )}
                      {endOption === 'count' && (
                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 ml-1">
                          <input
                            type="number"
                            value={endCount}
                            onChange={(e) => setEndCount(Number(e.target.value))}
                            className="text-[14px] border-none bg-transparent py-1 px-0 focus:ring-0 text-gray-700 w-10 text-center"
                            min={1}
                          />
                          <span className="text-[13px] text-gray-500 whitespace-nowrap">lần</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Step 3: Lặp lại mỗi */}
                {(repeatOption === 'weekly' || repeatOption === 'yearly') && endOption !== 'never' && (
                  <>
                    <span className="text-gray-400 text-[13px] flex-shrink-0">›</span>
                    <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-gray-200 flex-shrink-0">
                      <span className="text-[14px] font-medium text-gray-600 whitespace-nowrap">Lặp lại mỗi:</span>
                      <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2">
                        <input
                          type="number"
                          value={repeatInterval}
                          onChange={(e) => setRepeatInterval(Number(e.target.value) || 1)}
                          className="text-[14px] border-none bg-transparent py-1 px-0 focus:ring-0 text-gray-700 w-10 text-center"
                          min={1}
                        />
                        <span className="text-[13px] text-gray-500">{repeatOption === 'weekly' ? 'tuần' : 'năm'}</span>
                      </div>
                    </div>
                  </>
                )}

              </div>
            </div>

            {/* Container 2: Add to Schedule button */}
            <div className="flex justify-end mt-4">
              <Button onClick={handleAddToSchedule} disabled={draftDates.length === 0}>
                <span>Add to Schedule</span>
                {draftDates.length > 0 && (
                  <span className="bg-white/20 px-2 py-0.5 rounded text-xs ml-2">{draftDates.length}</span>
                )}
              </Button>
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
                            <Button 
                              variant="danger-icon"
                              onClick={() => handleRemoveFromSchedule(item.date)}
                              title="Remove"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
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
              <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
              <Button>Register Work</Button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
