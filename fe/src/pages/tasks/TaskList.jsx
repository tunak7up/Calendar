import React, { useState } from 'react';
import {
  ClipboardDocumentListIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import TaskStatusSelect from '../../components/TaskStatusSelect';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';
import { taskService } from '../../services/taskService';
import EmployeeMultiFilter from '../../components/EmployeeMultiFilter';
import { FunnelIcon, MagnifyingGlassIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
import SortableTable from '../../components/SortableTable';
import { useTranslation } from 'react-i18next';
import DateRangeFilter from '../../components/DateRangeFilter';


function StatusBadge({ status }) {
  const { t } = useTranslation();
  if (status?.toLowerCase() === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        {t('status.completed')}
      </span>
    );
  }
  if (status?.toLowerCase() === 'in progress') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        {t('status.in_progress')}
      </span>
    );
  }
  if (status?.toLowerCase() === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        {t('status.pending')}
      </span>
    );
  }
  return null;
}

function StatCard({ icon, label, value, iconBg, iconColor, isActive, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-2 sm:gap-3 bg-white border rounded-xl px-3 sm:px-4 py-2 sm:py-3 shadow-md w-full cursor-pointer transition-all
        ${isActive ? 'ring-2 ring-blue-500 border-transparent scale-105 shadow-lg' : 'border-gray-300 hover:border-blue-300'}
      `}
    >
      <div className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg ${iconBg}`}>
        <span className={`${iconColor} [&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-6 sm:[&>svg]:h-6`}>{icon}</span>
      </div>
      <div>
        <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
        <p className="text-lg sm:text-xl font-extrabold text-gray-900 leading-none">{value}</p>
      </div>
    </div>
  );
}

export default function TaskList({ isAdmin }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const pageSize = 15;

  const formatCustomDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const result = isAdmin
        ? await taskService.getAllTasks()
        : await taskService.getAllTasksByParticipantId(user.person_id);
      if (result.success) {
        setTasks(result.data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTasks();

    if (isAdmin) {
      apiFetch('/person')
        .then(data => {
          if (data.success) {
            setEmployees(data.data);
          }
        })
        .catch(err => console.error('Error fetching employees:', err));
    }
  }, [isAdmin, user]);

  const employeeTasks = isAdmin && selectedEmployeeIds.length > 0
    ? tasks.filter(t => t.participants && t.participants.some(p => selectedEmployeeIds.includes(p.person_id.toString())))
    : tasks;

  const isOverdue = (task) => {
    if (task.status === 'completed') return false;
    return new Date(task.due_date) < new Date();
  };

  const getEffectiveStatus = (task) => {
    if (task.status === 'completed') return 'completed';
    if (isOverdue(task)) return 'overdue';
    if (task.status === 'overdue') return 'pending';
    return task.status;
  };

  const getTaskRoleForCurrentUser = (task, currentUser) => {
    if (!isAdmin) return task.role;
    const participant = task.participants?.find(p => p.person_id === currentUser?.person_id);
    if (participant) return participant.role;
    if (task.assigner === currentUser?.name) return 'assigner';
    return 'N/A';
  };

  const baseFilteredTasks = React.useMemo(() => {
    let temp = employeeTasks;

    // 1. Date Range Filter (Bypass if there is an active search query to allow finding older tasks)
    if (startDate && !searchQuery.trim()) {
      temp = temp.filter(t => {
        const dStr = t.due_date ? t.due_date.split('T')[0] : '';
        return dStr >= startDate;
      });
    }
    if (endDate && !searchQuery.trim()) {
      temp = temp.filter(t => {
        const sStr = t.start_time ? t.start_time.split('T')[0] : '';
        return sStr <= endDate;
      });
    }

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      temp = temp.filter(t =>
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.task_id && t.task_id.toString().includes(q))
      );
    }

    // 3. Role Filter
    if (filterRole !== 'all') {
      temp = temp.filter(t => {
        const role = getTaskRoleForCurrentUser(t, user);
        return role?.toLowerCase() === filterRole.toLowerCase();
      });
    }

    return temp;
  }, [employeeTasks, startDate, endDate, searchQuery, filterRole, user, isAdmin]);

  const filteredTasks = React.useMemo(() => {
    if (filterStatus === 'all') return baseFilteredTasks;
    return baseFilteredTasks.filter(t => getEffectiveStatus(t) === filterStatus);
  }, [baseFilteredTasks, filterStatus]);

  // Sort tasks: parents first, then their subtasks — only when no sortKey active
  const displayTasks = React.useMemo(() => {
    if (sortKey) {
      // When a sort is active, sort flat
      return [...filteredTasks].sort((a, b) => {
        let aVal = a[sortKey] ?? '';
        let bVal = b[sortKey] ?? '';
        if (sortKey === 'start_time' || sortKey === 'due_date') {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
        }
        if (typeof aVal === 'number') return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        return sortDir === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
      });
    }

    // Default: group parents with their children
    const parents = filteredTasks.filter(t => !t.parent_id);
    const children = filteredTasks.filter(t => t.parent_id);

    // Sort parents by status priority
    parents.sort((a, b) => {
      const getPriority = (task) => {
        const effStatus = getEffectiveStatus(task);
        if (effStatus === 'overdue') return 1;
        if (effStatus === 'pending') return 2;
        if (effStatus === 'in progress') return 3;
        if (effStatus === 'completed') return 4;
        return 5;
      };
      // If priority is same, sort by due date (earliest first)
      const priorityDiff = getPriority(a) - getPriority(b);
      if (priorityDiff !== 0) return priorityDiff;

      const dateA = new Date(a.due_date).getTime();
      const dateB = new Date(b.due_date).getTime();
      return dateA - dateB;
    });

    const sorted = [];
    parents.forEach(p => {
      sorted.push(p);
      sorted.push(...children.filter(c => c.parent_id === p.task_id));
    });
    const handledIds = new Set(sorted.map(t => t.task_id));
    sorted.push(...filteredTasks.filter(t => !handledIds.has(t.task_id)));
    return sorted;
  }, [filteredTasks, sortKey, sortDir]);

  const columns = [
    { key: 'name', label: t('tasks.col_name'), sortable: true, className: 'w-[30%] min-w-[180px]' },
    { key: 'assigner', label: t('tasks.col_assigner'), sortable: true, className: 'w-[10%] min-w-[80px]' },
    { key: 'start_time', label: t('tasks.col_start'), sortable: true, className: 'w-[90px]' },
    { key: 'due_date', label: t('tasks.col_deadline'), sortable: true, className: 'w-[90px]' },
    { key: 'status', label: t('tasks.col_status'), sortable: true, className: 'w-[115px]' },
    { key: 'extra', label: isAdmin ? t('tasks.col_participants') : t('tasks.col_role'), sortable: false, className: 'w-[110px]' },
    { key: 'created_at', label: t('tasks.col_created'), sortable: true, className: 'w-[90px]', defaultSortDir: 'desc' },
    { key: 'action', label: t('tasks.col_actions'), sortable: false, align: 'center', className: 'w-[50px]' },
  ];

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await taskService.updateTask(taskId, { status: newStatus });
      if (res.success) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDeleteTask = async (e, taskId) => {
    e.stopPropagation(); // Don't navigate
    if (!window.confirm(t('tasks.confirm_delete'))) return;
    try {
      const res = await taskService.deleteTask(taskId);
      if (res.success) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };



  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{t('tasks.title')}</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">{t('tasks.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {user?.role === 'manager' && (
            <>
              <button
                onClick={() => taskService.exportTasks().catch(err => alert('Export failed: ' + err.message))}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 transition-all flex-1 md:flex-none justify-center"
              >
                <span>Export</span>
              </button>

              <Menu as="div" className="relative inline-block text-left flex-1 md:flex-none">
                <Menu.Button className="flex w-full items-center justify-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20 transition-all">
                  <span>Import</span>
                  <ChevronDownIcon className="w-5 h-5" />
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
                            className={`${
                              active ? 'bg-orange-500 text-white' : 'text-gray-900'
                            } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                          >
                            Upload Excel
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => taskService.exportTemplate().catch(err => alert('Download template failed: ' + err.message))}
                            className={`${
                              active ? 'bg-orange-500 text-white' : 'text-gray-900'
                            } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                          >
                            Download Import Template
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
                    const response = await taskService.importTasks(formData);
                    fetchTasks();
                    alert(response.message || 'Import thành công!');
                  } catch (error) {
                    alert('Lỗi import: ' + error.message);
                  }
                  e.target.value = '';
                }}
              />
            </>
          )}

          <button
            onClick={() => navigate('/tasks/add')}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#0056b3] hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex-1 md:flex-none justify-center"
          >
            <PlusIcon className="w-5 h-5" />
            <span>{t('tasks.create_btn')}</span>
          </button>
        </div>
      </div>

      {/* Employee filter moved and merged into the unified filter card below */}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 mb-6 sm:mb-8">
        <StatCard
          label={t('tasks.stat_total')}
          value={baseFilteredTasks.length}
          icon={<ClipboardDocumentListIcon />}
          iconBg="bg-gray-100"
          iconColor="text-gray-500"
          isActive={filterStatus === 'all'}
          onClick={() => setFilterStatus('all')}
        />
        <StatCard
          label={t('tasks.stat_pending')}
          value={baseFilteredTasks.filter(t => getEffectiveStatus(t) === 'pending').length}
          icon={<ClockIcon />}
          iconBg="bg-gray-100"
          iconColor="text-gray-400"
          isActive={filterStatus === 'pending'}
          onClick={() => setFilterStatus('pending')}
        />
        <StatCard
          label={t('tasks.stat_in_progress')}
          value={baseFilteredTasks.filter(t => getEffectiveStatus(t) === 'in progress').length}
          icon={<ClockIcon className="animate-spin-slow" />}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          isActive={filterStatus === 'in progress'}
          onClick={() => setFilterStatus('in progress')}
        />
        <StatCard
          label={t('tasks.stat_completed')}
          value={baseFilteredTasks.filter(t => getEffectiveStatus(t) === 'completed').length}
          icon={<CheckCircleIcon />}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          isActive={filterStatus === 'completed'}
          onClick={() => setFilterStatus('completed')}
        />
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

      {/* General Filters: Employee, Search, Role, DateRange */}
      <div className="flex flex-col gap-4 mb-6 bg-white p-4 rounded-2xl border border-gray-300 shadow-md">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full">
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

        {/* Selected Employee Tags Row */}
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

      {/* Floating Action Button for Mobile */}
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
