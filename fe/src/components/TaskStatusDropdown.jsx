import React from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

const statuses = [
  { id: 'pending', label: 'Chờ xử lý', bg: 'bg-gray-400', text: 'text-gray-700', light: 'bg-gray-100', dot: 'bg-gray-400', border: 'border-gray-200' },
  { id: 'in progress', label: 'Đang thực hiện', bg: 'bg-blue-500', text: 'text-blue-800', light: 'bg-blue-100', dot: 'bg-blue-500', border: 'border-blue-200' },
  { id: 'completed', label: 'Hoàn thành', bg: 'bg-emerald-500', text: 'text-emerald-800', light: 'bg-emerald-100', dot: 'bg-emerald-500', border: 'border-emerald-200' },
];

export default function TaskStatusDropdown({ currentStatus, onStatusChange, dueDate, size = 'md' }) {
  const isOverdue = (status, date) => {
    if (status?.toLowerCase() === 'completed') return false;
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const overdue = isOverdue(currentStatus, dueDate);
  const statusInfo = statuses.find(s => s.id === currentStatus?.toLowerCase()) || statuses[0];

  return (
    <Menu as="div" className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <Menu.Button className={`
        flex items-center gap-2 font-black uppercase tracking-widest transition-all rounded-full border shadow-sm
        ${size === 'sm' ? 'px-3 py-1 text-[9px]' : 'px-5 py-2 text-[11px]'}
        ${overdue ? 'bg-red-600 text-white border-red-700 shadow-red-200' : `${statusInfo.light} ${statusInfo.text} ${statusInfo.border}`}
        hover:scale-105 active:scale-95 hover:shadow-md
      `}>
        <span className={`w-1.5 h-1.5 rounded-full ${overdue ? 'bg-white animate-pulse' : statusInfo.dot} ${currentStatus === 'in progress' ? 'animate-pulse' : ''}`} />
        {overdue ? 'Quá hạn' : statusInfo.label}
        <ChevronDownIcon className={`w-3 h-3 opacity-50 ${overdue ? 'text-white' : ''}`} />
      </Menu.Button>

      <Transition
        as={React.Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 z-50 mt-2 w-48 origin-top-left rounded-2xl bg-white p-2 shadow-[0_20px_50px_rgba(0,0,0,0.15)] ring-1 ring-black/5 focus:outline-none border border-gray-100">
          <div className="space-y-1">
            {statuses.map((s) => (
              <Menu.Item key={s.id}>
                {({ active }) => (
                  <button
                    onClick={() => onStatusChange(s.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all
                      ${active ? `${s.light} ${s.text} translate-x-1` : 'text-gray-500 hover:bg-gray-50'}
                    `}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
