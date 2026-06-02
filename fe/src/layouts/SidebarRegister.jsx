import React from 'react';
import {
  ClockIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function SidebarRegister() {
  const { t } = useTranslation();
  const location = useLocation();

  const getLinkClass = (path) => {
    return location.pathname === path
      ? "flex items-center px-4 py-3 text-white bg-[#0056b3] rounded-xl shadow-md shadow-blue-500/20 group cursor-pointer"
      : "flex items-center px-4 py-3 text-[#64748b] rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer";
  };

  const getIconClass = (path) => {
    return location.pathname === path
      ? "w-5 h-5 text-white"
      : "w-5 h-5 text-[#64748b] group-hover:text-gray-900";
  };

  return (
    <>
      <button
        data-drawer-target="default-sidebar"
        data-drawer-toggle="default-sidebar"
        aria-controls="default-sidebar"
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
        id="default-sidebar"
        className="fixed top-[56px] left-0 z-40 w-64 h-[calc(100vh-56px)] transition-transform -translate-x-full sm:translate-x-0"
        aria-label="Sidebar"
      >
        <div className="h-full px-4 py-8 overflow-y-auto bg-white border-r border-gray-100">
          {/* Brand block */}
          <div className="flex items-center mb-10 px-2">
            <div className="flex items-center justify-center w-12 h-12 bg-[#0056b3] rounded-2xl shadow-lg shadow-blue-500/30">
              <ClockIcon className="w-[1.35rem] h-[1.35rem] text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col ml-3">
              <span className="text-gray-900 font-extrabold text-[1.05rem] leading-tight tracking-tight">{t('sidebar.register')}</span>
            </div>
          </div>

          <ul className="space-y-3 font-medium">
            <li>
              <Link
                to="/history"
                className={getLinkClass('/history')}
              >
                <ClipboardDocumentListIcon className={getIconClass('/history')} />
                <span className="ms-4 font-semibold text-sm">{t('sidebar.req_list')}</span>
              </Link>
            </li>
            <li>
              <Link
                to="/register/leave"
                className={getLinkClass('/register/leave')}
              >
                <CalendarDaysIcon className={getIconClass('/register/leave')} />
                <span className="ms-4 font-semibold text-sm">{t('sidebar.register_leave')}</span>
              </Link>
            </li>
            <li>
              <Link
                to="/register/work"
                className={getLinkClass('/register/work')}
              >
                <Squares2X2Icon className={getIconClass('/register/work')} />
                <span className="ms-4 font-semibold text-sm">{t('sidebar.register_work')}</span>
              </Link>
            </li>
            <li>
              <Link
                to="/register/exception"
                className={getLinkClass('/register/exception')}
              >
                <ClockIcon className={getIconClass('/register/exception')} />
                <span className="ms-4 font-semibold text-sm">{t('sidebar.register_exception')}</span>
              </Link>
            </li>
          </ul>
        </div>
      </aside>
    </>
  );
}
