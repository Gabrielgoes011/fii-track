# 💚 fii-track

Aplicação fullstack para controle e acompanhamento de carteira de Fundos de Investimento Imobiliário (FIIs). Permite gerenciar ativos, registrar operações de compra/venda, acompanhar rendimentos recebidos e visualizar a performance da carteira.

> **Status:** Em desenvolvimento — arquitetura sendo migrada para o padrão `Controller → Service → Repository`.

---

## Estrutura do Projeto

```
fii-track/
├── fii-track-back/   # API REST — Node.js + Express + PostgreSQL
└── fii-track-front/  # SPA — React + Vite (estilização via inline styles)
```

---

## Backend (`fii-track-back`)

### Tecnologias

| Pacote | Versão | Uso |
|---|---|---|
| Node.js (ESM) | v18+ | Runtime |
| Express | ^5.1.0 | Framework HTTP |
| pg (node-postgres) | ^8.20.0 | Conexão com PostgreSQL (Pool) |
| jsonwebtoken | ^9.0.3 | Autenticação JWT |
| bcrypt | ^6.0.0 | Hash de senhas |
| cross-env | ^7.0.3 | Define `NODE_ENV` de forma multiplataforma no script `start` |
| multer | ^2.1.1 | Upload de arquivos (configurado, ainda não usado em nenhuma rota) |
| dotenv | ^17.x | Variáveis de ambiente |
| uuid | ^13.x | Geração de IDs únicos |
| cors | ^2.8.5 | Liberação de CORS |
| nodemon | ^3.x | Hot-reload em desenvolvimento |

> ⚠️ `src/config/s3.js` importa `@aws-sdk/client-s3`, mas esse pacote **não está mais** no `package.json`/`node_modules`. O arquivo não é usado por nenhum controller hoje, então não quebra a aplicação — mas vai quebrar assim que alguém tentar reativar o upload de fotos/extratos. Ver backlog.

### Arquitetura

O backend está em migração progressiva para a separação de responsabilidades em três camadas:

```
Routes  →  Controller  →  Service  →  Repository  →  Banco de Dados
```

- **Routes** — define os endpoints HTTP e aplica middlewares (ex: `verificaToken`)
- **Controller** — recebe a requisição, chama o Service e devolve a resposta HTTP
- **Service** — contém as regras de negócio e validações
- **Repository** — executa diretamente as queries SQL

> `operacoes` e `rendimentos` já seguem as 3 camadas por completo. `seguimentos` ainda acessa o banco direto no controller, e `usuarios` está parcialmente migrado (`atualizarUser`/`deleteUser` ainda fora do padrão). Detalhes em [`ANALISE_PROJETO.md`](ANALISE_PROJETO.md).

### Middleware de Autenticação

`src/middleware/auth/verificaToken.js`

Valida o JWT no header `Authorization: Bearer <token>`. Retorna `401` se ausente ou inválido. Injeta `req.user` com os dados do token para uso nos controllers.

### Variáveis de Ambiente

Crie `.env.development` na raiz de `fii-track-back/` com base no `.env.example`:

```env
PORT=3000
JWT_SECRET=sua_chave_secreta_aqui
AWS_REGION=us-east-1
AWS_ACCESS_KEY=sua_access_key
AWS_SECRET_KEY=sua_secret_key
```

### Endpoints

Todas as rotas (exceto `/auth/login`) exigem o header:
```
Authorization: Bearer <token>
```

#### Autenticação
| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/login` | Autentica o usuário e retorna o JWT |

#### Home / Dashboard
| Método | Rota | Descrição |
|---|---|---|
| GET | `/home/cards` | Dados dos cards do dashboard |

#### Usuários
| Método | Rota | Descrição |
|---|---|---|
| GET | `/users` | Lista usuários |
| GET | `/users/dash/count` | Conta total de usuários |
| POST | `/usuario/cadastrar` | Cadastra novo usuário |
| PUT | `/users/update/:id` | Atualiza dados do usuário (⚠️ bug: query aponta para tabela antiga `dbo."tabUser"`) |
| PUT | `/users/on-off/:id` | Inativa ou reativa usuário |
| DELETE | `/users/delete/:id` | Remove usuário |

#### Seguimentos (Segmentos)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/seguimentos` | Lista todos os seguimentos |
| GET | `/seguimentos/contar` | Conta seguimentos cadastrados |
| POST | `/seguimentos` | Cadastra novo seguimento |
| PUT | `/seguimentos/update` | Atualiza seguimento |
| DELETE | `/seguimentos/delete/:id` | Remove seguimento |

#### Meus Fundos (FIIs)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/meusFundos` | Lista fundos do usuário logado |
| GET | `/meusFundos/contar` | Conta fundos ativos |
| POST | `/meusFundos/cadastrar` | Cadastra novo fundo |
| PUT | `/meusFundos/editar/:id` | Atualiza nome do fundo |
| DELETE | `/meusFundos/deletar/:id` | Remove fundo |

#### Operações (Compras e Vendas)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/ativosDropList` | Lista ativos para dropdown |
| POST | `/operacoes` | Lista operações filtradas por mês/ano |
| POST | `/lancarOperacao` | Registra nova operação (compra/venda) |
| POST | `/excluirOperacao` | Remove uma operação pelo ID |
| POST | `/carregaDadosGraficoOperacoes` | Dados do gráfico de operações por ano |

#### Rendimentos
| Método | Rota | Descrição |
|---|---|---|
| POST | `/rendimentos` | Lista rendimentos filtrados por mês/ano/ativo |
| POST | `/carregarGraficoDashboard` | Dados do gráfico do dashboard por ano |
| POST | `/carregarComparacaoAnual` | Comparativo de rendimentos entre anos |
| GET | `/carregarDadosModalNovoRendimento` | Ativos disponíveis para lançar rendimento |
| POST | `/criarRendimento` | Lança um novo rendimento (aceita flag `reinvestido`) |
| DELETE | `/rendimentos/:id` | Exclui um rendimento |
| POST | `/cardsRendimentos` | KPIs da tela de Rendimentos (ver [`DOCUMENTACAO_KPIs_RENDIMENTOS.md`](fii-track-back/DOCUMENTACAO_KPIs_RENDIMENTOS.md)) |

### Como Executar

```bash
cd fii-track-back
npm install
npm run dev     # desenvolvimento com hot-reload
npm start       # produção
```

O servidor sobe em `http://localhost:3000`.

---

## Frontend (`fii-track-front`)

### Tecnologias

| Pacote | Versão | Uso |
|---|---|---|
| React | ^19.x | UI |
| Vite | ^8.x | Bundler / Dev server |
| React Router DOM | ^7.x | Roteamento SPA |
| Axios | ^1.x | Requisições HTTP |
| React Toastify | ^11.x | Notificações |
| React Icons | ^5.x | Ícones |
| @vercel/speed-insights | ^2.x | Métricas de performance |

> Estilização é feita via **inline styles** (não há Tailwind CSS nem React Bootstrap no `package.json` — remova essas menções se encontrar em código ou docs antigos).

### Páginas

| Rota | Página | Status |
|---|---|---|
| `/login` | Login | ✅ Pronto |
| `/` | Dashboard | ✅ Pronto |
| `/rendimentos` | Rendimentos | ✅ Pronto |
| `/operacoes` | Compras e Vendas | ✅ Pronto |
| `/cadastros/meusfiis` | Meus FIIs | ✅ Pronto |
| `/cadastros/seguimentos` | Seguimentos | ⚠️ CRUD pronto — edição pendente |
| `/cadastros/usuarios` | Usuários | ⚠️ CRUD pronto — edição e reset de senha pendentes |
| `/controle-ativos` | Controle de Ativos | 🧪 UI completa — dados mockados, backend pendente |
| `/precificacao` | Precificação | 🚧 Em desenvolvimento |
| `/relatorios` | Relatórios | 🚧 Em desenvolvimento |
| `/configuracoes` | Configurações | 🚧 Em desenvolvimento |

> Todas as rotas exceto `/login` são protegidas. Sem token válido no `localStorage`, o usuário é redirecionado automaticamente.

### Autenticação no Frontend

O token JWT é armazenado no `localStorage`. Um interceptor no Axios dispara o evento `unauthorized` ao receber `401`, forçando logout automático sem refresh de página.

### Modos de Build

```bash
cd fii-track-front
npm install
npm run dev      # desenvolvimento
npm run demo     # modo demonstração
npm run build    # build de produção
npm run preview  # preview do build
```

---

## Banco de Dados

PostgreSQL hospedado no [Neon](https://neon.tech), acessado via `Pool` de conexões com SSL habilitado (`pg`). A configuração fica em `api-nodeback/src/config/configDb.js`.

Script de criação das tabelas em `fii-track-back/db/createDb.sql`.

Tabelas principais:

| Tabela | Descrição |
|---|---|
| `usuarios` | Dados cadastrais dos usuários |
| `credenciaisUsuario` | Senhas com hash (relacionada a `usuarios`) |
| `seguimentos` | Segmentos/categorias de fundos (ex: Logística, Lajes) |
| `ativos` | Fundos cadastrados (ticker, nome, CNPJ, seguimento) |
| `operacoes` | Compras e vendas de cotas |
| `rendimentos` | Proventos recebidos por ativo |

---

## Atualizações Recentes

- KPIs de Rendimentos implementados de ponta a ponta (`POST /cardsRendimentos`) — cards de Total do Período, Acumulado, YoC e Efeito Bola de Neve
- Lançamento e exclusão de rendimento implementados (`POST /criarRendimento`, `DELETE /rendimentos/:id`), incluindo flag `reinvestido`
- Exclusão de operação agora valida que a operação pertence ao usuário logado
- Tela de Controle de Ativos construída no frontend (KPIs, tabela de 16 colunas, inputs editáveis, badges) — ainda rodando sobre dados mockados, aguardando backend
- Cards do Dashboard navegam para as telas correspondentes ao clicar (`/rendimentos`, `/operacoes`, `/controle-ativos`)
- Senha padrão de novos usuários (`Track@123`) armazenada com hash `bcrypt` (10 rounds)
- Login agora valida senha com `bcrypt.compare`
- Módulo de usuários migrado parcialmente para `Controller → Service → Repository`
- Rota de cadastro de usuário alterada de `POST /cadUsers` para `POST /usuario/cadastrar`
- Rota de edição de fundo padronizada para `PUT /meusFundos/editar/:id`

---

## 📋 Backlog

> Backlog completo e detalhado (com specs) em [`ANALISE_PROJETO.md`](ANALISE_PROJETO.md).

### 🚧 Em andamento

- [ ] **Controle de Ativos** — backend completo (o frontend já está pronto e usa dados mockados)
- [ ] **Precificação** — integração com API externa para cotação em tempo real dos FIIs

### 🔐 Autenticação

- [ ] Rota de refresh de token JWT

### 👤 Usuários

- [ ] Corrigir query do `atualizarUser` — referencia tabela antiga (`dbo."tabUser"`) em vez de `usuarios`
- [ ] Corrigir `validaEmailExistente` no `validaUser.js` — mesma referência errada
- [ ] Migrar `atualizarUser` e `deleteUser` para `Service`/`Repository`
- [ ] Coluna `perfil` (admin/user) + middleware `verificaAdmin`
- [ ] Implementar edição de usuário e reset de senha no frontend (hoje só exibem toast)
- [ ] Reativar validações de senha comentadas (confirmação, tamanho mínimo, letra maiúscula)
- [ ] Validação real de CPF (dígitos verificadores)

### 🏷️ Seguimentos

- [ ] Migrar módulo inteiro para `Controller → Service → Repository` (hoje acessa o banco direto)
- [ ] Implementar edição de seguimento no frontend (hoje só exibe toast — lógica comentada no hook)
- [ ] Bloquear `deleteSeguimento` se houver ativos vinculados ao seguimento
- [ ] Corrigir mensagem de erro no `catch` do `contarSeguimentos` ("Erro ao contar usuários" → "Erro ao contar seguimentos")
- [ ] Implementar log de alterações (aguardando tabela de logs)

### 📊 Operações

- [ ] Criar endpoint `POST /cardsOperacoes` (total aportado, vendido e capital líquido) — spec pronta em `ANALISE_PROJETO.md`
- [ ] Validar campo `tipo` em `lancarOperacao` (aceitar apenas `'Compra'` ou `'Venda'`)

### 🛠️ Geral

- [ ] Resolver dependência quebrada do S3 (`@aws-sdk/client-s3` não está mais instalado, mas `src/config/s3.js` ainda o importa)
- [ ] Paginação nas rotas de listagem (`/users`, `/operacoes`, `/rendimentos`)
- [ ] Upload de extrato para lançamento em lote (multer + S3 já configurados, mas não conectados a nenhuma rota)
- [ ] Página de Relatórios — exportação por período (PDF / Excel)
- [ ] Página de Configurações — preferências do usuário

### 🔮 Possibilidades Futuras

- [ ] Responsividade mobile
- [ ] Testes automatizados (backend e frontend)
- [ ] Dockerização da aplicação
- [ ] Documentação Swagger / OpenAPI
- [ ] Integração com serviços AWS (ex: S3 para extratos, SES para notificações)
