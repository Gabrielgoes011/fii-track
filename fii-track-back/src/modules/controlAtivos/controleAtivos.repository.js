import { openDb } from '../../config/configDb.js';

//#region Query para trazer o dropList de segmentos
async function getSegmentosDropListRepo(idUser) {

  // Abre a conexão com o banco de dados
  const db = await openDb();

  // Executa a query para buscar os segmentos do usuário + os padrão do sistema
  const result = await db.query(`
    SELECT
      id "idSeguimento",
      "nomeSeguimento",
      "defaultSistem"
    FROM seguimentos
    WHERE "idUser" = $1 OR ("defaultSistem" = true AND "idUser" = 0)
    ORDER BY "defaultSistem" DESC, "nomeSeguimento" ASC
  `, [idUser]);

  // Retorna os resultados da query
  return result.rows;
}

//#endregion

//#region Query para trazer o dropList de ativos por segmento
async function getAtivosDropListRepo(idUser, idSegmento) {

  // Abre a conexão com o banco de dados
  const db = await openDb();

  // Executa a query para buscar os ativos do usuário por segmento
  const result = await db.query(`
    SELECT
      id "idAtivo",
      ticker
    FROM ativos
    WHERE "idUser" = $1
      AND "idSeguimento" = $2
    ORDER BY ticker ASC
  `, [idUser, idSegmento]);

  // Retorna os resultados da query
  return result.rows;
}

//#endregion

//#region Query para adicionar um ativo
async function addAtivoRepo(idUser, dados) {
  // Abre a conexão com o banco de dados
  const db = await openDb();

  // Executa a query para adicionar o ativo
  const result = await db.query(`
    INSERT INTO "controleAtivos" 
    ("idUser", "idSegmento", "idAtivo", "percIdeal", "objetivo")
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `, [idUser, dados.idSegmento, dados.idAtivo, dados.percIdeal, dados.objetivo]);

  // Retorna os resultados da query
  return result.rows[0];
}

//#endregion


//#region Query para listar o controle de ativos do usuário
async function getControleAtivosRepo(idUser) {

  // Abre a conexão com o banco de dados
  const db = await openDb();

  // CTEs calculam a posição (custo médio ponderado) e os proventos por ativo.
  // LEFT JOIN garante que ativos sem operação ou sem provento ainda aparecem na lista.
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
      a.id,
      a."idAtivo",
      b.ticker,
      a."idSegmento",
      c."nomeSeguimento" "segmento",
      a."percIdeal",
      a.objetivo,
      a."precoTeto",
      a."modoPrecoTeto",
      a."dtCadastro",
      COALESCE(d.quantidade, 0) "quantidade",
      COALESCE(d."precoMedio", 0) "precoMedio",
      COALESCE(d.quantidade, 0) * COALESCE(d."precoMedio", 0) "custo",
      COALESCE(e."totalProventos", 0) "totalProventos",
      f.preco "precoAtual",
      f."variacaoPerc" "variacaoPercDia",
      f."dtConsulta" "dtConsultaCotacao"
    FROM "controleAtivos" a INNER JOIN ativos b
      ON b.id = a."idAtivo"
    INNER JOIN seguimentos c
      ON c.id = a."idSegmento"
    LEFT JOIN posicao d
      ON d."idAtivo" = a."idAtivo"
    LEFT JOIN proventos e
      ON e."idAtivo" = a."idAtivo"
    LEFT JOIN cotacoes f
      ON f.ticker = b.ticker
    WHERE a."idUser" = $1
    ORDER BY c."nomeSeguimento" ASC, b.ticker ASC
  `, [idUser]);

  // Retorna os resultados da query
  return result.rows;
}

//#endregion

//#region Query para listar os tickers que o usuário tem na carteira
async function getTickersCarteiraRepo(idUser) {

  // Abre a conexão com o banco de dados
  const db = await openDb();

  // Busca os tickers dos ativos que compõem o controle de ativos do usuário
  const result = await db.query(`
    SELECT b.ticker
    FROM "controleAtivos" a
    INNER JOIN ativos b ON b.id = a."idAtivo"
    WHERE a."idUser" = $1
    ORDER BY b.ticker ASC
  `, [idUser]);

  // Retorna apenas a lista de tickers (strings)
  return result.rows.map((row) => row.ticker);
}

//#endregion

//#region Query para ler o cache de cotações de uma lista de tickers
async function getCotacoesSalvasRepo(tickers) {

  // Sem tickers: nada a consultar
  if (!Array.isArray(tickers) || tickers.length === 0) {
    return [];
  }

  // Abre a conexão com o banco de dados
  const db = await openDb();

  // Busca as cotações já salvas para os tickers informados
  const result = await db.query(`
    SELECT ticker, preco, "fechamentoAnterior", variacao, "variacaoPerc", "dtPregao", "dtConsulta"
    FROM cotacoes
    WHERE ticker = ANY($1)
  `, [tickers]);

  return result.rows;
}

//#endregion

//#region Query para gravar/atualizar o cache de cotações (UPSERT por ticker)
async function upsertCotacoesRepo(itens) {

  // Sem itens: nada a gravar
  if (!Array.isArray(itens) || itens.length === 0) {
    return;
  }

  // Abre a conexão com o banco de dados
  const db = await openDb();

  // Poucos tickers por vez (carteira do usuário) — um UPSERT por linha é suficiente.
  for (const item of itens) {
    await db.query(`
      INSERT INTO cotacoes (ticker, preco, "fechamentoAnterior", variacao, "variacaoPerc", "dtPregao", "dtConsulta")
      VALUES ($1, $2, $3, $4, $5, $6, now())
      ON CONFLICT (ticker) DO UPDATE SET
        preco                = EXCLUDED.preco,
        "fechamentoAnterior" = EXCLUDED."fechamentoAnterior",
        variacao             = EXCLUDED.variacao,
        "variacaoPerc"       = EXCLUDED."variacaoPerc",
        "dtPregao"           = EXCLUDED."dtPregao",
        "dtConsulta"         = now()
    `, [
      item.ticker,
      item.preco ?? null,
      item.fechamentoAnterior ?? null,
      item.variacao ?? null,
      item.variacaoPerc ?? null,
      item.dtPregao ?? null,
    ]);
  }
}

//#endregion

//#region Query para atualizar o percentual ideal de um ativo na carteira
async function updatePercIdealRepo(idUser, idAtivo, percIdeal) {

  // Abre a conexão com o banco de dados
  const db = await openDb();

  // Atualiza somente o registro do próprio usuário (RLS + WHERE por idUser)
  const result = await db.query(`
    UPDATE "controleAtivos"
    SET "percIdeal" = $3
    WHERE "idUser" = $1 AND "idAtivo" = $2
    RETURNING id
  `, [idUser, idAtivo, percIdeal]);

  // Retorna o registro atualizado (undefined se não existir)
  return result.rows[0];
}

//#endregion

//#region Query para atualizar o preço teto de um ativo na carteira
async function updatePrecoTetoRepo(idUser, idAtivo, precoTeto, modoPrecoTeto) {

  // Abre a conexão com o banco de dados
  const db = await openDb();

  // Atualiza o preço teto e o modo de cálculo ('manual' ou 'pvp')
  const result = await db.query(`
    UPDATE "controleAtivos"
    SET "precoTeto" = $3,
        "modoPrecoTeto" = $4
    WHERE "idUser" = $1 AND "idAtivo" = $2
    RETURNING id, "precoTeto", "modoPrecoTeto"
  `, [idUser, idAtivo, precoTeto, modoPrecoTeto]);

  // Retorna o registro atualizado (undefined se não existir)
  return result.rows[0];
}

//#endregion

//#region Query para remover um ativo do controle de ativos do usuário
async function deleteAtivoRepo(idUser, idAtivo) {

  // Abre a conexão com o banco de dados
  const db = await openDb();

  // Remove apenas o registro do próprio usuário
  const result = await db.query(`
    DELETE FROM "controleAtivos"
    WHERE "idUser" = $1 AND "idAtivo" = $2
    RETURNING id
  `, [idUser, idAtivo]);

  // Retorna o registro removido (undefined se não existir)
  return result.rows[0];
}

//#endregion

export {
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
};