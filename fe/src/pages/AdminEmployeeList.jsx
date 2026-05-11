import React, { useState, useEffect } from 'react';
import {
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilSquareIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { apiFetch } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function AdminEmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'employee',
    status: true
  });

  const fetchEmployees = () => {
    setLoading(true);
    apiFetch('/person')
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
        ? `/person/${selectedUser.person_id}`
        : '/person';

      const method = selectedUser ? 'PUT' : 'POST';

      // Remove password from payload if it's empty (during edit)
      const payload = { ...formData };
      if (selectedUser && !payload.password) {
        delete payload.password;
      }

      const result = await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (result) {
        setIsModalOpen(false);
        fetchEmployees();
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error saving user');
    }
  };

  const handleInlineUpdate = async (person_id, field, value) => {
    try {
      const empToUpdate = employees.find(e => e.person_id === person_id);
      if (!empToUpdate) return;

      const payload = { ...empToUpdate, [field]: value };

      // Optimistic update
      setEmployees(employees.map(e => e.person_id === person_id ? { ...e, [field]: value } : e));

      await apiFetch(`/person/${person_id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Error updating inline:', error);
      fetchEmployees(); // Revert on error
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Personnel Management</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Overview of company staff and access roles</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2 flex-1 md:flex-none justify-center">
            <UsersIcon className="w-5 h-5 text-gray-400" />
            <span className="font-bold text-gray-700">{employees.length}</span>
            <span className="text-gray-500 text-sm">Total staff</span>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#0056b3] hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex-1 md:flex-none justify-center"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-100 shadow-sm rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:table-cell">ID</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Employee Name</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:table-cell">Username</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Role</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-center hidden sm:table-cell">Status</th>
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
                  <tr
                    key={emp.person_id}
                    onClick={() => navigate(`/profile/${emp.person_id}`)}
                    className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                  >
                    <td className="py-4 px-6 text-sm font-semibold text-gray-500 hidden sm:table-cell">#{emp.person_id}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          alt={emp.name}
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=101c23&color=12a4d9&rounded=true&size=40`}
                          className="h-10 w-10 rounded-full border-2 border-white shadow-sm"
                        />
                        <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{emp.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600 font-medium hidden sm:table-cell">{emp.username}</td>
                    <td className="py-4 px-6">
                      <select
                        value={emp.role || 'employee'}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleInlineUpdate(emp.person_id, 'role', e.target.value)}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold uppercase tracking-wider border-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none cursor-pointer hover:bg-gray-200 transition-colors appearance-none"
                      >
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 text-center hidden sm:table-cell">
                      <select
                        value={emp.status ? "true" : "false"}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleInlineUpdate(emp.person_id, 'status', e.target.value === "true")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border outline-none cursor-pointer appearance-none ${emp.status
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100'
                          }`}
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập họ tên..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Tên đăng nhập..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
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
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={selectedUser ? "Để trống nếu không đổi..." : "Nhập mật khẩu..."}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>

                </select>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="status"
                  checked={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
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
