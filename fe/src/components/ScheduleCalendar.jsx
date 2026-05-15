import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { UsersIcon } from '@heroicons/react/24/outline';

const ScheduleCalendar = React.forwardRef(({
  initialDate,
  events,
  selectedDate,
  onDateClick,
  onDatesSet
}, ref) => {
  return (
    <div className="bg-white shadow-xl shadow-blue-900/5 border border-gray-100 rounded-2xl sm:rounded-3xl p-3 sm:p-6 transition-all">
      <FullCalendar
        ref={ref}
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        initialDate={initialDate}
        views={{
          dayGridMonth: { displayEventTime: false },
          timeGridWeek: { displayEventTime: false },
        }}
        events={events}
        height="auto"
        dayMaxEvents={true}
        dateClick={onDateClick}
        datesSet={onDatesSet}
        dayCellClassNames={(arg) => {
          const cellDate = arg.date;
          const y = cellDate.getFullYear();
          const m = String(cellDate.getMonth() + 1).padStart(2, '0');
          const d = String(cellDate.getDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${d}`;

          const classes = [];
          if (dateStr === selectedDate) classes.push('fc-selected-day');

          return classes;
        }}
        eventContent={(arg) => {
          const isSummary = arg.event.extendedProps.isSummary;
          if (isSummary) {
            return (
              <div className="flex items-center justify-center gap-1.5 py-1 px-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 text-[10px] font-black shadow-sm">
                <UsersIcon className="w-3 h-3" />
                <span>{arg.event.extendedProps.count}</span>
              </div>
            );
          }
          return (
            <div
              className="truncate px-2 py-1 rounded-md text-[0.7rem] font-bold border-l-4 w-full"
              style={{
                backgroundColor: arg.event.backgroundColor,
                color: arg.event.textColor,
                borderColor: arg.event.borderColor,
              }}
              title={arg.event.title}
            >
              {arg.event.title}
            </div>
          );
        }}
      />
    </div>
  );
});

export default ScheduleCalendar;
