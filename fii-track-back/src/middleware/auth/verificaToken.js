import jwt from 'jsonwebtoken';
import apiResponse from '../../utils/httpResponse.js';

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware para verificar o token JWT
const verificaToken = (req, res, next) => {
  try {
    // Lê o header: "Authorization: Bearer eyJhbGci..."
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return apiResponse.unauthorized(res, 'Token não fornecido.');
    }

    // Valida e separa o formato "Bearer <token>"
    const [tipo, token] = authHeader.trim().split(/\s+/);

    if (tipo?.toLowerCase() !== 'bearer' || !token) {
      return apiResponse.unauthorized(res, 'Formato de token inválido. Use: Bearer <token>.');
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // disponibiliza os dados do usuário para o controller
    next();
  } catch (error) {
    return apiResponse.unauthorized(res, 'Token inválido ou expirado.');
  }
};

export default verificaToken;
