import React from 'react';
import { useTranslation } from 'react-i18next';
import CustomSelect from './CustomSelect';

const statuses = (t) => [
  { id: 'pending', label: t('status.pending'), bg: 'bg-gray-400', text: 'text-gray-700', light: 'bg-gray-100', dot: 'bg-gray-400', border: 'border-gray-200' },
  { id: 'in progress', label: t('status.in_progress'), bg: 'bg-blue-500', text: 'text-blue-800', light: 'bg-blue-100', dot: 'bg-blue-500', border: 'border-blue-200' },
  { id: 'completed', label: t('status.completed'), bg: 'bg-emerald-500', text: 'text-emerald-800', light: 'bg-emerald-100', dot: 'bg-emerald-500', border: 'border-emerald-200' },
];

export default function TaskStatusSelect({ currentStatus, onStatusChange, dueDate, size = 'md', disabled = false, statusesList, direction = 'auto' }) {
  const { t } = useTranslation();

  const isOverdue = (status, date) => {
    if (status?.toLowerCase() === 'completed') return false;
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const overdue = isOverdue(currentStatus, dueDate);
  
  const getStatusLabel = (name, defaultLabel) => {
    const key = `status.${name.toLowerCase().replace(' ', '_')}`;
    const translation = t(key);
    return translation && translation !== key ? translation : defaultLabel;
  };

  // Build normalized list from statusesList (if provided) or fallback to default
  const list = statusesList ? statusesList.map(s => ({
    id: s.name,
    label: getStatusLabel(s.name, s.label),
    dot: s.color_text || '#374151',
    light: s.color_bg || '#f3f4f6',
    text: s.color_text || '#374151',
    border: s.color_text || '#e2e8f0',
    isCustom: true
  })) : statuses(t);

  const statusInfo = list.find(s => s.id === currentStatus?.toLowerCase()) || list[0] || {
    id: 'pending',
    label: currentStatus || 'Pending',
    dot: '#374151',
    light: '#f3f4f6',
    text: '#374151',
    border: '#e2e8f0',
    isCustom: true
  };

  const statusKey = overdue ? 'TaskStatus-Overdue' : (
    currentStatus?.toLowerCase() === 'in progress' ? 'TaskStatus-InProgress' :
    currentStatus?.toLowerCase() === 'completed' ? 'TaskStatus-Completed' : 'TaskStatus-Pending'
  );

  const options = list.map(s => {
    const sKey = s.id === 'in progress' ? 'TaskStatus-InProgress' :
                 s.id === 'completed' ? 'TaskStatus-Completed' : 'TaskStatus-Pending';
    return {
      value: s.id,
      label: (
        <>
          <span 
            className="w-1.5 h-1.5 rounded-full status-dot" 
            style={s.isCustom ? { backgroundColor: s.dot } : {}}
            data-custom-component={s.isCustom ? undefined : sKey} 
          />
          {s.label}
        </>
      )
    };
  });

  const buttonLabel = (
    <>
      <span 
        className={`w-1.5 h-1.5 rounded-full status-dot ${overdue ? 'bg-red-500 animate-pulse' : ''} ${currentStatus === 'in progress' ? 'animate-pulse' : ''}`}
        style={!overdue && statusInfo.isCustom ? { backgroundColor: statusInfo.dot } : {}}
      />
      {overdue ? t('status.overdue') : statusInfo.label}
    </>
  );

  const customStyle = !overdue && statusInfo.isCustom ? {
    backgroundColor: statusInfo.light,
    color: statusInfo.text,
    borderColor: statusInfo.border
  } : {};

  return (
    <CustomSelect
      value={currentStatus?.toLowerCase()}
      onChange={onStatusChange}
      options={options}
      size={size === 'sm' ? 'sm' : 'md'}
      style={customStyle}
      direction={direction}
      buttonClassName={`
        font-black uppercase tracking-widest rounded-full border shadow-sm whitespace-nowrap
        ${size === 'sm' ? 'px-2.5 py-0.5 text-[8.5px]' : 'px-4 py-1.5 text-[10px]'}
        ${overdue ? 'bg-gray-100 text-red-700 border-gray-200 shadow-sm' : (statusInfo.isCustom ? '' : `${statusInfo.light} ${statusInfo.text} ${statusInfo.border}`)}
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105 active:scale-95 hover:shadow-md'}
      `}
      activeOptionClassName=""
      dropdownWidth="w-40"
      align="right"
      disabled={disabled}
      buttonLabel={buttonLabel}
      data-custom-component={statusKey}
    />
  );
}
