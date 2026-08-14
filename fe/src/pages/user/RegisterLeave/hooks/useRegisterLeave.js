import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getFullDateStr } from '../../../../utils/dateUtils';
import { scheduleService } from '../../../../services/scheduleService';
import { requestService } from '../../../../services/requestService';
import { presetReasonService } from '../../../../services/presetReasonService';
import { useAuth } from '../../../../context/AuthContext';

export function useRegisterLeave() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const initialDate = location.state?.date;

  const [viewDateObj, setViewDateObj] = useState(initialDate ? new Date(initialDate) : new Date());
  const [reason, setReason] = useState('');
  const [schedule, setSchedule] = useState([]);
  const [workDays, setWorkDays] = useState([]);
  const [pendingDates, setPendingDates] = useState([]);
  const [presetReasons, setPresetReasons] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState(null);

  useEffect(() => {
    const loadPresetReasons = async () => {
      try {
        const res = await presetReasonService.getByType('leave');
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
      } else {
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
      type: 'leave',
      reason: reason || t('register.leave_type_register'),
      preset_reason_id: selectedPresetId,
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

  return {
    t,
    i18n,
    viewDateObj,
    setViewDateObj,
    reason,
    setReason,
    schedule,
    workDays,
    pendingDates,
    presetReasons,
    selectedPresetId,
    setSelectedPresetId,
    handleDayClick,
    handleCancel,
    handleSubmit,
    handleRemoveFromSchedule,
    sortedSchedule
  };
}
