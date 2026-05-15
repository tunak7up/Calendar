import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardDocumentCheckIcon, 
  ClockIcon, 
  CalendarDaysIcon, 
  ClipboardDocumentListIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { requestService } from '../services/requestService';
import { scheduleService } from '../services/scheduleService';
import { taskService } from '../services/taskService';
import { formatDateTime } from '../utils/dateUtils';
import EmployeeMultiFilter from '../components/EmployeeMultiFilter';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Data states
  const [requests, setRequests] = useState([]);
  const [reports, setReports] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Filter state for tasks
  const [taskSearchTerm, setTaskSearchTerm] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [empRes, reqRes, repRes, schedRes, taskRes] = await Promise.all([
        apiFetch('/person'),
        requestService.getAllRequests(), // Or a specific endpoint for pending, filtering locally
        apiFetch(`/daily-report/range?start=${todayStr}&end=${todayStr}`),
        scheduleService.getSchedulesByRange ? scheduleService.getSchedulesByRange(todayStr, todayStr) : scheduleService.getAllSchedules(),
        taskService.getAllTasks()
      ]);

      if (empRes.success) setEmployees(empRes.data);
      if (reqRes.success) setRequests(reqRes.data);
      if (repRes.success) setReports(repRes.data);
      
      if (schedRes.success) {
        // If it's getAllSchedules, we need to filter by today locally
        const scheds = schedRes.data.filter(s => s.working_date && s.working_date.startsWith(todayStr));
        setSchedules(scheds);
      }
      
      if (taskRes.success) setTasks(taskRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRequestStatus = async (requestId, newStatus) => {
    try {
      const result = await apiFetch(`/request/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (result.success) {
        setRequests(prev => prev.map(req => 
          (req.request_id || req.id) === requestId ? { ...req, status: newStatus } : req
        ));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update request status');
    }
  };

  // Processed Data
  const pendingRequests = requests.filter(req => req.status?.toLowerCase() === 'pending');
  
  const todayAttendance = employees.map(emp => {
    const report = reports.find(r => r.person_id === emp.person_id);
    return {
      ...emp,
      check_in: report?.check_in,
      check_out: report?.check_out,
      description: report?.description,
      status: report?.check_out ? 'Completed' : (report?.check_in ? 'Checked In' : 'Not Checked In')
    };
  }).filter(emp => emp.role !== 'manager'); // Usually focus on staff

  const todayShifts = schedules.map(sched => {
    const emp = employees.find(e => e.person_id === sched.person_id);
    return {
      ...sched,
      name: emp?.name || emp?.username || `User ${sched.person_id}`
    };
  });

  const filteredTasks = tasks.filter(task => {
    if (!taskSearchTerm) return true;
    const term = taskSearchTerm.toLowerCase();
    
    // Check task name
    if (task.name?.toLowerCase().includes(term) || task.title?.toLowerCase().includes(term)) return true;
    
    // Check participants
    if (task.participants && Array.isArray(task.participants)) {
      return task.participants.some(p => p.name?.toLowerCase().includes(term));
    }
    
    return false;
  });

  const getTaskStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold uppercase">Completed</span>;
      case 'in progress': return <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-bold uppercase">In Progress</span>;
      default: return <span className="text-[10px] bg-gray-100 text-gray-800 px-2 py-0.5 rounded-md font-bold uppercase">Pending</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Overview of today's activities and pending tasks</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
          <CalendarDaysIcon className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-gray-800">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Pending Requests Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[400px]">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ClipboardDocumentCheckIcon className="w-5 h-5 text-amber-500" />
              Pending Requests
            </h2>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">{pendingRequests.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {pendingRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <CheckIcon className="w-12 h-12 mb-2 text-gray-300" />
                <p className="text-sm font-medium">All caught up! No pending requests.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingRequests.map(req => (
                  <div key={req.request_id || req.id} className="p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-100 hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start gap-4 cursor-pointer" onClick={() => navigate(`/history/${req.request_id || req.id}`, { state: { request: req } })}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-gray-900">{req.requester?.name || req.requester?.username}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${req.type === 'leave' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                            {req.type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1">{req.reason || 'No reason provided'}</p>
                        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          {new Date(req.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleUpdateRequestStatus(req.request_id || req.id, 'approved'); }}
                          className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 rounded-lg transition-colors border border-emerald-100/50"
                          title="Approve"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleUpdateRequestStatus(req.request_id || req.id, 'rejected'); }}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors border border-red-100/50"
                          title="Reject"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <button onClick={() => navigate('/admin/requests')} className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 w-full justify-center">
              View All Requests <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Employee Attendance Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[400px]">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-blue-500" />
              Today's Attendance
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-white sticky top-0 border-b border-gray-100 shadow-sm z-10">
                <tr>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Employee</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">In/Out</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {todayAttendance.length === 0 ? (
                  <tr><td colSpan="3" className="px-5 py-8 text-center text-gray-400">No employees found.</td></tr>
                ) : (
                  todayAttendance.map(emp => (
                    <tr key={emp.person_id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900">{emp.name || emp.username}</td>
                      <td className="px-5 py-3 text-xs text-gray-500">
                        {emp.check_in ? emp.check_in : '--:--'} - {emp.check_out ? emp.check_out : '--:--'}
                      </td>
                      <td className="px-5 py-3">
                        {emp.status === 'Completed' ? <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">Completed</span> :
                         emp.status === 'Checked In' ? <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase animate-pulse">Checked In</span> :
                         <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 uppercase">No Show</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <button onClick={() => navigate('/admin/work-hours')} className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 w-full justify-center">
              Detailed Work Reports <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3. Today's Shifts Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[400px]">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <CalendarDaysIcon className="w-5 h-5 text-indigo-500" />
              Today's Shifts
            </h2>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-0.5 rounded-full">{todayShifts.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-white sticky top-0 border-b border-gray-100 shadow-sm z-10">
                <tr>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Employee</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Shift Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {todayShifts.length === 0 ? (
                  <tr><td colSpan="2" className="px-5 py-8 text-center text-gray-400">No shifts scheduled for today.</td></tr>
                ) : (
                  todayShifts.map(shift => (
                    <tr key={shift.schedule_id || shift.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900">{shift.name}</td>
                      <td className="px-5 py-3 text-xs font-semibold text-indigo-600">
                        {shift.start_time?.substring(0,5)} - {shift.end_time?.substring(0,5)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <button onClick={() => navigate('/admin/schedule')} className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 w-full justify-center">
              Manage Master Schedule <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4. Tasks Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[400px]">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50/50">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 whitespace-nowrap">
              <ClipboardDocumentListIcon className="w-5 h-5 text-emerald-500" />
              Tasks Overview
            </h2>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-48">
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input 
                  type="text" 
                  placeholder="Filter by employee..." 
                  value={taskSearchTerm}
                  onChange={e => setTaskSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
              <button 
                onClick={() => navigate('/tasks/add')}
                className="bg-[#0056b3] hover:bg-blue-700 text-white p-1.5 rounded-lg shadow-sm transition-colors shrink-0"
                title="Create Quick Task"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-white sticky top-0 border-b border-gray-100 shadow-sm z-10">
                <tr>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-[45%]">Task</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Due</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTasks.length === 0 ? (
                  <tr><td colSpan="3" className="px-5 py-8 text-center text-gray-400">No tasks found matching criteria.</td></tr>
                ) : (
                  filteredTasks.map(task => (
                    <tr 
                      key={task.task_id || task.id} 
                      onClick={() => navigate(`/tasks/${task.task_id || task.id}`)}
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3">
                        <p className="font-bold text-gray-900 text-xs sm:text-sm line-clamp-1">{task.name || task.title}</p>
                        {task.participants && task.participants.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {task.participants.slice(0, 2).map(p => (
                              <span key={p.person_id} className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{p.name}</span>
                            ))}
                            {task.participants.length > 2 && <span className="text-[9px] text-gray-400">+{task.participants.length - 2}</span>}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">
                        {new Date(task.due_date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                      </td>
                      <td className="px-5 py-3">
                        {getTaskStatusBadge(task.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <button onClick={() => navigate('/tasks')} className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 w-full justify-center">
              View Task Registry <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
