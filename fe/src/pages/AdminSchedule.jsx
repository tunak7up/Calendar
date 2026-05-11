import React, { useState, useEffect, useRef, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import MiniCalendar from '../components/MiniCalendar';
import { UsersIcon, XMarkIcon, ArrowLeftIcon, PlusIcon, CheckCircleIcon, ClockIcon, DocumentTextIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { apiFetch } from '../services/api';
import { taskService } from '../services/taskService';
import { scheduleService } from '../services/scheduleService';
import { useNavigate } from 'react-router-dom';
import EmployeeMultiFilter from '../components/EmployeeMultiFilter';

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

  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [schedules, setSchedules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [allTasksCache, setAllTasksCache] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [selectedModalPerson, setSelectedModalPerson] = useState(null);
  const [taskStatusFilters, setTaskStatusFilters] = useState(['pending', 'in progress']);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Fetch Employees for Filter
    apiFetch('/person')
      .then(data => {
        if (data.success) {
          setEmployees(data.data);
        }
      });

    // Fetch All Schedules is now handled by datesSet
  }, []);

  // Collect all dates that have at least one schedule
  const scheduleDays = [...new Set(schedules.map(s => s.start?.split?.(/[T ]/)?.[0]).filter(Boolean))];

  const fetchSchedulesInRange = (startStr, endStr) => {
    scheduleService.getSchedulesByRange(startStr, endStr)
      .then(data => {
        if (data.success) {
          const mappedSchedules = data.data.map(item => {
            const colorSet = PERSON_COLORS[item.person_id % PERSON_COLORS.length];
            // Ensure date is in YYYY-MM-DD format regardless of type (Date or String)
            const dateOnly = item.working_date ? new Date(item.working_date).toISOString().split('T')[0] : null;
            return {
              id: `sched_${item.schedule_id}`,
              title: `${item.person?.name || 'Unknown'}`,
              start: dateOnly,
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
  };

  const displayEvents = useMemo(() => {
    const baseEvents = selectedEmployeeIds.length === 0 
      ? schedules 
      : schedules.filter(s => selectedEmployeeIds.includes(s.person_id.toString()));

    if (!isMobile) return baseEvents;

    // Aggregate by date for mobile view
    const aggregated = {};
    baseEvents.forEach(e => {
      const date = e.start;
      if (!date) return;
      if (!aggregated[date]) aggregated[date] = 0;
      aggregated[date]++;
    });

    return Object.entries(aggregated).map(([date, count]) => ({
      id: `summary_${date}`,
      title: `${count} People Working`,
      start: date,
      allDay: true,
      backgroundColor: '#eff6ff',
      borderColor: '#bfdbfe',
      textColor: '#1e4ed8',
      extendedProps: { isSummary: true, count }
    }));
  }, [schedules, selectedEmployeeIds, isMobile]);

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

  const handleDateClick = async (arg) => {
    const clickedDateStr = arg.dateStr;
    setModalDate(clickedDateStr);
    setIsModalOpen(true);
    setSelectedModalPerson(null);
    setModalLoading(true);

    try {
      // Normalize clicked date
      const targetDate = clickedDateStr.split(/[T ]/)[0];
      const peopleWorking = schedules.filter(s => s.start === targetDate);
      
      // Fetch Daily Reports for this specific date
      const reportPromise = apiFetch(`/daily-report/date/${targetDate}`);
      
      // Fetch all tasks
      let tasksPromise;
      if (allTasksCache) {
        tasksPromise = Promise.resolve({ success: true, data: allTasksCache });
      } else {
        tasksPromise = taskService.getAllTasks();
      }

      const [reportRes, tasksRes] = await Promise.all([reportPromise, tasksPromise]);
      const reports = reportRes.success ? (reportRes.data || []) : [];
      
      let allTasks = allTasksCache;
      if (!allTasksCache && tasksRes.success) {
        allTasks = tasksRes.data || [];
        setAllTasksCache(allTasks);
      }

      const enrichedData = peopleWorking.map(sched => {
        let personTasks = [];
        if (allTasks) {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          
          personTasks = allTasks.filter(t => 
            t.participants?.some(p => p.person_id === sched.person_id) &&
            (!t.due_date || new Date(t.due_date) >= todayStart)
          );
        }
        
        const personReport = reports.find(r => Number(r.person_id) === Number(sched.person_id));
        
        return {
          person_id: sched.person_id,
          name: sched.title,
          username: sched.extendedProps.person?.username || '',
          shift: `${sched.extendedProps.start_time} - ${sched.extendedProps.end_time}`,
          check_in: personReport ? personReport.check_in : null,
          has_reported: !!(personReport && personReport.description),
          report: personReport || null,
          tasks: personTasks
        };
      });

      setModalData(enrichedData);
    } catch (error) {
      console.error("Failed to load date details", error);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="flex-1 p-3 sm:p-8 mt-[56px] pt-6 sm:pt-10 bg-[#f8fafc] min-h-screen relative">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-5 lg:gap-8">

        {/* Main Calendar Area */}
        <div className="flex-1 min-w-0">
          {/* Header with title and employee filter */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Company Schedule</h1>
              <p className="text-gray-500 mt-1 text-sm hidden sm:block">Overview of all employee work shifts</p>
            </div>
            
            <div className="w-full sm:w-auto min-w-[280px]">
              <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Filter Employees</p>
                <EmployeeMultiFilter 
                  employees={employees}
                  selectedIds={selectedEmployeeIds}
                  onSelectionChange={(ids) => setSelectedEmployeeIds(ids)}
                />
              </div>
            </div>
          </div>

          <div className="bg-white shadow-xl shadow-blue-900/5 border border-gray-100 rounded-2xl sm:rounded-3xl p-3 sm:p-6 transition-all">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              initialDate={todayStr}
              // headerToolbar={{
              //   left: 'today prev,next title',
              //   right: 'dayGridMonth,timeGridWeek,listMonth'
              // }}
              views={{
                dayGridMonth: { displayEventTime: false },
                timeGridWeek: { displayEventTime: false },
              }}
              events={displayEvents}
              height="auto"
              dayMaxEvents={true}
              dateClick={handleDateClick}
              datesSet={(info) => {
                setViewDate(info.view.currentStart);
                const startStr = info.startStr.split('T')[0];
                const endStr = info.endStr.split('T')[0];
                fetchSchedulesInRange(startStr, endStr);
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
        </div>

        {/* Right Panel — Mini Calendar: sidebar on desktop, compact strip on mobile */}
        <div className="lg:w-64 lg:shrink-0 bg-white p-4 lg:p-6 rounded-2xl lg:rounded-3xl border border-gray-100 shadow-sm lg:h-fit lg:sticky lg:top-[100px]">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 lg:mb-6">Navigational View</h3>
          <div className="flex justify-center lg:block">
            <div className="w-full max-w-xs lg:max-w-none">
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
      </div>

      {/* Detail Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                {selectedModalPerson && (
                  <button 
                    onClick={() => setSelectedModalPerson(null)}
                    className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                  </button>
                )}
                <h2 className="text-lg font-bold text-gray-900">
                  {selectedModalPerson 
                    ? `Tasks for ${selectedModalPerson.name}`
                    : `Schedule for ${new Date(modalDate).toLocaleDateString()}`
                  }
                </h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {modalLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              ) : !selectedModalPerson ? (
                /* Day Summary View */
                modalData.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No employees scheduled for this date.</div>
                ) : (
                  <div className="space-y-3">
                    {modalData.map(person => (
                      <div 
                        key={person.person_id}
                        onClick={() => setSelectedModalPerson(person)}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer transition-all gap-4"
                      >
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{person.name}</h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1"><ClockIcon className="w-4 h-4" /> {person.shift}</span>
                            <span>Check-in: {person.check_in ? new Date(person.check_in).toLocaleTimeString() : <span className="text-red-400">N/A</span>}</span>
                            <span className="flex items-center gap-1">
                              Report: {person.has_reported ? <CheckCircleIcon className="w-4 h-4 text-green-500" /> : <XMarkIcon className="w-4 h-4 text-red-400" />}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="px-3 py-1 bg-gray-100 group-hover:bg-blue-100 text-gray-600 group-hover:text-blue-700 rounded-full text-xs font-bold transition-colors">
                            {person.tasks.length} tasks
                          </div>
                          <button className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* Person Task Detail View */
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Filter by Status</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Select for Status */}
                        <div className="relative w-full sm:w-auto">
                          <select
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val && !taskStatusFilters.includes(val)) {
                                setTaskStatusFilters(prev => [...prev, val]);
                              }
                              e.target.value = "";
                            }}
                            defaultValue=""
                            className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0056b3]/20 focus:border-[#0056b3] transition-all cursor-pointer w-full sm:min-w-[160px] appearance-none pr-8"
                          >
                            <option value="" disabled>Add Status...</option>
                            {['pending', 'in progress', 'completed']
                              .filter(s => !taskStatusFilters.includes(s))
                              .map(s => (
                                <option key={s} value={s} className="capitalize">{s}</option>
                              ))
                            }
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                             <ChevronDownIcon className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Status Tags */}
                        <div className="flex flex-wrap items-center gap-2 w-full sm:flex-1">
                          {taskStatusFilters.map(status => (
                            <div 
                              key={status}
                              className="flex items-center gap-1.5 bg-blue-50 text-[#0056b3] px-2 py-1 rounded-lg border border-blue-100 text-[10px] font-bold shadow-sm animate-in fade-in slide-in-from-left-1"
                            >
                              <span className="capitalize">{status}</span>
                              <button 
                                onClick={() => setTaskStatusFilters(prev => prev.filter(s => s !== status))}
                                className="hover:bg-[#0056b3] hover:text-white rounded-md p-0.5 transition-colors"
                              >
                                <XMarkIcon className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          
                          
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        navigate('/tasks/add', { 
                          state: { 
                            assignee: { 
                              person_id: selectedModalPerson.person_id, 
                              username: selectedModalPerson.username, 
                              name: selectedModalPerson.name, 
                              role: 'assignee' 
                            } 
                          } 
                        });
                      }}
                      className="flex items-center gap-1 px-4 py-2 bg-[#0056b3] text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/10 w-full sm:w-auto justify-center"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add Task
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400 font-medium">
                      {selectedModalPerson.tasks.filter(t => taskStatusFilters.length === 0 || taskStatusFilters.includes(t.status)).length} tasks found
                    </p>
                  </div>
                  
                  {/* Daily Report Section */}
                  <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-4 mb-4">
                    <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                      <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                      Daily Report
                    </h3>
                    {selectedModalPerson.report ? (
                      <div className="space-y-3">
                        <div className="flex gap-4 text-xs font-medium text-gray-600">
                          <div className="flex items-center gap-1">
                            <ClockIcon className="w-4 h-4 text-gray-400" />
                            Check-in: {selectedModalPerson.report.check_in ? new Date(selectedModalPerson.report.check_in).toLocaleTimeString() : 'N/A'}
                          </div>
                          <div className="flex items-center gap-1">
                            <ClockIcon className="w-4 h-4 text-gray-400" />
                            Check-out: {selectedModalPerson.report.check_out ? new Date(selectedModalPerson.report.check_out).toLocaleTimeString() : 'N/A'}
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedModalPerson.report.description || <span className="text-gray-400 italic">No description provided</span>}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">No report submitted for this date.</div>
                    )}
                  </div>

                  
                  {selectedModalPerson.tasks.filter(t => taskStatusFilters.includes(t.status?.toLowerCase())).length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      No tasks match the selected filters.
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">Task Name</th>
                            <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">Due Date</th>
                            <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedModalPerson.tasks
                            .filter(t => taskStatusFilters.length === 0 || taskStatusFilters.includes(t.status))
                            .map(task => (
                              <tr key={task.task_id} className="bg-white hover:bg-gray-50/50">
                                <td className="py-3 px-4 font-medium text-gray-900">{task.name || task.title}</td>
                                <td className="py-3 px-4 text-sm text-gray-500">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</td>
                                <td className="py-3 px-4">
                                  <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider
                                    ${task.status === 'in progress' ? 'bg-blue-50 text-blue-700' : 
                                      task.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                                      'bg-gray-100 text-gray-600'}
                                  `}>
                                    {task.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
