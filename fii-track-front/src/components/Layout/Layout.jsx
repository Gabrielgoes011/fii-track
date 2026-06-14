import React, { useState } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import TopBar from '../TopBar/TopBar';

function Layout({ children, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0f1e' }}>

      {/* Sidebar lateral */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        onLogout={onLogout}
      />

      {/* Barra superior fixa */}
      <TopBar sidebarOpen={sidebarOpen} onLogout={onLogout} />

      {/* Conteúdo principal */}
      <div style={{
        marginLeft: sidebarOpen ? '250px' : '0px',
        flex: 1,
        background: '#0a0f1e',
        minHeight: '100vh',
        position: 'relative',
        transition: 'margin-left 0.3s ease',
        paddingTop: '60px',
      }}>
        <div style={{
          padding: '24px',
          maxWidth: '1400px',
          margin: '0 auto',
        }}>
          {children}
        </div>
      </div>

    </div>
  );
}

export default Layout;
