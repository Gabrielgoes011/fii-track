import apiResponse from '../../utils/httpResponse.js';
import pgErrorHandler from '../../utils/pgErrorHandler.js';
import {
  changePassService
} from '../../services/userProfile/changePass.service.js';

//#region => Controller para trocar a senha do usuário
const changePassController = async (req, res) => {
  try {

    // Extrair o userId dos parâmetros da rota e as senhas do corpo da requisição
    const { userId, senhaAtual, novaSenha } = req.body;

    // Chamar a função de serviço para trocar a senha
    const resultado = await changePassService(userId, senhaAtual, novaSenha);

    // Retornar uma resposta de sucesso
    return apiResponse.success(res, 'Senha alterada com sucesso.', resultado, 200);

  } catch (error) {

    const pgError = error && error.code ? pgErrorHandler(error) : null;
    if (pgError) {
      return apiResponse.error(res, pgError, 500);
    }

    return apiResponse.error(res, error.message || 'Ocorreu um erro inesperado.', 400);
  }
}
//#endregion



export {
  changePassController
}
