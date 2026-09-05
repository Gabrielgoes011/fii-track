
import {
    getCardsHome as getCardsHomeRepository,
} from './home.repositories.js';

//#region função para carregar os dados do card
async function getCardsHome(idUser) {

    //chama a função do repositório para listar os dados do card
    const resultado = await getCardsHomeRepository(idUser);

    // Resumo financeiro da carteira
    const resumo = resultado.resultadoResumo?.[0] || {};
    const saldoAtual = Number(resumo.saldoAtual) || 0;
    const custoTotal = Number(resumo.custoTotal) || 0;
    const proventos = Number(resumo.proventos) || 0;

    // Rentabilidade % (só valorização) = (saldo - custo) / custo. Carteira vazia => 0.
    const rentabilidadePerc = custoTotal > 0
        ? ((saldoAtual - custoTotal) / custoTotal) * 100
        : 0;

    // Rentabilidade + proventos (resultado real) = (saldo - custo + proventos) / custo.
    const rentabilidadeComProventosPerc = custoTotal > 0
        ? ((saldoAtual - custoTotal + proventos) / custoTotal) * 100
        : 0;

    // Renda mensal média = total de proventos / nº de meses distintos com rendimento.
    // Sem meses (nenhum provento) => 0, evitando divisão por zero.
    const rendaMensal = resultado.resultadoRendaMensal?.[0] || {};
    const totalRenda = Number(rendaMensal.totalProventos) || 0;
    const meses = Number(rendaMensal.mesesComRendimento) || 0;
    const rendaMensalMedia = meses > 0 ? totalRenda / meses : 0;

    //extrai os dados da contagem e retorna formatado
    return {
        operacoes: resultado.resultadoOperacao[0]?.linhas || 0,
        fundos: resultado.resultadoFundos[0]?.linhas || 0,
        patrimonio: saldoAtual,
        custoTotal,
        proventos,
        rentabilidadePerc,
        rentabilidadeComProventosPerc,
        rendaMensalMedia
    };

}
//#endregion


export {
    getCardsHome
}