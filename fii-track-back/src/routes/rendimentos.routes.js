import express from 'express';
import verificaToken from '../middleware/auth/verificaToken.js';
const router = express.Router();

import {
  listarRendimentosController,
  carregarGraficoDashboardController,
  carregarComparacaoAnualController,
  carregarDadosModalNovoRendimentoController,
  criarRendimentoController,
  deleteRendimentoController,
  getCardsRendimentos
} from '../controllers/rendimentos.controller.js';


router.post('/rendimentos', verificaToken, listarRendimentosController);
//body: { mes, ano }

router.post('/carregarGraficoDashboard', verificaToken, carregarGraficoDashboardController);
//body: { ano }

router.post('/carregarComparacaoAnual', verificaToken, carregarComparacaoAnualController);
//body: { anos: ['2023','2024','2025','2026'] }

router.get('/carregarDadosModalNovoRendimento', verificaToken, carregarDadosModalNovoRendimentoController);
// sem body — retorna [{ id, ticker, nomeSeguimento }]

router.post('/criarRendimento', verificaToken, criarRendimentoController);
//body: { idAtivo, dtRendimento, valorRecebido }

router.delete('/rendimentos/:id', verificaToken, deleteRendimentoController);
// sem body — id do rendimento a ser deletao passado como parâmetro na URL (ex: /rendimentos/123) 

router.post('/cardsRendimentos', verificaToken, getCardsRendimentos);
//body: { mes, ano, idAtivo (todos parametros opcional) }

export default router;

//#endregion
