import express from 'express';
import verificaToken from '../middleware/auth/verificaToken.js';
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
router.get('/users', verificaToken, listarUsuarios);

router.get('/users/dash/count', verificaToken, contarUsuarios);

// Rota para cadastrar usuário
router.post('/usuario/cadastrar', verificaToken, cadastrarUser);
//body: { nome, email, password, cpf  }

router.put('/users/on-off/:id',verificaToken, onOffUserController);
//headers: /users/on-off/1

router.put('/users/update/:id', verificaToken, atualizarUser);
router.delete('/users/delete/:id', verificaToken, deleteUser);


export default router;
