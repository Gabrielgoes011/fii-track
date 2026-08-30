import api from '../../config/api';

export const controleAtivosService = {
  listar: async () => {
    const res = await api.post('/controle-ativos/listar');
    return res.data;
  },

  listarSegmentos: async () => {
    const res = await api.get('/controle-ativos/segmentos');
    return res.data;
  },

  listarAtivosPorSegmento: async (idSegmento) => {
    const res = await api.get(`/controle-ativos/segmentos/${idSegmento}/ativos`);
    return res.data;
  },

  salvarPrecoTeto: async (idAtivo, precoTeto) => {
    const res = await api.put(`/controle-ativos/preco-teto/${idAtivo}`, { precoTeto });
    return res.data;
  },

  salvarPercIdeal: async (idAtivo, percIdeal) => {
    const res = await api.put(`/controle-ativos/perc-ideal/${idAtivo}`, { percIdeal });
    return res.data;
  },

  adicionar: async (dados) => {
    const res = await api.post('/controle-ativos/adicionar', dados);
    return res.data;
  },
};
