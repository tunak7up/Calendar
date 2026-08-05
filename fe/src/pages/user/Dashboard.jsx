import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch, getAccessToken } from "../../services/api";
import { taskService } from "../../services/taskService";
import { taskStatusService } from "../../services/taskStatusService";
import { formatDateTime } from "../../utils/dateUtils";
import { useNavigate } from "react-router-dom";
import {
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  PlusIcon,
  DocumentCheckIcon,
  PaperClipIcon,
  TrashIcon,
  CalendarIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import TaskStatusSelect from "../../components/TaskStatusSelect";
import AIReportModal from "../../components/AIReportModal/AIReportModal";
import { Capacitor } from "@capacitor/core";
import PWABanner from "../../components/PWABanner";

const priorityWeight = { High: 3, Medium: 2, Low: 1 };

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportId, setReportId] = useState(null);
  const [pendingStatusUpdates, setPendingStatusUpdates] = useState({}); // { task_id: 'status' }
  const [checkingReport, setCheckingReport] = useState(true);
  const [reportAttachments, setReportAttachments] = useState([]);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [newStatusLabel, setNewStatusLabel] = useState("");
  const [showAddStatusInput, setShowAddStatusInput] = useState(false);
  const fileInputRef = useRef(null);
  const reportTextareaRef = useRef(null);

  const [isMobile, setIsMobile] = useState(() => {
    return Capacitor.isNativePlatform() || window.innerWidth < 768;
  });

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const boardContainerRef = useRef(null);
  const scrollIntervalRef = useRef(null);
  const scrollDirectionRef = useRef(null);

  const stopScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    scrollDirectionRef.current = null;
  }, []);

  const handleAutoScroll = useCallback(
    (e) => {
      if (!boardContainerRef.current) return;

      const container = boardContainerRef.current;
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX;

      // Define boundary threshold (70px from edges) and scrolling speed
      const threshold = 70;
      const speed = 10;

      const distFromLeft = clientX - rect.left;
      const distFromRight = rect.right - clientX;

      if (distFromRight < threshold && distFromRight > 0) {
        if (scrollDirectionRef.current !== "right") {
          stopScroll();
          scrollDirectionRef.current = "right";
          scrollIntervalRef.current = setInterval(() => {
            container.scrollLeft += speed;
          }, 16);
        }
      } else if (distFromLeft < threshold && distFromLeft > 0) {
        if (scrollDirectionRef.current !== "left") {
          stopScroll();
          scrollDirectionRef.current = "left";
          scrollIntervalRef.current = setInterval(() => {
            container.scrollLeft -= speed;
          }, 16);
        }
      } else {
        stopScroll();
      }
    },
    [stopScroll],
  );

  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, []);

  // Get YYYY-MM-DD for local timezone
  const getWorkingDate = () => {
    const d = new Date();
    const pad = (n) => (n < 10 ? "0" + n : n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const adjustReportTextareaHeight = useCallback(() => {
    const textarea = reportTextareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const maxHeight = 300;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, []);

  useEffect(() => {
    const checkDailyReport = async () => {
      if (!user) return;
      try {
        const workingDate = getWorkingDate();
        const response = await apiFetch(
          `/daily-report/person/${user.person_id}/date/${workingDate}`,
        );
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
  }, [user]);

  useEffect(() => {
    adjustReportTextareaHeight();
  }, [reportText, adjustReportTextareaHeight]);

  const fetchReportAttachments = useCallback(async () => {
    if (!reportId) return;
    try {
      const res = await apiFetch(`/file-attachment/report/${reportId}`);
      if (res.success) {
        setReportAttachments(res.data);
      }
    } catch (error) {
      console.error("Error fetching report attachments:", error);
    }
  }, [reportId]);

  useEffect(() => {
    if (reportId) {
      fetchReportAttachments();
    }
  }, [reportId, fetchReportAttachments]);

  const fetchStatuses = useCallback(async () => {
    try {
      const res = await taskStatusService.getAllStatuses();
      if (res.success) {
        setStatuses(res.data);
      }
    } catch (error) {
      console.error("Error fetching statuses:", error);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    if (!user?.person_id) return;
    setLoading(true);
    try {
      const response = await taskService.getAllTasksByParticipantId(
        user.person_id,
      );
      if (response.success) {
        let allTasks = response.data;

        // Filter: get tasks that are within deadline (not overdue) OR tasks that are not completed
        const now = new Date();
        allTasks = allTasks.filter((task) => {
          const isWithinDeadline =
            !task.due_date || new Date(task.due_date) >= now;
          const isNotCompleted = task.status?.toLowerCase() !== "completed";
          return isWithinDeadline || isNotCompleted;
        });

        allTasks.sort((a, b) => {
          const pA = priorityWeight[a.priority] || 0;
          const pB = priorityWeight[b.priority] || 0;
          if (pA !== pB) return pB - pA;
          return new Date(a.due_date) - new Date(b.due_date);
        });

        setTasks(allTasks);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.person_id]);

  useEffect(() => {
    fetchTasks();
    fetchStatuses();
  }, [fetchTasks, fetchStatuses]);

  const handleCheckIn = async () => {
    try {
      const workingDate = getWorkingDate();
      const response = await apiFetch("/daily-report", {
        method: "POST",
        body: JSON.stringify({
          person_id: user.person_id,
          working_date: workingDate,
        }),
      });

      if (response.success && response.data) {
        const report = response.data;
        const now = new Date();
        setIsCheckedIn(true);
        setCheckInTime(now);
        setReportId(report.report_id || report.id);
      } else {
        alert(
          t("dashboard.alert_checkin_fail", {
            message: response.message || t("dashboard.alert_action_fail"),
          }),
        );
      }
    } catch (error) {
      console.error("Check-in failed", error);
      alert(t("dashboard.alert_checkin_fail_general"));
    }
  };

  const handleSubmitReport = async () => {
    if (!reportText.trim()) {
      alert(
        checkOutTime
          ? t("dashboard.alert_enter_report")
          : t("dashboard.alert_enter_report_checkout"),
      );
      return;
    }

    try {
      // 1. Batch update task statuses
      const taskUpdates = Object.keys(pendingStatusUpdates).map((taskId) => {
        return taskService.updateTask(taskId, {
          status: pendingStatusUpdates[taskId],
        });
      });

      await Promise.all(taskUpdates);

      // 2. Submit Daily Report & Checkout
      if (reportId) {
        const response = await apiFetch(`/daily-report/${reportId}`, {
          method: "PATCH",
          body: JSON.stringify({ description: reportText }),
        });

        if (response.success) {
          const now = new Date();
          const isUpdating = !!checkOutTime;
          setCheckOutTime(now);
          if (isUpdating) {
            alert(
              t("dashboard.alert_update_success", {
                time: now.toLocaleTimeString(),
              }),
            );
          } else {
            alert(
              t("dashboard.alert_checkout_success", {
                time: now.toLocaleTimeString(),
              }),
            );
          }
          setPendingStatusUpdates({}); // clear pending updates
          fetchTasks(); // Refresh list to remove completed tasks
        }
      } else {
        alert(t("dashboard.alert_save_fail_no_report"));
      }
    } catch (error) {
      console.error("Submit report failed", error);
      alert(t("dashboard.alert_action_fail"));
    }
  };

  const handleSaveDescription = async () => {
    if (!reportText.trim()) {
      alert(t("dashboard.alert_enter_report"));
      return;
    }

    try {
      if (reportId) {
        const response = await apiFetch(
          `/daily-report/${reportId}/description`,
          {
            method: "PATCH",
            body: JSON.stringify({ description: reportText }),
          },
        );

        if (response.success) {
          alert(t("dashboard.alert_draft_success"));
        }
      } else {
        alert(t("dashboard.alert_save_fail_no_report"));
      }
    } catch (error) {
      console.error("Save description failed", error);
      alert(t("dashboard.alert_save_fail"));
    }
  };

  const handleStatusChange = async (newStatus, taskId) => {
    setTasks((prev) =>
      prev.map((t) => (t.task_id === taskId ? { ...t, status: newStatus } : t)),
    );
    setPendingStatusUpdates((prev) => ({
      ...prev,
      [taskId]: newStatus,
    }));

    try {
      await taskService.updateTask(taskId, { status: newStatus });
    } catch (error) {
      console.error("Error updating task status on backend:", error);
      alert("Không thể cập nhật trạng thái công việc trên máy chủ.");
      fetchTasks();
    }
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("text/plain", taskId.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    stopScroll();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    handleAutoScroll(e);
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    stopScroll();
    const taskIdStr = e.dataTransfer.getData("text/plain");
    if (!taskIdStr) return;
    const taskId = parseInt(taskIdStr, 10);
    handleStatusChange(targetStatus, taskId);
  };

  const handleAddStatus = async () => {
    if (!newStatusLabel.trim()) return;
    try {
      const name = newStatusLabel.trim().toLowerCase();
      const label = newStatusLabel.trim();
      const res = await taskStatusService.createStatus({ name, label });
      if (res.success) {
        setNewStatusLabel("");
        setShowAddStatusInput(false);
        await fetchStatuses();
      }
    } catch (error) {
      alert("Không thể tạo trạng thái mới: " + error.message);
    }
  };

  const handleDeleteStatus = async (statusName) => {
    if (["pending", "in progress", "completed"].includes(statusName)) {
      alert("Không thể xóa trạng thái mặc định.");
      return;
    }
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa cột trạng thái này? Các công việc trong cột này sẽ được chuyển về "Chưa bắt đầu".`,
      )
    ) {
      return;
    }
    try {
      const res = await taskStatusService.deleteStatus(statusName);
      if (res.success) {
        await fetchStatuses();
        await fetchTasks();
      }
    } catch (error) {
      alert("Lỗi xóa trạng thái: " + error.message);
    }
  };

  const tasksByStatus = useMemo(() => {
    const groups = {};
    statuses.forEach((s) => {
      groups[s.name] = [];
    });
    tasks.forEach((task) => {
      const currentStatus = task.status?.toLowerCase() || "pending";

      // Do not show completed tasks that are past their due date
      if (currentStatus === "completed" && task.due_date) {
        if (new Date(task.due_date) < new Date()) {
          return;
        }
      }

      if (!groups[currentStatus]) {
        groups[currentStatus] = [];
      }
      groups[currentStatus].push(task);
    });
    return groups;
  }, [tasks, statuses]);

  const handleUploadReportFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (!reportId) {
      alert(t("dashboard.alert_upload_no_id"));
      return;
    }

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("attachable_type", "report");
      formData.append("attachable_id", reportId);

      try {
        await apiFetch("/file-attachment/upload", {
          method: "POST",
          body: formData,
        });
      } catch (error) {
        console.error("Upload error:", error);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    fetchReportAttachments();
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm(t("dashboard.alert_delete_confirm"))) return;
    try {
      const res = await apiFetch(`/file-attachment/${attachmentId}`, {
        method: "DELETE",
      });
      if (res.success) {
        fetchReportAttachments();
      }
    } catch (error) {
      console.error("Delete attachment error:", error);
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
          headers["Authorization"] = `Bearer ${accessToken}`;
        }
      }

      const response = await fetch(requestUrl.toString(), {
        headers,
        mode: "cors",
      });
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
      window.open(url, "_blank");
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight"
            data-customizable-id="dashboard-welcome"
            data-customizable-type="text"
          >
            {t("dashboard.welcome", { name: user?.name || user?.username })}
          </h1>
          <p
            className="text-gray-500 mt-1 text-sm sm:text-base"
            data-customizable-id="dashboard-welcome-sub"
            data-customizable-type="text"
          >
            {t("dashboard.subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {checkInTime && (
            <div className="bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-3 flex-1 md:flex-none">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider leading-none mb-1">
                  {t("dashboard.checked_in")}
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {checkInTime instanceof Date && !isNaN(checkInTime)
                    ? checkInTime.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : "--:--"}
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
                <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider leading-none mb-1">
                  {t("dashboard.checked_out")}
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {checkOutTime instanceof Date && !isNaN(checkOutTime)
                    ? checkOutTime.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : "--:--"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <PWABanner />

      {checkingReport ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : !isCheckedIn ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <ClockIcon className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t("dashboard.ready_title")}
          </h2>
          <p className="text-gray-500 mb-8 max-w-md">
            {t("dashboard.ready_subtitle")}
          </p>
          <button
            onClick={handleCheckIn}
            className="px-8 py-3 bg-[#0056b3] hover:bg-[#004494] text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95"
            data-customizable-id="check-in-btn"
            data-customizable-type="bg"
          >
            {t("dashboard.check_in_btn")}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Daily Report Section */}
          <div
            className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6"
            data-customizable-id="card-daily-report"
            data-customizable-type="bg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-800">
                  {t("dashboard.daily_report")}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>✨ Tạo báo cáo bằng AI</span>
              </button>
            </div>
            <textarea
              ref={reportTextareaRef}
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              onInput={adjustReportTextareaHeight}
              placeholder={t("dashboard.report_placeholder")}
              rows={4}
              className="w-full bg-[#f8fafc] border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-4 focus:ring-blue-100 p-4 outline-none resize-none mb-4 shadow-sm overflow-hidden"
              style={{ minHeight: 120, maxHeight: 300 }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  const val = e.target.value;
                  if (val.length === 0 || val.endsWith("\n")) {
                    e.preventDefault();
                    handleSubmitReport();
                  }
                }
              }}
            />

            {/* Attachment Section */}
            <div className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <PaperClipIcon className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">
                    {t("dashboard.attachments", {
                      count: reportAttachments.length,
                    })}
                  </span>
                </div>
                <div>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleUploadReportFiles}
                  />
                  <button
                    onClick={() => {
                      if (!reportId) {
                        alert(t("dashboard.alert_upload_no_id_btn"));
                        return;
                      }
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-600 hover:text-white transition-all uppercase tracking-wider"
                    data-customizable-id="btn-add-file"
                    data-customizable-type="bg"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    {t("dashboard.add_file")}
                  </button>
                </div>
              </div>

              {reportAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {reportAttachments.map((att) => {
                    const fullUrl = `${import.meta.env.VITE_API_URL.replace("/api", "")}${att.url}`;
                    const fileName = att.file_name || "File đính kèm";
                    return (
                      <div
                        key={att.file_attachment_id}
                        className="flex items-center gap-1 bg-white border border-gray-200 pl-3 pr-1 py-1 rounded-lg shadow-sm group"
                      >
                        <button
                          onClick={() => downloadFile(fullUrl, fileName)}
                          className="text-xs font-medium text-gray-700 hover:text-blue-600 truncate max-w-[150px] text-left"
                          title={fileName}
                        >
                          {fileName}
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteAttachment(att.file_attachment_id)
                          }
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
                {t("dashboard.save_draft")}
              </button>
              <button
                onClick={handleSubmitReport}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold shadow-md transition-all active:scale-95 cursor-pointer
                  ${checkOutTime
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                    : "bg-[#0056b3] hover:bg-[#004494] text-white shadow-blue-500/20"
                  }`}
                data-customizable-id="btn-submit-report"
                data-customizable-type="bg"
              >
                {checkOutTime ? (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    {t("dashboard.update_report")}
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-5 h-5" />
                    {t("dashboard.submit_report")}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Kanban Board Container */}
          <div className="flex flex-col gap-4">
            {!isMobile && (
              <div className="flex justify-between items-center bg-gray-50/50 px-6 py-4 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    {t("dashboard.tasks_pending")}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t("dashboard.tasks_pending_subtitle")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {showAddStatusInput ? (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                      <input
                        type="text"
                        placeholder={t("dashboard.add_column_placeholder")}
                        value={newStatusLabel}
                        onChange={(e) => setNewStatusLabel(e.target.value)}
                        className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <button
                        onClick={handleAddStatus}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                      >
                        {t("dashboard.save")}
                      </button>
                      <button
                        onClick={() => {
                          setShowAddStatusInput(false);
                          setNewStatusLabel("");
                        }}
                        className="p-1.5 hover:bg-gray-100 text-gray-400 rounded-xl"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddStatusInput(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-[#0056b3] border border-gray-200 rounded-xl text-xs font-bold shadow-sm transition-all"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                      {t("dashboard.add_column")}
                    </button>
                  )}
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-20 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : isMobile ? (
              <div className="space-y-4">
                {tasks.length === 0 ? (
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
                    <p className="text-gray-500">
                      {t("dashboard.no_tasks") || "Không có công việc nào"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {tasks.map((task) => {
                      const isOverdue =
                        task.due_date &&
                        new Date(task.due_date) < new Date() &&
                        task.status !== "completed";

                      return (
                        <div
                          key={task.task_id}
                          className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-4 relative focus-within:z-20"
                        >
                          {isOverdue && (
                            <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 rounded-t-2xl" />
                          )}

                          {/* Header: ID & Title */}
                          <div className="flex justify-between items-start gap-4">
                            <div
                              onClick={() =>
                                navigate(`/tasks/${task.task_id}`, {
                                  state: { task },
                                })
                              }
                              className="cursor-pointer group flex-1"
                            >
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                                REQ-{task.task_id}
                              </span>
                              <h3 className="font-extrabold text-gray-900 text-base leading-snug group-hover:text-[#0056b3] transition-colors line-clamp-2">
                                {task.name || task.title}
                              </h3>
                              {task.parent_id && (
                                <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 border-b border-l border-gray-400 inline-block"></div>
                                  <span>Subtask of REQ-{task.parent_id}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Info: Priority & Due date */}
                          <div className="flex flex-wrap items-center gap-3 pt-1">
                            {/* Priority */}
                            <span
                              data-custom-component={`TaskPriority-${task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1).toLowerCase() : ""}`}
                              className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full border uppercase tracking-wider ${task.priority?.toLowerCase() === "high"
                                  ? "bg-red-50 text-red-700 border-red-100"
                                  : task.priority?.toLowerCase() === "medium"
                                    ? "bg-amber-50 text-amber-700 border-amber-100"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                }`}
                            >
                              {task.priority?.toLowerCase() === "high"
                                ? t("dashboard.priority_high")
                                : task.priority?.toLowerCase() === "medium"
                                  ? t("dashboard.priority_medium")
                                  : t("dashboard.priority_low")}
                            </span>

                            {/* Due Date */}
                            {task.due_date && (
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${isOverdue
                                    ? "bg-red-50 text-red-600 border-red-100"
                                    : "bg-gray-50 text-gray-500 border-gray-200"
                                  }`}
                              >
                                <CalendarIcon className="w-3.5 h-3.5" />
                                {new Date(task.due_date).toLocaleDateString(
                                  i18n.language === "vi" ? "vi-VN" : "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </span>
                            )}
                          </div>

                          {/* Footer: Assigner & Status Select */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            {/* Assigner */}
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                                <UserIcon className="w-3 h-3 text-[#0056b3]" />
                              </div>
                              <span className="text-xs font-semibold text-gray-600 max-w-[100px] truncate">
                                {task.assigner || "N/A"}
                              </span>
                            </div>

                            {/* Status Select */}
                            <div className="relative">
                              <TaskStatusSelect
                                currentStatus={task.status}
                                dueDate={task.due_date}
                                statusesList={statuses}
                                size="sm"
                                onStatusChange={(newStatus) =>
                                  handleStatusChange(newStatus, task.task_id)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div
                ref={boardContainerRef}
                className="flex flex-row lg:grid lg:grid-cols-4 gap-4 overflow-x-auto pb-4 items-start custom-scrollbar"
              >
                {statuses.map((status) => {
                  const groupedList = tasksByStatus[status.name] || [];
                  const isSystemDefault = [
                    "pending",
                    "in progress",
                    "completed",
                  ].includes(status.name);
                  const labelKey = `status.${status.name.toLowerCase().replace(" ", "_")}`;
                  const transLabel = t(labelKey);
                  const finalLabel =
                    transLabel && transLabel !== labelKey
                      ? transLabel
                      : status.label;

                  return (
                    <div
                      key={status.status_id}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, status.name)}
                      className="bg-gray-50/50 rounded-2xl border border-gray-150 p-4 min-h-[450px] flex flex-col flex-shrink-0 w-[290px] sm:w-[320px] lg:w-auto"
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{
                              backgroundColor: status.color_text || "#6b7280",
                            }}
                          />
                          <h3 className="font-extrabold text-sm text-gray-800 uppercase tracking-wider">
                            {finalLabel}
                          </h3>
                          <span className="text-xs bg-gray-200/80 text-gray-700 font-bold px-2 py-0.5 rounded-full">
                            {groupedList.length}
                          </span>
                        </div>
                        {!isSystemDefault && (
                          <button
                            onClick={() => handleDeleteStatus(status.name)}
                            className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                            title="Xóa cột"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Column Cards List */}
                      <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
                        {groupedList.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-xl text-center">
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                              Kéo thẻ vào đây
                            </span>
                          </div>
                        ) : (
                          groupedList.map((task) => {
                            const isOverdue =
                              task.due_date &&
                              new Date(task.due_date) < new Date() &&
                              task.status !== "completed";

                            return (
                              <div
                                key={task.task_id}
                                draggable={!checkOutTime}
                                onDragStart={(e) =>
                                  handleDragStart(e, task.task_id)
                                }
                                onDragEnd={handleDragEnd}
                                onClick={() =>
                                  navigate(`/tasks/${task.task_id}`, {
                                    state: { task },
                                  })
                                }
                                className="bg-white border border-gray-150 hover:border-blue-200 p-4 rounded-xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all cursor-grab active:cursor-grabbing group space-y-3 relative overflow-hidden"
                              >
                                {isOverdue && (
                                  <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
                                )}
                                <div>
                                  <h4
                                    className="font-bold text-gray-900 text-sm leading-snug line-clamp-2"
                                    title={task.name || task.title}
                                  >
                                    {task.name || task.title}
                                  </h4>
                                  {task.parent_id && (
                                    <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                      <div className="w-1.5 h-1.5 border-b border-l border-gray-400 inline-block"></div>
                                      <span>
                                        Subtask of REQ-{task.parent_id}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span
                                    data-custom-component={`TaskPriority-${task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1).toLowerCase() : ""}`}
                                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border uppercase tracking-wider ${task.priority?.toLowerCase() === "high"
                                        ? "bg-red-50 text-red-700 border-red-100"
                                        : task.priority?.toLowerCase() ===
                                          "medium"
                                          ? "bg-amber-50 text-amber-700 border-amber-100"
                                          : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                      }`}
                                  >
                                    {task.priority?.toLowerCase() === "high"
                                      ? t("dashboard.priority_high")
                                      : task.priority?.toLowerCase() ===
                                        "medium"
                                        ? t("dashboard.priority_medium")
                                        : t("dashboard.priority_low")}
                                  </span>

                                  {task.due_date && (
                                    <span
                                      className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md border ${isOverdue
                                          ? "bg-red-50 text-red-600 border-red-100"
                                          : "bg-gray-50 text-gray-500 border-gray-200"
                                        }`}
                                    >
                                      <CalendarIcon className="w-3.5 h-3.5" />
                                      {new Date(
                                        task.due_date,
                                      ).toLocaleDateString(
                                        i18n.language === "vi"
                                          ? "vi-VN"
                                          : "en-US",
                                        { month: "short", day: "numeric" },
                                      )}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[10px] text-gray-400">
                                  <span className="font-bold text-gray-500">
                                    REQ-{task.task_id}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                                      <UserIcon className="w-3 h-3 text-[#0056b3]" />
                                    </div>
                                    <span className="font-semibold text-gray-600 max-w-[80px] truncate">
                                      {task.assigner || "N/A"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Daily Report Generator Modal */}
      <AIReportModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyReport={(aiReport) => setReportText(aiReport)}
      />
    </div>
  );
}
