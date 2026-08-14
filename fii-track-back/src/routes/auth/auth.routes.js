import express from 'express';
const router = express.Router();

import {
  loginController,
  login2faController,
  iniciar2faController,
  confirmar2faController,
  desativar2faController,
  validarCodigo2faController,
} from '../../controllers/login.controller.js';
import verificaToken from '../../middleware/auth/verificaToken.js';

//rota de login
router.post('/auth/login', loginController);
router.post('/auth/login/2fa', login2faController);

//rotas de 2FA (protegidas, exigem token)
router.post('/2fa/iniciar', verificaToken, iniciar2faController);
router.post('/2fa/confirmar', verificaToken, confirmar2faController);
router.post('/2fa/desativar', verificaToken, desativar2faController);
router.post('/2fa/validar', verificaToken, validarCodigo2faController);

//body
// { "email": "email", "senha": "senha" }

export default router;
