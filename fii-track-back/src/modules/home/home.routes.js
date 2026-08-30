import express from 'express';
import verificaToken from '../../middleware/auth/verificaToken.js';
import { rlsMiddleware } from '../../middleware/rlsMiddleware.js';

import {
    cardsHomeController
} from './home.controller.js';

const router = express.Router();

// Rota para carregar os dados do card
router.get('/home/cards', verificaToken, rlsMiddleware, cardsHomeController);
//header: id do usuario logado para listar apenas os dados associados a ele 

export default router;
