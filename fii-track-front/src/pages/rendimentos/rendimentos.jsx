import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BarChart, AreaChart } from '../../components/Charts';
import NovoRendimentoModal from './components/modalNovoRendimento';
import { useRendimentos } from '../../hooks/rendimentos/useRendimentos';
import { toastSuccess, toastInfo, toastError } from '../../utils/responseUtils';
import { DataCard } from '../../components/DataCard';
import ModalConfirmacao from '../../components/ModalDeConfirmacao/ModalConfirmacao';
import { useIsMobile } from '../../hooks/useIsMobile';
import { FiPlus, FiTrash2, FiUpload, FiRepeat, FiMinusCircle, FiDollarSign, FiDownload, FiFileText, FiCheckCircle } from 'react-icons/fi';
import * as XLSX from 'xlsx';

// ─── Constantes ───────────────────────────────────────────────────────────────
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril',
  'Maio', 'Junho', 'Julho', 'Agosto',
  'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const ANOS = ['2023', '2024', '2025', '2026'];
const CHART_KEYS = ['Valor'];
const CHART_COLORS = { Valor: 'linear-gradient(180deg,#60a5fa 0%,#2563eb 100%)' };
const AREA_COLORS = { Valor: '#3b82f6' };
const COR_ANOS = { '2023': '#f59e0b', '2024': '#ef4444', '2025': '#3b82f6', '2026': '#10b981' };

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const foiReinvestido = (valor) =>
  valor === true || valor === 1 || valor === '1' || String(valor).toLowerCase() === 'true';

function BadgeReinvestido({ valor }) {
  const reinvestido = foiReinvestido(valor);
  const cor = reinvestido ? '#34d399' : '#94a3b8';
  const fundo = reinvestido ? 'rgba(16,185,129,0.12)' : 'rgba(148,163,184,0.08)';
  const borda = reinvestido ? 'rgba(16,185,129,0.25)' : 'rgba(148,163,184,0.18)';
  const Icone = reinvestido ? FiRepeat : FiMinusCircle;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px',
      borderRadius: '999px', fontSize: '11px', fontWeight: 700,
      color: cor, backgroundColor: fundo, border: `1px solid ${borda}`,
    }}>
      <Icone size={12} />
      {reinvestido ? 'Reinvestido' : 'Não reinvestido'}
    </span>
  );
}

// ─── Estilos estáticos (fora do componente — não recriam a cada render) ───────
const S = {
  // layout raiz
  paginaRaiz: {
    minHeight: '100vh',
    backgroundColor: '#0b1120',
    color: '#f1f5f9',
    fontFamily: 'sans-serif',
  },

  // navegação de abas
  nav: {
    display: 'flex',
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    marginBottom: '1.5rem',
  },

  // select padrão
  select: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    color: '#f1f5f9',
    fontSize: '14px',
    padding: '0.375rem 0.75rem',
    borderRadius: '0.375rem',
    outline: 'none',
    cursor: 'pointer',
    fontWeight: 600,
  },

  // select mobile (filtros)
  selectMobile: {
    flex: 1,
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    color: '#f1f5f9',
    fontSize: '13px',
    padding: '10px',
    borderRadius: '8px',
    outline: 'none',
    cursor: 'pointer',
  },

  // cabeçalho mobile (título + botão novo)
  mobileHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },

  // título seção mobile
  mobileTitulo: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#f8fafc',
    margin: 0,
  },

  // botão "Novo" mobile
  btnNovoMobile: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
  },

  // faixa de filtros mobile
  filtrosMobileWrap: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },

  // estado vazio / loading mobile
  estadoVazioMobile: {
    textAlign: 'center',
    padding: '2rem',
    color: '#64748b',
    background: '#0f172a',
    borderRadius: '10px',
    border: '1px solid #1e293b',
  },

  // lista de cards mobile
  listaCardsMobile: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },

  // card individual de rendimento (mobile)
  cardRendimento: {
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    padding: '14px 16px',
    borderLeft: '3px solid #10b981',
  },

  // linha 1 do card (ticker + badge + lixeira)
  cardLinha1: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },

  // agrupamento esquerdo da linha 1
  cardLinha1Esq: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },

  // ticker
  cardTicker: {
    fontSize: '16px',
    fontWeight: 800,
    color: '#f8fafc',
  },

  // badge de segmento (mobile)
  badgeSegmentoMobile: {
    fontSize: '11px',
    fontWeight: 500,
    padding: '2px 10px',
    borderRadius: '9999px',
    backgroundColor: 'rgba(96,165,250,0.12)',
    color: '#60a5fa',
    border: '1px solid rgba(96,165,250,0.25)',
  },

  // botão lixeira (mobile)
  btnLixeiraMobile: {
    background: 'rgba(248,113,113,0.1)',
    border: '1px solid rgba(248,113,113,0.2)',
    borderRadius: '7px',
    padding: '6px 8px',
    cursor: 'pointer',
    color: '#f87171',
    display: 'flex',
    alignItems: 'center',
  },

  // linha 2 do card (data + valor)
  cardLinha2: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // data no card mobile
  cardData: {
    fontSize: '13px',
    color: '#64748b',
  },

  // valor no card mobile
  cardValor: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#34d399',
  },

  // badge segmento (desktop — coluna da tabela)
  badgeSegmentoDesk: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 10px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 500,
    backgroundColor: 'rgba(96,165,250,0.12)',
    color: '#60a5fa',
    border: '1px solid rgba(96,165,250,0.25)',
  },

  // valor (desktop — coluna da tabela)
  valorDesk: {
    fontWeight: 700,
    color: '#34d399',
  },

  // ticker (desktop — coluna da tabela)
  tickerDesk: {
    fontWeight: 700,
    color: '#f8fafc',
  },

  // cabeçalho do gráfico mensal
  graficoMensalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },

  // controles do gráfico (toggle tipo + select ano)
  graficoControles: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },

  // toggle barras/área
  toggleTipoGrafico: {
    display: 'flex',
    backgroundColor: '#1e293b',
    padding: '4px',
    borderRadius: '0.5rem',
  },

  // grid dois cards (Evolução + Comparação)
  gridDoisCards: {
    display: 'grid',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  },

  // cabeçalho do card Comparação Anual
  comparacaoHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },

  // grupo de botões de ano (comparação)
  comparacaoBotoesAnos: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },

  // título padrão de card
  tituloCard: {
    margin: '0 0 1.5rem',
    fontSize: '17px',
    fontWeight: 700,
    color: '#f8fafc',
  },

  // título sem margem (para cabeçalhos com botões ao lado)
  tituloCardSemMargem: {
    margin: 0,
    fontSize: '17px',
    fontWeight: 700,
    color: '#f8fafc',
  },

  // ── Modal de exclusão ──────────────────────────────────────────────────────

  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(4px)',
    padding: '16px',
  },

  modalBox: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    padding: '2rem',
    borderRadius: '16px',
    boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
    width: '100%',
    maxWidth: '400px',
  },

  modalTitulo: {
    margin: '0 0 12px',
    color: '#f8fafc',
    fontSize: '1.1rem',
    textAlign: 'center',
    fontWeight: 700,
  },

  modalDescricao: {
    margin: '0 0 20px',
    color: '#94a3b8',
    fontSize: '14px',
    textAlign: 'center',
  },

  modalDadosBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '25px',
    border: '1px solid #334155',
  },

  modalDadosLinha: {
    margin: '0 0 6px',
    color: '#cbd5e1',
  },

  modalDadosLinhaFinal: {
    margin: 0,
    color: '#cbd5e1',
  },

  modalDadosLabel: {
    color: '#94a3b8',
  },

  modalAcoes: {
    display: 'flex',
    gap: '12px',
  },

  btnCancelarModal: {
    flex: 1,
    padding: '10px',
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid #334155',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
  },

  // ── KPIs ──────────────────────────────────────────────────────────────────

  // ── KPIs ──────────────────────────────────────────────────────────────────

  // Todos os cards usam o mesmo fundo neutro — a cor fica só no label e valor
  kpiCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid #1e293b',
    borderRadius: '0.75rem',
  },

  // Label título do card (ex: "TOTAL RECEBIDO")
  kpiLabelVerde: { margin: 0, fontSize: '11px', fontWeight: 700, color: '#10b981', letterSpacing: '0.08em', textTransform: 'uppercase' },
  kpiLabelAmarelo: { margin: 0, fontSize: '11px', fontWeight: 700, color: '#f59e0b', letterSpacing: '0.08em', textTransform: 'uppercase' },
  kpiLabelAzul: { margin: 0, fontSize: '11px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.08em', textTransform: 'uppercase' },
  kpiLabelRoxo: { margin: 0, fontSize: '11px', fontWeight: 700, color: '#a78bfa', letterSpacing: '0.08em', textTransform: 'uppercase' },

  // Sub-texto descritivo abaixo do valor (ex: "desde o início")
  kpiSubInfo: {
    margin: '5px 0 0',
    fontSize: '12px',
    fontWeight: 500,
    color: '#475569',
    lineHeight: 1.4,
  },

  // Valor em destaque dentro do sub-texto (ex: percentual YoC)
  kpiSubInfoDestaque: {
    color: '#a78bfa',
    fontWeight: 700,
  },

  // Valor em destaque dentro do KPI — função para receber cor e isMobile
  // Usa fonte tabular (variant-numeric) para alinhar dígitos corretamente
  kpiValor: (cor, mobile) => ({
    margin: '6px 0 0',
    fontSize: mobile ? '1.05rem' : '1.3rem',
    fontWeight: 600,
    color: cor,
    lineHeight: 1,
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.01em',
  }),
};

// ─── Gráfico Evolução Anual ───────────────────────────────────────────────────
function EvolucaoAnualChart({ data }) {
  const [animate, setAnimate] = React.useState(false);
  const [hoveredIndex, setHoveredIndex] = React.useState(null);

  React.useEffect(() => {
    setAnimate(false);
    const t = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(t);
  }, [data]);

  const max = Math.max(...data.map(d => d.Valor || 0), 1);

  const estiloWrap = {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    gap: '12px',
    padding: '8px 0 0',
    minHeight: '210px',
  };

  const estiloColunaItem = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    cursor: 'pointer',
  };

  const estiloAnoLabel = {
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
    marginTop: '8px',
  };

  return (
    <div style={estiloWrap}>
      {data.map((item, idx) => {
        const isHovered = hoveredIndex === idx;
        const barraAltura = animate
          ? `${Math.max((item.Valor / max) * 160, item.Valor > 0 ? 4 : 0)}px`
          : '0px';

        const estiloBarra = {
          width: '100%',
          maxWidth: '56px',
          height: barraAltura,
          background: 'linear-gradient(180deg,#60a5fa 0%,#2563eb 100%)',
          borderRadius: '6px 6px 0 0',
          boxShadow: '0 4px 6px -1px rgba(96,165,250,0.35)',
          transition: `height 0.7s cubic-bezier(0.34,1.56,0.64,1) ${idx * 0.08}s, filter 0.3s`,
          filter: isHovered ? 'brightness(1.2)' : 'brightness(1)',
        };

        const estiloValorLabel = {
          fontSize: '12px',
          fontWeight: 700,
          color: '#a5b4fc',
          marginBottom: '8px',
          whiteSpace: 'nowrap',
          padding: '2px 8px',
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '6px',
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? 'translateY(-8px)' : 'translateY(0px)',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        };

        return (
          <div
            key={idx}
            style={estiloColunaItem}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <span style={estiloValorLabel} className="vp">{fmt(item.Valor)}</span>
            <div style={estiloBarra} title={`${item.name}: ${fmt(item.Valor)}`} />
            <span style={estiloAnoLabel}>{item.name}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Gráfico Mensal (Barras) ──────────────────────────────────────────────────
function GraficoMensalBarras({ data }) {
  const [animate, setAnimate] = React.useState(false);
  const [hoveredIndex, setHoveredIndex] = React.useState(null);

  React.useEffect(() => {
    setAnimate(false);
    const t = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(t);
  }, [data]);

  const max = Math.max(...data.map(d => d.Valor || 0), 1);

  const estiloWrap = {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    gap: '8px',
    padding: '8px 0 0',
    minHeight: '180px',
  };

  const estiloColunaItem = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    cursor: 'pointer',
  };

  const estiloMesLabel = {
    fontSize: '11px',
    fontWeight: 600,
    color: '#64748b',
    marginTop: '6px',
  };

  return (
    <div style={estiloWrap}>
      {data.map((item, idx) => {
        const isHovered = hoveredIndex === idx;
        const barraAltura = animate
          ? `${Math.max((item.Valor / max) * 120, item.Valor > 0 ? 3 : 0)}px`
          : '0px';

        const estiloBarra = {
          width: '100%',
          maxWidth: '32px',
          height: barraAltura,
          background: 'linear-gradient(180deg,#60a5fa 0%,#2563eb 100%)',
          borderRadius: '4px 4px 0 0',
          boxShadow: '0 2px 4px -1px rgba(96,165,250,0.25)',
          transition: `height 0.6s cubic-bezier(0.34,1.56,0.64,1) ${idx * 0.05}s, filter 0.3s`,
          filter: isHovered ? 'brightness(1.2)' : 'brightness(1)',
        };

        const estiloValorLabel = {
          fontSize: '11px',
          fontWeight: 700,
          color: '#a5b4fc',
          marginBottom: '6px',
          whiteSpace: 'nowrap',
          padding: '2px 6px',
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '4px',
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? 'translateY(-6px)' : 'translateY(0px)',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        };

        return (
          <div
            key={idx}
            style={estiloColunaItem}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <span style={estiloValorLabel} className="vp">{fmt(item.Valor)}</span>
            <div style={estiloBarra} title={`${item.name}: ${fmt(item.Valor)}`} />
            <span style={estiloMesLabel}>{item.name.substring(0, 3)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Gráfico de barras horizontais agrupadas ──────────────────────────────────
function BarChartHorizontal({ data, anos }) {
  const [hovered, setHovered] = React.useState(null);
  const anosOrdenados = [...anos].sort((a, b) => Number(a) - Number(b));
  const max = Math.max(...data.flatMap(d => anosOrdenados.map(a => d[a] || 0)), 1);

  const estiloWrap = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  };

  const estiloLinhaMes = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const estiloLabelMes = {
    fontSize: '11px',
    color: '#64748b',
    width: '72px',
    textAlign: 'right',
    flexShrink: 0,
  };

  const estiloBarsWrap = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  };

  const estiloLinhaAno = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
  };

  const estiloValorMini = {
    fontSize: '9px',
    color: '#64748b',
  };

  return (
    <div style={estiloWrap}>
      {MESES.map((mes, mi) => {
        const row = data.find(d => d.mes === mi + 1) || {};
        return (
          <div key={mi} style={estiloLinhaMes}>
            <span style={estiloLabelMes}>{mes.substring(0, 3)}</span>
            <div style={estiloBarsWrap}>
              {anosOrdenados.map(ano => {
                const val = row[ano] || 0;
                const isHovered = hovered && hovered.mes === mi + 1 && hovered.ano === ano;

                const estiloBarra = {
                  height: '10px',
                  width: `${(val / max) * 100}%`,
                  minWidth: val > 0 ? '4px' : '0',
                  backgroundColor: COR_ANOS[ano],
                  borderRadius: '0 3px 3px 0',
                  transition: 'width 0.5s ease, filter 0.2s',
                  filter: isHovered ? 'brightness(1.3) saturate(1.2)' : 'brightness(1)',
                };

                const estiloValor = {
                  fontSize: isHovered ? '10px' : '9px',
                  fontWeight: isHovered ? 700 : 400,
                  color: isHovered ? '#f1f5f9' : '#64748b',
                  transition: 'all 0.2s',
                };

                return (
                  <div
                    key={ano}
                    style={estiloLinhaAno}
                    onMouseEnter={() => setHovered({ mes: mi + 1, ano })}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <div style={estiloBarra} title={`${ano}: ${fmt(val)}`} />
                    {val > 0 && <span className="vp" style={estiloValorMini}>{fmt(val)}</span>}
                    {val > 0 && <span className="vp" style={estiloValor}>{fmt(val)}</span>}
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

// ─── Mobile Gráficos — com tap interativo ────────────────────────────────────
function MobileGraficos({
  chartMensal, chartAnual, chartComparacao,
  tipoGrafico, setTipoGrafico,
  anoGrafico, setAnoGrafico,
  anosComp, toggleAnoComp,
  mobileAccordion, setMobileAccordion,
}) {
  // tooltip de toque — { label, valor, cor }
  const [tooltipMensal,    setTooltipMensal]    = React.useState(null);
  const [tooltipAnual,     setTooltipAnual]     = React.useState(null);
  const [tooltipComp,      setTooltipComp]      = React.useState(null); // { mes, ano, valor }

  const maxMensal = Math.max(...chartMensal.map(d => d.Valor || 0), 1);
  const maxAnual  = Math.max(...chartAnual.map(d => d.Valor || 0), 1);

  const selectAnoStyle = {
    backgroundColor: '#1e293b',
    border:          '1px solid #334155',
    color:           '#f1f5f9',
    fontSize:        '12px',
    padding:         '4px 8px',
    borderRadius:    '6px',
    outline:         'none',
    cursor:          'pointer',
    fontWeight:      600,
  };

  const cardStyle = {
    backgroundColor: '#0f172a',
    borderRadius:    '10px',
    border:          '1px solid #1e293b',
    padding:         '14px 12px',
  };

  const accordionWrap = {
    backgroundColor: '#0f172a',
    borderRadius:    '10px',
    border:          '1px solid #1e293b',
    overflow:        'hidden',
  };

  const accordionBtn = {
    width:          '100%',
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    padding:        '12px',
    background:     'transparent',
    border:         'none',
    cursor:         'pointer',
  };

  // ── Tooltip flutuante ──
  function TooltipBadge({ label, valor, cor, onClose }) {
    return (
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        marginTop:      '10px',
        padding:        '8px 12px',
        borderRadius:   '8px',
        background:     'rgba(15,23,42,0.85)',
        border:         `1px solid ${cor}44`,
        backdropFilter: 'blur(6px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: cor, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 800, color: cor, fontVariantNumeric: 'tabular-nums' }}>
            {fmt(valor)}
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '0 2px' }}
          >×</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* ── Gráfico Mensal (sempre visível) ── */}
      <div style={cardStyle}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
            Rendimentos {anoGrafico}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ display: 'flex', backgroundColor: '#1e293b', padding: '2px', borderRadius: '6px' }}>
              {['barras', 'area'].map(tipo => {
                const ativo = tipoGrafico === tipo;
                return (
                  <button key={tipo} onClick={() => setTipoGrafico(tipo)} style={{
                    padding:         '4px 8px',
                    backgroundColor: ativo ? '#0f172a' : 'transparent',
                    color:           ativo ? '#10b981'  : '#475569',
                    borderRadius:    '4px',
                    border:          'none',
                    cursor:          'pointer',
                    fontSize:        '10px',
                    fontWeight:      600,
                  }}>
                    {tipo === 'barras' ? '▊' : '〜'}
                  </button>
                );
              })}
            </div>
            <select value={anoGrafico} onChange={e => { setAnoGrafico(e.target.value); setTooltipMensal(null); }} style={selectAnoStyle}>
              {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {/* Gráfico */}
        {tipoGrafico === 'barras' ? (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '3px', height: '150px', padding: '0 2px' }}>
            {chartMensal.map((item, idx) => {
              const h     = Math.max((item.Valor / maxMensal) * 120, item.Valor > 0 ? 3 : 0);
              const ativo = tooltipMensal?.idx === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setTooltipMensal(ativo ? null : { idx, label: item.name, valor: item.Valor })}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
                >
                  <div style={{
                    width:        '100%',
                    maxWidth:     '22px',
                    height:       `${h}px`,
                    background:   ativo
                      ? 'linear-gradient(180deg,#a5f3fc 0%,#06b6d4 100%)'
                      : 'linear-gradient(180deg,#60a5fa 0%,#2563eb 100%)',
                    borderRadius: '3px 3px 0 0',
                    transition:   'height 0.5s ease, background 0.2s',
                    boxShadow:    ativo ? '0 0 10px rgba(6,182,212,0.6)' : 'none',
                  }} />
                  <span style={{ fontSize: '9px', color: ativo ? '#7dd3fc' : '#475569', marginTop: '4px', fontWeight: 700 }}>
                    {item.name.substring(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <AreaChart data={chartMensal} keys={CHART_KEYS} colors={AREA_COLORS} height={130} />
        )}

        {/* Tooltip tap mensal */}
        {tooltipMensal && (
          <TooltipBadge
            label={`${tooltipMensal.label} ${anoGrafico}`}
            valor={tooltipMensal.valor}
            cor="#60a5fa"
            onClose={() => setTooltipMensal(null)}
          />
        )}
        {!tooltipMensal && (
          <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#334155', textAlign: 'center' }}>
            Toque em uma barra para ver o valor
          </p>
        )}
      </div>

      {/* ── Accordion Evolução Anual ── */}
      <div style={accordionWrap}>
        <button
          onClick={() => { setMobileAccordion(prev => prev === 'anual' ? null : 'anual'); setTooltipAnual(null); }}
          style={accordionBtn}
        >
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>Evolução Anual</h3>
          <span style={{
            fontSize:   '16px',
            color:      '#64748b',
            transform:  mobileAccordion === 'anual' ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}>▾</span>
        </button>

        {mobileAccordion === 'anual' && (
          <div style={{ padding: '0 12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: '10px', height: '120px' }}>
              {chartAnual.map((item, idx) => {
                const h     = Math.max((item.Valor / maxAnual) * 90, item.Valor > 0 ? 3 : 0);
                const ativo = tooltipAnual?.idx === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setTooltipAnual(ativo ? null : { idx, label: item.name, valor: item.Valor })}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
                  >
                    <div style={{
                      width:        '100%',
                      maxWidth:     '44px',
                      height:       `${h}px`,
                      background:   ativo
                        ? 'linear-gradient(180deg,#a5f3fc 0%,#06b6d4 100%)'
                        : 'linear-gradient(180deg,#60a5fa 0%,#2563eb 100%)',
                      borderRadius: '4px 4px 0 0',
                      transition:   'height 0.5s ease, background 0.2s',
                      boxShadow:    ativo ? '0 0 12px rgba(6,182,212,0.6)' : 'none',
                    }} />
                    <span style={{ fontSize: '11px', color: ativo ? '#7dd3fc' : '#64748b', marginTop: '5px', fontWeight: 700 }}>
                      {item.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Tooltip tap anual */}
            {tooltipAnual ? (
              <TooltipBadge
                label={tooltipAnual.label}
                valor={tooltipAnual.valor}
                cor="#60a5fa"
                onClose={() => setTooltipAnual(null)}
              />
            ) : (
              <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#334155', textAlign: 'center' }}>
                Toque em um ano para ver o total
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Accordion Comparação Anual ── */}
      <div style={accordionWrap}>
        <button
          onClick={() => { setMobileAccordion(prev => prev === 'comparacao' ? null : 'comparacao'); setTooltipComp(null); }}
          style={accordionBtn}
        >
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>Comparação Anual</h3>
          <span style={{
            fontSize:   '16px',
            color:      '#64748b',
            transform:  mobileAccordion === 'comparacao' ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}>▾</span>
        </button>

        {mobileAccordion === 'comparacao' && (
          <div style={{ padding: '0 12px 14px' }}>
            {/* Filtro de anos */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', flexWrap: 'wrap' }}>
              {ANOS.map(ano => {
                const sel = anosComp.includes(ano);
                return (
                  <button key={ano} onClick={() => { toggleAnoComp(ano); setTooltipComp(null); }} style={{
                    display:         'flex',
                    alignItems:      'center',
                    gap:             '3px',
                    padding:         '3px 8px',
                    borderRadius:    '9999px',
                    border:          '1px solid',
                    borderColor:     sel ? COR_ANOS[ano] : '#334155',
                    backgroundColor: sel ? COR_ANOS[ano] + '22' : 'transparent',
                    color:           sel ? COR_ANOS[ano] : '#475569',
                    fontSize:        '10px',
                    fontWeight:      700,
                    cursor:          'pointer',
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '2px', backgroundColor: sel ? COR_ANOS[ano] : '#334155', display: 'inline-block' }} />
                    {ano}
                  </button>
                );
              })}
            </div>

            {/* Barras agrupadas por mês — toque para ver valor */}
            {(() => {
              const anosAtivos = [...anosComp].sort((a, b) => Number(a) - Number(b));
              const maxVal     = Math.max(...chartComparacao.flatMap(d => anosAtivos.map(a => d[a] || 0)), 1);
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '2px', height: '120px', padding: '0 2px' }}>
                    {chartComparacao.map((row, mi) => {
                      const ativoMes = tooltipComp?.mes === mi + 1;
                      return (
                        <div key={mi} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1px', height: '95px' }}>
                            {anosAtivos.map(ano => {
                              const val    = row[ano] || 0;
                              const h      = Math.max((val / maxVal) * 80, val > 0 ? 2 : 0);
                              const ativoItem = tooltipComp?.mes === mi + 1 && tooltipComp?.ano === ano;
                              return (
                                <div
                                  key={ano}
                                  onClick={() => setTooltipComp(ativoItem ? null : { mes: mi + 1, ano, valor: val })}
                                  style={{
                                    width:           `${Math.max(16 / anosAtivos.length, 3)}px`,
                                    minWidth:        '3px',
                                    height:          `${h}px`,
                                    backgroundColor: COR_ANOS[ano],
                                    borderRadius:    '2px 2px 0 0',
                                    transition:      'height 0.4s ease, filter 0.2s',
                                    filter:          ativoItem ? 'brightness(1.5) saturate(1.3)' : 'brightness(1)',
                                    boxShadow:       ativoItem ? `0 0 8px ${COR_ANOS[ano]}99` : 'none',
                                  }}
                                />
                              );
                            })}
                          </div>
                          <span style={{ fontSize: '8px', color: ativoMes ? '#f1f5f9' : '#475569', marginTop: '3px', fontWeight: 700 }}>
                            {MESES[mi].substring(0, 3)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tooltip tap comparação */}
                  {tooltipComp ? (
                    <TooltipBadge
                      label={`${MESES[tooltipComp.mes - 1]} ${tooltipComp.ano}`}
                      valor={tooltipComp.valor}
                      cor={COR_ANOS[tooltipComp.ano] || '#60a5fa'}
                      onClose={() => setTooltipComp(null)}
                    />
                  ) : (
                    <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#334155', textAlign: 'center' }}>
                      Toque em uma barra para ver o valor
                    </p>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function PaginaRendimentos() {

  const {
    rendimentos,
    loading,
    getRendimentos,
    detalheMensal,
    detalheAnual,
    comparacaoAnual,
    getGrafico,
    getComparacaoAnual,
    deleteRendimento,
    loadingDelete,
    cardsRendimentos,
    loadingCards,
    getCardsRendimentos,
    criarRendimento,
    marcarComoReinvestido,
    importarB3,
    loadingImport,
  } = useRendimentos();

  const isMobile = useIsMobile();
  const [filtroAtivo, setFiltroAtivo] = useState('Todos');
  const [filtroMes, setFiltroMes] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [filtroAno, setFiltroAno] = useState(String(new Date().getFullYear()));
  const [anoGrafico, setAnoGrafico] = useState(String(new Date().getFullYear()));
  const [tipoGrafico, setTipoGrafico] = useState('barras');
  const [anosComp, setAnosComp] = useState(['2024', '2025', '2026']);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalImportAberto, setModalImportAberto] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState(isMobile ? 'historico' : 'graficos');

  const [modalExclusao, setModalExclusao] = useState(false);
  const [rendimentoParaExcluir, setRendimentoParaExcluir] = useState(null);
  const [modalReinvestir, setModalReinvestir] = useState(false);
  const [rendimentoParaReinvestir, setRendimentoParaReinvestir] = useState(null);
  const [mobileAccordion, setMobileAccordion] = useState(null);

  // ─── Estados de importação B3 ───────────────────────────────────────────────
  const [etapaImport, setEtapaImport] = useState(null); // null | 'preview' | 'resultado'
  const [linhasImportPreview, setLinhasImportPreview] = useState([]);
  const [resultadoImport, setResultadoImport] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // idAtivo: 'Todos' → null (sem filtro); caso contrário busca o id pelo ticker
    const idAtivo = filtroAtivo === 'Todos'
      ? null
      : rendimentos.find(r => r.ticker === filtroAtivo)?.idAtivo ?? null;
    getRendimentos({ mes: filtroMes, ano: filtroAno, idAtivo });
  }, [filtroMes, filtroAno, filtroAtivo, getRendimentos]);

  useEffect(() => { getGrafico({ ano: anoGrafico }); }, [anoGrafico, getGrafico]);
  useEffect(() => { getComparacaoAnual({ anos: anosComp }); }, [anosComp, getComparacaoAnual]);

  // Busca os cards sempre que mudar mês, ano ou ativo selecionado
  useEffect(() => {
    const idAtivo = filtroAtivo === 'Todos'
      ? null
      : rendimentos.find(r => r.ticker === filtroAtivo)?.idAtivo ?? null;
    getCardsRendimentos({ mes: filtroMes, ano: filtroAno, idAtivo });
  }, [filtroMes, filtroAno, filtroAtivo, rendimentos, getCardsRendimentos]);

  // ─── Dados derivados ────────────────────────────────────────────────────────
  const ativos = useMemo(() => ['Todos', ...new Set(rendimentos.map(d => d.ticker))], [rendimentos]);
  const filtrados = useMemo(() => rendimentos.filter(d => filtroAtivo === 'Todos' || d.ticker === filtroAtivo), [rendimentos, filtroAtivo]);

  // Dados dos cards vindos do backend
  const cards = {
    totalPeriodo: cardsRendimentos?.totalPeriodo ?? 0,
    totalAcumulado: cardsRendimentos?.totalAcumulado ?? 0,
    totalCompras: cardsRendimentos?.totalCompras ?? 0,
    totalReinvestido: cardsRendimentos?.totalReinvestido ?? 0,
    aporteProprio: cardsRendimentos?.aporteProprio ?? 0,
    yieldOnCost12Meses: cardsRendimentos?.yieldOnCost12Meses ?? 0,
    retornoAcumulado: cardsRendimentos?.retornoAcumulado ?? 0,
    percProprio: cardsRendimentos?.percProprio ?? 0,
    percReinvestido: cardsRendimentos?.percReinvestido ?? 0,
  };

  const chartMensal = useMemo(() =>
    MESES.map((nome, mi) => {
      const item = detalheMensal.find(d => parseInt(d.mes) === mi + 1);
      return { name: nome, Valor: item ? parseFloat(item.totalRendimento) || 0 : 0 };
    }),
    [detalheMensal]);

  const chartAnual = useMemo(() =>
    ANOS.map(ano => {
      const item = detalheAnual.find(d => String(parseInt(d.ano)) === ano);
      return { name: ano, Valor: item ? parseFloat(item.totalRendimento) || 0 : 0 };
    }),
    [detalheAnual]);

  const chartComparacao = useMemo(() =>
    MESES.map((_, mi) => {
      const row = { mes: mi + 1 };
      anosComp.forEach(ano => {
        const item = comparacaoAnual.find(
          d => parseInt(d.mes) === mi + 1 && String(parseInt(d.ano)) === ano
        );
        row[ano] = item ? parseFloat(item.totalRendimento) || 0 : 0;
      });
      return row;
    }),
    [comparacaoAnual, anosComp]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleNovoRendimento = async (dados) => {
    // O hook `criarRendimento` pode não retornar um valor, então o `if(ok)` falhava.
    // A nova abordagem é envolver em try/catch. Se não houver erro, consideramos sucesso.
    // O hook é responsável por mostrar o toast de erro em caso de falha.
    try {
      await criarRendimento({
        idAtivo: dados.idAtivo,
        dtRendimento: dados.dtRendimento,
        valorRecebido: dados.valorRecebido,
        reinvestido: dados.reinvestido,
      });
      toastSuccess('Rendimento lançado com sucesso!');
      setModalAberto(false);
      getRendimentos({ mes: filtroMes, ano: filtroAno });
      getGrafico({ ano: anoGrafico });
    } catch (error) { /* O hook useRendimentos já deve tratar o toast de erro */ }
  };

  const abrirModalExclusao = (row) => {
    setRendimentoParaExcluir(row);
    setModalExclusao(true);
  };

  const confirmarExclusao = async () => {
    if (!rendimentoParaExcluir) return;
    const ok = await deleteRendimento(rendimentoParaExcluir.id);
    if (ok) {
      setModalExclusao(false);
      setRendimentoParaExcluir(null);
      getRendimentos({ mes: filtroMes, ano: filtroAno });
    }
  };

  const fecharModalExclusao = () => {
    setModalExclusao(false);
    setRendimentoParaExcluir(null);
  };

  const abrirModalReinvestir = (rendimento) => {
    if (foiReinvestido(rendimento.reinvestido)) {
      toastInfo('Este rendimento já está marcado como reinvestido.');
      return;
    }
    setRendimentoParaReinvestir(rendimento);
    setModalReinvestir(true);
  };

  const confirmarReinvestimento = () => {
    if (!rendimentoParaReinvestir) return;
    marcarComoReinvestido(rendimentoParaReinvestir.id);
    toastSuccess('Rendimento marcado como reinvestido nesta sessão.');
    setModalReinvestir(false);
    setRendimentoParaReinvestir(null);
  };

  const fecharModalReinvestir = () => {
    setModalReinvestir(false);
    setRendimentoParaReinvestir(null);
  };

  const handleReinvestir = (rendimento) => abrirModalReinvestir(rendimento);

  const toggleAnoComp = (ano) =>
    setAnosComp(prev =>
      prev.includes(ano) ? prev.filter(a => a !== ano) : [...prev, ano]
    );

  // ─── Handler de importação B3 ───────────────────────────────────────────────
  const handleArquivoB3 = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Limpa o input para permitir selecionar o mesmo arquivo novamente
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        // Filtra apenas linhas: Entrada/Saída = "Credito" ou "Crédito" e Movimentação = "Rendimento"
        const linhasFiltradas = json.filter(row => {
          const entradaSaida = String(row['Entrada/Saída'] || '').trim();
          const movimentacao = String(row['Movimentação'] || row['Movimentacao'] || '').trim();
          return (
            (entradaSaida.toLowerCase() === 'credito' || entradaSaida.toLowerCase() === 'crédito') &&
            movimentacao.toLowerCase() === 'rendimento'
          );
        });

        if (linhasFiltradas.length === 0) {
          toastInfo('Nenhuma linha de rendimento (Crédito + Rendimento) encontrada no arquivo.');
          return;
        }

        // Mapeia para o formato esperado pelo backend
        const linhasMapeadas = linhasFiltradas.map(row => {
          // Extrai ticker do campo Produto (ex: "ALZR11 - ALIANZA TRUST..." → "ALZR11")
          const produto = String(row['Produto'] || '');
          const ticker = produto.split(' - ')[0].trim().split(' ')[0].trim();

          // Converte data DD/MM/AAAA → YYYY-MM-DD
          const dataRaw = String(row['Data'] || '');
          let dtRendimento = dataRaw;
          if (dataRaw.includes('/')) {
            const partes = dataRaw.split('/');
            if (partes.length === 3) {
              dtRendimento = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
            }
          }

          // Valor da Operação — pode vir como número ou string com R$
          let valorRaw = row['Valor da Operação'] ?? row['Valor da Operacao'] ?? 0;
          if (typeof valorRaw === 'string') {
            valorRaw = valorRaw.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim();
          }
          const valorRecebido = parseFloat(valorRaw) || 0;

          return { ticker, dtRendimento, valorRecebido };
        }).filter(l => l.ticker && l.valorRecebido > 0);

        if (linhasMapeadas.length === 0) {
          toastInfo('Nenhuma linha válida encontrada após o processamento.');
          return;
        }

        setLinhasImportPreview(linhasMapeadas);
        setEtapaImport('preview');
      } catch (err) {
        console.error('Erro ao ler arquivo Excel:', err);
        toastError('Erro ao ler o arquivo. Verifique se é um Excel válido (.xlsx).');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const confirmarImportacaoB3 = async () => {
    const resultado = await importarB3(linhasImportPreview);
    if (resultado) {
      setResultadoImport(resultado);
      setEtapaImport('resultado');
      // Recarrega os dados
      getRendimentos({ mes: filtroMes, ano: filtroAno });
      getGrafico({ ano: anoGrafico });
      getCardsRendimentos({ mes: filtroMes, ano: filtroAno });
    }
  };

  const fecharImportacao = () => {
    setModalImportAberto(false);
    setEtapaImport(null);
    setLinhasImportPreview([]);
    setResultadoImport(null);
  };

  // ─── Estilos dinâmicos (dependem de isMobile) ───────────────────────────────
  const cardBase = {
    backgroundColor: '#0f172a',
    borderRadius: '0.75rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
    border: '1px solid #1e293b',
    padding: isMobile ? '1rem' : '1.5rem',
    marginBottom: '1.5rem',
  };

  const cardSemMargem = { ...cardBase, marginBottom: 0 };

  const estiloMain = {
    maxWidth: '100%',
    margin: '0 auto',
    padding: isMobile ? '0.5rem 0' : '1rem 0.5rem',
  };

  const kpiPadding = isMobile ? '0.75rem' : '0.75rem 1.25rem';

  // Grid de 4 KPIs: 2x2 no mobile, 4 colunas no desktop
  const gridKpis = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
    gap: '10px',
  };

  const tituloGraficoMensal = {
    fontSize: isMobile ? '15px' : '18px',
    fontWeight: 700,
    color: '#f8fafc',
    margin: 0,
  };

  const gridDoisCards = {
    ...S.gridDoisCards,
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
  };

  // ─── Colunas da tabela (desktop) ────────────────────────────────────────────
  const colunasHistorico = [
    {
      titulo: 'Data',
      acesso: 'dtRendimento',
      width: '18%', render: (val) => new Date(val).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
    },
    {
      titulo: 'Ativo',
      acesso: 'ticker',
      width: '10%', render: (val) => <span style={S.tickerDesk}>{val}</span>,
    },
    {
      titulo: 'Segmento',
      acesso: 'nomeSeguimento',
      width: '20%',
      align: 'center',
      render: (val) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={S.badgeSegmentoDesk}>{val}</span>
        </div>
      ),
    },
    {
      titulo: 'Valor Recebido',
      acesso: 'valorRecebido',
      width: '25%',
      align: 'center',
      render: (val) => <span className="vp" style={S.valorDesk}>{fmt(Number(val))}</span>,
    },
    {
      titulo: 'Reinvestimento',
      acesso: 'reinvestido',
      width: '15%',
      align: 'center',
      render: (val) => <BadgeReinvestido valor={val} />,
    },
  ];


  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div style={S.paginaRaiz}>
        <main style={estiloMain}>

          {/* ── Header ── */}
          <header style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}>
              <FiDollarSign size={20} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>Rendimentos</h1>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Proventos recebidos e histórico de reinvestimentos</p>
            </div>
          </header>

          {/* ── KPIs ── */}
          <div style={cardBase}>
            <div style={gridKpis}>

              {/* Card 1 — Total Recebido */}
              <div style={{ ...S.kpiCard, padding: kpiPadding, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <p style={S.kpiLabelVerde}>Total Recebido</p>
                  <p className="vp" style={S.kpiValor('#34d399', isMobile)}>
                    {loadingCards ? '...' : fmt(cards.totalPeriodo)}
                  </p>
                </div>
                <p style={S.kpiSubInfo}>No período selecionado</p>
              </div>

              {/* Card 2 — Total Acumulado */}
              <div style={{ ...S.kpiCard, padding: kpiPadding, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <p style={S.kpiLabelAmarelo}>Total Acumulado</p>
                  <p className="vp" style={S.kpiValor('#fbbf24', isMobile)}>
                    {loadingCards ? '...' : fmt(cards.totalAcumulado)}
                  </p>
                </div>
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#fbbf24', fontSize: '11px', fontWeight: 700 }}>
                    Retorno:
                  </span>
                  <span className="vp" style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8' }}>
                    {loadingCards ? '...' : `${Number(cards.retornoAcumulado).toFixed(2)}%`}
                  </span>
                </div>
              </div>

              {/* Card 3 — Total Investido */}
              <div style={{ ...S.kpiCard, padding: kpiPadding, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <p style={S.kpiLabelAzul}>Total Investido</p>
                  <p className="vp" style={S.kpiValor('#7dd3fc', isMobile)}>
                    {loadingCards ? '...' : fmt(cards.totalCompras)}
                  </p>
                </div>
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#38bdf8', fontSize: '11px', fontWeight: 700 }}>
                    YoC (12m)
                  </span>
                  <span className="vp" style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8' }}>
                    {loadingCards ? '...' : `${Number(cards.yieldOnCost12Meses).toFixed(2)}% a.a.`}
                  </span>
                </div>
              </div>

              <div style={{ ...S.kpiCard, padding: kpiPadding, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <p style={S.kpiLabelRoxo}>Efeito Bola de Neve</p>
                  <p className="vp" style={S.kpiValor('#c4b5fd', isMobile)}>
                    {loadingCards ? '...' : fmt(cards.totalReinvestido)}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                    Proventos reinvestidos ({loadingCards ? '...' : `${Number(cards.percReinvestido).toFixed(1)}%`})
                  </p>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <div style={{
                    height: '8px',
                    width: '100%',
                    backgroundColor: '#1e293b',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                    display: 'flex'
                  }}>
                    <div style={{
                      height: '100%',
                      backgroundColor: '#64748b',
                      width: `${cards.percProprio}%`
                    }} title="Aporte do seu bolso" />
                    <div style={{
                      height: '100%',
                      backgroundColor: '#6366f1',
                      width: `${cards.percReinvestido}%`
                    }} title="Dinheiro gerado pelos fundos" />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
                    <span className="vp">Do seu bolso: {loadingCards ? '...' : fmt(cards.aporteProprio)}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ── Abas ── */}
          <nav style={S.nav}>
            {[
              { id: 'historico', label: '📋 Histórico' },
              { id: 'graficos', label: '📊 Gráficos' },
            ].map(({ id, label }) => {
              const ativa = abaAtiva === id;
              const estiloAba = {
                flex: 1,
                padding: '0.75rem 1rem',
                backgroundColor: ativa ? 'rgba(16,185,129,0.1)' : 'transparent',
                color: ativa ? '#10b981' : '#64748b',
                border: 'none',
                borderBottom: ativa ? '3px solid #10b981' : '3px solid transparent',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              };
              return (
                <button key={id} onClick={() => setAbaAtiva(id)} style={estiloAba}>
                  {label}
                </button>
              );
            })}
          </nav>

          {/* ── Aba Histórico ── */}
          {abaAtiva === 'historico' && (
            isMobile ? (
              /* ── MOBILE: cards ── */
              <div>
                <div style={{ ...S.mobileHeader, justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    onClick={() => setModalImportAberto(true)}
                    style={{ ...S.btnNovoMobile, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 2px 8px rgba(59,130,246,0.3)' }}
                    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(59,130,246,0.45)'; }}
                    onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(59,130,246,0.3)'; }}
                  >
                    <FiUpload size={15} /> Importar
                  </button>
                  <button
                    onClick={() => setModalAberto(true)}
                    style={S.btnNovoMobile}
                    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(16,185,129,0.45)'; }}
                    onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,185,129,0.3)'; }}
                  >
                    <FiPlus size={15} /> Novo Rendimento
                  </button>
                </div>

                <div style={S.filtrosMobileWrap}>
                  <select
                    value={filtroAtivo}
                    onChange={e => setFiltroAtivo(e.target.value)}
                    style={S.selectMobile}
                  >
                    {ativos.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>

                  <select
                    value={filtroMes}
                    onChange={e => setFiltroMes(e.target.value)}
                    style={S.selectMobile}
                  >
                    <option value="Todos">Todos</option>
                    {MESES.map((m, i) => (
                      <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>
                    ))}
                  </select>

                  <select
                    value={filtroAno}
                    onChange={e => setFiltroAno(e.target.value)}
                    style={{ ...S.selectMobile, flex: 'none', fontWeight: 600 }}
                  >
                    {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Carregando...
                  </div>
                ) : filtrados.length === 0 ? (
                  <div style={S.estadoVazioMobile}>
                    Nenhum rendimento encontrado.
                  </div>
                ) : (
                  <div style={S.listaCardsMobile}>
                    {filtrados.map((r, i) => (
                      <div key={r.id ?? i} style={S.cardRendimento}>
                        <div style={S.cardLinha1}>
                          <div style={S.cardLinha1Esq}>
                            <span style={S.cardTicker}>{r.ticker}</span>
                            <span style={S.badgeSegmentoMobile}>{r.nomeSeguimento}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => abrirModalReinvestir(r)}
                              style={{
                                background: 'rgba(16,185,129,0.1)',
                                border: '1px solid rgba(16,185,129,0.2)',
                                borderRadius: '7px',
                                padding: '6px 8px',
                                cursor: 'pointer',
                                color: '#34d399',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              title="Reinvestir"
                            >
                              <FiRepeat size={14} />
                            </button>
                            <button onClick={() => abrirModalExclusao(r)} style={S.btnLixeiraMobile}>
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div style={S.cardLinha2}>
                          <span style={S.cardData}>
                            {new Date(r.dtRendimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                          </span>
                          <span className="vp" style={S.cardValor}>
                            + {fmt(Number(r.valorRecebido))}
                          </span>
                        </div>
                        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <BadgeReinvestido valor={r.reinvestido} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* ── DESKTOP: tabela ── */
              <DataCard
                labelpesquisa="Buscar ativo, segmento..."
                botaoLabel="Novo Rendimento"
                onBotaoClick={() => setModalAberto(true)}
                botaoExtra={
                  <button
                    onClick={() => setModalImportAberto(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      background: 'rgba(59,130,246,0.1)',
                      border: '1px solid rgba(59,130,246,0.3)',
                      color: '#60a5fa',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(59,130,246,0.35)';
                      e.currentTarget.style.background = 'rgba(59,130,246,0.2)';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
                    }}
                  >
                    <FiUpload size={14} /> Importar Excel
                  </button>
                }
                filtros={
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                      value={filtroAtivo}
                      onChange={e => setFiltroAtivo(e.target.value)}
                      style={S.select}
                    >
                      {ativos.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <select
                      value={filtroMes}
                      onChange={e => setFiltroMes(e.target.value)}
                      style={S.select}
                    >
                      <option value="Todos">Todos</option>
                      {MESES.map((m, i) => (
                        <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>
                      ))}
                    </select>
                    <select
                      value={filtroAno}
                      onChange={e => setFiltroAno(e.target.value)}
                      style={{ ...S.select, fontWeight: 600 }}
                    >
                      {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                }
                coluna={colunasHistorico}
                data={loading ? [] : filtrados}
                itemsPerPage={10}
                usaReinvestir
                acaoReinvestir={abrirModalReinvestir}
                usaExcluir
                acaoExcluir={abrirModalExclusao}
              />
            )
          )}

          {/* ── Aba Gráficos ── */}
          {abaAtiva === 'graficos' && (
            isMobile ? (
              /* ── MOBILE: gráficos com tap interativo ── */
              <MobileGraficos
                chartMensal={chartMensal}
                chartAnual={chartAnual}
                chartComparacao={chartComparacao}
                tipoGrafico={tipoGrafico}
                setTipoGrafico={setTipoGrafico}
                anoGrafico={anoGrafico}
                setAnoGrafico={setAnoGrafico}
                anosComp={anosComp}
                toggleAnoComp={toggleAnoComp}
                mobileAccordion={mobileAccordion}
                setMobileAccordion={setMobileAccordion}
              />
            ) : (
              /* ── DESKTOP: gráficos completos ── */
              <>
                <div style={cardBase}>
                  <div style={S.graficoMensalHeader}>
                    <h2 style={tituloGraficoMensal}>Rendimentos por Mês</h2>
                    <div style={S.graficoControles}>
                      <div style={S.toggleTipoGrafico}>
                        {['barras', 'area'].map(tipo => {
                          const ativo = tipoGrafico === tipo;
                          const estiloBtnTipo = {
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '6px 10px',
                            backgroundColor: ativo ? '#0f172a' : 'transparent',
                            color: ativo ? '#10b981' : '#64748b',
                            borderRadius: '0.375rem',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontSize: '12px',
                            fontWeight: 600,
                          };
                          return (
                            <button key={tipo} onClick={() => setTipoGrafico(tipo)} style={estiloBtnTipo}>
                              {tipo === 'barras' ? '▊ Barras' : '〜 Área'}
                            </button>
                          );
                        })}
                      </div>
                      <select
                        value={anoGrafico}
                        onChange={e => setAnoGrafico(e.target.value)}
                        style={{ ...S.select, appearance: 'none' }}
                      >
                        {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>

                  {tipoGrafico === 'barras'
                    ? <GraficoMensalBarras data={chartMensal} />
                    : <AreaChart data={chartMensal} keys={CHART_KEYS} colors={AREA_COLORS} height={160} />
                  }
                </div>

                <div style={gridDoisCards}>
                  <div style={cardSemMargem}>
                    <h2 style={S.tituloCard}>Evolução Anual</h2>
                    <EvolucaoAnualChart data={chartAnual} />
                  </div>

                  <div style={cardSemMargem}>
                    <div style={S.comparacaoHeader}>
                      <h2 style={S.tituloCardSemMargem}>Comparação Anual</h2>
                      <div style={S.comparacaoBotoesAnos}>
                        {ANOS.map(ano => {
                          const selecionado = anosComp.includes(ano);
                          const estiloBtnAno = {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            border: '1px solid',
                            borderColor: selecionado ? COR_ANOS[ano] : '#334155',
                            backgroundColor: selecionado ? COR_ANOS[ano] + '22' : 'transparent',
                            color: selecionado ? COR_ANOS[ano] : '#64748b',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          };
                          const estiloDot = {
                            width: '8px',
                            height: '8px',
                            borderRadius: '2px',
                            backgroundColor: selecionado ? COR_ANOS[ano] : '#334155',
                            display: 'inline-block',
                          };
                          return (
                            <button key={ano} onClick={() => toggleAnoComp(ano)} style={estiloBtnAno}>
                              <span style={estiloDot} />
                              {ano}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <BarChartHorizontal data={chartComparacao} anos={anosComp} />
                  </div>
                </div>
              </>
            )
          )}

        </main>

        <NovoRendimentoModal
          isOpen={modalAberto}
          onClose={() => setModalAberto(false)}
          onSuccess={handleNovoRendimento}
        />

        {/* ── Modal de exclusão ── */}
        {modalExclusao && rendimentoParaExcluir && (
          <div style={S.modalOverlay}>
            <div style={S.modalBox}>
              <h3 style={S.modalTitulo}>Excluir Rendimento</h3>
              <p style={S.modalDescricao}>Tem certeza que deseja excluir este rendimento?</p>

              <div style={S.modalDadosBox}>
                <p style={S.modalDadosLinha}>
                  <strong style={S.modalDadosLabel}>Ativo:</strong>{' '}
                  {rendimentoParaExcluir.ticker}
                </p>
                <p style={S.modalDadosLinha}>
                  <strong style={S.modalDadosLabel}>Data:</strong>{' '}
                  {new Date(rendimentoParaExcluir.dtRendimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                </p>
                <p style={S.modalDadosLinhaFinal}>
                  <strong style={S.modalDadosLabel}>Valor:</strong>{' '}
                  {fmt(Number(rendimentoParaExcluir.valorRecebido))}
                </p>
              </div>

              <div style={S.modalAcoes}>
                <button onClick={fecharModalExclusao} style={S.btnCancelarModal}>
                  Cancelar
                </button>
                <button
                  onClick={confirmarExclusao}
                  disabled={loadingDelete}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loadingDelete ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                    boxShadow: '0 4px 16px rgba(239,68,68,0.3)',
                    opacity: loadingDelete ? 0.7 : 1,
                  }}
                >
                  {loadingDelete ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        )}

        {modalReinvestir && rendimentoParaReinvestir && (
          <ModalConfirmacao
            isOpen={modalReinvestir}
            onClose={fecharModalReinvestir}
            onConfirm={confirmarReinvestimento}
            action="reinvestir"
            userName={rendimentoParaReinvestir.ticker}
          />
        )}

        {/* ── Input oculto para selecionar arquivo Excel ── */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleArquivoB3}
        />

        {/* ── Modal de escolha: tipo de importação ── */}
        {modalImportAberto && !etapaImport && (
          <div
            onClick={fecharImportacao}
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
                    Importar Rendimentos
                  </h2>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>
                    Escolha o formato do arquivo
                  </p>
                </div>
                <button
                  onClick={fecharImportacao}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #334155', borderRadius: '8px', color: '#64748b', cursor: 'pointer', padding: '6px 9px', fontSize: '14px', lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>

              {/* Opções */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                {/* Opção 1 — Padrão FIITrack */}
                <button
                  onClick={() => { fecharImportacao(); toastInfo('Em breve: importação pelo modelo FIITrack.'); }}
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

                {/* Opção 2 — Excel B3 (Rendimentos) */}
                <button
                  onClick={() => fileInputRef.current?.click()}
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
                      Excel B3 (Rendimentos)
                    </p>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0', lineHeight: 1.5 }}>
                      Importe o arquivo de proventos exportado pela B3. Detectamos os rendimentos automaticamente.
                    </p>
                  </div>
                </button>

              </div>
            </div>
          </div>
        )}

        {/* ── Modal de Preview — confirmar dados antes de importar ── */}
        {etapaImport === 'preview' && (
          <div
            onClick={fecharImportacao}
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
                width: '100%', maxWidth: '600px', maxHeight: '80vh',
                boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
                display: 'flex', flexDirection: 'column',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                    Confirmar Importação
                  </h2>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>
                    {linhasImportPreview.length} rendimento{linhasImportPreview.length !== 1 ? 's' : ''} encontrado{linhasImportPreview.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={fecharImportacao}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #334155', borderRadius: '8px', color: '#64748b', cursor: 'pointer', padding: '6px 9px', fontSize: '14px', lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>

              {/* Tabela de preview */}
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #334155' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>Ticker</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>Data</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#94a3b8', fontWeight: 600 }}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhasImportPreview.map((linha, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(51,65,85,0.5)' }}>
                        <td style={{ padding: '8px 12px', color: '#f8fafc', fontWeight: 700 }}>{linha.ticker}</td>
                        <td style={{ padding: '8px 12px', color: '#cbd5e1' }}>
                          {linha.dtRendimento.split('-').reverse().join('/')}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#34d399', fontWeight: 700 }}>
                          {fmt(linha.valorRecebido)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(16,185,129,0.08)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)', marginBottom: '1rem' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>Total</span>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#34d399' }}>
                  {fmt(linhasImportPreview.reduce((acc, l) => acc + l.valorRecebido, 0))}
                </span>
              </div>

              {/* Ações */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={fecharImportacao}
                  style={{
                    flex: 1, padding: '10px', background: 'transparent',
                    color: '#94a3b8', border: '1px solid #334155',
                    borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarImportacaoB3}
                  disabled={loadingImport}
                  style={{
                    flex: 1, padding: '10px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff', border: 'none', borderRadius: '8px',
                    cursor: loadingImport ? 'not-allowed' : 'pointer',
                    fontWeight: 600, fontSize: '14px',
                    boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
                    opacity: loadingImport ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  }}
                >
                  {loadingImport ? 'Importando...' : <><FiUpload size={14} /> Importar</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal de Resultado — resumo da importação ── */}
        {etapaImport === 'resultado' && resultadoImport && (
          <div
            onClick={fecharImportacao}
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
                width: '100%', maxWidth: '440px',
                boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
                textAlign: 'center',
              }}
            >
              <div style={{ marginBottom: '1.5rem' }}>
                <FiCheckCircle size={48} color="#10b981" style={{ marginBottom: '12px' }} />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Importação Concluída
                </h2>
              </div>

              {/* Resumo em cards */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '1.25rem' }}>
                <div style={{ flex: 1, padding: '14px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: '#34d399', margin: 0 }}>{resultadoImport.totalImportados}</p>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0', fontWeight: 600 }}>Importados</p>
                </div>
                {resultadoImport.totalDuplicados > 0 && (
                  <div style={{ flex: 1, padding: '14px', borderRadius: '10px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
                    <p style={{ fontSize: '22px', fontWeight: 800, color: '#f59e0b', margin: 0 }}>{resultadoImport.totalDuplicados}</p>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0', fontWeight: 600 }}>Duplicados</p>
                  </div>
                )}
                {resultadoImport.totalIgnorados > 0 && (
                  <div style={{ flex: 1, padding: '14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <p style={{ fontSize: '22px', fontWeight: 800, color: '#f87171', margin: 0 }}>{resultadoImport.totalIgnorados}</p>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0', fontWeight: 600 }}>Ignorados</p>
                  </div>
                )}
              </div>

              {/* Detalhes dos ignorados */}
              {resultadoImport.ignorados?.length > 0 && (
                <div style={{ textAlign: 'left', marginBottom: '1rem', padding: '12px', borderRadius: '8px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#f87171', margin: '0 0 6px' }}>Ativos não encontrados:</p>
                  {resultadoImport.ignorados.map((item, i) => (
                    <p key={i} style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0' }}>
                      <strong style={{ color: '#cbd5e1' }}>{item.ticker}</strong> — {item.motivo}
                    </p>
                  ))}
                </div>
              )}

              <button
                onClick={fecharImportacao}
                style={{
                  width: '100%', padding: '10px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff', border: 'none', borderRadius: '8px',
                  cursor: 'pointer', fontWeight: 600, fontSize: '14px',
                  boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
