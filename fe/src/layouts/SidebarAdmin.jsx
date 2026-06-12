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
import { useTranslation } from 'react-i18next';

export default function SidebarAdmin() {
  const { t } = useTranslation();
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
        <span className="sr-only">{t('sidebar.open')}</span>
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
        <div className="h-full px-4 py-8 overflow-y-auto bg-gray-50 border-r border-gray-200" data-custom-component="SidebarBackground" data-customizable-id="sidebar-bg" data-customizable-type="bg">
          {/* Brand block */}
          <div className="flex items-center mb-10 px-2">
            <div className="flex items-center justify-center w-12 h-12 bg-red-600 rounded-2xl shadow-lg shadow-red-500/30" data-custom-component="SidebarBrandIcon" data-customizable-id="sidebar-brand-icon" data-customizable-type="bg">
              <ShieldCheckIcon className="w-[1.35rem] h-[1.35rem] text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col ml-3">
              <span className="text-gray-900 font-extrabold text-[1.05rem] leading-tight tracking-tight">{t('sidebar.admin_portal')}</span>
              <span className="text-gray-500 text-[0.65rem] -mt-0.5">{t('sidebar.admin_sub')}</span>
            </div>
          </div>

          <ul className="space-y-3 font-medium">
            {section === 'employees' && (
              <li>
                <Link
                  to="/admin/employees"
                  className={getLinkClass('/admin/employees')}
                  data-custom-component={path === '/admin/employees' ? 'SidebarLink-Active' : 'SidebarLink-Inactive'}
                  data-customizable-id="sidebar-link-employees"
                  data-customizable-type="text"
                >
                  <UsersIcon className={getIconClass('/admin/employees')} />
                  <span className="ms-4 font-semibold text-sm">{t('sidebar.manage_employees')}</span>
                </Link>
              </li>
            )}
            {section === 'requests' && (
              <li>
                <Link
                  to="/admin/requests"
                  className={getLinkClass('/admin/requests')}
                  data-custom-component={path === '/admin/requests' ? 'SidebarLink-Active' : 'SidebarLink-Inactive'}
                  data-customizable-id="sidebar-link-requests"
                  data-customizable-type="text"
                >
                  <ClipboardDocumentCheckIcon className={getIconClass('/admin/requests')} />
                  <span className="ms-4 font-semibold text-sm">{t('sidebar.approve_requests')}</span>
                </Link>
              </li>
            )}
            {section === 'schedule' && (
              <li>
                <Link
                  to="/admin/schedule"
                  className={getLinkClass('/admin/schedule')}
                  data-custom-component={path === '/admin/schedule' ? 'SidebarLink-Active' : 'SidebarLink-Inactive'}
                  data-customizable-id="sidebar-link-schedule"
                  data-customizable-type="text"
                >
                  <CalendarDaysIcon className={getIconClass('/admin/schedule')} />
                  <span className="ms-4 font-semibold text-sm">{t('sidebar.company_calendar')}</span>
                </Link>
              </li>
            )}
            {section === 'workhours' && (
              <li>
                <Link
                  to="/admin/work-hours"
                  className={getLinkClass('/admin/work-hours')}
                  data-custom-component={path === '/admin/work-hours' ? 'SidebarLink-Active' : 'SidebarLink-Inactive'}
                  data-customizable-id="sidebar-link-workhours"
                  data-customizable-type="text"
                >
                  <ClockIcon className={getIconClass('/admin/work-hours')} />
                  <span className="ms-4 font-semibold text-sm">{t('sidebar.work_hours')}</span>
                </Link>
              </li>
            )}
            {section === 'tasks' && (
              <>
                <li>
                  <Link
                    to="/tasks"
                    className={getLinkClass('/tasks')}
                    data-custom-component={path === '/tasks' ? 'SidebarLink-Active' : 'SidebarLink-Inactive'}
                    data-customizable-id="sidebar-link-tasks"
                    data-customizable-type="text"
                  >
                    <ClipboardDocumentListIcon className={getIconClass('/tasks')} />
                    <span className="ms-4 font-semibold text-sm">{t('sidebar.all_tasks')}</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/tasks/add"
                    className={getLinkClass('/tasks/add')}
                    data-custom-component={path === '/tasks/add' ? 'SidebarLink-Active' : 'SidebarLink-Inactive'}
                    data-customizable-id="sidebar-link-addtask"
                    data-customizable-type="text"
                  >
                    <PlusIcon className={getIconClass('/tasks/add')} />
                    <span className="ms-4 font-semibold text-sm">{t('sidebar.create_task')}</span>
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
