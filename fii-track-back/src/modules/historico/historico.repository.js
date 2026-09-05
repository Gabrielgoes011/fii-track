// Repositório do Histórico da Carteira.
//
// Concentra o acesso ao banco do recurso "Histórico da Carteira":
// - leitura da posição atual da carteira (quantidade/precoMedio/custo/proventos
//   por ativo), reaproveitando as CTEs de `getControleAtivosRepo`;
// - gravação append-only (INSERT puro, sem UPSERT) do histórico de cotações e
//   dos snapshots de patrimônio (por ativo e geral).
//
// Todas as funções usam `openDb()`, que devolve o client da transação do request
// (contexto RLS aplicado via `dbContext`/`req.db`) quando existir, ou o pool caso
// contrário. Assim as inserções privadas (historico_carteira_*) participam da
// mesma transação/RLS do request, e o histórico de cotações (compartilhado) é
// gravado no mesmo escopo.

import { openDb } from '../../config/configDb.js';

//#region Leitura da posição da carteira
// Lê a posição atual da carteira do usuário: para cada ativo do controle de
// ativos, calcula quantidade, preço médio, custo e proventos acumulados.
//
// Reaproveita a mesma lógica de CTEs de `getControleAtivosRepo`
// (operacoes_agg → posicao + proventos), retornando apenas os campos
// necessários para montar os Snapshots_por_Ativo da Captura.
//
// Retorna: Array<{ idAtivo, ticker, quantidade, precoMedio, custo, proventos }>
async function getPosicaoCarteira(idUser) {

  // Abre a conexão (client da transação do request quando houver contexto RLS).
  const db = await openDb();

  // CTEs calculam a posição (custo médio ponderado) e os proventos por ativo.
  // LEFT JOIN garante que ativos sem operação ou sem provento ainda aparecem.
  const result = await db.query(`
    WITH operacoes_agg AS (
      SELECT
        o."idAtivo",
        SUM(CASE WHEN o.tipo = 'Compra' THEN o.quantidade ELSE -o.quantidade END) "quantidadeLiquida",
        SUM(CASE WHEN o.tipo = 'Compra' THEN o.quantidade ELSE 0 END) "quantidadeComprada",
        SUM(CASE WHEN o.tipo = 'Compra' THEN o.quantidade * o.preco ELSE 0 END) "custoCompras"
      FROM operacoes o
      WHERE o."idUser" = $1
      GROUP BY o."idAtivo"
    ),
    posicao AS (
      SELECT
        "idAtivo",
        "quantidadeLiquida" AS "quantidade",
        -- preco medio = custo total das compras / quantidade total comprada.
        -- NULLIF(..., 0) troca o divisor 0 por NULL para evitar divisao por zero
        -- (ativo sem nenhuma compra); o COALESCE la embaixo converte esse NULL em 0.
        "custoCompras" / NULLIF("quantidadeComprada", 0) AS "precoMedio"
      FROM operacoes_agg
    ),
    proventos AS (
      SELECT
        r."idAtivo",
        SUM(r."valorRecebido") "totalProventos"
      FROM rendimentos r
      WHERE r."idUser" = $1
      GROUP BY r."idAtivo"
    )
    SELECT
      a."idAtivo",
      b.ticker,
      COALESCE(d.quantidade, 0) "quantidade",
      COALESCE(d."precoMedio", 0) "precoMedio",
      COALESCE(d.quantidade, 0) * COALESCE(d."precoMedio", 0) "custo",
      COALESCE(e."totalProventos", 0) "proventos"
    FROM "controleAtivos" a INNER JOIN ativos b
      ON b.id = a."idAtivo"
    LEFT JOIN posicao d
      ON d."idAtivo" = a."idAtivo"
    LEFT JOIN proventos e
      ON e."idAtivo" = a."idAtivo"
    WHERE a."idUser" = $1
    ORDER BY b.ticker ASC
  `, [idUser]);

  // Retorna a posição por ativo.
  return result.rows;
}
//#endregion

//#region Inserção append-only do histórico de cotações
// Grava, em `historico_cotacoes`, um NOVO registro por item (append-only,
// sem UPSERT). Preserva a precisão numérica recebida da fonte de cotação:
// os valores são passados adiante como recebidos e a escala das colunas
// (numeric(12,2)/(12,4)/(8,4)) cuida do arredondamento.
//
// itens: Array<{
//   ticker, preco?, fechamentoAnterior?, variacao?, variacaoPerc?,
//   dtPregao?, dtCaptura?
// }>
// Quando `dtCaptura` não é informado, o DEFAULT now() da coluna é aplicado.
//
// Retorna a lista de linhas inseridas (com `id` e `dtCaptura` efetivos).
async function inserirHistoricoCotacoes(itens) {

  // Sem itens: nada a gravar.
  if (!Array.isArray(itens) || itens.length === 0) {
    return [];
  }

  // Abre a conexão (mesmo escopo/transação do request quando houver).
  const db = await openDb();

  // Monta um único INSERT multi-linhas para eficiência (7 colunas por linha).
  const colunas = 7;
  const valores = [];
  const placeholders = itens.map((item, i) => {
    const base = i * colunas;
    valores.push(
      item.ticker,
      item.preco ?? null,
      item.fechamentoAnterior ?? null,
      item.variacao ?? null,
      item.variacaoPerc ?? null,
      item.dtPregao ?? null,
      // dtCaptura: quando ausente, COALESCE cai no DEFAULT now() da coluna.
      item.dtCaptura ?? null,
    );
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, COALESCE($${base + 7}, now()))`;
  }).join(', ');

  const result = await db.query(`
    INSERT INTO historico_cotacoes
      (ticker, preco, "fechamentoAnterior", variacao, "variacaoPerc", "dtPregao", "dtCaptura")
    VALUES ${placeholders}
    RETURNING id, ticker, preco, "fechamentoAnterior", variacao, "variacaoPerc", "dtPregao", "dtCaptura"
  `, valores);

  return result.rows;
}
//#endregion

//#region Inserção append-only dos snapshots por ativo
// Grava, em `historico_carteira_ativo`, um NOVO registro por ativo da Captura
// (append-only, sem UPSERT). RLS garante o isolamento por `idUser` (transação
// do request com `app.current_user_id` aplicado).
//
// itens: Array<{
//   idUser, idAtivo, ticker, quantidade, precoMedio, custo, valorMercado,
//   rentabilidadeRs, rentabilidadePerc, proventos, precoIndisponivel, dtCaptura
// }>
//
// Retorna a lista de linhas inseridas.
async function inserirSnapshotsAtivo(itens) {

  // Sem itens: nada a gravar.
  if (!Array.isArray(itens) || itens.length === 0) {
    return [];
  }

  // Abre a conexão (mesmo escopo/transação do request quando houver).
  const db = await openDb();

  // INSERT multi-linhas (12 colunas por linha) para eficiência.
  const colunas = 12;
  const valores = [];
  const placeholders = itens.map((item, i) => {
    const base = i * colunas;
    valores.push(
      item.idUser,
      item.idAtivo,
      item.ticker ?? null,
      item.quantidade ?? null,
      item.precoMedio ?? null,
      item.custo ?? null,
      item.valorMercado ?? null,
      item.rentabilidadeRs ?? null,
      item.rentabilidadePerc ?? null,
      item.proventos ?? null,
      item.precoIndisponivel ?? false,
      item.dtCaptura,
    );
    const cols = Array.from({ length: colunas }, (_, k) => `$${base + k + 1}`).join(', ');
    return `(${cols})`;
  }).join(', ');

  const result = await db.query(`
    INSERT INTO historico_carteira_ativo
      ("idUser", "idAtivo", ticker, quantidade, "precoMedio", custo,
       "valorMercado", "rentabilidadeRs", "rentabilidadePerc", proventos,
       "precoIndisponivel", "dtCaptura")
    VALUES ${placeholders}
    RETURNING id, "idUser", "idAtivo", ticker, quantidade, "precoMedio", custo,
      "valorMercado", "rentabilidadeRs", "rentabilidadePerc", proventos,
      "precoIndisponivel", "dtCaptura"
  `, valores);

  return result.rows;
}
//#endregion

//#region Inserção append-only do snapshot geral
// Grava, em `historico_carteira_geral`, o único registro consolidado da Captura
// (append-only, sem UPSERT). RLS garante o isolamento por `idUser`.
//
// registro: {
//   idUser, custoTotal, valorMercadoTotal, rentabilidadeRs,
//   rentabilidadePerc, proventosTotais, dtCaptura
// }
//
// Retorna a linha inserida.
async function inserirSnapshotGeral(registro) {

  // Sem registro: nada a gravar.
  if (!registro) {
    return null;
  }

  // Abre a conexão (mesmo escopo/transação do request quando houver).
  const db = await openDb();

  const result = await db.query(`
    INSERT INTO historico_carteira_geral
      ("idUser", "custoTotal", "valorMercadoTotal", "rentabilidadeRs",
       "rentabilidadePerc", "proventosTotais", "dtCaptura")
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, "idUser", "custoTotal", "valorMercadoTotal", "rentabilidadeRs",
      "rentabilidadePerc", "proventosTotais", "dtCaptura"
  `, [
    registro.idUser,
    registro.custoTotal ?? null,
    registro.valorMercadoTotal ?? null,
    registro.rentabilidadeRs ?? null,
    registro.rentabilidadePerc ?? null,
    registro.proventosTotais ?? null,
    registro.dtCaptura,
  ]);

  return result.rows[0];
}
//#endregion

//#region Consulta do histórico de cotações por ticker (sem RLS)
// Lê os registros de `historico_cotacoes` de um ticker, ordenados de forma
// crescente por `dtCaptura` e, em empates, por `dtPregao` (Requirement 2.1).
// A tabela é compartilhada entre usuários (sem RLS).
//
// periodo (opcional): { de?, ate? } — quando `de`/`ate` são informados, aplica
// o filtro `de <= dtCaptura <= ate` (Requirement 2.3, 2.5). Quando ausentes,
// retorna toda a série do ticker.
//
// Retorna: Array<{ id, ticker, preco, fechamentoAnterior, variacao,
//   variacaoPerc, dtPregao, dtCaptura }>
async function listarHistoricoCotacoes(ticker, periodo) {

  // Abre a conexão (client da transação do request quando houver contexto RLS).
  const db = await openDb();

  // Monta as condições de forma parametrizada: o ticker é sempre exigido e os
  // limites de período são adicionados apenas quando informados.
  const condicoes = ['ticker = $1'];
  const valores = [ticker];

  if (periodo?.de != null) {
    valores.push(periodo.de);
    condicoes.push(`"dtCaptura" >= $${valores.length}`);
  }
  if (periodo?.ate != null) {
    valores.push(periodo.ate);
    condicoes.push(`"dtCaptura" <= $${valores.length}`);
  }

  const result = await db.query(`
    SELECT id, ticker, preco, "fechamentoAnterior", variacao, "variacaoPerc",
      "dtPregao", "dtCaptura"
    FROM historico_cotacoes
    WHERE ${condicoes.join(' AND ')}
    ORDER BY "dtCaptura" ASC, "dtPregao" ASC
  `, valores);

  return result.rows;
}
//#endregion

//#region Consulta da série de Snapshot_Geral do usuário (com RLS)
// Lê os registros de `historico_carteira_geral` ordenados de forma crescente
// por `dtCaptura` (Requirement 3.10). O isolamento por usuário é garantido pela
// RLS (transação do request com `app.current_user_id` aplicado); o filtro por
// `idUser` é reforçado explicitamente na consulta.
//
// periodo (opcional): { de?, ate? } — aplica `de <= dtCaptura <= ate` quando
// informado; caso contrário retorna toda a série do usuário.
//
// Retorna: Array<{ id, idUser, custoTotal, valorMercadoTotal, rentabilidadeRs,
//   rentabilidadePerc, proventosTotais, dtCaptura }>
async function listarSnapshotGeral(idUser, periodo) {

  // Abre a conexão (mesmo escopo/transação do request com RLS).
  const db = await openDb();

  const condicoes = ['"idUser" = $1'];
  const valores = [idUser];

  if (periodo?.de != null) {
    valores.push(periodo.de);
    condicoes.push(`"dtCaptura" >= $${valores.length}`);
  }
  if (periodo?.ate != null) {
    valores.push(periodo.ate);
    condicoes.push(`"dtCaptura" <= $${valores.length}`);
  }

  const result = await db.query(`
    SELECT id, "idUser", "custoTotal", "valorMercadoTotal", "rentabilidadeRs",
      "rentabilidadePerc", "proventosTotais", "dtCaptura"
    FROM historico_carteira_geral
    WHERE ${condicoes.join(' AND ')}
    ORDER BY "dtCaptura" ASC
  `, valores);

  return result.rows;
}
//#endregion

//#region Consulta da série de Snapshot_por_Ativo de um ativo (com RLS)
// Lê os registros de `historico_carteira_ativo` de um ativo do usuário,
// ordenados de forma crescente por `dtCaptura`. O isolamento por usuário é
// garantido pela RLS; o filtro por `idUser`/`idAtivo` é reforçado na consulta.
//
// periodo (opcional): { de?, ate? } — aplica `de <= dtCaptura <= ate` quando
// informado; caso contrário retorna toda a série do ativo.
//
// Retorna: Array<{ id, idUser, idAtivo, ticker, quantidade, precoMedio, custo,
//   valorMercado, rentabilidadeRs, rentabilidadePerc, proventos,
//   precoIndisponivel, dtCaptura }>
async function listarSnapshotAtivo(idUser, idAtivo, periodo) {

  // Abre a conexão (mesmo escopo/transação do request com RLS).
  const db = await openDb();

  const condicoes = ['"idUser" = $1', '"idAtivo" = $2'];
  const valores = [idUser, idAtivo];

  if (periodo?.de != null) {
    valores.push(periodo.de);
    condicoes.push(`"dtCaptura" >= $${valores.length}`);
  }
  if (periodo?.ate != null) {
    valores.push(periodo.ate);
    condicoes.push(`"dtCaptura" <= $${valores.length}`);
  }

  const result = await db.query(`
    SELECT id, "idUser", "idAtivo", ticker, quantidade, "precoMedio", custo,
      "valorMercado", "rentabilidadeRs", "rentabilidadePerc", proventos,
      "precoIndisponivel", "dtCaptura"
    FROM historico_carteira_ativo
    WHERE ${condicoes.join(' AND ')}
    ORDER BY "dtCaptura" ASC
  `, valores);

  return result.rows;
}
//#endregion

export {
  getPosicaoCarteira,
  inserirHistoricoCotacoes,
  inserirSnapshotsAtivo,
  inserirSnapshotGeral,
  listarHistoricoCotacoes,
  listarSnapshotGeral,
  listarSnapshotAtivo,
};
