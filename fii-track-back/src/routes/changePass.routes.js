import express from 'express';
import verificaToken from '../middleware/auth/verificaToken.js';
import { rlsMiddleware } from '../middleware/rlsMiddleware.js';
const router = express.Router();

import {
  changePassController
} from '../controllers/userProfile/changePass.controller.js';

// Rota para trocar a senha
router.post('/controle-ativos/trocar-senha', verificaToken, rlsMiddleware, changePassController);
// exemplo de body para trocar a senha
// {
//  "userId": 1,
//  "senhaAtual": "senhaAtual",
//  "novaSenha": "novaSenha"
// }

export default router;
// }

