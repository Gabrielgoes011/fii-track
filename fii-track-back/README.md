# API Node — Backend

API RESTful para gerenciamento de carteira de FIIs (Fundos de Investimento Imobiliário). Construída com **Node.js**, **Express 5**, **PostgreSQL** e autenticação via **JWT**.

---

## Tecnologias

| Pacote | Versão | Uso |
|---|---|---|
| express | ^5.1.0 | Servidor e roteamento |
| pg (node-postgres) | ^8.20.0 | Conexão com PostgreSQL (Pool) |
| jsonwebtoken | ^9.0.3 | Autenticação JWT |
| bcrypt | ^6.0.0 | Hash de senhas |
| dotenv | ^17.4.2 | Variáveis de ambiente |
| uuid | ^13.0.0 | Geração de IDs únicos |
| multer | ^2.1.1 | Upload de arquivos |
| @aws-sdk/client-s3 | ^3.1009.0 | Integração com S3 |
| pg | ^8.20.0 | Driver PostgreSQL (reserva) |
| cors | ^2.8.5 | Liberação de CORS |
| nodemon | ^3.1.14 | Hot reload em desenvolvimento |

---

## Estrutura do Projeto

```
api-nodeback/
├── db/
│   └── createDb.sql        # Script de criação das tabelas (PostgreSQL)
├── src/
│   ├── app.js              # Configuração do Express e registro de rotas
│   ├── config/
│   │   ├── configDb.js     # Conexão com o banco de dados
│   │   ├── env.js          # Carregamento das variáveis de ambiente
│   │   └── s3.js           # Configuração do cliente S3
│   ├── controllers/
│   │   ├── login.controller.js
│   │   ├── operacoes.controller.js
│   │   ├── rendimentos.controller.js
│   │   └── cadastros/
│   │       ├── meusFundos.controller.js
│   │       ├── seguimentos.controller.js
│   │       └── usuario.controller.js
│   ├── middleware/
│   │   └── auth/
│   │       └── verificaToken.js    # Middleware de autenticação JWT
│   ├── repositories/
│   │   ├── login.repositories.js
│   │   └── cadastros/
│   │       ├── meuFundos.repositories.js
│   │       └── usuarios.repositories.js
│   ├── routes/
│   │   ├── auth/
│   │   │   └── auth.routes.js
│   │   ├── home.routes.js
│   │   ├── meusFundos.routes.js
│   │   ├── operacoes.routes.js
│   │   ├── rendimentos.routes.js
│   │   ├── seguimentos.routes.js
│   │   └── usuarios.routes.js
│   ├── services/
│   │   └── cadastros/
│   │       ├── meusFundos.services.js
│   │       └── usuarios.services.js
│   └── utils/
│       ├── httpResponse.js     # Helpers de resposta HTTP padronizada
│       └── validaUser.js       # Validações de campos de usuário
└── server.js                   # Entry point — sobe o servidor
```

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) v18+ (recomendado LTS)
- npm

---

## Instalação

```bash
cd api-nodeback
npm install
```

### Banco de dados

Execute o script SQL no seu banco PostgreSQL para criar as tabelas:

```bash
psql -d sua_database -f db/createDb.sql
```

Ou cole o conteúdo de `db/createDb.sql` direto no cliente que preferir (DBeaver, TablePlus, psql, etc.).

### Variáveis de ambiente

Copie o `.env.example` e preencha os valores:

```bash
cp .env.example .env.development
```

Variáveis necessárias:

```env
PORT=3000
JWT_SECRET=sua_chave_secreta
# demais variáveis conforme .env.example
```

---

## Scripts

```bash
npm run dev     # Desenvolvimento com hot reload (nodemon)
npm run start   # Produção
```

---

## Endpoints

Todas as rotas protegidas exigem o header:
```
Authorization: Bearer <token>
```

### Autenticação

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/auth/login` | Login — retorna JWT | ❌ |

### Home / Dashboard

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/home/cards` | Dados dos cards do dashboard | ✅ |

### Usuários

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/users` | Listar todos os usuários | ✅ |
| GET | `/users/dash/count` | Contar total de usuários | ✅ |
| POST | `/usuario/cadastrar` | Cadastrar novo usuário | ✅ |
| PUT | `/users/update/:id` | Atualizar usuário | ✅ |
| PUT | `/inativaUser/:id` | Inativar / reativar usuário | ✅ |
| DELETE | `/users/delete/:id` | Deletar usuário | ✅ |

**Body POST /usuario/cadastrar:**
```json
{ "nome": "string", "email": "string", "password": "string", "cpf": "string" }
```

### Meus Fundos (FIIs)

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/meusFundos` | Listar fundos do usuário logado | ✅ |
| GET | `/meusFundos/contar` | Contar fundos ativos | ✅ |
| POST | `/meusFundos/cadastrar` | Cadastrar novo FII | ✅ |
| PUT | `/meusFundos/editar/:id` | Editar nome do fundo | ✅ |
| DELETE | `/meusFundos/deletar/:id` | Deletar fundo | ✅ |

### Seguimentos (Segmentos)

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/seguimentos` | Listar seguimentos | ✅ |
| GET | `/seguimentos/contar` | Contar seguimentos | ✅ |
| POST | `/seguimentos` | Cadastrar seguimento | ✅ |
| PUT | `/seguimentos/update` | Atualizar seguimento | ✅ |
| DELETE | `/seguimentos/delete/:id` | Deletar seguimento | ✅ |

### Operações (Compras e Vendas)

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/ativosDropList` | Lista de ativos para dropdown | ✅ |
| POST | `/operacoes` | Listar operações por mês/ano | ✅ |
| POST | `/lancarOperacao` | Lançar nova operação | ✅ |
| POST | `/excluirOperacao` | Excluir operação | ✅ |
| POST | `/carregaDadosGraficoOperacoes` | Dados do gráfico por ano | ✅ |

**Body POST /lancarOperacao:**
```json
{ "idAtivo": "uuid", "dataOperacao": "YYYY-MM-DD", "tipo": "C|V", "quantidade": 10, "preco": 95.50 }
```

### Rendimentos

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/rendimentos` | Listar rendimentos por mês/ano | ✅ |
| POST | `/carregarGraficoDashboard` | Dados do gráfico por ano | ✅ |
| POST | `/carregarComparacaoAnual` | Comparação entre anos | ✅ |
| GET | `/carregarDadosModalNovoRendimento` | Dados para modal de lançamento | ✅ |

---

## Middleware

### `verificaToken`
Localização: `src/middleware/auth/verificaToken.js`

Valida o JWT no header `Authorization: Bearer <token>`. Em caso de token inválido ou ausente retorna `401`. Injeta `req.user` com os dados decodificados do token para uso nos controllers.

---

## 📋 Backlog

### Em andamento

- [ ] Controle de Ativos — endpoints para posição consolidada da carteira (preço médio, quantidade, valor atual)
- [ ] Precificação — integração com API externa para cotação em tempo real dos FIIs

### Pendências

- [ ] Rota de refresh de token JWT
- [ ] Paginação nas rotas de listagem (`/users`, `/operacoes`, `/rendimentos`)
- [ ] Cadastro de rendimento via `POST /rendimentos/lancar`
- [ ] Upload de extrato para lançamento em lote de rendimentos / operações (multer + S3 já configurados)
- [ ] Endpoint de relatório consolidado por período
- [ ] Testes automatizados (unitários e de integração)
- [ ] Dockerização da aplicação
- [ ] Documentação Swagger / OpenAPI
