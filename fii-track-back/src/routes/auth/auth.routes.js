import express from 'express';
const router = express.Router();

import { loginController } from '../../controllers/login.controller.js';

//rota de login
router.post('/auth/login', loginController);
//body 
// { "email": "email", "senha": "senha" }

export default router;
