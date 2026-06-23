import React from 'react';
import {
  CalendarIcon,
  BriefcaseIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import SortableTable from './SortableTable';

export default function RequestTable({
  data,
  loading,
  isAdmin = false,
  onRowClick,
  onApprove,
  onReject,
  currentPage,
  pageSize = 8,
  totalItems,
  onPageChange,
  onSortChange,
}) {
  const { t } = useTranslation();

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            {t('status.req_approved')}
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            {t('status.req_rejected')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
            {t('status.req_pending')}
          </span>
        );
    }
  };

  const columns = [
    isAdmin && { key: 'requester', label: t('requests.col_requester'), sortable: true },
    { key: 'type', label: t('register.exception_type'), sortable: true },
    { key: 'reason', label: t('register.leave_reason'), sortable: true, className: 'hidden md:table-cell' },
    { key: 'date', label: isAdmin ? t('requests.col_sent_date') : t('history.col_date'), sortable: true, className: 'hidden sm:table-cell' },
    { key: 'status', label: t('history.col_status'), sortable: true, align: 'center' },
    !isAdmin && { key: 'approver', label: t('history.col_approver'), sortable: true, className: 'hidden md:table-cell' },
    isAdmin && { key: 'actions', label: t('requests.col_actions'), sortable: false, align: 'center' },
  ].filter(Boolean);

  return (
    <SortableTable
      columns={columns}
      data={data}
      loading={loading}
      emptyMessage={isAdmin ? t('requests.empty') : t('history.empty')}
      pageSize={pageSize}
      currentPage={currentPage}
      totalItems={totalItems}
      onPageChange={onPageChange}
      onSortChange={onSortChange}
      tableClassName="w-full md:min-w-[700px]"
      stickyHeader
      containerHeight="h-[500px]"
      renderRow={(item) => {
        const reqId = item.request_id || item.id;
        const requesterName = item.requester?.name || item.requester?.username || item.requesterName || `User #${item.requester_id || ''}`;
        const approverName = item.approver?.name || item.approver || 'N/A';
        const displayDate = (() => {
          const raw = item.date || item.created_at;
          if (!raw) return '';
          const d = new Date(raw);
          if (isNaN(d.getTime())) {
            if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
              const [y, m, dVal] = raw.split('-');
              return `${dVal}/${m}/${y}`;
            }
            return raw;
          }
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          return `${day}/${month}/${year}`;
        })();

        return (
          <tr
            key={reqId}
            onClick={() => onRowClick && onRowClick(item)}
            className="border-b border-gray-200 transition-colors cursor-pointer select-none bg-white hover:bg-gray-50/50"
          >
            {/* Requester column (Admin only) */}
            {isAdmin && (
              <td className="px-3 sm:px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                {requesterName}
              </td>
            )}

            {/* Type column */}
            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`p-1.5 sm:p-2 rounded-lg ${
                  item.type === 'leave' ? 'bg-orange-100 text-orange-500' :
                  ['arrive_early', 'arrive_late', 'leave_early', 'leave_late'].includes(item.type) ? 'bg-purple-100 text-purple-500' :
                  'bg-blue-100 text-blue-500'
                }`}>
                  {item.type === 'leave' ? <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" /> :
                   ['arrive_early', 'arrive_late', 'leave_early', 'leave_late'].includes(item.type) ? <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5" /> :
                   <BriefcaseIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                </div>
                <span className="font-semibold text-gray-900 text-xs sm:text-sm">
                  {item.type === 'register' ? t('history.type_register') :
                   item.type === 'leave' ? t('history.type_leave') :
                   ['arrive_early', 'arrive_late', 'leave_early', 'leave_late'].includes(item.type) ? t(`register.exception_${item.type}`) :
                   item.type}
                </span>
              </div>
            </td>

            {/* Reason column */}
            <td className="hidden md:table-cell px-6 py-4 max-w-[200px] truncate font-medium text-gray-600" title={item.reason || ''}>
              {item.reason || '—'}
            </td>

            {/* Date column */}
            <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap font-medium text-gray-600">
              {displayDate}
            </td>

            {/* Status column */}
            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center">
              {getStatusBadge(item.status)}
            </td>

            {/* Approver column (User only) */}
            {!isAdmin && (
              <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-gray-600">
                {approverName}
              </td>
            )}

            {/* Actions column (Admin only) */}
            {isAdmin && (
              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center">
                {item.status?.toLowerCase() === 'pending' && (
                  <div className="flex justify-center gap-1 sm:gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onApprove && onApprove(reqId);
                      }}
                      title={t('requests.title_approve')}
                      className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100"
                    >
                      <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReject && onReject(reqId);
                      }}
                      title={t('requests.title_reject')}
                      className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                    >
                      <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                )}
              </td>
            )}
          </tr>
        );
      }}
    />
  );
}
