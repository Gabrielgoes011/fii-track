import { openDb } from "../config/configDb.js";


//#region => Query para listar os dados do card
async function getCardsHome() {

    //abre conexão com o banco de dados
    const db = await openDb();

    //chama a função do repositório para listar os dados do card
    const resultadoOperacao = await db.query(`
            SELECT 
                COUNT (*) linhas
            FROM operacoes
        `);

    const resultadoFundos = await db.query(`
            SELECT 
                COUNT (*) linhas
            FROM ativos
        `);

    //retorna os resultados da consulta
    return {
        resultadoOperacao: resultadoOperacao.rows,
        resultadoFundos: resultadoFundos.rows
    };

}
//#endregion

export {
    getCardsHome
}