import React, { useState, useEffect } from 'react';
import { SunIcon, CloudIcon, CalendarDaysIcon, TrashIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import Button from '../components/Button';
import WeekDatePicker from '../components/WeekDatePicker';
import { getFullDateStr, getTimeRangeStr } from '../utils/dateUtils';
import { scheduleService } from '../services/scheduleService';
import { requestService } from '../services/requestService';

export default function RegisterLeave({ initialDate }) {
  const [viewDateObj, setViewDateObj] = useState(initialDate ? new Date(initialDate) : new Date());
  const [draftDates, setDraftDates] = useState(initialDate ? [initialDate] : [getFullDateStr(new Date())]);
  const [selectedShift, setSelectedShift] = useState('Morning');
  const [reason, setReason] = useState('');
  const [schedule, setSchedule] = useState([]);
  const [workSchedules, setWorkSchedules] = useState([]);
  const [workDays, setWorkDays] = useState([]);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const result = await scheduleService.getPersonSchedule(1);
        if (result.success) {
          setWorkSchedules(result.data);
          const days = result.data.map(item => item.start_time.split(/[T ]/)[0]);
          setWorkDays(days);
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
      }
    };
    fetchSchedule();
  }, []);

  // Helper to check if a shift is scheduled for any of the draft dates
  const isShiftScheduled = (shiftType) => {
    return draftDates.some(date => {
      return workSchedules.some(ws => {
        const wsDate = ws.start_time.split(/[T ]/)[0];
        if (wsDate !== date) return false;
        
        const startTime = ws.start_time.split(/[T ]/)[1];
        const endTime = ws.end_time.split(/[T ]/)[1];
        
        if (shiftType === 'Morning') return startTime.startsWith('08:30') && endTime.startsWith('12:00');
        if (shiftType === 'Afternoon') return startTime.startsWith('13:00') && endTime.startsWith('17:30');
        if (shiftType === 'Full Day') return startTime.startsWith('08:30') && endTime.startsWith('17:30');
        return false;
      });
    });
  };

  const handleDayClick = (dObj) => {
    const dStr = getFullDateStr(dObj);
    setDraftDates(prev =>
      prev.includes(dStr) ? prev.filter(s => s !== dStr) : [...prev, dStr]
    );
  };

  const handleCalendarPick = (newDateStr) => {
    setDraftDates(prev => prev.includes(newDateStr) ? prev : [...prev, newDateStr]);
  };

  const resetDraft = () => {
    const today = getFullDateStr(new Date());
    setDraftDates([today]);
    setSelectedShift('Morning');
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

    resetDraft();
  };

  const handleCancel = () => {
    resetDraft();
    setSchedule([]);
    setReason('');
  };

  const handleSubmit = async () => {
    if (schedule.length === 0) {
      alert("Please add at least one leave day to the schedule.");
      return;
    }

    const requestDetails = schedule.map(item => {
      let startTime, endTime;
      if (item.shift === 'Morning') {
        startTime = `${item.date} 08:30:00`;
        endTime = `${item.date} 12:00:00`;
      } else if (item.shift === 'Afternoon') {
        startTime = `${item.date} 13:00:00`;
        endTime = `${item.date} 17:30:00`;
      } else { // Full Day
        startTime = `${item.date} 08:30:00`;
        endTime = `${item.date} 17:30:00`;
      }
      return {
        date: item.date,
        start_time: startTime,
        end_time: endTime
      };
    });

    const payload = {
      requester_id: 1,
      approver_id: null,
      type: 'leave', // Important: Type is leave
      reason: reason || 'Nghỉ phép',
      request_details: requestDetails
    };

    try {
      const result = await requestService.submitRequest(payload);
      alert("Đã gửi yêu cầu nghỉ phép thành công!");
      setSchedule([]);
      setReason('');
      resetDraft();
    } catch (error) {
      console.error('Error:', error);
      alert("Có lỗi xảy ra: " + error.message);
    }
  };


  const handleRemoveFromSchedule = (dateStr) => {
    setSchedule(prev => prev.filter(item => item.date !== dateStr));
  };

  const sortedSchedule = [...schedule].sort((a, b) => a.date.localeCompare(b.date));
  const getTimeRangeStr = (shift) => {
    return shift === 'Morning' ? '08:30 - 12:00' : shift === 'Afternoon' ? '13:00 - 17:30' : '08:30 - 17:30';
  };

  return (
    <div className="flex-1 p-8 sm:ml-64 pt-[80px]">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Register Leave</h1>
          <p className="text-gray-500 mt-2 text-[0.95rem]">Select your leave dates and provide a reason for the request.</p>
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
              workDays={workDays}
            />
          </div>

          {/* Choose Shift */}
          <div className="mb-10">
            <h2 className="text-xs font-bold text-gray-500 tracking-wider mb-6 uppercase">Choose Shift</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Morning', 'Afternoon', 'Full Day'].map((shift) => {
                const scheduled = isShiftScheduled(shift);
                return (
                  <button
                    key={shift}
                    onClick={() => setSelectedShift(shift)}
                    className={`flex flex-col items-start p-6 rounded-2xl border-2 transition-all relative ${selectedShift === shift
                        ? 'border-blue-500 bg-blue-50/30'
                        : 'border-transparent bg-white hover:border-gray-200 shadow-sm'
                      }`}
                  >
                    {scheduled && (
                      <span className="absolute top-3 right-3 bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Scheduled
                      </span>
                    )}
                    {shift === 'Morning' && <SunIcon className={`w-6 h-6 mb-4 ${selectedShift === shift ? 'text-blue-500' : 'text-gray-400'}`} />}
                    {shift === 'Afternoon' && <CloudIcon className={`w-6 h-6 mb-4 ${selectedShift === shift ? 'text-blue-500' : 'text-gray-400'}`} />}
                    {shift === 'Full Day' && <CalendarDaysIcon className={`w-6 h-6 mb-4 ${selectedShift === shift ? 'text-blue-500' : 'text-gray-400'}`} />}
                    <span className="font-bold text-gray-900">{shift}</span>
                    <span className="text-xs text-gray-400 mt-1 font-medium">{getTimeRangeStr(shift)}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={handleAddToSchedule} disabled={draftDates.length === 0}>
                <span>Add to Leave List</span>
                {draftDates.length > 0 && (
                  <span className="bg-white/20 px-2 py-0.5 rounded text-xs ml-2">{draftDates.length}</span>
                )}
              </Button>
            </div>
          </div>

          {/* Schedule Table */}
          {schedule.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xs font-bold text-gray-500 tracking-wider mb-4 uppercase">Selected Leave Dates</h2>
              <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm max-h-[300px] overflow-y-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-400 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Date</th>
                      <th className="px-6 py-3 font-semibold">Shift</th>
                      <th className="px-6 py-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {sortedSchedule.map(item => (
                      <tr key={item.date} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">{item.shift}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Button variant="danger-icon" onClick={() => handleRemoveFromSchedule(item.date)}>
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="mb-10">
            <h2 className="text-xs font-bold text-gray-500 tracking-wider mb-6 uppercase">Reason</h2>
            <textarea
              className="w-full h-32 p-4 rounded-2xl border border-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white shadow-sm resize-none transition-all outline-none text-gray-700"
              placeholder="Vui lòng nhập lý do nghỉ phép..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            ></textarea>
          </div>

          <div className="h-px bg-gray-200 w-full my-6"></div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-[0.65rem] font-bold text-gray-500 tracking-wider uppercase">Total Leave Days</h3>
                <span className="text-2xl font-bold text-gray-900">{schedule.length}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
              <Button onClick={handleSubmit}>Submit Leave Request</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
