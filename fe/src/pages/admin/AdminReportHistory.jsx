import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { useLocation } from 'react-router-dom';
import { dailyReportService } from '../../services/dailyReportService';
import { apiFetch } from '../../services/api';
import SortableTable from '../../components/SortableTable';
import DateRangeFilter from '../../components/DateRangeFilter';
import EmployeeMultiFilter from '../../components/EmployeeMultiFilter';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, DocumentTextIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { formatDateTime } from '../../utils/dateUtils';

export default function AdminReportHistory() {
  const location = useLocation();
  const [reports, setReports] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState(
    location.state?.person_id ? [location.state.person_id.toString()] : []
  );
  
  // Date range state - Default to current month
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  // Modal state
  const [selectedReport, setSelectedReport] = useState(null);

  // Table state
  const [sortKey, setSortKey] = useState('working_date');
  const [sortDir, setSortDir] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, selectedEmployeeIds]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch employees list
      const empRes = await apiFetch('/person');
      if (empRes.success) setEmployees(empRes.data);

      let repData = [];
      if (selectedEmployeeIds.length > 0) {
        const responses = await Promise.all(
          selectedEmployeeIds.map(id => dailyReportService.getDailyReportByPersonId(id))
        );
        responses.forEach(res => {
          if (res.success && Array.isArray(res.data)) {
            repData = [...repData, ...res.data];
          }
        });
        
        // Filter locally by date range
        repData = repData.filter(r => {
          const dateStr = r.working_date.split('T')[0];
          return dateStr >= startDate && dateStr <= endDate;
        });
      } else {
        const repRes = await dailyReportService.getAllDailyReportsInRange(startDate, endDate);
        if (repRes.success) {
          repData = repRes.data;
        }
      }
      
      setReports(repData);
    } catch (error) {
      console.error('Error fetching report history:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayData = useMemo(() => {
    return reports.map(report => {
      const emp = employees.find(e => e.person_id === report.person_id);
      return {
        ...report,
        employee_name: emp?.name || emp?.username || `Nhân viên ${report.person_id}`,
        status: report.check_out ? 'Hoàn thành' : (report.check_in ? 'Đang làm việc' : 'Chờ xử lý')
      };
    });
  }, [reports, employees]);

  const sortedData = useMemo(() => {
    return [...displayData].sort((a, b) => {
      let aVal = a[sortKey] ?? '';
      let bVal = b[sortKey] ?? '';
      
      if (sortKey === 'working_date') {
         aVal = new Date(aVal).getTime();
         bVal = new Date(bVal).getTime();
      }
      if (sortKey === 'check_in' || sortKey === 'check_out') {
         // handle nulls by pushing them to the end for asc, or keep relative for desc
         aVal = aVal || (sortDir === 'asc' ? '99:99:99' : '00:00:00');
         bVal = bVal || (sortDir === 'asc' ? '99:99:99' : '00:00:00');
      }

      if (typeof aVal === 'number') return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      return sortDir === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
    });
  }, [displayData, sortKey, sortDir]);

  const columns = [
    { key: 'working_date', label: 'Ngày làm việc', sortable: true },
    { key: 'employee_name', label: 'Nhân viên', sortable: true },
    { key: 'check_in', label: 'Giờ Check In', sortable: true },
    { key: 'check_out', label: 'Giờ Check Out', sortable: true },
    { key: 'status', label: 'Trạng thái', sortable: true }
  ];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Lịch sử báo cáo hàng ngày</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Xem nội dung báo cáo và thời gian làm việc hàng ngày của nhân viên</p>
        </div>
        
        <div className="w-full md:w-auto">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onRangeChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Employee Multi Filter */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-300 p-4 flex items-center">
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

      <SortableTable
        columns={columns}
        data={sortedData}
        loading={loading}
        emptyMessage="Không tìm thấy báo cáo nào trong khoảng thời gian đã chọn."
        pageSize={pageSize}
        currentPage={currentPage}
        totalItems={sortedData.length}
        onPageChange={setCurrentPage}
        onSortChange={(key, dir) => { setSortKey(key); setSortDir(dir); setCurrentPage(1); }}
        tableClassName="min-w-[600px]"
        renderRow={(report) => (
          <tr
            key={report.id}
            onClick={() => setSelectedReport(report)}
            className="border-b border-gray-50 hover:bg-[#f8fafc] transition-colors cursor-pointer select-none"
          >
            <td className="px-6 py-5">
              <span className="text-sm font-bold text-gray-800">
                {new Date(report.working_date).toLocaleDateString()}
              </span>
            </td>
            <td className="px-4 py-5">
              <span className="text-sm font-semibold text-gray-900">{report.employee_name}</span>
            </td>
            <td className="px-4 py-5 text-sm text-gray-600">{report.check_in || '--:--'}</td>
            <td className="px-4 py-5 text-sm text-gray-600">{report.check_out || '--:--'}</td>
            <td className="px-4 py-5">
              {report.status === 'Hoàn thành' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  Hoàn thành
                </span>
              )}
              {report.status === 'Đang làm việc' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Đang làm việc
                </span>
              )}
              {report.status === 'Chờ xử lý' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                  Chờ xử lý
                </span>
              )}
            </td>
          </tr>
        )}
      />

      {/* Report Detail Modal */}
      <Transition appear show={!!selectedReport} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setSelectedReport(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-2xl border border-gray-300 transition-all">
                  <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-300">
                    <Dialog.Title as="h3" className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                      <DocumentTextIcon className="w-6 h-6 text-[#0056b3]" />
                      Chi tiết báo cáo hàng ngày
                    </Dialog.Title>
                    <button
                      onClick={() => setSelectedReport(null)}
                      className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-colors focus:outline-none"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {selectedReport && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-300 shadow-sm">
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nhân viên</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedReport.employee_name}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Ngày làm việc</p>
                          <p className="text-sm font-semibold text-gray-900">{new Date(selectedReport.working_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Giờ Check In</p>
                          <p className="text-sm font-semibold text-emerald-600">{selectedReport.check_in || '--:--'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Giờ Check Out</p>
                          <p className="text-sm font-semibold text-indigo-600">{selectedReport.check_out || '--:--'}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nội dung báo cáo công việc</p>
                        <div className="bg-white border border-gray-300 rounded-xl p-4 min-h-[120px] shadow-sm text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedReport.description || (
                            <span className="text-gray-400 italic">Không có mô tả nội dung báo cáo.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 flex justify-end">
                    <button
                      type="button"
                      className="px-6 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl text-sm font-bold transition-colors focus:outline-none"
                      onClick={() => setSelectedReport(null)}
                    >
                      Đóng
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
