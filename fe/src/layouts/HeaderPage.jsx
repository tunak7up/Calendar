import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon, MagnifyingGlassIcon, QuestionMarkCircleIcon, Cog6ToothIcon, UserIcon, SparklesIcon, ExclamationTriangleIcon, ClockIcon, ClipboardDocumentListIcon, ChatBubbleLeftRightIcon, DocumentTextIcon, CheckIcon } from '@heroicons/react/24/outline'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import LanguageSelector from '../components/LanguageSelector'
import { apiFetch } from '../services/api'
import { taskService } from '../services/taskService'
import { useState, useEffect } from 'react'

const userNavigation = [
  { key: 'dashboard', path: '/dashboard', id: 'dashboard' },
  { key: 'schedule', path: '/schedule', id: 'schedule' },
  { key: 'register', path: '/history', id: 'work' }, // Point to history/list as entry point
  { key: 'reports', path: '/reports', id: 'reports' },
  { key: 'tasks', path: '/tasks', id: 'task' },
];

const adminNavigation = [
  { key: 'admin_dashboard', path: '/admin/dashboard', id: 'admin_dashboard' },
  { key: 'admin_schedule', path: '/admin/schedule', id: 'admin_schedule' },
  { key: 'admin_employees', path: '/admin/employees', id: 'admin_employees' },
  { key: 'admin_requests', path: '/admin/requests', id: 'admin_requests' },
  { key: 'admin_workhours', path: '/admin/work-hours', id: 'admin_workhours' },
  { key: 'admin_reports', path: '/admin/reports', id: 'admin_reports' },
  { key: 'tasks', path: '/tasks', id: 'admin_task' },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const resolveNotificationType = (notif) => {
  const url = notif.url || '';
  const title = notif.title || '';

  if (url.startsWith('/tasks/')) {
    if (title.includes('Bình luận')) {
      return {
        icon: ChatBubbleLeftRightIcon,
        bgColor: 'bg-emerald-500',
        textColor: 'text-emerald-500',
        theme: 'emerald'
      };
    }
    return {
      icon: ClipboardDocumentListIcon,
      bgColor: 'bg-teal-500',
      textColor: 'text-teal-500',
      theme: 'teal'
    };
  }

  if (url.startsWith('/history/')) {
    if (title.includes('[Kết quả]')) {
      if (title.includes('đã được duyệt') || title.includes('được duyệt')) {
        return {
          icon: CheckIcon,
          bgColor: 'bg-green-500',
          textColor: 'text-green-500',
          theme: 'green'
        };
      } else {
        return {
          icon: XMarkIcon,
          bgColor: 'bg-rose-500',
          textColor: 'text-rose-500',
          theme: 'rose'
        };
      }
    }
    return {
      icon: DocumentTextIcon,
      bgColor: 'bg-indigo-500',
      textColor: 'text-indigo-500',
      theme: 'indigo'
    };
  }

  if (title.includes('CẢNH BÁO')) {
    return {
      icon: ExclamationTriangleIcon,
      bgColor: 'bg-rose-500',
      textColor: 'text-rose-500',
      theme: 'rose'
    };
  }

  if (title.includes('NHẮC NHỞ')) {
    return {
      icon: ClockIcon,
      bgColor: 'bg-amber-500',
      textColor: 'text-amber-500',
      theme: 'amber'
    };
  }

  return {
    icon: BellIcon,
    bgColor: 'bg-slate-400',
    textColor: 'text-slate-400',
    theme: 'slate'
  };
};

export default function HeaderPage({ isAdmin }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const currentNav = isAdmin ? adminNavigation : userNavigation;

  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const fetchNotifications = async () => {
    setLoadingNotifs(true);
    try {
      const response = await apiFetch('/notification');
      if (response && response.success) {
        setNotifications(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    if (user?.person_id) {
      fetchNotifications();
      // Poll notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.person_id]);

  const handleMarkAllAsRead = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await apiFetch('/notification/read-all', {
        method: 'PUT'
      });
      if (response && response.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const [checkingTaskId, setCheckingTaskId] = useState(null);

  const handleNotificationClick = async (notif) => {
    if (checkingTaskId) return;

    if (!notif.is_read) {
      try {
        await apiFetch(`/notification/${notif.notification_id}/read`, {
          method: 'PUT'
        });
        setNotifications(prev => prev.map(n => 
          n.notification_id === notif.notification_id ? { ...n, is_read: true } : n
        ));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    
    if (notif.url) {
      const match = notif.url.match(/^\/tasks\/(\d+)/);
      if (match) {
        const taskId = match[1];
        setCheckingTaskId(notif.notification_id);
        try {
          const res = await taskService.getTaskById(taskId);
          if (!res || !res.success || !res.data) {
            alert(t('taskdetails.task_not_found') || 'Công việc này đã bị xóa hoặc không tồn tại.');
            setCheckingTaskId(null);
            return;
          }
        } catch (error) {
          alert(t('taskdetails.task_not_found') || 'Công việc này đã bị xóa hoặc không tồn tại.');
          setCheckingTaskId(null);
          return;
        }
        setCheckingTaskId(null);
      }
      navigate(notif.url);
    }
  };

  const [actionLoadingId, setActionLoadingId] = useState(null);

  const handleRequestAction = async (e, notif, actionStatus) => {
    e.preventDefault();
    e.stopPropagation();

    const requestId = notif.request_id;
    if (!requestId) return;

    setActionLoadingId(notif.notification_id);
    try {
      const response = await apiFetch(`/request/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: actionStatus })
      });

      if (response && response.success) {
        setNotifications(prev => prev.map(n => {
          if (n.notification_id === notif.notification_id) {
            return { ...n, request_status: actionStatus, is_read: true };
          }
          return n;
        }));

        if (!notif.is_read) {
          await apiFetch(`/notification/${notif.notification_id}/read`, {
            method: 'PUT'
          }).catch(err => console.error('Error marking as read during action:', err));
        }
      }
    } catch (error) {
      console.error('Error updating request status from notification:', error);
      alert(t('requests.alert_update_fail') || 'Cập nhật trạng thái thất bại');
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const now = new Date();
      const date = new Date(dateStr);
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      const isVi = i18n.language === 'vi';

      if (diffMins < 1) return isVi ? 'Vừa xong' : 'Just now';
      if (diffMins < 60) return isVi ? `${diffMins} phút trước` : `${diffMins}m ago`;
      if (diffHours < 24) return isVi ? `${diffHours} giờ trước` : `${diffHours}h ago`;
      if (diffDays < 7) return isVi ? `${diffDays} ngày trước` : `${diffDays}d ago`;

      return date.toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  };

  const navigation = currentNav.map(item => ({
    ...item,
    name: t(`nav.${item.key}`),
    current: location.pathname === item.path ||
      (item.id === 'task' && location.pathname.startsWith('/tasks')) ||
      (item.id === 'admin_task' && location.pathname.startsWith('/tasks')) ||
      (item.id === 'work' && (location.pathname.startsWith('/register') || location.pathname.startsWith('/history')))
  }));

  const docsUrl = import.meta.env.VITE_DOCS_URL || (import.meta.env.DEV ? 'http://localhost:5174' : 'https://docs-qltt.kis-v.com/');

  return (
    <Disclosure as="nav" className="fixed top-0 z-50 w-full bg-white border-b border-gray-200" data-customizable-id="header-bg" data-customizable-type="bg">
      {({ open, close }) => (
        <>
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-[56px] items-center justify-between">
              <div className="flex items-center min-w-0">
                {/* Mobile menu button */}
                <div className="flex items-center sm:hidden mr-2 flex-shrink-0">
                  <DisclosureButton className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
                    <span className="sr-only">Mở menu chính</span>
                    <Bars3Icon aria-hidden="true" className="block h-6 w-6 group-data-open:hidden" />
                    <XMarkIcon aria-hidden="true" className="hidden h-6 w-6 group-data-open:block" />
                  </DisclosureButton>
                </div>

                {/* Logo */}
                <div className="hidden sm:flex shrink items-center mr-2 sm:mr-8 min-w-0">
                  <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                    <img src="/kis_vietnam_creative_logo.jpeg" alt="Logo" className="h-8 w-8 rounded-lg object-cover" />
                    <span className="text-[#0056b3] font-[800] text-base sm:text-[1.15rem] tracking-tight truncate hidden md:inline-block" data-customizable-id="header-logo" data-customizable-type="text">
                      {t('nav.logo')}
                    </span>
                  </Link>
                </div>

                {/* Desktop Nav */}
                <div className="hidden sm:block">
                  <div className="flex space-x-2">
                    {navigation.map((item) => (
                      <Link
                        key={item.id}
                        to={item.path}
                        aria-current={item.current ? 'page' : undefined}
                        className={classNames(
                          item.current
                            ? 'text-[#0056b3] bg-[#edf3fb] font-semibold relative after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-[#0056b3] after:rounded-t-[2px]'
                            : 'text-gray-500 hover:text-gray-700 font-medium',
                          'rounded-md px-4 py-2 text-sm transition-colors'
                        )}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right side items */}
              <div className="flex items-center space-x-1.5 sm:space-x-3">
                {/* Language Selector */}
                <LanguageSelector />

                {/* Admin AI Agents Icon */}
                {isAdmin && (
                  <Link
                    to="/admin/ai-agents"
                    title={t('nav.admin_ai_agents') || 'Quản lý AI Agent'}
                    className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#86b7fe]"
                  >
                    <SparklesIcon className="h-6 w-6 text-purple-600 hover:text-purple-800 transition-colors" aria-hidden="true" />
                  </Link>
                )}

                {/* Admin Theme Settings Icon */}
                {isAdmin && (
                  <Link
                    to="/admin/theme-settings"
                    title={t('nav.theme_settings')}
                    className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#86b7fe]"
                  >
                    <Cog6ToothIcon className="h-6 w-6" aria-hidden="true" />
                  </Link>
                )}

                {isAdmin && (
                  <a
                    href={docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    title={t('nav.docs')}
                    className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#86b7fe]"
                  >
                    <QuestionMarkCircleIcon className="h-6 w-6" aria-hidden="true" />
                  </a>
                )}

                {/* Notification Bell Dropdown */}
                <Menu as="div" className="relative ml-1">
                  <MenuButton 
                    onClick={fetchNotifications}
                    className="relative rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#86b7fe]"
                  >
                    <span className="sr-only">{t('nav.notifications')}</span>
                    <BellIcon className="h-6 w-6" aria-hidden="true" />
                    {notifications.filter(n => !n.is_read).length > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                        {notifications.filter(n => !n.is_read).length > 99 ? '99+' : notifications.filter(n => !n.is_read).length}
                      </span>
                    )}
                  </MenuButton>

                  <MenuItems
                    transition
                    className="fixed inset-x-4 top-[56px] sm:absolute sm:right-0 sm:left-auto sm:top-auto z-50 mt-2 w-auto sm:w-[380px] max-w-none sm:max-w-none origin-top sm:origin-top-right rounded-2xl bg-white border border-gray-100/80 shadow-2xl py-2 transition focus:outline-none data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in max-h-[460px] overflow-y-auto"
                  >
                    <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                      <span className="font-bold text-gray-800 text-sm">{t('nav.notifications')}</span>
                      {notifications.filter(n => !n.is_read).length > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-xs font-semibold text-[#0056b3] hover:text-[#004494] hover:underline"
                        >
                          {t('nav.mark_all_read')}
                        </button>
                      )}
                    </div>

                    <div className="divide-y divide-gray-50">
                      {loadingNotifs && notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-gray-500">
                          {t('nav.loading_notifications')}
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-gray-500">
                          {t('nav.no_notifications')}
                        </div>
                      ) : (
                        notifications.map((notif) => {
                          const typeInfo = resolveNotificationType(notif);
                          const isChecking = checkingTaskId === notif.notification_id;
                          return (
                            <MenuItem key={notif.notification_id}>
                              <div
                                onClick={() => !isChecking && handleNotificationClick(notif)}
                                className={classNames(
                                  'block px-4 py-3.5 cursor-pointer transition-all duration-200 border-b border-gray-50 hover:bg-slate-50/50',
                                  notif.is_read ? 'bg-white' : 'bg-blue-50/10',
                                  notif.is_read ? 'border-l-[4px] border-l-transparent' : 'border-l-[4px] border-l-[#0056b3]',
                                  isChecking ? 'opacity-50 pointer-events-none' : ''
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  {/* Left Category Icon Box */}
                                  <div className={classNames(
                                    'w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm transition-transform duration-200 hover:scale-105',
                                    typeInfo.bgColor
                                  )}>
                                    <typeInfo.icon className="h-5 w-5 stroke-[2.2]" aria-hidden="true" />
                                  </div>

                                  {/* Middle content and actions */}
                                  <div className="flex-1 min-w-0">
                                    {/* Header row: Title + Time */}
                                    <div className="flex items-start justify-between gap-1.5">
                                      <p className={classNames(
                                        'text-[13px] text-gray-900 leading-snug break-words pr-2',
                                        notif.is_read ? 'font-medium text-gray-700' : 'font-bold text-gray-900'
                                      )}>
                                        {notif.title}
                                      </p>
                                      <span className="text-[10px] text-gray-400 font-medium shrink-0 pt-0.5">
                                        {formatTime(notif.created_at)}
                                      </span>
                                    </div>

                                    {/* Content text */}
                                    <p className="text-[11.5px] text-gray-500 mt-1 leading-relaxed break-words line-clamp-3">
                                      {notif.content}
                                    </p>

                                    {/* Inline request action buttons / status badges */}
                                    {notif.request_status && (
                                      <div className="mt-3 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                        {notif.request_status === 'pending' ? (
                                          <>
                                            {actionLoadingId === notif.notification_id ? (
                                              <span className="inline-flex items-center text-xs text-gray-400 font-medium py-1">
                                                <svg className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-[#0056b3]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Đang xử lý...
                                              </span>
                                            ) : (
                                              <>
                                                <button
                                                  onClick={(e) => handleRequestAction(e, notif, 'approved')}
                                                  className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm shadow-emerald-500/10 cursor-pointer"
                                                >
                                                  Đồng ý
                                                </button>
                                                <button
                                                  onClick={(e) => handleRequestAction(e, notif, 'rejected')}
                                                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                                                >
                                                  Từ chối
                                                </button>
                                              </>
                                            )}
                                          </>
                                        ) : notif.request_status === 'approved' ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/50 shadow-sm shadow-emerald-500/5">
                                            <CheckIcon className="w-3 h-3 stroke-[2.5]" />
                                            Đã duyệt
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/50 shadow-sm shadow-rose-500/5">
                                            <XMarkIcon className="w-3 h-3 stroke-[2.5]" />
                                            Đã từ chối
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </MenuItem>
                          );
                        })
                      )}
                    </div>
                  </MenuItems>
                </Menu>

                {/* Profile dropdown */}
                <Menu as="div" className="relative ml-1">
                  <MenuButton className="flex items-center gap-2 rounded-md bg-white px-2 py-1 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#86b7fe] focus:ring-offset-1">
                    <span className="sr-only">Mở menu người dùng</span>
                    <div className="h-8 w-8 rounded-md bg-blue-50 flex items-center justify-center text-[#0056b3] flex-shrink-0">
                      <UserIcon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="hidden sm:block text-sm font-semibold text-gray-700">{user?.name || user?.username}</span>
                  </MenuButton>
                  <MenuItems
                    transition
                    className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 transition focus:outline-none data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                  >
                    <MenuItem>
                      <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100">
                        {t('nav.profile')}
                      </Link>
                    </MenuItem>

                    <MenuItem>
                      <button onClick={async () => { await logout(); }} className="w-full text-left block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100">
                        {t('nav.logout')}
                      </button>
                    </MenuItem>
                  </MenuItems>
                </Menu>
              </div>
            </div>
          </div>

          {/* Backdrop overlay for closing mobile menu on click outside */}
          {open && (
            <div 
              className="fixed inset-0 top-[56px] bg-black/40 z-40 sm:hidden transition-opacity"
              onClick={() => close()} 
            />
          )}

          {/* Mobile nav panel */}
          <DisclosurePanel className="sm:hidden relative z-50 bg-white border-b border-gray-200 shadow-xl">
            <div className="space-y-1 pb-3 pt-2">
              {navigation.map((item) => (
                <DisclosureButton
                  key={item.id}
                  as={Link}
                  to={item.path}
                  aria-current={item.current ? 'page' : undefined}
                  className={classNames(
                    item.current ? 'bg-[#edf3fb] text-[#0056b3] border-l-4 border-[#0056b3]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 border-l-4 border-transparent',
                    'block py-2 pl-3 pr-4 text-base font-medium'
                  )}
                >
                  {item.name}
                </DisclosureButton>
              ))}
            </div>
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  )
}
