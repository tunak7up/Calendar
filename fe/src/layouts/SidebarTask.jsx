import React from 'react';
import {
    ClipboardDocumentListIcon,
    PlusIcon,
    ClipboardDocumentCheckIcon,
    Bars3Icon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function SidebarTask() {
    const { t } = useTranslation();
    const location = useLocation();

    const getLinkClass = (path) => {
        return location.pathname === path
            ? "flex items-center px-4 py-3 text-[#0056b3] bg-[#edf3fb] rounded-xl font-semibold cursor-pointer"
            : "flex items-center px-4 py-3 text-[#64748b] rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group";
    };

    const getIconClass = (path) => {
        return location.pathname === path
            ? "w-5 h-5 text-[#0056b3]"
            : "w-5 h-5 text-[#64748b] group-hover:text-gray-900";
    };

    return (
        <aside
            id="task-sidebar"
            className="fixed top-[56px] left-0 z-40 w-64 h-[calc(100vh-56px)] transition-transform -translate-x-full sm:translate-x-0"
            aria-label="Sidebar"
        >
            <div className="h-full px-4 py-8 overflow-y-auto bg-[#f8fafc] border-r border-gray-100" data-custom-component="SidebarBackground" data-customizable-id="sidebar-bg" data-customizable-type="bg">
                {/* Brand block */}
                <div className="flex items-center mb-10 px-2">
                    <div className="flex items-center justify-center w-12 h-12 bg-[#0056b3] rounded-2xl shadow-lg shadow-blue-500/30" data-custom-component="SidebarBrandIcon" data-customizable-id="sidebar-brand-icon" data-customizable-type="bg">
                        <ClipboardDocumentCheckIcon className="w-[1.35rem] h-[1.35rem] text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col ml-3">
                        <span className="text-gray-900 font-extrabold text-[1.05rem] leading-tight tracking-tight">{t('sidebar.tasks')}</span>
                        <span className="text-gray-500 text-[0.65rem] -mt-0.5">{t('sidebar.tasks_sub')}</span>
                    </div>
                </div>

                <ul className="space-y-3 font-medium">
                    <li>
                        <Link
                            to="/tasks/add"
                            className={getLinkClass('/tasks/add')}
                            data-custom-component={location.pathname === '/tasks/add' ? 'SidebarLink-Active' : 'SidebarLink-Inactive'}
                            data-customizable-id="sidebar-link-addtask"
                            data-customizable-type="text"
                        >
                            <PlusIcon className={getIconClass('/tasks/add')} />
                            <span className="ms-4 text-sm font-medium">{t('sidebar.add_task')}</span>
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/tasks"
                            className={getLinkClass('/tasks')}
                            data-custom-component={location.pathname === '/tasks' ? 'SidebarLink-Active' : 'SidebarLink-Inactive'}
                            data-customizable-id="sidebar-link-tasks"
                            data-customizable-type="text"
                        >
                            <ClipboardDocumentListIcon className={getIconClass('/tasks')} />
                            <span className="ms-4 text-sm font-medium">{t('sidebar.tasks_list')}</span>
                        </Link>
                    </li>
                </ul>
            </div>
        </aside>
    );
}
