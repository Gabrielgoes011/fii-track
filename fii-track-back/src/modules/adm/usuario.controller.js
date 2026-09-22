import apiResponse from '../../utils/httpResponse.js';
import pgErrorHandler from '../../utils/pgErrorHandler.js';
import {
  listarUsuariosService,
  cadastrarUserService,
  countUserService,
  onOffUserService,
  atualizarUserService,
  deletarUserService,
  resetarSenhaService
} from "./usuarios.service.js";


//#region função listarUsuarios - lista usuarios (ativos/inativos)
async function listarUsuarios(req, res) {
  try {

    //verifica se o valor do parâmetro "status" é válido
    const parametro = req.query.status;

    //Chama a função do service para listar os usuários
    const usuarios = await listarUsuariosService(parametro);

    // Retorna os resultados da consulta em formato JSON
    apiResponse.success(res,
      'Usuários listados com sucesso!', usuarios, 200, true
    );
  } catch (error) {
    console.error('Erro ao listar usuários na etapa do controller:', error);
    const secureMessage = pgErrorHandler(error, error.message || 'Erro ao listar os usuários.');
    return apiResponse.error(res, secureMessage, 500);
  }
}
//#endregion

//#region função de contagem - contar usuarios - dashboard
async function contarUsuarios(req, res) {

  try {

    //chama a função do serviço para contar os usuários
    const countUser = await countUserService();

    // Retorna os resultados da consulta em formato JSON
    apiResponse.success(res,
      'Contagem de usuários realizada com sucesso!', countUser, 200, true
    );
  }
  catch (error) {
    console.error('Erro ao contar usuários na etapa do controller:', error);
    const secureMessage = pgErrorHandler(error, error.message || 'Erro ao contar os usuários.');
    return apiResponse.error(res, secureMessage, 500);
  }
}
//#endregion

//#region Função para cadastrar usuarios
async function cadastrarUser(req, res) {
  //recebe os dados do corpo da requisição
  const dados = req.body;
  //chama a função do serviço para cadastrar o usuário
  try {
    const cadastrarUser = await cadastrarUserService(dados);
    // Retorna os resultados da consulta em formato JSON
    apiResponse.success(res,
      'Usuário cadastrado com sucesso!', cadastrarUser, 201, true
    );
  } catch (error) {
    console.error('Erro ao cadastrar usuário na etapa do controller:', error);
    const secureMessage = pgErrorHandler(error, error.message || 'Erro ao cadastrar o usuário.');
    return apiResponse.error(res, secureMessage);
  }
}
//#endregion

//#region PUT - atualizar usuario
async function atualizarUser(req, res) {
  try {

    //pega o id da rota e os dados do corpo da requisição
    const id = req.params.id;
    const dados = req.body;

    //chama a função do serviço para atualizar o usuário
    const usuarioAtualizado = await atualizarUserService(id, dados);

    // Retorna os resultados da consulta em formato JSON
    apiResponse.success(res, 'Usuário atualizado com sucesso!', usuarioAtualizado, 200);
  } catch (error) {
    console.error('Erro ao atualizar usuário na etapa do controller:', error);
    const secureMessage = pgErrorHandler(error, error.message || 'Erro ao atualizar o usuário.');
    return apiResponse.error(res, secureMessage, 400);
  }
}
//#endregion

//#region - Inativa ou Reativa User
async function onOffUserController(req, res) {

  const { id } = req.params;

  try {

    //chama a função do serviço para inativar ou reativar o usuário
    const onOffUser = await onOffUserService(id);

    // Retorna os resultados da consulta em formato JSON
    apiResponse.success(res,
      onOffUser.ativo
        ? 'Usuário Reativado Com Sucesso!'
        : 'Usuário Inativado Com Sucesso!', onOffUser, 200, true
    );
  }
  catch (error) {
    console.error('Erro ao inativar/reativar usuário na etapa do controller:', error);
    const secureMessage = pgErrorHandler(error, error.message || 'Erro ao alterar o status do usuário.');
    return apiResponse.error(res, secureMessage);
  }
}


//#endregion

//#region DELETE - deletar usuario
async function deleteUser(req, res) {
  try {

    //pega o id da rota
    const idUser = req.params.id;

    //chama a função do serviço para deletar o usuário (e suas credenciais)
    const usuarioDeletado = await deletarUserService(idUser);

    // Retorna os resultados da consulta em formato JSON
    apiResponse.success(res,
      `O usuário ${usuarioDeletado.nome} foi deletado com sucesso!`, usuarioDeletado, 200
    );
  } catch (error) {
    console.error('Erro ao deletar o usuário na etapa do controller:', error);
    const secureMessage = pgErrorHandler(error, error.message || 'Erro ao deletar o usuário.');
    return apiResponse.error(res, secureMessage, 400);
  }
}
//#endregion

//#region PUT - resetar senha do usuário para o padrão
async function resetarSenhaController(req, res) {
  try {

    //pega o id da rota
    const idUser = req.params.id;

    //chama a função do serviço para resetar a senha do usuário
    const usuario = await resetarSenhaService(idUser);

    // Retorna os resultados da consulta em formato JSON
    apiResponse.success(res,
      `Senha do usuário ${usuario.nome} resetada para o padrão!`, usuario, 200
    );
  } catch (error) {
    console.error('Erro ao resetar a senha do usuário na etapa do controller:', error);
    const secureMessage = pgErrorHandler(error, error.message || 'Erro ao resetar a senha do usuário.');
    return apiResponse.error(res, secureMessage, 400);
  }
}
//#endregion

export {
  listarUsuarios,
  cadastrarUser,
  contarUsuarios,
  onOffUserController,
  atualizarUser,
  deleteUser,
  resetarSenhaController
}

