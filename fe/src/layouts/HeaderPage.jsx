import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon, MagnifyingGlassIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'

const navigationBase = [
  { name: 'My Schedule', href: '#', id: 'schedule' },
  { name: 'Register Work', href: '#', id: 'work' },
  { name: 'Task', href: '#', id: 'task' },

 
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function HeaderPage({ activeItem, onSelect }) {
  const navigation = navigationBase.map(item => ({
    ...item,
    current: item.id === activeItem
  }));

  return (
    <Disclosure as="nav" className="fixed top-0 z-50 w-full bg-white border-b border-gray-200">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-[56px] items-center justify-between">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden mr-2">
              <DisclosureButton className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
                <span className="sr-only">Open main menu</span>
                <Bars3Icon aria-hidden="true" className="block h-6 w-6 group-data-open:hidden" />
                <XMarkIcon aria-hidden="true" className="hidden h-6 w-6 group-data-open:block" />
              </DisclosureButton>
            </div>

            {/* Logo */}
            <div className="flex shrink-0 items-center mr-8">
              <a href="#" className="text-[#0056b3] font-[800] text-[1.15rem] tracking-tight hover:text-[#004494]">Precision Workspace</a>
            </div>

            {/* Desktop Nav */}
            <div className="hidden sm:block">
              <div className="flex space-x-2">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    id={`nav-${item.id}`}
                    aria-current={item.current ? 'page' : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      if (onSelect) onSelect(item.id);
                    }}
                    className={classNames(
                      item.current
                        ? 'text-[#0056b3] bg-[#edf3fb] font-semibold relative after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-[#0056b3] after:rounded-t-[2px]'
                        : 'text-gray-500 hover:text-gray-700 font-medium',
                      'rounded-md px-4 py-2 text-sm transition-colors'
                    )}
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="hidden md:block mr-4">
              <div className="relative flex items-center w-[260px]">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon aria-hidden="true" className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  type="search"
                  placeholder="Search operations..."
                  className="block w-full rounded-md border border-gray-200 py-[6px] pl-9 pr-3 text-gray-900 bg-[#f1f3f5] placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#86b7fe] sm:text-sm transition-colors"
                />
              </div>
            </div>

            {/* Notifications */}
            <button
              type="button"
              className="relative rounded-full p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <span className="sr-only">View notifications</span>
              <BellIcon aria-hidden="true" className="h-[1.35rem] w-[1.35rem]" />
              <span className="absolute top-[3px] right-[4px] block h-1.5 w-1.5 rounded-full bg-red-500 ring-[1.5px] ring-white" />
            </button>

            {/* Help */}
            <button
              type="button"
              className="relative rounded-full p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <span className="sr-only">Help</span>
              <QuestionMarkCircleIcon aria-hidden="true" className="h-[1.35rem] w-[1.35rem]" />
            </button>

            {/* Profile dropdown */}
            <Menu as="div" className="relative ml-1">
              <MenuButton className="flex rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#86b7fe] focus:ring-offset-1">
                <span className="sr-only">Open user menu</span>
                <img
                  alt="User Avatar"
                  src="https://ui-avatars.com/api/?name=User&background=101c23&color=12a4d9&rounded=true&size=32"
                  className="h-8 w-8 rounded-md"
                />
              </MenuButton>
              <MenuItems
                transition
                className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 transition focus:outline-none data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
              >
                <MenuItem>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100">
                    Your Profile
                  </a>
                </MenuItem>

                <MenuItem>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100">
                    Sign out
                  </a>
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
              key={item.name}
              as="a"
              href={item.href}
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