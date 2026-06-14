import React, { useState } from 'react';
import {
  AiOutlineEye, AiOutlineEdit, AiOutlineDelete,
  AiOutlineKey, AiOutlinePoweroff, AiOutlinePlayCircle, AiOutlineClose,
} from 'react-icons/ai';

// Formatação de datas com fallback
let formatarDataBR;
let formatarDataComHora;
try {
  const dateUtils = require('../../utils/dateUtils');
  formatarDataBR      = dateUtils.formatarDataBR      || ((d) => d ? new Date(d).toLocaleDateString('pt-BR')  : '');
  formatarDataComHora = dateUtils.formatarDataComHora || ((d) => d ? new Date(d).toLocaleString('pt-BR')      : '');
} catch {
  formatarDataBR      = (d) => d ? new Date(d).toLocaleDateString('pt-BR')  : '';
  formatarDataComHora = (d) => d ? new Date(d).toLocaleString('pt-BR')      : '';
}

/**
 * GridDados — tabela universal da aplicação (tema dark FIITrack).
 *
 * Quando _embutido=true (usado dentro do DataCard) não renderiza o wrapper
 * externo com borda/sombra — o DataCard já provê o container.
 */
const GridDados = ({
  coluna,
  data,
  itemsPerPage    = 10,
  labelpesquisa   = 'Buscar...',
  usaVisualizar   = false, acaoVisualizar,
  usaEditar       = false, acaoEditar,
  usaExcluir      = false, acaoExcluir,
  usaResetarSenha = false, acaoResetarSenha,
  usaInativar     = false, acaoInativar,
  usaReativar     = false, acaoReativar,
  // props legadas
  paddingHead     = '4px 8px',
  paddingBody     = '4px 8px',
  tamanhoIcones   = 'fs-5',
  tamanhoFontBody = '13px',
  tamanhoFontHead = '13px',
  _embutido       = false,
}) => {
  const [currentPage,         setCurrentPage]         = useState(1);
  const [buscar,              setBuscar]              = useState('');
  const [currentItemsPerPage, setCurrentItemsPerPage] = useState(itemsPerPage);

  const temAcoes = usaVisualizar || usaEditar || usaExcluir || usaResetarSenha || usaInativar || usaReativar;

  // ── filtragem ──
  const filteredData = data.filter(item => {
    if (!buscar.trim()) return true;
    const term = buscar.toLowerCase();
    return coluna.some(col => {
      const v = item[col.acesso];
      return v && v.toString().toLowerCase().includes(term);
    });
  });

  // ── paginação ──
  const perPage    = Number(currentItemsPerPage) || 10;
  const totalPages = Math.ceil(filteredData.length / perPage);
  const start      = (currentPage - 1) * perPage;
  const pageData   = filteredData.slice(start, start + perPage);

  // ── botão de ação base ──
  const btnBase = {
    color: '#475569', cursor: 'pointer', padding: '6px',
    borderRadius: '6px', background: 'transparent',
    border: 'none', display: 'inline-flex', alignItems: 'center',
    justifyContent: 'center', transition: 'all 0.15s',
  };

  // ── conteúdo interno ──
  const inner = (
    <>
      {/* ── Barra de busca ── */}
      <div style={{
        display: 'flex', gap: '10px', alignItems: 'center',
        padding: '0.875rem 1rem',
        borderBottom: '1px solid #1e293b',
        background: 'rgba(255,255,255,0.01)',
      }}>
        <input
          type="text"
          placeholder={labelpesquisa}
          value={buscar}
          onChange={e => { setBuscar(e.target.value); setCurrentPage(1); }}
          style={{
            padding: '0.5rem 0.875rem',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            flex: 1, outline: 'none',
            color: '#f8fafc', fontSize: '13px',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = '#10b981'}
          onBlur={e => e.target.style.borderColor = '#334155'}
        />
        {buscar && (
          <button
            onClick={() => setBuscar('')}
            style={{
              padding: '6px', background: '#1e293b',
              border: '1px solid #334155', borderRadius: '8px',
              color: '#64748b', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              transition: 'all 0.15s',
            }}
            title="Limpar busca"
            onMouseOver={e => { e.currentTarget.style.borderColor = '#475569'; e.currentTarget.style.color = '#94a3b8'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#64748b'; }}
          >
            <AiOutlineClose size={16} />
          </button>
        )}
      </div>

      {/* ── Tabela ── */}
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{
              background: 'rgba(16,185,129,0.06)',
              borderBottom: '1px solid rgba(16,185,129,0.15)',
            }}>
              {coluna.map((col, i) => (
                <th key={i} style={{
                  padding: '0.75rem 1rem',
                  fontWeight: 600, fontSize: '11px',
                  color: '#64748b',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  width: col.width || 'auto',
                  textAlign: col.align || 'left',
                  whiteSpace: 'nowrap',
                }}>
                  {col.titulo}
                </th>
              ))}
              {temAcoes && (
                <th style={{
                  padding: '0.75rem 1.5rem 0.75rem 1rem',
                  fontWeight: 600, fontSize: '11px',
                  color: '#64748b',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  textAlign: 'center', width: '160px', whiteSpace: 'nowrap',
                }}>
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td
                  colSpan={coluna.length + (temAcoes ? 1 : 0)}
                  style={{ padding: '2.5rem', textAlign: 'center', color: '#475569', fontSize: '13px' }}
                >
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : pageData.map((row, ri) => (
              <tr
                key={ri}
                style={{
                  borderBottom: '1px solid #1e293b',
                  background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                  transition: 'background 0.15s',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(16,185,129,0.04)'}
                onMouseOut={e => e.currentTarget.style.background = ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}
              >
                {coluna.map((col, ci) => {
                  const val = row[col.acesso];
                  let display;
                  if (col.render) {
                    display = col.render(val, row);
                  } else {
                    display = val ?? '';
                    if (val && (col.acesso.toLowerCase().includes('data') || col.acesso.toLowerCase().includes('cadastro'))) {
                      display = col.acesso.toLowerCase().includes('hora')
                        ? formatarDataComHora(val)
                        : formatarDataBR(val);
                    }
                  }
                  return (
                    <td key={ci} style={{
                      padding: '0.875rem 1rem',
                      fontWeight: 400, fontSize: '13px',
                      color: '#cbd5e1',
                      width: col.width || 'auto',
                      textAlign: col.align || 'left',
                      overflow: col.truncate ? 'hidden' : 'visible',
                      textOverflow: col.truncate ? 'ellipsis' : 'clip',
                      whiteSpace: col.truncate ? 'nowrap' : 'normal',
                      wordBreak: 'break-word', overflowWrap: 'anywhere',
                    }}>
                      {display}
                    </td>
                  );
                })}
                {temAcoes && (
                  <td style={{ padding: '0.875rem 1.5rem 0.875rem 1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                      {usaVisualizar && acaoVisualizar && (
                        <button onClick={() => acaoVisualizar(row)} style={btnBase} title="Visualizar"
                          onMouseOver={e => { e.currentTarget.style.color = '#06b6d4'; e.currentTarget.style.background = 'rgba(6,182,212,0.1)'; }}
                          onMouseOut={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'transparent'; }}>
                          <AiOutlineEye size={17} />
                        </button>
                      )}
                      {usaEditar && acaoEditar && (
                        <button onClick={() => acaoEditar(row)} style={btnBase} title="Editar"
                          onMouseOver={e => { e.currentTarget.style.color = '#10b981'; e.currentTarget.style.background = 'rgba(16,185,129,0.1)'; }}
                          onMouseOut={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'transparent'; }}>
                          <AiOutlineEdit size={17} />
                        </button>
                      )}
                      {usaResetarSenha && acaoResetarSenha && (
                        <button onClick={() => acaoResetarSenha(row)} style={btnBase} title="Resetar Senha"
                          onMouseOver={e => { e.currentTarget.style.color = '#f59e0b'; e.currentTarget.style.background = 'rgba(245,158,11,0.1)'; }}
                          onMouseOut={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'transparent'; }}>
                          <AiOutlineKey size={17} />
                        </button>
                      )}
                      {usaReativar && acaoReativar && (
                        <button onClick={() => acaoReativar(row)} style={btnBase} title="Reativar"
                          onMouseOver={e => { e.currentTarget.style.color = '#10b981'; e.currentTarget.style.background = 'rgba(16,185,129,0.1)'; }}
                          onMouseOut={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'transparent'; }}>
                          <AiOutlinePlayCircle size={17} />
                        </button>
                      )}
                      {usaInativar && acaoInativar && (
                        <button onClick={() => acaoInativar(row)} style={btnBase} title="Inativar"
                          onMouseOver={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(148,163,184,0.1)'; }}
                          onMouseOut={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'transparent'; }}>
                          <AiOutlinePoweroff size={17} />
                        </button>
                      )}
                      {usaExcluir && acaoExcluir && (
                        <button onClick={() => acaoExcluir(row)} style={btnBase} title="Excluir"
                          onMouseOver={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; }}
                          onMouseOut={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'transparent'; }}>
                          <AiOutlineDelete size={17} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Paginação ── */}
      <div style={{
        padding: '0.875rem 1rem',
        background: 'rgba(255,255,255,0.01)',
        borderTop: '1px solid #1e293b',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
        fontSize: '13px', color: '#64748b',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Mostrar</span>
          <input
            type="number" min="1" value={currentItemsPerPage}
            onChange={e => { setCurrentItemsPerPage(e.target.value === '' ? '' : Number(e.target.value)); setCurrentPage(1); }}
            onBlur={e => { if (!e.target.value || Number(e.target.value) < 1) setCurrentItemsPerPage(10); }}
            style={{
              width: '64px', padding: '4px 8px',
              background: '#1e293b', border: '1px solid #334155',
              borderRadius: '6px', outline: 'none',
              color: '#f8fafc', fontSize: '13px', textAlign: 'center',
            }}
          />
          <span>linhas</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '5px 12px',
              background: '#1e293b', border: '1px solid #334155',
              borderRadius: '6px', color: '#94a3b8',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '13px', fontWeight: 500,
              opacity: currentPage === 1 ? 0.4 : 1,
              transition: 'all 0.15s',
            }}
            onMouseOver={e => { if (currentPage !== 1) { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.color = '#10b981'; } }}
            onMouseOut={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            Anterior
          </button>

          <span style={{ fontWeight: 500, color: '#94a3b8', minWidth: '100px', textAlign: 'center' }}>
            Página {currentPage} de {Math.max(1, totalPages)}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages || totalPages === 0}
            style={{
              padding: '5px 12px',
              background: '#1e293b', border: '1px solid #334155',
              borderRadius: '6px', color: '#94a3b8',
              cursor: (currentPage >= totalPages || totalPages === 0) ? 'not-allowed' : 'pointer',
              fontSize: '13px', fontWeight: 500,
              opacity: (currentPage >= totalPages || totalPages === 0) ? 0.4 : 1,
              transition: 'all 0.15s',
            }}
            onMouseOver={e => { if (currentPage < totalPages) { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.color = '#10b981'; } }}
            onMouseOut={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            Próxima
          </button>
        </div>
      </div>
    </>
  );

  if (_embutido) return inner;

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <div style={{
        background: '#0f172a',
        borderRadius: '12px',
        border: '1px solid #1e293b',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}>
        {inner}
      </div>
    </div>
  );
};

export default GridDados;
