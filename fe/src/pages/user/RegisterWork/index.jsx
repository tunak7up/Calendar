import React from 'react';
import {
  ClockIcon,
  TrashIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import Button from '../../../components/Button';
import WeekDatePicker from '../../../components/WeekDatePicker';
import BackButton from '../../../components/BackButton';
import ShiftSelector from '../../../components/ShiftSelector';
import { useRegisterWork } from './hooks/useRegisterWork';

export default function RegisterWork() {
  const {
    t,
    i18n,
    viewDateObj,
    setViewDateObj,
    draftDates,
    selectedShift,
    shiftStartTime,
    setShiftStartTime,
    shiftEndTime,
    setShiftEndTime,
    schedule,
    workDays,
    pendingDates,
    isRepeatDropdownOpen,
    setIsRepeatDropdownOpen,
    repeatOption,
    setRepeatOption,
    repeatInterval,
    setRepeatInterval,
    endOption,
    setEndOption,
    endDate,
    setEndDate,
    endCount,
    setEndCount,
    handleShiftChange,
    handleDayClick,
    handleAddToSchedule,
    handleCancel,
    handleSubmit,
    handleRemoveFromSchedule,
    sortedSchedule,
    totalWeeklyHours,
    getShiftTimeRange
  } = useRegisterWork();

  return (
    <div className="space-y-6 pb-20">
      <div className="mb-8">
        <BackButton className="mb-6" />
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight" data-customizable-id="register-work-title" data-customizable-type="text">{t('register.work_title')}</h1>
        <p className="text-gray-500 mt-2 text-sm sm:text-base" data-customizable-id="register-work-subtitle" data-customizable-type="text">{t('register.work_subtitle')}</p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
        {/* Select Date */}
        <div className="mb-10">
          <WeekDatePicker
            viewDate={viewDateObj}
            onViewChange={setViewDateObj}
            selectedDates={draftDates}
            addedDates={schedule.map(item => item.date)}
            pendingDates={pendingDates}
            onDayClick={handleDayClick}
            workDays={workDays}
          />
        </div>

        {/* Choose Shift */}
        <div className="mb-10">
          <h2 className="text-xs font-bold text-gray-500 tracking-wider mb-6 uppercase">{t('register.choose_shift')}</h2>
          <ShiftSelector
            selectedShift={selectedShift}
            onShiftChange={handleShiftChange}
            shiftStartTime={shiftStartTime}
            onStartTimeChange={setShiftStartTime}
            shiftEndTime={shiftEndTime}
            onEndTimeChange={setShiftEndTime}
          />
        </div>

        {/* Repeat controls */}
        <div className="mt-6 border-t border-gray-100 pt-5">
          <div className="flex flex-row items-center gap-3 flex-nowrap">
            {/* Step 1: Dropdown lặp lại */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setIsRepeatDropdownOpen(!isRepeatDropdownOpen)}
                className="flex items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-xl shadow-sm text-[14px] font-semibold text-gray-900 border border-gray-200 hover:bg-gray-50 transition-colors min-w-[155px]"
              >
                <span>
                  {repeatOption === 'none' && t('register.repeat_none')}
                  {repeatOption === 'weekly' && t('register.repeat_weekly')}
                  {repeatOption === 'yearly' && t('register.repeat_yearly')}
                </span>
                <ChevronDownIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
              </button>

              {isRepeatDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setIsRepeatDropdownOpen(false)}></div>
                  <div className="absolute top-[calc(100%+8px)] left-0 min-w-[180px] bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-[101] overflow-hidden">
                    {['none', 'weekly', 'yearly'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => {
                          setRepeatOption(opt);
                          setIsRepeatDropdownOpen(false);
                          if (opt === 'none') setEndOption('never');
                        }}
                        className={`w-full text-left px-5 py-2.5 text-[14px] hover:bg-blue-50/60 hover:text-blue-600 transition-colors ${repeatOption === opt ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 font-medium'}`}
                      >
                        {opt === 'none' && t('register.repeat_none')}
                        {opt === 'weekly' && t('register.repeat_weekly')}
                        {opt === 'yearly' && t('register.repeat_yearly')}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Step 2: Kết thúc */}
            {(repeatOption === 'weekly' || repeatOption === 'yearly') && (
              <>
                <span className="text-gray-400 text-[13px] flex-shrink-0">›</span>
                <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-gray-200 flex-shrink-0">
                  <span className="text-[14px] font-medium text-gray-600 whitespace-nowrap">{t('register.end_label')}</span>
                  <select
                    className="text-[14px] font-semibold text-gray-900 border-0 focus:ring-0 p-0 cursor-pointer bg-transparent"
                    value={endOption}
                    onChange={(e) => setEndOption(e.target.value)}
                  >
                    <option value="never">{t('register.end_never')}</option>
                    <option value="date">{t('register.end_date')}</option>
                    <option value="count">{t('register.end_count')}</option>
                  </select>
                  {endOption === 'date' && (
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="text-[14px] border border-gray-200 bg-gray-50 rounded-lg py-1 px-2 focus:ring-0 text-gray-700 w-[132px] ml-1"
                    />
                  )}
                  {endOption === 'count' && (
                    <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 ml-1">
                      <input
                        type="number"
                        value={endCount}
                        onChange={(e) => setEndCount(Number(e.target.value))}
                        className="text-[14px] border-none bg-transparent py-1 px-0 focus:ring-0 text-gray-700 w-10 text-center"
                        min={1}
                      />
                      <span className="text-[13px] text-gray-500 whitespace-nowrap">{t('register.end_count_times')}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Step 3: Lặp lại mỗi */}
            {(repeatOption === 'weekly' || repeatOption === 'yearly') && endOption !== 'never' && (
              <>
                <span className="text-gray-400 text-[13px] flex-shrink-0">›</span>
                <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-gray-200 flex-shrink-0">
                  <span className="text-[14px] font-medium text-gray-600 whitespace-nowrap">{t('register.repeat_every')}</span>
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2">
                    <input
                      type="number"
                      value={repeatInterval}
                      onChange={(e) => setRepeatInterval(Number(e.target.value) || 1)}
                      className="text-[14px] border-none bg-transparent py-1 px-0 focus:ring-0 text-gray-700 w-10 text-center"
                      min={1}
                    />
                    <span className="text-[13px] text-gray-500">{repeatOption === 'weekly' ? t('register.repeat_week') : t('register.repeat_year')}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Add to Schedule button */}
        <div className="flex justify-end mt-4">
          <Button onClick={handleAddToSchedule} disabled={draftDates.length === 0} data-customizable-id="btn-add-schedule" data-customizable-type="bg">
            <span>{t('register.add_to_schedule')}</span>
            {draftDates.length > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs ml-2">{draftDates.length}</span>
            )}
          </Button>
        </div>

        {/* Selected Dates Table */}
        {schedule.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-bold text-gray-500 tracking-wider mb-4 uppercase">{t('register.selected_schedule')}</h2>
            <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-400 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 font-semibold">{t('register.col_date')}</th>
                    <th className="px-6 py-3 font-semibold">{t('register.col_shift')}</th>
                    <th className="px-6 py-3 font-semibold">{t('register.col_time')}</th>
                    <th className="px-6 py-3 font-semibold text-right">{t('register.col_action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedSchedule.map(item => {
                    const [y, m, d] = item.date.split('-');
                    const dObj = new Date(y, m - 1, d);
                    const weekday = dObj.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short' });
                    const displayDate = `${weekday}, ${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;

                    return (
                      <tr key={item.date} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {displayDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700 font-medium">
                          {item.shift === 'Morning' ? t('register.shift_morning') : item.shift === 'Afternoon' ? t('register.shift_afternoon') : t('register.shift_full')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {getShiftTimeRange(item)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Button
                            variant="danger-icon"
                            onClick={() => handleRemoveFromSchedule(item.date)}
                            title={t('register.col_action')}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="h-px bg-gray-200 w-full my-6"></div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm min-w-[240px]">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-[0.65rem] font-bold text-gray-500 tracking-wider uppercase">{t('register.total_weekly_hours')}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">{totalWeeklyHours}</span>
                <span className="text-sm font-medium text-gray-400">/ 40h</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleCancel} data-customizable-id="btn-cancel-work" data-customizable-type="bg">{t('register.btn_cancel')}</Button>
            <Button onClick={handleSubmit} data-customizable-id="btn-submit-work" data-customizable-type="bg">{t('register.btn_submit_work')}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
