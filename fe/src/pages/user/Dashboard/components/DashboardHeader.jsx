import React from "react";
import { ClockIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";

export default function DashboardHeader({ user, checkInTime, checkOutTime }) {
  const { t } = useTranslation();

  const formatTime = (time) =>
    time instanceof Date && !isNaN(time)
      ? time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "--:--";

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <h1
          className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight"
          data-customizable-id="dashboard-welcome"
          data-customizable-type="text"
        >
          {t("dashboard.welcome", { name: user?.name || user?.username })}
        </h1>
        <p
          className="text-gray-500 mt-1 text-sm sm:text-base"
          data-customizable-id="dashboard-welcome-sub"
          data-customizable-type="text"
        >
          {t("dashboard.subtitle")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        {checkInTime && (
          <div className="bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-3 flex-1 md:flex-none">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider leading-none mb-1">
                {t("dashboard.checked_in")}
              </span>
              <span className="text-sm font-bold text-gray-900">
                {formatTime(checkInTime)}
              </span>
            </div>
          </div>
        )}
        {checkOutTime && (
          <div className="bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-blue-100 flex items-center gap-3 flex-1 md:flex-none">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider leading-none mb-1">
                {t("dashboard.checked_out")}
              </span>
              <span className="text-sm font-bold text-gray-900">
                {formatTime(checkOutTime)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
