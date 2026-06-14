import { openDb } from "../../config/configDb.js";


//função auxiliar para buscar seguimento por id

//#region função listar seguimentos 
export async function listarSeguimentos(req, res) {
  const db = await openDb();
  try {
    const resultado = await db.query(`        
        SELECT id, "nomeSeguimento" AS nome 
        FROM seguimentos   
        ORDER BY "nomeSeguimento" ASC `
    );
    // Verifica se a consulta retornou resultados
    if (resultado.rows.length === 0) {
      return res.status(200).json([]);
    }
    // Retorna os resultados  
    res.status(200).json(resultado.rows);

  } catch (error) {
    // Log do erro para depuração
    console.error('Erro ao listar seguimentos:', error);
    res.status(500).json({ error: 'Erro ao listar seguimentos.' });
  }
}
//#endregion

//#region função Contar Seguimentos 
export async function contarSeguimentos(req, res) {
  const db = await openDb();
  try {
    const resultadoAtivo = await db.query(`
        SELECT COUNT(id) AS totalSeguimentos
        FROM seguimentos
    `);

    // Retorna a contagem de usuários ativos, inativos e total
    res.status(200).json({
      ativos: resultadoAtivo.rows[0].totalseguimentos,
    });
  } catch (error) {
    console.error('Erro ao contar usuários:', error);
    res.status(500).json({ error: 'Erro ao contar usuários.' });
  }
}
//#endregion

//#region Função para cadastrar seguimentos
export async function cadastrarSeguimento(req, res) {
  const dados = req.body;
  const db = await openDb();

  if (!dados.nome) {
    return res.status(400).json({ error: 'O campo nao pode ser vazio' });
  }

  const existeSeguimento = await db.query(`
      SELECT id 
      FROM seguimentos
      WHERE "nomeSeguimento" = $1 `, [dados.nome]
  );
  if (existeSeguimento.rows.length > 0) {
    return res.status(400).json({ error: 'Seguimento ja cadastrado!' });
  }

  try {
    const insertSeguimento = await db.query(`
        INSERT INTO seguimentos
          ("nomeSeguimento")
        VALUES 
          ($1)
        RETURNING id`,
      [dados.nome]
    );

    //
    return res.status(201).json({ message: 'Seguimento cadastrado com sucesso! ' });

  } catch (error) {
    return res.status(500).json({ error: 'Erro ao inserir o seguimento.', errorDetails: error.message });
  }
}
//#endregion

//#region deleteSeguimento - Função para deletar seguimentos
export async function deleteSeguimento(req, res) {
  const idSeguimento = req.params.id;
  const db = await openDb();

  try {
    const existeSeguimento = await db.query(`
        SELECT id, "nomeSeguimento" 
        FROM seguimentos
        WHERE id = $1 `, [idSeguimento]
    );
    if (existeSeguimento.rows.length === 0) {
      return res.status(400).json({ error: 'Seguimento não encontrado!' });
    }

    await db.query(` 
      DELETE 
      FROM seguimentos
      WHERE id = $1 `, [idSeguimento]
    );

    return res.json({
      statusCode: 'Sucesso (200)',
      seguimento: `${existeSeguimento.rows[0].nomeSeguimento}`,
      message: 'O seguimento foi deletado com sucesso !'
    });
  } catch (error) {
    return res.status(400).json({ error: 'Erro ao deletar o seguimento.' });
  }
}
//#endregion

// #region função para atualizar seguimento
export async function updateSeguimento(req, res) {
  //const idSeguimento = req.params.id;
  //passa id e nome pelo corpo da requisição
  const dados = req.body;
  const db = await openDb();

  if (!dados.nome) {
    return res.status(400).json({ error: 'O campo nao pode ser vazio' });
  }

  const existeSeguimento = await db.query(`
      SELECT id 
      FROM seguimentos
      WHERE id = $1 `, [dados.idSeguimento]
  );
  if (existeSeguimento.rows.length === 0) {
    return res.status(400).json({ error: 'Seguimento nao encontrado!' });
  } else {
    try {
      await db.query(`
      UPDATE seguimentos
      SET "nomeSeguimento" = $1
      WHERE id = $2`, [dados.nome, dados.idSeguimento]
      );

      //implementar log de atualização de seguimento depois de implementar tabela de logs

      return res.json({
        statusCode: 'Sucesso (200)',
        seguimento: `${dados.nome}`,
        message: 'O seguimento foi atualizado com sucesso !'
      });
    } catch (error) {
      return res.status(400).json({ error: 'Erro ao atualizar o seguimento.' });
    }
  }
}
// #endregion