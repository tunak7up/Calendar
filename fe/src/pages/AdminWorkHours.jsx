import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  UserIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function AdminWorkHours() {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, schedRes] = await Promise.all([
        fetch('http://localhost:3000/api/person').then(r => r.json()),
        fetch('http://localhost:3000/api/schedule').then(r => r.json())
      ]);

      if (empRes.success) setEmployees(empRes.data);
      if (schedRes.success) setSchedules(schedRes.data);
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

  // Filter schedules by selected month/year
  const filteredSchedules = schedules.filter(s => {
    const d = new Date(s.working_date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  // Build per-employee summary
  const employeeSummary = employees.map(emp => {
    const empSchedules = filteredSchedules.filter(s => s.person_id === emp.person_id);
    const totalDays = empSchedules.length;
    const totalHours = empSchedules.reduce((sum, s) => sum + parseTimeToHours(s.start_time, s.end_time), 0);

    return {
      ...emp,
      totalDays,
      totalHours: Math.round(totalHours * 100) / 100,
      schedules: empSchedules
    };
  }).filter(emp => {
    if (selectedEmployeeId === 'all') return true;
    return emp.person_id.toString() === selectedEmployeeId;
  });

  // Pagination
  const totalPages = Math.ceil(employeeSummary.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = employeeSummary.slice(startIndex, startIndex + pageSize);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
    setCurrentPage(1);
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
    setCurrentPage(1);
  };

  // Aggregate totals
  const grandTotalDays = employeeSummary.reduce((s, e) => s + e.totalDays, 0);
  const grandTotalHours = Math.round(employeeSummary.reduce((s, e) => s + e.totalHours, 0) * 100) / 100;

  return (
    <div className="flex-1 p-8 pt-[80px] bg-[#f1f4f8] min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Work Hours Overview</h1>
            <p className="text-gray-500 mt-1">Track registered working hours and days for payroll calculation</p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <UserIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Employees</p>
              <p className="text-2xl font-extrabold text-gray-900">{employeeSummary.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CalendarDaysIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Work Days</p>
              <p className="text-2xl font-extrabold text-gray-900">{grandTotalDays}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <ClockIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Hours</p>
              <p className="text-2xl font-extrabold text-gray-900">{grandTotalHours}h</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Month Picker */}
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 min-w-[200px] justify-center">
              <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-bold text-gray-800">
                {MONTH_NAMES[selectedMonth]} {selectedYear}
              </span>
            </div>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Employee filter */}
          <div className="flex items-center gap-3">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              value={selectedEmployeeId}
              onChange={(e) => {
                setSelectedEmployeeId(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-200 bg-white text-gray-700 text-sm font-semibold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#0056b3]"
            >
              <option value="all">All Employees</option>
              {employees.map(emp => (
                <option key={emp.person_id} value={emp.person_id}>{emp.name || emp.username}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/90 backdrop-blur-sm">
                <tr>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">#</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Employee</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Work Days</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Total Hours</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Avg Hours/Day</th>
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
                    const hoursLevel = emp.totalHours >= 160 ? 'full' : emp.totalHours >= 80 ? 'partial' : 'low';

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
                          <span className="text-sm font-extrabold text-gray-900">{emp.totalHours}h</span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="text-sm font-semibold text-gray-600">{avgHours}h</span>
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
