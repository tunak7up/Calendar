import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { themeSettingService } from '../services/themeSettingService';

const ThemeContext = createContext(null);

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

// Dynamic CSS injection into document head
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
      if (selector.includes('Attendance-')) {
        const baseName = selector.replace('"]', ''); // e.g. [data-custom-component="Attendance-Scheduled
        if (colors.bg) {
          // Dot rule
          css += `${baseName}-Dot"] {\n`;
          css += `  background-color: ${colors.bg} !important;\n`;
          css += `  border-color: ${colors.bg} !important;\n`;
          css += `}\n\n`;
          
          // Row rules (convert to semi-transparent backgrounds)
          const rowBg = hexToRGBA(colors.bg, 0.15);
          const rowHoverBg = hexToRGBA(colors.bg, 0.3);
          css += `${baseName}-Row"] {\n`;
          css += `  background-color: ${rowBg} !important;\n`;
          css += `}\n\n`;
          css += `${baseName}-Row"]:hover {\n`;
          css += `  background-color: ${rowHoverBg} !important;\n`;
          css += `}\n\n`;
        }
        if (colors.text) {
          // Text rule
          css += `${baseName}-Text"] {\n`;
          css += `  color: ${colors.text} !important;\n`;
          css += `}\n\n`;
        }
      } else {
        css += `${selector} {\n`;
        if (colors.bg) {
          css += `  background-color: ${colors.bg} !important;\n`;
          if (selector.includes('CalendarCard') || selector.includes('SidebarBrandIcon') || selector.includes('SidebarBackground') || selector.includes('TaskStatus') || selector.includes('TaskPriority') || selector.includes('Schedule-')) {
            css += `  border-color: ${colors.bg} !important;\n`;
          }
        }
        if (colors.text) {
          css += `  color: ${colors.text} !important;\n`;
        }
        css += `}\n\n`;

        // Inner status dot color sync for TaskStatus
        if (selector.includes('TaskStatus') && colors.text) {
          css += `${selector} .status-dot {\n`;
          css += `  background-color: ${colors.text} !important;\n`;
          css += `}\n\n`;
          css += `.status-dot${selector} {\n`;
          css += `  background-color: ${colors.text} !important;\n`;
          css += `}\n\n`;
        }
      }
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

export function useTaskColor() {
  const { theme } = useTheme();

  const getTaskColor = useCallback((status) => {
    const s = status?.toLowerCase();
    let themeKey = 'TaskStatus-Pending';
    let defaultColors = { bg: '#9ca3af', text: '#ffffff' };

    if (s === 'overdue') {
      themeKey = 'TaskStatus-Overdue';
      defaultColors = { bg: '#ef4444', text: '#ffffff' };
    } else if (s === 'in progress') {
      themeKey = 'TaskStatus-InProgress';
      defaultColors = { bg: '#3b82f6', text: '#ffffff' };
    } else if (s === 'completed') {
      themeKey = 'TaskStatus-Completed';
      defaultColors = { bg: '#10b981', text: '#ffffff' };
    }

    const customColors = theme?.[`[data-custom-component="${themeKey}"]`];
    const bg = customColors?.bg || defaultColors.bg;
    const text = customColors?.text || defaultColors.text;

    return {
      bg,
      border: bg,
      text
    };
  }, [theme]);

  return getTaskColor;
}
