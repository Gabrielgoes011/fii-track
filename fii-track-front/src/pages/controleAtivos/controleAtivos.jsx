import { useEffect, useState, useCallback } from 'react';
import { FiLayers, FiRefreshCw, FiEdit2, FiPlus, FiChevronDown, FiChevronUp, FiTrash2, FiCheck, FiX, FiBriefcase, FiSearch } from 'react-icons/fi';
import { AiOutlineInfoCircle } from 'react-icons/ai';
import SkeletonTable from '../../components/SkeletonTable/SkeletonTable';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useControleAtivos } from '../../hooks/controleAtivos/useControleAtivos';
import { useHistoricoCarteira } from '../../hooks/controleAtivos/useHistoricoCarteira';
import { controleAtivosService } from '../../services/controleAtivos/controleAtivosService';
import AreaChart from '../../components/Charts/AreaChart';
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
function KpiCard({ icon: Icon, label, valor, sub, cor, loading: ld, isMobile }) {
  return (
    <div style={{
      background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px',
      padding: isMobile ? '0.65rem 0.75rem' : '1rem 1.25rem',
      display: 'flex', flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '6px' : '14px',
      minWidth: 0, boxSizing: 'border-box', // mantém o KPI contido na coluna mobile
    }}>
      {Icon && (
        <div style={{
          width: isMobile ? '30px' : '38px', height: isMobile ? '30px' : '38px', borderRadius: '10px',
          background: `${cor}15`, border: `1px solid ${cor}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={isMobile ? 15 : 18} color={cor} />
        </div>
      )}
      <div style={{ minWidth: 0, width: isMobile ? '100%' : undefined, flex: isMobile ? undefined : 1 }}>
        <p style={{ margin: 0, fontSize: isMobile ? '10px' : '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
        <p className="vp" style={{
          margin: '2px 0 0',
          // no mobile, o valor ocupa a largura inteira do card e só quebra se necessário
          fontSize: isMobile ? 'clamp(0.75rem, 4vw, 1.05rem)' : '1.15rem',
          fontWeight: 700, color: cor ?? '#f8fafc',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.2, whiteSpace: isMobile ? 'normal' : 'nowrap',
          overflowWrap: isMobile ? 'anywhere' : undefined,
        }}>
          {ld ? '···' : valor}
        </p>
        {sub && <p className="vp" style={{ margin: '1px 0 0', fontSize: isMobile ? '10px' : '11px', color: sub.cor ?? '#64748b', overflowWrap: isMobile ? 'anywhere' : undefined }}>{ld ? '' : sub.txt}</p>}
      </div>
    </div>
  );
}

// ─── Aba: Movimento do Dia (variação do pregão × preço médio) ────────────────
// Apenas informativo: mostra maiores quedas e maiores altas do dia. NÃO indica
// se o ativo está barato/caro (não há fonte de valor justo) nem é recomendação.
// Reforça com a posição da cotação frente ao preço médio (abaixo/acima do PM).

// Card de um ativo na listagem de oportunidades/espera.
function OportunidadeItem({ a, tipo, vsPM, fmtVar, rotuloPM }) {
  const abaixoPM = (vsPM(a) ?? 0) < 0;
  const corVar = a.variacaoDia < 0 ? '#f87171' : a.variacaoDia > 0 ? '#4ade80' : '#94a3b8';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 12px', background: '#111c33', borderRadius: '10px', border: '1px solid #1e293b',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>{a.ticker}</p>
          {tipo === 'oportunidade' && abaixoPM && (
            <span title="Cotação abaixo do seu preço médio" style={{
              fontSize: '10px', fontWeight: 700, color: '#4ade80',
              background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)',
              borderRadius: '6px', padding: '1px 6px',
            }}>★ abaixo do PM</span>
          )}
        </div>
        <p className="vp" style={{ margin: '2px 0 0', fontSize: '11px', color: abaixoPM ? '#4ade80' : '#64748b' }}>
          {rotuloPM(a) ?? '—'}
        </p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: corVar }}>{fmtVar(a.variacaoDia)}</p>
        <p className="vp" style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a3b8' }}>
          {fmt(a.cotacao)} <span style={{ color: '#475569' }}>/ cota</span>
        </p>
        {/* Valor atual estimado da posição na última consulta (qtd × cotação) */}
        <p className="vp" style={{ margin: '2px 0 0', fontSize: '11px', fontWeight: 600, color: '#cbd5e1' }}>
          {fmt(a.valorAtual)}
          <span style={{ color: '#475569', fontWeight: 400 }}> · {a.quantidade} cotas</span>
        </p>
      </div>
    </div>
  );
}

// Card-coluna (Oportunidades ou Esperar). Empilha naturalmente no mobile.
// No mobile o card é colapsável (cabeçalho clicável); no desktop fica sempre aberto.
function OportunidadeGrupo({ titulo, subtitulo, cor, icone: Icone, itens, tipo, vazio, isMobile, ...itemProps }) {
  // Só colapsa no mobile; no desktop permanece aberto.
  const [abertoMobile, setAbertoMobile] = useState(false);
  const aberto = !isMobile || abertoMobile;

  const cabecalho = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
        background: `${cor}15`, border: `1px solid ${cor}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icone size={16} color={cor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
          {titulo} <span style={{ color: cor }}>({itens.length})</span>
        </p>
        <p style={{ margin: '1px 0 0', fontSize: '11px', color: '#64748b' }}>{subtitulo}</p>
      </div>
      {isMobile && (
        <FiChevronDown
          size={16} color="#64748b"
          style={{ flexShrink: 0, transition: 'transform 0.2s', transform: abertoMobile ? 'rotate(180deg)' : 'none' }}
        />
      )}
    </div>
  );

  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '1.1rem',
    }}>
      {isMobile ? (
        <button
          onClick={() => setAbertoMobile((v) => !v)}
          aria-expanded={abertoMobile}
          style={{ width: '100%', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
        >
          {cabecalho}
        </button>
      ) : cabecalho}

      {aberto && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
          {itens.length === 0
            ? <p style={{ margin: 0, fontSize: '12px', color: '#475569', padding: '8px 0' }}>{vazio}</p>
            : itens.map((a) => <OportunidadeItem key={a.idAtivo} a={a} tipo={tipo} {...itemProps} />)}
        </div>
      )}
    </div>
  );
}

function OportunidadesPanel({ ativos, isMobile, dataConsulta }) {
  // Só ativos com variação do dia conhecida e cotação real.
  const comVar = ativos.filter((a) => a.variacaoDia != null && a.temCotacao);

  const oportunidades = comVar
    .filter((a) => a.variacaoDia < 0)
    .sort((a, b) => a.variacaoDia - b.variacaoDia); // mais negativa primeiro
  const esperar = comVar
    .filter((a) => a.variacaoDia > 0)
    .sort((a, b) => b.variacaoDia - a.variacaoDia); // maior alta primeiro
  const neutros = comVar.filter((a) => a.variacaoDia === 0);

  const fmtVar = (v) => (v > 0 ? '+' : '') + (v * 100).toFixed(2).replace('.', ',') + '%';

  // Relação da cotação com o preço médio (fração): negativo = abaixo do PM.
  const vsPM = (a) => (a.precoMedio > 0 ? (a.cotacao - a.precoMedio) / a.precoMedio : null);
  const rotuloPM = (a) => {
    const r = vsPM(a);
    if (r == null) return null;
    return r < 0
      ? `${(Math.abs(r) * 100).toFixed(1).replace('.', ',')}% abaixo do PM`
      : `${(r * 100).toFixed(1).replace('.', ',')}% acima do PM`;
  };

  // Sem dados: cotações ainda não atualizadas.
  if (comVar.length === 0) {
    return (
      <HistoricoWrapper>
        <FiSearch size={22} color="#475569" />
        <p style={{ margin: 0, fontSize: '13px' }}>
          Atualize as cotações na aba <strong>Carteira de FIIs</strong> para ver o movimento do dia.
        </p>
      </HistoricoWrapper>
    );
  }

  return (
    <div>
      {dataConsulta && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
          <AiOutlineInfoCircle size={12} color="#475569" />
          <span style={{ fontSize: '11px', color: '#475569' }}>
            Valores estimados na última consulta de cotações · {dataConsulta}
          </span>
        </div>
      )}
      <div style={{
        display: 'flex', gap: '12px',
        flexDirection: isMobile ? 'column' : 'row',
      }}>
        <OportunidadeGrupo
          titulo="Maiores quedas do dia" subtitulo="Ativos que mais caíram no pregão de hoje"
          cor="#f87171" icone={FiRefreshCw}
          itens={oportunidades} tipo="oportunidade" vazio="Nenhum ativo em queda hoje."
          vsPM={vsPM} fmtVar={fmtVar} rotuloPM={rotuloPM} isMobile={isMobile}
        />
        <OportunidadeGrupo
          titulo="Maiores altas do dia" subtitulo="Ativos que mais subiram no pregão de hoje"
          cor="#4ade80" icone={FiCheck}
          itens={esperar} tipo="esperar" vazio="Nenhum ativo em alta hoje."
          vsPM={vsPM} fmtVar={fmtVar} rotuloPM={rotuloPM} isMobile={isMobile}
        />
      </div>
      <p style={{ margin: '12px 2px 0', fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>
        {neutros.length > 0 && `${neutros.length} ativo${neutros.length > 1 ? 's' : ''} sem variação no dia. `}
        ★ indica cotação abaixo do seu preço médio (PM). Este painel mostra apenas o movimento do pregão de hoje — não indica se o ativo está barato ou caro, nem é recomendação de investimento.
      </p>
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
function FormularioInline({ onCancelar, onSalvar, onExcluir, inicial, segmentos, ativos, segmentoIdInicial, loadingAtivos, onSegmentoChange, isMobile }) {
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
          <button onClick={() => onExcluir(inicial.idAtivo)} aria-label="Excluir ativo" title="Excluir ativo" style={{
            minWidth: isMobile ? '44px' : undefined, minHeight: isMobile ? '44px' : undefined,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '7px', padding: isMobile ? '8px' : '5px 8px', cursor: 'pointer', color: '#f87171',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FiTrash2 size={14} />
          </button>
        )}
      </div>

      {/* Campos do formulário */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '14px' }}>
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
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'flex-end', gap: '8px' }}>
        <button onClick={onCancelar} style={{
          minHeight: isMobile ? '44px' : undefined, width: isMobile ? '100%' : undefined,
          justifyContent: 'center',
          display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px',
          background: 'transparent', border: '1px solid #334155', borderRadius: '8px',
          color: '#94a3b8', fontWeight: 600, fontSize: '12px', cursor: 'pointer',
        }}>
          <FiX size={13} /> Cancelar
        </button>
        <button onClick={handleSalvar} style={{
          minHeight: isMobile ? '44px' : undefined, width: isMobile ? '100%' : undefined,
          justifyContent: 'center',
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

// ─── Editor de Preço Teto (dentro do painel expandido) ───────────────────────
function PrecoTetoEditor({ row, onSalvar, isMobile }) {
  const pvpDisponivel = /papel/i.test(row.segmento || '');
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(row.precoTeto != null ? String(row.precoTeto) : '');
  const [usaPvp, setUsaPvp] = useState(row.modoPrecoTeto === 'pvp');

  const abrir = (e) => {
    e.stopPropagation();
    setValor(row.precoTeto != null ? String(row.precoTeto) : '');
    setUsaPvp(row.modoPrecoTeto === 'pvp');
    setEditando(true);
  };

  const salvar = async (e) => {
    e.stopPropagation();
    await onSalvar(row.idAtivo, valor === '' ? null : parseFloat(valor), usaPvp ? 'pvp' : 'manual');
    setEditando(false);
  };

  const limpar = async (e) => {
    e.stopPropagation();
    await onSalvar(row.idAtivo, null, 'manual');
    setEditando(false);
  };

  const stop = (e) => e.stopPropagation();

  if (editando) {
    return (
      <div onClick={stop} style={{ background: '#0b1120', border: '1px solid rgba(251,146,60,0.35)', borderRadius: '10px', padding: '10px 12px' }}>
        <p style={{ margin: 0, fontSize: '10px', color: '#fb923c', textTransform: 'uppercase', fontWeight: 700 }}>
          {usaPvp ? 'VP da cota (R$)' : 'Preço Teto (R$)'}
        </p>
        <input
          type="number" min="0" step="0.01" value={valor} autoFocus
          onChange={(e) => setValor(e.target.value)} onClick={stop}
          style={{
            width: '100%', marginTop: '6px', padding: '6px 8px', background: '#0f172a',
            border: '1px solid #334155', borderRadius: '7px', color: '#f1f5f9', fontSize: '13px',
            outline: 'none', boxSizing: 'border-box',
          }}
          placeholder="0,00"
        />
        {pvpDisponivel && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '11px', color: '#94a3b8', cursor: 'pointer' }}>
            <input type="checkbox" checked={usaPvp} onChange={(e) => setUsaPvp(e.target.checked)} onClick={stop} />
            Usa P/VP (valor patrimonial da cota)
          </label>
        )}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '6px', marginTop: '8px' }}>
          <button onClick={salvar} style={{ flex: 1, minHeight: isMobile ? '44px' : undefined, width: isMobile ? '100%' : undefined, padding: '6px', background: 'linear-gradient(135deg,#f97316,#ea580c)', border: 'none', borderRadius: '7px', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Salvar</button>
          <button onClick={limpar} style={{ minHeight: isMobile ? '44px' : undefined, minWidth: isMobile ? '44px' : undefined, width: isMobile ? '100%' : undefined, padding: '6px 10px', background: 'transparent', border: '1px solid #334155', borderRadius: '7px', color: '#94a3b8', fontSize: '11px', cursor: 'pointer' }}>Limpar</button>
          <button onClick={(e) => { stop(e); setEditando(false); }} aria-label="Fechar editor de preço teto" style={{ minHeight: isMobile ? '44px' : undefined, minWidth: isMobile ? '44px' : undefined, width: isMobile ? '100%' : undefined, padding: '6px 10px', background: 'transparent', border: '1px solid #334155', borderRadius: '7px', color: '#94a3b8', fontSize: '11px', cursor: 'pointer' }}>X</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px 12px', position: 'relative' }}>
      <p style={{ margin: 0, fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Preço Teto & Desconto</p>
      <p className="vp" style={{ margin: '4px 0 0', fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
        {row.precoTeto ? fmt(row.precoTeto) : '—'}
        {row.modoPrecoTeto === 'pvp' && <span style={{ fontSize: '10px', color: '#fb923c', marginLeft: '5px' }}>P/VP</span>}
      </p>
      <p className="vp" style={{ margin: '2px 0 0', fontSize: '11px', color: corRent(row.desconto) }}>
        {row.desconto != null ? `Desc: ${fmtPerc(row.desconto)}` : '—'}
      </p>
      <button onClick={abrir} title="Definir preço teto" style={{
        position: 'absolute', top: isMobile ? '6px' : '8px', right: isMobile ? '6px' : '8px',
        width: isMobile ? '44px' : '22px', height: isMobile ? '44px' : '22px', padding: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.25)',
        borderRadius: '6px', color: '#fb923c', cursor: 'pointer',
      }}>
        <FiEdit2 size={isMobile ? 14 : 11} />
      </button>
    </div>
  );
}

// ─── Linha do Ativo (Card expansível) ─────────────────────────────────────────
function LinhaAtivo({ row, expandido, onToggle, onEditar, onSalvarPrecoTeto, isMobile }) {
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', flexShrink: 0 }}>{row.ticker}</span>
                <span style={{ fontSize: '11px', color: '#64748b', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.segmento}{row.objetivo ? ` · ${row.objetivo}` : ''}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <span style={{
                  background: cfg.bg, color: cfg.cor, border: `1px solid ${cfg.borda}`,
                  borderRadius: '9999px', padding: '2px 8px', fontSize: '10px', fontWeight: 600,
                  maxWidth: 'min(34vw, 120px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {cfg.txt}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onEditar(row); }}
                  style={{
                  width: '44px', height: '44px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
                    borderRadius: '8px', color: '#a78bfa', cursor: 'pointer',
                  }}
                  title="Editar metas"
                >
                  <FiEdit2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onToggle(); }}
                  aria-label={`${expandido ? 'Recolher' : 'Expandir'} detalhes de ${row.ticker}`}
                  aria-expanded={expandido}
                  style={{
                    width: '44px', height: '44px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer',
                  }}
                >
                  <FiChevronDown size={18} color="#64748b" style={{
                    transition: 'transform 0.2s', transform: expandido ? 'rotate(180deg)' : 'rotate(0deg)',
                  }} />
                </button>
              </div>
            </div>

            {/* Linha 2: Saldo + Rentabilidade (lado a lado) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '12px', marginBottom: '8px', minWidth: 0 }}>
              <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                <span style={{ fontSize: '9px', color: '#475569', textTransform: 'uppercase', fontWeight: 600 }}>Saldo</span>
                <p className="vp" style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>{fmt(row.valorAtual)}</p>
                <p className="vp" style={{ margin: 0, fontSize: '10px', color: '#64748b' }}>{row.quantidade} cotas</p>
              </div>
              <div style={{ minWidth: 0, flex: 1, overflow: 'hidden', textAlign: 'right' }}>
                <span style={{ fontSize: '9px', color: '#475569', textTransform: 'uppercase', fontWeight: 600 }}>Rent.</span>
                <p className="vp" style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: corRent(row.rentabilidadePerc) }}>
                  {isNeg ? '↓' : '↑'} {fmtPerc(row.rentabilidadePerc)}
                </p>
                <p className="vp" style={{ margin: 0, fontSize: '10px', color: corRent(row.rentabilidadeReais) }}>{fmtSinal(row.rentabilidadeReais)}</p>
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
                <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>{row.segmento}{row.objetivo ? ` · ${row.objetivo}` : ''}</span>
              </div>
            </div>

            {/* Bloco 2: Saldo Atual */}
            <div style={{ flex: '1', minWidth: 0 }}>
              <p className="vp" style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>{fmt(row.valorAtual)}</p>
              <p className="vp" style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{row.quantidade} cotas a {fmt(row.cotacao)}</p>
            </div>

            {/* Bloco 3: Rentabilidade */}
            <div style={{ flex: '0.8', minWidth: 0 }}>
              <p className="vp" style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: corRent(row.rentabilidadePerc) }}>
                {isNeg ? '↓' : '↑'} {fmtPerc(row.rentabilidadePerc)}
              </p>
              <p className="vp" style={{ margin: 0, fontSize: '11px', color: corRent(row.rentabilidadeReais) }}>{fmtSinal(row.rentabilidadeReais)}</p>
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
            display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '10px',
          }}>
            {/* Preço Médio vs Atual */}
            <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px 12px' }}>
              <p style={{ margin: 0, fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Preço Médio vs Atual</p>
              <p className="vp" style={{ margin: '4px 0 0', fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>{fmt(row.precoMedio)}</p>
              <p className="vp" style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>Atual: {fmt(row.cotacao)}</p>
            </div>
            {/* Preço Teto & Desconto (editável) */}
            <PrecoTetoEditor row={row} onSalvar={onSalvarPrecoTeto} isMobile={isMobile} />
            {/* Proventos Recebidos */}
            <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px 12px' }}>
              <p style={{ margin: 0, fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Proventos Recebidos</p>
              <p className="vp" style={{ margin: '4px 0 0', fontSize: '15px', fontWeight: 700, color: '#a78bfa' }}>{fmt(row.totalProventos)}</p>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>Total acumulado</p>
            </div>
            {/* Rent. + Proventos */}
            <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px 12px' }}>
              <p style={{ margin: 0, fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Rent. + Proventos</p>
              <p className="vp" style={{ margin: '4px 0 0', fontSize: '15px', fontWeight: 700, color: corRent(row.rentabilidadeTotalPerc) }}>{fmtPerc(row.rentabilidadeTotalPerc)}</p>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>Considerando dividendos</p>
            </div>
            {/* Valor para Equilíbrio */}
            <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px 12px' }}>
              <p style={{ margin: 0, fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Valor para Equilíbrio</p>
              <p className="vp" style={{ margin: '4px 0 0', fontSize: '15px', fontWeight: 700, color: corRent(row.valorEquilibrio) }}>{fmtSinal(row.valorEquilibrio)}</p>
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

// ─── Barra de Busca + Filtros ────────────────────────────────────────────────
function BarraFiltros({
  busca, setBusca, segmento, setSegmento, objetivo, setObjetivo, status, setStatus,
  segmentos, objetivos, total, exibidos,
}) {
  const temFiltro = busca || segmento || objetivo || status;
  const qtdFiltros = [busca, segmento, objetivo, status].filter(Boolean).length;

  // Colapsável: começa fechado; abre automaticamente se já houver algum filtro ativo.
  const [aberto, setAberto] = useState(false);
  useEffect(() => { if (temFiltro) setAberto(true); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selStyle = {
    padding: '0.5rem 0.75rem', background: '#1e293b', border: '1px solid #334155',
    borderRadius: '8px', color: '#f8fafc', fontSize: '13px', outline: 'none', cursor: 'pointer',
    flex: '1 1 150px', minWidth: 0,
  };

  return (
    <div style={{
      background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px',
      marginBottom: '10px', overflow: 'hidden',
    }}>
      {/* Cabeçalho clicável (colapso) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.6rem 0.75rem' }}>
        <button
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0,
            background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0,
          }}
        >
          <FiSearch size={14} color="#64748b" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>Buscar e filtrar</span>
          {qtdFiltros > 0 && (
            <span style={{
              fontSize: '10px', fontWeight: 700, color: '#10b981',
              background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: '999px', padding: '1px 7px',
            }}>{qtdFiltros}</span>
          )}
          <FiChevronDown
            size={16} color="#64748b"
            style={{ marginLeft: 'auto', transition: 'transform 0.2s', transform: aberto ? 'rotate(180deg)' : 'none' }}
          />
        </button>
        <span style={{ fontSize: '11px', color: '#475569', whiteSpace: 'nowrap' }}>{exibidos} de {total}</span>
      </div>

      {/* Corpo (busca em linha própria + filtros abaixo) */}
      {aberto && (
        <div style={{ padding: '0 0.75rem 0.75rem', borderTop: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Busca — largura total para o placeholder nunca cortar */}
          <div style={{ position: 'relative', marginTop: '10px' }}>
            <FiSearch size={14} color="#64748b" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por ticker, setor ou objetivo..."
              style={{
                width: '100%', padding: '0.5rem 0.75rem 0.5rem 30px', background: '#1e293b',
                border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc',
                fontSize: '13px', outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#10b981')}
              onBlur={(e) => (e.target.style.borderColor = '#334155')}
            />
          </div>

          {/* Filtros — quebram em linha conforme a largura */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={segmento} onChange={(e) => setSegmento(e.target.value)} style={selStyle}>
              <option value="">Todos os setores</option>
              {segmentos.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={objetivo} onChange={(e) => setObjetivo(e.target.value)} style={selStyle}>
              <option value="">Todos os objetivos</option>
              {objetivos.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={selStyle}>
              <option value="">Todos os status</option>
              <option value="aportar">Aportar</option>
              <option value="equilibrio">Equilíbrio</option>
              <option value="acima">Acima Ideal</option>
            </select>

            {temFiltro && (
              <button
                onClick={() => { setBusca(''); setSegmento(''); setObjetivo(''); setStatus(''); }}
                style={{
                  padding: '0.5rem 0.75rem', background: 'transparent', border: '1px solid #334155',
                  borderRadius: '8px', color: '#94a3b8', fontSize: '12px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0,
                }}
              >
                <FiX size={12} /> Limpar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Definição das abas ────────────────────────────────────────────────────────
const ABAS = [
  { id: 'carteira', label: 'Carteira de FIIs', labelMobile: 'Carteira' },
  { id: 'historico', label: 'Histórico da Carteira', labelMobile: 'Histórico' },
  { id: 'oportunidades', label: 'Movimento do Dia', labelMobile: 'Movimento' },
];

// ─── Navegação por abas (acessível: roles ARIA + navegação por teclado) ────────
function TabsNav({ abaAtiva, onSelecionar, isMobile }) {
  const handleKeyDown = (e) => {
    const idx = ABAS.findIndex((a) => a.id === abaAtiva);
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const prox = (idx + dir + ABAS.length) % ABAS.length;
      onSelecionar(ABAS[prox].id);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onSelecionar(ABAS[0].id);
    } else if (e.key === 'End') {
      e.preventDefault();
      onSelecionar(ABAS[ABAS.length - 1].id);
    }
  };

  return (
    <nav
      role="tablist"
      aria-label="Seções do Controle de Ativos"
      onKeyDown={handleKeyDown}
      className="tabs-nav-scroll"
      style={{
        display: 'flex', gap: '4px', marginBottom: '1.25rem',
        borderBottom: '1px solid #1e293b',
        // Permite rolar as abas na horizontal quando não cabem (ex.: mobile),
        // mantendo cada aba clicável sem quebrar linha.
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none', // Firefox: esconde a barra
      }}
    >
      {ABAS.map(({ id, label, labelMobile }) => {
        const ativa = abaAtiva === id;
        return (
          <button
            key={id}
            role="tab"
            id={`tab-${id}`}
            aria-selected={ativa}
            aria-controls={`painel-${id}`}
            tabIndex={ativa ? 0 : -1}
            onClick={() => onSelecionar(id)}
            style={{
              padding: '0.75rem 1.1rem',
              background: ativa ? 'rgba(139,92,246,0.1)' : 'transparent',
              color: ativa ? '#a78bfa' : '#64748b',
              border: 'none',
              borderBottom: ativa ? '3px solid #8b5cf6' : '3px solid transparent',
              fontWeight: 600, fontSize: '14px', cursor: 'pointer',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
              flexShrink: 0, // não encolhe: garante que o scroll horizontal funcione
            }}
          >
            {isMobile ? labelMobile : label}
          </button>
        );
      })}
    </nav>
  );
}

// ─── Agrupamento por dia (client-side, fuso America/Sao_Paulo) ────────────────
//
// Espelha a lógica do backend (historico.service.agruparPorDia): particiona os
// pontos pela data-calendário no fuso informado (via Intl.DateTimeFormat 'en-CA',
// que produz 'YYYY-MM-DD') e mantém, por dia, o ponto de maior `dtCaptura`.
// Retorna a lista ordenada cronologicamente (antigo → recente). Req 5.4.
function agruparPorDia(pontos, timeZone = 'America/Sao_Paulo') {
  if (!Array.isArray(pontos) || pontos.length === 0) return [];

  const fmtDia = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  });

  const porDia = new Map();
  for (const ponto of pontos) {
    const ts = new Date(ponto.dtCaptura).getTime();
    if (Number.isNaN(ts)) continue;
    const dia = fmtDia.format(ts);
    const atual = porDia.get(dia);
    // Mantém o ponto de maior dtCaptura dentro do dia.
    if (!atual || ts > new Date(atual.dtCaptura).getTime()) {
      porDia.set(dia, ponto);
    }
  }

  // Ordena por dia-calendário (chave 'YYYY-MM-DD' ordena lexicograficamente).
  return [...porDia.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([, ponto]) => ponto);
}

// Rótulo curto do eixo (dia/mês) no fuso America/Sao_Paulo.
const fmtDiaMes = (dtCaptura) => {
  const ts = new Date(dtCaptura).getTime();
  if (Number.isNaN(ts)) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit',
  }).format(ts);
};

// ─── Indicador visual de direção (alta / baixa / neutra) por ponto ─────────────
// Direção vem do backend em cada ponto: 'subiu' | 'desceu' | 'estável' | null.
const DIRECAO_INFO = {
  subiu:    { seta: '▲', cor: '#4ade80', label: 'Alta' },
  desceu:   { seta: '▼', cor: '#f87171', label: 'Baixa' },
  'estável': { seta: '▬', cor: '#94a3b8', label: 'Neutra' },
};

function IndicadorDirecao({ direcao, size = 12 }) {
  // Primeiro ponto (sem anterior comparável) não tem direção — Req 4.7.
  const info = DIRECAO_INFO[direcao];
  if (!info) {
    return <span style={{ color: '#475569', fontSize: `${size}px` }} aria-label="Sem variação">—</span>;
  }
  return (
    <span
      title={info.label}
      aria-label={info.label}
      style={{ color: info.cor, fontSize: `${size}px`, fontWeight: 700 }}
    >
      {info.seta}
    </span>
  );
}

// ─── Legenda de direção por ponto (lista cronológica) ─────────────────────────
// Exibe cada ponto da série com seu indicador de direção (alta/baixa/neutra),
// atendendo ao Req 5.6 de forma acessível e legível.
function LegendaDirecao({ pontos, extrairValor, rotulo }) {
  const isMobile = useIsMobile();
  if (!pontos || pontos.length === 0) return null;

  // 1) Agrupa dias consecutivos com o MESMO valor num único item (evita cards
  //    repetidos, ex.: 05/09, 06/09 e 07/09 todos em R$ 23.564,08).
  const grupos = [];
  for (const p of pontos) {
    const valor = extrairValor(p);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.valor === valor) {
      ultimo.fim = p; // estende o intervalo do grupo atual
    } else {
      grupos.push({ valor, inicio: p, fim: p, direcao: p.direcao });
    }
  }

  // 2) Limita a quantidade de cards: 3 no mobile, 7 no desktop, mantendo os
  //    grupos mais recentes (a série vem em ordem cronológica).
  const limite = isMobile ? 3 : 7;
  const visiveis = grupos.slice(-limite);
  const ocultos = grupos.length - visiveis.length;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px', alignItems: 'center' }}>
      {ocultos > 0 && (
        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
          +{ocultos} anterior{ocultos > 1 ? 'es' : ''}
        </span>
      )}
      {visiveis.map((g, i) => {
        const info = DIRECAO_INFO[g.direcao];
        const cor = info ? info.cor : '#64748b';
        const bg = info ? `${info.cor}12` : 'rgba(100,116,139,0.08)';
        const borda = info ? `${info.cor}30` : '#334155';
        const mesmoDia = g.inicio === g.fim;
        const rotuloData = mesmoDia
          ? fmtDiaMes(g.inicio.dtCaptura)
          : `${fmtDiaMes(g.inicio.dtCaptura)}–${fmtDiaMes(g.fim.dtCaptura)}`;
        return (
          <div
            key={`${rotulo}-${i}`}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: bg, border: `1px solid ${borda}`, borderRadius: '8px',
              padding: '4px 8px',
            }}
          >
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
              {rotuloData}
            </span>
            <IndicadorDirecao direcao={g.direcao} size={11} />
            <span className="vp" style={{ fontSize: '11px', fontWeight: 700, color: cor }}>
              {fmt(g.valor)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Card wrapper de gráfico do histórico (opcionalmente colapsável) ──────────
function CardGrafico({ titulo, subtitulo, direita, children, colapsavel = false, aberto = true, onToggle }) {
  // Cabeçalho: quando colapsável, o título vira botão com chevron.
  const cabecalhoTexto = (
    <div style={{ minWidth: 0 }}>
      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {titulo}
        {colapsavel && (
          <FiChevronDown
            size={16} color="#64748b"
            style={{ transition: 'transform 0.2s', transform: aberto ? 'rotate(180deg)' : 'none' }}
          />
        )}
      </h3>
      {subtitulo && <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>{subtitulo}</p>}
    </div>
  );

  return (
    <div style={{
      background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px',
      padding: '1.25rem', marginBottom: '1rem',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '12px', flexWrap: 'wrap', marginBottom: aberto ? '8px' : 0,
      }}>
        {colapsavel ? (
          <button
            onClick={onToggle}
            aria-expanded={aberto}
            style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', flex: 1, minWidth: 0 }}
          >
            {cabecalhoTexto}
          </button>
        ) : cabecalhoTexto}
        {/* Controles à direita (ex.: seletor) só fazem sentido com o card aberto */}
        {(!colapsavel || aberto) && direita}
      </div>
      {(!colapsavel || aberto) && children}
    </div>
  );
}

// ─── Estados internos de conteúdo (vazio / erro) do Histórico ─────────────────
// Reutilizados pelos gráficos e pelo painel para atender Req 5.7 e 5.8.

// Mensagem de ausência de dados históricos (Req 5.7) — sem gráfico vazio nem erro.
function HistoricoVazio({ mensagem = 'Sem dados históricos' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', gap: '10px', padding: '2.5rem 1rem', color: '#64748b',
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px',
        background: 'rgba(100,116,139,0.1)', border: '1px solid #334155',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <FiLayers size={20} color="#64748b" />
      </div>
      <p style={{ margin: 0, fontSize: '13px', maxWidth: '320px', lineHeight: 1.5 }}>{mensagem}</p>
    </div>
  );
}

// Estado de erro com botão "Tentar novamente" (Req 5.8).
function HistoricoErro({ mensagem = 'Não foi possível carregar o histórico.', onRetry }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', gap: '12px', padding: '2.5rem 1rem',
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px',
        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <FiX size={22} color="#f87171" />
      </div>
      <p style={{ margin: 0, fontSize: '13px', color: '#f87171', maxWidth: '320px', lineHeight: 1.5 }}>{mensagem}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px', color: '#fca5a5', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
          }}
        >
          <FiRefreshCw size={13} /> Tentar novamente
        </button>
      )}
    </div>
  );
}

// ─── Gráfico: evolução do patrimônio total ────────────────────────────────────
// Reutiliza AreaChart plotando `valorMercadoTotal` ao longo de `dtCaptura`,
// já agrupado por dia (America/Sao_Paulo) e em ordem cronológica.
function HistoricoPatrimonioChart({ patrimonio }) {
  // Card colapsável — começa aberto (gráfico principal da aba).
  const [aberto, setAberto] = useState(true);

  const pontos = agruparPorDia(patrimonio, 'America/Sao_Paulo');
  const extrairValor = (p) => Number(p.valorMercadoTotal) || 0;

  const dados = pontos.map((p) => ({
    name: fmtDiaMes(p.dtCaptura),
    Patrimônio: extrairValor(p),
  }));

  return (
    <CardGrafico
      titulo="Evolução do Patrimônio"
      subtitulo="Valor de mercado total da carteira (agrupado por dia)"
      colapsavel
      aberto={aberto}
      onToggle={() => setAberto((v) => !v)}
    >
      {/* Req 6.1/6.3: o gráfico exibe patrimônio, então borra sob o modo privacidade. */}
      <div className="vp">
        <AreaChart data={dados} keys={['Patrimônio']} colors={{ Patrimônio: '#8b5cf6' }} height={180} autoScale />
      </div>
      <LegendaDirecao pontos={pontos} extrairValor={extrairValor} rotulo="patr" />
    </CardGrafico>
  );
}

// ─── Gráfico: evolução de preço por ativo (com seletor de ticker) ─────────────
function HistoricoTickerChart({
  ativos, tickerSerie, tickerAtual, onSelecionarTicker,
  loadingTicker, erroTicker, onRetryTicker,
}) {
  // Card colapsável — começa fechado para deixar a aba mais limpa.
  const [aberto, setAberto] = useState(false);

  // Lista de tickers disponíveis a partir da carteira do usuário.
  const tickers = [...new Set((ativos || []).map((a) => a.ticker).filter(Boolean))].sort();

  const pontos = agruparPorDia(tickerSerie, 'America/Sao_Paulo');
  const extrairValor = (p) => Number(p.preco) || 0;

  const dados = pontos.map((p) => ({
    name: fmtDiaMes(p.dtCaptura),
    Preço: extrairValor(p),
  }));

  const seletor = (
    <select
      value={tickerAtual || ''}
      onChange={(e) => onSelecionarTicker(e.target.value)}
      aria-label="Selecionar ativo"
      style={{
        padding: '0.5rem 0.75rem', background: '#1e293b', border: '1px solid #334155',
        borderRadius: '8px', color: '#f8fafc', fontSize: '13px', outline: 'none', cursor: 'pointer',
        minWidth: '140px',
      }}
    >
      <option value="">Selecione um ativo...</option>
      {tickers.map((t) => <option key={t} value={t}>{t}</option>)}
    </select>
  );

  // Conteúdo do card conforme o estado da série do ticker.
  let conteudo;
  if (!tickerAtual) {
    conteudo = (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2.5rem 1rem', color: '#64748b', fontSize: '13px',
      }}>
        Selecione um ativo acima para visualizar a evolução do preço.
      </div>
    );
  } else if (loadingTicker) {
    conteudo = (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '10px', padding: '2.5rem 1rem', color: '#64748b', fontSize: '13px',
      }}>
        <FiRefreshCw size={20} color="#475569" style={{ animation: 'spin 1s linear infinite' }} />
        Carregando histórico de {tickerAtual}...
      </div>
    );
  } else if (erroTicker) {
    // Req 5.8 — erro na série do ticker com opção de tentar novamente.
    conteudo = (
      <HistoricoErro
        mensagem={`Não foi possível carregar o histórico de ${tickerAtual}.`}
        onRetry={onRetryTicker}
      />
    );
  } else if (pontos.length === 0) {
    // Req 5.7 — ticker selecionado, porém sem registros no período.
    conteudo = <HistoricoVazio mensagem={`Sem dados históricos para ${tickerAtual}.`} />;
  } else {
    conteudo = (
      <>
        {/* Req 6.1/6.3: preço é valor financeiro → borra sob o modo privacidade. */}
        <div className="vp">
          <AreaChart data={dados} keys={['Preço']} colors={{ Preço: '#38bdf8' }} height={180} autoScale />
        </div>
        <LegendaDirecao pontos={pontos} extrairValor={extrairValor} rotulo="tk" />
      </>
    );
  }

  return (
    <CardGrafico
      titulo="Evolução de Preço por Ativo"
      subtitulo={tickerAtual ? `Histórico de preço de ${tickerAtual} (agrupado por dia)` : 'Escolha um ativo para ver o histórico de preço'}
      direita={seletor}
      colapsavel
      aberto={aberto}
      onToggle={() => setAberto((v) => !v)}
    >
      {conteudo}
    </CardGrafico>
  );
}

// ─── Painel da aba Histórico da Carteira ──────────────────────────────────────
// Orquestra os estados de carregamento / erro / vazio (Req 5.7, 5.8), a
// privacidade dos valores financeiros (Req 6.x) e os gráficos com agrupamento
// por dia. O hook `useHistoricoCarteira` expõe loading/erro/vazio + retry.
// Wrapper de card para os estados de tela cheia (loading/erro/vazio globais).
function HistoricoWrapper({ children }) {
  return (
    <div style={{
      background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px',
      padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', textAlign: 'center', gap: '10px', color: '#64748b',
    }}>
      {children}
    </div>
  );
}

function HistoricoCarteiraPanel({ historico, ativos }) {
  const {
    patrimonio, loading, erro, vazio, retry,
    tickerSerie, tickerAtual, loadingTicker, erroTicker,
    onSelecionarTicker, retryTicker,
  } = historico;

  // Carregando a série de patrimônio.
  if (loading) {
    return (
      <HistoricoWrapper>
        <FiRefreshCw size={22} color="#475569" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ margin: 0, fontSize: '13px' }}>Carregando histórico da carteira...</p>
      </HistoricoWrapper>
    );
  }

  // Req 5.8 — falha ao carregar o histórico: mensagem + "Tentar novamente".
  if (erro) {
    return (
      <HistoricoWrapper>
        <HistoricoErro
          mensagem="Não foi possível carregar o histórico da carteira."
          onRetry={retry}
        />
      </HistoricoWrapper>
    );
  }

  // Req 5.7 — sem nenhum registro histórico: mensagem, sem gráfico vazio nem erro.
  if (vazio) {
    return (
      <HistoricoWrapper>
        <HistoricoVazio mensagem="Sem dados históricos. Atualize as cotações na aba Carteira de FIIs para começar a registrar o histórico." />
      </HistoricoWrapper>
    );
  }

  return (
    <div>
      <HistoricoPatrimonioChart patrimonio={patrimonio} />
      <HistoricoTickerChart
        ativos={ativos}
        tickerSerie={tickerSerie}
        tickerAtual={tickerAtual}
        loadingTicker={loadingTicker}
        erroTicker={erroTicker}
        onSelecionarTicker={onSelecionarTicker}
        onRetryTicker={retryTicker}
      />
    </div>
  );
}

function StatusCotacoes({ resumo, isMobile, onAtualizar, loadingCotacoes, loading }) {
  const tickersDesatualizados = resumo?.tickersDesatualizados || [];
  const qtdCotacoesDesatualizadas = resumo?.qtdCotacoesDesatualizadas ?? tickersDesatualizados.length;
  const cotacoesDesatualizadas = Boolean(resumo?.cotacoesDesatualizadas);
  const [mostrarTickers, setMostrarTickers] = useState(false);
  const corStatus = cotacoesDesatualizadas ? '#fbbf24' : '#475569';
  const quantidadeLabel = `${qtdCotacoesDesatualizadas} ativo${qtdCotacoesDesatualizadas === 1 ? '' : 's'} sem preço novo`;
  const textoData = resumo?.dataAtualizacaoCotacoes
    ? `Cotações de ${resumo.dataAtualizacaoCotacoes}`
    : 'Cotações ainda não carregadas';
  const textoDataDesktop = resumo?.dataAtualizacaoCotacoes
    ? textoData
    : `${textoData} · clique em Atualizar`;

  const botaoAtualizar = (
    <button onClick={onAtualizar} disabled={loadingCotacoes || loading} style={{
      display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0,
      padding: '6px 12px', background: 'rgba(139,92,246,0.1)',
      border: '1px solid rgba(139,92,246,0.25)', borderRadius: '8px',
      color: '#a78bfa', fontSize: '11px', fontWeight: 600,
      cursor: loadingCotacoes || loading ? 'not-allowed' : 'pointer',
      opacity: loadingCotacoes || loading ? 0.6 : 1,
    }}>
      <FiRefreshCw size={12} style={{ animation: loadingCotacoes ? 'spin 1s linear infinite' : 'none' }} />
      {loadingCotacoes ? 'Atualizando...' : isMobile ? 'Atualizar' : 'Atualizar Cotações'}
    </button>
  );

  if (isMobile) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem',
        padding: '9px 10px', background: 'rgba(15,23,42,0.7)',
        border: '1px solid #1e293b', borderRadius: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <AiOutlineInfoCircle size={12} color={corStatus} />
              <span style={{ fontSize: '11px', color: corStatus, whiteSpace: 'nowrap' }}>{textoData}</span>
            </div>
            <div style={{ marginTop: '3px', paddingLeft: '17px', fontSize: '11px', color: corStatus }}>
              {quantidadeLabel}
            </div>
          </div>
          {botaoAtualizar}
        </div>
        {tickersDesatualizados.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setMostrarTickers((v) => !v)}
              aria-expanded={mostrarTickers}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px', padding: 0,
                background: 'transparent', border: 'none', color: '#94a3b8',
                fontSize: '11px', cursor: 'pointer',
              }}
            >
              {mostrarTickers ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
              {mostrarTickers ? 'Ocultar tickers' : 'Ver tickers sem preço novo'}
            </button>
            {mostrarTickers && (
              <p style={{ margin: '5px 0 0 17px', fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
                {tickersDesatualizados.join(', ')}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <AiOutlineInfoCircle size={12} color={corStatus} />
        <span style={{ fontSize: '11px', color: corStatus }}>
          {textoDataDesktop}{cotacoesDesatualizadas
            ? ` · ${qtdCotacoesDesatualizadas ?? ''} sem preço novo (${tickersDesatualizados.join(', ')}) · clique em Atualizar`
            : ''}
        </span>
      </div>
      {botaoAtualizar}
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function PaginaControleAtivos() {
  const isMobile = useIsMobile();
  const {
    resumo, ativos, loading, loadingCotacoes,
    getCarteira, atualizarCotacoes,
    handleSalvarPrecoTeto, handleSalvarPercIdeal, handleExcluirAtivo,
  } = useControleAtivos();

  // Aba ativa: inicia em "Carteira de FIIs" (Req 5.2)
  const [abaAtiva, setAbaAtiva] = useState('carteira');
  const [kpisAbertos, setKpisAbertos] = useState(true);

  // Dados da aba "Histórico da Carteira" (Req 5.3, 5.4, 5.6)
  const {
    patrimonio, loading: loadingHistorico, erro: erroHistorico, vazio: vazioHistorico,
    carregou: carregouHistorico, carregarPatrimonio, retry: retryHistorico,
    tickerSerie, tickerAtual, loadingTicker, erroTicker, carregarTicker,
  } = useHistoricoCarteira();

  // Carrega a série de patrimônio quando a aba Histórico se torna ativa (uma vez).
  useEffect(() => {
    if (abaAtiva === 'historico' && !carregouHistorico && !loadingHistorico) {
      carregarPatrimonio();
    }
  }, [abaAtiva, carregouHistorico, loadingHistorico, carregarPatrimonio]);

  // Atualiza cotações e, em caso de sucesso, recarrega as séries do Histórico
  // da Carteira (o backend grava um novo snapshot a cada atualização).
  const handleAtualizarCotacoes = useCallback(async () => {
    const ok = await atualizarCotacoes();
    if (!ok) return;
    // Recarrega o patrimônio e, se houver um ticker selecionado, sua série também.
    carregarPatrimonio();
    if (tickerAtual) carregarTicker(tickerAtual);
  }, [atualizarCotacoes, carregarPatrimonio, tickerAtual, carregarTicker]);

  // Objeto de estado do histórico repassado ao painel.
  const historico = {
    patrimonio,
    loading: loadingHistorico,
    erro: erroHistorico,
    vazio: vazioHistorico,
    retry: retryHistorico,
    tickerSerie,
    tickerAtual,
    loadingTicker,
    erroTicker,
    onSelecionarTicker: (ticker) => carregarTicker(ticker),
    // Req 5.8 — refaz a carga da série do ticker atualmente selecionado.
    retryTicker: () => { if (tickerAtual) carregarTicker(tickerAtual); },
  };

  const [expandido, setExpandido] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtroSegmento, setFiltroSegmento] = useState('');
  const [filtroObjetivo, setFiltroObjetivo] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
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

  // Opções e lista filtrada da carteira (busca + filtros do topo)
  const opcoesSegmento = [...new Set(ativos.map(a => a.segmento).filter(Boolean))].sort();
  const opcoesObjetivo = [...new Set(ativos.map(a => a.objetivo).filter(Boolean))].sort();
  const ativosFiltrados = ativos.filter((a) => {
    if (filtroSegmento && a.segmento !== filtroSegmento) return false;
    if (filtroObjetivo && a.objetivo !== filtroObjetivo) return false;
    if (filtroStatus && a.acaoEquilibrio !== filtroStatus) return false;
    if (busca.trim()) {
      const termo = busca.trim().toLowerCase();
      const alvo = `${a.ticker} ${a.segmento} ${a.objetivo}`.toLowerCase();
      if (!alvo.includes(termo)) return false;
    }
    return true;
  });

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

  const handleSalvarFormulario = async (dados) => {
    if (ativoEmEdicao) {
      // Edição: só atualiza % ideal
      if (dados.percIdeal != null) {
        await handleSalvarPercIdeal(ativoEmEdicao.idAtivo, (dados.percIdeal * 100).toFixed(2));
      }
    } else {
      // Adição: resolve o idAtivo pelo ticker e chama a API
      const ativoSelecionado = ativosSegmentoDropdown.find((a) => a.ticker === dados.ticker);
      if (!ativoSelecionado) {
        toastWarn('Ativo não encontrado. Selecione novamente.');
        return;
      }
      try {
        await controleAtivosService.adicionar({
          idSegmento: Number(dados.segmentoId),
          idAtivo: ativoSelecionado.idAtivo,
          percIdeal: dados.percIdeal,
          objetivo: dados.objetivo,
        });
        getCarteira();
      } catch (error) {
        handleError(error);
        return;
      }
    }
    setShowFormInline(false);
    setAtivoEmEdicao(null);
    setSegmentoSelecionadoId('');
    setAtivosSegmentoDropdown([]);
  };

  const handleExcluir = async (idAtivo) => {
    const ok = window.confirm('Remover este ativo da carteira? As operações e proventos não são apagados.');
    if (!ok) return;
    const removido = await handleExcluirAtivo(idAtivo);
    if (removido) {
      setShowFormInline(false);
      setAtivoEmEdicao(null);
      setSegmentoSelecionadoId('');
      setAtivosSegmentoDropdown([]);
    }
  };

  const corRentResumo = resumo ? corRent(resumo.rentabilidadeReais) : '#94a3b8';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b1120', color: '#f1f5f9', fontFamily: 'sans-serif' }}>
      <main style={{ maxWidth: '100%', margin: '0 auto', padding: isMobile ? '0.5rem 0.75rem' : '1rem 0.5rem', overflowX: 'hidden' }}>

        {/* ── Header ── */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '1.25rem', gap: isMobile ? '8px' : '1rem',
          flexWrap: isMobile ? 'nowrap' : 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px', minWidth: 0 }}>
            <div style={{
              width: isMobile ? '32px' : '40px', height: isMobile ? '32px' : '40px',
              borderRadius: '10px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: '0 0 20px rgba(139,92,246,0.3)',
            }}>
              <FiLayers size={isMobile ? 16 : 20} color="#fff" />
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 style={{
                fontSize: isMobile ? '1rem' : '1.5rem', fontWeight: 800,
                color: '#f8fafc', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>Carteira de FIIs</h1>
              <p style={{ display: isMobile ? 'none' : 'block', fontSize: '12px', color: '#64748b', margin: 0 }}>
                Gestão de ativos e rebalanceamento inteligente
              </p>
            </div>
          </div>
          <button onClick={handleAbrirFormulario} style={{
            display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
            padding: isMobile ? '0.5rem 0.7rem' : '0.55rem 1rem',
            background: 'linear-gradient(135deg, #1e40af, #1d4ed8)',
            color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600,
            fontSize: isMobile ? '12px' : '13px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(30,64,175,0.3)',
          }}>
            <FiPlus size={14} /> {isMobile ? 'Novo Ativo' : 'Adicionar Ativo'}
          </button>
        </header>

        {/* ── Abas ── */}
        <TabsNav abaAtiva={abaAtiva} onSelecionar={setAbaAtiva} isMobile={isMobile} />

        {/* ── Aba: Carteira de FIIs (conteúdo original, inalterado) ── */}
        <div
          role="tabpanel"
          id="painel-carteira"
          aria-labelledby="tab-carteira"
          hidden={abaAtiva !== 'carteira'}
        >
        {/* ── KPI Cards ── */}
        <div style={{
          display: isMobile ? 'flex' : 'none', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: kpisAbertos ? '8px' : '1.25rem',
        }}>
          <h2 style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Indicadores da carteira
          </h2>
          <button
            type="button"
            onClick={() => setKpisAbertos((v) => !v)}
            aria-expanded={kpisAbertos}
            aria-controls="controle-ativos-kpis"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', padding: 0,
              background: 'transparent', border: '1px solid #334155', borderRadius: '7px',
              color: '#94a3b8', cursor: 'pointer',
            }}
          >
            {kpisAbertos ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
          </button>
        </div>
        <div
          id="controle-ativos-kpis"
          style={{
            display: isMobile && !kpisAbertos ? 'none' : 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px', marginBottom: '1.25rem',
            width: '100%', minWidth: 0, // trava a grade na largura do container (evita vazar no mobile)
          }}
        >
          <KpiCard icon={FiBriefcase} label="Custo Total Investido" valor={fmt(resumo?.custoTotal)} cor="#60a5fa" loading={loading} isMobile={isMobile} />
          <KpiCard icon={FiLayers} label="Saldo Atual" valor={fmt(resumo?.valorAtualTotal)} cor="#10b981" loading={loading} isMobile={isMobile} />
          <KpiCard
            icon={FiRefreshCw} label="Rentabilidade Global"
            valor={fmtSinal(resumo?.rentabilidadeReais)}
            sub={{ txt: fmtPerc(resumo?.rentabilidadePerc), cor: corRentResumo }}
            cor={corRentResumo} loading={loading} isMobile={isMobile}
          />
          <KpiCard
            icon={FiCheck} label="Proventos Recebidos"
            valor={fmt(resumo?.totalProventos)}
            cor="#a78bfa" loading={loading} isMobile={isMobile}
          />
          <KpiCard
            icon={FiRefreshCw} label="Rent. + Proventos"
            valor={fmtSinal(resumo?.rentabilidadeComProventosReais)}
            sub={{ txt: fmtPerc(resumo?.rentabilidadeComProventosPerc), cor: corRent(resumo?.rentabilidadeComProventosReais) }}
            cor={corRent(resumo?.rentabilidadeComProventosReais)} loading={loading} isMobile={isMobile}
          />
        </div>

        {/* ── Aviso cotações ── */}
        <StatusCotacoes
          resumo={resumo}
          isMobile={isMobile}
          onAtualizar={handleAtualizarCotacoes}
          loadingCotacoes={loadingCotacoes}
          loading={loading}
        />

        {/* ── Busca + Filtros ── */}
        {!loading && ativos.length > 0 && (
          <BarraFiltros
            busca={busca} setBusca={setBusca}
            segmento={filtroSegmento} setSegmento={setFiltroSegmento}
            objetivo={filtroObjetivo} setObjetivo={setFiltroObjetivo}
            status={filtroStatus} setStatus={setFiltroStatus}
            segmentos={opcoesSegmento} objetivos={opcoesObjetivo}
            total={ativos.length} exibidos={ativosFiltrados.length}
          />
        )}

        {/* ── Cabeçalho da tabela (desktop only) ── */}
        {!isMobile && ativosFiltrados.length > 0 && (
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
                isMobile={isMobile}
                onSegmentoChange={setSegmentoSelecionadoId}
                onCancelar={() => { setShowFormInline(false); setAtivoEmEdicao(null); setSegmentoSelecionadoId(''); setAtivosSegmentoDropdown([]); }}
                onSalvar={handleSalvarFormulario}
                onExcluir={handleExcluir}
              />
            )}

            {/* Lista de ativos (filtrada) */}
            {ativosFiltrados.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                Nenhum ativo encontrado com os filtros atuais.
              </div>
            ) : ativosFiltrados.map(row => (
              <LinhaAtivo
                key={row.idAtivo}
                row={row}
                expandido={expandido === row.idAtivo}
                onToggle={() => handleToggleExpand(row.idAtivo)}
                onEditar={handleEditarAtivo}
                onSalvarPrecoTeto={handleSalvarPrecoTeto}
                isMobile={isMobile}
              />
            ))}
          </div>
        )}

        {/* Rodapé com soma % ideal */}
        {ativos.length > 0 && (
          <div style={{ marginTop: '12px', padding: '10px 16px', background: '#0f172a', borderRadius: '10px', border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#475569' }}>
              {ativosFiltrados.length === ativos.length
                ? `${ativos.length} ativos na carteira`
                : `${ativosFiltrados.length} de ${ativos.length} ativos`}
            </span>
            {resumo?.totalParaAportar > 0 && (
              <span className="vp" style={{ fontSize: '12px', fontWeight: 600, color: '#60a5fa' }}>
                Total a Aportar p/ equilíbrio: {fmt(resumo.totalParaAportar)}
              </span>
            )}
            <span style={{ fontSize: '12px', fontWeight: 600 }}>
              Soma % Ideal:{' '}
              <span style={{ color: Math.abs(ativos.reduce((s, a) => s + (a.percIdeal ?? 0), 0) - 1) < 0.001 ? '#4ade80' : '#f87171' }}>
                {fmtPercSemSinal(ativos.reduce((s, a) => s + (a.percIdeal ?? 0), 0))} de 100,00%
              </span>
            </span>
          </div>
        )}
        </div>

        {/* ── Aba: Histórico da Carteira (nova — conteúdo em task 9.3) ── */}
        <div
          role="tabpanel"
          id="painel-historico"
          aria-labelledby="tab-historico"
          hidden={abaAtiva !== 'historico'}
        >
          <HistoricoCarteiraPanel historico={historico} ativos={ativos} />
        </div>

        {/* ── Aba: Oportunidades (variação do dia × preço médio) ── */}
        <div
          role="tabpanel"
          id="painel-oportunidades"
          aria-labelledby="tab-oportunidades"
          hidden={abaAtiva !== 'oportunidades'}
        >
          <OportunidadesPanel ativos={ativos} isMobile={isMobile} dataConsulta={resumo?.dataAtualizacaoCotacoes} />
        </div>

      </main>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .tabs-nav-scroll::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}
