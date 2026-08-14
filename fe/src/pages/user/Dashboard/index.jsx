import React from "react";
import { useNavigate } from "react-router-dom";
import { ClockIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";

import { useDashboard } from "./hooks/useDashboard";
import DashboardHeader from "./components/DashboardHeader";
import DailyReportCard from "./components/DailyReportCard";
import MobileTaskList from "./components/MobileTaskList";
import KanbanBoard from "./components/KanbanBoard";
import AIReportModal from "../../../components/AIReportModal/AIReportModal";
import PWABanner from "../../../components/PWABanner";

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
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
    fileInputRef,
    reportTextareaRef,
    boardContainerRef,
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
  } = useDashboard();

  const handleNavigateToTask = (task) =>
    navigate(`/tasks/${task.task_id}`, { state: { task } });

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <DashboardHeader
        user={user}
        checkInTime={checkInTime}
        checkOutTime={checkOutTime}
      />

      <PWABanner />

      {/* Body */}
      {checkingReport ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : !isCheckedIn ? (
        /* ── Not checked in ── */
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
        /* ── Checked in ── */
        <div className="space-y-6">
          <DailyReportCard
            reportText={reportText}
            setReportText={setReportText}
            reportId={reportId}
            reportAttachments={reportAttachments}
            checkOutTime={checkOutTime}
            isReportExpanded={isReportExpanded}
            setIsReportExpanded={setIsReportExpanded}
            reportTextareaRef={reportTextareaRef}
            fileInputRef={fileInputRef}
            adjustReportTextareaHeight={adjustReportTextareaHeight}
            onSave={handleSaveDescription}
            onSubmit={handleSubmitReport}
            onUpload={handleUploadReportFiles}
            onDeleteAttachment={handleDeleteAttachment}
            onDownload={downloadFile}
            onOpenAiModal={() => setIsAiModalOpen(true)}
          />

          {/* Task board */}
          {loading ? (
            <div className="flex items-center justify-center py-20 bg-white border border-gray-100 rounded-2xl shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : isMobile ? (
            <MobileTaskList
              tasks={tasks}
              statuses={statuses}
              onStatusChange={handleStatusChange}
              onNavigate={handleNavigateToTask}
            />
          ) : (
            <KanbanBoard
              statuses={statuses}
              tasksByStatus={tasksByStatus}
              overdueList={overdueList}
              checkOutTime={checkOutTime}
              showAddStatusInput={showAddStatusInput}
              setShowAddStatusInput={setShowAddStatusInput}
              newStatusLabel={newStatusLabel}
              setNewStatusLabel={setNewStatusLabel}
              onAddStatus={handleAddStatus}
              onDeleteStatus={handleDeleteStatus}
              onNavigate={handleNavigateToTask}
              boardContainerRef={boardContainerRef}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          )}
        </div>
      )}

      {/* AI Report Modal */}
      <AIReportModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyReport={(aiReport) => setReportText(aiReport)}
      />
    </div>
  );
}
