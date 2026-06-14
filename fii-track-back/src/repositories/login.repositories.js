import { openDb } from '../config/configDb.js';

//#region => Queries para login

// 1. Buscar usuário pelo email com todos os dados
async function findUserByEmail(email) {
    const db = await openDb();
    
    const result = await db.query(
        `SELECT id, nome, email, ativo
         FROM usuarios
         WHERE LOWER(email) = LOWER($1)`,
        [email]
    );
    
    return result.rows[0];
}

// 2. Buscar credenciais (senha) do usuário
async function findUserCredentials(userId) {
    const db = await openDb();
    
    const result = await db.query(
        `SELECT password 
         FROM "credenciaisUsuario" 
         WHERE "idUser" = $1`,
        [userId]
    );

    return result.rows[0];
}

//#endregion

export {
    findUserByEmail,
    findUserCredentials
};