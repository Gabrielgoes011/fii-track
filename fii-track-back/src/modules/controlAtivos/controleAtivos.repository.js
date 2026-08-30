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
    WITH posicao AS (
      SELECT
        o."idAtivo",
        SUM(CASE WHEN o.tipo = 'Compra' THEN o.quantidade ELSE -o.quantidade END)                                          "quantidade",
        SUM(CASE WHEN o.tipo = 'Compra' THEN o.quantidade * o.preco ELSE 0 END)
          / NULLIF(SUM(CASE WHEN o.tipo = 'Compra' THEN o.quantidade ELSE 0 END), 0)                                       "precoMedio"
      FROM operacoes o
      WHERE o."idUser" = $1
      GROUP BY o."idAtivo"
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
      ca.id,
      ca."idAtivo",
      a.ticker,
      ca."idSegmento",
      s."nomeSeguimento"                                                          "segmento",
      ca."percIdeal",
      ca.objetivo,
      ca."dtCadastro",
      COALESCE(p.quantidade,    0)                                                "quantidade",
      COALESCE(p."precoMedio",  0)                                                "precoMedio",
      COALESCE(p.quantidade, 0) * COALESCE(p."precoMedio", 0)                    "custo",
      COALESCE(r."totalProventos", 0)                                             "totalProventos"
    FROM "controleAtivos" ca
    JOIN ativos      a ON a.id  = ca."idAtivo"
    JOIN seguimentos s ON s.id  = ca."idSegmento"
    LEFT JOIN posicao  p ON p."idAtivo" = ca."idAtivo"
    LEFT JOIN proventos r ON r."idAtivo" = ca."idAtivo"
    WHERE ca."idUser" = $1
    ORDER BY s."nomeSeguimento" ASC, a.ticker ASC
  `, [idUser]);

  // Retorna os resultados da query
  return result.rows;
}

//#endregion

export {
  getSegmentosDropListRepo,
  getAtivosDropListRepo,
  addAtivoRepo,
  getControleAtivosRepo,
};