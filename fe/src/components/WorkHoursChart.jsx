import React, { useMemo, useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * WorkHoursChart
 *
 * Props:
 * - employees:    Array<{ person_id, name, username, role }>
 * - schedules:    Array<{ person_id, start_time, end_time, working_date }>
 * - dailyReports: Array<{ person_id, check_in, check_out }>
 * - startDate:    string (YYYY-MM-DD)
 * - endDate:      string (YYYY-MM-DD)
 */
export default function WorkHoursChart({ employees = [], schedules = [], dailyReports = [], startDate, endDate }) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const registeredBg = theme?.['[data-custom-component="ChartColor-Registered"]']?.bg || 'rgba(59, 130, 246, 0.75)';
  const actualBg = theme?.['[data-custom-component="ChartColor-Actual"]']?.bg || 'rgba(16, 185, 129, 0.75)';


  // --- helpers ---
  const parseScheduleHours = (start, end) => {
    if (!start || !end) return 0;
    try {
      const parseDateSafe = (str) => {
        if (!str) return null;
        let d = new Date(str);
        if (!isNaN(d.getTime())) return d;
        // Fallback for iOS/Safari: parse manually
        const match = str.match(/^(\d{4})[./-](\d{2})[./-](\d{2})(?:[T ](\d{2}):(\d{2}):(\d{2}))?/);
        if (match) {
          const [, y, m, day, h = '00', min = '00', s = '00'] = match;
          const utcTime = Date.UTC(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(day, 10), parseInt(h, 10) - 7, parseInt(min, 10), parseInt(s, 10));
          const target = new Date(utcTime);
          if (!isNaN(target.getTime())) return target;
        }
        return null;
      };

      const s = parseDateSafe(start);
      const e = parseDateSafe(end);

      if (s && e) {
        const rawHours = Math.max(0, (e - s) / 3_600_000);
        const startSeconds = s.getHours() * 3600 + s.getMinutes() * 60 + s.getSeconds();
        const endSeconds = e.getHours() * 3600 + e.getMinutes() * 60 + e.getSeconds();
        const spansLunch = startSeconds < 43200 && endSeconds > 46800;
        const breakDeduction = spansLunch ? 1.0 : 0.0;
        return Math.max(0, rawHours - breakDeduction);
      }

      // Fallback if strings are just "HH:MM"
      const sMatch = start.match(/(\d{2}):(\d{2})/);
      const eMatch = end.match(/(\d{2}):(\d{2})/);
      if (sMatch && eMatch) {
        const sH = parseInt(sMatch[1], 10);
        const sM = parseInt(sMatch[2], 10);
        const eH = parseInt(eMatch[1], 10);
        const eM = parseInt(eMatch[2], 10);
        const rawHours = Math.max(0, (eH + eM / 60) - (sH + sM / 60));
        const startSeconds = sH * 3600 + sM * 60;
        const endSeconds = eH * 3600 + eM * 60;
        const spansLunch = startSeconds < 43200 && endSeconds > 46800;
        const breakDeduction = spansLunch ? 1.0 : 0.0;
        return Math.max(0, rawHours - breakDeduction);
      }

      return 0;
    } catch { return 0; }
  };

  const parseActualHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    try {
      const [sH, sM, sS = 0] = checkIn.split(':').map(Number);
      const [eH, eM, eS = 0] = checkOut.split(':').map(Number);
      const startSeconds = sH * 3600 + sM * 60 + sS;
      const endSeconds = eH * 3600 + eM * 60 + eS;
      const rawHours = Math.max(0, (endSeconds - startSeconds) / 3600);

      // Trừ 1 giờ nghỉ trưa nếu check in trước 12:00 và check out sau 13:00
      const spansLunch = startSeconds < 43200 && endSeconds > 46800;
      const breakDeduction = spansLunch ? 1.0 : 0.0;

      return Math.max(0, rawHours - breakDeduction);
    } catch { return 0; }
  };

  // --- compute per-employee totals (ALL employees including those with no data) ---
  const summary = useMemo(() => {
    const filteredSchedules = startDate && endDate
      ? schedules.filter(s => {
        const d = (s.working_date || '').split('T')[0];
        return d >= startDate && d <= endDate;
      })
      : schedules;

    return employees
      .filter(emp => emp.role !== 'manager')
      .map(emp => {
        const empSchedules = filteredSchedules.filter(s => s.person_id === emp.person_id);
        const empReports = dailyReports.filter(r => r.person_id === emp.person_id);
        const registered = empSchedules.reduce((s, x) => s + parseScheduleHours(x.start_time, x.end_time), 0);
        const actual = empReports.reduce((s, r) => s + parseActualHours(r.check_in, r.check_out), 0);
        return {
          name: emp.name || emp.username,
          registered: Math.round(registered * 10) / 10,
          actual: Math.round(actual * 10) / 10,
          diff: Math.round((actual - registered) * 10) / 10,
        };
      })
      .sort((a, b) => b.registered - a.registered);
  }, [employees, schedules, dailyReports, startDate, endDate]);

  const displayed = summary;

  const chartData = {
    labels: displayed.map(e => e.name),
    datasets: [
      {
        label: t('dashboard.registered'),
        data: displayed.map(e => e.registered),
        backgroundColor: registeredBg,
        borderColor: registeredBg,
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: t('dashboard.reality'),
        data: displayed.map(e => e.actual),
        backgroundColor: actualBg,
        borderColor: actualBg,
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.92)',
        titleFont: { size: 13, weight: '700' },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} `,
          afterBody: (items) => {
            const idx = items[0]?.dataIndex;
            if (idx === undefined) return [];
            const e = displayed[idx];
            const sign = e.diff >= 0 ? '+' : '';
            return [` ${t('dashboard.difference')}: ${sign}${e.diff.toFixed(1)} `];
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter, sans-serif', size: 11 }, maxRotation: 30 },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { font: { family: 'Inter, sans-serif', size: 11 }, callback: v => `${v}h` },
        title: { display: true, text: t('dashboard.hours'), font: { size: 11, weight: '600' }, color: '#9ca3af' },
      },
    },
    interaction: { mode: 'index', intersect: false },
  };

  if (summary.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <p className="text-sm font-medium">{t('dashboard.empty')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full w-full gap-5">
      {/* Bar chart */}
      <div className="flex-none h-[250px] lg:h-auto lg:flex-[2] relative lg:min-h-0 flex flex-col">
        {/* Custom Legend */}
        <div className="flex justify-center gap-6 mb-3 border border-gray-100 p-2 rounded-xl bg-gray-50/50 shadow-inner w-fit mx-auto select-none">
          <div 
            className="flex items-center gap-2 cursor-pointer px-3 py-1 rounded-lg hover:bg-white transition-all shadow-sm border border-transparent hover:border-gray-100"
            data-custom-component="ChartColor-Registered"
          >
            <span className="w-3.5 h-3.5 rounded shadow-sm border" style={{ backgroundColor: registeredBg, borderColor: registeredBg }}></span>
            <span className="text-xs font-bold text-gray-700">{t('dashboard.registered')}</span>
          </div>
          <div 
            className="flex items-center gap-2 cursor-pointer px-3 py-1 rounded-lg hover:bg-white transition-all shadow-sm border border-transparent hover:border-gray-100"
            data-custom-component="ChartColor-Actual"
          >
            <span className="w-3.5 h-3.5 rounded shadow-sm border" style={{ backgroundColor: actualBg, borderColor: actualBg }}></span>
            <span className="text-xs font-bold text-gray-700">{t('dashboard.reality')}</span>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <Bar data={chartData} options={options} />
        </div>
      </div>

      {/* Detail ranking table */}
      <div className="flex-1 lg:flex-[1] flex flex-col min-h-0 border border-gray-100 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-gray-50 px-3 py-2 border-b border-gray-100">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t('dashboard.work_hours_ranking')}</h3>
        </div>
        <div className="flex-1 overflow-y-auto bg-white">
          <table className="w-full text-sm text-left">
            <thead className="bg-white sticky top-0 border-b border-gray-100 shadow-sm z-10">
              <tr>
                <th className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('dashboard.employee')}</th>
                <th className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right" title="Đăng ký / Thực tế">{t('dashboard.registered')} / {t('dashboard.reality')}</th>
                <th className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">{t('dashboard.difference')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayed.map((e, i) => (
                <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-3 py-2 font-semibold text-gray-800 text-xs">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-100 text-gray-500 text-[9px] mr-1.5">{i + 1}</span>
                    {e.name}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold" style={{ color: registeredBg }}>{e.registered.toFixed(1)}h</span>
                      <span className="text-[10px] font-bold" style={{ color: actualBg }}>{e.actual.toFixed(1)}h</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${e.diff > 0 ? 'bg-amber-100 text-amber-700' : e.diff < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                      {e.diff > 0 ? '+' : ''}{e.diff.toFixed(1)}h
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
