import express from 'express';
import verificaToken from '../middleware/auth/verificaToken.js';
const router = express.Router();

import {
  listarOperacoes,
  lancarOperacao,
  carregaAtivosDropList,
  carregaDadosGraficoOperacoes,
  excluirOperacao
} from '../controllers/operacoes.controller.js';


router.get('/ativosDropList', verificaToken, carregaAtivosDropList);
//body: {} - sem parâmetros, apenas para carregar a lista de ativos para o dropdown list no frontend

router.post('/operacoes', verificaToken, listarOperacoes);
//body: { mes, ano }

router.post('/lancarOperacao', verificaToken, lancarOperacao);
//body: { idAtivo, dataOperacao, tipo, quantidade, preco }

router.post('/excluirOperacao', verificaToken, excluirOperacao);
// body: { id }

router.post('/carregaDadosGraficoOperacoes', verificaToken, carregaDadosGraficoOperacoes);
//body: { ano }

export default router;

//#endregion
