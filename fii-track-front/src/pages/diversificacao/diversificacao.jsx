import { useEffect, useState, useCallback } from 'react';
import { FiPieChart, FiAlertTriangle, FiCheckCircle, FiLayers } from 'react-icons/fi';
import { AiOutlineInfoCircle } from 'react-icons/ai';
import { useIsMobile } from '../../hooks/useIsMobile';
import { diversificacaoService } from '../../services/diversificacao/diversificacaoService';
import { handleError } from '../../utils/responseUtils';
import SkeletonTable from '../../components/SkeletonTable/SkeletonTable';

// ─── Formatadores ─────────────────────────────────────────────────────────────
const fmtPerc = (v, casas = 1) => {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return (v * 100).toFixed(casas).replace('.', ',') + '%';
};
// Desvio em pontos percentuais (com sinal)
const fmtPP = (v, casas = 1) => {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  const val = v * 100;
  return (val > 0 ? '+' : '') + val.toFixed(casas).replace('.', ',') + ' p.p.';
};

// Paleta estável por segmento (cores fixas por índice de ordenação).
const CORES = ['#60a5fa', '#a78bfa', '#4ade80', '#fbbf24', '#f87171', '#22d3ee', '#f472b6', '#94a3b8'];

// Cor do selo conforme o nível de desvio classificado pelo backend.
const COR_NIVEL = { ok: '#4ade80', leve: '#fbbf24', alto: '#f87171' };
const corDoNivel = (nivel) => COR_NIVEL[nivel] || '#94a3b8';

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, valor, sub, cor, isMobile }) {
  return (
    <div style={{
      background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px',
      padding: isMobile ? '0.75rem 0.85rem' : '1rem 1.25rem',
      display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '14px', minWidth: 0,
    }}>
      {Icon && (
        <div style={{
          width: isMobile ? '32px' : '38px', height: isMobile ? '32px' : '38px', borderRadius: '10px',
          background: `${cor}15`, border: `1px solid ${cor}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={isMobile ? 16 : 18} color={cor} />
        </div>
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ margin: 0, fontSize: isMobile ? '10px' : '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
        <p style={{ margin: '2px 0 0', fontSize: isMobile ? 'clamp(0.95rem, 4.5vw, 1.15rem)' : '1.15rem', fontWeight: 700, color: cor ?? '#f8fafc', lineHeight: 1.2 }}>
          {valor}
        </p>
        {sub && <p style={{ margin: '1px 0 0', fontSize: isMobile ? '10px' : '11px', color: sub.cor ?? '#64748b' }}>{sub.txt}</p>}
      </div>
    </div>
  );
}

// ─── Linha de um segmento ─────────────────────────────────────────────────────
// Mostra a barra de exposição atual, um marcador da meta e o desvio classificado.
function SegmentoRow({ s, cor, isMobile }) {
  const corNivel = corDoNivel(s.classificacao?.nivel);
  // Escala das barras: teto visual em 100%.
  const atualPct = Math.min((s.atualFrac || 0) * 100, 100);
  const metaPct = Math.min((s.metaFrac || 0) * 100, 100);

  return (
    <div style={{
      background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px',
      padding: isMobile ? '12px' : '14px 16px', marginBottom: '10px',
    }}>
      {/* Cabeçalho da linha: nome + selo de desvio */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: cor, flexShrink: 0 }} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {s.segmento}
          </span>
          <span style={{ fontSize: '11px', color: '#475569', flexShrink: 0 }}>
            · {s.qtdAtivos} ativo{s.qtdAtivos > 1 ? 's' : ''}
          </span>
        </div>
        <span style={{
          fontSize: '11px', fontWeight: 600, color: corNivel,
          background: `${corNivel}15`, border: `1px solid ${corNivel}30`,
          borderRadius: '20px', padding: '3px 10px', whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {s.classificacao?.label || '—'}
        </span>
      </div>

      {/* Barra de exposição atual */}
      <div style={{ position: 'relative', height: '10px', background: '#1e293b', borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${atualPct}%`, background: cor, borderRadius: '6px', transition: 'width 0.4s' }} />
      </div>
      {/* Marcador da meta (linha vertical sobre a trilha) */}
      <div style={{ position: 'relative', height: 0 }}>
        <div title="Meta do segmento" style={{
          position: 'absolute', top: '-13px', left: `calc(${metaPct}% - 1px)`,
          width: '2px', height: '16px', background: '#f8fafc', opacity: 0.7,
        }} />
      </div>

      {/* Legenda numérica: atual → meta e desvio */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', color: '#e2e8f0', fontVariantNumeric: 'tabular-nums' }}>
          <strong style={{ color: cor }}>{fmtPerc(s.atualFrac)}</strong>
          <span style={{ color: '#475569' }}> atual · meta </span>
          <strong style={{ color: '#cbd5e1' }}>{fmtPerc(s.metaFrac)}</strong>
        </span>
        <span style={{ fontSize: '12px', fontWeight: 600, color: corNivel, fontVariantNumeric: 'tabular-nums' }}>
          {fmtPP(s.desvioFrac)}
        </span>
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function PaginaDiversificacao() {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState(null);

  // Busca a diversificação calculada no backend.
  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const resultado = await diversificacaoService.obter();
      setDados(resultado);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const segmentos = dados?.segmentos || [];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b1120', color: '#f1f5f9', fontFamily: 'sans-serif' }}>
      <main style={{ maxWidth: '100%', margin: '0 auto', padding: isMobile ? '0.5rem 0.75rem' : '1rem 0.5rem', overflowX: 'hidden' }}>

        {/* ── Header ── */}
        <header style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}>
            <FiPieChart size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>Diversificação</h1>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Exposição da carteira por segmento</p>
          </div>
        </header>

        {loading ? (
          <SkeletonTable />
        ) : segmentos.length === 0 ? (
          <div style={{
            background: '#0f172a', border: '2px dashed #1e293b', borderRadius: '16px',
            padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', textAlign: 'center', gap: '12px',
          }}>
            <FiLayers size={24} color="#64748b" />
            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
              Nenhum ativo com posição na carteira. Adicione ativos e atualize as cotações em <strong>Controle de Ativos</strong>.
            </p>
          </div>
        ) : (
          <>
            {/* ── KPIs ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '10px', marginBottom: '1.25rem',
            }}>
              <KpiCard icon={FiLayers} label="Segmentos" valor={String(dados?.totalSegmentos ?? segmentos.length)}
                sub={{ txt: `${segmentos.reduce((n, s) => n + (s.qtdAtivos || 0), 0)} ativos com posição` }} cor="#60a5fa" isMobile={isMobile} />
              <KpiCard icon={FiPieChart} label="Mais concentrado"
                valor={dados?.maisConcentrado || '—'}
                sub={segmentos[0] ? { txt: `${fmtPerc(segmentos[0].atualFrac)} da carteira`, cor: corDoNivel(segmentos[0].classificacao?.nivel) } : null}
                cor="#a78bfa" isMobile={isMobile} />
              <KpiCard
                icon={(dados?.foraDaMeta ?? 0) > 0 ? FiAlertTriangle : FiCheckCircle}
                label="Fora da meta"
                valor={String(dados?.foraDaMeta ?? 0)}
                sub={{ txt: (dados?.foraDaMeta ?? 0) > 0 ? 'segmentos com desvio > 2 p.p.' : 'tudo dentro da meta', cor: (dados?.foraDaMeta ?? 0) > 0 ? '#fbbf24' : '#4ade80' }}
                cor={(dados?.foraDaMeta ?? 0) > 0 ? '#fbbf24' : '#4ade80'} isMobile={isMobile} />
            </div>

            {/* ── Lista de segmentos ── */}
            <div>
              {segmentos.map((s, i) => (
                <SegmentoRow key={s.segmento} s={s} cor={CORES[i % CORES.length]} isMobile={isMobile} />
              ))}
            </div>

            {/* ── Rodapé explicativo ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginTop: '12px' }}>
              <AiOutlineInfoCircle size={13} color="#475569" style={{ marginTop: '2px', flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>
                A exposição atual usa o valor de mercado de cada ativo na última consulta de cotações.
                A meta de cada segmento é a soma das metas (% ideal) que você definiu para os ativos daquele segmento em Controle de Ativos.
                O marcador claro na barra indica a meta.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
