import apiResponse from '../../utils/httpResponse.js';
import pgErrorHandler from '../../utils/pgErrorHandler.js';
import {
  autenticarUsuario,
  autenticarUsuarioCom2fa,
  obterUsuarioLogado,
  renovarAccessToken,
  iniciar2faService,
  confirmar2faService,
  desativar2faService,
  validarCodigo2faService,
} from './login.service.js';

// Duração dos cookies (em ms). Devem espelhar as durações dos tokens no service.
const ACCESS_COOKIE_MAX_AGE = 1000 * 60 * 15;      // 15 minutos
const REFRESH_COOKIE_MAX_AGE = 1000 * 60 * 60 * 8; // 8 horas

// Opções base comuns a todos os cookies de autenticação.
function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };
}

// Grava o access token (cookie 'token') na resposta.
function setAccessCookie(res, token) {
  res.cookie('token', token, { ...baseCookieOptions(), maxAge: ACCESS_COOKIE_MAX_AGE });
}

// Grava o refresh token (cookie 'refreshToken') restrito à rota de refresh.
// O path mais estreito evita que o refresh token trafegue em toda requisição.
function setRefreshCookie(res, refreshToken) {
  res.cookie('refreshToken', refreshToken, {
    ...baseCookieOptions(),
    path: '/auth/refresh',
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
}

//#region => Lógica para login
async function loginController(req, res) {
  try {
    // Pega email e senha do corpo da requisição
    const { email, password } = req.body;

    // Chama o service para autenticar (pode devolver token ou exigir 2FA)
    const resultado = await autenticarUsuario(email, password);

    // Usuário tem 2FA ativo: interrompe aqui e pede o código na próxima etapa
    if (resultado.requires2fa) {
      return apiResponse.success(res, 'Autenticação em duas etapas necessária.', {
        requires2fa: true,
        usuario: resultado.usuario,
      }, 200);
    }

    // Grava access token e refresh token em cookies httpOnly
    setAccessCookie(res, resultado.token);
    setRefreshCookie(res, resultado.refreshToken);

    // Retorna usuário + token, avisando se a senha ainda é a padrão
    return apiResponse.success(res,
      resultado.usuario.defaultPassword
        ? 'Login bem-sucedido! Com senha padrão, por favor altere sua senha.'
        : 'Login bem-sucedido!',
      {
        usuario: resultado.usuario,
        token: resultado.token,
      },
      200,
      true);

  } catch (error) {
    console.error('Erro no login na etapa do controller:', error);
    const secureMessage = pgErrorHandler(error, 'Não foi possível realizar o login.');
    return apiResponse.error(res, secureMessage, 401);
  }
}

async function login2faController(req, res) {
  try {
    // Pega email, senha e código 2FA do corpo da requisição
    const { email, password, codigo } = req.body;

    // Chama o service para validar senha + código TOTP e gerar o token
    const resultado = await autenticarUsuarioCom2fa(email, password, codigo);

    // Grava access token e refresh token em cookies httpOnly
    setAccessCookie(res, resultado.token);
    setRefreshCookie(res, resultado.refreshToken);

    // Retorna usuário + token, avisando se a senha ainda é a padrão
    return apiResponse.success(res,
      resultado.usuario.defaultPassword
        ? 'Login 2FA bem-sucedido! Com senha padrão, por favor altere sua senha.'
        : 'Login 2FA bem-sucedido!',
      {
        usuario: resultado.usuario,
        token: resultado.token,
      },
      200,
      true);

  } catch (error) {
    console.error('Erro no login 2FA na etapa do controller:', error);
    const secureMessage = pgErrorHandler(error, 'Não foi possível concluir o login com 2FA.');
    return apiResponse.error(res, secureMessage, 401);
  }
}
// Retorna os dados do usuário logado, derivados do token (fonte de verdade do "adm").
// Usado pelo front no boot e após o login para hidratar o estado sem confiar no localStorage.
async function meController(req, res) {
  try {
    // req.user vem do verificaToken (token JWT já validado)
    const usuario = await obterUsuarioLogado(req.user.id);

    return apiResponse.success(res, 'Usuário autenticado.', { usuario }, 200);
  } catch (error) {
    console.error('Erro ao obter usuário logado na etapa do controller:', error);
    const secureMessage = pgErrorHandler(error, 'Não foi possível validar a sessão.');
    return apiResponse.error(res, secureMessage, 401);
  }
}

// Emite um novo access token a partir do refresh token (cookie httpOnly).
// Permite renovar a sessão sem pedir senha enquanto o refresh token for válido.
async function refreshController(req, res) {
  try {
    // Prioriza o cookie; aceita o body como fallback para clientes sem cookie
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    const resultado = await renovarAccessToken(refreshToken);

    // Grava o novo access token no cookie
    setAccessCookie(res, resultado.token);

    return apiResponse.success(res, 'Sessão renovada.', {
      usuario: resultado.usuario,
      token: resultado.token,
    }, 200);
  } catch (error) {
    console.error('Erro ao renovar a sessão na etapa do controller:', error);
    const secureMessage = pgErrorHandler(error, 'Não foi possível renovar a sessão.');
    return apiResponse.error(res, secureMessage, 401);
  }
}
//#endregion

//#region => Lógica para 2FA
async function iniciar2faController(req, res) {
  try {
    // Pega o id do usuário logado a partir do token
    const usuarioId = req.user.id;

    // Chama o service para gerar o segredo TOTP e o QR code
    const resultado = await iniciar2faService(usuarioId);

    // Retorna o QR code para o usuário escanear no app autenticador
    return apiResponse.success(res, 'QR code gerado com sucesso.', resultado, 200);
  } catch (error) {
    console.error('Erro ao iniciar 2FA na etapa do controller:', error);
    const secureMessage = pgErrorHandler(error, 'Não foi possível iniciar a configuração do 2FA.');
    return apiResponse.error(res, secureMessage, 500);
  }
}

async function confirmar2faController(req, res) {
  try {
    // Pega o id do usuário logado a partir do token
    const usuarioId = req.user.id;
    const { codigo } = req.body;

    // Valida se o código foi informado
    if (!codigo) {
      return apiResponse.validationError(res, 'O código 2FA é obrigatório.');
    }

    // Chama o service para validar o código e ativar o 2FA
    const resultado = await confirmar2faService(usuarioId, codigo);

    return apiResponse.success(res, '2FA ativado com sucesso.', resultado, 200);
  } catch (error) {
    console.error('Erro ao confirmar 2FA na etapa do controller:', error);
    const secureMessage = pgErrorHandler(error, 'Não foi possível ativar o 2FA.');
    return apiResponse.error(res, secureMessage, 400);
  }
}

async function desativar2faController(req, res) {
  try {
    // Pega o id do usuário logado a partir do token
    const usuarioId = req.user.id;

    // Chama o service para desativar o 2FA e limpar o segredo salvo
    const resultado = await desativar2faService(usuarioId);

    return apiResponse.success(res, '2FA desativado com sucesso.', resultado, 200);
  } catch (error) {
    console.error('Erro ao desativar 2FA na etapa do controller:', error);
    const secureMessage = pgErrorHandler(error, 'Não foi possível desativar o 2FA.');
    return apiResponse.error(res, secureMessage, 500);
  }
}

async function validarCodigo2faController(req, res) {
  try {
    // Pega o id do usuário logado a partir do token
    const usuarioId = req.user.id;
    const { codigo } = req.body;

    // Valida se o código foi informado
    if (!codigo) {
      return apiResponse.validationError(res, 'O código 2FA é obrigatório.');
    }

    // Chama o service para conferir o código TOTP
    const resultado = await validarCodigo2faService(usuarioId, codigo);

    return apiResponse.success(res, 'Código 2FA validado.', resultado, 200);
  } catch (error) {
    console.error('Erro ao validar código 2FA na etapa do controller:', error);
    const secureMessage = pgErrorHandler(error, 'Não foi possível validar o código 2FA.');
    return apiResponse.error(res, secureMessage, 400);
  }
}
//#endregion

export {
  loginController,
  login2faController,
  meController,
  refreshController,
  iniciar2faController,
  confirmar2faController,
  desativar2faController,
  validarCodigo2faController
}
