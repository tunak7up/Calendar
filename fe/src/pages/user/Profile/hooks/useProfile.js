import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../../../services/api';
import { taskService } from '../../../../services/taskService';
import { scheduleService } from '../../../../services/scheduleService';
import { dailyReportService } from '../../../../services/dailyReportService';
import { aiAgentService } from '../../../../services/aiAgentService';
import { useAuth } from '../../../../context/AuthContext';
import { useTheme } from '../../../../context/ThemeContext';

export function useProfile() {
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { theme } = useTheme();

  const regTheme = useMemo(() => theme?.['[data-custom-component="Schedule-User-Registered"]'] || { bg: '#e0f2fe', text: '#0369a1' }, [theme]);
  const unschedTheme = useMemo(() => theme?.['[data-custom-component="Schedule-User-Unscheduled"]'] || { bg: '#fef3c7', text: '#92400e' }, [theme]);
  const absentTheme = useMemo(() => theme?.['[data-custom-component="Schedule-User-Absent"]'] || { bg: '#ffe4e6', text: '#9f1239' }, [theme]);
  const upcomingTheme = useMemo(() => theme?.['[data-custom-component="Schedule-User-Upcoming"]'] || { bg: '#ede9fe', text: '#6d28d9' }, [theme]);

  const targetId = id || user?.person_id;

  const [profileData, setProfileData] = useState(null);
  const [allSchedules, setAllSchedules] = useState([]);
  const [dailyReports, setDailyReports] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [copied, setCopied] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    if (!targetId) return;

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [personRes, schedRes, tasksRes, repRes] = await Promise.all([
          apiFetch('/person'),
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

  const calendarEvents = useMemo(() => {
    const eventMap = new Map();

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

      let bg = regTheme.bg;
      let border = regTheme.bg;
      let text = regTheme.text;
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
            bg = upcomingTheme.bg;
            border = upcomingTheme.bg;
            text = upcomingTheme.text;
            title = `${shiftStr} (${t('myschedule.legend_upcoming')})`;
          } else {
            bg = absentTheme.bg;
            border = absentTheme.bg;
            text = absentTheme.text;
            customComponent = 'Schedule-User-Absent';
            title = `${shiftStr} (${t('myschedule.legend_absent')})`;
          }
        } else {
          bg = regTheme.bg;
          border = regTheme.bg;
          text = regTheme.text;
          customComponent = 'Schedule-User-Registered';
          title = `${shiftStr} ${checkOutText ? `[${checkInText} - ${checkOutText}]` : `[In: ${checkInText}]`}`;
        }
      } else {
        bg = unschedTheme.bg;
        border = unschedTheme.bg;
        text = unschedTheme.text;
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
  }, [allSchedules, dailyReports, t, regTheme, unschedTheme, absentTheme, upcomingTheme]);

  const selectedDateDetail = useMemo(() => {
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

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const priorityDiff = getStatusPriority(a.status) - getStatusPriority(b.status);
      if (priorityDiff !== 0) return priorityDiff;
      const dateA = new Date(a.due_date || a.created_at || 0).getTime();
      const dateB = new Date(b.due_date || b.created_at || 0).getTime();
      return dateB - dateA;
    });
  }, [tasks]);

  const isOwnProfile = user?.person_id.toString() === targetId?.toString();

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

  return {
    t,
    isVi,
    navigate,
    user,
    isAdmin,
    theme,
    targetId,
    profileData,
    dailyReports,
    tasks,
    sortedTasks,
    loading,
    regTheme,
    unschedTheme,
    absentTheme,
    upcomingTheme,
    calendarEvents,
    selectedDate,
    setSelectedDate,
    selectedDateDetail,
    isDetailModalOpen,
    setIsDetailModalOpen,
    isAnalysisModalOpen,
    setIsAnalysisModalOpen,
    analysisResult,
    analyzing,
    analysisError,
    copied,
    isOwnProfile,
    getTaskStatusLabel,
    getStatusColor,
    handleAssignTask,
    handleAnalyzePerformance,
    handleCopyAnalysis
  };
}
