import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { apiFetch, getAccessToken } from "../../../../services/api";
import { taskService } from "../../../../services/taskService";
import { taskStatusService } from "../../../../services/taskStatusService";
import { fileService } from "../../../../services/fileService";
import { useTranslation } from "react-i18next";
import { Capacitor } from "@capacitor/core";

const priorityWeight = { High: 3, Medium: 2, Low: 1 };

export function useDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportId, setReportId] = useState(null);
  const [pendingStatusUpdates, setPendingStatusUpdates] = useState({});
  const [checkingReport, setCheckingReport] = useState(true);
  const [reportAttachments, setReportAttachments] = useState([]);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [newStatusLabel, setNewStatusLabel] = useState("");
  const [showAddStatusInput, setShowAddStatusInput] = useState(false);
  const [isReportExpanded, setIsReportExpanded] = useState(false);

  const fileInputRef = useRef(null);
  const reportTextareaRef = useRef(null);
  const boardContainerRef = useRef(null);
  const scrollIntervalRef = useRef(null);
  const scrollDirectionRef = useRef(null);

  const [isMobile, setIsMobile] = useState(() => {
    return Capacitor.isNativePlatform() || window.innerWidth < 768;
  });

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── Scroll helpers ───────────────────────────────────────────────────────────
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
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    };
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getWorkingDate = () => {
    const d = new Date();
    const pad = (n) => (n < 10 ? "0" + n : n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const adjustReportTextareaHeight = useCallback(() => {
    const textarea = reportTextareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const maxHeight = isReportExpanded ? 800 : 300;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [isReportExpanded]);

  // ── Data fetching ────────────────────────────────────────────────────────────
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
              d = new Date(`${fallbackDate}T${dateStr}`);
              if (isNaN(d.getTime()))
                d = new Date(`${fallbackDate} ${dateStr}`);
            }
            return isNaN(d.getTime()) ? null : d;
          };

          const cIn = parseDate(report.check_in, report.working_date);
          if (cIn) setCheckInTime(cIn);
          const cOut = parseDate(report.check_out, report.working_date);
          if (cOut) setCheckOutTime(cOut);
          if (report.description) setReportText(report.description);
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

  useEffect(() => {
    if (isReportExpanded && reportTextareaRef.current) {
      reportTextareaRef.current.focus();
      adjustReportTextareaHeight();
    }
  }, [isReportExpanded, adjustReportTextareaHeight]);

  const fetchReportAttachments = useCallback(async () => {
    if (!reportId) return;
    try {
      const res = await apiFetch(`/file-attachment/report/${reportId}`);
      if (res.success) setReportAttachments(res.data);
    } catch (error) {
      console.error("Error fetching report attachments:", error);
    }
  }, [reportId]);

  useEffect(() => {
    if (reportId) fetchReportAttachments();
  }, [reportId, fetchReportAttachments]);

  const fetchStatuses = useCallback(async () => {
    try {
      const res = await taskStatusService.getAllStatuses();
      if (res.success) setStatuses(res.data);
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

  const { tasksByStatus, overdueList } = useMemo(() => {
    const groups = {};
    const overdue = [];
    const now = new Date();

    statuses.forEach((s) => {
      groups[s.name] = [];
    });

    tasks.forEach((task) => {
      const currentStatus = task.status?.toLowerCase() || "pending";

      // Hide completed tasks that are past their due date entirely
      if (currentStatus === "completed" && task.due_date) {
        if (new Date(task.due_date) < now) return;
      }

      const isOverdue =
        task.due_date &&
        new Date(task.due_date) < now &&
        currentStatus !== "completed";

      if (isOverdue) {
        // Route overdue tasks to the dedicated Overdue column
        overdue.push(task);
      } else {
        if (!groups[currentStatus]) groups[currentStatus] = [];
        groups[currentStatus].push(task);
      }
    });

    return { tasksByStatus: groups, overdueList: overdue };
  }, [tasks, statuses]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
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
        setIsCheckedIn(true);
        setCheckInTime(new Date());
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
      const taskUpdates = Object.keys(pendingStatusUpdates).map((taskId) =>
        taskService.updateTask(taskId, { status: pendingStatusUpdates[taskId] }),
      );
      await Promise.all(taskUpdates);

      if (reportId) {
        const response = await apiFetch(`/daily-report/${reportId}`, {
          method: "PATCH",
          body: JSON.stringify({ description: reportText }),
        });
        if (response.success) {
          const now = new Date();
          const isUpdating = !!checkOutTime;
          setCheckOutTime(now);
          alert(
            isUpdating
              ? t("dashboard.alert_update_success", {
                  time: now.toLocaleTimeString(),
                })
              : t("dashboard.alert_checkout_success", {
                  time: now.toLocaleTimeString(),
                }),
          );
          setPendingStatusUpdates({});
          fetchTasks();
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
        if (response.success) alert(t("dashboard.alert_draft_success"));
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
    setPendingStatusUpdates((prev) => ({ ...prev, [taskId]: newStatus }));
    try {
      await taskService.updateTask(taskId, { status: newStatus });
    } catch (error) {
      console.error("Error updating task status on backend:", error);
      alert(t("dashboard.alert_update_status_fail"));
      fetchTasks();
    }
  };

  const handleDragStart = (e, taskId) => {
    window.getSelection()?.removeAllRanges();
    e.dataTransfer.setData("text/plain", taskId.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => stopScroll();

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
    handleStatusChange(targetStatus, parseInt(taskIdStr, 10));
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
      alert(t("dashboard.alert_create_status_fail", { error: error.message }));
    }
  };

  const handleDeleteStatus = async (statusName) => {
    if (["pending", "in progress", "completed"].includes(statusName)) {
      alert(t("dashboard.alert_delete_default_status"));
      return;
    }
    if (!window.confirm(t("dashboard.confirm_delete_status_column"))) return;
    try {
      const res = await taskStatusService.deleteStatus(statusName);
      if (res.success) {
        await fetchStatuses();
        await fetchTasks();
      }
    } catch (error) {
      alert(t("dashboard.alert_delete_status_fail", { error: error.message }));
    }
  };

  const handleUploadReportFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (!reportId) {
      alert(t("dashboard.alert_upload_no_id"));
      return;
    }
    for (const file of files) {
      const validation = fileService.validateFile(file);
      if (!validation.valid) {
        alert(
          t("file.upload_error", { name: file.name, error: validation.error }),
        );
        continue;
      }
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
        alert(
          t("file.upload_error", { name: file.name, error: error.message }),
        );
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
      if (res.success) fetchReportAttachments();
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
        if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
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

  return {
    // state
    user,
    isCheckedIn,
    checkInTime,
    checkOutTime,
    tasks,
    statuses,
    loading,
    reportText,
    setReportText,
    reportId,
    checkingReport,
    reportAttachments,
    isAiModalOpen,
    setIsAiModalOpen,
    newStatusLabel,
    setNewStatusLabel,
    showAddStatusInput,
    setShowAddStatusInput,
    isReportExpanded,
    setIsReportExpanded,
    isMobile,
    tasksByStatus,
    overdueList,
    // refs
    fileInputRef,
    reportTextareaRef,
    boardContainerRef,
    // handlers
    adjustReportTextareaHeight,
    handleCheckIn,
    handleSubmitReport,
    handleSaveDescription,
    handleStatusChange,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    handleAddStatus,
    handleDeleteStatus,
    handleUploadReportFiles,
    handleDeleteAttachment,
    downloadFile,
  };
}
