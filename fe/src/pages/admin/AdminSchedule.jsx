import React, { useState, useEffect, useRef, useMemo } from 'react';
import ScheduleCalendar from '../../components/ScheduleCalendar';
import MiniCalendar from '../../components/MiniCalendar';
import { UsersIcon, XMarkIcon, ArrowLeftIcon, PlusIcon, CheckCircleIcon, ClockIcon, DocumentTextIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { apiFetch } from '../../services/api';
import { taskService } from '../../services/taskService';
import { scheduleService } from '../../services/scheduleService';
import { useNavigate } from 'react-router-dom';
import EmployeeMultiFilter from '../../components/EmployeeMultiFilter';

const PERSON_COLORS = [
  { bg: '#3b82f6', border: '#2563eb', text: '#ffffff' }, // blue
  { bg: '#ec4899', border: '#db2777', text: '#ffffff' }, // pink
  { bg: '#10b981', border: '#059669', text: '#ffffff' }, // green
  { bg: '#f59e0b', border: '#d97706', text: '#ffffff' }, // yellow/amber
  { bg: '#8b5cf6', border: '#7c3aed', text: '#ffffff' }, // purple
  { bg: '#f97316', border: '#ea580c', text: '#ffffff' }, // orange
  { bg: '#6366f1', border: '#4f46e5', text: '#ffffff' }, // indigo
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
          personTasks = allTasks.filter(t => {
            if (!t.participants?.some(p => p.person_id === sched.person_id)) return false;

            const taskStartDate = t.start_time?.split(/[T ]/)[0] || t.due_date?.split(/[T ]/)[0];
            const taskDueDate = t.due_date?.split(/[T ]/)[0];

            return taskStartDate && taskDueDate &&
              targetDate >= taskStartDate &&
              targetDate <= taskDueDate;
          });
        }

        const personReport = reports.find(r => Number(r.person_id) === Number(sched.person_id));

        return {
          person_id: sched.person_id,
          name: sched.title,
          username: sched.extendedProps.person?.username || '',
          shift: `${new Date(sched.extendedProps.start_time).toLocaleTimeString('vi-VN', {
            hour: 'numeric',
            minute: '2-digit'
          })} - ${new Date(sched.extendedProps.end_time).toLocaleTimeString('vi-VN', {
            hour: 'numeric',
            minute: '2-digit'
          })}`, check_in: personReport ? personReport.check_in : null,
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
    <div className="space-y-6 pb-20">
      <div className="flex flex-col lg:flex-row gap-5 lg:gap-8">

        {/* Main Calendar Area */}
        <div className="flex-1 min-w-0">
          {/* Header with title and employee filter */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Lịch làm việc</h1>
              <p className="text-gray-500 mt-1 text-sm hidden sm:block">Tổng hợp lịch làm việc của nhân viên</p>
            </div>

            <div className="w-full sm:w-auto min-w-[280px]">
              <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Lọc nhân viên</p>
                <EmployeeMultiFilter
                  employees={employees}
                  selectedIds={selectedEmployeeIds}
                  onSelectionChange={(ids) => setSelectedEmployeeIds(ids)}
                />
              </div>
            </div>
          </div>

          <ScheduleCalendar
            ref={calendarRef}
            initialDate={todayStr}
            events={displayEvents}
            selectedDate={selectedDate}
            onDateClick={handleDateClick}
            onDatesSet={(info) => {
              setViewDate(info.view.currentStart);
              const startStr = info.startStr.split('T')[0];
              const endStr = info.endStr.split('T')[0];
              fetchSchedulesInRange(startStr, endStr);
            }}
          />
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
                    ? `Schedule for ${new Date(modalDate).toLocaleDateString()} of ${selectedModalPerson.name}`
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
                  <div className="text-center py-12 text-gray-500">Không có nhân viên nào làm việc vào ngày này.</div>
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
                            <span>Check-in: {person.check_in ? person.check_in.slice(0, 5) : <span className="text-red-400">N/A</span>}</span>                            <span className="flex items-center gap-1">

                            </span>
                            <span>
                              Check-out: {
                                person.report?.check_out
                                  ? person.report.check_out.slice(0, 5)
                                  : <span className="text-red-400">N/A</span>
                              }
                            </span>
                            Báo cáo: {person.has_reported ? <CheckCircleIcon className="w-4 h-4 text-green-500" /> : <XMarkIcon className="w-4 h-4 text-red-400" />}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="px-3 py-1 bg-gray-100 group-hover:bg-blue-100 text-gray-600 group-hover:text-blue-700 rounded-full text-xs font-bold transition-colors">
                            {person.tasks.length} Công việc
                          </div>
                          <button className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            Xem
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
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lọc theo trạng thái công việc</p>
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
                            <option value="" disabled>Thêm trạng thái công việc...</option>
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
                      Thêm Task
                    </button>
                  </div>



                  {/* Daily Report Section */}
                  <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-4 mb-4">
                    <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                      <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                      Báo cáo
                    </h3>
                    {selectedModalPerson.report ? (
                      <div className="space-y-3">
                        <div className="flex gap-4 text-xs font-medium text-gray-600">
                          <div className="flex items-center gap-1">
                            <ClockIcon className="w-4 h-4 text-gray-400" />
                            Check-in: {selectedModalPerson.report.check_in
                              ? selectedModalPerson.report.check_in.slice(0, 5)
                              : 'N/A'}
                          </div>
                          <div className="flex items-center gap-1">
                            <ClockIcon className="w-4 h-4 text-gray-400" />
                            Check-out: {selectedModalPerson.report.check_out
                              ? selectedModalPerson.report.check_out.slice(0, 5)
                              : 'N/A'}
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedModalPerson.report.description || <span className="text-gray-400 italic">Không có mô tả công việc</span>}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">Nhân viên chưa báo cáo công việc.</div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400 font-medium">
                      {selectedModalPerson.tasks.filter(t => taskStatusFilters.length === 0 || taskStatusFilters.includes(t.status)).length} tasks found
                    </p>
                  </div>
                  {selectedModalPerson.tasks.filter(t => taskStatusFilters.includes(t.status?.toLowerCase())).length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      Không có công việc nào phù hợp.
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">Tên công việc</th>
                            <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">Ngày</th>
                            <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">Trạng thái</th>
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
                                  <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider border shadow-sm
                                    ${task.status === 'in progress' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                      task.status === 'completed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                        'bg-gray-100 text-gray-700 border-gray-200'}
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
