import { openDb } from '../../config/configDb.js';

//#region => Query para listar seguimentos do usuário
async function findSeguimentosRepo(idUser) {

  //abre a conexão com o banco de dados
  const db = await openDb();

  //executa a query
  const resultado = await db.query(`
    SELECT id, "nomeSeguimento" AS nome
    FROM seguimentos
    WHERE "idUser" = $1
    ORDER BY "nomeSeguimento" ASC
  `, [idUser]);

  //retorna as linhas encontradas (pode ser array vazio)
  return resultado.rows;
}
//#endregion

//#region => Query para contar seguimentos do usuário
async function countSeguimentosRepo(idUser) {

  //abre a conexão com o banco de dados
  const db = await openDb();

  //executa a query
  const resultado = await db.query(`
    SELECT COUNT(id) AS total
    FROM seguimentos
    WHERE "idUser" = $1
  `, [idUser]);

  //retorna o número como inteiro
  return parseInt(resultado.rows[0].total, 10);
}
//#endregion

//#region => Query para verificar se já existe seguimento com o mesmo nome para o usuário
async function findSeguimentoByNomeRepo(nome, idUser) {

  //abre a conexão com o banco de dados
  const db = await openDb();

  //executa a query
  const resultado = await db.query(`
    SELECT id
    FROM seguimentos
    WHERE "nomeSeguimento" = $1 AND "idUser" = $2
  `, [nome, idUser]);

  //retorna o seguimento encontrado ou undefined
  return resultado.rows[0];
}
//#endregion

//#region => Query para buscar seguimento por id e idUser (validação de posse)
async function findSeguimentoByIdRepo(idSeguimento, idUser) {

  //abre a conexão com o banco de dados
  const db = await openDb();

  //executa a query
  const resultado = await db.query(`
    SELECT id, "nomeSeguimento" AS nome
    FROM seguimentos
    WHERE id = $1 AND "idUser" = $2
  `, [idSeguimento, idUser]);

  //retorna o seguimento encontrado ou undefined
  return resultado.rows[0];
}
//#endregion

//#region => Query para verificar se o seguimento tem ativos vinculados
async function countAtivosVinculadosRepo(idSeguimento, idUser) {

  //abre a conexão com o banco de dados
  const db = await openDb();

  //conta quantos ativos do usuário pertencem a este seguimento
  const resultado = await db.query(`
    SELECT COUNT(id) AS total
    FROM ativos
    WHERE "idSeguimento" = $1 AND "idUser" = $2
  `, [idSeguimento, idUser]);

  //retorna o número como inteiro
  return parseInt(resultado.rows[0].total, 10);
}
//#endregion

//#region => Query para inserir um novo seguimento
async function insertSeguimentoRepo(nome, idUser) {

  //abre a conexão com o banco de dados
  const db = await openDb();

  //executa a query
  const resultado = await db.query(`
    INSERT INTO seguimentos ("nomeSeguimento", "idUser")
    VALUES ($1, $2)
    RETURNING id
  `, [nome, idUser]);

  //retorna o id do seguimento criado
  return resultado.rows[0];
}
//#endregion

//#region => Query para atualizar o nome de um seguimento
async function updateSeguimentoRepo(idSeguimento, nome, idUser) {

  //abre a conexão com o banco de dados
  const db = await openDb();

  //executa a query (garante que o seguimento pertence ao usuário)
  await db.query(`
    UPDATE seguimentos
    SET "nomeSeguimento" = $1
    WHERE id = $2 AND "idUser" = $3
  `, [nome, idSeguimento, idUser]);
}
//#endregion

//#region => Query para deletar um seguimento
async function deleteSeguimentoRepo(idSeguimento, idUser) {

  //abre a conexão com o banco de dados
  const db = await openDb();

  //executa a query (garante que o seguimento pertence ao usuário)
  const resultado = await db.query(`
    DELETE FROM seguimentos
    WHERE id = $1 AND "idUser" = $2
  `, [idSeguimento, idUser]);

  //retorna o número de linhas afetadas
  return resultado.rowCount;
}
//#endregion

//#region => Exporta as funções do repositório
export {
  findSeguimentosRepo,
  countSeguimentosRepo,
  findSeguimentoByNomeRepo,
  findSeguimentoByIdRepo,
  countAtivosVinculadosRepo,
  insertSeguimentoRepo,
  updateSeguimentoRepo,
  deleteSeguimentoRepo,
}
//#endregion
