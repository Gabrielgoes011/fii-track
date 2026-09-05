import jwt from 'jsonwebtoken';
import apiResponse from '../../utils/httpResponse.js';
import {
  autenticarUsuario,
  autenticarUsuarioCom2fa,
  obterUsuarioLogado,
  iniciar2faService,
  confirmar2faService,
  desativar2faService,
  validarCodigo2faService,
} from './login.service.js';

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

    // Grava o token em cookie httpOnly
    res.cookie('token', resultado.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60,
      path: '/',
    });

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
    return apiResponse.error(res, error.message, 401);
  }
}

async function login2faController(req, res) {
  try {
    // Pega email, senha e código 2FA do corpo da requisição
    const { email, password, codigo } = req.body;

    // Chama o service para validar senha + código TOTP e gerar o token
    const resultado = await autenticarUsuarioCom2fa(email, password, codigo);

    // Grava o token em cookie httpOnly
    res.cookie('token', resultado.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60,
      path: '/',
    });

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
    return apiResponse.error(res, error.message, 401);
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
    return apiResponse.error(res, error.message, 401);
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
    return apiResponse.error(res, error.message, 500);
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
    return apiResponse.error(res, error.message, 400);
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
    return apiResponse.error(res, error.message, 500);
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
    return apiResponse.error(res, error.message, 400);
  }
}
//#endregion

export {
  loginController,
  login2faController,
  meController,
  iniciar2faController,
  confirmar2faController,
  desativar2faController,
  validarCodigo2faController
}
