import express from 'express'; //importa a biblioteca express
import cors from 'cors'; // importa a biblioteca cors
import cookieParser from 'cookie-parser';
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


//Get na rota raiz ("/") Hello World
app.get('/', function (req, res) {
    res.json({
        "status": 200,
        "mensagem": "Bem vindos a Minha primeira API!",
        "Versão": "1.0"
    }) //responde com Json
})

app.use('/', authRoutes);       // Usa as rotas de autenticação
app.use('/', homeRoutes);       // Usa as rotas do home/dashboard
app.use('/', usuariosRoutes);   // Usa as rotas de usuários
app.use('/', seguimentosRoutes); // Usa as rotas de segmentos
app.use('/', meusFundosRoutes); // Usa as rotas de meus fundos
app.use('/', operacoesRoutes);  // Usa as rotas de operações
app.use('/', rendimentosRoutes); // Usa as rotas de rendimentos
app.use('/', controleAtivosRoutes); // Usa as rotas de controle de ativos
app.use('/', diversificacaoRoutes); // Usa as rotas de diversificação
app.use('/', historicoRoutes); // Usa as rotas de histórico da carteira
app.use('/', changePassRoutes); // Usa as rotas de troca de senha
app.use('/', meuPerfilRoutes); // Usa as rotas de perfil do usuário


//exporta o app para ser usado em outros arquivos
export default app;
