import React, { useState, useEffect } from 'react';
import { AiOutlineBarChart, AiOutlineAreaChart } from 'react-icons/ai';
import { FiAlertTriangle, FiPlus, FiTrash2, FiRepeat, FiUpload, FiFileText, FiDownload } from 'react-icons/fi';
import NovaOperacaoModal from './components/modalNovaOperacao';
import { BarChart, AreaChart } from '../../components/Charts';
import { useOperacoes } from '../../hooks/operacoes/useOperacoes';
import { DataCard } from '../../components/DataCard';
import SlideModal from '../../components/SlideModal/SlideModal';
import { useIsMobile } from '../../hooks/useIsMobile';
import { toastInfo } from '../../utils/responseUtils';

const CHART_KEYS   = ['Compra', 'Venda', 'Liquido'];
const CHART_COLORS = {
  Compra:  'linear-gradient(180deg,#4ade80 0%,#16a34a 100%)',
  Venda:   'linear-gradient(180deg,#f87171 0%,#dc2626 100%)',
  Liquido: 'linear-gradient(180deg,#60a5fa 0%,#2563eb 100%)',
};
const AREA_COLORS = { Compra: '#22c55e', Venda: '#ef4444', Liquido: '#3b82f6' };

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const MESES = [
  ['Todos', 'Todos os meses'], ['01','Janeiro'], ['02','Fevereiro'], ['03','Março'],
  ['04','Abril'], ['05','Maio'], ['06','Junho'], ['07','Julho'], ['08','Agosto'],
  ['09','Setembro'], ['10','Outubro'], ['11','Novembro'], ['12','Dezembro'],
];

export default function PaginaOperacoes() {
  const [anoSelecionado,       setAnoSelecionado]       = useState('2026');
  const [mesSelecionado,       setMesSelecionado]       = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [modalAberto,          setModalAberto]          = useState(false);
  const [tipoGrafico,          setTipoGrafico]          = useState('barras');
  const [modalExclusaoAberto,  setModalExclusaoAberto]  = useState(false);
  const [operacaoParaExcluir,  setOperacaoParaExcluir]  = useState(null);
  const [graficoAberto,        setGraficoAberto]        = useState(false);
  const [modalImportAberto,    setModalImportAberto]    = useState(false);

  const isMobile = useIsMobile();

  const {
    operacoes, chartData, loading,
    getOperacoes, getChartData,
    handleLancarOperacao, handleExcluirOperacao,
  } = useOperacoes();

  useEffect(() => {
    getOperacoes({ mes: mesSelecionado, ano: anoSelecionado });
    getChartData({ ano: anoSelecionado });
  }, [anoSelecionado, mesSelecionado]);

  const abrirModalExclusao = (operacao) => {
    setOperacaoParaExcluir(operacao);
    setModalExclusaoAberto(true);
  };

  const confirmarExclusao = async () => {
    if (!operacaoParaExcluir) return;
    await handleExcluirOperacao(operacaoParaExcluir.id, { ano: anoSelecionado, mes: mesSelecionado });
    setModalExclusaoAberto(false);
    setOperacaoParaExcluir(null);
  };

  const operacoesComTotal = operacoes.map(op => ({ ...op, valorTotal: op.qtde * op.preco }));

  // colunas para desktop (DataCard/GridDados)
  const colunasOperacoes = [
    {
      titulo: 'Data', acesso: 'data', width: '11%',
      render: (val) => <span style={{ whiteSpace: 'nowrap' }}>{val}</span>,
    },
    {
      titulo: 'Operação', acesso: 'operacao', width: '12%', align: 'center',
      render: (val) => (
        <span style={{
          display: 'inline-flex', alignItems: 'center', padding: '3px 12px',
          borderRadius: '9999px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
          backgroundColor: val?.toUpperCase() === 'COMPRA' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          color: val?.toUpperCase() === 'COMPRA' ? '#10b981' : '#f87171',
          border: `1px solid ${val?.toUpperCase() === 'COMPRA' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}>{val}</span>
      ),
    },
    { titulo: 'Ativo',       acesso: 'ativo',      width: '10%', render: (val) => <span style={{ fontWeight: 700, color: '#f8fafc' }}>{val}</span> },
    {
      titulo: 'Seguimento', acesso: 'seguimento', width: '15%', align: 'center',
      render: (val) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500, backgroundColor: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)' }}>{val}</span>
        </div>
      ),
    },
    { titulo: 'Qtde',        acesso: 'qtde',       width: '8%',  align: 'center' },
    { titulo: 'Preço',       acesso: 'preco',      width: '12%', align: 'right', render: (val) => <span className="vp">{fmt(val)}</span> },
    { titulo: 'Valor Total', acesso: 'valorTotal', width: '14%', align: 'right', render: (val) => <span className="vp" style={{ fontWeight: 600, color: '#f8fafc' }}>{fmt(val)}</span> },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b1120', color: '#f1f5f9', fontFamily: 'sans-serif' }}>
      <main style={{ maxWidth: '100%', margin: '0 auto', padding: isMobile ? '0.5rem 0' : '1rem 0.5rem' }}>

        {/* ── Header ── */}
        <header style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}>
            <FiRepeat size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>Operações</h1>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Histórico de compras e vendas dos seus ativos</p>
          </div>
        </header>

        {/* ── Seção do Gráfico ── */}
        <div style={{
          backgroundColor: '#0f172a', borderRadius: '0.75rem',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)', border: '1px solid #1e293b',
          padding: isMobile ? '1rem' : '1.5rem', marginBottom: '1.5rem',
        }}>
          {/* Header do gráfico */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: (!isMobile || graficoAberto) ? '1.5rem' : '0', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ fontSize: isMobile ? '15px' : '18px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Compras por Mês
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>

              {/* Botão ver/ocultar gráfico — só mobile */}
              {isMobile && (
                <button
                  onClick={() => setGraficoAberto(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', borderRadius: '8px',
                    background: graficoAberto ? 'rgba(16,185,129,0.15)' : '#1e293b',
                    color: graficoAberto ? '#10b981' : '#94a3b8',
                    border: `1px solid ${graficoAberto ? 'rgba(16,185,129,0.3)' : '#334155'}`,
                    cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                >
                  {graficoAberto ? '▲ Ocultar' : '▼ Ver gráfico'}
                </button>
              )}

              {/* Controles — sempre visíveis no desktop, só quando aberto no mobile */}
              {(!isMobile || graficoAberto) && (
                <>
                  {/* Toggle gráfico */}
                  <div style={{ display: 'flex', backgroundColor: '#1e293b', padding: '4px', borderRadius: '0.5rem' }}>
                    {[['barras', AiOutlineBarChart], ['area', AiOutlineAreaChart]].map(([tipo, Icon]) => (
                      <button key={tipo} onClick={() => setTipoGrafico(tipo)} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '6px 10px',
                        backgroundColor: tipoGrafico === tipo ? '#0f172a' : 'transparent',
                        color: tipoGrafico === tipo ? '#10b981' : '#64748b',
                        borderRadius: '0.375rem', border: 'none', cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}>
                        <Icon size={18} />
                      </button>
                    ))}
                  </div>

                  <div style={{ width: '1px', height: '24px', backgroundColor: '#334155' }} />

                  <label style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>ANO</label>
                  <select
                    value={anoSelecionado}
                    onChange={(e) => setAnoSelecionado(e.target.value)}
                    style={{
                      appearance: 'none', backgroundColor: '#1e293b', border: '1px solid #334155',
                      color: '#f1f5f9', fontWeight: 600, padding: '0.4rem 0.75rem',
                      borderRadius: '0.375rem', outline: 'none', cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    {['2023','2024','2025','2026','2027','2028','2029','2030'].map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>

          {/* Gráfico — oculto no mobile quando fechado */}
          {(!isMobile || graficoAberto) && (
            <>
              {tipoGrafico === 'barras'
                ? <BarChart data={chartData} keys={CHART_KEYS} colors={CHART_COLORS} height={isMobile ? 100 : 150} barMaxWidth={isMobile ? 8 : undefined} />
                : <AreaChart data={chartData} keys={CHART_KEYS} colors={AREA_COLORS} height={isMobile ? 110 : 160} />
              }

              {/* Legenda */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1.25rem', fontSize: '13px', flexWrap: 'wrap', color: '#94a3b8' }}>
                {[['Compra','#4ade80','#16a34a'],['Venda','#f87171','#dc2626'],['Líquido','#60a5fa','#2563eb']].map(([label, c1, c2]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '14px', height: '14px', background: `linear-gradient(180deg, ${c1} 0%, ${c2} 100%)`, borderRadius: '3px' }} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Tabela / Cards de Operações ── */}
        {isMobile ? (
          /* ── MOBILE: cards ── */
          <div>
            {/* Header mobile */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>Operações</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setModalImportAberto(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '8px 12px', borderRadius: '8px',
                  background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)',
                  color: '#60a5fa', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                }}
              >
                <FiUpload size={14} />
              </button>
              <button
                onClick={() => setModalAberto(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                }}
              >
                <FiPlus size={15} /> Nova
              </button>
            </div>
            </div>

            {/* Filtros de mês e ano */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <select
                value={mesSelecionado}
                onChange={e => setMesSelecionado(e.target.value)}
                style={{
                  flex: 1,
                  backgroundColor: '#0f172a', border: '1px solid #1e293b',
                  color: '#f1f5f9', fontSize: '14px', padding: '10px 12px',
                  borderRadius: '8px', outline: 'none', cursor: 'pointer',
                }}
              >
                {MESES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <select
                value={anoSelecionado}
                onChange={e => setAnoSelecionado(e.target.value)}
                style={{
                  backgroundColor: '#0f172a', border: '1px solid #1e293b',
                  color: '#f1f5f9', fontSize: '14px', padding: '10px 12px',
                  borderRadius: '8px', outline: 'none', cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {['2023','2024','2025','2026','2027','2028','2029','2030'].map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Lista de cards */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Carregando...</div>
            ) : operacoesComTotal.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', background: '#0f172a', borderRadius: '10px', border: '1px solid #1e293b' }}>
                Nenhuma operação encontrada.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {operacoesComTotal.map((op, i) => {
                  const isCompra = op.operacao?.toUpperCase() === 'COMPRA';
                  return (
                    <div key={op.id ?? i} style={{
                      background: '#0f172a', border: '1px solid #1e293b',
                      borderRadius: '12px', padding: '14px 16px',
                      borderLeft: `3px solid ${isCompra ? '#10b981' : '#f87171'}`,
                    }}>
                      {/* linha 1: ativo + tipo + lixeira */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>{op.ativo}</span>
                          <span style={{
                            fontSize: '11px', fontWeight: 600, padding: '2px 10px', borderRadius: '9999px',
                            backgroundColor: isCompra ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                            color: isCompra ? '#10b981' : '#f87171',
                            border: `1px solid ${isCompra ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                          }}>{op.operacao}</span>
                        </div>
                        <button
                          onClick={() => abrirModalExclusao(op)}
                          style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '7px', padding: '6px 8px', cursor: 'pointer', color: '#f87171', display: 'flex', alignItems: 'center' }}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>

                      {/* linha 2: detalhes */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
                        {[
                          ['Data',      op.data],
                          ['Seguimento', op.seguimento],
                          ['Quantidade', op.qtde],
                          ['Preço Unit.', <span className="vp">{fmt(op.preco)}</span>],
                        ].map(([k, v]) => (
                          <div key={k}>
                            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '1px' }}>{k}</div>
                            <div style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 500 }}>{v}</div>
                          </div>
                        ))}
                      </div>

                      {/* linha 3: total */}
                      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Valor Total</span>
                        <span className="vp" style={{ fontSize: '15px', fontWeight: 700, color: isCompra ? '#10b981' : '#f87171' }}>
                          {isCompra ? '+ ' : '− '}{fmt(op.valorTotal)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ── DESKTOP: tabela normal ── */
          <DataCard
            titulo="Registro de Operações"
            botaoLabel="Nova Operação"
            onBotaoClick={() => setModalAberto(true)}
            botaoExtra={
              <button
                onClick={() => setModalImportAberto(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '0.5rem 1rem', borderRadius: '8px',
                  background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)',
                  color: '#60a5fa', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(96,165,250,0.2)'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(96,165,250,0.1)'; }}
              >
                <FiUpload size={14} /> Importar Excel
              </button>
            }
            labelpesquisa="Buscar operações..."
            filtros={
              <select
                value={mesSelecionado}
                onChange={e => setMesSelecionado(e.target.value)}
                style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f1f5f9', fontSize: '14px', padding: '0.375rem 0.75rem', borderRadius: '0.375rem', outline: 'none', cursor: 'pointer' }}
              >
                {MESES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            }
            coluna={colunasOperacoes}
            data={loading ? [] : operacoesComTotal}
            itemsPerPage={10}
            usaExcluir
            acaoExcluir={abrirModalExclusao}
          />
        )}

      </main>

      <NovaOperacaoModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onSuccess={(payload) => handleLancarOperacao(payload, { ano: anoSelecionado, mes: mesSelecionado })}
      />

      {/* ── Modal de escolha: tipo de importação ── */}
      {modalImportAberto && (
        <div
          onClick={() => setModalImportAberto(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1100,
            backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1e293b', border: '1px solid #334155',
              borderRadius: '16px', padding: '2rem',
              width: '100%', maxWidth: '480px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Importar Operações
                </h2>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>
                  Escolha o formato do arquivo
                </p>
              </div>
              <button
                onClick={() => setModalImportAberto(false)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #334155', borderRadius: '8px', color: '#64748b', cursor: 'pointer', padding: '6px 9px', fontSize: '14px', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {/* Opções */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Opção 1 — Padrão FIITrack */}
              <button
                onClick={() => { setModalImportAberto(false); toastInfo('Em breve: importação pelo modelo FIITrack.'); }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '14px',
                  padding: '1rem 1.25rem', borderRadius: '12px', cursor: 'pointer',
                  background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)',
                  textAlign: 'left', transition: 'all 0.2s',
                }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.14)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.07)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.2)'; }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FiDownload size={18} color="#10b981" />
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                    Modelo FIITrack
                  </p>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0', lineHeight: 1.5 }}>
                    Baixe e preencha nossa planilha padrão. Importação simples e sem erros.
                  </p>
                </div>
              </button>

              {/* Opção 2 — Nota de corretagem B3 */}
              <button
                onClick={() => { setModalImportAberto(false); toastInfo('Em breve: importação via nota de corretagem B3.'); }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '14px',
                  padding: '1rem 1.25rem', borderRadius: '12px', cursor: 'pointer',
                  background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.2)',
                  textAlign: 'left', transition: 'all 0.2s',
                }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(96,165,250,0.14)'; e.currentTarget.style.borderColor = 'rgba(96,165,250,0.4)'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(96,165,250,0.07)'; e.currentTarget.style.borderColor = 'rgba(96,165,250,0.2)'; }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FiFileText size={18} color="#60a5fa" />
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                    Nota de Corretagem B3
                  </p>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0', lineHeight: 1.5 }}>
                    Importe diretamente o arquivo exportado pela B3. Detectamos as operações automaticamente.
                  </p>
                </div>
              </button>

            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <SlideModal
        isOpen={modalExclusaoAberto && !!operacaoParaExcluir}
        onClose={() => { setModalExclusaoAberto(false); setOperacaoParaExcluir(null); }}
        title="Excluir Operação"
        width={isMobile ? '95vw' : '400px'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', paddingTop: '4px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiAlertTriangle size={22} color="#e74c3c" />
          </div>

          <p style={{ fontSize: '13px', color: '#8a9bb5', textAlign: 'center', lineHeight: 1.65, margin: 0 }}>
            Tem certeza que deseja excluir essa operação? Esta ação não pode ser desfeita.
          </p>

          {operacaoParaExcluir && (
            <div style={{ width: '100%', padding: '12px 16px', background: '#0d1520', border: '1px solid #1e2d3d', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                ['Ativo',      operacaoParaExcluir.ativo],
                ['Quantidade', operacaoParaExcluir.qtde],
                ['Total',      fmt(operacaoParaExcluir.qtde * operacaoParaExcluir.preco)],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#4e6480' }}>{k}</span>
                  <span style={{ color: '#cdd8e8', fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', width: '100%', paddingTop: '4px' }}>
            <button
              onClick={() => { setModalExclusaoAberto(false); setOperacaoParaExcluir(null); }}
              style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #243040', color: '#7a8fa8', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              onClick={confirmarExclusao}
              style={{ flex: 1, padding: '10px', background: '#c0392b', border: '1px solid #c0392b', color: '#fff', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(192,57,43,0.35)' }}
            >
              Excluir
            </button>
          </div>
        </div>
      </SlideModal>
    </div>
  );
}
