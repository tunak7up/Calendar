import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getFullDateStr } from '../../../../utils/dateUtils';
import { scheduleService } from '../../../../services/scheduleService';
import { requestService } from '../../../../services/requestService';
import { presetReasonService } from '../../../../services/presetReasonService';
import { useAuth } from '../../../../context/AuthContext';

const getHHMM = (isoStr) => {
  if (!isoStr) return '';
  const dateObj = new Date(isoStr);
  return `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
};

export function useRegisterException() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const initialDate = location.state?.date;

  const [viewDateObj, setViewDateObj] = useState(initialDate ? new Date(initialDate) : new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [exceptionType, setExceptionType] = useState('');
  const [reason, setReason] = useState('');

  const [workSchedules, setWorkSchedules] = useState([]);
  const [workDays, setWorkDays] = useState([]);
  const [presetReasons, setPresetReasons] = useState([]);
  const [pendingDates, setPendingDates] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState(null);

  useEffect(() => {
    const loadPresetReasons = async () => {
      try {
        const res = await presetReasonService.getByType('exception');
        if (res.success) {
          setPresetReasons(res.data);
        }
      } catch (err) {
        console.error('Error loading preset reasons:', err);
      }
    };
    loadPresetReasons();
  }, []);

  useEffect(() => {
    const fetchPendingRequests = async () => {
      if (!user?.person_id) return;
      try {
        const result = await requestService.getRequestsByRequester(user.person_id);
        if (result.success) {
          const pending = result.data.filter(req => req.status === 'pending');
          const dates = [];
          pending.forEach(req => {
            if (req.details) {
              req.details.forEach(d => {
                if (d.date) dates.push(d.date);
              });
            }
          });
          setPendingDates(dates);
        }
      } catch (error) {
        console.error('Error fetching pending requests:', error);
      }
    };
    fetchPendingRequests();
  }, [user?.person_id]);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!user?.person_id) return;
      try {
        const result = await scheduleService.getScheduleByPersonId(user.person_id);
        if (result.success) {
          setWorkSchedules(result.data);
          const days = result.data.map(item => item.working_date.split(/[T ]/)[0]);
          setWorkDays(days);

          if (initialDate && days.includes(initialDate)) {
            const currentSchedule = result.data.find(s => s.working_date.split(/[T ]/)[0] === initialDate);
            const standardStart = currentSchedule ? getHHMM(currentSchedule.start_time) : '08:30';
            const standardEnd = currentSchedule ? getHHMM(currentSchedule.end_time) : '18:00';

            setSelectedDate({
              date: initialDate,
              standardStart,
              standardEnd,
              adjustedTime: '09:30'
            });
            setExceptionType('arrive_late');
          }
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
      }
    };
    fetchSchedule();
  }, [user?.person_id, initialDate]);

  const handleDayClick = (dObj) => {
    const dStr = getFullDateStr(dObj);
    const todayStr = getFullDateStr(new Date());
    if (dStr < todayStr) {
      alert(t('register.alert_past_date'));
      return;
    }

    const day = dObj.getDay();
    if (day === 0 || day === 6) {
      alert(t('register.alert_weekend'));
      return;
    }

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
      preset_reason_id: selectedPresetId,
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
      const options = ['10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:15', '17:30', '17:45', '18:00', '18:15'];
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
    const weekday = dObj.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short' });
    return `${weekday}, ${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  };

  const typesConfig = [
    { id: 'arrive_late', key: 'register.exception_arrive_late' },
    { id: 'leave_early', key: 'register.exception_leave_early' },
    { id: 'arrive_early', key: 'register.exception_arrive_early' },
    { id: 'leave_late', key: 'register.exception_leave_late' },
  ];

  return {
    t,
    i18n,
    viewDateObj,
    setViewDateObj,
    selectedDate,
    exceptionType,
    reason,
    setReason,
    workDays,
    presetReasons,
    pendingDates,
    selectedPresetId,
    setSelectedPresetId,
    handleDayClick,
    handleTypeChange,
    handleAdjustedTimeChange,
    handleCancel,
    handleSubmit,
    getTimeOptions,
    getDisplayDate,
    typesConfig
  };
}
