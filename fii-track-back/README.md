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
| multer | ^2.1.1 | Upload de arquivos (configurado, ainda sem rota que o use) |
| cors | ^2.8.5 | Liberação de CORS |
| cross-env | ^7.0.3 | Define `NODE_ENV` de forma multiplataforma no script `start` |
| nodemon | ^3.1.14 | Hot reload em desenvolvimento |

> ⚠️ `src/config/s3.js` importa `@aws-sdk/client-s3`, mas o pacote não está mais no `package.json` nem instalado em `node_modules`. Nenhum controller importa `s3.js` hoje, então isso não quebra a aplicação — mas vai quebrar assim que alguém tentar reativar o upload de fotos/extratos para S3.

---

## Estrutura do Projeto

```
fii-track-back/
├── db/
│   └── createDb.sql        # Dump antigo do schema (PostgreSQL) — não reflete 100% do schema atual
├── src/
│   ├── app.js               # Configuração do Express e registro de rotas
│   ├── config/
│   │   ├── configDb.js      # Conexão com o banco de dados
│   │   ├── env.js           # Carregamento das variáveis de ambiente
│   │   └── s3.js            # Configuração do cliente S3 (⚠️ dependência não instalada, não usado por nenhum controller)
│   ├── controllers/
│   │   ├── home.controller.js
│   │   ├── login.controller.js
│   │   ├── operacoes.controller.js
│   │   ├── rendimentos.controller.js
│   │   └── cadastros/
│   │       ├── meusFundos.controller.js
│   │       ├── seguimentos.controller.js   # ainda acessa o banco direto (não migrado)
│   │       └── usuario.controller.js       # atualizarUser/deleteUser ainda não migrados
│   ├── middleware/
│   │   └── auth/
│   │       └── verificaToken.js    # Middleware de autenticação JWT
│   ├── repositories/
│   │   ├── home.repositories.js
│   │   ├── login.repositories.js
│   │   ├── operacoes.repositories.js
│   │   ├── rendimentos.repositories.js
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
│   │   ├── home.services.js
│   │   ├── login.services.js
│   │   ├── operacoes.services.js
│   │   ├── rendimentos.services.js
│   │   └── cadastros/
│   │       ├── meusFundos.services.js
│   │       └── usuarios.services.js
│   └── utils/
│       ├── dateUtils.js        # Formatação/conversão de datas
│       ├── httpResponse.js     # Helpers de resposta HTTP padronizada
│       └── validaUser.js       # Validações de campos de usuário
└── server.js                   # Entry point — sobe o servidor
```

> **Seguimentos** é o único módulo ainda sem `service`/`repository` — o controller acessa `openDb()` diretamente. Ver backlog em [`ANALISE_PROJETO.md`](../ANALISE_PROJETO.md).

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
| GET | `/users` | Listar todos os usuários (`?status=on\|off`) | ✅ |
| GET | `/users/dash/count` | Contar total de usuários (ativos/inativos/total) | ✅ |
| POST | `/usuario/cadastrar` | Cadastrar novo usuário | ✅ |
| PUT | `/users/update/:id` | Atualizar usuário (⚠️ acessa banco direto, query referencia tabela antiga `dbo."tabUser"` — endpoint quebrado) | ✅ |
| PUT | `/users/on-off/:id` | Inativar / reativar usuário | ✅ |
| DELETE | `/users/delete/:id` | Deletar usuário (acessa banco direto, fora do padrão service/repository) | ✅ |

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
| POST | `/rendimentos` | Listar rendimentos por mês/ano/ativo | ✅ |
| POST | `/carregarGraficoDashboard` | Dados do gráfico por ano (mensal + anual) | ✅ |
| POST | `/carregarComparacaoAnual` | Comparação entre anos | ✅ |
| GET | `/carregarDadosModalNovoRendimento` | Dados para modal de lançamento | ✅ |
| POST | `/criarRendimento` | Lança um novo rendimento | ✅ |
| DELETE | `/rendimentos/:id` | Exclui um rendimento | ✅ |
| POST | `/cardsRendimentos` | KPIs da tela (total período, acumulado, YoC, Efeito Bola de Neve) | ✅ |

**Body POST /criarRendimento:**
```json
{ "idAtivo": 1, "dtRendimento": "2026-07-15", "valorRecebido": 95.50, "reinvestido": false }
```

Detalhes completos dos KPIs em [`DOCUMENTACAO_KPIs_RENDIMENTOS.md`](./DOCUMENTACAO_KPIs_RENDIMENTOS.md).

---

## Middleware

### `verificaToken`
Localização: `src/middleware/auth/verificaToken.js`

Valida o JWT no header `Authorization: Bearer <token>`. Em caso de token inválido ou ausente retorna `401`. Injeta `req.user` com os dados decodificados do token para uso nos controllers.

---

## 📋 Backlog

> Backlog completo e detalhado (com specs) em [`ANALISE_PROJETO.md`](../ANALISE_PROJETO.md).

### Em andamento

- [ ] Controle de Ativos — endpoints para posição consolidada da carteira (preço médio, quantidade, valor atual). O frontend já está pronto e aguardando (`GET /controle-ativos`, `PUT /controle-ativos/preco-teto/:id`, `PUT /controle-ativos/perc-ideal/:id`)
- [ ] Cards de Operações — `POST /cardsOperacoes` (total aportado, vendido, capital líquido)
- [ ] Precificação — integração com API externa (Brapi) para cotação em tempo real dos FIIs

### Pendências

- [ ] Corrigir `atualizarUser` — query referencia tabela antiga `dbo."tabUser"` em vez de `usuarios`
- [ ] Migrar `atualizarUser` e `deleteUser` para `Service`/`Repository`
- [ ] Migrar Seguimentos inteiro para `Controller → Service → Repository`
- [ ] Coluna `perfil` na tabela `usuarios` + middleware `verificaAdmin`
- [ ] Resolver dependência quebrada do S3 (`@aws-sdk/client-s3` não instalado, mas ainda importado em `src/config/s3.js`)
- [ ] Rota de refresh de token JWT
- [ ] Paginação nas rotas de listagem (`/users`, `/operacoes`, `/rendimentos`)
- [ ] Upload de extrato para lançamento em lote de rendimentos / operações (multer já configurado, S3 pendente de dependência)
- [ ] Endpoint de relatório consolidado por período
- [ ] Testes automatizados (unitários e de integração)
- [ ] Dockerização da aplicação
- [ ] Documentação Swagger / OpenAPI
