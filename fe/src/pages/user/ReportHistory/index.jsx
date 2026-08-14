import React, { Fragment } from 'react';
import SortableTable from '../../../components/SortableTable';
import DateRangeFilter from '../../../components/DateRangeFilter';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import AIReportModal from '../../../components/AIReportModal/AIReportModal';
import { useReportHistory } from './hooks/useReportHistory';

export default function ReportHistory() {
  const {
    t,
    loading,
    isAiModalOpen,
    setIsAiModalOpen,
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
    STATUS_DONE,
    STATUS_WORKING,
    STATUS_PENDING
  } = useReportHistory();

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{t('reporthistory.title')}</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            {t('reporthistory.subtitle_user') || t('reporthistory.subtitle')}
          </p>
        </div>

        <div className="w-full md:w-auto flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            <span>✨ {t('ai_report.generate_btn_short')}</span>
          </button>

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
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
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
                          <p className="text-sm font-semibold text-blue-600">{selectedReport.check_out || '--:--'}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('reporthistory.modal_content')}</h4>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-300 min-h-[100px] text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                          {selectedReport.description || <span className="text-gray-400 italic">{t('reporthistory.modal_empty_desc')}</span>}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-gray-300 flex justify-end">
                    <button
                      type="button"
                      className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold rounded-xl transition-colors cursor-pointer"
                      onClick={() => setSelectedReport(null)}
                    >
                      {t('reporthistory.modal_close')}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <AIReportModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </div>
  );
}
