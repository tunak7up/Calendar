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
  ClockIcon,
  ChatBubbleLeftRightIcon,
  PaperClipIcon,
  PaperAirplaneIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { formatDateTime } from '../utils/dateUtils';
import { apiFetch } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TaskDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const taskFromState = location.state?.task;

  const [fullTask, setFullTask] = useState(taskFromState || {});
  const [subTasks, setSubTasks] = useState([]);
  const [parentTask, setParentTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [persons, setPersons] = useState({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubTask, setSelectedSubTask] = useState(null);
  const [productUrl, setProductUrl] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParentUpdate, setIsParentUpdate] = useState(false);

  const fetchTaskData = async () => {
    try {
      const data = await apiFetch(`/task/${id}`);
      if (data.success) {
        setFullTask(data.data);
        
        // If it's a sub-task, fetch parent info
        if (data.data.parent_id) {
          const pData = await apiFetch(`/task/${data.data.parent_id}`);
          if (pData.success) {
            setParentTask(pData.data);
          }
        } else {
          setParentTask(null);
        }
      }
    } catch (error) {
      console.error('Error fetching task:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const data = await apiFetch(`/comment/task/${id}`);
      if (data.success) {
        setComments(data.data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchSubTasks = async () => {
    try {
      const data = await apiFetch(`/task/parent/${id}`);
      if (data.success) {
        const enhancedSubTasks = await Promise.all((data.data || []).map(async st => {
          const cData = await apiFetch(`/comment/task/${st.task_id}`);
          return {
            ...st,
            comments: cData.success ? cData.data : [],
            newComment: ''
          };
        }));
        setSubTasks(enhancedSubTasks);
      }
    } catch (error) {
      console.error('Error fetching sub-tasks:', error);
    }
  };

  const fetchPersons = async () => {
    try {
      const res = await apiFetch('/person');
      if (res.success) {
        const pMap = {};
        res.data.forEach(p => pMap[p.person_id] = p.name || p.username);
        setPersons(pMap);
      }
    } catch (error) {
      console.error('Error fetching persons:', error);
    }
  };

  useEffect(() => {
    fetchPersons();
  }, []);

  useEffect(() => {
    if (id) {
      fetchTaskData();
      fetchComments();
      fetchSubTasks();
    }
  }, [id]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const res = await apiFetch(`/comment/task/${id}`, {
        method: 'POST',
        body: JSON.stringify({
          person_id: user.person_id,
          content: newComment.trim()
        })
      });

      if (res.success) {
        setNewComment('');
        fetchComments();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleAddSubTaskComment = async (subTaskId) => {
    const subTask = subTasks.find(st => st.task_id === subTaskId);
    if (!subTask || !subTask.newComment?.trim()) return;

    try {
      const res = await apiFetch(`/comment/task/${subTaskId}`, {
        method: 'POST',
        body: JSON.stringify({
          person_id: user.person_id,
          content: subTask.newComment.trim()
        })
      });

      if (res.success) {
        // Refresh subtasks to get the new comment
        fetchSubTasks();
      }
    } catch (error) {
      console.error('Error adding sub-task comment:', error);
    }
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
        const result = await apiFetch(`/task/${selectedSubTask.task_id}`, {
          method: 'PUT',
          body: JSON.stringify({ status: newStatus })
        });
        if (!result.success) {
          alert(result.message);
          setIsSubmitting(false);
          return;
        }
      }

      if (productUrl.trim()) {
        await apiFetch('/task/attachment', {
          method: 'POST',
          body: JSON.stringify({ task_id: selectedSubTask.task_id, url: productUrl.trim() })
        });
      }

      setIsModalOpen(false);
      setSelectedSubTask(null);
      setProductUrl('');

      fetchTaskData();
      fetchSubTasks();
    } catch (error) {
      console.error('Error submitting work:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!id) {
    return (
      <div className="flex-1 p-8 sm:ml-64 mt-[56px] pt-6 sm:pt-10 bg-[#f1f4f8] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-4">Task ID is missing.</div>
          <button onClick={() => navigate(-1)} className="text-blue-600 font-medium">Go back</button>
        </div>
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
    <div className="flex-1 p-8 sm:ml-64 mt-[56px] pt-6 sm:pt-10 bg-[#f1f4f8] min-h-screen pb-20">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#0056b3] transition-colors mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to list
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          {/* Header */}
          <div className="p-5 sm:p-8 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="text-xs font-bold text-gray-400 tracking-widest uppercase">
                    {parentTask ? 'Sub-task' : 'Task'} ID: REQ-{fullTask.task_id}
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold capitalize ${getPriorityColor(fullTask.priority)}`}>
                    {fullTask.priority || 'Normal'} Priority
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                  {fullTask.title || fullTask.name || 'Untitled Task'}
                </h1>
                {parentTask && (
                  <div className="mt-3 flex items-center gap-2 p-2 bg-blue-50/50 rounded-xl border border-blue-100 w-fit">
                    <div className="p-1 bg-blue-100 text-blue-600 rounded-md">
                      <ListBulletIcon className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-blue-400 uppercase tracking-tight">Belongs to parent task</p>
                      <button 
                        onClick={() => navigate(`/tasks/${parentTask.task_id}`, { state: { task: parentTask } })}
                        className="text-xs font-bold text-blue-700 hover:underline text-left"
                      >
                        {parentTask.title || parentTask.name}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2">
                <span className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold border uppercase tracking-wider ${getStatusColor(fullTask.status)}`}>
                  {fullTask.status || 'Unknown'}
                </span>
                <button
                  onClick={() => handleOpenModal(fullTask, true)}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-widest underline underline-offset-4"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>

          {/* Compact Details Bar */}
          <div className="px-5 py-3 sm:px-8 sm:py-4 bg-gray-50/50 border-b border-gray-100">
            <div className="flex flex-wrap gap-4 sm:gap-6 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <UserIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500 font-medium">Assigner:</span>
                <span className="text-gray-900 font-semibold">{fullTask.assigner || 'Unassigned'}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <ClockIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500 font-medium">Start:</span>
                <span className="text-gray-900 font-semibold">{formatDateTime(fullTask.start_time)}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500 font-medium">Due:</span>
                <span className="text-gray-900 font-semibold">{formatDateTime(fullTask.due_date)}</span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <ShieldCheckIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500 font-medium">Role:</span>
                <span className="text-gray-900 font-semibold">{fullTask.role || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="p-5 sm:p-8 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <DocumentTextIcon className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900">Description</h2>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 border border-gray-100">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                {fullTask.description || 'No description provided.'}
              </p>
            </div>
          </div>

          {/* Comments Section */}
          <div className="p-5 sm:p-8 bg-gray-50/30">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900">Comments</h2>
            </div>

            <div className="space-y-4 mb-4 sm:mb-6">
              {comments.map(c => (
                <div key={c.comment_id || c.id} className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-gray-100 max-w-[90%] sm:max-w-[80%]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-indigo-600">{persons[c.person_id] || 'Unknown User'}</span>
                    <span className="text-[10px] text-gray-400">{formatDateTime(c.created_at || c.time)}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content || c.text}</p>
                </div>
              ))}
            </div>

            <div className="relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none h-24"
              />
              <button
                onClick={() => handleAddComment()}
                className="absolute bottom-4 right-4 bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Sub-tasks Section */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 sm:p-8 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
            <ListBulletIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">Sub-Tasks</h2>
            <span className="ml-auto bg-indigo-100 text-indigo-700 py-1 px-3 rounded-full text-[10px] sm:text-xs font-bold">
              {subTasks.length} {subTasks.length === 1 ? 'Task' : 'Tasks'}
            </span>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-8">
            {subTasks.length === 0 ? (
              <p className="text-center text-gray-400 py-8 font-semibold">No sub-tasks found.</p>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {subTasks.map(sub => (
                  <div key={sub.task_id} className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all border-l-4 border-l-indigo-500">
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 sm:mb-6">
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">{sub.title || sub.name || 'Untitled Sub-task'}</h3>
                          <div className="flex flex-wrap gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-500">
                            <span className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${getStatusColor(sub.status)}`}>
                              {sub.status || 'pending'}
                            </span>
                            <div className="flex items-center gap-1">
                              <ClockIcon className="w-4 h-4" />
                              Created: {formatDateTime(sub.start_time || sub.create_at)}
                            </div>
                            <div className="flex items-center gap-1">
                              <CalendarDaysIcon className="w-4 h-4" />
                              Due: {formatDateTime(sub.due_date)}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/tasks/${sub.task_id}`, { state: { task: sub } })}
                            className="p-2 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="View Details"
                          >
                            <EyeIcon className="w-6 h-6" />
                          </button>
                          <button
                            onClick={() => handleOpenModal(sub)}
                            className="p-2 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Update Status"
                          >
                            <CheckCircleIcon className="w-6 h-6" />
                          </button>
                        </div>
                      </div>

                      {/* Sub-task Comments */}
                      <div className="bg-gray-50/50 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-4 text-gray-400">
                          <ChatBubbleLeftRightIcon className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Comments</span>
                        </div>
                        <div className="space-y-3 mb-4">
                          {(sub.comments || []).map(sc => (
                            <div key={sc.comment_id || sc.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-50 text-xs">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-indigo-600">{persons[sc.person_id] || 'Unknown User'}</span>
                                <span className="text-[8px] text-gray-400">{formatDateTime(sc.created_at || sc.time)}</span>
                              </div>
                              <p className="text-gray-700 whitespace-pre-wrap">{sc.content || sc.text}</p>
                            </div>
                          ))}
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            value={sub.newComment || ''}
                            onChange={(e) => setSubTasks(prev => prev.map(item => item.task_id === sub.task_id ? { ...item, newComment: e.target.value } : item))}
                            placeholder="Add a comment for this sub-task..."
                            className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddSubTaskComment(sub.task_id)}
                          />
                          <button
                            onClick={() => handleAddSubTaskComment(sub.task_id)}
                            className="absolute right-2 top-1.5 p-1.5 text-indigo-500 hover:text-indigo-700"
                          >
                            <PaperAirplaneIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
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
                <h3 className="text-xl font-bold text-gray-900">Update Task Status</h3>
                <p className="text-xs text-gray-500 mt-1">{selectedSubTask.title || selectedSubTask.name}</p>
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
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <PaperClipIcon className="w-4 h-4" />
                  Attachment (Link/URL)
                </label>
                <input
                  type="url"
                  placeholder="https://docs.google.com/..."
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                <p className="text-xs text-gray-400 mt-2">Optional. Provide a link to your finished work or resource.</p>
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
