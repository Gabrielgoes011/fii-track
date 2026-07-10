import api from '../../config/api';

export const authService = {

  // Realiza o login e retorna { token, usuario }
  // POST /auth/login — sem autenticação
  login: async ({ email, password }) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      // O interceptor do api.js já extrai o data do envelope { success, message, data }
      // Então res.data já é direto: { token, usuario }
      return res.data;
    } catch (error) {
      throw error;
    }
  },
};
