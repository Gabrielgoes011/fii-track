const router = express.Router();
import express from 'express';
import verificaToken from '../middleware/auth/verificaToken.js';

import {
    cardsHomeController
} from '../controllers/home.controller.js';

// Rota para carregar os dados do card
router.get('/home/cards', verificaToken, cardsHomeController);
//header: id do usuario logado para listar apenas os dados associados a ele 

export default router;

//#endregion
