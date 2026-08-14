import React from "react";
import { CalendarIcon, UserIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";

function PriorityBadge({ priority }) {
  const { t } = useTranslation();
  const p = priority?.toLowerCase();
  const label =
    p === "high"
      ? t("dashboard.priority_high")
      : p === "medium"
        ? t("dashboard.priority_medium")
        : t("dashboard.priority_low");
  const cls =
    p === "high"
      ? "bg-red-50 text-red-700 border-red-100"
      : p === "medium"
        ? "bg-amber-50 text-amber-700 border-amber-100"
        : "bg-emerald-50 text-emerald-700 border-emerald-100";
  const capitalized = priority
    ? priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase()
    : "";
  return (
    <span
      data-custom-component={`TaskPriority-${capitalized}`}
      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border uppercase tracking-wider ${cls}`}
    >
      {label}
    </span>
  );
}

function KanbanCard({ task, isOverdueColumn, onNavigate, onDragStart, onDragEnd }) {
  const { i18n } = useTranslation();
  // In normal columns, compute isOverdue from due_date. In the overdue column it's always true.
  const isOverdue =
    isOverdueColumn ||
    (task.due_date &&
      new Date(task.due_date) < new Date() &&
      task.status !== "completed");

  const cardBorder = isOverdueColumn
    ? "border-red-200 hover:border-red-300"
    : "border-gray-150 hover:border-blue-200";

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.task_id)}
      onDragEnd={onDragEnd}
      onClick={() => onNavigate(task)}
      className={`bg-white border ${cardBorder} p-4 rounded-xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all cursor-grab active:cursor-grabbing group space-y-3 relative overflow-hidden select-none`}
    >
      {/* Red top bar for overdue */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />

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
            <span>Subtask of REQ-{task.parent_id}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={task.priority} />
        {task.due_date && (
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md border ${
              isOverdue
                ? "bg-red-50 text-red-600 border-red-100"
                : "bg-gray-50 text-gray-500 border-gray-200"
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            {new Date(task.due_date).toLocaleDateString(
              i18n.language === "vi" ? "vi-VN" : "en-US",
              { month: "short", day: "numeric" },
            )}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[10px] text-gray-400">
        <span className="font-bold text-gray-500">REQ-{task.task_id}</span>
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
}

export default function KanbanBoard({
  statuses,
  tasksByStatus,
  overdueList,
  checkOutTime,
  showAddStatusInput,
  setShowAddStatusInput,
  newStatusLabel,
  setNewStatusLabel,
  onAddStatus,
  onDeleteStatus,
  onNavigate,
  boardContainerRef,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
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
                onClick={onAddStatus}
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

      {/* Kanban columns */}
      <div
        ref={boardContainerRef}
        className="flex flex-row lg:grid lg:grid-cols-4 gap-4 overflow-x-auto pb-4 items-start custom-scrollbar"
      >
        {/* ── Overdue column (shown only when there are overdue tasks) ── */}
        {overdueList && overdueList.length > 0 && (
          <div
            className="bg-red-50/60 rounded-2xl border border-red-200 p-4 min-h-[450px] flex flex-col flex-shrink-0 w-[290px] sm:w-[320px] lg:w-auto"
          >
            {/* Column Header */}
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <h3 className="font-extrabold text-sm text-red-700 uppercase tracking-wider">
                {t("dashboard.overdue")}
              </h3>
              <span className="text-xs bg-red-200/80 text-red-800 font-bold px-2 py-0.5 rounded-full">
                {overdueList.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
              {overdueList.map((task) => (
                <KanbanCard
                  key={task.task_id}
                  task={task}
                  isOverdueColumn
                  onNavigate={onNavigate}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Regular status columns ── */}
        {statuses.map((status) => {
          const groupedList = tasksByStatus[status.name] || [];
          const isSystemDefault = ["pending", "in progress", "completed"].includes(
            status.name,
          );
          const labelKey = `status.${status.name.toLowerCase().replace(" ", "_")}`;
          const transLabel = t(labelKey);
          const finalLabel =
            transLabel && transLabel !== labelKey ? transLabel : status.label;

          return (
            <div
              key={status.status_id}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, status.name)}
              className="bg-gray-50/50 rounded-2xl border border-gray-150 p-4 min-h-[450px] flex flex-col flex-shrink-0 w-[290px] sm:w-[320px] lg:w-auto"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: status.color_text || "#6b7280" }}
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
                    onClick={() => onDeleteStatus(status.name)}
                    className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                    title={t("dashboard.delete_column_title")}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Cards List */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
                {groupedList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-xl text-center">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      {t("dashboard.drag_card_here")}
                    </span>
                  </div>
                ) : (
                  groupedList.map((task) => (
                    <KanbanCard
                      key={task.task_id}
                      task={task}
                      onNavigate={onNavigate}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
