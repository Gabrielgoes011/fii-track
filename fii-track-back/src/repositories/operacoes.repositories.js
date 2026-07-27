import { openDb } from '../config/configDb.js';

//#Region => Query para trazer o dropList de ativos
async function getAtivosDropListRepo(idUser) {

  //abre a conexão com o banco de dados
  const db = await openDb();

  //passa a query
  const resultado = await db.query(`
        SELECT
          id, ticker
        FROM ativos
        WHERE "idUser" = $1
    `, [idUser]
  );

  // Verifica se a consulta retornou resultados
  return resultado.rows;

}
//#endregion

//#Region => Query para listar operações
async function getOperacoesRepo(idUser, campos) {

  //abrir conexão com o banco de dados
  const db = await openDb();

  //construir a query dinamicamente
  let query = `
            SELECT 
                a.id, a."dtOperacao" "dataOperacao", a.tipo, b.ticker, 
                c."nomeSeguimento" ,a.quantidade , a.preco
            FROM 
                operacoes a INNER JOIN ativos b
            ON a."idAtivo" = b.id 
            INNER JOIN seguimentos c
            ON c.id = b."idSeguimento" 
            WHERE 
                a."idUser" = $1 AND
                EXTRACT(YEAR FROM a."dtOperacao") = $2
        `;

  //define os parâmetros da query
  let params = [idUser, campos.ano];

  //se o mês não for "Todos", adicionar a condição do mês
  if (campos.mes !== 'Todos') {
    query += ` AND EXTRACT(MONTH FROM a."dtOperacao") = $3`;
    params.push(campos.mes);
  }

  //oncatena a ordaneção da query
  query += ` ORDER BY a."dtOperacao" DESC`;

  //executa a consulta da query
  const operacoes = await db.query(query, params);

  //retorna os resultados
  return operacoes.rows;

}
//#endregion

//#Region => Query para verificar se o ativo existe
async function verificarAtivoExisteRepo(idAtivo, idUser) {

  //abre a conexão com o banco de dados
  const db = await openDb();

  //consultar se o ativo existe
  const resultado = await db.query(`
    SELECT id 
    FROM ativos 
    WHERE id = $1 AND "idUser" = $2
  `, [idAtivo, idUser]);

  //retorna os resultados
  return resultado.rows;

}
//#endregion

//#Region => Query para inserir uma nova operação
async function lancarOperacaoRepo(dados, idUser) {

  //abre a conexão com o banco de dados
  const db = await openDb();

  //insere a operação no banco
  const resultado = await db.query(`
    INSERT INTO operacoes
      ("idAtivo", "dtOperacao", tipo, quantidade, preco, "idUser")
    VALUES 
      ($1, $2, $3, $4, $5, $6)
    RETURNING id
  `, [dados.idAtivo, dados.dataOperacao, dados.tipo, dados.quantidade, dados.preco, idUser]);

  //retorna o id da operação inserida
  return resultado.rows[0];

}
//#endregion

//#Region => Query para carregar dados do gráfico de operações
async function carregaDadosGraficoOperacoesRepo(idUser, campos) {

  //abre a conexão com o banco de dados
  const db = await openDb();

  //construir a query
  const query = `
    SELECT 
      EXTRACT(MONTH FROM "dtOperacao") AS mes,
      EXTRACT(YEAR FROM "dtOperacao") AS ano,
      SUM(CASE WHEN tipo = 'Compra' THEN (quantidade * preco) ELSE 0 END) AS "totalComprado",
      SUM(CASE WHEN tipo = 'Venda' THEN (quantidade * preco) ELSE 0 END) AS "totalVendido",
      SUM(CASE 
        WHEN tipo = 'Compra' THEN (quantidade * preco) 
        WHEN tipo = 'Venda' THEN -(quantidade * preco) 
        ELSE 0 
      END) AS "totalLiquido"
    FROM operacoes
    WHERE "idUser" = $1 AND EXTRACT(YEAR FROM "dtOperacao") = $2
    GROUP BY EXTRACT(YEAR FROM "dtOperacao"), EXTRACT(MONTH FROM "dtOperacao")
    ORDER BY mes
  `;

  //executa a consulta
  const resultado = await db.query(query, [idUser, campos.ano]);

  //retorna os resultados
  return resultado.rows;

}
//#endregion

//#Region => Query para excluir uma operação
async function excluirOperacaoRepo(idOperacao, idUser) {

  //abre a conexão com o banco de dados
  const db = await openDb();

  //excluir a operação (garante que pertence ao usuário)
  const resultado = await db.query(`
    DELETE 
    FROM operacoes
    WHERE id = $1 AND "idUser" = $2
  `, [idOperacao, idUser]);

  //retorna o número de linhas afetadas
  return resultado.rowCount;

}
//#endregion

//#Region => Exporta as funções do repositório
export {
  getAtivosDropListRepo,
  getOperacoesRepo,
  verificarAtivoExisteRepo,
  lancarOperacaoRepo,
  carregaDadosGraficoOperacoesRepo,
  excluirOperacaoRepo
}
//#endregion