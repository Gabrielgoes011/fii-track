// Rotas do módulo Histórico da Carteira.
//
// Expõe as consultas de séries históricas de preço e patrimônio. Todas as rotas
// exigem autenticação (`verificaToken`) e aplicam o contexto de RLS
// (`rlsMiddleware`) para isolar os dados por usuário (Requirements 7.3, 7.4).

import express from 'express';
import verificaToken from '../../middleware/auth/verificaToken.js';
import { rlsMiddleware } from '../../middleware/rlsMiddleware.js';

import {
  getHistoricoTickerController,
  getHistoricoPatrimonioController,
  getHistoricoAtivoController,
} from './historico.controller.js';

const router = express.Router();

// Rota para consultar o histórico de preço de um ticker. Período opcional via query (?de&ate). Requirement 2.1.
router.get('/historico/cotacoes/:ticker', verificaToken, rlsMiddleware, getHistoricoTickerController);

// Rota para consultar o histórico de patrimônio do usuário logado. Período opcional via query (?de&ate). Requirement 3.10.
router.get('/historico/patrimonio', verificaToken, rlsMiddleware, getHistoricoPatrimonioController);

// Rota para consultar o histórico de patrimônio de um ativo específico do usuário. Período opcional via query (?de&ate).
router.get('/historico/patrimonio/:idAtivo', verificaToken, rlsMiddleware, getHistoricoAtivoController);

export default router;
