import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon, MagnifyingGlassIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import LanguageSelector from '../components/LanguageSelector'

const userNavigation = [
  { key: 'dashboard', path: '/dashboard', id: 'dashboard' },
  { key: 'schedule', path: '/schedule', id: 'schedule' },
  { key: 'register', path: '/history', id: 'work' }, // Point to history/list as entry point
  { key: 'tasks', path: '/tasks', id: 'task' },
];

const adminNavigation = [
  { key: 'admin_dashboard', path: '/admin/dashboard', id: 'admin_dashboard' },
  { key: 'admin_schedule', path: '/admin/schedule', id: 'admin_schedule' },
  { key: 'admin_employees', path: '/admin/employees', id: 'admin_employees' },
  { key: 'admin_requests', path: '/admin/requests', id: 'admin_requests' },
  { key: 'admin_workhours', path: '/admin/work-hours', id: 'admin_workhours' },
  { key: 'admin_reports', path: '/admin/reports', id: 'admin_reports' },
  { key: 'admin_preset_reasons', path: '/admin/preset-reasons', id: 'admin_preset_reasons' },
  { key: 'tasks', path: '/tasks', id: 'admin_task' },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function HeaderPage({ isAdmin }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const currentNav = isAdmin ? adminNavigation : userNavigation;

  const navigation = currentNav.map(item => ({
    ...item,
    name: t(`nav.${item.key}`),
    current: location.pathname === item.path ||
      (item.id === 'task' && location.pathname.startsWith('/tasks')) ||
      (item.id === 'admin_task' && location.pathname.startsWith('/tasks')) ||
      (item.id === 'work' && (location.pathname.startsWith('/register') || location.pathname.startsWith('/history')))
  }));

  return (
    <Disclosure as="nav" className="fixed top-0 z-50 w-full bg-white border-b border-gray-200" data-customizable-id="header-bg" data-customizable-type="bg">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-[56px] items-center justify-between">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden mr-2">
              <DisclosureButton className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
                <span className="sr-only">Mở menu chính</span>
                <Bars3Icon aria-hidden="true" className="block h-6 w-6 group-data-open:hidden" />
                <XMarkIcon aria-hidden="true" className="hidden h-6 w-6 group-data-open:block" />
              </DisclosureButton>
            </div>

            {/* Logo */}
            <div className="flex shrink-0 items-center mr-8">
              <Link to="/" className="text-[#0056b3] font-[800] text-[1.15rem] tracking-tight hover:text-[#004494]" data-customizable-id="header-logo" data-customizable-type="text">{t('nav.logo')}</Link>
            </div>

            {/* Desktop Nav */}
            <div className="hidden sm:block">
              <div className="flex space-x-2">
                {navigation.map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    data-customizable-id={`nav-${item.id}`}
                    data-customizable-type="text"
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
          <div className="flex items-center space-x-3">
            {/* Language Selector */}
            <LanguageSelector />

            {/* Profile dropdown */}
            <Menu as="div" className="relative ml-1">
              <MenuButton className="flex items-center gap-2 rounded-md bg-white px-2 py-1 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#86b7fe] focus:ring-offset-1">
                <span className="sr-only">Mở menu người dùng</span>
                <img
                  alt="User Avatar"
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.username || 'U')}&background=101c23&color=12a4d9&rounded=true&size=32`}
                  className="h-8 w-8 rounded-md"
                />
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

      {/* Mobile nav panel */}
      <DisclosurePanel className="sm:hidden">
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
    </Disclosure>
  )
}
