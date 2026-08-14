import apiResponse from '../../utils/httpResponse.js';
import {
  listarUsuariosService,
  cadastrarUserService,
  countUserService,
  onOffUserService,
  atualizarUserService,
  deletarUserService,
  resetarSenhaService
} from "../../services/cadastros/usuarios.services.js";


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

    apiResponse.error(res,
      error.message || 'Erro ao listar usuários', 500);
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
    
    // Log do erro para depuração
    console.error('Erro ao contar usuários:', error);

    // Retorna a mensagem detalhada do erro
    apiResponse.error(res,
      error.message || 'Erro ao contar usuários', 500);
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
    // Log do erro para depuração
    console.error('Erro ao cadastrar usuário:', error);
    // Retorna a mensagem detalhada do erro
    return apiResponse.error(res, error.message);
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
    // Log do erro para depuração
    console.error('Erro ao atualizar usuário:', error);
    // Retorna a mensagem detalhada do erro
    apiResponse.error(res, error.message || 'Erro ao atualizar o usuário.', 400);
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

    // Retorna a mensagem detalhada do erro
    return apiResponse.error(res,
      error.message);
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
    // Log do erro para depuração
    console.error('Erro ao deletar o usuário:', error);
    // Retorna a mensagem detalhada do erro
    apiResponse.error(res, error.message || 'Erro ao deletar o usuário.', 400);
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
    // Log do erro para depuração
    console.error('Erro ao resetar a senha do usuário:', error);
    // Retorna a mensagem detalhada do erro
    apiResponse.error(res, error.message || 'Erro ao resetar a senha do usuário.', 400);
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

