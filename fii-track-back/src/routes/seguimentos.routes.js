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

// Rotas para listar seguimentos
router.get('/seguimentos', verificaToken, listarSeguimentos);
// paremtros: nada

// Rota para contar seguimentos
router.get('/seguimentos/contar', verificaToken, contarSeguimentos);
// paremtros: nada

// Rota para cadastrar seguimento
router.post('/seguimentos', verificaToken, cadastrarSeguimento);
// paremtros: { nomeSeguimento }

// Rota para deletar seguimento
router.delete('/seguimentos/delete/:id', verificaToken, deleteSeguimento);
// paremtros: { id }

// Rota para atualizar seguimento
router.put('/seguimentos/update', verificaToken, updateSeguimento);
// paremtros: { id, nomeSeguimento }

//router.put('/seguimentos/inativaReativa/:id', inativaReativaSeguimento);

export default router;

//#endregion
