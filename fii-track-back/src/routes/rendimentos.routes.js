import express from 'express';
import verificaToken from '../middleware/auth/verificaToken.js';
import { rlsMiddleware } from '../middleware/rlsMiddleware.js';
const router = express.Router();

import {
  listarRendimentosController,
  carregarGraficoDashboardController,
  carregarComparacaoAnualController,
  carregarDadosModalNovoRendimentoController,
  criarRendimentoController,
  deleteRendimentoController,
  getCardsRendimentos,
  importarRendimentosB3Controller
} from '../controllers/rendimentos.controller.js';


router.post('/rendimentos', verificaToken, rlsMiddleware, listarRendimentosController);
//body: { mes, ano }

router.post('/carregarGraficoDashboard', verificaToken, rlsMiddleware, carregarGraficoDashboardController);
//body: { ano }

router.post('/carregarComparacaoAnual', verificaToken, rlsMiddleware, carregarComparacaoAnualController);
//body: { anos: ['2023','2024','2025','2026'] }

router.get('/carregarDadosModalNovoRendimento', verificaToken, rlsMiddleware, carregarDadosModalNovoRendimentoController);
// sem body — retorna [{ id, ticker, nomeSeguimento }]

router.post('/criarRendimento', verificaToken, rlsMiddleware, criarRendimentoController);
//body: { idAtivo, dtRendimento, valorRecebido }

router.delete('/rendimentos/:id', verificaToken, rlsMiddleware, deleteRendimentoController);
// sem body — id do rendimento a ser deletao passado como parâmetro na URL (ex: /rendimentos/123) 

router.post('/cardsRendimentos', verificaToken, rlsMiddleware, getCardsRendimentos);
//body: { mes, ano, idAtivo (todos parametros opcional) }

router.post('/rendimentos/importar-b3', verificaToken, rlsMiddleware, importarRendimentosB3Controller);
//body: { linhas: [{ ticker, dtRendimento, valorRecebido }] }

export default router;

//#endregion
