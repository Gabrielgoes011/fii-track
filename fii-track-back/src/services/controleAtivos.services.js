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

    //chamada ao repositório para buscar os ativos do usuário por segmento
    const result = await getAtivosDropListRepo(idUser, idSegmento);

    // Retorna os resultados da query
    return result;

  } catch (error) {

    // Loga o erro no console para depuração
    console.error('Erro ao carregar ativos por segmento na etapa do service:', error);

    // Gera uma mensagem de erro segura para o usuário
    const secureMessage = pgErrorHandler(error, 'Erro ao carregar ativos por segmento.');

    // Lança o erro para ser tratado no controller
    throw new Error(secureMessage);
  }
}
//#endregion

//#region função adicionar ativo
async function addAtivoService(idUser, dados) {
  try {

    //chamada ao repositório para adicionar ativo
    const result = await addAtivoRepo(idUser, dados);

    // Retorna os resultados da query
    return result;

  } catch (error) {

    // Loga o erro no console para depuração
    console.error('Erro ao adicionar ativo na etapa do service:', error);

    // Gera uma mensagem de erro segura para o usuário
    const secureMessage = pgErrorHandler(error, 'Erro ao adicionar ativo.');

    // Lança o erro para ser tratado no controller
    throw new Error(secureMessage);
  }
}
//#endregion



export {
  getSegmentosDropListService,
  getAtivosDropListService,
  addAtivoService
};