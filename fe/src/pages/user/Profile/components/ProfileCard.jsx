import React from 'react';
import { BriefcaseIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

export default function ProfileCard({ profileData }) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative shrink-0">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || profileData.username)}&background=101c23&color=12a4d9&rounded=true&size=120`}
            alt="Profile"
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-lg"
          />
          {profileData.status && (
            <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 border-2 border-white rounded-full"></div>
          )}
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight" data-customizable-id="profile-name" data-customizable-type="text">
            {profileData.name}
          </h1>
          <p className="text-gray-500 font-medium mt-1" data-customizable-id="profile-username" data-customizable-type="text">
            @{profileData.username}
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100 uppercase tracking-wider" data-customizable-id="profile-role-badge" data-customizable-type="bg">
              <BriefcaseIcon className="w-4 h-4" />
              {profileData.role === 'manager' ? t('profile.role_manager') : t('profile.role_employee')}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border uppercase tracking-wider ${profileData.status ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`} data-customizable-id="profile-status-badge" data-customizable-type="bg">
              <ShieldCheckIcon className="w-4 h-4" />
              {profileData.status ? t('profile.active') : t('profile.inactive')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
