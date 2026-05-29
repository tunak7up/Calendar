import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { UsersIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import viLocale from '@fullcalendar/core/locales/vi';

const PLUGINS = [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin];
const LOCALES = [viLocale];
const VIEWS = {
  dayGridMonth: { displayEventTime: false },
  timeGridWeek: { displayEventTime: false },
};

const ScheduleCalendar = React.forwardRef(({
  initialDate,
  events,
  selectedDate,
  onDateClick,
  onEventClick,
  onDatesSet
}, ref) => {
  const { i18n } = useTranslation();

  return (
    <div className="bg-white shadow-xl shadow-blue-900/5 border border-gray-100 rounded-2xl sm:rounded-3xl p-3 sm:p-6 transition-all">
      <FullCalendar
        ref={ref}
        plugins={PLUGINS}
        initialView="dayGridMonth"
        initialDate={initialDate}
        locales={LOCALES}
        locale={i18n.language === 'vi' ? 'vi' : 'en'}
        firstDay={0}
        views={VIEWS}
        events={events}
        height="auto"
        dayMaxEvents={true}
        dateClick={onDateClick}
        eventClick={(info) => {
          if (onEventClick) {
            onEventClick(info.event);
          }
        }}
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
          const isGroupSummary = arg.event.extendedProps.isGroupSummary;

          if (isGroupSummary) {
            const groupType = arg.event.extendedProps.groupType;
            return (
              <div
                className="flex items-center gap-1.5 truncate px-2.5 py-1 rounded-lg text-[0.7rem] font-medium border-l-4 w-full shadow-sm cursor-pointer select-none transition-all hover:brightness-95 active:scale-95"
                style={{
                  backgroundColor: arg.event.backgroundColor,
                  color: arg.event.textColor,
                  borderColor: arg.event.borderColor,
                }}
                title={arg.event.title}
              >
                {groupType === 'registered' ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                )}
                <span className="truncate">{arg.event.title}</span>
              </div>
            );
          }

          if (isSummary) {
            return (
              <div className="flex items-center justify-center gap-1.5 py-1 px-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 text-[10px] font-medium shadow-sm">
                <UsersIcon className="w-3 h-3" />
                <span>{arg.event.extendedProps.count}</span>
              </div>
            );
          }
          return (
            <div
              className="truncate px-2 py-1 rounded-md text-[0.7rem] font-medium border-l-4 w-full cursor-pointer"
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
