import { openDb } from "../../config/configDb.js";

//#region => Query para listar os usuários cadastrados
async function listarUsuariosRepository(blvalor) {

  //abre a conexão com o banco de dados
  const db = await openDb();

  //Executa a consulta SQL para listar os usuários
  const resultado = await db.query(`        
        SELECT
          id, nome, cpf, email, ativo,
          EXTRACT(YEAR FROM AGE("dataNascimento")) idade
        FROM usuarios   
        WHERE ativo = $1 
        ORDER BY id DESC `, [blvalor]
  );

  //retorna os resultados da consulta
  return resultado.rows;
}
//#endregion

//#region => Sequencia de querys para logica de cadastro de usuário
//1º passo: verificar se o email já existe
async function checkEmailRepository(email) {

  //executa a consulta para verificar se ja existe
  const db = await openDb();

  const resultadoEmail = await
    db.query(`
      SELECT email  
      FROM usuarios 
      WHERE email = $1
  `, [email]);


  return resultadoEmail.rows.length > 0;
}

//2º passo: se o email não existir, verifica se o cpf já existe
async function checkCpfRepository(cpf) {
  //executa a consulta para verificar se ja existe
  const db = await openDb();

  const resultadoCpf = await
    db.query(`
      SELECT cpf  
      FROM usuarios 
      WHERE cpf = $1
  `, [cpf]);

  return resultadoCpf.rows.length > 0;
}

//3º passo: Cadastra o  usuarui se o email e cpf não existirem
async function cadastrarUserRepository(dados) {

  //abre a conexão com o banco de dados
  const db = await openDb();

  //Inicia a transação para garantir a atomicidade das operações
  await db.query('BEGIN TRANSACTION');
  try {

    //Executa a consulta SQL para cadastrar o usuário
    const insertUser = await db.query(`
        INSERT INTO usuarios
           (nome, "dataNascimento", email, cpf)
        VALUES 
          ($1, $2, LOWER($3), $4)
        RETURNING id`, [
      dados.nome,
      dados.dataNascimento,
      dados.email,
      dados.cpf
    ]);

    //captura o id do usuário recém cadastrado
    const userId = insertUser.rows[0].id;

    //Executa a consulta SQL para cadastrar a senha do usuário
    await db.query(`
        INSERT INTO "credenciaisUsuario"
          ( "password", "idUser")
        VALUES 
          ( $1, $2)`, [
      dados.password,
      userId
    ]);

    //Confirma a transação
    await db.query('COMMIT');

    //retorna o resultado da consulta
    return { id: userId };
  }
  catch (error) {
    //Em caso de erro, desfaz a transação
    await db.query('ROLLBACK');
    throw error;
  }
}
//#endregion

//#Region => querys para Contar user
async function countUserRepository() {

  //abre a conexão com o banco de dados
  const db = await openDb();

  //Executa a consulta SQL para listar os usuários
  const resultadoAtivo = await db.query(`
        SELECT COUNT(id) AS totalUsers
        FROM usuarios
        WHERE ativo = true
    `);

  const resultadoInativo = await db.query(`
        SELECT COUNT(id) AS totalUsers
        FROM usuarios
        WHERE ativo = false

    `);
  const resultadoTotal = await db.query(`
        SELECT COUNT(id) AS totalUsers
        FROM usuarios
    `);

  //retorna os resultados da consulta
  return {
    ativos: resultadoAtivo.rows[0].totalusers,
    inativos: resultadoInativo.rows[0].totalusers,
    total: resultadoTotal.rows[0].totalusers
  };
}

//#region => query para desativar ou reativar usuário
async function isAtivoRepository(id) {

  //abre a conexão com o banco de dados
  const db = await openDb();

  //excuta query para verificar o status atual e se existe
  const result = await db.query(`
      SELECT id, ativo 
      FROM usuarios
      WHERE id = $1 `, [id]
  );

  //retorna o resultado da consulta como booleano para o service
  return result.rows[0] || null;

}


//2º passo: se o usuário existir, inativa ou reativa o usuário
async function onOffUserRepository(newValue, id) {

  //abre a conexão com o banco de dados
  const db = await openDb();
console.log(id, newValue);
  //executa a query para inativar ou reativar o usuário
  const result = await db.query(`
      UPDATE usuarios
      SET ativo = $1
      WHERE id = $2
    `, [newValue, id]);

  //verifica se a atualização foi bem-sucedida
  if (result.rowCount === 0) {
    throw new Error('Não foi possível atualizar o status.');
  }

  //retorna o resultado da update
  return {
    success: result.rowCount > 0,
    ativo: newValue
  }
}

//#endregion

export {
  listarUsuariosRepository,
  checkEmailRepository,
  checkCpfRepository,
  cadastrarUserRepository,
  countUserRepository,
  isAtivoRepository,
  onOffUserRepository
}
