import { getCardsHome } from '../services/home.services.js';
import apiResponse from '../utils/httpResponse.js';

//#função para carregar os dados do card
async function cardsHomeController(req, res) {
    try {
        //extrai o id do usuário do token
        const idUser = req.user.id;

        //chama a função do service para listar os dados do card
        const resultado = await getCardsHome(idUser);

        // Retorna os resultados da consulta em formato JSON
        apiResponse.success(res,
            'Contagem realizada com sucesso!', resultado, 200, true
        );

    } catch (error) {
        // Retorna a mensagem detalhada do erro
        return apiResponse.error(res, error.message);
    }
}
export {
    cardsHomeController
}