// Carrega as variáveis de ambiente do .env ANTES de qualquer outra importação.
import "./src/config/env.js";

// Importa a instância configurada do Express.
import app from "./src/app.js";

// Define a porta do servidor, com fallback para 3000 em desenvolvimento.
const PORT = process.env.PORT || 3000;

// Inicia o servidor e exibe a URL de acesso no console.
app.listen(PORT, () => {
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