import apiResponse from '../../utils/httpResponse.js';

// Middleware para restringir rotas de gestão a usuários admin
// Precisa rodar depois do verificaToken, que injeta req.user (com o campo "adm")
const verificaAdmin = (req, res, next) => {
  if (!req.user?.adm) {
    return apiResponse.forbidden(res, 'Acesso restrito a administradores.');
  }
  next();
};

export default verificaAdmin;
