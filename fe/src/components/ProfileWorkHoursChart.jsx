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
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

export default function ProfileWorkHoursChart({ dailyReports = [] }) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const parseActualHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    try {
      const [sH, sM, sS = 0] = checkIn.split(':').map(Number);
      const [eH, eM, eS = 0] = checkOut.split(':').map(Number);
      return Math.max(0, ((eH * 3600 + eM * 60 + eS) - (sH * 3600 + sM * 60 + sS)) / 3600);
    } catch { return 0; }
  };

  const monthlyActual = useMemo(() => {
    // Initialize all 12 months with 0
    const map = Array.from({ length: 12 }, () => 0);

    dailyReports.forEach(r => {
      const dateStr = r.working_date;
      if (!dateStr) return;
      const date = new Date(dateStr);
      if (date.getFullYear() !== selectedYear) return;
      const monthIdx = date.getMonth(); // 0-indexed
      map[monthIdx] += parseActualHours(r.check_in, r.check_out);
    });

    return map.map(h => Math.round(h * 10) / 10);
  }, [dailyReports, selectedYear]);

  const chartData = {
    labels: MONTHS,
    datasets: [
      {
        label: 'Giờ thực tế',
        data: monthlyActual,
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
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.92)',
        titleFont: { size: 13, weight: '700' },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label: ctx => ` ${ctx.parsed.y.toFixed(1)} giờ`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter, sans-serif', size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { font: { family: 'Inter, sans-serif', size: 11 }, callback: v => `${v}h` },
        title: { display: true, text: 'Số giờ', font: { size: 11, weight: '600' }, color: '#9ca3af' },
      },
    },
    interaction: { mode: 'index', intersect: false },
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Year Selector */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => setSelectedYear(y => y - 1)}
          className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-gray-700 min-w-[40px] text-center">{selectedYear}</span>
        <button
          onClick={() => setSelectedYear(y => y + 1)}
          disabled={selectedYear >= currentYear}
          className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
