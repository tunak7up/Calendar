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

import './styles/App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState('schedule');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [preSelectedDate, setPreSelectedDate] = useState(null);
  const [currentParentTask, setCurrentParentTask] = useState(null);

  const handleNavigateWithDate = (page, date) => {
    setPreSelectedDate(date);
    setActiveSidebarItem(page);
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
      return <MySchedule onNavigateWithDate={handleNavigateWithDate} />;
    }
    if (activeSidebarItem === 'task' || activeSidebarItem === 'task_add') {
      return <AddTask initialDate={preSelectedDate} />;
    }
    if (activeSidebarItem === 'task_list') {
      return <TaskList onAddSubTask={(task) => {
        setCurrentParentTask(task);
        setActiveSidebarItem('task_sub_add');
      }} />;
    }
    if (activeSidebarItem === 'task_sub_add') {
      return <AddSubTask parentTask={currentParentTask} onBack={() => setActiveSidebarItem('task_list')} />;
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
      <HeaderPage activeItem={activeSidebarItem} onSelect={setActiveSidebarItem} />
      {activeSidebarItem !== 'schedule' && activeSidebarItem !== 'add_file' && (
        activeSidebarItem.startsWith('task') ? (
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
