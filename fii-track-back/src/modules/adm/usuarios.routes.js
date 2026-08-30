import express from 'express';
import verificaToken from '../../middleware/auth/verificaToken.js';
import verificaAdmin from '../../middleware/auth/verificaAdmin.js';
import { rlsMiddleware } from '../../middleware/rlsMiddleware.js';

import {
  contarUsuarios,
  listarUsuarios,
  cadastrarUser,
  atualizarUser,
  onOffUserController,
  deleteUser,
  resetarSenhaController
} from './usuario.controller.js';

const router = express.Router();

// Gestão de usuários é restrita a administradores (verificaToken decodifica o
// token e injeta req.user; verificaAdmin confere req.user.adm em seguida)
router.get('/users', verificaToken, verificaAdmin, rlsMiddleware, listarUsuarios);
//body: nada

// Rota para contar usuários
router.get('/users/dash/count', verificaToken, verificaAdmin, rlsMiddleware, contarUsuarios);
//body: nada

// Rota para cadastrar usuário
router.post('/usuario/cadastrar', verificaToken, verificaAdmin, rlsMiddleware, cadastrarUser);
//body: { nome, email, password, cpf  }

router.put('/users/on-off/:id', verificaToken, verificaAdmin, rlsMiddleware, onOffUserController);
//headers: /users/on-off/1

// Rota para atualizar usuário
router.put('/users/update/:id', verificaToken, verificaAdmin, rlsMiddleware, atualizarUser);
//body: { nome, dataNascimento, email, status  }

// Rota para resetar a senha do usuário para o padrão
router.put('/users/reset-password/:id', verificaToken, verificaAdmin, rlsMiddleware, resetarSenhaController);
//body: nada

// Rota para deletar usuário
router.delete('/users/delete/:id', verificaToken, verificaAdmin, rlsMiddleware, deleteUser);
//body: { id }

export default router;
