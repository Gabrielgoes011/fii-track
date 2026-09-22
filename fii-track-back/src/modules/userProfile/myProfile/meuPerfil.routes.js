import express from 'express';
import verificaToken from '../../../middleware/auth/verificaToken.js';
import { rlsMiddleware } from '../../../middleware/rlsMiddleware.js';

import {
  getMeuPerfil,
  updateMeuPerfil,
} from './meuPerfil.controller.js';

const router = express.Router();

// Rota para buscar o perfil do usuário logado
router.get('/perfil', verificaToken, rlsMiddleware, getMeuPerfil);
// parâmetros: nada (usa o id do token)

// Rota para atualizar os dados cadastrais do próprio usuário
router.put('/perfil', verificaToken, rlsMiddleware, updateMeuPerfil);
// body: { nome, email, dataNascimento }

export default router;
