import React, { Fragment } from 'react';
import SortableTable from '../../../components/SortableTable';
import DateRangeFilter from '../../../components/DateRangeFilter';
import EmployeeMultiFilter from '../../../components/EmployeeMultiFilter';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useAdminReportHistory } from './hooks/useAdminReportHistory';

export default function AdminReportHistory() {
  const {
    t,
    loading,
    selectedEmployeeIds,
    setSelectedEmployeeIds,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedReport,
    setSelectedReport,
    setSortKey,
    setSortDir,
    currentPage,
    setCurrentPage,
    pageSize,
    sortedData,
    columns,
    filteredEmployeeList,
    STATUS_DONE,
    STATUS_WORKING,
    STATUS_PENDING
  } = useAdminReportHistory();

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
            employees={filteredEmployeeList}
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
        tableClassName="min-w-[750px]"
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
            <td className="px-4 py-5 text-sm text-gray-600">
              <div>{report.check_in || '--:--'}</div>
              {report.check_in_ip && (
                <div className="text-[11px] font-mono text-gray-400">IP: {report.check_in_ip}</div>
              )}
              {report.check_in_device && (
                <div className="text-[11px] text-gray-400 truncate max-w-[160px]" title={report.check_in_device}>
                  {report.check_in_device}
                </div>
              )}
            </td>
            <td className="px-4 py-5 text-sm text-gray-600">
              <div>{report.check_out || '--:--'}</div>
              {report.check_out_ip && (
                <div className="text-[11px] font-mono text-gray-400">IP: {report.check_out_ip}</div>
              )}
              {report.check_out_device && (
                <div className="text-[11px] text-gray-400 truncate max-w-[160px]" title={report.check_out_device}>
                  {report.check_out_device}
                </div>
              )}
            </td>
            <td className="px-4 py-5 text-sm font-semibold text-gray-700">
              {report.check_in_machine || '--:--'}
            </td>
            <td className="px-4 py-5 text-sm font-semibold text-gray-700">
              {report.check_out_machine || '--:--'}
            </td>
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
                          {selectedReport.check_in_ip && (
                            <p className="text-xs font-mono text-gray-500 mt-0.5">IP: {selectedReport.check_in_ip}</p>
                          )}
                          {selectedReport.check_in_device && (
                            <p className="text-xs text-gray-500 mt-0.5">Thiết bị: {selectedReport.check_in_device}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('reporthistory.modal_checkout')}</p>
                          <p className="text-sm font-semibold text-indigo-600">{selectedReport.check_out || '--:--'}</p>
                          {selectedReport.check_out_ip && (
                            <p className="text-xs font-mono text-gray-500 mt-0.5">IP: {selectedReport.check_out_ip}</p>
                          )}
                          {selectedReport.check_out_device && (
                            <p className="text-xs text-gray-500 mt-0.5">Thiết bị: {selectedReport.check_out_device}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Vào (Máy chấm công)</p>
                          <p className="text-sm font-semibold text-emerald-700">{selectedReport.check_in_machine || '--:--'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Ra (Máy chấm công)</p>
                          <p className="text-sm font-semibold text-indigo-700">{selectedReport.check_out_machine || '--:--'}</p>
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
