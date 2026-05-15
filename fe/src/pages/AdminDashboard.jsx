import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardDocumentCheckIcon,
  ClockIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { requestService } from '../services/requestService';
import { scheduleService } from '../services/scheduleService';
import { taskService } from '../services/taskService';
import SortableTable from '../components/SortableTable';
import WorkHoursChart from '../components/WorkHoursChart';
import DateRangeFilter from '../components/DateRangeFilter';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Data states
  const [requests, setRequests] = useState([]);
  const [reports, setReports] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Filter / pagination for tasks
  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  const [taskPage, setTaskPage] = useState(1);
  const taskPageSize = 8;

  // Chart data
  const [allSchedules, setAllSchedules] = useState([]);
  const [allReports, setAllReports] = useState([]);

  // Chart date range — default: current month
  const now = new Date();
  const defaultChartStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const defaultChartEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  const [chartStartDate, setChartStartDate] = useState(defaultChartStart);
  const [chartEndDate, setChartEndDate] = useState(defaultChartEnd);
  const [chartLoading, setChartLoading] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => { fetchDashboardData(); }, []);
  useEffect(() => { fetchChartData(); }, [chartStartDate, chartEndDate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [empRes, reqRes, repRes, schedRes, taskRes] = await Promise.all([
        apiFetch('/person'),
        requestService.getAllRequests(),
        apiFetch(`/daily-report/range?start=${todayStr}&end=${todayStr}`),
        scheduleService.getSchedulesByRange
          ? scheduleService.getSchedulesByRange(todayStr, todayStr)
          : scheduleService.getAllSchedules(),
        taskService.getAllTasks()
      ]);
      if (empRes.success) setEmployees(empRes.data);
      if (reqRes.success) setRequests(reqRes.data);
      if (repRes.success) setReports(repRes.data);
      if (schedRes.success) {
        setSchedules(schedRes.data.filter(s => s.working_date && s.working_date.startsWith(todayStr)));
      }
      if (taskRes.success) setTasks(taskRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    setChartLoading(true);
    try {
      const [schedRes, repRes] = await Promise.all([
        scheduleService.getSchedulesByRange
          ? scheduleService.getSchedulesByRange(chartStartDate, chartEndDate)
          : scheduleService.getAllSchedules(),
        apiFetch(`/daily-report/range?start=${chartStartDate}&end=${chartEndDate}`)
      ]);
      if (schedRes.success) setAllSchedules(schedRes.data);
      if (repRes.success) setAllReports(repRes.data);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setChartLoading(false);
    }
  };

  // ---------- Processed Data ----------

  const pendingRequests = requests.filter(req => req.status?.toLowerCase() === 'pending');

  const getShiftLabel = (schedule) => {
    if (!schedule) return '';
    const startHour = schedule.start_time ? new Date(schedule.start_time).getHours() : NaN;
    const endHour = schedule.end_time ? new Date(schedule.end_time).getHours() : NaN;
    if (!isNaN(startHour) && !isNaN(endHour)) {
      if (startHour < 12 && endHour >= 17) return 'Cả ngày';
      if (startHour < 12) return 'Sáng';
      return 'Chiều';
    }
    const rawStart = schedule.start_time ? schedule.start_time.substring(11, 16) : '--';
    const rawEnd = schedule.end_time ? schedule.end_time.substring(11, 16) : '--';
    return `${rawStart} – ${rawEnd}`;
  };

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
        statusType: report?.check_out ? 'done' : report?.check_in ? 'in' : 'absent',
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
        statusType: rep.check_out ? 'done' : rep.check_in ? 'in' : 'absent',
        isUnscheduled: true,
      });
    });
    return rows;
  }, [schedules, reports, employees]);

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

  const sortedFilteredTasks = useMemo(() => {
    let list = tasks.filter(task => {
      if (!taskSearchTerm) return true;
      const term = taskSearchTerm.toLowerCase();
      if (task.name?.toLowerCase().includes(term) || task.title?.toLowerCase().includes(term)) return true;
      if (task.participants && Array.isArray(task.participants)) {
        return task.participants.some(p => p.name?.toLowerCase().includes(term));
      }
      return false;
    });
    list = [...list].sort((a, b) => {
      const diff = getTaskPriority(a) - getTaskPriority(b);
      if (diff !== 0) return diff;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
    return list;
  }, [tasks, taskSearchTerm]);

  const getTaskStatusBadge = (task) => {
    if (isOverdue(task)) return <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-md font-bold uppercase">Quá hạn</span>;
    switch (task.status?.toLowerCase()) {
      case 'completed': return <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold uppercase">Hoàn thành</span>;
      case 'in progress': return <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-bold uppercase">Đang thực hiện</span>;
      default: return <span className="text-[10px] bg-gray-100 text-gray-800 px-2 py-0.5 rounded-md font-bold uppercase">Chờ xử lý</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:h-[calc(100vh-90px)] gap-4 pb-10 lg:pb-0 lg:-mb-16">

      {/* ── Header ── */}
      <div className="flex-none flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Bảng điều khiển Quản trị</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Tổng quan hoạt động hôm nay và công việc đang chờ</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Pending requests badge button */}
          <button
            onClick={() => navigate('/admin/requests')}
            className="relative flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-amber-200 shadow-sm hover:border-amber-400 hover:shadow-md transition-all group"
            title="Xem yêu cầu đang chờ"
          >
            <ClipboardDocumentCheckIcon className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-semibold text-gray-700 group-hover:text-amber-700">Yêu cầu chờ duyệt</span>
            {pendingRequests.length > 0 ? (
              <span className="flex items-center justify-center min-w-[1.5rem] h-6 px-1 bg-amber-500 text-white text-xs font-extrabold rounded-full shadow-sm animate-pulse">
                {pendingRequests.length > 99 ? '99+' : pendingRequests.length}
              </span>
            ) : (
              <span className="flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-600 text-xs font-extrabold rounded-full">✓</span>
            )}
          </button>

          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
            <CalendarDaysIcon className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-gray-800 text-sm">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* ── 1. Work Hours Chart ── */}
      <div className="flex-none h-[650px] lg:h-[45%] lg:min-h-[280px] bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50/50">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 whitespace-nowrap">
            <ClockIcon className="w-5 h-5 text-violet-500" />
            So sánh giờ đăng ký & thực tế
          </h2>
          <DateRangeFilter
            startDate={chartStartDate}
            endDate={chartEndDate}
            onRangeChange={(start, end) => { setChartStartDate(start); setChartEndDate(end); }}
          />
        </div>
        <div className="flex-1 p-4 min-h-0">
          {chartLoading ? (
            <div className="flex items-center justify-center h-full gap-3 text-gray-400">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-violet-500 rounded-full animate-spin" />
              Đang tải dữ liệu...
            </div>
          ) : (
            <WorkHoursChart
              employees={employees}
              schedules={allSchedules}
              dailyReports={allReports}
              startDate={chartStartDate}
              endDate={chartEndDate}
            />
          )}
        </div>
      </div>

      {/* ── 2. Attendance + Tasks side by side ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:min-h-0">

        {/* Attendance */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[400px] lg:h-full overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-blue-500" />
              Điểm danh hôm nay
            </h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">{todayAttendance.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white sticky top-0 border-b border-gray-100 shadow-sm z-10">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nhân viên</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ca</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vào/Ra</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {todayAttendance.length === 0 ? (
                  <tr><td colSpan="4" className="px-5 py-8 text-center text-gray-400">Không có nhân viên nào có lịch hoặc điểm danh hôm nay.</td></tr>
                ) : (
                  todayAttendance.map(emp => (
                    <tr key={emp.person_id} className={`hover:bg-gray-50/50 transition-colors ${emp.isUnscheduled ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-4 py-2.5">
                        <span className="font-semibold text-gray-900 text-xs">{emp.name}</span>
                        {emp.isUnscheduled && <span className="ml-1.5 text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase">Ngoài lịch</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        {emp.shift !== '—' ? (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${emp.shift === 'Sáng' ? 'bg-yellow-100 text-yellow-700' : emp.shift === 'Chiều' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>
                            {emp.shift}
                          </span>
                        ) : <span className="text-gray-400 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-500 font-mono">
                        {emp.check_in ? emp.check_in.substring(0, 5) : '--:--'} – {emp.check_out ? emp.check_out.substring(0, 5) : '--:--'}
                      </td>
                      <td className="px-4 py-2.5">
                        {emp.statusType === 'done' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">Hoàn thành</span>}
                        {emp.statusType === 'in'   && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase animate-pulse">Đã check-in</span>}
                        {emp.statusType === 'absent' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500 uppercase">Chưa check-in</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex-none px-5 py-2 border-t border-gray-100 bg-gray-50/50">
            <button onClick={() => navigate('/admin/work-hours')} className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 w-full justify-center">
              Báo cáo công việc chi tiết <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tasks Overview */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[400px] lg:h-full overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50/50">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 whitespace-nowrap">
              <ClipboardDocumentListIcon className="w-5 h-5 text-emerald-500" />
              Tổng quan công việc
              <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{sortedFilteredTasks.length}</span>
            </h2>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-40">
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Lọc..."
                  value={taskSearchTerm}
                  onChange={e => { setTaskSearchTerm(e.target.value); setTaskPage(1); }}
                  className="w-full pl-9 pr-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
              <button
                onClick={() => navigate('/tasks/add')}
                className="bg-[#0056b3] hover:bg-blue-700 text-white p-1 rounded-lg shadow-sm transition-colors shrink-0"
                title="Tạo công việc nhanh"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white sticky top-0 border-b border-gray-100 shadow-sm z-10">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Công việc</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Hạn chót</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedFilteredTasks.length === 0 ? (
                  <tr><td colSpan="3" className="px-5 py-8 text-center text-gray-400">Không tìm thấy công việc nào.</td></tr>
                ) : (
                  sortedFilteredTasks.map(task => (
                    <tr
                      key={task.task_id || task.id}
                      onClick={() => navigate(`/tasks/${task.task_id || task.id}`)}
                      className={`hover:bg-gray-50/70 transition-colors cursor-pointer ${isOverdue(task) ? 'bg-red-50/30' : ''}`}
                    >
                      <td className="px-4 py-2.5">
                        <p className="font-bold text-gray-900 text-xs line-clamp-1">{task.name || task.title}</p>
                        {task.participants && task.participants.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {task.participants.slice(0, 2).map(p => (
                              <span key={p.person_id} className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{p.name}</span>
                            ))}
                            {task.participants.length > 2 && <span className="text-[9px] text-gray-400">+{task.participants.length - 2}</span>}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }) : '—'}
                      </td>
                      <td className="px-4 py-2.5">{getTaskStatusBadge(task)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex-none px-5 py-2 border-t border-gray-100 bg-gray-50/50">
            <button onClick={() => navigate('/tasks')} className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 w-full justify-center">
              Xem danh sách công việc <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
