import React from 'react';
import { ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import DaySummaryView from './DaySummaryView';
import PersonDetailView from './PersonDetailView';

export default function AdminScheduleModal({
  isOpen,
  onClose,
  modalDate,
  modalLoading,
  modalData,
  selectedPerson,
  setSelectedPerson,
  activeGroup,
  setActiveGroup,
  taskStatusFilters,
  setTaskStatusFilters,
  navigate,
  t,
  i18n
}) {
  if (!isOpen) return null;

  const formattedModalDate = (() => {
    const d = new Date(modalDate);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            {selectedPerson && (
              <button
                onClick={() => setSelectedPerson(null)}
                className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-lg font-bold text-gray-900">
              {selectedPerson
                ? t('adminschedule.schedule_for_person', {
                    date: formattedModalDate,
                    name: selectedPerson.name
                  })
                : t('adminschedule.schedule_for', { date: formattedModalDate })}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {modalLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : !selectedPerson ? (
            <DaySummaryView
              modalData={modalData}
              activeGroup={activeGroup}
              setActiveGroup={setActiveGroup}
              onSelectPerson={setSelectedPerson}
              navigate={navigate}
              t={t}
              i18n={i18n}
            />
          ) : (
            <PersonDetailView
              person={selectedPerson}
              taskStatusFilters={taskStatusFilters}
              setTaskStatusFilters={setTaskStatusFilters}
              navigate={navigate}
              t={t}
            />
          )}
        </div>
      </div>
    </div>
  );
}
