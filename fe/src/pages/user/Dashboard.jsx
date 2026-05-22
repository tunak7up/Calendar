import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch, getAccessToken } from '../../services/api';
import { taskService } from '../../services/taskService';
import { formatDateTime } from '../../utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ClockIcon, DocumentTextIcon, PaperAirplaneIcon, PlusIcon, DocumentCheckIcon, PaperClipIcon, TrashIcon } from '@heroicons/react/24/outline';

const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const fetchReportAttachments = async () => {
    if (!reportId) return;
    try {
      const res = await apiFetch(`/file-attachment/report/${reportId}`);
      if (res.success) {
        setReportAttachments(res.data);
      }
    } catch (error) {
      console.error('Error fetching report attachments:', error);
    }
  };

  useEffect(() => {
    if (reportId) {
      fetchReportAttachments();
    }
  }, [reportId]);

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
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
  };

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
        alert(`Check-in failed: ${response.message || 'Unknown server error'}`);
      }
    } catch (error) {
      console.error("Check-in failed", error);
      alert("Failed to check-in. Please try again.");
    }
  };

  const handleSubmitReport = async () => {
    if (!reportText.trim()) {
      alert(checkOutTime ? 'Vui lòng nhập nội dung báo cáo!' : 'Vui lòng nhập báo cáo công việc trước khi check-out!');
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
            alert(`Đã cập nhật báo cáo thành công lúc ${now.toLocaleTimeString()}`);
          } else {
            alert(`Đã gửi báo cáo và Check-out thành công lúc ${now.toLocaleTimeString()}`);
          }
          setPendingStatusUpdates({}); // clear pending updates
          fetchTasks(); // Refresh list to remove completed tasks
        }
      } else {
        alert("Report ID not found, please refresh the page.");
      }
    } catch (error) {
      console.error("Submit report failed", error);
      alert("Gặp lỗi trong quá trình xử lý, vui lòng thử lại.");
    }
  };

  const handleSaveDescription = async () => {
    if (!reportText.trim()) {
      alert('Vui lòng nhập nội dung báo cáo!');
      return;
    }

    try {
      if (reportId) {
        const response = await apiFetch(`/daily-report/${reportId}/description`, {
          method: 'PUT',
          body: JSON.stringify({ description: reportText })
        });
        
        if (response.success) {
          alert('Đã lưu nội dung báo cáo thành công!');
        }
      } else {
        alert("Không tìm thấy ID báo cáo, vui lòng Check-in trước.");
      }
    } catch (error) {
      console.error("Save description failed", error);
      alert("Lưu báo cáo thất bại, vui lòng thử lại.");
    }
  };

  const handleStatusChange = (e, taskId) => {
    e.stopPropagation(); // Ngăn click vào row
    setPendingStatusUpdates(prev => ({
      ...prev,
      [taskId]: e.target.value
    }));
  };

  const handleUploadReportFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (!reportId) {
      alert('Vui lòng Check-in để tạo báo cáo trước khi đính kèm file.');
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
    if (!window.confirm('Xóa file đính kèm này?')) return;
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
      const accessToken = getAccessToken();
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(url, { headers });
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Chào mừng trở lại, {user?.name || user?.username}!
          </h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Đây là tổng quan không gian làm việc của bạn hôm nay.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {checkInTime && (
            <div className="bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-3 flex-1 md:flex-none">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider leading-none mb-1">Đã Check-in</span>
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
                <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider leading-none mb-1">Đã Check-out</span>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sẵn sàng bắt đầu ngày mới?</h2>
          <p className="text-gray-500 mb-8 max-w-md">
            Vui lòng check-in để điểm danh và xem công việc của bạn hôm nay.
          </p>
          <button
            onClick={handleCheckIn}
            className="px-8 py-3 bg-[#0056b3] hover:bg-[#004494] text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95"
          >
            Check-in ngay
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Công việc đang chờ</h2>
              <span className="text-xs font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">{tasks.length} Công việc</span>
            </div>
            
            <div className="overflow-x-auto overflow-y-auto max-h-[400px] custom-scrollbar">
              <table className="w-full text-left border-collapse relative min-w-[600px]">
                <thead className="sticky top-0 bg-white z-10 shadow-sm">
                  <tr>
                    <th className="py-3 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tiêu đề</th>
                    <th className="py-3 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ưu tiên</th>
                    <th className="py-3 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hạn chót</th>
                    <th className="py-3 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="text-center py-12 text-gray-400 font-medium">Đang tải công việc...</td>
                    </tr>
                  ) : tasks.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-12 text-gray-400 font-medium">
                        Bạn không có công việc nào đang chờ hôm nay. Tuyệt vời!
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
                          <p className="font-bold text-gray-900">{task.name || task.title}</p>
                          {task.parent_id && (
                            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                              <div className="w-2 h-2 border-b border-l border-gray-400 inline-block"></div>
                              Công việc con của REQ-{task.parent_id}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${
                            task.priority === 'High' ? 'bg-red-100 text-red-700 border-red-200' :
                            task.priority === 'Medium' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                            'bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}>
                            {task.priority === 'High' ? 'Cao' : task.priority === 'Medium' ? 'Trung bình' : 'Thấp'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600">
                          {formatDateTime(task.due_date)}
                        </td>
                        <td className="py-4 px-6 text-center" onClick={e => e.stopPropagation()}>
                          <select 
                            value={currentStatus}
                            onChange={(e) => handleStatusChange(e, task.task_id)}
                            disabled={!!checkOutTime}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 outline-none ring-1 ring-inset cursor-pointer
                              ${currentStatus === 'completed' ? 'bg-green-50 text-green-700 ring-green-600/20 hover:bg-green-100' :
                                currentStatus === 'in progress' ? 'bg-blue-50 text-blue-700 ring-blue-600/20 hover:bg-blue-100' :
                                'bg-gray-50 text-gray-700 ring-gray-500/20 hover:bg-gray-100'}
                            `}
                          >
                            <option value="pending" className="bg-white text-gray-900 font-medium">Chờ xử lý</option>
                            <option value="in progress" className="bg-white text-gray-900 font-medium">Đang thực hiện</option>
                            <option value="completed" className="bg-white text-gray-900 font-medium">Hoàn thành</option>
                          </select>
                        </td>
                      </tr>
                    );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <DocumentTextIcon className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-800">Báo cáo hàng ngày</h2>
            </div>
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Bạn đã hoàn thành được gì hôm nay? Có khó khăn gì không?"
              rows={4}
              className="w-full bg-[#f8fafc] border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-4 focus:ring-blue-100 p-4 outline-none resize-none mb-4 shadow-sm"
            />
            
            {/* Attachment Section */}
            <div className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <PaperClipIcon className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">Tài liệu đính kèm ({reportAttachments.length})</span>
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
                        alert('Vui lòng Check-in trước khi tải lên tài liệu!');
                        return;
                      }
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-600 hover:text-white transition-all uppercase tracking-wider"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    Thêm file
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
              >
                <DocumentCheckIcon className="w-5 h-5 text-gray-500" />
                Lưu nháp
              </button>
              <button
                onClick={handleSubmitReport}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold shadow-md transition-all active:scale-95 cursor-pointer
                  ${checkOutTime 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20' 
                    : 'bg-[#0056b3] hover:bg-[#004494] text-white shadow-blue-500/20'
                  }`}
              >
                {checkOutTime ? (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    Cập nhật báo cáo
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-5 h-5" />
                    Gửi báo cáo & Check-out
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
