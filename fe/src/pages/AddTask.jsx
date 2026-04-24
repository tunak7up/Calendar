import React, { useState, useEffect, useRef } from 'react';
import {
  CloudArrowUpIcon,
  XMarkIcon,
  PlusIcon,
  CalendarDaysIcon,
  ListBulletIcon,
  UserGroupIcon,
  ClockIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import MiniCalendar from '../components/MiniCalendar';
import SubTaskModal from '../components/SubTaskModal';

export default function AddTask({ initialDate }) {
  const initialState = {
    taskName: '',
    description: '',
    startDate: initialDate || new Date().toISOString().split('T')[0],
    startTime: '08:30',
    dueDate: initialDate || new Date().toISOString().split('T')[0],
    endTime: '17:30',
    assigner: '',
    priority: 'Medium',
    subTasks: [],
    assignees: [] // Objects: { username, role }
  };

  const [formData, setFormData] = useState(initialState);
  const [isSubTaskModalOpen, setIsSubTaskModalOpen] = useState(false);
  const [managers, setManagers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Popover states
  const [isStartCalOpen, setIsStartCalOpen] = useState(false);
  const [isDueCalOpen, setIsDueCalOpen] = useState(false);

  const startCalRef = useRef(null);
  const dueCalRef = useRef(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/person');
        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          const persons = result.data;
          const managersList = persons.filter(p => p.role === 'manager');
          setManagers(managersList);
          setAllUsers(persons);

          if (managersList.length > 0) {
            setFormData(prev => ({ ...prev, assigner: managersList[0].username }));
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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReset = () => {
    setFormData({
      ...initialState,
      assigner: managers.length > 0 ? managers[0].username : ''
    });
  };

  const handleSubmit = async () => {
    try {
      // Find assigner_id from managers list
      const assignerUser = managers.find(m => m.username === formData.assigner);
      const assigner_id = assignerUser ? assignerUser.person_id : null;

      // Map participants to participant_id
      const task_participants = formData.assignees.map(a => {
        const p = allUsers.find(u => u.username === a.username);
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
      const start_time = `${formData.startDate} ${formData.startTime}:00`;
      const due_date = `${formData.dueDate} ${formData.endTime}:00`;

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

      const response = await fetch('http://localhost:3000/api/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.success) {
        alert('Task and sub-tasks created successfully!');
        handleReset();
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to connect to server');
    }
  };


  const addAssignee = (username) => {
    if (username && !formData.assignees.some(a => a.username === username)) {
      setFormData({
        ...formData,
        assignees: [...formData.assignees, { username, role: 'assignee' }]
      });
    }
  };

  const updateAssigneeRole = (username, role) => {
    setFormData({
      ...formData,
      assignees: formData.assignees.map(a => a.username === username ? { ...a, role } : a)
    });
  };

  const removeAssignee = (username) => {
    setFormData({ ...formData, assignees: formData.assignees.filter(a => a.username !== username) });
  };



  return (
    <div className="flex-1 p-8 sm:ml-64 pt-[80px]">
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Add New Task</h1>
          <p className="text-gray-500 mt-1">Configure parameters and assignees for the new operational objective.</p>
        </div>

        {/* Task Definition Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-5 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
            Task Definition
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Task Name</label>
              <input
                type="text"
                placeholder="e.g., Q3 Marketing Campaign Launch"
                value={formData.taskName}
                onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
                className="w-full bg-[#f8fafc] border border-gray-100 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 block p-3.5 outline-none transition-all placeholder:text-gray-300"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Assigner (Managers)</label>
              <div className="relative">
                <select
                  value={formData.assigner}
                  onChange={(e) => setFormData({ ...formData, assigner: e.target.value })}
                  className="w-full bg-[#f8fafc] border border-gray-100 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 block p-3.5 outline-none appearance-none cursor-pointer transition-all"
                >
                  {managers.map(admin => (
                    <option key={admin.person_id} value={admin.username}>{admin.username}</option>
                  ))}
                  {managers.length === 0 && <option value="">No managers found</option>}
                </select>
                <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Description</label>
            <textarea
              placeholder="Enter task description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              className="w-full bg-[#f8fafc] border border-gray-100 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 block p-3.5 outline-none transition-all placeholder:text-gray-300 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Start Date & Time */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Start Schedule</label>
              <div className="grid grid-cols-5 gap-2">
                <div className="col-span-3 relative" ref={startCalRef}>
                  <div
                    onClick={() => setIsStartCalOpen(!isStartCalOpen)}
                    className="w-full bg-[#f8fafc] border border-gray-100 text-gray-900 text-sm rounded-xl p-3.5 pl-11 outline-none transition-all cursor-pointer hover:border-blue-200"
                  >
                    <CalendarDaysIcon className="w-5 h-5 text-blue-500 absolute left-4 top-1/2 -translate-y-1/2" />
                    <span className="font-medium">{formData.startDate || 'Select date'}</span>
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
                <div className="col-span-2 relative">
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full bg-[#f8fafc] border border-gray-100 text-gray-900 text-sm rounded-xl p-3.5 pl-11 outline-none transition-all"
                  />
                  <ClockIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Due Date & Time */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Due Schedule</label>
              <div className="grid grid-cols-5 gap-2">
                <div className="col-span-3 relative" ref={dueCalRef}>
                  <div
                    onClick={() => setIsDueCalOpen(!isDueCalOpen)}
                    className="w-full bg-[#f8fafc] border border-gray-100 text-gray-900 text-sm rounded-xl p-3.5 pl-11 outline-none transition-all cursor-pointer hover:border-blue-200"
                  >
                    <CalendarDaysIcon className="w-5 h-5 text-red-500 absolute left-4 top-1/2 -translate-y-1/2" />
                    <span className="font-medium">{formData.dueDate || 'Select date'}</span>
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
                <div className="col-span-2 relative">
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full bg-[#f8fafc] border border-gray-100 text-gray-900 text-sm rounded-xl p-3.5 pl-11 outline-none transition-all"
                  />
                  <ClockIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Priority Level</label>
            <div className="grid grid-cols-4 gap-3">
              {['Low', 'Medium', 'High', 'Urgent'].map((level) => (
                <button
                  key={level}
                  onClick={() => setFormData({ ...formData, priority: level })}
                  className={`py-3 px-4 text-xs font-bold rounded-xl border transition-all ${formData.priority === level
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100'
                    : 'bg-[#f8fafc] text-gray-500 border-gray-100 hover:bg-white hover:border-gray-200'
                    }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Execution Details Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-5 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
            Personnel & Accountability
          </h2>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <UserGroupIcon className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Assignees</h3>
            </div>

              <div className="space-y-3 mb-6">
                {formData.assignees.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {formData.assignees.map((assignee, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-2xl border border-gray-100 shadow-sm group transition-all hover:border-blue-200">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img src={`https://ui-avatars.com/api/?username=${assignee.username}&background=random&color=fff&rounded=true&size=40`} alt="" className="w-10 h-10 rounded-xl" />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 leading-none">{assignee.username}</p>
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-1.5">Personnel</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <select
                            value={assignee.role}
                            onChange={(e) => updateAssigneeRole(assignee.username, e.target.value)}
                            className="bg-gray-50 border border-gray-100 text-gray-700 text-xs font-bold rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:bg-white transition-colors"
                          >
                            <option value="assignee">Assignee</option>
                            <option value="reviewer">Reviewer</option>
                            <option value="observer">Observer</option>
                          </select>
                          <button
                            onClick={() => removeAssignee(assignee.username)}
                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <XMarkIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-2xl p-8 text-center">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-3">
                      <UserGroupIcon className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-400 font-bold">No Personnel Assigned</p>
                    <p className="text-xs text-gray-300 mt-1">Select users from the dropdown below to start collaborating.</p>
                  </div>
                )}
              </div>

              <div className="relative">
                <select
                  onChange={(e) => {
                    addAssignee(e.target.value);
                    e.target.value = "";
                  }}
                  className="w-full bg-white border border-gray-200 text-gray-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-blue-500 block p-3.5 outline-none appearance-none cursor-pointer transition-all pr-12"
                >
                  <option value="">+ Assign new personnel...</option>
                  {allUsers.filter(u => !formData.assignees.some(a => a.username === u.username)).map(user => (
                    <option key={user.person_id} value={user.username}>{user.username} ({user.role})</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
        </div>

        {/* Sub-tasks Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              Sub-tasks Breakdown
            </h2>
            <button 
              type="button"
              onClick={() => setIsSubTaskModalOpen(true)}
              className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add Sub-task
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
                      <p className="text-[11px] text-gray-400 line-clamp-1">{st.description || 'No description'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                      st.priority === 'High' ? 'bg-red-50 text-red-600' : 
                      st.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
                    }`}>
                      {st.priority}
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
                <p className="text-xs text-gray-400 font-bold">No sub-tasks added yet</p>
                <p className="text-[10px] text-gray-300 mt-1">Click the button above to start breaking down this objective.</p>
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
            onClick={handleReset}
            className="text-gray-400 text-sm font-bold hover:text-gray-600 transition-colors px-6 py-3 rounded-xl hover:bg-gray-50"
          >
            Cancel & Reset
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-3.5 rounded-xl text-sm font-bold transition-all shadow-xl shadow-blue-100 active:scale-95 flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}

