import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services/taskService';

/**
 * Hook to fetch all tasks or tasks of a specific participant
 * @param {boolean} isAdmin - Whether the logged-in user is an admin
 * @param {number|string} personId - The ID of the participant (needed if not admin)
 */
export function useTasksQuery(isAdmin, personId) {
  return useQuery({
    queryKey: ['tasks', { isAdmin, personId }],
    queryFn: async () => {
      const response = isAdmin
        ? await taskService.getAllTasks()
        : await taskService.getAllTasksByParticipantId(personId);
      if (response && response.success) {
        return response.data || [];
      }
      throw new Error(response?.message || 'Không thể tải danh sách công việc');
    },
    enabled: isAdmin || !!personId,
  });
}

/**
 * Hook to fetch a single task details
 * @param {number|string} taskId - The ID of the task
 */
export function useTaskDetailQuery(taskId) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const response = await taskService.getTaskById(taskId);
      if (response && response.success) {
        return response.data;
      }
      throw new Error(response?.message || 'Không thể tải chi tiết công việc');
    },
    enabled: !!taskId,
  });
}

/**
 * Hook to create a new task
 */
export function useCreateTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskData) => {
      const response = await taskService.createTask(taskData);
      if (response && response.success) {
        return response.data;
      }
      throw new Error(response?.message || 'Không thể tạo công việc');
    },
    onSuccess: () => {
      // Invalidate tasks lists to update UI immediately
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

/**
 * Hook to create a subtask
 */
export function useCreateSubTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ parentId, taskData }) => {
      const response = await taskService.createSubTask(parentId, taskData);
      if (response && response.success) {
        return response.data;
      }
      throw new Error(response?.message || 'Không thể tạo công việc con');
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', variables.parentId] });
    },
  });
}

/**
 * Hook to update a task's fields or status
 */
export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, taskData }) => {
      const response = await taskService.updateTask(taskId, taskData);
      if (response && response.success) {
        return response.data;
      }
      throw new Error(response?.message || 'Không thể cập nhật công việc');
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
    },
  });
}

/**
 * Hook to delete a task
 */
export function useDeleteTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId) => {
      const response = await taskService.deleteTask(taskId);
      if (response && response.success) {
        return response.data;
      }
      throw new Error(response?.message || 'Không thể xóa công việc');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
