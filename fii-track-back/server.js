// Carrega as variáveis de ambiente do .env ANTES de qualquer outra importação.
import "./src/config/env.js";

// Importa a instância configurada do Express.
import app from "./src/app.js";

// Define a porta do servidor. Em produção (Discloud) o proxy externo aponta
// para a 8080; localmente também usamos 8080 para espelhar o ambiente de deploy.
const PORT = process.env.PORT || 8080;

// Host 0.0.0.0 para aceitar conexões externas (exigência da Discloud).
const HOST = '0.0.0.0';

// Inicia o servidor e exibe a URL de acesso no console.
app.listen(PORT, HOST, () => {
    console.log(`🚀 - Servidor iniciado com sucesso!`);
    console.log(`🛜  - Acesse em http://localhost:${PORT}`);
});

// --- Tratamento de Erros Globais (Safety Net) ---

// Captura 'Promise Rejections' não tratadas para evitar que a aplicação quebre.
process.on('unhandledRejection', (reason, promise) => {
    console.error('Rejeição não tratada em:', promise, 'motivo:', reason);
});

// Captura exceções síncronas não tratadas para evitar que a aplicação quebre.
process.on('uncaughtException', (error) => {
    console.error('Exceção não tratada:', error);
});