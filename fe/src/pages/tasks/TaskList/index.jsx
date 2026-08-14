import React from 'react';
import {
  ClipboardDocumentListIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  TrashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import TaskStatusSelect from '../../../components/TaskStatusSelect';
import { apiFetch } from '../../../services/api';
import { taskService } from '../../../services/taskService';
import EmployeeMultiFilter from '../../../components/EmployeeMultiFilter';
import SortableTable from '../../../components/SortableTable';
import DateRangeFilter from '../../../components/DateRangeFilter';
import ImportReviewModal from '../../../components/ImportReviewModal/ImportReviewModal';
import { useTaskList, getEffectiveStatus } from './hooks/useTaskList';

function StatCard({ icon, label, value, iconBg, iconColor, iconStyle, isActive, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-2 sm:gap-3 bg-white border rounded-xl px-3 sm:px-4 py-2 sm:py-3 shadow-md w-full cursor-pointer transition-all
        ${isActive ? 'ring-2 ring-blue-500 border-transparent scale-105 shadow-lg' : 'border-gray-300 hover:border-blue-300'}
      `}
    >
      <div 
        className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg ${iconBg || ''}`}
        style={iconStyle}
      >
        <span className={`${iconColor || ''} [&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-6 sm:[&>svg]:h-6`}>{icon}</span>
      </div>
      <div>
        <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
        <p className="text-lg sm:text-xl font-extrabold text-gray-900 leading-none">{value}</p>
      </div>
    </div>
  );
}

export default function TaskList({ isAdmin }) {
  const {
    t,
    navigate,
    user,
    statuses,
    employees,
    selectedEmployeeIds,
    setSelectedEmployeeIds,
    filterStatus,
    setFilterStatus,
    loading,
    currentPage,
    setCurrentPage,
    sortKey,
    setSortKey,
    sortDir,
    setSortDir,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    searchQuery,
    setSearchQuery,
    filterRole,
    setFilterRole,
    previewData,
    setPreviewData,
    showReviewModal,
    setShowReviewModal,
    pageSize,
    formatCustomDate,
    fetchTasks,
    baseFilteredTasks,
    displayTasks,
    columns,
    handleStatusChange,
    handleDeleteTask
  } = useTaskList({ isAdmin });

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight" data-customizable-id="tasks-title" data-customizable-type="text">{t('tasks.title')}</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base" data-customizable-id="tasks-subtitle" data-customizable-type="text">{t('tasks.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
          {user?.role === 'manager' && (
            <>
              <button
                onClick={() => taskService.exportTasks().catch(err => alert('Export failed: ' + err.message))}
                data-customizable-id="btn-tasks-export"
                data-customizable-type="bg"
                className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-5 py-2 sm:py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-green-500/20 transition-all flex-1 md:flex-none justify-center text-center whitespace-nowrap"
              >
                <span>{t('tasks.export')}</span>
              </button>

              <Menu as="div" className="relative inline-block text-left flex-1 md:flex-none">
                <Menu.Button
                  data-customizable-id="btn-tasks-import"
                  data-customizable-type="bg"
                  className="flex w-full h-full items-center justify-center gap-1 sm:gap-2 px-2.5 sm:px-5 py-2 sm:py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-orange-500/20 transition-all whitespace-nowrap"
                >
                  <span>{t('tasks.import')}</span>
                  <ChevronDownIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                </Menu.Button>
                <Transition
                  as={React.Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="px-1 py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => document.getElementById('import-file-upload').click()}
                            className={`${active ? 'bg-orange-500 text-white' : 'text-gray-900'
                              } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                          >
                            {t('tasks.upload')}
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => taskService.exportTemplate().catch(err => alert('Download template failed: ' + err.message))}
                            className={`${active ? 'bg-orange-500 text-white' : 'text-gray-900'
                              } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                          >
                            {t('tasks.download_import_template')}
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>

              <input
                type="file"
                id="import-file-upload"
                accept=".xlsx"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append('file', file);
                  try {
                    const response = await taskService.previewImportTasks(formData);
                    if (response.success && response.data) {
                      setPreviewData(response.data);
                      setShowReviewModal(true);
                    } else {
                      alert('Lỗi đọc file excel');
                    }
                  } catch (error) {
                    alert('Lỗi preview: ' + error.message);
                  }
                  e.target.value = '';
                }}
              />
            </>
          )}

          <button
            onClick={() => navigate('/tasks/add')}
            data-customizable-id="btn-tasks-create"
            data-customizable-type="bg"
            className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-5 py-2 sm:py-2.5 bg-[#0056b3] hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex-1 md:flex-none justify-center text-center whitespace-nowrap"
          >
            <PlusIcon className="w-3.5 h-3.5 sm:w-5 sm:h-5 flex-shrink-0" />
            <span>{t('tasks.create_btn')}</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 mb-6 sm:mb-8">
        <StatCard
          label={t('tasks.stat_total')}
          value={baseFilteredTasks.length}
          icon={<ClipboardDocumentListIcon />}
          iconBg="bg-gray-100"
          iconColor="text-gray-500"
          isActive={filterStatus === 'all'}
          onClick={() => setFilterStatus('all')}
        />
        {statuses.map(status => {
          const isActive = filterStatus === status.name;
          const count = baseFilteredTasks.filter(t => getEffectiveStatus(t) === status.name).length;
          
          const labelKey = `status.${status.name.toLowerCase().replace(' ', '_')}`;
          const transLabel = t(labelKey);
          const finalLabel = transLabel && transLabel !== labelKey ? transLabel : status.label;

          const isCompleted = status.name === 'completed';
          const icon = isCompleted ? (
            <CheckCircleIcon />
          ) : (
            <ClockIcon className={status.name === 'in progress' ? 'animate-spin-slow' : ''} />
          );

          return (
            <StatCard
              key={status.status_id}
              label={finalLabel}
              value={count}
              icon={icon}
              iconStyle={{ backgroundColor: status.color_bg || '#f3f4f6', color: status.color_text || '#374151' }}
              isActive={isActive}
              onClick={() => setFilterStatus(status.name)}
            />
          );
        })}
        <StatCard
          label={t('tasks.stat_overdue')}
          value={baseFilteredTasks.filter(t => getEffectiveStatus(t) === 'overdue').length}
          icon={<ExclamationTriangleIcon />}
          iconBg="bg-red-100"
          iconColor="text-red-600"
          isActive={filterStatus === 'overdue'}
          onClick={() => setFilterStatus('overdue')}
        />
      </div>

      {/* General Filters */}
      <div className="flex flex-col gap-4 mb-6 bg-white p-4 rounded-2xl border border-gray-300 shadow-md">
        <div className="flex flex-col lg:flex-row lg:flex-wrap items-stretch lg:items-center gap-3 w-full">
          {isAdmin && (
            <div className="w-full lg:w-[240px] flex-shrink-0">
              <EmployeeMultiFilter
                employees={employees}
                selectedIds={selectedEmployeeIds}
                onSelectionChange={(ids) => setSelectedEmployeeIds(ids)}
                placeholder={t('tasks.filter_employee')}
                hideTags={true}
              />
            </div>
          )}
          <div className="relative flex-1 min-w-[180px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder={t('tasks.search_placeholder') || "Search tasks..."}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block pl-9 p-3 outline-none transition-all min-h-[44px]"
            />
          </div>
          <div className="relative w-full lg:w-[160px] flex-shrink-0">
            <select
              value={filterRole}
              onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }}
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none appearance-none cursor-pointer transition-all pr-8 font-semibold text-gray-700 min-h-[44px]"
            >
              <option value="all">{t('tasks.role_all') || "All Roles"}</option>
              <option value="assignee">{t('tasks.role_assignee') || "Assignee"}</option>
              <option value="assigner">{t('tasks.role_assigner') || "Assigner"}</option>
            </select>
            <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="w-full lg:w-auto flex-shrink-0">
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onRangeChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {isAdmin && selectedEmployeeIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300 w-full">
            {employees
              .filter(emp => selectedEmployeeIds.includes(emp.person_id.toString()))
              .map(emp => (
                <div
                  key={emp.person_id}
                  className="flex items-center gap-1.5 bg-white text-[#0056b3] px-2.5 py-1.5 rounded-lg border border-blue-100 text-xs font-bold shadow-sm hover:shadow-md transition-all group/tag whitespace-nowrap"
                >
                  <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                    <UserIcon className="w-3 h-3 text-[#0056b3]" />
                  </div>
                  <span>{emp.name || emp.username}</span>
                  <button
                    onClick={() => setSelectedEmployeeIds(selectedEmployeeIds.filter(id => id !== emp.person_id.toString()))}
                    className="hover:bg-[#0056b3] hover:text-white rounded-md p-0.5 transition-all text-[#0056b3]/60"
                  >
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            <button
              onClick={() => setSelectedEmployeeIds([])}
              className="text-[10px] uppercase tracking-widest font-black text-gray-400 hover:text-red-500 px-2 transition-colors self-center whitespace-nowrap"
            >
              {t('components.employeeFilter.clear') || "XÓA TẤT CẢ"}
            </button>
          </div>
        )}
      </div>

      <SortableTable
        columns={columns}
        data={displayTasks}
        loading={loading}
        emptyMessage={t('tasks.empty')}
        pageSize={pageSize}
        currentPage={currentPage}
        totalItems={displayTasks.length}
        onPageChange={setCurrentPage}
        onSortChange={(key, dir) => { setSortKey(key); setSortDir(dir); setCurrentPage(1); }}
        tableClassName="min-w-[600px]"
        renderRow={(task) => (
          <tr
            key={task.task_id}
            onClick={() => navigate(`/tasks/${task.task_id}`)}
            className={`border-b border-gray-200 hover:bg-blue-50/80 even:bg-gray-50/50 transition-colors cursor-pointer select-none ${task.parent_id ? 'bg-indigo-50/40' : ''}`}
          >
            <td className="px-6 py-5">
              <div className="flex items-center gap-2">
                {task.parent_id && <div className="w-4 border-b-2 border-l-2 border-gray-300 h-4 rounded-bl-md inline-block" />}
                <div>
                  <p className="font-bold text-gray-900 text-sm leading-snug truncate max-w-[180px] sm:max-w-[250px] md:max-w-[360px]" title={task.name}>
                    {task.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">ID: REQ-{task.task_id}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-5 text-gray-600 text-sm truncate w-[10%] min-w-[80px]" title={task.assigner}>{task.assigner}</td>
            <td className="px-3 py-5 text-gray-600 text-xs whitespace-nowrap w-[90px]">{formatCustomDate(task.start_time)}</td>
            <td className="px-3 py-5 text-gray-600 text-xs whitespace-nowrap w-[90px]">{formatCustomDate(task.due_date)}</td>
            <td className="px-4 py-5 w-[115px]" onClick={(e) => e.stopPropagation()}>
              <TaskStatusSelect
                currentStatus={task.status}
                dueDate={task.due_date}
                onStatusChange={(newStatus) => handleStatusChange(task.task_id, newStatus)}
                statusesList={statuses}
                size="sm"
              />
            </td>
            <td className="px-4 py-5 text-gray-600 text-sm w-[110px] truncate">
              {isAdmin ? (
                <div className="flex flex-wrap gap-1">
                  {task.participants && task.participants.map(p => (
                    <span key={p.person_id} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">{p.name}</span>
                  ))}
                </div>
              ) : (
                task.role
                  ? (task.role.toLowerCase() === 'assignee'
                    ? t('tasks.role_assignee')
                    : (task.role.toLowerCase() === 'assigner'
                      ? t('tasks.role_assigner')
                      : task.role))
                  : 'N/A'
              )}
            </td>
            <td className="px-3 py-5 text-gray-600 text-xs whitespace-nowrap w-[90px]">{formatCustomDate(task.created_at)}</td>

            <td className="px-4 py-5 text-center w-[50px]">
              <button
                onClick={(e) => handleDeleteTask(e, task.task_id)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                title="Delete Task"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </td>
          </tr>
        )}
      />

      <ImportReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        previewData={previewData}
        onSuccess={() => fetchTasks()}
      />

      <button
        onClick={() => navigate('/tasks/add')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#0056b3] text-white rounded-full shadow-2xl flex items-center justify-center sm:hidden z-40 active:scale-95 transition-transform"
        title="Create Task"
      >
        <PlusIcon className="w-7 h-7" />
      </button>
    </div>
  );
}
