import {
  getAtivosDropListRepo,
  getOperacoesRepo,
  verificarAtivoExisteRepo,
  lancarOperacaoRepo,
  carregaDadosGraficoOperacoesRepo,
  excluirOperacaoRepo
} from '../repositories/operacoes.repositories.js';

//#Region => Função para trazer o dropList de ativos
async function getAtivosDropListService(idUser) {
  try {

    //chama função do repositório para buscar os ativos
    const ativos = await getAtivosDropListRepo(idUser);

    // Retorna os resultados (pode ser vazio)
    return ativos;

  } catch (error) {
    // Log do erro para depuração para o dev
    console.error('Erro ao carregar ativos para o dropdown na etapa do service:', error);

    //erro para o usuário
    throw new Error('Erro ao carregar ativos para o dropdown: ' + error.message);
  }
}
//#endregion

//#Region => Função para listar operações
async function getOperacoesService(idUser, campos) {
  try {

    //chama função do repositório para buscar as operações
    const operacoes = await getOperacoesRepo(idUser, campos);

    // Retorna os resultados (pode ser vazio)
    return operacoes;

  } catch (error) {
    // Log do erro para depuração para o dev
    console.error('Erro ao listar operações na etapa do service:', error);

    //erro para o usuário generico
    throw new Error('Erro ao listar operações: ' + error.message);
  }
}
//#endregion

//#Region => Função para lançar uma nova operação
async function lancarOperacaoService(idUser, dados) {
  try {

    //verifica se o ativo existe e pertence ao usuário
    const ativo = await verificarAtivoExisteRepo(dados.idAtivo, idUser);

    if (ativo.length === 0) {
      throw new Error('Ativo não encontrado.');
    }

    //chama função do repositório para inserir a operação
    const operacao = await lancarOperacaoRepo(dados, idUser);

    //retorna o id da operação inserida
    return operacao;

  } catch (error) {
    // Log do erro para depuração para o dev
    console.error('Erro ao lançar operação na etapa do service:', error);

    //erro para o usuário
    throw new Error('Erro ao lançar operação: ' + error.message);
  }
}
//#endregion

//#Region => Função para carregar dados do gráfico de operações
async function carregaDadosGraficoOperacoesService(idUser, campos) {
  try {

    //chama função do repositório para buscar os dados do gráfico
    const dadosGrafico = await carregaDadosGraficoOperacoesRepo(idUser, campos);

    //retorna os resultados (pode ser vazio, sem erro)
    return dadosGrafico;

  } catch (error) {
    // Log do erro para depuração para o dev
    console.error('Erro ao carregar dados do gráfico na etapa do service:', error);

    //erro para o usuário
    throw new Error('Erro ao carregar dados do gráfico: ' + error.message);
  }
}
//#endregion

//#Region => Função para excluir uma operação
async function excluirOperacaoService(idUser, idOperacao) {
  try {

    //chama função do repositório para excluir a operação
    const rowCount = await excluirOperacaoRepo(idOperacao, idUser);

    //verifica se a operação foi encontrada e excluída
    if (rowCount === 0) {
      throw new Error('Operação não encontrada.');
    }

    //retorna sucesso
    return true;

  } catch (error) {
    // Log do erro para depuração para o dev
    console.error('Erro ao excluir operação na etapa do service:', error);

    //erro para o usuário
    throw new Error('Erro ao excluir operação: ' + error.message);
  }
}
//#endregion

export {
  getAtivosDropListService,
  getOperacoesService,
  lancarOperacaoService,
  carregaDadosGraficoOperacoesService,
  excluirOperacaoService
}
