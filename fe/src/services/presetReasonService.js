const DEFAULT_PRESET_REASONS = [
  // Leave reasons
  { id: 'l1', type: 'leave', vi: 'Nghỉ ốm / Đi khám bệnh', en: 'Sick leave / Doctor appointment', isActive: true },
  { id: 'l2', type: 'leave', vi: 'Giải quyết việc riêng / Gia đình có việc', en: 'Personal / Family issues', isActive: true },
  { id: 'l3', type: 'leave', vi: 'Nghỉ phép thường niên', en: 'Annual leave', isActive: true },
  { id: 'l4', type: 'leave', vi: 'Nghỉ học / Bận thi cử', en: 'Study / Exam leave', isActive: true },
  { id: 'l5', type: 'leave', vi: 'Sự cố gia đình khẩn cấp', en: 'Family emergency', isActive: true },

  // Exception reasons
  { id: 'e1', type: 'exception', vi: 'Kẹt xe / Tắc đường', en: 'Traffic jam', isActive: true },
  { id: 'e2', type: 'exception', vi: 'Sự cố xe cộ / Hỏng phương tiện', en: 'Vehicle breakdown', isActive: true },
  { id: 'e3', type: 'exception', vi: 'Khám bệnh đột xuất', en: 'Sudden doctor visit', isActive: true },
  { id: 'e4', type: 'exception', vi: 'Thời tiết xấu (Mưa bão, ngập lụt)', en: 'Severe weather (Heavy rain, flooding)', isActive: true },
  { id: 'e5', type: 'exception', vi: 'Gặp đối tác / Khách hàng đột xuất', en: 'Sudden client / Partner meeting', isActive: true },
  { id: 'e6', type: 'exception', vi: 'Giải quyết thủ tục hành chính khẩn cấp', en: 'Urgent administrative procedures', isActive: true },
];

export const presetReasonService = {
  getAll: () => {
    const data = localStorage.getItem('preset_reasons');
    if (!data) {
      localStorage.setItem('preset_reasons', JSON.stringify(DEFAULT_PRESET_REASONS));
      return DEFAULT_PRESET_REASONS;
    }
    try {
      return JSON.parse(data);
    } catch {
      localStorage.setItem('preset_reasons', JSON.stringify(DEFAULT_PRESET_REASONS));
      return DEFAULT_PRESET_REASONS;
    }
  },
  
  getByType: (type) => {
    const all = presetReasonService.getAll();
    return all.filter(r => r.type === type && r.isActive);
  },

  saveAll: (reasons) => {
    localStorage.setItem('preset_reasons', JSON.stringify(reasons));
  },

  create: (reason) => {
    const all = presetReasonService.getAll();
    const newReason = {
      ...reason,
      id: 'r_' + Date.now()
    };
    all.push(newReason);
    presetReasonService.saveAll(all);
    return newReason;
  },

  update: (id, updatedFields) => {
    const all = presetReasonService.getAll();
    const index = all.findIndex(r => r.id === id);
    if (index !== -1) {
      all[index] = { ...all[index], ...updatedFields };
      presetReasonService.saveAll(all);
      return all[index];
    }
    return null;
  },

  delete: (id) => {
    const all = presetReasonService.getAll();
    const filtered = all.filter(r => r.id !== id);
    presetReasonService.saveAll(filtered);
    return true;
  }
};
