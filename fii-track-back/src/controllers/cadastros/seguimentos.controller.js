import apiResponse from '../../utils/httpResponse.js';
import {
  listarSeguimentosService,
  contarSeguimentosService,
  cadastrarSeguimentoService,
  atualizarSeguimentoService,
  excluirSeguimentoService,
} from '../../services/cadastros/seguimentos.service.js';

//#region => Listar seguimentos
export async function listarSeguimentos(req, res) {
  try {
    const idUser = req.user.id;

    //chama service que lista os seguimentos do usuário
    const seguimentos = await listarSeguimentosService(idUser);

    //retorna os resultados
    return apiResponse.success(res, 'Seguimentos carregados com sucesso.', seguimentos);

  } catch (error) {
    console.error('Erro ao listar seguimentos na etapa do controller:', error);
    return apiResponse.error(res, 'Erro ao listar seguimentos.');
  }
}
//#endregion

//#region => Contar seguimentos
export async function contarSeguimentos(req, res) {
  try {
    const idUser = req.user.id;

    //chama service que conta os seguimentos do usuário
    const resultado = await contarSeguimentosService(idUser);

    //retorna o total
    return apiResponse.success(res, 'Contagem realizada com sucesso.', resultado);

  } catch (error) {
    console.error('Erro ao contar seguimentos na etapa do controller:', error);
    return apiResponse.error(res, 'Erro ao contar seguimentos.');
  }
}
//#endregion

//#region => Cadastrar seguimento
export async function cadastrarSeguimento(req, res) {
  try {
    const idUser = req.user.id;
    const { nome } = req.body;

    //validação básica no controller
    if (!nome) {
      return apiResponse.validationError(res, 'O campo nome não pode ser vazio.');
    }

    //chama service que cadastra o seguimento
    const novo = await cadastrarSeguimentoService(nome, idUser);

    //retorna sucesso com status 201
    return apiResponse.success(res, 'Seguimento cadastrado com sucesso!', novo, 201);

  } catch (error) {
    console.error('Erro ao cadastrar seguimento na etapa do controller:', error);

    //erros de negócio (duplicata, validação) voltam como 400
    if (error.message.includes('já cadastrado') || error.message.includes('vazio')) {
      return apiResponse.validationError(res, error.message);
    }

    return apiResponse.error(res, 'Erro ao cadastrar seguimento.');
  }
}
//#endregion

//#region => Atualizar seguimento
export async function updateSeguimento(req, res) {
  try {
    const idUser = req.user.id;
    const { idSeguimento, nome } = req.body;

    //validação básica no controller
    if (!idSeguimento) {
      return apiResponse.validationError(res, 'O ID do seguimento é obrigatório.');
    }
    if (!nome) {
      return apiResponse.validationError(res, 'O campo nome não pode ser vazio.');
    }

    //chama service que atualiza o seguimento
    const atualizado = await atualizarSeguimentoService(idSeguimento, nome, idUser);

    //retorna sucesso
    return apiResponse.success(res, 'Seguimento atualizado com sucesso!', atualizado);

  } catch (error) {
    console.error('Erro ao atualizar seguimento na etapa do controller:', error);

    //erro de negócio (não encontrado, ou é padrão do sistema)
    if (error.message.includes('não encontrado') || error.message.includes('vazio') || error.message.includes('padrão do sistema')) {
      return apiResponse.validationError(res, error.message);
    }

    return apiResponse.error(res, 'Erro ao atualizar seguimento.');
  }
}
//#endregion

//#region => Excluir seguimento
export async function deleteSeguimento(req, res) {
  try {
    const idUser = req.user.id;
    const idSeguimento = req.params.id;

    //validação básica no controller
    if (!idSeguimento) {
      return apiResponse.validationError(res, 'O ID do seguimento é obrigatório.');
    }

    //chama service que valida e exclui o seguimento
    const excluido = await excluirSeguimentoService(idSeguimento, idUser);

    //retorna sucesso
    return apiResponse.success(res, `Seguimento "${excluido.nome}" excluído com sucesso!`);

  } catch (error) {
    console.error('Erro ao excluir seguimento na etapa do controller:', error);

    //erro de negócio (não encontrado, ou tem ativos vinculados, ou é padrão do sistema)
    if (
      error.message.includes('não encontrado') ||
      error.message.includes('ativo(s) vinculado') ||
      error.message.includes('padrão do sistema')
    ) {
      return apiResponse.validationError(res, error.message);
    }

    return apiResponse.error(res, 'Erro ao excluir seguimento.');
  }
}
//#endregion
