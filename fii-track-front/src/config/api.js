import axios from 'axios';
import { toastError } from '../utils/responseUtils';

const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error('VITE_API_URL não está definido. Verifique seu arquivo .env');
}

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor de REQUEST — anexa o token em toda chamada automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de RESPONSE — padroniza respostas e trata erros
//exemplo de uso
/*
api.get('/usuarios')
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error(error);
  }
);
*/

api.interceptors.response.use(
  (response) => {
    // Se a resposta segue o padrão { success: true, message: "...", data: ... }
    // extrai automaticamente o data para simplificar consumo no front
    if (response.data?.success && response.data?.data !== undefined) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    const isLoginRoute = error.config?.url?.includes('/auth/login');

    // Só trata 401 se NÃO for a rota de login (evita loop)
    if (error.response?.status === 401 && !isLoginRoute) {
      const hadToken = !!error.config?.headers?.['Authorization'];

      localStorage.removeItem('token');

      // Só exibe o toast se havia um token na requisição —
      // evita mostrar "Sessão expirada" quando o usuário simplesmente não está logado
      if (hadToken) {
        toastError('Sessão expirada. Faça login novamente.');
      }

      window.dispatchEvent(new Event('unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;
