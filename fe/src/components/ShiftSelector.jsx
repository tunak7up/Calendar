import React from 'react';
import { SunIcon, CloudIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

/**
 * Reusable ShiftSelector Component with nested time selectors
 */
const ShiftSelector = ({
  selectedShift,
  onShiftChange,
  shiftStartTime,
  onStartTimeChange,
  shiftEndTime,
  onEndTimeChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Morning Card */}
      <div
        onClick={() => onShiftChange('Morning')}
        className={`flex flex-col justify-between p-6 rounded-2xl border-2 transition-all cursor-pointer group ${selectedShift === 'Morning'
            ? 'border-blue-500 bg-blue-50/20 shadow-md ring-2 ring-blue-500/10'
            : 'border-gray-200/60 bg-white hover:border-gray-300 shadow-sm'
          }`}
      >
        <div className="w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2.5 rounded-xl transition-colors ${selectedShift === 'Morning' ? 'bg-blue-100/50 text-blue-600' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'}`}>
              <SunIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-base">{t('register.shift_morning')}</h3>
            </div>
          </div>

          {selectedShift === 'Morning' && (
            <div className="w-full mt-5 pt-4 border-t border-blue-100/50 space-y-4 animate-in fade-in duration-300" onClick={(e) => e.stopPropagation()}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-blue-600/80 uppercase tracking-wider block mb-1.5">{t('register.col_start')}</label>
                  <select
                    value={shiftStartTime}
                    onChange={(e) => onStartTimeChange(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all shadow-sm min-h-[38px]"
                  >
                    <option value="08:00">08:00</option>
                    <option value="08:30">08:30</option>
                    <option value="09:00">09:00</option>
                    <option value="09:30">09:30</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-blue-600/80 uppercase tracking-wider block mb-1.5">{t('register.col_end')}</label>
                  <select
                    value={shiftEndTime}
                    onChange={(e) => onEndTimeChange(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all shadow-sm min-h-[38px]"
                  >
                    <option value="11:00">11:00</option>
                    <option value="11:30">11:30</option>
                    <option value="12:00">12:00</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Afternoon Card */}
      <div
        onClick={() => onShiftChange('Afternoon')}
        className={`flex flex-col justify-between p-6 rounded-2xl border-2 transition-all cursor-pointer group ${selectedShift === 'Afternoon'
            ? 'border-blue-500 bg-blue-50/20 shadow-md ring-2 ring-blue-500/10'
            : 'border-gray-200/60 bg-white hover:border-gray-300 shadow-sm'
          }`}
      >
        <div className="w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2.5 rounded-xl transition-colors ${selectedShift === 'Afternoon' ? 'bg-blue-100/50 text-blue-600' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'}`}>
              <CloudIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-base">{t('register.shift_afternoon')}</h3>

            </div>
          </div>

          {selectedShift === 'Afternoon' && (
            <div className="w-full mt-5 pt-4 border-t border-blue-100/50 space-y-4 animate-in fade-in duration-300" onClick={(e) => e.stopPropagation()}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-blue-600/80 uppercase tracking-wider block mb-1.5">{t('register.col_start')}</label>
                  <select
                    value={shiftStartTime}
                    onChange={(e) => onStartTimeChange(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all shadow-sm min-h-[38px]"
                  >
                    <option value="13:00">13:00</option>
                    <option value="13:30">13:30</option>
                    <option value="14:00">14:00</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-blue-600/80 uppercase tracking-wider block mb-1.5">{t('register.col_end')}</label>
                  <select
                    value={shiftEndTime}
                    onChange={(e) => onEndTimeChange(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all shadow-sm min-h-[38px]"
                  >
                    <option value="17:00">17:00</option>
                    <option value="17:30">17:30</option>
                    <option value="18:00">18:00 </option>
                    <option value="18:30">18:30 </option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Day Card */}
      <div
        onClick={() => onShiftChange('Full Day')}
        className={`flex flex-col justify-between p-6 rounded-2xl border-2 transition-all cursor-pointer group ${selectedShift === 'Full Day'
            ? 'border-blue-500 bg-blue-50/20 shadow-md ring-2 ring-blue-500/10'
            : 'border-gray-200/60 bg-white hover:border-gray-300 shadow-sm'
          }`}
      >
        <div className="w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2.5 rounded-xl transition-colors ${selectedShift === 'Full Day' ? 'bg-blue-100/50 text-blue-600' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'}`}>
              <CalendarDaysIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-base">{t('register.shift_full')}</h3>
           
            </div>
          </div>

          {selectedShift === 'Full Day' && (
            <div className="w-full mt-5 pt-4 border-t border-blue-100/50 space-y-4 animate-in fade-in duration-300" onClick={(e) => e.stopPropagation()}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-blue-600/80 uppercase tracking-wider block mb-1.5">{t('register.col_start')}</label>
                  <select
                    value={shiftStartTime}
                    onChange={(e) => onStartTimeChange(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all shadow-sm min-h-[38px]"
                  >
                    <option value="08:00">08:00</option>
                    <option value="08:30">08:30</option>
                    <option value="09:00">09:00</option>
                    <option value="09:30">09:30</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-blue-600/80 uppercase tracking-wider block mb-1.5">{t('register.col_end')}</label>
                  <select
                    value={shiftEndTime}
                    onChange={(e) => onEndTimeChange(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all shadow-sm min-h-[38px]"
                  >
                    <option value="17:00">17:00</option>
                    <option value="17:30">17:30</option>
                    <option value="18:00">18:00</option>
                    <option value="18:30">18:30</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShiftSelector;
