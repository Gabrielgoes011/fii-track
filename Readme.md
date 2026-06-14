# 💚 fii-track

Aplicação fullstack para controle e acompanhamento de carteira de Fundos de Investimento Imobiliário (FIIs). Permite gerenciar ativos, registrar operações de compra/venda, acompanhar rendimentos recebidos e visualizar a performance da carteira.

> **Status:** Em desenvolvimento — arquitetura sendo migrada para o padrão `Controller → Service → Repository`.

---

## Estrutura do Projeto

```
fii-track/
├── fii-track-back/   # API REST — Node.js + Express + PostgreSQL
└── fii-track-front/  # SPA — React + Vite + Tailwind CSS
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
| multer | ^2.1.1 | Upload de arquivos |
| @aws-sdk/client-s3 | ^3.x | Armazenamento S3 (AWS) |
| dotenv | ^17.x | Variáveis de ambiente |
| uuid | ^13.x | Geração de IDs únicos |
| nodemon | ^3.x | Hot-reload em desenvolvimento |

### Arquitetura

O backend está em migração progressiva para a separação de responsabilidades em três camadas:

```
Routes  →  Controller  →  Service  →  Repository  →  Banco de Dados
```

- **Routes** — define os endpoints HTTP e aplica middlewares (ex: `verificaToken`)
- **Controller** — recebe a requisição, chama o Service e devolve a resposta HTTP
- **Service** — contém as regras de negócio e validações
- **Repository** — executa diretamente as queries SQL

> Módulos ainda não migrados (ex: `operacoes`, `rendimentos`) têm a lógica diretamente no controller. A migração é incremental.

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
| PUT | `/users/update/:id` | Atualiza dados do usuário |
| PUT | `/inativaUser/:id` | Inativa ou reativa usuário |
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
| POST | `/rendimentos` | Lista rendimentos filtrados por mês/ano |
| POST | `/carregarGraficoDashboard` | Dados do gráfico do dashboard por ano |
| POST | `/carregarComparacaoAnual` | Comparativo de rendimentos entre anos |
| GET | `/carregarDadosModalNovoRendimento` | Ativos disponíveis para lançar rendimento |

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
| Tailwind CSS | ^3.x | Estilização utilitária |
| Axios | ^1.x | Requisições HTTP |
| React Toastify | ^11.x | Notificações |
| React Bootstrap | ^2.x | Componentes de UI |
| React Icons | ^5.x | Ícones |

### Páginas

| Rota | Página | Status |
|---|---|---|
| `/login` | Login | ✅ Pronto |
| `/` | Dashboard | ✅ Pronto |
| `/rendimentos` | Rendimentos | ✅ Pronto |
| `/operacoes` | Compras e Vendas | ✅ Pronto |
| `/cadastros/meusfiis` | Meus FIIs | ✅ Pronto |
| `/cadastros/seguimentos` | Seguimentos | ✅ Pronto |
| `/cadastros/usuarios` | Usuários | 🚧 Em desenvolvimento |
| `/controle-ativos` | Controle de Ativos | 🚧 Em desenvolvimento |
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

- Cards do Dashboard agora navegam para as telas correspondentes ao clicar (`/rendimentos`, `/operacoes`, `/controle-ativos`)
- Senha padrão de novos usuários (`Track@123`) armazenada com hash `bcrypt` (10 rounds)
- Login agora valida senha com `bcrypt.compare`
- Módulo de usuários migrado para `Controller → Service → Repository`
- Rota de cadastro de usuário alterada de `POST /cadUsers` para `POST /usuario/cadastrar`
- Rota de edição de fundo padronizada para `PUT /meusFundos/editar/:id`

---

## 📋 Backlog

### 🚧 Em andamento

- [ ] **Controle de Ativos** — tela e endpoints para posição consolidada da carteira (preço médio, quantidade total, valor de mercado)
- [ ] **Precificação** — integração com API externa para cotação em tempo real dos FIIs

### 🔐 Autenticação

- [ ] Rota de refresh de token JWT

### 👤 Usuários

- [ ] Corrigir query do `atualizarUser` — referencia tabela antiga (`dbo."tabUser"`) em vez de `usuarios`
- [ ] Corrigir `validaEmailExistente` no `validaUser.js` — mesma referência errada
- [ ] Reativar validações de senha comentadas (confirmação, tamanho mínimo, letra maiúscula)
- [ ] Validação real de CPF (dígitos verificadores)

### 🏷️ Seguimentos

- [ ] Bloquear `deleteSeguimento` se houver ativos vinculados ao seguimento
- [ ] Corrigir mensagem de erro no `catch` do `contarSeguimentos` ("Erro ao contar usuários" → "Erro ao contar seguimentos")
- [ ] Implementar log de alterações (aguardando tabela de logs)

### 📦 Meus Fundos

- [ ] Migrar `contarFundosAtivos` para a camada Service/Repository

### 📊 Operações

- [ ] Migrar módulo inteiro para `Controller → Service → Repository`
- [ ] Validar campo `tipo` em `lancarOperacao` (aceitar apenas `'Compra'` ou `'Venda'`)
- [ ] Verificar propriedade da operação antes de excluir (qualquer usuário autenticado pode excluir hoje)

### 💰 Rendimentos

- [ ] Migrar módulo inteiro para `Controller → Service → Repository`
- [ ] Criar `POST /rendimentos/lancar` para salvar novo rendimento
- [ ] Criar rotas de edição e exclusão de rendimento

### 🛠️ Geral

- [ ] Adotar `httpResponse.js` nos controllers (arquivo existe mas não está sendo usado)
- [ ] Paginação nas rotas de listagem (`/users`, `/operacoes`, `/rendimentos`)
- [ ] Upload de extrato para lançamento em lote (multer + S3 já configurados)
- [ ] Página de Relatórios — exportação por período (PDF / Excel)
- [ ] Página de Configurações — preferências do usuário

### 🔮 Possibilidades Futuras

- [ ] Responsividade mobile
- [ ] Testes automatizados (backend e frontend)
- [ ] Dockerização da aplicação
- [ ] Documentação Swagger / OpenAPI
- [ ] Integração com serviços AWS (ex: S3 para extratos, SES para notificações)
