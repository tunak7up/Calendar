import React, { useState } from 'react';
import {
  ClipboardDocumentListIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';

function StatusBadge({ status }) {
  if (status === 'Completed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#d1fae5] text-[#065f46]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] inline-block" />
        Completed
      </span>
    );
  }
  if (status === 'In Progress') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#eff6ff] text-[#1d4ed8]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] inline-block" />
        In Progress
      </span>
    );
  }
  if (status === 'Pending') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#f3f4f6] text-[#374151]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af] inline-block" />
        Pending
      </span>
    );
  }
  return null;
}

function StatCard({ icon, label, value, iconBg, iconColor }) {
  return (
    <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-xl px-6 py-4 flex-1 min-w-[150px] shadow-sm">
      <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${iconBg}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
        <p className="text-3xl font-extrabold text-gray-900 leading-none">{value}</p>
      </div>
    </div>
  );
}

export default function TaskList({ isAdmin }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchTasks = async () => {
      try {
        const result = isAdmin
          ? await apiFetch('/task')
          : await apiFetch(`/task/participant/${user.person_id}`);
        if (result.success) {
          setTasks(result.data);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

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

  const displayTasks = isAdmin && selectedEmployeeId !== 'all'
    ? tasks.filter(t => t.participants && t.participants.some(p => p.person_id.toString() === selectedEmployeeId))
    : tasks;

  return (
    <div className="flex-1 p-8 sm:ml-64 pt-[80px] bg-[#f1f4f8] min-h-screen">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-[2rem] font-extrabold text-gray-900 leading-tight tracking-tight">Task Registry</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and monitor administrative chronologies</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="border border-gray-200 bg-white text-gray-700 text-sm font-semibold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#0056b3]"
            >
              <option value="all">All Employees</option>
              {employees.map(emp => (
                <option key={emp.person_id} value={emp.person_id}>{emp.name}</option>
              ))}
            </select>
          )}
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Export Report
          </button>
          {!isAdmin && (
            <button
              onClick={() => navigate('/tasks/add')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0056b3] hover:bg-[#004494] text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Create Task
            </button>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="flex gap-4 mb-8 flex-wrap">
        <StatCard
          label="Total Tasks"
          value={displayTasks.length}
          icon={<ClipboardDocumentListIcon className="w-5 h-5" />}
          iconBg="bg-gray-100"
          iconColor="text-gray-500"
        />
        <StatCard
          label="Pending"
          value={displayTasks.filter(t => t.status === 'pending').length}
          icon={<ClockIcon className="w-5 h-5" />}
          iconBg="bg-gray-100"
          iconColor="text-gray-400"
        />
        <StatCard
          label="Completed"
          value={displayTasks.filter(t => t.status === 'completed').length}
          icon={<CheckCircleIcon className="w-5 h-5" />}
          iconBg="bg-[#d1fae5]"
          iconColor="text-[#10b981]"
        />
        <StatCard
          label="Overdue"
          value={0}
          icon={<ExclamationTriangleIcon className="w-5 h-5" />}
          iconBg="bg-[#fff3cd]"
          iconColor="text-[#f59e0b]"
        />
      </div>

      {/* Task Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading tasks...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 w-[35%]">
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
                <th className="text-center px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {displayTasks.map((task, idx) => (
                <tr
                  key={task.task_id}
                  className={`border-b border-gray-50 hover:bg-[#f8fafc] transition-colors ${idx === displayTasks.length - 1 ? 'border-b-0' : ''}`}
                >
                  <td className="px-6 py-5">
                    <p className="font-bold text-gray-900 text-sm leading-snug">{task.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">ID: REQ-{task.task_id}</p>
                  </td>
                  <td className="px-4 py-5 text-gray-600 text-sm whitespace-nowrap">{task.assigner}</td>
                  <td className="px-4 py-5 text-gray-600 text-xs whitespace-nowrap">
                    {formatDateTime(task.start_time)}
                  </td>
                  <td className="px-4 py-5 text-gray-600 text-xs whitespace-nowrap">
                    {formatDateTime(task.due_date)}
                  </td>
                  <td className="px-4 py-5">
                    <StatusBadge status={task.status ? task.status.charAt(0).toUpperCase() + task.status.slice(1) : 'Pending'} />
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
                  <td className="px-4 py-5 text-center flex items-center justify-center gap-4">
                    {!isAdmin && (
                      <button
                        onClick={() => navigate(`/tasks/sub-add/${task.task_id}`, { state: { parentTask: task } })}
                        title="Add Sub-task"
                        className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/tasks/${task.task_id}`, { state: { task } })}
                      title="View details"
                      className="text-gray-400 hover:text-[#0056b3] transition-colors"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-[#fafafa]">
          <span className="text-xs text-gray-400">
            Showing {displayTasks.length} tasks
          </span>
        </div>
      </div>
    </div>
  );
}
