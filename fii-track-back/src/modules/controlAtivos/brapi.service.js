// Integração com a brapi.dev para buscar a cotação dos ativos da B3.
//
// A brapi devolve o último preço negociado (durante o pregão) ou o fechamento
// do último pregão (fora do horário de mercado) — em ambos os casos é o número
// que usamos para calcular o valor atual da carteira. Por isso a tela só chama
// este endpoint quando o usuário clica em "Atualizar Cotações", evitando gastar
// requisição do plano à toa.

const BRAPI_BASE_URL = 'https://brapi.dev/api';

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
      throw new Error('Limite de requisições da brapi.dev atingido. Tente novamente mais tarde.');
    }
    throw new Error(`Falha ao buscar cotações na brapi.dev (HTTP ${resposta.status}).`);
  }

  const json = await resposta.json();

  // A brapi pode responder HTTP 200 com { error: true, message } — por exemplo
  // quando o plano gratuito recebe mais de 1 ticker por requisição.
  if (json?.error) {
    throw new Error(json.message || 'A brapi.dev recusou a requisição de cotações.');
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

// Busca a cotação de vários tickers.
//
// O plano gratuito da brapi.dev permite apenas 1 ativo por requisição, então
// disparamos uma requisição por ticker em paralelo. Um ticker que falha não
// derruba os demais — ele apenas fica sem cotação (a tela cai no preço médio).
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
  const resultados = await Promise.allSettled(
    lista.map((ticker) => requisitarCotacoes([ticker], token)),
  );

  resultados.forEach((resultado, indice) => {
    if (resultado.status === 'fulfilled') {
      Object.assign(mapa, resultado.value);
    } else {
      console.error(`Cotação indisponível para ${lista[indice]}:`, resultado.reason?.message);
    }
  });

  // Só propaga erro se NENHUM ticker retornou — provável token/limite inválido.
  if (Object.keys(mapa).length === 0) {
    const primeiraFalha = resultados.find((r) => r.status === 'rejected');
    throw new Error(primeiraFalha?.reason?.message || 'Não foi possível obter as cotações.');
  }

  return mapa;
}

export { buscarCotacoes };
