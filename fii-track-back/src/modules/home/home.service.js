
import {
    getCardsHome as getCardsHomeRepository,
} from './home.repositories.js';

//#region função para carregar os dados do card
async function getCardsHome(idUser) {

    //chama a função do repositório para listar os dados do card
    const resultado = await getCardsHomeRepository(idUser);

    //extrai os dados da contagem e retorna formatado
    return {
        operacoes: resultado.resultadoOperacao[0]?.linhas || 0,
        fundos: resultado.resultadoFundos[0]?.linhas || 0
    };

}
//#endregion


export {
    getCardsHome
}