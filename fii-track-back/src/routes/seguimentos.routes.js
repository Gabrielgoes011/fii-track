import express from 'express';
import verificaToken from '../middleware/auth/verificaToken.js';
const router = express.Router();

import {
  listarSeguimentos,
  contarSeguimentos,
  cadastrarSeguimento,
  deleteSeguimento,
  updateSeguimento
} from '../controllers/cadastros/seguimentos.controller.js';

router.get('/seguimentos', verificaToken, listarSeguimentos);
router.get('/seguimentos/contar', verificaToken, contarSeguimentos);
router.post('/seguimentos', verificaToken, cadastrarSeguimento);
router.delete('/seguimentos/delete/:id', verificaToken, deleteSeguimento);
router.put('/seguimentos/update', verificaToken, updateSeguimento);
//router.put('/seguimentos/inativaReativa/:id', inativaReativaSeguimento);

export default router;

//#endregion
