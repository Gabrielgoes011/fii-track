import { pool, dbContext } from '../config/configDb.js';

export async function rlsMiddleware(req, res, next) {
  // Pega o identificador do usuário autenticado para aplicar o contexto de RLS no request.
  const userId = req.user?.id ?? null;

  // Se não houver usuário autenticado, segue sem criar transação nem contexto de RLS.
  if (!userId) {
    return next();
  }

  let client;
  let finalized = false;

  // Finaliza a transação do request, confirmando ou descartando a operação conforme o status HTTP.
  const finalizeTransaction = async (action = 'commit') => {

    // Se a transação já foi finalizada ou não há cliente, não faz nada.
    if (finalized || !client) {
      return;
    }

    finalized = true;

    // Se a transação falhar ao finalizar, apenas loga o erro, mas não impede a resposta do request.
    try {
      if (action === 'commit') {
        await client.query('COMMIT');
      } else {
        await client.query('ROLLBACK');
      }
    } catch (error) {
      console.error('❌ Falha ao finalizar a transação do RLS:', error.message);
    } finally {
      client.release();
    }
  };

  // Tenta criar uma transação e aplicar o contexto de RLS para o usuário autenticado.
  try {
    client = await pool.connect();
    req.db = client;

    // Inicia uma transação para garantir que o contexto de RLS seja aplicado apenas durante a execução do request.
    await client.query('BEGIN');

    // O PostgreSQL não aceita parâmetros bind em SET LOCAL, então o valor precisa ser convertido para um número válido.
    const numericUserId = Number(userId);

    if (!Number.isInteger(numericUserId)) {
      throw new Error('ID do usuário inválido para o contexto de RLS');
    }

    await client.query(`SET LOCAL app.current_user_id = ${numericUserId}`);

    // Usa o dbContext para disponibilizar o client e o userId para qualquer função que precise acessar o banco de dados durante o request.
    dbContext.run({ client, userId }, () => {
      res.once('finish', () => {
        const shouldCommit = res.statusCode >= 200 && res.statusCode < 400;
        finalizeTransaction(shouldCommit ? 'commit' : 'rollback');
      });

      // Garante que a transação seja finalizada mesmo que o request seja encerrado abruptamente.
      res.once('close', () => {
        const shouldCommit = res.statusCode >= 200 && res.statusCode < 400;
        finalizeTransaction(shouldCommit ? 'commit' : 'rollback');
      });

      next();
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK').catch(() => { });
      client.release();
    }

    // Loga o erro e retorna uma resposta de erro genérica para o cliente.
    next(error);
  }
}

export { dbContext };
