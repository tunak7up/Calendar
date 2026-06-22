import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import BackButton from '../../../components/BackButton';
import ThemeSettingsHeader from './ThemeSettingsHeader';
import ThemeSettingsTabs from './ThemeSettingsTabs';
import ThemeSettingsTable from './ThemeSettingsTable';
import ThemeSettingsPreview from './ThemeSettingsPreview';

export default function AdminThemeSettings() {
  const { t, i18n } = useTranslation();
  const { theme, loading, updateTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const activePage = searchParams.get('page') || 'dashboard';

  const [localTheme, setLocalTheme] = useState(null);
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' }); // 'success', 'error', 'loading'
  const [activeTab, setActiveTab] = useState('charts'); // 'charts', 'attendance', 'status', 'priority', 'schedule'

  // Initialize local theme editing state once context data is fetched
  useEffect(() => {
    if (theme) {
      // Clone theme object to local state
      const clone = {};
      Object.keys(theme).forEach((key) => {
        clone[key] = { ...theme[key] };
      });
      setLocalTheme(clone);
    }
  }, [theme]);

  // Set tab when activePage changes
  useEffect(() => {
    if (activePage === 'dashboard') {
      setActiveTab('charts');
    } else if (activePage === 'schedule') {
      setActiveTab('schedule-admin');
    } else if (activePage === 'tasks') {
      setActiveTab('status');
    }
  }, [activePage]);

  // Set page title
  useEffect(() => {
    document.title = `${t('nav.logo')} - ${t('themesettings.title')}`;
  }, [t, i18n.language]);

  if (loading || !localTheme) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0056b3]"></div>
        <p className="mt-4 text-[#0056b3] font-bold tracking-tight">{t('themesettings.loading')}</p>
      </div>
    );
  }

  const handleFieldChange = (key, field, value) => {
    setLocalTheme((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleResetComponent = (key) => {
    setLocalTheme((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        bg: prev[key].defaultBg,
        text: prev[key].defaultText
      }
    }));
  };

  const handleResetAll = () => {
    if (window.confirm(t('themesettings.btn_reset_all_confirm'))) {
      const reseted = {};
      Object.keys(localTheme).forEach((key) => {
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
    setSaveStatus({ type: 'loading', message: t('themesettings.saving') });

    // Map object back to API payload array structure
    const payload = Object.values(localTheme).map((item) => ({
      component: item.component,
      label: item.label,
      bg: item.bg,
      text: item.text
    }));

    const result = await updateTheme(payload);
    if (result.success) {
      setSaveStatus({ type: 'success', message: t('themesettings.save_success') });
      setTimeout(() => setSaveStatus({ type: '', message: '' }), 4000);
    } else {
      setSaveStatus({ type: 'error', message: result.message || t('themesettings.save_error') });
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
      <ThemeSettingsHeader
        t={t}
        saveStatus={saveStatus}
        onResetAll={handleResetAll}
        onSave={handleSave}
      />

      {/* Save Notification status */}
      {saveStatus.message && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 border text-sm font-semibold transition-all ${
            saveStatus.type === 'success'
              ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
              : saveStatus.type === 'error'
              ? 'bg-rose-50 border-rose-100 text-rose-800'
              : 'bg-blue-50 border-blue-100 text-blue-800'
          }`}
        >
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* Sub-page Tabs */}
      <ThemeSettingsTabs
        t={t}
        activePage={activePage}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Configuration List */}
        <div className="lg:col-span-8 space-y-6">
          <ThemeSettingsTable
            t={t}
            activePage={activePage}
            activeTab={activeTab}
            localTheme={localTheme}
            onFieldChange={handleFieldChange}
            onResetComponent={handleResetComponent}
          />
        </div>

        {/* Right Side: Consolidated Preview Panels */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-[76px]">
          <ThemeSettingsPreview
            t={t}
            activePage={activePage}
            activeTab={activeTab}
            getVal={getVal}
          />
        </div>
      </div>
    </div>
  );
}
