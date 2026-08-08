import { openDb } from '../config/configDb.js';

export async function findCredentialsByUserId(usuarioId) {
  const db = await openDb();
  const result = await db.query(`
    SELECT cu.*, u.email
    FROM "credenciaisUsuario" cu
    INNER JOIN usuarios u ON u.id = cu."idUser"
    WHERE cu."idUser" = $1
  `, [usuarioId]);
  return result.rows[0];
}

export async function updateCredentials2fa(usuarioId, updates) {
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
    WHERE "idUser" = $${index}
  `, values);
}
