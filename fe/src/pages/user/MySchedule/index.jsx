import React from 'react';
import DateDetailsModal from '../../../components/DateDetailsModal';
import ScheduleCalendar from '../../../components/ScheduleCalendar';
import { useMySchedule } from './hooks/useMySchedule';
import ScheduleLegend from './components/ScheduleLegend';
import ScheduleSidebar from './components/ScheduleSidebar';

export default function MySchedule() {
  const {
    theme,
    regTheme,
    unschedTheme,
    absentTheme,
    upcomingTheme,
    todayStr,
    selectedDate,
    viewDate,
    calendarRef,
    workDays,
    dayStatusMap,
    displayEvents,
    menuConfig,
    setMenuConfig,
    handleSelectDate,
    handleMiniCalendarViewChange,
    handleEventDrop,
    handleDateClick,
    handleEventClick,
    handleDatesSet,
  } = useMySchedule();

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
      <ScheduleLegend
        regTheme={regTheme}
        unschedTheme={unschedTheme}
        absentTheme={absentTheme}
        upcomingTheme={upcomingTheme}
      />

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
            onDatesSet={handleDatesSet}
          />
        </div>

        {/* Right Panel — Mini Calendar Sidebar */}
        <ScheduleSidebar
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          workDays={workDays}
          viewDate={viewDate}
          onViewChange={handleMiniCalendarViewChange}
        />
      </div>

      <DateDetailsModal
        menuConfig={menuConfig}
        onClose={() => setMenuConfig(null)}
      />
    </div>
  );
}
