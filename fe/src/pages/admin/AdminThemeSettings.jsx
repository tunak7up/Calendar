import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import BackButton from '../../components/BackButton';
import Button from '../../components/Button';
import {
  SparklesIcon,
  ArrowPathIcon,
  CheckIcon,
  PaintBrushIcon,
  Squares2X2Icon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

function hexToRGBA(hex, alpha = 1) {
  if (!hex || hex === 'transparent') return 'transparent';
  if (hex.startsWith('rgba')) return hex;
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function AdminThemeSettings() {
  const { t, i18n } = useTranslation();
  const { theme, loading, updateTheme } = useTheme();

  const [localTheme, setLocalTheme] = useState(null);
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' }); // 'success', 'error', 'loading'
  const [activeTab, setActiveTab] = useState('charts'); // 'charts', 'attendance', 'tasks'
  const [activePage, setActivePage] = useState('dashboard'); // 'dashboard', 'schedule', 'tasks'

  // Initialize local theme editing state once context data is fetched
  useEffect(() => {
    if (theme) {
      // Clone theme object to local state
      const clone = {};
      Object.keys(theme).forEach(key => {
        clone[key] = { ...theme[key] };
      });
      setLocalTheme(clone);
    }
  }, [theme]);

  // Set page title
  useEffect(() => {
    document.title = `${t('nav.logo')} - ${i18n.language === 'vi' ? 'Cài đặt nhãn và màu sắc' : 'Theme Settings'}`;
  }, [t, i18n.language]);

  if (loading || !localTheme) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0056b3]"></div>
        <p className="mt-4 text-[#0056b3] font-bold tracking-tight">{t('reporthistory.loading') || 'Đang tải...'}</p>
      </div>
    );
  }

  const isVi = i18n.language === 'vi';

  const handleFieldChange = (key, field, value) => {
    setLocalTheme(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleResetComponent = (key) => {
    setLocalTheme(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        bg: prev[key].defaultBg,
        text: prev[key].defaultText
      }
    }));
  };

  const handleResetAll = () => {
    if (window.confirm(isVi ? 'Bạn có chắc chắn muốn khôi phục toàn bộ màu mặc định?' : 'Are you sure you want to restore all default colors?')) {
      const reseted = {};
      Object.keys(localTheme).forEach(key => {
        reseted[key] = {
          ...localTheme[key],
          bg: localTheme[key].defaultBg,
          text: localTheme[key].defaultText
        };
      });
      setLocalTheme(reseted);
    }
  };

  const handleSave = async () => {
    setSaveStatus({ type: 'loading', message: isVi ? 'Đang lưu cấu hình...' : 'Saving configurations...' });

    // Map object back to API payload array structure
    const payload = Object.values(localTheme).map(item => ({
      component: item.component,
      label: item.label,
      bg: item.bg,
      text: item.text
    }));

    const result = await updateTheme(payload);
    if (result.success) {
      setSaveStatus({ type: 'success', message: isVi ? 'Đã lưu cài đặt màu sắc và nhãn thành công!' : 'Saved theme and label configurations successfully!' });
      setTimeout(() => setSaveStatus({ type: '', message: '' }), 4000);
    } else {
      setSaveStatus({ type: 'error', message: result.message || (isVi ? 'Lỗi khi cập nhật cài đặt!' : 'Failed to update configurations!') });
    }
  };

  // Helper values for generating live visual previews
  const getVal = (key, field) => localTheme[key]?.[field] || '';

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center">
        <BackButton />
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <span>{isVi ? 'Cài đặt nhãn và màu sắc' : 'Theme Settings'}</span>
          </h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            {isVi
              ? 'Tùy chỉnh tiêu đề hiển thị và phối màu giao diện toàn hệ thống cho cả Admin và User.'
              : 'Customize component labels and brand theme colors across the entire website.'}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={handleResetAll}
            className="flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 hover:bg-gray-50 bg-white text-gray-700 rounded-xl text-sm font-bold shadow-sm transition-all flex-1 md:flex-initial"
          >
            <ArrowPathIcon className="w-5 h-5" />
            <span>{isVi ? 'Mặc định toàn bộ' : 'Reset All Defaults'}</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saveStatus.type === 'loading'}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0056b3] hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex-1 md:flex-initial"
          >
            {saveStatus.type === 'loading' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <CheckIcon className="w-5 h-5" />
            )}
            <span>{isVi ? 'Lưu thay đổi' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Save Notification status */}
      {saveStatus.message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 border text-sm font-semibold transition-all ${saveStatus.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
            saveStatus.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-800' : 'bg-blue-50 border-blue-100 text-blue-800'
          }`}>
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* Sub-page Tabs */}
      <div className="flex border-b border-gray-200 gap-2 sm:gap-4 mb-6 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setActiveTab('charts')}
          className={`py-3 px-4 font-extrabold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${activeTab === 'charts'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          {isVi ? 'Biểu đồ so sánh' : 'Comparison Charts'}
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`py-3 px-4 font-extrabold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${activeTab === 'attendance'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          {isVi ? 'Điểm danh hôm nay' : 'Today\'s Attendance'}
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`py-3 px-4 font-extrabold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${activeTab === 'tasks'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          {isVi ? 'Trạng thái công việc' : 'Task Statuses'}
        </button>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Side: Configuration List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-gray-100 shadow-sm rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-[40%]">{isVi ? 'Cấu phần & Nhãn' : 'Component & Label'}</th>
                    <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-[20%]">{isVi ? 'Màu nền' : 'Background'}</th>
                    <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-[20%]">{isVi ? 'Màu chữ / Border' : 'Text / Border'}</th>
                    <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center w-[20%]">{isVi ? 'Thao tác' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.entries(localTheme)
                    .filter(([key]) => {
                      if (activeTab === 'charts') return key.includes('ChartColor-');
                      if (activeTab === 'attendance') return key.includes('Attendance-');
                      if (activeTab === 'tasks') return key.includes('TaskStatus-');
                      return false;
                    })
                    .map(([key, item]) => (
                      <tr key={key} className="hover:bg-gray-50/20 transition-colors">

                        {/* Name & Friendly Label input */}
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-mono">
                              {key.replace('[data-custom-component="', '').replace('"]', '')}
                            </span>
                            <input
                              type="text"
                              value={item.label}
                              onChange={(e) => handleFieldChange(key, 'label', e.target.value)}
                              className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-gray-700 font-bold text-xs"
                            />
                          </div>
                        </td>

                        {/* Background Color Picker */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={item.bg && item.bg !== 'transparent' && item.bg.startsWith('#') ? item.bg : '#ffffff'}
                              disabled={item.bg === 'transparent'}
                              onChange={(e) => handleFieldChange(key, 'bg', e.target.value)}
                              className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer overflow-hidden p-0 bg-transparent disabled:opacity-40 disabled:cursor-not-allowed"
                            />
                            <input
                              type="text"
                              value={item.bg}
                              onChange={(e) => handleFieldChange(key, 'bg', e.target.value)}
                              className="w-20 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-mono outline-none"
                            />
                          </div>
                        </td>

                        {/* Text Color Picker */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={item.text && item.text.startsWith('#') ? item.text : '#1f2937'}
                              onChange={(e) => handleFieldChange(key, 'text', e.target.value)}
                              className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer overflow-hidden p-0 bg-transparent"
                            />
                            <input
                              type="text"
                              value={item.text}
                              onChange={(e) => handleFieldChange(key, 'text', e.target.value)}
                              className="w-20 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-mono outline-none"
                            />
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => handleResetComponent(key)}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-1 shadow-sm border border-blue-100 hover:scale-105 active:scale-95"
                          >
                            <ArrowPathIcon className="w-3.5 h-3.5" />
                            <span>{isVi ? 'Khôi phục' : 'Reset'}</span>
                          </button>
                        </td>

                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Consolidated Preview Panels */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-[76px]">

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
              <SparklesIcon className="w-5 h-5 text-amber-500" />
              <span>{isVi ? 'Khung xem thử đồng bộ' : 'Consolidated Sandbox Preview'}</span>
            </h3>

            {activeTab === 'tasks' && (
              /* MOCK TASK STATUS PREVIEW */
              <div className="space-y-2">
                <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest px-1">
                  {isVi ? '1. Trạng thái công việc (Task Statuses)' : '1. Task Statuses'}
                </h4>
                <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50 flex flex-col gap-3 shadow-sm">
                  {[
                    { key: '[data-custom-component="TaskStatus-Pending"]', labelKey: 'Pending' },
                    { key: '[data-custom-component="TaskStatus-InProgress"]', labelKey: 'In Progress' },
                    { key: '[data-custom-component="TaskStatus-Completed"]', labelKey: 'Completed' },
                    { key: '[data-custom-component="TaskStatus-Overdue"]', labelKey: 'Overdue' }
                  ].map(item => {
                    const bg = getVal(item.key, 'bg');
                    const text = getVal(item.key, 'text');
                    const label = getVal(item.key, 'label');
                    return (
                      <div key={item.key} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-gray-150 shadow-sm px-4">
                        <span className="text-[11px] font-bold text-gray-500 font-mono">
                          {item.labelKey}
                        </span>
                        <div
                          style={{ backgroundColor: bg, color: text, borderColor: bg === '#ffffff' ? '#e2e8f0' : bg }}
                          className="flex items-center gap-1.5 font-black uppercase tracking-widest rounded-full border px-3 py-1 text-[8.5px] shadow-sm pointer-events-none"
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: text }} />
                          <span>{label.split(' - ')[1] || label}</span>
                          <span className="text-[7px] opacity-60">▼</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'attendance' && (
              /* MOCK ATTENDANCE STATUS PREVIEW */
              <div className="space-y-2">
                <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest px-1">
                  {isVi ? '2. Điểm danh hôm nay (Attendance)' : '2. Today\'s Attendance'}
                </h4>
                <div className="border border-gray-200 rounded-2xl p-4 bg-white flex flex-col gap-3 shadow-sm">
                  {/* Mock Legend Row */}
                  <div className="flex flex-wrap gap-2 text-[8px] font-bold text-gray-500 bg-gray-50 p-2 rounded-xl border border-gray-100 shadow-inner justify-center">
                    {['Attendance-Scheduled', 'Attendance-Unscheduled', 'Attendance-Absent'].map(statusKey => {
                      const key = `[data-custom-component="${statusKey}"]`;
                      const bg = getVal(key, 'bg');
                      const text = getVal(key, 'text');
                      const label = getVal(key, 'label');
                      const cleanLabel = label.split(' - ')[1] || label;
                      return (
                        <div key={statusKey} className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded border" style={{ backgroundColor: bg, borderColor: bg }} />
                          <span style={{ color: text }}>{cleanLabel}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mock Table Rows */}
                  <div className="space-y-1">
                    {[
                      { name: 'tuna', statusKey: 'Attendance-Scheduled', time: '12:50 - --:--' },
                      { name: 'datnguyen', statusKey: 'Attendance-Unscheduled', time: '09:15 - --:--' },
                      { name: 'a Duc', statusKey: 'Attendance-Absent', time: '--:-- - --:--' }
                    ].map(row => {
                      const key = `[data-custom-component="${row.statusKey}"]`;
                      const bg = getVal(key, 'bg');
                      const rowBg = hexToRGBA(bg, 0.15);
                      return (
                        <div
                          key={row.name}
                          style={{ backgroundColor: rowBg }}
                          className="flex justify-between items-center px-4 py-2 rounded-xl border border-gray-100 text-[10.5px] font-bold text-gray-800 shadow-sm"
                        >
                          <span>{row.name}</span>
                          <span className="text-[9px] text-gray-400 font-mono font-medium">{row.time}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'charts' && (
              /* MOCK CHART PREVIEW */
              <div className="space-y-2">
                <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest px-1">{isVi ? '3. Biểu đồ giờ làm việc (Chart Legend & Bars)' : '3. Work Hours Chart Previews'}</h4>
                <div className="border border-gray-250 bg-white rounded-2xl p-4 flex flex-col gap-4 shadow-sm items-center">
                  {/* Mock Chart Legend */}
                  <div className="flex gap-4 p-1.5 rounded-xl bg-gray-50 border border-gray-100 shadow-sm w-full justify-center">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded shadow-sm border border-transparent"
                        style={{ backgroundColor: getVal('[data-custom-component="ChartColor-Registered"]', 'bg') }}
                      />
                      <span className="text-[9px] font-bold text-gray-700">{getVal('[data-custom-component="ChartColor-Registered"]', 'label').split(' - ')[1]}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded shadow-sm border border-transparent"
                        style={{ backgroundColor: getVal('[data-custom-component="ChartColor-Actual"]', 'bg') }}
                      />
                      <span className="text-[9px] font-bold text-gray-700">{getVal('[data-custom-component="ChartColor-Actual"]', 'label').split(' - ')[1]}</span>
                    </div>
                  </div>

                  {/* Mock Chart Bars */}
                  <div className="flex items-end gap-5 h-20 border-b border-l border-gray-200 w-fit px-6 pt-2">
                    <div
                      className="w-6 rounded-t shadow-sm transition-all"
                      style={{
                        height: '60%',
                        backgroundColor: getVal('[data-custom-component="ChartColor-Registered"]', 'bg')
                      }}
                      title={getVal('[data-custom-component="ChartColor-Registered"]', 'label')}
                    />
                    <div
                      className="w-6 rounded-t shadow-sm transition-all"
                      style={{
                        height: '80%',
                        backgroundColor: getVal('[data-custom-component="ChartColor-Actual"]', 'bg')
                      }}
                      title={getVal('[data-custom-component="ChartColor-Actual"]', 'label')}
                    />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
