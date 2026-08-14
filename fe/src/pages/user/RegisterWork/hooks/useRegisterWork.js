import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getFullDateStr } from '../../../../utils/dateUtils';
import { scheduleService } from '../../../../services/scheduleService';
import { requestService } from '../../../../services/requestService';
import { useAuth } from '../../../../context/AuthContext';

const calculateHours = (start, end) => {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  let diff = (endH + endM / 60) - (startH + startM / 60);
  if (startH < 12 && endH > 13) {
    diff -= 1;
  }
  return Math.max(0, Math.round(diff * 10) / 10);
};

export function useRegisterWork() {
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
  const [pendingDates, setPendingDates] = useState([]);

  const handleShiftChange = (shift) => {
    setSelectedShift(shift);
    if (shift === 'Morning') {
      setShiftStartTime('08:30');
      setShiftEndTime('12:00');
    } else if (shift === 'Afternoon') {
      setShiftStartTime('13:00');
      setShiftEndTime('17:30');
    } else {
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

  const [isRepeatDropdownOpen, setIsRepeatDropdownOpen] = useState(false);
  const [repeatOption, setRepeatOption] = useState('none');
  const [repeatInterval, setRepeatInterval] = useState(1);

  const [endOption, setEndOption] = useState('never');
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
              if (!endDate && count >= 52) break;
            } else {
              if (count >= 52) break;
            }

            generatedDates.push(nextDateStr);
            count++;
          }
        }

        generatedDates.forEach(gDateStr => {
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
      await requestService.submitRequest(payload);
      alert(t('register.alert_submit_success'));
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

  return {
    t,
    i18n,
    viewDateObj,
    setViewDateObj,
    draftDates,
    selectedShift,
    shiftStartTime,
    setShiftStartTime,
    shiftEndTime,
    setShiftEndTime,
    schedule,
    workDays,
    pendingDates,
    isRepeatDropdownOpen,
    setIsRepeatDropdownOpen,
    repeatOption,
    setRepeatOption,
    repeatInterval,
    setRepeatInterval,
    endOption,
    setEndOption,
    endDate,
    setEndDate,
    endCount,
    setEndCount,
    handleShiftChange,
    handleDayClick,
    handleAddToSchedule,
    handleCancel,
    handleSubmit,
    handleRemoveFromSchedule,
    sortedSchedule,
    totalWeeklyHours,
    getShiftTimeRange
  };
}
