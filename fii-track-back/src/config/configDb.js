import pkg from 'pg';
const { Pool } = pkg;


// Cria um pool de conexões usando a DATABASE_URL do .env
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: true } 
        : { rejectUnauthorized: false },
    max: 20, // Máximo de conexões simultâneas
    min: 2, // Mínimo de conexões mantidas
    idleTimeoutMillis: 60000, // Fecha conexões ociosas após 60s
    connectionTimeoutMillis: 10000, // Timeout de conexão de 10s
    statement_timeout: 30000, // Timeout de query de 30s
});

// Testa a conexão com um pequeno atraso para as mensagens do servidor aparecerem primeiro
setTimeout(() => {
    (async () => {
        // Obtém o ambiente atual
        const ambiente = process.env.NODE_ENV || 'development';
        const ambienteFormatado = ambiente.toUpperCase();

        // Exibe o ambiente em que está conectando
        console.log(`\n📍 AMBIENTE: ${ambienteFormatado}`);
        console.log(`📋 Carregado de: .env.${ambiente}\n`);

        // Verifica as variáveis de ambiente aqui para o erro sair no lugar certo
        if (!process.env.DATABASE_URL) {
            console.error('❌ ERRO: Variável de ambiente DATABASE_URL ausente!');
            return; // Para a execução e não tenta conectar
        }

        try {
            const client = await pool.connect();
            console.log(`✅ Banco de dados PostgreSQL conectado com sucesso!`);
            console.log(`✅ Conexão estabelecida no ambiente: ${ambienteFormatado}\n`);
            client.release(); // Libera a conexão de volta para o pool
        } catch (error) {
            console.error('❌ Falha ao conectar ao banco de dados PostgreSQL!');
            console.error(`   Ambiente: ${ambienteFormatado}`);
            console.error(`   Motivo: ${error.message}`);
            console.error('   Detalhes:', error);
        }
    })();
}, 500); // 500ms de atraso garante que o log do Express passe antes

// Função wrapper para manter compatibilidade com o código que usa openDb()
export async function openDb() {
    return pool;
}

// Exportamos o pool para ser usado nos controllers
export { pool };