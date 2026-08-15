import { openDb } from '../config/configDb.js';

//region => Query para verificar a senha atual do usuário
async function verificarSenhaRepository(userId, hashSenhaAtual) {

  //abre conexão com o banco de dados
  const db = await openDb();

  //executa a query para verificar se a senha atual está correta
  const result = await db.query(`
    SELECT idUser
    FROM "credenciaisUsuario"
    WHERE idUser = $1 AND password = $2
  `, [userId, hashSenhaAtual]);

  //fecha a conexão com o banco de dados
  await db.close();
  //retorna true se a senha atual estiver correta, caso contrário retorna false
  return result.rows.length > 0;

}
//endregion

//region => Query para trocar a senha do usuário
async function trocarSenhaRepository(userId, hashSenhaAtual, hashNovaSenha) {
  //abre conexão com o banco de dados
  const db = await openDb();
  //executa a query para atualizar a senha do usuário
  const result = await db.query(`
    UPDATE "credenciaisUsuario"
    SET password = $1
    WHERE idUser = $2 AND password = $3
    RETURNING idUser
  `, [hashNovaSenha, userId, hashSenhaAtual]);

  //fecha a conexão com o banco de dados
  await db.close();

  //retorna o resultado da operação
  return result.rows[0];

}
//endregion

//region => Query para verificar a senha atual do usuário