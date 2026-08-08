import express from 'express';
import verificaToken from '../middleware/auth/verificaToken.js';
import { rlsMiddleware } from '../middleware/rlsMiddleware.js';
const router = express.Router();

// Importa o controller de usuários
import {
  contarUsuarios,
  listarUsuarios,
  cadastrarUser,
  atualizarUser,
  onOffUserController,
  deleteUser
} from '../controllers/cadastros/usuario.controller.js';

// Rotas para usuários
router.get('/users', verificaToken, rlsMiddleware, listarUsuarios);
//body: nada

// Rota para contar usuários
router.get('/users/dash/count', verificaToken, rlsMiddleware, contarUsuarios);
//body: nada

// Rota para cadastrar usuário
router.post('/usuario/cadastrar', verificaToken, rlsMiddleware, cadastrarUser);
//body: { nome, email, password, cpf  }

router.put('/users/on-off/:id', verificaToken, rlsMiddleware, onOffUserController);
//headers: /users/on-off/1

// Rota para atualizar usuário
router.put('/users/update/:id', verificaToken, rlsMiddleware, atualizarUser);
//body: { nome, email, password, cpf  }

// Rota para deletar usuário
router.delete('/users/delete/:id', verificaToken, rlsMiddleware, deleteUser);
//body: { id }

export default router;
