import { openDb } from "../../config/configDb.js";
import apiResponse from '../../utils/httpResponse.js';
import {
  listarFundosService,
  cadastrarFundosService,
  contarFundosService,
  deletarFundoService,
  editarNomeFundoService
} from "../../services/cadastros/meusFundos.services.js";


//#region => cadastrar meus fundos
async function cadastrarFundos(req, res) {
  
  //recebe os dados do corpo da requisição
  const dados = req.body;

  try {

    // Chama a função do serviço para cadastrar os fundos
    const cadastrarFundos = await cadastrarFundosService(dados);

    // Retorna os resultados da consulta em formato JSON
    apiResponse.success(res,
      'Fundos cadastrados com sucesso!', cadastrarFundos, 201, true
    );

  } catch (error) {
    // Retorna a mensagem detalhada do erro
    return apiResponse.error(res,
      error.message);
  }
}
//#endregion

//#region função listar fundos -  
async function listarFundos(req, res) {
  try {

    // Chama a função do repositório para listar os fundos
    const listarFundos = await listarFundosService();

    // Retorna os resultados da consulta em formato JSON
    apiResponse.success(res,
      'Fundos listados com sucesso!', listarFundos, 200, true
    );

  } catch (error) {

    // Retorna a mensagem detalhada do erro
    return apiResponse.error(res,
      error.message);
  }
}

//#endregion

//#region função de contar fundos ativos
async function contarFundosAtivos(req, res) {
  try {

    // Chama a função do repositório para contar os fundos ativos
    const contarFundos = await contarFundosService();

    // Retorna os resultados da consulta em formato JSON
    apiResponse.success(res,
      'Fundos ativos contados com sucesso!', contarFundos, 200, true
    );

  } catch (error) {

    // Retorna a mensagem detalhada do erro
    return apiResponse.error(res, error.message);
  }
}
//#endregion 

//#region função de deletar um fundo
async function deletarFundo(req, res) {
  //recebe o id do fundo a ser deletado
  const { id } = req.params;

  try {

    // Chama a função do serviço para deletar o fundo 
    const deletarFundo = await deletarFundoService(id);

    // Retorna os resultados da consulta em formato JSON
    apiResponse.success(res,
      'Fundo deletado com sucesso!', deletarFundo, 200, true
    );
  } catch (error) {

    // Retorna a mensagem detalhada do erro
    return apiResponse.error(res,
      error.message);
  }
}
//#endregion  

//#region função de editar nome do fundo - implementar depois de implementar tabela de logs
async function editarNomeFundo(req, res) {

  //recebe o id do fundo a ser editado e o novo nome do fundo
  const { id } = req.params;
  const { nomeFundo } = req.body;

  try {

    // Chama a função do serviço para editar o nome do fundo 
    const editarNomeFundo = await editarNomeFundoService(id, nomeFundo);

    // Retorna os resultados da consulta em formato JSON
    apiResponse.success(res,
      'Nome do fundo editado com sucesso!', editarNomeFundo, 200, true
    );

  } catch (error) {

    // Retorna a mensagem detalhada do erro
    return apiResponse.error(res,
      error.message);
  }
}
//#endregion

// #region => exportação das funções
export {
  listarFundos,
  cadastrarFundos,
  contarFundosAtivos,
  deletarFundo,
  editarNomeFundo
}
//#endregion