import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  CalendarIcon
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
  const pageSize = 10;

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

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

  const filteredSchedules = schedules.filter(s => {
    const workingDate = s.working_date.split('T')[0];
    return workingDate >= startDate && workingDate <= endDate;
  });

  const handleQuickMonthChange = (e) => {
    const val = e.target.value;
    if (!val) return;
    const [year, month] = val.split('-').map(Number);
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    setStartDate(first.toISOString().split('T')[0]);
    setEndDate(last.toISOString().split('T')[0]);
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

  const employeeSummary = employees.map(emp => {
    const empSchedules = filteredSchedules.filter(s => s.person_id === emp.person_id);
    const empReports = dailyReports.filter(r => r.person_id === emp.person_id);
    const totalDays = empSchedules.length;
    const registeredHours = empSchedules.reduce((sum, s) => sum + parseTimeToHours(s.start_time, s.end_time), 0);
    const actualHours = empReports.reduce((sum, r) => {
      if (!r.check_in || !r.check_out) return sum;
      const start = new Date(r.check_in);
      const end = new Date(r.check_out);
      return sum + Math.max(0, (end - start) / (1000 * 60 * 60));
    }, 0);

    return {
      ...emp,
      totalDays,
      registeredHours: Math.round(registeredHours * 100) / 100,
      actualHours: Math.round(actualHours * 100) / 100
    };
  }).filter(emp => {
    if (selectedEmployeeIds.length === 0) return true;
    return selectedEmployeeIds.includes(emp.person_id.toString());
  });

  const totalPages = Math.ceil(employeeSummary.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = employeeSummary.slice(startIndex, startIndex + pageSize);

  const d = new Date(startDate);
  const monthYearLabel = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Work Hour Reports</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Track and verify actual vs registered working hours</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2 flex-1 md:flex-none justify-center">
            <CalendarIcon className="w-5 h-5 text-gray-400" />
            <span className="font-bold text-gray-700">{monthYearLabel}</span>
          </div>
          <button
            onClick={() => alert("Export feature coming soon...")}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#0056b3] hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex-1 md:flex-none justify-center"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm flex-1 md:flex-none justify-center"
          >
            <ArrowPathIcon className="w-5 h-5" />
            <span className="md:hidden lg:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 overflow-x-auto">
          <div className="flex items-center gap-2 border-r border-gray-100 pr-4">
            <CalendarDaysIcon className="w-5 h-5 text-blue-600" />
            <select 
              onChange={handleQuickMonthChange}
              className="bg-transparent border-none text-sm font-bold text-blue-600 outline-none cursor-pointer hover:text-blue-700 transition-colors"
              defaultValue=""
            >
              <option value="" disabled>Select Month</option>
              {getMonthOptions()}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">From</span>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-gray-50 border-none rounded-xl px-3 py-2 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">To</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-gray-50 border-none rounded-xl px-3 py-2 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center">
          <div className="w-full">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <FunnelIcon className="w-3 h-3" /> Filter Employees
            </p>
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
      </div>

      {/* Table Area */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-3xl overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Employee</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Work Days</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Registered</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Actual</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-400 font-medium">Loading data...</td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-400 font-medium">No records found for this period.</td>
                </tr>
              ) : (
                paginatedData.map((emp) => (
                  <tr key={emp.person_id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name || emp.username)}&background=e0e7ff&color=4338ca&rounded=true&size=40&bold=true`}
                          alt={emp.name}
                          className="w-10 h-10 rounded-full border border-gray-100"
                        />
                        <div>
                          <p className="text-sm font-bold text-gray-900">{emp.name || emp.username}</p>
                          <p className="text-xs text-gray-400">ID: {emp.person_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
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
                       {emp.actualHours >= emp.registeredHours ? (
                         <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100">Full Completed</span>
                       ) : (
                         <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-100">Partial</span>
                       )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {employeeSummary.length > 0 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100 bg-gray-50/50">
            <span className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(startIndex + pageSize, employeeSummary.length)}</span> of <span className="font-semibold text-gray-900">{employeeSummary.length}</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:text-gray-900 rounded-xl hover:bg-white hover:shadow-sm transition-all disabled:opacity-30"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <div className="flex items-center px-4 py-1 bg-white rounded-xl border border-gray-100 text-sm font-bold text-gray-700">
                {currentPage} / {totalPages || 1}
              </div>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-400 hover:text-gray-900 rounded-xl hover:bg-white hover:shadow-sm transition-all disabled:opacity-30"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
