import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { useState, useRef, useCallback } from 'react';
import MiniCalendar from '../components/MiniCalendar';

const fakeEvents = [
  // Single-day timed events
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

  // Multi-day all-day events (end is exclusive = last day + 1)
  {
    title: '1pm Project Deadline',
    start: '2026-04-05',
    end: '2026-04-08', // spans Apr 5 → Apr 7
    backgroundColor: '#e0e7ff',
    borderColor: '#c7d2fe',
    textColor: '#3730a3'
  },
  {
    title: '11:30am Design Review',
    start: '2026-04-14',
    end: '2026-04-16', // spans Apr 14 → Apr 15
    backgroundColor: '#f3e8ff',
    borderColor: '#e9d5ff',
    textColor: '#6b21a8'
  },
  {
    title: 'Product Launch',
    start: '2026-04-18',
    end: '2026-04-21', // spans Apr 18 → Apr 20
    backgroundColor: '#fae8ff',
    borderColor: '#f5d0fe',
    textColor: '#86198f'
  },
  {
    title: 'Marketing Strategy Sprint',
    start: '2026-04-23',
    end: '2026-04-26', // spans Apr 23 → Apr 25
    backgroundColor: '#ccfbf1',
    borderColor: '#99f6e4',
    textColor: '#115e59'
  },
  {
    title: 'Annual Shareholders',
    start: '2026-05-01',
    end: '2026-05-03', // spans May 1 → May 2
    backgroundColor: '#e0f2fe',
    borderColor: '#bae6fd',
    textColor: '#075985'
  }
];

const getFullDateStr = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayOfMonth}`;
};

const generateWeek = (dateObj) => {
  const dates = [];
  const date = new Date(dateObj.getTime());
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(date.setDate(diff));

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek.getTime());
    d.setDate(startOfWeek.getDate() + i);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const dateNum = d.getDate().toString();
    const fullDate = getFullDateStr(d);
    dates.push({ day: dayName, date: dateNum, fullDate, dateObj: d });
  }
  return dates;
};

export default function MySchedule() {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const calendarRef = useRef(null);

  const [events, setEvents] = useState(fakeEvents);

  const handleSelectDate = (dateStr) => {
    setSelectedDate(dateStr);
    // Navigate FullCalendar to the selected date
    if (calendarRef.current) {
      calendarRef.current.getApi().gotoDate(dateStr);
    }
  };

  // Drag & drop: update event start date
  const handleEventDrop = useCallback((info) => {
    const { event } = info;
    setEvents(prev => prev.map(e =>
      e.title === event.title
        ? { ...e, start: event.startStr, end: event.endStr || undefined }
        : e
    ));
  }, []);

  // Click on any day cell to "add task"
  const handleDateClick = useCallback((info) => {
    alert(`Đã chọn ngày: ${info.dateStr}\nChức năng tạo task sẽ được mở tại đây.`);
  }, []);

  return (
    <div className="flex-1 p-8 pt-[80px] bg-white min-h-screen">
      <div className="max-w-7xl mx-auto flex gap-8">

        {/* Main Calendar Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-white">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              initialDate="2026-04-01"
              headerToolbar={{
                left: 'today prev,next title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
              }}
              events={events}
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
                return `${y}-${m}-${d}` === selectedDate ? ['fc-selected-day'] : [];
              }}
              eventContent={(arg) => (
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
              )}
            />
          </div>
        </div>

        {/* Right Panel — Mini Calendar */}
        <div className="w-64 shrink-0 border-l border-gray-100 pl-6 pt-2">
          <MiniCalendar
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
          />
        </div>

      </div>
    </div>
  );
}
