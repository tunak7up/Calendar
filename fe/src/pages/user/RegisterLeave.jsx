import React, { useState, useEffect, useCallback } from 'react';
import { SunIcon, CloudIcon, CalendarDaysIcon, TrashIcon, CalendarIcon, ClockIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import WeekDatePicker from '../../components/WeekDatePicker';
import { getFullDateStr } from '../../utils/dateUtils';
import { scheduleService } from '../../services/scheduleService';
import { requestService } from '../../services/requestService';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import BackButton from '../../components/BackButton';

export default function RegisterLeave() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const initialDate = location.state?.date;

  const [viewDateObj, setViewDateObj] = useState(initialDate ? new Date(initialDate) : new Date());
  const [reason, setReason] = useState('');
  const [schedule, setSchedule] = useState([]);
  const [workDays, setWorkDays] = useState([]);

  const fetchShiftAndAdd = useCallback(async (dateStr) => {
    if (!user?.person_id) return;
    try {
      const res = await scheduleService.getShiftByDate(user.person_id, dateStr);
      if (res.success && res.data) {
        setSchedule(prev => {
          if (prev.some(item => item.date === dateStr)) return prev;
          return [...prev, {
            date: dateStr,
            shift: res.data,
            hours: res.data === 'Full Day' ? 8 : 4
          }];
        });
      } else {
        alert(t('register.alert_leave_approved'));
      }
    } catch (error) {
      console.error('Error fetching shift:', error);
      alert(t('register.alert_leave_fetch_error'));
    }
  }, [user, t]);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!user?.person_id) return;
      try {
        const result = await scheduleService.getScheduleByPersonId(user.person_id);
        if (result.success) {
          const days = result.data.map(item => item.start_time.split(/[T ]/)[0]);
          setWorkDays(days);

          // If initialDate was passed, auto-add it if it's a work day
          if (initialDate && days.includes(initialDate)) {
            fetchShiftAndAdd(initialDate);
          }
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
      }
    };
    fetchSchedule();
  }, [user?.person_id, initialDate, fetchShiftAndAdd]);

  const handleDayClick = (dObj) => {
    const dStr = getFullDateStr(dObj);
    const todayStr = getFullDateStr(new Date());
    if (dStr < todayStr) {
      alert(t('register.alert_past_date'));
      return;
    }
    if (schedule.some(item => item.date === dStr)) {
      setSchedule(prev => prev.filter(item => item.date !== dStr));
    } else {
      fetchShiftAndAdd(dStr);
    }
  };

  const handleCancel = () => {
    if (schedule.length > 0 || reason) {
      if (window.confirm(t('register.alert_leave_confirm_discard'))) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = async () => {
    if (schedule.length === 0) {
      alert(t('register.alert_leave_select_at_least_one'));
      return;
    }

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
      type: 'leave', // Important: Type is leave
      reason: reason || t('register.leave_type_register'),
      request_details: requestDetails
    };

    try {
      await requestService.submitRequest(payload);
      alert(t('register.alert_leave_submit_success'));
      setSchedule([]);
      setReason('');
      navigate('/history');
    } catch (error) {
      console.error('Error:', error);
      alert(t('register.alert_leave_submit_error') + error.message);
    }
  };


  const handleRemoveFromSchedule = (dateStr) => {
    setSchedule(prev => prev.filter(item => item.date !== dateStr));
  };

  const sortedSchedule = [...schedule].sort((a, b) => a.date.localeCompare(b.date));


  return (
    <>
      <div>
        <div className="mb-8">
          <BackButton className="mb-6" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{t('register.leave_title')}</h1>
          <p className="text-gray-500 mt-2 text-sm sm:text-base">{t('register.leave_subtitle')}</p>
        </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
        {/* Select Date */}
        <div className="mb-6">
          <WeekDatePicker
            viewDate={viewDateObj}
            onViewChange={setViewDateObj}
            selectedDates={schedule.map(item => item.date)}
            onDayClick={handleDayClick}
            workDays={workDays}
          />
        </div>



        {/* Schedule Table */}
        {schedule.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xs font-bold text-gray-500 tracking-wider mb-4 uppercase">{t('register.selected_leaves')}</h2>
            <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm max-h-[300px] overflow-y-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-400 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 font-semibold">{t('register.col_date')}</th>
                    <th className="px-6 py-3 font-semibold">{t('register.col_shift')}</th>
                    <th className="px-6 py-3 font-semibold text-right">{t('register.col_action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedSchedule.map(item => (
                    <tr key={item.date} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {item.shift === 'Morning' ? t('register.shift_morning') : item.shift === 'Afternoon' ? t('register.shift_afternoon') : t('register.shift_full')}
                      </td>
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
          <h2 className="text-xs font-bold text-gray-500 tracking-wider mb-6 uppercase">{t('register.leave_reason')}</h2>
          <textarea
            className="w-full h-32 p-4 rounded-2xl border border-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white shadow-sm resize-none transition-all outline-none text-gray-700"
            placeholder={t('register.leave_reason_placeholder')}
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
              <h3 className="text-[0.65rem] font-bold text-gray-500 tracking-wider uppercase">{t('register.total_leaves')}</h3>
              <span className="text-2xl font-bold text-gray-900">{schedule.length}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleCancel}>{t('register.btn_cancel')}</Button>
            <Button onClick={handleSubmit}>{t('register.btn_submit_leave')}</Button>
          </div>
        </div>
      </div>
    </div>
  </>
  );
}
