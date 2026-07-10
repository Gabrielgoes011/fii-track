# Análise do Projeto FIITrack — Backlog, Débitos Técnicos e Roadmap

> Documento gerado em 09/07/2026. Serve como referência consolidada do estado atual
> do sistema, o que falta migrar para o padrão de 3 camadas e o que precisa ser
> implementado ou corrigido.

---

## 1. Mudança de Conceito — Multi-usuário

### Decisão arquitetural

A partir de agora o sistema passa a ser **multi-usuário real**:

- Cada usuário logado vê **apenas seus próprios dados**
  (rendimentos, operações, ativos cadastrados por ele)
- A tela de **cadastro e listagem de usuários** passa a ser
  **exclusiva do perfil Admin**
- Usuários comuns não terão acesso ao módulo de gestão de usuários

### O que isso implica

#### Back-end

| Onde mudar | O que fazer |
|---|---|
| `verificaToken.js` | Já decodifica o token e injeta `req.user` com `id` — base já existe |
| Todas as queries de dados (rendimentos, operações, ativos) | Adicionar filtro `WHERE "idUser" = $1` usando `req.user.id` |
| Rotas de usuários (`/users`, `/usuario/cadastrar`, etc.) | Adicionar middleware `verificaAdmin` que checa `req.user.perfil === 'admin'` |
| Tabela `usuarios` | Adicionar coluna `perfil VARCHAR DEFAULT 'user'` para distinguir admin/user |

#### Front-end

| Onde mudar | O que fazer |
|---|---|
| Menu lateral / sidebar | Ocultar item "Usuários" quando o perfil não for admin |
| Página de usuários | Redirecionar para home se não for admin |
| `localStorage` / contexto | Armazenar `perfil` do usuário após o login para uso nas guards de rota |

#### Banco de dados

```sql
-- Adicionar coluna de perfil na tabela de usuários
ALTER TABLE usuarios
ADD COLUMN perfil VARCHAR(20) NOT NULL DEFAULT 'user';

-- Definir o primeiro usuário como admin
UPDATE usuarios SET perfil = 'admin' WHERE id = 1;

-- Adicionar idUser nas tabelas de dados (se ainda não existir)
-- (verificar se ativos, rendimentos e operações já têm idUser)
```

---

## 2. Rotas sem Autenticação — Bugs de Segurança

Rotas que **deveriam ter `verificaToken`** mas estão abertas:

| Rota | Problema | Ação |
|---|---|---|
| `DELETE /rendimentos/:id` | Qualquer um pode deletar rendimentos sem login | Adicionar `verificaToken` na rota |
| `POST /cardsRendimentos` | Dados de KPIs expostos sem autenticação | Adicionar `verificaToken` na rota |

**Ação imediata** — ajustar `rendimentos.routes.js`:

```js
router.delete('/rendimentos/:id', verificaToken, deleteRendimentoController);
router.post('/cardsRendimentos', verificaToken, getCardsRendimentos);
```

---

## 3. Migração para 3 Camadas — Débitos Técnicos

### Status por módulo

| Módulo | Controller | Service | Repository | Status |
|---|---|---|---|---|
| Login | ✅ | ✅ | ✅ | Completo |
| Home/Dashboard | ✅ | ✅ | ✅ | Completo |
| Usuários | ✅ (parcial) | ✅ (parcial) | ✅ | Parcialmente migrado |
| Meus FIIs | ✅ | ✅ | ✅ | Completo |
| Rendimentos | ✅ | ✅ | ✅ | Completo |
| Operações KPIs | ✅ | ✅ | ✅ | Completo |
| **Seguimentos** | ❌ acesso direto | ❌ não existe | ❌ não existe | **Não migrado** |
| **Operações (CRUD)** | ❌ acesso direto | ❌ não existe | ❌ não existe | **Não migrado** |

---

### 3.1 Seguimentos — Não migrado

**Situação:** `seguimentos.controller.js` acessa o banco com `openDb()` direto em todas as funções.
Não existe `seguimentos.services.js` nem `seguimentos.repositories.js`.

**Funções a migrar:**

| Função atual (controller) | Mover para service | Mover para repository |
|---|---|---|
| Validação de campo vazio | `seguimentos.services.js` | — |
| Check de duplicata (`nomeSeguimento`) | `seguimentos.services.js` | `seguimentos.repositories.js` |
| `listarSeguimentos` | `listarSeguimentos()` | `findSeguimentos()` |
| `contarSeguimentos` | `contarSeguimentos()` | `countSeguimentos()` |
| `cadastrarSeguimento` | `cadastrarSeguimento()` | `insertSeguimento()` |
| `deleteSeguimento` | `excluirSeguimento()` | `deleteSeguimento()` |
| `updateSeguimento` | `atualizarSeguimento()` | `updateSeguimento()` |

---

### 3.2 Operações (CRUD) — Não migrado

**Situação:** `operacoes.controller.js` tem todas as funções acessando o banco diretamente.
O `operacoes.repositories.js` criado recentemente tem apenas `findKpisOperacoes`.
O `operacoes.services.js` criado recentemente tem apenas `carregarKpisOperacoes`.

**Funções a migrar:**

| Função atual (controller) | Mover para service | Mover para repository |
|---|---|---|
| `carregaAtivosDropList` | `carregarAtivosDropdown()` | `findAtivosDropdown()` |
| `listarOperacoes` | `listarOperacoes()` | `findOperacoes()` |
| `lancarOperacao` | `lancarOperacao()` — com validação de ativo existente | `insertOperacao()` |
| `carregaDadosGraficoOperacoes` | `carregarGraficoOperacoes()` | `findGraficoOperacoes()` |
| `excluirOperacao` | `excluirOperacao()` | `deleteOperacao()` |

---

### 3.3 Usuários — Parcialmente migrado

**Funções já migradas:** `listarUsuarios`, `contarUsuarios`, `cadastrarUser`, `onOffUserController`

**Funções ainda com acesso direto (e fora das rotas):**

| Função | Situação | Ação |
|---|---|---|
| `atualizarUser` | Acessa banco direto, comentário "NÃO MIGRADO" | Migrar para service/repository e expor na rota |
| `deleteUser` | Acessa banco direto com transação manual | Migrar para repository com transação |

---

### 3.4 Resquícios a limpar

| Arquivo | Problema |
|---|---|
| `meusFundos.controller.js` | `import { openDb }` presente mas não usado — pode remover |

---

## 4. Funcionalidades Incompletas no Front-end

| Módulo | Funcionalidade | Status | Observação |
|---|---|---|---|
| Seguimentos | Editar seguimento | ⚠️ Em desenvolvimento | `handleEdit` e `handleUpdateSeguimento` no hook retornam apenas um toast informativo — a lógica está comentada |
| Usuários | Editar usuário | ⚠️ Em desenvolvimento | `handleUpdateUser` e `handleEdit` no hook retornam apenas toast informativo |
| Usuários | Resetar senha | ⚠️ Em desenvolvimento | `handleOpenModal(user, 'reset')` apenas mostra toast "será implementado em breve" |

---

## 5. Padrão de Service nos Hooks — Inconsistências

Dois arquivos no front chamam a API diretamente em vez de usar um service dedicado:

| Arquivo | Problema |
|---|---|
| `pages/login/login.jsx` | Chama `api.post('/auth/login')` direto, sem `authService` |
| `hooks/home/useHomeCards.jsx` | Chama `api.get('/home/cards')` direto, sem `homeService` |

**Ideal:** criar `authService.jsx` e `homeService.jsx` para centralizar as chamadas, seguindo o padrão dos demais módulos.

---

## 6. Backlog Geral — Funcionalidades Pendentes

### Alta Prioridade

- [ ] **Filtro por usuário em todas as queries** — implementar conceito multi-usuário
  (rendimentos, operações e ativos filtrados pelo `idUser` do token)
- [ ] **Middleware `verificaAdmin`** — criar e aplicar nas rotas de gestão de usuários
- [ ] **Coluna `perfil` na tabela `usuarios`** — `ALTER TABLE`
- [ ] **Corrigir rotas sem `verificaToken`** — `DELETE /rendimentos/:id` e `POST /cardsRendimentos`
- [ ] **Lançar rendimento** — rota `POST /rendimentos/lancar` citada no README mas não existe

### Média Prioridade

- [ ] **Migrar Seguimentos para 3 camadas** (controller + service + repository)
- [ ] **Migrar Operações CRUD para 3 camadas** (operacoes.services + operacoes.repositories)
- [ ] **Implementar edição de seguimento** (front + back)
- [ ] **Implementar edição de usuário** (front — lógica já existe no back)
- [ ] **Implementar reset de senha** (front + back)
- [ ] **Implementar `atualizarUser` e `deleteUser` migrados** e expor nas rotas
- [ ] **Coluna `reinvestido` na tabela `operacoes`** — `ALTER TABLE operacoes ADD COLUMN reinvestido BOOLEAN NOT NULL DEFAULT false`

### Baixa Prioridade / Melhorias

- [ ] **Criar `authService.jsx`** no front para encapsular chamada de login
- [ ] **Criar `homeService.jsx`** no front para encapsular chamada do dashboard
- [ ] **Remover `import { openDb }`** desnecessário do `meusFundos.controller.js`
- [ ] **Paginação nas rotas de listagem** (`/users`, `/operacoes`, `/rendimentos`)
- [ ] **Upload de extrato em lote** (multer + S3 já configurados no back)
- [ ] **Rota de refresh de token JWT**
- [ ] **Endpoint de relatório consolidado por período**
- [ ] **Posição consolidada da carteira** (preço médio, quantidade, valor atual)
- [ ] **Integração com API externa** para cotação em tempo real dos FIIs
- [ ] **Testes automatizados** (unitários e integração)
- [ ] **Dockerização**
- [ ] **Documentação Swagger / OpenAPI**

---

## 7. Banco de Dados — Alterações Pendentes

```sql
-- 1. Perfil do usuário (para controle admin/user)
ALTER TABLE usuarios
ADD COLUMN perfil VARCHAR(20) NOT NULL DEFAULT 'user';

-- Definir admins manualmente
UPDATE usuarios SET perfil = 'admin' WHERE id = <id_do_admin>;

-- 2. Flag de reinvestimento nas operações (para KPIs de rendimentos)
ALTER TABLE operacoes
ADD COLUMN reinvestido BOOLEAN NOT NULL DEFAULT false;

-- 3. Verificar se ativos, rendimentos e operações têm idUser
-- (necessário para o conceito multi-usuário)
-- Se não tiverem:
-- ALTER TABLE rendimentos ADD COLUMN "idUser" INTEGER REFERENCES usuarios(id);
-- ALTER TABLE operacoes   ADD COLUMN "idUser" INTEGER REFERENCES usuarios(id);
-- ALTER TABLE ativos      ADD COLUMN "idUser" INTEGER REFERENCES usuarios(id);
```

---

## 8. Resumo Visual — O que está pronto e o que falta

```
BACK-END
├── ✅ Login (auth)
├── ✅ Home/Dashboard
├── ✅ Usuários (parcial — falta editar e deletar migrados)
├── ✅ Meus FIIs
├── ✅ Rendimentos (completo + KPIs)
├── ✅ Operações KPIs (GET /kpis-operacoes)
├── ❌ Seguimentos — acesso direto, sem service/repository
├── ❌ Operações CRUD — acesso direto, sem service/repository
├── ❌ Filtro por idUser nas queries (multi-usuário)
└── ❌ Middleware verificaAdmin

FRONT-END
├── ✅ Login
├── ✅ Dashboard
├── ✅ Usuários (parcial — editar/resetar não implementados)
├── ✅ Meus FIIs
├── ✅ Seguimentos (parcial — editar não implementado)
├── ✅ Operações
├── ✅ Rendimentos (com 4 KPIs)
├── ⚠️ login.jsx chama API direto (sem authService)
└── ⚠️ useHomeCards.jsx chama API direto (sem homeService)
```
