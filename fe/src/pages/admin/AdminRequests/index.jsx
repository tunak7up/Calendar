import React from 'react';
import {
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import EmployeeMultiFilter from '../../../components/EmployeeMultiFilter';
import RequestTable from '../../../components/RequestTable';
import { useAdminRequests } from './hooks/useAdminRequests';

export default function AdminRequests() {
  const {
    t,
    navigate,
    loading,
    setLoading,
    filterStatus,
    setFilterStatus,
    filterType,
    setFilterType,
    searchTerm,
    setSearchTerm,
    employees,
    selectedEmployeeIds,
    setSelectedEmployeeIds,
    currentPage,
    setCurrentPage,
    pageSize,
    filterMonth,
    setFilterMonth,
    filteredRequests,
    handleUpdateStatus,
    handleRowClick,
    handleApproveAll,
    setSortKey,
    setSortDir
  } = useAdminRequests();

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight" data-customizable-id="admin-requests-title" data-customizable-type="text">{t('requests.title')}</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base" data-customizable-id="admin-requests-subtitle" data-customizable-type="text">{t('requests.subtitle')}</p>
        </div>
        <div className="grid grid-cols-3 gap-2.5 w-full md:flex md:w-auto md:gap-3">
          <button
            onClick={handleApproveAll}
            className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-2 py-3 sm:px-4 sm:py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold rounded-2xl border border-emerald-100 shadow-sm transition-all active:scale-95 text-center cursor-pointer"
          >
            <ClipboardDocumentCheckIcon className="w-5 h-5 flex-shrink-0" />
            <span className="text-[11px] sm:text-sm tracking-tight whitespace-nowrap">{t('requests.approve_all', { defaultValue: 'Duyệt nhanh' })}</span>
          </button>
          <button
            onClick={() => navigate('/admin/preset-reasons')}
            className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-2 py-3 sm:px-4 sm:py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-2xl border border-blue-100 shadow-sm transition-all active:scale-95 text-center cursor-pointer"
          >
            <TagIcon className="w-5 h-5 flex-shrink-0" />
            <span className="text-[11px] sm:text-sm tracking-tight whitespace-nowrap">{t('nav.admin_preset_reasons', { defaultValue: 'Lý do có sẵn' })}</span>
          </button>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-2 py-3 sm:px-4 sm:py-2.5 bg-white text-gray-700 font-bold rounded-2xl border border-gray-150 shadow-sm text-center">
            <div className="flex items-center gap-1 justify-center">
              <ClipboardDocumentCheckIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-400 font-normal hidden sm:inline">|</span>
              <span className="text-sm sm:text-base font-extrabold text-gray-800">{filteredRequests.length}</span>
            </div>
            <span className="text-[10px] sm:text-xs text-gray-400 font-medium tracking-tight whitespace-nowrap">{t('requests.total_filtered')}</span>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-gray-50/60 p-4 rounded-2xl border border-gray-200/80 shadow-sm mb-6 space-y-4">
        <div className="grid grid-cols-2 md:flex md:flex-row md:flex-wrap items-stretch md:items-center gap-3">
          <div className="col-span-2 md:flex-1 relative md:min-w-[200px]">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={t('requests.search_placeholder')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>

          <div className="relative col-span-1 md:w-auto md:min-w-[140px] group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 group-hover:text-blue-500 transition-colors z-10">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => {
                setLoading(true);
                setFilterMonth(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm cursor-pointer relative z-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:top-0"
            />
          </div>

          <div className="col-span-1 md:w-auto md:min-w-[150px]">
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm cursor-pointer"
            >
              <option value="all">{t('requests.type_all')}</option>
              <option value="register">{t('requests.type_register')}</option>
              <option value="leave">{t('requests.type_leave')}</option>
              <option value="arrive_early">{t('register.exception_arrive_early')}</option>
              <option value="arrive_late">{t('register.exception_arrive_late')}</option>
              <option value="leave_early">{t('register.exception_leave_early')}</option>
              <option value="leave_late">{t('register.exception_leave_late')}</option>
            </select>
          </div>

          <div className="col-span-1 md:w-auto md:min-w-[150px]">
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm cursor-pointer"
            >
              <option value="all">{t('requests.status_all')}</option>
              <option value="pending">{t('status.req_pending')}</option>
              <option value="approved">{t('status.req_approved')}</option>
              <option value="rejected">{t('status.req_rejected')}</option>
            </select>
          </div>

          <div className="col-span-1 md:w-auto md:min-w-[200px]">
            <EmployeeMultiFilter
              employees={employees}
              selectedIds={selectedEmployeeIds}
              onSelectionChange={(ids) => {
                setSelectedEmployeeIds(ids);
                setCurrentPage(1);
              }}
              placeholder={t('requests.filter_employee')}
              hideTags={true}
            />
          </div>
        </div>

        {selectedEmployeeIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-200/60 w-full">
            {employees.filter(emp => selectedEmployeeIds.includes(emp.person_id.toString())).map(emp => (
              <div
                key={emp.person_id}
                className="flex items-center gap-1.5 bg-white text-[#0056b3] px-2.5 py-1.5 rounded-lg border border-blue-100 text-xs font-bold shadow-sm transition-all whitespace-nowrap"
              >
                <span>{emp.name || emp.username}</span>
                <button
                  onClick={() => setSelectedEmployeeIds(selectedEmployeeIds.filter(id => id !== emp.person_id.toString()))}
                  className="hover:bg-red-500 hover:text-white rounded-md p-0.5 transition-all text-[#0056b3]/60 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              onClick={() => setSelectedEmployeeIds([])}
              className="text-[10px] uppercase tracking-widest font-black text-gray-400 hover:text-red-500 px-2 transition-colors cursor-pointer"
            >
              {t('components.employeeFilter.clear')}
            </button>
          </div>
        )}
      </div>

      <RequestTable
        data={filteredRequests}
        loading={loading}
        isAdmin={true}
        onApprove={(id) => handleUpdateStatus(id, 'approved')}
        onReject={(id) => handleUpdateStatus(id, 'rejected')}
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={filteredRequests.length}
        onPageChange={setCurrentPage}
        onSortChange={(key, dir) => { setSortKey(key); setSortDir(dir); }}
        onRowClick={handleRowClick}
      />
    </div>
  );
}
