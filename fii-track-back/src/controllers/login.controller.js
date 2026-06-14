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

    // Retorna resposta HTTP com token e dados do usuário
    return apiResponse.success(res,
      resultado.usuario.defaultPassword
      ? 'Login bem-sucedido! Com senha padrão, por favor altere sua senha.' 
      : 'Login bem-sucedido!',
      resultado, 200, true);

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


