import React, { useMemo, useState } from 'react';
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
  const [showAll, setShowAll] = useState(false);

  // --- helpers ---
  const parseScheduleHours = (start, end) => {
    if (!start || !end) return 0;
    try {
      const s = new Date(start);
      const e = new Date(end);
      let rawHours;
      let startSeconds;
      let endSeconds;
      if (!isNaN(s) && !isNaN(e)) {
        rawHours = Math.max(0, (e - s) / 3_600_000);
        startSeconds = s.getHours() * 3600 + s.getMinutes() * 60 + s.getSeconds();
        endSeconds = e.getHours() * 3600 + e.getMinutes() * 60 + e.getSeconds();
      } else {
        const [sH, sM] = start.split(':').map(Number);
        const [eH, eM] = end.split(':').map(Number);
        rawHours = Math.max(0, (eH + eM / 60) - (sH + sM / 60));
        startSeconds = sH * 3600 + sM * 60;
        endSeconds = eH * 3600 + eM * 60;
      }

      const spansLunch = startSeconds < 43200 && endSeconds > 46800;
      const breakDeduction = spansLunch ? 1.0 : 0.0;
      return Math.max(0, rawHours - breakDeduction);
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
        backgroundColor: 'rgba(59, 130, 246, 0.75)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: t('dashboard.reality'),
        data: displayed.map(e => e.actual),
        backgroundColor: 'rgba(16, 185, 129, 0.75)',
        borderColor: 'rgba(16, 185, 129, 1)',
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
        position: 'top',
        labels: {
          font: { family: 'Inter, sans-serif', size: 12, weight: '600' },
          usePointStyle: true,
          pointStyle: 'rectRounded',
          padding: 10,
        },
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
      <div className="flex-none h-[250px] lg:h-auto lg:flex-[2] relative lg:min-h-0">
        <Bar data={chartData} options={options} />
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
                      <span className="text-[10px] font-bold text-blue-600">{e.registered.toFixed(1)}h</span>
                      <span className="text-[10px] font-bold text-emerald-600">{e.actual.toFixed(1)}h</span>
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
