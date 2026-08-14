import React from 'react';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

export default function ProfileTasksCard({ tasks, sortedTasks, getStatusColor, getTaskStatusLabel, onNavigate }) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-6 flex flex-col h-[320px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
            <CheckCircleIcon className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">{t('profile.tasks_list')}</h2>
        </div>
        <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-lg">
          {tasks.length} {t('profile.total')}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 max-h-[220px] space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-sm font-semibold text-gray-400">{t('profile.no_tasks')}</p>
          </div>
        ) : (
          sortedTasks.map((task) => (
            <div
              key={task.task_id}
              onClick={() => onNavigate(`/tasks/${task.task_id}`)}
              className="p-4 rounded-2xl border border-gray-100 bg-[#f8fafc] hover:border-purple-200 hover:shadow-sm transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-2">
                <h3
                  className="text-sm font-bold text-gray-900 group-hover:text-purple-700 transition-colors truncate max-w-[200px] sm:max-w-xs md:max-w-md"
                  title={task.name || task.title}
                >
                  {task.name || task.title}
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(task.status)} border`}>
                  {getTaskStatusLabel(task.status)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                <div className="flex items-center gap-1">
                  <ClockIcon className="w-3.5 h-3.5" />
                  {t('profile.due')}: {(() => {
                    const d = new Date(task.due_date);
                    if (isNaN(d.getTime())) return 'N/A';
                    const day = String(d.getDate()).padStart(2, '0');
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const year = d.getFullYear();
                    return `${day}/${month}/${year}`;
                  })()}
                </div>
                <div className="flex items-center gap-1 text-purple-600">
                  {t('profile.role')}: {
                    task.role
                      ? (task.role.toLowerCase() === 'assignee'
                        ? t('tasks.role_assignee')
                        : (task.role.toLowerCase() === 'assigner'
                          ? t('tasks.role_assigner')
                          : task.role))
                      : t('tasks.role_assignee')
                  }
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
