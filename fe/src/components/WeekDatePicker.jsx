import { CalendarIcon } from '@heroicons/react/24/outline';

// ── Helpers ──────────────────────────────────────────────────────────────────

export const getFullDateStr = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const generateWeek = (dateObj) => {
  const dates = [];
  const date = new Date(dateObj.getTime());
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(date.setDate(diff));

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek.getTime());
    d.setDate(startOfWeek.getDate() + i);
    dates.push({
      day: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      date: d.getDate().toString(),
      fullDate: getFullDateStr(d),
      dateObj: d,
    });
  }
  return dates;
};

// ── Component ─────────────────────────────────────────────────────────────────
/**
 * WeekDatePicker
 *
 * Props:
 *   viewDate      {Date}       – the date used to determine which week is shown
 *   onViewChange  {fn(Date)}   – called when the calendar picker changes the view week
 *   selectedDates {string[]}   – array of "YYYY-MM-DD" strings that are highlighted
 *   onDayClick    {fn(Date)}   – called when the user clicks a day button
 *   multiSelect   {boolean}    – if false (default), clicking a selected day deselects it;
 *                                if true, multiple days stay selected (toggle behaviour)
 *   onCalendarPick {fn(string)} – optional, called with the raw "YYYY-MM-DD" when the
 *                                 hidden <input type="date"> fires (useful for multi-select
 *                                 pages that want to ADD the date from the picker)
 */
export default function WeekDatePicker({
  viewDate,
  onViewChange,
  selectedDates = [],
  onDayClick,
  onCalendarPick,
  workDays = [],
}) {
  const weekDates = generateWeek(viewDate);
  const viewDateStr = getFullDateStr(viewDate);

  const handleNativeChange = (e) => {
    const val = e.target.value;
    if (!val) return;
    const [y, m, d] = val.split('-');
    const newDate = new Date(y, m - 1, d);
    onViewChange(newDate);
    if (onCalendarPick) onCalendarPick(val);
  };

  return (
    <div>
      {/* Label row with calendar icon */}
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xs font-bold text-gray-500 tracking-wider uppercase m-0">Select Date</h2>
        <div className="relative w-8 h-8">
          <input
            type="date"
            value={viewDateStr}
            onChange={handleNativeChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="absolute inset-0 flex items-center justify-center rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
            <CalendarIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Week strip */}
      <div className="flex justify-between items-center max-w-2xl gap-2 overflow-x-auto pb-2">
        {weekDates.map((d) => {
          const active = selectedDates.includes(d.fullDate);
          const hasWork = workDays.includes(d.fullDate);
          return (
            <button
              key={d.fullDate}
              onClick={() => onDayClick(d.dateObj)}
              className={`flex flex-col items-center justify-center w-16 h-20 rounded-2xl transition-all flex-shrink-0 relative ${
                active ? 'bg-[#dbeafe] shadow-sm' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <span className={`text-[0.65rem] font-bold tracking-widest uppercase mb-1 ${active ? 'text-blue-500' : 'text-gray-400'}`}>
                {d.day}
              </span>
              <span className={`text-xl font-bold ${active ? 'text-blue-700' : 'text-gray-900'}`}>
                {d.date}
              </span>
              {hasWork && (
                <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${active ? 'bg-blue-600' : 'bg-blue-400'}`}></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
