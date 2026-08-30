import { openDb } from '../../config/configDb.js';

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
            password,
            adm,
            "auth2faTotp",
            "secretAuth2fa"
        FROM "credenciaisUsuario"
        WHERE "idUser" = $1`,
        [userId]
    );

    // Retorna a senha encontrada ou undefined se não houver correspondência
    return result.rows[0];
}
//#endregion

//#region => Queries para 2FA
// 3. Buscar credenciais + email do usuário (usado no fluxo de ativação do 2FA)
async function findCredentialsByUserId(usuarioId) {

    // Abre a conexão com o banco de dados
    const db = await openDb();

    const result = await db.query(`
        SELECT cu.*, u.email
        FROM "credenciaisUsuario" cu
        INNER JOIN usuarios u ON u.id = cu."idUser"
        WHERE cu."idUser" = $1`,
        [usuarioId]
    );

    // Retorna as credenciais encontradas ou undefined se não houver correspondência
    return result.rows[0];
}

// 4. Atualizar dados de 2FA do usuário
async function updateCredentials2fa(usuarioId, updates) {

    // Abre a conexão com o banco de dados
    const db = await openDb();

    const fields = [];
    const values = [];
    let index = 1;

    if (updates.secretAuth2fa !== undefined) {
        fields.push(`"secretAuth2fa" = $${index++}`);
        values.push(updates.secretAuth2fa);
    }
    if (updates.auth2faTotp !== undefined) {
        fields.push(`"auth2faTotp" = $${index++}`);
        values.push(updates.auth2faTotp);
    }
    if (updates.auth2faHabilitado !== undefined) {
        fields.push(`"auth2faHabilitado" = $${index++}`);
        values.push(updates.auth2faHabilitado);
    }

    if (!fields.length) {
        throw new Error('Nenhuma atualização de 2FA fornecida.');
    }

    values.push(usuarioId);
    await db.query(`
        UPDATE "credenciaisUsuario"
        SET ${fields.join(', ')}
        WHERE "idUser" = $${index}`,
        values
    );
}
//#endregion

export {
    findUserByEmail,
    findUserCredentials,
    findCredentialsByUserId,
    updateCredentials2fa
};