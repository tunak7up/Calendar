import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  SparklesIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import WeekDatePicker from '../../components/WeekDatePicker';
import { getFullDateStr } from '../../utils/dateUtils';
import { scheduleService } from '../../services/scheduleService';
import { requestService } from '../../services/requestService';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import BackButton from '../../components/BackButton';

const getHHMM = (isoStr) => {
  if (!isoStr) return '';
  const dateObj = new Date(isoStr);
  return `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
};

export default function RegisterException() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const initialDate = location.state?.date;

  const [viewDateObj, setViewDateObj] = useState(initialDate ? new Date(initialDate) : new Date());

  // Refined states
  const [selectedDate, setSelectedDate] = useState(null); // Single object: { date, standardStart, standardEnd, adjustedTime }
  const [exceptionType, setExceptionType] = useState(''); // 'arrive_early', 'arrive_late', 'leave_early', 'leave_late' or ''
  const [reason, setReason] = useState('');

  const [workSchedules, setWorkSchedules] = useState([]);
  const [workDays, setWorkDays] = useState([]);

  // Fetch approved schedule days for user
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const result = await scheduleService.getScheduleByPersonId(user.person_id);
        if (result.success) {
          setWorkSchedules(result.data);
          const days = result.data.map(item => item.working_date.split(/[T ]/)[0]);
          setWorkDays(days);

          // Proactively set initialDate if it was passed and has an active schedule
          if (initialDate && days.includes(initialDate)) {
            const currentSchedule = result.data.find(s => s.working_date.split(/[T ]/)[0] === initialDate);
            const standardStart = currentSchedule ? getHHMM(currentSchedule.start_time) : '08:30';
            const standardEnd = currentSchedule ? getHHMM(currentSchedule.end_time) : '18:00';

            setSelectedDate({
              date: initialDate,
              standardStart,
              standardEnd,
              adjustedTime: '09:30' // Default arrive_late
            });
            setExceptionType('arrive_late'); // Auto-select type
          }
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
      }
    };
    fetchSchedule();
  }, []);

  const handleDayClick = (dObj) => {
    const dStr = getFullDateStr(dObj);
    const todayStr = getFullDateStr(new Date());
    if (dStr < todayStr) {
      alert(t('register.alert_past_date'));
      return;
    }

    // Check if weekend
    const day = dObj.getDay();
    if (day === 0 || day === 6) {
      alert(t('register.alert_weekend'));
      return;
    }

    // Requires an approved work schedule on this date
    if (!workDays.includes(dStr)) {
      alert(t('register.alert_exception_no_schedule', { date: dStr }));
      return;
    }

    const currentSchedule = workSchedules.find(s => s.working_date.split(/[T ]/)[0] === dStr);
    const standardStart = currentSchedule ? getHHMM(currentSchedule.start_time) : '08:30';
    const standardEnd = currentSchedule ? getHHMM(currentSchedule.end_time) : '18:00';

    let defaultAdjusted = '';
    if (exceptionType === 'arrive_early') defaultAdjusted = '08:00';
    else if (exceptionType === 'arrive_late') {
      defaultAdjusted = standardStart === '13:00' ? '14:00' : '09:30';
    }
    else if (exceptionType === 'leave_early') {
      defaultAdjusted = standardEnd === '12:00' ? '11:00' : '16:30';
    }
    else if (exceptionType === 'leave_late') defaultAdjusted = '19:00';

    setSelectedDate({
      date: dStr,
      standardStart,
      standardEnd,
      adjustedTime: defaultAdjusted
    });
  };

  const handleTypeChange = (newType) => {
    setExceptionType(newType);
    if (selectedDate) {
      let defaultAdjusted = '';
      if (newType === 'arrive_early') defaultAdjusted = '08:00';
      else if (newType === 'arrive_late') {
        defaultAdjusted = selectedDate.standardStart === '13:00' ? '14:00' : '09:30';
      }
      else if (newType === 'leave_early') {
        defaultAdjusted = selectedDate.standardEnd === '12:00' ? '11:00' : '16:30';
      }
      else if (newType === 'leave_late') defaultAdjusted = '19:00';

      setSelectedDate(prev => ({
        ...prev,
        adjustedTime: defaultAdjusted
      }));
    }
  };

  const handleAdjustedTimeChange = (newTime) => {
    setSelectedDate(prev => prev ? { ...prev, adjustedTime: newTime } : null);
  };

  const handleCancel = () => {
    if (selectedDate || reason) {
      if (window.confirm(t('register.alert_exception_confirm_discard'))) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate) {
      alert(t('register.alert_exception_select_at_least_one'));
      return;
    }

    if (!exceptionType) {
      alert(t('register.exception_select_type'));
      return;
    }

    if (!reason.trim()) {
      alert(t('register.alert_exception_reason_required'));
      return;
    }

    let finalStart = selectedDate.standardStart;
    let finalEnd = selectedDate.standardEnd;

    if (exceptionType === 'arrive_early' || exceptionType === 'arrive_late') {
      finalStart = selectedDate.adjustedTime;
    } else {
      finalEnd = selectedDate.adjustedTime;
    }

    const startTime = `${selectedDate.date}T${finalStart}:00+07:00`;
    const endTime = `${selectedDate.date}T${finalEnd}:00+07:00`;

    const requestDetails = [{
      date: selectedDate.date,
      start_time: startTime,
      end_time: endTime
    }];

    const payload = {
      requester_id: user.person_id,
      approver_id: null,
      type: exceptionType,
      reason: reason,
      request_details: requestDetails,
      is_exception: true
    };

    try {
      await requestService.submitExceptionRequest(payload);
      alert(t('register.alert_exception_success'));
      setSelectedDate(null);
      setExceptionType('');
      setReason('');
      navigate('/history');
    } catch (error) {
      console.error('Error:', error);
      alert(t('register.alert_submit_error') + (error.message || error));
    }
  };

  const getTimeOptions = (type, standardStart, standardEnd) => {
    if (type === 'arrive_early') {
      const options = ['06:00', '06:30', '07:00', '07:30', '08:00'];
      return options.filter(t => t < standardStart);
    }
    if (type === 'arrive_late') {
      const options = ['09:00', '09:30', '13:30', '14:00'];
      return options.filter(t => t > standardStart && t < standardEnd);
    }
    if (type === 'leave_early') {
      const options = ['10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
      return options.filter(t => t < standardEnd && t > standardStart);
    }
    if (type === 'leave_late') {
      const options = ['18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '22:00'];
      return options.filter(t => t > standardEnd);
    }
    return [];
  };

  const getDisplayDate = () => {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.date.split('-');
    const dObj = new Date(y, m - 1, d);
    return dObj.toLocaleDateString('vi-VN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const typesConfig = [
    { id: 'arrive_late', key: 'register.exception_arrive_late' },
    { id: 'leave_early', key: 'register.exception_leave_early' },
    { id: 'arrive_early', key: 'register.exception_arrive_early' },
    { id: 'leave_late', key: 'register.exception_leave_late' },
  ];

  return (
    <div className="space-y-6 pb-20">
      <div className="mb-8">
        <BackButton className="mb-6" />
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <span>{t('register.exception_title')}</span>
          <SparklesIcon className="w-6 h-6 text-blue-500 animate-pulse" />
        </h1>
        <p className="text-gray-500 mt-2 text-sm sm:text-base">{t('register.exception_subtitle')}</p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-10">

        {/* Step 1: Select Date (Only 1 Day) */}
        <div>
          <h2 className="text-xs font-bold text-gray-400 tracking-wider mb-5 uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            {t('register.col_date')}
          </h2>
          <div className="bg-gray-50/50 p-4 sm:p-6 rounded-2xl border border-gray-100">
            <WeekDatePicker
              viewDate={viewDateObj}
              onViewChange={setViewDateObj}
              selectedDates={selectedDate ? [selectedDate.date] : []}
              onDayClick={handleDayClick}
              workDays={workDays}
            />
          </div>
          {selectedDate && (
            <div className="mt-3 flex items-center gap-2 text-sm text-blue-600 font-semibold bg-blue-50/50 py-2 px-4 rounded-xl border border-blue-100 w-fit">
              <CalendarDaysIcon className="w-4 h-4" />
              <span>Đang chọn ngày: {getDisplayDate()}</span>
            </div>
          )}
        </div>

        {/* Step 2: Choose Exception Type (Only shown after Date is selected) */}
        {selectedDate && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-xs font-bold text-gray-400 tracking-wider mb-5 uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              {t('register.exception_type')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {typesConfig.map(cfg => {
                const active = exceptionType === cfg.id;
                return (
                  <div
                    key={cfg.id}
                    onClick={() => handleTypeChange(cfg.id)}
                    className={`flex flex-col justify-center items-center p-5 rounded-2xl border-2 transition-all cursor-pointer text-center relative overflow-hidden group select-none ${active
                      ? 'border-blue-500 bg-blue-50/20 shadow-md ring-2 ring-blue-500/10'
                      : 'border-gray-100 bg-white hover:border-gray-250 hover:shadow-sm'
                      }`}
                  >
                    <span className={`text-[14px] font-extrabold tracking-tight transition-colors ${active ? 'text-blue-700 font-black' : 'text-gray-600 group-hover:text-gray-900'
                      }`}>
                      {t(cfg.key)}
                    </span>
                    {active && (
                      <div className="absolute top-1 right-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Registration Information Card (Only shown after both Date and Type are selected) */}
        {selectedDate && exceptionType && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <h2 className="text-xs font-bold text-gray-400 tracking-wider mb-5 uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                {t('register.adjusted_schedule')}
              </h2>

              <div className="bg-white border-2 border-blue-500/20 rounded-3xl p-6 shadow-sm w-full space-y-6">

                {/* Header Information */}
                <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                  <div>
                    <h4 className="font-black text-gray-900 text-lg">{getDisplayDate()}</h4>
                    <p className="text-xs text-gray-400 font-medium mt-1">
                      {t('register.standard_hours')}: <span className="font-bold text-gray-600">{selectedDate.standardStart} - {selectedDate.standardEnd}</span>
                    </p>
                  </div>
                  <span className="bg-blue-50 text-blue-700 text-xs font-black px-3 py-1 rounded-lg border border-blue-100">
                    {t(`register.exception_${exceptionType}`)}
                  </span>
                </div>

                {/* Option Time Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  <div>
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-wider block mb-2">
                      {t('register.exception_time')}
                    </label>

                    {getTimeOptions(exceptionType, selectedDate.standardStart, selectedDate.standardEnd).length > 0 ? (
                      <select
                        value={selectedDate.adjustedTime}
                        onChange={(e) => handleAdjustedTimeChange(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm font-bold rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all shadow-sm min-h-[46px]"
                      >
                        {getTimeOptions(exceptionType, selectedDate.standardStart, selectedDate.standardEnd).map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-xs text-red-500 font-semibold flex items-center gap-1.5 bg-red-50 p-3 rounded-2xl border border-red-100">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        <span>Không có mốc giờ khả dụng</span>
                      </div>
                    )}
                  </div>

                  {/* Visualization Comparison */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col justify-center gap-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-semibold">{t('register.standard_hours')}:</span>
                      <span className="font-bold text-gray-600">{selectedDate.standardStart} - {selectedDate.standardEnd}</span>
                    </div>
                    <div className="h-px bg-gray-200 w-full my-1"></div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-blue-600 font-bold">{t('register.col_adjusted_time')}:</span>
                      <span className="font-black text-blue-700">
                        {exceptionType === 'arrive_early' || exceptionType === 'arrive_late'
                          ? `${selectedDate.adjustedTime} - ${selectedDate.standardEnd}`
                          : `${selectedDate.standardStart} - ${selectedDate.adjustedTime}`
                        }
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Justification Reason */}
            <div>
              <h2 className="text-xs font-bold text-gray-400 tracking-wider mb-5 uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                {t('register.exception_reason')}
              </h2>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('register.exception_reason_placeholder')}
                className="w-full h-28 p-4 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white shadow-sm resize-none transition-all outline-none text-gray-700 text-sm"
              ></textarea>
            </div>

            <div className="h-px bg-gray-100 w-full my-6"></div>

            {/* Submit & Cancel Actions */}
            <div className="flex justify-end items-center">
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={handleCancel}>
                  {t('register.btn_cancel')}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedDate || !exceptionType || !reason.trim()}
                >
                  {t('register.btn_submit_exception')}
                </Button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
