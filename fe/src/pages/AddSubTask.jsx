import React, { useState } from 'react';
import { 
  PlusIcon, 
  ArrowLeftIcon,
  InformationCircleIcon,
  CalendarDaysIcon,
  UserIcon,
  FlagIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import Button from '../components/Button';

export default function AddSubTask({ parentTask, onBack }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      parent_id: parentTask.task_id,
      assigner_id: parentTask.assigner_id,
      start_time: parentTask.start_time,
      due_date: parentTask.due_date,
      status: 'pending'
    };

    try {
      const response = await fetch('http://localhost:3000/api/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();
      if (result.success) {
        alert('Sub-task created successfully!');
        onBack();
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error creating sub-task:', error);
      alert('Failed to connect to server');
    }
  };

  return (
    <div className="flex-1 p-8 sm:ml-64 pt-[80px] bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={onBack}
            className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4 group"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Task
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
              <PlusIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Add New Sub-task</h1>
              <p className="text-gray-500 text-sm mt-0.5">Define detailed steps for the parent task</p>
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
                    Sub-task Title
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g., Prepare financial statements"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-gray-700 font-medium"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                    Description
                  </label>
                  <textarea
                    rows="4"
                    placeholder="Provide details about what needs to be done..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-gray-700 resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                    Priority Level
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Low', 'Medium', 'High'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({ ...formData, priority: p })}
                        className={`py-3 px-4 rounded-2xl text-sm font-bold transition-all border-2 ${
                          formData.priority === p 
                            ? (p === 'High' ? 'border-red-500 bg-red-50 text-red-600' : 
                               p === 'Medium' ? 'border-amber-500 bg-amber-50 text-amber-600' : 
                               'border-green-500 bg-green-50 text-green-600')
                            : 'border-transparent bg-gray-50 text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full py-4 text-lg">
                    Create Sub-task
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar - Parent Task Info (Fixed) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <InformationCircleIcon className="w-24 h-24" />
              </div>
              
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 px-1">
                Parent Context
              </h3>

              <div className="space-y-6 relative z-10">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                    <DocumentTextIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Parent Task</div>
                    <div className="text-sm font-bold text-gray-900 leading-snug">{parentTask.title || parentTask.name}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Assigner</div>
                    <div className="text-sm font-bold text-gray-900">{parentTask.assigner || 'N/A'}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-50 rounded-xl text-green-600">
                    <CalendarDaysIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Schedule Period</div>
                    <div className="text-[13px] font-bold text-gray-900 mt-1">
                      {new Date(parentTask.start_time).toLocaleDateString()} - {new Date(parentTask.due_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                <p className="text-[11px] text-blue-600 font-medium leading-relaxed italic">
                  Note: Sub-task schedule and assigner are synchronized with the parent task.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
