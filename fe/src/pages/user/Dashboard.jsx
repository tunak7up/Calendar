import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch, getAccessToken } from '../../services/api';
import { taskService } from '../../services/taskService';
import { formatDateTime } from '../../utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ClockIcon, DocumentTextIcon, PaperAirplaneIcon, PlusIcon, DocumentCheckIcon, PaperClipIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import TaskStatusSelect from '../../components/TaskStatusSelect';

const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportId, setReportId] = useState(null);
  const [pendingStatusUpdates, setPendingStatusUpdates] = useState({}); // { task_id: 'status' }
  const [checkingReport, setCheckingReport] = useState(true);
  const [reportAttachments, setReportAttachments] = useState([]);
  const fileInputRef = useRef(null);

  // Get YYYY-MM-DD for local timezone
  const getWorkingDate = () => {
    const d = new Date();
    const pad = n => n < 10 ? '0' + n : n;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  useEffect(() => {
    const checkDailyReport = async () => {
      if (!user) return;
      try {
        const workingDate = getWorkingDate();
        const response = await apiFetch(`/daily-report/person/${user.person_id}/date/${workingDate}`);
        if (response.success && response.data) {
          const report = response.data;
          setReportId(report.report_id || report.id);
          setIsCheckedIn(true);
          
          const parseDate = (dateStr, fallbackDate) => {
            if (!dateStr) return null;
            let d = new Date(dateStr);
            if (isNaN(d.getTime())) {
              // Try prepending the working date if it's just a time string
              d = new Date(`${fallbackDate}T${dateStr}`);
              if (isNaN(d.getTime())) {
                 // Try with a space instead of T for older browsers
                 d = new Date(`${fallbackDate} ${dateStr}`);
              }
            }
            return isNaN(d.getTime()) ? null : d;
          };

          const cIn = parseDate(report.check_in, report.working_date);
          if (cIn) setCheckInTime(cIn);
          
          const cOut = parseDate(report.check_out, report.working_date);
          if (cOut) setCheckOutTime(cOut);
          if (report.description) {
            setReportText(report.description);
          }
        }
      } catch (error) {
        console.error("Error fetching daily report", error);
      } finally {
        setCheckingReport(false);
      }
    };

    checkDailyReport();
    checkDailyReport();
  }, [user]);

  const fetchReportAttachments = useCallback(async () => {
    if (!reportId) return;
    try {
      const res = await apiFetch(`/file-attachment/report/${reportId}`);
      if (res.success) {
        setReportAttachments(res.data);
      }
    } catch (error) {
      console.error('Error fetching report attachments:', error);
    }
  }, [reportId]);

  useEffect(() => {
    if (reportId) {
      fetchReportAttachments();
    }
  }, [reportId, fetchReportAttachments]);

  const fetchTasks = useCallback(async () => {
    if (!user?.person_id) return;
    setLoading(true);
    try {
      const response = await taskService.getAllTasksByParticipantId(user.person_id);
      if (response.success) {
        let pendingTasks = response.data.filter(t => t.status?.toLowerCase() !== 'completed');
        
        pendingTasks.sort((a, b) => {
          const pA = priorityWeight[a.priority] || 0;
          const pB = priorityWeight[b.priority] || 0;
          if (pA !== pB) return pB - pA;
          return new Date(a.due_date) - new Date(b.due_date);
        });

        setTasks(pendingTasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.person_id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCheckIn = async () => {
    try {
      const workingDate = getWorkingDate();
      const response = await apiFetch('/daily-report', {
        method: 'POST',
        body: JSON.stringify({
          person_id: user.person_id,
          working_date: workingDate
        })
      });
      
      if (response.success && response.data) {
        const report = response.data;
        const now = new Date();
        setIsCheckedIn(true);
        setCheckInTime(now);
        setReportId(report.report_id || report.id);
      } else {
        alert(t('dashboard.alert_checkin_fail', { message: response.message || t('dashboard.alert_action_fail') }));
      }
    } catch (error) {
      console.error("Check-in failed", error);
      alert(t('dashboard.alert_checkin_fail_general'));
    }
  };

  const handleSubmitReport = async () => {
    if (!reportText.trim()) {
      alert(checkOutTime ? t('dashboard.alert_enter_report') : t('dashboard.alert_enter_report_checkout'));
      return;
    }

    try {
      // 1. Batch update task statuses
      const taskUpdates = Object.keys(pendingStatusUpdates).map(taskId => {
        return taskService.updateTask(taskId, { status: pendingStatusUpdates[taskId] });
      });
      
      await Promise.all(taskUpdates);

      // 2. Submit Daily Report & Checkout
      if (reportId) {
        const response = await apiFetch(`/daily-report/${reportId}`, {
          method: 'PUT',
          body: JSON.stringify({ description: reportText })
        });
        
        if (response.success) {
          const now = new Date();
          const isUpdating = !!checkOutTime;
          setCheckOutTime(now);
          if (isUpdating) {
            alert(t('dashboard.alert_update_success', { time: now.toLocaleTimeString() }));
          } else {
            alert(t('dashboard.alert_checkout_success', { time: now.toLocaleTimeString() }));
          }
          setPendingStatusUpdates({}); // clear pending updates
          fetchTasks(); // Refresh list to remove completed tasks
        }
      } else {
        alert(t('dashboard.alert_save_fail_no_report'));
      }
    } catch (error) {
      console.error("Submit report failed", error);
      alert(t('dashboard.alert_action_fail'));
    }
  };

  const handleSaveDescription = async () => {
    if (!reportText.trim()) {
      alert(t('dashboard.alert_enter_report'));
      return;
    }

    try {
      if (reportId) {
        const response = await apiFetch(`/daily-report/${reportId}/description`, {
          method: 'PUT',
          body: JSON.stringify({ description: reportText })
        });
        
        if (response.success) {
          alert(t('dashboard.alert_draft_success'));
        }
      } else {
        alert(t('dashboard.alert_save_fail_no_report'));
      }
    } catch (error) {
      console.error("Save description failed", error);
      alert(t('dashboard.alert_save_fail'));
    }
  };

  const handleStatusChange = (newStatus, taskId) => {
    setPendingStatusUpdates(prev => ({
      ...prev,
      [taskId]: newStatus
    }));
  };

  const handleUploadReportFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (!reportId) {
      alert(t('dashboard.alert_upload_no_id'));
      return;
    }

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('attachable_type', 'report');
      formData.append('attachable_id', reportId);

      try {
        await apiFetch('/file-attachment/upload', {
          method: 'POST',
          body: formData,
        });
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    fetchReportAttachments();
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm(t('dashboard.alert_delete_confirm'))) return;
    try {
      const res = await apiFetch(`/file-attachment/${attachmentId}`, { method: 'DELETE' });
      if (res.success) {
        fetchReportAttachments();
      }
    } catch (error) {
      console.error('Delete attachment error:', error);
    }
  };

  const downloadFile = async (url, fileName) => {
    try {
      const headers = {};
      const requestUrl = new URL(url, window.location.origin);
      const isSameOrigin = requestUrl.origin === window.location.origin;

      if (isSameOrigin) {
        const accessToken = getAccessToken();
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }
      }

      const response = await fetch(requestUrl.toString(), {
        headers,
        mode: 'cors',
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight" data-customizable-id="dashboard-welcome" data-customizable-type="text">
            {t('dashboard.welcome', { name: user?.name || user?.username })}
          </h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base" data-customizable-id="dashboard-welcome-sub" data-customizable-type="text">{t('dashboard.subtitle')}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {checkInTime && (
            <div className="bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-3 flex-1 md:flex-none">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider leading-none mb-1">{t('dashboard.checked_in')}</span>
                <span className="text-sm font-bold text-gray-900">
                  {checkInTime instanceof Date && !isNaN(checkInTime) 
                    ? checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                    : '--:--'}
                </span>
              </div>
            </div>
          )}
          {checkOutTime && (
            <div className="bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-blue-100 flex items-center gap-3 flex-1 md:flex-none">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider leading-none mb-1">{t('dashboard.checked_out')}</span>
                <span className="text-sm font-bold text-gray-900">
                  {checkOutTime instanceof Date && !isNaN(checkOutTime) 
                    ? checkOutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                    : '--:--'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {checkingReport ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : !isCheckedIn ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <ClockIcon className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('dashboard.ready_title')}</h2>
          <p className="text-gray-500 mb-8 max-w-md">
            {t('dashboard.ready_subtitle')}
          </p>
          <button
            onClick={handleCheckIn}
            className="px-8 py-3 bg-[#0056b3] hover:bg-[#004494] text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95"
            data-customizable-id="check-in-btn"
            data-customizable-type="bg"
          >
            {t('dashboard.check_in_btn')}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden flex flex-col" data-customizable-id="card-pending-tasks" data-customizable-type="bg">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">{t('dashboard.tasks_pending')}</h2>
              <span className="text-xs font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">{t('dashboard.tasks_count', { count: tasks.length })}</span>
            </div>
            
            <div className="overflow-x-auto overflow-y-auto max-h-[400px] custom-scrollbar">
              <table className="w-full text-left border-collapse relative min-w-[600px]">
                <thead className="sticky top-0 bg-white z-10 shadow-sm">
                  <tr>
                    <th className="py-3 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('dashboard.th_title')}</th>
                    <th className="py-3 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('dashboard.th_priority')}</th>
                    <th className="py-3 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('dashboard.th_deadline')}</th>
                    <th className="py-3 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">{t('dashboard.th_status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="text-center py-12 text-gray-400 font-medium">{t('dashboard.loading_tasks')}</td>
                    </tr>
                  ) : tasks.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-12 text-gray-400 font-medium">
                        {t('dashboard.no_tasks')}
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task) => {
                      const currentStatus = pendingStatusUpdates[task.task_id] || task.status?.toLowerCase() || 'pending';
                      
                      return (
                      <tr 
                        key={task.task_id}
                        onClick={() => navigate(`/tasks/${task.task_id}`, { state: { task } })}
                        className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                      >
                        <td className="py-4 px-6">
                          <p className="font-bold text-gray-900 truncate max-w-[200px] sm:max-w-xs md:max-w-md" title={task.name || task.title}>{task.name || task.title}</p>
                          {task.parent_id && (
                            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                              <div className="w-2 h-2 border-b border-l border-gray-400 inline-block"></div>
                              {t('dashboard.subtask_of', { id: task.parent_id })}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span 
                            data-custom-component={`TaskPriority-${task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1).toLowerCase() : ''}`}
                            className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${
                              task.priority?.toLowerCase() === 'high' ? 'bg-red-100 text-red-700 border-red-200' :
                              task.priority?.toLowerCase() === 'medium' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                              'bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {task.priority?.toLowerCase() === 'high' ? t('dashboard.priority_high') : task.priority?.toLowerCase() === 'medium' ? t('dashboard.priority_medium') : t('dashboard.priority_low')}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600">
                          {formatDateTime(task.due_date)}
                        </td>
                        <td className="py-4 px-6 text-center" onClick={e => e.stopPropagation()}>
                          <TaskStatusSelect 
                            currentStatus={currentStatus}
                            onStatusChange={(newStatus) => handleStatusChange(newStatus, task.task_id)}
                            disabled={!!checkOutTime}
                            dueDate={task.due_date}
                            size="sm"
                          />
                        </td>
                      </tr>
                    );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6" data-customizable-id="card-daily-report" data-customizable-type="bg">
            <div className="flex items-center gap-2 mb-4">
              <DocumentTextIcon className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-800">{t('dashboard.daily_report')}</h2>
            </div>
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder={t('dashboard.report_placeholder')}
              rows={4}
              className="w-full bg-[#f8fafc] border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-4 focus:ring-blue-100 p-4 outline-none resize-none mb-4 shadow-sm"
            />
            
            {/* Attachment Section */}
            <div className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <PaperClipIcon className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">{t('dashboard.attachments', { count: reportAttachments.length })}</span>
                </div>
                <div>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleUploadReportFiles}
                  />
                  <button
                    onClick={() => {
                      if (!reportId) {
                        alert(t('dashboard.alert_upload_no_id_btn'));
                        return;
                      }
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-600 hover:text-white transition-all uppercase tracking-wider"
                    data-customizable-id="btn-add-file"
                    data-customizable-type="bg"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    {t('dashboard.add_file')}
                  </button>
                </div>
              </div>
              
              {reportAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {reportAttachments.map(att => {
                    const fullUrl = `${import.meta.env.VITE_API_URL.replace('/api', '')}${att.url}`;
                    const fileName = att.file_name || 'File đính kèm';
                    return (
                      <div key={att.file_attachment_id} className="flex items-center gap-1 bg-white border border-gray-200 pl-3 pr-1 py-1 rounded-lg shadow-sm group">
                        <button
                          onClick={() => downloadFile(fullUrl, fileName)}
                          className="text-xs font-medium text-gray-700 hover:text-blue-600 truncate max-w-[150px] text-left"
                          title={fileName}
                        >
                          {fileName}
                        </button>
                        <button
                          onClick={() => handleDeleteAttachment(att.file_attachment_id)}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                          title="Xóa file"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleSaveDescription}
                className="flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-bold shadow-sm transition-all"
                data-customizable-id="btn-save-draft"
                data-customizable-type="bg"
              >
                <DocumentCheckIcon className="w-5 h-5 text-gray-500" />
                {t('dashboard.save_draft')}
              </button>
              <button
                onClick={handleSubmitReport}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold shadow-md transition-all active:scale-95 cursor-pointer
                  ${checkOutTime 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20' 
                    : 'bg-[#0056b3] hover:bg-[#004494] text-white shadow-blue-500/20'
                  }`}
                data-customizable-id="btn-submit-report"
                data-customizable-type="bg"
              >
                {checkOutTime ? (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    {t('dashboard.update_report')}
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-5 h-5" />
                    {t('dashboard.submit_report')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
