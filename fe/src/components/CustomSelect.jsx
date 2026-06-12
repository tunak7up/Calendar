import React from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

export default function CustomSelect({ 
  value, 
  onChange, 
  options, 
  size = 'sm', 
  buttonClassName = '', 
  activeOptionClassName = '',
  dropdownWidth = 'w-40',
  align = 'left',
  disabled = false,
  buttonLabel = null,
  ...props
}) {
  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <Menu as="div" className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <Menu.Button
        disabled={disabled}
        className={`
          flex items-center gap-1.5 font-bold transition-all whitespace-nowrap outline-none
          ${size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-4 py-2 text-sm'}
          ${buttonClassName || 'bg-gray-50 border border-gray-150 text-gray-700 rounded-lg hover:bg-gray-100'}
        `}
        data-custom-component="CustomSelect"
        {...props}
      >
        {buttonLabel !== null ? buttonLabel : selectedOption?.label}
        {!disabled && <ChevronDownIcon className="w-3.5 h-3.5 opacity-50" />}
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
        <Menu.Items className={`
          absolute z-50 mt-1.5 ${dropdownWidth} origin-top-left rounded-2xl bg-white p-2 shadow-[0_20px_50px_rgba(0,0,0,0.15)] ring-1 ring-black/5 focus:outline-none border border-gray-100
          ${align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'}
        `}>
          <div className="space-y-1">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <Menu.Item key={String(opt.value)}>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={() => onChange(opt.value)}
                      className={`
                        w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-left
                        ${isSelected 
                          ? (activeOptionClassName || 'bg-blue-50 text-blue-700') 
                          : active 
                            ? 'bg-gray-50 text-gray-900 translate-x-1' 
                            : 'text-gray-650 hover:bg-gray-50'
                        }
                      `}
                    >
                      {opt.label}
                    </button>
                  )}
                </Menu.Item>
              );
            })}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
