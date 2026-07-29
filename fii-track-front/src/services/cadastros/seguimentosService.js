import api from '../../config/api';

export const seguimentosService = {
  listarTodos: async () => {
    try {
      const res = await api.get('/seguimentos');
      if (!Array.isArray(res.data)) return [];
      return res.data;
    } catch (error) { throw error; }
  },
  criar: async (seguimentoData) => {
    try {
      const res = await api.post('/seguimentos', seguimentoData);
      return res.data;
    } catch (error) { throw error; }
  },
  atualizar: async (id, seguimento) => {
    try {
      const res = await api.put('/seguimentos/update', {
        idSeguimento: id,
        nome: seguimento.nome || seguimento
      });
      return res.data;
    } catch (error) { throw error; }
  },
  inativarReativar: async (id) => {
    try {
      const res = await api.put(`/seguimentos/inativaReativa/${id}`);
      return res.data;
    } catch (error) { throw error; }
  },
  excluir: async (id) => {
    try {
      const res = await api.delete(`/seguimentos/delete/${id}`);
      return res.data;
    } catch (error) { throw error; }
  },
  contar: async () => {
    try {
      const res = await api.get('/seguimentos/contar');
      return res.data;
    } catch (error) { throw error; }
  }
};
