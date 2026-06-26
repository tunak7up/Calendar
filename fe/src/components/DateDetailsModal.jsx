import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme, useTaskColor } from '../context/ThemeContext';
import { formatVNTime } from '../utils/dateUtils';
import {
  XMarkIcon,
  BriefcaseIcon,
  UserMinusIcon,
  PlusCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

export default function DateDetailsModal({ menuConfig, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const getTaskColor = useTaskColor();
  const [modalStatusFilter, setModalStatusFilter] = useState('all');

  const filteredModalTasks = useMemo(() => {
    if (!menuConfig) return [];
    let list = menuConfig.tasks;
    if (modalStatusFilter !== 'all') {
      list = menuConfig.tasks.filter(t => {
        const s = t.status?.toLowerCase();
        if (modalStatusFilter === 'pending') {
          return s === 'pending' || s === 'overdue';
        }
        return s === modalStatusFilter.toLowerCase();
      });
    }
    return [...list].sort((a, b) => {
      const getStatusOrder = (status) => {
        const s = status?.toLowerCase();
        if (s === 'overdue') return 1;
        if (s === 'in progress') return 2;
        if (s === 'pending') return 3;
        if (s === 'completed') return 4;
        return 5;
      };
      return getStatusOrder(a.status) - getStatusOrder(b.status);
    });
  }, [menuConfig, modalStatusFilter]);

  if (!menuConfig) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{t('myschedule.details_for', { date: menuConfig.date })}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{t('myschedule.details_subtitle')}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Work Shift Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('myschedule.work_shift')}</h4>
              {!menuConfig.isWorkDay ? (
                <button
                  onClick={() => navigate('/register/work', { state: { date: menuConfig.date } })}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-md transition-colors"
                >
                  {t('myschedule.register_now')}
                </button>
              ) : (
                <button
                  onClick={() => navigate('/register/leave', { state: { date: menuConfig.date } })}
                  className="text-[10px] font-bold text-red-600 hover:text-red-700 bg-red-50 px-2 py-1 rounded-md transition-colors"
                >
                  {t('myschedule.request_leave')}
                </button>
              )}
            </div>
            {menuConfig.isWorkDay ? (
              <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                  <BriefcaseIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-emerald-900">{t('myschedule.active_work_day')}</div>
                  <div className="text-xs text-emerald-600">
                  {menuConfig.shift ? `${formatVNTime(menuConfig.shift.start)} - ${formatVNTime(menuConfig.shift.end)}` : t('myschedule.standard_shift')}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                  <UserMinusIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-600">{t('myschedule.no_shift')}</div>
                  <div className="text-xs text-gray-400">{t('myschedule.no_shift_subtitle')}</div>
                </div>
              </div>
            )}
          </div>

          {/* Daily Report Section */}
          {menuConfig.report && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('dashboard.daily_report')}</h4>
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-bold text-gray-400 block mb-0.5">{t('reporthistory.col_checkin')}</span>
                    <span className="text-sm font-semibold text-emerald-600">{menuConfig.report.check_in || '--:--'}</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-400 block mb-0.5">{t('reporthistory.col_checkout')}</span>
                    <span className="text-sm font-semibold text-indigo-600">{menuConfig.report.check_out || '--:--'}</span>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 block mb-1">{t('reporthistory.modal_content')}</span>
                  <div className="bg-white border border-gray-100 rounded-xl p-3 text-sm text-gray-700 whitespace-pre-wrap min-h-[60px]">
                    {menuConfig.report.description || (
                      <span className="text-gray-400 italic">{t('reporthistory.modal_no_content')}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tasks Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('myschedule.tasks', { count: filteredModalTasks.length })}</h4>
              <div className="flex items-center gap-2">
                <select 
                  value={modalStatusFilter}
                  onChange={(e) => setModalStatusFilter(e.target.value)}
                  className="text-[10px] font-bold text-gray-600 bg-white border border-gray-200 rounded-md px-2 py-1 outline-none cursor-pointer hover:border-blue-300 transition-colors"
                >
                  <option value="all">{t('myschedule.all')}</option>
                  <option value="pending">{t('myschedule.pending')}</option>
                  <option value="in progress">{t('myschedule.in_progress')}</option>
                  <option value="completed">{t('myschedule.completed')}</option>
                </select>
                <button
                  onClick={() => navigate('/tasks/add', { state: { date: menuConfig.date } })}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                >
                  <PlusCircleIcon className="w-3 h-3" /> {t('myschedule.add')}
                </button>
              </div>
            </div>
            
            {filteredModalTasks.length > 0 ? (
              <div className="space-y-2">
                {filteredModalTasks.map((task) => {
                  const colorSet = getTaskColor(task.status);
                  return (
                    <div 
                      key={task.task_id}
                      onClick={() => {
                        navigate(`/tasks/${task.task_id}`, { state: { task } });
                        onClose();
                      }}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-2 h-8 rounded-full" 
                          style={{ backgroundColor: colorSet.bg }}
                        />
                        <div>
                          <div className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate max-w-[200px] sm:max-w-[360px]" title={task.name}>{task.name}</div>
                          <div className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">
                            {task.status === 'completed' ? t('myschedule.completed') : 
                             task.status === 'in progress' ? t('myschedule.in_progress') : 
                             task.status === 'overdue' ? t('status.overdue') : 
                             t('myschedule.pending')} • {task.priority?.toLowerCase() === 'high' ? t('dashboard.priority_high') : task.priority?.toLowerCase() === 'medium' ? t('dashboard.priority_medium') : t('dashboard.priority_low')}
                          </div>
                        </div>
                      </div>
                      <EyeIcon className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-xs text-gray-400">{t('myschedule.no_tasks')}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 bg-gray-50/50 border-t border-gray-100 text-center">
          <button 
            onClick={onClose}
            className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
          >
            {t('myschedule.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
