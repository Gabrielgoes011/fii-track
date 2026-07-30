import { useEffect, useState } from 'react';
import { FiLayers, FiRefreshCw, FiEdit2 } from 'react-icons/fi';
import { AiOutlineInfoCircle } from 'react-icons/ai';
import SkeletonTable from '../../components/SkeletonTable/SkeletonTable';
import SlideModal from '../../components/SlideModal/SlideModal';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useControleAtivos } from '../../hooks/controleAtivos/useControleAtivos';

// ─── Formatadores ─────────────────────────────────────────────────────────────
const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const fmtSinal = (v) => {
  if (v === null || v === undefined) return '—';
  return (v > 0 ? '+' : '') + fmt(v);
};

const fmtPerc = (v, casas = 2) => {
  if (v === null || v === undefined) return '—';
  return (v > 0 ? '+' : '') + (v * 100).toFixed(casas).replace('.', ',') + '%';
};

const fmtPercSemSinal = (v, casas = 2) => {
  if (v === null || v === undefined) return '—';
  return (v * 100).toFixed(casas).replace('.', ',') + '%';
};

const corRent  = (v) => (v == null ? '#94a3b8' : v > 0 ? '#4ade80' : v < 0 ? '#f87171' : '#94a3b8');
const corDesc  = (v) => (v == null ? '#64748b' : v > 0 ? '#4ade80' : v < 0 ? '#f87171' : '#94a3b8');
// ─────────────────────────────────────────────────────────────────────────────

const BADGE = {
  aportar:    { bg: 'rgba(16,185,129,0.15)',  cor: '#4ade80',  borda: 'rgba(16,185,129,0.3)',  txt: 'Aportar'      },
  equilibrio: { bg: 'rgba(251,191,36,0.15)',  cor: '#fbbf24',  borda: 'rgba(251,191,36,0.3)',  txt: 'Equilíbrio'   },
  acima:      { bg: 'rgba(248,113,113,0.15)', cor: '#f87171',  borda: 'rgba(248,113,113,0.3)', txt: 'Acima Ideal'  },
};

// ─── Sub-componente: linha da tabela ───────────────────────────────────────────
function LinhaAtivo({ row, onEditar, isOdd }) {
  const bgLinha = isOdd ? 'rgba(255,255,255,0.01)' : 'transparent';
  const td = (extra = {}) => ({
    padding: '0.7rem 0.6rem', borderBottom: '1px solid #1e293b',
    fontSize: '12px', color: '#cbd5e1',
    fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
    background: bgLinha, ...extra,
  });

  const cfg = BADGE[row.acaoEquilibrio] ?? BADGE.equilibrio;

  return (
    <tr
      onMouseOver={(e) => { [...e.currentTarget.children].forEach(c => { c.style.background = 'rgba(16,185,129,0.04)'; }); }}
      onMouseOut={(e)  => { [...e.currentTarget.children].forEach(c => { c.style.background = bgLinha; }); }}
    >
      {/* 1 - Ativo */}
      <td style={{ ...td(), textAlign: 'left', position: 'sticky', left: 0, background: bgLinha, zIndex: 1, borderRight: '1px solid #1e293b' }}>
        <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '13px' }}>{row.ticker}</span>
      </td>
      {/* 2 - Segmento */}
      <td style={{ ...td(), textAlign: 'left', color: '#94a3b8' }}>{row.segmento}</td>
      {/* 3 - Cotação */}
      <td style={{ ...td(), textAlign: 'right' }}>{fmt(row.cotacao)}</td>
      {/* 4 - Quant. */}
      <td style={{ ...td(), textAlign: 'center' }}>{row.quantidade}</td>
      {/* 5 - Preço Médio */}
      <td style={{ ...td(), textAlign: 'right' }}>{fmt(row.precoMedio)}</td>
      {/* 6 - Custo */}
      <td style={{ ...td(), textAlign: 'right' }}>{fmt(row.custo)}</td>
      {/* 7 - Valor Atual */}
      <td style={{ ...td(), textAlign: 'right', color: '#e2e8f0' }}>{fmt(row.valorAtual)}</td>
      {/* 8 - Rent. R$ */}
      <td style={{ ...td(), textAlign: 'right', color: corRent(row.rentabilidadeReais) }}>{fmtSinal(row.rentabilidadeReais)}</td>
      {/* 9 - Rent. % */}
      <td style={{ ...td(), textAlign: 'right', color: corRent(row.rentabilidadePerc) }}>{fmtPerc(row.rentabilidadePerc)}</td>
      {/* 10 - Rent. + Proventos */}
      <td style={{ ...td(), textAlign: 'right', color: corRent(row.rentabilidadeTotalPerc) }}>{fmtPerc(row.rentabilidadeTotalPerc)}</td>
      {/* 11 - Desconto */}
      <td style={{ ...td(), textAlign: 'right', color: corDesc(row.desconto) }}>
        {row.desconto != null ? fmtPerc(row.desconto) : '—'}
      </td>
      {/* 12 - % Atual */}
      <td style={{ ...td(), textAlign: 'right' }}>{fmtPercSemSinal(row.percAtual)}</td>
      {/* 13 - Ação Equilíbrio (Badge) */}
      <td style={{ ...td(), textAlign: 'center' }}>
        <span style={{
          background: cfg.bg, color: cfg.cor, border: `1px solid ${cfg.borda}`,
          borderRadius: '9999px', padding: '3px 10px',
          fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap',
        }}>
          {cfg.txt}
        </span>
      </td>
      {/* 14 - C/V Equilíbrio */}
      <td style={{ ...td(), textAlign: 'right', color: corRent(row.valorEquilibrio) }}>
        {fmtSinal(row.valorEquilibrio)}
      </td>
      {/* 15 - Editar (Px Teto / % Ideal) */}
      <td style={{ ...td(), textAlign: 'center' }}>
        <button
          onClick={() => onEditar(row)}
          title="Editar Preço Teto e % Ideal"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '28px', height: '28px', padding: 0,
            background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
            borderRadius: '7px', color: '#a78bfa', cursor: 'pointer',
          }}
        >
          <FiEdit2 size={13} />
        </button>
      </td>
    </tr>
  );
}

// ─── Sub-componente: modal de edição de metas (Px Teto / % Ideal) ─────────────
function ModalEditarMetas({ row, onClose, onSalvarPrecoTeto, onSalvarPercIdeal }) {
  const [precoTeto, setPrecoTeto] = useState('');
  const [percIdeal, setPercIdeal] = useState('');

  useEffect(() => {
    if (!row) return;
    setPrecoTeto(row.precoTeto ?? '');
    setPercIdeal(row.percIdeal != null ? (row.percIdeal * 100).toFixed(2) : '');
  }, [row]);

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    background: '#0f172a', border: '1px solid #334155',
    borderRadius: '8px', color: '#f8fafc',
    fontSize: '14px', outline: 'none',
    fontVariantNumeric: 'tabular-nums',
  };

  const labelStyle = { fontSize: '12px', color: '#94a3b8', marginBottom: '6px', display: 'block' };

  const handleSalvar = () => {
    onSalvarPrecoTeto(row.idAtivo, precoTeto);
    onSalvarPercIdeal(row.idAtivo, percIdeal);
    onClose();
  };

  return (
    <SlideModal isOpen={!!row} onClose={onClose} title={row ? `Metas — ${row.ticker}` : ''} width="360px">
      {row && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Preço Teto</label>
            <input
              type="number" step="0.01" min="0"
              value={precoTeto}
              onChange={(e) => setPrecoTeto(e.target.value)}
              onFocus={(e) => { e.target.style.borderColor = '#10b981'; }}
              onBlur={(e) => { e.target.style.borderColor = '#334155'; }}
              style={inputStyle}
              placeholder="—"
            />
          </div>
          <div>
            <label style={labelStyle}>% Ideal na carteira</label>
            <input
              type="number" step="0.1" min="0" max="100"
              value={percIdeal}
              onChange={(e) => setPercIdeal(e.target.value)}
              onFocus={(e) => { e.target.style.borderColor = '#10b981'; }}
              onBlur={(e) => { e.target.style.borderColor = '#334155'; }}
              style={inputStyle}
              placeholder="—"
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
            <button
              onClick={onClose}
              style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #243040', color: '#7a8fa8', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(139,92,246,0.35)' }}
            >
              Salvar
            </button>
          </div>
        </div>
      )}
    </SlideModal>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function PaginaControleAtivos() {
  const isMobile = useIsMobile();
  const {
    resumo, ativos, loading, loadingCotacoes,
    getCarteira, atualizarCotacoes,
    handleSalvarPrecoTeto, handleSalvarPercIdeal,
  } = useControleAtivos();

  const [ordenacao, setOrdenacao] = useState({ campo: 'ticker', direcao: 'asc' });
  const [ativoEmEdicao, setAtivoEmEdicao] = useState(null);

  useEffect(() => { getCarteira(); }, [getCarteira]);

  // ── Ordenação ──────────────────────────────────────────────────────────────
  const toggleOrdenacao = (campo) => {
    setOrdenacao((prev) => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === 'asc' ? 'desc' : 'asc',
    }));
  };

  const dadosOrdenados = [...ativos].sort((a, b) => {
    const mult = ordenacao.direcao === 'asc' ? 1 : -1;
    const va = a[ordenacao.campo], vb = b[ordenacao.campo];
    if (va === null || va === undefined) return 1;
    if (vb === null || vb === undefined) return -1;
    if (typeof va === 'string') return mult * va.localeCompare(vb);
    return mult * (va - vb);
  });

  // ── Totais do rodapé ───────────────────────────────────────────────────────
  const totalCusto       = ativos.reduce((s, a) => s + (a.custo ?? 0), 0);
  const totalValorAtual  = ativos.reduce((s, a) => s + (a.valorAtual ?? 0), 0);
  const totalRentReais   = ativos.reduce((s, a) => s + (a.rentabilidadeReais ?? 0), 0);
  const totalPercAtual   = ativos.reduce((s, a) => s + (a.percAtual ?? 0), 0);
  const totalPercIdeal   = ativos.reduce((s, a) => s + (a.percIdeal ?? 0), 0);
  const totalEquilibrio  = ativos.reduce((s, a) => s + (a.valorEquilibrio ?? 0), 0);
  const rentGeralPerc    = totalCusto > 0 ? (totalValorAtual / totalCusto) - 1 : 0;

  // ── Cabeçalho da tabela ────────────────────────────────────────────────────
  const thBase = {
    padding: '0.65rem 0.6rem', background: 'rgba(16,185,129,0.06)',
    borderBottom: '1px solid rgba(16,185,129,0.15)',
    fontSize: '10px', fontWeight: 700, color: '#64748b',
    textTransform: 'uppercase', letterSpacing: '0.5px',
    whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none',
  };

  const ThCol = ({ campo, label, align = 'right' }) => {
    const ativo = ordenacao.campo === campo;
    return (
      <th
        style={{ ...thBase, textAlign: align }}
        onClick={() => toggleOrdenacao(campo)}
      >
        {label} {ativo ? (ordenacao.direcao === 'asc' ? '▲' : '▼') : <span style={{ opacity: 0.3 }}>⇅</span>}
      </th>
    );
  };

  // ── KPI Card inline ────────────────────────────────────────────────────────
  const KpiCard = ({ label, valor, sub, cor }) => (
    <div style={{
      background: '#0f172a', border: '1px solid #1e293b',
      borderRadius: '12px', padding: '1rem',
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      flex: '1 1 200px', // permite que o grid comprima o card
    }}>
      <p style={{ margin: 0, fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
      <p style={{ margin: '0.35rem 0 0', fontSize: '1.25rem', fontWeight: 700, color: cor ?? '#f8fafc', fontVariantNumeric: 'tabular-nums' }}>
        {loading ? '···' : valor}
      </p>
      {sub && <p style={{ margin: '2px 0 0', fontSize: '11px', color: sub.cor ?? '#64748b' }}>{loading ? '' : sub.txt}</p>}
    </div>
  );

  const corRentResumo = resumo ? corRent(resumo.rentabilidadeReais) : '#94a3b8';
  const somaPercIdeal = totalPercIdeal;
  const corSomaIdeal  = Math.abs(somaPercIdeal - 1) < 0.001 ? '#4ade80' : '#f87171';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b1120', color: '#f1f5f9', fontFamily: 'Inter, sans-serif', padding: isMobile ? '1rem 0.75rem' : '2rem 1rem' }}>
      <main style={{ maxWidth: '100%' }}>

        {/* ── Header ── */}
        <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}>
              <FiLayers size={20} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>Controle de Ativos</h1>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Posição consolidada da carteira</p>
            </div>
          </div>

          <button
            onClick={atualizarCotacoes}
            disabled={loadingCotacoes || loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '0.55rem 1rem', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600,
              cursor: loadingCotacoes ? 'not-allowed' : 'pointer',
              fontSize: '13px', boxShadow: '0 4px 16px rgba(139,92,246,0.3)',
              opacity: loadingCotacoes ? 0.7 : 1, transition: 'all 0.2s',
            }}
          >
            <FiRefreshCw size={14} style={{ animation: loadingCotacoes ? 'spin 1s linear infinite' : 'none' }} />
            {loadingCotacoes ? 'Atualizando...' : 'Atualizar Cotações'}
          </button>
        </header>

        {/* ── KPI Cards ── */}
        <div style={{
          backgroundColor: '#0f172a', borderRadius: '0.75rem',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)', border: '1px solid #1e293b',
          padding: isMobile ? '1rem' : '1.5rem', marginBottom: '1.5rem',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.75rem',
          }}>
            <KpiCard label="Custo Total"      valor={fmt(resumo?.custoTotal)}        cor="#60a5fa" />
            <KpiCard label="Valor Atual"      valor={fmt(resumo?.valorAtualTotal)}    cor="#10b981" />
            <KpiCard
              label="Rentabilidade"
              valor={fmtSinal(resumo?.rentabilidadeReais)}
              sub={{ txt: fmtPerc(resumo?.rentabilidadePerc), cor: corRentResumo }}
              cor={corRentResumo}
            />
            <KpiCard label="Total Proventos"  valor={fmt(resumo?.totalProventos)}     cor="#a78bfa" />
          </div>
        </div>

        {/* ── Aviso Brapi ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '1rem' }}>
          <AiOutlineInfoCircle size={12} color="#475569" />
          <span style={{ fontSize: '11px', color: '#475569' }}>
            Cotações baseadas no fechamento do último dia útil · Fonte: Brapi
            {resumo?.dataAtualizacaoCotacoes && ` · ${resumo.dataAtualizacaoCotacoes}`}
          </span>
        </div>

        {/* ── Tabela ── */}
        {loading ? (
          <SkeletonTable rows={10} cols={8} />
        ) : (
          <div style={{ background: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', boxShadow: '0 4px 24px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                <thead>
                  <tr>
                    <th style={{ ...thBase, textAlign: 'left', position: 'sticky', left: 0, zIndex: 2, background: 'rgba(16,185,129,0.06)', borderRight: '1px solid rgba(16,185,129,0.15)', minWidth: '80px' }} onClick={() => toggleOrdenacao('ticker')}>
                      Ativo {ordenacao.campo === 'ticker' ? (ordenacao.direcao === 'asc' ? '▲' : '▼') : <span style={{ opacity: 0.3 }}>⇅</span>}
                    </th>
                    <ThCol campo="segmento"              label="Segmento"        align="left"   />
                    <ThCol campo="cotacao"               label="Cotação"                        />
                    <ThCol campo="quantidade"            label="Quant."          align="center" />
                    <ThCol campo="precoMedio"            label="Px Médio"                       />
                    <ThCol campo="custo"                 label="Custo"                          />
                    <ThCol campo="valorAtual"            label="Valor Atual"                    />
                    <ThCol campo="rentabilidadeReais"    label="Rent. R$"                       />
                    <ThCol campo="rentabilidadePerc"     label="Rent. %"                        />
                    <ThCol campo="rentabilidadeTotalPerc" label="Rent.+Prov."                   />
                    <ThCol campo="desconto"              label="Desconto"                       />
                    <ThCol campo="percAtual"             label="% Atual"                        />
                    <ThCol campo="acaoEquilibrio"        label="Ação"            align="center" />
                    <ThCol campo="valorEquilibrio"       label="C/V Equilíbrio"                 />
                    <th style={{ ...thBase, textAlign: 'center', minWidth: '60px', cursor: 'default' }}>Metas</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosOrdenados.map((row, i) => (
                    <LinhaAtivo
                      key={row.idAtivo}
                      row={row}
                      onEditar={setAtivoEmEdicao}
                      isOdd={i % 2 !== 0}
                    />
                  ))}
                </tbody>
                {/* ── Linha de totais ── */}
                <tfoot>
                  <tr style={{ background: 'rgba(16,185,129,0.06)', borderTop: '2px solid rgba(16,185,129,0.2)' }}>
                    {/* Ativo */}
                    <td style={{ padding: '0.7rem 0.6rem', fontSize: '12px', fontWeight: 700, color: '#f8fafc', position: 'sticky', left: 0, background: 'rgba(16,185,129,0.06)', zIndex: 1, borderRight: '1px solid #1e293b', whiteSpace: 'nowrap' }}>
                      Total
                    </td>
                    {/* Segmento */}
                    <td style={{ padding: '0.7rem 0.6rem' }} />
                    {/* Cotação */}
                    <td style={{ padding: '0.7rem 0.6rem' }} />
                    {/* Quant. */}
                    <td style={{ padding: '0.7rem 0.6rem' }} />
                    {/* Px Médio */}
                    <td style={{ padding: '0.7rem 0.6rem' }} />
                    {/* Custo */}
                    <td style={{ padding: '0.7rem 0.6rem', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: '#60a5fa', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalCusto)}</td>
                    {/* Valor Atual */}
                    <td style={{ padding: '0.7rem 0.6rem', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalValorAtual)}</td>
                    {/* Rent. R$ */}
                    <td style={{ padding: '0.7rem 0.6rem', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: corRent(totalRentReais), fontVariantNumeric: 'tabular-nums' }}>{fmtSinal(totalRentReais)}</td>
                    {/* Rent. % */}
                    <td style={{ padding: '0.7rem 0.6rem', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: corRent(rentGeralPerc), fontVariantNumeric: 'tabular-nums' }}>{fmtPerc(rentGeralPerc)}</td>
                    {/* Rent.+Prov. */}
                    <td style={{ padding: '0.7rem 0.6rem' }} />
                    {/* Desconto */}
                    <td style={{ padding: '0.7rem 0.6rem' }} />
                    {/* % Atual */}
                    <td style={{ padding: '0.7rem 0.6rem', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: '#f8fafc', fontVariantNumeric: 'tabular-nums' }}>{fmtPercSemSinal(totalPercAtual)}</td>
                    {/* Ação */}
                    <td style={{ padding: '0.7rem 0.6rem' }} />
                    {/* C/V Equilíbrio */}
                    <td style={{ padding: '0.7rem 0.6rem', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: corRent(totalEquilibrio), fontVariantNumeric: 'tabular-nums' }}>{fmtSinal(totalEquilibrio)}</td>
                    {/* Metas */}
                    <td style={{ padding: '0.7rem 0.6rem' }} />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* ── Rodapé com indicador de % ideal ── */}
            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', background: 'rgba(255,255,255,0.01)' }}>
              <span style={{ fontSize: '11px', color: '#475569' }}>
                {ativos.length} ativos · {isMobile ? '' : 'Clique nos cabeçalhos para ordenar'}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>
                Soma % Ideal:{' '}
                <span style={{ color: corSomaIdeal }}>
                  {fmtPercSemSinal(somaPercIdeal)} de 100,00%
                </span>
                {Math.abs(somaPercIdeal - 1) >= 0.001 && (
                  <span style={{ color: '#f87171', fontSize: '11px', marginLeft: '6px' }}>
                    ⚠ Ajuste as metas para somar 100%
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
      </main>

      <ModalEditarMetas
        row={ativoEmEdicao}
        onClose={() => setAtivoEmEdicao(null)}
        onSalvarPrecoTeto={handleSalvarPrecoTeto}
        onSalvarPercIdeal={handleSalvarPercIdeal}
      />

      {/* ── CSS animação do botão ── */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
