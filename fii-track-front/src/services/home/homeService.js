import api from '../../config/api';

export const homeService = {

  // Carrega os dados dos cards do dashboard
  // GET /home/cards — retorna { operacoes, fundos }
  carregarCards: async () => {
    try {
      const res = await api.get('/home/cards');
      return res.data;
    } catch (error) {
      throw error;
    }
  },
};
