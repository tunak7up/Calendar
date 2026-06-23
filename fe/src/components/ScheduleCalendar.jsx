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
  workDays = [],
  editable = false,
  droppable = false,
  headerToolbar,
  views,
  onDateClick,
  onEventClick,
  onEventDrop,
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
        views={views || VIEWS}
        events={events}
        eventOrder="priorityOrder"
        eventOrderStrict={true}
        editable={editable}
        droppable={droppable}
        height="auto"
        dayMaxEvents={true}
        eventDrop={onEventDrop}
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

          if (workDays.includes(dateStr) && arg.view.type === 'dayGridMonth') {
            classes.push('fc-work-day');
          }

          return classes;
        }}
        eventContent={(arg) => {
          if (arg.event.extendedProps?.isWorkHour) return null;

          const isSummary = arg.event.extendedProps?.isSummary;
          const isGroupSummary = arg.event.extendedProps?.isGroupSummary;

          if (isGroupSummary) {
            const groupType = arg.event.extendedProps.groupType;
            const count = arg.event.extendedProps.count;
            const customComp = groupType === 'registered' ? 'Schedule-Admin-Registered' :
                               groupType === 'unscheduled' ? 'Schedule-Admin-Unscheduled' :
                               `CalendarCard-${groupType}`;
            return (
              <div
                className="flex items-center justify-center gap-1 truncate px-1 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[0.65rem] sm:text-[0.7rem] font-extrabold sm:font-medium border-2 w-full shadow-sm cursor-pointer select-none transition-all hover:brightness-95 active:scale-95"
                data-custom-component={customComp}
                style={{
                  backgroundColor: arg.event.backgroundColor,
                  color: arg.event.textColor,
                  borderColor: arg.event.borderColor,
                }}
                title={arg.event.title}
              >
                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full shrink-0" style={{ backgroundColor: arg.event.textColor }}></span>
                <span className="hidden sm:inline truncate">{arg.event.title}</span>
                <span className="inline sm:hidden">{count}</span>
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

          const customComp = arg.event.extendedProps?.customComponent || 'CalendarCard-Individual';
          const isTask = arg.event.extendedProps?.isTask;

          return (
            <div
              className={`truncate px-2 py-1 rounded-md text-[0.7rem] border-l-4 w-full cursor-pointer ${isTask ? 'font-bold' : 'font-medium'}`}
              data-custom-component={customComp}
              style={{
                backgroundColor: arg.event.backgroundColor,
                color: arg.event.textColor,
                borderColor: arg.event.borderColor,
              }}
              title={arg.event.title}
            >
              {arg.view.type?.startsWith('list') && arg.timeText && (
                <span className="mr-1 opacity-75">{arg.timeText}</span>
              )}
              <span>{arg.event.title}</span>
            </div>
          );
        }}
      />
    </div>
  );
});

ScheduleCalendar.displayName = 'ScheduleCalendar';

export default ScheduleCalendar;
