import React from 'react';
import {
  SparklesIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import Button from '../../../components/Button';
import WeekDatePicker from '../../../components/WeekDatePicker';
import BackButton from '../../../components/BackButton';
import { useRegisterException } from './hooks/useRegisterException';

export default function RegisterException() {
  const {
    t,
    i18n,
    viewDateObj,
    setViewDateObj,
    selectedDate,
    exceptionType,
    reason,
    setReason,
    workDays,
    presetReasons,
    pendingDates,
    setSelectedPresetId,
    handleDayClick,
    handleTypeChange,
    handleAdjustedTimeChange,
    handleCancel,
    handleSubmit,
    getTimeOptions,
    getDisplayDate,
    typesConfig
  } = useRegisterException();

  return (
    <div className="space-y-6 pb-20">
      <div className="mb-8">
        <BackButton className="mb-6" />
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3" data-customizable-id="register-exception-title" data-customizable-type="text">
          <span>{t('register.exception_title')}</span>
          <SparklesIcon className="w-6 h-6 text-blue-500 animate-pulse" />
        </h1>
        <p className="text-gray-500 mt-2 text-sm sm:text-base" data-customizable-id="register-exception-subtitle" data-customizable-type="text">{t('register.exception_subtitle')}</p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-10">
        {/* Step 1: Select Date (Only 1 Day) */}
        <div>
          <h2 className="text-xs font-bold text-gray-400 tracking-wider mb-5 uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            {t('register.col_date')}
          </h2>
          <div className="bg-gray-50/50 p-4 sm:p-6 rounded-2xl border border-gray-100">
            <WeekDatePicker
              viewDate={viewDateObj}
              onViewChange={setViewDateObj}
              selectedDates={selectedDate ? [selectedDate.date] : []}
              addedDates={[]}
              pendingDates={pendingDates}
              onDayClick={handleDayClick}
              workDays={workDays}
            />
          </div>
          {selectedDate && (
            <div className="mt-3 flex items-center gap-2 text-sm text-blue-600 font-semibold bg-blue-50/50 py-2 px-4 rounded-xl border border-blue-100 w-fit">
              <CalendarDaysIcon className="w-4 h-4" />
              <span>Đang chọn ngày: {getDisplayDate()}</span>
            </div>
          )}
        </div>

        {/* Step 2: Choose Exception Type */}
        {selectedDate && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-xs font-bold text-gray-400 tracking-wider mb-5 uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              {t('register.exception_type')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {typesConfig.map(cfg => {
                const active = exceptionType === cfg.id;
                return (
                  <div
                    key={cfg.id}
                    onClick={() => handleTypeChange(cfg.id)}
                    className={`flex flex-col justify-center items-center p-5 rounded-2xl border-2 transition-all cursor-pointer text-center relative overflow-hidden group select-none ${active
                      ? 'border-blue-500 bg-blue-50/20 shadow-md ring-2 ring-blue-500/10'
                      : 'border-gray-100 bg-white hover:border-gray-250 hover:shadow-sm'
                      }`}
                  >
                    <span className={`text-[14px] font-extrabold tracking-tight transition-colors ${active ? 'text-blue-700 font-black' : 'text-gray-600 group-hover:text-gray-900'
                      }`}>
                      {t(cfg.key)}
                    </span>
                    {active && (
                      <div className="absolute top-1 right-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Registration Information Card */}
        {selectedDate && exceptionType && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <h2 className="text-xs font-bold text-gray-400 tracking-wider mb-5 uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                {t('register.adjusted_schedule')}
              </h2>

              <div className="bg-white border-2 border-blue-500/20 rounded-3xl p-6 shadow-sm w-full space-y-6">
                <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                  <div>
                    <h4 className="font-black text-gray-900 text-lg">{getDisplayDate()}</h4>
                    <p className="text-xs text-gray-400 font-medium mt-1">
                      {t('register.standard_hours')}: <span className="font-bold text-gray-600">{selectedDate.standardStart} - {selectedDate.standardEnd}</span>
                    </p>
                  </div>
                  <span className="bg-blue-50 text-blue-700 text-xs font-black px-3 py-1 rounded-lg border border-blue-100">
                    {t(`register.exception_${exceptionType}`)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  <div>
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-wider block mb-2">
                      {t('register.exception_time')}
                    </label>

                    {getTimeOptions(exceptionType, selectedDate.standardStart, selectedDate.standardEnd).length > 0 ? (
                      <select
                        value={selectedDate.adjustedTime}
                        onChange={(e) => handleAdjustedTimeChange(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm font-bold rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all shadow-sm min-h-[46px]"
                      >
                        {getTimeOptions(exceptionType, selectedDate.standardStart, selectedDate.standardEnd).map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-xs text-red-500 font-semibold flex items-center gap-1.5 bg-red-50 p-3 rounded-2xl border border-red-100">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        <span>Không có mốc giờ khả dụng</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col justify-center gap-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-semibold">{t('register.standard_hours')}:</span>
                      <span className="font-bold text-gray-600">{selectedDate.standardStart} - {selectedDate.standardEnd}</span>
                    </div>
                    <div className="h-px bg-gray-200 w-full my-1"></div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-blue-600 font-bold">{t('register.col_adjusted_time')}:</span>
                      <span className="font-black text-blue-700">
                        {exceptionType === 'arrive_early' || exceptionType === 'arrive_late'
                          ? `${selectedDate.adjustedTime} - ${selectedDate.standardEnd}`
                          : `${selectedDate.standardStart} - ${selectedDate.adjustedTime}`
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xs font-bold text-gray-400 tracking-wider mb-5 uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                {t('register.exception_reason')}
              </h2>

              {presetReasons.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  {presetReasons.map((pr) => {
                    const textVal = i18n.language === 'vi' ? pr.vi : pr.en;
                    const isSelected = reason === textVal;
                    return (
                      <button
                        key={pr.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setReason('');
                            setSelectedPresetId(null);
                          } else {
                            setReason(textVal);
                            setSelectedPresetId(pr.id);
                          }
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none ${isSelected
                          ? 'border-blue-500 bg-blue-50/50 text-blue-600 shadow-sm shadow-blue-500/5'
                          : 'border-gray-150 bg-gray-50/70 text-gray-500 hover:bg-gray-100 hover:text-gray-750'
                          }`}
                      >
                        {textVal}
                      </button>
                    );
                  })}
                </div>
              )}

              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setSelectedPresetId(null);
                }}
                placeholder={t('register.exception_reason_placeholder')}
                className="w-full h-28 p-4 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white shadow-sm resize-none transition-all outline-none text-gray-700 text-sm"
              ></textarea>
            </div>

            <div className="h-px bg-gray-100 w-full my-6"></div>

            <div className="flex justify-end items-center">
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={handleCancel} data-customizable-id="btn-cancel-exception" data-customizable-type="bg">
                  {t('register.btn_cancel')}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedDate || !exceptionType || !reason.trim()}
                  data-customizable-id="btn-submit-exception"
                  data-customizable-type="bg"
                >
                  {t('register.btn_submit_exception')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
