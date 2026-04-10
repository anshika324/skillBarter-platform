import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MinimalNavbar from './MinimalNavbar';
import { useAuth } from '../context/AuthContext';

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const isImmersiveRoute = location.pathname.startsWith('/video-call/');

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleCollapseChange = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  if (!isAuthenticated) {
    return <div className="min-h-screen">{children}</div>;
  }

  if (isImmersiveRoute) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-gray-950">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar}
        onCollapseChange={handleCollapseChange}
      />

      {/* Desktop */}
      <div 
        style={{
          marginLeft: sidebarCollapsed ? '80px' : '256px',
          transition: 'margin-left 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="hidden md:block"
      >
        <MinimalNavbar toggleSidebar={toggleSidebar} />
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <MinimalNavbar toggleSidebar={toggleSidebar} />
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
