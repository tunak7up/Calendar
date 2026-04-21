import React, { useState, useEffect } from 'react';
import { CloudArrowUpIcon, XMarkIcon, PlusIcon, CalendarDaysIcon, ListBulletIcon } from '@heroicons/react/24/outline';

export default function AddTask() {
  const initialState = {
    taskName: '',
    assigner: '',
    startDate: '',
    dueDate: '',
    priority: '',
    subTasks: [],
    assignees: []
  };

  const [formData, setFormData] = useState(initialState);
  const [admins, setAdmins] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/person');
        const data = await response.json();

        const managers = data.filter(p => p.role === 'manager');
        const emps = data.filter(p => p.role === 'employee');

        setAdmins(managers);
        setEmployees(emps);

        // Update initial state with first admin if available
        if (managers.length > 0) {
          setFormData(prev => ({ ...prev, assigner: managers[0].name }));
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleReset = () => {
    setFormData({
      taskName: '',
      assigner: '',
      startDate: '',
      dueDate: '',
      priority: '',
      subTasks: [],
      assignees: []
    });
  };

  const handleSubmit = () => {
    alert(JSON.stringify(formData, null, 2));
  };

  const addSubTask = () => {
    const task = prompt('Enter sub-task name:');
    if (task) {
      setFormData({ ...formData, subTasks: [...formData.subTasks, task] });
    }
  };

  const addAssignee = () => {
    const assignee = prompt('Enter assignee name:');
    if (assignee) {
      setFormData({ ...formData, assignees: [...formData.assignees, assignee] });
    }
  };

  const removeAssignee = (name) => {
    setFormData({ ...formData, assignees: formData.assignees.filter(a => a !== name) });
  };

  return (
    <div className="flex-1 p-8 sm:ml-64 pt-[80px]">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Add New Task</h1>
          <p className="text-gray-500 mt-1">Configure parameters and assignees for the new operational objective.</p>
        </div>

        {/* Task Definition Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-5">Task Definition</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-gray-700 mb-2">Task Name</label>
              <input
                type="text"
                placeholder="e.g., Q3 Marketing Campaign Launch"
                value={formData.taskName}
                onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
                className="w-full bg-[#f8fafc] border-none text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 block p-3 outline-none"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-gray-700 mb-2">Assigner</label>
              <select
                value={formData.assigner}
                onChange={(e) => setFormData({ ...formData, assigner: e.target.value })}
                className="w-full bg-[#f8fafc] border-none text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 block p-3 outline-none appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3e%3cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em' }}
              >
                {admins.map(admin => (
                  <option key={admin.person_id} value={admin.name}>{admin.name}</option>
                ))}
                {admins.length === 0 && <option value="">No admins found</option>}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Start Date</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full bg-[#f8fafc] border-none text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 block pl-10 p-3 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Due Date</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full bg-[#f8fafc] border-none text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 block pl-10 p-3 outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Priority Level</label>
            <div className="grid grid-cols-4 gap-2">
              {['Low', 'Medium', 'High', 'Urgent'].map((level) => (
                <button
                  key={level}
                  onClick={() => setFormData({ ...formData, priority: level })}
                  className={`py-2 px-4 text-sm font-medium rounded-lg border transition-colors ${formData.priority === level
                    ? 'bg-[#edf3fb] text-[#0056b3] border-[#86b7fe]'
                    : 'bg-[#f8fafc] text-gray-500 border-transparent hover:bg-gray-100'
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
          <h2 className="text-sm font-semibold text-gray-800 mb-5">Execution Details</h2>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <ListBulletIcon className="w-5 h-5 text-[#0056b3]" />
              <h3 className="text-sm font-semibold text-gray-800">Sub-tasks</h3>
            </div>

            <div className="space-y-2 mb-3">
              {formData.subTasks.map((task, idx) => (
                <div key={idx} className="bg-[#f8fafc] p-3 rounded-lg text-sm text-gray-700 font-medium">
                  {task}
                </div>
              ))}
            </div>

            <button
              onClick={addSubTask}
              className="flex items-center gap-1 text-[#0056b3] hover:text-[#004494] text-sm font-medium px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Add Sub-task
            </button>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Assignees</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap flex-1 bg-[#f8fafc] p-2 rounded-lg min-h-[48px]">
                {formData.assignees.map((assignee, idx) => (
                  <div key={idx} className="flex items-center gap-1 bg-[#edf3fb] text-[#0056b3] px-3 py-1.5 rounded-md text-sm font-medium">
                    <img src={`https://ui-avatars.com/api/?name=${assignee}&background=random&color=fff&rounded=true&size=20`} alt="" className="w-5 h-5 rounded-full mr-1" />
                    {assignee}
                    <button onClick={() => removeAssignee(assignee)} className="ml-1 hover:text-[#003366]">
                      <XMarkIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <select
                onChange={(e) => {
                  if (e.target.value && !formData.assignees.includes(e.target.value)) {
                    setFormData({ ...formData, assignees: [...formData.assignees, e.target.value] });
                  }
                  e.target.value = "";
                }}
                className="bg-[#0056b3] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#004494] transition-colors h-[48px] appearance-none outline-none cursor-pointer"
              >
                <option value="" className="bg-white text-gray-900">Add Assignee</option>
                {employees.filter(emp => !formData.assignees.includes(emp.name)).map(emp => (
                  <option key={emp.person_id} value={emp.name} className="bg-white text-gray-900">{emp.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Attachments Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-5">Attachments</h2>

          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center bg-[#f8fafc] transition-colors hover:bg-gray-50">
            <div className="bg-[#edf3fb] p-3 rounded-xl mb-4">
              <CloudArrowUpIcon className="w-6 h-6 text-[#0056b3]" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Drag and drop files here</p>
            <p className="text-xs text-gray-500 mb-4">or click to browse from your computer (max 25MB)</p>
            <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
              Select Files
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 pb-8">
          <button
            onClick={handleReset}
            className="text-[#0056b3] text-sm font-medium hover:text-[#004494] transition-colors px-4 py-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-[#0056b3] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#004494] transition-colors shadow-sm"
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}
