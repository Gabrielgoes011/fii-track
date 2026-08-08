import jwt from 'jsonwebtoken';
import apiResponse from '../utils/httpResponse.js';
import { openDb } from '../config/configDb.js';
import { autenticarUsuario } from '../services/login.services.js';

//#region => Lógica para login
async function loginController(req, res) {
  try {
    const { email, password } = req.body;

    // Chama service para autenticar
    const resultado = await autenticarUsuario(email, password);

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
    // Em caso de erro, captura e retorna resposta adequada
    return apiResponse.error(res,
      error.message, 401);
  };
}
//#endregion




export {
  loginController
}


