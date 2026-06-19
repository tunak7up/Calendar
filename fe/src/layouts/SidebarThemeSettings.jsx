import React from 'react';
import {
  PaintBrushIcon,
  Squares2X2Icon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function SidebarThemeSettings() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const isVi = i18n.language === 'vi';

  const isPageActive = (path, page) => {
    const searchParams = new URLSearchParams(location.search);
    const currentPage = searchParams.get('page') || 'dashboard';
    return location.pathname === path && currentPage === page;
  };

  const getLinkClass = (path, page) => {
    return isPageActive(path, page)
      ? "flex items-center px-4 py-3 text-[#0056b3] bg-[#edf3fb] rounded-xl font-semibold cursor-pointer"
      : "flex items-center px-4 py-3 text-[#64748b] rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group";
  };

  const getIconClass = (path, page) => {
    return isPageActive(path, page)
      ? "w-5 h-5 text-[#0056b3]"
      : "w-5 h-5 text-[#64748b] group-hover:text-gray-900";
  };

  return (
    <aside
      id="theme-settings-sidebar"
      className="fixed top-[56px] left-0 z-40 w-64 h-[calc(100vh-56px)] transition-transform -translate-x-full sm:translate-x-0"
      aria-label="Sidebar"
    >
      <div className="h-full px-4 py-8 overflow-y-auto bg-[#f8fafc] border-r border-gray-100" data-custom-component="SidebarBackground" data-customizable-id="sidebar-bg" data-customizable-type="bg">
        {/* Brand block */}
        <div className="flex items-center mb-10 px-2">
          <div className="flex items-center justify-center w-12 h-12 bg-[#0056b3] rounded-2xl shadow-lg shadow-blue-500/30" data-custom-component="SidebarBrandIcon" data-customizable-id="sidebar-brand-icon" data-customizable-type="bg">
            <PaintBrushIcon className="w-[1.35rem] h-[1.35rem] text-white" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col ml-3">
            <span className="text-gray-900 font-extrabold text-[1.05rem] leading-tight tracking-tight">
              {isVi ? 'Cài đặt giao diện' : 'Theme Settings'}
            </span>
            <span className="text-gray-500 text-[0.65rem] -mt-0.5">
              {isVi ? 'Tùy chỉnh màu & nhãn' : 'Customize color & label'}
            </span>
          </div>
        </div>

        <ul className="space-y-3 font-medium">
          <li>
            <Link
              to="/admin/theme-settings?page=dashboard"
              className={getLinkClass('/admin/theme-settings', 'dashboard')}
              data-custom-component={isPageActive('/admin/theme-settings', 'dashboard') ? 'SidebarLink-Active' : 'SidebarLink-Inactive'}
              data-customizable-id="sidebar-link-themesettings-dashboard"
              data-customizable-type="text"
            >
              <Squares2X2Icon className={getIconClass('/admin/theme-settings', 'dashboard')} />
              <span className="ms-4 text-sm font-medium">Dashboard</span>
            </Link>
          </li>
          
          <li>
            <Link
              to="/admin/theme-settings?page=schedule"
              className={getLinkClass('/admin/theme-settings', 'schedule')}
              data-custom-component={isPageActive('/admin/theme-settings', 'schedule') ? 'SidebarLink-Active' : 'SidebarLink-Inactive'}
              data-customizable-id="sidebar-link-themesettings-schedule"
              data-customizable-type="text"
            >
              <CalendarDaysIcon className={getIconClass('/admin/theme-settings', 'schedule')} />
              <span className="ms-4 text-sm font-medium">{isVi ? 'Lịch biểu' : 'Schedule'}</span>
            </Link>
          </li>

          <li>
            <Link
              to="/admin/theme-settings?page=tasks"
              className={getLinkClass('/admin/theme-settings', 'tasks')}
              data-custom-component={isPageActive('/admin/theme-settings', 'tasks') ? 'SidebarLink-Active' : 'SidebarLink-Inactive'}
              data-customizable-id="sidebar-link-themesettings-tasks"
              data-customizable-type="text"
            >
              <ClipboardDocumentListIcon className={getIconClass('/admin/theme-settings', 'tasks')} />
              <span className="ms-4 text-sm font-medium">{isVi ? 'Công việc' : 'Tasks'}</span>
            </Link>
          </li>
        </ul>
      </div>
    </aside>
  );
}
