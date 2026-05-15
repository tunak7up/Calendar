import React from 'react';
import {
  UsersIcon,
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  ShieldCheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Link, useLocation } from 'react-router-dom';

export default function SidebarAdmin() {
  const location = useLocation();
  const path = location.pathname;

  const getLinkClass = (itemPath) => {
    return path === itemPath
      ? "flex items-center px-4 py-3 text-white bg-red-600 rounded-xl shadow-md shadow-red-500/20 group cursor-pointer"
      : "flex items-center px-4 py-3 text-[#64748b] rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer";
  };

  const getIconClass = (itemPath) => {
    return path === itemPath
      ? "w-5 h-5 text-white"
      : "w-5 h-5 text-[#64748b] group-hover:text-gray-900";
  };

  let section = '';
  if (path === '/admin/employees') section = 'employees';
  else if (path === '/admin/requests') section = 'requests';
  else if (path === '/admin/schedule') section = 'schedule';
  else if (path === '/admin/work-hours') section = 'workhours';
  else if (path.startsWith('/tasks')) section = 'tasks';

  return (
    <>
      <button
        data-drawer-target="admin-sidebar"
        data-drawer-toggle="admin-sidebar"
        aria-controls="admin-sidebar"
        type="button"
        className="inline-flex items-center p-2 mt-3 ms-3 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
      >
        <span className="sr-only">Mở thanh bên</span>
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
              <span className="text-gray-900 font-extrabold text-[1.05rem] leading-tight tracking-tight">Cổng Quản trị</span>
              <span className="text-gray-500 text-[0.65rem] -mt-0.5">Quản lý & Tổng quan</span>
            </div>
          </div>

          <ul className="space-y-3 font-medium">
            {section === 'employees' && (
              <li>
                <Link
                  to="/admin/employees"
                  className={getLinkClass('/admin/employees')}
                >
                  <UsersIcon className={getIconClass('/admin/employees')} />
                  <span className="ms-4 font-semibold text-sm">Quản lý nhân viên</span>
                </Link>
              </li>
            )}
            {section === 'requests' && (
              <li>
                <Link
                  to="/admin/requests"
                  className={getLinkClass('/admin/requests')}
                >
                  <ClipboardDocumentCheckIcon className={getIconClass('/admin/requests')} />
                  <span className="ms-4 font-semibold text-sm">Duyệt yêu cầu</span>
                </Link>
              </li>
            )}
            {section === 'schedule' && (
              <li>
                <Link
                  to="/admin/schedule"
                  className={getLinkClass('/admin/schedule')}
                >
                  <CalendarDaysIcon className={getIconClass('/admin/schedule')} />
                  <span className="ms-4 font-semibold text-sm">Lịch công ty</span>
                </Link>
              </li>
            )}
            {section === 'workhours' && (
              <li>
                <Link
                  to="/admin/work-hours"
                  className={getLinkClass('/admin/work-hours')}
                >
                  <ClockIcon className={getIconClass('/admin/work-hours')} />
                  <span className="ms-4 font-semibold text-sm">Giờ làm việc</span>
                </Link>
              </li>
            )}
            {section === 'tasks' && (
              <>
                <li>
                  <Link
                    to="/tasks"
                    className={getLinkClass('/tasks')}
                  >
                    <ClipboardDocumentListIcon className={getIconClass('/tasks')} />
                    <span className="ms-4 font-semibold text-sm">Tất cả công việc</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/tasks/add"
                    className={getLinkClass('/tasks/add')}
                  >
                    <PlusIcon className={getIconClass('/tasks/add')} />
                    <span className="ms-4 font-semibold text-sm">Tạo công việc</span>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </aside>
    </>
  );
}
