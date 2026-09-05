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

    // Resumo financeiro da carteira (espelha o cálculo do módulo controleAtivos):
    //  - posicao: quantidade líquida e preço médio (custo das compras / qtd comprada) por ativo
    //  - saldoAtual  = Σ (quantidade × cotação atual)
    //  - custoTotal  = Σ (quantidade × preço médio)
    //  - proventos   = Σ rendimentos recebidos
    const resultadoResumo = await db.query(`
            WITH operacoes_agg AS (
                SELECT
                    o."idAtivo",
                    SUM(CASE WHEN o.tipo = 'Compra' THEN o.quantidade ELSE -o.quantidade END) "quantidadeLiquida",
                    SUM(CASE WHEN o.tipo = 'Compra' THEN o.quantidade ELSE 0 END) "quantidadeComprada",
                    SUM(CASE WHEN o.tipo = 'Compra' THEN o.quantidade * o.preco ELSE 0 END) "custoCompras"
                FROM operacoes o
                WHERE o."idUser" = $1
                GROUP BY o."idAtivo"
            ),
            posicao AS (
                SELECT
                    "idAtivo",
                    "quantidadeLiquida" "quantidade",
                    "custoCompras" / NULLIF("quantidadeComprada", 0) "precoMedio"
                FROM operacoes_agg
            )
            SELECT
                COALESCE(SUM(COALESCE(p.quantidade, 0) * COALESCE(f.preco, 0)), 0) "saldoAtual",
                COALESCE(SUM(COALESCE(p.quantidade, 0) * COALESCE(p."precoMedio", 0)), 0) "custoTotal",
                COALESCE((
                    SELECT SUM(r."valorRecebido")
                    FROM rendimentos r
                    WHERE r."idUser" = $1
                ), 0) "proventos"
            FROM "controleAtivos" a
            INNER JOIN ativos b ON b.id = a."idAtivo"
            LEFT JOIN posicao p ON p."idAtivo" = a."idAtivo"
            LEFT JOIN cotacoes f ON f.ticker = b.ticker
            WHERE a."idUser" = $1
        `, [idUser]);

    // Renda mensal: total de proventos e quantidade de meses distintos (ano+mês)
    // que tiveram rendimento. A média é calculada no service (total / meses).
    const resultadoRendaMensal = await db.query(`
            SELECT
                COALESCE(SUM("valorRecebido"), 0) "totalProventos",
                COUNT(DISTINCT (EXTRACT(YEAR FROM "dtRendimento") * 12 + EXTRACT(MONTH FROM "dtRendimento"))) "mesesComRendimento"
            FROM rendimentos
            WHERE "idUser" = $1
        `, [idUser]);

    //retorna os resultados da consulta para o controller ou repository
    return {
        resultadoOperacao: resultadoOperacao.rows,
        resultadoFundos: resultadoFundos.rows,
        resultadoResumo: resultadoResumo.rows,
        resultadoRendaMensal: resultadoRendaMensal.rows
    };

}
//#endregion

export {
    getCardsHome
}