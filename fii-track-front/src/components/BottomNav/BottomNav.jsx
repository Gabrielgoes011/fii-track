import React from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaWallet, FaChartLine, FaExchangeAlt } from 'react-icons/fa';

// Altura da barra inferior (exportada para o Layout reservar o espaço do conteúdo).
export const BOTTOM_NAV_HEIGHT = 58;

// Telas fixas da barra inferior no mobile (padrão app da B3/HUB3).
// As demais telas (Diversificação, Precificação, Relatórios, Cadastros,
// Administração, Perfil...) ficam no drawer, aberto pelo avatar no TopBar.
const itens = [
  { path: '/', label: 'Início', icon: FaHome },
  { path: '/controle-ativos', label: 'Ativos', icon: FaWallet },
  { path: '/rendimentos', label: 'Rendimentos', icon: FaChartLine },
  { path: '/operacoes', label: 'Operações', icon: FaExchangeAlt },
];

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  return createPortal(
    <nav
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: `${BOTTOM_NAV_HEIGHT}px`,
        background: 'rgba(10,15,30,0.98)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'space-around',
        zIndex: 996,
        // respeita a safe area (notch/barra de gestos) em iPhones
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {itens.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath === item.path;

        return (
          <button
            key={item.path}
            type="button"
            onClick={() => navigate(item.path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: isActive ? '#10b981' : '#64748b',
              transition: 'color 0.2s ease',
              padding: '6px 2px',
              minWidth: 0,
            }}
          >
            <Icon size={19} />
            <span
              style={{
                fontSize: '10px',
                fontWeight: isActive ? 700 : 500,
                lineHeight: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>,
    document.body,
  );
}

export default BottomNav;
