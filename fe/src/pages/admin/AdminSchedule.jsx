import React, { useState, useEffect, useRef, useMemo } from 'react';
import ScheduleCalendar from '../../components/ScheduleCalendar';
import MiniCalendar from '../../components/MiniCalendar';
import { UsersIcon, XMarkIcon, ArrowLeftIcon, PlusIcon, CheckCircleIcon, ClockIcon, DocumentTextIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { apiFetch } from '../../services/api';
import { taskService } from '../../services/taskService';
import { scheduleService } from '../../services/scheduleService';
import { useNavigate } from 'react-router-dom';
import EmployeeMultiFilter from '../../components/EmployeeMultiFilter';
import { useTranslation } from 'react-i18next';

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
  const { t, i18n } = useTranslation();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewDate, setViewDate] = useState(today);
  const calendarRef = useRef(null);
  const lastFetchedRangeRef = useRef({ start: '', end: '', lang: '' });

  const navigate = useNavigate();
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
  const [activeGroup, setActiveGroup] = useState('registered'); // 'registered' or 'unscheduled'

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

  const fetchSchedulesInRange = async (startStr, endStr) => {
    try {
      const [schedRes, repRes] = await Promise.all([
        scheduleService.getSchedulesByRange(startStr, endStr),
        apiFetch(`/daily-report/range?start=${startStr}&end=${endStr}`)
      ]);

      if (schedRes.success && repRes.success) {
        const rawSchedules = schedRes.data || [];
        const rawReports = repRes.data || [];
        const eventMap = new Map(); // key: `${person_id}_${date}`

        rawSchedules.forEach(sched => {
          const dateOnly = sched.working_date ? new Date(sched.working_date).toISOString().split('T')[0] : null;
          if (!dateOnly) return;
          const key = `${sched.person_id}_${dateOnly}`;
          eventMap.set(key, {
            person_id: sched.person_id,
            person: sched.person,
            date: dateOnly,
            schedule: sched,
            report: null
          });
        });

        rawReports.forEach(rep => {
          const dateOnly = rep.working_date ? new Date(rep.working_date).toISOString().split('T')[0] : null;
          if (!dateOnly) return;
          const key = `${rep.person_id}_${dateOnly}`;
          if (eventMap.has(key)) {
            eventMap.get(key).report = rep;
          } else {
            eventMap.set(key, {
              person_id: rep.person_id,
              person: rep.reporter || { name: rep.person?.name || `Employee ${rep.person_id}`, username: rep.person?.username || `user_${rep.person_id}` },
              date: dateOnly,
              schedule: null,
              report: rep
            });
          }
        });

        const mappedSchedules = Array.from(eventMap.values()).map(item => {
          const hasSchedule = !!item.schedule;
          const checkIn = item.report?.check_in || null;
          const checkOut = item.report?.check_out || null;

          let bg = '#ffffff';
          let border = '#e2e8f0';
          let text = '#1e293b';
          if (hasSchedule) {
            if (!checkIn) {
              // 1. Có lịch nhưng chưa check-in (Đỏ)
              bg = '#fee2e2';
              border = '#fca5a5';
              text = '#991b1b';
            } else if (!checkOut) {
              // 2. Có lịch và đã check-in (Xanh dương)
              bg = '#dbeafe';
              border = '#93c5fd';
              text = '#1e40af';
            } else {
              // 3. Có lịch, đã check-in và check-out (Xanh lá)
              bg = '#d1fae5';
              border = '#6ee7b7';
              text = '#065f46';
            }
          } else {
            // Unscheduled
            if (checkIn && !checkOut) {
              // 4. Không đăng ký nhưng check-in (Vàng)
              bg = '#fef3c7';
              border = '#fcd34d';
              text = '#92400e';
            } else if (checkIn && checkOut) {
              // 5. Không đăng ký, check-in và check-out (Tím)
              bg = '#f3e8ff';
              border = '#d8b4fe';
              text = '#6b21a8';
            }
          }

          return {
            id: `event_${item.person_id}_${item.date}`,
            title: `${item.person?.name || 'Unknown'}`,
            start: item.date,
            allDay: true,
            person_id: item.person_id,
            backgroundColor: bg,
            borderColor: border,
            textColor: text,
            extendedProps: {
              person: item.person,
              schedule: item.schedule,
              report: item.report,
              hasSchedule,
              checkIn,
              checkOut
            }
          };
        });

        setSchedules(mappedSchedules);
      }
    } catch (error) {
      console.error("Failed to load schedules and reports", error);
    }
  };

  const enrichedSchedules = useMemo(() => {
    return schedules.map(e => {
      const emp = employees.find(empItem => empItem.person_id === e.person_id);
      if (emp) {
        return {
          ...e,
          title: emp.name || emp.username,
          extendedProps: {
            ...e.extendedProps,
            person: emp
          }
        };
      }
      return e;
    });
  }, [schedules, employees]);

  const displayEvents = useMemo(() => {
    const baseEvents = selectedEmployeeIds.length === 0
      ? enrichedSchedules
      : enrichedSchedules.filter(s => selectedEmployeeIds.includes(s.person_id.toString()));

    // Aggregate by date into 2 groups: registered and unscheduled
    const aggregated = {}; // key: date -> { registered: 0, unscheduled: 0 }
    
    baseEvents.forEach(e => {
      const date = e.start;
      if (!date) return;
      if (!aggregated[date]) {
        aggregated[date] = { registered: 0, unscheduled: 0 };
      }
      
      const hasSchedule = e.extendedProps?.hasSchedule;
      if (hasSchedule) {
        aggregated[date].registered++;
      } else {
        aggregated[date].unscheduled++;
      }
    });

    const groupEvents = [];
    Object.entries(aggregated).forEach(([date, counts]) => {
      if (counts.registered > 0) {
        groupEvents.push({
          id: `group_registered_${date}`,
          title: i18n.language === 'vi' 
            ? `Đăng ký: ${counts.registered} người` 
            : `Registered: ${counts.registered} ${counts.registered === 1 ? 'person' : 'people'}`,
          start: date,
          allDay: true,
          backgroundColor: '#eff6ff', // blue-50
          borderColor: '#bfdbfe', // blue-200
          textColor: '#1e4ed8', // blue-700
          extendedProps: {
            isGroupSummary: true,
            groupType: 'registered',
            count: counts.registered,
            date
          }
        });
      }
      if (counts.unscheduled > 0) {
        groupEvents.push({
          id: `group_unscheduled_${date}`,
          title: i18n.language === 'vi' 
            ? `Ngoài lịch: ${counts.unscheduled} người` 
            : `Unscheduled: ${counts.unscheduled} ${counts.unscheduled === 1 ? 'person' : 'people'}`,
          start: date,
          allDay: true,
          backgroundColor: '#fef3c7', // amber-100
          borderColor: '#fcd34d', // amber-300
          textColor: '#92400e', // amber-800
          extendedProps: {
            isGroupSummary: true,
            groupType: 'unscheduled',
            count: counts.unscheduled,
            date
          }
        });
      }
    });

    return groupEvents;
  }, [enrichedSchedules, selectedEmployeeIds, i18n.language]);

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
    setActiveGroup('registered');
    setModalLoading(true);

    try {
      // Normalize clicked date
      const targetDate = clickedDateStr.split(/[T ]/)[0];
      let peopleWorking = enrichedSchedules.filter(s => s.start === targetDate);
      if (selectedEmployeeIds.length > 0) {
        peopleWorking = peopleWorking.filter(s => selectedEmployeeIds.includes(s.person_id.toString()));
      }

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
        const schedTime = sched.extendedProps.schedule;
        let shiftText = '—';
        if (schedTime && schedTime.start_time && schedTime.end_time) {
          try {
            shiftText = `${new Date(schedTime.start_time).toLocaleTimeString('vi-VN', {
              hour: 'numeric',
              minute: '2-digit'
            })} - ${new Date(schedTime.end_time).toLocaleTimeString('vi-VN', {
              hour: 'numeric',
              minute: '2-digit'
            })}`;
          } catch {
            shiftText = '—';
          }
        }

        return {
          person_id: sched.person_id,
          name: sched.extendedProps.person?.name || sched.title,
          username: sched.extendedProps.person?.username || '',
          shift: shiftText,
          check_in: personReport ? personReport.check_in : null,
          has_reported: !!(personReport && personReport.description),
          report: personReport || null,
          tasks: personTasks,
          hasSchedule: sched.extendedProps.hasSchedule
        };
      });

      setModalData(enrichedData);
    } catch (error) {
      console.error("Failed to load date details", error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleEventClick = async (eventObj) => {
    const clickedDateStr = eventObj.startStr || (eventObj.start instanceof Date ? eventObj.start.toISOString().split('T')[0] : eventObj.start?.split?.(/[T ]/)?.[0]);
    const groupType = eventObj.extendedProps?.groupType || 'registered';
    
    setModalDate(clickedDateStr);
    setIsModalOpen(true);
    setSelectedModalPerson(null);
    setActiveGroup(groupType);
    setModalLoading(true);

    try {
      const targetDate = clickedDateStr.split(/[T ]/)[0];
      let peopleWorking = enrichedSchedules.filter(s => s.start === targetDate);
      if (selectedEmployeeIds.length > 0) {
        peopleWorking = peopleWorking.filter(s => selectedEmployeeIds.includes(s.person_id.toString()));
      }

      const reportPromise = apiFetch(`/daily-report/date/${targetDate}`);
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
            return taskStartDate && taskDueDate && targetDate >= taskStartDate && targetDate <= taskDueDate;
          });
        }

        const personReport = reports.find(r => Number(r.person_id) === Number(sched.person_id));
        const schedTime = sched.extendedProps.schedule;
        let shiftText = '—';
        if (schedTime && schedTime.start_time && schedTime.end_time) {
          try {
            shiftText = `${new Date(schedTime.start_time).toLocaleTimeString('vi-VN', {
              hour: 'numeric',
              minute: '2-digit'
            })} - ${new Date(schedTime.end_time).toLocaleTimeString('vi-VN', {
              hour: 'numeric',
              minute: '2-digit'
            })}`;
          } catch {
            shiftText = '—';
          }
        }

        return {
          person_id: sched.person_id,
          name: sched.extendedProps.person?.name || sched.title,
          username: sched.extendedProps.person?.username || '',
          shift: shiftText,
          check_in: personReport ? personReport.check_in : null,
          has_reported: !!(personReport && personReport.description),
          report: personReport || null,
          tasks: personTasks,
          hasSchedule: sched.extendedProps.hasSchedule
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
              <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{t('adminschedule.title')}</h1>
              <p className="text-gray-500 mt-1 text-sm hidden sm:block">{t('adminschedule.subtitle')}</p>
            </div>

            <div className="w-full sm:w-auto min-w-[280px]">
              <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('adminschedule.filter_employees')}</p>
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
            onEventClick={handleEventClick}
            onDatesSet={(info) => {
              const startStr = info.startStr.split('T')[0];
              const endStr = info.endStr.split('T')[0];
              const lang = i18n.language;
              if (
                lastFetchedRangeRef.current.start === startStr &&
                lastFetchedRangeRef.current.end === endStr &&
                lastFetchedRangeRef.current.lang === lang
              ) {
                return;
              }
              lastFetchedRangeRef.current = { start: startStr, end: endStr, lang };
              const newStart = info.view.currentStart;
              setViewDate(prev => {
                if (prev && newStart && prev.getTime() === newStart.getTime()) {
                  return prev;
                }
                return newStart;
              });
              fetchSchedulesInRange(startStr, endStr);
            }}
          />
        </div>

        {/* Right Panel — Mini Calendar & Legend: sidebar on desktop, compact strip on mobile */}
        <div className="lg:w-64 lg:shrink-0 bg-white p-4 lg:p-6 rounded-2xl lg:rounded-3xl border border-gray-100 shadow-sm lg:h-fit lg:sticky lg:top-[100px] flex flex-col gap-6">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 lg:mb-6">{t('adminschedule.nav_view')}</h3>
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
      </div>

      {/* Detail Modal */}
      {isModalOpen && (
        (() => {
          const formattedModalDate = (() => {
            const d = new Date(modalDate);
            if (isNaN(d.getTime())) return '';
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
          })();
          return (
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
                        ? t('adminschedule.schedule_for_person', { date: formattedModalDate, name: selectedModalPerson.name })
                        : t('adminschedule.schedule_for', { date: formattedModalDate })
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
            <div className="p-6 overflow-y-auto flex-1">
              {modalLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              ) : !selectedModalPerson ? (
                /* Day Summary View */
                (() => {
                  const registeredList = modalData.filter(p => p.hasSchedule);
                  const unscheduledList = modalData.filter(p => !p.hasSchedule);
                  const registeredCount = registeredList.length;
                  const unscheduledCount = unscheduledList.length;
                  const currentList = activeGroup === 'registered' ? registeredList : unscheduledList;

                  return (
                    <div className="space-y-4">
                      {/* Group selection boxes */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        {/* Box 1: Đăng ký đi làm */}
                        <div
                          onClick={() => setActiveGroup('registered')}
                          className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between cursor-pointer ${
                            activeGroup === 'registered'
                              ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                              : 'border-gray-100 hover:border-gray-200 bg-gray-50/30'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-xl ${activeGroup === 'registered' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                              <UsersIcon className="w-4 h-4" />
                            </div>
                            <span className={`text-xs sm:text-sm font-semibold ${activeGroup === 'registered' ? 'text-blue-900' : 'text-gray-500'}`}>
                              {t('adminschedule.registered_work')}
                            </span>
                          </div>
                          <div className="mt-3 text-xl sm:text-2xl font-semibold text-gray-900 flex items-baseline gap-1">
                            {registeredCount}
                            <span className="text-xs font-bold text-gray-400">{t('adminschedule.registered_unit')}</span>
                          </div>
                        </div>

                        {/* Box 2: Làm ngoài lịch */}
                        <div
                          onClick={() => setActiveGroup('unscheduled')}
                          className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between cursor-pointer ${
                            activeGroup === 'unscheduled'
                              ? 'border-amber-500 bg-amber-50/40 shadow-sm'
                              : 'border-gray-100 hover:border-gray-200 bg-gray-50/30'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-xl ${activeGroup === 'unscheduled' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                              <ClockIcon className="w-4 h-4" />
                            </div>
                            <span className={`text-xs sm:text-sm font-semibold ${activeGroup === 'unscheduled' ? 'text-amber-950' : 'text-gray-500'}`}>
                              {t('adminschedule.unscheduled_work')}
                            </span>
                          </div>
                          <div className="mt-3 text-xl sm:text-2xl font-semibold text-gray-900 flex items-baseline gap-1">
                            {unscheduledCount}
                            <span className="text-xs font-bold text-gray-400">{t('adminschedule.unscheduled_unit')}</span>
                          </div>
                        </div>
                      </div>

                      {/* List area */}
                      {currentList.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                          {activeGroup === 'registered' 
                            ? t('adminschedule.no_registered') 
                            : t('adminschedule.no_unscheduled')
                          }
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {currentList.map(person => (
                            <div
                              key={person.person_id}
                              onClick={() => setSelectedModalPerson(person)}
                              className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer transition-all gap-4"
                            >
                              <div className="flex-1">
                                <h3
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/profile/${person.person_id}`);
                                  }}
                                  className="font-bold text-gray-900 hover:text-blue-600 hover:underline transition-colors inline-block cursor-pointer"
                                  title={i18n.language === 'vi' ? 'Xem trang cá nhân' : 'View Profile'}
                                >
                                  {person.name}
                                </h3>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                                  <span className="flex items-center gap-1"><ClockIcon className="w-4 h-4 text-gray-400" /> {person.shift}</span>
                                  <span>{t('adminschedule.check_in')}{person.check_in ? person.check_in.slice(0, 5) : <span className="text-red-400 font-medium">{t('adminschedule.not_available')}</span>}</span>
                                  <span>
                                    {t('adminschedule.check_out')}{
                                      person.report?.check_out
                                        ? person.report.check_out.slice(0, 5)
                                        : <span className="text-red-400 font-medium">{t('adminschedule.not_available')}</span>
                                    }
                                  </span>
                                  <span className="flex items-center gap-1">
                                    {t('adminschedule.report_status')}{person.has_reported ? <CheckCircleIcon className="w-4.5 h-4.5 text-green-500" /> : <XMarkIcon className="w-4.5 h-4.5 text-red-400" />}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="px-3 py-1 bg-gray-100 group-hover:bg-blue-100 text-gray-600 group-hover:text-blue-700 rounded-full text-xs font-bold transition-colors">
                                  {t('adminschedule.tasks_count', { count: person.tasks.length })}
                                </div>
                                 <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/profile/${person.person_id}`);
                                  }}
                                  className="text-[#0056b3] hover:text-blue-800 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                >
                                  {i18n.language === 'vi' ? 'Xem trang cá nhân' : 'View Profile'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                /* Person Task Detail View */
                <div className="space-y-4">
                  {/* Quick Profile Info Button Card */}
                  <button
                    onClick={() => navigate(`/profile/${selectedModalPerson.person_id}`)}
                    className="flex items-center justify-between bg-indigo-50/30 hover:bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 transition-colors w-full cursor-pointer text-left group/profile shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedModalPerson.name || selectedModalPerson.username)}&background=e0e7ff&color=4338ca&rounded=true&size=40&bold=true`}
                        alt={selectedModalPerson.name}
                        className="w-10 h-10 rounded-full border border-gray-100"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 group-hover/profile:text-indigo-600 transition-colors">{selectedModalPerson.name}</h4>
                        <p className="text-xs text-gray-400">@{selectedModalPerson.username}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-700 group-hover/profile:text-indigo-600 transition-colors flex items-center gap-1">
                      {i18n.language === 'vi' ? 'Xem trang cá nhân' : 'View Profile'} →
                    </span>
                  </button>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{t('adminschedule.filter_by_status')}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setTaskStatusFilters(prev =>
                              prev.includes('pending') ? prev.filter(s => s !== 'pending') : [...prev, 'pending']
                            );
                          }}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            taskStatusFilters.includes('pending')
                              ? 'bg-gray-100 text-gray-700 border-gray-300 shadow-sm'
                              : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {t('adminschedule.status_pending')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTaskStatusFilters(prev =>
                              prev.includes('in progress') ? prev.filter(s => s !== 'in progress') : [...prev, 'in progress']
                            );
                          }}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            taskStatusFilters.includes('in progress')
                              ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                              : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {t('adminschedule.status_in_progress')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTaskStatusFilters(prev =>
                              prev.includes('completed') ? prev.filter(s => s !== 'completed') : [...prev, 'completed']
                            );
                          }}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            taskStatusFilters.includes('completed')
                              ? 'bg-emerald-50 text-[#10b981] border-emerald-200 shadow-sm'
                              : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {t('adminschedule.status_completed')}
                        </button>
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
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#0056b3] text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/10 w-full sm:w-auto justify-center"
                    >
                      <PlusIcon className="w-4 h-4" />
                      {t('adminschedule.add_task')}
                    </button>
                  </div>



                  {/* Daily Report Section */}
                  <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-4 mb-4">
                    <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                      <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                      {t('adminschedule.report_title')}
                    </h3>
                    {selectedModalPerson.report ? (
                      <div className="space-y-3">
                        <div className="flex gap-4 text-xs font-medium text-gray-600">
                          <div className="flex items-center gap-1">
                            <ClockIcon className="w-4 h-4 text-gray-400" />
                            {t('adminschedule.check_in')}{selectedModalPerson.report.check_in
                              ? selectedModalPerson.report.check_in.slice(0, 5)
                              : t('adminschedule.not_available')}
                          </div>
                          <div className="flex items-center gap-1">
                            <ClockIcon className="w-4 h-4 text-gray-400" />
                            {t('adminschedule.check_out')}{selectedModalPerson.report.check_out
                              ? selectedModalPerson.report.check_out.slice(0, 5)
                              : t('adminschedule.not_available')}
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedModalPerson.report.description || <span className="text-gray-400 italic">{t('adminschedule.no_report_desc')}</span>}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">{t('adminschedule.not_reported_yet')}</div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400 font-medium">
                      {t('adminschedule.tasks_found', { count: selectedModalPerson.tasks.filter(t => taskStatusFilters.length === 0 || taskStatusFilters.includes(t.status?.toLowerCase())).length })}
                    </p>
                  </div>
                  {selectedModalPerson.tasks.filter(t => taskStatusFilters.length === 0 || taskStatusFilters.includes(t.status?.toLowerCase())).length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      {t('adminschedule.no_tasks_matched')}
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">{t('adminschedule.col_task_name')}</th>
                            <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">{t('adminschedule.col_date')}</th>
                            <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">{t('adminschedule.col_status')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedModalPerson.tasks
                            .filter(t => taskStatusFilters.length === 0 || taskStatusFilters.includes(t.status?.toLowerCase()))
                            .map(task => (
                              <tr key={task.task_id} className="bg-white hover:bg-gray-50/50">
                                <td className="py-3 px-4 font-medium text-gray-900">
                                  <div className="max-w-[200px] truncate" title={task.name || task.title}>
                                    {task.name || task.title}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-500">
                                  {task.due_date 
                                    ? (() => {
                                        const d = new Date(task.due_date);
                                        const day = String(d.getDate()).padStart(2, '0');
                                        const month = String(d.getMonth() + 1).padStart(2, '0');
                                        const year = d.getFullYear();
                                        return `${day}/${month}/${year}`;
                                      })() 
                                    : t('adminschedule.not_available')}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold border shadow-sm
                                    ${task.status?.toLowerCase() === 'in progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                      task.status?.toLowerCase() === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                        'bg-gray-50 text-gray-700 border-gray-200'}
                                  `}>
                                    {task.status?.toLowerCase() === 'pending' ? t('adminschedule.status_pending') :
                                     task.status?.toLowerCase() === 'in progress' ? t('adminschedule.status_in_progress') :
                                     task.status?.toLowerCase() === 'completed' ? t('adminschedule.status_completed') :
                                     task.status}
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
      );
    })()
  )}
    </div>
  );
}
