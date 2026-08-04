import { useEffect, useState } from 'react';
import { FiLayers, FiRefreshCw, FiEdit2, FiPlus, FiChevronDown, FiTrash2, FiCheck, FiX, FiBriefcase } from 'react-icons/fi';
import { AiOutlineInfoCircle } from 'react-icons/ai';
import SkeletonTable from '../../components/SkeletonTable/SkeletonTable';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useControleAtivos } from '../../hooks/controleAtivos/useControleAtivos';
import { controleAtivosService } from '../../services/controleAtivos/controleAtivosService';
import { toastWarn, handleError } from '../../utils/responseUtils';

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
const corRent = (v) => (v == null ? '#94a3b8' : v > 0 ? '#4ade80' : v < 0 ? '#f87171' : '#94a3b8');

const BADGE = {
  aportar:    { bg: 'rgba(59,130,246,0.12)', cor: '#60a5fa', borda: 'rgba(59,130,246,0.3)', txt: 'Aportar' },
  equilibrio: { bg: 'rgba(16,185,129,0.12)', cor: '#4ade80', borda: 'rgba(16,185,129,0.3)', txt: 'Equilíbrio' },
  acima:      { bg: 'rgba(251,191,36,0.12)', cor: '#fbbf24', borda: 'rgba(251,191,36,0.3)', txt: 'Acima Ideal' },
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, valor, sub, cor, loading: ld }) {
  return (
    <div style={{
      background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px',
      padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '14px',
    }}>
      {Icon && (
        <div style={{
          width: '38px', height: '38px', borderRadius: '10px',
          background: `${cor}15`, border: `1px solid ${cor}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={18} color={cor} />
        </div>
      )}
      <div>
        <p style={{ margin: 0, fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
        <p style={{ margin: '2px 0 0', fontSize: '1.15rem', fontWeight: 700, color: cor ?? '#f8fafc', fontVariantNumeric: 'tabular-nums' }}>
          {ld ? '···' : valor}
        </p>
        {sub && <p style={{ margin: '1px 0 0', fontSize: '11px', color: sub.cor ?? '#64748b' }}>{ld ? '' : sub.txt}</p>}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onAdd }) {
  return (
    <div style={{
      background: '#0f172a', border: '2px dashed #1e293b', borderRadius: '16px',
      padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', textAlign: 'center', gap: '12px',
    }}>
      <div style={{
        width: '56px', height: '56px', borderRadius: '14px',
        background: 'rgba(100,116,139,0.1)', border: '1px solid #334155',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <FiBriefcase size={24} color="#64748b" />
      </div>
      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>Sua carteira está vazia</h3>
      <p style={{ margin: 0, fontSize: '13px', color: '#64748b', maxWidth: '360px', lineHeight: 1.5 }}>
        Defina sua estratégia! Adicione o primeiro Fundo Imobiliário informando seu objetivo, segmento e percentual alvo ideal para começar a monitorar.
      </p>
      <button onClick={onAdd} style={{
        marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px',
        padding: '10px 20px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600,
        fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
      }}>
        <FiPlus size={16} /> Adicionar Primeiro Ativo
      </button>
    </div>
  );
}

// ─── Formulário Inline (Adicionar/Editar — fundo laranja) ─────────────────────
function FormularioInline({ onCancelar, onSalvar, onExcluir, inicial, segmentos, ativos, segmentoIdInicial, loadingAtivos, onSegmentoChange }) {
  const [objetivo, setObjetivo] = useState(inicial?.objetivo ?? 'Renda');
  const [segmentoId, setSegmentoId] = useState(inicial?.segmentoId ?? segmentoIdInicial ?? '');
  const [ticker, setTicker] = useState(inicial?.ticker ?? '');
  const [percIdeal, setPercIdeal] = useState(inicial?.percIdeal != null ? (inicial.percIdeal * 100).toFixed(2) : '');

  const selectedSegmento = segmentos?.find((s) => String(s.idSeguimento) === String(segmentoId));
  const tickersDisponiveis = segmentoId ? (ativos?.map((a) => a.ticker) || []) : [];

  const handleSalvar = () => {
    if (!segmentoId || !ticker || !percIdeal) {
      toastWarn('Preencha todos os campos.');
      return;
    }
    onSalvar({
      objetivo,
      segmentoId,
      segmentoNome: selectedSegmento?.nomeSeguimento || '',
      ticker,
      percIdeal: parseFloat(percIdeal) / 100,
    });
  };

  return (
    <div style={{
      background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.25)',
      borderRadius: '12px', padding: '16px', marginBottom: '10px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiEdit2 size={14} color="#fb923c" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#fb923c' }}>
            {inicial ? 'Editando Ativo' : 'Adicionando Novo Ativo'}
          </span>
        </div>
        {inicial && onExcluir && (
          <button onClick={() => onExcluir(inicial.idAtivo)} style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '7px', padding: '5px 8px', cursor: 'pointer', color: '#f87171',
            display: 'flex', alignItems: 'center',
          }}>
            <FiTrash2 size={14} />
          </button>
        )}
      </div>

      {/* Campos do formulário */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '14px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Objetivo</label>
          <select value={objetivo} onChange={e => setObjetivo(e.target.value)} style={{
            width: '100%', padding: '8px 10px', background: '#0f172a', border: '1px solid #334155',
            borderRadius: '8px', color: '#f1f5f9', fontSize: '13px', outline: 'none', cursor: 'pointer',
          }}>
            <option value="Renda">Renda</option>
            <option value="Ganho de Capital">Ganho de Capital</option>
            <option value="Oportunidade">Oportunidade</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Segmento</label>
          <select value={segmentoId} onChange={e => {
              const value = e.target.value;
              setSegmentoId(value);
              setTicker('');
              onSegmentoChange?.(value);
            }} style={{
            width: '100%', padding: '8px 10px', background: '#0f172a', border: '1px solid #334155',
            borderRadius: '8px', color: '#f1f5f9', fontSize: '13px', outline: 'none', cursor: 'pointer',
          }}>
            <option value="">Selecione...</option>
            {segmentos.map(s => (
              <option key={s.idSeguimento} value={s.idSeguimento}>{s.nomeSeguimento}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Ativo (Ticker)</label>
          <select value={ticker} onChange={e => setTicker(e.target.value)} disabled={!segmentoId || loadingAtivos} style={{
            width: '100%', padding: '8px 10px', background: '#0f172a', border: '1px solid #334155',
            borderRadius: '8px', color: segmentoId ? '#f1f5f9' : '#475569', fontSize: '13px', outline: 'none',
            cursor: segmentoId && !loadingAtivos ? 'pointer' : 'not-allowed', opacity: segmentoId && !loadingAtivos ? 1 : 0.6,
          }}>
            <option value="">{loadingAtivos ? 'Carregando ativos...' : 'Selecione...'}</option>
            {tickersDisponiveis.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>% Ideal na Carteira</label>
          <div style={{ position: 'relative' }}>
            <input type="number" min="0" max="100" step="0.1" value={percIdeal} onChange={e => setPercIdeal(e.target.value)} style={{
              width: '100%', padding: '8px 30px 8px 10px', background: '#0f172a', border: '1px solid #334155',
              borderRadius: '8px', color: '#f1f5f9', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
            }} placeholder="0" />
            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#fb923c', fontWeight: 700, fontSize: '13px' }}>%</span>
          </div>
        </div>
      </div>

      {/* Botões */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button onClick={onCancelar} style={{
          display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px',
          background: 'transparent', border: '1px solid #334155', borderRadius: '8px',
          color: '#94a3b8', fontWeight: 600, fontSize: '12px', cursor: 'pointer',
        }}>
          <FiX size={13} /> Cancelar
        </button>
        <button onClick={handleSalvar} style={{
          display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px',
          background: 'linear-gradient(135deg, #f97316, #ea580c)', border: 'none', borderRadius: '8px',
          color: '#fff', fontWeight: 600, fontSize: '12px', cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(249,115,22,0.3)',
        }}>
          <FiCheck size={13} /> Salvar e Calcular
        </button>
      </div>
    </div>
  );
}

// ─── Barra de Progresso (% Atual vs % Ideal) ─────────────────────────────────
function BarraProgresso({ atual, ideal }) {
  const percAtual = (atual ?? 0) * 100;
  const percIdeal = (ideal ?? 0) * 100;
  const ratio = percIdeal > 0 ? Math.min((percAtual / percIdeal) * 100, 100) : 0;
  const corBarra = percAtual > percIdeal ? '#fbbf24' : percAtual >= percIdeal * 0.9 ? '#4ade80' : '#60a5fa';

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginBottom: '3px' }}>
        <span style={{ fontWeight: 600, color: '#cbd5e1' }}>{percAtual.toFixed(2)}%</span>
        <span>/ {percIdeal.toFixed(2)}%</span>
      </div>
      <div style={{ height: '5px', background: '#1e293b', borderRadius: '9999px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${ratio}%`, background: corBarra, borderRadius: '9999px', transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

// ─── Linha do Ativo (Card expansível) ─────────────────────────────────────────
function LinhaAtivo({ row, expandido, onToggle, onEditar, isMobile }) {
  const cfg = BADGE[row.acaoEquilibrio] ?? BADGE.equilibrio;
  const isNeg = (row.rentabilidadePerc ?? 0) < 0;

  return (
    <div style={{
      background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px',
      overflow: 'hidden', transition: 'box-shadow 0.2s',
      boxShadow: expandido ? '0 4px 20px rgba(0,0,0,0.4)' : 'none',
      borderLeft: isMobile ? `3px solid ${cfg.cor}` : undefined,
    }}>
      {/* ── Linha colapsada ── */}
      <div
        onClick={onToggle}
        style={{
          padding: isMobile ? '12px 12px' : '12px 16px',
          cursor: 'pointer', transition: 'background 0.15s',
        }}
        onMouseOver={e => { if (!isMobile) e.currentTarget.style.background = 'rgba(16,185,129,0.03)'; }}
        onMouseOut={e => { if (!isMobile) e.currentTarget.style.background = 'transparent'; }}
      >
        {isMobile ? (
          /* ── MOBILE: layout compacto de card ── */
          <>
            {/* Linha 1: Ticker + Badge + Ações */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc' }}>{row.ticker}</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{row.segmento}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  background: cfg.bg, color: cfg.cor, border: `1px solid ${cfg.borda}`,
                  borderRadius: '9999px', padding: '2px 8px', fontSize: '10px', fontWeight: 600,
                }}>
                  {cfg.txt}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onEditar(row); }}
                  style={{
                    width: '26px', height: '26px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
                    borderRadius: '6px', color: '#a78bfa', cursor: 'pointer',
                  }}
                >
                  <FiEdit2 size={11} />
                </button>
                <FiChevronDown size={14} color="#64748b" style={{
                  transition: 'transform 0.2s', transform: expandido ? 'rotate(180deg)' : 'rotate(0deg)',
                }} />
              </div>
            </div>

            {/* Linha 2: Saldo + Rentabilidade (lado a lado) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
              <div>
                <span style={{ fontSize: '9px', color: '#475569', textTransform: 'uppercase', fontWeight: 600 }}>Saldo</span>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>{fmt(row.valorAtual)}</p>
                <p style={{ margin: 0, fontSize: '10px', color: '#64748b' }}>{row.quantidade} cotas</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '9px', color: '#475569', textTransform: 'uppercase', fontWeight: 600 }}>Rent.</span>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: corRent(row.rentabilidadePerc) }}>
                  {isNeg ? '↓' : '↑'} {fmtPerc(row.rentabilidadePerc)}
                </p>
                <p style={{ margin: 0, fontSize: '10px', color: corRent(row.rentabilidadeReais) }}>{fmtSinal(row.rentabilidadeReais)}</p>
              </div>
            </div>

            {/* Linha 3: Barra de progresso */}
            <BarraProgresso atual={row.percAtual} ideal={row.percIdeal} />
          </>
        ) : (
          /* ── DESKTOP: layout em linha ── */
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* Bloco 1: Ativo + Segmento */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1.2' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '8px', background: '#1e293b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontWeight: 800, color: '#94a3b8', flexShrink: 0,
              }}>
                {row.ticker?.substring(0, 2)}
              </div>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>{row.ticker}</span>
                <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>{row.segmento}</span>
              </div>
            </div>

            {/* Bloco 2: Saldo Atual */}
            <div style={{ flex: '1', minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>{fmt(row.valorAtual)}</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{row.quantidade} cotas a {fmt(row.cotacao)}</p>
            </div>

            {/* Bloco 3: Rentabilidade */}
            <div style={{ flex: '0.8', minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: corRent(row.rentabilidadePerc) }}>
                {isNeg ? '↓' : '↑'} {fmtPerc(row.rentabilidadePerc)}
              </p>
              <p style={{ margin: 0, fontSize: '11px', color: corRent(row.rentabilidadeReais) }}>{fmtSinal(row.rentabilidadeReais)}</p>
            </div>

            {/* Bloco 4: Balanceamento */}
            <div style={{ flex: '1.2', minWidth: 0 }}>
              <BarraProgresso atual={row.percAtual} ideal={row.percIdeal} />
            </div>

            {/* Bloco 5: Badge status */}
            <div style={{ flex: '0.6', display: 'flex', justifyContent: 'center' }}>
              <span style={{
                background: cfg.bg, color: cfg.cor, border: `1px solid ${cfg.borda}`,
                borderRadius: '9999px', padding: '4px 12px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap',
              }}>
                {cfg.txt}
              </span>
            </div>

            {/* Bloco 6: Ações */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '70px', justifyContent: 'flex-end' }}>
              <button
                onClick={(e) => { e.stopPropagation(); onEditar(row); }}
                style={{
                  width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
                  borderRadius: '7px', color: '#a78bfa', cursor: 'pointer',
                }}
                title="Editar metas"
              >
                <FiEdit2 size={12} />
              </button>
              <FiChevronDown size={16} color="#64748b" style={{
                transition: 'transform 0.2s', transform: expandido ? 'rotate(180deg)' : 'rotate(0deg)',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Painel expandido (detalhes financeiros) ── */}
      {expandido && (
        <div style={{
          padding: '14px 16px', borderTop: '1px solid #1e293b',
          background: 'rgba(255,255,255,0.015)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <AiOutlineInfoCircle size={12} color="#475569" />
            <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>Detalhes Financeiros</span>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
            gap: '10px',
          }}>
            {/* Preço Médio vs Atual */}
            <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px 12px' }}>
              <p style={{ margin: 0, fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Preço Médio vs Atual</p>
              <p style={{ margin: '4px 0 0', fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>{fmt(row.precoMedio)}</p>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>Atual: {fmt(row.cotacao)}</p>
            </div>
            {/* Preço Teto & Desconto */}
            <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px 12px' }}>
              <p style={{ margin: 0, fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Preço Teto & Desconto</p>
              <p style={{ margin: '4px 0 0', fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>{row.precoTeto ? fmt(row.precoTeto) : '—'}</p>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: corRent(row.desconto) }}>
                {row.desconto != null ? `Desc: ${fmtPerc(row.desconto)}` : '—'}
              </p>
            </div>
            {/* Rent. + Proventos */}
            <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px 12px' }}>
              <p style={{ margin: 0, fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Rent. + Proventos</p>
              <p style={{ margin: '4px 0 0', fontSize: '15px', fontWeight: 700, color: corRent(row.rentabilidadeTotalPerc) }}>{fmtPerc(row.rentabilidadeTotalPerc)}</p>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>Considerando dividendos</p>
            </div>
            {/* Valor para Equilíbrio */}
            <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px 12px' }}>
              <p style={{ margin: 0, fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Valor para Equilíbrio</p>
              <p style={{ margin: '4px 0 0', fontSize: '15px', fontWeight: 700, color: corRent(row.valorEquilibrio) }}>{fmtSinal(row.valorEquilibrio)}</p>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>
                {row.valorEquilibrio > 0 ? 'Falta aportar' : 'Acima do ideal'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function PaginaControleAtivos() {
  const isMobile = useIsMobile();
  const {
    resumo, ativos, loading, loadingCotacoes,
    getCarteira, atualizarCotacoes,
    handleSalvarPrecoTeto, handleSalvarPercIdeal,
  } = useControleAtivos();

  const [expandido, setExpandido] = useState(null);
  const [showFormInline, setShowFormInline] = useState(false);
  const [ativoEmEdicao, setAtivoEmEdicao] = useState(null);
  const [segmentos, setSegmentos] = useState([]);
  const [ativosSegmentoDropdown, setAtivosSegmentoDropdown] = useState([]);
  const [segmentoSelecionadoId, setSegmentoSelecionadoId] = useState('');
  const [loadingSegmentos, setLoadingSegmentos] = useState(false);
  const [loadingAtivosSegmento, setLoadingAtivosSegmento] = useState(false);

  useEffect(() => {
    getCarteira();
    loadSegmentos();
  }, [getCarteira]);

  useEffect(() => {
    if (segmentoSelecionadoId) {
      loadAtivosPorSegmento(segmentoSelecionadoId);
    } else {
      setAtivosSegmentoDropdown([]);
    }
  }, [segmentoSelecionadoId]);

  const loadSegmentos = async () => {
    setLoadingSegmentos(true);
    try {
      const data = await controleAtivosService.listarSegmentos();
      setSegmentos(data || []);
    } catch (error) {
      handleError(error);
    } finally {
      setLoadingSegmentos(false);
    }
  };

  const loadAtivosPorSegmento = async (idSegmento) => {
    if (!idSegmento) {
      setAtivosSegmentoDropdown([]);
      return;
    }
    setLoadingAtivosSegmento(true);
    try {
      const data = await controleAtivosService.listarAtivosPorSegmento(idSegmento);
      setAtivosSegmentoDropdown(data || []);
    } catch (error) {
      handleError(error);
      setAtivosSegmentoDropdown([]);
    } finally {
      setLoadingAtivosSegmento(false);
    }
  };

  // Dados derivados para o formulário de edição/adicionar
  const carteiraSegmentos = [...new Set(ativos.map(a => a.segmento))];
  const ativosPorSegmento = ativos.reduce((acc, a) => {
    if (!acc[a.segmento]) acc[a.segmento] = [];
    if (!acc[a.segmento].includes(a.ticker)) acc[a.segmento].push(a.ticker);
    return acc;
  }, {});

  const handleToggleExpand = (idAtivo) => {
    setExpandido(prev => prev === idAtivo ? null : idAtivo);
  };

  const handleAbrirFormulario = () => {
    setAtivoEmEdicao(null);
    setSegmentoSelecionadoId('');
    setAtivosSegmentoDropdown([]);
    setShowFormInline(true);
  };

  const handleEditarAtivo = (row) => {
    const segmentoEncontrado = segmentos.find((s) => s.nomeSeguimento === row.segmento);
    const segmentoId = segmentoEncontrado ? String(segmentoEncontrado.idSeguimento) : '';
    setAtivoEmEdicao({ ...row, segmentoId });
    setSegmentoSelecionadoId(segmentoId);
    setShowFormInline(true);
  };

  const handleSalvarFormulario = (dados) => {
    // TODO: Chamar API para salvar ativo na carteira
    // await controleAtivosService.salvarAtivo(dados);
    if (dados.percIdeal != null && ativoEmEdicao) {
      handleSalvarPercIdeal(ativoEmEdicao.idAtivo, (dados.percIdeal * 100).toFixed(2));
    }
    setShowFormInline(false);
    setAtivoEmEdicao(null);
  };

  const handleExcluirAtivo = (idAtivo) => {
    // TODO: Chamar API para excluir ativo da carteira
    // await controleAtivosService.excluir(idAtivo);
    setShowFormInline(false);
    setAtivoEmEdicao(null);
  };

  const corRentResumo = resumo ? corRent(resumo.rentabilidadeReais) : '#94a3b8';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b1120', color: '#f1f5f9', fontFamily: 'sans-serif' }}>
      <main style={{ maxWidth: '100%', margin: '0 auto', padding: isMobile ? '0.5rem 0' : '1rem 0.5rem' }}>

        {/* ── Header ── */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}>
              <FiLayers size={20} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>Carteira de FIIs</h1>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Gestão de ativos e rebalanceamento inteligente</p>
            </div>
          </div>
          <button onClick={handleAbrirFormulario} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '0.55rem 1rem', background: 'linear-gradient(135deg, #1e40af, #1d4ed8)',
            color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600,
            fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(30,64,175,0.3)',
          }}>
            <FiPlus size={14} /> Adicionar Ativo
          </button>
        </header>

        {/* ── KPI Cards ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '10px', marginBottom: '1.25rem',
        }}>
          <KpiCard icon={FiBriefcase} label="Custo Total Investido" valor={fmt(resumo?.custoTotal)} cor="#60a5fa" loading={loading} />
          <KpiCard icon={FiLayers} label="Saldo Atual" valor={fmt(resumo?.valorAtualTotal)} cor="#10b981" loading={loading} />
          <KpiCard
            icon={FiRefreshCw} label="Rentabilidade Global"
            valor={fmtSinal(resumo?.rentabilidadeReais)}
            sub={{ txt: fmtPerc(resumo?.rentabilidadePerc), cor: corRentResumo }}
            cor={corRentResumo} loading={loading}
          />
        </div>

        {/* ── Aviso cotações ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <AiOutlineInfoCircle size={12} color="#475569" />
            <span style={{ fontSize: '11px', color: '#475569' }}>
              Hover e clique para detalhes/edição
              {resumo?.dataAtualizacaoCotacoes && ` · Atualização: ${resumo.dataAtualizacaoCotacoes}`}
            </span>
          </div>
          <button onClick={atualizarCotacoes} disabled={loadingCotacoes || loading} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 12px', background: 'rgba(139,92,246,0.1)',
            border: '1px solid rgba(139,92,246,0.25)', borderRadius: '8px',
            color: '#a78bfa', fontSize: '11px', fontWeight: 600, cursor: loadingCotacoes ? 'not-allowed' : 'pointer',
            opacity: loadingCotacoes ? 0.6 : 1,
          }}>
            <FiRefreshCw size={12} style={{ animation: loadingCotacoes ? 'spin 1s linear infinite' : 'none' }} />
            {loadingCotacoes ? 'Atualizando...' : 'Atualizar Cotações'}
          </button>
        </div>

        {/* ── Cabeçalho da tabela (desktop only) ── */}
        {!isMobile && ativos.length > 0 && (
          <div style={{
            display: 'flex', padding: '10px 16px', marginBottom: '6px',
            fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            <span style={{ flex: '1.2' }}>Ativo / Setor</span>
            <span style={{ flex: '1' }}>Posição Atual</span>
            <span style={{ flex: '0.8' }}>Rentabilidade</span>
            <span style={{ flex: '1.2' }}>Atual / Ideal %</span>
            <span style={{ flex: '0.6', textAlign: 'center' }}>Status</span>
            <span style={{ width: '70px' }} />
          </div>
        )}

        {/* ── Conteúdo principal ── */}
        {loading ? (
          <SkeletonTable rows={8} cols={5} />
        ) : ativos.length === 0 && !showFormInline ? (
          <EmptyState onAdd={handleAbrirFormulario} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

            {/* Formulário inline */}
            {showFormInline && (
              <FormularioInline
                inicial={ativoEmEdicao}
                segmentos={segmentos}
                ativos={ativosSegmentoDropdown}
                segmentoIdInicial={segmentoSelecionadoId}
                loadingAtivos={loadingAtivosSegmento}
                onSegmentoChange={setSegmentoSelecionadoId}
                onCancelar={() => { setShowFormInline(false); setAtivoEmEdicao(null); setSegmentoSelecionadoId(''); setAtivosSegmentoDropdown([]); }}
                onSalvar={handleSalvarFormulario}
                onExcluir={handleExcluirAtivo}
              />
            )}

            {/* Lista de ativos */}
            {ativos.map(row => (
              <LinhaAtivo
                key={row.idAtivo}
                row={row}
                expandido={expandido === row.idAtivo}
                onToggle={() => handleToggleExpand(row.idAtivo)}
                onEditar={handleEditarAtivo}
                isMobile={isMobile}
              />
            ))}
          </div>
        )}

        {/* Rodapé com soma % ideal */}
        {ativos.length > 0 && (
          <div style={{ marginTop: '12px', padding: '10px 16px', background: '#0f172a', borderRadius: '10px', border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#475569' }}>{ativos.length} ativos na carteira</span>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>
              Soma % Ideal:{' '}
              <span style={{ color: Math.abs(ativos.reduce((s, a) => s + (a.percIdeal ?? 0), 0) - 1) < 0.001 ? '#4ade80' : '#f87171' }}>
                {fmtPercSemSinal(ativos.reduce((s, a) => s + (a.percIdeal ?? 0), 0))} de 100,00%
              </span>
            </span>
          </div>
        )}

      </main>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
