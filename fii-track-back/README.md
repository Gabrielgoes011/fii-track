# FII-Track — Backend

API RESTful para gestão de carteira de FIIs (Fundos de Investimento Imobiliário): controle de ativos, rebalanceamento, operações de compra/venda, rendimentos, histórico de patrimônio e cotações via **Brapi**. Construída com **Node.js**, **Express 5**, **PostgreSQL** (com Row-Level Security), autenticação **JWT** e **2FA (TOTP)**.

---

## Tecnologias

| Pacote | Versão | Uso |
|---|---|---|
| express | ^5.1.0 | Servidor e roteamento |
| express-rate-limit | ^7.5.1 | Rate limiting nas rotas de autenticação |
| pg (node-postgres) | ^8.20.0 | Conexão com PostgreSQL (Pool) |
| jsonwebtoken | ^9.0.3 | Autenticação JWT |
| bcrypt | ^6.0.0 | Hash de senhas |
| speakeasy | ^2.0.0 | Autenticação de dois fatores (TOTP) |
| qrcode | ^1.5.4 | Geração do QR Code para configurar o 2FA |
| cookie-parser | ^1.4.7 | Leitura de cookies (fluxo de sessão/2FA) |
| dotenv | ^17.4.2 | Variáveis de ambiente |
| uuid | ^13.0.0 | Geração de IDs únicos |
| multer | ^2.1.1 | Upload de arquivos (configurado, ainda sem rota ativa) |
| cors | ^2.8.5 | Liberação de CORS |
| cross-env | ^7.0.3 | Define `NODE_ENV` de forma multiplataforma no script `start` |
| nodemon | ^3.1.14 | Hot reload em desenvolvimento (devDependency) |

> ⚠️ `src/config/s3.js` referencia `@aws-sdk/client-s3`, que **não** está no `package.json`. Nenhum módulo importa `s3.js` hoje, então isso não quebra a aplicação — mas quebrará se alguém reativar upload para S3 sem reinstalar a dependência.

---

## Arquitetura

O backend segue uma organização **modular por domínio**. Cada módulo em `src/modules/` concentra suas próprias camadas:

```
routes  →  controller  →  service  →  repository  →  PostgreSQL
```

- **routes** — define os endpoints e encadeia os middlewares (`verificaToken`, `verificaAdmin`, `rlsMiddleware`).
- **controller** — valida entrada, chama o service e formata a resposta via `httpResponse`.
- **service** — regra de negócio (cálculos de carteira, cotações, KPIs, 2FA).
- **repository** — acesso ao banco (queries SQL).

### Row-Level Security (RLS)

O isolamento de dados por usuário é feito no banco via **RLS**. O `rlsMiddleware` injeta o contexto do usuário logado (`idUser` do token) na conexão antes de cada query, garantindo que cada usuário só enxergue seus próprios dados. Scripts em `db/RLS.sql`.

---

## Estrutura do Projeto

```
fii-track-back/
├── db/
│   ├── createDb.sql            # Schema base (PostgreSQL)
│   ├── dataBase.md             # Notas do modelo de dados
│   ├── RLS.sql                 # Políticas de Row-Level Security
│   └── migrations/
│       ├── 001_controleAtivos_precoTeto.sql
│       ├── 002_cotacoes_cache.sql
│       ├── 003_percIdeal_precisao.sql
│       ├── 004_historico_cotacoes.sql
│       └── 005_historico_carteira.sql
├── src/
│   ├── app.js                  # Configuração do Express e registro das rotas
│   ├── config/
│   │   ├── configDb.js         # Pool de conexão com o PostgreSQL
│   │   ├── env.js              # Carregamento das variáveis de ambiente
│   │   └── s3.js               # Cliente S3 (⚠️ dependência não instalada, sem uso ativo)
│   ├── middleware/
│   │   ├── rlsMiddleware.js     # Injeta o contexto RLS na conexão
│   │   └── auth/
│   │       ├── verificaToken.js # Valida o JWT e injeta req.user
│   │       └── verificaAdmin.js # Exige req.user.adm (rotas administrativas)
│   ├── modules/
│   │   ├── login/               # Autenticação (login, JWT, 2FA/TOTP, /auth/me)
│   │   ├── home/                # Cards do dashboard
│   │   ├── adm/                 # Gestão de usuários (administrativo)
│   │   ├── cadastros/
│   │   │   ├── fundos/          # Meus Fundos (FIIs)
│   │   │   └── segmentos/       # Seguimentos (segmentos)
│   │   ├── operacao/            # Operações de compra e venda
│   │   ├── rendimentos/         # Rendimentos, KPIs e importação B3
│   │   ├── controlAtivos/       # Controle de Ativos + cotações (brapi.service.js)
│   │   ├── historico/           # Histórico de cotações e patrimônio
│   │   └── userProfile/
│   │       ├── changePassword/  # Troca de senha
│   │       └── myProfile/        # Perfil (controller; sem rotas registradas ainda)
│   └── utils/
│       ├── crypto.js            # Utilitários de criptografia (ex.: segredo 2FA)
│       ├── dateUtils.js         # Formatação/conversão de datas
│       ├── httpResponse.js      # Respostas HTTP padronizadas
│       ├── pgErrorHandler.js    # Tradução de erros do PostgreSQL em mensagens seguras
│       ├── validaSenha.util.js  # Validação de senha
│       └── validaUser.js        # Validação de campos de usuário
└── server.js                    # Entry point — sobe o servidor
```

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) v18+ (recomendado LTS)
- PostgreSQL
- npm

---

## Instalação

```bash
cd fii-track-back
npm install
```

### Banco de dados

1. Crie o schema base:

```bash
psql -d sua_database -f db/createDb.sql
```

2. Aplique as migrations em ordem (001 → 005):

```bash
psql -d sua_database -f db/migrations/001_controleAtivos_precoTeto.sql
psql -d sua_database -f db/migrations/002_cotacoes_cache.sql
psql -d sua_database -f db/migrations/003_percIdeal_precisao.sql
psql -d sua_database -f db/migrations/004_historico_cotacoes.sql
psql -d sua_database -f db/migrations/005_historico_carteira.sql
```

3. Aplique as políticas de RLS:

```bash
psql -d sua_database -f db/RLS.sql
```

### Variáveis de ambiente

Copie o `.env.example` e preencha os valores:

```bash
cp .env.example .env.development
```

Principais variáveis:

```env
PORT=3000
JWT_SECRET=sua_chave_secreta
BRAPI_TOKEN=seu_token_brapi          # cotações de ativos da B3
ACCESS_TOKEN_EXPIRES=15m             # (opcional) duração do access token — padrão 15m
REFRESH_TOKEN_EXPIRES=8h             # (opcional) duração do refresh token — padrão 8h
# demais variáveis de conexão do banco conforme .env.example
```

---

## Scripts

```bash
npm run dev     # Desenvolvimento com hot reload (nodemon), NODE_ENV=development
npm run start   # Produção (cross-env NODE_ENV=production)
```

---

## Endpoints

Todas as rotas protegidas exigem o header:

```
Authorization: Bearer <token>
```

Legenda de auth: ❌ pública · ✅ requer token · 🔒 requer token **de administrador**. Todas as rotas com ✅/🔒 aplicam RLS.

### Autenticação e 2FA

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/auth/login` | Login — retorna JWT (ou solicita 2ª etapa se o 2FA estiver ativo) | ❌ |
| POST | `/auth/login/2fa` | Conclui o login validando o código 2FA (TOTP) | ❌ |
| GET | `/auth/me` | Dados do usuário logado (inclui flag de administrador) | ✅ |
| POST | `/auth/refresh` | Renova o access token usando o refresh token (cookie) | ❌* |
| POST | `/2fa/iniciar` | Inicia a configuração do 2FA — retorna segredo e QR Code | ✅ |
| POST | `/2fa/confirmar` | Confirma e ativa o 2FA com o primeiro código válido | ✅ |
| POST | `/2fa/desativar` | Desativa o 2FA da conta | ✅ |
| POST | `/2fa/validar` | Valida um código 2FA avulso | ✅ |

**Body POST /auth/login:**
```json
{ "email": "string", "senha": "string" }
```

> \* `/auth/refresh` não exige access token (ele já pode ter expirado); quem autentica é o **refresh token** enviado no cookie httpOnly `refreshToken`.

#### Fluxo de tokens (access + refresh)

O login emite dois tokens, ambos em cookies httpOnly:

- **Access token** (`token`) — vida curta (**15 min**), autoriza as requisições.
- **Refresh token** (`refreshToken`) — vida mais longa (**8h**), restrito à rota `/auth/refresh`, serve só para emitir um novo access token sem pedir senha.

Quando o access token expira, o cliente chama `POST /auth/refresh`. Se o refresh token ainda for válido, recebe um novo access token; o usuário reconsultado no banco garante que mudanças de perfil (admin) ou desativação sejam refletidas. Ao expirar o refresh token (8h), é necessário fazer login novamente. As durações são configuráveis via `ACCESS_TOKEN_EXPIRES` e `REFRESH_TOKEN_EXPIRES`.

### Home / Dashboard

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/home/cards` | Dados dos cards do dashboard | ✅ |

### Usuários (administrativo)

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/users` | Listar usuários (`?status=on\|off`) | 🔒 |
| GET | `/users/dash/count` | Contar usuários (ativos/inativos/total) | 🔒 |
| POST | `/usuario/cadastrar` | Cadastrar novo usuário | 🔒 |
| PUT | `/users/update/:id` | Atualizar usuário | 🔒 |
| PUT | `/users/on-off/:id` | Inativar / reativar usuário | 🔒 |
| PUT | `/users/reset-password/:id` | Resetar a senha do usuário para o padrão | 🔒 |
| DELETE | `/users/delete/:id` | Deletar usuário | 🔒 |

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
| GET | `/carregarDadosModalNovoRendimento` | Dados para o modal de lançamento | ✅ |
| POST | `/criarRendimento` | Lança um novo rendimento | ✅ |
| DELETE | `/rendimentos/:id` | Exclui um rendimento | ✅ |
| POST | `/cardsRendimentos` | KPIs (total do período, acumulado, YoC, Efeito Bola de Neve) | ✅ |
| POST | `/rendimentos/importar-b3` | Importa rendimentos em lote a partir de um extrato da B3 | ✅ |

**Body POST /criarRendimento:**
```json
{ "idAtivo": 1, "dtRendimento": "2026-07-15", "valorRecebido": 95.50 }
```

**Body POST /rendimentos/importar-b3:**
```json
{ "linhas": [{ "ticker": "MXRF11", "dtRendimento": "2026-07-15", "valorRecebido": 12.34 }] }
```

Detalhes completos dos KPIs em [`DOCUMENTACAO_KPIs_RENDIMENTOS.md`](./DOCUMENTACAO_KPIs_RENDIMENTOS.md).

### Controle de Ativos

Posição consolidada da carteira, rebalanceamento (percentual ideal), preço teto e atualização de cotações via Brapi.

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/controle-ativos/listar` | Posição consolidada da carteira do usuário | ✅ |
| POST | `/controle-ativos/cotacoes` | Atualiza cotações (cache + Brapi sob demanda) | ✅ |
| GET | `/controle-ativos/segmentos` | Segmentos para o dropdown | ✅ |
| GET | `/controle-ativos/segmentos/:idSegmento/ativos` | Ativos de um segmento para o dropdown | ✅ |
| POST | `/controle-ativos/adicionar` | Adiciona um ativo à carteira | ✅ |
| PUT | `/controle-ativos/perc-ideal/:idAtivo` | Atualiza o percentual ideal do ativo | ✅ |
| PUT | `/controle-ativos/preco-teto/:idAtivo` | Atualiza o preço teto do ativo | ✅ |
| DELETE | `/controle-ativos/:idAtivo` | Remove um ativo da carteira | ✅ |

**Body POST /controle-ativos/adicionar:**
```json
{ "idSegmento": 1, "idAtivo": 1, "percIdeal": 0.10, "objetivo": "Renda" }
```

**Body PUT /controle-ativos/perc-ideal/:idAtivo:**
```json
{ "percIdeal": 0.10 }
```

**Body PUT /controle-ativos/preco-teto/:idAtivo:**
```json
{ "precoTeto": 96.72, "modo": "manual" }
```
> `modo` aceita `"manual"` ou `"pvp"` (P/VP, para fundos de papel).

**Resposta de POST /controle-ativos/cotacoes** — além do mapa de cotações, informa a origem dos dados:
```json
{
  "cotacoes": { "MXRF11": { "preco": 9.85, "variacaoPerc": 0.5, "dtConsulta": "..." } },
  "atualizadoEm": "2026-09-14T09:57:13.000Z",
  "origem": "brapi",
  "ttlMinutos": 15,
  "proximaAtualizacaoEm": "2026-09-14T10:12:13.000Z"
}
```
- `origem`: `brapi` (buscou preços novos), `cache` (dados ainda frescos dentro do TTL de 15 min) ou `cache-fallback` (Brapi indisponível, retornou o último cache).
- Para economizar requisições do plano da Brapi, cotações consultadas há menos de **15 minutos** são servidas do cache (tabela `cotacoes`) e não geram nova chamada externa.

### Histórico da Carteira

Séries históricas de preço por ticker e de patrimônio, capturadas a cada atualização de cotações. Período opcional via query `?de=YYYY-MM-DD&ate=YYYY-MM-DD`.

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/historico/cotacoes/:ticker` | Série histórica de preço de um ticker (com variação) | ✅ |
| GET | `/historico/patrimonio` | Série histórica do patrimônio total do usuário | ✅ |
| GET | `/historico/patrimonio/:idAtivo` | Série histórica do patrimônio de um ativo | ✅ |

### Perfil do Usuário

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/perfil/trocar-senha` | Troca a senha do usuário logado | ✅ |

**Body POST /perfil/trocar-senha:**
```json
{ "userId": 1, "senhaAtual": "string", "novaSenha": "string" }
```

---

## Integração com a Brapi

O módulo `controlAtivos/brapi.service.js` consulta a [Brapi](https://brapi.dev) para obter o último preço / fechamento do pregão anterior dos FIIs. A chamada só ocorre sob demanda (botão "Atualizar Cotações") e apenas para os tickers cujo cache expirou, minimizando o consumo do plano. Requer `BRAPI_TOKEN` no `.env`.

---

## Middlewares

### `verificaToken`
`src/middleware/auth/verificaToken.js` — valida o JWT no header `Authorization: Bearer <token>`. Token ausente/inválido retorna `401`. Injeta `req.user` com os dados decodificados.

### `verificaAdmin`
`src/middleware/auth/verificaAdmin.js` — usado após `verificaToken` nas rotas administrativas. Confere `req.user.adm`; sem permissão retorna `403`.

### `rlsMiddleware`
`src/middleware/rlsMiddleware.js` — injeta o contexto do usuário na conexão para que as políticas de RLS do PostgreSQL isolem os dados por usuário.

### `rateLimiter`
`src/middleware/rateLimiter.js` — limita tentativas por IP nas rotas sensíveis de autenticação, mitigando força bruta. Excedido o limite, retorna `429`.

- `loginLimiter` — `/auth/login` e `/auth/login/2fa`: até **10 tentativas falhas** por IP a cada **15 min** (acertos não contam).
- `twoFactorLimiter` — rotas `/2fa/*`: até **20 requisições** por IP a cada **15 min**.

> Em produção atrás de proxy/CDN, `app.js` habilita `trust proxy` quando `NODE_ENV=production`, para que o IP real do cliente seja lido do `X-Forwarded-For`.

---

## 📋 Pendências Atuais

> Itens que já existem no código ou no fluxo do sistema, mas precisam de ajuste, conclusão ou correção. Backlog completo em [`ANALISE_PROJETO.md`](../ANALISE_PROJETO.md).

- [x] **Seguimentos migrado para o padrão** — o módulo `cadastros/segmentos` segue `Controller → Service → Repository`; todo acesso ao banco está isolado em `seguimentos.repositories.js` (controller e service não acessam o banco diretamente). ✅
- [ ] **Dependência do S3 quebrada** — `src/config/s3.js` referencia `@aws-sdk/client-s3`, que não está no `package.json`. Reinstalar a dependência ou remover o arquivo enquanto o upload não for usado.
- [x] **Módulo `userProfile/myProfile` implementado** — módulo completo (`Controller → Service → Repository`) com `GET /perfil` e `PUT /perfil`, rotas registradas no `app.js` (protegidas por `verificaToken` + `rlsMiddleware`). ✅
- [x] **Rota de troca de senha renomeada** — movida de `/controle-ativos/trocar-senha` para `/perfil/trocar-senha` (back + front). ✅
- [x] **Bug no mobile (frontend)** — a tela não refletia o estado atualizado no celular. Causa: o `index.html` ficava preso em cache no mobile/PWA, apontando para um bundle antigo. Correção: `Cache-Control: no-cache` no `index.html`/`manifest.json` e `immutable` nos assets com hash (`vercel.json`), meta tags anti-cache no `index.html` e auto-reload em erro de chunk desatualizado (`src/index.jsx`). ✅
- [ ] **Upload de extrato B3** — o parser em lote (`/rendimentos/importar-b3`) já existe, mas o upload do arquivo em si depende do multer + destino de armazenamento (S3 pendente).

---

## 🚀 Futuro (pé no chão)

> Melhorias realistas e de escopo controlado, viáveis para a estrutura atual do projeto — sem depender de reescritas grandes.

**Qualidade e manutenção**
- [ ] Testes automatizados começando pelos cálculos críticos (KPIs de rendimentos, rebalanceamento, histórico) com Vitest ou Jest.
- [ ] Documentação Swagger / OpenAPI gerada a partir das rotas, para facilitar o consumo pelo frontend.
- [ ] Padronizar tratamento de erro e logs em todos os módulos (já existe `pgErrorHandler` e `httpResponse` para servir de base).

**API e segurança**
- [x] Rota de refresh de token JWT (access 15 min + refresh 8h, `POST /auth/refresh`). ✅
- [ ] Paginação nas listagens que tendem a crescer (`/users`, `/operacoes`, `/rendimentos`, `/historico/*`).
- [x] Rate limiting básico nas rotas sensíveis (`/auth/login`, `/2fa/*`). ✅

**Funcionalidades**
- [ ] Endpoint de relatório consolidado por período (aportes, proventos e patrimônio em uma única resposta).
- [ ] Agendamento leve para atualizar cotações fora do horário de pico (ex.: 1x após o fechamento do pregão), reduzindo cliques manuais.
- [ ] Exportação de dados da carteira/rendimentos em CSV ou XLSX.

**Infraestrutura**
- [ ] Dockerização da aplicação (Dockerfile + docker-compose com o PostgreSQL) para padronizar o ambiente local.
- [ ] Pipeline simples de CI (lint + testes) no push, quando os testes existirem.
