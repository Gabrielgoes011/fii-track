import { openDb } from '../config/configDb.js';

//#region => Queries para login
// 1. Buscar usuário pelo email com todos os dados
async function findUserByEmail(email) {

    // Abre a conexão com o banco de dados
    const db = await openDb();
    
    const result = await db.query(`
        SELECT 
            id, nome, email, ativo
        FROM usuarios
        WHERE LOWER(email) = LOWER($1)`,
        [email]
    );
    
    // Retorna o usuário encontrado ou undefined se não houver correspondência
    return result.rows[0];
}

// 2. Buscar credenciais (senha) do usuário
async function findUserCredentials(userId) {

    // Abre a conexão com o banco de dados
    const db = await openDb();
    
    // Executa a query para buscar a senha do usuário pelo ID
    const result = await db.query(`
        SELECT 
            password 
        FROM "credenciaisUsuario" 
        WHERE "idUser" = $1 `, 
        [userId] 
    );

    // Retorna a senha encontrada ou undefined se não houver correspondência
    return result.rows[0];
}
//#endregion

export {
    findUserByEmail,
    findUserCredentials
};