import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaWallet, FaChartLine, FaExchangeAlt } from 'react-icons/fa';

// Altura da barra inferior, sem a área segura do aparelho (mesmo valor de --bottomnav-h no global.css).
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

// A barra faz parte do layout (fica no fluxo, abaixo da área que rola), por isso não se mexe com a rolagem.
// Quem a renderiza é o Layout, dentro do .app-shell-mobile.
function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  return (
    <nav
      style={{
        flexShrink: 0,
        width: '100%',
        // a área segura (notch/barra de gestos do iPhone) soma à altura da barra
        height: `calc(var(--bottomnav-h) + env(safe-area-inset-bottom))`,
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: 'rgba(10,15,30,0.98)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--borda)',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'space-around',
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
              color: isActive ? 'var(--accent)' : 'var(--texto-mudo)',
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
    </nav>
  );
}

export default BottomNav;
