import React, { useMemo, useState, useRef, useEffect } from 'react';
import { FaKey, FaSignOutAlt, FaChevronDown, FaBars } from 'react-icons/fa';
import { FiTrendingUp } from 'react-icons/fi';

function useUsuarioLogado() {
  return useMemo(() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { nome: 'Usuário', email: '', iniciais: 'U' };
      const payload = JSON.parse(atob(token.split('.')[1]));
      const nome = payload.nome || payload.email || 'Usuário';
      const email = payload.email || '';
      const iniciais = nome
        .split(' ').filter(Boolean).slice(0, 2)
        .map(p => p[0].toUpperCase()).join('');
      return { nome, email, iniciais };
    } catch {
      return { nome: 'Usuário', email: '', iniciais: 'U' };
    }
  }, []);
}

function TopBar({ sidebarOpen = true, isMobile = false, fotoUrl = null, onLogout, onTrocarSenha, onToggleSidebar }) {
  const { nome, email, iniciais } = useUsuarioLogado();
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickFora = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAberto(false);
      }
    };
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  const handleLogout = () => { setMenuAberto(false); if (onLogout) onLogout(); };
  const handleTrocarSenha = () => { setMenuAberto(false); if (onTrocarSenha) onTrocarSenha(); };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: (!isMobile && sidebarOpen) ? '250px' : '0px',
      right: 0,
      height: '60px',
      background: 'rgba(10,15,30,0.95)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid #1e293b',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      zIndex: 997,
      transition: 'left 0.3s ease',
      boxShadow: '0 1px 0 rgba(255,255,255,0.03)',
    }}>

      {/* Lado esquerdo — hamburguer no mobile, logo no mobile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Botão hamburguer — aparece sempre que sidebar está fechada */}
        {(!sidebarOpen || isMobile) && (
          <button
            onClick={onToggleSidebar}
            style={{
              background: 'transparent',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#f8fafc'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <FaBars size={16} />
          </button>
        )}

        {/* Logo no mobile (sidebar escondida) */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FiTrendingUp size={14} color="#fff" />
            </div>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
              FII<span style={{ color: '#10b981' }}>Track</span>
            </span>
          </div>
        )}
      </div>

      {/* Lado direito — avatar + menu */}
      <div ref={menuRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setMenuAberto(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: menuAberto ? 'rgba(255,255,255,0.06)' : 'transparent',
            border: '1px solid',
            borderColor: menuAberto ? '#334155' : 'transparent',
            cursor: 'pointer',
            padding: '6px 10px', borderRadius: '10px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = '#334155'; }}
          onMouseLeave={e => { if (!menuAberto) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; } }}
        >
          {/* Nome e email — oculta no mobile pra economizar espaço */}
          {!isMobile && (
            <div style={{ textAlign: 'right', lineHeight: 1.3 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>{nome}</div>
              {email && <div style={{ fontSize: '11px', color: '#64748b' }}>{email}</div>}
            </div>
          )}

          {/* Avatar */}
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            border: '2px solid rgba(16,185,129,0.3)',
            boxShadow: '0 0 10px rgba(16,185,129,0.2)',
            overflow: 'hidden',
          }}>
            {fotoUrl ? (
              <img src={fotoUrl} alt={nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: '#fff', fontSize: '12px', fontWeight: 700, userSelect: 'none' }}>
                {iniciais}
              </span>
            )}
          </div>

          <FaChevronDown
            size={10}
            color="#64748b"
            style={{ transition: 'transform 0.2s', transform: menuAberto ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>

        {/* Dropdown */}
        {menuAberto && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '12px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
            minWidth: '210px', overflow: 'hidden', zIndex: 1000,
          }}>
            {/* Cabeçalho */}
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid #334155',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>{nome}</div>
              {email && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{email}</div>}
            </div>

            {/* Trocar Senha */}
            <button
              onClick={handleTrocarSenha}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '12px 16px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '13px', color: '#94a3b8', textAlign: 'left',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#f8fafc'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#94a3b8'; }}
            >
              <FaKey size={13} color="#64748b" />
              Trocar Senha
            </button>

            <div style={{ height: '1px', background: '#334155' }} />

            {/* Sair */}
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '12px 16px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '13px', color: '#f87171', textAlign: 'left',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              <FaSignOutAlt size={13} color="#f87171" />
              Sair
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TopBar;
