import express from 'express';
import verificaToken from '../middleware/auth/verificaToken.js';
import {
  getSegmentosDropList,
  getAtivosDropList,
} from '../controllers/controleAtivos.controller.js';

const router = express.Router();

// Rota para listar segmentos para o dropdown
router.get('/controle-ativos/segmentos', verificaToken, getSegmentosDropList);

// Rota para listar ativos por segmento para o dropdown
router.get('/controle-ativos/segmentos/:idSegmento/ativos', verificaToken, getAtivosDropList);

export default router;
