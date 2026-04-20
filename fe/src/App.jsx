import { useState } from 'react'
import HeaderPage from './layouts/HeaderPage'
import SidebarRegister from './layouts/SidebarRegister'
import SidebarTask from './layouts/SidebarTask'
import RegistrationHistory from './pages/RegistrationHistory'
import RegistrationHistoryDetails from './pages/RegistrationHistoryDetails'
import RegisterWork from './pages/RegisterWork'
import RegisterLeave from './pages/RegisterLeave'
import MySchedule from './pages/MySchedule'
import Login from './pages/Login'
import SidebarTask from './layouts/SidebarTask'
import AddTask from './pages/AddTask'
import TaskList from './pages/TaskList'
import './styles/App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState('schedule');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const isTaskSection = activeSidebarItem === 'task' || activeSidebarItem.startsWith('task_');

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
  };

  const handleBackToHistory = () => {
    setSelectedRequest(null);
  };

  const handleHeaderSelect = (id) => {
    if (id === 'task') {
      // Khi nhấn Task trên header, mặc định vào task_list
      setActiveSidebarItem('task_list');
    } else {
      setActiveSidebarItem(id);
    }
    setSelectedRequest(null);
  };

  const renderContent = () => {
    if (activeSidebarItem === 'work') {
      return <RegisterWork />;
    }
    if (activeSidebarItem === 'leave') {
      return <RegisterLeave />;
    }
    if (activeSidebarItem === 'schedule') {
      return <MySchedule />;
    }
    if (activeSidebarItem === 'task' || activeSidebarItem === 'task_add') {
      return <AddTask />;
    }
    if (activeSidebarItem === 'task_list') {
      return <TaskList />;
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
  const headerActiveItem = isTaskSection ? 'task' : activeSidebarItem;

  return (
    <div className="antialiased bg-gray-50 min-h-screen flex flex-col">
      <HeaderPage activeItem={activeSidebarItem} onSelect={setActiveSidebarItem} />
      {activeSidebarItem.startsWith('task') ? (
        <SidebarTask activeItem={activeSidebarItem === 'task' ? 'task_add' : activeSidebarItem} onSelect={setActiveSidebarItem} />
      ) : (
        <SidebarRegister activeItem={activeSidebarItem} onSelect={setActiveSidebarItem} />
      )}
      <main className="flex-1">
        {renderContent()}
      </main>
    </div>
  )
}

export default App
