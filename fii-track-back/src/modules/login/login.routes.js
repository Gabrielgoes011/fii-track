import express from 'express';
import verificaToken from '../../middleware/auth/verificaToken.js';

import {
  loginController,
  login2faController,
  meController,
  iniciar2faController,
  confirmar2faController,
  desativar2faController,
  validarCodigo2faController,
} from './login.controller.js';

const router = express.Router();

//rota de login
router.post('/auth/login', loginController);
router.post('/auth/login/2fa', login2faController);

// Dados do usuário logado (protegida) — o "adm" vem daqui, derivado do token
router.get('/auth/me', verificaToken, meController);

//rotas de 2FA (protegidas, exigem token)
router.post('/2fa/iniciar', verificaToken, iniciar2faController);
router.post('/2fa/confirmar', verificaToken, confirmar2faController);
router.post('/2fa/desativar', verificaToken, desativar2faController);
router.post('/2fa/validar', verificaToken, validarCodigo2faController);

//body
// { "email": "email", "senha": "senha" }

export default router;
