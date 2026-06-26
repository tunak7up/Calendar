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

  const fetchData = useCallback(async (start, end) => {
    if (!user?.person_id) return;
    try {
      const [scheduleRes, taskRes, reportRes] = await Promise.all([
        scheduleService.getScheduleByPersonIdWithTimeRange({
          personId: user.person_id,
          startTime: start,
          endTime: end
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
        const repDate = rep.working_date.split('T')[0];
        const hasSchedule = registeredWorkHours.some(wh => {
          const d = parseVNTime(wh.start);
          if (!d) return wh.start?.split?.(/[T ]/)?.[0] === repDate;
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}` === repDate;
        });

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
    const registeredDays = workingHours.map(e => {
      const d = parseVNTime(e.start);
      if (!d) return e.start?.split?.(/[T ]/)?.[0] || '';
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }).filter(Boolean);

    const reportDays = reports.map(r => r.working_date.split('T')[0]);
    return Array.from(new Set([...registeredDays, ...reportDays]));
  }, [workingHours, reports]);

  const dayStatusMap = useMemo(() => {
    const map = {};
    const todayStr = new Date().toISOString().split('T')[0];

    // Compute status for all working hours (schedules)
    workingHours.forEach(wh => {
      if (wh.extendedProps?.isWorkHour) {
        const d = parseVNTime(wh.start);
        const dateStr = d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : wh.start?.split?.(/[T ]/)?.[0];
        if (dateStr) {
          const isRegistered = wh.extendedProps.isRegistered;
          const rep = reports.find(r => r.working_date.split('T')[0] === dateStr);
          
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
      const dateStr = rep.working_date.split('T')[0];
      if (!map[dateStr]) {
        map[dateStr] = 'unscheduled'; // Yellow
      }
    });

    return map;
  }, [workingHours, reports]);

  const displayEvents = [...workingHours, ...tasks].map(e => {
    if (e.extendedProps?.isWorkHour) {
      const d = parseVNTime(e.start);
      const dateStr = d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : e.start?.split?.(/[T ]/)?.[0];
      const status = dayStatusMap[dateStr];
      let bg = '#bae6fd'; // Default Blue/Sky
      if (status === 'scheduled') bg = '#bae6fd';
      else if (status === 'unscheduled') bg = '#fef08a';
      else if (status === 'absent') bg = '#fecaca';
      else if (status === 'upcoming') bg = '#e0f2fe';

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
    
    const shift = workingHours.find(h => {
      const d = parseVNTime(h.start);
      if (!d) return false;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}` === clickedDate;
    });

    const report = reports.find(r => {
      const dateStr = r.working_date.split('T')[0];
      return dateStr === clickedDate;
    });
    
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
            <div className="w-4 h-4 rounded bg-[#bae6fd] border border-blue-200"></div>
            <span className="text-xs font-semibold text-gray-600">{t('myschedule.legend_scheduled')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#fef08a] border border-yellow-200"></div>
            <span className="text-xs font-semibold text-gray-600">{t('myschedule.legend_unscheduled')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#fecaca] border border-red-200"></div>
            <span className="text-xs font-semibold text-gray-600">{t('myschedule.legend_absent')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#f1f5f9] border border-gray-300"></div>
            <span className="text-xs font-semibold text-gray-600">{t('myschedule.legend_upcoming')}</span>
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
              const startStr = info.startStr.split('T')[0];
              const endStr = info.endStr.split('T')[0];
              const lang = i18n.language;
              if (
                lastFetchedRangeRef.current.start === startStr &&
                lastFetchedRangeRef.current.end === endStr &&
                lastFetchedRangeRef.current.lang === lang
              ) {
                return;
              }
              lastFetchedRangeRef.current = { start: startStr, end: endStr, lang };
              setViewDate(info.view.currentStart);
              fetchData(info.startStr, info.endStr);
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
