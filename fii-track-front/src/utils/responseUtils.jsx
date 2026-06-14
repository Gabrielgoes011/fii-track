/**
 * responseUtils.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Utilitário centralizado para tratamento de respostas HTTP e exibição de
 * notificações via react-toastify.
 *
 * USO:
 *   import { handleResponse, handleError, toastSuccess, toastInfo } from '../../utils/responseUtils';
 *
 *   // Em um catch de chamada axios:
 *   handleError(error);
 *
 *   // Em um then / após await:
 *   handleResponse(response);
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { toast } from 'react-toastify';

// ─────────────────────────────────────────────────────────────────────────────
// MENSAGENS PADRÃO POR STATUS HTTP
// Centralizadas aqui para facilitar manutenção e internacionalização futura.
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_MESSAGES = {
  // 2xx — Sucesso
  200: 'Operação realizada com sucesso!',
  201: 'Cadastro realizado com sucesso!',
  204: 'Registro removido com sucesso!',

  // 4xx — Erros do cliente
  400: 'Dados inválidos. Verifique as informações e tente novamente.',
  401: 'Sessão expirada. Faça login novamente.',
  403: 'Você não tem permissão para realizar esta ação.',
  404: 'Recurso não encontrado.',
  409: 'Conflito: registro já existe.',
  422: 'Não foi possível processar os dados enviados.',

  // 5xx — Erros do servidor
  500: 'Erro interno no servidor. Tente novamente mais tarde.',
  502: 'Serviço indisponível. Tente novamente em instantes.',
  503: 'Servidor temporariamente fora do ar.',

  // Sem conexão / timeout
  network: 'Sem conexão com o servidor. Verifique sua internet.',
  timeout: 'A requisição demorou demais. Tente novamente.',
  unknown: 'Ocorreu um erro inesperado.',
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS DIRETOS — use quando quiser disparar um toast manualmente
// ─────────────────────────────────────────────────────────────────────────────

/** Exibe toast de sucesso (verde) */
export const toastSuccess = (msg) => toast.success(msg || DEFAULT_MESSAGES[200]);

/** Exibe toast de erro (vermelho) */
export const toastError = (msg) => toast.error(msg || DEFAULT_MESSAGES.unknown);

/** Exibe toast de aviso (amarelo) */
export const toastWarn = (msg) => toast.warn(msg || 'Atenção!');

/** Exibe toast informativo (azul) */
export const toastInfo = (msg) => toast.info(msg || 'Informação.');

// ─────────────────────────────────────────────────────────────────────────────
// handleResponse — trata respostas de SUCESSO (2xx)
//
// Parâmetros:
//   response  — objeto de resposta do axios (res.data, res.status, etc.)
//   customMsg — mensagem personalizada (opcional); sobrescreve o padrão
//
// Exemplo:
//   const res = await api.post('/usuarios', payload);
//   handleResponse(res, 'Usuário criado!');
// ─────────────────────────────────────────────────────────────────────────────
export function handleResponse(response, customMsg = null) {
  const status = response?.status;

  // Mensagem: prioridade → customMsg → mensagem da API → padrão por status
  const msg =
    customMsg ||
    response?.data?.message ||
    response?.data?.mensagem ||
    DEFAULT_MESSAGES[status] ||
    DEFAULT_MESSAGES[200];

  if (status === 204) {
    // 204 No Content — sem body, mas operação ok
    toast.success(customMsg || DEFAULT_MESSAGES[204]);
    return;
  }

  if (status >= 200 && status < 300) {
    toast.success(msg);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// handleError — trata respostas de ERRO (4xx / 5xx / network)
//
// Parâmetros:
//   error     — objeto de erro capturado no catch (axios error)
//   customMsg — mensagem personalizada (opcional); sobrescreve o padrão
//
// Exemplo:
//   try { ... } catch (error) { handleError(error); }
// ─────────────────────────────────────────────────────────────────────────────
export function handleError(error, customMsg = null) {
  // Sem resposta HTTP do servidor
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      toast.error(customMsg || DEFAULT_MESSAGES.timeout);
    } else if (error.request) {
      // Requisição foi feita, mas o servidor não respondeu (rede, CORS, offline)
      toast.error(customMsg || DEFAULT_MESSAGES.network);
    } else {
      // Erro lançado no próprio front (ex: validação de formato da resposta)
      toast.error(customMsg || error.message || DEFAULT_MESSAGES.unknown);
    }
    return;
  }

  const status = error.response?.status;

  // Mensagem: prioridade → customMsg → campo "erro" da API → campo "error" → padrão por status
  const apiMsg =
    error.response?.data?.erro ||
    error.response?.data?.error ||
    error.response?.data?.message ||
    error.response?.data?.mensagem;

  const msg = customMsg || apiMsg || DEFAULT_MESSAGES[status] || DEFAULT_MESSAGES.unknown;

  // 401 — sessão expirada (o interceptor do api.js já redireciona,
  //        mas o toast pode ser disparado aqui também se necessário)
  if (status === 401) {
    toast.error(msg);
    return;
  }

  // 403 — sem permissão
  if (status === 403) {
    toast.warn(msg);
    return;
  }

  // 404 — não encontrado
  if (status === 404) {
    toast.warn(msg);
    return;
  }

  // 4xx — erros de validação / negócio
  if (status >= 400 && status < 500) {
    toast.warn(msg);
    return;
  }

  // 5xx — erros de servidor
  if (status >= 500) {
    toast.error(msg);
    return;
  }

  // Fallback genérico
  toast.error(msg);
}

// ─────────────────────────────────────────────────────────────────────────────
// handleApiCall — wrapper completo para chamadas axios
//
// Executa a chamada, trata sucesso e erro automaticamente.
//
// Parâmetros:
//   apiFn      — função async que retorna a promise axios
//   successMsg — mensagem de sucesso personalizada (opcional)
//   errorMsg   — mensagem de erro personalizada (opcional)
//
// Retorna:
//   { data, error } — data com o resultado ou error com o objeto de erro
//
// Exemplo:
//   const { data, error } = await handleApiCall(
//     () => api.post('/usuarios', payload),
//     'Usuário criado com sucesso!'
//   );
//   if (data) { ... atualiza estado ... }
// ─────────────────────────────────────────────────────────────────────────────
export async function handleApiCall(apiFn, successMsg = null, errorMsg = null) {
  try {
    const response = await apiFn();
    handleResponse(response, successMsg);
    return { data: response.data, error: null };
  } catch (error) {
    handleError(error, errorMsg);
    return { data: null, error };
  }
}
