import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { presetReasonService } from '../../../../services/presetReasonService';

export function useAdminPresetReasons() {
  const { t, i18n } = useTranslation();
  const [reasons, setReasons] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReason, setEditingReason] = useState(null);

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

  useEffect(() => {
    loadReasons();
  }, []);

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

  const filteredReasons = useMemo(() => {
    return reasons.filter(reason => {
      if (activeTab !== 'all' && reason.type !== activeTab) {
        return false;
      }
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

  return {
    t,
    isVi,
    reasons,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    isModalOpen,
    setIsModalOpen,
    editingReason,
    formData,
    setFormData,
    handleToggleActive,
    handleDelete,
    handleOpenAddModal,
    handleOpenEditModal,
    handleSave,
    filteredReasons
  };
}
