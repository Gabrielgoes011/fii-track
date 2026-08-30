import express from 'express';
import verificaToken from '../../middleware/auth/verificaToken.js';
import { rlsMiddleware } from '../../middleware/rlsMiddleware.js';

import {
  getSegmentosDropList,
  getAtivosDropList,
  addAtivoController,
  getControleAtivosController,
} from './controleAtivos.controller.js';

const router = express.Router();

// Rota para listar o controle de ativos (POST — dados do usuário ficam no token, não na URL)
router.post('/controle-ativos/listar', verificaToken, rlsMiddleware, getControleAtivosController);

// Rota para listar segmentos para o dropdown
router.get('/controle-ativos/segmentos', verificaToken, rlsMiddleware, getSegmentosDropList);

// Rota para listar ativos por segmento para o dropdown
router.get('/controle-ativos/segmentos/:idSegmento/ativos', verificaToken, rlsMiddleware, getAtivosDropList);

// Rota para adicionar ativo
router.post('/controle-ativos/adicionar', verificaToken, rlsMiddleware, addAtivoController);
// exemplo de body para adicionar ativo
// {
//   "idSegmento": 1,
//   "idAtivo": 1,
//   "percIdeal": 10,
//   "objetivo": "Objetivo do ativo"
// }

export default router;
