import React, { useState, useEffect, useMemo } from 'react';
import { 
  SparklesIcon,
  CheckCircleIcon,
  XMarkIcon,
  CpuChipIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { aiAgentService } from '../../services/aiAgentService';
import Button from '../../components/Button';
import BackButton from '../../components/BackButton';
import { useTranslation } from 'react-i18next';

const STANDARD_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash'
];

export default function AdminAiAgents() {
  const { t, i18n } = useTranslation();
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    modelName: 'gemini-3.1-flash-lite',
    systemPrompt: ''
  });

  const isVi = i18n.language === 'vi';

  const loadAgents = async () => {
    setLoading(true);
    try {
      const res = await aiAgentService.getAll();
      if (res.success && Array.isArray(res.data)) {
        setAgents(res.data);
      }
    } catch (err) {
      console.error('Error loading AI agents:', err);
      setError(isVi ? 'Không thể tải danh sách AI Agent.' : 'Failed to load AI Agents list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  // SEO Page Title
  useEffect(() => {
    document.title = `${t('nav.logo')} - ${isVi ? 'Cấu hình AI Agent' : 'AI Agent Settings'}`;
  }, [t, isVi]);

  const handleSelectAgent = (agent) => {
    setSelectedAgent(agent);
    const isCustom = !STANDARD_MODELS.includes(agent.modelName || 'gemini-3.1-flash-lite');
    setIsCustomModel(isCustom);
    setFormData({
      name: agent.name,
      description: agent.description || '',
      isActive: agent.isActive,
      modelName: agent.modelName || 'gemini-3.1-flash-lite',
      systemPrompt: agent.systemPrompt
    });
    setSuccessMsg(null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (e, agent) => {
    e.stopPropagation();
    const newStatus = !agent.isActive;
    try {
      const res = await aiAgentService.update(agent.id, {
        isActive: newStatus
      });
      if (res.success) {
        setAgents(prev => prev.map(a => a.id === agent.id ? res.data : a));
        if (selectedAgent && selectedAgent.id === agent.id) {
          setSelectedAgent(res.data);
          setFormData(prev => ({ ...prev, isActive: res.data.isActive }));
        }
      }
    } catch (err) {
      console.error('Error toggling agent status:', err);
      alert(isVi ? 'Lỗi khi thay đổi trạng thái AI Agent!' : 'Failed to toggle AI Agent status!');
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!selectedAgent) return;
    if (!formData.name.trim() || !formData.systemPrompt.trim()) {
      setError(isVi ? 'Vui lòng điền đầy đủ Tên và System Prompt!' : 'Please fill out Name and System Prompt!');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await aiAgentService.update(selectedAgent.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        isActive: formData.isActive,
        modelName: formData.modelName,
        systemPrompt: formData.systemPrompt
      });

      if (res.success) {
        setSuccessMsg(isVi ? 'Đã lưu cấu hình thành công!' : 'Settings saved successfully!');
        // Update list
        setAgents(prev => prev.map(a => a.id === selectedAgent.id ? res.data : a));
        setSelectedAgent(res.data);
      }
    } catch (err) {
      console.error('Error saving AI Agent settings:', err);
      setError(err.message || (isVi ? 'Lỗi khi lưu cấu hình!' : 'Failed to save settings!'));
    } finally {
      setSaving(false);
    }
  };

  // Stats for system prompt
  const wordCount = useMemo(() => {
    return formData.systemPrompt ? formData.systemPrompt.trim().split(/\s+/).filter(Boolean).length : 0;
  }, [formData.systemPrompt]);

  const lineCount = useMemo(() => {
    return formData.systemPrompt ? formData.systemPrompt.split('\n').length : 0;
  }, [formData.systemPrompt]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <ArrowPathIcon className="animate-spin h-10 w-10 text-[#0056b3]" />
          <p className="text-gray-500 font-semibold">{isVi ? 'Đang tải cấu hình AI...' : 'Loading AI configuration...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center">
        <BackButton />
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3" data-customizable-id="admin-ai-agents-title" data-customizable-type="text">
            <span>{isVi ? 'Quản lý AI Agent' : 'AI Agent Management'}</span>
            <SparklesIcon className="w-8 h-8 text-purple-600 animate-pulse" />
          </h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base" data-customizable-id="admin-ai-agents-subtitle" data-customizable-type="text">
            {isVi 
              ? 'Tùy chỉnh vai trò, mô hình Gemini và System Prompt để huấn luyện các trợ lý ảo phục vụ hệ thống.' 
              : 'Customize roles, Gemini models and System Prompt instructions to train your system virtual assistants.'}
          </p>
        </div>
      </div>

      {/* Grid of Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl border border-gray-100 p-12 text-center text-gray-400">
            <CpuChipIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="font-semibold">{isVi ? 'Chưa cấu hình AI Agent nào.' : 'No AI Agents configured.'}</p>
          </div>
        ) : (
          agents.map(agent => (
            <div
              key={agent.id}
              onClick={() => handleSelectAgent(agent)}
              className="bg-white rounded-3xl border border-gray-100 hover:border-purple-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Glow Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              
              <div className="space-y-4 relative z-10">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-2xl ${
                    agent.isActive ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                  } transition-colors group-hover:scale-110 duration-300`}>
                    <CpuChipIcon className="w-6 h-6" />
                  </div>
                  
                  {/* Quick Toggle On/Off Switch */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] font-bold text-gray-400">
                      {agent.isActive ? (isVi ? 'Đang bật' : 'On') : (isVi ? 'Đang tắt' : 'Off')}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleToggleActive(e, agent)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                        agent.isActive ? 'bg-purple-600' : 'bg-gray-200'
                      }`}
                      role="switch"
                      aria-checked={agent.isActive}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          agent.isActive ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-gray-900 group-hover:text-purple-700 transition-colors">
                    {agent.name}
                  </h3>
                  <code className="text-[10px] text-gray-400 font-mono mt-1 block">Code: {agent.code}</code>
                </div>

                <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                  {agent.description || (isVi ? 'Không có mô tả chi tiết cho trợ lý này.' : 'No detailed description for this assistant.')}
                </p>
              </div>

              <div className="border-t border-gray-50 pt-4 mt-5 flex items-center justify-between relative z-10 text-[10px]">
                <div className="text-gray-400 font-semibold">
                  {isVi ? 'Mô hình:' : 'Model:'} <span className="font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md font-bold">{agent.modelName || 'gemini-3.1-flash-lite'}</span>
                </div>
                <span className="text-purple-600 font-bold group-hover:translate-x-1.5 transition-transform flex items-center gap-1">
                  {isVi ? 'Xem cấu hình' : 'Configure'} &rarr;
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Large Edit Modal */}
      {isModalOpen && selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-10 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                  <CpuChipIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">
                    {isVi ? 'Cấu hình chi tiết AI Agent' : 'AI Agent Configuration Details'}
                  </h3>
                  <code className="text-[10px] text-gray-400 font-mono">Code: {selectedAgent.code}</code>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              {/* Success & Error alerts */}
              {successMsg && (
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-100 p-4 rounded-2xl text-xs font-bold transition-all">
                  <CheckCircleIcon className="w-5 h-5 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}
              {error && (
                <div className="flex items-center justify-between bg-red-50 text-red-800 border border-red-100 p-4 rounded-2xl text-xs font-bold transition-all">
                  <div className="flex items-center gap-2">
                    <XMarkIcon className="w-5 h-5 shrink-0 text-red-600" />
                    <span>{error}</span>
                  </div>
                  <button type="button" onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Form Input fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Agent Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                    {isVi ? 'Tên Trợ lý' : 'Assistant Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all text-gray-800 font-bold text-xs"
                  />
                </div>

                {/* Status Toggle Switch */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                    {isVi ? 'Trạng thái hoạt động' : 'Active Status'}
                  </label>
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl h-[46px]">
                    <span className="text-xs font-bold text-gray-700">
                      {formData.isActive ? (isVi ? 'Kích hoạt' : 'Enabled') : (isVi ? 'Tắt' : 'Disabled')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                        formData.isActive ? 'bg-purple-600' : 'bg-gray-200'
                      }`}
                      role="switch"
                      aria-checked={formData.isActive}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          formData.isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Gemini Model & Description */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Gemini Model */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                    {isVi ? 'Mô hình Preferred (AI Model)' : 'Preferred Model (AI Model)'}
                  </label>
                  <select
                    value={isCustomModel ? 'custom' : formData.modelName}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'custom') {
                        setIsCustomModel(true);
                        setFormData(prev => ({ ...prev, modelName: '' }));
                      } else {
                        setIsCustomModel(false);
                        setFormData(prev => ({ ...prev, modelName: val }));
                      }
                    }}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all text-gray-800 font-bold text-xs appearance-none cursor-pointer"
                  >
                    <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Recommended - 500 RPD)</option>
                    <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                    <option value="gemini-3-flash">Gemini 3 Flash</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                    <option value="custom">{isVi ? 'Tự nhập tên mô hình khác...' : 'Enter custom model name...'}</option>
                  </select>
                  {isCustomModel && (
                    <div className="mt-2.5">
                      <input
                        type="text"
                        required
                        placeholder={isVi ? "Ví dụ: gemini-3.0-flash" : "Example: gemini-3.0-flash"}
                        value={formData.modelName}
                        onChange={(e) => setFormData(prev => ({ ...prev, modelName: e.target.value }))}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all text-gray-800 font-mono text-xs font-bold"
                      />
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                    {isVi ? 'Mô tả vai trò' : 'Role Description'}
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={isVi ? 'Nhập mô tả ngắn về vai trò của trợ lý này...' : 'Enter a brief description of this assistant...'}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all text-gray-700 font-semibold text-xs"
                  />
                </div>
              </div>

              {/* System Prompt (Monospace Editor) */}
              <div>
                <div className="flex justify-between items-center mb-2 px-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                    System Instruction / Prompt
                  </label>
                  <div className="text-[10px] text-gray-400 font-semibold flex gap-2">
                    <span>{isVi ? 'Số dòng:' : 'Lines:'} <strong className="text-gray-600 font-mono">{lineCount}</strong></span>
                    <span>{isVi ? 'Số từ:' : 'Words:'} <strong className="text-gray-600 font-mono">{wordCount}</strong></span>
                  </div>
                </div>
                <div className="relative rounded-2xl border border-gray-200 bg-gray-900 overflow-hidden shadow-inner focus-within:ring-4 focus-within:ring-purple-500/10 focus-within:border-purple-500 transition-all">
                  <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-800/80 border-b border-gray-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    <span className="text-[10px] text-gray-500 font-mono ml-2">SYSTEM_PROMPT_CONFIG</span>
                  </div>
                  <textarea
                    required
                    rows="14"
                    value={formData.systemPrompt}
                    onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                    className="w-full px-5 py-4 bg-gray-900 text-gray-100 font-mono text-xs leading-relaxed focus:outline-none resize-y"
                    placeholder="# Role description..."
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
                className="py-2.5 px-5 rounded-2xl cursor-pointer"
              >
                {isVi ? 'Hủy bỏ' : 'Cancel'}
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="py-2.5 px-6 font-extrabold flex items-center justify-center gap-2 bg-[#0056b3] hover:bg-blue-700 shadow-md border-none rounded-2xl min-w-[120px] cursor-pointer text-white"
              >
                {saving ? (
                  <>
                    <ArrowPathIcon className="animate-spin h-4 w-4 text-white" />
                    <span>{isVi ? 'Đang lưu...' : 'Saving...'}</span>
                  </>
                ) : (
                  <span>{isVi ? 'Lưu thay đổi' : 'Save Changes'}</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
