import React, { useState } from 'react';
import {
  ClipboardDocumentListIcon,
  PlusIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { taskService } from '../services/taskService';
import EmployeeMultiFilter from '../components/EmployeeMultiFilter';
import { FunnelIcon } from '@heroicons/react/24/outline';

function StatusBadge({ status }) {
  if (status?.toLowerCase() === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Completed
      </span>
    );
  }
  if (status?.toLowerCase() === 'in progress') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        In Progress
      </span>
    );
  }
  if (status?.toLowerCase() === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        Pending
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
        flex items-center gap-2 sm:gap-3 bg-white border rounded-xl px-3 sm:px-4 py-2 sm:py-3 shadow-sm w-full cursor-pointer transition-all
        ${isActive ? 'ring-2 ring-blue-500 border-transparent scale-105 shadow-md' : 'border-gray-100 hover:border-blue-200'}
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

  // Sort tasks: parents first, then their subtasks
  const displayTasks = React.useMemo(() => {
    const parents = filteredTasks.filter(t => !t.parent_id);
    const children = filteredTasks.filter(t => t.parent_id);
    
    const sorted = [];
    parents.forEach(p => {
      sorted.push(p);
      const pChildren = children.filter(c => c.parent_id === p.task_id);
      sorted.push(...pChildren);
    });
    
    // Add any orphans
    const handledIds = new Set(sorted.map(t => t.task_id));
    const orphans = filteredTasks.filter(t => !handledIds.has(t.task_id));
    sorted.push(...orphans);
    
    return sorted;
  }, [filteredTasks]);

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
    if (!window.confirm('Delete this task?')) return;
    try {
      const res = await taskService.deleteTask(taskId);
      if (res.success) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const statuses = [
    { id: 'pending', label: 'Pending', bg: 'bg-gray-400', text: 'text-gray-700', light: 'bg-gray-100', dot: 'bg-gray-400' },
    { id: 'in progress', label: 'In Progress', bg: 'bg-blue-500', text: 'text-blue-800', light: 'bg-blue-100', dot: 'bg-blue-500' },
    { id: 'completed', label: 'Completed', bg: 'bg-emerald-500', text: 'text-emerald-800', light: 'bg-emerald-100', dot: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Task Registry</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Manage and monitor administrative chronologies</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`
                  w-full border text-sm font-bold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm cursor-pointer appearance-none pr-10
                  ${filterStatus === 'all' ? 'bg-white border-gray-200 text-gray-700' : 
                    filterStatus === 'pending' ? 'bg-gray-50 border-gray-300 text-gray-700' :
                    filterStatus === 'in progress' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                    filterStatus === 'completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                    'bg-red-50 border-red-200 text-red-700'}
                `}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
              <ChevronDownIcon className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {!isAdmin && (
              <button
                onClick={() => navigate('/tasks/add')}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#0056b3] hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex-1 md:flex-none justify-center"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Create Task</span>
              </button>
            )}
        </div>
      </div>

      {isAdmin && (
        <div className="mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <FunnelIcon className="w-3.5 h-3.5" />
            Filter by Participants
          </p>
          <EmployeeMultiFilter 
            employees={employees}
            selectedIds={selectedEmployeeIds}
            onSelectionChange={(ids) => setSelectedEmployeeIds(ids)}
            placeholder="Select employees..."
          />
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
        <StatCard
          label="Total Tasks"
          value={employeeTasks.length}
          icon={<ClipboardDocumentListIcon />}
          iconBg="bg-gray-100"
          iconColor="text-gray-500"
          isActive={filterStatus === 'all'}
          onClick={() => setFilterStatus('all')}
        />
        <StatCard
          label="Pending"
          value={employeeTasks.filter(t => t.status === 'pending').length}
          icon={<ClockIcon />}
          iconBg="bg-gray-100"
          iconColor="text-gray-400"
          isActive={filterStatus === 'pending'}
          onClick={() => setFilterStatus('pending')}
        />
        <StatCard
          label="Completed"
          value={employeeTasks.filter(t => t.status === 'completed').length}
          icon={<CheckCircleIcon />}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          isActive={filterStatus === 'completed'}
          onClick={() => setFilterStatus('completed')}
        />
        <StatCard
          label="Overdue"
          value={employeeTasks.filter(t => isOverdue(t)).length}
          icon={<ExclamationTriangleIcon />}
          iconBg="bg-red-100"
          iconColor="text-red-600"
          isActive={filterStatus === 'overdue'}
          onClick={() => setFilterStatus('overdue')}
        />
      </div>

      {/* Task Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading tasks...</div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto max-h-[50vh] sm:max-h-[65vh] custom-scrollbar">
          <table className="w-full text-sm min-w-[600px] relative">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 w-[40%]">
                  Task Title
                </th>
                <th className="text-left px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Assigner
                </th>
                <th className="text-left px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Start Date
                </th>
                <th className="text-left px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Due Date
                </th>
                <th className="text-left px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Status
                </th>
                <th className="text-left px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {isAdmin ? 'Participants' : 'Role'}
                </th>
                <th className="text-center px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 w-16">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {displayTasks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-400">No tasks found.</td>
                </tr>
              ) : displayTasks.map((task, idx) => (
                <React.Fragment key={task.task_id}>
                  <tr
                    onClick={() => navigate(`/tasks/${task.task_id}`)}
                    className={`border-b border-gray-50 hover:bg-[#f8fafc] transition-colors cursor-pointer select-none ${task.parent_id ? 'bg-gray-50/50' : ''}`}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        {task.parent_id && <div className="w-4 border-b-2 border-l-2 border-gray-300 h-4 rounded-bl-md inline-block"></div>}
                        <div>
                          <p className="font-bold text-gray-900 text-sm leading-snug">{task.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">ID: REQ-{task.task_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-gray-600 text-sm whitespace-nowrap">{task.assigner}</td>
                    <td className="px-4 py-5 text-gray-600 text-xs whitespace-nowrap">
                      {formatDateTime(task.start_time)}
                    </td>
                    <td className="px-4 py-5 text-gray-600 text-xs whitespace-nowrap">
                      {formatDateTime(task.due_date)}
                    </td>
                    <td className="px-4 py-5" onClick={(e) => e.stopPropagation()}>
                      <Menu as="div" className="relative inline-block text-left">
                        <Menu.Button className={`
                          flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all border shadow-sm
                          ${statuses.find(s => s.id === task.status?.toLowerCase())?.light || 'bg-gray-100'}
                          ${statuses.find(s => s.id === task.status?.toLowerCase())?.text || 'text-gray-700'}
                          ${statuses.find(s => s.id === task.status?.toLowerCase())?.light.replace('bg-', 'border-') || 'border-gray-200'}
                          hover:scale-105 active:scale-95
                        `}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statuses.find(s => s.id === task.status?.toLowerCase())?.dot || 'bg-gray-400'} ${task.status === 'in progress' ? 'animate-pulse' : ''}`} />
                          {task.status || 'Pending'}
                          <ChevronDownIcon className="w-3 h-3 opacity-50" />
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
                          <Menu.Items className="absolute left-0 z-50 mt-2 w-40 origin-top-left rounded-2xl bg-white p-2 shadow-[0_10px_40px_rgba(0,0,0,0.1)] ring-1 ring-black/5 focus:outline-none border border-gray-100">
                            {statuses.map((s) => (
                              <Menu.Item key={s.id}>
                                {({ active }) => (
                                  <button
                                    onClick={() => handleStatusChange(task.task_id, s.id)}
                                    className={`
                                      w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all
                                      ${active ? `${s.light} ${s.text} translate-x-1` : 'text-gray-500 hover:bg-gray-50'}
                                    `}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                    {s.label}
                                  </button>
                                )}
                              </Menu.Item>
                            ))}
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </td>
                    <td className="px-4 py-5 text-gray-600 text-sm">
                      {isAdmin ? (
                        <div className="flex flex-wrap gap-1">
                          {task.participants && task.participants.map(p => (
                            <span key={p.person_id} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                              {p.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        task.role || 'N/A'
                      )}
                    </td>
                    <td className="px-4 py-5 text-center">
                      <button
                        onClick={(e) => handleDeleteTask(e, task.task_id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete Task"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
          </div>
        )}

        {/* Pagination footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-[#fafafa]">
          <span className="text-xs text-gray-400">
            Showing {displayTasks.length} tasks (Click a task for details)
          </span>
        </div>
      </div>

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
