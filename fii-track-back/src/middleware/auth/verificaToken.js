import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware para verificar o token JWT
const verificaToken = (req, res, next) => {
  try {
    // Lê o header: "Authorization: Bearer eyJhbGci..."
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({ erro: 'Token não fornecido' });
    }

    // Separa "Bearer" do token em si
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ erro: 'Formato inválido. Use: Bearer <token>' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // disponibiliza os dados do usuário para o controller
    next();
  } catch (error) {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
};

export default verificaToken;