import React from 'react';
import { useTranslation } from 'react-i18next';
import CustomSelect from './CustomSelect';

const statuses = (t) => [
  { id: 'pending', label: t('status.pending'), bg: 'bg-gray-400', text: 'text-gray-700', light: 'bg-gray-100', dot: 'bg-gray-400', border: 'border-gray-200' },
  { id: 'in progress', label: t('status.in_progress'), bg: 'bg-blue-500', text: 'text-blue-800', light: 'bg-blue-100', dot: 'bg-blue-500', border: 'border-blue-200' },
  { id: 'completed', label: t('status.completed'), bg: 'bg-emerald-500', text: 'text-emerald-800', light: 'bg-emerald-100', dot: 'bg-emerald-500', border: 'border-emerald-200' },
];

export default function TaskStatusSelect({ currentStatus, onStatusChange, dueDate, size = 'md', disabled = false }) {
  const { t } = useTranslation();

  const isOverdue = (status, date) => {
    if (status?.toLowerCase() === 'completed') return false;
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const overdue = isOverdue(currentStatus, dueDate);
  const list = statuses(t);
  const statusInfo = list.find(s => s.id === currentStatus?.toLowerCase()) || list[0];

  const options = list.map(s => ({
    value: s.id,
    label: (
      <>
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        {s.label}
      </>
    )
  }));

  const buttonLabel = (
    <>
      <span className={`w-1.5 h-1.5 rounded-full ${overdue ? 'bg-red-500 animate-pulse' : statusInfo.dot} ${currentStatus === 'in progress' ? 'animate-pulse' : ''}`} />
      {overdue ? t('status.overdue') : statusInfo.label}
    </>
  );

  return (
    <CustomSelect
      value={currentStatus?.toLowerCase()}
      onChange={onStatusChange}
      options={options}
      size={size === 'sm' ? 'sm' : 'md'}
      buttonClassName={`
        font-black uppercase tracking-widest rounded-full border shadow-sm whitespace-nowrap
        ${size === 'sm' ? 'px-2.5 py-0.5 text-[8.5px]' : 'px-4 py-1.5 text-[10px]'}
        ${overdue ? 'bg-gray-100 text-red-700 border-gray-200 shadow-sm' : `${statusInfo.light} ${statusInfo.text} ${statusInfo.border}`}
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105 active:scale-95 hover:shadow-md'}
      `}
      activeOptionClassName=""
      dropdownWidth="w-40"
      align="right"
      disabled={disabled}
      buttonLabel={buttonLabel}
      data-custom-component="TaskStatusSelect"
    />
  );
}
