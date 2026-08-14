import { useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { scheduleService } from '../../../../services/scheduleService';
import { dailyReportService } from '../../../../services/dailyReportService';
import { useAuth } from '../../../../context/AuthContext';
import { apiFetch } from '../../../../services/api';
import { taskService } from '../../../../services/taskService';
import { useTheme, useTaskColor } from '../../../../context/ThemeContext';
import { getLocalYYYYMMDD } from '../../../../utils/dateUtils';

export function useMySchedule() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const getTaskColor = useTaskColor();

  const regTheme = useMemo(() => theme?.['[data-custom-component="Schedule-User-Registered"]'] || { bg: '#e0f2fe', text: '#0369a1' }, [theme]);
  const unschedTheme = useMemo(() => theme?.['[data-custom-component="Schedule-User-Unscheduled"]'] || { bg: '#fef3c7', text: '#92400e' }, [theme]);
  const absentTheme = useMemo(() => theme?.['[data-custom-component="Schedule-User-Absent"]'] || { bg: '#ffe4e6', text: '#9f1239' }, [theme]);
  const upcomingTheme = useMemo(() => theme?.['[data-custom-component="Schedule-User-Upcoming"]'] || { bg: '#ede9fe', text: '#6d28d9' }, [theme]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewDate, setViewDate] = useState(today);
  const calendarRef = useRef(null);
  const fetchedKeysRef = useRef(new Set());

  const [workingHours, setWorkingHours] = useState([]);
  const [rawTasks, setRawTasks] = useState([]);
  const [reports, setReports] = useState([]);
  const [menuConfig, setMenuConfig] = useState(null);

  const fetchData = useCallback(async (year, month) => {
    if (!user?.person_id) return;
    try {
      const startDate = new Date(year, month - 2, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);

      const pad = (n) => String(n).padStart(2, '0');
      const startStr = `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-01T00:00:00`;
      const endStr = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}T23:59:59`;

      const [scheduleRes, taskRes, reportRes] = await Promise.all([
        scheduleService.getScheduleByPersonIdWithTimeRange({
          personId: user.person_id,
          startTime: startStr,
          endTime: endStr
        }),
        taskService.getAllTasksByParticipantId(user.person_id),
        dailyReportService.getDailyReportByPersonId(user.person_id)
      ]);

      const fetchedReports = reportRes.success ? reportRes.data : [];
      setReports(fetchedReports);
      if (taskRes.success) {
        setRawTasks(taskRes.data);
      }

      let newWorkHours = [];
      if (scheduleRes.success) {
        const registeredWorkHours = scheduleRes.data.map(item => ({
          id: `work_${item.schedule_id}`,
          title: t('myschedule.work_title'),
          start: item.start_time,
          end: item.end_time,
          priorityOrder: 6,
          extendedProps: { isWorkHour: true, priorityOrder: 6, isRegistered: true }
        }));

        const unregisteredWorkHours = [];
        fetchedReports.forEach(rep => {
          const repDate = getLocalYYYYMMDD(rep.working_date);
          if (!repDate) return;
          const hasSchedule = registeredWorkHours.some(wh => getLocalYYYYMMDD(wh.start) === repDate);
          if (!hasSchedule) {
            const checkInTime = rep.check_in || '08:00:00';
            const checkOutTime = rep.check_out || '17:00:00';
            unregisteredWorkHours.push({
              id: `report_work_${rep.id}`,
              title: t('myschedule.legend_unscheduled') || 'Đi làm ngoài lịch',
              start: `${repDate}T${checkInTime}`,
              end: `${repDate}T${checkOutTime}`,
              priorityOrder: 6,
              extendedProps: { isWorkHour: true, priorityOrder: 6, isRegistered: false, report: rep }
            });
          }
        });
        newWorkHours = [...registeredWorkHours, ...unregisteredWorkHours];
      }

      setWorkingHours(prev => {
        const merged = new Map(prev.map(wh => [wh.id, wh]));
        newWorkHours.forEach(wh => merged.set(wh.id, wh));
        return Array.from(merged.values());
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [user, t]);

  const tasks = useMemo(() => {
    return rawTasks.map(task => {
      const colorSet = getTaskColor(task.status);
      const status = task.status?.toLowerCase();
      let pOrder = 5;
      if (status === 'overdue') pOrder = 1;
      else if (status === 'in progress') pOrder = 2;
      else if (status === 'pending') pOrder = 3;
      else if (status === 'completed') pOrder = 4;

      return {
        id: `task_${task.task_id}`,
        title: task.name || 'Untitled Task',
        start: task.start_time,
        end: task.due_date,
        allDay: false,
        backgroundColor: colorSet.bg,
        borderColor: colorSet.border,
        textColor: colorSet.text,
        priorityOrder: pOrder,
        extendedProps: { isTask: true, taskData: task, priorityOrder: pOrder }
      };
    });
  }, [rawTasks, getTaskColor]);

  const workDays = useMemo(() => {
    const registeredDays = workingHours.map(e => getLocalYYYYMMDD(e.start)).filter(Boolean);
    const reportDays = reports.map(r => getLocalYYYYMMDD(r.working_date)).filter(Boolean);
    return Array.from(new Set([...registeredDays, ...reportDays]));
  }, [workingHours, reports]);

  const dayStatusMap = useMemo(() => {
    const map = {};
    const todayLocalStr = getLocalYYYYMMDD(new Date());

    workingHours.forEach(wh => {
      if (wh.extendedProps?.isWorkHour) {
        const dateStr = getLocalYYYYMMDD(wh.start);
        if (dateStr) {
          const isRegistered = wh.extendedProps.isRegistered;
          const rep = reports.find(r => getLocalYYYYMMDD(r.working_date) === dateStr);
          
          if (isRegistered) {
            if (rep) {
              map[dateStr] = 'scheduled';
            } else {
              if (dateStr < todayLocalStr) {
                map[dateStr] = 'absent';
              } else {
                map[dateStr] = 'upcoming';
              }
            }
          } else {
            map[dateStr] = 'unscheduled';
          }
        }
      }
    });

    reports.forEach(rep => {
      const dateStr = getLocalYYYYMMDD(rep.working_date);
      if (dateStr && !map[dateStr]) {
        map[dateStr] = 'unscheduled';
      }
    });

    return map;
  }, [workingHours, reports]);

  const displayEvents = [...workingHours, ...tasks].map(e => {
    if (e.extendedProps?.isWorkHour) {
      const dateStr = getLocalYYYYMMDD(e.start);
      const status = dayStatusMap[dateStr];
      let bg = regTheme.bg;
      if (status === 'scheduled') bg = regTheme.bg;
      else if (status === 'unscheduled') bg = unschedTheme.bg;
      else if (status === 'absent') bg = absentTheme.bg;
      else if (status === 'upcoming') bg = upcomingTheme.bg;

      return {
        ...e,
        display: 'background',
        backgroundColor: bg
      };
    }
    return e;
  });

  const handleSelectDate = (dateStr) => {
    setSelectedDate(dateStr);
    if (calendarRef.current) {
      calendarRef.current.getApi().gotoDate(dateStr);
    }
  };

  const handleMiniCalendarViewChange = (newDate) => {
    if (calendarRef.current) {
      calendarRef.current.getApi().gotoDate(newDate);
    }
  };

  const handleEventDrop = useCallback(async (info) => {
    const { event, oldEvent } = info;
    const isTask = event.extendedProps?.isTask;

    if (isTask) {
      const taskData = event.extendedProps.taskData;
      const taskId = taskData.task_id;

      const diffTime = event.start.getTime() - oldEvent.start.getTime();

      const oldStart = new Date(taskData.start_time || taskData.due_date);
      const oldEnd = new Date(taskData.due_date);

      const newStartObj = new Date(oldStart.getTime() + diffTime);
      const newEndObj = new Date(oldEnd.getTime() + diffTime);

      const newStart = newStartObj.toISOString();
      const newEnd = newEndObj.toISOString();

      try {
        await apiFetch(`/task/${taskId}`, {
          method: 'PUT',
          body: JSON.stringify({
            start_time: newStart,
            due_date: newEnd
          })
        });

        setRawTasks(prev => prev.map(t =>
          t.task_id.toString() === taskId.toString()
            ? { ...t, start_time: newStart, due_date: newEnd }
            : t
        ));
      } catch (error) {
        console.error('Error updating task date:', error);
        info.revert();
      }
    }
  }, []);

  const handleDateClick = useCallback((info) => {
    const clickedDate = info.dateStr;
    const isWorkDay = workDays.includes(clickedDate);
    
    const shift = workingHours.find(h => getLocalYYYYMMDD(h.start) === clickedDate);
    const report = reports.find(r => getLocalYYYYMMDD(r.working_date) === clickedDate);
    
    const dayTasks = tasks.filter(t => {
      const taskStartDate = getLocalYYYYMMDD(t.start) || getLocalYYYYMMDD(t.end);
      const taskDueDate = getLocalYYYYMMDD(t.end);
      return taskStartDate && taskDueDate && 
             clickedDate >= taskStartDate && 
             clickedDate <= taskDueDate;
    });

    setMenuConfig({ 
      date: clickedDate, 
      isWorkDay,
      shift,
      report,
      tasks: dayTasks.map(t => t.extendedProps.taskData)
    });
    handleSelectDate(clickedDate);
  }, [workDays, workingHours, tasks, reports]);

  const handleEventClick = useCallback((event) => {
    const isTask = event.extendedProps?.isTask;
    const taskData = event.extendedProps?.taskData;

    if (isTask && taskData?.task_id) {
      navigate(`/tasks/${taskData.task_id}`, { state: { task: taskData } });
      return;
    }

    const dateStr = getLocalYYYYMMDD(event.start);
    if (dateStr) {
      handleDateClick({ dateStr });
    }
  }, [navigate, handleDateClick]);

  const handleDatesSet = useCallback((info) => {
    const midPoint = new Date(info.view.currentStart.getTime() + 15 * 24 * 60 * 60 * 1000);
    const localDateStr = midPoint.toLocaleDateString('sv-SE');
    const [localYear, localMonth] = localDateStr.split('-').map(Number);
    const lang = i18n.language;
    const key = `${localYear}-${localMonth}-${lang}`;

    if (fetchedKeysRef.current.has(key)) return;
    fetchedKeysRef.current.add(key);

    setViewDate(new Date(localYear, localMonth - 1, 1));
    fetchData(localYear, localMonth);
  }, [i18n.language, fetchData]);

  return {
    t,
    theme,
    regTheme,
    unschedTheme,
    absentTheme,
    upcomingTheme,
    todayStr,
    selectedDate,
    viewDate,
    calendarRef,
    workDays,
    dayStatusMap,
    displayEvents,
    menuConfig,
    setMenuConfig,
    handleSelectDate,
    handleMiniCalendarViewChange,
    handleEventDrop,
    handleDateClick,
    handleEventClick,
    handleDatesSet,
  };
}
