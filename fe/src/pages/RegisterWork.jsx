import React, { useState, useRef, useEffect } from 'react';
import { SunIcon, CloudIcon, CalendarDaysIcon, ClockIcon, TrashIcon, ChevronDownIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import WeekDatePicker from '../components/WeekDatePicker';
import { getFullDateStr, getTimeRangeStr } from '../utils/dateUtils';
import { scheduleService } from '../services/scheduleService';
import { requestService } from '../services/requestService';
import { useAuth } from '../context/AuthContext';


export default function RegisterWork() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const initialDate = location.state?.date;

  const [viewDateObj, setViewDateObj] = useState(initialDate ? new Date(initialDate) : new Date());
  const [draftDates, setDraftDates] = useState(initialDate ? [initialDate] : []);
  const [selectedShift, setSelectedShift] = useState('Morning');
  const [schedule, setSchedule] = useState([]);
  const [workDays, setWorkDays] = useState([]);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const result = await scheduleService.getScheduleByPersonId(user.person_id);
        if (result.success) {
          const days = result.data.map(item => item.start_time.split(/[T ]/)[0]);
          setWorkDays(days);
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
      }
    };
    fetchSchedule();
  }, []);
  const [isRepeatDropdownOpen, setIsRepeatDropdownOpen] = useState(false);
  const [repeatOption, setRepeatOption] = useState('none');
  const [repeatInterval, setRepeatInterval] = useState(1);

  // Custom End Condition states
  const [endOption, setEndOption] = useState('never'); // 'never', 'date', 'count'
  const [endDate, setEndDate] = useState(getFullDateStr(new Date()));
  const [endCount, setEndCount] = useState(13);

  const handleDayClick = (dObj) => {
    const day = dObj.getDay();
    if (day === 0 || day === 6) {
      alert("Bạn không thể đăng ký làm việc vào Thứ 7 và Chủ Nhật.");
      return;
    }
    const dStr = getFullDateStr(dObj);
    if (workDays.includes(dStr)) {
      alert(`Ngày ${dStr} đã có lịch làm việc được duyệt.`);
      return;
    }
    setDraftDates(prev =>
      prev.includes(dStr) ? prev.filter(s => s !== dStr) : [...prev, dStr]
    );
  };

  const resetForm = () => {
    setDraftDates([]);
    setSelectedShift('Morning');
    setRepeatOption('none');
    setRepeatInterval(1);
    setEndOption('never');
    setEndDate(getFullDateStr(new Date()));
    setEndCount(13);
  };

  const handleAddToSchedule = () => {
    if (draftDates.length === 0) return;

    // Kiểm tra trùng lịch đã được duyệt
    const duplicates = draftDates.filter(d => workDays.includes(d));
    if (duplicates.length > 0) {
      alert(`Các ngày sau đã có lịch làm việc được duyệt, vui lòng bỏ chọn:\n${duplicates.join('\n')}`);
      return;
    }

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
          // Double check if generated date is a weekend (e.g. from yearly repeat)
          const [gy, gm, gd] = gDateStr.split('-').map(Number);
          const gObj = new Date(gy, gm - 1, gd);
          if (gObj.getDay() === 0 || gObj.getDay() === 6) return;

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
    if (schedule.length > 0) {
      if (window.confirm("Are you sure you want to discard your draft schedule?")) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = async () => {
    if (schedule.length === 0) {
      alert("Please select at least one work day.");
      return;
    }

    // Mapping schedule items to API request_details format
    const requestDetails = schedule.map(item => {
      let startTime, endTime;
      if (item.shift === 'Morning') {
        startTime = `${item.date}T08:30:00+07:00`;
        endTime = `${item.date}T12:00:00+07:00`;
      } else if (item.shift === 'Afternoon') {
        startTime = `${item.date}T13:00:00+07:00`;
        endTime = `${item.date}T17:30:00+07:00`;
      } else { // Full Day
        startTime = `${item.date}T08:30:00+07:00`;
        endTime = `${item.date}T17:30:00+07:00`;
      }
      return {
        date: item.date,
        start_time: startTime,
        end_time: endTime
      };
    });

    const payload = {
      requester_id: user.person_id,
      approver_id: null,
      type: 'register',
      reason: 'Đăng ký lịch làm việc',
      request_details: requestDetails
    };

    try {
      const result = await requestService.submitRequest(payload);
      alert("Đã đăng ký lịch làm việc thành công!");
      console.log('Success:', result);

      // Clear schedule and reset form after success
      setSchedule([]);
      resetForm();
      navigate('/history');
    } catch (error) {
      console.error('Error:', error);
      alert("Có lỗi xảy ra khi đăng ký: " + error.message);
    }
  };


  const handleRemoveFromSchedule = (dateStr) => {
    setSchedule(prev => prev.filter(item => item.date !== dateStr));
  };

  const sortedSchedule = [...schedule].sort((a, b) => a.date.localeCompare(b.date));
  const totalWeeklyHours = schedule.reduce((sum, item) => sum + item.hours, 0);

  const getTimeRangeStr = (shift) => {
    if (shift === 'Morning') return '08:30 - 12:00';
    if (shift === 'Afternoon') return '13:00 - 17:30';
    return '08:30 - 17:30';
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Quay lại
        </button>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Đăng ký ngày làm việc</h1>
        <p className="text-gray-500 mt-2 text-sm sm:text-base">Cấu hình ca làm việc của bạn bằng cách chọn khung giờ phù hợp.</p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
        {/* Select Date */}
        <div className="mb-10">
          <WeekDatePicker
            viewDate={viewDateObj}
            onViewChange={setViewDateObj}
            selectedDates={draftDates}
            onDayClick={handleDayClick}
            workDays={workDays}
          />
        </div>

        {/* Choose Shift */}
        <div className="mb-10">
          <h2 className="text-xs font-bold text-gray-500 tracking-wider mb-6 uppercase">Chọn ca làm việc</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setSelectedShift('Morning')}
              className={`flex flex-col items-start p-6 rounded-2xl border-2 transition-all ${selectedShift === 'Morning'
                ? 'border-blue-500 bg-blue-50/30'
                : 'border-transparent bg-white hover:border-gray-200 shadow-sm'
                }`}
            >
              <SunIcon className={`w-6 h-6 mb-4 ${selectedShift === 'Morning' ? 'text-blue-500' : 'text-gray-400'}`} />
              <span className="font-bold text-gray-900">Buổi sáng</span>
              <span className="text-xs text-gray-400 mt-1 font-medium">08:30 - 12:00</span>
            </button>

            <button
              onClick={() => setSelectedShift('Afternoon')}
              className={`flex flex-col items-start p-6 rounded-2xl border-2 transition-all ${selectedShift === 'Afternoon'
                ? 'border-blue-500 bg-blue-50/30'
                : 'border-transparent bg-white hover:border-gray-200 shadow-sm'
                }`}
            >
              <CloudIcon className={`w-6 h-6 mb-4 ${selectedShift === 'Afternoon' ? 'text-blue-500' : 'text-gray-400'}`} />
              <span className="font-bold text-gray-900">Buổi chiều</span>
              <span className="text-xs text-gray-400 mt-1 font-medium">13:00 - 17:30</span>
            </button>

            <button
              onClick={() => setSelectedShift('Full Day')}
              className={`flex flex-col items-start p-6 rounded-2xl border-2 transition-all ${selectedShift === 'Full Day'
                ? 'border-blue-500 bg-blue-50/30'
                : 'border-transparent bg-white hover:border-gray-200 shadow-sm'
                }`}
            >
              <CalendarDaysIcon className={`w-6 h-6 mb-4 ${selectedShift === 'Full Day' ? 'text-blue-500' : 'text-gray-400'}`} />
              <span className="font-bold text-gray-900">Cả ngày</span>
              <span className="text-xs text-gray-400 mt-1 font-medium">08:30 - 17:30</span>
            </button>
          </div>
          {/* Container 1: Repeat controls */}
          <div className="mt-6 border-t border-gray-100 pt-5">
            <div className="flex flex-row items-center gap-3 flex-nowrap">

              {/* Step 1: Dropdown lặp lại */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setIsRepeatDropdownOpen(!isRepeatDropdownOpen)}
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
                      className="absolute top-[calc(100%+8px)] left-0 min-w-[180px] bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-[101] overflow-hidden"
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
              <span>Thêm vào lịch</span>
              {draftDates.length > 0 && (
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs ml-2">{draftDates.length}</span>
              )}
            </Button>
          </div>
        </div>

        {/* Selected Dates Table */}
        {schedule.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-bold text-gray-500 tracking-wider mb-4 uppercase">Lịch đã chọn</h2>
            <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-400 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Ngày</th>
                    <th className="px-6 py-3 font-semibold">Ca làm</th>
                    <th className="px-6 py-3 font-semibold">Thời gian</th>
                    <th className="px-6 py-3 font-semibold text-right">Thao tác</th>
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
                            title="Xóa"
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
              <h3 className="text-[0.65rem] font-bold text-gray-500 tracking-wider uppercase">Tổng giờ tuần</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">{totalWeeklyHours}</span>
                <span className="text-sm font-medium text-gray-400">/ 40h</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleCancel}>Hủy</Button>
            <Button onClick={handleSubmit}>Đăng ký làm việc</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
