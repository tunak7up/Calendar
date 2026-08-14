import React from "react";
import { CalendarIcon, UserIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import TaskStatusSelect from "../../../../components/TaskStatusSelect";

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
      className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full border uppercase tracking-wider ${cls}`}
    >
      {label}
    </span>
  );
}

export default function MobileTaskList({ tasks, statuses, onStatusChange, onNavigate }) {
  const { t, i18n } = useTranslation();

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
        <p className="text-gray-500">{t("dashboard.no_tasks")}</p>
      </div>
    );
  }

  return (
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
                onClick={() => onNavigate(task)}
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
              <PriorityBadge priority={task.priority} />
              {task.due_date && (
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                    isOverdue
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

            {/* Footer: Assigner & Status */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <UserIcon className="w-3 h-3 text-[#0056b3]" />
                </div>
                <span className="text-xs font-semibold text-gray-600 max-w-[100px] truncate">
                  {task.assigner || "N/A"}
                </span>
              </div>
              <div className="relative">
                <TaskStatusSelect
                  currentStatus={task.status}
                  dueDate={task.due_date}
                  statusesList={statuses}
                  size="sm"
                  onStatusChange={(newStatus) =>
                    onStatusChange(newStatus, task.task_id)
                  }
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
