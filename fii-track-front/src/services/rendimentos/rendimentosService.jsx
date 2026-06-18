import api from '../../config/api';

export const rendimentosService = {
  // Listar rendimentos por ano (e opcionalmente mês)
  listar: async ({ mes, ano }) => {
    try {
      const res = await api.post('/rendimentos', { mes, ano });
      return Array.isArray(res.data) ? res.data : [];
    } catch (error) { throw error; }
  },

  // Carrega dados dos gráficos (mensal + anual) por ano
  dadosGrafico: async ({ ano }) => {
    try {
      const res = await api.post('/carregarGraficoDashboard', { ano });
      return res.data; // { detalheMensal: [], detalheAnual: [] }
    } catch (error) { throw error; }
  },

  // Carrega ativos para o dropdown do modal (id + ticker + nomeSeguimento)
  carregarAtivosModal: async () => {
    try {
      const res = await api.get('/carregarDadosModalNovoRendimento');
      return Array.isArray(res.data) ? res.data : [];
      // retorna: [{ id, ticker, nomeSeguimento }]
    } catch (error) { throw error; }
  },
  comparacaoAnual: async ({ anos }) => {
    try {
      const res = await api.post('/carregarComparacaoAnual', { anos });
      return Array.isArray(res.data) ? res.data : [];
      // retorna: [{ mes, ano, totalRendimento }]
    } catch (error) { throw error; }
  },

  // Excluir um rendimento pelo seu ID
  excluir: async (id) => {
    try {
      const res = await api.delete(`/rendimentos/${id}`);
      return res.data;
    } catch (error) { throw error; }
  },

  // Carregar dados dos cards de KPIs (totalPeriodo, totalAcumulado, YoC, bola de neve…)
  cardsRendimentos: async ({ mes, ano, idAtivo }) => {
    try {
      const res = await api.post('/cardsRendimentos', { mes, ano, idAtivo: idAtivo || null });
      return res.data; // { totalPeriodo, totalAcumulado, totalCompras, totalReinvestido, aporteProprio, yieldOnCost, percProprio, percReinvestido }
    } catch (error) { throw error; }
  },
};
