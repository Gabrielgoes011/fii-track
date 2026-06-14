import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'react-toastify';
import { BarChart, AreaChart } from '../../components/Charts';
import NovoRendimentoModal from './components/modalNovoRendimento';
import { useRendimentos } from '../../hooks/rendimentos/useRendimentos';
import { toastSuccess } from '../../utils/responseUtils';
import { DataCard } from '../../components/DataCard';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

// ─── constantes ───────────────────────────────────────────────────────────────
const MESES     = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const ANOS      = ['2023','2024','2025','2026'];
const CHART_KEYS   = ['Valor'];
const CHART_COLORS = { Valor: 'linear-gradient(180deg,#60a5fa 0%,#2563eb 100%)' };
const AREA_COLORS  = { Valor: '#3b82f6' };
const COR_ANOS     = { '2023': '#f59e0b', '2024': '#ef4444', '2025': '#3b82f6', '2026': '#10b981' };
const MOBILE_BP    = 768;

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

// ─── Gráfico Evolução Anual ───────────────────────────────────────────────────
function EvolucaoAnualChart({ data }) {
  const [animate, setAnimate] = React.useState(false);
  React.useEffect(() => {
    setAnimate(false);
    const t = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(t);
  }, [data]);
  const max = Math.max(...data.map(d => d.Valor || 0), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: '12px', padding: '8px 0 0' }}>
      {data.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', whiteSpace: 'nowrap' }}>{fmt(item.Valor)}</span>
          <div style={{
            width: '100%', maxWidth: '56px',
            height: animate ? `${Math.max((item.Valor / max) * 160, item.Valor > 0 ? 4 : 0)}px` : '0px',
            background: 'linear-gradient(180deg,#60a5fa 0%,#2563eb 100%)',
            borderRadius: '6px 6px 0 0',
            boxShadow: '0 4px 6px -1px rgba(96,165,250,0.35)',
            transition: `height 0.7s cubic-bezier(0.34,1.56,0.64,1) ${idx * 0.08}s`,
          }} title={`${item.name}: ${fmt(item.Valor)}`} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginTop: '8px' }}>{item.name}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Gráfico de barras horizontais agrupadas ──────────────────────────────────
function BarChartHorizontal({ data, anos }) {
  const anosOrdenados = [...anos].sort((a, b) => Number(a) - Number(b));
  const max = Math.max(...data.flatMap(d => anosOrdenados.map(a => d[a] || 0)), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {MESES.map((mes, mi) => {
        const row = data.find(d => d.mes === mi + 1) || {};
        return (
          <div key={mi} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', width: '72px', textAlign: 'right', flexShrink: 0 }}>{mes.substring(0,3)}</span>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {anosOrdenados.map(ano => {
                const val = row[ano] || 0;
                return (
                  <div key={ano} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ height: '10px', width: `${(val / max) * 100}%`, minWidth: val > 0 ? '4px' : '0', backgroundColor: COR_ANOS[ano], borderRadius: '0 3px 3px 0', transition: 'width 0.5s ease' }} title={`${ano}: ${fmt(val)}`} />
                    {val > 0 && <span style={{ fontSize: '9px', color: '#64748b' }}>{fmt(val)}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function PaginaRendimentos() {
  const { rendimentos, loading, getRendimentos, detalheMensal, detalheAnual, comparacaoAnual, getGrafico, getComparacaoAnual } = useRendimentos();

  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BP);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BP);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const [filtroAtivo,  setFiltroAtivo]  = useState('Todos');
  const [filtroMes,    setFiltroMes]    = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [filtroAno,    setFiltroAno]    = useState(String(new Date().getFullYear()));
  const [anoGrafico,   setAnoGrafico]   = useState(String(new Date().getFullYear()));
  const [tipoGrafico,  setTipoGrafico]  = useState('barras');
  const [anosComp,     setAnosComp]     = useState(['2024','2025','2026']);
  const [modalAberto,  setModalAberto]  = useState(false);
  // mobile: historico como padrão; desktop: graficos como padrão
  const [abaAtiva,     setAbaAtiva]     = useState(isMobile ? 'historico' : 'graficos');

  const [modalExclusao,          setModalExclusao]          = useState(false);
  const [rendimentoParaExcluir,  setRendimentoParaExcluir]  = useState(null);

  useEffect(() => { getRendimentos({ mes: filtroMes, ano: filtroAno }); }, [filtroMes, filtroAno, getRendimentos]);
  useEffect(() => { getGrafico({ ano: anoGrafico }); }, [anoGrafico, getGrafico]);
  useEffect(() => { getComparacaoAnual({ anos: anosComp }); }, [anosComp, getComparacaoAnual]);

  const ativos       = useMemo(() => ['Todos', ...new Set(rendimentos.map(d => d.ticker))], [rendimentos]);
  const filtrados    = useMemo(() => rendimentos.filter(d => filtroAtivo === 'Todos' || d.ticker === filtroAtivo), [rendimentos, filtroAtivo]);
  const totalRecebido  = useMemo(() => filtrados.reduce((s, d) => s + Number(d.valorRecebido), 0), [filtrados]);
  const totalAcumulado = useMemo(() => rendimentos.reduce((s, d) => s + Number(d.valorRecebido), 0), [rendimentos]);
  const yieldOnCost    = totalAcumulado > 0 ? ((totalRecebido / totalAcumulado) * 100).toFixed(2) : '0.00';

  const chartMensal = useMemo(() => MESES.map((nome, mi) => {
    const item = detalheMensal.find(d => parseInt(d.mes) === mi + 1);
    return { name: nome, Valor: item ? parseFloat(item.totalRendimento) || 0 : 0 };
  }), [detalheMensal]);

  const chartAnual = useMemo(() => ANOS.map(ano => {
    const item = detalheAnual.find(d => String(parseInt(d.ano)) === ano);
    return { name: ano, Valor: item ? parseFloat(item.totalRendimento) || 0 : 0 };
  }), [detalheAnual]);

  const chartComparacao = useMemo(() => MESES.map((_, mi) => {
    const row = { mes: mi + 1 };
    anosComp.forEach(ano => {
      const item = comparacaoAnual.find(d => parseInt(d.mes) === mi + 1 && String(parseInt(d.ano)) === ano);
      row[ano] = item ? parseFloat(item.totalRendimento) || 0 : 0;
    });
    return row;
  }), [comparacaoAnual, anosComp]);

  const handleNovoRendimento = () => {
    toastSuccess('Rendimento lançado com sucesso!');
    setModalAberto(false);
    getRendimentos({ mes: filtroMes, ano: filtroAno });
    getGrafico({ ano: anoGrafico });
  };

  const abrirModalExclusao  = (row) => { setRendimentoParaExcluir(row); setModalExclusao(true); };
  const confirmarExclusao   = () => {
    toast.success('Rendimento excluído com sucesso!');
    setModalExclusao(false);
    setRendimentoParaExcluir(null);
    getRendimentos({ mes: filtroMes, ano: filtroAno });
  };
  const toggleAnoComp = (ano) => setAnosComp(prev => prev.includes(ano) ? prev.filter(a => a !== ano) : [...prev, ano]);

  const selectStyle = {
    backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f1f5f9',
    fontSize: '14px', padding: '0.375rem 0.75rem', borderRadius: '0.375rem',
    outline: 'none', cursor: 'pointer', fontWeight: 600,
  };
  const cardStyle = {
    backgroundColor: '#0f172a', borderRadius: '0.75rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.3)', border: '1px solid #1e293b',
    padding: isMobile ? '1rem' : '1.5rem', marginBottom: '1.5rem',
  };

  // ─── colunas desktop ───────────────────────────────────────────────────────
  const colunasHistorico = [
    { titulo: 'Data',     acesso: 'dtRendimento',   width: '12%', render: (val) => new Date(val).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) },
    { titulo: 'Ativo',    acesso: 'ticker',          width: '12%', render: (val) => <span style={{ fontWeight: 700, color: '#f8fafc' }}>{val}</span> },
    {
      titulo: 'Segmento', acesso: 'nomeSeguimento',  width: '20%', align: 'center',
      render: (val) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500, backgroundColor: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)' }}>{val}</span>
        </div>
      ),
    },
    {
      titulo: 'Valor Recebido', acesso: 'valorRecebido', width: '15%', align: 'center',
      render: (val) => <span style={{ fontWeight: 700, color: '#34d399' }}>{fmt(Number(val))}</span>,
    },
  ];

  return (
    <>
      <div style={{ minHeight: '100vh', backgroundColor: '#0b1120', color: '#f1f5f9', fontFamily: 'sans-serif' }}>
        <main style={{ maxWidth: '60rem', margin: '0 auto', padding: isMobile ? '0.5rem 0' : '1rem 0.5rem' }}>

          {/* ── KPIs ── */}
          <div style={cardStyle}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
              gap: '10px',
            }}>
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '0.75rem', padding: isMobile ? '0.75rem' : '0.75rem 1.25rem' }}>
                <p style={{ margin: 0, fontSize: '10px', fontWeight: 600, color: '#10b981' }}>TOTAL RECEBIDO</p>
                <p style={{ margin: '4px 0 0', fontSize: isMobile ? '1rem' : '1.25rem', fontWeight: 700, color: '#34d399' }}>{fmt(totalRecebido)}</p>
              </div>
              <div style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '0.75rem', padding: isMobile ? '0.75rem' : '0.75rem 1.25rem' }}>
                <p style={{ margin: 0, fontSize: '10px', fontWeight: 600, color: '#60a5fa' }}>YIELD ON COST</p>
                <p style={{ margin: '4px 0 0', fontSize: isMobile ? '1rem' : '1.25rem', fontWeight: 700, color: '#93c5fd' }}>{yieldOnCost}%</p>
              </div>
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '0.75rem', padding: isMobile ? '0.75rem' : '0.75rem 1.25rem', gridColumn: isMobile ? '1 / -1' : 'auto' }}>
                <p style={{ margin: 0, fontSize: '10px', fontWeight: 600, color: '#f59e0b' }}>TOTAL ACUMULADO</p>
                <p style={{ margin: '4px 0 0', fontSize: isMobile ? '1rem' : '1.25rem', fontWeight: 700, color: '#fbbf24' }}>{fmt(totalAcumulado)}</p>
              </div>
            </div>
          </div>

          {/* ── Abas ── */}
          <nav style={{ display: 'flex', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '1.5rem' }}>
            {[
              { id: 'historico', label: '📋 Histórico' },
              { id: 'graficos',  label: '📊 Gráficos'  },
            ].map(({ id, label }) => (
              <button key={id} onClick={() => setAbaAtiva(id)} style={{
                flex: 1, padding: '0.75rem 1rem',
                backgroundColor: abaAtiva === id ? 'rgba(16,185,129,0.1)' : 'transparent',
                color: abaAtiva === id ? '#10b981' : '#64748b',
                border: 'none',
                borderBottom: abaAtiva === id ? '3px solid #10b981' : '3px solid transparent',
                fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s',
              }}>
                {label}
              </button>
            ))}
          </nav>

          {/* ── Aba Histórico ── */}
          {abaAtiva === 'historico' && (
            isMobile ? (
              /* ── MOBILE: cards ── */
              <div>
                {/* Header: título + botão novo */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>Histórico</h2>
                  <button
                    onClick={() => setModalAberto(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}
                  >
                    <FiPlus size={15} /> Novo
                  </button>
                </div>

                {/* Filtros mobile: ativo + mês + ano */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <select value={filtroAtivo} onChange={e => setFiltroAtivo(e.target.value)}
                    style={{ flex: 1, backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#f1f5f9', fontSize: '13px', padding: '10px 10px', borderRadius: '8px', outline: 'none', cursor: 'pointer' }}>
                    {ativos.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)}
                    style={{ flex: 1, backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#f1f5f9', fontSize: '13px', padding: '10px 10px', borderRadius: '8px', outline: 'none', cursor: 'pointer' }}>
                    <option value="Todos">Todos</option>
                    {MESES.map((m, i) => <option key={i} value={String(i+1).padStart(2,'0')}>{m}</option>)}
                  </select>
                  <select value={filtroAno} onChange={e => setFiltroAno(e.target.value)}
                    style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#f1f5f9', fontSize: '13px', padding: '10px 10px', borderRadius: '8px', outline: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Carregando...</div>
                ) : filtrados.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', background: '#0f172a', borderRadius: '10px', border: '1px solid #1e293b' }}>
                    Nenhum rendimento encontrado.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filtrados.map((r, i) => (
                      <div key={r.id ?? i} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '14px 16px', borderLeft: '3px solid #10b981' }}>
                        {/* linha 1 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>{r.ticker}</span>
                            <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 10px', borderRadius: '9999px', backgroundColor: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)' }}>
                              {r.nomeSeguimento}
                            </span>
                          </div>
                          <button
                            onClick={() => abrirModalExclusao(r)}
                            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '7px', padding: '6px 8px', cursor: 'pointer', color: '#f87171', display: 'flex', alignItems: 'center' }}
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>

                        {/* linha 2 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', color: '#64748b' }}>
                            {new Date(r.dtRendimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                          </span>
                          <span style={{ fontSize: '16px', fontWeight: 700, color: '#34d399' }}>
                            + {fmt(Number(r.valorRecebido))}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* ── DESKTOP: tabela ── */
              <DataCard
                titulo="Histórico de Rendimentos"
                botaoLabel="Novo Rendimento"
                onBotaoClick={() => setModalAberto(true)}
                labelpesquisa="Buscar ativo, segmento..."
                filtros={
                  <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)} style={selectStyle}>
                    <option value="Todos">Todos os meses</option>
                    {MESES.map((m, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>)}
                  </select>
                }
                coluna={colunasHistorico}
                data={loading ? [] : filtrados}
                itemsPerPage={10}
                usaExcluir
                acaoExcluir={abrirModalExclusao}
              />
            )
          )}

          {/* ── Aba Gráficos ── */}
          {abaAtiva === 'graficos' && (<>
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ fontSize: isMobile ? '15px' : '18px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>Rendimentos por Mês</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', backgroundColor: '#1e293b', padding: '4px', borderRadius: '0.5rem' }}>
                    {['barras','area'].map(tipo => (
                      <button key={tipo} onClick={() => setTipoGrafico(tipo)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 10px', backgroundColor: tipoGrafico === tipo ? '#0f172a' : 'transparent', color: tipoGrafico === tipo ? '#10b981' : '#64748b', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontSize: '12px', fontWeight: 600 }}>
                        {tipo === 'barras' ? '▊ Barras' : '〜 Área'}
                      </button>
                    ))}
                  </div>
                  <select value={anoGrafico} onChange={e => setAnoGrafico(e.target.value)} style={{ ...selectStyle, appearance: 'none' }}>
                    {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              {tipoGrafico === 'barras'
                ? <BarChart data={chartMensal} keys={CHART_KEYS} colors={CHART_COLORS} height={isMobile ? 100 : 150} />
                : <AreaChart data={chartMensal} keys={CHART_KEYS} colors={AREA_COLORS} height={isMobile ? 110 : 160} />
              }
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ ...cardStyle, marginBottom: 0 }}>
                <h2 style={{ margin: '0 0 1.5rem', fontSize: '17px', fontWeight: 700, color: '#f8fafc' }}>Evolução Anual</h2>
                <EvolucaoAnualChart data={chartAnual} />
              </div>
              <div style={{ ...cardStyle, marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#f8fafc' }}>Comparação Anual</h2>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {ANOS.map(ano => (
                      <button key={ano} onClick={() => toggleAnoComp(ano)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '9999px', border: '1px solid', borderColor: anosComp.includes(ano) ? COR_ANOS[ano] : '#334155', backgroundColor: anosComp.includes(ano) ? COR_ANOS[ano] + '22' : 'transparent', color: anosComp.includes(ano) ? COR_ANOS[ano] : '#64748b', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: anosComp.includes(ano) ? COR_ANOS[ano] : '#334155', display: 'inline-block' }} />
                        {ano}
                      </button>
                    ))}
                  </div>
                </div>
                <BarChartHorizontal data={chartComparacao} anos={anosComp} />
              </div>
            </div>
          </>)}

        </main>

        <NovoRendimentoModal
          isOpen={modalAberto}
          onClose={() => setModalAberto(false)}
          onSuccess={handleNovoRendimento}
        />

        {/* Modal exclusão */}
        {modalExclusao && rendimentoParaExcluir && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(4px)', padding: '16px' }}>
            <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '2rem', borderRadius: '16px', boxShadow: '0 24px 60px rgba(0,0,0,0.6)', width: '100%', maxWidth: '400px' }}>
              <h3 style={{ margin: '0 0 12px', color: '#f8fafc', fontSize: '1.1rem', textAlign: 'center', fontWeight: 700 }}>Excluir Rendimento</h3>
              <p style={{ margin: '0 0 20px', color: '#94a3b8', fontSize: '14px', textAlign: 'center' }}>Tem certeza que deseja excluir este rendimento?</p>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', padding: '15px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #334155' }}>
                <p style={{ margin: '0 0 6px', color: '#cbd5e1' }}><strong style={{ color: '#94a3b8' }}>Ativo:</strong> {rendimentoParaExcluir.ticker}</p>
                <p style={{ margin: '0 0 6px', color: '#cbd5e1' }}><strong style={{ color: '#94a3b8' }}>Data:</strong> {new Date(rendimentoParaExcluir.dtRendimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                <p style={{ margin: 0, color: '#cbd5e1' }}><strong style={{ color: '#94a3b8' }}>Valor:</strong> {fmt(Number(rendimentoParaExcluir.valorRecebido))}</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => { setModalExclusao(false); setRendimentoParaExcluir(null); }}
                  style={{ flex: 1, padding: '10px', background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
                  Cancelar
                </button>
                <button onClick={confirmarExclusao}
                  style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', boxShadow: '0 4px 16px rgba(239,68,68,0.3)' }}>
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
