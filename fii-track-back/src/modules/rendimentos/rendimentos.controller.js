import apiResponse from '../../utils/httpResponse.js';
import pgErrorHandler from '../../utils/pgErrorHandler.js';
import {
    listarRendimentos,
    carregarGraficoDashboard,
    carregarComparacaoAnual,
    carregarAtivosParaModal,
    criarRendimento,
    excluirRendimento,
    calculoCardsRendimento,
    importarRendimentosB3
} from './rendimentos.service.js';

//#region Listar rendimentos
async function listarRendimentosController(req, res) {
    try {
        const idUser = req.user.id;
        const { mes, ano, idAtivo } = req.body;

        const rendimentos = await listarRendimentos({ mes, ano, idUser, idAtivo });

        return apiResponse.success(res, 'Rendimentos listados com sucesso.', rendimentos);

    } catch (error) {
        console.error('Erro ao listar rendimentos na etapa do controller:', error);
        const secureMessage = pgErrorHandler(error, 'Erro ao listar os rendimentos.');
        return apiResponse.error(res, secureMessage);
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
        console.error('Erro ao carregar gráfico do dashboard de rendimentos na etapa do controller:', error);
        const secureMessage = pgErrorHandler(error, 'Erro ao carregar os dados do gráfico.');
        return apiResponse.error(res, secureMessage);
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
        console.error('Erro ao carregar comparação anual na etapa do controller:', error);
        const secureMessage = pgErrorHandler(error, 'Erro ao carregar a comparação anual.');
        return apiResponse.error(res, secureMessage);
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
        console.error('Erro ao carregar ativos para o modal de rendimento na etapa do controller:', error);
        const secureMessage = pgErrorHandler(error, 'Erro ao carregar os ativos.');
        return apiResponse.error(res, secureMessage);
    }
}
//#endregion

//#region Criar novo rendimento
async function criarRendimentoController(req, res) {
    try {
        // Obtém o ID do usuário autenticado
        const idUser = req.user.id;
        // Obtém os dados do novo rendimento do corpo da requisição
        const { idAtivo, dtRendimento, valorRecebido, reinvestido } = req.body;

        // Chama a função para criar o novo rendimento
        const resultado = await criarRendimento({ idAtivo, dtRendimento, valorRecebido, reinvestido, idUser });

        // Retorna uma resposta de sucesso com os dados do novo rendimento criado
        return apiResponse.success(res, 'Rendimento lançado com sucesso!', resultado, 201);

    } catch (error) {
        console.error('Erro ao criar rendimento na etapa do controller:', error);
        const secureMessage = pgErrorHandler(error, 'Erro ao lançar o rendimento.');
        return apiResponse.error(res, secureMessage);
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
        console.error('Erro ao excluir rendimento na etapa do controller:', error);
        const secureMessage = pgErrorHandler(error, 'Erro ao excluir o rendimento.');
        return apiResponse.error(res, secureMessage);
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
        console.error('Erro ao calcular os cards de rendimentos na etapa do controller:', error);
        const secureMessage = pgErrorHandler(error, 'Erro ao calcular os indicadores de rendimentos.');
        return apiResponse.error(res, secureMessage);
    }
}
//#endregion

//#region Importar rendimentos a partir do Excel B3
async function importarRendimentosB3Controller(req, res) {
    try {
        const idUser = req.user.id;
        const { linhas } = req.body;

        const resultado = await importarRendimentosB3(linhas, idUser);

        return apiResponse.success(res, 'Importação concluída.', resultado);

    } catch (error) {
        console.error('Erro ao importar rendimentos da B3 na etapa do controller:', error);
        const secureMessage = pgErrorHandler(error, 'Erro ao importar os rendimentos.');
        return apiResponse.error(res, secureMessage);
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
    getCardsRendimentos,
    importarRendimentosB3Controller
};
