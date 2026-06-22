import React, { useState, useEffect, useRef, useMemo } from 'react';
import ScheduleCalendar from '../../../components/ScheduleCalendar';
import MiniCalendar from '../../../components/MiniCalendar';
import { apiFetch } from '../../../services/api';
import { taskService } from '../../../services/taskService';
import { scheduleService } from '../../../services/scheduleService';
import { useNavigate } from 'react-router-dom';
import EmployeeMultiFilter from '../../../components/EmployeeMultiFilter';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../context/ThemeContext';
import AdminScheduleModal from './AdminScheduleModal';

export default function AdminSchedule() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(today.getDate()).padStart(2, '0')}`;
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
    apiFetch('/person').then((data) => {
      if (data.success) {
        setEmployees(data.data);
      }
    });
  }, []);

  // Collect all dates that have at least one schedule
  const scheduleDays = [
    ...new Set(
      schedules
        .map((s) => s.start?.split?.(/[T ]/)?.[0])
        .filter(Boolean)
    )
  ];

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

        rawSchedules.forEach((sched) => {
          const dateOnly = sched.working_date
            ? new Date(sched.working_date).toISOString().split('T')[0]
            : null;
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

        rawReports.forEach((rep) => {
          const dateOnly = rep.working_date
            ? new Date(rep.working_date).toISOString().split('T')[0]
            : null;
          if (!dateOnly) return;
          const key = `${rep.person_id}_${dateOnly}`;
          if (eventMap.has(key)) {
            eventMap.get(key).report = rep;
          } else {
            eventMap.set(key, {
              person_id: rep.person_id,
              person: rep.reporter || {
                name: rep.person?.name || `Employee ${rep.person_id}`,
                username: rep.person?.username || `user_${rep.person_id}`
              },
              date: dateOnly,
              schedule: null,
              report: rep
            });
          }
        });

        const mappedSchedules = Array.from(eventMap.values()).map((item) => {
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
      console.error('Failed to load schedules and reports', error);
    }
  };

  const enrichedSchedules = useMemo(() => {
    return schedules.map((e) => {
      const emp = employees.find((empItem) => empItem.person_id === e.person_id);
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
    const baseEvents =
      selectedEmployeeIds.length === 0
        ? enrichedSchedules
        : enrichedSchedules.filter((s) => selectedEmployeeIds.includes(s.person_id.toString()));

    // Aggregate by date into 2 groups: registered and unscheduled
    const aggregated = {}; // key: date -> { registered: 0, unscheduled: 0 }

    baseEvents.forEach((e) => {
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

    const regTheme = theme?.['[data-custom-component="Schedule-Admin-Registered"]'] || {
      bg: '#eff6ff',
      text: '#1e4ed8'
    };
    const unschedTheme = theme?.['[data-custom-component="Schedule-Admin-Unscheduled"]'] || {
      bg: '#fef3c7',
      text: '#92400e'
    };

    const groupEvents = [];
    Object.entries(aggregated).forEach(([date, counts]) => {
      if (counts.registered > 0) {
        groupEvents.push({
          id: `group_registered_${date}`,
          title:
            i18n.language === 'vi'
              ? `Đăng ký: ${counts.registered} người`
              : `Registered: ${counts.registered} ${
                  counts.registered === 1 ? 'person' : 'people'
                }`,
          start: date,
          allDay: true,
          backgroundColor: regTheme.bg,
          borderColor: regTheme.bg,
          textColor: regTheme.text,
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
          title:
            i18n.language === 'vi'
              ? `Ngoài lịch: ${counts.unscheduled} người`
              : `Unscheduled: ${counts.unscheduled} ${
                  counts.unscheduled === 1 ? 'person' : 'people'
                }`,
          start: date,
          allDay: true,
          backgroundColor: unschedTheme.bg,
          borderColor: unschedTheme.bg,
          textColor: unschedTheme.text,
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
  }, [enrichedSchedules, selectedEmployeeIds, i18n.language, theme]);

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

  const fetchModalDataForDate = async (clickedDateStr, defaultGroup = 'registered') => {
    setModalDate(clickedDateStr);
    setIsModalOpen(true);
    setSelectedModalPerson(null);
    setActiveGroup(defaultGroup);
    setModalLoading(true);

    try {
      // Normalize clicked date
      const targetDate = clickedDateStr.split(/[T ]/)[0];
      let peopleWorking = enrichedSchedules.filter((s) => s.start === targetDate);
      if (selectedEmployeeIds.length > 0) {
        peopleWorking = peopleWorking.filter((s) =>
          selectedEmployeeIds.includes(s.person_id.toString())
        );
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
      const reports = reportRes.success ? reportRes.data || [] : [];

      let allTasks = allTasksCache;
      if (!allTasksCache && tasksRes.success) {
        allTasks = tasksRes.data || [];
        setAllTasksCache(allTasks);
      }

      const enrichedData = peopleWorking.map((sched) => {
        let personTasks = [];
        if (allTasks) {
          personTasks = allTasks.filter((t) => {
            if (!t.participants?.some((p) => p.person_id === sched.person_id)) return false;

            const taskStartDate = t.start_time?.split(/[T ]/)[0] || t.due_date?.split(/[T ]/)[0];
            const taskDueDate = t.due_date?.split(/[T ]/)[0];

            return (
              taskStartDate &&
              taskDueDate &&
              targetDate >= taskStartDate &&
              targetDate <= taskDueDate
            );
          });
        }

        const personReport = reports.find((r) => Number(r.person_id) === Number(sched.person_id));
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
          hasSchedule: sched.extendedProps.hasSchedule,
          schedule: sched.extendedProps.schedule || null
        };
      });

      setModalData(enrichedData);
    } catch (error) {
      console.error('Failed to load date details', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDateClick = (arg) => {
    fetchModalDataForDate(arg.dateStr, 'registered');
  };

  const handleEventClick = (eventObj) => {
    const clickedDateStr =
      eventObj.startStr ||
      (eventObj.start instanceof Date
        ? eventObj.start.toISOString().split('T')[0]
        : eventObj.start?.split?.(/[T ]/)?.[0]);
    const groupType = eventObj.extendedProps?.groupType || 'registered';
    fetchModalDataForDate(clickedDateStr, groupType);
  };

  if (!theme) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col lg:flex-row gap-5 lg:gap-8">
        {/* Main Calendar Area */}
        <div className="flex-1 min-w-0">
          {/* Header with title and employee filter */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                {t('adminschedule.title')}
              </h1>
              <p className="text-gray-500 mt-1 text-sm hidden sm:block">
                {t('adminschedule.subtitle')}
              </p>
            </div>

            <div className="w-full sm:w-auto min-w-[280px]">
              <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  {t('adminschedule.filter_employees')}
                </p>
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
              setViewDate((prev) => {
                if (prev && newStart && prev.getTime() === newStart.getTime()) {
                  return prev;
                }
                return newStart;
              });
              fetchSchedulesInRange(startStr, endStr);
            }}
          />
        </div>

        {/* Right Panel — Mini Calendar & Legend */}
        <div className="lg:w-64 lg:shrink-0 bg-white p-4 lg:p-6 rounded-2xl lg:rounded-3xl border border-gray-100 shadow-sm lg:h-fit lg:sticky lg:top-[100px] flex flex-col gap-6">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 lg:mb-6">
              {t('adminschedule.nav_view')}
            </h3>
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
      <AdminScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        modalDate={modalDate}
        modalLoading={modalLoading}
        modalData={modalData}
        selectedPerson={selectedModalPerson}
        setSelectedPerson={setSelectedModalPerson}
        activeGroup={activeGroup}
        setActiveGroup={setActiveGroup}
        taskStatusFilters={taskStatusFilters}
        setTaskStatusFilters={setTaskStatusFilters}
        navigate={navigate}
        t={t}
        i18n={i18n}
      />
    </div>
  );
}
