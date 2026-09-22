import express from 'express';
import verificaToken from '../../../middleware/auth/verificaToken.js';
import { rlsMiddleware } from '../../../middleware/rlsMiddleware.js';

import {
  changePassController
} from './changePass.controller.js';

const router = express.Router();

// Rota para trocar a senha
router.post('/perfil/trocar-senha', verificaToken, rlsMiddleware, changePassController);
// exemplo de body para trocar a senha
// {
//  "userId": 1,
//  "senhaAtual": "senhaAtual",
//  "novaSenha": "novaSenha"
// }

export default router;
