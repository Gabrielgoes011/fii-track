import { useEffect, useRef, useState } from 'react';
import { IoCloseOutline } from 'react-icons/io5';

/**
 * SlideModal — modal com animação estilo macOS.
 * Abre: sobe de baixo + escala + fade-in  (spring suave)
 * Fecha: desce + encolhe + fade-out       (ease-in rápido)
 */
export default function SlideModal({ isOpen, onClose, title, width = '480px', children }) {
  // 'idle' | 'entering' | 'open' | 'leaving'
  const [phase, setPhase] = useState('idle');
  const overlayRef        = useRef(null);
  const timerRef          = useRef(null);

  useEffect(() => {
    clearTimeout(timerRef.current);

    if (isOpen) {
      // 1. monta o DOM no estado inicial (idle → entering)
      setPhase('entering');
      // 2. próximo frame: dispara a animação de entrada
      timerRef.current = setTimeout(() => setPhase('open'), 16);
    } else {
      if (phase === 'idle') return; // nunca foi aberto, não faz nada
      // 1. dispara animação de saída
      setPhase('leaving');
      // 2. desmonta após a transição terminar (240ms)
      timerRef.current = setTimeout(() => setPhase('idle'), 260);
    }

    return () => clearTimeout(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Fecha ao clicar no backdrop
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Fecha com Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Não renderiza nada quando está completamente fechado
  if (phase === 'idle') return null;

  // ── estilos calculados por fase ──
  const isIn = phase === 'open';

  const backdropStyle = {
    position: 'fixed', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1200,
    // backdrop
    background:       isIn ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0)',
    backdropFilter:   isIn ? 'blur(6px)'         : 'blur(0px)',
    WebkitBackdropFilter: isIn ? 'blur(6px)'     : 'blur(0px)',
    transition: isIn
      ? 'background 0.28s ease, backdrop-filter 0.28s ease'
      : 'background 0.24s ease, backdrop-filter 0.24s ease',
  };

  const cardStyle = {
    background: '#141e2c',
    border: '1px solid #243040',
    borderRadius: '18px',
    boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.4)',
    overflow: 'hidden',
    width: '100%',
    maxWidth: width,
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    // animação
    opacity:   isIn ? 1 : 0,
    transform: isIn ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.95)',
    transition: isIn
      // entrada: spring com overshoot leve
      ? 'opacity 0.30s cubic-bezier(0.34,1.18,0.64,1), transform 0.30s cubic-bezier(0.34,1.18,0.64,1)'
      // saída: desce e some mais rápido
      : 'opacity 0.22s cubic-bezier(0.4,0,1,1), transform 0.22s cubic-bezier(0.4,0,1,1)',
  };

  return (
    <>
      <style>{`
        .sm-close {
          background: rgba(255,255,255,0.04);
          border: 1px solid #243040;
          border-radius: 8px;
          color: #4e6480;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px;
          transition: all 0.15s;
          line-height: 0;
        }
        .sm-close:hover {
          color: #dce8f5;
          background: rgba(255,255,255,0.09);
          border-color: #334d66;
        }
        .sm-body::-webkit-scrollbar { width: 5px; }
        .sm-body::-webkit-scrollbar-track { background: transparent; }
        .sm-body::-webkit-scrollbar-thumb { background: #243040; border-radius: 4px; }
      `}</style>

      <div ref={overlayRef} style={backdropStyle} onClick={handleOverlayClick}>
        <div style={cardStyle}>

          {/* ── Header ── */}
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid #1e2d3d',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#111927',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#dce8f5', letterSpacing: '-0.1px' }}>
              {title}
            </span>
            <button className="sm-close" onClick={onClose} title="Fechar">
              <IoCloseOutline size={18} />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="sm-body" style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
            {children}
          </div>

        </div>
      </div>
    </>
  );
}
