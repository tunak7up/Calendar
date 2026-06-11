import React, { useState, useEffect } from 'react';
import { PaintBrushIcon, XMarkIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const PRESET_COLORS = [
  { hex: '#0056b3', name: 'Royal Blue' },
  { hex: '#1e293b', name: 'Slate' },
  { hex: '#4f46e5', name: 'Indigo' },
  { hex: '#059669', name: 'Emerald' },
  { hex: '#d97706', name: 'Amber' },
  { hex: '#ea580c', name: 'Orange' },
  { hex: '#e11d48', name: 'Rose' },
  { hex: '#7c3aed', name: 'Violet' },
  { hex: '#ffffff', name: 'White' },
  { hex: '#f8fafc', name: 'Slate 50' },
  { hex: '#0f172a', name: 'Dark Slate' },
  { hex: '#000000', name: 'Black' }
];

const rgbToHex = (rgbStr) => {
  if (!rgbStr) return '#ffffff';
  if (rgbStr.startsWith('#')) return rgbStr;
  const match = rgbStr.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
  if (!match) return '#ffffff';
  
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
  
  if (a === 0) return '#ffffff';

  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

const getUniqueSelector = (el) => {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return '';

  const customId = el.getAttribute('data-customizable-id');
  if (customId) {
    return `[data-customizable-id="${customId}"]`;
  }

  if (el.id) {
    return `#${el.id}`;
  }

  if (el.tagName === 'BODY') {
    return 'body';
  }

  let path = [];
  let current = el;
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    if (current.id) {
      path.unshift(`#${current.id}`);
      break;
    }
    const customId = current.getAttribute('data-customizable-id');
    if (customId) {
      path.unshift(`[data-customizable-id="${customId}"]`);
      break;
    }
    
    let tagName = current.tagName.toLowerCase();
    let sibling = current;
    let index = 1;
    while ((sibling = sibling.previousElementSibling)) {
      if (sibling.tagName === current.tagName) {
        index++;
      }
    }
    path.unshift(`${tagName}:nth-of-type(${index})`);
    current = current.parentNode;
  }
  return path.join(' > ');
};

const getDefaultType = (tagName) => {
  const textTags = ['SPAN', 'LABEL', 'A', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
  return textTags.includes(tagName) ? 'text' : 'bg';
};

export default function ThemeCustomizer() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [customColors, setCustomColors] = useState(() => {
    try {
      const saved = localStorage.getItem('theme-customizer-colors');
      if (!saved) return {};
      const parsed = JSON.parse(saved);
      
      const migrated = {};
      Object.entries(parsed).forEach(([key, val]) => {
        if (val && typeof val === 'object' && 'color' in val && 'type' in val) {
          const selector = key.startsWith('[') || key.startsWith('#') || key.startsWith('body')
            ? key
            : `[data-customizable-id="${key}"]`;
          
          if (!migrated[selector]) {
            migrated[selector] = {};
          }
          migrated[selector][val.type] = val.color;
        } else {
          migrated[key] = val;
        }
      });
      return migrated;
    } catch (e) {
      console.error(e);
      return {};
    }
  });

  const [pickerConfig, setPickerConfig] = useState(null); // { selector, tagName, x, y }
  const [activeTab, setActiveTab] = useState('bg'); // 'bg' or 'text'

  // 1. Inject / Update style rules in document head
  useEffect(() => {
    let styleTag = document.getElementById('dynamic-theme-customizer');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'dynamic-theme-customizer';
      document.head.appendChild(styleTag);
    }

    const cssRules = Object.entries(customColors).map(([selector, styles]) => {
      let rules = [];
      if (styles.bg) {
        rules.push(`background-color: ${styles.bg} !important;`);
      }
      if (styles.text) {
        rules.push(`color: ${styles.text} !important;`);
      }
      return rules.length > 0 ? `${selector} { ${rules.join(' ')} }` : '';
    }).filter(Boolean).join('\n');

    styleTag.innerHTML = cssRules;
  }, [customColors]);

  // 2. Inject edit mode styles when active
  useEffect(() => {
    let styleTag = document.getElementById('edit-mode-helper-styles');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'edit-mode-helper-styles';
      document.head.appendChild(styleTag);
    }

    if (isEditMode) {
      document.body.classList.add('theme-edit-mode-active');
      styleTag.innerHTML = `
        .theme-customizer-hovered {
          position: relative !important;
          cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%232563eb' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 20h9'/%3E%3Cpath d='M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z'/%3E%3C/svg%3E") 4 20, pointer !important;
          outline: 2px dashed #2563eb !important;
          outline-offset: 2px !important;
          transition: outline 0.15s ease-in-out !important;
        }
        .theme-customizer-hovered:hover {
          outline: 2px dashed #1d4ed8 !important;
          background-color: rgba(37, 99, 235, 0.05) !important;
        }
      `;
    } else {
      document.body.classList.remove('theme-edit-mode-active');
      styleTag.innerHTML = '';
      setPickerConfig(null);
    }
  }, [isEditMode]);

  // 3. Dynamic hover highlighting mechanism when in edit mode
  useEffect(() => {
    if (!isEditMode) return;

    let currentHovered = null;

    const handleMouseOver = (e) => {
      const target = e.target;
      if (!target || target.nodeType !== Node.ELEMENT_NODE) return;

      if (target.closest('.theme-customizer-container') || target.closest('.theme-picker-panel')) {
        return;
      }

      const targetTags = ['BUTTON', 'DIV', 'SPAN', 'LABEL', 'A', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
      if (!targetTags.includes(target.tagName)) {
        return;
      }

      if (currentHovered && currentHovered !== target) {
        currentHovered.classList.remove('theme-customizer-hovered');
      }

      currentHovered = target;
      currentHovered.classList.add('theme-customizer-hovered');
    };

    const handleMouseOut = (e) => {
      if (currentHovered) {
        currentHovered.classList.remove('theme-customizer-hovered');
        currentHovered = null;
      }
    };

    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mouseout', handleMouseOut);
      if (currentHovered) {
        currentHovered.classList.remove('theme-customizer-hovered');
      }
    };
  }, [isEditMode]);

  // 4. Global Click interceptor when edit mode is active
  useEffect(() => {
    if (!isEditMode) return;

    const handleGlobalClick = (e) => {
      const target = e.target;
      if (!target || target.nodeType !== Node.ELEMENT_NODE) return;

      if (target.closest('.theme-customizer-container') || target.closest('.theme-picker-panel')) {
        return;
      }

      const targetTags = ['BUTTON', 'DIV', 'SPAN', 'LABEL', 'A', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
      if (!targetTags.includes(target.tagName)) {
        const pickerPanel = e.target.closest('.theme-picker-panel');
        if (!pickerPanel) {
          setPickerConfig(null);
        }
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const selector = getUniqueSelector(target);
      const defaultType = getDefaultType(target.tagName);
      setActiveTab(defaultType);

      const rect = target.getBoundingClientRect();
      const width = 280;
      let leftX = rect.left + window.scrollX;
      if (leftX + width > window.innerWidth) {
        leftX = window.innerWidth - width - 16;
      }
      leftX = Math.max(16, leftX);

      setPickerConfig({
        selector,
        tagName: target.tagName,
        x: leftX,
        y: rect.bottom + window.scrollY + 8
      });
    };

    window.addEventListener('click', handleGlobalClick, true);
    return () => {
      window.removeEventListener('click', handleGlobalClick, true);
    };
  }, [isEditMode]);

  const handleColorSelect = (color) => {
    if (!pickerConfig) return;
    const { selector } = pickerConfig;
    const currentStyles = customColors[selector] || {};
    const updated = {
      ...customColors,
      [selector]: {
        ...currentStyles,
        [activeTab]: color
      }
    };
    setCustomColors(updated);
    localStorage.setItem('theme-customizer-colors', JSON.stringify(updated));
  };

  const handleClearElementColor = () => {
    if (!pickerConfig) return;
    const { selector } = pickerConfig;
    const updated = { ...customColors };
    
    if (updated[selector]) {
      delete updated[selector][activeTab];
      if (Object.keys(updated[selector]).length === 0) {
        delete updated[selector];
      }
    }
    setCustomColors(updated);
    localStorage.setItem('theme-customizer-colors', JSON.stringify(updated));
  };

  const handleResetAll = () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục toàn bộ giao diện gốc?')) {
      setCustomColors({});
      localStorage.removeItem('theme-customizer-colors');
      setPickerConfig(null);
    }
  };

  const getActiveColor = () => {
    if (!pickerConfig) return '#ffffff';
    const { selector } = pickerConfig;
    const savedColor = customColors[selector]?.[activeTab];
    if (savedColor) return savedColor;

    try {
      const el = document.querySelector(selector);
      if (el) {
        const computedStyle = window.getComputedStyle(el);
        const rawColor = activeTab === 'bg' ? computedStyle.backgroundColor : computedStyle.color;
        return rgbToHex(rawColor);
      }
    } catch (e) {
      console.error(e);
    }
    return activeTab === 'bg' ? '#ffffff' : '#000000';
  };

  return (
    <>
      {/* Floating Toggle Controls */}
      <div className="theme-customizer-container fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 select-none">
        
        {/* Status Indicator banner */}
        {isEditMode && (
          <div className="bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg shadow-blue-500/30 flex items-center gap-2 border border-blue-500 animate-bounce">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            <span>Chế độ thiết kế đang Bật</span>
          </div>
        )}

        <div className="flex gap-2">
          {/* Reset All Button */}
          {Object.keys(customColors).length > 0 && (
            <button
              onClick={handleResetAll}
              className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center border border-red-400 cursor-pointer"
              title="Khôi phục toàn bộ"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
          )}

          {/* Main Toggle Button */}
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 px-5 py-3 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 border cursor-pointer font-bold text-sm ${
              isEditMode
                ? 'bg-blue-600 border-blue-500 text-white shadow-blue-500/20'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-gray-200/50'
            }`}
          >
            <PaintBrushIcon className={`w-5 h-5 ${isEditMode ? 'animate-spin' : ''}`} />
            <span>{isEditMode ? 'Tắt thiết kế' : 'Thiết kế giao diện'}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Popover Picker */}
      {isEditMode && pickerConfig && (
        <div
          className="theme-picker-panel fixed z-[10000] w-[280px] bg-white rounded-3xl border border-gray-100 shadow-2xl p-5 flex flex-col gap-4"
          style={{
            top: `${pickerConfig.y}px`,
            left: `${pickerConfig.x}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Cấu hình màu sắc
              </span>
              <h4 className="text-[11px] font-black text-gray-800 mt-0.5 truncate max-w-[200px]" title={pickerConfig.selector}>
                Thẻ: {pickerConfig.tagName.toLowerCase()}
              </h4>
            </div>
            <button
              onClick={() => setPickerConfig(null)}
              className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Selection */}
          <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100 shadow-inner">
            <button
              onClick={() => setActiveTab('bg')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'bg'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Màu Nền
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'text'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Màu Chữ
            </button>
          </div>

          {/* Presets Grid */}
          <div className="grid grid-cols-4 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color.hex}
                onClick={() => handleColorSelect(color.hex)}
                className={`w-10 h-10 rounded-xl border transition-all hover:scale-110 flex items-center justify-center cursor-pointer ${
                  getActiveColor().toLowerCase() === color.hex.toLowerCase()
                    ? 'border-blue-600 scale-105 shadow-sm ring-2 ring-blue-500/30'
                    : 'border-gray-200/70 hover:border-gray-300'
                }`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              >
                {color.hex === '#ffffff' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                )}
              </button>
            ))}
          </div>

          <div className="border-t border-gray-50 pt-3 flex items-center justify-between gap-3">
            {/* Custom Color Selector */}
            <label className="flex items-center gap-2 cursor-pointer flex-1">
              <span className="text-xs font-semibold text-gray-600">Màu tùy chỉnh:</span>
              <div className="relative w-8 h-8 rounded-lg border border-gray-200 overflow-hidden shrink-0">
                <input
                  type="color"
                  value={getActiveColor()}
                  onChange={(e) => handleColorSelect(e.target.value)}
                  className="absolute inset-0 w-full h-full p-0 border-0 outline-none cursor-pointer scale-150"
                />
              </div>
            </label>

            {/* Clear button */}
            {customColors[pickerConfig.selector]?.[activeTab] && (
              <button
                onClick={handleClearElementColor}
                className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                title="Xóa cấu hình màu này"
              >
                <TrashIcon className="w-4 h-4" />
                <span>Gốc</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
