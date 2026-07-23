import React, { useState, useRef, useLayoutEffect } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

function FixedMenuItems({
  open,
  buttonRef,
  align,
  direction,
  dropdownWidth,
  options,
  value,
  onChange,
  activeOptionClassName,
}) {
  const [coords, setCoords] = useState(null);
  const [openUp, setOpenUp] = useState(false);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;

    const updateCoords = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      let shouldOpenUp = false;
      if (direction === 'up') {
        shouldOpenUp = true;
      } else if (direction === 'down') {
        shouldOpenUp = false;
      } else {
        // 'auto' mode: open up if space below is limited and space above is greater
        shouldOpenUp = spaceBelow < 220 && spaceAbove > spaceBelow;
      }

      setOpenUp(shouldOpenUp);

      setCoords({
        top: shouldOpenUp ? undefined : rect.bottom + 6,
        bottom: shouldOpenUp ? window.innerHeight - rect.top + 6 : undefined,
        left: align === 'left' ? rect.left : undefined,
        right: align === 'right' ? window.innerWidth - rect.right : undefined,
      });
    };

    updateCoords();
    window.addEventListener('scroll', updateCoords, true);
    window.addEventListener('resize', updateCoords);
    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [open, buttonRef, align, direction]);

  return (
    <Transition
      as={React.Fragment}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      <Menu.Items
        style={
          coords
            ? {
                position: 'fixed',
                top: coords.top !== undefined ? `${coords.top}px` : 'auto',
                bottom:
                  coords.bottom !== undefined ? `${coords.bottom}px` : 'auto',
                left: coords.left !== undefined ? `${coords.left}px` : 'auto',
                right: coords.right !== undefined ? `${coords.right}px` : 'auto',
                zIndex: 999999,
              }
            : {}
        }
        className={`
          fixed z-[999999] ${dropdownWidth} rounded-2xl bg-white p-2 shadow-[0_20px_50px_rgba(0,0,0,0.25)] ring-1 ring-black/10 focus:outline-none border border-gray-100
          ${
            openUp
              ? align === 'right'
                ? 'origin-bottom-right'
                : 'origin-bottom-left'
              : align === 'right'
              ? 'origin-top-right'
              : 'origin-top-left'
          }
        `}
      >
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
                      ${
                        isSelected
                          ? activeOptionClassName || 'bg-blue-50 text-blue-700'
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
  );
}

export default function CustomSelect({
  value,
  onChange,
  options,
  size = 'sm',
  buttonClassName = '',
  activeOptionClassName = '',
  dropdownWidth = 'w-40',
  align = 'left',
  direction = 'down',
  disabled = false,
  buttonLabel = null,
  ...props
}) {
  const selectedOption = options.find((opt) => opt.value === value) || options[0];
  const buttonRef = useRef(null);

  return (
    <Menu
      as="div"
      className="relative inline-block text-left"
      onClick={(e) => e.stopPropagation()}
    >
      {({ open }) => (
        <>
          <Menu.Button
            ref={buttonRef}
            disabled={disabled}
            className={`
              flex items-center gap-1.5 font-bold transition-all whitespace-nowrap outline-none
              ${size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-4 py-2 text-sm'}
              ${
                buttonClassName ||
                'bg-gray-50 border border-gray-150 text-gray-700 rounded-lg hover:bg-gray-100'
              }
            `}
            data-custom-component="CustomSelect"
            {...props}
          >
            {buttonLabel !== null ? buttonLabel : selectedOption?.label}
            {!disabled && <ChevronDownIcon className="w-3.5 h-3.5 opacity-50" />}
          </Menu.Button>

          <FixedMenuItems
            open={open}
            buttonRef={buttonRef}
            align={align}
            direction={direction}
            dropdownWidth={dropdownWidth}
            options={options}
            value={value}
            onChange={onChange}
            activeOptionClassName={activeOptionClassName}
          />
        </>
      )}
    </Menu>
  );
}
