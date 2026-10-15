// Integração com a brapi.dev para buscar a cotação dos ativos da B3.
//
// A brapi devolve o último preço negociado (durante o pregão) ou o fechamento
// do último pregão (fora do horário de mercado) — em ambos os casos é o número
// que usamos para calcular o valor atual da carteira. Por isso a tela só chama
// este endpoint quando o usuário clica em "Atualizar Cotações", evitando gastar
// requisição do plano à toa.

const BRAPI_BASE_URL = 'https://brapi.dev/api';

// Controle de concorrência/retry para o plano gratuito da brapi.dev.
// O plano free aceita 1 ativo por requisição, então uma carteira com N tickers
// gera N requisições. Dispará-las todas de uma vez (Promise.all) provoca HTTP 429
// ("limite atingido"). Em vez disso, limitamos quantas rodam ao mesmo tempo e
// repetimos automaticamente, com espera, quem tomar 429.
const BRAPI_CONCORRENCIA = 3;        // nº de requisições simultâneas por vez
const BRAPI_MAX_TENTATIVAS = 4;      // tentativas por ticker antes de desistir
const BRAPI_BACKOFF_BASE_MS = 400;   // espera inicial do retry (cresce exponencialmente)

// Marcador para distinguir o erro de limite (429) das demais falhas e permitir retry.
class RateLimitError extends Error { }

const dormir = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Faz uma requisição de cotação para uma lista de tickers e devolve um mapa
// ticker -> dados de cotação. Lança erro com mensagem amigável em caso de falha.
async function requisitarCotacoes(tickers, token) {
  const url = `${BRAPI_BASE_URL}/quote/${tickers.join(',')}?token=${token}`;

  let resposta;
  try {
    resposta = await fetch(url, { headers: { Accept: 'application/json' } });
  } catch {
    throw new Error('Não foi possível conectar à brapi.dev para buscar as cotações.');
  }

  if (!resposta.ok) {
    if (resposta.status === 401 || resposta.status === 403) {
      throw new Error('Token da brapi.dev inválido ou sem permissão. Verifique BRAPI_TOKEN.');
    }
    if (resposta.status === 402) {
      throw new Error('O plano atual da brapi.dev não permite esta consulta.');
    }
    if (resposta.status === 429) {
      throw new RateLimitError('Limite de requisições da brapi.dev atingido. Tente novamente mais tarde.');
    }
    throw new Error(`Falha ao buscar cotações na brapi.dev (HTTP ${resposta.status}).`);
  }

  const json = await resposta.json();

  // A brapi pode responder HTTP 200 com { error: true, message } — por exemplo
  // quando o plano gratuito recebe mais de 1 ticker por requisição.
  if (json?.error) {
    const mensagem = json.message || 'A brapi.dev recusou a requisição de cotações.';
    // Alguns limites vêm como HTTP 200 + { error: true, message: '...limite...' }.
    if (/limite|rate limit|too many/i.test(mensagem)) {
      throw new RateLimitError(mensagem);
    }
    throw new Error(mensagem);
  }

  const resultados = Array.isArray(json?.results) ? json.results : [];

  const mapa = {};
  for (const item of resultados) {
    const ticker = String(item?.symbol || item?.requestedSymbol || '').toUpperCase();
    if (!ticker) continue;

    mapa[ticker] = {
      preco: item.regularMarketPrice ?? null,
      fechamentoAnterior: item.regularMarketPreviousClose ?? null,
      variacao: item.regularMarketChange ?? null,
      variacaoPerc: item.regularMarketChangePercent ?? null,
      atualizadoEm: item.regularMarketTime ?? null,
      nome: item.shortName ?? item.longName ?? null,
    };
  }

  return mapa;
}

// Busca a cotação de 1 ticker com retry automático em caso de HTTP 429.
// Entre tentativas espera um backoff exponencial (400ms, 800ms, 1600ms...),
// dando tempo para o limite de rajada da brapi liberar.
async function requisitarComRetry(ticker, token) {
  let ultimoErro;
  for (let tentativa = 1; tentativa <= BRAPI_MAX_TENTATIVAS; tentativa++) {
    try {
      return await requisitarCotacoes([ticker], token);
    } catch (erro) {
      ultimoErro = erro;
      // Só vale a pena repetir no caso de limite de requisições (429).
      // Token inválido, plano insuficiente etc. não melhoram com retry.
      if (!(erro instanceof RateLimitError) || tentativa === BRAPI_MAX_TENTATIVAS) {
        throw erro;
      }
      await dormir(BRAPI_BACKOFF_BASE_MS * 2 ** (tentativa - 1));
    }
  }
  throw ultimoErro;
}

// Busca a cotação de vários tickers.
//
// O plano gratuito da brapi.dev permite apenas 1 ativo por requisição, então
// cada ticker vira uma requisição. Em vez de dispará-las todas de uma vez (o que
// provoca HTTP 429), processamos em lotes de BRAPI_CONCORRENCIA por vez, com
// retry automático por ticker. Um ticker que falha de vez não derruba os demais —
// ele apenas fica sem cotação (a tela cai no preço médio).
async function buscarCotacoes(tickers) {
  const lista = [
    ...new Set(
      (tickers || [])
        .map((t) => String(t).trim().toUpperCase())
        .filter(Boolean),
    ),
  ];

  if (lista.length === 0) {
    return {};
  }

  const token = process.env.BRAPI_TOKEN;
  if (!token) {
    throw new Error('BRAPI_TOKEN não configurado no arquivo .env.');
  }

  const mapa = {};
  const falhas = [];

  // Pool simples: fatia a lista em lotes de tamanho BRAPI_CONCORRENCIA e
  // aguarda cada lote antes de disparar o próximo. Limita as requisições
  // simultâneas sem precisar de biblioteca externa.
  for (let i = 0; i < lista.length; i += BRAPI_CONCORRENCIA) {
    const lote = lista.slice(i, i + BRAPI_CONCORRENCIA);
    const resultados = await Promise.allSettled(
      lote.map((ticker) => requisitarComRetry(ticker, token)),
    );

    resultados.forEach((resultado, indice) => {
      if (resultado.status === 'fulfilled') {
        Object.assign(mapa, resultado.value);
      } else {
        falhas.push(resultado.reason);
        console.error(`Cotação indisponível para ${lote[indice]}:`, resultado.reason?.message);
      }
    });
  }

  // Só propaga erro se NENHUM ticker retornou — provável token/limite inválido.
  if (Object.keys(mapa).length === 0) {
    throw new Error(falhas[0]?.message || 'Não foi possível obter as cotações.');
  }

  return mapa;
}

export { buscarCotacoes };
