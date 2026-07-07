import api from '../../config/api';

export const rendimentosService = {
  // Listar rendimentos por ano, mês e opcionalmente idAtivo
  listar: async ({ mes, ano, idAtivo }) => {
    try {
      // 'Todos' ou vazio → null (sem filtro de mês/ativo)
      const mesSanitizado = !mes || mes === 'Todos' ? null : mes;
      const idAtivoSanitizado = idAtivo ? Number(idAtivo) : null;
      const res = await api.post('/rendimentos', { mes: mesSanitizado, ano, idAtivo: idAtivoSanitizado });
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

  // Criar novo rendimento
  criarRendimento: async ({ idAtivo, dtRendimento, valorRecebido }) => {
    try {
      const res = await api.post('/criarRendimento', { idAtivo, dtRendimento, valorRecebido });
      return res.data;
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
      // Sanitiza mes: 'Todos', null, undefined ou NaN → null (busca o ano inteiro)
      const mesSanitizado =
        !mes || mes === 'Todos' ? null : Number(mes);

      // Sanitiza idAtivo: 'Todos', null, undefined → null
      const idAtivoSanitizado =
        !idAtivo || idAtivo === 'Todos' ? null : Number(idAtivo);

      const res = await api.post('/cardsRendimentos', {
        mes: mesSanitizado,
        ano: Number(ano),
        idAtivo: idAtivoSanitizado,
      });
      return res.data;
    } catch (error) { throw error; }
  },
};
