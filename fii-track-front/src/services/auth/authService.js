import api from '../../config/api';

export const authService = {

  // Realiza o login e retorna { token, usuario }
  // POST /auth/login — sem autenticação
  login: async ({ email, password }) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  // Confirma o login quando o usuário tem 2FA ativo
  // POST /auth/login/2fa
  login2fa: async ({ email, password, codigo }) => {
    try {
      const res = await api.post('/auth/login/2fa', { email, password, codigo });
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  iniciar2fa: async () => {
    try {
      const res = await api.post('/2fa/iniciar');
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  confirmar2fa: async (codigo) => {
    try {
      const res = await api.post('/2fa/confirmar', { codigo });
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  desativar2fa: async () => {
    try {
      const res = await api.post('/2fa/desativar');
      return res.data;
    } catch (error) {
      throw error;
    }
  },
};
