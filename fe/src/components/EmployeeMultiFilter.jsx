import React, { useState, useEffect, useRef, useMemo } from 'react';
import { XMarkIcon, UserIcon, MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

/**
 * Searchable Multi-Employee Filter Component
 * @param {Array} employees - List of all employee objects {person_id, name, username}
 * @param {Array} selectedIds - List of currently selected person_id strings
 * @param {Function} onSelectionChange - Callback when selection updates
 * @param {String} placeholder - Dropdown placeholder text
 */
const EmployeeMultiFilter = ({ employees = [], selectedIds = [], onSelectionChange, placeholder, hideTags = false }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  // Ensure selectedIds is an array
  const currentSelected = useMemo(() => Array.isArray(selectedIds) ? selectedIds : [], [selectedIds]);

  const availableEmployees = useMemo(() => {
    return employees.filter(emp => !currentSelected.includes(emp.person_id.toString()));
  }, [employees, currentSelected]);

  const selectedEmployees = useMemo(() => {
    return employees.filter(emp => currentSelected.includes(emp.person_id.toString()));
  }, [employees, currentSelected]);

  const filteredEmployees = useMemo(() => {
    return availableEmployees.filter(emp => {
      const name = emp.name || '';
      const username = emp.username || '';
      const term = searchTerm.toLowerCase();
      return name.toLowerCase().includes(term) || username.toLowerCase().includes(term);
    });
  }, [availableEmployees, searchTerm]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id) => {
    onSelectionChange([...currentSelected, id.toString()]);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleRemove = (id) => {
    onSelectionChange(currentSelected.filter(item => item !== id));
  };

  const activePlaceholder = placeholder || t('components.employeeFilter.placeholder');

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
      <div ref={containerRef} className="relative group min-w-[220px] sm:max-w-[260px] flex-shrink-0">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 group-focus-within:text-[#0056b3] transition-colors" />
        </div>
        
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          placeholder={activePlaceholder}
          className="w-full bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl pl-9 pr-8 py-2.5 outline-none focus:ring-2 focus:ring-[#0056b3]/20 focus:border-[#0056b3] transition-all shadow-sm hover:border-gray-300 min-h-[44px] placeholder-gray-400"
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none z-10">
          <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#0056b3]' : ''}`} />
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200 py-1">
            {filteredEmployees.length === 0 ? (
              <div className="px-4 py-3 text-xs text-gray-400 font-semibold text-center">
                {availableEmployees.length === 0
                  ? t('components.employeeFilter.allSelected')
                  : (t('components.employeeFilter.noResults') || 'Không tìm thấy kết quả')}
              </div>
            ) : (
              filteredEmployees.map(emp => (
                <button
                  key={emp.person_id}
                  type="button"
                  onClick={() => handleSelect(emp.person_id)}
                  className="w-full text-left px-3.5 py-2.5 text-sm text-gray-700 hover:bg-[#0056b3]/5 hover:text-[#0056b3] transition-all flex items-center gap-2.5 font-medium border-b border-gray-50 last:border-0 cursor-pointer group"
                >
                  <div className="w-5 h-5 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-[#0056b3]/10 transition-colors">
                    <UserIcon className="w-3 h-3 text-[#0056b3]/60 group-hover:text-[#0056b3] transition-colors" />
                  </div>
                  <span className="truncate">{emp.name || emp.username}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {!hideTags && currentSelected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 w-full sm:flex-1">
          {selectedEmployees.map(emp => (
            <div
              key={emp.person_id}
              className="flex items-center gap-1.5 bg-white text-[#0056b3] px-2.5 py-1.5 rounded-lg border border-blue-100 text-xs font-bold shadow-sm hover:shadow-md transition-all group/tag whitespace-nowrap"
            >
              <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                <UserIcon className="w-3 h-3 text-[#0056b3]" />
              </div>
              <span>{emp.name || emp.username}</span>
              <button
                onClick={() => handleRemove(emp.person_id.toString())}
                className="hover:bg-[#0056b3] hover:text-white rounded-md p-0.5 transition-all text-[#0056b3]/60"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button
            onClick={() => onSelectionChange([])}
            className="text-[10px] uppercase tracking-widest font-black text-gray-400 hover:text-red-500 px-2 transition-colors self-center whitespace-nowrap"
          >
            {t('components.employeeFilter.clear')}
          </button>
        </div>
      )}
    </div>
  );
};

export default EmployeeMultiFilter;
