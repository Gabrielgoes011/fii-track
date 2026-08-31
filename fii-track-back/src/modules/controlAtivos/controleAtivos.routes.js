import express from 'express';
import verificaToken from '../../middleware/auth/verificaToken.js';
import { rlsMiddleware } from '../../middleware/rlsMiddleware.js';

import {
  getSegmentosDropList,
  getAtivosDropList,
  addAtivoController,
  getControleAtivosController,
  getCotacoesController,
  updatePercIdealController,
  updatePrecoTetoController,
  deleteAtivoController,
} from './controleAtivos.controller.js';

const router = express.Router();

// Rota para listar o controle de ativos (POST — dados do usuário ficam no token, não na URL)
router.post('/controle-ativos/listar', verificaToken, rlsMiddleware, getControleAtivosController);

// Rota para atualizar as cotações dos ativos da carteira (consome a brapi.dev).
// Chamada só sob demanda (botão "Atualizar Cotações"), para economizar requisições do plano.
router.post('/controle-ativos/cotacoes', verificaToken, rlsMiddleware, getCotacoesController);

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

// Rota para atualizar o percentual ideal de um ativo. Body: { percIdeal: 0.10 }
router.put('/controle-ativos/perc-ideal/:idAtivo', verificaToken, rlsMiddleware, updatePercIdealController);

// Rota para atualizar o preço teto de um ativo. Body: { precoTeto: 96.72, modo: 'manual' | 'pvp' }
router.put('/controle-ativos/preco-teto/:idAtivo', verificaToken, rlsMiddleware, updatePrecoTetoController);

// Rota para remover um ativo da carteira. Sem body — idAtivo na URL.
router.delete('/controle-ativos/:idAtivo', verificaToken, rlsMiddleware, deleteAtivoController);

export default router;
