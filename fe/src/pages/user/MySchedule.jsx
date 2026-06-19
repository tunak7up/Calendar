import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import viLocale from '@fullcalendar/core/locales/vi';
import { useNavigate } from 'react-router-dom';
import MiniCalendar from '../../components/MiniCalendar';
import { scheduleService } from '../../services/scheduleService';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';
import { taskService } from '../../services/taskService';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import DateDetailsModal from '../../components/DateDetailsModal';

// Dynamic getTaskColor is defined inside MySchedule component now.

// Parse datetime string từ BE (luôn là giờ VN nhưng không có timezone suffix)
// Tránh browser hiểu nhầm là UTC → thêm +07:00 nếu chưa có
const parseVNTime = (str) => {
  if (!str) return null;
  if (str.includes('+') || str.includes('Z')) return new Date(str);
  // Chuẩn hóa separator về T rồi gắn +07:00
  return new Date(str.replace(' ', 'T') + '+07:00');
};

const getLocalYYYYMMDD = (val) => {
  if (!val) return '';
  const d = val instanceof Date ? val : parseVNTime(val);
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatTime = (str) => {
  const d = parseVNTime(str);
  if (!d) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function MySchedule() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();

  const getTaskColor = useCallback((status) => {
    const s = status?.toLowerCase();
    let themeKey = 'TaskStatus-Pending';
    let defaultColors = { bg: '#9ca3af', text: '#ffffff' };

    if (s === 'overdue') {
      themeKey = 'TaskStatus-Overdue';
      defaultColors = { bg: '#ef4444', text: '#ffffff' };
    } else if (s === 'in progress') {
      themeKey = 'TaskStatus-InProgress';
      defaultColors = { bg: '#3b82f6', text: '#ffffff' };
    } else if (s === 'completed') {
      themeKey = 'TaskStatus-Completed';
      defaultColors = { bg: '#10b981', text: '#ffffff' };
    }

    const customColors = theme?.[`[data-custom-component="${themeKey}"]`];
    const bg = customColors?.bg || defaultColors.bg;
    const text = customColors?.text || defaultColors.text;

    return {
      bg,
      border: bg,
      text
    };
  }, [theme]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewDate, setViewDate] = useState(today);
  const calendarRef = useRef(null);
  const lastFetchedRangeRef = useRef({ start: '', end: '', lang: '' });

  const [workingHours, setWorkingHours] = useState([]);
  const [rawTasks, setRawTasks] = useState([]);
  const [menuConfig, setMenuConfig] = useState(null); // { date, isWorkDay, shift, tasks }

  const fetchData = useCallback(async (start, end) => {
    if (!user?.person_id) return;
    try {
      // Use Promise.all to fetch both schedules and tasks
      // For now, taskService doesn't have range filter, we keep it as is or add it later if needed
      // But scheduleService definitely uses the range
      const [scheduleRes, taskRes] = await Promise.all([
        scheduleService.getScheduleByPersonIdWithTimeRange({
          personId: user.person_id,
          startTime: start,
          endTime: end
        }),
        taskService.getAllTasksByParticipantId(user.person_id)
      ]);

      if (scheduleRes.success) {
        const mappedWorkingHours = scheduleRes.data.map(item => ({
          id: `work_${item.schedule_id}`,
          title: t('myschedule.work_title'),
          start: item.start_time,
          end: item.end_time,
          priorityOrder: 6,
          extendedProps: { isWorkHour: true, priorityOrder: 6 }
        }));
        setWorkingHours(mappedWorkingHours);
      }

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

  // Initial fetch is now handled by datesSet
  useEffect(() => {
    // If we need any global initialization, do it here
  }, [user]);

  const workDays = workingHours.map(e => {
    const d = parseVNTime(e.start);
    if (!d) return e.start?.split?.(/[T ]/)?.[0] || '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });

  const displayEvents = [...workingHours, ...tasks].map(e => {
    if (e.extendedProps?.isWorkHour) {
      return {
        ...e,
        display: 'background',
        backgroundColor: '#bae6fd' // Match sky-200 from fc-work-day
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
    
    // Find shift for this date
    const shift = workingHours.find(h => {
      const d = parseVNTime(h.start);
      if (!d) return false;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}` === clickedDate;
    });
    
    // Find tasks where clickedDate is between start_time and due_date
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
      tasks: dayTasks.map(t => t.extendedProps.taskData)
    });
    handleSelectDate(clickedDate);
  }, [workDays, workingHours, tasks]);



  if (!theme) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col lg:flex-row gap-5 lg:gap-8">

        {/* Main Calendar Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-white shadow-xl shadow-blue-900/5 border border-gray-100 rounded-3xl p-6 transition-all">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              initialDate={todayStr}
              locales={[viLocale]}
              locale={i18n.language === 'vi' ? 'vi' : 'en'}
              headerToolbar={{
                left: 'today prev,next title',
                right: ''
              }}
              views={{
                dayGridMonth: { displayEventTime: false },
              }}
              events={displayEvents}
              eventOrder="priorityOrder"
              eventOrderStrict={true}
              editable={true}
              droppable={true}
              height="auto"
              dayMaxEvents={true}
              eventDrop={handleEventDrop}
              dateClick={handleDateClick}
              datesSet={(info) => {
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
              eventClick={(info) => {
                const dateStr = getLocalYYYYMMDD(info.event.start);
                if (dateStr) {
                  handleDateClick({ dateStr });
                }
              }}
              dayCellClassNames={(arg) => {
                const cellDate = arg.date;
                const y = cellDate.getFullYear();
                const m = String(cellDate.getMonth() + 1).padStart(2, '0');
                const d = String(cellDate.getDate()).padStart(2, '0');
                const dateStr = `${y}-${m}-${d}`;

                const classes = [];
                if (dateStr === selectedDate) classes.push('fc-selected-day');

                if (workDays.includes(dateStr) && arg.view.type === 'dayGridMonth') {
                  classes.push('fc-work-day');
                }

                return classes;
              }}
              eventContent={(arg) => {
                if (arg.event.extendedProps?.isWorkHour) return null;
                return (
                  <div
                    className="truncate px-2 py-1 rounded-md text-[0.7rem] font-bold border-l-4"
                    style={{
                      backgroundColor: arg.event.backgroundColor,
                      color: arg.event.textColor,
                      borderColor: arg.event.borderColor,
                    }}
                  >
                    {arg.view.type.startsWith('list') && arg.timeText && (
                      <span className="mr-1 opacity-75">{arg.timeText}</span>
                    )}
                    <span>{arg.event.title}</span>
                  </div>
                );
              }}
            />
          </div>
        </div>

        {/* Right Panel — Mini Calendar: sidebar on desktop, compact strip on mobile */}
        <div className="lg:w-64 lg:shrink-0 bg-white p-4 lg:p-6 rounded-2xl lg:rounded-3xl border border-gray-100 shadow-sm lg:h-fit lg:sticky lg:top-[100px]">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 lg:mb-6">{t('myschedule.nav_view')}</h3>
          {/* Mobile: show mini calendar in a compact grid layout */}
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

      {/* Date Options Modal */}
      <DateDetailsModal 
        menuConfig={menuConfig}
        onClose={() => setMenuConfig(null)}
      />

    </div>
  );
}
