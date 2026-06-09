import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { useLocation } from 'react-router-dom';
import { dailyReportService } from '../../services/dailyReportService';
import { apiFetch } from '../../services/api';
import SortableTable from '../../components/SortableTable';
import DateRangeFilter from '../../components/DateRangeFilter';
import EmployeeMultiFilter from '../../components/EmployeeMultiFilter';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { formatDateTime } from '../../utils/dateUtils';
import { useTranslation } from 'react-i18next';

export default function AdminReportHistory() {
  const { t } = useTranslation();
  const location = useLocation();
  const [reports, setReports] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState(
    location.state?.person_id ? [location.state.person_id.toString()] : []
  );

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 12);
  const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  const [selectedReport, setSelectedReport] = useState(null);

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

  // Status keys used internally (English) mapped from t() at render time
  const STATUS_DONE = 'done';
  const STATUS_WORKING = 'working';
  const STATUS_PENDING = 'pending';

  const displayData = useMemo(() => {
    return reports.map(report => {
      const emp = employees.find(e => e.person_id === report.person_id);
      return {
        ...report,
        employee_name: emp?.name || emp?.username || `Employee ${report.person_id}`,
        statusKey: report.check_out ? STATUS_DONE : (report.check_in ? STATUS_WORKING : STATUS_PENDING)
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
        aVal = aVal || (sortDir === 'asc' ? '99:99:99' : '00:00:00');
        bVal = bVal || (sortDir === 'asc' ? '99:99:99' : '00:00:00');
      }

      if (typeof aVal === 'number') return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      return sortDir === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
    });
  }, [displayData, sortKey, sortDir]);

  const columns = [
    { key: 'working_date', label: t('reporthistory.col_date'), sortable: true },
    { key: 'employee_name', label: t('reporthistory.col_employee'), sortable: true },
    { key: 'check_in', label: t('reporthistory.col_checkin'), sortable: true },
    { key: 'check_out', label: t('reporthistory.col_checkout'), sortable: true },
    { key: 'statusKey', label: t('reporthistory.col_status'), sortable: true }
  ];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{t('reporthistory.title')}</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">{t('reporthistory.subtitle')}</p>
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
        emptyMessage={t('reporthistory.empty')}
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
                {(() => {
                  const d = new Date(report.working_date);
                  if (isNaN(d.getTime())) return '';
                  const day = String(d.getDate()).padStart(2, '0');
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const year = d.getFullYear();
                  return `${day}/${month}/${year}`;
                })()}
              </span>
            </td>
            <td className="px-4 py-5">
              <span className="text-sm font-semibold text-gray-900">{report.employee_name}</span>
            </td>
            <td className="px-4 py-5 text-sm text-gray-600">{report.check_in || '--:--'}</td>
            <td className="px-4 py-5 text-sm text-gray-600">{report.check_out || '--:--'}</td>
            <td className="px-4 py-5">
              {report.statusKey === STATUS_DONE && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  {t('reporthistory.status_done')}
                </span>
              )}
              {report.statusKey === STATUS_WORKING && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  {t('reporthistory.status_working')}
                </span>
              )}
              {report.statusKey === STATUS_PENDING && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                  {t('reporthistory.status_pending')}
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
                      {t('reporthistory.modal_title')}
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
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('reporthistory.modal_employee')}</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedReport.employee_name}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('reporthistory.modal_date')}</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {(() => {
                              const d = new Date(selectedReport.working_date);
                              if (isNaN(d.getTime())) return '';
                              const day = String(d.getDate()).padStart(2, '0');
                              const month = String(d.getMonth() + 1).padStart(2, '0');
                              const year = d.getFullYear();
                              return `${day}/${month}/${year}`;
                            })()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('reporthistory.modal_checkin')}</p>
                          <p className="text-sm font-semibold text-emerald-600">{selectedReport.check_in || '--:--'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('reporthistory.modal_checkout')}</p>
                          <p className="text-sm font-semibold text-indigo-600">{selectedReport.check_out || '--:--'}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('reporthistory.modal_content')}</p>
                        <div className="bg-white border border-gray-300 rounded-xl p-4 min-h-[120px] shadow-sm text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedReport.description || (
                            <span className="text-gray-400 italic">{t('reporthistory.modal_no_content')}</span>
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
                      {t('reporthistory.btn_close')}
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
