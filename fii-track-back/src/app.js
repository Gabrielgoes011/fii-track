import express from 'express'; //importa a biblioteca express
import cors from 'cors'; // importa a biblioteca cors
import usuariosRoutes from './routes/usuarios.routes.js'; // importa as rotas de usuários
import seguimentosRoutes from './routes/seguimentos.routes.js'; // importa as rotas de segmentos
import meusFundosRoutes from './routes/meusFundos.routes.js'; // importa as rotas de meus fundos
import operacoesRoutes from './routes/operacoes.routes.js'; // importa as rotas de operações
import rendimentosRoutes from './routes/rendimentos.routes.js'; // importa as rotas de rendimentos
import authRoutes from './routes/auth/auth.routes.js'; // importa as rotas de autenticação
import homeRoutes from './routes/home.routes.js'; // importa as rotas do home/dashboard

const app = express(); //cria uma aplicação express
app.use(cors()); //habilita o cors para todas as rotas
app.use(express.json()); //habilita json no corpo da requisição para retornar dados em json


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


//exporta o app para ser usado em outros arquivos
export default app;
