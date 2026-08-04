import { openDb } from '../config/configDb.js';

//#region Query para trazer o dropList de segmentos
async function getSegmentosDropListRepo(idUser) {

  // Abre a conexão com o banco de dados
  const db = await openDb();

  // Executa a query para buscar os segmentos do usuário
  const result = await db.query(`
    SELECT
      id "idSeguimento",
      "nomeSeguimento"
    FROM seguimentos
    WHERE "idUser" = $1
    ORDER BY "nomeSeguimento" ASC
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

export {
  getSegmentosDropListRepo,
  getAtivosDropListRepo,
};