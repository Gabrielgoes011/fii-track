import { getCardsHome } from './home.service.js';
import apiResponse from '../../utils/httpResponse.js';
import pgErrorHandler from '../../utils/pgErrorHandler.js';

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
        // Loga o erro completo para depuração (só no servidor)
        console.error('Erro ao carregar os cards do dashboard na etapa do controller:', error);
        // Gera uma mensagem segura para o usuário, sem vazar detalhes internos
        const secureMessage = pgErrorHandler(error, 'Erro ao carregar os dados do dashboard.');
        return apiResponse.error(res, secureMessage);
    }
}
export {
    cardsHomeController
}