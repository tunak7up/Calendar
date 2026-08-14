import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../../../services/api';
import { requestService } from '../../../../services/requestService';
import { scheduleService } from '../../../../services/scheduleService';
import { taskService } from '../../../../services/taskService';
import { aiAgentService } from '../../../../services/aiAgentService';

const now = new Date();
const todayStr = now.toISOString().split('T')[0];
const defaultChartStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
const defaultChartEnd = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

const formatDateDisplay = (isoStr) => {
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  return [
    String(d.getDate()).padStart(2, '0'),
    String(d.getMonth() + 1).padStart(2, '0'),
    d.getFullYear(),
  ].join('/');
};

const isOverdue = (task) => {
  if (task.status?.toLowerCase() === 'completed') return false;
  return task.due_date && new Date(task.due_date) < new Date();
};

const getTaskPriority = (task) => {
  if (isOverdue(task)) return 0;
  const s = task.status?.toLowerCase();
  if (s === 'pending') return 1;
  if (s === 'in progress') return 2;
  if (s === 'completed') return 3;
  return 4;
};

export function useAdminDashboard() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);

  const [isCompanyAnalysisModalOpen, setIsCompanyAnalysisModalOpen] = useState(false);
  const [companyAnalysisResult, setCompanyAnalysisResult] = useState('');
  const [companyAnalyzing, setCompanyAnalyzing] = useState(false);
  const [companyAnalysisError, setCompanyAnalysisError] = useState(null);
  const [companyCopied, setCompanyCopied] = useState(false);
  const [analysisMonth, setAnalysisMonth] = useState(new Date().getMonth() + 1);
  const [analysisYear, setAnalysisYear] = useState(new Date().getFullYear());

  const isVi = i18n.language === 'vi';

  const handleAnalyzeCompanyPerformance = async () => {
    setIsCompanyAnalysisModalOpen(true);
    setCompanyAnalyzing(true);
    setCompanyAnalysisError(null);
    setCompanyAnalysisResult('');
    setCompanyCopied(false);

    try {
      const res = await aiAgentService.analyzeCompanyMonthly(analysisMonth, analysisYear);
      if (res.success && res.analysis) {
        setCompanyAnalysisResult(res.analysis);
      } else {
        setCompanyAnalysisError(isVi ? 'Không thể tạo bản phân tích hiệu suất tháng của doanh nghiệp. Vui lòng thử lại.' : 'Failed to generate company monthly review. Please try again.');
      }
    } catch (err) {
      console.error('Error generating AI company analysis:', err);
      setCompanyAnalysisError(err.message || (isVi ? 'Lỗi xử lý AI!' : 'AI processing error!'));
    } finally {
      setCompanyAnalyzing(false);
    }
  };

  const handleCopyCompanyAnalysis = () => {
    navigator.clipboard.writeText(companyAnalysisResult);
    setCompanyCopied(true);
    setTimeout(() => setCompanyCopied(false), 2000);
  };

  const getAttendanceStatus = useCallback((checkIn, checkOut) => {
    if (!checkIn) return { label: t('admindashboard.attendance_not_checkin'), colorClass: 'bg-gray-100 text-gray-500' };

    const hasCheckedOut = !!checkOut;
    const inParts = checkIn.split(':');
    const inHour = parseInt(inParts[0], 10);
    const inMinute = parseInt(inParts[1], 10);
    const isLate = (inHour > 9) || (inHour === 9 && inMinute > 0);

    if (!hasCheckedOut) {
      if (isLate) {
        return { label: t('admindashboard.attendance_late'), colorClass: 'bg-amber-100 text-amber-700 animate-pulse font-bold' };
      }
      return { label: t('admindashboard.attendance_working'), colorClass: 'bg-blue-100 text-blue-700 animate-pulse font-bold' };
    }

    const outParts = checkOut.split(':');
    const outHour = parseInt(outParts[0], 10);
    const outMinute = parseInt(outParts[1], 10);
    const isEarly = (outHour < 17) || (outHour === 17 && outMinute < 30);

    if (isLate && isEarly) {
      return { label: t('admindashboard.attendance_late_early'), colorClass: 'bg-red-100 text-red-700 font-bold' };
    }
    if (isLate) {
      return { label: t('admindashboard.attendance_late'), colorClass: 'bg-amber-100 text-amber-700 font-bold' };
    }
    if (isEarly) {
      return { label: t('admindashboard.attendance_early'), colorClass: 'bg-orange-100 text-orange-700 font-bold' };
    }
    return { label: t('admindashboard.attendance_done'), colorClass: 'bg-emerald-100 text-emerald-700 font-bold' };
  }, [t]);

  const [requests, setRequests] = useState([]);
  const [reports, setReports] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [taskSearchTerm, setTaskSearchTerm] = useState('');

  const [chartStartDate, setChartStartDate] = useState(defaultChartStart);
  const [chartEndDate, setChartEndDate] = useState(defaultChartEnd);
  const [chartLoading, setChartLoading] = useState(false);
  const [allSchedules, setAllSchedules] = useState([]);
  const [allReports, setAllReports] = useState([]);

  const [attendanceDate, setAttendanceDate] = useState(todayStr);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [showAttendanceCalendar, setShowAttendanceCalendar] = useState(false);
  const [inputDateStr, setInputDateStr] = useState(() => formatDateDisplay(todayStr));

  const applyInputDate = (raw) => {
    const parts = raw.replace(/-/g, '/').split('/');
    if (parts.length === 3) {
      const [dd, mm, yyyy] = parts;
      const iso = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
      const d = new Date(iso);
      if (!isNaN(d.getTime())) {
        setAttendanceDate(iso);
        setInputDateStr(formatDateDisplay(iso));
        return;
      }
    }
    setInputDateStr(formatDateDisplay(attendanceDate));
  };

  const handleDateOffset = (offset) => {
    const current = new Date(attendanceDate);
    if (isNaN(current.getTime())) return;
    current.setDate(current.getDate() + offset);
    const newDateStr = current.toISOString().split('T')[0];
    setAttendanceDate(newDateStr);
    setInputDateStr(formatDateDisplay(newDateStr));
  };

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, reqRes, taskRes] = await Promise.all([
        apiFetch('/person'),
        requestService.getAllRequests(),
        taskService.getAllTasks()
      ]);
      if (empRes.success) setEmployees(empRes.data);
      if (reqRes.success) setRequests(reqRes.data);
      if (taskRes.success) setTasks(taskRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAttendanceData = useCallback(async (date) => {
    setAttendanceLoading(true);
    try {
      const [repRes, schedRes] = await Promise.all([
        apiFetch(`/daily-report/range?start=${date}&end=${date}`),
        scheduleService.getSchedulesByRange
          ? scheduleService.getSchedulesByRange(date, date)
          : scheduleService.getAllSchedules()
      ]);
      if (repRes.success) setReports(repRes.data);
      if (schedRes.success) {
        setSchedules(schedRes.data.filter(s => s.working_date && s.working_date.startsWith(date)));
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setAttendanceLoading(false);
    }
  }, []);

  const fetchChartData = useCallback(async () => {
    setChartLoading(true);
    try {
      if (!chartStartDate || !chartEndDate) {
        setAllSchedules([]);
        setAllReports([]);
        setChartLoading(false);
        return;
      }

      const [schedRes, repRes] = await Promise.all([
        scheduleService.getSchedulesByRange(chartStartDate, chartEndDate),
        apiFetch(`/daily-report/range?start=${chartStartDate}&end=${chartEndDate}`)
      ]);

      if (schedRes.success) {
        setAllSchedules(schedRes.data);
      } else {
        setAllSchedules([]);
      }

      if (repRes.success) {
        setAllReports(repRes.data);
      } else {
        setAllReports([]);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setAllSchedules([]);
      setAllReports([]);
    } finally {
      setChartLoading(false);
    }
  }, [chartStartDate, chartEndDate]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);
  useEffect(() => { fetchAttendanceData(attendanceDate); }, [attendanceDate, fetchAttendanceData]);
  useEffect(() => { fetchChartData(); }, [fetchChartData]);

  const pendingRequests = requests.filter(req => req.status?.toLowerCase() === 'pending');

  const getShiftLabel = useCallback((schedule) => {
    if (!schedule) return '';
    const startHour = schedule.start_time ? new Date(schedule.start_time).getHours() : NaN;
    const endHour = schedule.end_time ? new Date(schedule.end_time).getHours() : NaN;
    if (!isNaN(startHour) && !isNaN(endHour)) {
      if (startHour < 12 && endHour >= 17) return t('admindashboard.shift_full');
      if (startHour < 12) return t('admindashboard.shift_morning');
      return t('admindashboard.shift_afternoon');
    }
    const rawStart = schedule.start_time ? schedule.start_time.substring(11, 16) : '--';
    const rawEnd = schedule.end_time ? schedule.end_time.substring(11, 16) : '--';
    return `${rawStart} – ${rawEnd}`;
  }, [t]);

  const todayAttendance = useMemo(() => {
    const scheduledIds = new Set(schedules.map(s => s.person_id));
    const rows = [];
    schedules.forEach(sched => {
      const emp = employees.find(e => e.person_id === sched.person_id);
      if (!emp || emp.role === 'manager') return;
      const report = reports.find(r => r.person_id === sched.person_id);
      rows.push({
        person_id: emp.person_id,
        name: emp.name || emp.username,
        shift: getShiftLabel(sched),
        check_in: report?.check_in || null,
        check_out: report?.check_out || null,
        isUnscheduled: false,
      });
    });
    reports.forEach(rep => {
      if (scheduledIds.has(rep.person_id)) return;
      const emp = employees.find(e => e.person_id === rep.person_id);
      if (!emp || emp.role === 'manager') return;
      rows.push({
        person_id: emp.person_id,
        name: emp.name || emp.username,
        shift: '—',
        check_in: rep.check_in || null,
        check_out: rep.check_out || null,
        isUnscheduled: true,
      });
    });
    return rows;
  }, [schedules, reports, employees, getShiftLabel]);

  const workingCount = useMemo(() => todayAttendance.filter(item => !!item.check_in).length, [todayAttendance]);

  const sortedFilteredTasks = useMemo(() => {
    let list = tasks.filter(task => {
      if (taskSearchTerm) {
        const term = taskSearchTerm.toLowerCase();
        const matchesText = (task.name?.toLowerCase().includes(term) || task.title?.toLowerCase().includes(term)) ||
          (task.participants && Array.isArray(task.participants) && task.participants.some(p => p.name?.toLowerCase().includes(term)));
        if (!matchesText) return false;
      }
      const todayStrLocal = new Date().toISOString().split('T')[0];
      const taskDateStr = task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '';
      const isCompleted = task.status?.toLowerCase() === 'completed';
      if (!taskDateStr) return true;
      if (taskDateStr >= todayStrLocal) return true;
      if (!isCompleted) return true;
      return false;
    });
    list = [...list].sort((a, b) => {
      const diff = getTaskPriority(a) - getTaskPriority(b);
      if (diff !== 0) return diff;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
    return list;
  }, [tasks, taskSearchTerm]);

  const getTaskStatusKey = (task) => {
    if (isOverdue(task)) return 'overdue';
    switch (task.status?.toLowerCase()) {
      case 'completed': return 'completed';
      case 'in progress': return 'in_progress';
      default: return 'pending';
    }
  };

  return {
    t,
    i18n,
    isVi,
    navigate,
    loading,
    formatDateDisplay,
    isCompanyAnalysisModalOpen,
    setIsCompanyAnalysisModalOpen,
    companyAnalysisResult,
    companyAnalyzing,
    companyAnalysisError,
    companyCopied,
    analysisMonth,
    setAnalysisMonth,
    analysisYear,
    setAnalysisYear,
    handleAnalyzeCompanyPerformance,
    handleCopyCompanyAnalysis,
    pendingRequests,
    employees,
    allSchedules,
    allReports,
    chartStartDate,
    setChartStartDate,
    chartEndDate,
    setChartEndDate,
    chartLoading,
    attendanceDate,
    setAttendanceDate,
    attendanceLoading,
    showAttendanceCalendar,
    setShowAttendanceCalendar,
    inputDateStr,
    setInputDateStr,
    applyInputDate,
    handleDateOffset,
    todayAttendance,
    workingCount,
    taskSearchTerm,
    setTaskSearchTerm,
    sortedFilteredTasks,
    getAttendanceStatus,
    getTaskStatusKey,
    isOverdue
  };
}
