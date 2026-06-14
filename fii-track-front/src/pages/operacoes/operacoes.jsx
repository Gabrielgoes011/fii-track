import React, { useState, useEffect } from 'react';
import { AiOutlineBarChart, AiOutlineAreaChart } from 'react-icons/ai';
import NovaOperacaoModal from './components/modalNovaOperacao';
import { BarChart, AreaChart } from '../../components/Charts';
import { useOperacoes } from '../../hooks/operacoes/useOperacoes';
import { DataCard } from '../../components/DataCard';
import SlideModal from '../../components/SlideModal/SlideModal';
import { FiAlertTriangle } from 'react-icons/fi';

const CHART_KEYS   = ['Compra', 'Venda', 'Liquido'];
const CHART_COLORS = {
  Compra:  'linear-gradient(180deg,#4ade80 0%,#16a34a 100%)',
  Venda:   'linear-gradient(180deg,#f87171 0%,#dc2626 100%)',
  Liquido: 'linear-gradient(180deg,#60a5fa 0%,#2563eb 100%)',
};
const AREA_COLORS = { Compra: '#22c55e', Venda: '#ef4444', Liquido: '#3b82f6' };

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function PaginaOperacoes() {
  const [anoSelecionado, setAnoSelecionado] = useState('2026');
  const [mesSelecionado, setMesSelecionado] = useState('Todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [tipoGrafico, setTipoGrafico] = useState('barras');
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);
  const [operacaoParaExcluir, setOperacaoParaExcluir] = useState(null);

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

  // ── definição das colunas com render customizado ──
  const colunasOperacoes = [
    {
      titulo: 'Data', acesso: 'data', width: '11%',
      render: (val) => <span style={{ whiteSpace: 'nowrap' }}>{val}</span>,
    },
    {
      titulo: 'Operação', acesso: 'operacao', width: '12%', align: 'center',
      render: (val) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', backgroundColor: val?.toUpperCase() === 'COMPRA' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: val?.toUpperCase() === 'COMPRA' ? '#10b981' : '#f87171', border: `1px solid ${val?.toUpperCase() === 'COMPRA' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
          {val}
        </span>
      ),
    },
    { titulo: 'Ativo',      acesso: 'ativo',     width: '10%', render: (val) => <span style={{ fontWeight: 700, color: '#f8fafc' }}>{val}</span> },
    {
      titulo: 'Seguimento', acesso: 'seguimento', width: '15%', align: 'center',
      render: (val) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500, backgroundColor: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)' }}>{val}</span>
        </div>
      ),
    },
    { titulo: 'Qtde',       acesso: 'qtde',      width: '8%',  align: 'center' },
    { titulo: 'Preço',      acesso: 'preco',     width: '12%', align: 'right',  render: (val) => fmt(val) },
    { titulo: 'Valor Total',acesso: 'valorTotal',width: '14%', align: 'right',  render: (val) => <span style={{ fontWeight: 600, color: '#f8fafc' }}>{fmt(val)}</span> },
  ];

  // monta valorTotal em cada linha para o render
  const operacoesComTotal = operacoes.map(op => ({ ...op, valorTotal: op.qtde * op.preco }));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b1120', color: '#f1f5f9', fontFamily: 'sans-serif' }}>
      
      <main style={{ maxWidth: '60rem', margin: '0 auto', padding: '1rem 0.5rem', marginTop: '0px' }}>
        
        {/* Seção do Gráfico */}
        <div style={{ backgroundColor: '#0f172a', borderRadius: '0.75rem', boxShadow: '0 4px 24px rgba(0,0,0,0.3)', border: '1px solid #1e293b', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>Total de Compras Por Mês</h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              
              {/* Toggle Tipo de Gráfico */}
              <div style={{ display: 'flex', backgroundColor: '#1e293b', padding: '4px', borderRadius: '0.5rem' }}>
                <button
                  onClick={() => setTipoGrafico('barras')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 10px',
                    backgroundColor: tipoGrafico === 'barras' ? '#0f172a' : 'transparent',
                    color: tipoGrafico === 'barras' ? '#10b981' : '#64748b',
                    borderRadius: '0.375rem', border: 'none', cursor: 'pointer',
                    boxShadow: tipoGrafico === 'barras' ? '0 1px 3px rgba(0,0,0,0.4)' : 'none',
                    transition: 'all 0.2s'
                  }}
                  title="Gráfico de Barras"
                >
                  <AiOutlineBarChart size={18} />
                </button>
                <button
                  onClick={() => setTipoGrafico('area')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 10px',
                    backgroundColor: tipoGrafico === 'area' ? '#0f172a' : 'transparent',
                    color: tipoGrafico === 'area' ? '#10b981' : '#64748b',
                    borderRadius: '0.375rem', border: 'none', cursor: 'pointer',
                    boxShadow: tipoGrafico === 'area' ? '0 1px 3px rgba(0,0,0,0.4)' : 'none',
                    transition: 'all 0.2s'
                  }}
                  title="Gráfico de Área"
                >
                  <AiOutlineAreaChart size={18} />
                </button>
              </div>
              
              {/* Divisória Vertical */}
              <div style={{ width: '1px', height: '24px', backgroundColor: '#334155', margin: '0 4px' }} />

              <label style={{ fontSize: '14px', fontWeight: 500, color: '#94a3b8' }}>ANO</label>
              <div style={{ position: 'relative' }}>
                <select 
                  value={anoSelecionado}
                onChange={(e) => setAnoSelecionado(e.target.value)}
                  style={{ appearance: 'none', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f1f5f9', fontWeight: 600, padding: '0.5rem 0.75rem 0.5rem 1rem', paddingRight: '2.5rem', borderRadius: '0.375rem', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                  <option value="2029">2029</option>
                  <option value="2030">2030</option>
                </select>
              </div>
            </div>
          </div>

          {tipoGrafico === 'barras' ? (
            <BarChart data={chartData} keys={CHART_KEYS} colors={CHART_COLORS} />
          ) : (
            <AreaChart data={chartData} keys={CHART_KEYS} colors={AREA_COLORS} />
          )}

          {/* Legenda */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem', fontSize: '14px', flexWrap: 'wrap', color: '#94a3b8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '16px', height: '16px', background: 'linear-gradient(180deg, #4ade80 0%, #16a34a 100%)', borderRadius: '4px', boxShadow: '0 2px 4px rgba(74,222,128,0.3)' }} />
              <span>Compra</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '16px', height: '16px', background: 'linear-gradient(180deg, #f87171 0%, #dc2626 100%)', borderRadius: '4px', boxShadow: '0 2px 4px rgba(248,113,113,0.3)' }} />
              <span>Venda</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '16px', height: '16px', background: 'linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)', borderRadius: '4px', boxShadow: '0 2px 4px rgba(96,165,250,0.3)' }} />
              <span>Líquido</span>
            </div>
          </div>
        </div>

        {/* Tabela de Operações */}
        <DataCard
          titulo="Registro de Operações"
          botaoLabel="Nova Operação"
          onBotaoClick={() => setModalAberto(true)}
          labelpesquisa="Buscar operações..."
          filtros={
            <select
              value={mesSelecionado}
              onChange={e => setMesSelecionado(e.target.value)}
              style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f1f5f9', fontSize: '14px', padding: '0.375rem 0.75rem', borderRadius: '0.375rem', outline: 'none', cursor: 'pointer' }}
            >
              <option value="Todos">Todos os meses</option>
              <option value="01">Janeiro</option>
              <option value="02">Fevereiro</option>
              <option value="03">Março</option>
              <option value="04">Abril</option>
              <option value="05">Maio</option>
              <option value="06">Junho</option>
              <option value="07">Julho</option>
              <option value="08">Agosto</option>
              <option value="09">Setembro</option>
              <option value="10">Outubro</option>
              <option value="11">Novembro</option>
              <option value="12">Dezembro</option>
            </select>
          }
          coluna={colunasOperacoes}
          data={loading ? [] : operacoesComTotal}
          itemsPerPage={10}
          usaExcluir
          acaoExcluir={abrirModalExclusao}
        />

      </main>
      
      <NovaOperacaoModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onSuccess={(payload) => handleLancarOperacao(payload, { ano: anoSelecionado, mes: mesSelecionado })}
      />
      
      {/* Modal de Confirmação de Exclusão */}
      <SlideModal
        isOpen={modalExclusaoAberto && !!operacaoParaExcluir}
        onClose={() => { setModalExclusaoAberto(false); setOperacaoParaExcluir(null); }}
        title="Excluir Operação"
        width="400px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', paddingTop: '4px' }}>
          {/* Ícone */}
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'rgba(192,57,43,0.15)',
            border: '1px solid rgba(192,57,43,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FiAlertTriangle size={22} color="#e74c3c" />
          </div>

          <p style={{ fontSize: '13px', color: '#8a9bb5', textAlign: 'center', lineHeight: 1.65, margin: 0 }}>
            Tem certeza que deseja excluir essa operação? Esta ação não pode ser desfeita.
          </p>

          {operacaoParaExcluir && (
            <div style={{
              width: '100%', padding: '12px 16px',
              background: '#0d1520', border: '1px solid #1e2d3d',
              borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '6px',
            }}>
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
              style={{
                flex: 1, padding: '9px', background: 'transparent',
                border: '1px solid #243040', color: '#7a8fa8',
                borderRadius: '8px', fontWeight: 600, fontSize: '13px',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = '#334d66'; e.currentTarget.style.color = '#cdd8e8'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = '#243040'; e.currentTarget.style.color = '#7a8fa8'; }}
            >
              Cancelar
            </button>
            <button
              onClick={confirmarExclusao}
              style={{
                flex: 1, padding: '9px',
                background: '#c0392b', border: '1px solid #c0392b',
                color: '#fff', borderRadius: '8px',
                fontWeight: 600, fontSize: '13px',
                boxShadow: '0 2px 8px rgba(192,57,43,0.35)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseOver={e => { e.currentTarget.style.background = '#e74c3c'; e.currentTarget.style.borderColor = '#e74c3c'; }}
              onMouseOut={e => { e.currentTarget.style.background = '#c0392b'; e.currentTarget.style.borderColor = '#c0392b'; }}
            >
              Excluir
            </button>
          </div>
        </div>
      </SlideModal>

    </div>
  );
}
