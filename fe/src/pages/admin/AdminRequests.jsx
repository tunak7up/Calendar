import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { apiFetch } from '../../services/api';
import { requestService } from '../../services/requestService';
import { useNavigate } from 'react-router-dom';
import EmployeeMultiFilter from '../../components/EmployeeMultiFilter';
import RequestTable from '../../components/RequestTable';
import { useTranslation } from 'react-i18next';

export default function AdminRequests() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const pageSize = 8;

  // Month filter state (YYYY-MM)
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [filterMonth, setFilterMonth] = useState(currentMonthStr);

  const fetchEmployees = useCallback(() => {
    apiFetch('/person')
      .then(data => {
        if (data.success) {
          setEmployees(data.data);
        }
      })
      .catch(error => console.error("Error fetching employees:", error));
  }, []);

  const fetchRequests = useCallback(() => {
    if (!filterMonth) return;

    // Calculate start and end dates of the month
    const [year, month] = filterMonth.split('-').map(Number);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    requestService.getRequestsByRange(startDate, endDate)
      .then(data => {
        if (data.success) {
          setRequests(data.data);
        }
      })
      .catch(error => console.error("Error fetching requests:", error))
      .finally(() => setLoading(false));
  }, [filterMonth]);

  useEffect(() => {
    fetchRequests();
    fetchEmployees();
  }, [fetchRequests, fetchEmployees]);

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      const result = await apiFetch(`/request/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (result.success) {
        // Update local state to reflect change immediately
        setRequests(prev => prev.map(req =>
          (req.request_id || req.id) === requestId ? { ...req, status: newStatus } : req
        ));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert(t('requests.alert_update_fail'));
    }
  };

  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleRowClick = (req) => {
    navigate(`/history/${req.request_id || req.id}`, { state: { request: req } });
  };

  const filteredRequests = useMemo(() => {
    let list = requests.filter(req => {
      if (filterStatus !== 'all' && req.status?.toLowerCase() !== filterStatus) return false;
      if (filterType !== 'all' && req.type?.toLowerCase() !== filterType) return false;
      if (selectedEmployeeIds.length > 0) {
        if (!selectedEmployeeIds.includes(req.requester_id?.toString()) &&
          !selectedEmployeeIds.includes(req.requester?.person_id?.toString())) return false;
      }
      if (searchTerm) {
        const nameMatch = req.requester?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.requester?.username?.toLowerCase().includes(searchTerm.toLowerCase());
        const reasonMatch = req.reason?.toLowerCase().includes(searchTerm.toLowerCase());
        if (!nameMatch && !reasonMatch) return false;
      }
      return true;
    });

    if (sortKey) {
      list = [...list].sort((a, b) => {
        let aVal, bVal;
        if (sortKey === 'requester') {
          aVal = a.requester?.name || a.requester?.username || '';
          bVal = b.requester?.name || b.requester?.username || '';
        } else if (sortKey === 'created_at') {
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
        } else {
          aVal = a[sortKey] ?? '';
          bVal = b[sortKey] ?? '';
        }
        if (typeof aVal === 'number') return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        return sortDir === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
      });
    }

    return list;
  }, [requests, filterStatus, filterType, selectedEmployeeIds, searchTerm, sortKey, sortDir]);

  const handleApproveAll = async () => {
    const pendingRequests = filteredRequests.filter(req => req.status?.toLowerCase() === 'pending');
    if (pendingRequests.length === 0) {
      alert(t('requests.no_pending', { defaultValue: 'Không có yêu cầu nào đang chờ duyệt' }));
      return;
    }
    if (!window.confirm(t('requests.confirm_approve_all', { defaultValue: `Bạn có chắc muốn duyệt nhanh ${pendingRequests.length} yêu cầu?` }))) {
      return;
    }
    
    setLoading(true);
    let successCount = 0;
    for (const req of pendingRequests) {
      try {
        const result = await apiFetch(`/request/${req.request_id || req.id}`, {
          method: 'PUT',
          body: JSON.stringify({ status: 'approved' })
        });
        if (result.success) successCount++;
      } catch (error) {
        console.error('Error approving request:', req.request_id || req.id, error);
      }
    }
    alert(t('requests.approve_all_success', { defaultValue: `Đã duyệt thành công ${successCount}/${pendingRequests.length} yêu cầu.` }));
    fetchRequests();
  };

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

        {/* Selected Employee tags wrapper */}
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
