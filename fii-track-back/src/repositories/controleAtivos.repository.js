import { openDb } from '../config/configDb.js';

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
    ("idUser", "idSeguimento","idAtivo", "percIdeal", "objetivo")
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, ticker
  `, [idUser, dados.idSegmento, dados.idAtivo, dados.percIdeal, dados.objetivo]);

  // Retorna os resultados da query
  return result.rows[0];
}

//#endregion


export {
  getSegmentosDropListRepo,
  getAtivosDropListRepo,
  addAtivoRepo
};