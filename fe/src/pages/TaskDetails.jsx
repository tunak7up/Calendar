import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon, 
  CalendarDaysIcon, 
  UserIcon, 
  FlagIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ListBulletIcon,
  CheckCircleIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { formatDateTime } from '../utils/dateUtils';

export default function TaskDetails({ task, onBack }) {
  const [fullTask, setFullTask] = useState(task);
  const [subTasks, setSubTasks] = useState([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubTask, setSelectedSubTask] = useState(null);
  const [productUrl, setProductUrl] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParentUpdate, setIsParentUpdate] = useState(false);

  useEffect(() => {
    if (task?.task_id) {
      fetch(`http://localhost:3000/api/task/${task.task_id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setFullTask(prev => ({ ...prev, description: data.data.description }));
          }
        });
      fetchSubTasks();
    }
  }, [task]);

  const fetchSubTasks = () => {
    fetch(`http://localhost:3000/api/task/parent/${task.task_id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSubTasks(data.data || []);
        }
      });
  };

  const handleOpenModal = (subTask, isParent = false) => {
    setIsParentUpdate(isParent);
    setSelectedSubTask(subTask);
    setNewStatus(subTask.status || 'pending');
    setProductUrl('');
    setIsModalOpen(true);
  };

  const handleSubmitWork = async () => {
    setIsSubmitting(true);
    try {
      if (newStatus !== selectedSubTask.status) {
        const res = await fetch(`http://localhost:3000/api/task/${selectedSubTask.task_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        const result = await res.json();
        if (!result.success) {
          alert(result.message);
          setIsSubmitting(false);
          return;
        }
      }

      if (productUrl.trim()) {
        await fetch('http://localhost:3000/api/task/attachment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task_id: selectedSubTask.task_id, url: productUrl.trim() })
        });
      }

      setIsModalOpen(false);
      setSelectedSubTask(null);
      setProductUrl('');
      
      if (isParentUpdate) {
        // Refresh parent task
        const res = await fetch(`http://localhost:3000/api/task/${task.task_id}`);
        const data = await res.json();
        if (data.success) {
          setFullTask(prev => ({ ...prev, status: data.data.status }));
        }
      }
      
      fetchSubTasks();
    } catch (error) {
      console.error('Error submitting work:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!task) {
    return (
      <div className="flex-1 p-8 pt-[80px] sm:ml-64 bg-[#f1f4f8] min-h-screen flex items-center justify-center">
        <div className="text-gray-500">No task selected.</div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'in progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-orange-600 bg-orange-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="flex-1 p-8 sm:ml-64 pt-[80px] bg-[#f1f4f8] min-h-screen pb-20">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#0056b3] transition-colors mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to list
        </button>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          {/* Header */}
          <div className="p-8 border-b border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-2">
                  Task ID: REQ-{fullTask.task_id}
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
                  {fullTask.name || 'Untitled Task'}
                </h1>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusColor(fullTask.status)}`}>
                  {fullTask.status || 'Unknown'}
                </span>
                <button
                  onClick={() => handleOpenModal(fullTask, true)}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-widest underline underline-offset-4"
                >
                  Update Main Task Status
                </button>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-8 bg-gray-50/50 border-b border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Assigner</p>
                  <p className="text-gray-900 font-semibold">{fullTask.assigner || 'Unassigned'}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <ClockIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Start Time</p>
                  <p className="text-gray-900 font-semibold">
                    {formatDateTime(fullTask.start_time)}
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <CalendarDaysIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Due Time</p>
                  <p className="text-gray-900 font-semibold">
                    {formatDateTime(fullTask.due_date)}
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                  <FlagIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Priority</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold capitalize ${getPriorityColor(fullTask.priority)}`}>
                    {fullTask.priority || 'Normal'}
                  </span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
                <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                  <ShieldCheckIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Role</p>
                  <p className="text-gray-900 font-semibold">{fullTask.role || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="p-8">
            <div className="flex items-center gap-2 mb-4">
              <DocumentTextIcon className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900">Description</h2>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {fullTask.description || 'No description provided.'}
              </p>
            </div>
          </div>
        </div>

        {/* Sub-tasks Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
            <ListBulletIcon className="w-6 h-6 text-indigo-500" />
            <h2 className="text-xl font-extrabold text-gray-900">Sub-Tasks</h2>
            <span className="ml-auto bg-indigo-100 text-indigo-700 py-1 px-3 rounded-full text-xs font-bold">
              {subTasks.length} {subTasks.length === 1 ? 'Task' : 'Tasks'}
            </span>
          </div>

          <div className="p-6">
            {subTasks.length === 0 ? (
              <p className="text-center text-gray-400 py-8 font-semibold">No sub-tasks found.</p>
            ) : (
              <div className="space-y-4">
                {subTasks.map(sub => (
                  <div key={sub.task_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all bg-white group">
                    <div className="mb-4 sm:mb-0">
                      <h3 className="font-bold text-gray-900 mb-1">{sub.title || 'Untitled Sub-task'}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className={`px-2 py-0.5 rounded-md font-bold uppercase ${getStatusColor(sub.status)}`}>
                          {sub.status || 'pending'}
                        </span>
                        {sub.due_date && (
                          <span>Due: {formatDateTime(sub.due_date)}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenModal(sub)}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-600 hover:text-white transition-colors flex items-center gap-2 w-fit"
                    >
                      <CheckCircleIcon className="w-5 h-5" />
                      Update Status
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Update Sub-task Modal */}
      {isModalOpen && selectedSubTask && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Update Sub-Task</h3>
                <p className="text-xs text-gray-500 mt-1">{selectedSubTask.title}</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Change Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="in progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Submit Product (Link/URL)</label>
                <input
                  type="url"
                  placeholder="https://docs.google.com/..."
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                <p className="text-xs text-gray-400 mt-2">Optional. Provide a link to your finished work.</p>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSubmitWork}
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
