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

  // Retorna os dados do usuário logado derivados do token (fonte de verdade do "adm")
  // GET /auth/me — exige token válido; devolve { usuario }
  me: async () => {
    try {
      const res = await api.get('/auth/me');
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

  // Troca a senha do usuário logado
  // POST /perfil/trocar-senha
  trocarSenha: async ({ userId, senhaAtual, novaSenha }) => {
    try {
      const res = await api.post('/perfil/trocar-senha', { userId, senhaAtual, novaSenha });
      return res.data;
    } catch (error) {
      throw error;
    }
  },
};
