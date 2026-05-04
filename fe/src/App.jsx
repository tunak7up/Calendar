import { useState } from 'react'
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

import './styles/App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState('schedule');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [preSelectedDate, setPreSelectedDate] = useState(null);
  const [currentParentTask, setCurrentParentTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const handleNavigateWithDate = (page, date) => {
    setPreSelectedDate(date);
    setActiveSidebarItem(page);
  };

  const handleTaskAction = (action, task) => {
    if (action === 'task_sub_add') {
      setCurrentParentTask(task);
      setActiveSidebarItem('task_sub_add');
    } else if (action === 'task_details') {
      setSelectedTask(task);
      setActiveSidebarItem('task_details');
    }
  };

  const isTaskSection = activeSidebarItem === 'task' || activeSidebarItem.startsWith('task_');

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
  };

  const handleBackToHistory = () => {
    setSelectedRequest(null);
  };

  const renderContent = () => {
    if (activeSidebarItem === 'work') {
      return <RegisterWork initialDate={preSelectedDate} />;
    }
    if (activeSidebarItem === 'leave') {
      return <RegisterLeave initialDate={preSelectedDate} />;
    }
    if (activeSidebarItem === 'schedule') {
      return <MySchedule onNavigateWithDate={handleNavigateWithDate} onTaskAction={handleTaskAction} />;
    }
    if (activeSidebarItem === 'task' || activeSidebarItem === 'task_add') {
      return <AddTask initialDate={preSelectedDate} />;
    }
    if (activeSidebarItem === 'task_list' || activeSidebarItem === 'admin_task') {
      return <TaskList 
        isAdmin={isAdmin}
        onAddSubTask={(task) => handleTaskAction('task_sub_add', task)} 
        onViewTask={(task) => handleTaskAction('task_details', task)} 
      />;
    }
    if (activeSidebarItem === 'task_sub_add') {
      return <AddSubTask parentTask={currentParentTask} onBack={() => setActiveSidebarItem('task_list')} />;
    }
    if (activeSidebarItem === 'task_details') {
      return <TaskDetails task={selectedTask} onBack={() => setActiveSidebarItem('task_list')} />;
    }

    if (activeSidebarItem === 'admin_employees') {
      return <AdminEmployeeList />;
    }
    if (activeSidebarItem === 'admin_requests') {
      return <AdminRequests />;
    }
    if (activeSidebarItem === 'admin_schedule') {
      return <AdminSchedule />;
    }

    if (selectedRequest) {
      return <RegistrationHistoryDetails request={selectedRequest} onBack={handleBackToHistory} />;
    }
    return <RegistrationHistory onViewDetails={handleViewDetails} onNavigate={setActiveSidebarItem} />;
  }

  // Show login page if not authenticated
  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  // Xác định activeItem cho header (task_list → 'task' để highlight đúng nav)
  // const headerActiveItem = isTaskSection ? 'task' : activeSidebarItem;

  return (
    <div className="antialiased bg-gray-50 min-h-screen flex flex-col">
      <HeaderPage activeItem={activeSidebarItem} onSelect={setActiveSidebarItem} isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
      {activeSidebarItem !== 'schedule' && activeSidebarItem !== 'admin_schedule' && activeSidebarItem !== 'add_file' && (
        isAdmin && ['admin_employees', 'admin_requests', 'task_list', 'task_add', 'task_details', 'task_sub_add', 'admin_task'].includes(activeSidebarItem) ? (
          <SidebarAdmin activeItem={activeSidebarItem === 'admin_task' ? 'task_list' : activeSidebarItem} onSelect={setActiveSidebarItem} />
        ) : activeSidebarItem.startsWith('task') ? (
          <SidebarTask activeItem={activeSidebarItem === 'task' ? 'task_add' : activeSidebarItem} onSelect={setActiveSidebarItem} />
        ) : (
          <SidebarRegister activeItem={activeSidebarItem} onSelect={setActiveSidebarItem} />
        )
      )}
      <main className="flex-1">
        {renderContent()}
      </main>
    </div>
  )
}


export default App
