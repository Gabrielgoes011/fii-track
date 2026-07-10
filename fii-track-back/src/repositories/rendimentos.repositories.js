import { openDb } from '../config/configDb.js';

//#region Listar rendimentos por ano (e opcionalmente por mês)
async function findRendimentos({ mes, ano, idUser }) {

    // Abre a conexão com o banco de dados
    const db = await openDb();

    // Query base — filtra sempre pelo ano e pelo usuário
    let query = `
        SELECT
            a.id,
            a."dtRendimento",
            b.id   AS "idAtivo",
            b.ticker,
            c."nomeSeguimento",
            a."valorRecebido"
        FROM rendimentos a INNER JOIN ativos b
            ON a."idAtivo" = b.id
        INNER JOIN seguimentos c
            ON c.id = b."idSeguimento"
        WHERE
            a."idUser" = $1 AND
            EXTRACT(YEAR FROM a."dtRendimento") = $2
    `;
<<<<<<< Updated upstream
    const params = [idUser, ano];

    // Adiciona filtro de mês somente quando informado (não é null, undefined ou "Todos")
    if (mes && mes !== 'Todos') {
=======

    // Prepara os parâmetros da query
    const params = [ano];

    // Adiciona filtro de mês somente quando informado (null = todos os meses)
    if (mes !== null && mes !== undefined && mes !== 'Todos') {

        // Adiciona filtro de mês à query e ao array de parâmetros
>>>>>>> Stashed changes
        query += ` AND EXTRACT(MONTH FROM a."dtRendimento") = $${params.length + 1} `;

        //inclui o mês no array de parâmetros
        params.push(mes);
    }

<<<<<<< Updated upstream
=======
    // Adiciona filtro de ativo somente quando informado
    if (idAtivo) {

        // Adiciona filtro de ativo à query e ao array de parâmetros
        query += ` AND a."idAtivo" = $${params.length + 1} `;

        //inclui o id do ativo no array de parâmetros
        params.push(idAtivo);
    }

    //finaliza query ordenando
>>>>>>> Stashed changes
    query += ` ORDER BY a."dtRendimento" DESC `;

    // Executa a query 
    const result = await db.query(query, params);

    // Retorna os rendimentos encontrados (array de objetos)
    return result.rows;
}
//#endregion

//#region Carregar dados do gráfico dashboard (mensal + anual)
async function findDadosGraficoDashboard({ ano, idUser }) {

    // Abre a conexão com o banco de dados
    const db = await openDb();

    // Total de rendimentos agrupado por mês do ano informado
    const detalheMensal = await db.query(`
        SELECT
            EXTRACT(MONTH FROM "dtRendimento") mes,
            EXTRACT(YEAR  FROM "dtRendimento") ano,
            SUM("valorRecebido") "totalRendimento"
        FROM rendimentos
<<<<<<< Updated upstream
        WHERE "idUser" = $1 AND EXTRACT(YEAR FROM "dtRendimento") = $2
=======
        WHERE 
            EXTRACT(YEAR FROM "dtRendimento") = $1
>>>>>>> Stashed changes
        GROUP BY
            EXTRACT(YEAR  FROM "dtRendimento"),
            EXTRACT(MONTH FROM "dtRendimento")
        ORDER BY ano, mes;
    `, [idUser, ano]);

    // Total de rendimentos agrupado por ano (todos os anos do usuário)
    const detalheAnual = await db.query(`
        SELECT
            EXTRACT(YEAR FROM "dtRendimento") ano,
            SUM("valorRecebido") "totalRendimento"
        FROM rendimentos
        WHERE "idUser" = $1
        GROUP BY
            EXTRACT(YEAR FROM "dtRendimento")
        ORDER BY ano;
    `, [idUser]);

    // Retorna os dois conjuntos de dados juntos
    return {
        detalheMensal: detalheMensal.rows,
        detalheAnual: detalheAnual.rows,
    };
}
//#endregion

//#region Carregar comparação mensal entre múltiplos anos
async function findComparacaoAnual({ anos, idUser }) {

    // Abre a conexão com o banco de dados
    const db = await openDb();

    // Agrupa rendimentos por mês/ano filtrando apenas os anos solicitados
    const result = await db.query(`
        SELECT
            EXTRACT(MONTH FROM "dtRendimento") mes,
            EXTRACT(YEAR  FROM "dtRendimento") ano,
            SUM("valorRecebido") "totalRendimento"
        FROM rendimentos
<<<<<<< Updated upstream
        WHERE "idUser" = $1 AND EXTRACT(YEAR FROM "dtRendimento") = ANY($2::int[])
=======
        WHERE 
            EXTRACT(YEAR FROM "dtRendimento") = ANY($1::int[])
>>>>>>> Stashed changes
        GROUP BY ano, mes
        ORDER BY ano, mes;
    `, [idUser, anos.map(Number)]);

    return result.rows;
}
//#endregion

//#region Carregar ativos para o dropdown do modal de novo rendimento
async function findAtivosParaModal(idUser) {

    // Abre a conexão com o banco de dados
    const db = await openDb();

    // Busca todos os ativos do usuário com seus respectivos segmentos
    const result = await db.query(`
        SELECT
            a.id  "idAtivo",
            a.ticker,
            b.id "idSeguimento",
            b."nomeSeguimento"
        FROM ativos a INNER JOIN seguimentos b
            ON a."idSeguimento" = b.id
        WHERE a."idUser" = $1
        ORDER BY a.ticker ASC;
    `, [idUser]);

    //retorna a lista de ativos com seus segmentos
    return result.rows;
}
//#endregion

//#region Inserir novo rendimento
async function insertRendimento({ idAtivo, dtRendimento, valorRecebido, idUser }) {

    const db = await openDb();

    const result = await db.query(`
        INSERT INTO rendimentos ("idAtivo", "dtRendimento", "valorRecebido", "idUser")
        VALUES ($1, $2, $3, $4)
        RETURNING id, "idAtivo", "dtRendimento", "valorRecebido"
    `, [idAtivo, dtRendimento, valorRecebido, idUser]);

    return result.rows[0];
}
//#endregion

//#region Excluir um rendimento pelo seu ID (garante que pertence ao usuário)
async function deleteRendimento(id, idUser) {

    // Abre a conexão com o banco de dados
    const db = await openDb();

    // Deleta o rendimento pelo ID apenas se pertencer ao usuário
    const result = await db.query(`
        DELETE
        FROM rendimentos
        WHERE id = $1 AND "idUser" = $2
    `, [id, idUser]);

    // Retorna o número de linhas afetadas
    return result.rowCount;
}
//#endregion

//#region => Sequencia de querys para card de rendimentos.
async function getRendimentosFiltro(mes, ano, idAtivo, idUser) {

    // Abre a conexão com o banco de dados
    const db = await openDb();

    //passa a query
    const result = await db.query(`
        SELECT 
            SUM("valorRecebido") "totalPeriodo"
        FROM rendimentos
        WHERE 
            "idUser" = $1 AND
            (EXTRACT(MONTH FROM "dtRendimento") = $2 OR $2 IS NULL) AND
            (EXTRACT(YEAR FROM "dtRendimento") = $3 OR $3 IS NULL) AND
            ("idAtivo" = $4 OR $4 IS NULL)
            `, [idUser, mes, ano, idAtivo]);

    // Extrai o valor, converte para número e garante que não retorne nulo
    return Number(result.rows[0].totalPeriodo) || 0;

}

// Total acumulado de rendimentos do usuário (sem filtro de período)
async function getTotalAcumulado(idUser) {

    // Abre a conexão com o banco de dados
    const db = await openDb();

    //passa a query
    const result = await db.query(`
         SELECT 
            SUM("valorRecebido") "valorTotalRecebido"
        FROM rendimentos
        WHERE "idUser" = $1
    `, [idUser]);

    // Extrai o valor, converte para número e garante que não retorne nulo
    return Number(result.rows[0].valorTotalRecebido) || 0;
}

// Total investido apenas nas operações de compra do usuário
async function getTotalCompras(idUser) {

    // Abre a conexão com o banco de dados
    const db = await openDb();

    //passa a query
    const result = await db.query(`
        SELECT 
            SUM(preco * quantidade) "totalInvestido"
        FROM operacoes
        WHERE tipo = 'Compra' AND "idUser" = $1
    `, [idUser]);

    // Extrai o valor, converte para número e garante que não retorne nulo
    return Number(result.rows[0].totalInvestido) || 0;
}

// Total reinvestido pelo usuário
async function getTotalReinvestido(idUser) {
    // Abre a conexão com o banco de dados
    const db = await openDb();

    // passa a query
    const result = await db.query(`
         SELECT 
            SUM("valorRecebido") "totalReinvestido"
        FROM rendimentos
        WHERE reinvestido = 'True' AND "idUser" = $1
    `, [idUser]);

    // Extrai o valor, converte para número e garante que não retorne nulo
    return Number(result.rows[0].totalReinvestido) || 0;
}
//#endregion 


export {
    findRendimentos,
    findDadosGraficoDashboard,
    findComparacaoAnual,
    findAtivosParaModal,
    insertRendimento,
    deleteRendimento,
    getRendimentosFiltro,
    getTotalAcumulado,
    getTotalCompras,
    getTotalReinvestido
};
