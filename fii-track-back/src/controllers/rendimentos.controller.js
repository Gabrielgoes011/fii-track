import apiResponse from '../utils/httpResponse.js';
import {
    listarRendimentos,
    carregarGraficoDashboard,
    carregarComparacaoAnual,
    carregarAtivosParaModal,
    excluirRendimento,
    calculoCardsRendimento
} from '../services/rendimentos.services.js';

// ─────────────────────────────────────────────────────────────────────────────
// CONTROLLER — rendimentos
// Responsabilidade: extrair dados da requisição, chamar o service
// e devolver a resposta HTTP. Sem regras de negócio e sem queries.
// ─────────────────────────────────────────────────────────────────────────────

//#region Listar rendimentos
async function listarRendimentosController(req, res) {
    try {
        const idUser = req.user.id;
        const { mes, ano } = req.body;

        const rendimentos = await listarRendimentos({ mes, ano, idUser });

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

        const cards = await calculoCardsRendimento(mes, ano, idAtivo, idUser);

        return apiResponse.success(res, 'Dados dos cards calculados com sucesso.', cards);
    }
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
    deleteRendimentoController,
    getCardsRendimentos
};
