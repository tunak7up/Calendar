import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import MiniCalendar from '../components/MiniCalendar';
import { UsersIcon } from '@heroicons/react/24/outline';

const PERSON_COLORS = [
  { bg: '#dbeafe', border: '#bfdbfe', text: '#1e3a8a' }, // blue
  { bg: '#fce7f3', border: '#fbcfe8', text: '#831843' }, // pink
  { bg: '#dcfce7', border: '#bbf7d0', text: '#14532d' }, // green
  { bg: '#fefcbf', border: '#fef08a', text: '#713f12' }, // yellow
  { bg: '#f3e8ff', border: '#e9d5ff', text: '#581c87' }, // purple
  { bg: '#ffedd5', border: '#fed7aa', text: '#7c2d12' }, // orange
  { bg: '#e0e7ff', border: '#c7d2fe', text: '#312e81' }, // indigo
];

export default function AdminSchedule() {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewDate, setViewDate] = useState(today);
  const calendarRef = useRef(null);

  const [schedules, setSchedules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');

  useEffect(() => {
    // Fetch Employees for Filter
    fetch('http://localhost:3000/api/person')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEmployees(data.data);
        }
      });

    // Fetch All Schedules
    fetch('http://localhost:3000/api/schedule')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const mappedSchedules = data.data.map(item => {
            const colorSet = PERSON_COLORS[item.person_id % PERSON_COLORS.length];
            return {
              id: `sched_${item.schedule_id}`,
              title: `${item.person?.username || 'Unknown'}`,
              start: item.working_date,
              allDay: true,
              person_id: item.person_id,
              backgroundColor: colorSet.bg,
              borderColor: colorSet.border,
              textColor: colorSet.text,
              extendedProps: { ...item }
            };
          });
          setSchedules(mappedSchedules);
        }
      });
  }, []);

  // Collect all dates that have at least one schedule
  const scheduleDays = [...new Set(schedules.map(s => s.start?.split?.(/[T ]/)?.[0]).filter(Boolean))];

  const displayEvents = selectedEmployeeId === 'all' 
    ? schedules 
    : schedules.filter(s => s.person_id.toString() === selectedEmployeeId);

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

  return (
    <div className="flex-1 p-8 pt-[80px] bg-[#f8fafc] min-h-screen relative">
      <div className="max-w-7xl mx-auto flex gap-8">

        {/* Main Calendar Area */}
        <div className="flex-1 min-w-0">
          {/* Header with title and employee filter */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Company Schedule</h1>
              <p className="text-gray-500 mt-1">Overview of all employee work shifts</p>
            </div>
            
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
              <UsersIcon className="w-5 h-5 text-gray-400" />
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="border-none bg-transparent font-bold text-gray-700 outline-none focus:ring-0 cursor-pointer"
              >
                <option value="all">All Employees</option>
                {employees.map(emp => (
                  <option key={emp.person_id} value={emp.person_id}>{emp.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white shadow-xl shadow-blue-900/5 border border-gray-100 rounded-3xl p-6 transition-all">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              initialDate={todayStr}
              headerToolbar={{
                left: 'today prev,next title',
                right: 'dayGridMonth,timeGridWeek,listMonth'
              }}
              views={{
                dayGridMonth: { displayEventTime: false },
                timeGridWeek: { displayEventTime: false },
              }}
              events={displayEvents}
              height="auto"
              dayMaxEvents={true}
              datesSet={(info) => {
                setViewDate(info.view.currentStart);
              }}
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
        </div>

        {/* Right Panel — Mini Calendar */}
        <div className="w-64 shrink-0 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-fit sticky top-[100px]">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Navigational View</h3>
          <MiniCalendar
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            workDays={scheduleDays}
            viewDate={viewDate}
            onViewChange={handleMiniCalendarViewChange}
          />
        </div>
      </div>
    </div>
  );
}
