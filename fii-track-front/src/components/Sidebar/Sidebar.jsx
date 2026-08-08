import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FaHome, FaCog, FaCircle, FaBars, FaTimes,
  FaWallet, FaChartLine, FaTags, FaExchangeAlt,
  FaFileAlt, FaFolder, FaChevronDown, FaChevronUp,
} from 'react-icons/fa';
import { FiTrendingUp } from 'react-icons/fi';

function Sidebar({ isOpen, isMobile, onToggle, onClose, onLogout, user }) {
  const [cadastrosOpen, setCadastrosOpen] = useState(false);
  const [administracaoOpen, setAdministracaoOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const isAdmin = Boolean(user?.adm);

  useEffect(() => {
    if (['/cadastros/meusfiis', '/cadastros/seguimentos', '/cadastros/usuarios'].includes(currentPath)) {
      setCadastrosOpen(true);
    }

    if (currentPath === '/cadastros/usuarios') {
      setAdministracaoOpen(true);
    }
  }, [currentPath]);

  // Fecha sidebar no mobile ao navegar
  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) onClose();
  };

  const menuItems = [
    { id: 'dashboard', path: '/', label: 'Início', icon: FaHome },
    { id: 'controle-ativos', path: '/controle-ativos', label: 'Controle de Ativos', icon: FaWallet },
    { id: 'operacoes', path: '/operacoes', label: 'Operações', icon: FaExchangeAlt },
    { id: 'precificacao', path: '/precificacao', label: 'Precificação', icon: FaTags },
    { id: 'rendimentos', path: '/rendimentos', label: 'Rendimentos', icon: FaChartLine },
    { id: 'relatorios', path: '/relatorios', label: 'Relatórios', icon: FaFileAlt },
  ];

  const subItems = [
    { path: '/cadastros/meusfiis', label: 'Meus Fundos' },
    { path: '/cadastros/seguimentos', label: 'Segmentos' },
  ];

  return (
    <>
      {/* Botão hamburguer quando sidebar fechada (só desktop) */}
      {!isOpen && !isMobile && (
        <button
          type="button"
          onClick={onToggle}
          style={{
            position: 'fixed', left: '12px', top: '12px', zIndex: 1000,
            background: '#1e293b', color: '#f8fafc',
            border: '1px solid #334155', borderRadius: '8px',
            padding: '10px 12px', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          <FaBars size={18} />
        </button>
      )}

      {/* Sidebar */}
      <div style={{
        width: '250px',
        height: '100vh',
        background: 'linear-gradient(180deg, #0d1b2a 0%, #0f172a 100%)',
        borderRight: '1px solid #1e293b',
        position: 'fixed', left: 0, top: 0,
        overflowY: 'auto', overflowX: 'hidden',
        display: 'flex', flexDirection: 'column',
        transition: 'transform 0.3s ease',
        // no mobile usa transform para entrar/sair da tela
        // no desktop usa transform também para consistência
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        zIndex: 999,
        boxShadow: isOpen ? '4px 0 24px rgba(0,0,0,0.4)' : 'none',
      }}>

        {/* ── Logo / Branding ── */}
        <div style={{
          padding: '20px 20px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(16,185,129,0.4)',
              flexShrink: 0,
            }}>
              <FiTrendingUp size={18} color="#fff" />
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.3px' }}>
              FII<span style={{ color: '#10b981' }}>Track</span>
            </span>
          </div>

          {/* Botão fechar */}
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent', color: '#64748b',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', borderRadius: '6px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#f8fafc'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* ── Status servidor ── */}
        <div style={{ padding: '16px 20px 20px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '7px',
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
            padding: '5px 12px', borderRadius: '20px',
            fontSize: '12px', color: '#10b981', fontWeight: 500,
          }}>
            <FaCircle size={7} style={{ color: '#10b981', filter: 'drop-shadow(0 0 4px #10b981)' }} />
            Servidor Online
          </div>
        </div>

        {/* ── Divisória ── */}
        <div style={{ height: '1px', background: '#1e293b', margin: '0 20px 12px' }} />

        {/* ── Menu ── */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 12px', flex: 1 }}>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;

            return (
              <React.Fragment key={item.id}>
                <button
                  type="button"
                  onClick={() => handleNavigate(item.path)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 12px',
                    background: isActive
                      ? 'linear-gradient(90deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))'
                      : 'transparent',
                    color: isActive ? '#10b981' : '#64748b',
                    border: 'none', borderRadius: '8px', cursor: 'pointer',
                    fontSize: '14px', fontWeight: isActive ? 600 : 400,
                    transition: 'all 0.2s ease',
                    borderLeft: isActive ? '3px solid #10b981' : '3px solid transparent',
                    whiteSpace: 'nowrap', width: '100%', textAlign: 'left',
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#94a3b8'; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; } }}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                </button>

                {/* Cadastros (submenu) — inserido após "Início" */}
                {index === 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setCadastrosOpen(!cadastrosOpen)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '12px 12px',
                        background: cadastrosOpen
                          ? 'linear-gradient(90deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))'
                          : 'transparent',
                        color: cadastrosOpen ? '#10b981' : '#64748b',
                        border: 'none', borderRadius: '8px', cursor: 'pointer',
                        fontSize: '14px', fontWeight: cadastrosOpen ? 600 : 400,
                        transition: 'all 0.2s ease',
                        borderLeft: cadastrosOpen ? '3px solid #10b981' : '3px solid transparent',
                        justifyContent: 'space-between',
                        whiteSpace: 'nowrap', width: '100%',
                      }}
                      onMouseEnter={e => { if (!cadastrosOpen) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#94a3b8'; } }}
                      onMouseLeave={e => { if (!cadastrosOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; } }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaFolder size={17} />
                        <span>Cadastros</span>
                      </span>
                      {cadastrosOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                    </button>

                    {cadastrosOpen && (
                      <div style={{
                        display: 'flex', flexDirection: 'column', gap: '2px',
                        marginLeft: '12px', paddingLeft: '16px',
                        borderLeft: '1px solid #1e293b', marginBottom: '4px',
                      }}>
                        {subItems.map(sub => {
                          const subActive = currentPath === sub.path;
                          return (
                            <button
                              key={sub.path}
                              type="button"
                              onClick={() => handleNavigate(sub.path)}
                              style={{
                                background: subActive ? 'rgba(16,185,129,0.1)' : 'transparent',
                                color: subActive ? '#10b981' : '#64748b',
                                border: 'none', borderRadius: '6px',
                                padding: '10px 10px', textAlign: 'left',
                                cursor: 'pointer', fontSize: '13px',
                                fontWeight: subActive ? 600 : 400,
                                transition: 'all 0.2s', width: '100%',
                              }}
                              onMouseEnter={e => { if (!subActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#94a3b8'; } }}
                              onMouseLeave={e => { if (!subActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; } }}
                            >
                              {sub.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {isAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 12px 8px' }}>
            <button
              type="button"
              onClick={() => setAdministracaoOpen(!administracaoOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 12px',
                background: administracaoOpen
                  ? 'linear-gradient(90deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))'
                  : 'transparent',
                color: administracaoOpen ? '#10b981' : '#64748b',
                border: 'none', borderRadius: '8px', cursor: 'pointer',
                fontSize: '14px', fontWeight: administracaoOpen ? 600 : 400,
                transition: 'all 0.2s ease',
                borderLeft: administracaoOpen ? '3px solid #10b981' : '3px solid transparent',
                justifyContent: 'space-between',
                whiteSpace: 'nowrap', width: '100%',
              }}
              onMouseEnter={e => { if (!administracaoOpen) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#94a3b8'; } }}
              onMouseLeave={e => { if (!administracaoOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; } }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaCog size={17} />
                <span>Administração</span>
              </span>
              {administracaoOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
            </button>

            {administracaoOpen && (
              <div style={{
                display: 'flex', flexDirection: 'column', gap: '2px',
                marginLeft: '12px', paddingLeft: '16px',
                borderLeft: '1px solid #1e293b', marginBottom: '4px',
              }}>
                <button
                  type="button"
                  onClick={() => handleNavigate('/cadastros/usuarios')}
                  style={{
                    background: currentPath === '/cadastros/usuarios' ? 'rgba(16,185,129,0.1)' : 'transparent',
                    color: currentPath === '/cadastros/usuarios' ? '#10b981' : '#64748b',
                    border: 'none', borderRadius: '6px',
                    padding: '10px 10px', textAlign: 'left', cursor: 'pointer',
                    fontSize: '13px', fontWeight: currentPath === '/cadastros/usuarios' ? 600 : 400,
                    transition: 'all 0.2s', width: '100%',
                  }}
                  onMouseEnter={e => { if (currentPath !== '/cadastros/usuarios') { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#94a3b8'; } }}
                  onMouseLeave={e => { if (currentPath !== '/cadastros/usuarios') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; } }}
                >
                  Gerenciamento de usuários
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Rodapé ── */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #1e293b',
          fontSize: '11px', color: '#334155', textAlign: 'center',
        }}>
          © {new Date().getFullYear()} FIITrack
        </div>
      </div>
    </>
  );
}

export default Sidebar;
