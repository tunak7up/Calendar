import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiFetch, getAccessToken } from '../../../../services/api';
import { taskService } from '../../../../services/taskService';
import { taskStatusService } from '../../../../services/taskStatusService';
import { fileService } from '../../../../services/fileService';
import { aiAgentService } from '../../../../services/aiAgentService';
import { useAuth } from '../../../../context/AuthContext';

export const downloadFile = async (url, fileName) => {
  try {
    const headers = {};
    const requestUrl = new URL(url, window.location.origin);
    const isSameOrigin = requestUrl.origin === window.location.origin;

    if (isSameOrigin) {
      const accessToken = getAccessToken();
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
    }

    const response = await fetch(requestUrl.toString(), {
      headers,
      mode: 'cors',
    });
    if (!response.ok) throw new Error('Network response was not ok');
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Error downloading file:', error);
    window.open(url, '_blank');
  }
};

const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'ico', 'img'];
export const isImageFile = (fileName) => {
  if (!fileName) return false;
  const parts = fileName.split('.');
  if (parts.length < 2) return false;
  const ext = parts.pop().toLowerCase();
  return imageExtensions.includes(ext);
};

export const formatForDatetimeLocal = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

export function useTaskDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const taskFromState = location.state?.task;

  const [fullTask, setFullTask] = useState(taskFromState || {});
  const [subTasks, setSubTasks] = useState([]);
  const [parentTask, setParentTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [persons, setPersons] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const [taskAttachments, setTaskAttachments] = useState([]);
  const [commentFiles, setCommentFiles] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [loadingTask, setLoadingTask] = useState(true);
  const [taskNotFound, setTaskNotFound] = useState(false);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [statusHistory, setStatusHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const taskFileInputRef = useRef(null);
  const commentFileInputRef = useRef(null);
  const startInputRef = useRef(null);
  const dueInputRef = useRef(null);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [isEditingStartTime, setIsEditingStartTime] = useState(false);
  const [editedStartTime, setEditedStartTime] = useState('');
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);
  const [editedDueDate, setEditedDueDate] = useState('');

  const fetchStatusHistory = useCallback(async () => {
    if (!id) return;
    setLoadingHistory(true);
    try {
      const res = await taskService.getStatusHistory(id);
      if (res.success) {
        setStatusHistory(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching status history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [id]);

  const handleToggleHistory = () => {
    const nextState = !isHistoryOpen;
    setIsHistoryOpen(nextState);
    if (nextState) {
      fetchStatusHistory();
    }
  };

  const handleAIAnalyze = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const res = await aiAgentService.analyzeTask(id);
      if (res.success && res.analysis) {
        setAiAnalysis(res.analysis);
      } else {
        setAiError(res.message || 'Không thể tạo bản phân tích công việc từ AI.');
      }
    } catch (err) {
      console.error(err);
      setAiError(err.message || 'Có lỗi xảy ra khi kết nối tới AI Agent.');
    } finally {
      setAiLoading(false);
    }
  };

  const fetchTaskData = useCallback(() => {
    setLoadingTask(true);
    taskService.getTaskById(id)
      .then(data => {
        if (data.success && data.data) {
          setFullTask(data.data);
          setTaskNotFound(false);

          if (data.data.parent_id) {
            taskService.getTaskById(data.data.parent_id)
              .then(pData => {
                if (pData.success) {
                  setParentTask(pData.data);
                }
              })
              .catch(err => console.error('Error fetching parent task:', err));
          } else {
            setParentTask(null);
          }
        } else {
          setTaskNotFound(true);
        }
      })
      .catch(error => {
        console.error('Error fetching task:', error);
        setTaskNotFound(true);
      })
      .finally(() => {
        setLoadingTask(false);
      });
  }, [id]);

  const fetchComments = useCallback(() => {
    apiFetch(`/comment/task/${id}`)
      .then(data => {
        if (data.success) {
          setComments(data.data);
        }
      })
      .catch(error => {
        console.error('Error fetching comments:', error);
      });
  }, [id]);

  const fetchTaskAttachments = useCallback(() => {
    apiFetch(`/file-attachment/task/${id}`)
      .then(res => {
        if (res.success) {
          setTaskAttachments(res.data);
        }
      })
      .catch(error => {
        console.error('Error fetching task attachments:', error);
      });
  }, [id]);

  const fetchSubTasks = useCallback(() => {
    taskService.getChildTasksByParentId(id)
      .then(data => {
        if (data.success) {
          Promise.all((data.data || []).map(st => {
            return apiFetch(`/comment/task/${st.task_id}`)
              .then(cData => ({
                ...st,
                comments: cData.success ? cData.data : [],
                newComment: ''
              }))
              .catch(() => ({
                ...st,
                comments: [],
                newComment: ''
              }));
          }))
          .then(enhancedSubTasks => {
            setSubTasks(enhancedSubTasks);
          });
        }
      })
      .catch(error => {
        console.error('Error fetching sub-tasks:', error);
      });
  }, [id]);

  const fetchPersons = useCallback(() => {
    apiFetch('/person')
      .then(res => {
        if (res.success) {
          const pMap = {};
          res.data.forEach(p => pMap[p.person_id] = p.name || p.username);
          setPersons(pMap);
          setAllUsers(res.data);
        }
      })
      .catch(error => {
        console.error('Error fetching persons:', error);
      });
  }, []);

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
    if (!window.confirm(t('taskdetails.confirm_remove_participant'))) return;
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
    if (!window.confirm(t('taskdetails.confirm_delete'))) return;
    try {
      const res = await taskService.deleteTask(id);
      if (res.success) {
        alert(t('taskdetails.alert_deleted'));
        navigate('/tasks');
      } else {
        alert(t('taskdetails.alert_delete_error') + res.message);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert(t('taskdetails.alert_delete_fail'));
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

  const handleUpdateStartTime = async () => {
    try {
      const res = await taskService.updateTask(id, { start_time: editedStartTime });
      if (res.success) {
        setFullTask(prev => ({ ...prev, start_time: editedStartTime }));
        setIsEditingStartTime(false);
      }
    } catch (error) {
      console.error('Error updating start time:', error);
    }
  };

  const handleUpdateDueDate = async () => {
    try {
      const res = await taskService.updateTask(id, { due_date: editedDueDate });
      if (res.success) {
        setFullTask(prev => ({ ...prev, due_date: editedDueDate }));
        setIsEditingDueDate(false);
      }
    } catch (error) {
      console.error('Error updating due date:', error);
    }
  };

  useEffect(() => {
    fetchPersons();
    taskStatusService.getAllStatuses()
      .then(res => {
        if (res.success) {
          setStatuses(res.data);
        }
      })
      .catch(err => console.error('Error fetching statuses:', err));
  }, [fetchPersons]);

  useEffect(() => {
    if (id) {
      fetchTaskData();
      fetchComments();
      fetchSubTasks();
      fetchTaskAttachments();
    }
  }, [id, fetchTaskData, fetchComments, fetchSubTasks, fetchTaskAttachments]);

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

        if (commentFiles.length > 0) {
          const commentId = res.data.comment_id || res.data.id;
          for (const file of commentFiles) {
            const validation = fileService.validateFile(file);
            if (!validation.valid) {
              alert(t('file.upload_error', { name: file.name, error: validation.error }));
              continue;
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('attachable_type', 'comment');
            formData.append('attachable_id', commentId);
            try {
              await apiFetch('/file-attachment/upload', {
                method: 'POST',
                body: formData,
              });
            } catch (err) {
              console.error('Error uploading comment file:', err);
              alert(t('file.upload_error', { name: file.name, error: err.message }));
            }
          }
          setCommentFiles([]);
          if (commentFileInputRef.current) commentFileInputRef.current.value = '';
        }

        fetchComments();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleUploadTaskFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    for (const file of files) {
      const validation = fileService.validateFile(file);
      if (!validation.valid) {
        alert(t('file.upload_error', { name: file.name, error: validation.error }));
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('attachable_type', 'task');
      formData.append('attachable_id', id);

      try {
        await apiFetch('/file-attachment/upload', {
          method: 'POST',
          body: formData,
        });
      } catch (error) {
        console.error('Upload error:', error);
        alert(t('file.upload_error', { name: file.name, error: error.message }));
      }
    }
    if (taskFileInputRef.current) taskFileInputRef.current.value = '';
    fetchTaskAttachments();
  };

  const handleCommentFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const validFiles = [];
    for (const file of files) {
      const validation = fileService.validateFile(file);
      if (!validation.valid) {
        alert(t('file.upload_error', { name: file.name, error: validation.error }));
      } else {
        validFiles.push(file);
      }
    }
    setCommentFiles(validFiles);
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm(t('taskdetails.confirm_delete_file'))) return;
    try {
      const res = await apiFetch(`/file-attachment/${attachmentId}`, { method: 'DELETE' });
      if (res.success) {
        fetchTaskAttachments();
      }
    } catch (error) {
      console.error('Delete attachment error:', error);
    }
  };

  const handleDeleteAllAttachments = async () => {
    if (!window.confirm(t('taskdetails.confirm_delete_all_files'))) return;
    try {
      const res = await apiFetch(`/file-attachment/task/${id}/all`, { method: 'DELETE' });
      if (res.success) {
        fetchTaskAttachments();
      }
    } catch (error) {
      console.error('Delete all attachments error:', error);
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
        fetchSubTasks();
      }
    } catch (error) {
      console.error('Error adding sub-task comment:', error);
    }
  };

  return {
    t,
    id,
    navigate,
    user,
    isAdmin,
    fullTask,
    setFullTask,
    subTasks,
    setSubTasks,
    parentTask,
    comments,
    newComment,
    setNewComment,
    persons,
    allUsers,
    taskAttachments,
    commentFiles,
    statuses,
    aiAnalysis,
    setAiAnalysis,
    aiLoading,
    aiError,
    setAiError,
    loadingTask,
    taskNotFound,
    isHistoryOpen,
    statusHistory,
    loadingHistory,
    fetchStatusHistory,
    handleToggleHistory,
    handleAIAnalyze,
    fetchTaskData,
    fetchSubTasks,
    handleAddParticipant,
    handleUpdateRole,
    handleRemoveParticipant,
    handleDeleteTask,
    isEditingTitle,
    setIsEditingTitle,
    editedTitle,
    setEditedTitle,
    handleUpdateTitle,
    isEditingDescription,
    setIsEditingDescription,
    editedDescription,
    setEditedDescription,
    handleUpdateDescription,
    isEditingStartTime,
    setIsEditingStartTime,
    editedStartTime,
    setEditedStartTime,
    handleUpdateStartTime,
    isEditingDueDate,
    setIsEditingDueDate,
    editedDueDate,
    setEditedDueDate,
    handleUpdateDueDate,
    handleAddComment,
    handleUploadTaskFiles,
    handleCommentFileSelect,
    handleDeleteAttachment,
    handleDeleteAllAttachments,
    handleAddSubTaskComment,
    taskFileInputRef,
    commentFileInputRef,
    startInputRef,
    dueInputRef
  };
}
