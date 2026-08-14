import { useState, useEffect, useMemo, useCallback } from 'react';
import { dailyReportService } from '../../../../services/dailyReportService';
import { useAuth } from '../../../../context/AuthContext';
import { useTranslation } from 'react-i18next';

export function useReportHistory() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 12);
  const formatLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const [startDate, setStartDate] = useState(formatLocal(firstDayOfMonth));
  const [endDate, setEndDate] = useState(formatLocal(today));

  const [selectedReport, setSelectedReport] = useState(null);

  const [sortKey, setSortKey] = useState('working_date');
  const [sortDir, setSortDir] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const fetchData = useCallback(async () => {
    if (!user?.person_id) return;
    setLoading(true);
    try {
      const repRes = await dailyReportService.getDailyReportByPersonId(user.person_id);
      if (repRes.success && Array.isArray(repRes.data)) {
        const filtered = repRes.data.filter(r => {
          const dateStr = r.working_date.split('T')[0];
          return dateStr >= startDate && dateStr <= endDate;
        });
        setReports(filtered);
      }
    } catch (error) {
      console.error('Error fetching report history:', error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, user?.person_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const STATUS_DONE = 'done';
  const STATUS_WORKING = 'working';
  const STATUS_PENDING = 'pending';

  const displayData = useMemo(() => {
    return reports.map(report => {
      return {
        ...report,
        employee_name: user?.name || user?.username || `Employee ${report.person_id}`,
        statusKey: report.check_out ? STATUS_DONE : (report.check_in ? STATUS_WORKING : STATUS_PENDING)
      };
    });
  }, [reports, user]);

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
    { key: 'check_in', label: t('reporthistory.col_checkin'), sortable: true },
    { key: 'check_out', label: t('reporthistory.col_checkout'), sortable: true },
    { key: 'check_in_machine', label: t('reporthistory.col_checkin_machine', { defaultValue: 'Vào (Máy)' }), sortable: true },
    { key: 'check_out_machine', label: t('reporthistory.col_checkout_machine', { defaultValue: 'Ra (Máy)' }), sortable: true },
    { key: 'statusKey', label: t('reporthistory.col_status'), sortable: true }
  ];

  return {
    t,
    reports,
    loading,
    isAiModalOpen,
    setIsAiModalOpen,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedReport,
    setSelectedReport,
    sortKey,
    setSortKey,
    sortDir,
    setSortDir,
    currentPage,
    setCurrentPage,
    pageSize,
    sortedData,
    columns,
    STATUS_DONE,
    STATUS_WORKING,
    STATUS_PENDING
  };
}
