import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

// Controles de paginação para as listas de cards no mobile.
// Mostra "Anterior / página X de Y / Próxima". Esconde-se sozinho quando há
// apenas uma página (nada para paginar).
function PaginacaoMobile({ paginaAtual, totalPaginas, onAnterior, onProxima }) {
  if (totalPaginas <= 1) return null;

  const btnBase = {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '8px 14px', borderRadius: '8px',
    border: '1px solid #334155', background: '#1e293b',
    color: '#cbd5e1', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
    transition: 'all 0.2s',
  };

  const btnDesabilitado = {
    ...btnBase,
    opacity: 0.4,
    cursor: 'not-allowed',
  };

  const noPrimeira = paginaAtual <= 1;
  const noUltima = paginaAtual >= totalPaginas;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '10px', marginTop: '14px',
    }}>
      <button
        type="button"
        onClick={onAnterior}
        disabled={noPrimeira}
        style={noPrimeira ? btnDesabilitado : btnBase}
      >
        <FiChevronLeft size={15} /> Anterior
      </button>

      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
        {paginaAtual} de {totalPaginas}
      </span>

      <button
        type="button"
        onClick={onProxima}
        disabled={noUltima}
        style={noUltima ? btnDesabilitado : btnBase}
      >
        Próxima <FiChevronRight size={15} />
      </button>
    </div>
  );
}

export default PaginacaoMobile;
