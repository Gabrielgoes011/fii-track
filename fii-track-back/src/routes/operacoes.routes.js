import express from 'express';
import verificaToken from '../middleware/auth/verificaToken.js';
import { rlsMiddleware } from '../middleware/rlsMiddleware.js';
const router = express.Router();

import {
  listarOperacoes,
  lancarOperacao,
  carregaAtivosDropList,
  carregaDadosGraficoOperacoes,
  excluirOperacao
} from '../controllers/operacoes.controller.js';


router.get('/ativosDropList', verificaToken, rlsMiddleware, carregaAtivosDropList);
//body: {} - sem parâmetros, apenas para carregar a lista de ativos para o dropdown list no frontend

router.post('/operacoes', verificaToken, rlsMiddleware, listarOperacoes);
//body: { mes, ano }

router.post('/lancarOperacao', verificaToken, rlsMiddleware, lancarOperacao);
//body: { idAtivo, dataOperacao, tipo, quantidade, preco }

router.post('/excluirOperacao', verificaToken, rlsMiddleware, excluirOperacao);
// body: { id }

router.post('/carregaDadosGraficoOperacoes', verificaToken, rlsMiddleware, carregaDadosGraficoOperacoes);
//body: { ano }

export default router;

//#endregion
