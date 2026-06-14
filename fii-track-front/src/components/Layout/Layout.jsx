import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import TopBar from '../TopBar/TopBar';

// breakpoint mobile
const MOBILE_BP = 768;

function Layout({ children, onLogout }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BP);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= MOBILE_BP);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < MOBILE_BP;
      setIsMobile(mobile);
      // no desktop deixa aberta por padrão; no mobile fecha
      if (!mobile) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setSidebarOpen(v => !v);
  const closeSidebar  = () => setSidebarOpen(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0f1e' }}>

      {/* Overlay escuro no mobile quando sidebar aberta */}
      {isMobile && sidebarOpen && (
        <div
          onClick={closeSidebar}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 998,
          }}
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        isMobile={isMobile}
        onToggle={toggleSidebar}
        onClose={closeSidebar}
        onLogout={onLogout}
      />

      <TopBar
        sidebarOpen={sidebarOpen}
        isMobile={isMobile}
        onToggleSidebar={toggleSidebar}
        onLogout={onLogout}
      />

      {/* Conteúdo principal */}
      <div style={{
        marginLeft: (!isMobile && sidebarOpen) ? '250px' : '0px',
        flex: 1,
        background: '#0a0f1e',
        minHeight: '100vh',
        position: 'relative',
        transition: 'margin-left 0.3s ease',
        paddingTop: '60px',
      }}>
        <div style={{
          padding: isMobile ? '16px 12px' : '24px',
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
