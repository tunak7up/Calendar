import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiFetch, BASE_URL, getAccessToken, setAccessToken } from '../../../../services/api';
import { scheduleService } from '../../../../services/scheduleService';

const MONTH_NAMES_VI = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];
const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function useAdminWorkHours() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const formatLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const [startDate, setStartDate] = useState(formatLocal(firstDay));
  const [endDate, setEndDate] = useState(formatLocal(lastDay));
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [dailyReports, setDailyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const fileInputRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, schedRes, reportRes] = await Promise.all([
        apiFetch('/person'),
        scheduleService.getAllSchedules(),
        apiFetch(`/daily-report/range?start=${startDate}&end=${endDate}`)
      ]);

      if (empRes.success) setEmployees(empRes.data);
      if (schedRes.success) setSchedules(schedRes.data);
      if (reportRes.success) setDailyReports(reportRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async () => {
    const employeeList = employees.filter(emp => emp.role !== 'manager');
    const allowedEmployeeIds = employeeList.map(emp => emp.person_id);

    const personIdsWithReports = [...new Set(dailyReports.map(r => r.person_id))]
      .filter(id => allowedEmployeeIds.includes(id));

    const ids = selectedEmployeeIds.length > 0
      ? selectedEmployeeIds.map(Number).filter(id => personIdsWithReports.includes(id))
      : personIdsWithReports;

    if (ids.length === 0) {
      alert(t('workhours.export_empty_alert'));
      return;
    }

    setExporting(true);
    try {
      let accessToken = getAccessToken();
      let response = await fetch(`${BASE_URL}/daily-report/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ personIds: ids, startDate, endDate })
      });

      if (response.status === 403) {
        try {
          const refreshRes = await fetch(`${BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            accessToken = refreshData.token;
            setAccessToken(accessToken);

            response = await fetch(`${BASE_URL}/daily-report/export`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`
              },
              credentials: 'include',
              body: JSON.stringify({ personIds: ids, startDate, endDate })
            });
          }
        } catch {
          throw new Error('Token hết hạn, vui lòng đăng nhập lại');
        }
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Export thất bại');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `work_hours_${startDate}_${endDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(t('workhours.export_error') + error.message);
    } finally {
      setExporting(false);
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setImporting(true);
    try {
      let accessToken = getAccessToken();
      let response = await fetch(`${BASE_URL}/daily-report/preview-import`, {
        method: 'POST',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        credentials: 'include',
        body: formData
      });

      if (response.status === 403) {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          accessToken = refreshData.token;
          setAccessToken(accessToken);
          response = await fetch(`${BASE_URL}/daily-report/preview-import`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
            credentials: 'include',
            body: formData
          });
        }
      }

      const data = await response.json();
      if (response.ok && data.data) {
        setPreviewData(data.data);
        setShowReviewModal(true);
      } else {
        alert(data.message || 'Lỗi đọc file Excel');
      }
    } catch (err) {
      console.error('Error previewing daily reports:', err);
      alert('Lỗi import dữ liệu: ' + err.message);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const parseTimeToHours = (startStr, endStr) => {
    if (!startStr || !endStr) return 0;
    try {
      const start = new Date(startStr);
      const end = new Date(endStr);
      let rawHours;
      let startSeconds;
      let endSeconds;
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        const [sH, sM] = startStr.split(':').map(Number);
        const [eH, eM] = endStr.split(':').map(Number);
        if (!isNaN(sH) && !isNaN(eH)) {
          rawHours = Math.max(0, (eH + eM / 60) - (sH + sM / 60));
          startSeconds = sH * 3600 + sM * 60;
          endSeconds = eH * 3600 + eM * 60;
        } else {
          return 0;
        }
      } else {
        const diffMs = end.getTime() - start.getTime();
        rawHours = Math.max(0, diffMs / (1000 * 60 * 60));
        startSeconds = start.getHours() * 3600 + start.getMinutes() * 60 + start.getSeconds();
        endSeconds = end.getHours() * 3600 + end.getMinutes() * 60 + end.getSeconds();
      }

      const spansLunch = startSeconds < 43200 && endSeconds > 46800;
      const breakDeduction = spansLunch ? 1.0 : 0.0;
      return Math.max(0, rawHours - breakDeduction);
    } catch {
      return 0;
    }
  };

  const filteredSchedules = schedules.filter(s => {
    const workingDate = s.working_date.split('T')[0];
    return workingDate >= startDate && workingDate <= endDate;
  });

  const employeeList = employees.filter(emp => emp.role !== 'manager');

  const employeeSummary = employeeList.map(emp => {
    const empSchedules = filteredSchedules.filter(s => s.person_id === emp.person_id);
    const empReports = dailyReports.filter(r => r.person_id === emp.person_id);
    const totalDays = empReports.length;
    const registeredHours = empSchedules.reduce((sum, s) => sum + parseTimeToHours(s.start_time, s.end_time), 0);
    const actualHours = empReports.reduce((sum, r) => {
      const getMinTime = (t1, t2) => {
        if (!t1) return t2 || null;
        if (!t2) return t1 || null;
        return t1 < t2 ? t1 : t2;
      };
      const getMaxTime = (t1, t2) => {
        if (!t1) return t2 || null;
        if (!t2) return t1 || null;
        return t1 > t2 ? t1 : t2;
      };

      const cIn = getMinTime(r.check_in, r.check_in_machine);
      const cOut = getMaxTime(r.check_out, r.check_out_machine);
      if (!cIn || !cOut) return sum;

      const [sH, sM, sS] = cIn.split(':').map(Number);
      const [eH, eM, eS] = cOut.split(':').map(Number);

      const startSeconds = sH * 3600 + sM * 60 + (sS || 0);
      const endSeconds = eH * 3600 + eM * 60 + (eS || 0);

      const rawHours = Math.max(0, (endSeconds - startSeconds) / 3600);

      const spansLunch = startSeconds < 43200 && endSeconds > 46800;
      const breakDeduction = spansLunch ? 1.0 : 0.0;

      return sum + Math.max(0, rawHours - breakDeduction);
    }, 0);

    return {
      ...emp,
      totalDays,
      registeredHours: Math.round(registeredHours * 100) / 100,
      actualHours: Math.round(actualHours * 100) / 100
    };
  }).filter(emp => {
    if (selectedEmployeeIds.length === 0) return true;
    return selectedEmployeeIds.includes(emp.person_id.toString());
  });

  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const sortedSummary = useMemo(() => {
    let list = [...employeeSummary];
    if (sortKey) {
      list.sort((a, b) => {
        const aVal = a[sortKey] ?? '';
        const bVal = b[sortKey] ?? '';
        if (typeof aVal === 'number') return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        return sortDir === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
      });
    }
    return list;
  }, [employeeSummary, sortKey, sortDir]);

  const columns = [
    { key: 'name', label: t('workhours.col_employee'), sortable: true },
    { key: 'totalDays', label: t('workhours.col_days'), sortable: true, align: 'center' },
    { key: 'registeredHours', label: t('workhours.col_registered'), sortable: true, align: 'center' },
    { key: 'actualHours', label: t('workhours.col_actual'), sortable: true, align: 'center' },
    { key: 'status', label: t('workhours.col_status'), sortable: false, align: 'center' },
  ];

  let monthYearLabel = t('workhours.all_time') !== 'workhours.all_time' ? t('workhours.all_time') : 'Vui lòng chọn tháng';
  if (startDate) {
    const d = new Date(startDate);
    if (!isNaN(d.getTime())) {
      const MONTH_NAMES = i18n.language === 'vi' ? MONTH_NAMES_VI : MONTH_NAMES_EN;
      monthYearLabel = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    }
  }

  return {
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
  };
}
