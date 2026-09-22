// Rate limiting para rotas sensíveis de autenticação.
//
// Protege contra ataques de força bruta (tentativas repetidas de senha ou de
// código 2FA) limitando o número de requisições por IP dentro de uma janela de
// tempo. Usa `express-rate-limit`.
//
// Observação sobre proxy: em produção atrás de um proxy/CDN (Nginx, Vercel,
// Cloudflare, etc.), habilite `app.set('trust proxy', 1)` para que o IP do
// cliente seja lido corretamente do cabeçalho X-Forwarded-For.

import rateLimit from 'express-rate-limit';

// Corpo de resposta padronizado (mesmo formato do httpResponse: { success, message }).
function respostaLimite(mensagem) {
  return (req, res) => {
    res.status(429).json({ success: false, message: mensagem });
  };
}

// Login: janela de 15 minutos, no máximo 10 tentativas por IP.
// Só conta as tentativas que falham (skipSuccessfulRequests), para não punir
// quem acerta a senha rapidamente após um erro de digitação.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 10,
  standardHeaders: 'draft-7', // expõe os cabeçalhos RateLimit-*
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: respostaLimite(
    'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.'
  ),
});

// 2FA: janela de 15 minutos, no máximo 20 requisições por IP.
// Cobre iniciar/confirmar/desativar/validar. O limite é um pouco maior porque
// o usuário legítimo pode fazer mais interações (gerar QR, confirmar, validar).
const twoFactorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: respostaLimite(
    'Muitas tentativas de verificação em duas etapas. Aguarde alguns minutos e tente novamente.'
  ),
});

// Refresh de sessão: janela de 15 minutos, até 60 requisições por IP.
// Um access token dura 15 min, então o volume legítimo é baixo; o limite alto
// só barra abuso automatizado sem atrapalhar o uso normal em várias abas.
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: respostaLimite(
    'Muitas renovações de sessão. Aguarde alguns instantes e tente novamente.'
  ),
});

export { loginLimiter, twoFactorLimiter, refreshLimiter };
