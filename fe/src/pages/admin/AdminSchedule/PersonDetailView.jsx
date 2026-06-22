import React from 'react';
import { PlusIcon, ClockIcon, DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function PersonDetailView({
  person,
  taskStatusFilters,
  setTaskStatusFilters,
  navigate,
  t
}) {
  const filteredTasks = person.tasks.filter(
    (task) =>
      taskStatusFilters.length === 0 ||
      taskStatusFilters.includes(task.status?.toLowerCase())
  );

  const isLateCheckIn = (() => {
    if (!person.hasSchedule) return false;
    if (!person.check_in) return false;
    const parts = person.check_in.split(':');
    if (parts.length < 2) return false;
    const hour = parseInt(parts[0], 10);
    const minute = parseInt(parts[1], 10);
    const totalMinutes = hour * 60 + minute;

    if (person.schedule && person.schedule.start_time) {
      const schedStart = new Date(person.schedule.start_time);
      const schedStartHour = schedStart.getHours();
      const schedStartMinute = schedStart.getMinutes();
      const schedStartTotal = schedStartHour * 60 + schedStartMinute;
      return totalMinutes > schedStartTotal;
    }
    return hour > 9 || (hour === 9 && minute > 0);
  })();

  return (
    <div className="space-y-4">
      {/* Quick Profile Info Button Card */}
      <button
        onClick={() => navigate(`/profile/${person.person_id}`)}
        className="flex items-center justify-between bg-indigo-50/30 hover:bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 transition-colors w-full cursor-pointer text-left group/profile shadow-sm"
      >
        <div className="flex items-center gap-3">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
              person.name || person.username
            )}&background=e0e7ff&color=4338ca&rounded=true&size=40&bold=true`}
            alt={person.name}
            className="w-10 h-10 rounded-full border border-gray-100"
          />
          <div>
            <h4 className="text-sm font-bold text-gray-900 group-hover/profile:text-indigo-600 transition-colors">
              {person.name}
            </h4>
            <p className="text-xs text-gray-400">@{person.username}</p>
          </div>
        </div>
        <span className="text-xs font-bold text-gray-700 group-hover/profile:text-indigo-600 transition-colors flex items-center gap-1">
          {t('adminschedule.view_details')} →
        </span>
      </button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
            {t('adminschedule.filter_by_status')}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setTaskStatusFilters((prev) =>
                  prev.includes('pending') ? prev.filter((s) => s !== 'pending') : [...prev, 'pending']
                );
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${taskStatusFilters.includes('pending')
                  ? 'bg-gray-100 text-gray-700 border-gray-300 shadow-sm'
                  : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                }`}
            >
              {t('adminschedule.status_pending')}
            </button>
            <button
              type="button"
              onClick={() => {
                setTaskStatusFilters((prev) =>
                  prev.includes('in progress')
                    ? prev.filter((s) => s !== 'in progress')
                    : [...prev, 'in progress']
                );
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${taskStatusFilters.includes('in progress')
                  ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                  : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                }`}
            >
              {t('adminschedule.status_in_progress')}
            </button>
            <button
              type="button"
              onClick={() => {
                setTaskStatusFilters((prev) =>
                  prev.includes('completed')
                    ? prev.filter((s) => s !== 'completed')
                    : [...prev, 'completed']
                );
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${taskStatusFilters.includes('completed')
                  ? 'bg-emerald-50 text-[#10b981] border-emerald-200 shadow-sm'
                  : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                }`}
            >
              {t('adminschedule.status_completed')}
            </button>
          </div>
        </div>
        <button
          onClick={() => {
            navigate('/tasks/add', {
              state: {
                assignee: {
                  person_id: person.person_id,
                  username: person.username,
                  name: person.name,
                  role: 'assignee'
                }
              }
            });
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0056b3] text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/10 w-full sm:w-auto justify-center"
        >
          <PlusIcon className="w-4 h-4" />
          {t('adminschedule.add_task')}
        </button>
      </div>

      {/* Daily Report Section */}
      <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-4 mb-4">
        <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
          <DocumentTextIcon className="w-5 h-5 text-blue-600" />
          {t('adminschedule.report_title')}
        </h3>
        {person.report ? (
          <div className="space-y-3">
            <div className="flex gap-4 text-xs font-medium text-gray-600 flex-wrap">
              <div className="flex items-center gap-1.5">
                <ClockIcon className="w-4 h-4 text-gray-400" />
                <span>{t('adminschedule.check_in')}</span>
                {person.report.check_in ? (
                  <span className="font-semibold text-gray-800">
                    {person.report.check_in.slice(0, 5)}
                  </span>
                ) : (
                  <span className="text-gray-400 italic">{t('adminschedule.not_available')}</span>
                )}
                {isLateCheckIn && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    {t('admindashboard.attendance_late') || 'Đi muộn'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <ClockIcon className="w-4 h-4 text-gray-400" />
                <span>{t('adminschedule.check_out')}</span>
                {person.report.check_out ? (
                  <span className="font-semibold text-gray-800">
                    {person.report.check_out.slice(0, 5)}
                  </span>
                ) : (
                  <span className="text-gray-400 italic">{t('adminschedule.not_available')}</span>
                )}
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap">
              {person.report.description || (
                <span className="text-gray-400 italic">{t('adminschedule.no_report_desc')}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">{t('adminschedule.not_reported_yet')}</div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 font-medium">
          {t('adminschedule.tasks_found', { count: filteredTasks.length })}
        </p>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          {t('adminschedule.no_tasks_matched')}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">
                  {t('adminschedule.col_task_name')}
                </th>
                <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">
                  {t('adminschedule.col_date')}
                </th>
                <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">
                  {t('adminschedule.col_status')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTasks.map((task) => (
                <tr key={task.task_id} className="bg-white hover:bg-gray-50/50">
                  <td className="py-3 px-4 font-medium text-gray-900">
                    <div className="max-w-[200px] truncate" title={task.name || task.title}>
                      {task.name || task.title}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {task.due_date
                      ? (() => {
                        const d = new Date(task.due_date);
                        const day = String(d.getDate()).padStart(2, '0');
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const year = d.getFullYear();
                        return `${day}/${month}/${year}`;
                      })()
                      : t('adminschedule.not_available')}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold border shadow-sm
                        ${task.status?.toLowerCase() === 'in progress'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : task.status?.toLowerCase() === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }
                      `}
                    >
                      {task.status?.toLowerCase() === 'pending'
                        ? t('adminschedule.status_pending')
                        : task.status?.toLowerCase() === 'in progress'
                          ? t('adminschedule.status_in_progress')
                          : task.status?.toLowerCase() === 'completed'
                            ? t('adminschedule.status_completed')
                            : task.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
