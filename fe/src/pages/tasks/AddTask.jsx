import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../../services/api';
import {
  PlusIcon,
  XMarkIcon,
  CalendarDaysIcon,
  ListBulletIcon,
  ChevronDownIcon,
  ArrowLeftIcon,
  PaperClipIcon,
  TrashIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useLocation, useNavigate } from 'react-router-dom';
import { taskService } from '../../services/taskService';
import MiniCalendar from '../../components/MiniCalendar';
import SubTaskModal from '../../components/SubTaskModal';
import ParticipantManager from '../../components/ParticipantManager';
import { useTranslation } from 'react-i18next';
import BackButton from '../../components/BackButton';
import { useAuth } from '../../context/AuthContext';


export default function AddTask() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString();
  const initialDateFromState = location.state?.date;
  const initialDate = initialDateFromState && initialDateFromState >= todayStr ? initialDateFromState : todayStr;

  const initialState = {
    taskName: '',
    description: '',
    startDate: initialDate,
    startTime: '00:01',
    dueDate: initialDate,
    endTime: '23:59',
    assigner: '',
    priority: 'Medium',
    subTasks: [],
    assignees: location.state?.assignee ? [location.state.assignee] : []
  };

  const [formData, setFormData] = useState(initialState);
  const [isSubTaskModalOpen, setIsSubTaskModalOpen] = useState(false);
  const [managers, setManagers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);

  const [isStartCalOpen, setIsStartCalOpen] = useState(false);
  const [isDueCalOpen, setIsDueCalOpen] = useState(false);

  const startCalRef = useRef(null);
  const dueCalRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setPendingFiles(prev => [...prev, ...files]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePendingFile = (index) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const result = await apiFetch('/person');
        if (result.success && Array.isArray(result.data)) {
          const persons = result.data;
          const managersList = persons.filter(p => p.role === 'manager');
          setManagers(managersList);
          setAllUsers(persons);
          
          let initialAssignees = location.state?.assignee ? [location.state.assignee] : [];
          if (currentUser) {
            const self = persons.find(p => p.person_id === currentUser.person_id || p.name === currentUser.name || p.username === currentUser.username);
            if (self) {
              const alreadyAdded = initialAssignees.some(a => a.person_id === self.person_id || a.name === self.name);
              if (!alreadyAdded) {
                initialAssignees = [...initialAssignees, { name: self.name, role: 'assignee', person_id: self.person_id, isLocked: true }];
              } else {
                initialAssignees = initialAssignees.map(a => 
                  (a.person_id === self.person_id || a.name === self.name) 
                    ? { ...a, isLocked: true } 
                    : a
                );
              }
            }
          }

          setFormData(prev => ({ 
            ...prev, 
            assigner: managersList.length > 0 ? managersList[0].name : '',
            assignees: initialAssignees
          }));
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, [currentUser, location.state?.assignee]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (startCalRef.current && !startCalRef.current.contains(event.target)) setIsStartCalOpen(false);
      if (dueCalRef.current && !dueCalRef.current.contains(event.target)) setIsDueCalOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReset = () => {
    let initialAssignees = location.state?.assignee ? [location.state.assignee] : [];
    if (currentUser) {
      const self = allUsers.find(p => p.person_id === currentUser.person_id || p.name === currentUser.name || p.username === currentUser.username);
      if (self) {
        const alreadyAdded = initialAssignees.some(a => a.person_id === self.person_id || a.name === self.name);
        if (!alreadyAdded) {
          initialAssignees = [...initialAssignees, { name: self.name, role: 'assignee', person_id: self.person_id, isLocked: true }];
        } else {
          initialAssignees = initialAssignees.map(a => 
            (a.person_id === self.person_id || a.name === self.name) 
              ? { ...a, isLocked: true } 
              : a
          );
        }
      }
    }
    setFormData({
      ...initialState,
      assigner: managers.length > 0 ? managers[0].name : '',
      assignees: initialAssignees
    });
  };

  const handleSubmit = async () => {
    try {
      const assignerUser = managers.find(m => m.name === formData.assigner);
      const assigner_id = assignerUser ? assignerUser.person_id : null;

      const task_participants = formData.assignees.map(a => {
        const p = allUsers.find(u => u.name === a.name);
        return {
          participant_id: p ? p.person_id : null,
          role: a.role.charAt(0).toUpperCase() + a.role.slice(1)
        };
      }).filter(p => p.participant_id !== null);

      const sub_tasks = formData.subTasks.map(st => ({
        ...st,
        status: 'pending',
        priority: st.priority.toLowerCase()
      }));

      const start_time = new Date(`${formData.startDate}T${formData.startTime}:00`).toISOString();
      const due_date = new Date(`${formData.dueDate}T${formData.endTime}:00`).toISOString();

      const payload = {
        assigner_id,
        start_time,
        due_date,
        title: formData.taskName,
        status: 'pending',
        description: formData.description,
        priority: formData.priority.toLowerCase(),
        sub_tasks,
        task_participants
      };

      const result = await taskService.createTask(payload);
      if (result.success) {
        const newTaskId = result.data.task_id || result.data.id;
        
        if (pendingFiles.length > 0 && newTaskId) {
          for (const file of pendingFiles) {
            const uploadData = new FormData();
            uploadData.append('file', file);
            uploadData.append('attachable_type', 'task');
            uploadData.append('attachable_id', newTaskId);
            try {
              await apiFetch('/file-attachment/upload', { method: 'POST', body: uploadData });
            } catch (error) {
              console.error('Upload error:', error);
            }
          }
        }

        alert(t('addtask.alert_success'));
        handleReset();
        setPendingFiles([]);
        navigate('/tasks');
      } else {
        alert(t('addtask.alert_error') + result.message);
      }
    } catch (err) {
      console.error("Error creating task", err);
      alert(err.message || "An unexpected error occurred. Please try again.");
    }
  };

  const addAssignee = (personId) => {
    const user = allUsers.find(u => u.person_id.toString() === personId.toString() || u.name === personId);
    if (user && !formData.assignees.some(a => a.name === user.name)) {
      setFormData({
        ...formData,
        assignees: [...formData.assignees, { name: user.name, role: 'assignee', person_id: user.person_id }]
      });
    }
  };

  const updateAssigneeRole = (personIdOrName, role) => {
    setFormData({
      ...formData,
      assignees: formData.assignees.map(a => 
        (a.person_id?.toString() === personIdOrName.toString() || a.name === personIdOrName) 
        ? { ...a, role } 
        : a
      )
    });
  };

  const removeAssignee = (personIdOrName) => {
    setFormData({ 
      ...formData, 
      assignees: formData.assignees.filter(a => {
        if (a.isLocked) return true;
        return !(a.person_id?.toString() === personIdOrName.toString() || a.name === personIdOrName);
      }) 
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <BackButton className="mb-6" />
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight" data-customizable-id="add-task-title" data-customizable-type="text">{t('addtask.title')}</h1>
        <p className="text-gray-500 mt-2 text-sm sm:text-base" data-customizable-id="add-task-subtitle" data-customizable-type="text">{t('addtask.subtitle')}</p>
      </div>

      {/* Task Definition Section */}
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/40 border border-gray-100/80 p-8 md:p-10 transition-all duration-300 hover:shadow-2xl hover:shadow-gray-200/50">
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
          <div className="flex gap-4 w-full bg-[#f8fafc] p-2 rounded-2xl border border-gray-100 shadow-inner">
            {['Low', 'Medium', 'High'].map((level) => {
              const isActive = formData.priority === level;
              let activeClass = '';
              let inactiveClass = 'text-gray-400 hover:text-gray-600 bg-transparent hover:bg-white/60';
              let icon = null;

              if (level === 'Low') {
                activeClass = 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-200/50';
                icon = <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-emerald-500'}`}></span>;
              } else if (level === 'Medium') {
                activeClass = 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-200/50';
                icon = <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-amber-500'}`}></span>;
              } else {
                activeClass = 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-200/50';
                icon = <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-rose-500'}`}></span>;
              }

              const labelText = level === 'High' ? t('addtask.priority_high') : level === 'Medium' ? t('addtask.priority_medium') : t('addtask.priority_low');

              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: level })}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-6 text-xs font-bold rounded-xl border border-transparent transition-all duration-300 cursor-pointer select-none transform ${isActive 
                    ? `${activeClass} scale-[1.01]` 
                    : `${inactiveClass}`
                  }`}
                >
                  {icon}
                  {labelText}
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
                  <div className={`w-1 h-8 rounded-full ${st.priority === 'High' ? 'bg-red-500' : st.priority === 'Medium' ? 'bg-amber-500' : 'bg-green-500'}`}></div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{st.title}</p>
                    <p className="text-[11px] text-gray-400 line-clamp-1">{st.description || t('addtask.no_description')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span 
                    data-custom-component={`TaskPriority-${st.priority}`}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider border ${st.priority === 'High' ? 'bg-red-50 text-red-600' :
                      st.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
                    }`}
                  >
                    {st.priority === 'High' ? t('addtask.priority_high') : st.priority === 'Medium' ? t('addtask.priority_medium') : t('addtask.priority_low')}
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
  )
}