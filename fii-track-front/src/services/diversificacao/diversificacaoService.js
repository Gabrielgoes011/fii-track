import api from '../../config/api';

export const diversificacaoService = {
  // Obtém a exposição da carteira por segmento (atual vs meta), calculada no backend.
  // Retorna: { valorTotal, totalSegmentos, maisConcentrado, foraDaMeta, segmentos[] }
  obter: async () => {
    const res = await api.post('/diversificacao');
    return res.data;
  },
};
