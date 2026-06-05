import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardDocumentCheckIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { apiFetch } from '../../services/api';
import { requestService } from '../../services/requestService';
import { useNavigate } from 'react-router-dom';
import EmployeeMultiFilter from '../../components/EmployeeMultiFilter';
import SortableTable from '../../components/SortableTable';
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

  useEffect(() => {
    fetchRequests();
    fetchEmployees();
  }, [filterMonth]); // Re-fetch when month changes

  const fetchEmployees = () => {
    apiFetch('/person')
      .then(data => {
        if (data.success) {
          setEmployees(data.data);
        }
      })
      .catch(error => console.error("Error fetching employees:", error));
  };

  const fetchRequests = () => {
    if (!filterMonth) return;
    setLoading(true);

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
  };

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

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider">{t('status.req_approved')}</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold uppercase tracking-wider">{t('status.req_rejected')}</span>;
      default:
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider">{t('status.req_pending')}</span>;
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

  const columns = [
    { key: 'requester', label: t('requests.col_requester'), sortable: true },
    { key: 'reason', label: t('requests.col_reason'), sortable: true },
    { key: 'created_at', label: t('requests.col_sent_date'), sortable: true },
    { key: 'status', label: t('requests.col_status'), sortable: true, align: 'center' },
    { key: 'actions', label: t('requests.col_actions'), sortable: false, align: 'center' },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{t('requests.title')}</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">{t('requests.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="bg-white px-4 py-2 rounded-xl shadow-md border border-gray-300 flex items-center gap-2 flex-1 md:flex-none justify-center">
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



      <SortableTable
        columns={columns}
        data={filteredRequests}
        loading={loading}
        emptyMessage={t('requests.empty')}
        pageSize={pageSize}
        currentPage={currentPage}
        totalItems={filteredRequests.length}
        onPageChange={setCurrentPage}
        onSortChange={(key, dir) => { setSortKey(key); setSortDir(dir); }}
        tableClassName="min-w-[700px]"
        stickyHeader
        containerHeight="h-[500px]"
        renderRow={(req) => (
          <tr
            key={req.request_id || req.id}
            onClick={() => handleRowClick(req)}
            className={`transition-colors border-b border-gray-200 last:border-b-0 cursor-pointer select-none ${
              req.type === 'leave' ? 'bg-orange-100 hover:bg-orange-300' :
              ['arrive_early', 'arrive_late', 'leave_early', 'leave_late'].includes(req.type) ? 'bg-purple-100 hover:bg-purple-300' :
              'bg-blue-100 hover:bg-blue-300'
            }`}

          >
            <td className="py-4 px-6 text-sm font-semibold text-gray-900">
              {req.requester?.name || req.requester?.username || `User #${req.requester_id}`}
            </td>
            <td className="py-4 px-6 text-sm text-gray-600 max-w-[200px] truncate" title={req.reason || (req.type === 'register' ? t('requests.val_register_schedule') : req.type === 'leave' ? t('requests.type_leave') : ['arrive_early', 'arrive_late', 'leave_early', 'leave_late'].includes(req.type) ? t(`register.exception_${req.type}`) : 'N/A')}>
              {req.reason || (req.type === 'register' ? t('requests.val_register_schedule') : req.type === 'leave' ? t('requests.type_leave') : ['arrive_early', 'arrive_late', 'leave_early', 'leave_late'].includes(req.type) ? t(`register.exception_${req.type}`) : 'N/A')}
            </td>
            <td className="py-4 px-6 text-sm text-gray-500 font-medium">
              <span className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-gray-400" />
                {new Date(req.created_at).toLocaleDateString()}
              </span>
            </td>
            <td className="py-4 px-6 text-center">
              {getStatusBadge(req.status)}
            </td>
            <td className="py-4 px-6 text-center">
              {req.status?.toLowerCase() === 'pending' && (
                <div className="flex justify-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(req.request_id || req.id, 'approved'); }}
                    title={t('requests.title_approve')}
                    className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100"
                  >
                    <CheckIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(req.request_id || req.id, 'rejected'); }}
                    title={t('requests.title_reject')}
                    className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </td>
          </tr>
        )}
      />
    </div>
  );
}
