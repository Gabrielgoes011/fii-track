import apiResponse from '../../utils/httpResponse.js';
import pgErrorHandler from '../../utils/pgErrorHandler.js';
import {
    getAtivosDropListService,
    getOperacoesService,
    lancarOperacaoService,
    carregaDadosGraficoOperacoesService,
    excluirOperacaoService
} from './operacoes.service.js';

//#region função listar fundos
export async function carregaAtivosDropList(req, res) {

    try {
        const idUser = req.user.id;

        //chama service que carrega dropList de ativos
        const resultado = await getAtivosDropListService(idUser);

        // Retorna os resultados  
        return apiResponse.success(res, 'Ativos carregados com sucesso.', resultado);

    } catch (error) {

        // Log do erro para depuração para o dev
        console.error('Erro ao carregar ativos para o dropdown na etapa do controller:', error);

        //erro seguro para o usuário
        const secureMessage = pgErrorHandler(error, 'Erro ao carregar ativos para o dropdown.');
        return apiResponse.error(res, secureMessage);
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
        const idUser = req.user.id;

        //chama service que lista as operações
        const operacoes = await getOperacoesService(idUser, campos);

        //retornar os resultados
        return apiResponse.success(res, 'Operações carregadas com sucesso.', operacoes);

    } catch (error) {
        // Log do erro para depuração para o dev
        console.error('Erro ao listar operações na etapa do controller:', error);

        //erro seguro para o usuário
        const secureMessage = pgErrorHandler(error, 'Erro ao listar as operações.');
        return apiResponse.error(res, secureMessage);
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
        const idUser = req.user.id;

        //chama service que lança a operação
        const operacao = await lancarOperacaoService(idUser, dados);

        // Retorna o ID da operação lançada
        return apiResponse.success(res, 'Operação lançada com sucesso!', { idOperacao: operacao.id }, 201);

    } catch (error) {

        // Log do erro para depuração para o dev
        console.error('Erro ao lançar operação na etapa do controller:', error);

        //erro seguro para o usuário
        const secureMessage = pgErrorHandler(error, 'Erro ao lançar a operação.');
        return apiResponse.error(res, secureMessage);
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
        const idUser = req.user.id;

        //chama service que carrega os dados do gráfico
        const dadosGrafico = await carregaDadosGraficoOperacoesService(idUser, campos);

        //retornar os dados do gráfico
        return apiResponse.success(res, 'Dados do gráfico carregados com sucesso.', dadosGrafico);

    } catch (error) {

        // Log do erro para depuração para o dev
        console.error('Erro ao carregar dados do gráfico na etapa do controller:', error);

        //erro seguro para o usuário
        const secureMessage = pgErrorHandler(error, 'Erro ao carregar os dados do gráfico.');
        return apiResponse.error(res, secureMessage);
    }
}
//#endregion

//#region => função para excluir uma operação
export async function excluirOperacao(req, res) {
    try {
        //envia o id no body da requisição
        const idOperacao = req.body.id;
        const idUser = req.user.id;

        //chama service que exclui a operação
        await excluirOperacaoService(idUser, idOperacao);

        //retornar uma mensagem de sucesso
        return apiResponse.success(res, 'Operação excluída com sucesso!');

    } catch (error) {

        // Log do erro para depuração para o dev
        console.error('Erro ao excluir operação na etapa do controller:', error);

        //erro seguro para o usuário
        const secureMessage = pgErrorHandler(error, 'Erro ao excluir a operação.');
        return apiResponse.error(res, secureMessage);
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
