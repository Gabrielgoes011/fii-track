import apiResponse from '../utils/httpResponse.js';
import pgErrorHandler from '../utils/pgErrorHandler.js';
import {
    getSegmentosDropListService,
    getAtivosDropListService,
    addAtivoService
} from '../services/controleAtivos.services.js';

//#region função listar segmentos para o dropdown
async function getSegmentosDropList(req, res) {
    try {

        // Pega o id do usuário logado a partir do token
        const idUser = req.user.id;

        // Chama o service para buscar os segmentos do usuário
        const result = await getSegmentosDropListService(idUser);

        // Retorna os segmentos encontrados
        return apiResponse.success(res, 'Segmentos carregados com sucesso.', result);

    } catch (error) {

        // Loga o erro no console para depuração
        console.error('Erro ao carregar segmentos para o dropdown na etapa do controller:', error);

        // Gera uma mensagem de erro segura para o usuário
        const secureMessage = pgErrorHandler(error, 'Erro ao carregar segmentos para o dropdown.');

        // Retorna a resposta de erro para o cliente
        return apiResponse.error(res, secureMessage);
    }
}
//#endregion

//#region função listar ativos por segmento
async function getAtivosDropList(req, res) {
    try {

        // Pega o id do usuário logado a partir do token
        const idUser = req.user.id;

        // Pega o id do segmento a partir dos parâmetros da requisição
        const idSegmento = Number(req.params.idSegmento);

        // Valida se o id do segmento foi fornecido
        if (!idSegmento) {
            return apiResponse.validationError(res, 'O id do segmento é obrigatório.');
        }

        // Chama o service para buscar os ativos do usuário por segmento
        const result = await getAtivosDropListService(idUser, idSegmento);

        // Retorna os ativos encontrados
        return apiResponse.success(res, 'Ativos carregados com sucesso.', result);

    } catch (error) {

        // Loga o erro no console para depuração
        console.error('Erro ao carregar ativos por segmento na etapa do controller:', error);

        // Gera uma mensagem de erro segura para o usuário
        const secureMessage = pgErrorHandler(error, 'Erro ao carregar ativos por segmento.');

        // Retorna a resposta de erro para o cliente
        return apiResponse.error(res, secureMessage);
    }
}
//#endregion

//#region função para add ativo (Objetivo da carteira)
async function addAtivoController(req, res) {
    try {

        // Pega o id do usuário logado a partir do token
        const idUser = req.user.id;

        // Pega o id do segmento a partir dos parâmetros da requisição
        const dados = {
            idAtivo: req.body.idAtivo,
            idSegmento: Number(req.params.idSegmento),
            percIdeal: req.body.percIdeal,
            objetivo: req.body.objetivo
        };

        // Valida se o id do segmento foi fornecido
        if (!dados.idSegmento) {
            return apiResponse.validationError(res, 'Tem campos faltando para adicionar o ativo.');
        }

        // Chama o service para cadastrar ativo
        const result = await addAtivoService(idUser, dados);

        // Retorna os ativos encontrados
        return apiResponse.success(res, 'Ativo adicionado com sucesso.', result);

    } catch (error) {

        // Loga o erro no console para depuração
        console.error('Erro ao adicionar ativo na etapa do controller:', error);

        // Gera uma mensagem de erro segura para o usuário
        const secureMessage = pgErrorHandler(error, 'Erro ao adicionar ativo.');

        // Retorna a resposta de erro para o cliente
        return apiResponse.error(res, secureMessage);
    }
}

// #endregion

export {
    getSegmentosDropList,
    getAtivosDropList,
    addAtivoController
}
