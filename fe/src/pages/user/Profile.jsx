import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { taskService } from '../../services/taskService';
import { scheduleService } from '../../services/scheduleService';
import { dailyReportService } from '../../services/dailyReportService';
import { aiAgentService } from '../../services/aiAgentService';
import { useAuth } from '../../context/AuthContext';
import ScheduleCalendar from '../../components/ScheduleCalendar';
import { useTranslation } from 'react-i18next';
import ProfileWorkHoursChart from '../../components/ProfileWorkHoursChart';
import BackButton from '../../components/BackButton';
import { useTheme } from '../../context/ThemeContext';
import PWASettings from '../../components/PWASettings';

import {
  ArrowLeftIcon,
  UserIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  ClockIcon,
  PlusIcon,
  CheckCircleIcon,
  XMarkIcon,
  SparklesIcon,
  ArrowPathIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export default function Profile() {
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { theme } = useTheme();

  const regTheme = React.useMemo(() => theme?.['[data-custom-component="Schedule-User-Registered"]'] || { bg: '#e0f2fe', text: '#0369a1' }, [theme]);
  const unschedTheme = React.useMemo(() => theme?.['[data-custom-component="Schedule-User-Unscheduled"]'] || { bg: '#fef3c7', text: '#92400e' }, [theme]);
  const absentTheme = React.useMemo(() => theme?.['[data-custom-component="Schedule-User-Absent"]'] || { bg: '#ffe4e6', text: '#9f1239' }, [theme]);
  const upcomingTheme = React.useMemo(() => theme?.['[data-custom-component="Schedule-User-Upcoming"]'] || { bg: '#ede9fe', text: '#6d28d9' }, [theme]);

  // If no ID is provided, assume viewing own profile
  const targetId = id || user?.person_id;

  const [profileData, setProfileData] = useState(null);
  const [allSchedules, setAllSchedules] = useState([]);
  const [dailyReports, setDailyReports] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // States for AI Performance Analysis
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [copied, setCopied] = useState(false);

  // States for ScheduleCalendar
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    if (!targetId) return;

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [personRes, schedRes, tasksRes, repRes] = await Promise.all([
          apiFetch(`/person`), // Fetch all and find, or if there's a /person/:id endpoint, use it. Wait, apiFetch('/person') gets all.
          scheduleService.getScheduleByPersonId(targetId),
          taskService.getAllTasksByParticipantId(targetId),
          dailyReportService.getDailyReportByPersonId(targetId)
        ]);

        if (personRes.success) {
          const person = personRes.data.find(p => p.person_id.toString() === targetId.toString());
          if (person) {
            setProfileData(person);
          }
        }

        if (schedRes.success) {
          setAllSchedules(schedRes.data);
        }

        if (tasksRes.success) {
          setTasks(tasksRes.data);
        }

        if (repRes.success) {
          setDailyReports(repRes.data);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [targetId]);

  const calendarEvents = React.useMemo(() => {
    const eventMap = new Map(); // key: date string -> { schedule, report }

    allSchedules.forEach(sched => {
      const dateOnly = sched.working_date ? sched.working_date.split(/[T ]/)[0] : null;
      if (!dateOnly) return;
      eventMap.set(dateOnly, {
        date: dateOnly,
        schedule: sched,
        report: null
      });
    });

    dailyReports.forEach(rep => {
      const dateOnly = rep.working_date ? rep.working_date.split(/[T ]/)[0] : null;
      if (!dateOnly) return;
      if (eventMap.has(dateOnly)) {
        eventMap.get(dateOnly).report = rep;
      } else {
        eventMap.set(dateOnly, {
          date: dateOnly,
          schedule: null,
          report: rep
        });
      }
    });

    return Array.from(eventMap.values()).map(item => {
      const hasSchedule = !!item.schedule;
      const checkIn = item.report?.check_in || null;
      const checkOut = item.report?.check_out || null;

      // Default blue colors for "đi làm đúng lịch"
      let bg = regTheme.bg; // blue-100
      let border = regTheme.bg; // blue-300
      let text = regTheme.text; // blue-800
      let title = '';
      let customComponent = null;

      const checkInText = checkIn ? checkIn.slice(0, 5) : null;
      const checkOutText = checkOut ? checkOut.slice(0, 5) : null;

      if (hasSchedule) {
        let shiftStr = '';
        if (item.schedule.start_time && item.schedule.end_time) {
          const sTime = new Date(item.schedule.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
          const eTime = new Date(item.schedule.end_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
          shiftStr = `${sTime} - ${eTime}`;
        }

        if (!checkIn) {
          const todayStr = new Date().toISOString().split('T')[0];
          const now = new Date();
          const isFuture = item.date > todayStr || (item.date === todayStr && item.schedule.start_time && new Date(item.schedule.start_time) > now);

          if (isFuture) {
            // Lịch tương lai chưa đến giờ làm -> Màu xám
            bg = upcomingTheme.bg;
            border = upcomingTheme.bg;
            text = upcomingTheme.text;
            title = `${shiftStr} (${t('myschedule.legend_upcoming')})`;
          } else {
            // Có lịch nhưng vắng (Đỏ)
            bg = absentTheme.bg;
            border = absentTheme.bg;
            text = absentTheme.text;
            customComponent = 'Schedule-User-Absent';
            title = `${shiftStr} (${t('myschedule.legend_absent')})`;
          }
        } else {
          // Đi làm đúng lịch -> Xanh dương
          bg = regTheme.bg;
          border = regTheme.bg;
          text = regTheme.text;
          customComponent = 'Schedule-User-Registered';
          title = `${shiftStr} ${checkOutText ? `[${checkInText} - ${checkOutText}]` : `[In: ${checkInText}]`}`;
        }
      } else {
        // Ngoài lịch -> Màu vàng
        bg = unschedTheme.bg; // amber-100
        border = unschedTheme.bg; // amber-300
        text = unschedTheme.text; // amber-800
        customComponent = 'Schedule-User-Unscheduled';
        title = `${t('myschedule.unscheduled')} ${checkOutText ? `[${checkInText} - ${checkOutText}]` : `[In: ${checkInText}]`}`;
      }

      return {
        id: `event_${item.date}`,
        title,
        start: item.date,
        allDay: true,
        backgroundColor: bg,
        borderColor: border,
        textColor: text,
        extendedProps: {
          ...item,
          customComponent
        }
      };
    });
  }, [allSchedules, dailyReports, t, regTheme, unschedTheme]);

  const selectedDateDetail = React.useMemo(() => {
    const sched = allSchedules.find(s => s.working_date && s.working_date.split(/[T ]/)[0] === selectedDate);
    const report = dailyReports.find(r => r.working_date && r.working_date.split(/[T ]/)[0] === selectedDate);
    return { schedule: sched, report };
  }, [selectedDate, allSchedules, dailyReports]);

  const getTaskStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return t('status.completed');
      case 'in progress': return t('status.in_progress');
      case 'pending': return t('status.pending');
      case 'overdue': return t('status.overdue');
      case 'in review': case 'in_review': return t('status.in_review');
      default: return status || t('status.pending');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'in progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusPriority = (status) => {
    switch (status?.toLowerCase()) {
      case 'overdue': return 0;
      case 'in progress': return 1;
      case 'pending': return 2;
      default: return 3;
    }
  };

  const sortedTasks = React.useMemo(() => {
    return [...tasks].sort((a, b) => {
      const priorityDiff = getStatusPriority(a.status) - getStatusPriority(b.status);
      if (priorityDiff !== 0) return priorityDiff;
      // Within same priority group: newest first (by due_date, fallback created_at)
      const dateA = new Date(a.due_date || a.created_at || 0).getTime();
      const dateB = new Date(b.due_date || b.created_at || 0).getTime();
      return dateB - dateA;
    });
  }, [tasks]);

  if (loading || !theme) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 font-semibold">{t('profile.loading')}</div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('profile.not_found')}</h2>
          <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">{t('history.back')}</button>
        </div>
      </div>
    );
  }

  const isOwnProfile = user?.person_id.toString() === targetId.toString();

  const handleAssignTask = () => {
    navigate('/tasks/add', {
      state: {
        assignee: {
          person_id: profileData.person_id,
          username: profileData.username,
          name: profileData.name,
          role: 'assignee'
        }
      }
    });
  };

  const handleAnalyzePerformance = async () => {
    setIsAnalysisModalOpen(true);
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult('');
    setCopied(false);

    try {
      const res = await aiAgentService.analyzePerformance(targetId);
      if (res.success && res.analysis) {
        setAnalysisResult(res.analysis);
      } else {
        setAnalysisError(isVi ? 'Không thể tạo bản đánh giá. Vui lòng thử lại.' : 'Failed to generate review. Please try again.');
      }
    } catch (err) {
      console.error('Error generating AI performance analysis:', err);
      setAnalysisError(err.message || (isVi ? 'Lỗi xử lý AI!' : 'AI processing error!'));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopyAnalysis = () => {
    navigator.clipboard.writeText(analysisResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  return (
    <div className="space-y-6 pb-20">
      {/* Header Actions */}
      <div className="flex items-center justify-between gap-2">
        <BackButton />

        <div className="flex items-center gap-1.5 sm:gap-3">
          {isAdmin && (
            <button
              onClick={handleAnalyzePerformance}
              className="flex items-center gap-1 sm:gap-2 bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-purple-500/20 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <SparklesIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>{isVi ? 'Phân tích AI' : 'AI Analysis'}</span>
            </button>
          )}

          {isAdmin && !isOwnProfile && (
            <button
              onClick={handleAssignTask}
              data-customizable-id="btn-profile-assign-task"
              data-customizable-type="bg"
              className="flex items-center gap-1 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-purple-500/20 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <PlusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>{t('profile.assign_task')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative shrink-0">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || profileData.username)}&background=101c23&color=12a4d9&rounded=true&size=120`}
              alt="Profile"
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-lg"
            />
            {profileData.status && (
              <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight" data-customizable-id="profile-name" data-customizable-type="text">{profileData.name}</h1>
            <p className="text-gray-500 font-medium mt-1" data-customizable-id="profile-username" data-customizable-type="text">@{profileData.username}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100 uppercase tracking-wider" data-customizable-id="profile-role-badge" data-customizable-type="bg">
                <BriefcaseIcon className="w-4 h-4" />
                {profileData.role === 'manager' ? t('profile.role_manager') : t('profile.role_employee')}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border uppercase tracking-wider ${profileData.status ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`} data-customizable-id="profile-status-badge" data-customizable-type="bg">
                <ShieldCheckIcon className="w-4 h-4" />
                {profileData.status ? t('profile.active') : t('profile.inactive')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Tasks */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-6 flex flex-col h-[320px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                <CheckCircleIcon className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">{t('profile.tasks_list')}</h2>
            </div>
            <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-lg">
              {tasks.length} {t('profile.total')}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 max-h-[220px] space-y-3">
            {tasks.length === 0 ? (
              <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-sm font-semibold text-gray-400">{t('profile.no_tasks')}</p>
              </div>
            ) : (
              sortedTasks.map((task) => (
                <div key={task.task_id} onClick={() => navigate(`/tasks/${task.task_id}`)} className="p-4 rounded-2xl border border-gray-100 bg-[#f8fafc] hover:border-purple-200 hover:shadow-sm transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-purple-700 transition-colors truncate max-w-[200px] sm:max-w-xs md:max-w-md" title={task.name || task.title}>{task.name || task.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(task.status)} border`}>
                      {getTaskStatusLabel(task.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-3.5 h-3.5" />
                      {t('profile.due')}: {(() => {
                        const d = new Date(task.due_date);
                        if (isNaN(d.getTime())) return 'N/A';
                        const day = String(d.getDate()).padStart(2, '0');
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const year = d.getFullYear();
                        return `${day}/${month}/${year}`;
                      })()}
                    </div>
                    <div className="flex items-center gap-1 text-purple-600">
                      {t('profile.role')}: {
                        task.role
                          ? (task.role.toLowerCase() === 'assignee'
                            ? t('tasks.role_assignee')
                            : (task.role.toLowerCase() === 'assigner'
                              ? t('tasks.role_assigner')
                              : task.role))
                          : t('tasks.role_assignee')
                      }
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Work Hours Chart */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-[320px]">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-violet-600" />
              {t('profile.monthly_hours')}
            </h2>
          </div>
          <div className="p-4 flex-1 flex flex-col justify-center">
            <ProfileWorkHoursChart dailyReports={dailyReports} />
          </div>
        </div>
      </div>

      {isOwnProfile && <PWASettings />}

      <div className="grid grid-cols-1 gap-6">
        {/* FullCalendar Schedule */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CalendarDaysIcon className="w-5 h-5 text-blue-600" />
              {t('myschedule.work_title')}
            </h2>
          </div>
          <div className="p-4 flex-1">
            {/* Color Legend Bar */}
            <div className="flex flex-wrap gap-3 mb-5 text-[10px] font-bold text-gray-500 bg-gray-50/50 p-3 rounded-2xl border border-gray-100 shadow-inner">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border" data-custom-component="Schedule-User-Registered" style={{ backgroundColor: regTheme.bg, borderColor: regTheme.bg }}></span>
                <span style={{ color: regTheme.text }}>{t('myschedule.legend_scheduled')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border" data-custom-component="Schedule-User-Unscheduled" style={{ backgroundColor: unschedTheme.bg, borderColor: unschedTheme.bg }}></span>
                <span style={{ color: unschedTheme.text }}>{t('myschedule.legend_unscheduled')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border" data-custom-component="Schedule-User-Absent" style={{ backgroundColor: absentTheme.bg, borderColor: absentTheme.bg }}></span>
                <span style={{ color: absentTheme.text }}>{t('myschedule.legend_absent')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border" data-custom-component="Schedule-User-Upcoming" style={{ backgroundColor: upcomingTheme.bg, borderColor: upcomingTheme.bg }}></span>
                <span style={{ color: upcomingTheme.text }}>{t('myschedule.legend_upcoming')}</span>
              </div>
            </div>

            <ScheduleCalendar
              initialDate={selectedDate}
              events={calendarEvents}
              selectedDate={selectedDate}
              onDateClick={(arg) => {
                setSelectedDate(arg.dateStr);
                setIsDetailModalOpen(true);
              }}
              onEventClick={(event) => {
                const dateStr = event.startStr || (event.start instanceof Date ? event.start.toISOString().split('T')[0] : event.start?.split?.(/[T ]/)?.[0]);
                if (dateStr) {
                  setSelectedDate(dateStr);
                  setIsDetailModalOpen(true);
                }
              }}
              onDatesSet={() => { }}
            />
          </div>
        </div>
      </div>

      {/* Workday Details Modal */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <ClockIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {i18n.language === 'vi' ? 'Chi tiết ngày làm việc' : 'Workday Details'}
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400">
                    {(() => {
                      const [year, month, day] = selectedDate.split('-');
                      return `${day}/${month}/${year}`;
                    })()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {(() => {
                const { schedule, report } = selectedDateDetail;
                const hasSchedule = !!schedule;
                const checkIn = report?.check_in || null;
                const checkOut = report?.check_out || null;

                if (!hasSchedule && !checkIn) {
                  return (
                    <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                      <p className="text-sm font-semibold text-gray-400">
                        {i18n.language === 'vi' ? 'Không có lịch làm việc và chấm công trong ngày này' : 'No schedule or attendance on this day'}
                      </p>
                    </div>
                  );
                }

                let statusLabel = '';
                let statusColorClass = '';
                if (hasSchedule) {
                  if (checkIn) {
                    statusLabel = i18n.language === 'vi' ? 'Đi làm đúng lịch' : 'Worked (Scheduled)';
                    statusColorClass = 'bg-blue-50 text-blue-700 border-blue-100';
                  } else {
                    statusLabel = i18n.language === 'vi' ? 'Vắng / Chưa check-in' : 'Absent / No Check-in';
                    statusColorClass = 'bg-red-50 text-red-700 border-red-100';
                  }
                } else {
                  statusLabel = i18n.language === 'vi' ? 'Đi làm ngoài lịch' : 'Unscheduled Work';
                  statusColorClass = 'bg-amber-50 text-amber-700 border-amber-100';
                }

                return (
                  <div className="space-y-5">
                    <div className="flex justify-center">
                      <span className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold border uppercase tracking-wider ${statusColorClass} shadow-sm`}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                      <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
                        <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1 block">
                          {i18n.language === 'vi' ? 'Ca đăng ký' : 'Registered Shift'}
                        </span>
                        {hasSchedule ? (
                          <span className="text-sm font-bold text-gray-800">
                            {new Date(schedule.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(schedule.end_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400 italic font-semibold">
                            {i18n.language === 'vi' ? 'Không có ca đăng ký' : 'No registered shift'}
                          </span>
                        )}
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
                        <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1 block">
                          {i18n.language === 'vi' ? 'Giờ điểm danh' : 'Attendance Time'}
                        </span>
                        {checkIn ? (
                          <div className="flex items-center gap-3 text-sm font-bold text-gray-800">
                            <span className="text-emerald-600">In: {checkIn.slice(0, 5)}</span>
                            <span className="text-blue-600">Out: {checkOut ? checkOut.slice(0, 5) : '--:--'}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic font-semibold">
                            {i18n.language === 'vi' ? 'Chưa chấm công' : 'No check-in record'}
                          </span>
                        )}
                      </div>
                    </div>

                    {checkIn && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                          {i18n.language === 'vi' ? 'Nội dung báo cáo hàng ngày' : 'Daily Report Content'}
                        </span>
                        <div className="bg-white border border-gray-100 rounded-2xl p-4 min-h-[120px] shadow-sm text-sm text-gray-700 whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                          {report?.description || (
                            <span className="text-gray-400 italic">
                              {i18n.language === 'vi' ? 'Không có mô tả báo cáo' : 'No report description'}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                {i18n.language === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Performance Analysis Modal */}
      {isAnalysisModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-10 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                  <SparklesIcon className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">
                    {isVi ? 'Đánh giá Hiệu suất Nhân sự bằng AI' : 'AI Employee Performance Review'}
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400">
                    {isVi ? `Đánh giá cho: ${profileData.name}` : `Assessment for: ${profileData.name}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAnalysisModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              {analyzing ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <ArrowPathIcon className="animate-spin h-10 w-10 text-purple-600" />
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-700">
                      {isVi ? 'AI đang tổng hợp và phân tích dữ liệu hiệu suất...' : 'AI is compiling and analyzing performance data...'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {isVi ? 'Quy trình bao gồm kiểm tra giờ công, lịch sử đi muộn và tình hình hoàn thành task.' : 'Checking actual working hours, lateness count, and task completion rate.'}
                    </p>
                  </div>
                </div>
              ) : analysisError ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-red-600">
                  <XMarkIcon className="w-12 h-12 text-red-500 bg-red-50 p-2.5 rounded-full mb-3" />
                  <p className="font-bold text-sm">{analysisError}</p>
                  <button
                    onClick={handleAnalyzePerformance}
                    className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {isVi ? 'Thử lại' : 'Try Again'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-4 flex gap-3 text-purple-900 text-xs">
                    <DocumentTextIcon className="w-5 h-5 shrink-0 text-purple-600" />
                    <div>
                      <p className="font-bold">{isVi ? 'Nhận xét từ Hệ thống AI Agent' : 'Insights from AI Agent'}</p>
                      <p className="text-purple-700 mt-0.5 leading-relaxed">
                        {isVi 
                          ? 'Bản phân tích được tổng hợp hoàn toàn tự động từ dữ liệu chuyên cần, báo cáo ngày và công việc của nhân sự trong kỳ đánh giá.'
                          : 'This analysis is generated automatically from attendance records, daily logs, and task details.'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#f8fafc] border border-gray-100 rounded-2xl p-6 shadow-inner text-sm text-gray-800 leading-relaxed font-semibold whitespace-pre-wrap font-sans max-h-[50vh] overflow-y-auto">
                    {analysisResult}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center gap-3">
              <div>
                {!analyzing && !analysisError && analysisResult && (
                  <button
                    onClick={handleCopyAnalysis}
                    className="py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-sm transition-all cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">{isVi ? 'Đã sao chép!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <DocumentTextIcon className="w-4 h-4 text-gray-500" />
                        <span>{isVi ? 'Sao chép kết quả' : 'Copy Result'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAnalysisModalOpen(false)}
                  className="py-2.5 px-5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  {isVi ? 'Đóng lại' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}