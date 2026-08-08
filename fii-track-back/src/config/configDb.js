import pkg from 'pg';
import { AsyncLocalStorage } from 'async_hooks';

const { Pool } = pkg;

export const dbContext = new AsyncLocalStorage();

function normalizeDatabaseUrl(rawUrl) {
    if (!rawUrl) return rawUrl;

    try {
        const parsed = new URL(rawUrl);
        const sslmode = parsed.searchParams.get('sslmode');
        const useLibpqCompat = parsed.searchParams.get('uselibpqcompat') === 'true';

        // Evita o warning do pg atual mantendo o comportamento seguro já adotado.
        if (!useLibpqCompat && ['prefer', 'require', 'verify-ca'].includes(sslmode)) {
            parsed.searchParams.set('sslmode', 'verify-full');
        }

        return parsed.toString();
    } catch {
        return rawUrl;
    }
}

const connectionString = normalizeDatabaseUrl(process.env.DATABASE_URL);

// Cria um pool de conexões usando a DATABASE_URL do .env
const pool = new Pool({
    connectionString,
    max: 20,
    min: 0,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 20000,
    statement_timeout: 60000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (error, client) => {
    console.error('❌ Erro no pool de conexões PostgreSQL:', error.message);
    if (client) {
        console.error(`   Database: ${client.database}`);
        console.error(`   User: ${client.user}`);
        console.error(`   Host: ${client.host}`);
    }
});

setTimeout(() => {
    (async () => {
        const ambiente = process.env.NODE_ENV || 'development';
        const ambienteFormatado = ambiente.toUpperCase();

        console.log(`\n📍 AMBIENTE: ${ambienteFormatado}`);
        console.log(`📋 Carregado de: .env.${ambiente}\n`);

        if (!process.env.DATABASE_URL) {
            console.error('❌ ERRO: Variável de ambiente DATABASE_URL ausente!');
            return;
        }

        try {
            const client = await pool.connect();
            console.log(`✅ Banco de dados PostgreSQL conectado com sucesso!`);
            console.log(`✅ Conexão estabelecida no ambiente: ${ambienteFormatado}\n`);
            client.release();
        } catch (error) {
            console.warn('⚠️ Conexão inicial com o PostgreSQL indisponível no momento.');
            console.warn(`   Ambiente: ${ambienteFormatado}`);
            console.warn(`   Motivo: ${error.message}`);
        }
    })();
}, 500);

export async function openDb() {
    const store = dbContext.getStore();

    if (store?.client) {
        return store.client;
    }

    return pool;
}

export { pool };