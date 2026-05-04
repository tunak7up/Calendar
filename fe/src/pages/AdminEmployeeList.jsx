import React, { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  CheckCircleIcon,
  XCircleIcon,
  PencilSquareIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

export default function AdminEmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'employee',
    status: true
  });

  const fetchEmployees = () => {
    setLoading(true);
    fetch('http://localhost:3000/api/person')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEmployees(data.data);
        }
      })
      .catch(error => console.error("Error fetching employees:", error))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const openModal = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        name: user.name,
        username: user.username,
        password: '', // Don't prefill password for security, leave blank unless changing
        role: user.role || 'employee',
        status: user.status
      });
    } else {
      setSelectedUser(null);
      setFormData({
        name: '',
        username: '',
        password: '',
        role: 'employee',
        status: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = selectedUser 
        ? `http://localhost:3000/api/person/${selectedUser.person_id}` 
        : 'http://localhost:3000/api/person';
      
      const method = selectedUser ? 'PUT' : 'POST';
      
      // Remove password from payload if it's empty (during edit)
      const payload = { ...formData };
      if (selectedUser && !payload.password) {
        delete payload.password;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchEmployees();
      } else {
        const err = await res.json();
        alert('Failed to save: ' + err.message);
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error saving user');
    }
  };

  return (
    <div className="flex-1 p-8 sm:ml-64 pt-[80px] bg-[#f1f4f8] min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Employees</h1>
            <p className="text-gray-500 mt-1">Manage personnel and roles</p>
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0056b3] hover:bg-[#004494] text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Add User
            </button>
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-gray-400" />
              <span className="font-bold text-gray-700">{employees.length} Total</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">ID</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Employee Name</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Username</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Role</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-gray-400">Loading employees...</td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-gray-400">No employees found.</td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.person_id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="py-4 px-6 text-sm font-semibold text-gray-500">#{emp.person_id}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            alt={emp.name}
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=101c23&color=12a4d9&rounded=true&size=40`}
                            className="h-10 w-10 rounded-full border-2 border-white shadow-sm"
                          />
                          <span className="text-sm font-bold text-gray-900">{emp.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600 font-medium">{emp.username}</td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold uppercase tracking-wider">
                          {emp.role || 'Employee'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {emp.status ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-100">
                            <CheckCircleIcon className="w-4 h-4" /> Active
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-bold border border-red-100">
                            <XCircleIcon className="w-4 h-4" /> Inactive
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => openModal(emp)}
                          className="p-1.5 bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors border border-gray-200 hover:border-blue-200"
                          title="Edit User"
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">
                {selectedUser ? 'Edit User' : 'Add New User'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Password {selectedUser && <span className="text-gray-400 font-normal">(Leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  required={!selectedUser}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="status"
                  checked={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="status" className="text-sm font-bold text-gray-700">Active Account</label>
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold text-white bg-[#0056b3] hover:bg-[#004494] rounded-xl transition-colors shadow-md shadow-blue-500/20"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
