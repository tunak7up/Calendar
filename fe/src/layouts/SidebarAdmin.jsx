import React from 'react';
import {
  UsersIcon,
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function SidebarAdmin({ activeItem, onSelect }) {
  const getLinkClass = (itemName) => {
    return activeItem === itemName
      ? "flex items-center px-4 py-3 text-white bg-red-600 rounded-xl shadow-md shadow-red-500/20 group cursor-pointer"
      : "flex items-center px-4 py-3 text-[#64748b] rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer";
  };

  const getIconClass = (itemName) => {
    return activeItem === itemName
      ? "w-5 h-5 text-white"
      : "w-5 h-5 text-[#64748b] group-hover:text-gray-900";
  };

  let section = '';
  if (activeItem === 'admin_employees') section = 'employees';
  else if (activeItem === 'admin_requests') section = 'requests';
  else if (activeItem === 'admin_schedule') section = 'schedule';
  else if (activeItem.startsWith('task')) section = 'tasks';

  return (
    <>
      <button
        data-drawer-target="admin-sidebar"
        data-drawer-toggle="admin-sidebar"
        aria-controls="admin-sidebar"
        type="button"
        className="inline-flex items-center p-2 mt-3 ms-3 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
      >
        <span className="sr-only">Open sidebar</span>
        <svg
          className="w-6 h-6"
          aria-hidden="true"
          fill="none"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
            d="M5 7h14M5 12h14M5 17h10"
          />
        </svg>
      </button>

      <aside
        id="admin-sidebar"
        className="fixed top-[56px] left-0 z-40 w-64 h-[calc(100vh-56px)] transition-transform -translate-x-full sm:translate-x-0"
        aria-label="Sidebar"
      >
        <div className="h-full px-4 py-8 overflow-y-auto bg-gray-50 border-r border-gray-200">
          {/* Brand block */}
          <div className="flex items-center mb-10 px-2">
            <div className="flex items-center justify-center w-12 h-12 bg-red-600 rounded-2xl shadow-lg shadow-red-500/30">
              <ShieldCheckIcon className="w-[1.35rem] h-[1.35rem] text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col ml-3">
              <span className="text-gray-900 font-extrabold text-[1.05rem] leading-tight tracking-tight">Admin Portal</span>
              <span className="text-gray-500 text-[0.65rem] -mt-0.5">Management & Overview</span>
            </div>
          </div>

          <ul className="space-y-3 font-medium">
            {section === 'employees' && (
              <li>
                <a
                  onClick={(e) => { e.preventDefault(); onSelect && onSelect('admin_employees'); }}
                  className={getLinkClass('admin_employees')}
                >
                  <UsersIcon className={getIconClass('admin_employees')} />
                  <span className="ms-4 font-semibold text-sm">Manage Employees</span>
                </a>
              </li>
            )}
            {section === 'requests' && (
              <li>
                <a
                  onClick={(e) => { e.preventDefault(); onSelect && onSelect('admin_requests'); }}
                  className={getLinkClass('admin_requests')}
                >
                  <ClipboardDocumentCheckIcon className={getIconClass('admin_requests')} />
                  <span className="ms-4 font-semibold text-sm">Review Requests</span>
                </a>
              </li>
            )}
            {section === 'schedule' && (
              <li>
                <a
                  onClick={(e) => { e.preventDefault(); onSelect && onSelect('admin_schedule'); }}
                  className={getLinkClass('admin_schedule')}
                >
                  <CalendarDaysIcon className={getIconClass('admin_schedule')} />
                  <span className="ms-4 font-semibold text-sm">Company Schedule</span>
                </a>
              </li>
            )}
            {section === 'tasks' && (
              <>
                <li>
                  <a
                    onClick={(e) => { e.preventDefault(); onSelect && onSelect('task_list'); }}
                    className={getLinkClass('task_list')}
                  >
                    <ClipboardDocumentListIcon className={getIconClass('task_list')} />
                    <span className="ms-4 font-semibold text-sm">All Tasks</span>
                  </a>
                </li>
                <li>
                  <a
                    onClick={(e) => { e.preventDefault(); onSelect && onSelect('task_add'); }}
                    className={getLinkClass('task_add')}
                  >
                    <PlusIcon className={getIconClass('task_add')} />
                    <span className="ms-4 font-semibold text-sm">Create Task</span>
                  </a>
                </li>
              </>
            )}
          </ul>
        </div>
      </aside>
    </>
  );
}
