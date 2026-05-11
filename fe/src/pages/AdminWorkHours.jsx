import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  UserIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { apiFetch } from '../services/api';
import { scheduleService } from '../services/scheduleService';
import EmployeeMultiFilter from '../components/EmployeeMultiFilter';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function AdminWorkHours() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [startDate, setStartDate] = useState(firstDay.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(lastDay.toISOString().split('T')[0]);
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [dailyReports, setDailyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, schedRes, reportRes] = await Promise.all([
        apiFetch('/person'),
        scheduleService.getAllSchedules(),
        apiFetch(`/daily-report/range?start=${startDate}&end=${endDate}`)
      ]);

      if (empRes.success) setEmployees(empRes.data);
      if (schedRes.success) setSchedules(schedRes.data);
      if (reportRes.success) setDailyReports(reportRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseTimeToHours = (startStr, endStr) => {
    if (!startStr || !endStr) return 0;
    try {
      const start = new Date(startStr);
      const end = new Date(endStr);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        // Try parsing as HH:mm format
        const [sH, sM] = startStr.split(':').map(Number);
        const [eH, eM] = endStr.split(':').map(Number);
        if (!isNaN(sH) && !isNaN(eH)) {
          return Math.max(0, (eH + eM / 60) - (sH + sM / 60));
        }
        return 0;
      }
      const diffMs = end.getTime() - start.getTime();
      return Math.max(0, diffMs / (1000 * 60 * 60));
    } catch {
      return 0;
    }
  };

  // Filter schedules by selected date range
  const filteredSchedules = schedules.filter(s => {
    const workingDate = s.working_date.split('T')[0];
    return workingDate >= startDate && workingDate <= endDate;
  });

  const handleQuickMonthChange = (e) => {
    const val = e.target.value;
    if (!val) return;
    const [year, month] = val.split('-').map(Number);
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
    setCurrentPage(1);
  };

  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
      const value = `${d.getFullYear()}-${d.getMonth()}`;
      options.push(<option key={value} value={value}>{label}</option>);
    }
    return options;
  };

  // Build per-employee summary
  const employeeSummary = employees.map(emp => {
    const empSchedules = filteredSchedules.filter(s => s.person_id === emp.person_id);
    const empReports = dailyReports.filter(r => r.person_id === emp.person_id);
    
    const totalDays = empSchedules.length;
    const registeredHours = empSchedules.reduce((sum, s) => sum + parseTimeToHours(s.start_time, s.end_time), 0);
    
    const actualHours = empReports.reduce((sum, r) => {
      if (!r.check_in || !r.check_out) return sum;
      const start = new Date(r.check_in);
      const end = new Date(r.check_out);
      const diffMs = end.getTime() - start.getTime();
      return sum + Math.max(0, diffMs / (1000 * 60 * 60));
    }, 0);

    return {
      ...emp,
      totalDays,
      registeredHours: Math.round(registeredHours * 100) / 100,
      actualHours: Math.round(actualHours * 100) / 100,
      schedules: empSchedules
    };
  }).filter(emp => {
    if (selectedEmployeeIds.length === 0) return true;
    return selectedEmployeeIds.includes(emp.person_id.toString());
  });

  // Pagination
  const totalPages = Math.ceil(employeeSummary.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = employeeSummary.slice(startIndex, startIndex + pageSize);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };



  // Aggregate totals
  const grandTotalDays = employeeSummary.reduce((s, e) => s + e.totalDays, 0);
  const grandTotalRegHours = Math.round(employeeSummary.reduce((s, e) => s + e.registeredHours, 0) * 100) / 100;
  const grandTotalActHours = Math.round(employeeSummary.reduce((s, e) => s + e.actualHours, 0) * 100) / 100;

  return (
    <div className="flex-1 p-8 mt-[56px] pt-6 sm:pt-10 bg-[#f1f4f8] min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Work Hours Overview</h1>
            <p className="text-gray-500 mt-1">Track registered working hours and days for payroll calculation</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => alert('Exporting data to CSV... Feature coming soon.')}
              className="flex items-center gap-2 px-4 py-2 bg-[#0056b3] text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/10"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

       

        {/* Filter Section - Separated into two cards */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Time Selection Card */}
          <div className="flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex items-center gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Quick Month Select */}
              <div className="flex items-center gap-2 pl-3 border-r border-gray-100 pr-3">
                <CalendarDaysIcon className="w-5 h-5 text-[#0056b3]" />
                <select 
                  onChange={handleQuickMonthChange}
                  className="bg-transparent border-none text-sm font-bold text-[#0056b3] outline-none cursor-pointer hover:text-blue-700 transition-colors"
                  defaultValue=""
                >
                  <option value="" disabled>Month</option>
                  {getMonthOptions()}
                </select>
              </div>

              {/* From Date */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">From</span>
                <input 
                  id="startDateInput"
                  type="date" 
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-gray-50 border-none rounded-xl px-3 py-1.5 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#0056b3]/20 transition-all cursor-pointer h-10"
                />
              </div>

              <div className="h-4 w-[1px] bg-gray-200 hidden sm:block"></div>

              {/* To Date */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">To</span>
                <input 
                  id="endDateInput"
                  type="date" 
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-gray-50 border-none rounded-xl px-3 py-1.5 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#0056b3]/20 transition-all cursor-pointer h-10"
                />
              </div>
            </div>
          </div>

          {/* Employee Filter Card */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex items-center">
            <EmployeeMultiFilter 
              employees={employees}
              selectedIds={selectedEmployeeIds}
              onSelectionChange={(ids) => {
                setSelectedEmployeeIds(ids);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Table Area with Scrolling */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl overflow-hidden mb-6">
          <div className="max-h-[600px] overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-gray-50/80 sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                <tr>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">#</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Employee</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Work Days</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Hours Registered</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Hours Actual</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-400">Loading data...</td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-400">No records found for this period.</td>
                  </tr>
                ) : (
                  paginatedData.map((emp, index) => {
                    const avgHours = emp.totalDays > 0 ? Math.round((emp.totalHours / emp.totalDays) * 10) / 10 : 0;
                    const hoursLevel = emp.totalHours >= 40 ? 'full' : emp.totalHours >= 20 ? 'partial' : 'low';

                    return (
                      <tr key={emp.person_id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-4 px-6 text-sm text-gray-400 font-medium">
                          {startIndex + index + 1}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name || emp.username || 'U')}&background=e0e7ff&color=4338ca&rounded=true&size=36&bold=true`}
                              alt={emp.name}
                              className="w-9 h-9 rounded-full"
                            />
                            <div>
                              <p className="text-sm font-bold text-gray-900">{emp.name || emp.username}</p>
                              <p className="text-xs text-gray-400">ID: {emp.person_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
                            <CalendarDaysIcon className="w-3.5 h-3.5" />
                            {emp.totalDays} days
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="text-sm font-extrabold text-gray-900">{emp.registeredHours}h</span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`text-sm font-extrabold ${emp.actualHours >= emp.registeredHours ? 'text-emerald-600' : 'text-blue-600'}`}>
                            {emp.actualHours}h
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {hoursLevel === 'full' && (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider">
                              Full-time
                            </span>
                          )}
                          {hoursLevel === 'partial' && (
                            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider">
                              Part-time
                            </span>
                          )}
                          {hoursLevel === 'low' && (
                            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold uppercase tracking-wider">
                              Low Hours
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {employeeSummary.length > 0 && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100 bg-gray-50/50">
              <span className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(startIndex + pageSize, employeeSummary.length)}</span> of <span className="font-semibold text-gray-900">{employeeSummary.length}</span> employees
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1 text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>

                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => goToPage(i + 1)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      currentPage === i + 1
                        ? 'text-white bg-[#0056b3]'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1 text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
