import React from 'react';
import { UsersIcon, ClockIcon, CheckCircleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function DaySummaryView({
  modalData,
  activeGroup,
  setActiveGroup,
  onSelectPerson,
  navigate,
  t,
  i18n
}) {
  const registeredList = modalData.filter((p) => p.hasSchedule);
  const unscheduledList = modalData.filter((p) => !p.hasSchedule);
  const registeredCount = registeredList.length;
  const unscheduledCount = unscheduledList.length;
  const currentList = activeGroup === 'registered' ? registeredList : unscheduledList;

  return (
    <div className="space-y-4">
      {/* Group selection boxes */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Box 1: Đăng ký đi làm */}
        <div
          onClick={() => setActiveGroup('registered')}
          className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between cursor-pointer ${
            activeGroup === 'registered'
              ? 'border-blue-600 bg-blue-50/40 shadow-sm'
              : 'border-gray-100 hover:border-gray-200 bg-gray-50/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-xl ${
                activeGroup === 'registered' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
              }`}
            >
              <UsersIcon className="w-4 h-4" />
            </div>
            <span
              className={`text-xs sm:text-sm font-semibold ${
                activeGroup === 'registered' ? 'text-blue-900' : 'text-gray-500'
              }`}
            >
              {t('adminschedule.registered_work')}
            </span>
          </div>
          <div className="mt-3 text-xl sm:text-2xl font-semibold text-gray-900 flex items-baseline gap-1">
            {registeredCount}
            <span className="text-xs font-bold text-gray-400">{t('adminschedule.registered_unit')}</span>
          </div>
        </div>

        {/* Box 2: Làm ngoài lịch */}
        <div
          onClick={() => setActiveGroup('unscheduled')}
          className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between cursor-pointer ${
            activeGroup === 'unscheduled'
              ? 'border-amber-500 bg-amber-50/40 shadow-sm'
              : 'border-gray-100 hover:border-gray-200 bg-gray-50/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-xl ${
                activeGroup === 'unscheduled' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400'
              }`}
            >
              <ClockIcon className="w-4 h-4" />
            </div>
            <span
              className={`text-xs sm:text-sm font-semibold ${
                activeGroup === 'unscheduled' ? 'text-amber-950' : 'text-gray-500'
              }`}
            >
              {t('adminschedule.unscheduled_work')}
            </span>
          </div>
          <div className="mt-3 text-xl sm:text-2xl font-semibold text-gray-900 flex items-baseline gap-1">
            {unscheduledCount}
            <span className="text-xs font-bold text-gray-400">{t('adminschedule.unscheduled_unit')}</span>
          </div>
        </div>
      </div>

      {/* List area */}
      {currentList.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
          {activeGroup === 'registered'
            ? t('adminschedule.no_registered')
            : t('adminschedule.no_unscheduled')}
        </div>
      ) : (
        <div className="space-y-3.5">
          {currentList.map((person) => {
            const checkIn = person.check_in;
            const checkOut = person.report?.check_out;

            let isLate = false;
            let isEarly = false;

            if (person.hasSchedule) {
              if (checkIn) {
                const inParts = checkIn.split(':');
                const inHour = parseInt(inParts[0], 10);
                const inMinute = parseInt(inParts[1], 10);
                const inTotal = inHour * 60 + inMinute;

                if (person.schedule && person.schedule.start_time) {
                  const schedStart = new Date(person.schedule.start_time);
                  const schedStartHour = schedStart.getHours();
                  const schedStartMinute = schedStart.getMinutes();
                  const schedStartTotal = schedStartHour * 60 + schedStartMinute;
                  isLate = inTotal > schedStartTotal;
                } else {
                  isLate = inHour > 9 || (inHour === 9 && inMinute > 0);
                }
              }

              if (checkOut) {
                const outParts = checkOut.split(':');
                const outHour = parseInt(outParts[0], 10);
                const outMinute = parseInt(outParts[1], 10);
                const outTotal = outHour * 60 + outMinute;

                if (person.schedule && person.schedule.end_time) {
                  const schedEnd = new Date(person.schedule.end_time);
                  const schedEndHour = schedEnd.getHours();
                  const schedEndMinute = schedEnd.getMinutes();
                  const schedEndTotal = schedEndHour * 60 + schedEndMinute;
                  isEarly = outTotal < schedEndTotal;
                } else {
                  isEarly = outHour < 17 || (outHour === 17 && outMinute < 30);
                }
              }
            }

            // Determine styling and badge based on schedule & check-in/out status
            let cardColorClasses = "border-gray-100 bg-white hover:border-gray-255 hover:bg-gray-50/10";
            let statusBadge = null;

            if (person.hasSchedule) {
              if (!checkIn) {
                // Registered but NOT checked in
                cardColorClasses =
                  "border-l-4 border-l-red-500 bg-red-50/5 border-red-100/50 hover:bg-red-50/15 hover:border-red-200/50";
                statusBadge = (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200/50">
                    {t('adminschedule.status_not_checkin')}
                  </span>
                );
              } else if (!checkOut) {
                // Registered and checked in
                if (isLate) {
                  cardColorClasses =
                    "border-l-4 border-l-amber-500 bg-amber-50/5 border-amber-100/50 hover:bg-amber-50/15 hover:border-amber-200/50";
                  statusBadge = (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
                      {t('admindashboard.attendance_late') || 'Check-in muộn'}
                    </span>
                  );
                } else {
                  cardColorClasses =
                    "border-l-4 border-l-blue-500 bg-blue-50/5 border-blue-100/50 hover:bg-blue-50/15 hover:border-blue-200/50";
                  statusBadge = (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/50">
                      {t('adminschedule.status_checked_in')}
                    </span>
                  );
                }
              } else {
                // Registered, checked in and checked out
                if (isLate && isEarly) {
                  cardColorClasses =
                    "border-l-4 border-l-red-500 bg-red-50/5 border-red-100/50 hover:bg-red-50/15 hover:border-red-200/50";
                  statusBadge = (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
                      {t('admindashboard.attendance_late_early') || 'Muộn & Về sớm'}
                    </span>
                  );
                } else if (isLate) {
                  cardColorClasses =
                    "border-l-4 border-l-amber-500 bg-amber-50/5 border-amber-100/50 hover:bg-amber-50/15 hover:border-amber-200/50";
                  statusBadge = (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
                      {t('admindashboard.attendance_late') || 'Check-in muộn'}
                    </span>
                  );
                } else if (isEarly) {
                  cardColorClasses =
                    "border-l-4 border-l-orange-500 bg-orange-50/5 border-orange-100/50 hover:bg-orange-50/15 hover:border-orange-200/50";
                  statusBadge = (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200">
                      {t('admindashboard.attendance_early') || 'Về sớm'}
                    </span>
                  );
                } else {
                  cardColorClasses =
                    "border-l-4 border-l-emerald-500 bg-emerald-50/5 border-emerald-100/50 hover:bg-emerald-50/15 hover:border-emerald-200/50";
                  statusBadge = (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                      {t('adminschedule.status_checked_out')}
                    </span>
                  );
                }
              }
            } else {
              // Unscheduled (extra shift)
              if (checkIn && !checkOut) {
                if (isLate) {
                  cardColorClasses =
                    "border-l-4 border-l-amber-500 bg-amber-50/5 border-amber-100/50 hover:bg-amber-50/15 hover:border-amber-200/50";
                  statusBadge = (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
                      {t('admindashboard.attendance_late') || 'Check-in muộn'}
                    </span>
                  );
                } else {
                  cardColorClasses =
                    "border-l-4 border-l-amber-500 bg-amber-50/5 border-amber-100/50 hover:bg-amber-50/15 hover:border-amber-200/50";
                  statusBadge = (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-red-255/50">
                      {t('adminschedule.status_checked_in')}
                    </span>
                  );
                }
              } else if (checkIn && checkOut) {
                if (isLate && isEarly) {
                  cardColorClasses =
                    "border-l-4 border-l-red-500 bg-red-50/5 border-red-100/50 hover:bg-red-50/15 hover:border-red-200/50";
                  statusBadge = (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
                      {t('admindashboard.attendance_late_early') || 'Muộn & Về sớm'}
                    </span>
                  );
                } else if (isLate) {
                  cardColorClasses =
                    "border-l-4 border-l-purple-500 bg-purple-50/5 border-purple-100/50 hover:bg-purple-50/15 hover:border-purple-200/50";
                  statusBadge = (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
                      {t('admindashboard.attendance_late') || 'Check-in muộn'}
                    </span>
                  );
                } else if (isEarly) {
                  cardColorClasses =
                    "border-l-4 border-l-purple-500 bg-purple-50/5 border-purple-100/50 hover:bg-purple-50/15 hover:border-purple-200/50";
                  statusBadge = (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200">
                      {t('admindashboard.attendance_early') || 'Về sớm'}
                    </span>
                  );
                } else {
                  cardColorClasses =
                    "border-l-4 border-l-purple-500 bg-purple-50/5 border-purple-100/50 hover:bg-purple-50/15 hover:border-purple-200/50";
                  statusBadge = (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-250/50">
                      {t('adminschedule.status_checked_out')}
                    </span>
                  );
                }
              }
            }

            return (
              <div
                key={person.person_id}
                onClick={() => onSelectPerson(person)}
                className={`group flex flex-col md:flex-row md:items-center justify-between p-4.5 rounded-2xl border cursor-pointer transition-all duration-200 hover:shadow-md gap-4 ${cardColorClasses}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${person.person_id}`);
                      }}
                      className="font-bold text-gray-800 hover:text-blue-600 hover:underline transition-colors inline-block cursor-pointer text-base truncate"
                      title={i18n.language === 'vi' ? 'Xem trang cá nhân' : 'View Profile'}
                    >
                      {person.name}
                    </h3>
                    {statusBadge}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3.5 text-xs text-gray-500">
                    {/* Shift */}
                    <div className="flex items-center gap-1 bg-gray-100/80 px-2 py-1 rounded-lg text-gray-700 font-medium">
                      <ClockIcon className="w-3.5 h-3.5 text-gray-400" />
                      <span>{person.shift}</span>
                    </div>

                    {/* Check-in */}
                    <div
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border font-medium ${
                        checkIn
                          ? isLate
                            ? 'bg-amber-50/50 border-amber-200 text-amber-700 font-semibold shadow-sm'
                            : 'bg-blue-50/40 border-blue-100 text-blue-700'
                          : 'bg-red-50/40 border-red-100 text-red-600'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                        {t('adminschedule.check_in')}
                      </span>
                      <span className="font-mono">
                        {checkIn
                          ? `${checkIn.slice(0, 5)}${isLate ? ` (${i18n.language === 'vi' ? 'Muộn' : 'Late'})` : ''}`
                          : i18n.language === 'vi'
                          ? 'Chưa vào'
                          : 'No entry'}
                      </span>
                    </div>

                    {/* Check-out */}
                    <div
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border font-medium ${
                        checkOut
                          ? isEarly
                            ? 'bg-orange-50/50 border-orange-200 text-orange-700 font-semibold shadow-sm'
                            : 'bg-emerald-50/40 border-emerald-100 text-emerald-700'
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                        {t('adminschedule.check_out')}
                      </span>
                      <span className="font-mono">
                        {checkOut
                          ? `${checkOut.slice(0, 5)}${isEarly ? ` (${i18n.language === 'vi' ? 'Sớm' : 'Early'})` : ''}`
                          : '—'}
                      </span>
                    </div>

                    {/* Report status */}
                    <div
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border font-medium ${
                        person.has_reported
                          ? 'bg-emerald-50/40 border-emerald-100 text-emerald-700'
                          : 'bg-gray-50 border-gray-250 text-gray-400'
                      }`}
                    >
                      <DocumentTextIcon className="w-3.5 h-3.5 opacity-70" />
                      <span>
                        {person.has_reported ? (
                          <span className="flex items-center gap-0.5">
                            <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500 inline" />
                            <span>{i18n.language === 'vi' ? 'Đã báo cáo' : 'Reported'}</span>
                          </span>
                        ) : (
                          <span>{i18n.language === 'vi' ? 'Chưa báo cáo' : 'No report'}</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 justify-end">
                  <div className="px-3 py-1 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-bold transition-all shadow-sm">
                    {t('adminschedule.tasks_count', { count: person.tasks.length })}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${person.person_id}`);
                    }}
                    className="px-3.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-blue-600 border border-gray-200 hover:border-blue-200 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    <span>{i18n.language === 'vi' ? 'Hồ sơ' : 'Profile'}</span>
                    <span className="text-[10px]">→</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
