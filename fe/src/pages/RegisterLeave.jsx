import React, { useState } from 'react';
import { SunIcon, CloudIcon, CalendarDaysIcon, TrashIcon, CalendarIcon } from '@heroicons/react/24/outline';
import Button from '../components/Button';
import WeekDatePicker, { getFullDateStr } from '../components/WeekDatePicker';

export default function RegisterLeave() {
  const [viewDateObj, setViewDateObj] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedShift, setSelectedShift] = useState('Morning');
  const [reason, setReason] = useState('');

  const handleDayClick = (dObj) => {
    const dateStr = getFullDateStr(dObj);
    setSelectedDates(prev =>
      prev.includes(dateStr)
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  const handleCalendarPick = (dateStr) => {
    setSelectedDates(prev =>
      prev.includes(dateStr) ? prev : [...prev, dateStr]
    );
  };

  const handleSubmit = () => {
    if (selectedDates.length === 0) {
      alert("Please select at least one date.");
      return;
    }

    const datesSummary = [...selectedDates].sort().join(', ');
    alert(`Leave Registered!\nDates: ${datesSummary}\nShift: ${selectedShift}\nReason: ${reason}`);
  };

  const handleCancel = () => {
    setViewDateObj(new Date());
    setSelectedDates([]);
    setSelectedShift('Morning');
    setReason('');
  };

  const removeDate = (dateStr) => {
    setSelectedDates(prev => prev.filter(d => d !== dateStr));
  };

  const sortedSelected = [...selectedDates].sort();

  return (
    <div className="flex-1 p-8 sm:ml-64 pt-[80px]">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 font-poppins">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Register Leave</h1>
          <p className="text-gray-500 mt-2 text-[0.95rem]">Submit your leave request by selecting the date and providing a reason.</p>
        </div>

        <div className="bg-[#f8fafc] rounded-3xl p-8 shadow-sm border border-gray-100">
          {/* Select Date */}
          <div className="mb-10">
            <WeekDatePicker
              viewDate={viewDateObj}
              onViewChange={setViewDateObj}
              selectedDates={selectedDates}
              onDayClick={handleDayClick}
              onCalendarPick={handleCalendarPick}
            />
          </div>

          {/* Selected Dates Summary */}
          {selectedDates.length > 0 && (
            <div className="mb-10 animate-in fade-in slide-in-from-top-2 duration-300">
              <h2 className="text-xs font-bold text-gray-500 tracking-wider mb-4 uppercase flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-500" />
                Selected Dates ({selectedDates.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {sortedSelected.map(dateStr => (
                  <div
                    key={dateStr}
                    className="flex items-center gap-2 bg-white border border-blue-100 px-3 py-1.5 rounded-xl shadow-sm text-sm font-medium text-gray-700 hover:border-blue-200 transition-colors"
                  >
                    <span>{dateStr}</span>
                    <button
                      onClick={() => removeDate(dateStr)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Choose Shift */}
          <div className="mb-10">
            <h2 className="text-xs font-bold text-gray-500 tracking-wider mb-6 uppercase">Choose Shift</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setSelectedShift('Morning')}
                className={`flex flex-col items-start p-6 rounded-2xl border-2 transition-all ${selectedShift === 'Morning'
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
                className={`flex flex-col items-start p-6 rounded-2xl border-2 transition-all ${selectedShift === 'Afternoon'
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
                className={`flex flex-col items-start p-6 rounded-2xl border-2 transition-all ${selectedShift === 'Full Day'
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
              className="w-full h-40 p-4 rounded-2xl border border-transparent focus:border-blue-500 focus:ring-2 text-black focus:ring-blue-500 bg-white shadow-sm resize-none transition-all"
              placeholder="Enter your reason here..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            ></textarea>
          </div>

          <div className="flex justify-end items-center gap-3">
            <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSubmit}>SUBMIT</Button>
          </div>

        </div>
      </div>
    </div>
  );
}
