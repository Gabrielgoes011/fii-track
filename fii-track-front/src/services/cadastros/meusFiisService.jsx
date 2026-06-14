import api from '../../config/api';

export const meusFiisService = {
  // Listar todos os FIIs
  listarTodos: async () => {
    try {
      const res = await api.get('/meusFundos');
      if (!Array.isArray(res.data)) {
        return [];
      }
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  // Criar novo FII
  criar: async (fiiData) => {
    try {
      const res = await api.post('/meusFundos/cadastrar', fiiData);
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  // Atualizar FII
  atualizar: async (id, fiiData) => {
    try {
      const res = await api.put(`/meusFundos/editar/${id}`, fiiData);
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  // Excluir FII
  excluir: async (id) => {
    try {
      const res = await api.delete(`/meusFundos/deletar/${id}`);
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  // Contagem de FIIs
  contar: async () => {
    try {
      const res = await api.get('/meusFundos/contar');
      return res.data;
    } catch (error) {
      throw error;
    }
  }
};