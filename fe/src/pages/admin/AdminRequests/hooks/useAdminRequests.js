import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../../../services/api';
import { requestService } from '../../../../services/requestService';

export function useAdminRequests() {
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

  return {
    t,
    navigate,
    requests,
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
  };
}
