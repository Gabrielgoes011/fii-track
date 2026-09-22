# 💚 FII-Track

Aplicação fullstack para gestão e acompanhamento de carteira de Fundos de Investimento Imobiliário (FIIs). Permite cadastrar ativos, registrar operações de compra/venda, acompanhar rendimentos, atualizar cotações em tempo (quase) real via Brapi, rebalancear a carteira por percentual ideal e visualizar o histórico de patrimônio ao longo do tempo.

> **Status:** Em desenvolvimento ativo. Arquitetura modular por domínio no backend, com autenticação JWT + 2FA e isolamento de dados por usuário (RLS).

---

## Estrutura do Projeto

```
fii-track/
├── fii-track-back/    # API REST — Node.js + Express 5 + PostgreSQL
└── fii-track-front/   # SPA — React 19 + Vite (estilização via inline styles)
```

Cada subprojeto tem seu próprio README com detalhes:
- Backend: [`fii-track-back/README.md`](fii-track-back/README.md)
- KPIs de rendimentos: [`fii-track-back/DOCUMENTACAO_KPIs_RENDIMENTOS.md`](fii-track-back/DOCUMENTACAO_KPIs_RENDIMENTOS.md)
- Backlog detalhado: [`ANALISE_PROJETO.md`](ANALISE_PROJETO.md)

---

## Principais Funcionalidades

- **Autenticação JWT com 2FA (TOTP)** — login com segunda etapa opcional via app autenticador (QR Code).
- **Refresh token** — access token de vida curta (15 min) renovado por um refresh token (8h), sem logout no meio da sessão.
- **Controle de Ativos** — posição consolidada da carteira, percentual ideal, preço teto e rebalanceamento.
- **Cotações via Brapi** — atualização sob demanda com cache de 15 min para economizar requisições.
- **Histórico da Carteira** — séries de preço por ticker e evolução do patrimônio ao longo do tempo.
- **Operações e Rendimentos** — lançamento de compras/vendas, proventos, KPIs (YoC, Efeito Bola de Neve) e importação de rendimentos da B3.
- **Row-Level Security (RLS)** — cada usuário só enxerga seus próprios dados, garantido no banco.
- **Rate limiting** — proteção contra força bruta nas rotas de login e 2FA.

---

## Backend (`fii-track-back`)

API RESTful em **Node.js (ESM) + Express 5 + PostgreSQL**, organizada de forma **modular por domínio**.

### Arquitetura

```
Routes  →  Controller  →  Service  →  Repository  →  PostgreSQL (RLS)
```

Cada módulo em `src/modules/<domínio>/` concentra suas próprias camadas. O `rlsMiddleware` injeta o contexto do usuário na conexão para que as políticas de RLS isolem os dados. O tratamento de erro é padronizado: os controllers logam o erro no servidor e devolvem uma mensagem segura via `pgErrorHandler`, sem vazar detalhes internos.

### Principais dependências

| Pacote | Uso |
|---|---|
| express ^5 | Servidor e roteamento |
| pg ^8 | PostgreSQL (Pool) |
| jsonwebtoken ^9 | JWT (access + refresh) |
| bcrypt ^6 | Hash de senhas |
| speakeasy / qrcode | 2FA (TOTP) e QR Code |
| express-rate-limit ^7 | Rate limiting nas rotas sensíveis |
| cookie-parser | Cookies httpOnly de sessão |
| cors, dotenv, uuid, multer | CORS, env, IDs, upload |

### Variáveis de ambiente

Crie `.env.development` em `fii-track-back/` com base no `.env.example`:

```env
PORT=3000
JWT_SECRET=sua_chave_secreta
BRAPI_TOKEN=seu_token_brapi          # cotações de ativos da B3
ACCESS_TOKEN_EXPIRES=15m             # (opcional) duração do access token
REFRESH_TOKEN_EXPIRES=8h             # (opcional) duração do refresh token
# demais variáveis de conexão do banco conforme .env.example
```

### Endpoints (visão geral)

Rotas protegidas exigem `Authorization: Bearer <token>` e aplicam RLS. Legenda: ❌ pública · ✅ requer token · 🔒 requer admin.

#### Autenticação e 2FA
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/auth/login` | Login (pode exigir 2ª etapa) | ❌ |
| POST | `/auth/login/2fa` | Conclui o login validando o código 2FA | ❌ |
| POST | `/auth/refresh` | Renova o access token via refresh token (cookie) | ❌* |
| GET | `/auth/me` | Dados do usuário logado | ✅ |
| POST | `/2fa/iniciar` | Gera segredo + QR Code | ✅ |
| POST | `/2fa/confirmar` | Ativa o 2FA | ✅ |
| POST | `/2fa/desativar` | Desativa o 2FA | ✅ |
| POST | `/2fa/validar` | Valida um código 2FA | ✅ |

> \* `/auth/refresh` autentica pelo refresh token no cookie httpOnly, não pelo access token.

#### Home / Usuários / Perfil
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/home/cards` | Cards do dashboard | ✅ |
| GET | `/users` | Listar usuários (`?status=on\|off`) | 🔒 |
| GET | `/users/dash/count` | Contar usuários | 🔒 |
| POST | `/usuario/cadastrar` | Cadastrar usuário | 🔒 |
| PUT | `/users/update/:id` | Atualizar usuário | 🔒 |
| PUT | `/users/on-off/:id` | Inativar / reativar | 🔒 |
| PUT | `/users/reset-password/:id` | Resetar senha para o padrão | 🔒 |
| DELETE | `/users/delete/:id` | Deletar usuário | 🔒 |
| GET | `/perfil` | Buscar o perfil do usuário logado | ✅ |
| PUT | `/perfil` | Atualizar dados cadastrais do próprio usuário | ✅ |
| POST | `/perfil/trocar-senha` | Trocar a senha do usuário logado | ✅ |

#### Cadastros
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET/POST/PUT/DELETE | `/meusFundos*` | CRUD de fundos (FIIs) | ✅ |
| GET/POST/PUT/DELETE | `/seguimentos*` | CRUD de segmentos | ✅ |

#### Operações e Rendimentos
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/ativosDropList` | Ativos para dropdown | ✅ |
| POST | `/operacoes` | Listar operações por mês/ano | ✅ |
| POST | `/lancarOperacao` | Lançar operação | ✅ |
| POST | `/excluirOperacao` | Excluir operação | ✅ |
| POST | `/carregaDadosGraficoOperacoes` | Gráfico de operações por ano | ✅ |
| POST | `/rendimentos` | Listar rendimentos | ✅ |
| POST | `/carregarGraficoDashboard` | Gráfico de rendimentos por ano | ✅ |
| POST | `/carregarComparacaoAnual` | Comparação entre anos | ✅ |
| GET | `/carregarDadosModalNovoRendimento` | Ativos para o modal | ✅ |
| POST | `/criarRendimento` | Lançar rendimento | ✅ |
| DELETE | `/rendimentos/:id` | Excluir rendimento | ✅ |
| POST | `/cardsRendimentos` | KPIs (YoC, Bola de Neve, etc.) | ✅ |
| POST | `/rendimentos/importar-b3` | Importar rendimentos em lote da B3 | ✅ |

#### Controle de Ativos e Cotações
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/controle-ativos/listar` | Posição consolidada da carteira | ✅ |
| POST | `/controle-ativos/cotacoes` | Atualiza cotações (cache + Brapi) | ✅ |
| GET | `/controle-ativos/segmentos` | Segmentos para dropdown | ✅ |
| GET | `/controle-ativos/segmentos/:idSegmento/ativos` | Ativos por segmento | ✅ |
| POST | `/controle-ativos/adicionar` | Adiciona ativo à carteira | ✅ |
| PUT | `/controle-ativos/perc-ideal/:idAtivo` | Atualiza percentual ideal | ✅ |
| PUT | `/controle-ativos/preco-teto/:idAtivo` | Atualiza preço teto | ✅ |
| DELETE | `/controle-ativos/:idAtivo` | Remove ativo | ✅ |

#### Histórico da Carteira
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/historico/cotacoes/:ticker` | Série histórica de preço de um ticker | ✅ |
| GET | `/historico/patrimonio` | Série do patrimônio total | ✅ |
| GET | `/historico/patrimonio/:idAtivo` | Série do patrimônio de um ativo | ✅ |

> Detalhes completos de bodies e respostas em [`fii-track-back/README.md`](fii-track-back/README.md).

### Como executar

```bash
cd fii-track-back
npm install
npm run dev     # desenvolvimento com hot-reload (nodemon)
npm run start   # produção
```

O servidor sobe em `http://localhost:3000`.

---

## Frontend (`fii-track-front`)

SPA em **React 19 + Vite**, estilização via inline styles, deploy na Vercel.

### Principais dependências

| Pacote | Uso |
|---|---|
| react ^19 / react-dom | UI |
| vite ^8 | Bundler / dev server |
| react-router-dom ^7 | Roteamento SPA |
| axios ^1 | Requisições HTTP |
| react-toastify ^11 | Notificações |
| react-icons ^5 | Ícones |
| xlsx | Importação/leitura de planilhas (extrato B3) |
| @vercel/speed-insights | Métricas de performance |

### Páginas

| Rota | Página | Observação |
|---|---|---|
| `/login` | Login | Suporta 2FA |
| `/` | Dashboard | Cards navegáveis |
| `/controle-ativos` | Controle de Ativos | Carteira, cotações e histórico (em abas) |
| `/operacoes` | Compras e Vendas | |
| `/rendimentos` | Rendimentos | KPIs e importação B3 |
| `/precificacao` | Precificação | Em desenvolvimento |
| `/relatorios` | Relatórios | Em desenvolvimento |
| `/perfil` | Perfil | Troca de senha e 2FA |
| `/cadastros/usuarios` | Usuários | Restrito a administradores |
| `/cadastros/seguimentos` | Seguimentos | |
| `/cadastros/meusfiis` | Meus FIIs | |

> Todas as rotas exceto `/login` são protegidas.

### Autenticação no frontend

Sessão baseada em cookies httpOnly (access + refresh) com fallback de token no `localStorage`. Um interceptor no Axios trata `401` e dispara logout automático. Layout responsivo, com ajustes específicos para mobile (ex.: abas com scroll horizontal no Controle de Ativos).

### Cache e PWA

O app é instalável como PWA. O `index.html` e o `manifest.json` são servidos com `no-cache` e os assets com hash em `/assets` com cache `immutable` (`vercel.json`), evitando que versões antigas fiquem presas no cache do mobile. Há ainda um auto-reload em caso de erro de chunk desatualizado após um novo deploy.

### Como executar

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

PostgreSQL (hospedado no [Neon](https://neon.tech)), acessado via `Pool` com SSL. Configuração em `fii-track-back/src/config/configDb.js`.

- Schema base: `fii-track-back/db/createDb.sql`
- Migrations (001 → 005): `fii-track-back/db/migrations/`
- Políticas de RLS: `fii-track-back/db/RLS.sql`

Tabelas principais:

| Tabela | Descrição |
|---|---|
| `usuarios` | Dados cadastrais |
| `credenciaisUsuario` | Senhas (hash) + estado do 2FA |
| `seguimentos` | Segmentos de fundos |
| `ativos` | Fundos cadastrados |
| `controleAtivos` | Ativos da carteira do usuário (percentual ideal, preço teto) |
| `operacoes` | Compras e vendas |
| `rendimentos` | Proventos recebidos |
| `cotacoes` | Cache da última cotação por ticker |
| `historico_cotacoes` | Série histórica de preço por ticker |
| `historico_carteira` | Snapshots de patrimônio por usuário |

---

## Atualizações Recentes

- **Autenticação 2FA (TOTP)** com QR Code (speakeasy + qrcode).
- **Refresh token** — access token de 15 min renovado por refresh de 8h (`POST /auth/refresh`), sem logout no meio da sessão.
- **Controle de Ativos** completo no backend (posição, percentual ideal, preço teto) integrado ao frontend.
- **Cotações via Brapi** com cache de 15 min; a resposta informa a origem (`brapi` / `cache` / `cache-fallback`) e o front exibe mensagens contextuais ("cotações já atualizadas / próximo pregão").
- **Histórico da Carteira** — séries de preço por ticker e evolução do patrimônio, com gravação de snapshot a cada atualização.
- **Importação de rendimentos da B3** em lote (`POST /rendimentos/importar-b3`).
- **Rate limiting** nas rotas de login e 2FA (express-rate-limit).
- **Tratamento de erro e logs padronizados** em todos os módulos, sem vazar detalhes internos ao cliente.
- **Rota de troca de senha** renomeada para `/perfil/trocar-senha`.
- **Correção de cache no mobile/PWA** — headers de cache no `vercel.json` e auto-reload em chunk desatualizado.

---

## 📋 Pendências Atuais

> Backlog completo em [`ANALISE_PROJETO.md`](ANALISE_PROJETO.md).

- [x] **Seguimentos** — já segue o padrão `Controller → Service → Repository`. ✅
- [ ] **Dependência do S3** — `src/config/s3.js` referencia `@aws-sdk/client-s3`, que não está instalado.
- [x] **Módulo `userProfile/myProfile`** — rotas `GET/PUT /perfil` registradas no `app.js`. ✅
- [ ] **Upload de extrato B3** — o parser em lote existe; falta o upload do arquivo e o destino de armazenamento.
- [ ] **Páginas de Precificação e Relatórios** — em desenvolvimento.

---

## 🚀 Futuro (pé no chão)

Melhorias realistas para a estrutura atual, sem depender de reescritas grandes.

**Qualidade e manutenção**
- [ ] Testes automatizados começando pelos cálculos críticos (KPIs, rebalanceamento, histórico).
- [ ] Documentação Swagger / OpenAPI a partir das rotas.

**API e segurança**
- [x] Interceptor no frontend que chama `/auth/refresh` no `401`, refaz a requisição original e só desloga quando o refresh falha (fecha o ciclo do refresh token). ✅
- [ ] Paginação nas listagens que tendem a crescer (`/users`, `/operacoes`, `/rendimentos`, `/historico/*`).
- [ ] Refresh token stateful — revogação e logout real. Requer uma tabela nova (migration); pendente por depender do banco.

**Funcionalidades**
- [ ] Endpoint de relatório consolidado por período (aportes, proventos e patrimônio).
- [ ] Atualização agendada de cotações fora do horário de pico.
- [ ] Exportação de dados em CSV / XLSX.

**Infraestrutura**
- [ ] Dockerização (Dockerfile + docker-compose com PostgreSQL).
- [ ] Pipeline de CI (lint + testes) quando os testes existirem.
