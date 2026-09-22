import apiResponse from '../../../utils/httpResponse.js';
import pgErrorHandler from '../../../utils/pgErrorHandler.js';
import {
  buscarPerfilService,
  atualizarPerfilService,
} from './meuPerfil.service.js';

//#region => Buscar o perfil do usuário logado
export async function getMeuPerfil(req, res) {
  try {
    //usa o id do token (nunca confia em id vindo do body para o próprio perfil)
    const idUser = req.user.id;

    //chama o service que busca o perfil
    const perfil = await buscarPerfilService(idUser);

    //retorna o perfil
    return apiResponse.success(res, 'Perfil carregado com sucesso.', perfil);

  } catch (error) {
    console.error('Erro ao buscar perfil na etapa do controller:', error);

    //perfil inexistente → 404
    if (error.message.includes('não encontrado')) {
      return apiResponse.notFound(res, error.message);
    }

    return apiResponse.error(res, 'Erro ao carregar o perfil.');
  }
}
//#endregion

//#region => Atualizar os dados cadastrais do próprio usuário
export async function updateMeuPerfil(req, res) {
  try {
    //usa o id do token — o usuário só edita o próprio perfil
    const idUser = req.user.id;
    const { nome, email, dataNascimento } = req.body;

    //chama o service que valida e atualiza o perfil
    const atualizado = await atualizarPerfilService(idUser, { nome, email, dataNascimento });

    //retorna o perfil atualizado
    return apiResponse.success(res, 'Perfil atualizado com sucesso.', atualizado);

  } catch (error) {
    console.error('Erro ao atualizar perfil na etapa do controller:', error);

    //perfil inexistente → 404
    if (error.message.includes('não encontrado')) {
      return apiResponse.notFound(res, error.message);
    }

    //email duplicado → 409 (conflito)
    if (error.message.includes('já está em uso')) {
      return apiResponse.conflict(res, error.message);
    }

    //erros de validação de campos → 400
    if (
      error.message.includes('vazio') ||
      error.message.includes('inválido') ||
      error.message.includes('não informado')
    ) {
      return apiResponse.validationError(res, error.message);
    }

    //erro de banco mapeado, se houver
    const pgError = error && error.code ? pgErrorHandler(error) : null;
    if (pgError) {
      return apiResponse.error(res, pgError);
    }

    return apiResponse.error(res, 'Erro ao atualizar o perfil.');
  }
}
//#endregion
