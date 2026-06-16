import {
    findRendimentos,
    findDadosGraficoDashboard,
    findComparacaoAnual,
    findAtivosParaModal,
    deleteRendimento,
} from '../repositories/rendimentos.repositories.js';

// ─────────────────────────────────────────────────────────────────────────────
// SERVICES — rendimentos
// Responsabilidade: validações, regras de negócio e orquestração.
// Não acessa o banco diretamente — delega ao repositório.
// ─────────────────────────────────────────────────────────────────────────────


//#region Listar rendimentos por ano (e opcionalmente por mês)
async function listarRendimentos({ mes, ano }) {
    try {

        // Valida se o ano foi informado
        if (!ano) {
            throw new Error('O campo "ano" é obrigatório.');
        }

        // Busca os rendimentos no repositório
        const rendimentos = await findRendimentos({ mes, ano });

        // Retorna array vazio quando não há registros (não é um erro)
        return rendimentos;

    } catch (error) {
        throw new Error(`Erro ao listar rendimentos: ${error.message}`);
    }
}
//#endregion


//#region Carregar dados do gráfico dashboard (mensal + anual)
async function carregarGraficoDashboard({ ano }) {
    try {

        // Valida se o ano foi informado
        if (!ano) {
            throw new Error('O campo "ano" é obrigatório.');
        }

        // Busca os dados agrupados no repositório
        const dados = await findDadosGraficoDashboard({ ano });

        // Retorna o objeto com os dois conjuntos de dados
        return dados;

    } catch (error) {
        throw new Error(`Erro ao carregar dados do gráfico: ${error.message}`);
    }
}
//#endregion


//#region Carregar comparação mensal entre múltiplos anos
async function carregarComparacaoAnual({ anos }) {
    try {

        // Valida se o array de anos foi informado e não está vazio
        if (!Array.isArray(anos) || anos.length === 0) {
            throw new Error('Informe ao menos um ano no campo "anos".');
        }

        // Busca os dados comparativos no repositório
        const dados = await findComparacaoAnual({ anos });

        return dados;

    } catch (error) {
        throw new Error(`Erro ao carregar comparação anual: ${error.message}`);
    }
}
//#endregion


//#region Carregar ativos para o dropdown do modal de novo rendimento
async function carregarAtivosParaModal() {
    try {

        // Busca os ativos com seus segmentos no repositório
        const ativos = await findAtivosParaModal();

        return ativos;

    } catch (error) {
        throw new Error(`Erro ao carregar ativos para o modal: ${error.message}`);
    }
}
//#endregion


//#region Excluir um rendimento pelo seu ID
async function excluirRendimento(id) {
    try {

        // Valida se o ID foi informado
        if (!id) {
            throw new Error('O ID do rendimento é obrigatório.');
        }

        // Chama o repositório para executar a exclusão
        const rowCount = await deleteRendimento(id);

        // Nenhuma linha afetada significa que o ID não existe
        if (rowCount === 0) {
            throw new Error('Rendimento não encontrado.');
        }

        // Retorna o número de linhas deletadas (sempre 1 quando bem-sucedido)
        return rowCount;

    } catch (error) {
        throw new Error(`Erro ao excluir rendimento: ${error.message}`);
    }
}
//#endregion


export {
    listarRendimentos,
    carregarGraficoDashboard,
    carregarComparacaoAnual,
    carregarAtivosParaModal,
    excluirRendimento,
};
