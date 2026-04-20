import { useState } from 'react'
import HeaderPage from './components/HeaderPage'
import SidebarRegister from './components/SidebarRegister'
import RegistrationHistory from './components/RegistrationHistory'
import RegistrationHistoryDetails from './components/RegistrationHistoryDetails'
import RegisterWork from './components/RegisterWork'
import RegisterLeave from './components/RegisterLeave'
import './App.css'

function App() {
  const [activeSidebarItem, setActiveSidebarItem] = useState('list'); // 'list', 'leave', 'work'
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
    
    if (selectedRequest) {
      return <RegistrationHistoryDetails request={selectedRequest} onBack={handleBackToHistory} />;
    }
    return <RegistrationHistory onViewDetails={handleViewDetails} onNavigate={setActiveSidebarItem} />;
  }

  return (
    <div className="antialiased bg-gray-50 min-h-screen flex flex-col">
      <HeaderPage />
      <SidebarRegister activeItem={activeSidebarItem} onSelect={setActiveSidebarItem} />
      <main className="flex-1">
        {renderContent()}
      </main>
    </div>
  )
}

export default App
