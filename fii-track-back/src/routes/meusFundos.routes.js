const router = express.Router();
import express from 'express';
import verificaToken from '../middleware/auth/verificaToken.js';
import { rlsMiddleware } from '../middleware/rlsMiddleware.js';

import {
  cadastrarFundos,
  listarFundos,
  contarFundosAtivos,
  deletarFundo,
  editarNomeFundo
} from '../controllers/cadastros/meusFundos.controller.js';

// Rotas para meus fundos
router.get('/meusFundos', verificaToken, rlsMiddleware, listarFundos);
//header: id do usuario logado para listar apenas os fundos cadastrados por ele

router.get('/meusFundos/contar', verificaToken, rlsMiddleware, contarFundosAtivos);
//header: id do usuario logado para contar apenas os fundos cadastrados por ele

router.post('/meusFundos/cadastrar', verificaToken, rlsMiddleware, cadastrarFundos);
//header: id do usuario logado para cadastrar o fundo associado a ele

router.delete('/meusFundos/deletar/:id', verificaToken, rlsMiddleware, deletarFundo);
//header: id do fundo a ser deletado

router.put('/meusFundos/editar/:id', verificaToken, rlsMiddleware, editarNomeFundo);
//body: { nomeFundo: 'novo nome do fundo' }
//header: id do fundo a ser editado

export default router;

//#endregion
