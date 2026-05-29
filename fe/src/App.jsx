import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import HeaderPage from './layouts/HeaderPage'
import SidebarRegister from './layouts/SidebarRegister'
import RegistrationHistory from './pages/user/RegistrationHistory'
import RegistrationHistoryDetails from './pages/user/RegistrationHistoryDetails'
import RegisterWork from './pages/user/RegisterWork'
import RegisterLeave from './pages/user/RegisterLeave'
import MySchedule from './pages/user/MySchedule'
import Login from './pages/auth/Login'
import SidebarTask from './layouts/SidebarTask'
import AddTask from './pages/tasks/AddTask'
import TaskList from './pages/tasks/TaskList'
import AddSubTask from './pages/tasks/AddSubTask'
import TaskDetails from './pages/tasks/TaskDetails'
import SidebarAdmin from './layouts/SidebarAdmin'
import AdminEmployeeList from './pages/admin/AdminEmployeeList'
import AdminRequests from './pages/admin/AdminRequests'
import AdminSchedule from './pages/admin/AdminSchedule'
import AdminWorkHours from './pages/admin/AdminWorkHours'
import Profile from './pages/user/Profile'
import Dashboard from './pages/user/Dashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminReportHistory from './pages/admin/AdminReportHistory'

import './styles/App.css'

import MainLayout from './layouts/MainLayout'

function App() {
  const { isLoggedIn, isAdmin, isLoading, isLoggingOut, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect to login if not logged in
  useEffect(() => {
    if (!isLoading && !isLoggingOut && !isLoggedIn && location.pathname !== '/login') {
      navigate('/login');
    }
  }, [isLoggedIn, isLoading, isLoggingOut, location.pathname, navigate]);

  // Hiện loading khi đang kiểm tra auth hoặc đang đăng xuất
  if (isLoading || isLoggingOut) {
    return (
      <div className="fixed inset-0 bg-gray-200 z-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0056b3]"></div>
        <p className="mt-4 text-[#0056b3] font-bold tracking-tight">Đang tải...</p>
      </div>
    );
  }

  if (!isLoggedIn && location.pathname !== '/login') {
    return null;
  }

  const isTaskPath = location.pathname.startsWith('/tasks');
  const isAdminPath = location.pathname.startsWith('/admin');
  const isRegisterPath = location.pathname.startsWith('/register') || location.pathname === '/history' || location.pathname.startsWith('/history/');

  const renderSidebar = () => {
    if (location.pathname === '/schedule' || location.pathname === '/admin/schedule' || location.pathname === '/dashboard' || location.pathname === '/admin/dashboard') {
      return null;
    }

    // Admin pages with only 1 sidebar item — don't show sidebar
    const singleItemAdminPaths = ['/admin/employees', '/admin/requests', '/admin/work-hours', '/admin/reports'];
    if (isAdmin && singleItemAdminPaths.includes(location.pathname)) {
      return null;
    }

    if (isAdmin && isAdminPath) {
      return <SidebarAdmin activeItem={location.pathname} />;
    }

    if (isTaskPath) {
      return <SidebarTask activeItem={location.pathname} />;
    }

    if (isRegisterPath) {
      return <SidebarRegister activeItem={location.pathname} />;
    }

    return null;
  }

  const sidebar = renderSidebar();
  const hasSidebar = !!sidebar;
  const isCalendarPage = location.pathname === '/schedule' || location.pathname === '/admin/schedule';

  return (
    <div className="antialiased bg-gray-200 min-h-screen flex flex-col">
      {location.pathname !== '/login' && (
        <HeaderPage
          activeItem={location.pathname}
          isAdmin={isAdmin}
        />
      )}

      {sidebar}

      {location.pathname === '/login' ? (
        <main className="flex-1">
          <Routes>
            <Route path="/login" element={<Login onLogin={(data) => {
              navigate(data.user?.role === 'manager' ? '/admin/dashboard' : '/dashboard');
            }} />} />
          </Routes>
        </main>
      ) : (
        <MainLayout hasSidebar={hasSidebar} maxWidth={isCalendarPage ? 'max-w-full' : 'max-w-7xl'}>
          <Routes>
            {/* User Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/schedule" element={<MySchedule />} />
            <Route path="/register/work" element={<RegisterWork />} />
            <Route path="/register/leave" element={<RegisterLeave />} />
            <Route path="/history" element={<RegistrationHistory />} />
            <Route path="/history/:id" element={<RegistrationHistoryDetails />} />

            <Route path="/tasks" element={<TaskList isAdmin={isAdmin} />} />
            <Route path="/tasks/add" element={<AddTask />} />
            <Route path="/tasks/:id" element={<TaskDetails />} />
            <Route path="/tasks/sub-add/:parentId" element={<AddSubTask />} />

            {/* Profile Routes */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:id" element={<Profile />} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={isAdmin ? <AdminDashboard /> : <Navigate to="/schedule" />} />
            <Route path="/admin/employees" element={isAdmin ? <AdminEmployeeList /> : <Navigate to="/schedule" />} />
            <Route path="/admin/requests" element={isAdmin ? <AdminRequests /> : <Navigate to="/schedule" />} />
            <Route path="/admin/schedule" element={isAdmin ? <AdminSchedule /> : <Navigate to="/schedule" />} />
            <Route path="/admin/work-hours" element={isAdmin ? <AdminWorkHours /> : <Navigate to="/schedule" />} />
            <Route path="/admin/reports" element={isAdmin ? <AdminReportHistory /> : <Navigate to="/schedule" />} />

            {/* Redirects */}
            <Route path="/" element={<Navigate to={isLoggedIn ? (isAdmin ? "/admin/dashboard" : "/dashboard") : "/login"} />} />
          </Routes>
        </MainLayout>
      )}
    </div>
  )
}

export default App
