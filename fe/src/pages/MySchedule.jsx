import React, { useState, useRef, useCallback, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import MiniCalendar from '../components/MiniCalendar';

const fakeEvents = [
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

export default function MySchedule() {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const calendarRef = useRef(null);

  const [events, setEvents] = useState(fakeEvents);
  const [workingHours, setWorkingHours] = useState([]);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/schedule/person/1');
        const result = await response.json();
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
        backgroundColor: 'rgba(59, 130, 246, 0.2)'
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
    alert(`Đã chọn ngày: ${info.dateStr}\nChức năng tạo task sẽ được mở tại đây.`);
  }, []);

  return (
    <div className="flex-1 p-8 pt-[80px] bg-white min-h-screen">
      <div className="max-w-7xl mx-auto flex gap-8">
        
        {/* Main Calendar Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-white shadow-sm border border-gray-100 rounded-3xl p-6">
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
                if (arg.event.extendedProps?.isWorkHour) {
                  return null;
                }
                return (
                  <div
                    className="truncate"
                    style={{
                      backgroundColor: arg.event.backgroundColor,
                      color: arg.event.textColor,
                      borderLeft: `4px solid ${arg.event.borderColor}`,
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
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
        <div className="w-64 shrink-0 border-l border-gray-100 pl-6 pt-2">
          <MiniCalendar
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            workDays={workDays}
          />
        </div>

      </div>
    </div>
  );
}
