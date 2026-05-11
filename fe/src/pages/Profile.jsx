import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { taskService } from '../services/taskService';
import { scheduleService } from '../services/scheduleService';
import { useAuth } from '../context/AuthContext';
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
  const [schedules, setSchedules] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetId) return;

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [personRes, schedRes, tasksRes] = await Promise.all([
          apiFetch(`/person`), // Fetch all and find, or if there's a /person/:id endpoint, use it. Wait, apiFetch('/person') gets all.
          scheduleService.getScheduleByPersonId(targetId),
          taskService.getAllTasksByParticipantId(targetId)
        ]);

        if (personRes.success) {
          const person = personRes.data.find(p => p.person_id.toString() === targetId.toString());
          if (person) {
            setProfileData(person);
          }
        }

        if (schedRes.success) {
          // Sort schedules by date upcoming
          const sortedSchedules = schedRes.data.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
          // Filter to only show upcoming or recent
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const upcoming = sortedSchedules.filter(s => new Date(s.start_time.split(' ')[0]) >= now);
          setSchedules(upcoming);
        }

        if (tasksRes.success) {
          setTasks(tasksRes.data);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [targetId]);

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
        {/* Upcoming Schedule */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-50 rounded-xl text-orange-600">
              <CalendarDaysIcon className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Upcoming Shifts</h2>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 max-h-[400px] space-y-3">
            {schedules.length === 0 ? (
              <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-sm font-semibold text-gray-400">No upcoming shifts</p>
              </div>
            ) : (
              schedules.slice(0, 10).map((s, idx) => {
                const dateObj = new Date(s.start_time.split(' ')[0]);
                return (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-[#f8fafc] hover:border-orange-200 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-50 text-center min-w-[60px]">
                        <div className="text-[10px] font-bold text-gray-400 uppercase">{dateObj.toLocaleString('default', { month: 'short' })}</div>
                        <div className="text-lg font-extrabold text-gray-900">{dateObj.getDate()}</div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{dateObj.toLocaleDateString('default', { weekday: 'long' })}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 font-medium">
                          <ClockIcon className="w-3.5 h-3.5" />
                          {s.start_time.split(' ')[1].substring(0, 5)} - {s.end_time.split(' ')[1].substring(0, 5)}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
                      Shift
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Assigned Tasks */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                <CheckCircleIcon className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Active Tasks</h2>
            </div>
            <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-lg">
              {tasks.length} Total
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 max-h-[400px] space-y-3">
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
      </div>
    </div>
  );
}
