import axios from 'axios';
import { toastError } from '../utils/responseUtils';

const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error('VITE_API_URL não está definido. Verifique seu arquivo .env');
}

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor de REQUEST — envia cookies de sessão e token JWT automaticamente
api.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Controle do refresh de sessão ────────────────────────────────────────────
// Garante que, mesmo com várias requisições falhando com 401 ao mesmo tempo,
// o /auth/refresh seja chamado UMA única vez. As demais aguardam a mesma promessa.
let refreshPromise = null;

// Faz logout local: limpa o token e avisa o app para redirecionar ao login.
function forcarLogout(mostrarToast) {
  localStorage.removeItem('token');
  if (mostrarToast) {
    toastError('Sessão expirada. Faça login novamente.');
  }
  window.dispatchEvent(new Event('unauthorized'));
}

// Chama /auth/refresh reaproveitando a promessa em andamento, se houver.
// Usa uma instância crua do axios para não recair nos interceptors deste arquivo.
function renovarSessao() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })
      .then((res) => {
        // A resposta segue o padrão { success, message, data:{ usuario, token } }
        const novoToken = res.data?.data?.token ?? res.data?.token ?? null;
        if (novoToken) {
          localStorage.setItem('token', novoToken);
        }
        return novoToken;
      })
      .finally(() => {
        // Libera para um próximo ciclo de refresh após concluir (sucesso ou falha)
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// Interceptor de RESPONSE — padroniza respostas e trata erros

api.interceptors.response.use(
  (response) => {
    // Se a resposta segue o padrão { success: true, message: "...", data: ... }
    // extrai automaticamente o data para simplificar consumo no front
    if (response.data?.success && response.data?.data !== undefined) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config || {};
    const url = originalRequest.url || '';

    // Rotas de autenticação não devem disparar o fluxo de refresh (evita loop):
    // login (credenciais inválidas) e o próprio refresh (sessão realmente expirou).
    const isAuthRoute =
      url.includes('/auth/login') || url.includes('/auth/refresh');

    const is401 = error.response?.status === 401;

    // Primeira falha 401 numa rota comum: tenta renovar a sessão e repetir.
    if (is401 && !isAuthRoute && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const novoToken = await renovarSessao();

        // Refresh bem-sucedido: repete a requisição original com o token novo.
        if (novoToken) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${novoToken}`;
        }
        return api(originalRequest);
      } catch {
        // Refresh falhou (refresh token expirado/ausente): logout de verdade.
        forcarLogout(true);
        return Promise.reject(error);
      }
    }

    // 401 numa rota de auth, ou já tentamos renovar e falhou de novo.
    if (is401 && !isAuthRoute) {
      const hadToken = !!originalRequest.headers?.['Authorization'];
      forcarLogout(hadToken);
    }

    return Promise.reject(error);
  }
);

export default api;
