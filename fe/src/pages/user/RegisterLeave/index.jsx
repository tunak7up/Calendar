import React from 'react';
import { CalendarIcon, TrashIcon } from '@heroicons/react/24/outline';
import Button from '../../../components/Button';
import WeekDatePicker from '../../../components/WeekDatePicker';
import BackButton from '../../../components/BackButton';
import { useRegisterLeave } from './hooks/useRegisterLeave';

export default function RegisterLeave() {
  const {
    t,
    i18n,
    viewDateObj,
    setViewDateObj,
    reason,
    setReason,
    schedule,
    workDays,
    pendingDates,
    presetReasons,
    setSelectedPresetId,
    handleDayClick,
    handleCancel,
    handleSubmit,
    handleRemoveFromSchedule,
    sortedSchedule
  } = useRegisterLeave();

  return (
    <div>
      <div className="mb-8">
        <BackButton className="mb-6" />
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight" data-customizable-id="register-leave-title" data-customizable-type="text">{t('register.leave_title')}</h1>
        <p className="text-gray-500 mt-2 text-sm sm:text-base" data-customizable-id="register-leave-subtitle" data-customizable-type="text">{t('register.leave_subtitle')}</p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
        {/* Select Date */}
        <div className="mb-6">
          <WeekDatePicker
            viewDate={viewDateObj}
            onViewChange={setViewDateObj}
            selectedDates={[]}
            addedDates={schedule.map(item => item.date)}
            pendingDates={pendingDates}
            onDayClick={handleDayClick}
            workDays={workDays}
          />
        </div>

        {/* Schedule Table */}
        {schedule.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xs font-bold text-gray-500 tracking-wider mb-4 uppercase">{t('register.selected_leaves')}</h2>
            <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm max-h-[300px] overflow-y-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-400 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 font-semibold">{t('register.col_date')}</th>
                    <th className="px-6 py-3 font-semibold">{t('register.col_shift')}</th>
                    <th className="px-6 py-3 font-semibold text-right">{t('register.col_action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedSchedule.map(item => (
                    <tr key={item.date} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {item.shift === 'Morning' ? t('register.shift_morning') : item.shift === 'Afternoon' ? t('register.shift_afternoon') : t('register.shift_full')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button variant="danger-icon" onClick={() => handleRemoveFromSchedule(item.date)}>
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reason */}
        <div className="mb-10">
          <h2 className="text-xs font-bold text-gray-500 tracking-wider mb-4 uppercase">{t('register.leave_reason')}</h2>

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
                      : 'border-gray-150 bg-gray-50/70 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                      }`}
                  >
                    {textVal}
                  </button>
                );
              })}
            </div>
          )}

          <textarea
            className="w-full h-32 p-4 rounded-2xl border border-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white shadow-sm resize-none transition-all outline-none text-gray-700"
            placeholder={t('register.leave_reason_placeholder')}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setSelectedPresetId(null);
            }}
          ></textarea>
        </div>

        <div className="h-px bg-gray-200 w-full my-6"></div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-[0.65rem] font-bold text-gray-500 tracking-wider uppercase">{t('register.total_leaves')}</h3>
              <span className="text-2xl font-bold text-gray-900">{schedule.length}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleCancel} data-customizable-id="btn-cancel-leave" data-customizable-type="bg">{t('register.btn_cancel')}</Button>
            <Button onClick={handleSubmit} data-customizable-id="btn-submit-leave" data-customizable-type="bg">{t('register.btn_submit_leave')}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
