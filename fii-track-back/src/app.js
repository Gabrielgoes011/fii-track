import express from 'express'; //importa a biblioteca express
import cors from 'cors'; // importa a biblioteca cors
import cookieParser from 'cookie-parser';
import path from 'node:path'; // resolução de caminhos para servir o front
import { fileURLToPath } from 'node:url';
import usuariosRoutes from './modules/adm/usuarios.routes.js'; // importa as rotas de usuários
import seguimentosRoutes from './modules/cadastros/segmentos/seguimentos.routes.js'; // importa as rotas de segmentos
import meusFundosRoutes from './modules/cadastros/fundos/meusFundos.routes.js'; // importa as rotas de meus fundos
import operacoesRoutes from './modules/operacao/operacoes.routes.js'; // importa as rotas de operações
import rendimentosRoutes from './modules/rendimentos/rendimentos.routes.js'; // importa as rotas de rendimentos
import authRoutes from './modules/login/login.routes.js'; // importa as rotas de autenticação
import homeRoutes from './modules/home/home.routes.js'; // importa as rotas do home/dashboard
import controleAtivosRoutes from './modules/controlAtivos/controleAtivos.routes.js'; // importa as rotas de controle de ativos
import diversificacaoRoutes from './modules/diversificacao/diversificacao.routes.js'; // importa as rotas de diversificação
import historicoRoutes from './modules/historico/historico.routes.js'; // importa as rotas de histórico da carteira
import changePassRoutes from './modules/userProfile/changePassword/changePass.routes.js'; // importa as rotas de troca de senha
import meuPerfilRoutes from './modules/userProfile/myProfile/meuPerfil.routes.js'; // importa as rotas de perfil do usuário

//cria uma aplicação express

const app = express();

// Em produção a API costuma rodar atrás de um proxy/CDN (Nginx, Vercel, etc.).
// Confiar no primeiro proxy faz o Express ler o IP real do cliente via
// X-Forwarded-For, essencial para o rate limiting por IP funcionar corretamente.
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

//habilita o cors para todas as rotas
app.use(cors({
    origin: true,
    credentials: true,
}));

//habilita json no corpo da requisição para retornar dados em json
app.use(express.json());
app.use(cookieParser());


// ─────────────────────────────────────────────────────────────────────────────
// API — todas as rotas ficam sob o prefixo /api para não colidir com o SPA.
// O front (ver src/config/api.js) usa baseURL '/api', então os caminhos
// internos de cada módulo (ex.: '/auth/login') permanecem inalterados.
// ─────────────────────────────────────────────────────────────────────────────
const apiRouter = express.Router();

// Health check / boas-vindas da API.
apiRouter.get('/', function (req, res) {
    res.json({
        "status": 200,
        "mensagem": "Bem vindos a Minha primeira API!",
        "Versão": "1.0"
    }); //responde com Json
});

apiRouter.use('/', authRoutes);       // Usa as rotas de autenticação
apiRouter.use('/', homeRoutes);       // Usa as rotas do home/dashboard
apiRouter.use('/', usuariosRoutes);   // Usa as rotas de usuários
apiRouter.use('/', seguimentosRoutes); // Usa as rotas de segmentos
apiRouter.use('/', meusFundosRoutes); // Usa as rotas de meus fundos
apiRouter.use('/', operacoesRoutes);  // Usa as rotas de operações
apiRouter.use('/', rendimentosRoutes); // Usa as rotas de rendimentos
apiRouter.use('/', controleAtivosRoutes); // Usa as rotas de controle de ativos
apiRouter.use('/', diversificacaoRoutes); // Usa as rotas de diversificação
apiRouter.use('/', historicoRoutes); // Usa as rotas de histórico da carteira
apiRouter.use('/', changePassRoutes); // Usa as rotas de troca de senha
apiRouter.use('/', meuPerfilRoutes); // Usa as rotas de perfil do usuário

app.use('/api', apiRouter);

// ─────────────────────────────────────────────────────────────────────────────
// Front (SPA React/Vite) — servimos o build estático de fii-track-front/dist.
// Deploy único na Discloud: o mesmo processo entrega API e front.
// Caminho: src/ (este arquivo) → fii-track-back/ → raiz do monorepo → front/dist
// ─────────────────────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontDistPath = path.resolve(__dirname, '../../fii-track-front/dist');

// Assets com hash (/assets/*) podem ter cache longo e imutável.
app.use(
    '/assets',
    express.static(path.join(frontDistPath, 'assets'), {
        maxAge: '1y',
        immutable: true,
    })
);

// Demais arquivos estáticos do build (favicon, manifest, imagens, etc.).
// index.html e manifest.json não devem ser cacheados (evita versão presa no PWA).
app.use(
    express.static(frontDistPath, {
        setHeaders: (res, filePath) => {
            const base = path.basename(filePath);
            if (base === 'index.html' || base === 'manifest.json') {
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            }
        },
    })
);

// Fallback SPA: qualquer rota que não seja /api nem arquivo estático
// devolve o index.html para o react-router resolver no cliente.
app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontDistPath, 'index.html'));
});


//exporta o app para ser usado em outros arquivos
export default app;
