import { openDb } from '../../config/configDb.js';

//region => Query para verificar a senha atual do usuário
async function getPassRepository(userId) {

  //abre conexão com o banco de dados
  const db = await openDb();

  //executa a query para buscar o hash da senha atual do usuário
  const result = await db.query(`
    SELECT password
    FROM "credenciaisUsuario"
    WHERE "idUser" = $1
  `, [userId]);

  //retorna o registro encontrado ou undefined se não houver correspondência
  return result.rows[0];

}
//endregion

//region => Query para trocar a senha do usuário
async function changePassRepository(userId, hashSenhaAtual, hashNovaSenha) {
  //abre conexão com o banco de dados
  const db = await openDb();
  //executa a query para atualizar a senha do usuário
  const result = await db.query(`
    UPDATE "credenciaisUsuario"
    SET password = $1
    WHERE "idUser" = $2 AND password = $3
    RETURNING "idUser"
  `, [hashNovaSenha, userId, hashSenhaAtual]);


  //retorna o resultado da operação
  return result.rows[0];

}
//endregion

export {
  getPassRepository,
  changePassRepository
}

//