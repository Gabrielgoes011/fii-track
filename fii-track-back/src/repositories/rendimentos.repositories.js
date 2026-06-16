import { openDb } from '../config/configDb.js';

// ─────────────────────────────────────────────────────────────────────────────
// REPOSITÓRIO — rendimentos
// Responsabilidade: apenas executar queries no banco de dados.
// Nenhuma regra de negócio aqui.
// ─────────────────────────────────────────────────────────────────────────────

//#region Listar rendimentos por ano (e opcionalmente por mês)
// Parâmetros: { mes, ano }
// Retorna: [ { id, dtRendimento, ticker, nomeSeguimento, valorRecebido } ]
async function findRendimentos({ mes, ano }) {

    // Abre a conexão com o banco de dados
    const db = await openDb();

    // Query base — filtra sempre pelo ano
    let query = `
        SELECT
            a.id,
            a."dtRendimento",
            b.ticker,
            c."nomeSeguimento",
            a."valorRecebido"
        FROM rendimentos a
        INNER JOIN ativos b
            ON a."idAtivo" = b.id
        INNER JOIN seguimentos c
            ON c.id = b."idSeguimento"
        WHERE
            EXTRACT(YEAR FROM a."dtRendimento") = $1
    `;
    const params = [ano];

    // Adiciona filtro de mês somente quando informado
    if (mes !== 'Todos') {
        query += ` AND EXTRACT(MONTH FROM a."dtRendimento") = $2 `;
        params.push(mes);
    }

    query += ` ORDER BY a."dtRendimento" DESC `;

    // Executa a query e retorna as linhas
    const result = await db.query(query, params);
    return result.rows;
}
//#endregion

//#region Carregar dados do gráfico dashboard (mensal + anual)
// Parâmetros: { ano }
// Retorna: { detalheMensal: [...], detalheAnual: [...] }
async function findDadosGraficoDashboard({ ano }) {

    // Abre a conexão com o banco de dados
    const db = await openDb();

    // Total de rendimentos agrupado por mês do ano informado
    const detalheMensal = await db.query(`
        SELECT
            EXTRACT(MONTH FROM "dtRendimento") AS mes,
            EXTRACT(YEAR  FROM "dtRendimento") AS ano,
            SUM("valorRecebido")               AS "totalRendimento"
        FROM rendimentos
        WHERE EXTRACT(YEAR FROM "dtRendimento") = $1
        GROUP BY
            EXTRACT(YEAR  FROM "dtRendimento"),
            EXTRACT(MONTH FROM "dtRendimento")
        ORDER BY ano, mes;
    `, [ano]);

    // Total de rendimentos agrupado por ano (todos os anos)
    const detalheAnual = await db.query(`
        SELECT
            EXTRACT(YEAR FROM "dtRendimento") AS ano,
            SUM("valorRecebido")              AS "totalRendimento"
        FROM rendimentos
        GROUP BY
            EXTRACT(YEAR FROM "dtRendimento")
        ORDER BY ano;
    `);

    // Retorna os dois conjuntos de dados juntos
    return {
        detalheMensal: detalheMensal.rows,
        detalheAnual:  detalheAnual.rows,
    };
}
//#endregion

//#region Carregar comparação mensal entre múltiplos anos
// Parâmetros: { anos: [2023, 2024, 2025, 2026] }
// Retorna: [ { mes, ano, totalRendimento } ]
async function findComparacaoAnual({ anos }) {

    // Abre a conexão com o banco de dados
    const db = await openDb();

    // Agrupa rendimentos por mês/ano filtrando apenas os anos solicitados
    const result = await db.query(`
        SELECT
            EXTRACT(MONTH FROM "dtRendimento") AS mes,
            EXTRACT(YEAR  FROM "dtRendimento") AS ano,
            SUM("valorRecebido")               AS "totalRendimento"
        FROM rendimentos
        WHERE EXTRACT(YEAR FROM "dtRendimento") = ANY($1::int[])
        GROUP BY ano, mes
        ORDER BY ano, mes;
    `, [anos.map(Number)]);

    return result.rows;
}
//#endregion

//#region Carregar ativos para o dropdown do modal de novo rendimento
// Sem parâmetros
// Retorna: [ { idAtivo, ticker, idSeguimento, nomeSeguimento } ]
async function findAtivosParaModal() {

    // Abre a conexão com o banco de dados
    const db = await openDb();

    // Busca todos os ativos com seus respectivos segmentos
    const result = await db.query(`
        SELECT
            a.id           AS "idAtivo",
            a.ticker,
            b.id           AS "idSeguimento",
            b."nomeSeguimento"
        FROM ativos a
        INNER JOIN seguimentos b
            ON a."idSeguimento" = b.id
        ORDER BY a.ticker ASC;
    `);

    return result.rows;
}
//#endregion

//#region Excluir um rendimento pelo seu ID
// Parâmetros: id (number | string)
// Retorna: rowCount (number) — 0 se não encontrado, 1 se deletado
async function deleteRendimento(id) {

    // Abre a conexão com o banco de dados
    const db = await openDb();

    // Deleta o rendimento pelo ID
    const result = await db.query(`
        DELETE
        FROM rendimentos
        WHERE id = $1
    `, [id]);

    // Retorna o número de linhas afetadas
    return result.rowCount;
}
//#endregion

export {
    findRendimentos,
    findDadosGraficoDashboard,
    findComparacaoAnual,
    findAtivosParaModal,
    deleteRendimento,
};
