import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import BackButton from '../../components/BackButton';
import Button from '../../components/Button';
import { 
  SparklesIcon, 
  ArrowPathIcon,
  CheckIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline';

export default function AdminThemeSettings() {
  const { t, i18n } = useTranslation();
  const { theme, loading, updateTheme } = useTheme();
  
  const [localTheme, setLocalTheme] = useState(null);
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' }); // 'success', 'error', 'loading'

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

  // Render individual component preview inline in the config table
  const renderInlinePreview = (key, label, bg, text) => {
    const style = {
      backgroundColor: bg || 'transparent',
      color: text || 'inherit',
      borderColor: (bg && (key.includes('CalendarCard') || key.includes('SidebarBrandIcon') || key.includes('SidebarBackground'))) ? bg : 'transparent'
    };

    switch (key) {
      case '[data-custom-component="Button"]':
        return (
          <button style={style} className="px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:opacity-90 pointer-events-none border border-transparent">
            {label}
          </button>
        );
      case '[data-custom-component="BackButton"]':
        return (
          <button style={style} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-xl text-[10px] font-bold shadow-sm pointer-events-none">
            <span>←</span> <span>{label}</span>
          </button>
        );
      case '[data-custom-component="CustomSelect"]':
        return (
          <div style={style} className="flex items-center justify-between gap-1.5 font-bold border border-gray-150 rounded-lg px-3 py-1.5 text-xs shadow-sm w-36 select-none pointer-events-none">
            <span>{label}</span>
            <span className="text-[8px] opacity-60">▼</span>
          </div>
        );
      case '[data-custom-component="TaskStatusSelect"]':
        return (
          <div style={style} className="flex items-center gap-1.5 font-black uppercase tracking-widest rounded-full border border-transparent px-3 py-1 text-[9px] shadow-sm select-none pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{label}</span>
            <span className="text-[7px] opacity-60">▼</span>
          </div>
        );
      case '[data-custom-component="HeaderNavLink"]':
        return (
          <span style={style} className="font-semibold rounded-md px-3 py-1.5 text-xs select-none border border-transparent">
            {label}
          </span>
        );
      default:
        return (
          <div className="text-gray-400 text-[11px] italic">
            {isVi ? '(Xem trong khung Preview tổng thể)' : '(See in consolidated preview panel)'}
          </div>
        );
    }
  };

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
            <PaintBrushIcon className="w-8 h-8 text-blue-500" />
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
        <div className={`p-4 rounded-2xl flex items-center gap-3 border text-sm font-semibold transition-all ${
          saveStatus.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
          saveStatus.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-800' : 'bg-blue-50 border-blue-100 text-blue-800'
        }`}>
          <span>{saveStatus.message}</span>
        </div>
      )}

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
                    <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center w-[20%]">{isVi ? 'Xem thử & Thao tác' : 'Preview & Reset'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.entries(localTheme).map(([key, item]) => (
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

                      {/* Preview & Action Buttons */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-10 flex items-center justify-center">
                            {renderInlinePreview(key, item.label, item.bg, item.text)}
                          </div>
                          <button
                            onClick={() => handleResetComponent(key)}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-md transition-all flex items-center gap-1"
                          >
                            <ArrowPathIcon className="w-3 h-3" />
                            <span>{isVi ? 'Khôi phục' : 'Reset'}</span>
                          </button>
                        </div>
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

            {/* MOCK SIDEBAR PREVIEW */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest px-1">{isVi ? '1. Thanh điều hướng bên (Sidebar)' : '1. Sidebar Elements'}</h4>
              <div 
                className="border border-gray-200 rounded-2xl p-4 flex flex-col gap-4 shadow-sm"
                style={{ backgroundColor: getVal('[data-custom-component="SidebarBackground"]', 'bg') }}
              >
                {/* Brand icon / name */}
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-sm"
                    style={{ 
                      backgroundColor: getVal('[data-custom-component="SidebarBrandIcon"]', 'bg'),
                      color: getVal('[data-custom-component="SidebarBrandIcon"]', 'text')
                    }}
                  >
                    QT
                  </div>
                  <span 
                    className="text-xs font-black"
                    style={{ color: getVal('[data-custom-component="SidebarBackground"]', 'text') }}
                  >
                    {getVal('[data-custom-component="SidebarBrandIcon"]', 'label')}
                  </span>
                </div>

                {/* Link items */}
                <div className="space-y-1.5">
                  <div 
                    className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
                    style={{ 
                      backgroundColor: getVal('[data-custom-component="SidebarLink-Active"]', 'bg'),
                      color: getVal('[data-custom-component="SidebarLink-Active"]', 'text')
                    }}
                  >
                    <span>📈</span>
                    <span>{getVal('[data-custom-component="SidebarLink-Active"]', 'label')}</span>
                  </div>

                  <div 
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2"
                    style={{ 
                      backgroundColor: getVal('[data-custom-component="SidebarLink-Inactive"]', 'bg'),
                      color: getVal('[data-custom-component="SidebarLink-Inactive"]', 'text')
                    }}
                  >
                    <span>📅</span>
                    <span>{getVal('[data-custom-component="SidebarLink-Inactive"]', 'label')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* MOCK CALENDAR DAYS */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest px-1">{isVi ? '2. Thẻ hiển thị lịch (Calendar Cards)' : '2. Calendar Day Cards'}</h4>
              <div className="border border-gray-150 rounded-2xl p-4 bg-gray-50 flex flex-col gap-2 shadow-inner">
                {/* Day Header */}
                <div className="text-[10px] font-bold text-gray-400 border-b border-gray-200 pb-1.5 flex justify-between">
                  <span>THỨ SÁU (FRI)</span>
                  <span>19/06</span>
                </div>
                
                {/* Card Registered */}
                <div 
                  className="px-3 py-2 rounded-lg text-[10.5px] font-bold border border-l-4 shadow-sm"
                  style={{ 
                    backgroundColor: getVal('[data-custom-component="CalendarCard-registered"]', 'bg'),
                    color: getVal('[data-custom-component="CalendarCard-registered"]', 'text'),
                    borderColor: getVal('[data-custom-component="CalendarCard-registered"]', 'bg')
                  }}
                >
                  {getVal('[data-custom-component="CalendarCard-registered"]', 'label')}
                </div>

                {/* Card Unscheduled */}
                <div 
                  className="px-3 py-2 rounded-lg text-[10.5px] font-bold border border-l-4 shadow-sm"
                  style={{ 
                    backgroundColor: getVal('[data-custom-component="CalendarCard-unscheduled"]', 'bg'),
                    color: getVal('[data-custom-component="CalendarCard-unscheduled"]', 'text'),
                    borderColor: getVal('[data-custom-component="CalendarCard-unscheduled"]', 'bg')
                  }}
                >
                  {getVal('[data-custom-component="CalendarCard-unscheduled"]', 'label')}
                </div>

                {/* Card Individual */}
                <div 
                  className="px-3 py-2 rounded-lg text-[10.5px] font-bold border border-l-4 shadow-sm"
                  style={{ 
                    backgroundColor: getVal('[data-custom-component="CalendarCard-Individual"]', 'bg'),
                    color: getVal('[data-custom-component="CalendarCard-Individual"]', 'text'),
                    borderColor: getVal('[data-custom-component="CalendarCard-Individual"]', 'bg')
                  }}
                >
                  {getVal('[data-custom-component="CalendarCard-Individual"]', 'label')}
                </div>
              </div>
            </div>

            {/* MOCK CHART PREVIEW */}
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
                    <span className="text-[9px] font-bold text-gray-700">{getVal('[data-custom-component="ChartColor-Registered"]', 'label')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="w-3 h-3 rounded shadow-sm border border-transparent"
                      style={{ backgroundColor: getVal('[data-custom-component="ChartColor-Actual"]', 'bg') }}
                    />
                    <span className="text-[9px] font-bold text-gray-700">{getVal('[data-custom-component="ChartColor-Actual"]', 'label')}</span>
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

          </div>

        </div>

      </div>
    </div>
  );
}
