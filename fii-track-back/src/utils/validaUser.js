import { openDb } from "../config/configDb.js"

//exporta a função de validação do usuário
export async function validaEmailExistente(email, db) {
  //verifica se o email já existe no banco de dados
  try {
    const existeEmail = await db.query(`
            SELECT id 
            FROM dbo."tabUser"
            WHERE email = $1 ` , [email]
    );
    return existeEmail.rows.length > 0 ? existeEmail.rows[0] : null; //retorna o usuário se existir, senão null
  }
  catch (error) {
    console.error('Erro ao buscar email:', error);
    throw error; // Lança o erro para ser tratado em outro lugar, se necessário
  }
}
