import React, { useState, useRef, useCallback, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { useNavigate } from 'react-router-dom';
import MiniCalendar from '../components/MiniCalendar';
import { scheduleService } from '../services/scheduleService';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { 
  BriefcaseIcon, 
  UserMinusIcon, 
  PlusCircleIcon, 
  XMarkIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const TASK_COLORS = [
  { bg: '#f3e8ff', border: '#d8b4fe', text: '#6b21a8' }, // purple
  { bg: '#e0f2fe', border: '#bae6fd', text: '#075985' }, // blue
  { bg: '#dcfce7', border: '#bbf7d0', text: '#166534' }, // green
  { bg: '#ffedd5', border: '#fed7aa', text: '#9a3412' }, // orange
  { bg: '#fee2e2', border: '#fecaca', text: '#991b1b' }, // red
  { bg: '#fef9c3', border: '#fef08a', text: '#854d0e' }, // yellow
  { bg: '#ecfeff', border: '#cffafe', text: '#083344' }, // cyan
];

export default function MySchedule() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewDate, setViewDate] = useState(today);
  const calendarRef = useRef(null);

  const [workingHours, setWorkingHours] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [menuConfig, setMenuConfig] = useState(null); // { date, isWorkDay }
  const [taskMenuConfig, setTaskMenuConfig] = useState(null); // { taskData, eventId }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scheduleRes, taskRes] = await Promise.all([
          scheduleService.getPersonSchedule(user.person_id),
          apiFetch(`/task/participant/${user.person_id}`)
        ]);
        
        if (scheduleRes.success) {
          const mappedWorkingHours = scheduleRes.data.map(item => ({
            id: `work_${item.schedule_id}`,
            title: 'Lịch làm việc',
            start: item.start_time,
            end: item.end_time,
            extendedProps: { isWorkHour: true }
          }));
          setWorkingHours(mappedWorkingHours);
        }

        if (taskRes.success) {
          const mappedTasks = taskRes.data.map(task => {
            const colorSet = TASK_COLORS[task.task_id % TASK_COLORS.length];
            return {
              id: `task_${task.task_id}`,
              title: task.name || 'Untitled Task',
              start: task.start_time,
              end: task.due_date,
              allDay: false,
              backgroundColor: colorSet.bg,
              borderColor: colorSet.border,
              textColor: colorSet.text,
              extendedProps: { isTask: true, taskData: task }
            };
          });
          setTasks(mappedTasks);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (user?.person_id) fetchData();
  }, [user]);

  const workDays = workingHours.map(e => e.start.split(/[T ]/)[0]);

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
    const isWorkDay = workDays.includes(info.dateStr);
    setMenuConfig({ date: info.dateStr, isWorkDay });
  }, [workDays]);

  return (
    <div className="flex-1 p-8 pt-[80px] bg-[#f8fafc] min-h-screen relative">
      <div className="max-w-7xl mx-auto flex gap-8">
        
        {/* Main Calendar Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-white shadow-xl shadow-blue-900/5 border border-gray-100 rounded-3xl p-6 transition-all">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              initialDate={todayStr}
              headerToolbar={{
                left: 'today prev,next title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
              }}
              views={{
                dayGridMonth: { displayEventTime: false },
                timeGridWeek: { displayEventTime: false },
                timeGridDay: { displayEventTime: false }
              }}
              events={displayEvents}
              editable={true}
              droppable={true}
              height="auto"
              dayMaxEvents={true}
              eventDrop={handleEventDrop}
              dateClick={handleDateClick}
              datesSet={(info) => {
                setViewDate(info.view.currentStart);
              }}
              eventClick={(info) => {
                if (info.event.extendedProps?.isTask) {
                  setTaskMenuConfig({
                    taskData: info.event.extendedProps.taskData,
                    eventId: info.event.id
                  });
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

        {/* Right Panel — Mini Calendar */}
        <div className="w-64 shrink-0 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-fit sticky top-[100px]">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Navigational View</h3>
          <MiniCalendar
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            workDays={workDays}
            viewDate={viewDate}
            onViewChange={handleMiniCalendarViewChange}
          />
        </div>
      </div>

      {/* Date Options Modal */}
      {menuConfig && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Options for {menuConfig.date}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Choose an action to perform on this date</p>
              </div>
              <button 
                onClick={() => setMenuConfig(null)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 space-y-2">
              <button
                onClick={() => navigate('/tasks/add', { state: { date: menuConfig.date } })}
                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-blue-50 group transition-all text-left"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <PlusCircleIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">Create Task</div>
                  <div className="text-xs text-gray-400">Add a new task to your schedule</div>
                </div>
              </button>

              {!menuConfig.isWorkDay ? (
                <button
                  onClick={() => navigate('/register/work', { state: { date: menuConfig.date } })}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-green-50 group transition-all text-left"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all">
                    <BriefcaseIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Register Work</div>
                    <div className="text-xs text-gray-400">Schedule a work shift for this day</div>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => navigate('/register/leave', { state: { date: menuConfig.date } })}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-red-50 group transition-all text-left"
                >
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all">
                    <UserMinusIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Register Leave</div>
                    <div className="text-xs text-gray-400">Request time off for this work day</div>
                  </div>
                </button>
              )}
            </div>
            
            <div className="p-4 bg-gray-50/30 text-center">
              <button 
                onClick={() => setMenuConfig(null)}
                className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Options Modal */}
      {taskMenuConfig && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Task Options</h3>
                <p className="text-xs text-gray-400 mt-0.5">Manage task {taskMenuConfig.taskData.name || 'Untitled'}</p>
              </div>
              <button 
                onClick={() => setTaskMenuConfig(null)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 space-y-2">
              <button
                onClick={() => {
                  navigate(`/tasks/sub-add/${taskMenuConfig.taskData.task_id}`, { state: { parentTask: taskMenuConfig.taskData } });
                  setTaskMenuConfig(null);
                }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-purple-50 group transition-all text-left"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
                  <PlusCircleIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">Create Sub-task</div>
                  <div className="text-xs text-gray-400">Add a sub-task for this parent task</div>
                </div>
              </button>

              <button
                onClick={() => {
                  navigate(`/tasks/${taskMenuConfig.taskData.task_id}`, { state: { task: taskMenuConfig.taskData } });
                  setTaskMenuConfig(null);
                }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-blue-50 group transition-all text-left"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <EyeIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">View Task Details</div>
                  <div className="text-xs text-gray-400">See full information for this task</div>
                </div>
              </button>
            </div>
            
            <div className="p-4 bg-gray-50/30 text-center">
              <button 
                onClick={() => setTaskMenuConfig(null)}
                className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
