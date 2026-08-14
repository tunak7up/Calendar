import React from 'react';
import {
  PlusIcon,
  XMarkIcon,
  CalendarDaysIcon,
  ListBulletIcon,
  ChevronDownIcon,
  PaperClipIcon,
  TrashIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import MiniCalendar from '../../../components/MiniCalendar';
import SubTaskModal from '../../../components/SubTaskModal';
import ParticipantManager from '../../../components/ParticipantManager';
import BackButton from '../../../components/BackButton';
import { useAddTask } from './hooks/useAddTask';

export default function AddTask() {
  const {
    t,
    navigate,
    todayStr,
    formData,
    setFormData,
    isSubTaskModalOpen,
    setIsSubTaskModalOpen,
    managers,
    allUsers,
    pendingFiles,
    isStartCalOpen,
    setIsStartCalOpen,
    isDueCalOpen,
    setIsDueCalOpen,
    startCalRef,
    dueCalRef,
    fileInputRef,
    handleFileSelect,
    handleRemovePendingFile,
    handleSubmit,
    addAssignee,
    updateAssigneeRole,
    removeAssignee
  } = useAddTask();

  return (
    <div className="space-y-6 pb-20">
      <div>
        <BackButton className="mb-6" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight" data-customizable-id="add-task-title" data-customizable-type="text">{t('addtask.title')}</h1>
            <p className="text-gray-500 mt-2 text-sm sm:text-base" data-customizable-id="add-task-subtitle" data-customizable-type="text">{t('addtask.subtitle')}</p>
          </div>
          <button
            onClick={handleSubmit}
            data-customizable-id="btn-add-task-header-submit"
            data-customizable-type="bg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-xl shadow-blue-100 active:scale-95 flex items-center gap-2 self-start sm:self-auto shrink-0"
          >
            <PlusIcon className="w-5 h-5" />
            {t('addtask.btn_create')}
          </button>
        </div>
      </div>

      {/* Task Definition Section */}
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/40 border border-gray-100/80 p-4 sm:p-8 md:p-10 transition-all duration-300 hover:shadow-2xl hover:shadow-gray-200/50">
        <h2 className="text-base font-bold text-gray-800 mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 text-blue-600">
            <ListBulletIcon className="w-4 h-4" />
          </span>
          {t('addtask.section_definition')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">{t('addtask.label_name')}</label>
            <input
              type="text"
              placeholder={t('addtask.name_placeholder')}
              value={formData.taskName}
              onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
              className="w-full bg-[#f8fafc] border border-gray-200 focus:border-blue-500 text-gray-900 text-sm rounded-xl focus:ring-4 focus:ring-blue-100 block p-3.5 outline-none transition-all duration-300 placeholder:text-gray-300 shadow-sm"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">{t('addtask.label_assigner')}</label>
            <div className="relative">
              <select
                value={formData.assigner}
                onChange={(e) => setFormData({ ...formData, assigner: e.target.value })}
                className="w-full bg-[#f8fafc] border border-gray-200 focus:border-blue-500 text-gray-900 text-sm rounded-xl focus:ring-4 focus:ring-blue-100 block p-3.5 outline-none appearance-none cursor-pointer transition-all duration-300 shadow-sm"
              >
                {managers.map(admin => (
                  <option key={admin.person_id} value={admin.name}>{admin.name}</option>
                ))}
                {managers.length === 0 && <option value="">{t('addtask.no_manager')}</option>}
              </select>
              <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">{t('addtask.label_description')}</label>
          <textarea
            placeholder={t('addtask.desc_placeholder')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows="4"
            className="w-full bg-[#f8fafc] border border-gray-200 focus:border-blue-500 text-gray-900 text-sm rounded-xl focus:ring-4 focus:ring-blue-100 block p-3.5 outline-none transition-all duration-300 placeholder:text-gray-300 shadow-sm resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Start Date */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{t('addtask.label_start')}</label>
            <div className="relative" ref={startCalRef}>
              <div
                onClick={() => setIsStartCalOpen(!isStartCalOpen)}
                className="w-full bg-[#f8fafc] border border-gray-200 focus:border-blue-500 text-gray-900 text-sm rounded-xl p-3.5 pl-11 outline-none transition-all duration-300 cursor-pointer hover:border-blue-300 hover:bg-white shadow-sm flex items-center h-[50px]"
              >
                <CalendarDaysIcon className="w-5 h-5 text-blue-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <span className="font-bold text-gray-700">{formData.startDate || t('addtask.select_date')}</span>
              </div>
              {isStartCalOpen && (
                <div className="absolute top-full left-0 mt-2 p-4 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] min-w-[280px]">
                  <MiniCalendar
                    selectedDate={formData.startDate}
                    minDate={todayStr}
                    onSelectDate={(date) => {
                      setFormData(prev => {
                        const nextState = { ...prev, startDate: date };
                        if (prev.dueDate < date) {
                          nextState.dueDate = date;
                        }
                        return nextState;
                      });
                      setIsStartCalOpen(false);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{t('addtask.label_due')}</label>
            <div className="relative" ref={dueCalRef}>
              <div
                onClick={() => setIsDueCalOpen(!isDueCalOpen)}
                className="w-full bg-[#f8fafc] border border-gray-200 focus:border-blue-500 text-gray-900 text-sm rounded-xl p-3.5 pl-11 outline-none transition-all duration-300 cursor-pointer hover:border-blue-300 hover:bg-white shadow-sm flex items-center h-[50px]"
              >
                <CalendarDaysIcon className="w-5 h-5 text-rose-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <span className="font-bold text-gray-700">{formData.dueDate || t('addtask.select_date')}</span>
              </div>
              {isDueCalOpen && (
                <div className="absolute top-full left-0 mt-2 p-4 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] min-w-[280px]">
                  <MiniCalendar
                    selectedDate={formData.dueDate}
                    minDate={formData.startDate || todayStr}
                    onSelectDate={(date) => {
                      setFormData({ ...formData, dueDate: date });
                      setIsDueCalOpen(false);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{t('addtask.label_priority')}</label>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-4 w-full bg-[#f8fafc] p-1.5 sm:p-2 rounded-2xl border border-gray-100 shadow-inner">
            {['Low', 'Medium', 'High'].map((level) => {
              const isActive = formData.priority === level;
              let activeClass = '';
              let inactiveClass = 'text-gray-400 hover:text-gray-600 bg-transparent hover:bg-white/60';
              let icon = null;

              if (level === 'Low') {
                activeClass = 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-200/50';
                icon = <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isActive ? 'bg-current' : 'bg-emerald-500'}`}></span>;
              } else if (level === 'Medium') {
                activeClass = 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-200/50';
                icon = <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isActive ? 'bg-current' : 'bg-amber-500'}`}></span>;
              } else {
                activeClass = 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-200/50';
                icon = <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isActive ? 'bg-current' : 'bg-rose-500'}`}></span>;
              }

              const labelText = level === 'High' ? t('addtask.priority_high') : level === 'Medium' ? t('addtask.priority_medium') : t('addtask.priority_low');

              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: level })}
                  data-custom-component={isActive ? `TaskPriority-${level}` : undefined}
                  className={`flex items-center justify-center gap-1 sm:gap-2 py-2.5 px-1.5 sm:py-3.5 sm:px-6 text-[10px] sm:text-xs font-bold rounded-xl border border-transparent transition-all duration-300 cursor-pointer select-none transform ${isActive 
                    ? `${activeClass} scale-[1.01]` 
                    : `${inactiveClass}`
                  }`}
                >
                  {icon}
                  <span className="truncate">{labelText}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Participant Manager */}
      <ParticipantManager 
        participants={formData.assignees}
        allUsers={allUsers}
        onAdd={addAssignee}
        onUpdateRole={updateAssigneeRole}
        onRemove={removeAssignee}
      />

      {/* Attachments Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <PaperClipIcon className="w-5 h-5 text-blue-500" />
            {t('addtask.attachments')}
          </h2>
          <div>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              {t('addtask.add_file')}
            </button>
          </div>
        </div>

        {pendingFiles.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {pendingFiles.map((file, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl shadow-sm group">
                <DocumentTextIcon className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-700 truncate max-w-[150px]" title={file.name}>
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemovePendingFile(idx)}
                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title={t('addtask.remove_file')}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/30">
            <p className="text-xs text-gray-400 font-bold">{t('addtask.no_files')}</p>
          </div>
        )}
      </div>

      {/* Sub-tasks Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
            {t('addtask.subtasks')}
          </h2>
          <button
            type="button"
            onClick={() => setIsSubTaskModalOpen(true)}
            className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            {t('addtask.add_subtask')}
          </button>
        </div>

        <div className="space-y-3">
          {formData.subTasks.length > 0 ? (
            formData.subTasks.map((st, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm group hover:border-blue-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-1 h-8 rounded-full ${st.priority?.toLowerCase() === 'high' ? 'bg-red-500' : st.priority?.toLowerCase() === 'medium' ? 'bg-amber-500' : 'bg-green-500'}`}></div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{st.title}</p>
                    <p className="text-[11px] text-gray-400 line-clamp-1">{st.description || t('addtask.no_description')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span 
                    data-custom-component={`TaskPriority-${st.priority ? st.priority.charAt(0).toUpperCase() + st.priority.slice(1).toLowerCase() : ''}`}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider border ${st.priority?.toLowerCase() === 'high' ? 'bg-red-50 text-red-600' :
                      st.priority?.toLowerCase() === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
                    }`}
                  >
                    {st.priority?.toLowerCase() === 'high' ? t('addtask.priority_high') : st.priority?.toLowerCase() === 'medium' ? t('addtask.priority_medium') : t('addtask.priority_low')}
                  </span>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, subTasks: prev.subTasks.filter((_, i) => i !== idx) }))}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/30">
              <p className="text-xs text-gray-400 font-bold">{t('addtask.no_subtasks')}</p>
              <p className="text-[10px] text-gray-300 mt-1">{t('addtask.no_subtasks_hint')}</p>
            </div>
          )}
        </div>
      </div>

      <SubTaskModal
        isOpen={isSubTaskModalOpen}
        onClose={() => setIsSubTaskModalOpen(false)}
        onAdd={(subTask) => {
          setFormData(prev => ({
            ...prev,
            subTasks: [...prev.subTasks, subTask]
          }));
        }}
      />

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-4 pt-6">
        <button
          onClick={() => navigate(-1)}
          data-customizable-id="btn-add-task-cancel"
          data-customizable-type="bg"
          className="text-gray-400 text-sm font-bold hover:text-gray-600 transition-colors px-6 py-3 rounded-xl hover:bg-gray-50"
        >
          {t('addtask.btn_cancel')}
        </button>
        <button
          onClick={handleSubmit}
          data-customizable-id="btn-add-task-submit"
          data-customizable-type="bg"
          className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-3.5 rounded-xl text-sm font-bold transition-all shadow-xl shadow-blue-100 active:scale-95 flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          {t('addtask.btn_create')}
        </button>
      </div>
    </div>
  );
}
