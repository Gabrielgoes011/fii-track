import express from 'express';
import verificaToken from '../middleware/auth/verificaToken.js';
const router = express.Router();

import {
  listarRendimentos,
  carregarGraficoDashboard,
  carregarComparacaoAnual,
  carregarDadosModalNovoRendimento,
  deleteRendimento
} from '../controllers/rendimentos.controller.js';


router.post('/rendimentos', verificaToken, listarRendimentos);
//body: { mes, ano }

router.post('/carregarGraficoDashboard', verificaToken, carregarGraficoDashboard);
//body: { ano }

router.post('/carregarComparacaoAnual', verificaToken, carregarComparacaoAnual);
//body: { anos: ['2023','2024','2025','2026'] }

router.get('/carregarDadosModalNovoRendimento', verificaToken, carregarDadosModalNovoRendimento);
// sem body — retorna [{ id, ticker, nomeSeguimento }]

router.delete('/rendimentos/:id', deleteRendimento);
// sem body — id do rendimento a ser deletao passado como parâmetro na URL (ex: /rendimentos/123) 
export default router;

//#endregion
