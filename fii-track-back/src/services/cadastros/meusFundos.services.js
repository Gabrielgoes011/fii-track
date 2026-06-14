import {
    listarFundosRepository, //lista no grid
    buscarFundosRepository, //verifica se o ticker já existe
    cadastrarFundosRepository, //cadastra os fundos
    checkCnpjRepository, //verifica se o cnpj já existe
    checkOperacaoRepository, //verifica se o fundo tem operações cadastradas
    deletarFundoRepository, //deleta um fundo
    contarFundosRepository, //conta os fundos
    editarNomeFundoRepository //edita o nome do fundo
} from "../../repositories/cadastros/meuFundos.repositories.js";

//#region => Service para listar os fundos cadastrados
async function listarFundosService() {

    //Chama a função do repositório para listar os fundos
    const listarFundos = await listarFundosRepository();

    //retorna lista de fundos
    return listarFundos;

}
//#endregion

//#region => Service para cadastrar fundos
async function cadastrarFundosService(dados) {

    //verifica se o campo ticker está vazio
    if (!dados.ticker) {
        throw new Error(
            'O campo ticker nao pode ser vazio');
    }

    //verifica o CNPJ tem 14 caracteres
    if (dados.cnpj.length !== 14) {
        throw new Error(
            'O campo CNPJ deve conter 14 caracteres');
    }

    //chama a função do repositório para verificar se o ticker já existe
    const existeTicker = await buscarFundosRepository(dados.ticker);

    if (existeTicker) {
        throw new Error(
            'O ticker informado já está cadastrado');
    }

    //techo para garantir que cnpj ja nao esta cadastrado
    const checkCnpj = await checkCnpjRepository(dados.cnpj);

    if (checkCnpj) {
        throw new Error(
            'O CNPJ informado já está cadastrado');
    }

    //Chama a função do repositório para cadastrar os fundos
    const cadastrarFundos = await cadastrarFundosRepository(dados);

    //retorna o resultado
    return cadastrarFundos;
}
//#endregion

//#region => Service para contar fundos ativos
async function contarFundosService() {

    //Chama a função do repositório para contar os fundos ativos
    const contarFundos = await contarFundosRepository();

    //retorna o resultado
    return contarFundos;
}
//#endregion

// #region => Service para deletar fundos
async function deletarFundoService(id) {

    //chama a função do repositório para verificar se o fundo tem operações cadastradas
    const checkOperacao = await checkOperacaoRepository(id);

    //se o fundo tiver operações cadastradas, não pode ser deletado
    if (checkOperacao) {
        throw new Error(
            'Não é possível deletar um fundo que possui operações cadastradas');
    }

    //chama a função do repositório para deletar o fundo
    const deletarFundo = await deletarFundoRepository(id);

    //retorna o resultado
    return deletarFundo;
}
//#endregion

//#region => Service para editar o nome do fundo
async function editarNomeFundoService(id, nomeFundo) {

    //nome nao pode ser nullo nem vazio
    if (!nomeFundo) {
        throw new Error(
            'O campo nome nao pode ser vazio');
    }

    //chama a função do repositório para editar o nome do fundo
    const editarNomeFundo = await editarNomeFundoRepository(id, nomeFundo);

    //retorna o resultado   
    return editarNomeFundo;

}
//#endregion




export {
    listarFundosService,
    cadastrarFundosService,
    contarFundosService,
    deletarFundoService,
    editarNomeFundoService
}