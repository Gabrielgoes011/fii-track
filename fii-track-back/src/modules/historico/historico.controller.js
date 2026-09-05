// Controller do módulo Histórico da Carteira.
//
// Responsável por validar os parâmetros das requisições de consulta (ticker e
// período), delegar a lógica de negócio ao `historico.service` e traduzir os
// resultados/erros para o formato padrão da API (`apiResponse`), usando o
// `pgErrorHandler` para gerar mensagens seguras a partir de erros de banco.
//
// Regras de validação (Requirements 2.6, 2.7):
// - ticker: obrigatório, não vazio e com no máximo 10 caracteres.
// - período: `de`/`ate` opcionais; quando informados, devem ser datas
//   interpretáveis como instante e respeitar `de <= ate`.
// A validação ocorre ANTES de qualquer acesso ao banco.

import apiResponse from '../../utils/httpResponse.js';
import pgErrorHandler from '../../utils/pgErrorHandler.js';
import {
  getHistoricoTicker,
  getHistoricoPatrimonio,
  getHistoricoAtivo,
} from './historico.service.js';

//#region helper de validação de período
// Interpreta os parâmetros de período (`de`/`ate`) vindos da query string.
//
// Retorna um objeto de resultado discriminado:
// - { valido: true, periodo: { de?, ate? } } quando o período é válido. As
//   chaves só são incluídas quando o respectivo parâmetro foi informado
//   (ausência = série completa).
// - { valido: false } quando alguma data é ininterpretável ou `de > ate`.
//
// Uma data é considerada "informada" quando não é `undefined`, `null` ou string
// vazia. Datas informadas precisam ser interpretáveis como instante
// (`Date.parse` não retorna `NaN`). Requirement 2.7.
function interpretarPeriodo(deBruto, ateBruto) {
  const periodo = {};

  // Considera "não informado" valores ausentes ou string vazia.
  const deInformado = deBruto !== undefined && deBruto !== null && deBruto !== '';
  const ateInformado = ateBruto !== undefined && ateBruto !== null && ateBruto !== '';

  let deMs = null;
  let ateMs = null;

  if (deInformado) {
    deMs = Date.parse(deBruto);
    // Data inicial não interpretável como instante → período inválido.
    if (Number.isNaN(deMs)) {
      return { valido: false };
    }
    periodo.de = deBruto;
  }

  if (ateInformado) {
    ateMs = Date.parse(ateBruto);
    // Data final não interpretável como instante → período inválido.
    if (Number.isNaN(ateMs)) {
      return { valido: false };
    }
    periodo.ate = ateBruto;
  }

  // Data inicial posterior à data final → período inválido (Requirement 2.7).
  if (deMs !== null && ateMs !== null && deMs > ateMs) {
    return { valido: false };
  }

  return { valido: true, periodo };
}
//#endregion

//#region função consultar histórico de preço de um ticker
// GET /historico/cotacoes/:ticker?de&ate
// Valida o ticker (não vazio, ≤ 10 caracteres) e o período antes de tocar o
// banco; delega ao service e retorna a série de preço do ticker.
async function getHistoricoTickerController(req, res) {
  try {

    // Ticker vindo dos parâmetros da rota.
    const ticker = req.params.ticker;

    // Requirement 2.6: ticker é obrigatório, não vazio e com no máximo 10
    // caracteres. A validação ocorre sem tocar o banco.
    if (typeof ticker !== 'string' || ticker.trim() === '') {
      return apiResponse.validationError(res, 'O ticker é obrigatório.');
    }
    if (ticker.length > 10) {
      return apiResponse.validationError(res, 'Ticker inválido (máximo de 10 caracteres).');
    }

    // Requirement 2.7: valida o período antes de tocar o banco.
    const resultadoPeriodo = interpretarPeriodo(req.query.de, req.query.ate);
    if (!resultadoPeriodo.valido) {
      return apiResponse.validationError(res, 'Período inválido: datas não interpretáveis ou data inicial posterior à data final.');
    }

    // Chama o service para buscar o histórico de preço do ticker.
    const result = await getHistoricoTicker(ticker, resultadoPeriodo.periodo);

    // Retorna a série encontrada (lista vazia quando não há registros).
    return apiResponse.success(res, 'Histórico de preço carregado com sucesso.', result);

  } catch (error) {

    // Loga o erro no console para depuração.
    console.error('Erro ao carregar histórico de preço do ticker na etapa do controller:', error);

    // Gera uma mensagem de erro segura para o usuário.
    const secureMessage = pgErrorHandler(error, 'Erro ao carregar histórico de preço do ticker.');

    // Retorna a resposta de erro para o cliente.
    return apiResponse.error(res, secureMessage);
  }
}
//#endregion

//#region função consultar histórico de patrimônio do usuário
// GET /historico/patrimonio?de&ate
// Usa o idUser do usuário autenticado; valida o período antes de tocar o banco
// e delega ao service a série de Snapshot_Geral.
async function getHistoricoPatrimonioController(req, res) {
  try {

    // Pega o id do usuário logado a partir do token.
    const idUser = req.user.id;

    // Requirement 2.7: valida o período antes de tocar o banco.
    const resultadoPeriodo = interpretarPeriodo(req.query.de, req.query.ate);
    if (!resultadoPeriodo.valido) {
      return apiResponse.validationError(res, 'Período inválido: datas não interpretáveis ou data inicial posterior à data final.');
    }

    // Chama o service para buscar a série de patrimônio do usuário.
    const result = await getHistoricoPatrimonio(idUser, resultadoPeriodo.periodo);

    // Retorna a série encontrada (lista vazia quando não há registros).
    return apiResponse.success(res, 'Histórico de patrimônio carregado com sucesso.', result);

  } catch (error) {

    // Loga o erro no console para depuração.
    console.error('Erro ao carregar histórico de patrimônio na etapa do controller:', error);

    // Gera uma mensagem de erro segura para o usuário.
    const secureMessage = pgErrorHandler(error, 'Erro ao carregar histórico de patrimônio.');

    // Retorna a resposta de erro para o cliente.
    return apiResponse.error(res, secureMessage);
  }
}
//#endregion

//#region função consultar histórico de patrimônio de um ativo
// GET /historico/patrimonio/:idAtivo?de&ate
// Usa o idUser autenticado + idAtivo da rota; valida idAtivo e o período antes
// de tocar o banco e delega ao service a série de Snapshot_por_Ativo.
async function getHistoricoAtivoController(req, res) {
  try {

    // Pega o id do usuário logado a partir do token.
    const idUser = req.user.id;

    // Pega o id do ativo a partir dos parâmetros da rota.
    const idAtivo = Number(req.params.idAtivo);

    // Valida se o id do ativo foi fornecido corretamente (sem tocar o banco).
    if (!idAtivo) {
      return apiResponse.validationError(res, 'O id do ativo é obrigatório.');
    }

    // Requirement 2.7: valida o período antes de tocar o banco.
    const resultadoPeriodo = interpretarPeriodo(req.query.de, req.query.ate);
    if (!resultadoPeriodo.valido) {
      return apiResponse.validationError(res, 'Período inválido: datas não interpretáveis ou data inicial posterior à data final.');
    }

    // Chama o service para buscar a série do ativo do usuário.
    const result = await getHistoricoAtivo(idUser, idAtivo, resultadoPeriodo.periodo);

    // Retorna a série encontrada (lista vazia quando não há registros).
    return apiResponse.success(res, 'Histórico do ativo carregado com sucesso.', result);

  } catch (error) {

    // Loga o erro no console para depuração.
    console.error('Erro ao carregar histórico do ativo na etapa do controller:', error);

    // Gera uma mensagem de erro segura para o usuário.
    const secureMessage = pgErrorHandler(error, 'Erro ao carregar histórico do ativo.');

    // Retorna a resposta de erro para o cliente.
    return apiResponse.error(res, secureMessage);
  }
}
//#endregion

export {
  getHistoricoTickerController,
  getHistoricoPatrimonioController,
  getHistoricoAtivoController,
};
