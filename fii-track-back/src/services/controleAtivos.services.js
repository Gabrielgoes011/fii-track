import pgErrorHandler from '../utils/pgErrorHandler.js';
import {
  getSegmentosDropListRepo,
  getAtivosDropListRepo,
} from '../repositories/controleAtivos.repository.js';

//#region função listar segmentos para o dropdown
async function getSegmentosDropListService(idUser) {
  try {

    // Abre a conexão com o banco de dados
    const result = await getSegmentosDropListRepo(idUser);

    // Retorna os resultados da query
    return result;

  } catch (error) {

    // Loga o erro no console para depuração
    console.error('Erro ao carregar segmentos para o dropdown na etapa do service:', error);

    // Gera uma mensagem de erro segura para o usuário
    const secureMessage = pgErrorHandler(error, 'Erro ao carregar segmentos para o dropdown.');

    // Lança o erro para ser tratado no controller
    throw new Error(secureMessage);
  }
}
//#endregion

//#region função listar ativos por segmento
async function getAtivosDropListService(idUser, idSegmento) {
  try {
    const result = await getAtivosDropListRepo(idUser, idSegmento);
    return result;
  } catch (error) {
    console.error('Erro ao carregar ativos por segmento na etapa do service:', error);
    const secureMessage = pgErrorHandler(error, 'Erro ao carregar ativos por segmento.');
    throw new Error(secureMessage);
  }
}
//#endregion

export {
  getSegmentosDropListService,
  getAtivosDropListService,
};