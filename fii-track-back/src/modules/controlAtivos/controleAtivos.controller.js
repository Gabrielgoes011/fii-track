import apiResponse from '../../utils/httpResponse.js';
import pgErrorHandler from '../../utils/pgErrorHandler.js';
import {
    getSegmentosDropListService,
    getAtivosDropListService,
    addAtivoService,
    getControleAtivosService,
    getCotacoesCarteiraService,
    updatePercIdealService,
    updatePrecoTetoService,
    deleteAtivoService,
} from './controleAtivos.service.js';

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

        // Monta os dados a partir do body da requisição
        const dados = {
            idAtivo: req.body.idAtivo,
            idSegmento: Number(req.body.idSegmento),
            percIdeal: req.body.percIdeal,
            objetivo: req.body.objetivo
        };

        // Valida se os campos obrigatórios foram fornecidos
        if (!dados.idSegmento || !dados.idAtivo) {
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

//#region função listar controle de ativos
async function getControleAtivosController(req, res) {
    try {

        // Pega o id do usuário logado a partir do token
        const idUser = req.user.id;

        // Chama o service para buscar o controle de ativos
        const result = await getControleAtivosService(idUser);

        // Retorna os ativos encontrados
        return apiResponse.success(res, 'Controle de ativos carregado com sucesso.', result);

    } catch (error) {

        // Loga o erro no console para depuração
        console.error('Erro ao carregar controle de ativos na etapa do controller:', error);

        // Gera uma mensagem de erro segura para o usuário
        const secureMessage = pgErrorHandler(error, 'Erro ao carregar controle de ativos.');

        // Retorna a resposta de erro para o cliente
        return apiResponse.error(res, secureMessage);
    }
}
//#endregion

//#region função atualizar cotações da carteira (brapi.dev)
async function getCotacoesController(req, res) {
    try {

        // Pega o id do usuário logado a partir do token
        const idUser = req.user.id;

        // Chama o service para buscar as cotações dos ativos da carteira
        const result = await getCotacoesCarteiraService(idUser);

        // Retorna o mapa de cotações
        return apiResponse.success(res, 'Cotações atualizadas com sucesso.', result);

    } catch (error) {

        // Loga o erro no console para depuração
        console.error('Erro ao atualizar cotações na etapa do controller:', error);

        // A mensagem do erro já é amigável (vem da brapi.service / service)
        return apiResponse.error(res, error.message || 'Erro ao atualizar cotações.');
    }
}
//#endregion

//#region função atualizar percentual ideal de um ativo
async function updatePercIdealController(req, res) {
    try {

        const idUser = req.user.id;
        const idAtivo = Number(req.params.idAtivo);

        // percIdeal chega como fração (ex.: 0.10 = 10%)
        const percIdeal = Number(req.body.percIdeal);

        if (!idAtivo) {
            return apiResponse.validationError(res, 'O id do ativo é obrigatório.');
        }
        if (!Number.isFinite(percIdeal) || percIdeal < 0 || percIdeal > 1) {
            return apiResponse.validationError(res, 'Percentual ideal inválido (deve ser entre 0 e 1).');
        }

        const result = await updatePercIdealService(idUser, idAtivo, percIdeal);

        return apiResponse.success(res, 'Percentual ideal atualizado com sucesso.', result);

    } catch (error) {
        console.error('Erro ao atualizar percentual ideal na etapa do controller:', error);
        const secureMessage = pgErrorHandler(error, 'Erro ao atualizar o percentual ideal.');
        return apiResponse.error(res, secureMessage);
    }
}
//#endregion

//#region função atualizar preço teto de um ativo
async function updatePrecoTetoController(req, res) {
    try {

        const idUser = req.user.id;
        const idAtivo = Number(req.params.idAtivo);

        // modo: 'manual' (valor fixo em R$) ou 'pvp' (valor patrimonial da cota)
        const modo = req.body.modo === 'pvp' ? 'pvp' : 'manual';

        // precoTeto pode vir nulo para "limpar" o teto
        const precoTetoBruto = req.body.precoTeto;
        const precoTeto = precoTetoBruto === null || precoTetoBruto === '' || precoTetoBruto === undefined
            ? null
            : Number(precoTetoBruto);

        if (!idAtivo) {
            return apiResponse.validationError(res, 'O id do ativo é obrigatório.');
        }
        if (precoTeto !== null && (!Number.isFinite(precoTeto) || precoTeto <= 0)) {
            return apiResponse.validationError(res, 'Preço teto inválido.');
        }

        const result = await updatePrecoTetoService(idUser, idAtivo, precoTeto, modo);

        return apiResponse.success(res, 'Preço teto atualizado com sucesso.', result);

    } catch (error) {
        console.error('Erro ao atualizar preço teto na etapa do controller:', error);
        const secureMessage = pgErrorHandler(error, 'Erro ao atualizar o preço teto.');
        return apiResponse.error(res, secureMessage);
    }
}
//#endregion

//#region função remover ativo da carteira
async function deleteAtivoController(req, res) {
    try {

        const idUser = req.user.id;
        const idAtivo = Number(req.params.idAtivo);

        if (!idAtivo) {
            return apiResponse.validationError(res, 'O id do ativo é obrigatório.');
        }

        const result = await deleteAtivoService(idUser, idAtivo);

        return apiResponse.success(res, 'Ativo removido da carteira com sucesso.', result);

    } catch (error) {
        console.error('Erro ao remover ativo na etapa do controller:', error);
        const secureMessage = pgErrorHandler(error, 'Erro ao remover o ativo da carteira.');
        return apiResponse.error(res, secureMessage);
    }
}
//#endregion

export {
    getSegmentosDropList,
    getAtivosDropList,
    addAtivoController,
    getControleAtivosController,
    getCotacoesController,
    updatePercIdealController,
    updatePrecoTetoController,
    deleteAtivoController,
}
