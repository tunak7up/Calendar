import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { requestService } from '../../../../services/requestService';
import { useAuth } from '../../../../context/AuthContext';

export function useRegistrationHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [isAiRequestModalOpen, setIsAiRequestModalOpen] = useState(false);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const isVi = i18n.language === 'vi';

  const handleAiSuccess = async () => {
    if (!user?.person_id) return;
    try {
      const result = await requestService.getRequestsByRequester(user.person_id);
      if (result.success) {
        const mappedData = result.data.map(item => ({
          id: item.request_id,
          type: item.type,
          date: item.created_at,
          refId: `#REQ-${item.request_id}`,
          status: item.status,
          approver: item.approver ? item.approver.name : 'N/A',
          details: item.details,
          reason: item.reason,
          approverRole: item.approver ? item.approver.role : ''
        }));
        setRequests(mappedData);
      }
    } catch (error) {
      console.error('Error refreshing requests after AI success:', error);
    }
  };

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user?.person_id) return;
      try {
        const result = await requestService.getRequestsByRequester(user.person_id);
        if (result.success) {
          const mappedData = result.data.map(item => ({
            id: item.request_id,
            type: item.type,
            date: item.created_at,
            refId: `#REQ-${item.request_id}`,
            status: item.status,
            approver: item.approver ? item.approver.name : 'N/A',
            details: item.details,
            reason: item.reason,
            approverRole: item.approver ? item.approver.role : ''
          }));
          setRequests(mappedData);
        }
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user?.person_id]);

  const filteredData = useMemo(() => {
    let list = requests.filter(item => {
      let typeLabel = '';
      if (item.type === 'register') {
        typeLabel = t('history.type_register');
      } else if (item.type === 'leave') {
        typeLabel = t('history.type_leave');
      } else if (['arrive_early', 'arrive_late', 'leave_early', 'leave_late'].includes(item.type)) {
        typeLabel = t(`register.exception_${item.type}`);
      } else {
        typeLabel = item.type || '';
      }
      const matchSearch = typeLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.refId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.approver.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === 'all' || item.type === filterType;
      const matchStatus = filterStatus === 'all' || item.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    });

    if (sortKey) {
      list = [...list].sort((a, b) => {
        const aVal = sortKey === 'date' ? new Date(a[sortKey]).getTime() : (a[sortKey] ?? '');
        const bVal = sortKey === 'date' ? new Date(b[sortKey]).getTime() : (b[sortKey] ?? '');
        if (typeof aVal === 'number') return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        return sortDir === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
      });
    }

    return list;
  }, [requests, searchTerm, filterType, filterStatus, sortKey, sortDir, t]);

  const handleRowClick = (item) => {
    navigate(`/history/${item.id}`, { state: { request: item } });
  };

  return {
    t,
    isVi,
    navigate,
    user,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    isNewRequestOpen,
    setIsNewRequestOpen,
    loading,
    currentPage,
    setCurrentPage,
    pageSize,
    isAiRequestModalOpen,
    setIsAiRequestModalOpen,
    filteredData,
    handleAiSuccess,
    handleRowClick,
    setSortKey,
    setSortDir
  };
}
