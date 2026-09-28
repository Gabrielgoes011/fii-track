import apiResponse from '../../utils/httpResponse.js';
import pgErrorHandler from '../../utils/pgErrorHandler.js';
import { getDiversificacaoService } from './diversificacao.service.js';

//#region função obter a diversificação por segmento da carteira
async function getDiversificacaoController(req, res) {
  try {
    // O usuário vem do token (nunca do body).
    const idUser = req.user.id;

    // Calcula a exposição por segmento (atual vs meta).
    const resultado = await getDiversificacaoService(idUser);

    // Retorna a análise de diversificação.
    return apiResponse.success(res, 'Diversificação calculada com sucesso.', resultado);

  } catch (error) {
    console.error('Erro ao calcular a diversificação na etapa do controller:', error);
    const secureMessage = pgErrorHandler(error, 'Erro ao calcular a diversificação da carteira.');
    return apiResponse.error(res, secureMessage);
  }
}
//#endregion

export {
  getDiversificacaoController,
};
