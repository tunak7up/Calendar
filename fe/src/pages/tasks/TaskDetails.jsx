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
  PlusIcon,
  EyeIcon,
  UserGroupIcon,
  TrashIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { formatDateTime } from '../../utils/dateUtils';
import { apiFetch } from '../../services/api';
import { taskService } from '../../services/taskService';
import { useAuth } from '../../context/AuthContext';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import ParticipantManager from '../../components/ParticipantManager';
import TaskStatusDropdown from '../../components/TaskStatusDropdown';

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
  const [allUsers, setAllUsers] = useState([]); // Matching AddTask
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [participantFormData, setParticipantFormData] = useState({ person_id: '', role: 'assignee' });

  // Edit Title/Description State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');

  const fetchTaskData = async () => {
    try {
      const data = await taskService.getTaskById(id);
      if (data.success) {
        setFullTask(data.data);
        
        // If it's a sub-task, fetch parent info
        if (data.data.parent_id) {
          const pData = await taskService.getTaskById(data.data.parent_id);
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
      const data = await taskService.getChildTasksByParentId(id);
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
        setAllUsers(res.data);
      }
    } catch (error) {
      console.error('Error fetching persons:', error);
    }
  };

  const handleAddParticipant = async (personId) => {
    try {
      const res = await taskService.addParticipant(id, {
        participant_id: personId,
        role: 'assignee'
      });
      
      if (res.success) {
        fetchTaskData(); 
      }
    } catch (error) {
      console.error('Error adding participant:', error);
    }
  };

  const handleUpdateRole = async (participantId, role) => {
    try {
      const res = await taskService.updateParticipant(id, participantId, { role });
      if (res.success) {
        fetchTaskData();
      }
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleRemoveParticipant = async (participantId) => {
    if (!window.confirm('Remove this participant?')) return;
    try {
      const res = await taskService.removeParticipant(id, participantId);
      if (res.success) {
        fetchTaskData();
      }
    } catch (error) {
      console.error('Error removing participant:', error);
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) return;
    try {
      const res = await taskService.deleteTask(id);
      if (res.success) {
        alert('Task deleted successfully');
        navigate('/tasks');
      } else {
        alert('Error: ' + res.message);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  };

  const handleUpdateTitle = async () => {
    if (!editedTitle.trim()) return;
    try {
      const res = await taskService.updateTaskTitleOrDescription(id, { title: editedTitle.trim() });
      if (res.success) {
        setFullTask(prev => ({ ...prev, title: editedTitle.trim() }));
        setIsEditingTitle(false);
      }
    } catch (error) {
      console.error('Error updating title:', error);
    }
  };

  const handleUpdateDescription = async () => {
    try {
      const res = await taskService.updateTaskTitleOrDescription(id, { description: editedDescription });
      if (res.success) {
        setFullTask(prev => ({ ...prev, description: editedDescription }));
        setIsEditingDescription(false);
      }
    } catch (error) {
      console.error('Error updating description:', error);
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



  if (!id) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <div className="text-gray-500 mb-4">Không tìm thấy mã công việc.</div>
        <button onClick={() => navigate(-1)} className="text-blue-600 font-medium">Quay lại</button>
      </div>
    );
  }

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-red-700 bg-red-100 border-red-200';
      case 'medium': return 'text-amber-700 bg-amber-100 border-amber-200';
      case 'low': return 'text-emerald-700 bg-emerald-100 border-emerald-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };



  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Quay lại
        </button>

        <button 
          onClick={handleDeleteTask}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm"
        >
          <TrashIcon className="w-4 h-4" />
          Xóa công việc
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {/* Header */}
        <div className="p-5 sm:p-8 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <div className="text-xs font-bold text-gray-400 tracking-widest uppercase">
                  {parentTask ? 'Mã công việc con' : 'Mã công việc'}: REQ-{fullTask.task_id}
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold capitalize ${getPriorityColor(fullTask.priority)}`}>
                  Mức độ {fullTask.priority === 'High' ? 'Cao' : fullTask.priority === 'Medium' ? 'Trung bình' : fullTask.priority === 'Low' ? 'Thấp' : 'Bình thường'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2 w-full mt-2">
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight bg-gray-50 border border-indigo-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none w-full"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateTitle();
                        if (e.key === 'Escape') setIsEditingTitle(false);
                      }}
                    />
                    <div className="flex gap-1">
                      <button onClick={handleUpdateTitle} className="p-2 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all">
                        <CheckCircleIcon className="w-6 h-6" />
                      </button>
                      <button onClick={() => setIsEditingTitle(false)} className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-600 hover:text-white transition-all">
                        <XMarkIcon className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 mt-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                      {fullTask.title || fullTask.name || 'Công việc không tên'}
                    </h1>
                    <button 
                      onClick={() => {
                        setEditedTitle(fullTask.title || fullTask.name || '');
                        setIsEditingTitle(true);
                      }}
                      className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all"
                      title="Sửa tiêu đề"
                    >
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
              {parentTask && (
                <div className="mt-3 flex items-center gap-2 p-2 bg-blue-50/50 rounded-xl border border-blue-100 w-fit">
                  <div className="p-1 bg-blue-100 text-blue-600 rounded-md">
                    <ListBulletIcon className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-blue-400 uppercase tracking-tight">Thuộc công việc cha</p>
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
              <TaskStatusDropdown 
                currentStatus={fullTask.status} 
                dueDate={fullTask.due_date}
                onStatusChange={async (val) => {
                  const res = await taskService.updateTask(fullTask.task_id, { status: val });
                  if (res.success) {
                    fetchTaskData();
                    fetchSubTasks();
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Compact Details Bar */}
        <div className="px-5 py-3 sm:px-8 sm:py-4 bg-gray-50/50 border-b border-gray-100">
          <div className="flex flex-wrap gap-4 sm:gap-6 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <UserIcon className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500 font-medium">Người giao:</span>
              <span className="text-gray-900 font-semibold">{fullTask.assigner || 'Chưa phân công'}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <ClockIcon className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500 font-medium">Bắt đầu:</span>
              <span className="text-gray-900 font-semibold">{formatDateTime(fullTask.start_time)}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500 font-medium">Hạn chót:</span>
              <span className="text-gray-900 font-semibold">{formatDateTime(fullTask.due_date)}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="p-5 sm:p-8 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900">Mô tả</h2>
            </div>
            {!isEditingDescription && (
              <button 
                onClick={() => {
                  setEditedDescription(fullTask.description || '');
                  setIsEditingDescription(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-wider"
              >
                <PencilSquareIcon className="w-3.5 h-3.5" />
                Sửa mô tả
              </button>
            )}
          </div>
          
          {isEditingDescription ? (
            <div className="space-y-3">
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="w-full bg-gray-50 border border-indigo-100 rounded-2xl p-4 sm:p-6 text-sm sm:text-base text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[150px] resize-y"
                placeholder="Nhập mô tả công việc..."
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setIsEditingDescription(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleUpdateDescription}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  Lưu thay đổi
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 border border-gray-100">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                {fullTask.description || 'Không có mô tả nào.'}
              </p>
            </div>
          )}
        </div>

        {/* Participants Section - Reused Component */}
        <ParticipantManager 
          participants={fullTask.participants}
          allUsers={allUsers}
          onAdd={(personId) => handleAddParticipant(personId)}
          onUpdateRole={handleUpdateRole}
          onRemove={handleRemoveParticipant}
        />

        {/* Comments Section */}
        <div className="p-5 sm:p-8 bg-gray-50/30">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900">Bình luận</h2>
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
              placeholder="Viết bình luận..."
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
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">Công việc con</h2>
          <span className="bg-indigo-100 text-indigo-700 py-1 px-3 rounded-full text-[10px] sm:text-xs font-bold">
            {subTasks.length} Công việc
          </span>
          <button
            onClick={() => navigate(`/tasks/sub-add/${id}`, { state: { parentTask: fullTask } })}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Thêm công việc con</span>
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-8">
          {subTasks.length === 0 ? (
            <p className="text-center text-gray-400 py-8 font-semibold">Không tìm thấy công việc con nào.</p>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {subTasks.map(sub => (
                <div key={sub.task_id} className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all border-l-4 border-l-indigo-500">
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 sm:mb-6">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">{sub.title || sub.name || 'Untitled Sub-task'}</h3>
                        <div className="flex flex-wrap gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-500">
                          <TaskStatusDropdown 
                            currentStatus={sub.status} 
                            dueDate={sub.due_date}
                            size="sm"
                            onStatusChange={async (val) => {
                              const res = await taskService.updateTask(sub.task_id, { status: val });
                              if (res.success) {
                                fetchTaskData();
                                fetchSubTasks();
                              }
                            }}
                          />
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
                          className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm active:scale-95"
                          title="Xem chi tiết"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Sub-task Comments */}
                    <div className="bg-gray-50/50 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-4 text-gray-400">
                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Bình luận</span>
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
                          placeholder="Thêm bình luận cho công việc con này..."
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
  );
}
