import express from 'express';
import verificaToken from '../../../middleware/auth/verificaToken.js';
import { rlsMiddleware } from '../../../middleware/rlsMiddleware.js';

import {
  listarSeguimentos,
  contarSeguimentos,
  cadastrarSeguimento,
  deleteSeguimento,
  updateSeguimento
} from './seguimentos.controller.js';

const router = express.Router();

// Rotas para listar seguimentos
router.get('/seguimentos', verificaToken, rlsMiddleware, listarSeguimentos);
// paremtros: nada

// Rota para contar seguimentos
router.get('/seguimentos/contar', verificaToken, rlsMiddleware, contarSeguimentos);
// paremtros: nada

// Rota para cadastrar seguimento
router.post('/seguimentos', verificaToken, rlsMiddleware, cadastrarSeguimento);
// paremtros: { nomeSeguimento }

// Rota para deletar seguimento
router.delete('/seguimentos/delete/:id', verificaToken, rlsMiddleware, deleteSeguimento);
// paremtros: { id }

// Rota para atualizar seguimento
router.put('/seguimentos/update', verificaToken, rlsMiddleware, updateSeguimento);
// paremtros: { id, nomeSeguimento }

export default router;
