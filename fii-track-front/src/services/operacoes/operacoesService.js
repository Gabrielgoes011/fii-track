import api from '../../config/api';

export const operacoesService = {

  // Lista operações filtradas por mês e ano
  listar: async ({ mes, ano }) => {
    try {
      const res = await api.post('/operacoes', { mes, ano });
      return Array.isArray(res.data) ? res.data : [];
    } catch (error) { throw error; }
  },

  // Carrega dados do gráfico por ano
  dadosGrafico: async ({ ano }) => {
    try {
      const res = await api.post('/carregaDadosGraficoOperacoes', { ano });
      return Array.isArray(res.data) ? res.data : [];
    } catch (error) { throw error; }
  },

  // Lança nova operação (compra ou venda)
  lancar: async (payload) => {
    try {
      const res = await api.post('/lancarOperacao', payload);
      return res.data;
    } catch (error) { throw error; }
  },

  // Exclui uma operação pelo id
  excluir: async (id) => {
    try {
      const res = await api.post('/excluirOperacao', { id });
      return res.data;
    } catch (error) { throw error; }
  },

  // Carrega lista de ativos para o dropdown
  listarAtivos: async () => {
    try {
      const res = await api.get('/ativosDropList');
      return Array.isArray(res.data) ? res.data : [];
    } catch (error) { throw error; }
  },
};
