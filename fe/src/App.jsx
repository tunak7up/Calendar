import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import HeaderPage from './layouts/HeaderPage'
import SidebarRegister from './layouts/SidebarRegister'
import RegistrationHistory from './pages/RegistrationHistory'
import RegistrationHistoryDetails from './pages/RegistrationHistoryDetails'
import RegisterWork from './pages/RegisterWork'
import RegisterLeave from './pages/RegisterLeave'
import MySchedule from './pages/MySchedule'
import Login from './pages/Login'
import SidebarTask from './layouts/SidebarTask'
import AddTask from './pages/AddTask'
import TaskList from './pages/TaskList'
import AddSubTask from './pages/AddSubTask'
import TaskDetails from './pages/TaskDetails'
import SidebarAdmin from './layouts/SidebarAdmin'
import AdminEmployeeList from './pages/AdminEmployeeList'
import AdminRequests from './pages/AdminRequests'
import AdminSchedule from './pages/AdminSchedule'
import AdminWorkHours from './pages/AdminWorkHours'

import './styles/App.css'

function App() {
  const { isLoggedIn, isAdmin: authIsAdmin, isLoading, logout } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Đồng bộ isAdmin từ AuthContext
  useEffect(() => {
    setIsAdmin(authIsAdmin);
  }, [authIsAdmin]);

  // Redirect to login if not logged in
  useEffect(() => {
    if (!isLoading && !isLoggedIn && location.pathname !== '/login') {
      navigate('/login');
    }
  }, [isLoggedIn, isLoading, location.pathname, navigate]);

  // Hiện loading khi đang kiểm tra auth
  if (isLoading) {
    return null;
  }

  if (!isLoggedIn && location.pathname !== '/login') {
    return null;
  }

  const isTaskPath = location.pathname.startsWith('/tasks');
  const isAdminPath = location.pathname.startsWith('/admin');
  const isRegisterPath = location.pathname.startsWith('/register') || location.pathname === '/history' || location.pathname.startsWith('/history/');

  const renderSidebar = () => {
    if (location.pathname === '/schedule' || location.pathname === '/admin/schedule') {
      return null;
    }

    // Admin pages with only 1 sidebar item — don't show sidebar
    const singleItemAdminPaths = ['/admin/employees', '/admin/requests', '/admin/work-hours'];
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

  return (
    <div className="antialiased bg-gray-50 min-h-screen flex flex-col">
      {location.pathname !== '/login' && (
        <HeaderPage 
          activeItem={location.pathname} 
          isAdmin={isAdmin} 
          setIsAdmin={setIsAdmin} 
        />
      )}
      
      {renderSidebar()}

      <main className="flex-1">
        <Routes>
          <Route path="/login" element={<Login onLogin={() => { navigate('/schedule'); }} />} />
          
          {/* User Routes */}
          <Route path="/schedule" element={<MySchedule />} />
          <Route path="/register/work" element={<RegisterWork />} />
          <Route path="/register/leave" element={<RegisterLeave />} />
          <Route path="/history" element={<RegistrationHistory />} />
          <Route path="/history/:id" element={<RegistrationHistoryDetails />} />
          
          <Route path="/tasks" element={<TaskList isAdmin={isAdmin} />} />
          <Route path="/tasks/add" element={<AddTask />} />
          <Route path="/tasks/:id" element={<TaskDetails />} />
          <Route path="/tasks/sub-add/:parentId" element={<AddSubTask />} />

          {/* Admin Routes */}
          <Route path="/admin/employees" element={isAdmin ? <AdminEmployeeList /> : <Navigate to="/schedule" />} />
          <Route path="/admin/requests" element={isAdmin ? <AdminRequests /> : <Navigate to="/schedule" />} />
          <Route path="/admin/schedule" element={isAdmin ? <AdminSchedule /> : <Navigate to="/schedule" />} />
          <Route path="/admin/work-hours" element={isAdmin ? <AdminWorkHours /> : <Navigate to="/schedule" />} />

          {/* Redirects */}
          <Route path="/" element={<Navigate to={isLoggedIn ? "/schedule" : "/login"} />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
