import { useState } from 'react'
import HeaderPage from './layouts/HeaderPage'
import SidebarRegister from './layouts/SidebarRegister'
import RegistrationHistory from './pages/RegistrationHistory'
import RegistrationHistoryDetails from './pages/RegistrationHistoryDetails'
import RegisterWork from './pages/RegisterWork'
import RegisterLeave from './pages/RegisterLeave'
import MySchedule from './pages/MySchedule'
import Login from './pages/Login'
import './styles/App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState('schedule'); // 'list', 'leave', 'work', 'schedule'
  const [selectedRequest, setSelectedRequest] = useState(null);

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
  };

  const handleBackToHistory = () => {
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
    
    if (selectedRequest) {
      return <RegistrationHistoryDetails request={selectedRequest} onBack={handleBackToHistory} />;
    }
    return <RegistrationHistory onViewDetails={handleViewDetails} onNavigate={setActiveSidebarItem} />;
  }

  // Show login page if not authenticated
  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="antialiased bg-gray-50 min-h-screen flex flex-col">
      <HeaderPage activeItem={activeSidebarItem} onSelect={setActiveSidebarItem} />
      <SidebarRegister activeItem={activeSidebarItem} onSelect={setActiveSidebarItem} />
      <main className="flex-1">
        {renderContent()}
      </main>
    </div>
  )
}

export default App
