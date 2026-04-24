import React, { useState, useRef, useCallback, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import MiniCalendar from '../components/MiniCalendar';
import { scheduleService } from '../services/scheduleService';
import { 
  CalendarIcon, 
  BriefcaseIcon, 
  UserMinusIcon, 
  PlusCircleIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

const fakeEvents = [
  // ... (keeping fakeEvents as is)
  {
    title: 'Quarterly Budget Review',
    start: '2026-04-01T10:00:00',
    end: '2026-04-01T11:30:00',
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
    textColor: '#92400e'
  },
  {
    title: '9am Team Standup',
    start: '2026-04-08T09:00:00',
    end: '2026-04-08T10:00:00',
    backgroundColor: '#ffedd5',
    borderColor: '#fed7aa',
    textColor: '#9a3412'
  },
  {
    title: '10am Team Meeting',
    start: '2026-04-14T10:00:00',
    end: '2026-04-14T11:00:00',
    backgroundColor: '#e0f2fe',
    borderColor: '#bae6fd',
    textColor: '#075985'
  },
  {
    title: '12pm Lunch with Client',
    start: '2026-04-16T12:00:00',
    end: '2026-04-16T18:00:00',
    backgroundColor: '#dcfce7',
    borderColor: '#bbf7d0',
    textColor: '#166534'
  },
  {
    title: '2:30pm Sales Call',
    start: '2026-04-22T14:30:00',
    end: '2026-04-22T15:30:00',
    backgroundColor: '#ffe4e6',
    borderColor: '#fecdd3',
    textColor: '#9f1239'
  },
  {
    title: '1pm Project Deadline',
    start: '2026-04-05',
    end: '2026-04-08',
    backgroundColor: '#e0e7ff',
    borderColor: '#c7d2fe',
    textColor: '#3730a3'
  }
];

export default function MySchedule({ onNavigateWithDate }) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const calendarRef = useRef(null);

  const [events, setEvents] = useState(fakeEvents);
  const [workingHours, setWorkingHours] = useState([]);
  const [menuConfig, setMenuConfig] = useState(null); // { date, isWorkDay }

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const result = await scheduleService.getPersonSchedule(1);
        if (result.success) {
          const mappedWorkingHours = result.data.map(item => ({
            id: `work_${item.schedule_id}`,
            title: 'Lịch làm việc',
            start: item.start_time,
            end: item.end_time,
            extendedProps: { isWorkHour: true }
          }));
          setWorkingHours(mappedWorkingHours);
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
      }
    };

    fetchSchedule();
  }, []);

  const workDays = workingHours.map(e => e.start.split(/[T ]/)[0]);

  const displayEvents = [...events, ...workingHours].map(e => {
    if (e.extendedProps?.isWorkHour) {
      return {
        ...e,
        display: 'background',
        backgroundColor: 'rgba(59, 130, 246, 0.15)'
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

  const handleEventDrop = useCallback((info) => {
    const { event } = info;
    setEvents(prev => prev.map(e =>
      e.title === event.title
        ? { ...e, start: event.startStr, end: event.endStr || undefined }
        : e
    ));
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
              events={displayEvents}
              editable={true}
              droppable={true}
              height="auto"
              dayMaxEvents={true}
              eventDrop={handleEventDrop}
              dateClick={handleDateClick}
              dayCellClassNames={(arg) => {
                const cellDate = arg.date;
                const y = cellDate.getFullYear();
                const m = String(cellDate.getMonth() + 1).padStart(2, '0');
                const d = String(cellDate.getDate()).padStart(2, '0');
                const dateStr = `${y}-${m}-${d}`;
                
                const classes = [];
                if (dateStr === selectedDate) classes.push('fc-selected-day');
                if (workDays.includes(dateStr)) classes.push('fc-work-day');
                
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
                    {arg.event.title}
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
                onClick={() => onNavigateWithDate('task_add', menuConfig.date)}
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
                  onClick={() => onNavigateWithDate('work', menuConfig.date)}
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
                  onClick={() => onNavigateWithDate('leave', menuConfig.date)}
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
    </div>
  );
}
