import express from 'express';
import verificaToken from '../../middleware/auth/verificaToken.js';
import { rlsMiddleware } from '../../middleware/rlsMiddleware.js';

import {
  getDiversificacaoController,
} from './diversificacao.controller.js';

const router = express.Router();

// Rota para obter a exposição da carteira por segmento (atual vs meta).
// POST — os dados do usuário ficam no token, não na URL. Sem body.
router.post('/diversificacao', verificaToken, rlsMiddleware, getDiversificacaoController);

export default router;
