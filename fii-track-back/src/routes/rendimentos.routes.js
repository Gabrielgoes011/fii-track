import express from 'express';
import verificaToken from '../middleware/auth/verificaToken.js';
const router = express.Router();

import {
  listarRendimentosController,
  carregarGraficoDashboardController,
  carregarComparacaoAnualController,
  carregarDadosModalNovoRendimentoController,
  deleteRendimentoController
} from '../controllers/rendimentos.controller.js';


router.post('/rendimentos', verificaToken, listarRendimentosController);
//body: { mes, ano }

router.post('/carregarGraficoDashboard', verificaToken, carregarGraficoDashboardController);
//body: { ano }

router.post('/carregarComparacaoAnual', verificaToken, carregarComparacaoAnualController);
//body: { anos: ['2023','2024','2025','2026'] }

router.get('/carregarDadosModalNovoRendimento', verificaToken, carregarDadosModalNovoRendimentoController);
// sem body — retorna [{ id, ticker, nomeSeguimento }]

router.delete('/rendimentos/:id', deleteRendimentoController);
// sem body — id do rendimento a ser deletao passado como parâmetro na URL (ex: /rendimentos/123) 
export default router;

//#endregion
