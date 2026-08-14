import React from 'react';
import {
  UsersIcon,
  XCircleIcon,
  PencilSquareIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import CustomSelect from '../../../components/CustomSelect';
import { useAdminEmployeeList } from './hooks/useAdminEmployeeList';

export default function AdminEmployeeList() {
  const {
    t,
    employees,
    loading,
    isModalOpen,
    setIsModalOpen,
    selectedUser,
    formData,
    setFormData,
    navigate,
    openModal,
    handleSave,
    handleInlineUpdate
  } = useAdminEmployeeList();

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{t('employees.title')}</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">{t('employees.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2 flex-1 md:flex-none justify-center">
            <UsersIcon className="w-5 h-5 text-gray-400" />
            <span className="font-bold text-gray-700">{employees.length}</span>
            <span className="text-gray-500 text-sm">{t('employees.total')}</span>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 bg-[#0056b3] hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex-1 md:flex-none justify-center text-center whitespace-nowrap"
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>{t('employees.add_btn')}</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-100 shadow-sm rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:table-cell">{t('employees.col_id')}</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">{t('employees.col_name')}</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest hidden md:table-cell">{t('employees.col_email')}</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:table-cell">{t('employees.col_username')}</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest hidden lg:table-cell">{t('employees.col_company_card', { defaultValue: 'Mã thẻ' })}</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">{t('employees.col_role')}</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-center hidden sm:table-cell">{t('employees.col_status')}</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">{t('employees.col_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-gray-400">{t('employees.loading')}</td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-gray-400">{t('employees.empty')}</td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr
                    key={emp.person_id}
                    className="hover:bg-blue-50/30 transition-colors"
                  >
                    <td className="py-4 px-6 text-sm font-semibold text-gray-500 hidden sm:table-cell">#{emp.person_id}</td>
                    <td
                      className="py-4 px-6 cursor-pointer group"
                      onClick={() => navigate(`/profile/${emp.person_id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          alt={emp.name}
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=101c23&color=12a4d9&rounded=true&size=40`}
                          className="hidden sm:block h-10 w-10 rounded-full border-2 border-white shadow-sm"
                        />
                        <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{emp.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600 font-medium hidden md:table-cell">{emp.email || <span className="text-gray-400 font-normal italic">{t('employees.email_not_updated')}</span>}</td>
                    <td className="py-4 px-6 text-sm text-gray-600 font-medium hidden sm:table-cell">{emp.username}</td>
                    <td className="py-4 px-6 text-sm text-gray-600 font-mono font-medium hidden lg:table-cell">{emp.company_card || '--'}</td>
                    <td className="py-4 px-6">
                      <CustomSelect
                        value={emp.role || 'employee'}
                        onChange={(val) => handleInlineUpdate(emp.person_id, 'role', val)}
                        options={[
                          { value: 'employee', label: t('employees.role_employee') },
                          { value: 'manager', label: t('employees.role_manager') },
                          ...(emp.role === 'admin' ? [{ value: 'admin', label: 'Admin' }] : [])
                        ]}
                        buttonClassName="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border-transparent"
                        activeOptionClassName="bg-gray-100 text-gray-950 font-black"
                      />
                    </td>
                    <td className="py-4 px-6 text-center hidden sm:table-cell">
                      <CustomSelect
                        value={emp.status}
                        onChange={(val) => handleInlineUpdate(emp.person_id, 'status', val)}
                        options={[
                          { value: true, label: t('employees.status_active') },
                          { value: false, label: t('employees.status_locked') }
                        ]}
                        buttonClassName={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold border ${emp.status
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                          : 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100'
                        }`}
                        activeOptionClassName={emp.status ? 'bg-emerald-100 text-emerald-900 font-black' : 'bg-red-100 text-red-900 font-black'}
                      />
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(emp);
                        }}
                        className="p-2 hover:bg-blue-50 text-[#0056b3] rounded-lg transition-colors inline-flex items-center justify-center"
                        title={t('employees.edit_tooltip')}
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">
                {selectedUser ? t('employees.edit_title') : t('employees.modal_title')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4" autoComplete="off">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t('employees.field_name')}</label>
                <input
                  type="text"
                  required
                  name="user_name_input"
                  autoComplete="off"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('employees.name_placeholder')}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t('employees.field_username')}</label>
                <input
                  type="text"
                  required
                  name="user_username_input"
                  autoComplete="off"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder={t('employees.username_placeholder')}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t('employees.field_email')}</label>
                <input
                  type="email"
                  name="user_email_input"
                  autoComplete="off"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t('employees.email_placeholder')}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {t('employees.field_company_card', { defaultValue: 'Mã thẻ công ty' })}
                </label>
                <input
                  type="text"
                  name="user_company_card_input"
                  autoComplete="off"
                  value={formData.company_card}
                  onChange={(e) => setFormData({ ...formData, company_card: e.target.value })}
                  placeholder={t('employees.company_card_placeholder', { defaultValue: 'Nhập mã thẻ công ty' })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {t('employees.field_password')} {selectedUser && <span className="text-gray-400 font-normal">{t('employees.field_password_hint')}</span>}
                </label>
                <input
                  type="password"
                  name="user_password_input"
                  autoComplete="new-password"
                  required={!selectedUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={selectedUser ? t('employees.field_password_placeholder_edit') : t('employees.field_password_placeholder_new')}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t('employees.field_role')}</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer"
                >
                  <option value="employee">{t('employees.role_employee')}</option>
                  <option value="manager">{t('employees.role_manager')}</option>
                  {formData.role === 'admin' && <option value="admin">Admin</option>}
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
                <label htmlFor="status" className="text-sm font-bold text-gray-700">{t('employees.field_active')}</label>
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  {t('employees.btn_cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold text-white bg-[#0056b3] hover:bg-[#004494] rounded-xl transition-colors shadow-md shadow-blue-500/20"
                >
                  {t('employees.btn_save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
