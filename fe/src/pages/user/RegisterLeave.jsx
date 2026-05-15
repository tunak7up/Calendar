import React, { useState, useEffect } from 'react';
import { SunIcon, CloudIcon, CalendarDaysIcon, TrashIcon, CalendarIcon, ClockIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import WeekDatePicker from '../../components/WeekDatePicker';
import { getFullDateStr, getTimeRangeStr } from '../../utils/dateUtils';
import { scheduleService } from '../../services/scheduleService';
import { requestService } from '../../services/requestService';
import { useAuth } from '../../context/AuthContext';



export default function RegisterLeave() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const initialDate = location.state?.date;

  const [viewDateObj, setViewDateObj] = useState(initialDate ? new Date(initialDate) : new Date());
  const [reason, setReason] = useState('');
  const [schedule, setSchedule] = useState([]);
  const [workSchedules, setWorkSchedules] = useState([]);
  const [workDays, setWorkDays] = useState([]);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const result = await scheduleService.getScheduleByPersonId(user.person_id);
        if (result.success) {
          setWorkSchedules(result.data);
          const days = result.data.map(item => item.start_time.split(/[T ]/)[0]);
          setWorkDays(days);

          // If initialDate was passed, auto-add it if it's a work day
          if (initialDate && days.includes(initialDate)) {
            fetchShiftAndAdd(initialDate);
          }
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
      }
    };
    fetchSchedule();
  }, []);

  const fetchShiftAndAdd = async (dateStr) => {
    try {
      const res = await scheduleService.getShiftByDate(user.person_id, dateStr);
      if (res.success && res.data) {
        setSchedule(prev => {
          if (prev.some(item => item.date === dateStr)) return prev;
          return [...prev, {
            date: dateStr,
            shift: res.data,
            hours: res.data === 'Full Day' ? 8 : 4
          }];
        });
      } else {
        alert("You don't have a work schedule on this day.");
      }
    } catch (error) {
      console.error('Error fetching shift:', error);
    }
  };

  const handleDayClick = (dObj) => {
    const dStr = getFullDateStr(dObj);
    if (schedule.some(item => item.date === dStr)) {
      setSchedule(prev => prev.filter(item => item.date !== dStr));
    } else {
      fetchShiftAndAdd(dStr);
    }
  };

const handleCancel = () => {
  if (schedule.length > 0 || reason) {
    if (window.confirm("Are you sure you want to discard your leave request?")) {
      navigate(-1);
    }
  } else {
    navigate(-1);
  }
};

const handleSubmit = async () => {
  if (schedule.length === 0) {
    alert("Please add at least one leave day to the schedule.");
    return;
  }

  const requestDetails = schedule.map(item => {
    let startTime, endTime;
    if (item.shift === 'Morning') {
      startTime = `${item.date}T08:30:00+07:00`;
      endTime = `${item.date}T12:00:00+07:00`;
    } else if (item.shift === 'Afternoon') {
      startTime = `${item.date}T13:00:00+07:00`;
      endTime = `${item.date}T17:30:00+07:00`;
    } else { // Full Day
      startTime = `${item.date}T08:30:00+07:00`;
      endTime = `${item.date}T17:30:00+07:00`;
    }
    return {
      date: item.date,
      start_time: startTime,
      end_time: endTime
    };
  });

  const payload = {
    requester_id: user.person_id,
    approver_id: null,
    type: 'leave', // Important: Type is leave
    reason: reason || 'Nghỉ phép',
    request_details: requestDetails
  };

  try {
    const result = await requestService.submitRequest(payload);
    alert("Đã gửi yêu cầu nghỉ phép thành công!");
    setSchedule([]);
    setReason('');
    navigate('/history');
  } catch (error) {
    console.error('Error:', error);
    alert("Có lỗi xảy ra: " + error.message);
  }
};


const handleRemoveFromSchedule = (dateStr) => {
  setSchedule(prev => prev.filter(item => item.date !== dateStr));
};

const sortedSchedule = [...schedule].sort((a, b) => a.date.localeCompare(b.date));
const getTimeRangeStr = (shift) => {
  return shift === 'Morning' ? '08:30 - 12:00' : shift === 'Afternoon' ? '13:00 - 17:30' : '08:30 - 17:30';
};

return (
  <>
    <div>
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Quay lại
        </button>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Đăng ký nghỉ phép</h1>
        <p className="text-gray-500 mt-2 text-sm sm:text-base">Chọn ngày nghỉ và cung cấp lý do cho yêu cầu.</p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
        {/* Select Date */}
        <div className="mb-6">
          <WeekDatePicker
            viewDate={viewDateObj}
            onViewChange={setViewDateObj}
            selectedDates={schedule.map(item => item.date)}
            onDayClick={handleDayClick}
            workDays={workDays}
          />
        </div>



        {/* Schedule Table */}
        {schedule.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xs font-bold text-gray-500 tracking-wider mb-4 uppercase">Các ngày nghỉ đã chọn</h2>
            <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm max-h-[300px] overflow-y-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-400 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Ngày</th>
                    <th className="px-6 py-3 font-semibold">Ca làm</th>
                    <th className="px-6 py-3 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedSchedule.map(item => (
                    <tr key={item.date} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">{item.shift}</td>
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
          <h2 className="text-xs font-bold text-gray-500 tracking-wider mb-6 uppercase">Lý do</h2>
          <textarea
            className="w-full h-32 p-4 rounded-2xl border border-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white shadow-sm resize-none transition-all outline-none text-gray-700"
            placeholder="Vui lòng nhập lý do nghỉ phép..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          ></textarea>
        </div>

        <div className="h-px bg-gray-200 w-full my-6"></div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-[0.65rem] font-bold text-gray-500 tracking-wider uppercase">Tổng ngày nghỉ</h3>
              <span className="text-2xl font-bold text-gray-900">{schedule.length}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleCancel}>Hủy</Button>
            <Button onClick={handleSubmit}>Gửi yêu cầu nghỉ phép</Button>
          </div>
        </div>
      </div>
    </div>
  </>
  );
}
