import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarDaysIcon, UsersIcon } from '@heroicons/react/24/outline';

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
  const [schedules, setSchedules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');
  const calendarRef = useRef(null);

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
              title: `${item.person?.name || 'Unknown'} - ${item.start_time} to ${item.end_time}`,
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

  const displayEvents = selectedEmployeeId === 'all' 
    ? schedules 
    : schedules.filter(s => s.person_id.toString() === selectedEmployeeId);

  return (
    <div className="flex-1 p-8 pt-[80px] bg-[#f1f4f8] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
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

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-6">
          <div className="calendar-container w-full h-[600px] custom-scrollbar">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={displayEvents}
              headerToolbar={{
                left: 'title',
                center: '',
                right: 'prev,next today'
              }}
              height="100%"
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
      </div>
    </div>
  );
}
