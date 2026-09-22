import { openDb } from '../../../config/configDb.js';

//#region => Query para buscar o perfil do usuário logado
// Junta dados cadastrais (usuarios) com flags de credenciais (credenciaisUsuario).
async function getPerfilRepo(idUser) {

  //abre a conexão com o banco de dados
  const db = await openDb();

  //executa a query - dados do usuário + flags de acesso/2FA (nunca retorna a senha)
  const resultado = await db.query(`
    SELECT
      u.id,
      u.nome,
      u.email,
      u.cpf,
      u."dataNascimento",
      u.ativo,
      u."urlPhotoS3",
      COALESCE(c.adm, false)                AS adm,
      COALESCE(c."auth2faHabilitado", false) AS "auth2faHabilitado"
    FROM usuarios u
    LEFT JOIN "credenciaisUsuario" c ON c."idUser" = u.id
    WHERE u.id = $1
  `, [idUser]);

  //retorna o perfil encontrado ou undefined
  return resultado.rows[0];
}
//#endregion

//#region => Query para verificar se um email já pertence a OUTRO usuário
// excludeId ignora o próprio usuário (permite manter o mesmo email na edição).
async function emailEmUsoRepo(email, excludeId) {

  //abre a conexão com o banco de dados
  const db = await openDb();

  //executa a query - procura o email em qualquer usuário que não seja o próprio
  const resultado = await db.query(`
    SELECT id
    FROM usuarios
    WHERE email = LOWER($1) AND id != $2
  `, [email, excludeId]);

  //retorna true se o email já está em uso por outro usuário
  return resultado.rows.length > 0;
}
//#endregion

//#region => Query para atualizar os dados cadastrais do próprio usuário
// Atualiza apenas campos editáveis pelo próprio usuário (nome, dataNascimento, email).
async function updatePerfilRepo(idUser, dados) {

  //abre a conexão com o banco de dados
  const db = await openDb();

  //executa a query - retorna o perfil já atualizado (sem a senha)
  const resultado = await db.query(`
    UPDATE usuarios
    SET nome = $1, "dataNascimento" = $2, email = LOWER($3)
    WHERE id = $4
    RETURNING id, nome, email, cpf, "dataNascimento", ativo, "urlPhotoS3"
  `, [dados.nome, dados.dataNascimento, dados.email, idUser]);

  //retorna a linha atualizada ou undefined
  return resultado.rows[0];
}
//#endregion

//#region => Exporta as funções do repositório
export {
  getPerfilRepo,
  emailEmUsoRepo,
  updatePerfilRepo,
}
//#endregion
