import { openDb } from "../config/configDb.js";

//#region função listar fundos -  (ativos/inativos)
export async function carregaAtivosDropList(req, res) {
    const db = await openDb();
    try {
        const resultado = await db.query(`        
        SELECT
          id, ticker
        FROM ativos 
        `
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

//#region função carrega grid de operações
export async function listarOperacoes(req, res) {

    try {
        //recuperar dados da requisição
        const campos = {
            mes: req.body.mes,
            ano: req.body.ano
        };

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
                EXTRACT(YEAR FROM a."dtOperacao") = $1
        `;
        let params = [campos.ano];

        //se o mês não for "Todos", adicionar a condição do mês
        if (campos.mes !== 'Todos') {
            query += ` AND EXTRACT(MONTH FROM a."dtOperacao") = $2`;
            params.push(campos.mes);
        }

        query += ` ORDER BY a."dtOperacao" DESC`;

        //consultar os dados
        const operacoes = await db.query(query, params);

        //verificar se a consulta retornou resultados
        if (operacoes.rows.length === 0) {
            return res.status(200).json([]);
        }

        //retornar os dados
        return res.status(200).json(operacoes.rows);

    } catch (error) {

        //retornar um erro detalhado em caso de falha na consulta
        return res.status(500).json({ error: 'Erro ao listar as operações.', errorDetails: error.message });
    }
}
//#endregion

//#region => função para lançar novas operações (compra ou venda)
export async function lancarOperacao(req, res) {

    try {
        //recuperar dados da requisição
        const dados = {
            idAtivo: req.body.idAtivo,
            dataOperacao: req.body.dataOperacao,
            tipo: req.body.tipo,
            quantidade: req.body.quantidade,
            preco: req.body.preco
        };

        //abrir conexão com o banco de dados
        const db = await openDb();

        //consultar se o ativo existe
        const ativo = await db.query(`
            SELECT id 
            FROM ativos 
            WHERE id = $1`, [dados.idAtivo]);

        if (ativo.rows.length === 0) {
            return res.status(400).json({ error: 'Ativo não encontrado.' });
        }

        const novasOperacao = await db.query(`
            INSERT INTO operacoes
                ("idAtivo", "dtOperacao", tipo, quantidade, preco)
            VALUES 
                ($1, $2, $3, $4, $5)
            RETURNING id`,
            [dados.idAtivo, dados.dataOperacao, dados.tipo, dados.quantidade, dados.preco]
        );

        // Retornar o ID da operação lançada
        return res.status(201).json({ message: 'Operação lançada com sucesso!', idOperacao: novasOperacao.rows[0].id });
    } catch (error) {

        // Retornar um erro detalhado em caso de falha na inserção
        return res.status(500).json({ error: 'Erro ao lançar a operação.', errorDetails: error.message });
    }
}
//#endregion

//#region => função para carregar dados no gráfico de operações (compra e venda)
export async function carregaDadosGraficoOperacoes(req, res) {
    try {
        //recuperar dados da requisição
        const campos = {
            ano: req.body.ano
        };

        //abrir conexão com o banco de dados
        const db = await openDb();

        //construir a query dinamicamente 
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
        WHERE EXTRACT(YEAR FROM "dtOperacao") = $1
        GROUP BY EXTRACT(YEAR FROM "dtOperacao"), EXTRACT(MONTH FROM "dtOperacao")
        ORDER BY mes;
        `;

        //executar a consulta e recuperar os dados do gráfico
        const dadosGrafico = await db.query(query, [campos.ano]);

        //verificar se a consulta retornou resultados
        if (dadosGrafico.rows.length === 0) {
            return res.status(200).json([]);
        }

        //retornar os dados do gráfico
        return res.status(200).json(dadosGrafico.rows);

        //retornar um erro detalhado em caso de falha na consulta
    } catch (error) {

        //retornar um erro detalhado em caso de falha na consulta
        return res.status(500).json({ error: 'Erro ao carregar os dados do gráfico.', errorDetails: error.message });
    }
}
//#endregion

//#region => função para exluir uma operação
export async function excluirOperacao(req, res) {
    try {
        //envia o id no body da requisição
        const idOperacao = req.body.id;

        //abrir conexão com o banco de dados
        const db = await openDb();

        //excluir a operação
        const resultado = await db.query(`
            DELETE 
            FROM operacoes
            WHERE id = $1
        `, [idOperacao]);

        //verificar se a operação foi excluída 
        if (resultado.rowCount === 0) {
            return res.status(404).json({ error: 'Operação não encontrada.' });
        }
        //retornar uma mensagem de sucesso
        return res.status(200).json({ message: 'Operação excluída com sucesso!' });

    } catch (error) {
        //retornar um erro detalhado em caso de falha na exclusão
        return res.status(500).json({ error: 'Erro ao excluir a operação.', errorDetails: error.message });
    }
}
//#endregion

//#region exportação das funções do controller
export default {
    listarOperacoes,
    lancarOperacao,
    carregaAtivosDropList,
    carregaDadosGraficoOperacoes,
    excluirOperacao
}

//#endregion
