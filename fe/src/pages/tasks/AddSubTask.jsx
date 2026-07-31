import React, { useState } from 'react';
import { taskService } from '../../services/taskService';
import { 
  PlusIcon, 
  ArrowLeftIcon,
  InformationCircleIcon,
  CalendarDaysIcon,
  UserIcon,
  DocumentTextIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import { useTranslation } from 'react-i18next';
import BackButton from '../../components/BackButton';


export default function AddSubTask() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const parentTask = location.state?.parentTask;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    attachmentUrl: ''
  });

  if (!parentTask) return (
    <div className="max-w-4xl mx-auto text-center py-20">
      <h2 className="text-xl font-bold text-gray-900">{t('addsubtask.not_found')}</h2>
      <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 font-medium">{t('addsubtask.go_back')}</button>
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      parent_id: parentTask.task_id,
      assigner_id: parentTask.assigner_id,
      start_time: parentTask.start_time,
      due_date: parentTask.due_date,
      status: 'pending'
    };

    try {
      const result = await taskService.createSubTask(parentTask.task_id, payload);
      
      if (result.success) {
        if (formData.attachmentUrl.trim()) {
          const subTaskId = result.data.task_id;
          await taskService.createTaskAttachment({ 
            task_id: subTaskId, 
            url: formData.attachmentUrl.trim() 
          });
        }
        
        alert(t('addsubtask.alert_success'));
        navigate(-1);
      } else {
        alert(t('addsubtask.alert_error') + result.message);
      }
    } catch (error) {
      console.error('Error creating sub-task:', error);
      alert(t('addsubtask.alert_fail'));
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="mb-8">
        <BackButton className="mb-4" />
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
            <PlusIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('addsubtask.title')}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{t('addsubtask.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                  {t('addsubtask.label_title')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder={t('addsubtask.title_placeholder')}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-gray-700 font-medium"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                  {t('addsubtask.label_description')}
                </label>
                <textarea
                  rows="4"
                  placeholder={t('addsubtask.desc_placeholder')}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-gray-700 resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                  {t('addsubtask.label_priority')}
                </label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                  {['Low', 'Medium', 'High'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: p })}
                      className={`py-2 px-1.5 sm:py-3 sm:px-4 rounded-2xl text-[10px] sm:text-sm font-bold transition-all border-2 ${
                        formData.priority === p 
                          ? (p === 'High' ? 'border-red-500 bg-red-50 text-red-600' : 
                             p === 'Medium' ? 'border-amber-500 bg-amber-50 text-amber-600' : 
                             'border-green-500 bg-green-50 text-green-600')
                          : 'border-transparent bg-gray-50 text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      <span className="truncate">{p === 'High' ? t('addtask.priority_high') : p === 'Medium' ? t('addtask.priority_medium') : t('addtask.priority_low')}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1 flex items-center gap-2">
                  <PaperClipIcon className="w-4 h-4" />
                  {t('addsubtask.label_attachment')}
                </label>
                <input
                  type="url"
                  placeholder="https://docs.google.com/..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-gray-700 font-medium"
                  value={formData.attachmentUrl}
                  onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
                />
                <p className="text-[10px] text-gray-400 mt-2 ml-1">{t('addsubtask.attachment_hint')}</p>
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full py-4 text-lg font-bold">
                  {t('addsubtask.btn_create')}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar - Parent Task Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <InformationCircleIcon className="w-24 h-24" />
            </div>
            
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 px-1">
              {t('addsubtask.parent_context')}
            </h3>

            <div className="space-y-6 relative z-10">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                  <DocumentTextIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">{t('addsubtask.parent_task')}</div>
                  <div className="text-sm font-bold text-gray-900 leading-snug">{parentTask.title || parentTask.name}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">{t('addsubtask.assigner')}</div>
                  <div className="text-sm font-bold text-gray-900">{parentTask.assigner || 'N/A'}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-50 rounded-xl text-green-600">
                  <CalendarDaysIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">{t('addsubtask.schedule')}</div>
                  <div className="text-[13px] font-bold text-gray-900 mt-1">
                    {(() => {
                      const formatDateToDMY = (dateVal) => {
                        if (!dateVal) return '';
                        const d = new Date(dateVal);
                        if (isNaN(d.getTime())) return '';
                        const day = String(d.getDate()).padStart(2, '0');
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const year = d.getFullYear();
                        return `${day}/${month}/${year}`;
                      };
                      return `${formatDateToDMY(parentTask.start_time)} - ${formatDateToDMY(parentTask.due_date)}`;
                    })()}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
              <p className="text-[11px] text-blue-600 font-medium leading-relaxed italic">
                {t('addsubtask.note')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
