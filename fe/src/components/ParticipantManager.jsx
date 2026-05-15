import React from 'react';
import { UserGroupIcon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

/**
 * ParticipantManager Component
 * 
 * @param {Array} participants - List of current participants { name, role, person_id }
 * @param {Array} allUsers - Full list of users available to be added
 * @param {Function} onAdd - Callback when a new user is selected (receives personId)
 * @param {Function} onUpdateRole - Callback when a role is changed (receives personId, newRole)
 * @param {Function} onRemove - Callback when a user is removed (receives personId)
 * @param {Boolean} showTitle - Whether to show the section title
 */
const ParticipantManager = ({ 
  participants = [], 
  allUsers = [], 
  onAdd, 
  onUpdateRole, 
  onRemove,
  showTitle = true 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {showTitle && (
        <h2 className="text-sm font-semibold text-gray-800 mb-5 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
          Personnel & Accountability
        </h2>
      )}

      <div>
        <div className="flex items-center gap-2 mb-4">
          <UserGroupIcon className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Assignees</h3>
        </div>

        <div className="space-y-3 mb-6">
          {participants.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {participants.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-2xl border border-gray-100 shadow-sm group transition-all hover:border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${p.name}&background=random&color=fff&rounded=true&size=40`} 
                        alt="" 
                        className="w-10 h-10 rounded-xl" 
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-none">{p.name}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-1.5">{p.role || 'Personnel'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={p.role?.toLowerCase() || 'assignee'}
                      onChange={(e) => onUpdateRole(p.person_id || p.name, e.target.value)}
                      className="bg-gray-50 border border-gray-100 text-gray-700 text-[11px] font-bold rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:bg-white transition-colors"
                    >
                      <option value="assignee">Assignee</option>
                      <option value="reviewer">Reviewer</option>
                      <option value="observer">Observer</option>
                    </select>
                    <button
                      onClick={() => onRemove(p.person_id || p.name)}
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
              <p className="text-[10px] text-gray-300 mt-1">Select users from the dropdown below to start collaborating.</p>
            </div>
          )}
        </div>

        <div className="relative">
          <select
            onChange={(e) => {
              if (e.target.value) {
                onAdd(e.target.value);
                e.target.value = "";
              }
            }}
            className="w-full bg-white border border-gray-200 text-gray-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-blue-500 block p-3.5 outline-none appearance-none cursor-pointer transition-all pr-12"
          >
            <option value="">+ Assign new personnel...</option>
            {allUsers
              .filter(u => !participants.some(p => (p.person_id === u.person_id) || (p.name === u.name)))
              .map(user => (
                <option key={user.person_id} value={user.person_id || user.name}>
                  {user.name} ({user.role})
                </option>
              ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantManager;
