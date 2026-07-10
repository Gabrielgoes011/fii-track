import apiResponse from '../utils/httpResponse.js';
import {
    listarRendimentos,
    carregarGraficoDashboard,
    carregarComparacaoAnual,
    carregarAtivosParaModal,
    criarRendimento,
    excluirRendimento,
    calculoCardsRendimento
} from '../services/rendimentos.services.js';

//#region Listar rendimentos
async function listarRendimentosController(req, res) {
    try {
        const idUser = req.user.id;
        const { mes, ano, idAtivo } = req.body;

        const rendimentos = await listarRendimentos({ mes, ano, idUser, idAtivo });

        return apiResponse.success(res, 'Rendimentos listados com sucesso.', rendimentos);

    } catch (error) {
        return apiResponse.error(res, error.message);
    }
}
//#endregion

//#region Carregar dados do gráfico dashboard (mensal + anual)
async function carregarGraficoDashboardController(req, res) {
    try {
        const idUser = req.user.id;
        const { ano } = req.body;

        const dados = await carregarGraficoDashboard({ ano, idUser });

        return apiResponse.success(res, 'Dados do gráfico carregados com sucesso.', dados);

    } catch (error) {
        return apiResponse.error(res, error.message);
    }
}
//#endregion

//#region Carregar comparação mensal entre múltiplos anos
async function carregarComparacaoAnualController(req, res) {
    try {
        const idUser = req.user.id;
        const { anos } = req.body;

        const dados = await carregarComparacaoAnual({ anos, idUser });

        return apiResponse.success(res, 'Comparação anual carregada com sucesso.', dados);

    } catch (error) {
        return apiResponse.error(res, error.message);
    }
}
//#endregion

//#region Carregar ativos para o dropdown do modal de novo rendimento
async function carregarDadosModalNovoRendimentoController(req, res) {
    try {
        const idUser = req.user.id;

        const ativos = await carregarAtivosParaModal(idUser);

        return apiResponse.success(res, 'Ativos carregados com sucesso.', ativos);

    } catch (error) {
        return apiResponse.error(res, error.message);
    }
}
//#endregion

//#region Criar novo rendimento
async function criarRendimentoController(req, res) {
    try {
        const idUser = req.user.id;
        const { idAtivo, dtRendimento, valorRecebido } = req.body;

        const resultado = await criarRendimento({ idAtivo, dtRendimento, valorRecebido, idUser });

        return apiResponse.success(res, 'Rendimento lançado com sucesso!', resultado, 201);

    } catch (error) {
        return apiResponse.error(res, error.message);
    }
}
//#endregion

//#region Excluir um rendimento pelo seu ID
async function deleteRendimentoController(req, res) {
    try {
        const idUser = req.user.id;
        const { id } = req.params;

        await excluirRendimento(id, idUser);

        return apiResponse.success(res, 'Rendimento excluído com sucesso.');

    } catch (error) {
        return apiResponse.error(res, error.message);
    }
}
//#endregion

//#region Carregar dados dos cards de KPIs
async function getCardsRendimentos(req, res) {
    try {
        const idUser = req.user.id;
        const { mes, ano, idAtivo } = req.body;

        // Sanitiza mes: null, undefined, 'Todos', 0 ou NaN → null (busca o ano inteiro)
        const mesSanitizado =
            mes == null || mes === '' || mes === 'Todos' || isNaN(Number(mes))
                ? null
                : Number(mes);

        // Sanitiza idAtivo: null, undefined, 'Todos' ou string vazia → null
        const idAtivoSanitizado =
            idAtivo == null || idAtivo === '' || idAtivo === 'Todos'
                ? null
                : Number(idAtivo);

        // Sanitiza ano para número
        const anoSanitizado = ano != null ? Number(ano) : null;

        const cards = await calculoCardsRendimento(mesSanitizado, anoSanitizado, idAtivoSanitizado, idUser);

        //
        return apiResponse.success(res,
            'Dados dos cards calculados com sucesso.', cards);
    }
    //caso ocorra algum erro, retorna a mensagem de erro
    catch (error) {
        return apiResponse.error(res, error.message);
    }
}
//#endregion

export {
    listarRendimentosController,
    carregarGraficoDashboardController,
    carregarComparacaoAnualController,
    carregarDadosModalNovoRendimentoController,
    criarRendimentoController,
    deleteRendimentoController,
    getCardsRendimentos
};
