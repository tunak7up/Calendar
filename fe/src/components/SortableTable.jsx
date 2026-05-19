import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

/**
 * SortableTable - A reusable table component with column sorting and pagination.
 *
 * Props:
 * - columns: Array of column definitions
 *     { key: string, label: string, sortable?: boolean, align?: 'left'|'center'|'right', className?: string }
 * - data: Array of row data objects
 * - renderRow: (row, index) => JSX - function to render each <tr>
 * - loading?: boolean
 * - emptyMessage?: string
 * - pageSize?: number
 * - currentPage: number
 * - totalItems: number
 * - onPageChange: (page) => void
 * - onSortChange?: (key, direction) => void  -- controlled sort
 * - defaultSortKey?: string
 * - defaultSortDir?: 'asc' | 'desc'
 * - tableClassName?: string
 * - stickyHeader?: boolean
 * - containerHeight?: string (e.g. 'h-[500px]')
 */
export default function SortableTable({
  columns = [],
  data = [],
  renderRow,
  loading = false,
  emptyMessage = 'No data found.',
  pageSize = 10,
  currentPage,
  totalItems,
  onPageChange,
  onSortChange,
  defaultSortKey = null,
  defaultSortDir = 'asc',
  tableClassName = '',
  stickyHeader = false,
  containerHeight = '',
}) {
  const [sortKey, setSortKey] = useState(defaultSortKey);
  const [sortDir, setSortDir] = useState(defaultSortDir);

  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;

  const handleSort = (col) => {
    if (!col.sortable) return;
    let newDir = col.defaultSortDir || 'asc';
    if (sortKey === col.key) {
      newDir = sortDir === 'asc' ? 'desc' : 'asc';
    }
    setSortKey(col.key);
    setSortDir(newDir);
    if (onSortChange) onSortChange(col.key, newDir);
  };

  const getAlignClass = (align) => {
    if (align === 'center') return 'text-center';
    if (align === 'right') return 'text-right';
    return 'text-left';
  };

  const SortIcon = ({ colKey }) => {
    if (sortKey !== colKey) {
      return (
        <span className="inline-flex flex-col ml-1.5 opacity-30">
          <ChevronUpIcon className="w-2.5 h-2.5 -mb-0.5" />
          <ChevronDownIcon className="w-2.5 h-2.5" />
        </span>
      );
    }
    return sortDir === 'asc'
      ? <ChevronUpIcon className="w-3.5 h-3.5 ml-1.5 text-[#0056b3]" />
      : <ChevronDownIcon className="w-3.5 h-3.5 ml-1.5 text-[#0056b3]" />;
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) onPageChange(page);
  };

  // Client-side sort if no onSortChange provided
  let displayData = [...data];
  if (!onSortChange && sortKey) {
    displayData.sort((a, b) => {
      const aVal = a[sortKey] ?? '';
      const bVal = b[sortKey] ?? '';
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }

  const paginatedData = displayData.slice(startIndex, startIndex + pageSize);

  return (
    <div className="bg-white border border-gray-300 shadow-md rounded-3xl overflow-hidden mb-6">
      <div className={`overflow-x-auto ${containerHeight ? `overflow-y-auto ${containerHeight} custom-scrollbar` : ''}`}>
        <table className={`w-full text-left border-collapse relative ${tableClassName}`}>
          <thead className={`${stickyHeader ? 'sticky top-0 z-10' : ''} bg-gray-50/90 backdrop-blur-sm border-b border-gray-100`}>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col)}
                  className={`py-3 px-4 text-[10px] font-semibold text-gray-400 uppercase tracking-tight whitespace-nowrap select-none
                    ${getAlignClass(col.align)}
                    ${col.sortable ? 'cursor-pointer hover:text-gray-700 hover:bg-gray-100/60 transition-colors' : ''}
                    ${col.className || ''}
                  `}
                >
                  <span className="inline-flex items-center truncate">
                    {col.label}
                    {col.sortable && <SortIcon colKey={col.key} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-gray-400 font-medium">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-[#0056b3] rounded-full animate-spin" />
                    Loading...
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-gray-400 font-medium">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, i) => renderRow(row, i))
            )}
          </tbody>
        </table>
      </div>

      {totalItems > 0 && (
        <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 bg-gray-50/50 gap-4">
          <span className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
            Showing{' '}
            <span className="font-semibold text-gray-900">{startIndex + 1}</span>
            {' '}to{' '}
            <span className="font-semibold text-gray-900">{Math.min(startIndex + pageSize, totalItems)}</span>
            {' '}of{' '}
            <span className="font-semibold text-gray-900">{totalItems}</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>

            {totalPages <= 7
              ? [...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => goToPage(i + 1)}
                    className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === i + 1
                        ? 'text-white bg-[#0056b3] shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))
              : (
                <div className="flex items-center px-4 py-1 bg-white rounded-xl border border-gray-100 text-sm font-bold text-gray-700">
                  {currentPage} / {totalPages}
                </div>
              )
            }

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
