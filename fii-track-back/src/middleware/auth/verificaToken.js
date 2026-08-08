import jwt from 'jsonwebtoken';
import apiResponse from '../../utils/httpResponse.js';

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware para verificar o token JWT
const verificaToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const cookieToken = req.cookies?.token;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : cookieToken;

    if (!token) {
      return apiResponse.unauthorized(res, 'Token não fornecido.');
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // disponibiliza os dados do usuário para o controller
    next();
  } catch (error) {
    return apiResponse.unauthorized(res, 'Token inválido ou expirado.');
  }
};

export default verificaToken;
