// Serviço de Histórico da Carteira.
//
// Este módulo concentra a lógica de negócio do recurso "Histórico da Carteira":
// cálculo de snapshots de patrimônio, variações de série e agrupamento por dia,
// além das funções de gravação/consulta que serão adicionadas nas próximas etapas.
//
// As funções de cálculo abaixo são puras (sem I/O), o que as torna facilmente
// testáveis por property-based testing.

import {
  getPosicaoCarteira,
  existeCapturaHojeComValores,
  inserirHistoricoCotacoes,
  inserirSnapshotsAtivo,
  inserirSnapshotGeral,
  listarHistoricoCotacoes,
  listarSnapshotGeral,
  listarSnapshotAtivo,
} from "./historico.repository.js";

//#region helper de arredondamento
// Arredonda um número para 2 casas decimais.
// Usa Math.round sobre o valor multiplicado por 100 para manter a precisão
// monetária esperada pelos requisitos (valores em R$/%).
function round2(valor) {
  return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}
//#endregion

//#region função calcular snapshot por ativo
// Calcula o Snapshot_por_Ativo a partir da posição do ativo e da cotação.
//
// posicaoAtivo: { quantidade, precoMedio, custo, proventos }
// cotacao: { preco } — preco pode ser null quando indisponível.
//
// Regras (Requirements 3.3, 3.4, 3.5, 3.6, 3.7):
// - valorMercado = preco != null ? round2(quantidade * preco) : custo
// - precoIndisponivel = (preco == null)
// - rentabilidadeRs = round2(valorMercado - custo)
// - rentabilidadePerc = custo > 0 ? round2(((valorMercado - custo)/custo)*100) : 0
function calcularSnapshotAtivo(posicaoAtivo, cotacao) {
  const quantidade = Number(posicaoAtivo?.quantidade ?? 0);
  const precoMedio = Number(posicaoAtivo?.precoMedio ?? 0);
  const custo = Number(posicaoAtivo?.custo ?? 0);
  const proventos = Number(posicaoAtivo?.proventos ?? 0);

  // Preço de mercado; null/undefined indica indisponibilidade.
  const preco = cotacao?.preco ?? null;
  const precoIndisponivel = preco == null;

  // Requirement 3.3 / 3.4: com preço, valor de mercado = quantidade * preço;
  // sem preço, valor de mercado assume o custo do ativo.
  const valorMercado = !precoIndisponivel ? round2(quantidade * Number(preco)) : round2(custo);

  // Requirement 3.5: rentabilidade em R$ = valorMercado - custo.
  const rentabilidadeRs = round2(valorMercado - custo);

  // Requirement 3.6 / 3.7: rentabilidade em % apenas quando custo > 0; senão zero.
  const rentabilidadePerc =
    custo > 0 ? round2(((valorMercado - custo) / custo) * 100) : 0;

  return {
    quantidade,
    precoMedio: round2(precoMedio),
    custo: round2(custo),
    valorMercado,
    rentabilidadeRs,
    rentabilidadePerc,
    proventos: round2(proventos),
    precoIndisponivel,
  };
}
//#endregion

//#region função calcular snapshot geral
// Calcula o Snapshot_Geral consolidado da carteira a partir da lista de
// Snapshots_por_Ativo da mesma Captura.
//
// snapshotsAtivo: Array<{ custo, valorMercado, proventos, ... }>
//
// Regras (Requirements 3.2, 3.8, 3.9):
// - custoTotal, valorMercadoTotal e proventosTotais = soma dos respectivos
//   campos dos snapshots por ativo, arredondados para 2 casas.
// - rentabilidadeRs = round2(valorMercadoTotal - custoTotal).
// - rentabilidadePerc = custoTotal > 0 ? round2(((valorMercadoTotal - custoTotal)/custoTotal)*100) : 0.
// - carteira vazia → todos os agregados iguais a zero.
function calcularSnapshotGeral(snapshotsAtivo) {
  const snapshots = Array.isArray(snapshotsAtivo) ? snapshotsAtivo : [];

  // Requirement 3.8 / 3.9: somas dos snapshots por ativo (carteira vazia → 0).
  const custoTotal = round2(
    snapshots.reduce((soma, s) => soma + Number(s?.custo ?? 0), 0)
  );
  const valorMercadoTotal = round2(
    snapshots.reduce((soma, s) => soma + Number(s?.valorMercado ?? 0), 0)
  );
  const proventosTotais = round2(
    snapshots.reduce((soma, s) => soma + Number(s?.proventos ?? 0), 0)
  );

  // Requirement 3.2: rentabilidade total em R$ e % derivadas dos agregados.
  const rentabilidadeRs = round2(valorMercadoTotal - custoTotal);
  const rentabilidadePerc =
    custoTotal > 0
      ? round2(((valorMercadoTotal - custoTotal) / custoTotal) * 100)
      : 0;

  return {
    custoTotal,
    valorMercadoTotal,
    rentabilidadeRs,
    rentabilidadePerc,
    proventosTotais,
  };
}
//#endregion

//#region função calcular variações de série
// Anexa a Variacao (em R$, em % e a direção) a cada ponto de uma série histórica
// ordenada cronologicamente, comparando cada ponto ao ponto imediatamente anterior.
//
// serie: Array de pontos quaisquer (objetos) já ordenados do mais antigo ao mais recente.
// extrairValor: função que recebe um ponto e devolve o valor numérico a comparar
//   (ex.: p => p.valorMercadoTotal, ou p => p.preco).
//
// Retorna uma nova lista, preservando cada ponto original e acrescentando os campos
// `variacaoRs`, `variacaoPerc` e `direcao`.
//
// Regras (Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7):
// - Primeiro ponto (sem anterior comparável): variacaoRs, variacaoPerc e direcao são
//   indefinidas (null) — Requirement 4.7.
// - Demais pontos: variacaoRs = round2(v_i - v_{i-1}) — Requirements 4.1, 4.6.
// - variacaoPerc = v_{i-1} != 0 ? round2(((v_i - v_{i-1})/v_{i-1})*100) : null (indefinida)
//   — Requirements 4.2, 4.6.
// - direcao: "subiu" se diff > 0.01; "desceu" se diff < -0.01; senão "estável"
//   — Requirements 4.3, 4.4, 4.5.
function calcularVariacoes(serie, extrairValor) {
  const pontos = Array.isArray(serie) ? serie : [];
  const extrair = typeof extrairValor === "function" ? extrairValor : (p) => Number(p);

  return pontos.map((ponto, indice) => {
    // Requirement 4.7: primeiro ponto não tem anterior comparável.
    if (indice === 0) {
      return {
        ...ponto,
        variacaoRs: null,
        variacaoPerc: null,
        direcao: null,
      };
    }

    const valorAtual = Number(extrair(ponto));
    const valorAnterior = Number(extrair(pontos[indice - 1]));
    const diff = valorAtual - valorAnterior;

    // Requirements 4.1 / 4.6: variação em R$ = valor atual - valor anterior.
    const variacaoRs = round2(diff);

    // Requirements 4.2 / 4.6: variação em % apenas quando o valor anterior é
    // diferente de zero; caso contrário, indefinida (null), sem executar a divisão.
    const variacaoPerc =
      valorAnterior !== 0 ? round2((diff / valorAnterior) * 100) : null;

    // Requirements 4.3 / 4.4 / 4.5: direção pela diferença absoluta contra 0.01.
    let direcao;
    if (diff > 0.01) {
      direcao = "subiu";
    } else if (diff < -0.01) {
      direcao = "desceu";
    } else {
      direcao = "estável";
    }

    return {
      ...ponto,
      variacaoRs,
      variacaoPerc,
      direcao,
    };
  });
}
//#endregion

//#region função agrupar por dia
// Consolida os pontos de uma série por data-calendário, mantendo, por dia,
// apenas o ponto de maior `dtCaptura` (a Captura mais recente daquele dia).
//
// pontos: Array de pontos que possuam o campo `dtCaptura` (string ISO ou Date).
// timeZone: fuso usado para delimitar o dia-calendário (default America/Sao_Paulo).
//
// Regra (Requirement 5.4):
// - Particiona os pontos pela data-calendário no fuso informado.
// - Para cada dia com ao menos um registro, retorna exatamente um ponto:
//   o de maior `dtCaptura`.
// - A visualização não descarta os registros brutos; este agrupamento é
//   aplicado apenas na apresentação (Requirement 5.5).
function agruparPorDia(pontos, timeZone = "America/Sao_Paulo") {
  const lista = Array.isArray(pontos) ? pontos : [];

  // Formata a data-calendário (YYYY-MM-DD) no fuso informado. O locale 'en-CA'
  // produz o formato ISO de data, facilitando o particionamento por dia.
  const formatador = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  // Converte o dtCaptura de um ponto em um timestamp comparável (ms).
  const timestampDe = (ponto) => new Date(ponto?.dtCaptura).getTime();

  const porDia = new Map();

  for (const ponto of lista) {
    // Deriva o dia-calendário no fuso informado.
    const dia = formatador.format(new Date(ponto?.dtCaptura));
    const atual = porDia.get(dia);

    // Mantém, por dia, o ponto de maior dtCaptura.
    if (!atual || timestampDe(ponto) > timestampDe(atual)) {
      porDia.set(dia, ponto);
    }
  }

  return [...porDia.values()];
}
//#endregion

//#region função registrar captura
// Grava uma Captura completa do Histórico da Carteira: para cada ativo da
// posição atual do usuário, monta o registro de mercado (Historico_Cotacoes),
// calcula o Snapshot_por_Ativo e, ao final, o Snapshot_Geral consolidado.
// Tudo é persistido de forma append-only, na mesma transação/contexto RLS do
// request (garantido pelo repository via `openDb()`).
//
// Parâmetros:
// - idUser: usuário proprietário da carteira (RLS).
// - cotacoesPorTicker: mapa/objeto indexado por ticker, com valores no formato
//     { preco, fechamentoAnterior, variacao, variacaoPerc, dtPregao|dtConsulta }.
//     `preco` null/ausente indica preço de mercado indisponível.
// - dtCaptura: instante da Captura (Date ou string ISO); é o mesmo para todos os
//     registros gravados nesta Captura (Requirement 1.3). Quando ausente, usa o
//     horário do servidor no momento do acionamento (Requirement 1.1).
//
// Regras:
// - Requirement 1.5 / 3.9: carteira vazia → conclui sem gravar e retorna vazio.
// - Requirement 1.2: os valores de mercado gravados em Historico_Cotacoes
//     preservam a precisão recebida da fonte (sem arredondamento adicional).
// - Requirement 3.4: preço indisponível → valorMercado = custo,
//     precoIndisponivel = true, sem interromper os demais ativos.
// - Requirements 1.1, 1.3, 3.1, 3.2, 3.8: snapshots por ativo e geral usam o
//     mesmo dtCaptura da Captura.
//
// Retorna um resumo: { dtCaptura, historicoCotacoes, snapshotsAtivo, snapshotGeral }.
// Para carteira vazia, retorna listas vazias e snapshotGeral = null.
async function registrarCaptura(idUser, cotacoesPorTicker, dtCaptura) {
  // Instante único da Captura (Requirement 1.1). Precisão de segundos: zera ms.
  const instante = dtCaptura ? new Date(dtCaptura) : new Date();
  instante.setMilliseconds(0);
  const dtCapturaIso = instante.toISOString();

  // Requirement 1.5 / 3.9: sem ativos → conclui a Captura sem gravar registros.
  const posicao = await getPosicaoCarteira(idUser);
  if (!Array.isArray(posicao) || posicao.length === 0) {
    return {
      dtCaptura: dtCapturaIso,
      historicoCotacoes: [],
      snapshotsAtivo: [],
      snapshotGeral: null,
    };
  }

  // Normaliza o mapa de cotações indexado por ticker (case-insensitive).
  const cotacoes = cotacoesPorTicker ?? {};
  const cotacaoDe = (ticker) => {
    if (!ticker) return undefined;
    return cotacoes[ticker] ?? cotacoes[String(ticker).toUpperCase()];
  };

  // Acumuladores das inserções.
  const itensHistoricoCotacoes = [];
  const itensSnapshotAtivo = [];
  const snapshotsParaGeral = [];

  for (const posicaoAtivo of posicao) {
    const ticker = posicaoAtivo.ticker;
    const cotacao = cotacaoDe(ticker);

    // Snapshot por ativo: calcularSnapshotAtivo já trata preço null
    // (precoIndisponivel = true, valorMercado = custo) — Requirement 3.4.
    const snapshot = calcularSnapshotAtivo(posicaoAtivo, cotacao);
    snapshotsParaGeral.push(snapshot);

    // Registro de patrimônio por ativo (Historico_Carteira ativo).
    itensSnapshotAtivo.push({
      idUser,
      idAtivo: posicaoAtivo.idAtivo,
      ticker,
      quantidade: snapshot.quantidade,
      precoMedio: snapshot.precoMedio,
      custo: snapshot.custo,
      valorMercado: snapshot.valorMercado,
      rentabilidadeRs: snapshot.rentabilidadeRs,
      rentabilidadePerc: snapshot.rentabilidadePerc,
      proventos: snapshot.proventos,
      precoIndisponivel: snapshot.precoIndisponivel,
      dtCaptura: dtCapturaIso,
    });

    // Requirement 1.2: só grava histórico de cotação quando há cotação para o
    // ticker; preserva a precisão da fonte (sem arredondamento adicional).
    if (cotacao) {
      itensHistoricoCotacoes.push({
        ticker,
        preco: cotacao.preco ?? null,
        fechamentoAnterior: cotacao.fechamentoAnterior ?? null,
        variacao: cotacao.variacao ?? null,
        variacaoPerc: cotacao.variacaoPerc ?? null,
        dtPregao: cotacao.dtPregao ?? cotacao.dtConsulta ?? null,
        dtCaptura: dtCapturaIso,
      });
    }
  }

  // Snapshot geral consolidado (Requirement 3.2, 3.8, 3.9), mesmo dtCaptura.
  const geral = calcularSnapshotGeral(snapshotsParaGeral);

  // Dedup por dia: se já houve hoje uma Captura com os mesmos valores consolidados
  // (mesmo valorMercadoTotal e custoTotal), pula a gravação. Isso evita acumular
  // linhas idênticas em cliques repetidos no mesmo dia sem mudança de cotação.
  // Quando o preço muda ao longo do dia, os valores diferem e a Captura é gravada.
  const jaExisteHoje = await existeCapturaHojeComValores(
    idUser,
    geral.valorMercadoTotal,
    geral.custoTotal,
  );
  if (jaExisteHoje) {
    return {
      dtCaptura: dtCapturaIso,
      historicoCotacoes: [],
      snapshotsAtivo: [],
      snapshotGeral: null,
      duplicadaIgnorada: true,
    };
  }

  const registroGeral = {
    idUser,
    custoTotal: geral.custoTotal,
    valorMercadoTotal: geral.valorMercadoTotal,
    rentabilidadeRs: geral.rentabilidadeRs,
    rentabilidadePerc: geral.rentabilidadePerc,
    proventosTotais: geral.proventosTotais,
    dtCaptura: dtCapturaIso,
  };

  // Persistência append-only: cotações → snapshots por ativo → snapshot geral.
  const historicoCotacoes = await inserirHistoricoCotacoes(itensHistoricoCotacoes);
  const snapshotsAtivo = await inserirSnapshotsAtivo(itensSnapshotAtivo);
  const snapshotGeral = await inserirSnapshotGeral(registroGeral);

  return {
    dtCaptura: dtCapturaIso,
    historicoCotacoes,
    snapshotsAtivo,
    snapshotGeral,
  };
}
//#endregion

//#region função consultar histórico de cotações por ticker
// Consulta a série histórica de cotações de um ticker e anexa a Variacao
// (em R$, em % e a direção) a cada ponto, comparando o `preco` de cada Captura
// ao da Captura imediatamente anterior.
//
// ticker: código do papel (ex.: "MXRF11").
// periodo (opcional): { de?, ate? } repassado ao repository para filtrar por
//   `dtCaptura` (Requirements 2.1, 2.5).
//
// Regras:
// - Requirement 2.1 / 2.5: série ordenada cronologicamente vinda do repository.
// - Requirement 4.1: cada ponto recebe variacaoRs/variacaoPerc/direcao via
//   calcularVariacoes, usando o `preco` como valor comparável.
// - Sem registros → retorna lista vazia.
async function getHistoricoTicker(ticker, periodo) {
  const serie = await listarHistoricoCotacoes(ticker, periodo);
  if (!Array.isArray(serie) || serie.length === 0) {
    return [];
  }

  // Consolida 1 ponto por dia (a Captura mais recente do dia) antes de calcular
  // as variações — evita que capturas duplicadas no mesmo dia zerem a variação
  // e neutralizem a cor de alta/baixa (Requirement 5.4).
  const porDia = agruparPorDia(serie);
  return calcularVariacoes(porDia, (p) => p.preco);
}
//#endregion

//#region função consultar histórico de patrimônio (Snapshot_Geral)
// Consulta a série de Snapshots_Gerais do usuário e anexa a Variacao a cada
// ponto, comparando o `valorMercadoTotal` de cada Captura ao da anterior.
//
// idUser: usuário proprietário (isolamento por RLS).
// periodo (opcional): { de?, ate? } repassado ao repository.
//
// Regras:
// - Requirement 3.10: série ordenada cronologicamente vinda do repository.
// - Requirement 4.1: cada ponto recebe variacaoRs/variacaoPerc/direcao via
//   calcularVariacoes, usando o `valorMercadoTotal` como valor comparável.
// - Sem registros → retorna lista vazia.
async function getHistoricoPatrimonio(idUser, periodo) {
  const serie = await listarSnapshotGeral(idUser, periodo);
  if (!Array.isArray(serie) || serie.length === 0) {
    return [];
  }

  // Consolida 1 ponto por dia (Captura mais recente) antes das variações (Req. 5.4).
  const porDia = agruparPorDia(serie);
  return calcularVariacoes(porDia, (p) => p.valorMercadoTotal);
}
//#endregion

//#region função consultar histórico de um ativo (Snapshot_por_Ativo)
// Consulta a série de Snapshots_por_Ativo de um ativo do usuário e anexa a
// Variacao a cada ponto, comparando o `valorMercado` de cada Captura ao da
// anterior.
//
// idUser: usuário proprietário (isolamento por RLS).
// idAtivo: ativo consultado.
// periodo (opcional): { de?, ate? } repassado ao repository.
//
// Regras:
// - Requirement 3.11: série ordenada cronologicamente vinda do repository.
// - Requirement 4.1: cada ponto recebe variacaoRs/variacaoPerc/direcao via
//   calcularVariacoes, usando o `valorMercado` como valor comparável.
// - Sem registros → retorna lista vazia.
async function getHistoricoAtivo(idUser, idAtivo, periodo) {
  const serie = await listarSnapshotAtivo(idUser, idAtivo, periodo);
  if (!Array.isArray(serie) || serie.length === 0) {
    return [];
  }

  // Consolida 1 ponto por dia (Captura mais recente) antes das variações (Req. 5.4).
  const porDia = agruparPorDia(serie);
  return calcularVariacoes(porDia, (p) => p.valorMercado);
}
//#endregion

export {
  round2,
  calcularSnapshotAtivo,
  calcularSnapshotGeral,
  calcularVariacoes,
  agruparPorDia,
  registrarCaptura,
  getHistoricoTicker,
  getHistoricoPatrimonio,
  getHistoricoAtivo,
};
