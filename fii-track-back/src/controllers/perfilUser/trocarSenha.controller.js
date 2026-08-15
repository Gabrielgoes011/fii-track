import apiResponse from '../utils/httpResponse.js';
import pgErrorHandler from '../utils/pgErrorHandler.js';
import {

} from '../services/perfilUser/trocarSenha.services.js';

//#region => Controller para trocar a senha do usuário
const trocarSenhaController = async (req, res) => {
  try {

    // Extrair o userId dos parâmetros da rota e as senhas do corpo da requisição
    const { userId } = req.params;
    const { senhaAtual, novaSenha } = req.body;

    // Chamar a função de serviço para trocar a senha
    const resultado = await trocarSenhaService(userId, senhaAtual, novaSenha);

    // Retornar uma resposta de sucesso
    return apiResponse.success(res, resultado);

  } catch (error) {

    // Tratar erros do PostgreSQL
    const pgError = pgErrorHandler(error);
    if (pgError) {
      return apiResponse.error(res, pgError);
    }
  }
}
//#endregion



export {
  trocarSenhaController
}





