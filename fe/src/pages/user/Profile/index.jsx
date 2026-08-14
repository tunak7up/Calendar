import React from 'react';
import { CalendarDaysIcon, ClockIcon, PlusIcon, SparklesIcon } from '@heroicons/react/24/outline';
import ScheduleCalendar from '../../../components/ScheduleCalendar';
import ProfileWorkHoursChart from '../../../components/ProfileWorkHoursChart';
import BackButton from '../../../components/BackButton';
import PWASettings from '../../../components/PWASettings';
import { useProfile } from './hooks/useProfile';
import ProfileCard from './components/ProfileCard';
import ProfileTasksCard from './components/ProfileTasksCard';
import WorkdayDetailModal from './components/WorkdayDetailModal';
import AiAnalysisModal from './components/AiAnalysisModal';

export default function Profile() {
  const {
    t,
    isVi,
    navigate,
    isAdmin,
    theme,
    profileData,
    dailyReports,
    tasks,
    sortedTasks,
    loading,
    regTheme,
    unschedTheme,
    absentTheme,
    upcomingTheme,
    calendarEvents,
    selectedDate,
    setSelectedDate,
    selectedDateDetail,
    isDetailModalOpen,
    setIsDetailModalOpen,
    isAnalysisModalOpen,
    setIsAnalysisModalOpen,
    analysisResult,
    analyzing,
    analysisError,
    copied,
    isOwnProfile,
    getTaskStatusLabel,
    getStatusColor,
    handleAssignTask,
    handleAnalyzePerformance,
    handleCopyAnalysis
  } = useProfile();

  if (loading || !theme) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 font-semibold">{t('profile.loading')}</div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('profile.not_found')}</h2>
          <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">{t('history.back')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header Actions */}
      <div className="flex items-center justify-between gap-2">
        <BackButton />

        <div className="flex items-center gap-1.5 sm:gap-3">
          {isAdmin && (
            <button
              onClick={handleAnalyzePerformance}
              className="flex items-center gap-1 sm:gap-2 bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-purple-500/20 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <SparklesIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>{isVi ? 'Phân tích AI' : 'AI Analysis'}</span>
            </button>
          )}

          {isAdmin && !isOwnProfile && (
            <button
              onClick={handleAssignTask}
              data-customizable-id="btn-profile-assign-task"
              data-customizable-type="bg"
              className="flex items-center gap-1 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-purple-500/20 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <PlusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>{t('profile.assign_task')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <ProfileCard profileData={profileData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Tasks */}
        <ProfileTasksCard
          tasks={tasks}
          sortedTasks={sortedTasks}
          getStatusColor={getStatusColor}
          getTaskStatusLabel={getTaskStatusLabel}
          onNavigate={navigate}
        />

        {/* Work Hours Chart */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-[320px]">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-violet-600" />
              {t('profile.monthly_hours')}
            </h2>
          </div>
          <div className="p-4 flex-1 flex flex-col justify-center">
            <ProfileWorkHoursChart dailyReports={dailyReports} />
          </div>
        </div>
      </div>

      {isOwnProfile && <PWASettings />}

      <div className="grid grid-cols-1 gap-6">
        {/* FullCalendar Schedule */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CalendarDaysIcon className="w-5 h-5 text-blue-600" />
              {t('myschedule.work_title')}
            </h2>
          </div>
          <div className="p-4 flex-1">
            {/* Color Legend Bar */}
            <div className="flex flex-wrap gap-3 mb-5 text-[10px] font-bold text-gray-500 bg-gray-50/50 p-3 rounded-2xl border border-gray-100 shadow-inner">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border" data-custom-component="Schedule-User-Registered" style={{ backgroundColor: regTheme.bg, borderColor: regTheme.bg }}></span>
                <span style={{ color: regTheme.text }}>{t('myschedule.legend_scheduled')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border" data-custom-component="Schedule-User-Unscheduled" style={{ backgroundColor: unschedTheme.bg, borderColor: unschedTheme.bg }}></span>
                <span style={{ color: unschedTheme.text }}>{t('myschedule.legend_unscheduled')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border" data-custom-component="Schedule-User-Absent" style={{ backgroundColor: absentTheme.bg, borderColor: absentTheme.bg }}></span>
                <span style={{ color: absentTheme.text }}>{t('myschedule.legend_absent')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border" data-custom-component="Schedule-User-Upcoming" style={{ backgroundColor: upcomingTheme.bg, borderColor: upcomingTheme.bg }}></span>
                <span style={{ color: upcomingTheme.text }}>{t('myschedule.legend_upcoming')}</span>
              </div>
            </div>

            <ScheduleCalendar
              initialDate={selectedDate}
              events={calendarEvents}
              selectedDate={selectedDate}
              onDateClick={(arg) => {
                setSelectedDate(arg.dateStr);
                setIsDetailModalOpen(true);
              }}
              onEventClick={(event) => {
                const dateStr = event.startStr || (event.start instanceof Date ? event.start.toISOString().split('T')[0] : event.start?.split?.(/[T ]/)?.[0]);
                if (dateStr) {
                  setSelectedDate(dateStr);
                  setIsDetailModalOpen(true);
                }
              }}
              onDatesSet={() => { }}
            />
          </div>
        </div>
      </div>

      {/* Workday Details Modal */}
      <WorkdayDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        selectedDate={selectedDate}
        selectedDateDetail={selectedDateDetail}
      />

      {/* AI Performance Analysis Modal */}
      <AiAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        isVi={isVi}
        profileName={profileData.name}
        analyzing={analyzing}
        analysisError={analysisError}
        analysisResult={analysisResult}
        copied={copied}
        onRetry={handleAnalyzePerformance}
        onCopy={handleCopyAnalysis}
      />
    </div>
  );
}
