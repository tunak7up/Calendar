import React from "react";
import {
  CheckCircleIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  PlusIcon,
  DocumentCheckIcon,
  PaperClipIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";

export default function DailyReportCard({
  reportText,
  setReportText,
  reportId,
  reportAttachments,
  checkOutTime,
  isReportExpanded,
  setIsReportExpanded,
  reportTextareaRef,
  fileInputRef,
  adjustReportTextareaHeight,
  onSave,
  onSubmit,
  onUpload,
  onDeleteAttachment,
  onDownload,
  onOpenAiModal,
}) {
  const { t } = useTranslation();

  return (
    <div
      className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6"
      data-customizable-id="card-daily-report"
      data-customizable-type="bg"
    >
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <DocumentTextIcon className="w-5 h-5 text-blue-600 shrink-0" />
          <h2 className="text-base sm:text-lg font-bold text-gray-800 truncate">
            {t("dashboard.daily_report")}
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsReportExpanded((s) => !s)}
            aria-label={
              isReportExpanded
                ? t("dashboard.collapse")
                : t("dashboard.expand")
            }
            className="flex items-center justify-center w-9 h-9 bg-white hover:bg-gray-50 text-[#0056b3] border border-gray-200 rounded-xl text-xs font-bold shadow-sm transition-all shrink-0 cursor-pointer"
          >
            <i className="fa-solid fa-up-right-and-down-left-from-center"></i>
          </button>
          <button
            type="button"
            onClick={onOpenAiModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>{t("ai_report.generate_btn_short")}</span>
          </button>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        ref={reportTextareaRef}
        value={reportText}
        onChange={(e) => setReportText(e.target.value)}
        onInput={adjustReportTextareaHeight}
        placeholder={t("dashboard.report_placeholder")}
        rows={4}
        className="w-full bg-[#f8fafc] border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-4 focus:ring-blue-100 p-4 outline-none resize-none mb-4 shadow-sm overflow-hidden"
        style={{
          minHeight: isReportExpanded ? 360 : 120,
          maxHeight: isReportExpanded ? "70vh" : 300,
        }}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
            e.preventDefault();
            onSave();
          }
        }}
      />

      {/* Attachment Section */}
      <div className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-2">
            <PaperClipIcon className="w-5 h-5 text-gray-500 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">
              {t("dashboard.attachments", { count: reportAttachments.length })}
            </span>
          </div>
          <div>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={onUpload}
            />
            <button
              onClick={() => {
                if (!reportId) {
                  alert(t("dashboard.alert_upload_no_id_btn"));
                  return;
                }
                fileInputRef.current?.click();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-600 hover:text-white transition-all uppercase tracking-wider whitespace-nowrap cursor-pointer"
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
              const fullUrl =
                att.url &&
                  (att.url.startsWith("http://") ||
                    att.url.startsWith("https://"))
                  ? att.url
                  : `${import.meta.env.VITE_API_URL.replace("/api", "")}${att.url}`;
              const fileName =
                att.file_name || t("dashboard.attachment_default");
              return (
                <div
                  key={att.file_attachment_id}
                  className="flex items-center gap-1 bg-white border border-gray-200 pl-3 pr-1 py-1 rounded-lg shadow-sm group"
                >
                  <button
                    onClick={() => onDownload(fullUrl, fileName)}
                    className="text-xs font-medium text-gray-700 hover:text-blue-600 truncate max-w-[150px] text-left"
                    title={fileName}
                  >
                    {fileName}
                  </button>
                  <button
                    onClick={() =>
                      onDeleteAttachment(att.file_attachment_id)
                    }
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                    title={t("dashboard.delete_file_title")}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-row items-center justify-end gap-2 sm:gap-3">
        <button
          onClick={onSave}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all whitespace-nowrap cursor-pointer"
          data-customizable-id="btn-save-draft"
          data-customizable-type="bg"
        >
          <DocumentCheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 shrink-0" />
          <span>{t("dashboard.save_draft")}</span>
        </button>
        <button
          onClick={onSubmit}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap
            ${checkOutTime
              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
              : "bg-[#0056b3] hover:bg-[#004494] text-white shadow-blue-500/20"
            }`}
          data-customizable-id="btn-submit-report"
          data-customizable-type="bg"
        >
          {checkOutTime ? (
            <>
              <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>{t("dashboard.update_report")}</span>
            </>
          ) : (
            <>
              <PaperAirplaneIcon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>{t("dashboard.submit_report")}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
