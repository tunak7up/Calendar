import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { taskService } from '../services/taskService';
import { scheduleService } from '../services/scheduleService';
import { dailyReportService } from '../services/dailyReportService';
import { useAuth } from '../context/AuthContext';
import ScheduleCalendar from '../components/ScheduleCalendar';
import ProfileWorkHoursChart from '../components/ProfileWorkHoursChart';
import {
  ArrowLeftIcon,
  UserIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  ClockIcon,
  PlusIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { formatDateTime } from '../utils/dateUtils';

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  // If no ID is provided, assume viewing own profile
  const targetId = id || user?.person_id;

  const [profileData, setProfileData] = useState(null);
  const [allSchedules, setAllSchedules] = useState([]);
  const [dailyReports, setDailyReports] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // States for ScheduleCalendar
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!targetId) return;

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [personRes, schedRes, tasksRes, repRes] = await Promise.all([
          apiFetch(`/person`), // Fetch all and find, or if there's a /person/:id endpoint, use it. Wait, apiFetch('/person') gets all.
          scheduleService.getScheduleByPersonId(targetId),
          taskService.getAllTasksByParticipantId(targetId),
          dailyReportService.getDailyReportByPersonId(targetId)
        ]);

        if (personRes.success) {
          const person = personRes.data.find(p => p.person_id.toString() === targetId.toString());
          if (person) {
            setProfileData(person);
          }
        }

        if (schedRes.success) {
          setAllSchedules(schedRes.data);
        }

        if (tasksRes.success) {
          setTasks(tasksRes.data);
        }

        if (repRes.success) {
          setDailyReports(repRes.data);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [targetId]);

  const calendarEvents = React.useMemo(() => {
    return allSchedules.map(item => {
      const colorSet = { bg: '#3b82f6', border: '#2563eb', text: '#ffffff' };
      const dateOnly = item.working_date ? new Date(item.working_date).toISOString().split('T')[0] : null;
      return {
        id: `sched_${item.schedule_id}`,
        title: `${new Date(item.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(item.end_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
        start: dateOnly,
        allDay: true,
        backgroundColor: colorSet.bg,
        borderColor: colorSet.border,
        textColor: colorSet.text,
        extendedProps: { ...item }
      };
    });
  }, [allSchedules]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 font-semibold">Loading profile...</div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">User Not Found</h2>
          <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">Go Back</button>
        </div>
      </div>
    );
  }

  const isOwnProfile = user?.person_id.toString() === targetId.toString();

  const handleAssignTask = () => {
    navigate('/tasks/add', {
      state: {
        assignee: {
          username: profileData.username,
          role: 'assignee'
        }
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'in progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back
        </button>

        {isAdmin && !isOwnProfile && (
          <button
            onClick={handleAssignTask}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            <PlusIcon className="w-4 h-4" />
            Assign Task
          </button>
        )}
      </div>

      {/* Profile Card */}
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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{profileData.name}</h1>
            <p className="text-gray-500 font-medium mt-1">@{profileData.username}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100 uppercase tracking-wider">
                <BriefcaseIcon className="w-4 h-4" />
                {profileData.role || 'Employee'}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border uppercase tracking-wider ${profileData.status ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                <ShieldCheckIcon className="w-4 h-4" />
                {profileData.status ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Tasks */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-6 flex flex-col h-[320px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                <CheckCircleIcon className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Danh sách công việc</h2>
            </div>
            <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-lg">
              {tasks.length} Total
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 max-h-[220px] space-y-3">
            {tasks.length === 0 ? (
              <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-sm font-semibold text-gray-400">No assigned tasks</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div key={task.task_id} onClick={() => navigate(`/tasks/${task.task_id}`)} className="p-4 rounded-2xl border border-gray-100 bg-[#f8fafc] hover:border-purple-200 hover:shadow-sm transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-purple-700 transition-colors">{task.name || task.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(task.status)} border`}>
                      {task.status || 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-3.5 h-3.5" />
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1 text-purple-600">
                      Role: {task.role || 'Assignee'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Work Hours Chart */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-[320px]">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-violet-600" />
              Thời gian làm việc theo tháng
            </h2>
          </div>
          <div className="p-4 flex-1 flex flex-col justify-center">
            <ProfileWorkHoursChart dailyReports={dailyReports} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* FullCalendar Schedule */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CalendarDaysIcon className="w-5 h-5 text-blue-600" />
              Lịch làm việc
            </h2>
          </div>
          <div className="p-4 flex-1">
            <ScheduleCalendar
              initialDate={selectedDate}
              events={calendarEvents}
              selectedDate={selectedDate}
              onDateClick={(arg) => setSelectedDate(arg.dateStr)}
              onDatesSet={() => { }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
