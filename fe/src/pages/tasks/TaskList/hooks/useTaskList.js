import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../context/AuthContext';
import { apiFetch } from '../../../../services/api';
import { taskService } from '../../../../services/taskService';
import { taskStatusService } from '../../../../services/taskStatusService';

export const isOverdue = (task) => {
  if (task.status === 'completed') return false;
  return new Date(task.due_date) < new Date();
};

export const getEffectiveStatus = (task) => {
  if (task.status === 'completed') return 'completed';
  if (isOverdue(task)) return 'overdue';
  if (task.status === 'overdue') return 'pending';
  return task.status;
};

export function useTaskList({ isAdmin }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [statuses, setStatuses] = useState([]);
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
  const [previewData, setPreviewData] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
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

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const result = isAdmin
        ? await taskService.getAllTasks()
        : await taskService.getAllTasksByParticipantId(user?.person_id);
      if (result.success) {
        setTasks(result.data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user?.person_id]);

  useEffect(() => {
    fetchTasks();

    taskStatusService.getAllStatuses()
      .then(res => {
        if (res.success) {
          setStatuses(res.data);
        }
      })
      .catch(err => console.error('Error fetching statuses:', err));

    if (isAdmin) {
      apiFetch('/person')
        .then(data => {
          if (data.success) {
            setEmployees(data.data);
          }
        })
        .catch(err => console.error('Error fetching employees:', err));
    }
  }, [isAdmin, fetchTasks]);

  const employeeTasks = isAdmin && selectedEmployeeIds.length > 0
    ? tasks.filter(t => t.participants && t.participants.some(p => selectedEmployeeIds.includes(p.person_id.toString())))
    : tasks;

  const getTaskRoleForCurrentUser = useCallback((task, currentUser) => {
    if (!isAdmin) return task.role;
    const participant = task.participants?.find(p => p.person_id === currentUser?.person_id);
    if (participant) return participant.role;
    if (task.assigner === currentUser?.name) return 'assigner';
    return 'N/A';
  }, [isAdmin]);

  const baseFilteredTasks = useMemo(() => {
    let temp = employeeTasks;

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

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      temp = temp.filter(t =>
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.task_id && t.task_id.toString().includes(q))
      );
    }

    if (filterRole !== 'all') {
      temp = temp.filter(t => {
        const role = getTaskRoleForCurrentUser(t, user);
        return role?.toLowerCase() === filterRole.toLowerCase();
      });
    }

    return temp;
  }, [employeeTasks, startDate, endDate, searchQuery, filterRole, user, getTaskRoleForCurrentUser]);

  const filteredTasks = useMemo(() => {
    if (filterStatus === 'all') return baseFilteredTasks;
    return baseFilteredTasks.filter(t => getEffectiveStatus(t) === filterStatus);
  }, [baseFilteredTasks, filterStatus]);

  const displayTasks = useMemo(() => {
    if (sortKey) {
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

    const parents = filteredTasks.filter(t => !t.parent_id);
    const children = filteredTasks.filter(t => t.parent_id);

    parents.sort((a, b) => {
      const getPriority = (task) => {
        const effStatus = getEffectiveStatus(task);
        if (effStatus === 'overdue') return 1;
        if (effStatus === 'pending') return 2;
        if (effStatus === 'in progress') return 3;
        if (effStatus === 'completed') return 4;
        return 5;
      };
      const priorityDiff = getPriority(a) - getPriority(b);
      if (priorityDiff !== 0) return priorityDiff;

      const createdA = new Date(a.created_at).getTime();
      const createdB = new Date(b.created_at).getTime();
      if (!isNaN(createdA) && !isNaN(createdB) && createdA !== createdB) {
        return createdB - createdA;
      }

      const dateA = new Date(a.due_date).getTime();
      const dateB = new Date(b.due_date).getTime();
      
      if (!isNaN(dateA) && !isNaN(dateB)) {
        return dateA - dateB;
      }
      if (!isNaN(dateA) && isNaN(dateB)) return -1;
      if (isNaN(dateA) && !isNaN(dateB)) return 1;

      return 0;
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
    e.stopPropagation();
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

  return {
    t,
    navigate,
    user,
    tasks,
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
    filteredTasks,
    displayTasks,
    columns,
    handleStatusChange,
    handleDeleteTask
  };
}
