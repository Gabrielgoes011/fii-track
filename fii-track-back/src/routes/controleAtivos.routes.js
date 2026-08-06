import express from 'express';
import verificaToken from '../middleware/auth/verificaToken.js';
import {
  getSegmentosDropList,
  getAtivosDropList,
  addAtivoController
} from '../controllers/controleAtivos.controller.js';

const router = express.Router();

// Rota para listar segmentos para o dropdown
router.get('/controle-ativos/segmentos', verificaToken, getSegmentosDropList);

// Rota para listar ativos por segmento para o dropdown
router.get('/controle-ativos/segmentos/:idSegmento/ativos', verificaToken, getAtivosDropList);

// Rota para adicionar ativo
router.post('/controle-ativos/adicionar', verificaToken, addAtivoController);
// exemplo de body para adicionar ativo
// {
//   "idSegmento": 1,
//   "idAtivo": 1,
//   "idSegmento": 1,
//   "percIdeal": 10,
//   "objetivo": "Objetivo do ativo"
// }



export default router;
