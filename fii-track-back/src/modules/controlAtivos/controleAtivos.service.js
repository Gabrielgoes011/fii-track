import pgErrorHandler from '../../utils/pgErrorHandler.js';
import {
  getSegmentosDropListRepo,
  getAtivosDropListRepo,
  addAtivoRepo,
  getControleAtivosRepo,
  getTickersCarteiraRepo,
  getCotacoesSalvasRepo,
  upsertCotacoesRepo,
  updatePercIdealRepo,
  updatePrecoTetoRepo,
  deleteAtivoRepo,
} from './controleAtivos.repository.js';
import { buscarCotacoes } from './brapi.service.js';
import { registrarCaptura } from '../historico/historico.service.js';

// Tempo (em minutos) que uma cotação salva é considerada "fresca".
// Dentro dessa janela, o botão "Atualizar Cotações" usa o cache e NÃO
// consome requisição da brapi.dev.
const COTACAO_TTL_MINUTOS = 15;

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



//#region função listar controle de ativos
async function getControleAtivosService(idUser) {
  try {

    // Chamada ao repositório para buscar o controle de ativos do usuário
    const result = await getControleAtivosRepo(idUser);

    // Retorna os resultados da query
    return result;

  } catch (error) {

    // Loga o erro no console para depuração
    console.error('Erro ao carregar controle de ativos na etapa do service:', error);

    // Gera uma mensagem de erro segura para o usuário
    const secureMessage = pgErrorHandler(error, 'Erro ao carregar controle de ativos.');

    // Lança o erro para ser tratado no controller
    throw new Error(secureMessage);
  }
}
//#endregion

// Monta o item de retorno de uma cotação (a partir de uma linha do cache).
function montarCotacao(linha) {
  return {
    preco: linha.preco != null ? Number(linha.preco) : null,
    fechamentoAnterior: linha.fechamentoAnterior != null ? Number(linha.fechamentoAnterior) : null,
    variacao: linha.variacao != null ? Number(linha.variacao) : null,
    variacaoPerc: linha.variacaoPerc != null ? Number(linha.variacaoPerc) : null,
    dtConsulta: linha.dtConsulta ? new Date(linha.dtConsulta).toISOString() : null,
  };
}

//#region função atualizar as cotações da carteira (cache + brapi.dev)
// Lê o cache (tabela cotacoes); só consulta a brapi para os tickers cuja
// última consulta passou de COTACAO_TTL_MINUTOS. Grava o que buscou e
// devolve o mapa completo + a consulta mais antiga da carteira.
async function getCotacoesCarteiraService(idUser) {
  try {

    // Instante do acionamento: horário do servidor no momento em que o botão
    // "Atualizar Cotações" foi acionado. É o dtCaptura da Captura (Requirement 1.1).
    const dtCaptura = new Date();

    // Tickers da carteira do usuário
    const tickers = await getTickersCarteiraRepo(idUser);
    if (tickers.length === 0) {
      return {
        cotacoes: {}, atualizadoEm: null, consultaMaisAntiga: null,
        tickersDesatualizados: [], origem: 'cache',
        ttlMinutos: COTACAO_TTL_MINUTOS, proximaAtualizacaoEm: null,
      };
    }

    // Cache atual
    const salvas = await getCotacoesSalvasRepo(tickers);
    const cache = new Map(salvas.map((linha) => [linha.ticker.toUpperCase(), linha]));

    // Quais estão sem cache ou com cache vencido?
    const limite = Date.now() - COTACAO_TTL_MINUTOS * 60 * 1000;
    const desatualizados = tickers.filter((ticker) => {
      const linha = cache.get(ticker.toUpperCase());
      if (!linha || !linha.dtConsulta) return true;
      return new Date(linha.dtConsulta).getTime() < limite;
    });

    // Rastreia a origem dos dados para o frontend saber se buscou preços novos
    // ('brapi'), se tudo veio do cache dentro do TTL ('cache'), ou se tentou
    // buscar mas a brapi falhou e caiu no cache ('cache-fallback').
    let origem = desatualizados.length > 0 ? 'brapi' : 'cache';

    // Busca na brapi só o que precisa e grava no cache
    if (desatualizados.length > 0) {
      try {
        const novas = await buscarCotacoes(desatualizados);

        const itens = Object.entries(novas).map(([ticker, dados]) => ({
          ticker: ticker.toUpperCase(),
          preco: dados.preco,
          fechamentoAnterior: dados.fechamentoAnterior,
          variacao: dados.variacao,
          variacaoPerc: dados.variacaoPerc,
          dtPregao: dados.atualizadoEm,
        }));

        await upsertCotacoesRepo(itens);

        // Relê o cache já atualizado
        const atualizadas = await getCotacoesSalvasRepo(tickers);
        atualizadas.forEach((linha) => cache.set(linha.ticker.toUpperCase(), linha));

      } catch (erroBrapi) {
        // Se a brapi falhar mas houver cache, seguimos com o que temos.
        if (cache.size === 0) throw erroBrapi;
        console.error('brapi indisponível, usando cache existente:', erroBrapi.message);
        // Tentou buscar preços novos, mas caiu no cache por falha externa.
        origem = 'cache-fallback';
      }
    }

    // Monta o mapa de retorno e descobre a consulta mais antiga e a mais recente.
    // `tickersDesatualizados` lista os tickers cuja última consulta ainda está
    // fora do TTL após esta tentativa (ex.: brapi indisponível / limite atingido),
    // permitindo ao frontend sinalizar a defasagem de forma precisa.
    const cotacoes = {};
    let maisAntiga = null;
    let maisRecente = null;
    const tickersDesatualizados = [];
    const limiteAtual = Date.now() - COTACAO_TTL_MINUTOS * 60 * 1000;
    for (const ticker of tickers) {
      const linha = cache.get(ticker.toUpperCase());
      if (!linha) {
        // Sem cache algum para o ticker: considera defasado.
        tickersDesatualizados.push(ticker.toUpperCase());
        continue;
      }
      cotacoes[ticker.toUpperCase()] = montarCotacao(linha);
      if (linha.dtConsulta) {
        const t = new Date(linha.dtConsulta).getTime();
        if (maisAntiga === null || t < maisAntiga) maisAntiga = t;
        if (maisRecente === null || t > maisRecente) maisRecente = t;
        if (t < limiteAtual) tickersDesatualizados.push(ticker.toUpperCase());
      } else {
        tickersDesatualizados.push(ticker.toUpperCase());
      }
    }

    // Grava o histórico da Captura (Requirements 1.1, 1.2, 1.3, 1.5) na mesma
    // transação/contexto RLS do request. O mapa `cotacoes` é indexado por ticker
    // (uppercase) e cada valor traz { preco, fechamentoAnterior, variacao,
    // variacaoPerc, dtConsulta }, formato tolerado por registrarCaptura.
    // Não altera a resposta ao frontend, que segue sendo { cotacoes, atualizadoEm }.
    await registrarCaptura(idUser, cotacoes, dtCaptura);

    // Momento em que o cache mais antigo expira: a partir daí um novo clique
    // volta a consultar a brapi. Útil para a mensagem "disponível novamente às…".
    const proximaAtualizacaoEm = maisAntiga !== null
      ? new Date(maisAntiga + COTACAO_TTL_MINUTOS * 60 * 1000).toISOString()
      : null;

    return {
      cotacoes,
      // `atualizadoEm` reflete a consulta MAIS RECENTE com sucesso (o carimbo que
      // o usuário deve ver). A defasagem passa a ser sinalizada por
      // `tickersDesatualizados`, e não mais por "o ticker mais antigo puxar tudo".
      atualizadoEm: maisRecente !== null ? new Date(maisRecente).toISOString() : null,
      // Consulta mais antiga da carteira (mantida para eventual uso/depuração).
      consultaMaisAntiga: maisAntiga !== null ? new Date(maisAntiga).toISOString() : null,
      // Tickers ainda fora do TTL após esta tentativa. Vazio = tudo atualizado.
      tickersDesatualizados,
      // Sinaliza ao frontend a natureza da resposta (Requirement: mensagem
      // "cotações já atualizadas / disponível no próximo pregão").
      // 'brapi' = buscou preços novos | 'cache' = tudo fresco dentro do TTL
      // | 'cache-fallback' = tentou buscar mas a brapi falhou e usou cache.
      origem,
      ttlMinutos: COTACAO_TTL_MINUTOS,
      proximaAtualizacaoEm,
    };

  } catch (error) {
    console.error('Erro ao atualizar cotações na etapa do service:', error);
    throw new Error(error.message || 'Erro ao buscar cotações dos ativos.');
  }
}
//#endregion

//#region função atualizar o percentual ideal de um ativo
async function updatePercIdealService(idUser, idAtivo, percIdeal) {
  try {

    const atualizado = await updatePercIdealRepo(idUser, idAtivo, percIdeal);

    // Nenhuma linha afetada = ativo não pertence ao usuário ou não existe
    if (!atualizado) {
      throw new Error('Ativo não encontrado na sua carteira.');
    }

    return atualizado;

  } catch (error) {
    console.error('Erro ao atualizar percentual ideal na etapa do service:', error);
    const secureMessage = pgErrorHandler(error, 'Erro ao atualizar o percentual ideal.');
    throw new Error(secureMessage);
  }
}
//#endregion

//#region função atualizar o preço teto de um ativo
async function updatePrecoTetoService(idUser, idAtivo, precoTeto, modoPrecoTeto) {
  try {

    const atualizado = await updatePrecoTetoRepo(idUser, idAtivo, precoTeto, modoPrecoTeto);

    if (!atualizado) {
      throw new Error('Ativo não encontrado na sua carteira.');
    }

    return atualizado;

  } catch (error) {
    console.error('Erro ao atualizar preço teto na etapa do service:', error);
    const secureMessage = pgErrorHandler(error, 'Erro ao atualizar o preço teto.');
    throw new Error(secureMessage);
  }
}
//#endregion

//#region função remover um ativo do controle de ativos
async function deleteAtivoService(idUser, idAtivo) {
  try {

    const removido = await deleteAtivoRepo(idUser, idAtivo);

    if (!removido) {
      throw new Error('Ativo não encontrado na sua carteira.');
    }

    return removido;

  } catch (error) {
    console.error('Erro ao remover ativo na etapa do service:', error);
    const secureMessage = pgErrorHandler(error, 'Erro ao remover o ativo da carteira.');
    throw new Error(secureMessage);
  }
}
//#endregion

export {
  getSegmentosDropListService,
  getAtivosDropListService,
  addAtivoService,
  getControleAtivosService,
  getCotacoesCarteiraService,
  updatePercIdealService,
  updatePrecoTetoService,
  deleteAtivoService,
};