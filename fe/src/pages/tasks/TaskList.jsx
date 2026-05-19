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
import TaskStatusDropdown from '../../components/TaskStatusDropdown';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';
import { taskService } from '../../services/taskService';
import EmployeeMultiFilter from '../../components/EmployeeMultiFilter';
import { FunnelIcon } from '@heroicons/react/24/outline';
import SortableTable from '../../components/SortableTable';

// Hàm helper định dạng ngày thành kiểu "May 15, 2026"
const formatCustomDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

function StatusBadge({ status }) {
  if (status?.toLowerCase() === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Hoàn thành
      </span>
    );
  }
  if (status?.toLowerCase() === 'in progress') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        Đang thực hiện
      </span>
    );
  }
  if (status?.toLowerCase() === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        Chờ xử lý
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
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const pageSize = 15;

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

  const filteredTasks = React.useMemo(() => {
    if (filterStatus === 'all') return employeeTasks;
    if (filterStatus === 'overdue') return employeeTasks.filter(t => isOverdue(t));
    return employeeTasks.filter(t => t.status === filterStatus);
  }, [employeeTasks, filterStatus]);

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
        if (isOverdue(task)) return 1;
        if (task.status === 'pending') return 2;
        if (task.status === 'in progress') return 3;
        if (task.status === 'completed') return 4;
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
    { key: 'name', label: 'Tên công việc', sortable: true, className: 'w-[28%] min-w-[220px]' },
    { key: 'assigner', label: 'Người giao', sortable: true, className: 'w-[12%] min-w-[110px]' },
    { key: 'due_date', label: 'Hạn chót', sortable: true, className: 'w-[100px]' },
    { key: 'start_time', label: 'Ngày bắt đầu', sortable: true, className: 'w-[100px]' },
    { key: 'status', label: 'Trạng thái', sortable: true, className: 'w-[90px]' },
    { key: 'extra', label: isAdmin ? 'Người tham gia' : 'Vai trò', sortable: false },
    { key: 'created_at', label: 'Ngày tạo', sortable: true, className: 'w-[100px]', defaultSortDir: 'desc' },
    { key: 'action', label: 'Thao tác', sortable: false, align: 'center', className: 'w-[80px]' },
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
    if (!window.confirm('Xóa công việc này?')) return;
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Danh sách công việc</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Quản lý và theo dõi tiến độ công việc</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {!isAdmin && (
            <button
              onClick={() => navigate('/tasks/add')}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#0056b3] hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex-1 md:flex-none justify-center"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Tạo công việc</span>
            </button>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="mb-6 bg-white p-4 rounded-2xl border border-gray-300 shadow-md">
          <EmployeeMultiFilter
            employees={employees}
            selectedIds={selectedEmployeeIds}
            onSelectionChange={(ids) => setSelectedEmployeeIds(ids)}
            placeholder="Chọn nhân viên..."
          />
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 mb-6 sm:mb-8">
        <StatCard
          label="Tổng công việc"
          value={employeeTasks.length}
          icon={<ClipboardDocumentListIcon />}
          iconBg="bg-gray-100"
          iconColor="text-gray-500"
          isActive={filterStatus === 'all'}
          onClick={() => setFilterStatus('all')}
        />
        <StatCard
          label="Chờ xử lý"
          value={employeeTasks.filter(t => t.status === 'pending').length}
          icon={<ClockIcon />}
          iconBg="bg-gray-100"
          iconColor="text-gray-400"
          isActive={filterStatus === 'pending'}
          onClick={() => setFilterStatus('pending')}
        />
        <StatCard
          label="Đang thực hiện"
          value={employeeTasks.filter(t => t.status === 'in progress').length}
          icon={<ClockIcon className="animate-spin-slow" />}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          isActive={filterStatus === 'in progress'}
          onClick={() => setFilterStatus('in progress')}
        />
        <StatCard
          label="Hoàn thành"
          value={employeeTasks.filter(t => t.status === 'completed').length}
          icon={<CheckCircleIcon />}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          isActive={filterStatus === 'completed'}
          onClick={() => setFilterStatus('completed')}
        />
        <StatCard
          label="Quá hạn"
          value={employeeTasks.filter(t => isOverdue(t)).length}
          icon={<ExclamationTriangleIcon />}
          iconBg="bg-red-100"
          iconColor="text-red-600"
          isActive={filterStatus === 'overdue'}
          onClick={() => setFilterStatus('overdue')}
        />
      </div>

      <SortableTable
        columns={columns}
        data={displayTasks}
        loading={loading}
        emptyMessage="Không tìm thấy công việc nào."
        pageSize={pageSize}
        currentPage={currentPage}
        totalItems={displayTasks.length}
        onPageChange={setCurrentPage}
        onSortChange={(key, dir) => { setSortKey(key); setSortDir(dir); setCurrentPage(1); }}
        tableClassName="min-w-[600px] table-auto"
        renderRow={(task) => (
          <tr
            key={task.task_id}
            onClick={() => navigate(`/tasks/${task.task_id}`)}
            className={`border-b border-gray-200 hover:bg-blue-50/80 even:bg-gray-50/50 transition-colors cursor-pointer select-none ${task.parent_id ? 'bg-indigo-50/40' : ''}`}
          >
            <td className="px-6 py-5 w-[28%] min-w-[220px]">
              <div className="flex items-center gap-2">
                {task.parent_id && <div className="w-4 border-b-2 border-l-2 border-gray-300 h-4 rounded-bl-md flex-shrink-0" />}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 text-sm leading-snug break-words line-clamp-2" title={task.name}>{task.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">ID: REQ-{task.task_id}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-5 text-gray-600 text-sm truncate w-[12%] min-w-[110px]" title={task.assigner}>{task.assigner}</td>
            <td className="px-3 py-5 text-gray-600 text-xs whitespace-nowrap w-[100px]">{formatCustomDate(task.due_date)}</td>

            <td className="px-3 py-5 text-gray-600 text-xs whitespace-nowrap w-[100px]">{formatCustomDate(task.start_time)}</td>
            <td className="px-4 py-5 w-[120px]" onClick={(e) => e.stopPropagation()}>
              <TaskStatusDropdown
                currentStatus={task.status}
                dueDate={task.due_date}
                onStatusChange={(newStatus) => handleStatusChange(task.task_id, newStatus)}
                size="sm"
              />
            </td>
            <td className="px-4 py-5 text-gray-600 text-sm w-[20%] min-w-[150px]">
              {isAdmin ? (
                <div className="flex flex-wrap gap-1">
                  {task.participants && task.participants.map(p => (
                    <span key={p.person_id} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">{p.name}</span>
                  ))}
                </div>
              ) : (
                task.role || 'N/A'
              )}
            </td>
            <td className="px-3 py-5 text-gray-600 text-xs whitespace-nowrap w-[100px]">{formatCustomDate(task.created_at)}</td>

            <td className="px-4 py-5 text-center w-[80px]">
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