import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requestService } from '../services/requestService';

/**
 * Hook to fetch requests within a specific start and end date range
 * @param {string} start - Start date in YYYY-MM-DD format
 * @param {string} end - End date in YYYY-MM-DD format
 */
export function useRequestsRangeQuery(start, end) {
  return useQuery({
    queryKey: ['requests', { start, end }],
    queryFn: async () => {
      const response = await requestService.getRequestsByRange(start, end);
      if (response && response.success) {
        return response.data || [];
      }
      throw new Error(response?.message || 'Không thể tải danh sách yêu cầu');
    },
    enabled: !!start && !!end,
  });
}

/**
 * Hook to submit a new request
 */
export function useSubmitRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const response = await requestService.submitRequest(payload);
      if (response && response.success) {
        return response.data;
      }
      throw new Error(response?.message || 'Không thể gửi yêu cầu');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}

/**
 * Hook to update a request status (approve/reject)
 */
export function useUpdateRequestStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, status }) => {
      const response = await requestService.updateStatus(requestId, status);
      if (response && response.success) {
        return response.data;
      }
      throw new Error(response?.message || 'Không thể cập nhật trạng thái yêu cầu');
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}
