import apiResponse from '../utils/httpResponse.js';
import {
    listarRendimentos,
    carregarGraficoDashboard,
    carregarComparacaoAnual,
    carregarAtivosParaModal,
    excluirRendimento,
} from '../services/rendimentos.services.js';

// ─────────────────────────────────────────────────────────────────────────────
// CONTROLLER — rendimentos
// Responsabilidade: extrair dados da requisição, chamar o service
// e devolver a resposta HTTP. Sem regras de negócio e sem queries.
// ─────────────────────────────────────────────────────────────────────────────

//#region Listar rendimentos
async function listarRendimentosController(req, res) {
    try {

        // Extrai os filtros do body
        const { mes, ano } = req.body;

        // Chama o service com os filtros recebidos
        const rendimentos = await listarRendimentos({ mes, ano });

        // Retorna a lista de rendimentos
        return apiResponse.success(res, 'Rendimentos listados com sucesso.', rendimentos);

    } catch (error) {
        return apiResponse.error(res, error.message);
    }
}
//#endregion

//#region Carregar dados do gráfico dashboard (mensal + anual)
async function carregarGraficoDashboardController(req, res) {
    try {

        // Extrai o ano do body
        const { ano } = req.body;

        // Chama o service para buscar os dados agrupados
        const dados = await carregarGraficoDashboard({ ano });

        // Retorna { detalheMensal, detalheAnual }
        return apiResponse.success(res, 'Dados do gráfico carregados com sucesso.', dados);

    } catch (error) {
        return apiResponse.error(res, error.message);
    }
}
//#endregion

//#region Carregar comparação mensal entre múltiplos anos
async function carregarComparacaoAnualController(req, res) {
    try {

        // Extrai o array de anos do body
        const { anos } = req.body;

        // Chama o service para buscar a comparação
        const dados = await carregarComparacaoAnual({ anos });

        // Retorna [ { mes, ano, totalRendimento } ]
        return apiResponse.success(res, 'Comparação anual carregada com sucesso.', dados);

    } catch (error) {
        return apiResponse.error(res, error.message);
    }
}
//#endregion

//#region Carregar ativos para o dropdown do modal de novo rendimento
async function carregarDadosModalNovoRendimentoController(req, res) {
    try {

        // Chama o service para buscar os ativos disponíveis
        const ativos = await carregarAtivosParaModal();

        // Retorna a lista de ativos com seus segmentos
        return apiResponse.success(res, 'Ativos carregados com sucesso.', ativos);

    } catch (error) {
        return apiResponse.error(res, error.message);
    }
}
//#endregion

//#region Excluir um rendimento pelo seu ID
async function deleteRendimentoController(req, res) {
    try {

        // Extrai o ID da URL
        const { id } = req.params;

        // Chama o service para executar a exclusão
        await excluirRendimento(id);

        // Retorna mensagem de sucesso (sem data)
        return apiResponse.success(res, 'Rendimento excluído com sucesso.');

    } catch (error) {
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
};
