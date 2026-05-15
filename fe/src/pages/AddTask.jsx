import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../services/api';
import {
  CloudArrowUpIcon,
  XMarkIcon,
  PlusIcon,
  CalendarDaysIcon,
  ListBulletIcon,
  UserGroupIcon,
  ClockIcon,
  ChevronDownIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useLocation, useNavigate } from 'react-router-dom';
import { taskService } from '../services/taskService';
import MiniCalendar from '../components/MiniCalendar';
import SubTaskModal from '../components/SubTaskModal';
import WheelTimePicker from '../components/WheelTimePicker';
import ParticipantManager from '../components/ParticipantManager';

export default function AddTask() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialDateFromState = location.state?.date;

  const initialState = {
    taskName: '',
    description: '',
    startDate: initialDateFromState || new Date().toISOString().split('T')[0],
    startTime: '08:30',
    dueDate: initialDateFromState || new Date().toISOString().split('T')[0],
    endTime: '17:30',
    assigner: '',
    priority: 'Medium',
    subTasks: [],
    assignees: location.state?.assignee ? [location.state.assignee] : [] // Objects: { name, role }
  };

  const [formData, setFormData] = useState(initialState);
  const [isSubTaskModalOpen, setIsSubTaskModalOpen] = useState(false);
  const [managers, setManagers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Popover states
  const [isStartCalOpen, setIsStartCalOpen] = useState(false);
  const [isDueCalOpen, setIsDueCalOpen] = useState(false);
  const [isStartTimeOpen, setIsStartTimeOpen] = useState(false);
  const [isEndTimeOpen, setIsEndTimeOpen] = useState(false);

  const startCalRef = useRef(null);
  const dueCalRef = useRef(null);
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const result = await apiFetch('/person');

        if (result.success && Array.isArray(result.data)) {
          const persons = result.data;
          const managersList = persons.filter(p => p.role === 'manager');
          setManagers(managersList);
          setAllUsers(persons);

          if (managersList.length > 0) {
            setFormData(prev => ({ ...prev, assigner: managersList[0].name }));
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (startCalRef.current && !startCalRef.current.contains(event.target)) setIsStartCalOpen(false);
      if (dueCalRef.current && !dueCalRef.current.contains(event.target)) setIsDueCalOpen(false);
      if (startTimeRef.current && !startTimeRef.current.contains(event.target)) setIsStartTimeOpen(false);
      if (endTimeRef.current && !endTimeRef.current.contains(event.target)) setIsEndTimeOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReset = () => {
    setFormData({
      ...initialState,
      assigner: managers.length > 0 ? managers[0].name : ''
    });
  };

  const handleSubmit = async () => {
    try {
      // Find assigner_id from managers list
      const assignerUser = managers.find(m => m.name === formData.assigner);
      const assigner_id = assignerUser ? assignerUser.person_id : null;

      // Map participants to participant_id
      const task_participants = formData.assignees.map(a => {
        const p = allUsers.find(u => u.name === a.name);
        return {
          participant_id: p ? p.person_id : null,
          role: a.role.charAt(0).toUpperCase() + a.role.slice(1) // Capitalize: assignee -> Assignee
        };
      }).filter(p => p.participant_id !== null);

      // Prepare sub_tasks with default status
      const sub_tasks = formData.subTasks.map(st => ({
        ...st,
        status: 'pending',
        priority: st.priority.toLowerCase()
      }));

      // Format times
      // Format dates to ISO string for better compatibility
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
        alert('Đã tạo công việc và các công việc con thành công!');
        handleReset();
        navigate('/tasks');
      } else {
        alert('Lỗi: ' + result.message);
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
      assignees: formData.assignees.filter(a => 
        !(a.person_id?.toString() === personIdOrName.toString() || a.name === personIdOrName)
      ) 
    });
  };



  return (
    <div className="space-y-6 pb-20">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Quay lại
        </button>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Thêm công việc mới</h1>
        <p className="text-gray-500 mt-2 text-sm sm:text-base">Cấu hình các tham số và người thực hiện cho mục tiêu hoạt động mới.</p>
      </div>

      {/* Task Definition Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-800 mb-5 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
          Định nghĩa công việc
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Tên công việc</label>
            <input
              type="text"
              placeholder="ví dụ: Ra mắt chiến dịch Marketing quý 3"
              value={formData.taskName}
              onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
              className="w-full bg-[#f8fafc] border border-gray-100 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 block p-3.5 outline-none transition-all placeholder:text-gray-300"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Người giao (Quản lý)</label>
            <div className="relative">
              <select
                value={formData.assigner}
                onChange={(e) => setFormData({ ...formData, assigner: e.target.value })}
                className="w-full bg-[#f8fafc] border border-gray-100 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 block p-3.5 outline-none appearance-none cursor-pointer transition-all"
              >
                {managers.map(admin => (
                  <option key={admin.person_id} value={admin.name}>{admin.name}</option>
                ))}
                {managers.length === 0 && <option value="">Không tìm thấy quản lý nào</option>}
              </select>
              <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Mô tả</label>
          <textarea
            placeholder="Nhập mô tả công việc..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows="3"
            className="w-full bg-[#f8fafc] border border-gray-100 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 block p-3.5 outline-none transition-all placeholder:text-gray-300 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Start Date & Time */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Thời gian bắt đầu</label>
            <div className="grid grid-cols-5 gap-2">
              <div className="col-span-3 relative" ref={startCalRef}>
                <div
                  onClick={() => setIsStartCalOpen(!isStartCalOpen)}
                  className="w-full bg-[#f8fafc] border border-gray-100 text-gray-900 text-sm rounded-xl p-3.5 pl-11 outline-none transition-all cursor-pointer hover:border-blue-200"
                >
                  <CalendarDaysIcon className="w-5 h-5 text-blue-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <span className="font-medium">{formData.startDate || 'Chọn ngày'}</span>
                </div>
                {isStartCalOpen && (
                  <div className="absolute top-full left-0 mt-2 p-4 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] min-w-[280px]">
                    <MiniCalendar
                      selectedDate={formData.startDate}
                      onSelectDate={(date) => {
                        setFormData({ ...formData, startDate: date });
                        setIsStartCalOpen(false);
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="col-span-2 relative" ref={startTimeRef}>
                <div
                  onClick={() => setIsStartTimeOpen(!isStartTimeOpen)}
                  className="w-full bg-[#f8fafc] border border-gray-100 text-gray-900 text-sm rounded-xl p-3.5 pl-11 pr-10 outline-none transition-all appearance-none cursor-pointer hover:border-blue-200 flex items-center justify-between"
                >
                  <span className="font-medium">{formData.startTime || 'Chọn giờ'}</span>
                </div>
                <ClockIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                {isStartTimeOpen && (
                  <div className="absolute top-full right-0 mt-2 z-[100]">
                    <WheelTimePicker
                      value={formData.startTime}
                      onChange={(time) => setFormData({ ...formData, startTime: time })}
                      onClose={() => setIsStartTimeOpen(false)}
                      maxTime={formData.startDate === formData.dueDate ? formData.endTime : undefined}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Due Date & Time */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Hạn chót</label>
            <div className="grid grid-cols-5 gap-2">
              <div className="col-span-3 relative" ref={dueCalRef}>
                <div
                  onClick={() => setIsDueCalOpen(!isDueCalOpen)}
                  className="w-full bg-[#f8fafc] border border-gray-100 text-gray-900 text-sm rounded-xl p-3.5 pl-11 outline-none transition-all cursor-pointer hover:border-blue-200"
                >
                  <CalendarDaysIcon className="w-5 h-5 text-red-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <span className="font-medium">{formData.dueDate || 'Chọn ngày'}</span>
                </div>
                {isDueCalOpen && (
                  <div className="absolute top-full left-0 mt-2 p-4 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] min-w-[280px]">
                    <MiniCalendar
                      selectedDate={formData.dueDate}
                      onSelectDate={(date) => {
                        setFormData({ ...formData, dueDate: date });
                        setIsDueCalOpen(false);
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="col-span-2 relative" ref={endTimeRef}>
                <div
                  onClick={() => setIsEndTimeOpen(!isEndTimeOpen)}
                  className="w-full bg-[#f8fafc] border border-gray-100 text-gray-900 text-sm rounded-xl p-3.5 pl-11 pr-10 outline-none transition-all appearance-none cursor-pointer hover:border-blue-200 flex items-center justify-between"
                >
                  <span className="font-medium">{formData.endTime || 'Chọn giờ'}</span>
                </div>
                <ClockIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                {isEndTimeOpen && (
                  <div className="absolute top-full right-0 mt-2 z-[100]">
                    <WheelTimePicker
                      value={formData.endTime}
                      onChange={(time) => setFormData({ ...formData, endTime: time })}
                      onClose={() => setIsEndTimeOpen(false)}
                      minTime={formData.startDate === formData.dueDate ? formData.startTime : undefined}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Mức độ ưu tiên</label>
          <div className="grid grid-cols-4 gap-3">
            {['Low', 'Medium', 'High'].map((level) => (
              <button
                key={level}
                onClick={() => setFormData({ ...formData, priority: level })}
                className={`py-3 px-4 text-xs font-bold rounded-xl border transition-all ${formData.priority === level
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100'
                  : 'bg-[#f8fafc] text-gray-500 border-gray-100 hover:bg-white hover:border-gray-200'
                  }`}
              >
                {level === 'High' ? 'Cao' : level === 'Medium' ? 'Trung bình' : 'Thấp'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Execution Details Section */}
      <ParticipantManager 
        participants={formData.assignees}
        allUsers={allUsers}
        onAdd={addAssignee}
        onUpdateRole={updateAssigneeRole}
        onRemove={removeAssignee}
      />

      {/* Sub-tasks Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
            Chia nhỏ công việc con
          </h2>
          <button
            type="button"
            onClick={() => setIsSubTaskModalOpen(true)}
            className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Thêm công việc con
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
                    <p className="text-[11px] text-gray-400 line-clamp-1">{st.description || 'Không có mô tả'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${st.priority === 'High' ? 'bg-red-50 text-red-600' :
                    st.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
                    }`}>
                    {st.priority === 'High' ? 'Cao' : st.priority === 'Medium' ? 'Trung bình' : 'Thấp'}
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
              <p className="text-xs text-gray-400 font-bold">Chưa có công việc con nào được thêm</p>
              <p className="text-[10px] text-gray-300 mt-1">Nhấn nút phía trên để bắt đầu chia nhỏ mục tiêu này.</p>
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
          className="text-gray-400 text-sm font-bold hover:text-gray-600 transition-colors px-6 py-3 rounded-xl hover:bg-gray-50"
        >
          Hủy
        </button>
        <button
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-3.5 rounded-xl text-sm font-bold transition-all shadow-xl shadow-blue-100 active:scale-95 flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Tạo công việc
        </button>
      </div>
    </div>
  )
}

