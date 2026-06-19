import React, { createContext, useContext, useState, useEffect } from 'react';
import { themeSettingService } from '../services/themeSettingService';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadTheme = async () => {
    try {
      const res = await themeSettingService.getAll();
      if (res.success && Array.isArray(res.data)) {
        const themeObj = {};
        res.data.forEach(item => {
          themeObj[item.component] = {
            id: item.id,
            component: item.component,
            label: item.label,
            bg: item.bg,
            text: item.text,
            defaultBg: item.defaultBg,
            defaultText: item.defaultText
          };
        });
        setTheme(themeObj);
      }
    } catch (err) {
      console.error('Failed to load theme settings from database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTheme();
  }, []);

  const updateTheme = async (updatedArray) => {
    try {
      const res = await themeSettingService.update(updatedArray);
      if (res.success && Array.isArray(res.data)) {
        const themeObj = {};
        res.data.forEach(item => {
          themeObj[item.component] = {
            id: item.id,
            component: item.component,
            label: item.label,
            bg: item.bg,
            text: item.text,
            defaultBg: item.defaultBg,
            defaultText: item.defaultText
          };
        });
        setTheme(themeObj);
        return { success: true };
      }
      return { success: false, message: 'Invalid response format' };
    } catch (err) {
      console.error('Failed to update theme settings:', err);
      return { success: false, message: err.message };
    }
  };

  // Dynamic CSS injection into document head
  useEffect(() => {
    if (!theme) return;

    let styleTag = document.getElementById('dynamic-theme-styles');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'dynamic-theme-styles';
      document.head.appendChild(styleTag);
    }

    let css = '';
    Object.entries(theme).forEach(([selector, colors]) => {
      css += `${selector} {\n`;
      if (colors.bg) {
        css += `  background-color: ${colors.bg} !important;\n`;
        // For specific elements like calendar cards, sidebars or headers, sync border-color too
        if (selector.includes('CalendarCard') || selector.includes('SidebarBrandIcon') || selector.includes('SidebarBackground')) {
          css += `  border-color: ${colors.bg} !important;\n`;
        }
      }
      if (colors.text) {
        css += `  color: ${colors.text} !important;\n`;
      }
      css += `}\n\n`;
    });

    styleTag.innerHTML = css;
  }, [theme]);

  const value = {
    theme,
    loading,
    updateTheme,
    refreshTheme: loadTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
