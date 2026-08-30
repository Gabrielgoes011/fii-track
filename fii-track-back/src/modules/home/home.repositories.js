import { openDb } from '../../config/configDb.js';


//#region => Query para listar os dados do card
async function getCardsHome(idUser) {

    //abre conexão com o banco de dados
    const db = await openDb();

    //query para contar o número de linhas na tabela "operacoes" 
    const resultadoOperacao = await db.query(`
            SELECT 
                COUNT(*) linhas
            FROM operacoes
            WHERE "idUser" = $1
        `, [idUser]);

    //query para contar o número de linhas na tabela "ativos"
    const resultadoFundos = await db.query(`
            SELECT 
                COUNT(*) linhas
            FROM ativos
            WHERE "idUser" = $1
        `, [idUser]);

    //retorna os resultados da consulta para o controller ou repository
    return {
        resultadoOperacao: resultadoOperacao.rows,
        resultadoFundos: resultadoFundos.rows
    };

}
//#endregion

export {
    getCardsHome
}