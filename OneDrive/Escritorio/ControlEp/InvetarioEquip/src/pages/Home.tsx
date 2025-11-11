import { useState } from 'react';
import Sidebar from '../components/Home/sidebar/Sidebar';
import MainContent from '../components/Home/Main/MainContent';
import ComputoContent from '../components/Home/Computo/ComputoContent';
import UsersContent from '../components/Home/Users/UsersContent';
import ReportsContent from '../components/Home/Reports/ReportsContent';
import Calendar from '../components/Home/Calendar/Calendar';
import SoftwareContent from '../components/Home/Software/SoftwareContent'; // Importa el nuevo componente

interface HomeProps {
  handleLogout: () => void;
  setIsAuthenticated: (value: boolean) => void;
}

export default function Home({ handleLogout, setIsAuthenticated }: HomeProps) {
  const [activeTab, setActiveTab] = useState('main');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderContent = () => {
    switch (activeTab) {
      case 'main':
        return <MainContent sidebarOpen={sidebarOpen} />;
      case 'computo':
        return <ComputoContent sidebarOpen={sidebarOpen} />;
      case 'users':
        return <UsersContent sidebarOpen={sidebarOpen} />;
      case 'reports':
        return <ReportsContent sidebarOpen={sidebarOpen} />;
      case 'calendar':
        return <Calendar sidebarOpen={sidebarOpen} />;
      case 'software': // Nuevo caso para software
        return <SoftwareContent sidebarOpen={sidebarOpen} />;
      default:
        return <MainContent sidebarOpen={sidebarOpen} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        handleLogout={handleLogout} // Pasa la función desde Home
      />
      <div className="flex-1 flex flex-col">
        {renderContent()}
      </div>
    </div>
  );
}