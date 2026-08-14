import React from 'react';
import {
  CalendarDaysIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import EmployeeMultiFilter from '../../../components/EmployeeMultiFilter';
import SortableTable from '../../../components/SortableTable';
import DateRangeFilter from '../../../components/DateRangeFilter';
import ImportWorkHoursReviewModal from '../../../components/ImportWorkHoursReviewModal/ImportWorkHoursReviewModal';
import { useAdminWorkHours } from './hooks/useAdminWorkHours';

export default function AdminWorkHours() {
  const {
    t,
    navigate,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    employees,
    loading,
    selectedEmployeeIds,
    setSelectedEmployeeIds,
    exporting,
    importing,
    previewData,
    showReviewModal,
    setShowReviewModal,
    fileInputRef,
    currentPage,
    setCurrentPage,
    pageSize,
    fetchData,
    handleExport,
    handleImportFile,
    employeeList,
    sortedSummary,
    columns,
    monthYearLabel,
    setSortKey,
    setSortDir
  } = useAdminWorkHours();

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{t('workhours.title')}</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">{t('workhours.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2 flex-1 md:flex-none justify-center">
            <CalendarIcon className="w-5 h-5 text-gray-400" />
            <span className="font-bold text-gray-700">{monthYearLabel}</span>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex-1 md:flex-none justify-center"
          >
            <ArrowUpTrayIcon className="w-5 h-5" />
            <span>{importing ? 'Đang import...' : 'Import Excel'}</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".xlsx, .xls"
            className="hidden"
          />
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0056b3] hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex-1 md:flex-none justify-center"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            <span>{exporting ? t('workhours.exporting') : t('workhours.export_excel')}</span>
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm flex-1 md:flex-none justify-center"
          >
            <ArrowPathIcon className="w-5 h-5" />
            <span className="md:hidden lg:inline">{t('workhours.refresh')}</span>
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
              employees={employeeList}
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
        emptyMessage={t('workhours.empty')}
        pageSize={pageSize}
        currentPage={currentPage}
        totalItems={sortedSummary.length}
        onPageChange={setCurrentPage}
        onSortChange={(key, dir) => { setSortKey(key); setSortDir(dir); }}
        tableClassName="min-w-[800px]"
        renderRow={(emp) => (
          <tr
            key={emp.person_id}
            onClick={() => navigate('/admin/reports', { state: { person_id: emp.person_id } })}
            className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
          >
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
                {emp.totalDays} {t('workhours.days_unit')}
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
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100">{t('workhours.status_full')}</span>
              ) : (
                <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-100">{t('workhours.status_partial')}</span>
              )}
            </td>
          </tr>
        )}
      />

      <ImportWorkHoursReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        previewData={previewData}
        employees={employees}
        onSuccess={fetchData}
      />
    </div>
  );
}
