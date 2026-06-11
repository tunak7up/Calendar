import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilSquareIcon, 
  CheckCircleIcon, 
  XMarkIcon, 
  MagnifyingGlassIcon,
  ChevronDownIcon,
  SparklesIcon,
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline';
import { presetReasonService } from '../../services/presetReasonService';
import Button from '../../components/Button';
import { useTranslation } from 'react-i18next';

export default function AdminPresetReasons() {
  const { t, i18n } = useTranslation();
  const [reasons, setReasons] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'leave', 'exception'
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReason, setEditingReason] = useState(null);

  // Form states for Modal
  const [formData, setFormData] = useState({
    type: 'leave',
    vi: '',
    en: '',
    isActive: true
  });

  const loadReasons = async () => {
    try {
      const res = await presetReasonService.getAll();
      if (res.success && Array.isArray(res.data)) {
        setReasons(res.data);
      }
    } catch (err) {
      console.error('Error loading preset reasons:', err);
    }
  };

  // Load reasons on mount
  useEffect(() => {
    loadReasons();
  }, []);

  // Set page title for SEO
  useEffect(() => {
    document.title = `${t('nav.logo')} - ${i18n.language === 'vi' ? 'Quản lý lý do mẫu' : 'Preset Reasons Management'}`;
  }, [t, i18n.language]);

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await presetReasonService.update(id, { isActive: !currentStatus });
      await loadReasons();
    } catch (err) {
      console.error('Error toggling preset reason active status:', err);
    }
  };

  const handleDelete = async (id, viText) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa lý do: "${viText}" không?`)) {
      try {
        await presetReasonService.delete(id);
        await loadReasons();
      } catch (err) {
        console.error('Error deleting preset reason:', err);
      }
    }
  };

  const handleOpenAddModal = () => {
    setEditingReason(null);
    setFormData({
      type: 'leave',
      vi: '',
      en: '',
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (reason) => {
    setEditingReason(reason);
    setFormData({
      type: reason.type,
      vi: reason.vi,
      en: reason.en,
      isActive: reason.isActive
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.vi.trim() || !formData.en.trim()) {
      alert('Vui lòng điền đầy đủ nội dung bằng tiếng Việt và tiếng Anh!');
      return;
    }

    const payload = {
      type: formData.type,
      vi: formData.vi.trim(),
      en: formData.en.trim(),
      isActive: formData.isActive
    };

    try {
      if (editingReason) {
        await presetReasonService.update(editingReason.id, payload);
      } else {
        await presetReasonService.create(payload);
      }
      setIsModalOpen(false);
      await loadReasons();
    } catch (err) {
      console.error('Error saving preset reason:', err);
      alert('Đã xảy ra lỗi khi lưu lý do mẫu!');
    }
  };

  // Filter and Search logic
  const filteredReasons = useMemo(() => {
    return reasons.filter(reason => {
      // 1. Filter by Tab
      if (activeTab !== 'all' && reason.type !== activeTab) {
        return false;
      }
      // 2. Filter by Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const viMatch = reason.vi.toLowerCase().includes(query);
        const enMatch = reason.en.toLowerCase().includes(query);
        return viMatch || enMatch;
      }
      return true;
    });
  }, [reasons, activeTab, searchQuery]);

  const isVi = i18n.language === 'vi';

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3" data-customizable-id="admin-preset-reasons-title" data-customizable-type="text">
            <span>{isVi ? 'Quản lý lý do mẫu' : 'Preset Reasons Management'}</span>
            <ChatBubbleBottomCenterTextIcon className="w-8 h-8 text-blue-500" />
          </h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base" data-customizable-id="admin-preset-reasons-subtitle" data-customizable-type="text">
            {isVi 
              ? 'Tùy chỉnh danh sách lý do xin nghỉ hoặc đi muộn/về sớm dành cho nhân viên.' 
              : 'Customize the preset reason templates for employee leave or exceptions.'}
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          data-customizable-id="btn-admin-add-preset-reason"
          data-customizable-type="bg"
          className="flex items-center gap-2 px-6 py-2.5 bg-[#0056b3] hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all w-full md:w-auto justify-center"
        >
          <PlusIcon className="w-5 h-5" />
          <span>{isVi ? 'Thêm lý do mới' : 'Add New Reason'}</span>
        </button>
      </div>

      {/* Control Card (Tabs + Search) */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          
          {/* Custom Tabs */}
          <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner w-full md:w-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 md:flex-none px-6 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-[#0056b3] shadow-sm border border-gray-100'
                  : 'text-gray-400 hover:text-gray-600 bg-transparent'
              }`}
            >
              {isVi ? 'Tất cả' : 'All'} ({reasons.length})
            </button>
            <button
              onClick={() => setActiveTab('leave')}
              className={`flex-1 md:flex-none px-6 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'leave'
                  ? 'bg-white text-[#0056b3] shadow-sm border border-gray-100'
                  : 'text-gray-400 hover:text-gray-600 bg-transparent'
              }`}
            >
              {isVi ? 'Nghỉ phép' : 'Leave'} ({reasons.filter(r => r.type === 'leave').length})
            </button>
            <button
              onClick={() => setActiveTab('exception')}
              className={`flex-1 md:flex-none px-6 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'exception'
                  ? 'bg-white text-[#0056b3] shadow-sm border border-gray-100'
                  : 'text-gray-400 hover:text-gray-600 bg-transparent'
              }`}
            >
              {isVi ? 'Đi muộn, về sớm' : 'Exceptions'} ({reasons.filter(r => r.type === 'exception').length})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder={isVi ? 'Tìm kiếm nội dung lý do...' : 'Search reason content...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block pl-9 p-3 outline-none transition-all h-[44px]"
            />
          </div>

        </div>
      </div>

      {/* Reasons Table */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-[20%]">{isVi ? 'Loại' : 'Type'}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-[60%]">{isVi ? 'Nội dung lý do' : 'Reason Content'}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center w-[10%]">{isVi ? 'Trạng thái' : 'Status'}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center w-[10%]">{isVi ? 'Thao tác' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReasons.map((reason) => (
                <tr key={reason.id} className="hover:bg-gray-50/40 transition-colors">
                  <td className="px-6 py-5 whitespace-nowrap">
                    {reason.type === 'leave' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100">
                        {isVi ? 'Nghỉ phép' : 'Leave'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                        {isVi ? 'Đi muộn, về sớm' : 'Exceptions'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-semibold text-gray-800 leading-snug">
                      {isVi ? reason.vi : reason.en}
                    </p>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleToggleActive(reason.id, reason.isActive)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                        reason.isActive ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                      role="switch"
                      aria-checked={reason.isActive}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          reason.isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(reason)}
                        className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
                        title={isVi ? 'Chỉnh sửa lý do' : 'Edit reason'}
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(reason.id, reason.vi)}
                        className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
                        title={isVi ? 'Xóa lý do' : 'Delete reason'}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReasons.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-400 font-semibold">
                    <SparklesIcon className="w-10 h-10 text-gray-300 mx-auto mb-2 animate-bounce" />
                    {isVi ? 'Không tìm thấy lý do mẫu nào phù hợp.' : 'No matching preset reasons found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 text-center">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/40 transition-opacity" onClick={() => setIsModalOpen(false)} />

            {/* Modal content */}
            <div className="relative transform overflow-hidden rounded-3xl bg-white p-8 text-left shadow-2xl transition-all w-full max-w-lg border border-gray-100 z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-black text-gray-900">
                    {editingReason ? 'Chỉnh sửa lý do mẫu' : 'Thêm lý do mẫu mới'}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Cung cấp các thông tin hiển thị của lý do cho nhân viên lựa chọn.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                {/* Type selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                    Loại yêu cầu áp dụng
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'leave' })}
                      className={`py-3 px-4 rounded-2xl text-xs font-bold transition-all border-2 ${
                        formData.type === 'leave'
                          ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm'
                          : 'border-transparent bg-gray-50 text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      Nghỉ phép
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'exception' })}
                      className={`py-3 px-4 rounded-2xl text-xs font-bold transition-all border-2 ${
                        formData.type === 'exception'
                          ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm'
                          : 'border-transparent bg-gray-50 text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      Đi muộn, về sớm
                    </button>
                  </div>
                </div>

                {/* Vietnamese text */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                    Nội dung Tiếng Việt (VI)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: Kẹt xe / Tắc đường..."
                    value={formData.vi}
                    onChange={(e) => setFormData({ ...formData, vi: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-gray-700 font-medium text-sm"
                  />
                </div>

                {/* English text */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                    Nội dung Tiếng Anh (EN)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: Traffic jam..."
                    value={formData.en}
                    onChange={(e) => setFormData({ ...formData, en: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-gray-700 font-medium text-sm"
                  />
                </div>

                {/* Status Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div>
                    <span className="text-xs font-bold text-gray-700 block">Kích hoạt sử dụng</span>
                    <span className="text-[10px] text-gray-400">Cho phép nhân viên nhìn thấy lý do này khi gửi yêu cầu.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {/* Submit buttons */}
                <div className="pt-4 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsModalOpen(false)}
                    className="py-2.5 px-5"
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="submit"
                    className="py-2.5 px-6 font-bold"
                  >
                    {editingReason ? 'Cập nhật' : 'Thêm mới'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
