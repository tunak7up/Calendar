export const TASK_STATUS = {
  PENDING: { id: 'pending', label: 'Chờ xử lý', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  IN_PROGRESS: { id: 'in progress', label: 'Đang thực hiện', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  COMPLETED: { id: 'completed', label: 'Hoàn thành', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
};

export const REQUEST_STATUS = {
  PENDING: { id: 'pending', label: 'Đang chờ', bg: 'bg-amber-100', text: 'text-amber-800' },
  APPROVED: { id: 'approved', label: 'Đã duyệt', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  REJECTED: { id: 'rejected', label: 'Từ chối', bg: 'bg-red-100', text: 'text-red-800' },
};

export const REQUEST_TYPE = {
  REGISTER: { id: 'register', label: 'Đăng ký làm việc', bg: 'bg-blue-100', hoverBg: 'hover:bg-blue-200' },
  LEAVE: { id: 'leave', label: 'Yêu cầu nghỉ phép', bg: 'bg-orange-100', hoverBg: 'hover:bg-orange-200' },
};

export const getTaskStatusStyle = (status) => {
  const s = status?.toLowerCase();
  if (s === 'completed') return TASK_STATUS.COMPLETED;
  if (s === 'in progress') return TASK_STATUS.IN_PROGRESS;
  return TASK_STATUS.PENDING;
};

export const getRequestStatusStyle = (status) => {
  const s = status?.toLowerCase();
  if (s === 'approved' || s === 'đã duyệt') return REQUEST_STATUS.APPROVED;
  if (s === 'rejected' || s === 'từ chối') return REQUEST_STATUS.REJECTED;
  return REQUEST_STATUS.PENDING;
};
