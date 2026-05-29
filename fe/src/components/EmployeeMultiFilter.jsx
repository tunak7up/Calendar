import React from 'react';
import { XMarkIcon, UserIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

/**
 * Multi-Employee Filter Component
 * @param {Array} employees - List of all employee objects {person_id, name, username}
 * @param {Array} selectedIds - List of currently selected person_id strings
 * @param {Function} onSelectionChange - Callback when selection updates
 * @param {String} placeholder - Dropdown placeholder text
 */
const EmployeeMultiFilter = ({ employees, selectedIds, onSelectionChange, placeholder }) => {
  const { t } = useTranslation();
  // Ensure selectedIds is an array
  const currentSelected = Array.isArray(selectedIds) ? selectedIds : [];

  const availableEmployees = employees.filter(emp => !currentSelected.includes(emp.person_id.toString()));
  const selectedEmployees = employees.filter(emp => currentSelected.includes(emp.person_id.toString()));

  const handleSelect = (e) => {
    const id = e.target.value;
    if (!id) return;
    onSelectionChange([...currentSelected, id]);
    e.target.value = '';
  };

  const handleRemove = (id) => {
    onSelectionChange(currentSelected.filter(item => item !== id));
  };

  const activePlaceholder = placeholder || t('components.employeeFilter.placeholder');

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
      <div className="relative group min-w-[200px] sm:max-w-[240px] flex-shrink-0">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <FunnelIcon className="w-4 h-4 text-gray-400 group-focus-within:text-[#0056b3] transition-colors" />
        </div>
        <select
          onChange={handleSelect}
          defaultValue=""
          className="w-full bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl pl-9 pr-8 py-2 outline-none focus:ring-2 focus:ring-[#0056b3]/20 focus:border-[#0056b3] transition-all appearance-none cursor-pointer shadow-sm hover:border-gray-300 min-h-[44px]"
        >
          <option value="" disabled>{activePlaceholder}</option>
          {availableEmployees.length === 0 ? (
            <option disabled>{t('components.employeeFilter.allSelected')}</option>
          ) : (
            availableEmployees.map(emp => (
              <option key={emp.person_id} value={emp.person_id}>
                {emp.name || emp.username}
              </option>
            ))
          )}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {currentSelected.length > 0 && (
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
