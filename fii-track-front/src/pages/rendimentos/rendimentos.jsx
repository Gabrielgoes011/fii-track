import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, AreaChart } from '../../components/Charts';
import NovoRendimentoModal from './components/modalNovoRendimento';
import { useRendimentos } from '../../hooks/rendimentos/useRendimentos';
import { toastSuccess } from '../../utils/responseUtils';
import { DataCard } from '../../components/DataCard';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

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
const MOBILE_BP = 768;

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

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
  };

  const estiloColunaItem = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  };

  const estiloValorLabel = {
    fontSize: '11px',
    fontWeight: 700,
    color: '#94a3b8',
    marginBottom: '6px',
    whiteSpace: 'nowrap',
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
          transition: `height 0.7s cubic-bezier(0.34,1.56,0.64,1) ${idx * 0.08}s`,
        };

        return (
          <div key={idx} style={estiloColunaItem}>
            <span style={estiloValorLabel}>{fmt(item.Valor)}</span>
            <div style={estiloBarra} title={`${item.name}: ${fmt(item.Valor)}`} />
            <span style={estiloAnoLabel}>{item.name}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Gráfico de barras horizontais agrupadas ──────────────────────────────────
function BarChartHorizontal({ data, anos }) {
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
                const estiloBarra = {
                  height: '10px',
                  width: `${(val / max) * 100}%`,
                  minWidth: val > 0 ? '4px' : '0',
                  backgroundColor: COR_ANOS[ano],
                  borderRadius: '0 3px 3px 0',
                  transition: 'width 0.5s ease',
                };
                return (
                  <div key={ano} style={estiloLinhaAno}>
                    <div style={estiloBarra} title={`${ano}: ${fmt(val)}`} />
                    {val > 0 && <span style={estiloValorMini}>{fmt(val)}</span>}
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
  const apiResponse = {
    totalRecebidoPeriodo: 4850.25,
    totalAcumulado: 46837.41,
    totalInvestido: 125560.52,
    totalReinvestido: 18450.00,
    aporteProprio: 107110.52,
    yoc: 37.30,
    percProprio: 85.3,
    percReinvestido: 14.7
  };

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
    kpisOperacoes,       // { totalInvestido, totalReinvestido } — vem do backend quando implementado
  } = useRendimentos();

  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BP);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BP);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const [filtroAtivo, setFiltroAtivo] = useState('Todos');
  const [filtroMes, setFiltroMes] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [filtroAno, setFiltroAno] = useState(String(new Date().getFullYear()));
  const [anoGrafico, setAnoGrafico] = useState(String(new Date().getFullYear()));
  const [tipoGrafico, setTipoGrafico] = useState('barras');
  const [anosComp, setAnosComp] = useState(['2024', '2025', '2026']);
  const [modalAberto, setModalAberto] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState(isMobile ? 'historico' : 'graficos');

  const [modalExclusao, setModalExclusao] = useState(false);
  const [rendimentoParaExcluir, setRendimentoParaExcluir] = useState(null);

  useEffect(() => { getRendimentos({ mes: filtroMes, ano: filtroAno }); }, [filtroMes, filtroAno, getRendimentos]);
  useEffect(() => { getGrafico({ ano: anoGrafico }); }, [anoGrafico, getGrafico]);
  useEffect(() => { getComparacaoAnual({ anos: anosComp }); }, [anosComp, getComparacaoAnual]);

  // ─── Dados derivados ────────────────────────────────────────────────────────
  const ativos = useMemo(() => ['Todos', ...new Set(rendimentos.map(d => d.ticker))], [rendimentos]);
  const filtrados = useMemo(() => rendimentos.filter(d => filtroAtivo === 'Todos' || d.ticker === filtroAtivo), [rendimentos, filtroAtivo]);
  const totalRecebido = useMemo(() => filtrados.reduce((s, d) => s + Number(d.valorRecebido), 0), [filtrados]);
  const totalAcumulado = useMemo(() => rendimentos.reduce((s, d) => s + Number(d.valorRecebido), 0), [rendimentos]);

  // ── Dados que virão do backend (operações) — placeholder até a implementação ──
  // Quando o endpoint /kpis-rendimentos estiver pronto, substituir por chamada real.
  // Veja: DOCUMENTACAO_KPIs_RENDIMENTOS.md
  const totalInvestido = kpisOperacoes?.totalInvestido ?? 0;
  const totalReinvestido = kpisOperacoes?.totalReinvestido ?? 0;

  // YoC = total recebido no período / total investido * 100
  // Usa totalAcumulado como fallback enquanto totalInvestido não estiver disponível
  const baseYoC = totalInvestido > 0 ? totalInvestido : totalAcumulado;
  const yieldOnCost = baseYoC > 0
    ? ((totalAcumulado / baseYoC) * 100).toFixed(2)
    : '0.00';

  // % do total investido que veio de reinvestimento de proventos
  const pctReinvestido = totalInvestido > 0
    ? ((totalReinvestido / totalInvestido) * 100).toFixed(1)
    : '0.0';

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
  const handleNovoRendimento = () => {
    toastSuccess('Rendimento lançado com sucesso!');
    setModalAberto(false);
    getRendimentos({ mes: filtroMes, ano: filtroAno });
    getGrafico({ ano: anoGrafico });
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

  const toggleAnoComp = (ano) =>
    setAnosComp(prev =>
      prev.includes(ano) ? prev.filter(a => a !== ano) : [...prev, ano]
    );

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
    maxWidth: '60rem',
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
      width: '12%',
      render: (val) => new Date(val).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
    },
    {
      titulo: 'Ativo',
      acesso: 'ticker',
      width: '12%',
      render: (val) => <span style={S.tickerDesk}>{val}</span>,
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
      width: '15%',
      align: 'center',
      render: (val) => <span style={S.valorDesk}>{fmt(Number(val))}</span>,
    },
  ];


  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div style={S.paginaRaiz}>
        <main style={estiloMain}>

          {/* REMOVER BANER Banner indicador de desenvolvimento (fácil de remover) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '8px',
            padding: '8px 14px',
            marginBottom: '12px',
            color: '#fbbf24',
            fontSize: '12px',
            fontWeight: 500,
            fontFamily: "'Inter', sans-serif",
          }}>
            <span>🛠️ <strong>Cards em Desenvolvimento:</strong> Exibindo dados simulados (mock).</span>
          </div>

          {/* ── KPIs ── */}
          <div style={cardBase}>
            <div style={gridKpis}>

              {/* Card 1 — Total Recebido */}
              <div style={{ ...S.kpiCard, padding: kpiPadding, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <p style={S.kpiLabelVerde}>Total Recebido</p>
                  <p style={S.kpiValor('#34d399', isMobile)}>
                    {fmt(apiResponse.totalRecebidoPeriodo)}
                  </p>
                </div>
                <p style={S.kpiSubInfo}>no período selecionado</p>
              </div>

              {/* Card 2 — Total Acumulado */}
              <div style={{ ...S.kpiCard, padding: kpiPadding, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <p style={S.kpiLabelAmarelo}>Total Acumulado</p>
                  <p style={S.kpiValor('#fbbf24', isMobile)}>
                    {fmt(apiResponse.totalAcumulado)}
                  </p>
                </div>
                <p style={S.kpiSubInfo}>desde o início</p>
              </div>

              {/* Card 3 — Total Investido */}
              <div style={{ ...S.kpiCard, padding: kpiPadding, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <p style={S.kpiLabelAzul}>Total Investido</p>
                  <p style={S.kpiValor('#7dd3fc', isMobile)}>
                    {fmt(apiResponse.totalInvestido)}
                  </p>
                </div>
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                    color: '#38bdf8',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                  }}>
                    YoC
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8' }}>
                    {apiResponse.yoc.toFixed(2)}% a.a
                  </span>
                </div>
              </div>

              {/* Card 4 — Efeito Bola de Neve */}
              <div style={{ ...S.kpiCard, padding: kpiPadding, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <p style={S.kpiLabelRoxo}>Efeito Bola de Neve</p>
                  <p style={S.kpiValor('#c4b5fd', isMobile)}>
                    {fmt(apiResponse.totalReinvestido)}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                    gerado e reinvestido ({apiResponse.percReinvestido.toFixed(1)}%)
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
                      width: `${apiResponse.percProprio}%`
                    }} title="Aporte do seu bolso" />
                    <div style={{
                      height: '100%',
                      backgroundColor: '#6366f1',
                      width: `${apiResponse.percReinvestido}%`
                    }} title="Dinheiro gerado pelos fundos" />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
                    <span>Do seu bolso: {fmt(apiResponse.aporteProprio)}</span>
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
                <div style={{ ...S.mobileHeader, justifyContent: 'flex-end' }}>
                  <button onClick={() => setModalAberto(true)} style={S.btnNovoMobile}>
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
                          <button onClick={() => abrirModalExclusao(r)} style={S.btnLixeiraMobile}>
                            <FiTrash2 size={14} />
                          </button>
                        </div>

                        <div style={S.cardLinha2}>
                          <span style={S.cardData}>
                            {new Date(r.dtRendimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                          </span>
                          <span style={S.cardValor}>
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
                labelpesquisa="Buscar ativo, segmento..."
                botaoLabel="Novo Rendimento"
                onBotaoClick={() => setModalAberto(true)}
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
                usaExcluir
                acaoExcluir={abrirModalExclusao}
              />
            )
          )}

          {/* ── Aba Gráficos ── */}
          {abaAtiva === 'graficos' && (
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
                  ? <BarChart data={chartMensal} keys={CHART_KEYS} colors={CHART_COLORS} height={isMobile ? 100 : 150} />
                  : <AreaChart data={chartMensal} keys={CHART_KEYS} colors={AREA_COLORS} height={isMobile ? 110 : 160} />
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
      </div>
    </>
  );
}
