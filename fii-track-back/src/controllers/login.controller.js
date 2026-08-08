import jwt from 'jsonwebtoken';
import apiResponse from '../utils/httpResponse.js';
import { autenticarUsuario, autenticarUsuarioCom2fa } from '../services/login.services.js';

//#region => Lógica para login
async function loginController(req, res) {
  try {
    const { email, password } = req.body;

    const resultado = await autenticarUsuario(email, password);

    if (resultado.requires2fa) {
      return apiResponse.success(res, 'Autenticação em duas etapas necessária.', {
        requires2fa: true,
        usuario: resultado.usuario,
      }, 200);
    }

    res.cookie('token', resultado.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60,
      path: '/',
    });

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
    const { email, password, codigo } = req.body;

    const resultado = await autenticarUsuarioCom2fa(email, password, codigo);

    res.cookie('token', resultado.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60,
      path: '/',
    });

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
//#endregion

export {
  loginController,
  login2faController
}
