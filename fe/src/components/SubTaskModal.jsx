import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function SubTaskModal({ isOpen, onClose, onAdd }) {
  const [newSubTask, setNewSubTask] = useState({ 
    title: '', 
    description: '', 
    priority: 'Medium' 
  });

  if (!isOpen) return null;

  const handleAdd = () => {
    if (newSubTask.title.trim()) {
      onAdd(newSubTask);
      setNewSubTask({ title: '', description: '', priority: 'Medium' });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">New Sub-task</h3>
            <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-widest">Detail definition</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-8 space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Sub-task Title</label>
            <input 
              type="text" 
              value={newSubTask.title}
              onChange={(e) => setNewSubTask({...newSubTask, title: e.target.value})}
              placeholder="What needs to be done?"
              className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-2xl p-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Priority Level</label>
            <div className="grid grid-cols-3 gap-3">
              {['Low', 'Medium', 'High'].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setNewSubTask({...newSubTask, priority: p})}
                  className={`py-3 rounded-xl text-xs font-bold border-2 transition-all ${
                    newSubTask.priority === p 
                      ? (p === 'High' ? 'border-red-500 bg-red-50 text-red-600' : p === 'Medium' ? 'border-amber-500 bg-amber-50 text-amber-600' : 'border-green-500 bg-green-50 text-green-600')
                      : 'border-transparent bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Description (Optional)</label>
            <textarea 
              rows="3"
              value={newSubTask.description}
              onChange={(e) => setNewSubTask({...newSubTask, description: e.target.value})}
              placeholder="Provide additional context or requirements..."
              className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-2xl p-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all resize-none"
            />
          </div>
        </div>

        <div className="p-8 bg-gray-50/50 flex gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleAdd}
            className="flex-[2] bg-blue-600 text-white py-3.5 rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95"
          >
            Add Sub-task
          </button>
        </div>
      </div>
    </div>
  );
}
