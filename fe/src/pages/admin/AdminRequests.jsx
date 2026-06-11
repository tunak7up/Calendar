import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
  CalendarIcon
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

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight" data-customizable-id="admin-requests-title" data-customizable-type="text">{t('requests.title')}</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base" data-customizable-id="admin-requests-subtitle" data-customizable-type="text">{t('requests.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="bg-white px-4 py-2 rounded-xl shadow-md border border-gray-300 flex items-center gap-2 flex-1 md:flex-none justify-center" data-customizable-id="admin-requests-total-badge" data-customizable-type="bg">
            <ClipboardDocumentCheckIcon className="w-5 h-5 text-gray-400" />
            <span className="font-bold text-gray-700">{filteredRequests.length}</span>
            <span className="text-gray-500 text-sm">{t('requests.total_filtered')}</span>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col md:flex-row flex-wrap items-center gap-4 mb-6">
        <div className="relative w-full md:flex-1 min-w-[200px]">
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
            className="w-full bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-md"
          />
        </div>
        
        <div className="relative w-full md:w-auto min-w-[140px] group">
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
            className="w-full bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded-xl pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-md cursor-pointer relative z-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:top-0"
          />
        </div>

        <div className="w-full md:w-auto min-w-[150px]">
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-md cursor-pointer"
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

        <div className="w-full md:w-auto min-w-[150px]">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-md cursor-pointer"
          >
            <option value="all">{t('requests.status_all')}</option>
            <option value="pending">{t('status.req_pending')}</option>
            <option value="approved">{t('status.req_approved')}</option>
            <option value="rejected">{t('status.req_rejected')}</option>
          </select>
        </div>
        
        <div className="w-full md:w-auto min-w-[200px]">
          <EmployeeMultiFilter
            employees={employees}
            selectedIds={selectedEmployeeIds}
            onSelectionChange={(ids) => {
              setSelectedEmployeeIds(ids);
              setCurrentPage(1);
            }}
            placeholder={t('requests.filter_employee')}
          />
        </div>
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
