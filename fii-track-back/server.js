import "./src/config/env.js"; // Carrega variáveis de ambiente ANTES de tudo
import app from "./src/app.js";

// Inicia o servidor na porta do ambiente ou 3000 como fallback
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 - Servidor iniciado com sucesso!`);
    console.log(`🛜  - Acesse em http://localhost:${PORT}`);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});