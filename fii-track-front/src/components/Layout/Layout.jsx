import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import TopBar from '../TopBar/TopBar';
import BottomNav from '../BottomNav/BottomNav';
import ModalTrocarSenha from '../ModalTrocarSenha/ModalTrocarSenha';
import { usePrivacy } from '../../context/PrivacyContext';
import { MOBILE_BP } from '../../hooks/useIsMobile';
import { useTrocarSenha } from '../../hooks/auth/useTrocarSenha';

function Layout({ children, onLogout, user }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BP);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= MOBILE_BP);
  const { valoresOcultos } = usePrivacy();
  const navigate = useNavigate();

  const {
    showTrocarSenhaModal, formData, loading,
    setFormData, abrirTrocarSenha, fecharTrocarSenha, handleTrocarSenha,
  } = useTrocarSenha(user?.id);

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
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div
      className={[isMobile ? 'app-shell-mobile' : '', valoresOcultos ? 'privacidade-ativa' : ''].filter(Boolean).join(' ')}
      style={isMobile
        ? { background: 'var(--bg-app)' }
        : { display: 'flex', minHeight: '100vh', background: 'var(--bg-app)' }}
    >

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
        onTrocarSenha={abrirTrocarSenha}
        user={user}
      />

      <TopBar
        sidebarOpen={sidebarOpen}
        isMobile={isMobile}
        user={user}
        onToggleSidebar={toggleSidebar}
        onOpenDrawer={() => setSidebarOpen(true)}
        onLogoClick={() => navigate('/')}
        onLogout={onLogout}
        onMeuPerfil={() => navigate('/perfil')}
        onTrocarSenha={abrirTrocarSenha}
      />

      <ModalTrocarSenha
        isOpen={showTrocarSenhaModal}
        onClose={fecharTrocarSenha}
        onSubmit={handleTrocarSenha}
        formData={formData}
        setFormData={setFormData}
        loading={loading}
      />

      {/* Conteúdo principal */}
      <div
        className={isMobile ? 'app-scroll-mobile' : undefined}
        style={{
          marginLeft: (!isMobile && sidebarOpen) ? '250px' : '0px',
          flex: 1,
          minWidth: 0,
          background: 'var(--bg-app)',
          minHeight: isMobile ? undefined : '100vh',
          position: 'relative',
          transition: 'margin-left 0.3s ease',
          paddingTop: 'var(--topbar-h)',
        }}
      >
        <div style={{
          // a barra inferior não cobre mais o conteúdo (ela fica fora da área que rola)
          padding: isMobile ? '16px 12px' : '24px',
          maxWidth: '1400px',
          margin: '0 auto',
        }}>
          {children}
        </div>
      </div>

      {/* Barra de navegação inferior — só no mobile (padrão app da B3/HUB3). Fica no fluxo, abaixo da área que rola. */}
      {isMobile && <BottomNav />}

    </div>
  );
}

export default Layout;
