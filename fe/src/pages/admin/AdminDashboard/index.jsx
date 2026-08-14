import React from 'react';
import {
  ClipboardDocumentCheckIcon,
  ClockIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import WorkHoursChart from '../../../components/WorkHoursChart';
import DateRangeFilter from '../../../components/DateRangeFilter';
import MiniCalendar from '../../../components/MiniCalendar';
import { useAdminDashboard } from './hooks/useAdminDashboard';

export default function AdminDashboard() {
  const {
    t,
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
  } = useAdminDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:h-[calc(100vh-90px)] gap-4 pb-10 lg:pb-0 lg:-mb-16">
      {/* Header */}
      <div className="flex-none flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight" data-customizable-id="admin-dashboard-title" data-customizable-type="text">{t('admindashboard.title')}</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base" data-customizable-id="admin-dashboard-subtitle" data-customizable-type="text">{t('admindashboard.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleAnalyzeCompanyPerformance}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-purple-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <SparklesIcon className="w-4.5 h-4.5 text-white animate-pulse" />
            <span className="text-xs font-extrabold uppercase tracking-wider">{isVi ? 'Phân tích tháng bằng AI' : 'AI Monthly Analysis'}</span>
          </button>

          <button
            onClick={() => navigate('/admin/requests')}
            data-customizable-id="btn-admin-dashboard-requests"
            data-customizable-type="bg"
            className="relative flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-amber-200 shadow-sm hover:border-amber-400 hover:shadow-md transition-all group"
            title={t('admindashboard.pending_requests')}
          >
            <ClipboardDocumentCheckIcon className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-semibold text-gray-700 group-hover:text-amber-700">{t('admindashboard.pending_requests')}</span>
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
              {(() => {
                const d = new Date();
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                const weekday = d.toLocaleDateString(isVi ? 'vi-VN' : 'en-US', { weekday: 'long' });
                return `${weekday}, ${day}/${month}/${year}`;
              })()}
            </span>
          </div>
        </div>
      </div>

      {/* 1. Work Hours Chart */}
      <div className="flex-none h-[650px] lg:h-[45%] lg:min-h-[280px] bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:flex-wrap justify-between items-start sm:items-center gap-3 bg-gray-50/50">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 whitespace-nowrap">
            <ClockIcon className="w-5 h-5 text-violet-500" />
            {t('admindashboard.chart_title')}
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
              {t('admindashboard.loading_chart')}
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

      {/* 2. Attendance + Tasks side by side */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:min-h-0">
        {/* Attendance */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[400px] lg:h-full overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex flex-col gap-2.5">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-blue-500" />
                {t('admindashboard.attendance_title')}
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full ml-1">
                  {t('admindashboard.attendance_count', { count: workingCount })}
                </span>
              </h2>
              <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-xl border border-gray-200 shadow-sm relative">
                <button
                  type="button"
                  onClick={() => handleDateOffset(-1)}
                  title={t('common.previous_day') || 'Ngày trước'}
                  className="p-1 rounded-lg text-gray-500 hover:bg-white hover:shadow-sm hover:text-gray-700 hover:border-gray-200/50 border border-transparent transition-all cursor-pointer"
                >
                  <ChevronLeftIcon className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center">
                  <input
                    type="text"
                    value={inputDateStr}
                    placeholder="dd/mm/yyyy"
                    onChange={(e) => setInputDateStr(e.target.value)}
                    onBlur={(e) => applyInputDate(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                    className="w-[90px] px-2 py-1 text-xs font-mono font-bold text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAttendanceCalendar((v) => !v)}
                    title="Chọn ngày"
                    className="ml-1 p-1 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200/50 transition-all cursor-pointer"
                  >
                    <CalendarDaysIcon className="w-3.5 h-3.5" />
                  </button>

                  {showAttendanceCalendar && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowAttendanceCalendar(false)} />
                      <div className="absolute top-full left-0 sm:left-auto sm:right-0 z-50 mt-2 p-4 bg-white border border-gray-200 shadow-2xl rounded-2xl w-[280px]">
                        <MiniCalendar
                          selectedDate={attendanceDate}
                          onSelectDate={(date) => {
                            setAttendanceDate(date);
                            setInputDateStr(formatDateDisplay(date));
                            setShowAttendanceCalendar(false);
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDateOffset(1)}
                  title={t('common.next_day') || 'Ngày tiếp theo'}
                  className="p-1 rounded-lg text-gray-500 hover:bg-white hover:shadow-sm hover:text-gray-700 hover:border-gray-200/50 border border-transparent transition-all cursor-pointer"
                >
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] font-bold text-gray-500 bg-white p-2 rounded-xl border border-gray-100 shadow-inner">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border" data-custom-component="Attendance-Scheduled-Dot"></span>
                <span className="text-emerald-800" data-custom-component="Attendance-Scheduled-Text">{t('admindashboard.legend_scheduled')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border" data-custom-component="Attendance-Unscheduled-Dot"></span>
                <span className="text-amber-800" data-custom-component="Attendance-Unscheduled-Text">{t('admindashboard.legend_unscheduled')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border" data-custom-component="Attendance-Absent-Dot"></span>
                <span data-custom-component="Attendance-Absent-Text">{t('admindashboard.legend_absent')}</span>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white sticky top-0 border-b border-gray-100 shadow-sm z-10">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('admindashboard.col_employee')}</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('admindashboard.col_shift')}</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('admindashboard.col_checkinout')}</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('admindashboard.col_status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {attendanceLoading ? (
                  <tr>
                    <td colSpan="4" className="px-5 py-12 text-center text-gray-400 font-medium">
                      <div className="flex justify-center items-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                        <span>{t('common.loading') || 'Đang tải...'}</span>
                      </div>
                    </td>
                  </tr>
                ) : todayAttendance.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-5 py-8 text-center text-gray-400 font-medium">
                      {t('admindashboard.no_attendance')}
                    </td>
                  </tr>
                ) : (
                  todayAttendance.map(emp => {
                    const status = getAttendanceStatus(emp.check_in, emp.check_out);
                    const isWorking = !!emp.check_in;
                    const isUnscheduled = emp.isUnscheduled;

                    let rowBgClass = 'bg-white hover:bg-gray-50/80 cursor-pointer';
                    if (isUnscheduled) {
                      rowBgClass = 'bg-amber-50/60 hover:bg-amber-100/50 cursor-pointer';
                    } else if (isWorking) {
                      rowBgClass = 'bg-emerald-50/60 hover:bg-emerald-100/50 cursor-pointer';
                    }

                    return (
                      <tr
                        key={emp.person_id}
                        onClick={() => navigate(`/profile/${emp.person_id}`)}
                        className={`transition-colors ${rowBgClass}`}
                        data-custom-component={isUnscheduled ? "Attendance-Unscheduled" : (isWorking ? "Attendance-Scheduled" : "Attendance-Absent")}
                      >
                        <td className="px-4 py-2.5">
                          <span className="font-semibold text-gray-900 text-xs">{emp.name}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          {emp.shift !== '—' ? (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${emp.shift === t('admindashboard.shift_morning') ? 'bg-yellow-100 text-yellow-700' : emp.shift === t('admindashboard.shift_afternoon') ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>
                              {emp.shift}
                            </span>
                          ) : <span className="text-gray-400 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-500 font-mono">
                          {emp.check_in ? emp.check_in.substring(0, 5) : '--:--'} – {emp.check_out ? emp.check_out.substring(0, 5) : '--:--'}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider ${status.colorClass}`}>
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="flex-none px-5 py-2 border-t border-gray-100 bg-gray-50/50">
            <button onClick={() => navigate('/admin/work-hours')} className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 w-full justify-center">
              {t('admindashboard.detail_report')} <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tasks Overview */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[400px] lg:h-full overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50/50">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 whitespace-nowrap">
              <ClipboardDocumentListIcon className="w-5 h-5 text-emerald-500" />
              {t('admindashboard.tasks_title')}
              <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{sortedFilteredTasks.length}</span>
            </h2>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-40">
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t('admindashboard.filter_placeholder')}
                  value={taskSearchTerm}
                  onChange={e => { setTaskSearchTerm(e.target.value); }}
                  className="w-full pl-9 pr-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
              <button
                onClick={() => navigate('/tasks/add')}
                className="bg-[#0056b3] hover:bg-blue-700 text-white p-1 rounded-lg shadow-sm transition-colors shrink-0"
                title={t('admindashboard.quick_add_task')}
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white sticky top-0 border-b border-gray-100 shadow-sm z-10">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('admindashboard.col_task')}</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{t('admindashboard.col_deadline')}</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('admindashboard.col_status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedFilteredTasks.length === 0 ? (
                  <tr><td colSpan="3" className="px-5 py-8 text-center text-gray-400">{t('admindashboard.no_tasks')}</td></tr>
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
                        {task.due_date ? (() => {
                          const d = new Date(task.due_date);
                          const day = String(d.getDate()).padStart(2, '0');
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const year = d.getFullYear();
                          return `${day}/${month}/${year}`;
                        })() : '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        {(() => {
                          const statusKey = getTaskStatusKey(task);
                          if (statusKey === 'overdue') return <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-md font-bold uppercase">{t('admindashboard.status_overdue')}</span>;
                          if (statusKey === 'completed') return <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold uppercase">{t('admindashboard.status_completed')}</span>;
                          if (statusKey === 'in_progress') return <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-bold uppercase">{t('admindashboard.status_in_progress')}</span>;
                          return <span className="text-[10px] bg-gray-100 text-gray-800 px-2 py-0.5 rounded-md font-bold uppercase">{t('admindashboard.status_pending')}</span>;
                        })()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex-none px-5 py-2 border-t border-gray-100 bg-gray-50/50">
            <button onClick={() => navigate('/tasks')} className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 w-full justify-center">
              {t('admindashboard.view_tasks')} <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* AI Company Monthly Analysis Modal */}
      {isCompanyAnalysisModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-10 flex flex-col max-h-[85vh]">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                  <SparklesIcon className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">
                    {isVi ? 'Phân tích Hiệu suất Doanh nghiệp Hàng tháng' : 'AI Monthly Company Performance Analysis'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">{isVi ? 'Kỳ phân tích:' : 'Period:'}</label>
                    <select
                      value={analysisMonth}
                      onChange={(e) => setAnalysisMonth(parseInt(e.target.value, 10))}
                      className="text-xs bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 font-bold text-gray-700 outline-none cursor-pointer"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>{isVi ? `Tháng ${m}` : `Month ${m}`}</option>
                      ))}
                    </select>
                    <select
                      value={analysisYear}
                      onChange={(e) => setAnalysisYear(parseInt(e.target.value, 10))}
                      className="text-xs bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 font-bold text-gray-700 outline-none cursor-pointer"
                    >
                      {[2025, 2026, 2027].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAnalyzeCompanyPerformance}
                      disabled={companyAnalyzing}
                      className="bg-purple-600 hover:bg-purple-700 text-white rounded px-2 py-0.5 text-[10px] font-extrabold uppercase transition-all cursor-pointer ml-1"
                    >
                      {isVi ? 'Cập nhật' : 'Update'}
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsCompanyAnalysisModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              {companyAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <ArrowPathIcon className="animate-spin h-10 w-10 text-purple-600" />
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-700">
                      {isVi ? 'AI đang xử lý và tổng hợp dữ liệu hiệu suất của toàn công ty...' : 'AI is analyzing overall performance data for all employees...'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {isVi
                        ? `Đang chạy tổng hợp giờ công tích lũy, số lần đi muộn và tình hình hoàn thành task trong tháng ${analysisMonth}/${analysisYear}.`
                        : `Compiling cumulative hours, lateness events, and task metrics for month ${analysisMonth}/${analysisYear}.`}
                    </p>
                  </div>
                </div>
              ) : companyAnalysisError ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-red-600">
                  <XMarkIcon className="w-12 h-12 text-red-500 bg-red-50 p-2.5 rounded-full mb-3" />
                  <p className="font-bold text-sm">{companyAnalysisError}</p>
                  <button
                    onClick={handleAnalyzeCompanyPerformance}
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
                      <p className="font-bold">{isVi ? 'Nhận xét từ AI Agent Quản trị Doanh nghiệp' : 'Insights from AI Executive Agent'}</p>
                      <p className="text-purple-700 mt-0.5 leading-relaxed">
                        {isVi
                          ? `Báo cáo đánh giá tổng thể dựa trên chuyên cần, số lần vi phạm kỷ luật và tỷ lệ hoàn thành công việc của tất cả nhân sự trong tháng ${analysisMonth}/${analysisYear}.`
                          : `High-level organization assessment based on employee attendance, late behaviors, and task completion rates for month ${analysisMonth}/${analysisYear}.`}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#f8fafc] border border-gray-100 rounded-2xl p-6 shadow-inner text-sm text-gray-800 leading-relaxed font-semibold whitespace-pre-wrap font-sans max-h-[50vh] overflow-y-auto">
                    {companyAnalysisResult}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center gap-3">
              <div>
                {!companyAnalyzing && !companyAnalysisError && companyAnalysisResult && (
                  <button
                    onClick={handleCopyCompanyAnalysis}
                    className="py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-sm transition-all cursor-pointer"
                  >
                    {companyCopied ? (
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
                  onClick={() => setIsCompanyAnalysisModalOpen(false)}
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
