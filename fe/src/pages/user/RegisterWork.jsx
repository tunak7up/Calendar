import React, { useState, useEffect } from 'react';
import { SunIcon, CloudIcon, CalendarDaysIcon, ClockIcon, TrashIcon, ChevronDownIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import WeekDatePicker from '../../components/WeekDatePicker';
import { getFullDateStr } from '../../utils/dateUtils';
import { scheduleService } from '../../services/scheduleService';
import { requestService } from '../../services/requestService';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import BackButton from '../../components/BackButton';
import ShiftSelector from '../../components/ShiftSelector';

const calculateHours = (start, end) => {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  let diff = (endH + endM / 60) - (startH + startM / 60);
  if (startH < 12 && endH > 13) {
    diff -= 1; // subtract 1 hour for lunch break
  }
  return Math.max(0, Math.round(diff * 10) / 10);
};

export default function RegisterWork() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const initialDate = location.state?.date;

  const [viewDateObj, setViewDateObj] = useState(initialDate ? new Date(initialDate) : new Date());
  const [draftDates, setDraftDates] = useState(initialDate ? [initialDate] : []);
  const [selectedShift, setSelectedShift] = useState('Morning');
  const [shiftStartTime, setShiftStartTime] = useState('08:30');
  const [shiftEndTime, setShiftEndTime] = useState('17:30');
  const [schedule, setSchedule] = useState([]);
  const [workDays, setWorkDays] = useState([]);

  const handleShiftChange = (shift) => {
    setSelectedShift(shift);
    if (shift === 'Morning') {
      setShiftStartTime('08:30');
      setShiftEndTime('12:00');
    } else if (shift === 'Afternoon') {
      setShiftStartTime('13:00');
      setShiftEndTime('17:30');
    } else { // Full Day
      setShiftStartTime('08:30');
      setShiftEndTime('17:30');
    }
  };

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!user?.person_id) return;
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
  }, [user?.person_id]);
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
      alert(t('register.alert_weekend'));
      return;
    }
    const dStr = getFullDateStr(dObj);
    const todayStr = getFullDateStr(new Date());
    if (dStr < todayStr) {
      alert(t('register.alert_past_date'));
      return;
    }
    if (workDays.includes(dStr)) {
      alert(t('register.alert_already_approved', { date: dStr }));
      return;
    }
    setDraftDates(prev =>
      prev.includes(dStr) ? prev.filter(s => s !== dStr) : [...prev, dStr]
    );
  };

  const resetForm = () => {
    setDraftDates([]);
    setSelectedShift('Morning');
    setShiftStartTime('08:30');
    setShiftEndTime('17:30');
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
      alert(t('register.alert_already_approved_multi', { dates: duplicates.join('\n') }));
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
            hours: calculateHours(shiftStartTime, shiftEndTime),
            startTime: shiftStartTime,
            endTime: shiftEndTime
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
      if (window.confirm(t('register.alert_confirm_discard'))) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = async () => {
    if (schedule.length === 0) {
      alert(t('register.alert_select_at_least_one'));
      return;
    }

    // Mapping schedule items to API request_details format
    const requestDetails = schedule.map(item => {
      const start = item.startTime || '08:30';
      const end = item.endTime || '17:30';
      
      const startTime = `${item.date}T${start}:00+07:00`;
      const endTime = `${item.date}T${end}:00+07:00`;

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
      reason: t('register.work_title'),
      request_details: requestDetails
    };

    try {
      const result = await requestService.submitRequest(payload);
      alert(t('register.alert_submit_success'));
      console.log('Success:', result);

      // Clear schedule and reset form after success
      setSchedule([]);
      resetForm();
      navigate('/history');
    } catch (error) {
      console.error('Error:', error);
      alert(t('register.alert_submit_error') + error.message);
    }
  };


  const handleRemoveFromSchedule = (dateStr) => {
    setSchedule(prev => prev.filter(item => item.date !== dateStr));
  };

  const sortedSchedule = [...schedule].sort((a, b) => a.date.localeCompare(b.date));
  const totalWeeklyHours = schedule.reduce((sum, item) => sum + item.hours, 0);

  const getShiftTimeRange = (item) => {
    return `${item.startTime || '08:30'} - ${item.endTime || '17:30'}`;
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="mb-8">
        <BackButton className="mb-6" />
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{t('register.work_title')}</h1>
        <p className="text-gray-500 mt-2 text-sm sm:text-base">{t('register.work_subtitle')}</p>
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
          <h2 className="text-xs font-bold text-gray-500 tracking-wider mb-6 uppercase">{t('register.choose_shift')}</h2>
          <ShiftSelector
            selectedShift={selectedShift}
            onShiftChange={handleShiftChange}
            shiftStartTime={shiftStartTime}
            onStartTimeChange={setShiftStartTime}
            shiftEndTime={shiftEndTime}
            onEndTimeChange={setShiftEndTime}
          />
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
                    {repeatOption === 'none' && t('register.repeat_none')}
                    {repeatOption === 'weekly' && t('register.repeat_weekly')}
                    {repeatOption === 'yearly' && t('register.repeat_yearly')}
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
                          {opt === 'none' && t('register.repeat_none')}
                          {opt === 'weekly' && t('register.repeat_weekly')}
                          {opt === 'yearly' && t('register.repeat_yearly')}
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
                    <span className="text-[14px] font-medium text-gray-600 whitespace-nowrap">{t('register.end_label')}</span>
                    <select
                      className="text-[14px] font-semibold text-gray-900 border-0 focus:ring-0 p-0 cursor-pointer bg-transparent"
                      value={endOption}
                      onChange={(e) => setEndOption(e.target.value)}
                    >
                      <option value="never">{t('register.end_never')}</option>
                      <option value="date">{t('register.end_date')}</option>
                      <option value="count">{t('register.end_count')}</option>
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
                        <span className="text-[13px] text-gray-500 whitespace-nowrap">{t('register.end_count_times')}</span>
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
                    <span className="text-[14px] font-medium text-gray-600 whitespace-nowrap">{t('register.repeat_every')}</span>
                    <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2">
                      <input
                        type="number"
                        value={repeatInterval}
                        onChange={(e) => setRepeatInterval(Number(e.target.value) || 1)}
                        className="text-[14px] border-none bg-transparent py-1 px-0 focus:ring-0 text-gray-700 w-10 text-center"
                        min={1}
                      />
                      <span className="text-[13px] text-gray-500">{repeatOption === 'weekly' ? t('register.repeat_week') : t('register.repeat_year')}</span>
                    </div>
                  </div>
                </>
              )}

            </div>
          </div>

          {/* Container 2: Add to Schedule button */}
          <div className="flex justify-end mt-4">
            <Button onClick={handleAddToSchedule} disabled={draftDates.length === 0}>
              <span>{t('register.add_to_schedule')}</span>
              {draftDates.length > 0 && (
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs ml-2">{draftDates.length}</span>
              )}
            </Button>
          </div>

        {/* Selected Dates Table */}
        {schedule.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-bold text-gray-500 tracking-wider mb-4 uppercase">{t('register.selected_schedule')}</h2>
            <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-400 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 font-semibold">{t('register.col_date')}</th>
                    <th className="px-6 py-3 font-semibold">{t('register.col_shift')}</th>
                    <th className="px-6 py-3 font-semibold">{t('register.col_time')}</th>
                    <th className="px-6 py-3 font-semibold text-right">{t('register.col_action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedSchedule.map(item => {
                    const [y, m, d] = item.date.split('-');
                    const dObj = new Date(y, m - 1, d);
                    const weekday = dObj.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short' });
                    const displayDate = `${weekday}, ${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;

                    return (
                      <tr key={item.date} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {displayDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700 font-medium">
                          {item.shift === 'Morning' ? t('register.shift_morning') : item.shift === 'Afternoon' ? t('register.shift_afternoon') : t('register.shift_full')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {getShiftTimeRange(item)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Button
                            variant="danger-icon"
                            onClick={() => handleRemoveFromSchedule(item.date)}
                            title={t('register.col_action')}
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
              <h3 className="text-[0.65rem] font-bold text-gray-500 tracking-wider uppercase">{t('register.total_weekly_hours')}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">{totalWeeklyHours}</span>
                <span className="text-sm font-medium text-gray-400">/ 40h</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleCancel}>{t('register.btn_cancel')}</Button>
            <Button onClick={handleSubmit}>{t('register.btn_submit_work')}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
