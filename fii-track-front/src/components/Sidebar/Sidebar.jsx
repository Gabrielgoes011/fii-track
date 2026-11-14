import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FaHome, FaCog, FaBars, FaTimes,
  FaWallet, FaChartLine, FaTags, FaExchangeAlt,
  FaFileAlt, FaFolder, FaChevronDown, FaChevronUp, FaChevronRight,
  FaChartPie, FaKey, FaSignOutAlt,
} from 'react-icons/fa';
import { FiTrendingUp } from 'react-icons/fi';

// Iniciais do nome (ex: "Gabriel Souza" -> "GS")
function getInitials(nome = '') {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join('') || 'U';
}

function Sidebar({ isOpen, isMobile, onToggle, onClose, onLogout, onTrocarSenha, user }) {
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
    { id: 'diversificacao', path: '/diversificacao', label: 'Diversificação', icon: FaChartPie },
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
        <button aria-label="Abrir menu" title="Abrir menu"
          type="button"
          onClick={onToggle}
          style={{
            position: 'fixed', left: '12px', top: '12px', zIndex: 1000,
            background: 'var(--surface-2)', color: 'var(--texto)',
            border: '1px solid var(--borda-forte)', borderRadius: '8px',
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
        borderRight: '1px solid var(--borda)',
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
          <button
            type="button"
            onClick={() => handleNavigate('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'var(--accent-gradiente)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(16,185,129,0.4)',
              flexShrink: 0,
            }}>
              <FiTrendingUp size={18} color="#fff" />
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--texto)', letterSpacing: '-0.3px' }}>
              FII<span style={{ color: 'var(--accent)' }}>Track</span>
            </span>
          </button>

          {/* Botão fechar */}
          <button aria-label="Fechar menu" title="Fechar menu"
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent', color: 'var(--texto-mudo)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', borderRadius: '6px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--texto)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--texto-mudo)'; }}
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* ── Card de perfil do usuário (clicável → leva para o perfil) ── */}
        <div style={{ padding: '16px 16px 20px' }}>
          <button
            type="button"
            onClick={() => handleNavigate('/perfil')}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.10), rgba(16,185,129,0.02))',
              border: '1px solid rgba(16,185,129,0.18)',
              padding: '12px', borderRadius: '14px',
              width: '100%', textAlign: 'left', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.18)'; }}
          >
            {/* Avatar com iniciais */}
            <div style={{
              width: '40px', height: '40px', borderRadius: '11px', flexShrink: 0,
              background: 'var(--accent-gradiente)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: '15px', letterSpacing: '0.3px',
              boxShadow: '0 0 14px rgba(16,185,129,0.35)',
            }}>
              {getInitials(user?.nome)}
            </div>
            {/* Nome + atalho "Editar perfil" */}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: '14px', color: 'var(--texto)', fontWeight: 700, lineHeight: 1.3,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {user?.nome || 'Usuário'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--texto-mudo)', fontWeight: 500, lineHeight: 1.2, marginTop: '2px' }}>
                Editar perfil
              </div>
            </div>
            {/* Chevron indicando que o card é clicável */}
            <FaChevronRight size={13} color="#64748b" style={{ flexShrink: 0 }} />
          </button>
        </div>

        {/* ── Divisória ── */}
        <div style={{ height: '1px', background: 'var(--surface-2)', margin: '0 20px 12px' }} />

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
                    color: isActive ? 'var(--accent)' : 'var(--texto-mudo)',
                    border: 'none', borderRadius: '8px', cursor: 'pointer',
                    fontSize: '14px', fontWeight: isActive ? 600 : 400,
                    transition: 'all 0.2s ease',
                    borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                    whiteSpace: 'nowrap', width: '100%', textAlign: 'left',
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--texto-suave)'; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--texto-mudo)'; } }}
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
                        color: cadastrosOpen ? 'var(--accent)' : 'var(--texto-mudo)',
                        border: 'none', borderRadius: '8px', cursor: 'pointer',
                        fontSize: '14px', fontWeight: cadastrosOpen ? 600 : 400,
                        transition: 'all 0.2s ease',
                        borderLeft: cadastrosOpen ? '3px solid var(--accent)' : '3px solid transparent',
                        justifyContent: 'space-between',
                        whiteSpace: 'nowrap', width: '100%',
                      }}
                      onMouseEnter={e => { if (!cadastrosOpen) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--texto-suave)'; } }}
                      onMouseLeave={e => { if (!cadastrosOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--texto-mudo)'; } }}
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
                        borderLeft: '1px solid var(--borda)', marginBottom: '4px',
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
                                color: subActive ? 'var(--accent)' : 'var(--texto-mudo)',
                                border: 'none', borderRadius: '6px',
                                padding: '10px 10px', textAlign: 'left',
                                cursor: 'pointer', fontSize: '13px',
                                fontWeight: subActive ? 600 : 400,
                                transition: 'all 0.2s', width: '100%',
                              }}
                              onMouseEnter={e => { if (!subActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--texto-suave)'; } }}
                              onMouseLeave={e => { if (!subActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--texto-mudo)'; } }}
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
                color: administracaoOpen ? 'var(--accent)' : 'var(--texto-mudo)',
                border: 'none', borderRadius: '8px', cursor: 'pointer',
                fontSize: '14px', fontWeight: administracaoOpen ? 600 : 400,
                transition: 'all 0.2s ease',
                borderLeft: administracaoOpen ? '3px solid var(--accent)' : '3px solid transparent',
                justifyContent: 'space-between',
                whiteSpace: 'nowrap', width: '100%',
              }}
              onMouseEnter={e => { if (!administracaoOpen) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--texto-suave)'; } }}
              onMouseLeave={e => { if (!administracaoOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--texto-mudo)'; } }}
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
                borderLeft: '1px solid var(--borda)', marginBottom: '4px',
              }}>
                <button
                  type="button"
                  onClick={() => handleNavigate('/cadastros/usuarios')}
                  style={{
                    background: currentPath === '/cadastros/usuarios' ? 'rgba(16,185,129,0.1)' : 'transparent',
                    color: currentPath === '/cadastros/usuarios' ? 'var(--accent)' : 'var(--texto-mudo)',
                    border: 'none', borderRadius: '6px',
                    padding: '10px 10px', textAlign: 'left', cursor: 'pointer',
                    fontSize: '13px', fontWeight: currentPath === '/cadastros/usuarios' ? 600 : 400,
                    transition: 'all 0.2s', width: '100%',
                  }}
                  onMouseEnter={e => { if (currentPath !== '/cadastros/usuarios') { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--texto-suave)'; } }}
                  onMouseLeave={e => { if (currentPath !== '/cadastros/usuarios') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--texto-mudo)'; } }}
                >
                  Gerenciamento de usuários
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Conta: Trocar Senha + Sair ── */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '4px',
          padding: '8px 12px',
          borderTop: '1px solid var(--borda)', marginTop: '8px',
        }}>
          {onTrocarSenha && (
            <button
              type="button"
              onClick={() => { if (isMobile) onClose(); onTrocarSenha(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 12px',
                background: 'transparent', color: 'var(--texto-mudo)',
                border: 'none', borderRadius: '8px', cursor: 'pointer',
                fontSize: '14px', fontWeight: 400,
                transition: 'all 0.2s ease', width: '100%', textAlign: 'left',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--texto-suave)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--texto-mudo)'; }}
            >
              <FaKey size={16} />
              <span>Trocar Senha</span>
            </button>
          )}

          {onLogout && (
            <button
              type="button"
              onClick={() => { if (isMobile) onClose(); onLogout(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 12px',
                background: 'transparent', color: 'var(--perigo)',
                border: 'none', borderRadius: '8px', cursor: 'pointer',
                fontSize: '14px', fontWeight: 400,
                transition: 'all 0.2s ease', width: '100%', textAlign: 'left',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <FaSignOutAlt size={16} />
              <span>Sair</span>
            </button>
          )}
        </div>

        {/* ── Rodapé ── */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--borda)',
          fontSize: '11px', color: 'var(--borda-forte)', textAlign: 'center',
        }}>
          © {new Date().getFullYear()} FIITrack · v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'}
        </div>
      </div>
    </>
  );
}

export default Sidebar;
