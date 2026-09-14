import api from '../../config/api';

export const controleAtivosService = {
  listar: async () => {
    const res = await api.post('/controle-ativos/listar');
    return res.data;
  },

  // Busca as cotações atuais dos ativos da carteira na brapi.dev (via backend).
  // Só deve ser chamada sob demanda (botão "Atualizar Cotações").
  atualizarCotacoes: async () => {
    const res = await api.post('/controle-ativos/cotacoes');
    // { cotacoes: { TICKER: {...} }, atualizadoEm: ISO,
    //   origem: 'brapi'|'cache'|'cache-fallback', ttlMinutos, proximaAtualizacaoEm: ISO }
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

  salvarPrecoTeto: async (idAtivo, precoTeto, modo = 'manual') => {
    const res = await api.put(`/controle-ativos/preco-teto/${idAtivo}`, { precoTeto, modo });
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

  excluir: async (idAtivo) => {
    const res = await api.delete(`/controle-ativos/${idAtivo}`);
    return res.data;
  },
};
