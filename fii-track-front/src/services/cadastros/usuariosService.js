import api from '../../config/api';

export const usuariosService = {
  listarTodos: async (status = 'on') => {
    try {
      const res = await api.get(`/users?status=${status}`);
      return Array.isArray(res.data) ? res.data : [];
    } catch (error) { throw error; }
  },
  criar: async (usuarioData) => {
    try {
      const res = await api.post('/usuario/cadastrar', usuarioData);
      return res.data;
    } catch (error) { throw error; }
  },
  atualizar: async (id, usuarioData) => {
    try {
      const res = await api.put(`/users/update/${id}`, usuarioData);
      return res.data;
    } catch (error) { throw error; }
  },
  //#region - Inativa ou Reativa User
  
  inativarReativar: async (id) => {
    try {
      const res = await api.put(`/users/on-off/${id}`);
      return res.data;
    } catch (error) { throw error; }
  },
  //#endregion
  contar: async () => {
    try {
      const res = await api.get('/users/dash/count');
      return res.data;
    } catch (error) { throw error; }
  },
  deletar: async (id) => {
    try {
      const res = await api.delete(`/users/delete/${id}`);
      return res.data;
    } catch (error) { throw error; }
  }
};
