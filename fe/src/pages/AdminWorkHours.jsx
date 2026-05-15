import React, { useState, useEffect, useMemo } from 'react';
import {
  ClockIcon,
  CalendarDaysIcon,
  FunnelIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { apiFetch, BASE_URL } from '../services/api';
import { scheduleService } from '../services/scheduleService';
import EmployeeMultiFilter from '../components/EmployeeMultiFilter';
import SortableTable from '../components/SortableTable';
import DateRangeFilter from '../components/DateRangeFilter';

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
  const [exporting, setExporting] = useState(false);

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

  const handleExport = async () => {
    // Chỉ export những người có ít nhất 1 daily report trong kỳ đang xem
    const personIdsWithReports = [...new Set(dailyReports.map(r => r.person_id))];

    const ids = selectedEmployeeIds.length > 0
      ? selectedEmployeeIds.map(Number).filter(id => personIdsWithReports.includes(id))
      : personIdsWithReports;

    if (ids.length === 0) {
      alert('Không có dữ liệu daily report nào trong khoảng thời gian này để export.');
      return;
    }

    setExporting(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`${BASE_URL}/daily-report/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ personIds: ids, startDate, endDate })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Export thất bại');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `work_hours_${startDate}_${endDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Lỗi khi export: ' + error.message);
    } finally {
      setExporting(false);
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

  const employeeSummary = employees.map(emp => {
    const empSchedules = filteredSchedules.filter(s => s.person_id === emp.person_id);
    const empReports = dailyReports.filter(r => r.person_id === emp.person_id);
    const totalDays = empSchedules.length;
    const registeredHours = empSchedules.reduce((sum, s) => sum + parseTimeToHours(s.start_time, s.end_time), 0);
    const actualHours = empReports.reduce((sum, r) => {
      if (!r.check_in || !r.check_out) return sum;

      const [sH, sM, sS] = r.check_in.split(':').map(Number);
      const [eH, eM, eS] = r.check_out.split(':').map(Number);

      const startSeconds = sH * 3600 + sM * 60 + sS;
      const endSeconds = eH * 3600 + eM * 60 + eS;

      return sum + Math.max(0, (endSeconds - startSeconds) / 3600);
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

  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const sortedSummary = useMemo(() => {
    let list = [...employeeSummary];
    if (sortKey) {
      list.sort((a, b) => {
        const aVal = a[sortKey] ?? '';
        const bVal = b[sortKey] ?? '';
        if (typeof aVal === 'number') return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        return sortDir === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
      });
    }
    return list;
  }, [employeeSummary, sortKey, sortDir]);

  const totalPages = Math.ceil(sortedSummary.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const columns = [
    { key: 'name',            label: 'Employee',    sortable: true },
    { key: 'totalDays',       label: 'Work Days',   sortable: true, align: 'center' },
    { key: 'registeredHours', label: 'Registered',  sortable: true, align: 'center' },
    { key: 'actualHours',     label: 'Actual',      sortable: true, align: 'center' },
    { key: 'status',          label: 'Status',      sortable: false, align: 'center' },
  ];

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
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#0056b3] hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex-1 md:flex-none justify-center"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            <span>{exporting ? 'Exporting...' : 'Export Excel'}</span>
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
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onRangeChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
            setCurrentPage(1);
          }}
        />

        <div className="flex-1 bg-white rounded-2xl shadow-md border border-gray-300 p-4 flex items-center">
          <div className="w-full">
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

      <SortableTable
        columns={columns}
        data={sortedSummary}
        loading={loading}
        emptyMessage="No records found for this period."
        pageSize={pageSize}
        currentPage={currentPage}
        totalItems={sortedSummary.length}
        onPageChange={setCurrentPage}
        onSortChange={(key, dir) => { setSortKey(key); setSortDir(dir); }}
        tableClassName="min-w-[800px]"
        renderRow={(emp) => (
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
        )}
      />
    </div>
  );
}
