import api from '../../config/api';

// ── Helpers ────────────────────────────────────────────────────────────────

// Monta os query params de período (de/ate) apenas quando informados.
// Aceita Date ou string ISO; ignora valores vazios/nulos.
function montarParams({ de, ate } = {}) {
  const params = {};
  if (de) params.de = de instanceof Date ? de.toISOString() : de;
  if (ate) params.ate = ate instanceof Date ? ate.toISOString() : ate;
  return params;
}

// O interceptor de response do `api` já desembrulha { success, data } -> res.data.
// Ainda assim garantimos que o retorno seja sempre um array.
function comoLista(data) {
  return Array.isArray(data) ? data : [];
}

// ── Serviço ──────────────────────────────────────────────────────────────────

export const historicoService = {
  // GET /historico/patrimonio?de&ate
  // Retorna a série de Snapshot_Geral do usuário (patrimônio ao longo do tempo).
  getHistoricoPatrimonio: async (periodo = {}) => {
    const res = await api.get('/historico/patrimonio', { params: montarParams(periodo) });
    return comoLista(res.data);
  },

  // GET /historico/cotacoes/:ticker?de&ate
  // Retorna a série histórica de preço de mercado de um ticker.
  getHistoricoTicker: async (ticker, periodo = {}) => {
    const tk = String(ticker || '').trim();
    const res = await api.get(`/historico/cotacoes/${encodeURIComponent(tk)}`, {
      params: montarParams(periodo),
    });
    return comoLista(res.data);
  },
};
