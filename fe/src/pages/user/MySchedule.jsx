import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MiniCalendar from '../../components/MiniCalendar';
import DateDetailsModal from '../../components/DateDetailsModal';
import ScheduleCalendar from '../../components/ScheduleCalendar';
import { scheduleService } from '../../services/scheduleService';
import { dailyReportService } from '../../services/dailyReportService';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';
import { taskService } from '../../services/taskService';
import { useTheme, useTaskColor } from '../../context/ThemeContext';
import { parseVNTime, getLocalYYYYMMDD } from '../../utils/dateUtils';

export default function MySchedule() {
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
  const lastFetchedRangeRef = useRef({ start: '', end: '', lang: '' });

  const [workingHours, setWorkingHours] = useState([]);
  const [rawTasks, setRawTasks] = useState([]);
  const [reports, setReports] = useState([]);
  const [menuConfig, setMenuConfig] = useState(null); // { date, isWorkDay, shift, report, tasks }

  const fetchData = useCallback(async (viewStart) => {
    if (!user?.person_id || !viewStart) return;
    try {
      // Calculate 3-month window: 1st of previous month to last day of next month
      const y = viewStart.getFullYear();
      const m = viewStart.getMonth();
      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m + 2, 0, 23, 59, 59);

      const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-01T00:00:00`;
      const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}T23:59:59`;

      const [scheduleRes, taskRes, reportRes] = await Promise.all([
        scheduleService.getScheduleByPersonIdWithTimeRange({
          personId: user.person_id,
          startTime: startStr,
          endTime: endStr
        }),
        taskService.getAllTasksByParticipantId(user.person_id),
        dailyReportService.getDailyReportByPersonId(user.person_id)
      ]);

      let registeredWorkHours = [];
      if (scheduleRes.success) {
        registeredWorkHours = scheduleRes.data.map(item => ({
          id: `work_${item.schedule_id}`,
          title: t('myschedule.work_title'),
          start: item.start_time,
          end: item.end_time,
          priorityOrder: 6,
          extendedProps: { isWorkHour: true, priorityOrder: 6, isRegistered: true }
        }));
      }

      let fetchedReports = [];
      if (reportRes.success) {
        fetchedReports = reportRes.data;
        setReports(fetchedReports);
      }

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

      setWorkingHours([...registeredWorkHours, ...unregisteredWorkHours]);

      if (taskRes.success) {
        setRawTasks(taskRes.data);
      }
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
    const todayStr = getLocalYYYYMMDD(new Date());

    // Compute status for all working hours (schedules)
    workingHours.forEach(wh => {
      if (wh.extendedProps?.isWorkHour) {
        const dateStr = getLocalYYYYMMDD(wh.start);
        if (dateStr) {
          const isRegistered = wh.extendedProps.isRegistered;
          const rep = reports.find(r => getLocalYYYYMMDD(r.working_date) === dateStr);
          
          if (isRegistered) {
            if (rep) {
              map[dateStr] = 'scheduled'; // Went to work as scheduled (Blue)
            } else {
              // Registered but no report. If date is in the past, it's absent (Red).
              if (dateStr < todayStr) {
                map[dateStr] = 'absent'; // Absent (Red)
              } else {
                map[dateStr] = 'upcoming'; // Upcoming schedule
              }
            }
          } else {
            map[dateStr] = 'unscheduled'; // Went to work unscheduled (Yellow)
          }
        }
      }
    });

    // Also map any remaining daily reports that aren't mapped
    reports.forEach(rep => {
      const dateStr = getLocalYYYYMMDD(rep.working_date);
      if (dateStr && !map[dateStr]) {
        map[dateStr] = 'unscheduled'; // Yellow
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
    const dateStr = getLocalYYYYMMDD(event.start);
    if (dateStr) {
      handleDateClick({ dateStr });
    }
  }, [handleDateClick]);

  if (!theme) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Color Legend Section */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-x-6 gap-y-3 items-center">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('myschedule.legend_title') || 'Chú thích màu sắc'}:</h4>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border" data-custom-component="Schedule-User-Registered" style={{ backgroundColor: regTheme.bg, borderColor: regTheme.bg }}></div>
            <span className="text-xs font-semibold" style={{ color: regTheme.text }}>{t('myschedule.legend_scheduled')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border" data-custom-component="Schedule-User-Unscheduled" style={{ backgroundColor: unschedTheme.bg, borderColor: unschedTheme.bg }}></div>
            <span className="text-xs font-semibold" style={{ color: unschedTheme.text }}>{t('myschedule.legend_unscheduled')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border" data-custom-component="Schedule-User-Absent" style={{ backgroundColor: absentTheme.bg, borderColor: absentTheme.bg }}></div>
            <span className="text-xs font-semibold" style={{ color: absentTheme.text }}>{t('myschedule.legend_absent')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border" data-custom-component="Schedule-User-Upcoming" style={{ backgroundColor: upcomingTheme.bg, borderColor: upcomingTheme.bg }}></div>
            <span className="text-xs font-semibold" style={{ color: upcomingTheme.text }}>{t('myschedule.legend_upcoming')}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 lg:gap-8">

        {/* Main Calendar Area */}
        <div className="flex-1 min-w-0">
          <ScheduleCalendar
            ref={calendarRef}
            initialDate={todayStr}
            events={displayEvents}
            selectedDate={selectedDate}
            workDays={workDays}
            dayStatusMap={dayStatusMap}
            editable={true}
            droppable={true}
            onEventDrop={handleEventDrop}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
            onDatesSet={(info) => {
              const currentStart = info.view.currentStart;
              const y = currentStart.getFullYear();
              const m = currentStart.getMonth();
              const lang = i18n.language;
              const key = `${y}-${m}-${lang}`;

              if (lastFetchedRangeRef.current.key === key) {
                return;
              }
              lastFetchedRangeRef.current = { key };
              setViewDate(currentStart);
              fetchData(currentStart);
            }}
          />
        </div>

        {/* Right Panel — Mini Calendar */}
        <div className="lg:w-64 lg:shrink-0 bg-white p-4 lg:p-6 rounded-2xl lg:rounded-3xl border border-gray-100 shadow-sm lg:h-fit lg:sticky lg:top-[100px]">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 lg:mb-6">{t('myschedule.nav_view')}</h3>
          <div className="flex justify-center lg:block">
            <div className="w-full max-w-xs lg:max-w-none">
              <MiniCalendar
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
                workDays={workDays}
                viewDate={viewDate}
                onViewChange={handleMiniCalendarViewChange}
              />
            </div>
          </div>
        </div>
      </div>

      <DateDetailsModal 
        menuConfig={menuConfig}
        onClose={() => setMenuConfig(null)}
      />
    </div>
  );
}
