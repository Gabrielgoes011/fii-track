import {
    findRendimentos,
    findDadosGraficoDashboard,
    findComparacaoAnual,
    findAtivosParaModal,
    insertRendimento,
    deleteRendimento,
    getRendimentosFiltro,
    getTotalAcumulado,
    getTotalCompras,
    getTotalReinvestido
} from '../repositories/rendimentos.repositories.js';

// ─────────────────────────────────────────────────────────────────────────────
// SERVICES — rendimentos
// Responsabilidade: validações, regras de negócio e orquestração.
// Não acessa o banco diretamente — delega ao repositório.
// ─────────────────────────────────────────────────────────────────────────────


//#region Listar rendimentos por ano (e opcionalmente por mês)
async function listarRendimentos({ mes, ano, idUser }) {
    try {

        // Valida se o ano foi informado
        if (!ano) {
            throw new Error('O campo "ano" é obrigatório.');
        }

        // Busca os rendimentos no repositório
        const rendimentos = await findRendimentos({ mes, ano, idUser });

        // Retorna array vazio quando não há registros (não é um erro)
        return rendimentos;

    } catch (error) {
        throw new Error(`Erro ao listar rendimentos: ${error.message}`);
    }
}
//#endregion

//#region Carregar dados do gráfico dashboard (mensal + anual)
async function carregarGraficoDashboard({ ano, idUser }) {
    try {

        // Valida se o ano foi informado
        if (!ano) {
            throw new Error('O campo "ano" é obrigatório.');
        }

        // Busca os dados agrupados no repositório
        const dados = await findDadosGraficoDashboard({ ano, idUser });

        // Retorna o objeto com os dois conjuntos de dados
        return dados;

    } catch (error) {
        throw new Error(`Erro ao carregar dados do gráfico: ${error.message}`);
    }
}
//#endregion

//#region Carregar comparação mensal entre múltiplos anos
async function carregarComparacaoAnual({ anos, idUser }) {
    try {

        // Valida se o array de anos foi informado e não está vazio
        if (!Array.isArray(anos) || anos.length === 0) {
            throw new Error('Informe ao menos um ano no campo "anos".');
        }

        // Busca os dados comparativos no repositório
        const dados = await findComparacaoAnual({ anos, idUser });

        return dados;

    } catch (error) {
        throw new Error(`Erro ao carregar comparação anual: ${error.message}`);
    }
}
//#endregion

//#region Carregar ativos para o dropdown do modal de novo rendimento
async function carregarAtivosParaModal(idUser) {
    try {

        // Busca os ativos com seus segmentos no repositório
        const ativos = await findAtivosParaModal(idUser);

        return ativos;

    } catch (error) {
        throw new Error(`Erro ao carregar ativos para o modal: ${error.message}`);
    }
}
//#endregion

//#region Criar novo rendimento
async function criarRendimento({ idAtivo, dtRendimento, valorRecebido, idUser }) {
    try {

        // Valida campos obrigatórios
        if (!idAtivo)
            throw new Error('O campo "idAtivo" é obrigatório.');

        //valuda data de rendimento 
        if (!dtRendimento)
            throw new Error('O campo "dtRendimento" é obrigatório.'); 3

        //valuda valor recebido
        if (!valorRecebido || Number(valorRecebido) <= 0)
            throw new Error('O valor recebido deve ser maior que zero.');


        // Chama o repositório para inserir no banco
        const resultado = await insertRendimento({
            idAtivo,
            dtRendimento,
            valorRecebido: Number(valorRecebido),
            idUser
        });

        return resultado;

    } catch (error) {
        throw new Error(`Erro ao criar rendimento: ${error.message}`);
    }
}
//#endregion

//#region Excluir um rendimento pelo seu ID
async function excluirRendimento(id, idUser) {
    try {

        // Valida se o ID foi informado
        if (!id) {
            throw new Error('O ID do rendimento é obrigatório.');
        }

        // Chama o repositório para executar a exclusão
        const rowCount = await deleteRendimento(id, idUser);

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

// #region => service para logica de calculos do card de rendimentos
async function calculoCardsRendimento(mes, ano, idAtivo, idUser) {
    // Valida se o ano foi informado (mês pode ser "Todos" ou null)
    if (!ano) {
        throw new Error('O campo "ano" é obrigatório para calcular os cards de rendimentos.');
    }

    // Se mes for "Todos" ou vazio, trata como null (sem filtro de mês)
    const mesFiltro = (mes && mes !== 'Todos') ? mes : null;

    // Chama as funções do repositório para obter os dados necessários para os cards
    try {
        // Dispara as 4 queries ao mesmo tempo para máxima performance
        const [
            totalPeriodo,
            totalAcumulado,
            totalCompras,
            totalReinvestido
        ] = await Promise.all([
            getRendimentosFiltro(mesFiltro, ano, idAtivo, idUser),
            getTotalAcumulado(idUser),
            getTotalCompras(idUser),
            getTotalReinvestido(idUser)
        ]);

        // Calcula YoC (Yield on Cost) = (Total acumulado / Total Investido) * 100
        const yieldOnCost = totalCompras > 0
            ? (totalAcumulado / totalCompras) * 100
            : 0;

        // Calcula o Efeito Bola de Neve
        // O dinheiro que você tirou do bolso (Aporte Próprio)
        const aporteProprio = totalCompras - totalReinvestido;

        // Porcentagem da carteira que veio do seu bolso
        const percProprio = totalCompras > 0
            ? (aporteProprio / totalCompras) * 100
            : 0;

        // Porcentagem da carteira que se pagou sozinha (A Bola de Neve real)
        const percReinvestido = totalCompras > 0
            ? (totalReinvestido / totalCompras) * 100
            : 0;

        // Retorna o pacote completo e formatado para o frontend renderizar
        return {
            totalPeriodo,
            totalAcumulado,
            totalCompras,
            totalReinvestido,
            aporteProprio,
            yieldOnCost: Number(yieldOnCost.toFixed(2)),
            percProprio: Number(percProprio.toFixed(1)),
            percReinvestido: Number(percReinvestido.toFixed(1))
        };

    } catch (error) {
        throw new Error(`Erro ao calcular dados para os cards: ${error.message}`);
    }
}
//#endregion


export {
    listarRendimentos,
    carregarGraficoDashboard,
    carregarComparacaoAnual,
    carregarAtivosParaModal,
    criarRendimento,
    excluirRendimento,
    calculoCardsRendimento
};
