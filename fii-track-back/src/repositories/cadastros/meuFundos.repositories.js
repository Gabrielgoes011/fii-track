import { openDb } from "../../config/configDb.js";

//#region => Query para listar os fundos cadastrados
async function listarFundosRepository() {

    //abre a conexão com o banco de dados
    const db = await openDb();

    //Executa a consulta SQL para listar os fundos
    const resultadoFundos = await db.query(`
        SELECT
            a.id,
            a.ticker,
            a."nomeFundo",
            a.cnpj,
            b."nomeSeguimento",
            a."idUsuario",
            a."dtCadastro" 
        FROM ativos a INNER JOIN seguimentos b 
        ON a."idSeguimento" = b.id
        ORDER BY a.ticker ASC
     `
    );

    //retorna os resultados da consulta
    return resultadoFundos.rows;

}
//#endregion

// #region => Querys para cadastro de fundos
//1º passo: verificar se o ticker já existe
async function buscarFundosRepository(ticker) {

    //abre a conexão com o banco de dados
    const db = await openDb();

    //Executa a consulta para verificar se ja existe
    const resultado = await db.query(`
        SELECT id
        FROM ativos
        WHERE ticker = $1`, [ticker]
    );

    //ticker precisa ser único, então retorna o primeiro resultado encontrado ou null se não existir
    return resultado.rows[0];
}

//2º passo: se o ticker não existir, verifica se o cnpj já existe
async function checkCnpjRepository(cnpj) {

    //executa a consulta para verificar se ja existe
    const db = await openDb();
    const resultadoCnpj = await db.query(`
        SELECT id
        FROM ativos
        WHERE cnpj = $1`, [cnpj]
    );

    //retorna o resultado da consulta
    return resultadoCnpj.rows[0];
}

//3º passo: se o ticker não existir, cadastra o fundo
async function cadastrarFundosRepository(dados) {

    //abre a conexão com o banco de dados
    const db = await openDb();

    //Executa a consulta SQL para inserir um novo fundo
    const insertFundos = await db.query(`
        INSERT INTO ativos
            ("ticker", "nomeFundo", cnpj, "idSeguimento", "dtCadastro")  
        VALUES
            ($1, $2, $3, $4, now())
        RETURNING id, "ticker", "nomeFundo"`,
        [
            dados.ticker,
            dados.nomeFundo,
            dados.cnpj,
            dados.idSeguimento
        ]
    );

    //retorna o resultado da consulta
    return insertFundos.rows[0];
}
//#endregion

//#region => Query para contar fundos ativos
async function contarFundosRepository() {
    //abre a conexão com o banco de dados
    const db = await openDb();

    //Executa a consulta SQL para contar os fundos ativos
    const resultado = await db.query(`
        SELECT COUNT(*) total
        FROM ativos
    `);

    //retorna o resultado da consulta
    return resultado.rows[0].total;
}
//#endregion

//#region => Querys para deletar um fundo

// 1º passo: verificar se o fundo tem operações realizadas
async function checkOperacaoRepository(id) {
    //abre a conexão com o banco de dados
    const db = await openDb();

    //Executa a consulta SQL para deletar um fundo
    const resultado = await db.query(`
        SELECT id
        FROM operacoes
        WHERE "idAtivo" = $1`, [id]
    );

    //retorna o resultado da consulta
    return resultado.rows[0];
}

//2º passo: se nao tiver operações, deleta o fundo
async function deletarFundoRepository(id) {
    //abre a conexão com o banco de dados
    const db = await openDb();

    //Executa a consulta SQL para deletar um fundo
    const ResultDel = await db.query(`
        DELETE 
        FROM ativos
        WHERE id = $1`, [id]
    );

    //retorna o resultado da consulta
    return ResultDel.rowCount;
}
//#endregion

//#region => Query para alterar nome do fundo
async function editarNomeFundoRepository(id, nomeFundo) {
    //abre a conexão com o banco de dados
    const db = await openDb();

    //Executa a consulta SQL para alterar o nome do fundo
    const resultado = await db.query(`
        UPDATE ativos
        SET "nomeFundo" = $1
        WHERE id = $2
        RETURNING id, "nomeFundo"`, [nomeFundo, id]
    );

    //retorna o resultado da consulta
    return resultado.rows[0];
}






export {
    listarFundosRepository,
    buscarFundosRepository,
    checkCnpjRepository,
    cadastrarFundosRepository,
    contarFundosRepository,
    checkOperacaoRepository,
    deletarFundoRepository,
    editarNomeFundoRepository
}