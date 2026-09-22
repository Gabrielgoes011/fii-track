import express from 'express';
import verificaToken from '../../middleware/auth/verificaToken.js';
import { loginLimiter, twoFactorLimiter, refreshLimiter } from '../../middleware/rateLimiter.js';

import {
  loginController,
  login2faController,
  meController,
  refreshController,
  iniciar2faController,
  confirmar2faController,
  desativar2faController,
  validarCodigo2faController,
} from './login.controller.js';

const router = express.Router();

//rota de login (rate limit contra brute force de senha)
router.post('/auth/login', loginLimiter, loginController);
router.post('/auth/login/2fa', loginLimiter, login2faController);

// Dados do usuário logado (protegida) — o "adm" vem daqui, derivado do token
router.get('/auth/me', verificaToken, meController);

// Renova o access token usando o refresh token (cookie httpOnly). Sem verificaToken:
// o access token já pode ter expirado; quem autentica aqui é o refresh token.
router.post('/auth/refresh', refreshLimiter, refreshController);

//rotas de 2FA (protegidas, exigem token + rate limit contra brute force de código)
router.post('/2fa/iniciar', twoFactorLimiter, verificaToken, iniciar2faController);
router.post('/2fa/confirmar', twoFactorLimiter, verificaToken, confirmar2faController);
router.post('/2fa/desativar', twoFactorLimiter, verificaToken, desativar2faController);
router.post('/2fa/validar', twoFactorLimiter, verificaToken, validarCodigo2faController);

//body
// { "email": "email", "senha": "senha" }

export default router;
