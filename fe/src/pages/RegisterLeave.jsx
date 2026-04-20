import React, { useState } from 'react';
import { SunIcon, CloudIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import Button from '../components/Button';
import WeekDatePicker, { getFullDateStr } from '../components/WeekDatePicker';

export default function RegisterLeave() {
  const [selectedDateObj, setSelectedDateObj] = useState(new Date());
  const [selectedShift, setSelectedShift] = useState('Morning');

  const selectedDateStr = getFullDateStr(selectedDateObj);

  const handleDayClick = (dObj) => setSelectedDateObj(dObj);

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
            <WeekDatePicker
              viewDate={selectedDateObj}
              onViewChange={setSelectedDateObj}
              selectedDates={[selectedDateStr]}
              onDayClick={handleDayClick}
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
          </div>

          {/* Reason */}
          <div className="mb-10">
            <h2 className="text-xs font-bold text-gray-500 tracking-wider mb-6 uppercase">Reason</h2>
            <textarea 
              className="w-full h-40 p-4 rounded-2xl border-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white shadow-sm resize-none"
              placeholder="Enter your reason here..."
            ></textarea>
          </div>

          <div className="flex justify-end items-center gap-3">
            <Button variant="secondary">Cancel</Button>
            <Button>SUBMIT</Button>
          </div>

        </div>
      </div>
    </div>
  );
}
