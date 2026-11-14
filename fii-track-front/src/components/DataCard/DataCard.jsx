import React from 'react';
import { AiOutlinePlus } from 'react-icons/ai';
import { GridDados } from '../GridDados';

/**
 * DataCard — container padrão de tabela da aplicação.
 *
 * Props:
 *  titulo          string
 *  subtitulo       string?
 *  botaoLabel      string?
 *  onBotaoClick    () => void?
 *  filtros         ReactNode?
 *  rodape          string?
 *  — props repassadas ao GridDados —
 *  coluna, data, itemsPerPage, labelpesquisa,
 *  usaVisualizar, acaoVisualizar, usaEditar, acaoEditar,
 *  usaExcluir, acaoExcluir, usaResetarSenha, acaoResetarSenha,
 *  usaInativar, acaoInativar, usaReativar, acaoReativar
 */
export default function DataCard({
  titulo, subtitulo, botaoLabel, onBotaoClick, botaoExtra, filtros, rodape,
  coluna, data, itemsPerPage, labelpesquisa,
  usaVisualizar,   acaoVisualizar,
  usaEditar,       acaoEditar,
  usaExcluir,      acaoExcluir,
  usaReinvestir,   acaoReinvestir,
  usaResetarSenha, acaoResetarSenha,
  usaInativar,     acaoInativar,
  usaReativar,     acaoReativar,
}) {
  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: '12px',
      border: '1px solid var(--borda)',
      overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--borda)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255,255,255,0.02)',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        {/* Título + filtros */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--texto)', margin: 0 }}>
              {titulo}
            </h2>
            {subtitulo && (
              <span style={{ fontSize: '12px', color: 'var(--texto-mudo)' }}>{subtitulo}</span>
            )}
          </div>
          {filtros}
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {botaoExtra}
          {botaoLabel && onBotaoClick && (
            <button
              onClick={onBotaoClick}
              style={{
                background: 'var(--accent-gradiente)',
                color: '#fff',
                fontWeight: 600,
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '13px',
                boxShadow: '0 2px 12px rgba(16,185,129,0.3)',
              }}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(16,185,129,0.45)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(16,185,129,0.3)';
              }}
            >
              <AiOutlinePlus size={16} />
              {botaoLabel}
            </button>
          )}
        </div>
      </div>

      {/* ── Tabela ── */}
      <GridDados
        coluna={coluna}
        data={data}
        itemsPerPage={itemsPerPage}
        labelpesquisa={labelpesquisa}
        usaVisualizar={usaVisualizar}     acaoVisualizar={acaoVisualizar}
        usaEditar={usaEditar}             acaoEditar={acaoEditar}
        usaExcluir={usaExcluir}           acaoExcluir={acaoExcluir}
        usaReinvestir={usaReinvestir}     acaoReinvestir={acaoReinvestir}
        usaResetarSenha={usaResetarSenha} acaoResetarSenha={acaoResetarSenha}
        usaInativar={usaInativar}         acaoInativar={acaoInativar}
        usaReativar={usaReativar}         acaoReativar={acaoReativar}
        _embutido
      />

      {/* ── Rodapé ── */}
      <div style={{
        padding: '0.75rem 1.25rem',
        background: 'rgba(255,255,255,0.02)',
        borderTop: '1px solid var(--borda)',
        fontSize: '11px',
        color: 'var(--borda-forte)',
        textAlign: 'center',
      }}>
        {rodape || 'Os dados são fornecidos para fins informativos. Simulação de ambiente Web.'}
      </div>
    </div>
  );
}
