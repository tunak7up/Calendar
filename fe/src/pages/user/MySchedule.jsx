import React, { useState, useRef, useCallback, useEffect } from 'react';
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
import {
  BriefcaseIcon,
  UserMinusIcon,
  PlusCircleIcon,
  XMarkIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const getTaskColor = (status) => {
  const s = status?.toLowerCase();
  if (s === 'overdue') {
    return { bg: '#ef4444', border: '#b91c1c', text: '#ffffff' }; // red
  }
  if (s === 'in progress') {
    return { bg: '#3b82f6', border: '#1d4ed8', text: '#ffffff' }; // blue
  }
  if (s === 'completed') {
    return { bg: '#10b981', border: '#047857', text: '#ffffff' }; // green
  }
  // Default/pending
  return { bg: '#9ca3af', border: '#4b5563', text: '#ffffff' }; // grey
};

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
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewDate, setViewDate] = useState(today);
  const calendarRef = useRef(null);
  const lastFetchedRangeRef = useRef({ start: '', end: '', lang: '' });

  const [workingHours, setWorkingHours] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [menuConfig, setMenuConfig] = useState(null); // { date, isWorkDay, shift, tasks }
  const [modalStatusFilter, setModalStatusFilter] = useState('all');

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
        const mappedTasks = taskRes.data.map(task => {
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
        setTasks(mappedTasks);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [user, t]);

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

      const updatedTaskData = { ...taskData, start_time: newStart, due_date: newEnd };

      try {
        await apiFetch(`/task/${taskId}`, {
          method: 'PUT',
          body: JSON.stringify({
            start_time: newStart,
            due_date: newEnd
          })
        });

        setTasks(prev => prev.map(t =>
          t.id === event.id
            ? {
              ...t,
              start: newStart,
              end: newEnd,
              extendedProps: { ...t.extendedProps, taskData: updatedTaskData }
            }
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
    
    setModalStatusFilter('all');
    handleSelectDate(clickedDate);
  }, [workDays, workingHours, tasks]);

  const filteredModalTasks = React.useMemo(() => {
    if (!menuConfig) return [];
    let list = menuConfig.tasks;
    if (modalStatusFilter !== 'all') {
      list = menuConfig.tasks.filter(t => {
        const s = t.status?.toLowerCase();
        if (modalStatusFilter === 'pending') {
          return s === 'pending' || s === 'overdue';
        }
        return s === modalStatusFilter.toLowerCase();
      });
    }
    return [...list].sort((a, b) => {
      const getStatusOrder = (status) => {
        const s = status?.toLowerCase();
        if (s === 'overdue') return 1;
        if (s === 'in progress') return 2;
        if (s === 'pending') return 3;
        if (s === 'completed') return 4;
        return 5;
      };
      return getStatusOrder(a.status) - getStatusOrder(b.status);
    });
  }, [menuConfig, modalStatusFilter]);


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
      {menuConfig && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t('myschedule.details_for', { date: menuConfig.date })}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{t('myschedule.details_subtitle')}</p>
              </div>
              <button 
                onClick={() => setMenuConfig(null)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Work Shift Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('myschedule.work_shift')}</h4>
                  {!menuConfig.isWorkDay ? (
                    <button
                      onClick={() => navigate('/register/work', { state: { date: menuConfig.date } })}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-md transition-colors"
                    >
                      {t('myschedule.register_now')}
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/register/leave', { state: { date: menuConfig.date } })}
                      className="text-[10px] font-bold text-red-600 hover:text-red-700 bg-red-50 px-2 py-1 rounded-md transition-colors"
                    >
                      {t('myschedule.request_leave')}
                    </button>
                  )}
                </div>
                {menuConfig.isWorkDay ? (
                  <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                      <BriefcaseIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-emerald-900">{t('myschedule.active_work_day')}</div>
                      <div className="text-xs text-emerald-600">
                      {menuConfig.shift ? `${formatTime(menuConfig.shift.start)} - ${formatTime(menuConfig.shift.end)}` : t('myschedule.standard_shift')}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                      <UserMinusIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-600">{t('myschedule.no_shift')}</div>
                      <div className="text-xs text-gray-400">{t('myschedule.no_shift_subtitle')}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tasks Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('myschedule.tasks', { count: filteredModalTasks.length })}</h4>
                  <div className="flex items-center gap-2">
                    <select 
                      value={modalStatusFilter}
                      onChange={(e) => setModalStatusFilter(e.target.value)}
                      className="text-[10px] font-bold text-gray-600 bg-white border border-gray-200 rounded-md px-2 py-1 outline-none cursor-pointer hover:border-blue-300 transition-colors"
                    >
                      <option value="all">{t('myschedule.all')}</option>
                      <option value="pending">{t('myschedule.pending')}</option>
                      <option value="in progress">{t('myschedule.in_progress')}</option>
                      <option value="completed">{t('myschedule.completed')}</option>
                    </select>
                    <button
                      onClick={() => navigate('/tasks/add', { state: { date: menuConfig.date } })}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                    >
                      <PlusCircleIcon className="w-3 h-3" /> {t('myschedule.add')}
                    </button>
                  </div>
                </div>
                
                {filteredModalTasks.length > 0 ? (
                  <div className="space-y-2">
                    {filteredModalTasks.map((task) => {
                      const colorSet = getTaskColor(task.status);
                      return (
                        <div 
                          key={task.task_id}
                          onClick={() => {
                            navigate(`/tasks/${task.task_id}`, { state: { task } });
                            setMenuConfig(null);
                          }}
                          className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-2 h-8 rounded-full" 
                              style={{ backgroundColor: colorSet.bg }}
                            />
                            <div>
                              <div className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate max-w-[200px] sm:max-w-[360px]" title={task.name}>{task.name}</div>
                              <div className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">
                                {task.status === 'completed' ? t('myschedule.completed') : 
                                 task.status === 'in progress' ? t('myschedule.in_progress') : 
                                 task.status === 'overdue' ? t('status.overdue') : 
                                 t('myschedule.pending')} • {task.priority === 'High' ? t('dashboard.priority_high') : task.priority === 'Medium' ? t('dashboard.priority_medium') : t('dashboard.priority_low')}
                              </div>
                            </div>
                          </div>
                          <EyeIcon className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-xs text-gray-400">{t('myschedule.no_tasks')}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 bg-gray-50/50 border-t border-gray-100 text-center">
              <button 
                onClick={() => setMenuConfig(null)}
                className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                {t('myschedule.close')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
